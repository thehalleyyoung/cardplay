/**
 * @file UI-Only vs Project Mutation Actions
 * @module gofai/canon/ui-only-vs-mutation-actions
 * 
 * Implements Step 083: Define "UI-only actions" vs "project mutation actions"
 * with distinct effect types (prevents conflating navigation with edits).
 * 
 * This is a critical safety feature. GOFAI must distinguish between:
 * - **UI-only actions**: Change UI state, selection, focus, view — no project mutation
 * - **Project mutations**: Change project content — auditable, undoable, risky
 * 
 * Conflating these is dangerous because:
 * 1. UI actions should never appear in undo history
 * 2. Mutations should never silently occur during navigation
 * 3. Clarification questions need to know if they'll mutate
 * 4. Preview mode should block mutations but allow UI actions
 * 
 * Design principles:
 * - Type-level separation: Different action types, not a flag
 * - Effect system: Actions declare their effects explicitly
 * - Composition rules: Cannot mix UI-only and mutation in one plan
 * - Verification: Runtime checks enforce separation
 * 
 * @see gofai_goalB.md Step 083
 * @see docs/gofai/action-safety.md
 */

import type { GofaiId, OpcodeId } from './types.js';

// ============================================================================
// Action Effect Taxonomy
// ============================================================================

/**
 * The fundamental effect types for GOFAI actions.
 * 
 * This is inspired by effect systems in programming languages (e.g., Haskell IO,
 * Rust's Send/Sync, TypeScript's async). Actions declare what they do, and the
 * system enforces valid compositions.
 */
export type ActionEffect =
  | UIEffect
  | MutationEffect
  | InspectionEffect
  | CompositeEffect;

/**
 * UI-only effects.
 * 
 * These change UI state but never project content.
 * - Always allowed in preview mode
 * - Never generate undo tokens
 * - Never logged to project history
 * - Can be batched without transactions
 */
export type UIEffect =
  | { readonly type: 'ui:nav:selection'; readonly target: SelectionTarget }
  | { readonly type: 'ui:nav:focus'; readonly target: FocusTarget }
  | { readonly type: 'ui:nav:scroll'; readonly target: ScrollTarget }
  | { readonly type: 'ui:nav:zoom'; readonly target: ZoomTarget }
  | { readonly type: 'ui:display:highlight'; readonly target: HighlightTarget }
  | { readonly type: 'ui:display:filter'; readonly target: FilterTarget }
  | { readonly type: 'ui:playback:control'; readonly action: PlaybackAction }
  | { readonly type: 'ui:dialog:show'; readonly dialog: DialogType }
  | { readonly type: 'ui:dialog:dismiss'; readonly dialog: DialogType }
  | { readonly type: 'ui:panel:toggle'; readonly panel: PanelId }
  | { readonly type: 'ui:panel:resize'; readonly panel: PanelId; readonly size: number };

/**
 * Project mutation effects.
 * 
 * These change project content.
 * - Blocked in preview mode (or require explicit apply)
 * - Generate undo tokens
 * - Logged to project history
 * - Must be in transactions
 * - Require capability checks
 */
export type MutationEffect =
  | { readonly type: 'mutate:event:create'; readonly scope: Scope }
  | { readonly type: 'mutate:event:delete'; readonly scope: Scope }
  | { readonly type: 'mutate:event:modify'; readonly scope: Scope }
  | { readonly type: 'mutate:structure:section'; readonly action: 'add' | 'remove' | 'move' }
  | { readonly type: 'mutate:structure:track'; readonly action: 'add' | 'remove' | 'move' }
  | { readonly type: 'mutate:structure:marker'; readonly action: 'add' | 'remove' | 'move' }
  | { readonly type: 'mutate:card:add'; readonly target: CardTarget }
  | { readonly type: 'mutate:card:remove'; readonly target: CardTarget }
  | { readonly type: 'mutate:card:param'; readonly target: CardTarget; readonly param: string }
  | { readonly type: 'mutate:routing:connect'; readonly from: PortRef; readonly to: PortRef }
  | { readonly type: 'mutate:routing:disconnect'; readonly from: PortRef; readonly to: PortRef }
  | { readonly type: 'mutate:metadata:rename'; readonly target: EntityRef }
  | { readonly type: 'mutate:metadata:tag'; readonly target: EntityRef };

/**
 * Inspection effects.
 * 
 * These read project state but never change anything.
 * - Always allowed
 * - No side effects
 * - Can be cached
 * - Pure functions
 */
