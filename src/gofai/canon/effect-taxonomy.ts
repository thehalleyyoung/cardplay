/**
 * GOFAI Canon — Effect Taxonomy
 *
 * This module defines the effect taxonomy for compiler outputs, implementing
 * Step 008 from gofai_goalB.md: "Define an effect taxonomy for compiler outputs:
 * inspect vs propose vs mutate, to forbid silent mutation in manual boards."
 *
 * @module gofai/canon/effect-taxonomy
 */

// =============================================================================
// Effect Type System
// =============================================================================

/**
 * The three effect types for GOFAI operations.
 *
 * This taxonomy prevents silent mutations and ensures operations are
 * properly gated by board policy and user permissions.
 */
export type EffectType =
  | 'inspect' // Read-only operations that never modify state
  | 'propose' // Generates plans but requires preview + approval
  | 'mutate'; // Actually modifies project state (requires explicit confirmation)

/**
 * Effect capability required to execute an operation.
 */
export type EffectCapability =
  | 'none' // No special permission needed (inspect operations)
  | 'preview' // Can generate and preview plans (propose operations)
  | 'execute'; // Can apply mutations (mutate operations)

/**
 * Effect policy determines which operations are allowed in which contexts.
 */
export interface EffectPolicy {
  /** Policy name */
  readonly name: string;

  /** Description */
  readonly description: string;

  /** Which effect types are allowed */
  readonly allowedEffects: readonly EffectType[];

  /** Whether preview is required before mutation */
  readonly requiresPreview: boolean;

  /** Whether explicit confirmation is required for mutations */
  readonly requiresConfirmation: boolean;

  /** Whether undo is required to be available */
  readonly requiresUndo: boolean;
}

// =============================================================================
// Standard Effect Policies
// =============================================================================

/**
 * Read-only policy: Only inspect operations allowed.
 *
 * Use case: Documentation mode, learning, analysis
 */
export const EFFECT_POLICY_READ_ONLY: EffectPolicy = {
  name: 'read-only',
  description: 'Only read operations allowed, no mutations',
  allowedEffects: ['inspect'],
  requiresPreview: false,
  requiresConfirmation: false,
  requiresUndo: false,
};

/**
 * Preview-only policy: Can propose but not mutate.
 *
 * Use case: Planning mode, "what-if" exploration
 */
export const EFFECT_POLICY_PREVIEW_ONLY: EffectPolicy = {
  name: 'preview-only',
  description: 'Can generate plans and preview changes, but not apply them',
  allowedEffects: ['inspect', 'propose'],
  requiresPreview: true,
  requiresConfirmation: false,
  requiresUndo: false,
};

/**
 * Strict studio policy: All mutations require preview + confirmation.
 *
 * Use case: Professional production, high-value projects
 */
export const EFFECT_POLICY_STRICT_STUDIO: EffectPolicy = {
  name: 'strict-studio',
  description: 'All mutations require preview and explicit confirmation',
  allowedEffects: ['inspect', 'propose', 'mutate'],
  requiresPreview: true,
  requiresConfirmation: true,
  requiresUndo: true,
};

/**
 * Assisted mode: Mutations allowed with preview but no confirmation.
 *
 * Use case: Rapid iteration, experimentation
 */
export const EFFECT_POLICY_ASSISTED: EffectPolicy = {
  name: 'assisted',
  description: 'Mutations allowed after preview, no confirmation needed',
  allowedEffects: ['inspect', 'propose', 'mutate'],
  requiresPreview: true,
  requiresConfirmation: false,
  requiresUndo: true,
};

/**
 * Full auto policy: Mutations can be applied immediately.
 *
 * Use case: Trusted automation, batch processing
 * WARNING: Only for fully trusted contexts
 */
export const EFFECT_POLICY_FULL_AUTO: EffectPolicy = {
  name: 'full-auto',
  description: 'Mutations can be applied immediately without preview',
  allowedEffects: ['inspect', 'propose', 'mutate'],
  requiresPreview: false,
  requiresConfirmation: false,
  requiresUndo: true,
};

/**
 * All standard effect policies.
 */
export const STANDARD_EFFECT_POLICIES: readonly EffectPolicy[] = [
  EFFECT_POLICY_READ_ONLY,
  EFFECT_POLICY_PREVIEW_ONLY,
  EFFECT_POLICY_STRICT_STUDIO,
  EFFECT_POLICY_ASSISTED,
  EFFECT_POLICY_FULL_AUTO,
];

// =============================================================================
// Board-Specific Policies
// =============================================================================

