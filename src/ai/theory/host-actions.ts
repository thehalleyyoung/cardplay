/**
 * @fileoverview HostAction → Card System Action Mapping (C081)
 *
 * Maps Prolog-generated HostAction terms to concrete card system operations.
 * When Prolog recommends actions via recommend_action/3 or spec_autofix/3,
 * this module translates them into executable card/board/deck mutations.
 *
 * @module @cardplay/ai/theory/host-actions
 */

import type {
  MusicConstraint,
  MusicSpec,
  RootName,
  ModeName,
  StyleTag,
  CultureTag,
  // FilmMood,
  // FilmDevice,
} from './music-spec';

// ============================================================================
// HOST ACTION TYPES
// ============================================================================

/**
 * Discriminated union of all possible host actions.
 * These represent side effects that Prolog recommends the host (TS) perform.
 */
export type HostAction =
  | SetParamAction
  | AddConstraintAction
  | RemoveConstraintAction
  | ApplyPackAction
  | AddCardAction
  | RemoveCardAction
  | SetKeyAction
  | SetTempoAction
  | SetMeterAction
  | SetCultureAction
  | SetStyleAction
  | SwitchBoardAction
  | AddDeckAction
  | ShowWarningAction;

/** Set a card parameter */
export interface SetParamAction {
  readonly action: 'set_param';
  readonly cardId: string;
  readonly paramId: string;
  readonly value: unknown;
  readonly confidence: number;
  readonly reasons: readonly string[];
}

/** Add a constraint to the active MusicSpec */
export interface AddConstraintAction {
  readonly action: 'add_constraint';
  readonly constraint: MusicConstraint;
  readonly confidence: number;
  readonly reasons: readonly string[];
}

/** Remove a constraint type from the active MusicSpec */
export interface RemoveConstraintAction {
  readonly action: 'remove_constraint';
  readonly constraintType: MusicConstraint['type'];
  readonly confidence: number;
  readonly reasons: readonly string[];
}

/** Apply a constraint pack by ID */
export interface ApplyPackAction {
  readonly action: 'apply_pack';
  readonly packId: string;
  readonly confidence: number;
  readonly reasons: readonly string[];
}

/** Add a card to the current deck */
export interface AddCardAction {
  readonly action: 'add_card';
  readonly cardType: string;
  readonly defaultParams?: Record<string, unknown>;
  readonly confidence: number;
  readonly reasons: readonly string[];
}

/** Remove a card from the current deck */
export interface RemoveCardAction {
  readonly action: 'remove_card';
  readonly cardId: string;
  readonly confidence: number;
  readonly reasons: readonly string[];
}

/** Set the key of the MusicSpec */
export interface SetKeyAction {
  readonly action: 'set_key';
  readonly root: RootName;
  readonly mode: ModeName;
  readonly confidence: number;
  readonly reasons: readonly string[];
}

/** Set the tempo of the MusicSpec */
export interface SetTempoAction {
  readonly action: 'set_tempo';
  readonly bpm: number;
  readonly confidence: number;
  readonly reasons: readonly string[];
}

/** Set the meter of the MusicSpec */
export interface SetMeterAction {
  readonly action: 'set_meter';
  readonly numerator: number;
  readonly denominator: number;
  readonly confidence: number;
  readonly reasons: readonly string[];
}

/** Set the culture tag */
export interface SetCultureAction {
  readonly action: 'set_culture';
  readonly culture: CultureTag;
  readonly confidence: number;
  readonly reasons: readonly string[];
}

/** Set the style tag */
export interface SetStyleAction {
  readonly action: 'set_style';
  readonly style: StyleTag;
  readonly confidence: number;
  readonly reasons: readonly string[];
}

/** Switch to a different board */
export interface SwitchBoardAction {
  readonly action: 'switch_board';
  readonly boardType: string;
  readonly confidence: number;
  readonly reasons: readonly string[];
}

/** Add a deck to the board */
export interface AddDeckAction {
  readonly action: 'add_deck';
  readonly deckTemplate: string;
  readonly confidence: number;
  readonly reasons: readonly string[];
}

/** Show a warning/info to the user */
export interface ShowWarningAction {
  readonly action: 'show_warning';
  readonly message: string;
  readonly severity: 'error' | 'warning' | 'info';
  readonly confidence: number;
  readonly reasons: readonly string[];
}

// ============================================================================
// PARSING FROM PROLOG TERMS
// ============================================================================

/**
 * Parse a raw Prolog action term into a typed HostAction.
 *
 * Prolog actions come in the form:
 *   host_action(ActionType, Params, Confidence, Reasons)
 */
