/**
 * @fileoverview Board & Deck Query Functions
 * 
 * TypeScript wrappers around Prolog queries for board recommendations,
 * deck layout suggestions, and workflow-based recommendations.
 * 
 * These functions provide a type-safe interface to the board-layout.pl
 * knowledge base, converting between TypeScript types and Prolog terms.
 * 
 * @module @cardplay/ai/queries/board-queries
 */

import { getPrologAdapter, PrologAdapter } from '../engine/prolog-adapter';
import { loadBoardLayoutKB } from '../knowledge/board-layout-loader';
import { getBoardRegistry } from '../../boards/registry';
import type { ControlLevel, DeckType as CanonicalDeckType } from '../../boards/types';

/**
 * Board control level type.
 * Re-exported from canonical types for backward compatibility.
 * @deprecated Import ControlLevel from '../../boards/types' instead.
 */
export type { ControlLevel } from '../../boards/types';

/**
 * Board information returned from queries.
 */
export interface BoardInfo {
  readonly id: string;
  readonly controlLevel: ControlLevel;
}

/**
 * Deck type identifier.
 * Uses canonical DeckType when possible; falls back to string for Prolog results.
 */
export type DeckType = CanonicalDeckType | string;

/**
 * Workflow type identifier.
 */
export type WorkflowType = string;

/**
 * Layout suggestion for a deck.
 */
export interface LayoutSuggestion {
  readonly deckType: DeckType;
  readonly position: 'left' | 'right' | 'top' | 'bottom' | 'center';
  readonly sizePercent: number;
}

/**
 * Deck validation result.
 */
export interface DeckValidation {
  readonly valid: boolean;
  readonly reason?: string;
  readonly missingTools?: string[];
  readonly conflicts?: string[];
}

/**
 * Deck pairing suggestion.
 */
export interface DeckPairing {
  readonly deck1: DeckType;
  readonly deck2: DeckType;
  readonly reason: string;
}

/**
 * Workflow info.
 */
export interface WorkflowInfo {
  readonly id: WorkflowType;
  readonly requiredDecks: DeckType[];
  readonly beneficialDecks: DeckType[];
  readonly recommendedBoard: string;
}

/**
 * Shortcut suggestion.
 */
export interface ShortcutSuggestion {
  readonly action: string;
  readonly shortcut: string;
  readonly deck: DeckType;
}

/**
 * Shortcut conflict.
 */
export interface ShortcutConflict {
  readonly shortcut: string;
  readonly action1: string;
  readonly action2: string;
}

/**
 * Theme suggestion.
 */
export interface ThemeSuggestion {
  readonly theme: string;
  readonly appropriateFor: ControlLevel[];
}

/**
 * Ensure the board layout KB is loaded.
 */
async function ensureKBLoaded(adapter: PrologAdapter): Promise<void> {
  await loadBoardLayoutKB(adapter);
}

/**
 * Get all available board types.
 * 
 * @returns Array of board info objects with id and control level
 * 
 * @example
 * const boards = await getAllBoards();
 * // [{ id: 'notation-pure', controlLevel: 'manual' }, ...]
 */
