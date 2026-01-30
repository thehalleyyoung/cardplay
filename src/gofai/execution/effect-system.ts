/**
 * @file Execution Effect System (Step 303)
 * @module gofai/execution/effect-system
 *
 * Implements the execution effect type system that distinguishes UI actions from project
 * mutations, and ensures planners produce proposals while only executors apply changes.
 *
 * This module addresses Step 303 from gofai_goalB.md:
 * "Define an execution effect system: UI actions are separate from project mutations;
 *  planners produce proposals, executors apply."
 *
 * Design principles:
 * - Effect types categorize what an operation does (inspect vs propose vs mutate)
 * - UI actions (navigation, focus, visibility) are separate from project mutations
 * - Planners produce proposals (effect type: propose)
 * - Executors apply mutations (effect type: mutate)
 * - Inspections are read-only (effect type: inspect)
 * - Effect types enable board policy enforcement (e.g., full-manual forbids auto-mutation)
 *
 * Integration:
 * - Works with transactional-execution.ts for applying mutations
 * - Works with edit-package.ts for tracking what was done
 * - Works with board system for policy enforcement
 * - Works with CPL types for semantic intent
 */

import type { CardPlayId } from '../../canon/cardplay-id';

/**
 * Effect category taxonomy.
 *
 * This is the core distinction for what an operation does:
 * - inspect: read-only query, no state change
 * - propose: generate a plan/suggestion, no immediate mutation
 * - mutate: actually change project state
 * - ui: change UI state only (navigation, focus, visibility)
 */
export type EffectCategory = 'inspect' | 'propose' | 'mutate' | 'ui';

/**
 * Effect scope determines what parts of the system can be affected.
 */
export type EffectScope =
  | 'none' // No side effects
  | 'ui-only' // Only UI state (navigation, focus, visibility)
  | 'project-read' // Read project state
  | 'project-write' // Modify project state
  | 'project-structure' // Modify project structure (add/remove tracks, sections)
  | 'system'; // System-level effects (settings, preferences)

/**
 * Effect kind provides fine-grained categorization within a scope.
 */
export interface EffectKind {
  readonly category: EffectCategory;
  readonly scope: EffectScope;
  readonly reversible: boolean;
  readonly requiresConfirmation: boolean;
  readonly description: string;
}

/**
 * Built-in effect kinds.
 *
 * These are the stable effect kinds used throughout the GOFAI system.
 */