export function parseHostAction(raw: Record<string, unknown>): HostAction | null {
  const actionType = raw['action'] ?? raw['ActionType'] ?? raw[0];
  const confidence = ((raw['confidence'] ?? raw['Confidence'] ?? raw[1] ?? 0.5) as number);
  const reasons = ((raw['reasons'] ?? raw['Reasons'] ?? raw[2] ?? []) as string[]).map(String);
  const normalizedConfidence = typeof confidence === 'number' && confidence <= 1
    ? Math.round(confidence * 100)
    : Math.round(Number(confidence));

  if (typeof actionType !== 'string' && typeof actionType !== 'object') {
    return null;
  }

  // Handle string action types
  if (typeof actionType === 'string') {
    switch (actionType) {
      case 'set_key':
        return {
          action: 'set_key',
          root: (raw['root'] ?? 'c') as RootName,
          mode: (raw['mode'] ?? 'major') as ModeName,
          confidence: normalizedConfidence,
          reasons,
        };
      case 'set_tempo':
        return {
          action: 'set_tempo',
          bpm: (raw['bpm'] ?? 120) as number,
          confidence: normalizedConfidence,
          reasons,
        };
      case 'set_meter':
        return {
          action: 'set_meter',
          numerator: (raw['numerator'] ?? 4) as number,
          denominator: (raw['denominator'] ?? 4) as number,
          confidence: normalizedConfidence,
          reasons,
        };
      case 'set_culture':
        return {
          action: 'set_culture',
          culture: (raw['culture'] ?? 'western') as CultureTag,
          confidence: normalizedConfidence,
          reasons,
        };
      case 'set_style':
        return {
          action: 'set_style',
          style: (raw['style'] ?? 'cinematic') as StyleTag,
          confidence: normalizedConfidence,
          reasons,
        };
      case 'apply_pack':
        return {
          action: 'apply_pack',
          packId: (raw['packId'] ?? raw['pack_id'] ?? '') as string,
          confidence: normalizedConfidence,
          reasons,
        };
      case 'add_card': {
        const params = raw['params'];
        if (params !== undefined && params !== null) {
          return {
            action: 'add_card' as const,
            cardType: (raw['cardType'] ?? raw['card_type'] ?? '') as string,
            defaultParams: params as Record<string, unknown>,
            confidence: normalizedConfidence,
            reasons,
          };
        } else {
          return {
            action: 'add_card' as const,
            cardType: (raw['cardType'] ?? raw['card_type'] ?? '') as string,
            confidence: normalizedConfidence,
            reasons,
          };
        }
      }
      case 'remove_card':
        return {
          action: 'remove_card',
          cardId: (raw['cardId'] ?? raw['card_id'] ?? '') as string,
          confidence: normalizedConfidence,
          reasons,
        };
      case 'set_param':
        return {
          action: 'set_param',
          cardId: (raw['cardId'] ?? raw['card_id'] ?? '') as string,
          paramId: (raw['paramId'] ?? raw['param_id'] ?? '') as string,
          value: raw['value'],
          confidence: normalizedConfidence,
          reasons,
        };
      case 'switch_board':
        return {
          action: 'switch_board',
          boardType: (raw['boardType'] ?? raw['board_type'] ?? '') as string,
          confidence: normalizedConfidence,
          reasons,
        };
      case 'add_deck':
        return {
          action: 'add_deck',
          deckTemplate: (raw['deckTemplate'] ?? raw['deck_template'] ?? '') as string,
          confidence: normalizedConfidence,
          reasons,
        };
      case 'show_warning':
        return {
          action: 'show_warning',
          message: (raw['message'] ?? '') as string,
          severity: (raw['severity'] ?? 'info') as 'error' | 'warning' | 'info',
          confidence: normalizedConfidence,
          reasons,
        };
      default:
        return null;
    }
  }

  return null;
}

// ============================================================================
// ACTION APPLICATION
// ============================================================================

/**
 * Apply a HostAction to a MusicSpec, returning the modified spec.
 * Only handles spec-level actions; card/board actions return the spec unchanged.
 */
export function applyActionToSpec(action: HostAction, spec: MusicSpec): MusicSpec {
  switch (action.action) {
    case 'set_key':
      return { ...spec, keyRoot: action.root, mode: action.mode };

    case 'set_tempo':
      return { ...spec, tempo: action.bpm };

    case 'set_meter':
      return { ...spec, meterNumerator: action.numerator, meterDenominator: action.denominator };

    case 'set_culture':
      return { ...spec, culture: action.culture };

    case 'set_style':
      return { ...spec, style: action.style };

    case 'add_constraint':
      return {
        ...spec,
        constraints: [...spec.constraints, action.constraint],
      };

    case 'remove_constraint':
      return {
        ...spec,
        constraints: spec.constraints.filter(c => c.type !== action.constraintType),
      };

    // Card/board/deck actions don't modify the spec directly
    case 'set_param':
    case 'apply_pack':
    case 'add_card':
    case 'remove_card':
    case 'switch_board':
    case 'add_deck':
    case 'show_warning':
      return spec;
  }
}

/**
 * Apply multiple HostActions to a MusicSpec sequentially.
 */
export function applyActionsToSpec(actions: readonly HostAction[], spec: MusicSpec): MusicSpec {
  return actions.reduce((s, action) => applyActionToSpec(action, s), spec);
}

/**
 * Check if a HostAction modifies the MusicSpec directly.
 */
export function isSpecAction(action: HostAction): boolean {
  return [
    'set_key', 'set_tempo', 'set_meter', 'set_culture', 'set_style',
    'add_constraint', 'remove_constraint',
  ].includes(action.action);
}

/**
 * Check if a HostAction modifies cards/decks/boards (side effects).
 */
export function isSideEffectAction(action: HostAction): boolean {
  return [
    'set_param', 'apply_pack', 'add_card', 'remove_card',
    'switch_board', 'add_deck', 'show_warning',
  ].includes(action.action);
}

/**
 * Sort actions by confidence (highest first).
 */
export function sortActionsByConfidence(actions: readonly HostAction[]): HostAction[] {
  return [...actions].sort((a, b) => b.confidence - a.confidence);
}

/**
 * Filter actions above a confidence threshold.
 */
export function filterByConfidence(actions: readonly HostAction[], minConfidence: number): HostAction[] {
  return actions.filter(a => a.confidence >= minConfidence);
}