/**
 * Default policy for manual boards: strict studio mode.
 *
 * Manual boards are for precision work, so require preview + confirmation.
 */
export const EFFECT_POLICY_MANUAL_BOARD: EffectPolicy =
  EFFECT_POLICY_STRICT_STUDIO;

/**
 * Default policy for assisted boards: assisted mode.
 *
 * Assisted boards allow quicker iteration with preview but no confirmation.
 */
export const EFFECT_POLICY_ASSISTED_BOARD: EffectPolicy = EFFECT_POLICY_ASSISTED;

/**
 * Default policy for AI boards: preview-only initially.
 *
 * AI boards start in preview mode; user can upgrade to assisted if desired.
 */
export const EFFECT_POLICY_AI_BOARD: EffectPolicy = EFFECT_POLICY_PREVIEW_ONLY;

// =============================================================================
// Effect Checking
// =============================================================================

/**
 * Check if an effect type is allowed under a policy.
 */
export function isEffectAllowed(
  effect: EffectType,
  policy: EffectPolicy
): boolean {
  return policy.allowedEffects.includes(effect);
}

/**
 * Get the required capability for an effect type under a policy.
 */
export function getRequiredCapability(
  effect: EffectType,
  policy: EffectPolicy
): EffectCapability {
  if (!isEffectAllowed(effect, policy)) {
    throw new Error(`Effect ${effect} not allowed under policy ${policy.name}`);
  }

  switch (effect) {
    case 'inspect':
      return 'none';
    case 'propose':
      return 'preview';
    case 'mutate':
      return 'execute';
  }
}

/**
 * Check if an operation requires preview under a policy.
 */
export function requiresPreview(
  effect: EffectType,
  policy: EffectPolicy
): boolean {
  return effect === 'mutate' && policy.requiresPreview;
}

/**
 * Check if an operation requires confirmation under a policy.
 */
export function requiresConfirmation(
  effect: EffectType,
  policy: EffectPolicy
): boolean {
  return effect === 'mutate' && policy.requiresConfirmation;
}

/**
 * Check if undo must be available under a policy.
 */
export function requiresUndo(
  effect: EffectType,
  policy: EffectPolicy
): boolean {
  return effect === 'mutate' && policy.requiresUndo;
}

// =============================================================================
// Effect Violation Reporting
// =============================================================================

/**
 * Result of an effect check.
 */
export type EffectCheckResult =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly violation: EffectViolation;
    };

/**
 * An effect violation (operation not allowed under policy).
 */
export interface EffectViolation {
  /** The attempted effect */
  readonly attemptedEffect: EffectType;

  /** The active policy */
  readonly policy: EffectPolicy;

  /** Human-readable explanation */
  readonly message: string;

  /** What capability is missing */
  readonly missingCapability: EffectCapability;

  /** Suggested actions */
  readonly suggestions: readonly string[];
}

/**
 * Check if an effect is allowed and generate violation if not.
 */
export function checkEffect(
  effect: EffectType,
  policy: EffectPolicy
): EffectCheckResult {
  if (isEffectAllowed(effect, policy)) {
    return { ok: true };
  }

  const violation: EffectViolation = {
    attemptedEffect: effect,
    policy,
    message: `Effect '${effect}' is not allowed under policy '${policy.name}'`,
    missingCapability: getRequiredCapabilityUnsafe(effect),
    suggestions: generateSuggestions(effect, policy),
  };

  return { ok: false, violation };
}

/**
 * Get required capability without throwing (for violation reporting).
 */
function getRequiredCapabilityUnsafe(effect: EffectType): EffectCapability {
  switch (effect) {
    case 'inspect':
      return 'none';
    case 'propose':
      return 'preview';
    case 'mutate':
      return 'execute';
  }
}

/**
 * Generate suggestions for resolving an effect violation.
 */
function generateSuggestions(
  effect: EffectType,
  policy: EffectPolicy
): string[] {
  const suggestions: string[] = [];

  if (effect === 'mutate' && !policy.allowedEffects.includes('mutate')) {
    suggestions.push('Switch to a board policy that allows mutations');
    suggestions.push(
      `Consider using '${EFFECT_POLICY_STRICT_STUDIO.name}' or '${EFFECT_POLICY_ASSISTED.name}' policy`
    );
  }

  if (effect === 'propose' && !policy.allowedEffects.includes('propose')) {
    suggestions.push('Switch to a policy that allows plan generation');
    suggestions.push(`Consider using '${EFFECT_POLICY_PREVIEW_ONLY.name}' policy`);
  }

  if (
    effect === 'mutate' &&
    policy.allowedEffects.includes('propose') &&
    !policy.allowedEffects.includes('mutate')
  ) {
    suggestions.push('You can preview this change, but cannot apply it');
    suggestions.push('Upgrade to a policy that allows execution');
  }

  return suggestions;
}