export type InspectionEffect =
  | { readonly type: 'inspect:query:harmony'; readonly scope: Scope }
  | { readonly type: 'inspect:query:rhythm'; readonly scope: Scope }
  | { readonly type: 'inspect:query:structure'; readonly scope: Scope }
  | { readonly type: 'inspect:query:playback' }
  | { readonly type: 'inspect:analysis:key'; readonly scope: Scope }
  | { readonly type: 'inspect:analysis:tempo'; readonly scope: Scope }
  | { readonly type: 'inspect:analysis:density'; readonly scope: Scope };

/**
 * Composite effects.
 * 
 * An action can have multiple effects, but with restrictions:
 * - UI effects can be combined freely
 * - Mutation effects can be combined (all in same transaction)
 * - UI effects and mutations CANNOT be combined (prevented by type system)
 * - Inspection effects can combine with anything (read-only)
 */
export type CompositeEffect =
  | { readonly type: 'composite:ui'; readonly effects: readonly UIEffect[] }
  | { readonly type: 'composite:mutation'; readonly effects: readonly MutationEffect[] }
  | { readonly type: 'composite:ui-with-inspection'; readonly ui: readonly UIEffect[]; readonly inspection: readonly InspectionEffect[] };

// ============================================================================
// Action Types
// ============================================================================

/**
 * A UI-only action.
 * 
 * Guaranteed by construction to have no mutation effects.
 */
export interface UIAction {
  readonly kind: 'ui-action';
  readonly id: GofaiId;
  readonly name: string;
  readonly description: string;
  readonly effects: UIEffect | CompositeEffect & { readonly type: 'composite:ui' | 'composite:ui-with-inspection' };
  readonly opcodeId: OpcodeId;
  readonly reversible: boolean; // Can this UI action be reversed? (e.g., selection can be restored)
}

/**
 * A project mutation action.
 * 
 * Guaranteed by construction to have mutation effects.
 */
export interface MutationAction {
  readonly kind: 'mutation-action';
  readonly id: GofaiId;
  readonly name: string;
  readonly description: string;
  readonly effects: MutationEffect | CompositeEffect & { readonly type: 'composite:mutation' };
  readonly opcodeId: OpcodeId;
  readonly undoable: boolean;
  readonly risk: 'low' | 'medium' | 'high'; // How risky is this mutation?
  readonly requiresConfirmation: boolean;
}

/**
 * An inspection action.
 * 
 * Pure, read-only, no side effects.
 */
export interface InspectionAction {
  readonly kind: 'inspection-action';
  readonly id: GofaiId;
  readonly name: string;
  readonly description: string;
  readonly effects: InspectionEffect;
  readonly opcodeId: OpcodeId;
  readonly cacheable: boolean;
}

/**
 * Tagged union of all action types.
 */
export type Action = UIAction | MutationAction | InspectionAction;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if an action is UI-only.
 */
export function isUIAction(action: Action): action is UIAction {
  return action.kind === 'ui-action';
}

/**
 * Check if an action is a mutation.
 */
export function isMutationAction(action: Action): action is MutationAction {
  return action.kind === 'mutation-action';
}

/**
 * Check if an action is inspection-only.
 */
export function isInspectionAction(action: Action): action is InspectionAction {
  return action.kind === 'inspection-action';
}

/**
 * Check if an action is safe (non-mutating).
 */
export function isSafeAction(action: Action): action is UIAction | InspectionAction {
  return isUIAction(action) || isInspectionAction(action);
}

// ============================================================================
// Effect Analysis
// ============================================================================

/**
 * Extract all effects from an action.
 */
export function getEffects(action: Action): readonly ActionEffect[] {
  const effects: ActionEffect[] = [];
  
  if (action.kind === 'ui-action' || action.kind === 'mutation-action') {
    if ('type' in action.effects) {
      if (action.effects.type === 'composite:ui') {
        effects.push(...action.effects.effects);
      } else if (action.effects.type === 'composite:mutation') {
        effects.push(...action.effects.effects);
      } else if (action.effects.type === 'composite:ui-with-inspection') {
        effects.push(...action.effects.ui);
        effects.push(...action.effects.inspection);
      } else {
        effects.push(action.effects);
      }
    }
  } else if (action.kind === 'inspection-action') {
    effects.push(action.effects);
  }
  
  return effects;
}

/**
 * Check if an action has any mutation effects.
 */
export function hasMutationEffects(action: Action): boolean {
  const effects = getEffects(action);
  return effects.some(eff => 'type' in eff && eff.type.startsWith('mutate:'));
}

/**
 * Check if an action has any UI effects.
 */
export function hasUIEffects(action: Action): boolean {
  const effects = getEffects(action);
  return effects.some(eff => 'type' in eff && eff.type.startsWith('ui:'));
}

/**
 * Check if an action has any inspection effects.
 */
