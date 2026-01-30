/**
 * GOFAI NL HCI — Typing UX Specification
 *
 * Defines the user experience specification for the NL input field:
 * parse status indicator, suggestions dropdown, and clarification timing.
 *
 * ## Design Principles
 *
 * 1. **Continuous feedback**: The user always knows the parse status.
 * 2. **Non-intrusive**: Never interrupt typing flow; show suggestions passively.
 * 3. **Progressive disclosure**: Show more detail as confidence increases.
 * 4. **Graceful degradation**: Partial parses show partial suggestions.
 *
 * ## Typing Flow
 *
 * ```
 * User types → Debounce (50ms) → Tokenize → Parse → Score → Display
 *                                    ↓          ↓       ↓
 *                               token count   forest  suggestions
 *                                    ↓          ↓       ↓
 *                              status badge  tree viz  dropdown
 * ```
 *
 * @module gofai/nl/hci/typing-ux-spec
 * @see gofai_goalA.md Step 146
 */

// =============================================================================
// PARSE STATUS — visual indicator for current parse state
// =============================================================================

/**
 * The parse status shown to the user during typing.
 */
export type ParseStatus =
  | 'idle'            // No input
  | 'typing'          // User is actively typing (debounce pending)
  | 'parsing'         // Parse in progress
  | 'valid'           // Unambiguous valid parse
  | 'ambiguous'       // Valid parse but ambiguous — needs clarification
  | 'partial'         // Partial parse (incomplete input)
  | 'error'           // Parse failed (unknown tokens, syntax error)
  | 'warning';        // Parse succeeded but with warnings

/**
 * Visual properties for each parse status.
 */
export interface ParseStatusVisual {
  readonly status: ParseStatus;
  readonly icon: StatusIcon;
  readonly color: StatusColor;
  readonly label: string;
  readonly description: string;
  readonly ariaLabel: string;
  readonly pulsing: boolean;       // Animated pulse for active states
  readonly tooltip: string;
}

export type StatusIcon =
  | 'empty'           // No icon
  | 'typing_dots'     // ... animation
  | 'spinner'         // Spinning indicator
  | 'checkmark'       // ✓
  | 'warning_triangle'// ⚠
  | 'error_circle'    // ✕
  | 'question_mark'   // ?
  | 'partial_check';  // ✓ with dots

export type StatusColor =
  | 'neutral'         // Gray
  | 'primary'         // Blue
  | 'success'         // Green
  | 'warning'         // Yellow/Orange
  | 'error'           // Red
  | 'info';           // Light blue

/**
 * Parse status visual map.
 */
export const PARSE_STATUS_VISUALS: ReadonlyMap<ParseStatus, ParseStatusVisual> = new Map([
  ['idle', {
    status: 'idle',
    icon: 'empty',
    color: 'neutral',
    label: '',
    description: 'Waiting for input.',
    ariaLabel: 'Input field is empty.',
    pulsing: false,
    tooltip: 'Type a music editing command.',
  }],
  ['typing', {
    status: 'typing',
    icon: 'typing_dots',
    color: 'neutral',
    label: '',
    description: 'User is typing.',
    ariaLabel: 'Processing input.',
    pulsing: true,
    tooltip: 'Analyzing your input...',
  }],
  ['parsing', {
    status: 'parsing',
    icon: 'spinner',
    color: 'primary',
    label: '',
    description: 'Parse in progress.',
    ariaLabel: 'Analyzing command.',
    pulsing: true,
    tooltip: 'Parsing...',
  }],
  ['valid', {
    status: 'valid',
    icon: 'checkmark',
    color: 'success',
    label: 'Ready',
    description: 'Command understood.',
    ariaLabel: 'Command is valid and ready to execute.',
    pulsing: false,
    tooltip: 'Press Enter to execute.',
  }],
  ['ambiguous', {
    status: 'ambiguous',
    icon: 'question_mark',
    color: 'warning',
    label: 'Clarify',
    description: 'Command is ambiguous.',
    ariaLabel: 'Command has multiple interpretations. Please clarify.',
    pulsing: false,
    tooltip: 'Multiple interpretations found. See suggestions below.',
  }],
  ['partial', {
    status: 'partial',
    icon: 'partial_check',
    color: 'info',
    label: 'Partial',
    description: 'Partial parse — keep typing.',
    ariaLabel: 'Partial command recognized. Continue typing.',
    pulsing: false,
    tooltip: 'Recognized so far. Keep typing to complete.',
  }],
  ['error', {
    status: 'error',
    icon: 'error_circle',
    color: 'error',
    label: 'Error',
    description: 'Command not understood.',
    ariaLabel: 'Could not understand the command. See suggestions.',
    pulsing: false,
    tooltip: 'Could not parse this input. Try rephrasing.',
  }],
  ['warning', {
    status: 'warning',
    icon: 'warning_triangle',
    color: 'warning',
    label: 'Warning',
    description: 'Command understood with warnings.',
    ariaLabel: 'Command recognized but may have issues.',
    pulsing: false,
    tooltip: 'Understood, but please review the warnings.',
  }],
]);

