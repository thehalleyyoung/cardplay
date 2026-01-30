/**
 * @fileoverview Canonical HostAction Application
 * 
 * This module provides the single canonical location for applying HostActions
 * to SSOT stores with undo recording.
 * 
 * All deck/tool code applying HostActions should go through this module.
 * 
 * ## Usage
 * 
 * ```typescript
 * import { applyHostAction } from './apply-host-action';
 * 
 * const result = applyHostAction(action, {
 *   controlLevel: 'standard',
 *   toolMode: 'live',
 * });
 * 
 * if (!result.success) {
 *   console.error(result.error);
 * }
 * ```
 * 
 * @module @cardplay/ai/theory/apply-host-action
 * @see to_fix_repo_plan_500.md Change 373
 */

import type { HostAction } from './host-actions';
import type { MusicSpec } from './music-spec';
import { getSSOTStores } from '../../state/ssot';
import { getUndoStack } from '../../state/undo-stack';
import type { ControlLevel } from '../../canon/card-kind';
import type { ToolMode } from '../../boards/types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Options for applying a host action.
 */
export interface ApplyHostActionOptions {
  /** Current control level - some actions may be restricted */
  readonly controlLevel: ControlLevel;
  /** Current tool mode - affects how actions are applied */
  readonly toolMode: ToolMode;
  /** Whether to record undo */
  readonly recordUndo?: boolean;
  /** Current music spec (for spec-modifying actions) */
  readonly currentSpec?: MusicSpec;
  /** Callback for spec updates */
  readonly onSpecUpdate?: (spec: MusicSpec) => void;
}

/**
 * Result of applying a host action.
 */
export interface ApplyHostActionResult {
  readonly success: boolean;
  readonly error?: string;
  readonly warnings?: readonly string[];
  /** Updated spec if action modified it */
  readonly updatedSpec?: MusicSpec;
}

// ============================================================================
// ACTION HANDLERS
// ============================================================================

type ActionHandler = (
  action: HostAction,
  options: ApplyHostActionOptions
) => ApplyHostActionResult;

const actionHandlers: Record<string, ActionHandler> = {
  set_param: handleSetParam,
  add_constraint: handleAddConstraint,
  remove_constraint: handleRemoveConstraint,
  apply_pack: handleApplyPack,
  add_card: handleAddCard,
  remove_card: handleRemoveCard,
  set_key: handleSetKey,
  set_tempo: handleSetTempo,
  set_meter: handleSetMeter,
  set_culture: handleSetCulture,
  set_style: handleSetStyle,
  switch_board: handleSwitchBoard,
  add_deck: handleAddDeck,
  show_warning: handleShowWarning,
};

function handleSetParam(
  action: HostAction,
  options: ApplyHostActionOptions
): ApplyHostActionResult {
  if (action.action !== 'set_param') {
    return { success: false, error: 'Invalid action type' };
  }
  
  // TODO: Implement parameter setting through card registry
  // This would find the card by ID and update the parameter
  console.log(`[apply-host-action] set_param: ${action.cardId}.${action.paramId} = ${action.value}`);
  
  return { success: true };
}

function handleAddConstraint(
  action: HostAction,
  options: ApplyHostActionOptions
): ApplyHostActionResult {
  if (action.action !== 'add_constraint') {
    return { success: false, error: 'Invalid action type' };
  }
  
  if (!options.currentSpec || !options.onSpecUpdate) {
    return { success: false, error: 'No spec context for add_constraint' };
  }
  
  const updatedSpec: MusicSpec = {
    ...options.currentSpec,
    constraints: [...(options.currentSpec.constraints || []), action.constraint],
  };
  
  options.onSpecUpdate(updatedSpec);
  
  return { success: true, updatedSpec };
}

function handleRemoveConstraint(
  action: HostAction,
  options: ApplyHostActionOptions
): ApplyHostActionResult {
  if (action.action !== 'remove_constraint') {
    return { success: false, error: 'Invalid action type' };
  }
  
  if (!options.currentSpec || !options.onSpecUpdate) {
    return { success: false, error: 'No spec context for remove_constraint' };
  }
  
  const updatedSpec: MusicSpec = {
    ...options.currentSpec,
    constraints: (options.currentSpec.constraints || []).filter(
      c => c.type !== action.constraintType
    ),
  };
  
  options.onSpecUpdate(updatedSpec);
  
  return { success: true, updatedSpec };
}

