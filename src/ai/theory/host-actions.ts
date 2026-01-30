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
import { prologConstraintTermToMusicConstraint } from './spec-prolog-bridge';
import { isValidConstraintType } from '../../canon/constraint-types';

// ============================================================================
// HOST ACTION ENVELOPE (Change 361)
// ============================================================================

/**
 * Change 361: Host action envelope wrapping action with confidence and reasons.
 * This envelope type can be used in UI layers that need to display or filter
 * actions based on confidence scores or explanations.
 * 
 * Note: Individual HostAction types also embed confidence/reasons for backwards
 * compatibility, but this envelope provides a cleaner separation for new code.
 */
export interface HostActionEnvelope<T = HostAction> {
  /** The action to be performed */
  readonly action: T;
  /** AI confidence score (0.0-1.0) */
  readonly confidence: number;
  /** Human-readable reasons for this suggestion */
  readonly reasons: readonly string[];
}

// ============================================================================
// HOST ACTION TYPES
// ============================================================================

/**
 * Namespaced extension action.
 * Allows third-party packs to define custom HostAction types.
 * 
 * Change 394: Support namespaced extension actions in discriminant union.
 * 
 * Action names must follow the format: `namespace:action_name`
 * Example: 'mypack:apply_custom_transform'
 */
export interface ExtensionAction {
  readonly action: `${string}:${string}`; // Namespaced action name
  readonly payload: unknown; // Extension-specific data
  readonly confidence: number;
  readonly reasons: readonly string[];
}

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
  | ShowWarningAction
  | ExtensionAction; // Change 394: Allow namespaced extension actions

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

interface PrologCompoundTerm {
  readonly functor: string;
  readonly args: readonly unknown[];
}

function isPrologCompoundTerm(value: unknown): value is PrologCompoundTerm {
  if (!value || typeof value !== 'object') return false;
  const v = value as { functor?: unknown; args?: unknown };
  return typeof v.functor === 'string' && Array.isArray(v.args);
}

/**
 * Convert a Prolog reasons list into user-facing strings.
 *
 * Prolog conventions often use `because(Reason)` terms inside lists.
 */
export function prologReasonsToStrings(reasons: unknown): string[] {
  if (!Array.isArray(reasons)) return [];

  const out: string[] = [];
  for (const r of reasons) {
    if (typeof r === 'string') {
      out.push(r);
      continue;
    }
    if (isPrologCompoundTerm(r) && r.functor === 'because' && typeof r.args[0] === 'string') {
      out.push(r.args[0]);
      continue;
    }
    out.push(String(r));
  }
  return out;
}

function normalizeConstraintType(type: string): MusicConstraint['type'] | null {
  if (type === 'accent_model') return 'accent';
  // Treat unknown namespaces as custom constraints, but avoid inventing types for arbitrary strings.
  if (type.startsWith('custom:') || type.includes(':')) return type as MusicConstraint['type'];

  // Use canonical constraint types from SSOT
  return isValidConstraintType(type) ? (type as MusicConstraint['type']) : null;
}

/**
 * Parse a Prolog compound action term into a typed HostAction.
 *
 * This expects the `PrologAdapter.termToJS` compound shape:
 * `{ functor: string; args: unknown[] }`.
 */
export function parseHostActionFromPrologTerm(
  term: unknown,
  confidence: number,
  reasons: readonly string[]
): HostAction | null {
  if (!isPrologCompoundTerm(term)) return null;

  const args = term.args;
  switch (term.functor) {
    case 'set_key': {
      const root = typeof args[0] === 'string' ? (args[0] as RootName) : ('c' as RootName);
      const mode = typeof args[1] === 'string' ? (args[1] as ModeName) : ('major' as ModeName);
      return { action: 'set_key', root, mode, confidence, reasons };
    }
    case 'set_tempo': {
      const bpm = typeof args[0] === 'number' ? args[0] : Number(args[0] ?? 120);
      return { action: 'set_tempo', bpm, confidence, reasons };
    }
    case 'set_meter': {
      const numerator = typeof args[0] === 'number' ? args[0] : Number(args[0] ?? 4);
      const denominator = typeof args[1] === 'number' ? args[1] : Number(args[1] ?? 4);
      return { action: 'set_meter', numerator, denominator, confidence, reasons };
    }
    case 'set_culture': {
      const culture = typeof args[0] === 'string' ? (args[0] as CultureTag) : ('western' as CultureTag);
      return { action: 'set_culture', culture, confidence, reasons };
    }
    case 'set_style': {
      const style = typeof args[0] === 'string' ? (args[0] as StyleTag) : ('cinematic' as StyleTag);
      return { action: 'set_style', style, confidence, reasons };
    }
    case 'set_param': {
      const cardId = typeof args[0] === 'string' ? args[0] : String(args[0] ?? '');
      const paramId = typeof args[1] === 'string' ? args[1] : String(args[1] ?? '');
      return { action: 'set_param', cardId, paramId, value: args[2], confidence, reasons };
    }
    case 'apply_pack': {
      const packId = typeof args[0] === 'string' ? args[0] : String(args[0] ?? '');
      return { action: 'apply_pack', packId, confidence, reasons };
    }
    case 'add_constraint': {
      const constraint = prologConstraintTermToMusicConstraint(args[0], { hard: false, weight: 0.7 });
      if (!constraint) return null;
      return { action: 'add_constraint', constraint, confidence, reasons };
    }
    case 'remove_constraint': {
      const arg0 = args[0];
      if (typeof arg0 === 'string') {
        const constraintType = normalizeConstraintType(arg0);
        if (!constraintType) return null;
        return { action: 'remove_constraint', constraintType, confidence, reasons };
      }
      if (isPrologCompoundTerm(arg0)) {
        const constraintType = normalizeConstraintType(arg0.functor);
        if (!constraintType) return null;
        return { action: 'remove_constraint', constraintType, confidence, reasons };
      }
      return null;
    }
    case 'add_card': {
      const cardType = typeof args[0] === 'string' ? args[0] : String(args[0] ?? '');
      const defaultParams = (typeof args[1] === 'object' && args[1] !== null)
        ? (args[1] as Record<string, unknown>)
        : undefined;
      return defaultParams
        ? { action: 'add_card', cardType, defaultParams, confidence, reasons }
        : { action: 'add_card', cardType, confidence, reasons };
    }
    case 'remove_card': {
      const cardId = typeof args[0] === 'string' ? args[0] : String(args[0] ?? '');
      return { action: 'remove_card', cardId, confidence, reasons };
    }
    case 'switch_board': {
      const boardType = typeof args[0] === 'string' ? args[0] : String(args[0] ?? '');
      return { action: 'switch_board', boardType, confidence, reasons };
    }
    case 'add_deck': {
      const deckTemplate = typeof args[0] === 'string' ? args[0] : String(args[0] ?? '');
      return { action: 'add_deck', deckTemplate, confidence, reasons };
    }
    case 'show_warning': {
      const message = typeof args[0] === 'string' ? args[0] : String(args[0] ?? '');
      const severity = (typeof args[1] === 'string' ? args[1] : 'info') as 'error' | 'warning' | 'info';
      return { action: 'show_warning', message, severity, confidence, reasons };
    }
    default:
      return null;
  }
}

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