// =============================================================================
// SUGGESTIONS DROPDOWN — auto-complete and disambiguation
// =============================================================================

/**
 * A suggestion shown in the dropdown during typing.
 */
export interface TypeaheadSuggestion {
  readonly id: string;
  readonly type: SuggestionType;
  readonly text: string;
  readonly description: string;
  readonly icon: SuggestionIcon;
  readonly confidence: number;         // 0–1
  readonly source: SuggestionSource;
  readonly insertText: string;         // What to insert if selected
  readonly cursorOffset: number;       // Where to place cursor after insert
  readonly category: string;           // Grouping category
  readonly keyboardShortcut: string | null; // e.g., "Tab" or "Enter"
}

export type SuggestionType =
  | 'completion'       // Complete the current word/phrase
  | 'correction'       // Fix a typo or unknown word
  | 'command'          // Suggest a full command
  | 'parameter'        // Suggest a parameter value
  | 'entity'           // Suggest a track/entity name
  | 'clarification';   // Disambiguate an ambiguous term

export type SuggestionIcon =
  | 'command'          // Terminal prompt icon
  | 'parameter'        // Slider icon
  | 'entity'           // Track icon
  | 'correction'       // Pencil icon
  | 'clarification'    // Question icon
  | 'history';         // Clock icon

export type SuggestionSource =
  | 'grammar'          // From grammar rules
  | 'vocabulary'       // From vocabulary database
  | 'history'          // From command history
  | 'context'          // From current project context
  | 'fuzzy_match';     // From fuzzy string matching

/**
 * Dropdown display configuration.
 */
export interface SuggestionDropdownConfig {
  /** Maximum number of suggestions to show. Default: 6. */
  readonly maxSuggestions: number;
  /** Minimum characters before showing suggestions. Default: 2. */
  readonly minCharsForSuggestions: number;
  /** Debounce delay in ms before fetching suggestions. Default: 50. */
  readonly debounceMs: number;
  /** Show category headers in dropdown. Default: true. */
  readonly showCategories: boolean;
  /** Show confidence scores to user. Default: false. */
  readonly showConfidenceScores: boolean;
  /** Show keyboard shortcuts. Default: true. */
  readonly showKeyboardShortcuts: boolean;
  /** Highlight matching characters. Default: true. */
  readonly highlightMatches: boolean;
  /** Position relative to input. Default: 'below'. */
  readonly position: 'above' | 'below';
  /** Animate entry/exit. Default: true. */
  readonly animate: boolean;
  /** Maximum dropdown height in pixels. Default: 300. */
  readonly maxHeight: number;
}

/**
 * Default dropdown configuration.
 */
export const DEFAULT_SUGGESTION_CONFIG: SuggestionDropdownConfig = {
  maxSuggestions: 6,
  minCharsForSuggestions: 2,
  debounceMs: 50,
  showCategories: true,
  showConfidenceScores: false,
  showKeyboardShortcuts: true,
  highlightMatches: true,
  position: 'below',
  animate: true,
  maxHeight: 300,
};

// =============================================================================
// CLARIFICATION TIMING — when and how to interrupt
// =============================================================================