export const EffectKinds = {
  // Inspection effects (read-only)
  inspect_events: {
    category: 'inspect' as const,
    scope: 'project-read' as const,
    reversible: false,
    requiresConfirmation: false,
    description: 'Query events without modification',
  },
  inspect_structure: {
    category: 'inspect' as const,
    scope: 'project-read' as const,
    reversible: false,
    requiresConfirmation: false,
    description: 'Query project structure (tracks, sections, routing)',
  },
  inspect_constraints: {
    category: 'inspect' as const,
    scope: 'project-read' as const,
    reversible: false,
    requiresConfirmation: false,
    description: 'Query active constraints and preferences',
  },
  inspect_history: {
    category: 'inspect' as const,
    scope: 'project-read' as const,
    reversible: false,
    requiresConfirmation: false,
    description: 'Query edit history and undo stack',
  },

  // Proposal effects (planners)
  propose_edit: {
    category: 'propose' as const,
    scope: 'none' as const,
    reversible: false,
    requiresConfirmation: false,
    description: 'Generate an edit plan without applying it',
  },
  propose_clarification: {
    category: 'propose' as const,
    scope: 'none' as const,
    reversible: false,
    requiresConfirmation: false,
    description: 'Request clarification from user',
  },
  propose_alternatives: {
    category: 'propose' as const,
    scope: 'none' as const,
    reversible: false,
    requiresConfirmation: false,
    description: 'Present multiple plan options',
  },

  // Mutation effects (executors)
  mutate_events: {
    category: 'mutate' as const,
    scope: 'project-write' as const,
    reversible: true,
    requiresConfirmation: false,
    description: 'Modify event data (notes, timing, velocity)',
  },
  mutate_card_params: {
    category: 'mutate' as const,
    scope: 'project-write' as const,
    reversible: true,
    requiresConfirmation: false,
    description: 'Modify card parameters (DSP, instrument settings)',
  },
  mutate_card_graph: {
    category: 'mutate' as const,
    scope: 'project-structure' as const,
    reversible: true,
    requiresConfirmation: true,
    description: 'Add/remove/reorder cards in signal chain',
  },
  mutate_tracks: {
    category: 'mutate' as const,
    scope: 'project-structure' as const,
    reversible: true,
    requiresConfirmation: true,
    description: 'Add/remove/rename tracks',
  },
  mutate_routing: {
    category: 'mutate' as const,
    scope: 'project-structure' as const,
    reversible: true,
    requiresConfirmation: true,
    description: 'Change signal routing between tracks/cards',
  },
  mutate_sections: {
    category: 'mutate' as const,
    scope: 'project-structure' as const,
    reversible: true,
    requiresConfirmation: false,
    description: 'Add/remove/resize song sections (intro, verse, chorus)',
  },
  mutate_constraints: {
    category: 'mutate' as const,
    scope: 'project-write' as const,
    reversible: true,
    requiresConfirmation: false,
    description: 'Modify active constraints and preferences',
  },

  // UI effects (navigation, focus, visibility)
  ui_navigate_board: {
    category: 'ui' as const,
    scope: 'ui-only' as const,
    reversible: false,
    requiresConfirmation: false,
    description: 'Switch to a different board',
  },
  ui_focus_deck: {
    category: 'ui' as const,
    scope: 'ui-only' as const,
    reversible: false,
    requiresConfirmation: false,
    description: 'Focus a specific deck',
  },
  ui_select_range: {
    category: 'ui' as const,
    scope: 'ui-only' as const,
    reversible: false,
    requiresConfirmation: false,
    description: 'Change timeline selection',
  },
  ui_highlight: {
    category: 'ui' as const,
    scope: 'ui-only' as const,
    reversible: false,
    requiresConfirmation: false,
    description: 'Highlight elements for explanation',
  },
  ui_show_diff: {
    category: 'ui' as const,
    scope: 'ui-only' as const,
    reversible: false,
    requiresConfirmation: false,
    description: 'Show diff/preview overlay',
  },
} as const;

export type EffectKindId = keyof typeof EffectKinds;

/**
 * Operation with explicit effect annotation.
 *
 * Every GOFAI operation carries effect metadata describing what it does.
 */
export interface EffectfulOperation<T = unknown> {
  readonly effectKind: EffectKindId;
  readonly operation: T;
  readonly metadata?: {
    readonly description?: string;
    readonly reason?: string;
    readonly provenance?: string;
  };
}

/**
 * Effect validation result.
 */
export interface EffectValidationResult {
  readonly allowed: boolean;
  readonly reason?: string;
  readonly policy?: string;
  readonly alternatives?: readonly string[];
}

/**
 * Board control level (from board system).
 *
 * This determines what effect types are allowed.
 */
export type ControlLevel = 'full-manual' | 'directed' | 'collaborative' | 'generative';

/**
 * Effect policy rules for each control level.
 */
export interface EffectPolicy {
  readonly controlLevel: ControlLevel;
  readonly allowedCategories: readonly EffectCategory[];
  readonly allowedScopes: readonly EffectScope[];
  readonly requirePreview: boolean;
  readonly autoApply: boolean;
}

/**
 * Standard effect policies by control level.
 */