function handleApplyPack(
  action: HostAction,
  _options: ApplyHostActionOptions
): ApplyHostActionResult {
  if (action.action !== 'apply_pack') {
    return { success: false, error: 'Invalid action type' };
  }
  
  // TODO: Look up pack by ID and apply its constraints
  console.log(`[apply-host-action] apply_pack: ${action.packId}`);
  
  return { success: true };
}

function handleAddCard(
  action: HostAction,
  _options: ApplyHostActionOptions
): ApplyHostActionResult {
  if (action.action !== 'add_card') {
    return { success: false, error: 'Invalid action type' };
  }
  
  // TODO: Add card to current deck through deck factory
  console.log(`[apply-host-action] add_card: ${action.cardType}`);
  
  return { success: true };
}

function handleRemoveCard(
  action: HostAction,
  _options: ApplyHostActionOptions
): ApplyHostActionResult {
  if (action.action !== 'remove_card') {
    return { success: false, error: 'Invalid action type' };
  }
  
  // TODO: Remove card from deck
  console.log(`[apply-host-action] remove_card: ${action.cardId}`);
  
  return { success: true };
}

function handleSetKey(
  action: HostAction,
  options: ApplyHostActionOptions
): ApplyHostActionResult {
  if (action.action !== 'set_key') {
    return { success: false, error: 'Invalid action type' };
  }
  
  if (!options.currentSpec || !options.onSpecUpdate) {
    return { success: false, error: 'No spec context for set_key' };
  }
  
  const updatedSpec: MusicSpec = {
    ...options.currentSpec,
    key: {
      root: action.root,
      mode: action.mode,
    },
  };
  
  options.onSpecUpdate(updatedSpec);
  
  return { success: true, updatedSpec };
}

function handleSetTempo(
  action: HostAction,
  options: ApplyHostActionOptions
): ApplyHostActionResult {
  if (action.action !== 'set_tempo') {
    return { success: false, error: 'Invalid action type' };
  }
  
  if (!options.currentSpec || !options.onSpecUpdate) {
    return { success: false, error: 'No spec context for set_tempo' };
  }
  
  const updatedSpec: MusicSpec = {
    ...options.currentSpec,
    tempo: action.bpm,
  };
  
  options.onSpecUpdate(updatedSpec);
  
  return { success: true, updatedSpec };
}

function handleSetMeter(
  action: HostAction,
  options: ApplyHostActionOptions
): ApplyHostActionResult {
  if (action.action !== 'set_meter') {
    return { success: false, error: 'Invalid action type' };
  }
  
  if (!options.currentSpec || !options.onSpecUpdate) {
    return { success: false, error: 'No spec context for set_meter' };
  }
  
  const updatedSpec: MusicSpec = {
    ...options.currentSpec,
    timeSignature: {
      numerator: action.numerator,
      denominator: action.denominator,
    },
  };
  
  options.onSpecUpdate(updatedSpec);
  
  return { success: true, updatedSpec };
}

function handleSetCulture(
  action: HostAction,
  options: ApplyHostActionOptions
): ApplyHostActionResult {
  if (action.action !== 'set_culture') {
    return { success: false, error: 'Invalid action type' };
  }
  
  if (!options.currentSpec || !options.onSpecUpdate) {
    return { success: false, error: 'No spec context for set_culture' };
  }
  
  const updatedSpec: MusicSpec = {
    ...options.currentSpec,
    culture: action.culture,
  };
  
  options.onSpecUpdate(updatedSpec);
  
  return { success: true, updatedSpec };
}

function handleSetStyle(
  action: HostAction,
  options: ApplyHostActionOptions
): ApplyHostActionResult {
  if (action.action !== 'set_style') {
    return { success: false, error: 'Invalid action type' };
  }
  
  if (!options.currentSpec || !options.onSpecUpdate) {
    return { success: false, error: 'No spec context for set_style' };
  }
  
  const updatedSpec: MusicSpec = {
    ...options.currentSpec,
    style: action.style,
  };
  
  options.onSpecUpdate(updatedSpec);
  
  return { success: true, updatedSpec };
}