/**
 * When to show clarification questions during typing.
 */
export type ClarificationTiming =
  | 'on_submit'        // Only when user presses Enter
  | 'on_pause'         // After typing pause (500ms+)
  | 'on_ambiguity'     // Immediately when ambiguity is detected
  | 'on_hover'         // When user hovers over ambiguous span
  | 'never';           // Defer all clarification to execution

/**
 * Clarification display mode.
 */
export type ClarificationMode =
  | 'inline'           // Show below the input field
  | 'tooltip'          // Show as tooltip on ambiguous span
  | 'sidebar'          // Show in a separate panel
  | 'modal';           // Show as modal dialog (use sparingly!)

/**
 * Full clarification UX configuration.
 */
export interface ClarificationUXConfig {
  /** When to trigger clarification. Default: 'on_pause'. */
  readonly timing: ClarificationTiming;
  /** How to display clarification. Default: 'inline'. */
  readonly mode: ClarificationMode;
  /** Minimum confidence to suppress clarification. Default: 0.8. */
  readonly suppressionThreshold: number;
  /** Typing pause duration before showing. Default: 500. */
  readonly pauseDurationMs: number;
  /** Maximum simultaneous clarification questions. Default: 1. */
  readonly maxSimultaneousQuestions: number;
  /** Allow dismissing with Escape. Default: true. */
  readonly dismissable: boolean;
  /** Show "why this matters" text. Default: true. */
  readonly showWhyItMatters: boolean;
  /** Show default option prominently. Default: true. */
  readonly highlightDefault: boolean;
  /** Auto-accept default after timeout. Default: false. */
  readonly autoAcceptDefault: boolean;
  /** Auto-accept timeout in ms. Default: 5000. */
  readonly autoAcceptTimeoutMs: number;
}

/**
 * Default clarification UX configuration.
 */
export const DEFAULT_CLARIFICATION_CONFIG: ClarificationUXConfig = {
  timing: 'on_pause',
  mode: 'inline',
  suppressionThreshold: 0.8,
  pauseDurationMs: 500,
  maxSimultaneousQuestions: 1,
  dismissable: true,
  showWhyItMatters: true,
  highlightDefault: true,
  autoAcceptDefault: false,
  autoAcceptTimeoutMs: 5000,
};

// =============================================================================
// INPUT FIELD STATE MACHINE
// =============================================================================

/**
 * State machine for the NL input field.
 *
 * ```
 *  ┌─────────┐     keystroke     ┌─────────┐    debounce    ┌─────────┐
 *  │  idle    │ ───────────────→  │ typing  │ ────────────→  │ parsing │
 *  └─────────┘                    └─────────┘                └─────────┘
 *       ↑                              ↑                     ↙ ↓ ↓ ↘
 *       │ clear                  keystroke              valid  partial
 *       │                              │              ambiguous error
 *       └──────────────────────────────┘              warning
 * ```
 */
export type InputFieldState =
  | 'idle'
  | 'typing'
  | 'parsing'
  | 'showing_result'
  | 'showing_clarification'
  | 'showing_error'
  | 'executing';

/**
 * Transitions in the input field state machine.
 */
export interface InputFieldTransition {
  readonly from: InputFieldState;
  readonly event: InputFieldEvent;
  readonly to: InputFieldState;
  readonly sideEffects: readonly SideEffect[];
}

export type InputFieldEvent =
  | 'keystroke'
  | 'debounce_timeout'
  | 'parse_complete'
  | 'parse_error'
  | 'ambiguity_detected'
  | 'clarification_answered'
  | 'submit'
  | 'clear'
  | 'escape'
  | 'focus'
  | 'blur';

export type SideEffect =
  | 'start_debounce_timer'
  | 'cancel_debounce_timer'
  | 'trigger_parse'
  | 'show_suggestions'
  | 'hide_suggestions'
  | 'show_clarification'
  | 'hide_clarification'
  | 'update_status_badge'
  | 'execute_command'
  | 'clear_input'
  | 'reset_state';

/**
 * The input field state machine transitions.
 */