export const StandardEffectPolicies: Record<ControlLevel, EffectPolicy> = {
  'full-manual': {
    controlLevel: 'full-manual',
    allowedCategories: ['inspect', 'propose', 'ui'],
    allowedScopes: ['none', 'ui-only', 'project-read'],
    requirePreview: true,
    autoApply: false,
  },
  directed: {
    controlLevel: 'directed',
    allowedCategories: ['inspect', 'propose', 'mutate', 'ui'],
    allowedScopes: ['none', 'ui-only', 'project-read', 'project-write'],
    requirePreview: true,
    autoApply: false,
  },
  collaborative: {
    controlLevel: 'collaborative',
    allowedCategories: ['inspect', 'propose', 'mutate', 'ui'],
    allowedScopes: ['none', 'ui-only', 'project-read', 'project-write', 'project-structure'],
    requirePreview: false,
    autoApply: false,
  },
  generative: {
    controlLevel: 'generative',
    allowedCategories: ['inspect', 'propose', 'mutate', 'ui'],
    allowedScopes: ['none', 'ui-only', 'project-read', 'project-write', 'project-structure'],
    requirePreview: false,
    autoApply: true,
  },
};

/**
 * Effect capability interface.
 *
 * Boards/contexts provide this to indicate what effects are currently allowed.
 */
export interface EffectCapability {
  readonly policy: EffectPolicy;
  readonly disabledKinds?: readonly EffectKindId[];
  readonly customRules?: readonly EffectRule[];
}

/**
 * Custom effect rule.
 */
export interface EffectRule {
  readonly id: string;
  readonly description: string;
  readonly test: (effectKind: EffectKindId) => boolean;
  readonly allow: boolean;
  readonly reason: string;
}

/**
 * Effect validator.
 *
 * Determines whether an effect is allowed given current capabilities.
 */
export class EffectValidator {
  constructor(private readonly capability: EffectCapability) {}

  /**
   * Validate whether an effect kind is allowed.
   */
  validate(effectKindId: EffectKindId): EffectValidationResult {
    const effectKind = EffectKinds[effectKindId];
    const policy = this.capability.policy;

    // Check disabled kinds
    if (this.capability.disabledKinds?.includes(effectKindId)) {
      return {
        allowed: false,
        reason: `Effect kind '${effectKindId}' is explicitly disabled`,
        policy: policy.controlLevel,
      };
    }

    // Check custom rules
    if (this.capability.customRules) {
      for (const rule of this.capability.customRules) {
        if (rule.test(effectKindId)) {
          if (!rule.allow) {
            return {
              allowed: false,
              reason: rule.reason,
              policy: policy.controlLevel,
            };
          }
        }
      }
    }

    // Check category
    if (!policy.allowedCategories.includes(effectKind.category)) {
      return {
        allowed: false,
        reason: `Effect category '${effectKind.category}' not allowed in ${policy.controlLevel} mode`,
        policy: policy.controlLevel,
        alternatives: this.suggestAlternatives(effectKind),
      };
    }

    // Check scope
    if (!policy.allowedScopes.includes(effectKind.scope)) {
      return {
        allowed: false,
        reason: `Effect scope '${effectKind.scope}' not allowed in ${policy.controlLevel} mode`,
        policy: policy.controlLevel,
      };
    }

    return { allowed: true };
  }

  /**
   * Suggest alternative effect kinds that are allowed.
   */
  private suggestAlternatives(effectKind: EffectKind): string[] {
    const alternatives: string[] = [];

    // If mutation not allowed, suggest proposal
    if (effectKind.category === 'mutate') {
      if (this.validate('propose_edit').allowed) {
        alternatives.push('propose_edit');
      }
    }

    return alternatives;
  }

  /**
   * Check if preview is required for an effect.
   */
  requiresPreview(effectKindId: EffectKindId): boolean {
    const effectKind = EffectKinds[effectKindId];

    // Always preview structural changes
    if (effectKind.scope === 'project-structure') {
      return true;
    }

    // Always preview if confirmation required
    if (effectKind.requiresConfirmation) {
      return true;
    }

    // Otherwise follow policy
    return this.capability.policy.requirePreview;
  }

  /**
   * Check if auto-apply is allowed for an effect.
   */
  canAutoApply(effectKindId: EffectKindId): boolean {
    const effectKind = EffectKinds[effectKindId];

    // Never auto-apply if confirmation required
    if (effectKind.requiresConfirmation) {
      return false;
    }

    // Never auto-apply structural changes
    if (effectKind.scope === 'project-structure') {
      return false;
    }

    // Otherwise follow policy
    return this.capability.policy.autoApply;
  }
}