export function hasInspectionEffects(action: Action): boolean {
  const effects = getEffects(action);
  return effects.some(eff => 'type' in eff && eff.type.startsWith('inspect:'));
}

// ============================================================================
// Action Composition Rules
// ============================================================================

/**
 * Result of composing actions.
 */
export interface ActionCompositionResult {
  readonly valid: boolean;
  readonly composite?: Action;
  readonly errors: readonly string[];
}

/**
 * Compose multiple actions into one.
 * 
 * Rules:
 * - UI actions can compose with UI actions → UI action
 * - Mutation actions can compose with mutations → Mutation action
 * - UI actions CANNOT compose with mutations → Error
 * - Inspection actions can compose with anything (decorative)
 */
export function composeActions(actions: readonly Action[]): ActionCompositionResult {
  if (actions.length === 0) {
    return {
      valid: false,
      errors: ['Cannot compose empty action list'],
    };
  }
  
  if (actions.length === 1) {
    const [action] = actions;
    return {
      valid: true,
      composite: action,
      errors: [],
    };
  }
  
  const hasUI = actions.some(hasUIEffects);
  const hasMutation = actions.some(hasMutationEffects);
  
  // UI + Mutation is forbidden
  if (hasUI && hasMutation) {
    return {
      valid: false,
      errors: [
        'Cannot mix UI-only actions with project mutations',
        'UI actions: ' + actions.filter(hasUIEffects).map(a => a.name).join(', '),
        'Mutation actions: ' + actions.filter(hasMutationEffects).map(a => a.name).join(', '),
      ],
    };
  }
  
  // All UI actions
  if (hasUI && !hasMutation) {
    const uiEffects: UIEffect[] = [];
    const inspectionEffects: InspectionEffect[] = [];
    
    for (const action of actions) {
      const effects = getEffects(action);
      for (const eff of effects) {
        if ('type' in eff) {
          if (eff.type.startsWith('ui:')) {
            uiEffects.push(eff as UIEffect);
          } else if (eff.type.startsWith('inspect:')) {
            inspectionEffects.push(eff as InspectionEffect);
          }
        }
      }
    }
    
    const compositeEffect: CompositeEffect = inspectionEffects.length > 0
      ? { type: 'composite:ui-with-inspection', ui: uiEffects, inspection: inspectionEffects }
      : { type: 'composite:ui', effects: uiEffects };
    
    return {
      valid: true,
      composite: {
        kind: 'ui-action',
        id: 'gofai:action:composite-ui' as GofaiId,
        name: 'Composite UI Action',
        description: actions.map(a => a.name).join(' + '),
        effects: compositeEffect,
        opcodeId: 'op:composite-ui' as OpcodeId,
        reversible: actions.every(a => isUIAction(a) && a.reversible),
      },
      errors: [],
    };
  }
  
  // All mutations
  if (hasMutation) {
    const mutationEffects: MutationEffect[] = [];
    
    for (const action of actions) {
      const effects = getEffects(action);
      for (const eff of effects) {
        if ('type' in eff && eff.type.startsWith('mutate:')) {
          mutationEffects.push(eff as MutationEffect);
        }
      }
    }
    
    const compositeEffect: CompositeEffect = {
      type: 'composite:mutation',
      effects: mutationEffects,
    };
    
    const maxRisk = getMaxRisk(actions.filter(isMutationAction).map(a => a.risk));
    
    return {
      valid: true,
      composite: {
        kind: 'mutation-action',
        id: 'gofai:action:composite-mutation' as GofaiId,
        name: 'Composite Mutation',
        description: actions.map(a => a.name).join(' + '),
        effects: compositeEffect,
        opcodeId: 'op:composite-mutation' as OpcodeId,
        undoable: actions.every(a => isMutationAction(a) && a.undoable),
        risk: maxRisk,
        requiresConfirmation: maxRisk === 'high' || actions.some(a => isMutationAction(a) && a.requiresConfirmation),
      },
      errors: [],
    };
  }
  
  // All inspection (shouldn't normally happen as standalone, but valid)
  return {
    valid: true,
    composite: actions[0],
    errors: [],
  };
}

function getMaxRisk(risks: readonly ('low' | 'medium' | 'high')[]): 'low' | 'medium' | 'high' {
  if (risks.includes('high')) return 'high';
  if (risks.includes('medium')) return 'medium';
  return 'low';
}

// ============================================================================
// Effect Type Definitions (for reference)
// ============================================================================

