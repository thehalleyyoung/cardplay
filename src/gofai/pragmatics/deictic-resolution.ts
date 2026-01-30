/**
 * Deictic Resolution — UI Selection Participation in Pragmatics
 *
 * Step 036 [Prag]: Specify how UI selection participates in pragmatics
 * (deictic "this", "here", "these notes"), including fallbacks when
 * selection is empty.
 *
 * ## What is Deixis?
 *
 * Deixis is language that points to context-dependent referents:
 * - "this" / "these" → current selection
 * - "here" → current view/position
 * - "that" / "those" → previous or distant referent
 * - "now" → current playback position or editing context
 *
 * In GOFAI Music+, deictic expressions bind to UI state:
 * - The currently selected notes/events
 * - The currently focused section/layer/track
 * - The current playback position
 * - The current view window (visible bars/tracks)
 *
 * ## Design Principles
 *
 * 1. **Selection is the primary deictic anchor**: "this" and "these"
 *    ALWAYS try to bind to the current UI selection first.
 *
 * 2. **Empty selection triggers clarification**: If the user says "this"
 *    but nothing is selected, the system MUST ask what they mean — it
 *    must NOT silently fall back to a guess.
 *
 * 3. **Fallback hierarchy is explicit**: When selection is empty, the
 *    system may offer fallback candidates but must present them as
 *    options, not silent defaults.
 *
 * 4. **Staleness matters**: If the selection hasn't changed in a long
 *    time (many dialogue turns ago), it may be stale. The system should
 *    confirm before binding to a stale selection.
 *
 * 5. **Deictic resolution is logged**: Every deictic binding is recorded
 *    in provenance so the user can see "I interpreted 'this' as
 *    'the selected notes in bars 17-20'".
 *
 * @module gofai/pragmatics/deictic-resolution
 */

// =============================================================================
// UI Selection State
// =============================================================================

/**
 * The current state of the UI selection, as seen by the pragmatics layer.
 *
 * This is a projection of the board/deck selection state into the
 * pragmatics domain. It does NOT duplicate UI state — it reads from
 * the BoardContextStore (SSOT for selection).
 */
export interface UISelectionState {
  /** Whether anything is currently selected. */
  readonly hasSelection: boolean;

  /** The kind of selection (if any). */
  readonly selectionKind: SelectionKind | undefined;

  /** Human-readable description of the selection. */
  readonly description: string;

  /** The entity IDs selected (event IDs, note IDs, etc.). */
  readonly entityIds: readonly string[];

  /** The scope of the selection (section, layer, range). */
  readonly scope: SelectionScope | undefined;

  /** When the selection was last changed (dialogue turn number). */
  readonly lastChangedAtTurn: number;

  /** The current dialogue turn number (for staleness detection). */
  readonly currentTurn: number;
}

/**
 * What kind of thing is selected.
 */
export type SelectionKind =
  | 'notes'          // Individual MIDI notes selected
  | 'events'         // Events of any type selected
  | 'time_range'     // A bar/beat range selected on the timeline
  | 'section'        // A section marker/region selected
  | 'layer'          // An entire layer/track selected
  | 'card'           // A card in the card graph selected
  | 'mixed';         // Multiple kinds (e.g., notes across tracks)

/**
 * The scope implied by the current selection.
 */
export interface SelectionScope {
  /** Section(s) the selection falls within. */
  readonly sections: readonly string[];
  /** Layer(s) the selection falls within. */
  readonly layers: readonly string[];
  /** Time range of the selection (in ticks). */
  readonly tickRange: { readonly start: number; readonly end: number } | undefined;
  /** Bar range (human-readable). */
  readonly barRange: { readonly startBar: number; readonly endBar: number } | undefined;
}


// =============================================================================
// Deictic Expression Types
// =============================================================================

/**
 * The types of deictic expressions the parser can produce.
 */
export type DeicticExpression =
  | { readonly type: 'proximal'; readonly word: string }    // "this", "these", "here"
  | { readonly type: 'distal'; readonly word: string }      // "that", "those", "there"
  | { readonly type: 'temporal'; readonly word: string }    // "now", "right now"
  | { readonly type: 'locative'; readonly word: string };   // "here", "over here"

/**
 * Classify a deictic word.
 */