/**
 * Effect collector for tracking what a plan will do.
 */
export interface EffectSummary {
  readonly effectsByCategory: ReadonlyMap<EffectCategory, number>;
  readonly effectsByScope: ReadonlyMap<EffectScope, number>;
  readonly requiresPreview: boolean;
  readonly requiresConfirmation: boolean;
  readonly reversible: boolean;
}

/**
 * Collect and summarize effects from a set of operations.
 */
export function summarizeEffects(
  operations: readonly EffectfulOperation[],
  capability: EffectCapability
): EffectSummary {
  const validator = new EffectValidator(capability);

  const byCategory = new Map<EffectCategory, number>();
  const byScope = new Map<EffectScope, number>();

  let requiresPreview = false;
  let requiresConfirmation = false;
  let allReversible = true;

  for (const op of operations) {
    const effectKind = EffectKinds[op.effectKind];

    // Count by category
    byCategory.set(effectKind.category, (byCategory.get(effectKind.category) || 0) + 1);

    // Count by scope
    byScope.set(effectKind.scope, (byScope.get(effectKind.scope) || 0) + 1);

    // Update flags
    if (validator.requiresPreview(op.effectKind)) {
      requiresPreview = true;
    }

    if (effectKind.requiresConfirmation) {
      requiresConfirmation = true;
    }

    if (!effectKind.reversible) {
      allReversible = false;
    }
  }

  return {
    effectsByCategory: byCategory,
    effectsByScope: byScope,
    requiresPreview,
    requiresConfirmation,
    reversible: allReversible,
  };
}

/**
 * Effect-aware operation wrapper.
 *
 * Use this to annotate operations with their effect types.
 */
export function withEffect<T>(effectKind: EffectKindId, operation: T): EffectfulOperation<T> {
  return {
    effectKind,
    operation,
  };
}

/**
 * Effect-aware operation with metadata.
 */
export function withEffectAndMetadata<T>(
  effectKind: EffectKindId,
  operation: T,
  metadata: {
    readonly description?: string;
    readonly reason?: string;
    readonly provenance?: string;
  }
): EffectfulOperation<T> {
  return {
    effectKind,
    operation,
    metadata,
  };
}

/**
 * Validate a set of operations against capability.
 *
 * Returns operations that pass validation and those that fail.
 */
export interface ValidatedOperations<T = unknown> {
  readonly allowed: readonly EffectfulOperation<T>[];
  readonly denied: readonly {
    readonly operation: EffectfulOperation<T>;
    readonly validation: EffectValidationResult;
  }[];
}

export function validateOperations<T>(
  operations: readonly EffectfulOperation<T>[],
  capability: EffectCapability
): ValidatedOperations<T> {
  const validator = new EffectValidator(capability);

  const allowed: EffectfulOperation<T>[] = [];
  const denied: { operation: EffectfulOperation<T>; validation: EffectValidationResult }[] = [];

  for (const op of operations) {
    const validation = validator.validate(op.effectKind);

    if (validation.allowed) {
      allowed.push(op);
    } else {
      denied.push({ operation: op, validation });
    }
  }

  return { allowed, denied };
}

/**
 * Filter operations by effect category.
 */
export function filterByCategory<T>(
  operations: readonly EffectfulOperation<T>[],
  category: EffectCategory
): readonly EffectfulOperation<T>[] {
  return operations.filter((op) => EffectKinds[op.effectKind].category === category);
}

/**
 * Filter operations by effect scope.
 */
export function filterByScope<T>(
  operations: readonly EffectfulOperation<T>[],
  scope: EffectScope
): readonly EffectfulOperation<T>[] {
  return operations.filter((op) => EffectKinds[op.effectKind].scope === scope);
}

/**
 * Separate mutations from other operations.
 */
