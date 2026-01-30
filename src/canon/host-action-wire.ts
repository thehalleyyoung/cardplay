/**
 * @fileoverview Canonical HostAction Wire Format
 * 
 * Defines the canonical wire envelope for HostAction communication
 * between Prolog and TypeScript. Provides mapping and validation.
 * 
 * Wire format from Prolog:
 * ```prolog
 * action(ActionTerm, Confidence, Reasons)
 * ```
 * 
 * Where:
 * - ActionTerm is a Prolog term like `set_key(c, major)`
 * - Confidence is a float between 0.0 and 1.0
 * - Reasons is a list of `because(ReasonString)` terms
 * 
 * @module @cardplay/canon/host-action-wire
 * @see cardplay/docs/canon/host-actions.md
 * @see to_fix_repo_plan_500.md Change 084
 */

// ============================================================================
// HOST ACTION TYPES
// ============================================================================

/**
 * Canonical host action type names.
 * These match the Prolog action functors.
 */
export const HOST_ACTION_TYPES = [
  // Key/Scale actions
  'set_key',
  'set_mode',
  'set_scale',
  // Tempo/Time actions  
  'set_tempo',
  'set_time_signature',
  // Harmony actions
  'add_chord',
  'set_chord_progression',
  'suggest_next_chord',
  // Note actions
  'add_note',
  'remove_note',
  'modify_note',
  // Structure actions
  'add_section',
  'set_section',
  // Routing actions
  'connect_port',
  'disconnect_port',
  // UI actions
  'show_hint',
  'highlight_element',
] as const;

export type HostActionType = typeof HOST_ACTION_TYPES[number];

/**
 * Check if a string is a valid host action type.
 */
export function isValidHostActionType(type: string): type is HostActionType {
  return HOST_ACTION_TYPES.includes(type as HostActionType);
}

// ============================================================================
// WIRE FORMAT TYPES
// ============================================================================

/**
 * Raw wire envelope from Prolog.
 * This is what comes off the wire before parsing.
 */
export interface HostActionWireEnvelope {
  /** The action functor and arguments as a structured object */
  readonly action: HostActionTerm;
  /** Confidence score between 0 and 1 */
  readonly confidence: number;
  /** Array of reason strings */
  readonly reasons: readonly string[];
}

/**
 * Action term structure as parsed from Prolog.
 */
export interface HostActionTerm {
  /** The action functor (e.g., 'set_key', 'add_constraint') */
  readonly functor: string;
  /** Arguments as parsed values */
  readonly args: readonly unknown[];
}

/**
 * Canonical discriminant for HostAction types.
 * 
 * Decision: Use 'action' as the discriminant field (not 'type').
 * This matches the Prolog wire format where the functor is the action name.
 */
export type HostActionDiscriminant = 'action';

/**
 * Base interface for all HostActions.
 */