export function classifyDeictic(word: string): DeicticExpression | undefined {
  const lower = word.toLowerCase().trim();

  // Proximal demonstratives — point to current selection/focus
  const proximalWords = ['this', 'these', 'here'];
  if (proximalWords.includes(lower)) {
    return { type: 'proximal', word: lower };
  }

  // Distal demonstratives — point to previous/other referent
  const distalWords = ['that', 'those', 'there'];
  if (distalWords.includes(lower)) {
    return { type: 'distal', word: lower };
  }

  // Temporal deictics — point to current moment
  const temporalWords = ['now'];
  if (temporalWords.includes(lower)) {
    return { type: 'temporal', word: lower };
  }

  return undefined;
}


// =============================================================================
// Resolution Outcomes
// =============================================================================

/**
 * The result of attempting to resolve a deictic expression.
 */
export type DeicticResolutionResult =
  | DeicticResolved
  | DeicticNeedsConfirmation
  | DeicticFailed;

/**
 * Successfully resolved: the deictic binds to a clear referent.
 */
export interface DeicticResolved {
  readonly status: 'resolved';
  /** What the deictic resolved to. */
  readonly binding: DeicticBinding;
  /** Human-readable explanation. */
  readonly explanation: string;
  /** Confidence reason (why this binding was chosen). */
  readonly reason: DeicticResolutionReason;
}

/**
 * Needs confirmation: the deictic has candidates but requires user input.
 */
export interface DeicticNeedsConfirmation {
  readonly status: 'needs_confirmation';
  /** Candidate bindings to present to the user. */
  readonly candidates: readonly DeicticBinding[];
  /** Why confirmation is needed. */
  readonly reason: string;
  /** A default candidate (if one exists). */
  readonly suggestedDefault: DeicticBinding | undefined;
}

/**
 * Failed: the deictic cannot be resolved at all.
 */
export interface DeicticFailed {
  readonly status: 'failed';
  /** Why resolution failed. */
  readonly reason: string;
  /** Suggested action (e.g., "Select something first"). */
  readonly suggestion: string;
}

/**
 * What a deictic expression resolved to.
 */
export interface DeicticBinding {
  /** The kind of referent. */
  readonly kind: SelectionKind | 'playback_position' | 'view_window' | 'last_focus';
  /** Human-readable label. */
  readonly label: string;
  /** Entity IDs (if applicable). */
  readonly entityIds: readonly string[];
  /** Scope (if applicable). */
  readonly scope: SelectionScope | undefined;
}

/**
 * Why a particular binding was chosen.
 */
export type DeicticResolutionReason =
  | 'current_selection'        // Bound to active UI selection
  | 'current_focus'            // Bound to focused track/section
  | 'playback_position'        // Bound to current playback cursor
  | 'view_window'              // Bound to what's visible
  | 'last_selection'           // Bound to most recent past selection
  | 'last_mentioned'           // Bound to most recently discussed entity
  | 'salience_ranking';        // Bound by general salience score


// =============================================================================
// Resolution Logic
// =============================================================================

/**
 * Staleness threshold: if selection is older than this many turns,
 * it is considered "stale" and requires confirmation.
 */
export const SELECTION_STALENESS_THRESHOLD = 3;

/**
 * Resolve a proximal deictic ("this", "these", "here").
 *
 * Resolution order:
 * 1. Current UI selection (if non-empty and not stale)
 * 2. Stale selection → needs confirmation
 * 3. No selection → needs confirmation with fallback candidates
 */