export function separateMutations<T>(operations: readonly EffectfulOperation<T>[]): {
  mutations: readonly EffectfulOperation<T>[];
  others: readonly EffectfulOperation<T>[];
} {
  const mutations: EffectfulOperation<T>[] = [];
  const others: EffectfulOperation<T>[] = [];

  for (const op of operations) {
    if (EffectKinds[op.effectKind].category === 'mutate') {
      mutations.push(op);
    } else {
      others.push(op);
    }
  }

  return { mutations, others };
}

/**
 * Check if any operations require confirmation.
 */
export function requiresConfirmation(operations: readonly EffectfulOperation[]): boolean {
  return operations.some((op) => EffectKinds[op.effectKind].requiresConfirmation);
}

/**
 * Check if all operations are reversible.
 */
export function allReversible(operations: readonly EffectfulOperation[]): boolean {
  return operations.every((op) => EffectKinds[op.effectKind].reversible);
}

/**
 * Format effect summary for display.
 */
export function formatEffectSummary(summary: EffectSummary): string {
  const parts: string[] = [];

  // By category
  const categoryStrs: string[] = [];
  for (const [category, count] of Array.from(summary.effectsByCategory)) {
    categoryStrs.push(`${count} ${category}`);
  }
  if (categoryStrs.length > 0) {
    parts.push(`Effects: ${categoryStrs.join(', ')}`);
  }

  // Flags
  const flags: string[] = [];
  if (summary.requiresPreview) flags.push('requires preview');
  if (summary.requiresConfirmation) flags.push('requires confirmation');
  if (summary.reversible) flags.push('reversible');
  if (flags.length > 0) {
    parts.push(`(${flags.join(', ')})`);
  }

  return parts.join(' ');
}

/**
 * Extension effect kinds registry.
 *
 * Extensions can register custom effect kinds that follow the same taxonomy.
 */
export class EffectKindRegistry {
  private readonly customKinds = new Map<string, EffectKind>();

  /**
   * Register a custom effect kind.
   */
  register(id: string, kind: EffectKind): void {
    if (this.customKinds.has(id)) {
      throw new Error(`Effect kind '${id}' already registered`);
    }

    // Require namespacing for extensions
    if (!id.includes(':')) {
      throw new Error(`Custom effect kind '${id}' must be namespaced (e.g., 'my-pack:action')`);
    }

    this.customKinds.set(id, kind);
  }

  /**
   * Get a custom effect kind.
   */
  get(id: string): EffectKind | undefined {
    return this.customKinds.get(id);
  }

  /**
   * Check if effect kind exists (builtin or custom).
   */
  exists(id: string): boolean {
    return id in EffectKinds || this.customKinds.has(id);
  }

  /**
   * Get effect kind (builtin or custom).
   */
  getEffectKind(id: string): EffectKind | undefined {
    if (id in EffectKinds) {
      return EffectKinds[id as EffectKindId];
    }
    return this.customKinds.get(id);
  }

  /**
   * List all registered custom effect kinds.
   */
  listCustomKinds(): readonly [string, EffectKind][] {
    return Array.from(this.customKinds.entries());
  }
}

/**
 * Global effect kind registry instance.
 */
export const effectKindRegistry = new EffectKindRegistry();

/**
 * Type guard for checking if value is an effectful operation.
 */
export function isEffectfulOperation(value: unknown): value is EffectfulOperation {
  return (
    typeof value === 'object' &&
    value !== null &&
    'effectKind' in value &&
    'operation' in value &&
    typeof (value as any).effectKind === 'string'
  );
}

/**
 * Extract operations from effectful wrappers.
 */
export function extractOperations<T>(operations: readonly EffectfulOperation<T>[]): readonly T[] {
  return operations.map((op) => op.operation);
}

/**
 * Re-wrap operations with effect metadata.
 */
export function rewrapOperations<T>(
  operations: readonly T[],
  effectKind: EffectKindId
): readonly EffectfulOperation<T>[] {
  return operations.map((op) => withEffect(effectKind, op));
}
