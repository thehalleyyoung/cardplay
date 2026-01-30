/**
 * @file Discourse-Edit Integration
 * @module gofai/pragmatics/discourse-edit-integration
 * 
 * Implements Step 346: Integrate the dialogue state with applied edits.
 * After apply, update salience and discourse referents to stabilize subsequent pronouns.
 * 
 * When an edit is successfully applied, the discourse model must be updated to:
 * 1. Boost salience of entities that were targeted by the edit
 * 2. Record the edit itself as a discourse referent (for "that edit", "undo that")
 * 3. Update the current topic if the edit changed focus
 * 4. Add edit results to common ground
 * 5. Refresh entity bindings if new entities were created
 * 
 * This ensures that subsequent utterances like "make it brighter" or "undo that"
 * resolve correctly to the just-edited entities.
 * 
 * @see gofai_goalB.md Step 346
 * @see discourse-model.ts for base discourse types
 */

import type {
  DiscourseState,
  DiscourseReferent,
  ReferentId,
  ReferentType,
  EditHistoryReferent,
  SalienceBoost,
  CommonGroundEntry,
  TopicFrame,
  WorldBinding,
} from './discourse-model.js';

import {
  addReferent,
  boostReferent,
  recordEdit,
  addToCommonGround,
  setTopic,
  createReferentId,
  DEFAULT_SALIENCE_PARAMS,
} from './discourse-model.js';

import type {
  EditPackage,
  DiffChange,
  ExecutionDiff,
} from '../execution/edit-package.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration for discourse-edit integration.
 */
export interface DiscourseEditIntegrationConfig {
  /** Should we auto-update topic after edits? */
  readonly autoUpdateTopic: boolean;

  /** Should we create referents for newly created entities? */
  readonly createReferentsForNewEntities: boolean;

  /** Should we boost salience for modified entities? */
  readonly boostModifiedEntities: boolean;

  /** Should we add edit results to common ground? */
  readonly addToCommonGround: boolean;

  /** Salience boost amount for edit targets */
  readonly editTargetBoost: number;

  /** Salience boost amount for newly created entities */
  readonly newEntityBoost: number;
}

/**
 * Default configuration.
 */
export const DEFAULT_DISCOURSE_EDIT_CONFIG: DiscourseEditIntegrationConfig = {
  autoUpdateTopic: true,
  createReferentsForNewEntities: true,
  boostModifiedEntities: true,
  addToCommonGround: true,
  editTargetBoost: 0.6,
  newEntityBoost: 0.4,
};

/**
 * Result of integrating an edit into discourse state.
 */
export interface DiscourseEditIntegrationResult {
  /** Updated discourse state */
  readonly discourseState: DiscourseState;

  /** Referents that were created */
  readonly createdReferents: readonly ReferentId[];

  /** Referents that were boosted */
  readonly boostedReferents: readonly ReferentId[];

  /** Whether the topic was updated */
  readonly topicUpdated: boolean;

  /** New topic (if updated) */
  readonly newTopic: TopicFrame | undefined;
}

// ============================================================================
// Main Integration Function
// ============================================================================

/**
 * Integrate an applied edit package into the discourse state.
 * 
 * This is called after an edit is successfully applied to update the
 * discourse model so that subsequent references work correctly.
 * 
 * @param discourseState Current discourse state
 * @param editPackage The edit package that was applied
 * @param config Integration configuration
 * @returns Updated discourse state and integration metadata
 */