export function resolveProximalDeictic(
  _expression: DeicticExpression,
  selectionState: UISelectionState,
  fallbackCandidates: readonly DeicticBinding[],
): DeicticResolutionResult {
  // Case 1: Active, recent selection exists
  if (selectionState.hasSelection && selectionState.scope !== undefined) {
    const turnsAgo = selectionState.currentTurn - selectionState.lastChangedAtTurn;

    if (turnsAgo <= SELECTION_STALENESS_THRESHOLD) {
      // Fresh selection — resolve directly
      return {
        status: 'resolved',
        binding: {
          kind: selectionState.selectionKind ?? 'events',
          label: selectionState.description,
          entityIds: selectionState.entityIds,
          scope: selectionState.scope,
        },
        explanation: `Resolved to current selection: ${selectionState.description}`,
        reason: 'current_selection',
      };
    }

    // Stale selection — ask for confirmation
    const staleBinding: DeicticBinding = {
      kind: selectionState.selectionKind ?? 'events',
      label: `${selectionState.description} (selected ${turnsAgo} turns ago)`,
      entityIds: selectionState.entityIds,
      scope: selectionState.scope,
    };

    return {
      status: 'needs_confirmation',
      candidates: [staleBinding, ...fallbackCandidates],
      reason: `Selection was made ${turnsAgo} turns ago and may be stale`,
      suggestedDefault: staleBinding,
    };
  }

  // Case 2: No selection at all
  if (fallbackCandidates.length > 0) {
    return {
      status: 'needs_confirmation',
      candidates: fallbackCandidates,
      reason: 'Nothing is currently selected. What do you mean by "this"?',
      suggestedDefault: fallbackCandidates.length === 1 ? fallbackCandidates[0] : undefined,
    };
  }

  // Case 3: No selection and no candidates
  return {
    status: 'failed',
    reason: 'Nothing is selected and no referent candidates are available',
    suggestion: 'Please select something in the editor first, or specify what you mean',
  };
}

/**
 * Resolve a distal deictic ("that", "those", "there").
 *
 * Distal deictics are more complex because they can bind to:
 * 1. The last-mentioned entity in dialogue
 * 2. A visually distant (but visible) element
 * 3. A previously focused element (before the current focus)
 *
 * If multiple candidates exist, clarification is required.
 */
export function resolveDistalDeictic(
  _expression: DeicticExpression,
  lastMentioned: DeicticBinding | undefined,
  lastFocused: DeicticBinding | undefined,
  otherCandidates: readonly DeicticBinding[],
): DeicticResolutionResult {
  const allCandidates: DeicticBinding[] = [];

  if (lastMentioned !== undefined) {
    allCandidates.push(lastMentioned);
  }
  if (lastFocused !== undefined && lastFocused !== lastMentioned) {
    allCandidates.push(lastFocused);
  }
  allCandidates.push(...otherCandidates);

  if (allCandidates.length === 0) {
    return {
      status: 'failed',
      reason: 'No referent available for "that" — nothing was previously mentioned or focused',
      suggestion: 'Please specify what you\'re referring to',
    };
  }

  if (allCandidates.length === 1) {
    const single = allCandidates[0]!;
    return {
      status: 'resolved',
      binding: single,
      explanation: `Resolved "that" to: ${single.label}`,
      reason: lastMentioned !== undefined ? 'last_mentioned' : 'current_focus',
    };
  }

  // Multiple candidates → ask
  return {
    status: 'needs_confirmation',
    candidates: allCandidates,
    reason: `"That" could refer to several things`,
    suggestedDefault: allCandidates[0], // Prefer last-mentioned
  };
}

/**
 * Resolve a temporal deictic ("now").
 *
 * "Now" can mean:
 * 1. The current playback position (if playing)
 * 2. The current focused position (if editing)
 * 3. The current moment in dialogue ("right now" = immediately)
 */
export function resolveTemporalDeictic(
  _expression: DeicticExpression,
  playbackPosition: { readonly tick: number; readonly bar: number } | undefined,
  editingPosition: { readonly tick: number; readonly bar: number } | undefined,
): DeicticResolutionResult {
  // If actively playing, "now" = playback position
  if (playbackPosition !== undefined) {
    return {
      status: 'resolved',
      binding: {
        kind: 'playback_position',
        label: `Playback position (bar ${playbackPosition.bar})`,
        entityIds: [],
        scope: undefined,
      },
      explanation: `"Now" resolved to current playback position: bar ${playbackPosition.bar}`,
      reason: 'playback_position',
    };
  }

  // If editing, "now" = editing cursor position
  if (editingPosition !== undefined) {
    return {
      status: 'resolved',
      binding: {
        kind: 'playback_position',
        label: `Edit position (bar ${editingPosition.bar})`,
        entityIds: [],
        scope: undefined,
      },
      explanation: `"Now" resolved to edit cursor: bar ${editingPosition.bar}`,
      reason: 'current_focus',
    };
  }

  // No position available
  return {
    status: 'failed',
    reason: '"Now" has no temporal anchor — nothing is playing and no edit position is set',
    suggestion: 'Place the cursor or start playback to establish a "now" reference',
  };
}