export async function getAllBoards(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<BoardInfo[]> {
  // Change 143/144: Pull board metadata from the board registry first
  const registry = getBoardRegistry();
  const registeredBoards = registry.list();

  if (registeredBoards.length > 0) {
    // Return registry boards augmented with Prolog-only boards
    const registryInfos: BoardInfo[] = registeredBoards.map(b => ({
      id: b.id,
      controlLevel: b.controlLevel,
    }));

    // Also query Prolog for any boards not in the registry
    await ensureKBLoaded(adapter);
    const prologResults = await adapter.queryAll('board(Id, Level)');
    const registryIds = new Set(registeredBoards.map(b => b.id));

    for (const r of prologResults) {
      const id = String(r.Id);
      if (!registryIds.has(id)) {
        registryInfos.push({
          id,
          controlLevel: String(r.Level) as ControlLevel,
        });
      }
    }

    return registryInfos;
  }

  // Fallback: Prolog-only query
  await ensureKBLoaded(adapter);
  const results = await adapter.queryAll('board(Id, Level)');

  return results
    .map(r => ({
      id: String(r.Id),
      controlLevel: String(r.Level) as ControlLevel
    }));
}

/**
 * Get all available deck types.
 * 
 * @returns Array of deck type strings
 * 
 * @example
 * const decks = await getAllDeckTypes();
 * // ['pattern_editor', 'phrase_library', 'mixer', ...]
 */
export async function getAllDeckTypes(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<DeckType[]> {
  await ensureKBLoaded(adapter);
  
  const results = await adapter.queryAll('deck_type(Type)');
  
  return results
    .map(r => String(r.Type));
}

/**
 * Get the decks that belong to a specific board.
 * 
 * @param boardId - The board identifier
 * @returns Array of deck types on that board
 * 
 * @example
 * const decks = await getBoardDecks('notation-harmony');
 * // ['notation_input', 'staff_display', 'chord_hints', 'phrase_library']
 */
export async function getBoardDecks(
  boardId: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<DeckType[]> {
  // Change 143/144: Check board registry first for canonical deck types
  const registry = getBoardRegistry();
  const board = registry.get(boardId);

  if (board) {
    return board.decks.map(d => d.type);
  }

  // Fallback: Prolog query
  await ensureKBLoaded(adapter);
  const results = await adapter.queryAll(`board_has_deck(${boardId}, Deck)`);

  return results
    .map(r => String(r.Deck));
}

/**
 * Recommend boards for a given workflow.
 * (L097: recommendBoardForWorkflow)
 * 
 * @param workflow - The workflow type (e.g., 'notation_composer', 'tracker_user')
 * @returns Array of recommended board IDs
 * 
 * @example
 * const boards = await recommendBoardForWorkflow('notation_composer');
 * // ['notation-harmony', 'notation-pure']
 */
export async function recommendBoardForWorkflow(
  workflow: WorkflowType,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string[]> {
  await ensureKBLoaded(adapter);
  
  const results = await adapter.queryAll(`recommended_board(${workflow}, Board)`);
  
  return results
    .map(r => String(r.Board));
}

/**
 * Suggest deck layout for a board based on user preferences.
 * (L098: suggestDeckLayout)
 * 
 * @param boardId - The board identifier
 * @param userPrefs - Optional user preferences (e.g., { focusDeck: 'pattern_editor' })
 * @returns Array of layout suggestions
 * 
 * @example
 * const layout = await suggestDeckLayout('basic_tracker_board');
 * // [{ deckType: 'pattern_editor', position: 'center', sizePercent: 60 }, ...]
 */
export async function suggestDeckLayout(
  boardId: string,
  _userPrefs: Record<string, unknown> = {},
  adapter: PrologAdapter = getPrologAdapter()
): Promise<LayoutSuggestion[]> {
  await ensureKBLoaded(adapter);
  
  // Query the deck layout for decks on this board
  const results = await adapter.queryAll(
    `board_has_deck(${boardId}, Deck), deck_layout_position(Deck, Position), panel_size_suggestion(Deck, width, Size)`
  );
  
  return results
    .map(r => ({
      deckType: String(r.Deck),
      position: String(r.Position) as LayoutSuggestion['position'],
      sizePercent: Number(r.Size)
    }));
}

/**
 * Validate a combination of deck types on a specific board.
 * (L099: validateDeckCombination)
 * 
 * @param deckTypes - Array of deck types to validate
 * @param boardId - Optional board ID to validate against (defaults to checking all decks exist)
 * @returns Validation result with validity and any issues
 * 
 * @example
 * const result = await validateDeckCombination(['pattern_editor', 'phrase_library'], 'tracker_phrases_board');
 * // { valid: true }
 */
export async function validateDeckCombination(
  deckTypes: DeckType[],
  boardId: string = 'producer_board',
  adapter: PrologAdapter = getPrologAdapter()
): Promise<DeckValidation> {
  await ensureKBLoaded(adapter);
  
  // Convert array to Prolog list
  const deckList = `[${deckTypes.join(', ')}]`;
  
  // Query the validation predicate with board
  const result = await adapter.querySingle(`validate_deck_combination(${deckList}, ${boardId}, Result)`);
  
  if (result === null) {
    // If no result, check if the decks exist
    const allDecksExist = await Promise.all(
      deckTypes.map(async deck => {
        const exists = await adapter.querySingle(`deck_type(${deck})`);
        return exists !== null;
      })
    );
    
    if (allDecksExist.every(Boolean)) {
      return { valid: true };
    }
    
    return { 
      valid: false, 
      reason: 'unknown_deck_type' 
    };
  }
  
  const resultStr = String(result.Result);
  if (resultStr === 'valid') {
    return { valid: true };
  }
  
  return {
    valid: false,
    reason: resultStr
  };
}

/**
 * Suggest the next deck to open based on current context.
 * (L100: suggestNextDeckToOpen)
 * 
 * @param currentDecks - Array of currently open deck types
 * @param workflow - The user's workflow type
 * @returns Array of suggested deck types to open next
 * 
 * @example
 * const suggestions = await suggestNextDeckToOpen(['pattern_editor'], 'tracker_user');
 * // ['sample_browser', 'mixer', 'phrase_library']
 */
export async function suggestNextDeckToOpen(
  currentDecks: DeckType[],
  workflow: WorkflowType,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<DeckType[]> {
  await ensureKBLoaded(adapter);
  
  const deckList = `[${currentDecks.join(', ')}]`;
  
  const results = await adapter.queryAll(
    `suggest_next_deck(${deckList}, ${workflow}, Deck)`
  );
  
  return results
    .map(r => String(r.Deck));
}

/**
 * Optimize panel sizes for a set of decks.
 * (L101: optimizePanelSizes)
 * 
 * @param decks - Array of deck types
 * @returns Record mapping deck types to suggested size percentages
 * 
 * @example
 * const sizes = await optimizePanelSizes(['pattern_editor', 'mixer', 'sample_browser']);
 * // { pattern_editor: 50, mixer: 30, sample_browser: 20 }
 */
export async function optimizePanelSizes(
  decks: DeckType[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Record<DeckType, number>> {
  await ensureKBLoaded(adapter);
  
  const sizes: Record<DeckType, number> = {};
  
  // Query panel size suggestions for each deck
  for (const deck of decks) {
    const results = await adapter.queryAll(`panel_size_suggestion(${deck}, _, Size)`);
    
    const first = results[0];
    if (first) {
      sizes[deck] = Number(first.Size);
    } else {
      // Default to equal distribution
      sizes[deck] = Math.floor(100 / decks.length);
    }
  }
  
  // Normalize to sum to 100
  const total = Object.values(sizes).reduce((a, b) => a + b, 0);
  if (total !== 100 && total > 0) {
    const scale = 100 / total;
    for (const deck of Object.keys(sizes)) {
      const size = sizes[deck];
      if (size !== undefined) {
        sizes[deck] = Math.round(size * scale);
      }
    }
  }
  
  return sizes;
}

/**
 * Get workflow information including required and beneficial decks.
 * 
 * @param workflow - The workflow type
 * @returns Workflow info object
 * 
 * @example
 * const info = await getWorkflowInfo('notation_composer');
 * // { id: 'notation_composer', requiredDecks: ['notation_input', 'staff_display'], ... }
 */
export async function getWorkflowInfo(
  workflow: WorkflowType,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<WorkflowInfo | null> {
  await ensureKBLoaded(adapter);
  
  // Check if workflow exists
  const workflowExists = await adapter.querySingle(`workflow(${workflow}, _)`);
  if (workflowExists === null) {
    return null;
  }
  
  // Get required decks
  const requiredResults = await adapter.queryAll(`workflow_requires_deck(${workflow}, Deck)`);
  const requiredDecks = requiredResults
    .map(r => String(r.Deck));
  
  // Get beneficial decks
  const benefitResults = await adapter.queryAll(`workflow_benefits_from_deck(${workflow}, Deck)`);
  const beneficialDecks = benefitResults
    .map(r => String(r.Deck));
  
  // Get recommended board
  const boardResults = await adapter.queryAll(`recommended_board(${workflow}, Board)`);
  const firstBoard = boardResults[0];
  const recommendedBoard = firstBoard ? String(firstBoard.Board) : '';
  
  return {
    id: workflow,
    requiredDecks,
    beneficialDecks,
    recommendedBoard
  };
}

/**
 * Get the order in which decks should be opened for a workflow.
 * 
 * @param workflow - The workflow type
 * @returns Ordered array of deck types
 * 
 * @example
 * const order = await getDeckOpenOrder('tracker_user');
 * // ['pattern_editor', 'sample_browser', 'mixer']
 */
export async function getDeckOpenOrder(
  workflow: WorkflowType,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<DeckType[]> {
  await ensureKBLoaded(adapter);
  
  const results = await adapter.queryAll(`deck_open_order(${workflow}, Order)`);
  
  const first = results[0];
  if (first) {
    const order = first.Order;
    // Parse Prolog list
    if (Array.isArray(order)) {
      return order.map(String);
    }
  }
  
  return [];
}

/**
 * Get deck pairings that work well together.
 * 
 * @returns Array of deck pairing suggestions
 * 
 * @example
 * const pairings = await getDeckPairings();
 * // [{ deck1: 'pattern_editor', deck2: 'phrase_library', reason: 'phrase_to_pattern' }, ...]
 */
export async function getDeckPairings(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<DeckPairing[]> {
  await ensureKBLoaded(adapter);
  
  const results = await adapter.queryAll('deck_pairing(Deck1, Deck2)');
  
  return results
    .map(r => ({
      deck1: String(r.Deck1),
      deck2: String(r.Deck2),
      reason: 'compatible'
    }));
}

/**
 * Check if a deck is compatible with a control level.
 * 
 * @param deckType - The deck type
 * @param controlLevel - The control level
 * @returns True if compatible
 * 
 * @example
 * const compat = await isDeckCompatibleWithLevel('ai_composer', 'manual');
 * // false
 */
export async function isDeckCompatibleWithLevel(
  deckType: DeckType,
  controlLevel: ControlLevel,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<boolean> {
  await ensureKBLoaded(adapter);
  
  const result = await adapter.querySingle(
    `deck_compatible_with_control_level(${deckType}, ${controlLevel})`
  );
  
  return result !== null;
}

/**
 * Get required tools for a deck type.
 * 
 * @param deckType - The deck type
 * @returns Array of required tool identifiers
 * 
 * @example
 * const tools = await getRequiredToolsForDeck('sample_browser');
 * // ['sample_library', 'audio_preview']
 */
export async function getRequiredToolsForDeck(
  deckType: DeckType,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string[]> {
  await ensureKBLoaded(adapter);
  
  const results = await adapter.queryAll(`tool_required_for_deck(${deckType}, Tool)`);
  
  return results
    .map(r => String(r.Tool));
}

/**
 * Detect keyboard shortcut conflicts.
 * (L105: keyboard_shortcut_conflict)
 * 
 * @returns Array of shortcut conflicts
 * 
 * @example
 * const conflicts = await detectShortcutConflicts();
 * // [{ shortcut: 'Space', action1: 'play', action2: 'other_action' }]
 */
export async function detectShortcutConflicts(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<ShortcutConflict[]> {
  await ensureKBLoaded(adapter);
  
  // The KB's keyboard_shortcut_conflict/2 finds shortcuts bound to multiple actions
  // We need to find all actions with the same shortcut
  const results = await adapter.queryAll(
    'shortcut_for_action(Action1, Shortcut), shortcut_for_action(Action2, Shortcut), Action1 @< Action2'
  );
  
  return results
    .map(r => ({
      shortcut: String(r.Shortcut),
      action1: String(r.Action1),
      action2: String(r.Action2)
    }));
}

/**
 * Get shortcut suggestions (all defined shortcuts).
 * (L106: shortcut_suggestion)
 * 
 * @param _deckType - The deck type (currently returns global shortcuts)
 * @returns Array of shortcut suggestions
 * 
 * @example
 * const shortcuts = await getShortcutSuggestions('pattern_editor');
 * // [{ action: 'play', shortcut: 'Space', deck: 'pattern_editor' }]
 */
export async function getShortcutSuggestions(
  _deckType: DeckType,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<ShortcutSuggestion[]> {
  await ensureKBLoaded(adapter);
  
  // Use shortcut_for_action to get all shortcuts
  const results = await adapter.queryAll('shortcut_for_action(Action, Shortcut)');
  
  return results
    .map(r => ({
      action: String(r.Action),
      shortcut: String(r.Shortcut),
      deck: _deckType
    }));
}

/**
 * Get appropriate themes for a control level.
 * (L107: theme_appropriate)
 * 
 * @param controlLevel - The control level
 * @returns Array of appropriate theme names
 * 
 * @example
 * const themes = await getAppropriateThemes('manual');
 * // ['dark', 'light']
 */
export async function getAppropriateThemes(
  controlLevel: ControlLevel,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string[]> {
  await ensureKBLoaded(adapter);
  
  // theme_appropriate/2 uses board IDs, so we need to find boards with matching category
  // and then get their themes
  const results = await adapter.queryAll(
    `board_category(Board, ${controlLevel}), theme_appropriate(Theme, Board)`
  );
  
  // Also add themes that work for all (like 'dark')
  const universalResults = await adapter.queryAll('theme_appropriate(Theme, _)');
  
  const allThemes = new Set<string>();
  
  for (const r of results) {
    allThemes.add(String(r.Theme));
  }
  for (const r of universalResults) {
    allThemes.add(String(r.Theme));
  }
  
  // 'dark' theme works for all, so always include it
  allThemes.add('dark');
  
  return Array.from(allThemes);
}

/**
 * Get color coding for a control level.
 * (L108: color_coding_rule)
 * 
 * @param controlLevel - The control level (use full_manual, assisted, etc.)
 * @returns Object with indicator color
 * 
 * @example
 * const colors = await getControlLevelColors('assisted');
 * // { primary: '', accent: '', indicator: 'yellow' }
 */
export async function getControlLevelColors(
  controlLevel: ControlLevel | string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<{ primary: string; accent: string; indicator: string } | null> {
  await ensureKBLoaded(adapter);
  
  // The KB uses full_manual, manual_with_hints, etc.
  // Map common names to KB names
  const levelMap: Record<string, string> = {
    'manual': 'full_manual',
    'assisted': 'assisted',
    'generative': 'generative',
    'hybrid': 'collaborative'
  };
  
  const kbLevel = levelMap[controlLevel] || controlLevel;
  
  const result = await adapter.querySingle(
    `color_coding_rule(${kbLevel}, indicator, Indicator)`
  );
  
  if (result === null) {
    return null;
  }
  
  return {
    primary: '',
    accent: '',
    indicator: String(result.Indicator)
  };
}

/**
 * Check deck visibility based on tool mode and control level.
 * (L109: deck_visibility_rule)
 * 
 * @param deckType - The deck type
 * @param toolMode - The current tool mode
 * @param controlLevel - The control level
 * @returns True if the deck should be visible
 * 
 * @example
 * const visible = await isDeckVisible('pattern_editor', 'basic_tracker_board', 'manual');
 * // true
 */
export async function isDeckVisible(
  deckType: DeckType,
  boardId: string,
  _controlLevel: ControlLevel,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<boolean> {
  await ensureKBLoaded(adapter);
  
  // The KB's deck_visibility_rule/3 checks if deck is on board
  const result = await adapter.querySingle(
    `deck_visibility_rule(${deckType}, ${boardId}, visible)`
  );
  
  return result !== null;
}

/**
 * Get empty state suggestion for a deck.
 * (L110: empty_state_suggestion)
 * 
 * @param deckType - The deck type
 * @returns Suggestion for what to show in empty state
 * 
 * @example
 * const suggestion = await getEmptyStateSuggestion('pattern_editor');
 * // 'Click to add your first pattern, or drag samples from the browser'
 */
export async function getEmptyStateSuggestion(
  deckType: DeckType,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string | null> {
  await ensureKBLoaded(adapter);
  
  const result = await adapter.querySingle(`empty_state_suggestion(${deckType}, Suggestion)`);
  
  if (result === null) {
    return null;
  }
  
  return String(result.Suggestion);
}

/**
 * Get tutorial sequence for a board.
 * (L111: tutorial_sequence)
 * 
 * @param boardId - The board identifier
 * @returns Ordered array of tutorial step descriptions
 * 
 * @example
 * const steps = await getTutorialSequence('tracker-lofi');
 * // ['Load a drum kit', 'Create a pattern', 'Add bass', ...]
 */
export async function getTutorialSequence(
  boardId: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string[]> {
  await ensureKBLoaded(adapter);
  
  const results = await adapter.queryAll(`tutorial_sequence(${boardId}, Step)`);
  
  return results
    .map(r => String(r.Step));
}

/**
 * Get help topic for a user action.
 * (L112: help_topic)
 * 
 * @param action - The user action
 * @returns Help topic identifier or null
 * 
 * @example
 * const topic = await getHelpTopic('pattern_editing');
 * // 'docs/pattern-editor'
 */
export async function getHelpTopic(
  action: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string | null> {
  await ensureKBLoaded(adapter);

  const result = await adapter.querySingle(`help_topic(${action}, Topic)`);

  if (result === null) {
    return null;
  }

  // Change 144: Normalize doc path strings to canonical references
  const topic = String(result.Topic);
  // Strip legacy 'docs/' prefix if present — callers should use canonical IDs
  return topic.replace(/^docs\//, '');
}

/**
 * Check performance constraints for deck count.
 * (L113: performance_constraint)
 * 
 * @param deckCount - Number of open decks
 * @param deviceType - Type of device (desktop, tablet, mobile)
 * @returns Object with constraint info
 * 
 * @example
 * const constraint = await checkPerformanceConstraint(10, 'mobile');
 * // { allowed: false, maxRecommended: 4, reason: 'memory_limit' }
 */
export async function checkPerformanceConstraint(
  deckCount: number,
  deviceType: string = 'desktop',
  adapter: PrologAdapter = getPrologAdapter()
): Promise<{ allowed: boolean; maxRecommended: number; reason?: string }> {
  await ensureKBLoaded(adapter);
  
  const result = await adapter.querySingle(
    `performance_constraint(${deviceType}, MaxDecks, _)`
  );
  
  if (result === null) {
    return { allowed: true, maxRecommended: 20 };
  }
  
  const maxRecommended = Number(result.MaxDecks);
  const allowed = deckCount <= maxRecommended;
  
  return {
    allowed,
    maxRecommended,
    ...(allowed ? {} : { reason: 'exceeds_recommended_count' })
  };
}

/**
 * Get accessibility rules for a deck.
 * (L114: accessibility_rule)
 * 
 * @param deckType - The deck type
 * @returns Array of accessibility rule descriptions
 * 
 * @example
 * const rules = await getAccessibilityRules('pattern_editor');
 * // ['arrow_key_navigation', 'tab_order_cells', 'announce_note_changes']
 */
export async function getAccessibilityRules(
  deckType: DeckType,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string[]> {
  await ensureKBLoaded(adapter);
  
  const results = await adapter.queryAll(`accessibility_rule(${deckType}, Rule, _)`);
  
  return results
    .map(r => String(r.Rule));
}

/**
 * Check beginner safety rules.
 * (L115: beginner_safety_rule)
 * 
 * @param deckType - The deck type
 * @returns True if deck is beginner-safe
 * 
 * @example
 * const safe = await isBeginnerSafe('ai_composer');
 * // true (has guardrails)
 */
export async function isBeginnerSafe(
  deckType: DeckType,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<boolean> {
  await ensureKBLoaded(adapter);
  
  const result = await adapter.querySingle(`beginner_safety_rule(${deckType}, safe)`);
  
  return result !== null;
}

/**
 * Get board transitions.
 * (L094: board_transition)
 * 
 * @param fromBoard - Source board ID
 * @returns Array of valid target boards with transition info
 * 
 * @example
 * const transitions = await getBoardTransitions('notation-pure');
 * // [{ to: 'notation-harmony', type: 'upgrade' }, { to: 'tracker-notation', type: 'switch' }]
 */
export async function getBoardTransitions(
  fromBoard: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Array<{ to: string; type: string }>> {
  await ensureKBLoaded(adapter);
  
  const results = await adapter.queryAll(`board_transition(${fromBoard}, ToBoard, Type)`);
  
  return results
    .map(r => ({
      to: String(r.ToBoard),
      type: String(r.Type)
    }));
}