export function integrateEditIntoDiscourse(
  discourseState: DiscourseState,
  editPackage: EditPackage,
  config: DiscourseEditIntegrationConfig = DEFAULT_DISCOURSE_EDIT_CONFIG
): DiscourseEditIntegrationResult {
  let state = discourseState;
  const createdReferents: ReferentId[] = [];
  const boostedReferents: ReferentId[] = [];
  let topicUpdated = false;
  let newTopic: TopicFrame | undefined = undefined;

  const turnNumber = state.currentTurn;

  // Step 1: Record the edit itself as a referent
  const editReferent = createEditReferent(editPackage, turnNumber, state);
  state = addReferent(state, editReferent);
  createdReferents.push(editReferent.id);

  // Step 2: Add to edit history
  const editHistoryEntry = createEditHistoryEntry(editPackage, turnNumber, editReferent.id);
  state = recordEdit(state, editHistoryEntry);

  // Step 3: Boost salience of targeted entities
  if (config.boostModifiedEntities) {
    const targetedEntityIds = extractTargetedEntities(editPackage.diff);
    for (const entityId of targetedEntityIds) {
      // Find existing referent for this entity
      const existingReferent = state.referents.find(
        r => r.worldBinding?.entityId === entityId
      );

      if (existingReferent) {
        const boost: SalienceBoost = {
          type: 'edit_target',
          turnNumber,
        };
        state = boostReferent(state, existingReferent.id, boost);
        boostedReferents.push(existingReferent.id);
      }
    }
  }

  // Step 4: Create referents for newly created entities
  if (config.createReferentsForNewEntities) {
    const newEntities = extractNewEntities(editPackage.diff);
    for (const entityInfo of newEntities) {
      const newReferent = createEntityReferent(
        entityInfo,
        turnNumber,
        editPackage.id,
        state,
        config.newEntityBoost
      );
      state = addReferent(state, newReferent);
      createdReferents.push(newReferent.id);
    }
  }

  // Step 5: Update topic if the edit changed the primary scope
  if (config.autoUpdateTopic) {
    const primaryScope = determinePrimaryScope(editPackage);
    if (primaryScope) {
      // Find or create referent for the scope
      const scopeReferent = findOrCreateScopeReferent(primaryScope, state, turnNumber);
      if (scopeReferent) {
        newTopic = {
          focus: scopeReferent.id,
          focusType: scopeReferent.type,
          displayName: scopeReferent.displayName,
          turnSet: turnNumber,
          explicit: false, // Inferred from edit
        };
        state = setTopic(state, newTopic);
        topicUpdated = true;
      }
    }
  }

  // Step 6: Add edit results to common ground
  if (config.addToCommonGround) {
    const commonGroundEntry: CommonGroundEntry = {
      fact: editPackage.diff.summary,
      turnEstablished: turnNumber,
      method: 'ui_action',
      referents: [editReferent.id, ...boostedReferents],
    };
    state = addToCommonGround(state, commonGroundEntry);
  }

  return {
    discourseState: state,
    createdReferents,
    boostedReferents,
    topicUpdated,
    newTopic,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a discourse referent for an edit package.
 */
function createEditReferent(
  editPackage: EditPackage,
  turnNumber: number,
  state: DiscourseState
): DiscourseReferent {
  const id = createReferentId(`edit-${editPackage.id}`, turnNumber);

  return {
    id,
    displayName: summarizeEdit(editPackage),
    type: 'edit',
    introducedIn: `drs:t${turnNumber}` as any, // DRS for this turn
    turnIntroduced: turnNumber,
    introductionSource: {
      type: 'edit_result',
      editPackageId: editPackage.id,
    },
    salience: 0.8, // High initial salience
    properties: [
      {
        name: 'status',
        value: editPackage.status.type,
        source: 'world_state',
        turnEstablished: turnNumber,
      },
      {
        name: 'summary',
        value: editPackage.diff.summary,
        source: 'world_state',
        turnEstablished: turnNumber,
      },
    ],
    worldBinding: {
      entityId: editPackage.id,
      entityType: 'edit_package',
      displayName: summarizeEdit(editPackage),
      details: undefined,
      bindingMethod: 'exact_name_match',
      confidence: 'certain',
    },
    inFocus: true,
    lastMentionedTurn: turnNumber,
  };
}

/**
 * Create an edit history entry.
 */
function createEditHistoryEntry(
  editPackage: EditPackage,
  turnNumber: number,
  referentId: ReferentId
): EditHistoryReferent {
  // Extract scope from intent
  const scope = editPackage.intent.scope;
  const scopeReferentId = extractScopeReferentId(scope);

  // Extract axis from goals
  const axis = extractPrimaryAxis(editPackage.intent.goals);

  // Extract direction
  const direction = extractDirection(editPackage.intent.goals);

  // Extract touched layers
  const layersTouched = extractTouchedLayers(editPackage.diff);

  return {
    editPackageId: editPackage.id,
    turnNumber,
    summary: editPackage.diff.summary,
    scope: scopeReferentId,
    axis,
    direction,
    layersTouched,
    referentId,
  };
}

/**
 * Summarize an edit for display.
 */
function summarizeEdit(editPackage: EditPackage): string {
  const utterance = editPackage.intent.provenance.utterance;
  const summary = editPackage.diff.summary;
  
  // Use first 50 chars of utterance or summary
  const text = utterance.length > 0 ? utterance : summary;
  return text.length > 50 ? text.substring(0, 47) + '...' : text;
}

/**
 * Extract entity IDs that were targeted by the edit.
 */
function extractTargetedEntities(diff: ExecutionDiff): string[] {
  const entityIds = new Set<string>();

  for (const change of diff.changes) {
    entityIds.add(change.entityId);
  }

  return Array.from(entityIds);
}

/**
 * Extract newly created entities from the diff.
 */
function extractNewEntities(diff: ExecutionDiff): NewEntityInfo[] {
  const newEntities: NewEntityInfo[] = [];

  for (const change of diff.changes) {
    if (change.type === 'added') {
      const entityInfo = extractEntityInfo(change, diff);
      if (entityInfo) {
        newEntities.push(entityInfo);
      }
    }
  }

  return newEntities;
}

/**
 * Information about a newly created entity.
 */
interface NewEntityInfo {
  readonly entityId: string;
  readonly entityType: ReferentType;
  readonly displayName: string;
  readonly details: string | undefined;
}

/**
 * Extract entity info from a diff change.
 */
function extractEntityInfo(
  change: DiffChange,
  diff: ExecutionDiff
): NewEntityInfo | undefined {
  // Map entity type to referent type
  const referentType = mapEntityTypeToReferentType(change.entityType);
  if (!referentType) return undefined;

  // Get display name from after snapshot
  const displayName = getEntityDisplayName(change.entityId, change.entityType, diff.after);

  return {
    entityId: change.entityId,
    entityType: referentType,
    displayName,
    details: undefined,
  };
}

/**
 * Map diff entity type to referent type.
 */
function mapEntityTypeToReferentType(
  entityType: string
): ReferentType | undefined {
  switch (entityType) {
    case 'event':
      return 'event_set';
    case 'track':
      return 'layer';
    case 'card':
      return 'card';
    case 'section':
      return 'section';
    default:
      return undefined;
  }
}

/**
 * Get display name for an entity.
 */
function getEntityDisplayName(
  entityId: string,
  entityType: string,
  snapshot: any
): string {
  // Look up in snapshot
  switch (entityType) {
    case 'track': {
      const track = snapshot.tracks?.find((t: any) => t.id === entityId);
      return track?.name || entityId;
    }
    case 'card': {
      const card = snapshot.cards?.find((c: any) => c.id === entityId);
      return card?.type || entityId;
    }
    case 'section': {
      const section = snapshot.sections?.find((s: any) => s.id === entityId);
      return section?.name || entityId;
    }
    default:
      return entityId;
  }
}

/**
 * Create a discourse referent for a newly created entity.
 */
function createEntityReferent(
  entityInfo: NewEntityInfo,
  turnNumber: number,
  editPackageId: string,
  state: DiscourseState,
  initialSalience: number
): DiscourseReferent {
  const id = createReferentId(`entity-${entityInfo.entityId}`, turnNumber);

  return {
    id,
    displayName: entityInfo.displayName,
    type: entityInfo.entityType,
    introducedIn: `drs:t${turnNumber}` as any,
    turnIntroduced: turnNumber,
    introductionSource: {
      type: 'edit_result',
      editPackageId,
    },
    salience: initialSalience,
    properties: [],
    worldBinding: {
      entityId: entityInfo.entityId,
      entityType: entityInfo.entityType,
      displayName: entityInfo.displayName,
      details: entityInfo.details,
      bindingMethod: 'exact_name_match',
      confidence: 'certain',
    },
    inFocus: false,
    lastMentionedTurn: turnNumber,
  };
}

/**
 * Determine the primary scope of an edit.
 */
function determinePrimaryScope(editPackage: EditPackage): PrimaryScopeInfo | undefined {
  const scope = editPackage.intent.scope;

  // Extract scope information
  switch (scope.type) {
    case 'section': {
      const data = scope.data as any;
      return {
        type: 'section',
        entityId: data.sectionId || '',
        displayName: data.sectionName || 'section',
      };
    }
    case 'layer': {
      const data = scope.data as any;
      return {
        type: 'layer',
        entityId: data.layerId || '',
        displayName: data.layerName || 'layer',
      };
    }
    case 'range': {
      const data = scope.data as any;
      return {
        type: 'range',
        entityId: `range-${data.startBar}-${data.endBar}`,
        displayName: `bars ${data.startBar}-${data.endBar}`,
      };
    }
    default:
      return undefined;
  }
}

interface PrimaryScopeInfo {
  readonly type: ReferentType;
  readonly entityId: string;
  readonly displayName: string;
}

/**
 * Find or create a referent for a scope.
 */
function findOrCreateScopeReferent(
  scopeInfo: PrimaryScopeInfo,
  state: DiscourseState,
  turnNumber: number
): DiscourseReferent | undefined {
  // Try to find existing referent
  const existing = state.referents.find(
    r => r.worldBinding?.entityId === scopeInfo.entityId && r.type === scopeInfo.type
  );

  if (existing) {
    return existing;
  }

  // Create new referent
  const id = createReferentId(`scope-${scopeInfo.entityId}`, turnNumber);

  return {
    id,
    displayName: scopeInfo.displayName,
    type: scopeInfo.type,
    introducedIn: `drs:t${turnNumber}` as any,
    turnIntroduced: turnNumber,
    introductionSource: {
      type: 'inferred',
      inferenceRule: 'edit-scope-extraction',
    },
    salience: 0.5,
    properties: [],
    worldBinding: {
      entityId: scopeInfo.entityId,
      entityType: scopeInfo.type,
      displayName: scopeInfo.displayName,
      details: undefined,
      bindingMethod: 'exact_name_match',
      confidence: 'certain',
    },
    inFocus: true,
    lastMentionedTurn: turnNumber,
  };
}

/**
 * Extract scope referent ID from scope.
 */
function extractScopeReferentId(scope: any): ReferentId | undefined {
  // This would need to be coordinated with pragmatic resolution
  // For now, return undefined
  return undefined;
}

/**
 * Extract primary axis from goals.
 */
function extractPrimaryAxis(goals: readonly any[]): string | undefined {
  for (const goal of goals) {
    if (goal.type === 'axis-change') {
      const data = goal.data as any;
      return data.axis || undefined;
    }
  }
  return undefined;
}

/**
 * Extract direction from goals.
 */
function extractDirection(goals: readonly any[]): string | undefined {
  for (const goal of goals) {
    if (goal.type === 'axis-change') {
      const data = goal.data as any;
      return data.direction || undefined;
    }
  }
  return undefined;
}

/**
 * Extract layers touched by the edit.
 */
function extractTouchedLayers(diff: ExecutionDiff): string[] {
  const layers = new Set<string>();

  for (const change of diff.changes) {
    if (change.entityType === 'event' || change.entityType === 'track' || change.entityType === 'card') {
      // Extract track ID from entity
      const snapshot = diff.after;
      if (change.entityType === 'track') {
        layers.add(change.entityId);
      } else if (change.entityType === 'event') {
        const event = snapshot.events?.find((e: any) => e.id === change.entityId);
        if (event?.trackId) {
          layers.add(event.trackId);
        }
      } else if (change.entityType === 'card') {
        const card = snapshot.cards?.find((c: any) => c.id === change.entityId);
        if (card?.trackId) {
          layers.add(card.trackId);
        }
      }
    }
  }

  return Array.from(layers);
}

// ============================================================================
// Batch Integration
// ============================================================================

/**
 * Integrate multiple edit packages into discourse state (e.g., for replay).
 * 
 * @param discourseState Initial discourse state
 * @param editPackages Edit packages to integrate
 * @param config Integration configuration
 * @returns Final discourse state and aggregated metadata
 */
export function integrateMultipleEditsIntoDiscourse(
  discourseState: DiscourseState,
  editPackages: readonly EditPackage[],
  config: DiscourseEditIntegrationConfig = DEFAULT_DISCOURSE_EDIT_CONFIG
): {
  readonly discourseState: DiscourseState;
  readonly integrationResults: readonly DiscourseEditIntegrationResult[];
} {
  let state = discourseState;
  const results: DiscourseEditIntegrationResult[] = [];

  for (const editPackage of editPackages) {
    const result = integrateEditIntoDiscourse(state, editPackage, config);
    state = result.discourseState;
    results.push(result);
  }

  return {
    discourseState: state,
    integrationResults: results,
  };
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Find the most recent edit referent in discourse state.
 * 
 * Useful for resolving "that edit", "the last change", etc.
 */
export function findMostRecentEdit(
  state: DiscourseState
): DiscourseReferent | undefined {
  const editReferents = state.referents
    .filter(r => r.type === 'edit')
    .sort((a, b) => b.turnIntroduced - a.turnIntroduced);

  return editReferents[0];
}

/**
 * Find all edits that affected a specific entity.
 * 
 * Useful for queries like "what changed the chorus?" or "show me all edits to the bass".
 */
export function findEditsAffectingEntity(
  state: DiscourseState,
  entityId: string
): readonly EditHistoryReferent[] {
  return state.editHistory.filter(edit =>
    edit.layersTouched.includes(entityId) ||
    edit.scope?.includes(entityId)
  );
}

/**
 * Find edits by axis.
 * 
 * Useful for queries like "show me all brightness changes".
 */
export function findEditsByAxis(
  state: DiscourseState,
  axis: string
): readonly EditHistoryReferent[] {
  return state.editHistory.filter(edit => edit.axis === axis);
}

/**
 * Find edits in a specific scope.
 * 
 * Useful for queries like "what did I change in the chorus?".
 */
export function findEditsByScope(
  state: DiscourseState,
  scopeReferentId: ReferentId
): readonly EditHistoryReferent[] {
  return state.editHistory.filter(edit => edit.scope === scopeReferentId);
}

// ============================================================================
// Explanation Functions
// ============================================================================

/**
 * Generate a human-readable explanation of how an edit affected discourse.
 * 
 * Useful for debugging and user feedback.
 */
export function explainDiscourseIntegration(
  result: DiscourseEditIntegrationResult
): string {
  const lines: string[] = [];

  lines.push('Discourse Integration:');
  lines.push('');

  if (result.createdReferents.length > 0) {
    lines.push(`Created ${result.createdReferents.length} new referents:`);
    for (const id of result.createdReferents) {
      const ref = result.discourseState.referents.find(r => r.id === id);
      if (ref) {
        lines.push(`  - ${ref.displayName} (${ref.type})`);
      }
    }
    lines.push('');
  }

  if (result.boostedReferents.length > 0) {
    lines.push(`Boosted salience for ${result.boostedReferents.length} referents:`);
    for (const id of result.boostedReferents) {
      const ref = result.discourseState.referents.find(r => r.id === id);
      if (ref) {
        lines.push(`  - ${ref.displayName} (salience: ${ref.salience.toFixed(2)})`);
      }
    }
    lines.push('');
  }

  if (result.topicUpdated && result.newTopic) {
    lines.push(`Updated topic to: ${result.newTopic.displayName}`);
    lines.push('');
  }

  return lines.join('\n');
}