// =============================================================================
// Effect Metadata
// =============================================================================

/**
 * Metadata about an effect type.
 */
export interface EffectMetadata {
  /** Effect type */
  readonly effect: EffectType;

  /** Display name */
  readonly displayName: string;

  /** Description */
  readonly description: string;

  /** What this effect can do */
  readonly capabilities: readonly string[];

  /** What this effect cannot do */
  readonly limitations: readonly string[];

  /** Safety guarantees */
  readonly guarantees: readonly string[];
}

/**
 * Metadata for inspect effects.
 */
export const INSPECT_EFFECT_METADATA: EffectMetadata = {
  effect: 'inspect',
  displayName: 'Inspect',
  description: 'Read-only operations that analyze or display information',
  capabilities: [
    'Read project state',
    'Analyze musical structure',
    'Display information',
    'Answer questions',
    'Show current values',
  ],
  limitations: [
    'Cannot modify project',
    'Cannot generate plans',
    'Cannot change any state',
  ],
  guarantees: [
    'No side effects',
    'No state changes',
    'Safe to run anytime',
    'Repeatable',
    'Deterministic',
  ],
};

/**
 * Metadata for propose effects.
 */
export const PROPOSE_EFFECT_METADATA: EffectMetadata = {
  effect: 'propose',
  displayName: 'Propose',
  description: 'Generate plans and previews without applying changes',
  capabilities: [
    'Read project state',
    'Generate action plans',
    'Compute previews',
    'Show what would change',
    'Present alternatives',
  ],
  limitations: [
    'Cannot modify project',
    'Cannot apply changes',
    'Cannot affect audio',
  ],
  guarantees: [
    'No project mutations',
    'Safe to explore',
    'Repeatable',
    'Deterministic',
    'Can be canceled',
  ],
};

/**
 * Metadata for mutate effects.
 */
export const MUTATE_EFFECT_METADATA: EffectMetadata = {
  effect: 'mutate',
  displayName: 'Mutate',
  description: 'Apply changes to the project',
  capabilities: [
    'Modify events',
    'Change parameters',
    'Add/remove elements',
    'Restructure sections',
    'Apply effects',
  ],
  limitations: [
    'Must respect constraints',
    'Cannot mutate read-only entities',
    'Cannot violate invariants',
  ],
  guarantees: [
    'Transactional (all-or-nothing)',
    'Undoable',
    'Constraint-verified',
    'Diff-tracked',
    'Explainable',
  ],
};

/**
 * All effect metadata.
 */
export const EFFECT_METADATA: ReadonlyMap<EffectType, EffectMetadata> = new Map([
  ['inspect', INSPECT_EFFECT_METADATA],
  ['propose', PROPOSE_EFFECT_METADATA],
  ['mutate', MUTATE_EFFECT_METADATA],
]);

/**
 * Get metadata for an effect type.
 */
export function getEffectMetadata(effect: EffectType): EffectMetadata {
  const metadata = EFFECT_METADATA.get(effect);
  if (!metadata) {
    throw new Error(`No metadata for effect type: ${effect}`);
  }
  return metadata;
}

// =============================================================================
// Policy Lookup
// =============================================================================

/**
 * Get a policy by name.
 */
export function getPolicyByName(name: string): EffectPolicy | undefined {
  return STANDARD_EFFECT_POLICIES.find((p) => p.name === name);
}

/**
 * Get the default policy for a board persona.
 */
export function getDefaultPolicyForBoard(
  boardPersona: 'full-manual' | 'assisted' | 'full-ai'
): EffectPolicy {
  switch (boardPersona) {
    case 'full-manual':
      return EFFECT_POLICY_MANUAL_BOARD;
    case 'assisted':
      return EFFECT_POLICY_ASSISTED_BOARD;
    case 'full-ai':
      return EFFECT_POLICY_AI_BOARD;
  }
}

// =============================================================================
// Exports
// =============================================================================

export {
  EFFECT_POLICY_READ_ONLY as READ_ONLY,
  EFFECT_POLICY_PREVIEW_ONLY as PREVIEW_ONLY,
  EFFECT_POLICY_STRICT_STUDIO as STRICT_STUDIO,
  EFFECT_POLICY_ASSISTED as ASSISTED,
  EFFECT_POLICY_FULL_AUTO as FULL_AUTO,
};