export const INPUT_FIELD_TRANSITIONS: readonly InputFieldTransition[] = [
  // idle
  { from: 'idle', event: 'keystroke', to: 'typing', sideEffects: ['start_debounce_timer'] },
  { from: 'idle', event: 'focus', to: 'idle', sideEffects: ['update_status_badge'] },

  // typing
  { from: 'typing', event: 'keystroke', to: 'typing', sideEffects: ['cancel_debounce_timer', 'start_debounce_timer'] },
  { from: 'typing', event: 'debounce_timeout', to: 'parsing', sideEffects: ['trigger_parse'] },
  { from: 'typing', event: 'submit', to: 'parsing', sideEffects: ['cancel_debounce_timer', 'trigger_parse'] },
  { from: 'typing', event: 'clear', to: 'idle', sideEffects: ['cancel_debounce_timer', 'clear_input', 'reset_state'] },
  { from: 'typing', event: 'escape', to: 'idle', sideEffects: ['cancel_debounce_timer', 'hide_suggestions'] },

  // parsing
  { from: 'parsing', event: 'parse_complete', to: 'showing_result', sideEffects: ['update_status_badge', 'show_suggestions'] },
  { from: 'parsing', event: 'parse_error', to: 'showing_error', sideEffects: ['update_status_badge', 'show_suggestions'] },
  { from: 'parsing', event: 'ambiguity_detected', to: 'showing_clarification', sideEffects: ['update_status_badge', 'show_clarification'] },
  { from: 'parsing', event: 'keystroke', to: 'typing', sideEffects: ['start_debounce_timer'] },

  // showing_result
  { from: 'showing_result', event: 'submit', to: 'executing', sideEffects: ['execute_command'] },
  { from: 'showing_result', event: 'keystroke', to: 'typing', sideEffects: ['hide_suggestions', 'start_debounce_timer'] },
  { from: 'showing_result', event: 'clear', to: 'idle', sideEffects: ['hide_suggestions', 'clear_input', 'reset_state'] },
  { from: 'showing_result', event: 'escape', to: 'idle', sideEffects: ['hide_suggestions'] },

  // showing_clarification
  { from: 'showing_clarification', event: 'clarification_answered', to: 'showing_result', sideEffects: ['hide_clarification', 'update_status_badge'] },
  { from: 'showing_clarification', event: 'keystroke', to: 'typing', sideEffects: ['hide_clarification', 'start_debounce_timer'] },
  { from: 'showing_clarification', event: 'escape', to: 'showing_result', sideEffects: ['hide_clarification'] },
  { from: 'showing_clarification', event: 'submit', to: 'executing', sideEffects: ['hide_clarification', 'execute_command'] },

  // showing_error
  { from: 'showing_error', event: 'keystroke', to: 'typing', sideEffects: ['start_debounce_timer'] },
  { from: 'showing_error', event: 'clear', to: 'idle', sideEffects: ['hide_suggestions', 'clear_input', 'reset_state'] },
  { from: 'showing_error', event: 'escape', to: 'idle', sideEffects: ['hide_suggestions'] },

  // executing
  { from: 'executing', event: 'keystroke', to: 'typing', sideEffects: ['start_debounce_timer'] },
  { from: 'executing', event: 'clear', to: 'idle', sideEffects: ['clear_input', 'reset_state'] },
];

// =============================================================================
// KEYBOARD SHORTCUTS
// =============================================================================

/**
 * Keyboard shortcut bindings for the NL input.
 */
export interface InputKeyBinding {
  readonly key: string;
  readonly modifiers: readonly KeyModifier[];
  readonly action: KeyAction;
  readonly description: string;
  readonly when: InputFieldState | 'any';
}

export type KeyModifier = 'ctrl' | 'shift' | 'alt' | 'meta';

export type KeyAction =
  | 'submit'
  | 'clear'
  | 'escape'
  | 'accept_suggestion'
  | 'next_suggestion'
  | 'prev_suggestion'
  | 'accept_clarification_default'
  | 'dismiss_clarification'
  | 'show_parse_tree'
  | 'toggle_developer_mode';

/**
 * Default keyboard bindings.
 */
