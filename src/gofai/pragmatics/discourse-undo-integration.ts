/**
 * @file Discourse-Undo Integration
 * @module gofai/pragmatics/discourse-undo-integration
 * 
 * Implements Step 347: Implement "undo affects discourse": if user undoes an edit,
 * update what "again" and "that change" refer to.
 * 
 * When an edit is undone, the discourse model must be updated to:
 * 1. Mark the undone edit as invalidated in the edit history
 * 2. Adjust salience to reflect that entities were "un-edited"
 * 3. Update references so "again" doesn't repeat the undone edit
 * 4. Update topic if needed
 * 5. Record the undo action itself as a discourse event
 * 
 * This ensures that after undoing, "do that again" repeats the thing before
 * the undone edit, not the undone edit itself.
 * 
 * @see gofai_goalB.md Step 347
 * @see discourse-model.ts for base discourse types
 * @see discourse-edit-integration.ts for edit integration
 */

import type {
  DiscourseState,
  DiscourseReferent,
  ReferentId,
  EditHistoryReferent,
  CommonGroundEntry,
  TopicFrame,
} from './discourse-model.js';

import {
  addReferent,
  boostReferent,
  addToCommonGround,
  setTopic,
  createReferentId,
  getMostSalient,
} from './discourse-model.js';

import type {
  EditPackage,
} from '../execution/edit-package.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration for undo-discourse integration.
 */
export interface DiscourseUndoIntegrationConfig {
  /** Should we mark undone edits as invalidated? */
  readonly invalidateUndonEdits: boolean;

  /** Should we decrease salience of un-edited entities? */
  readonly decreaseSalienceForUndonEntities: boolean;

  /** Should we update topic after undo? */
  readonly updateTopicAfterUndo: boolean;

  /** Should we record undo actions themselves? */
  readonly recordUndoActions: boolean;

  /** Salience penalty for un-edited entities */
  readonly undoSaliencePenalty: number;

  /** Salience boost for undo action itself */
  readonly undoActionSalience: number;
}

/**
 * Default configuration.
 */
export const DEFAULT_DISCOURSE_UNDO_CONFIG: DiscourseUndoIntegrationConfig = {
  invalidateUndonEdits: true,
  decreaseSalienceForUndonEntities: true,
  updateTopicAfterUndo: false,
  recordUndoActions: true,
  undoSaliencePenalty: 0.3,
  undoActionSalience: 0.7,
};

/**
 * Result of integrating an undo into discourse state.
 */
export interface DiscourseUndoIntegrationResult {
  /** Updated discourse state */
  readonly discourseState: DiscourseState;

  /** The edit that was undone */
  readonly undonEditReferentId: ReferentId | undefined;

  /** Referents whose salience was decreased */
  readonly penalizedReferents: readonly ReferentId[];

  /** The undo action referent (if created) */
  readonly undoActionReferentId: ReferentId | undefined;

  /** Whether topic was updated */
  readonly topicUpdated: boolean;

  /** New topic (if updated) */
  readonly newTopic: TopicFrame | undefined;
}

/**
 * Information about an undo operation.
 */
export interface UndoOperation {
  /** The edit package that was undone */
  readonly undonEditPackage: EditPackage;

  /** When the undo happened */
  readonly undoTimestamp: number;

  /** Reason for undo (if available) */
  readonly reason?: string;

  /** Was this an explicit user undo or automatic rollback? */
  readonly explicit: boolean;
}

// ============================================================================
// Main Integration Function
// ============================================================================

/**
 * Integrate an undo operation into the discourse state.
 * 
 * This is called after an edit is undone to update the discourse model
 * so that subsequent references work correctly.
 * 
 * @param discourseState Current discourse state
 * @param undoOp The undo operation information
 * @param config Integration configuration
 * @returns Updated discourse state and integration metadata
 */