type SelectionTarget = { readonly type: 'notes' | 'events' | 'section' | 'track'; readonly ids: readonly string[] };
type FocusTarget = { readonly type: 'deck' | 'panel' | 'card'; readonly id: string };
type ScrollTarget = { readonly type: 'timeline' | 'piano-roll'; readonly position: number };
type ZoomTarget = { readonly type: 'timeline' | 'piano-roll'; readonly level: number };
type HighlightTarget = { readonly entities: readonly string[]; readonly temporary: boolean };
type FilterTarget = { readonly layer?: string; readonly eventKind?: string };
type PlaybackAction = 'play' | 'pause' | 'stop' | 'seek' | 'loop';
type DialogType = 'clarification' | 'confirmation' | 'error' | 'info';
type PanelId = string;

type Scope = { readonly type: 'section' | 'track' | 'range' | 'selection'; readonly id: string };
type CardTarget = { readonly trackId: string; readonly cardId: string };
type PortRef = { readonly cardId: string; readonly portId: string };
type EntityRef = { readonly type: 'track' | 'section' | 'card'; readonly id: string };

// ============================================================================
// Action Registry
// ============================================================================

/**
 * Core UI-only actions.
 */
export const UI_ACTIONS: readonly UIAction[] = [
  {
    kind: 'ui-action',
    id: 'gofai:action:select-section' as GofaiId,
    name: 'Select Section',
    description: 'Change selection to a specific section',
    effects: { type: 'ui:nav:selection', target: { type: 'section', ids: [] } },
    opcodeId: 'op:select-section' as OpcodeId,
    reversible: true,
  },
  {
    kind: 'ui-action',
    id: 'gofai:action:focus-deck' as GofaiId,
    name: 'Focus Deck',
    description: 'Change focus to a specific deck',
    effects: { type: 'ui:nav:focus', target: { type: 'deck', id: '' } },
    opcodeId: 'op:focus-deck' as OpcodeId,
    reversible: true,
  },
  {
    kind: 'ui-action',
    id: 'gofai:action:play' as GofaiId,
    name: 'Play',
    description: 'Start playback',
    effects: { type: 'ui:playback:control', action: 'play' },
    opcodeId: 'op:playback-play' as OpcodeId,
    reversible: true,
  },
  {
    kind: 'ui-action',
    id: 'gofai:action:pause' as GofaiId,
    name: 'Pause',
    description: 'Pause playback',
    effects: { type: 'ui:playback:control', action: 'pause' },
    opcodeId: 'op:playback-pause' as OpcodeId,
    reversible: true,
  },
];

/**
 * Core mutation actions.
 */
export const MUTATION_ACTIONS: readonly MutationAction[] = [
  {
    kind: 'mutation-action',
    id: 'gofai:action:delete-events' as GofaiId,
    name: 'Delete Events',
    description: 'Remove events from the project',
    effects: { type: 'mutate:event:delete', scope: { type: 'selection', id: '' } },
    opcodeId: 'op:delete-events' as OpcodeId,
    undoable: true,
    risk: 'medium',
    requiresConfirmation: false,
  },
  {
    kind: 'mutation-action',
    id: 'gofai:action:add-track' as GofaiId,
    name: 'Add Track',
    description: 'Add a new track to the project',
    effects: { type: 'mutate:structure:track', action: 'add' },
    opcodeId: 'op:add-track' as OpcodeId,
    undoable: true,
    risk: 'low',
    requiresConfirmation: false,
  },
  {
    kind: 'mutation-action',
    id: 'gofai:action:remove-track' as GofaiId,
    name: 'Remove Track',
    description: 'Remove a track from the project',
    effects: { type: 'mutate:structure:track', action: 'remove' },
    opcodeId: 'op:remove-track' as OpcodeId,
    undoable: true,
    risk: 'high',
    requiresConfirmation: true,
  },
];

// ============================================================================
// Safety Assertions
// ============================================================================

/**
 * Assert that an action is safe for preview mode.
 * 
 * Preview mode allows UI and inspection actions but blocks mutations.
 */
export function assertSafeForPreview(action: Action): void {
  if (isMutationAction(action)) {
    throw new Error(
      `Cannot execute mutation action "${action.name}" in preview mode. ` +
      `Use explicit apply or switch to edit mode.`
    );
  }
}

/**
 * Assert that an action is a mutation (when one is required).
 */
export function assertIsMutation(action: Action): asserts action is MutationAction {
  if (!isMutationAction(action)) {
    throw new Error(
      `Expected mutation action but got ${action.kind}: "${action.name}"`
    );
  }
}

/**
 * Assert that an action is UI-only (when required).
 */
export function assertIsUIOnly(action: Action): asserts action is UIAction {
  if (!isUIAction(action)) {
    throw new Error(
      `Expected UI-only action but got ${action.kind}: "${action.name}"`
    );
  }
}