// =============================================================================
// Deictic Resolution Rules (Declarative)
// =============================================================================

/**
 * The complete set of deictic resolution rules as a declarative spec.
 *
 * These rules are the normative reference for how deictic expressions
 * bind in GOFAI Music+. They are enforced by the resolution functions
 * above and tested in the evaluation suite.
 */
export const DEICTIC_RESOLUTION_RULES = {
  /**
   * Rule D1: "this" / "these" → current UI selection (primary).
   * If selection is empty, clarification is REQUIRED.
   */
  D1_PROXIMAL_BINDS_SELECTION:
    '"this"/"these" bind to the current UI selection. Empty selection triggers clarification.',

  /**
   * Rule D2: Stale selections require confirmation.
   * If the selection hasn't changed in >3 dialogue turns, the system
   * confirms before using it.
   */
  D2_STALE_SELECTION_CONFIRMS:
    'Selections older than 3 turns are considered stale and require confirmation.',

  /**
   * Rule D3: "that" / "those" → last-mentioned entity (primary).
   * Falls back to last-focused entity. If multiple candidates, ask.
   */
  D3_DISTAL_BINDS_LAST_MENTIONED:
    '"that"/"those" bind to the last-mentioned entity. Multiple candidates trigger clarification.',

  /**
   * Rule D4: "here" → current view position or selection scope.
   * In a timeline context, "here" = the visible bar range.
   * In a track context, "here" = the focused track.
   */
  D4_LOCATIVE_BINDS_VIEW:
    '"here" binds to the current view/focus context. Ambiguity between spatial interpretations triggers clarification.',

  /**
   * Rule D5: "now" → playback position (if playing) or edit cursor.
   * If neither is available, resolution fails.
   */
  D5_TEMPORAL_BINDS_PLAYBACK:
    '"now" binds to playback position (if playing) or edit cursor position.',

  /**
   * Rule D6: Deictic resolution is always logged in provenance.
   * The binding explanation appears in the why-chain and CPL viewer.
   */
  D6_LOGGED_IN_PROVENANCE:
    'Every deictic resolution is recorded in the provenance chain with its reason.',

  /**
   * Rule D7: No silent fallback for destructive operations.
   * If a deictic resolves by fallback (not direct selection) AND the
   * operation is destructive (delete, remove, clear), confirmation is
   * ALWAYS required regardless of staleness.
   */
  D7_DESTRUCTIVE_ALWAYS_CONFIRMS:
    'Destructive operations with deictic targets always require explicit confirmation.',

  /**
   * Rule D8: Selection changes during dialogue update bindings.
   * If the user changes their selection between turns, subsequent
   * "this" references bind to the NEW selection.
   */
  D8_SELECTION_UPDATES_BIND:
    'UI selection changes between dialogue turns update deictic bindings immediately.',
} as const;

/**
 * All deictic rule names, for testing.
 */
export type DeicticRuleName = keyof typeof DEICTIC_RESOLUTION_RULES;


// =============================================================================
// UI Copy Templates for Deictic Clarification
// =============================================================================

/**
 * Templates for deictic clarification questions in the UI.
 */
export const DEICTIC_CLARIFICATION_TEMPLATES = {
  /** When "this" has no selection. */
  EMPTY_SELECTION:
    'Nothing is currently selected. What do you mean by "{word}"?',

  /** When "this" has a stale selection. */
  STALE_SELECTION:
    'You selected {description} {turns} turns ago. Is that still what you mean by "{word}"?',

  /** When "that" has multiple candidates. */
  MULTIPLE_DISTAL_CANDIDATES:
    'By "{word}", do you mean {candidate1} or {candidate2}?',

  /** When "here" is ambiguous between view and position. */
  AMBIGUOUS_LOCATIVE:
    'Do you mean "here" as in the current view ({viewDescription}), or at the cursor position ({positionDescription})?',

  /** When "now" has no anchor. */
  NO_TEMPORAL_ANCHOR:
    'I don\'t have a reference point for "now". Could you place the cursor or start playback?',

  /** Fallback for any unresolvable deictic. */
  GENERIC_UNRESOLVABLE:
    'I\'m not sure what "{word}" refers to. Could you be more specific or select something?',
} as const;