export function integrateUndoIntoDiscourse(
  discourseState: DiscourseState,
  undoOp: UndoOperation,
  config: DiscourseUndoIntegrationConfig = DEFAULT_DISCOURSE_UNDO_CONFIG
): DiscourseUndoIntegrationResult {
  let state = discourseState;
  const penalizedReferents: ReferentId[] = [];
  let undonEditReferentId: ReferentId | undefined = undefined;
  let undoActionReferentId: ReferentId | undefined = undefined;
  let topicUpdated = false;
  let newTopic: TopicFrame | undefined = undefined;

  const turnNumber = state.currentTurn;
  const editPackageId = undoOp.undonEditPackage.id;

  // Step 1: Find the edit referent for the undone edit
  const editReferent = state.referents.find(
    r => r.type === 'edit' && r.worldBinding?.entityId === editPackageId
  );

  if (editReferent) {
    undonEditReferentId = editReferent.id;

    // Mark it as invalidated by reducing salience significantly
    state = {
      ...state,
      referents: state.referents.map(r => {
        if (r.id === editReferent.id) {
          return {
            ...r,
            salience: Math.max(0, r.salience - 0.8), // Large penalty
            inFocus: false,
            properties: [
              ...r.properties,
              {
                name: 'undone',
                value: 'true',
                source: 'world_state' as const,
                turnEstablished: turnNumber,
              },
            ],
          };
        }
        return r;
      }),
    };
  }

  // Step 2: Mark edit history entry as invalidated
  if (config.invalidateUndonEdits) {
    state = {
      ...state,
      editHistory: state.editHistory.map(entry => {
        if (entry.editPackageId === editPackageId) {
          return {
            ...entry,
            summary: `[UNDONE] ${entry.summary}`,
          };
        }
        return entry;
      }),
    };
  }

  // Step 3: Penalize salience for entities that were affected by undone edit
  if (config.decreaseSalienceForUndonEntities) {
    const affectedEntityIds = extractAffectedEntityIds(undoOp.undonEditPackage);
    
    for (const entityId of affectedEntityIds) {
      const referent = state.referents.find(
        r => r.worldBinding?.entityId === entityId
      );

      if (referent) {
        state = {
          ...state,
          referents: state.referents.map(r => {
            if (r.id === referent.id) {
              return {
                ...r,
                salience: Math.max(0, r.salience - config.undoSaliencePenalty),
              };
            }
            return r;
          }),
        };
        penalizedReferents.push(referent.id);
      }
    }
  }

  // Step 4: Create referent for the undo action itself
  if (config.recordUndoActions) {
    const undoReferent = createUndoActionReferent(
      undoOp,
      turnNumber,
      undonEditReferentId,
      config.undoActionSalience
    );
    state = addReferent(state, undoReferent);
    undoActionReferentId = undoReferent.id;
  }

  // Step 5: Update topic if appropriate
  if (config.updateTopicAfterUndo) {
    // Find the most recent non-undone edit to determine topic
    const priorEdit = findMostRecentValidEdit(state, editPackageId);
    if (priorEdit) {
      const priorEditReferent = state.referents.find(
        r => r.type === 'edit' && r.worldBinding?.entityId === priorEdit.editPackageId
      );

      if (priorEditReferent && priorEdit.scope) {
        const scopeReferent = state.referents.find(r => r.id === priorEdit.scope);
        if (scopeReferent) {
          newTopic = {
            focus: scopeReferent.id,
            focusType: scopeReferent.type,
            displayName: scopeReferent.displayName,
            turnSet: turnNumber,
            explicit: false,
          };
          state = setTopic(state, newTopic);
          topicUpdated = true;
        }
      }
    }
  }

  // Step 6: Add undo to common ground
  const commonGroundEntry: CommonGroundEntry = {
    fact: `Undid: ${undoOp.undonEditPackage.diff.summary}`,
    turnEstablished: turnNumber,
    method: 'ui_action',
    referents: undoActionReferentId ? [undoActionReferentId] : [],
  };
  state = addToCommonGround(state, commonGroundEntry);

  return {
    discourseState: state,
    undonEditReferentId,
    penalizedReferents,
    undoActionReferentId,
    topicUpdated,
    newTopic,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract entity IDs affected by an edit package.
 */
function extractAffectedEntityIds(editPackage: EditPackage): string[] {
  const entityIds = new Set<string>();

  for (const change of editPackage.diff.changes) {
    entityIds.add(change.entityId);
  }

  return Array.from(entityIds);
}

/**
 * Create a discourse referent for an undo action.
 */
function createUndoActionReferent(
  undoOp: UndoOperation,
  turnNumber: number,
  undonEditReferentId: ReferentId | undefined,
  initialSalience: number
): DiscourseReferent {
  const id = createReferentId(`undo-${undoOp.undonEditPackage.id}`, turnNumber);

  return {
    id,
    displayName: `undo of "${summarizeEdit(undoOp.undonEditPackage)}"`,
    type: 'edit',
    introducedIn: `drs:t${turnNumber}` as any,
    turnIntroduced: turnNumber,
    introductionSource: {
      type: 'ui_action',
      selectionDescription: 'undo operation',
    },
    salience: initialSalience,
    properties: [
      {
        name: 'action_type',
        value: 'undo',
        source: 'world_state',
        turnEstablished: turnNumber,
      },
      {
        name: 'undid_edit',
        value: undoOp.undonEditPackage.id,
        source: 'world_state',
        turnEstablished: turnNumber,
      },
      ...(undonEditReferentId ? [{
        name: 'undid_referent',
        value: undonEditReferentId,
        source: 'world_state' as const,
        turnEstablished: turnNumber,
      }] : []),
    ],
    worldBinding: {
      entityId: `undo-${undoOp.undonEditPackage.id}`,
      entityType: 'undo_action',
      displayName: 'undo action',
      details: undefined,
      bindingMethod: 'exact_name_match',
      confidence: 'certain',
    },
    inFocus: true,
    lastMentionedTurn: turnNumber,
  };
}

/**
 * Summarize an edit for display.
 */
function summarizeEdit(editPackage: EditPackage): string {
  const utterance = editPackage.intent.provenance.utterance;
  const summary = editPackage.diff.summary;
  
  const text = utterance.length > 0 ? utterance : summary;
  return text.length > 40 ? text.substring(0, 37) + '...' : text;
}

/**
 * Find the most recent valid (non-undone) edit in history.
 */
function findMostRecentValidEdit(
  state: DiscourseState,
  excludeEditId: string
): EditHistoryReferent | undefined {
  const validEdits = state.editHistory
    .filter(e => 
      e.editPackageId !== excludeEditId &&
      !e.summary.startsWith('[UNDONE]')
    )
    .sort((a, b) => b.turnNumber - a.turnNumber);

  return validEdits[0];
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Find all undo actions in the discourse state.
 */
export function findAllUndoActions(
  state: DiscourseState
): readonly DiscourseReferent[] {
  return state.referents.filter(r =>
    r.properties.some(p => p.name === 'action_type' && p.value === 'undo')
  );
}

/**
 * Find which edit was most recently undone.
 */
export function findMostRecentUndo(
  state: DiscourseState
): DiscourseReferent | undefined {
  const undoActions = findAllUndoActions(state);
  if (undoActions.length === 0) return undefined;

  return undoActions.reduce((most, current) =>
    current.turnIntroduced > most.turnIntroduced ? current : most
  );
}

/**
 * Find all edits that have been undone.
 */
export function findUndonEdits(
  state: DiscourseState
): readonly EditHistoryReferent[] {
  return state.editHistory.filter(e => e.summary.startsWith('[UNDONE]'));
}

/**
 * Find the edit that would be repeated by "do that again" after an undo.
 * 
 * This is the most recent valid (non-undone) edit.
 */
export function findRepeatTargetAfterUndo(
  state: DiscourseState
): EditHistoryReferent | undefined {
  return findMostRecentValidEdit(state, '');
}

/**
 * Check if a specific edit has been undone.
 */
export function isEditUndone(
  state: DiscourseState,
  editPackageId: string
): boolean {
  const historyEntry = state.editHistory.find(e => e.editPackageId === editPackageId);
  return historyEntry?.summary.startsWith('[UNDONE]') || false;
}

// ============================================================================
// Redo Integration
// ============================================================================

/**
 * Result of integrating a redo into discourse state.
 */
export interface DiscourseRedoIntegrationResult {
  /** Updated discourse state */
  readonly discourseState: DiscourseState;

  /** The edit that was redone */
  readonly redoneEditReferentId: ReferentId | undefined;

  /** Referents whose salience was boosted */
  readonly boostedReferents: readonly ReferentId[];

  /** The redo action referent (if created) */
  readonly redoActionReferentId: ReferentId | undefined;
}

/**
 * Information about a redo operation.
 */
export interface RedoOperation {
  /** The edit package that was redone */
  readonly redoneEditPackage: EditPackage;

  /** When the redo happened */
  readonly redoTimestamp: number;

  /** Was this an explicit user redo? */
  readonly explicit: boolean;
}

/**
 * Integrate a redo operation into the discourse state.
 * 
 * When an edit is redone, we need to:
 * 1. Un-mark it as undone
 * 2. Restore salience to affected entities
 * 3. Record the redo action
 * 
 * @param discourseState Current discourse state
 * @param redoOp The redo operation information
 * @param config Integration configuration
 * @returns Updated discourse state and integration metadata
 */
export function integrateRedoIntoDiscourse(
  discourseState: DiscourseState,
  redoOp: RedoOperation,
  config: DiscourseUndoIntegrationConfig = DEFAULT_DISCOURSE_UNDO_CONFIG
): DiscourseRedoIntegrationResult {
  let state = discourseState;
  const boostedReferents: ReferentId[] = [];
  let redoneEditReferentId: ReferentId | undefined = undefined;
  let redoActionReferentId: ReferentId | undefined = undefined;

  const turnNumber = state.currentTurn;
  const editPackageId = redoOp.redoneEditPackage.id;

  // Step 1: Find the edit referent
  const editReferent = state.referents.find(
    r => r.type === 'edit' && r.worldBinding?.entityId === editPackageId
  );

  if (editReferent) {
    redoneEditReferentId = editReferent.id;

    // Restore its salience
    state = {
      ...state,
      referents: state.referents.map(r => {
        if (r.id === editReferent.id) {
          return {
            ...r,
            salience: Math.min(1.0, r.salience + 0.6), // Boost
            inFocus: true,
            lastMentionedTurn: turnNumber,
            properties: r.properties.filter(p => p.name !== 'undone'), // Remove undone flag
          };
        }
        return r;
      }),
    };
  }

  // Step 2: Un-mark edit history entry
  state = {
    ...state,
    editHistory: state.editHistory.map(entry => {
      if (entry.editPackageId === editPackageId && entry.summary.startsWith('[UNDONE]')) {
        return {
          ...entry,
          summary: entry.summary.replace('[UNDONE] ', ''),
        };
      }
      return entry;
    }),
  };

  // Step 3: Boost salience for affected entities
  const affectedEntityIds = extractAffectedEntityIds(redoOp.redoneEditPackage);
  
  for (const entityId of affectedEntityIds) {
    const referent = state.referents.find(
      r => r.worldBinding?.entityId === entityId
    );

    if (referent) {
      state = {
        ...state,
        referents: state.referents.map(r => {
          if (r.id === referent.id) {
            return {
              ...r,
              salience: Math.min(1.0, r.salience + 0.4),
              lastMentionedTurn: turnNumber,
            };
          }
          return r;
        }),
      };
      boostedReferents.push(referent.id);
    }
  }

  // Step 4: Create referent for redo action
  if (config.recordUndoActions) {
    const redoReferent = createRedoActionReferent(
      redoOp,
      turnNumber,
      redoneEditReferentId,
      config.undoActionSalience
    );
    state = addReferent(state, redoReferent);
    redoActionReferentId = redoReferent.id;
  }

  // Step 5: Add redo to common ground
  const commonGroundEntry: CommonGroundEntry = {
    fact: `Redid: ${redoOp.redoneEditPackage.diff.summary}`,
    turnEstablished: turnNumber,
    method: 'ui_action',
    referents: redoActionReferentId ? [redoActionReferentId] : [],
  };
  state = addToCommonGround(state, commonGroundEntry);

  return {
    discourseState: state,
    redoneEditReferentId,
    boostedReferents,
    redoActionReferentId,
  };
}

/**
 * Create a discourse referent for a redo action.
 */
function createRedoActionReferent(
  redoOp: RedoOperation,
  turnNumber: number,
  redoneEditReferentId: ReferentId | undefined,
  initialSalience: number
): DiscourseReferent {
  const id = createReferentId(`redo-${redoOp.redoneEditPackage.id}`, turnNumber);

  return {
    id,
    displayName: `redo of "${summarizeEdit(redoOp.redoneEditPackage)}"`,
    type: 'edit',
    introducedIn: `drs:t${turnNumber}` as any,
    turnIntroduced: turnNumber,
    introductionSource: {
      type: 'ui_action',
      selectionDescription: 'redo operation',
    },
    salience: initialSalience,
    properties: [
      {
        name: 'action_type',
        value: 'redo',
        source: 'world_state',
        turnEstablished: turnNumber,
      },
      {
        name: 'redid_edit',
        value: redoOp.redoneEditPackage.id,
        source: 'world_state',
        turnEstablished: turnNumber,
      },
      ...(redoneEditReferentId ? [{
        name: 'redid_referent',
        value: redoneEditReferentId,
        source: 'world_state' as const,
        turnEstablished: turnNumber,
      }] : []),
    ],
    worldBinding: {
      entityId: `redo-${redoOp.redoneEditPackage.id}`,
      entityType: 'redo_action',
      displayName: 'redo action',
      details: undefined,
      bindingMethod: 'exact_name_match',
      confidence: 'certain',
    },
    inFocus: true,
    lastMentionedTurn: turnNumber,
  };
}

// ============================================================================
// Explanation Functions
// ============================================================================

/**
 * Generate a human-readable explanation of how an undo affected discourse.
 */
export function explainUndoDiscourseIntegration(
  result: DiscourseUndoIntegrationResult
): string {
  const lines: string[] = [];

  lines.push('Undo Discourse Integration:');
  lines.push('');

  if (result.undonEditReferentId) {
    const ref = result.discourseState.referents.find(r => r.id === result.undonEditReferentId);
    if (ref) {
      lines.push(`Invalidated edit: ${ref.displayName}`);
      lines.push(`  Salience reduced to: ${ref.salience.toFixed(2)}`);
      lines.push('');
    }
  }

  if (result.penalizedReferents.length > 0) {
    lines.push(`Penalized salience for ${result.penalizedReferents.length} entities`);
    lines.push('');
  }

  if (result.undoActionReferentId) {
    const ref = result.discourseState.referents.find(r => r.id === result.undoActionReferentId);
    if (ref) {
      lines.push(`Recorded undo action: ${ref.displayName}`);
      lines.push('');
    }
  }

  if (result.topicUpdated && result.newTopic) {
    lines.push(`Updated topic to: ${result.newTopic.displayName}`);
    lines.push('');
  }

  // Show what "again" would now refer to
  const nextRepeat = findRepeatTargetAfterUndo(result.discourseState);
  if (nextRepeat) {
    lines.push(`"Do that again" would now repeat: ${nextRepeat.summary}`);
  } else {
    lines.push(`"Do that again" has no valid target`);
  }

  return lines.join('\n');
}

/**
 * Generate a human-readable explanation of how a redo affected discourse.
 */
export function explainRedoDiscourseIntegration(
  result: DiscourseRedoIntegrationResult
): string {
  const lines: string[] = [];

  lines.push('Redo Discourse Integration:');
  lines.push('');

  if (result.redoneEditReferentId) {
    const ref = result.discourseState.referents.find(r => r.id === result.redoneEditReferentId);
    if (ref) {
      lines.push(`Restored edit: ${ref.displayName}`);
      lines.push(`  Salience: ${ref.salience.toFixed(2)}`);
      lines.push('');
    }
  }

  if (result.boostedReferents.length > 0) {
    lines.push(`Boosted salience for ${result.boostedReferents.length} entities`);
    lines.push('');
  }

  if (result.redoActionReferentId) {
    const ref = result.discourseState.referents.find(r => r.id === result.redoActionReferentId);
    if (ref) {
      lines.push(`Recorded redo action: ${ref.displayName}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}