export interface HostActionBase {
  /** The action discriminant */
  readonly action: string;
  /** Confidence score (0-1) */
  readonly confidence: number;
  /** Human-readable reasons */
  readonly reasons: readonly string[];
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate confidence is in range [0, 1].
 * Clamps out-of-range values with a warning.
 */
export function validateConfidence(value: number): number {
  if (typeof value !== 'number' || isNaN(value)) {
    console.warn('[HostAction] Invalid confidence, defaulting to 0.5');
    return 0.5;
  }
  
  if (value < 0) {
    console.warn(`[HostAction] Confidence ${value} < 0, clamping to 0`);
    return 0;
  }
  
  if (value > 1) {
    console.warn(`[HostAction] Confidence ${value} > 1, clamping to 1`);
    return 1;
  }
  
  return value;
}

/**
 * Validate and normalize reasons array.
 */
export function validateReasons(reasons: unknown): readonly string[] {
  if (!Array.isArray(reasons)) {
    return [];
  }
  
  return reasons
    .map(r => {
      if (typeof r === 'string') {
        return r;
      }
      if (typeof r === 'object' && r !== null && 'reason' in r) {
        return String((r as { reason: unknown }).reason);
      }
      return String(r);
    })
    .filter(r => r.length > 0);
}

/**
 * Validate a wire envelope.
 */
export function validateWireEnvelope(
  envelope: unknown
): { valid: true; data: HostActionWireEnvelope } | { valid: false; error: string } {
  if (typeof envelope !== 'object' || envelope === null) {
    return { valid: false, error: 'Envelope must be an object' };
  }

  const obj = envelope as Record<string, unknown>;

  // Check action field
  if (!('action' in obj)) {
    return { valid: false, error: 'Missing action field' };
  }

  // Check confidence field  
  if (!('confidence' in obj)) {
    return { valid: false, error: 'Missing confidence field' };
  }

  const confidence = validateConfidence(obj.confidence as number);
  const reasons = validateReasons(obj.reasons);

  // Parse action term
  const actionTerm = parseActionTerm(obj.action);
  if (!actionTerm) {
    return { valid: false, error: 'Invalid action term' };
  }

  return {
    valid: true,
    data: {
      action: actionTerm,
      confidence,
      reasons,
    },
  };
}

/**
 * Parse an action term from various formats.
 */
export function parseActionTerm(action: unknown): HostActionTerm | null {
  // Already structured
  if (typeof action === 'object' && action !== null) {
    const obj = action as Record<string, unknown>;
    
    // Has functor and args
    if ('functor' in obj && 'args' in obj) {
      return {
        functor: String(obj.functor),
        args: Array.isArray(obj.args) ? obj.args : [],
      };
    }
    
    // Has action field (legacy format)
    if ('action' in obj && typeof obj.action === 'string') {
      // This is the HostAction format, extract functor
      return {
        functor: obj.action,
        args: Object.entries(obj)
          .filter(([k]) => k !== 'action' && k !== 'confidence' && k !== 'reasons')
          .map(([, v]) => v),
      };
    }
  }

  // String format (functor only)
  if (typeof action === 'string') {
    return {
      functor: action,
      args: [],
    };
  }

  return null;
}

// ============================================================================
// PROLOG REASON PARSING
// ============================================================================

/**
 * Parse Prolog `because/1` terms into reason strings.
 * 
 * @param terms - Array of Prolog terms, expected format: because(ReasonString)
 * @returns Array of reason strings
 */
export function prologReasonsToStrings(terms: readonly unknown[]): string[] {
  const reasons: string[] = [];

  for (const term of terms) {
    if (typeof term === 'string') {
      reasons.push(term);
      continue;
    }

    if (typeof term === 'object' && term !== null) {
      const obj = term as Record<string, unknown>;
      
      // because(reason) format
      if ('functor' in obj && obj.functor === 'because' && Array.isArray(obj.args)) {
        const reason = obj.args[0];
        if (typeof reason === 'string') {
          reasons.push(reason);
        }
        continue;
      }
      
      // Direct reason field
      if ('reason' in obj && typeof obj.reason === 'string') {
        reasons.push(obj.reason);
        continue;
      }
    }
  }

  return reasons;
}

// ============================================================================
// KNOWN ACTION FUNCTORS
// ============================================================================

/**
 * Known action functors from Prolog.
 */
export const KNOWN_ACTION_FUNCTORS = new Set([
  'set_param',
  'add_constraint',
  'remove_constraint',
  'apply_pack',
  'add_card',
  'remove_card',
  'set_key',
  'set_tempo',
  'set_meter',
  'set_culture',
  'set_style',
  'switch_board',
  'add_deck',
  'show_warning',
]);

/**
 * Check if an action functor is known.
 */
export function isKnownActionFunctor(functor: string): boolean {
  return KNOWN_ACTION_FUNCTORS.has(functor);
}

/**
 * Check if an action functor is a namespaced extension action.
 */
export function isExtensionActionFunctor(functor: string): boolean {
  return functor.includes(':');
}