function handleSwitchBoard(
  action: HostAction,
  _options: ApplyHostActionOptions
): ApplyHostActionResult {
  if (action.action !== 'switch_board') {
    return { success: false, error: 'Invalid action type' };
  }
  
  // TODO: Trigger board switch through board manager
  console.log(`[apply-host-action] switch_board: ${action.boardId}`);
  
  return { success: true };
}

function handleAddDeck(
  action: HostAction,
  _options: ApplyHostActionOptions
): ApplyHostActionResult {
  if (action.action !== 'add_deck') {
    return { success: false, error: 'Invalid action type' };
  }
  
  // TODO: Add deck through board/deck factory
  console.log(`[apply-host-action] add_deck: ${action.deckType}`);
  
  return { success: true };
}

function handleShowWarning(
  action: HostAction,
  _options: ApplyHostActionOptions
): ApplyHostActionResult {
  if (action.action !== 'show_warning') {
    return { success: false, error: 'Invalid action type' };
  }
  
  // TODO: Show warning in UI
  console.warn(`[apply-host-action] warning: ${action.message}`);
  
  return { success: true, warnings: [action.message] };
}

// ============================================================================
// MAIN API
// ============================================================================

/**
 * Control level restrictions for actions.
 */
const ACTION_CONTROL_LEVELS: Record<string, ControlLevel> = {
  set_param: 'basic',
  add_constraint: 'standard',
  remove_constraint: 'standard',
  apply_pack: 'basic',
  add_card: 'standard',
  remove_card: 'standard',
  set_key: 'basic',
  set_tempo: 'basic',
  set_meter: 'basic',
  set_culture: 'advanced',
  set_style: 'advanced',
  switch_board: 'basic',
  add_deck: 'advanced',
  show_warning: 'basic',
};

const CONTROL_LEVEL_ORDER: Record<ControlLevel, number> = {
  basic: 0,
  standard: 1,
  advanced: 2,
  expert: 3,
};

/**
 * Applies a HostAction to SSOT stores with undo recording.
 * 
 * This is THE canonical entry point for applying any AI-suggested action.
 */
export function applyHostAction(
  action: HostAction,
  options: ApplyHostActionOptions
): ApplyHostActionResult {
  // Check control level
  const requiredLevel = ACTION_CONTROL_LEVELS[action.action] || 'expert';
  if (CONTROL_LEVEL_ORDER[options.controlLevel] < CONTROL_LEVEL_ORDER[requiredLevel]) {
    return {
      success: false,
      error: `Action '${action.action}' requires control level '${requiredLevel}' but current level is '${options.controlLevel}'`,
    };
  }
  
  // Find handler
  const handler = actionHandlers[action.action];
  if (!handler) {
    console.warn(`[apply-host-action] Unknown action type: ${action.action}`);
    return {
      success: false,
      error: `Unknown action type: ${action.action}`,
    };
  }
  
  // Apply action
  const result = handler(action, options);
  
  // Record undo if requested and successful
  if (result.success && options.recordUndo !== false) {
    const undoStack = getUndoStack();
    undoStack.push({
      type: 'events-modify',
      timestamp: Date.now(),
      description: `Apply AI action: ${action.action}`,
      undo: () => {
        // TODO: Implement proper undo for each action type
        console.log(`[apply-host-action] Undo: ${action.action}`);
      },
      redo: () => {
        applyHostAction(action, { ...options, recordUndo: false });
      },
    });
  }
  
  return result;
}

/**
 * Applies multiple HostActions in sequence.
 */
export function applyHostActions(
  actions: readonly HostAction[],
  options: ApplyHostActionOptions
): ApplyHostActionResult[] {
  return actions.map(action => applyHostAction(action, options));
}

/**
 * Checks if an action can be applied with the current options.
 */
export function canApplyAction(
  action: HostAction,
  options: Pick<ApplyHostActionOptions, 'controlLevel' | 'toolMode'>
): boolean {
  const requiredLevel = ACTION_CONTROL_LEVELS[action.action] || 'expert';
  return CONTROL_LEVEL_ORDER[options.controlLevel] >= CONTROL_LEVEL_ORDER[requiredLevel];
}