export const DEFAULT_KEY_BINDINGS: readonly InputKeyBinding[] = [
  { key: 'Enter', modifiers: [], action: 'submit', description: 'Execute command.', when: 'any' },
  { key: 'Escape', modifiers: [], action: 'escape', description: 'Clear input / dismiss.', when: 'any' },
  { key: 'Tab', modifiers: [], action: 'accept_suggestion', description: 'Accept top suggestion.', when: 'showing_result' },
  { key: 'ArrowDown', modifiers: [], action: 'next_suggestion', description: 'Next suggestion.', when: 'showing_result' },
  { key: 'ArrowUp', modifiers: [], action: 'prev_suggestion', description: 'Previous suggestion.', when: 'showing_result' },
  { key: 'Enter', modifiers: ['shift'], action: 'accept_clarification_default', description: 'Accept default clarification.', when: 'showing_clarification' },
  { key: 'Escape', modifiers: [], action: 'dismiss_clarification', description: 'Dismiss clarification.', when: 'showing_clarification' },
  { key: 'p', modifiers: ['ctrl', 'shift'], action: 'show_parse_tree', description: 'Show parse tree (dev).', when: 'any' },
  { key: 'd', modifiers: ['ctrl', 'shift'], action: 'toggle_developer_mode', description: 'Toggle developer mode.', when: 'any' },
];

// =============================================================================
// ACCESSIBILITY
// =============================================================================

/**
 * Accessibility requirements for the NL input.
 */
export interface AccessibilitySpec {
  /** ARIA role for the input. */
  readonly role: string;
  /** ARIA live region for parse status updates. */
  readonly liveRegion: 'polite' | 'assertive';
  /** Announce status changes to screen readers. */
  readonly announceStatusChanges: boolean;
  /** Announce suggestion count. */
  readonly announceSuggestionCount: boolean;
  /** Minimum contrast ratio for status colors. */
  readonly minContrastRatio: number;
  /** Support reduced motion preference. */
  readonly respectsReducedMotion: boolean;
  /** Focus management strategy. */
  readonly focusManagement: 'trap' | 'roving' | 'none';
}

/**
 * Default accessibility spec.
 */
export const DEFAULT_ACCESSIBILITY_SPEC: AccessibilitySpec = {
  role: 'combobox',
  liveRegion: 'polite',
  announceStatusChanges: true,
  announceSuggestionCount: true,
  minContrastRatio: 4.5,
  respectsReducedMotion: true,
  focusManagement: 'roving',
};

// =============================================================================
// FULL TYPING UX SPEC
// =============================================================================

/**
 * Complete typing UX specification.
 */
export interface TypingUXSpec {
  readonly statusVisuals: ReadonlyMap<ParseStatus, ParseStatusVisual>;
  readonly suggestionConfig: SuggestionDropdownConfig;
  readonly clarificationConfig: ClarificationUXConfig;
  readonly transitions: readonly InputFieldTransition[];
  readonly keyBindings: readonly InputKeyBinding[];
  readonly accessibility: AccessibilitySpec;
  readonly version: string;
}

/**
 * The default typing UX spec.
 */
export const DEFAULT_TYPING_UX_SPEC: TypingUXSpec = {
  statusVisuals: PARSE_STATUS_VISUALS,
  suggestionConfig: DEFAULT_SUGGESTION_CONFIG,
  clarificationConfig: DEFAULT_CLARIFICATION_CONFIG,
  transitions: INPUT_FIELD_TRANSITIONS,
  keyBindings: DEFAULT_KEY_BINDINGS,
  accessibility: DEFAULT_ACCESSIBILITY_SPEC,
  version: '1.0.0',
};

// =============================================================================
// STATISTICS
// =============================================================================

export function getTypingUXSpecStats(): {
  readonly statusCount: number;
  readonly transitionCount: number;
  readonly keyBindingCount: number;
  readonly suggestionTypeCount: number;
} {
  return {
    statusCount: PARSE_STATUS_VISUALS.size,
    transitionCount: INPUT_FIELD_TRANSITIONS.length,
    keyBindingCount: DEFAULT_KEY_BINDINGS.length,
    suggestionTypeCount: 6, // SuggestionType variants
  };
}
