/**
 * @fileoverview Custom Constraint Registry for User-Defined MusicSpec Extensions
 * 
 * Provides an extensible system for users to register their own:
 * - Custom constraint types
 * - Prolog encoding/decoding rules
 * - Validation logic
 * - UI card bindings
 * 
 * This allows user-defined cards to contribute new musical concepts
 * that integrate seamlessly with the MusicSpec ⇄ Prolog bridge.
 * 
 * @module @cardplay/ai/theory/custom-constraints
 */

import type { MusicConstraint } from './music-spec';

// ============================================================================
// CUSTOM CONSTRAINT DEFINITION
// ============================================================================

/**
 * Base interface for custom constraint definitions.
 * Users implement this to add new constraint types.
 */
export interface CustomConstraintDefinition<T extends CustomConstraint = CustomConstraint> {
  /** Unique type identifier (should be namespaced, e.g., 'user:my_constraint') */
  readonly type: string;
  
  /** Human-readable name for UI */
  readonly displayName: string;
  
  /** Description of what this constraint does */
  readonly description: string;
  
  /** Category for grouping in UI */
  readonly category: CustomConstraintCategory;
  
  /** JSON schema for constraint parameters (optional, for validation) */
  readonly parameterSchema?: Record<string, unknown>;
  
  /** Convert this constraint to a Prolog fact string */
  toPrologFact(constraint: T, specId: string): string;
  
  /** Convert this constraint to a Prolog term (without period) */
  toPrologTerm(constraint: T): string;
  
  /** Parse Prolog bindings back to constraint (optional) */
  fromPrologBindings?(bindings: Record<string, unknown>): T | null;
  
  /** Validate constraint parameters */
  validate?(constraint: T): ValidationResult;
  
  /** Get conflicts with other constraints */
  getConflicts?(constraint: T, others: MusicConstraint[]): ConflictInfo[];
}

/**
 * Categories for custom constraints.
 */
export type CustomConstraintCategory =
  | 'pitch'        // Pitch/scale/mode related
  | 'rhythm'       // Tempo/meter/rhythm related
  | 'harmony'      // Chord/progression related
  | 'texture'      // Voicing/orchestration related
  | 'form'         // Structure/form related
  | 'ornament'     // Ornamentation related
  | 'style'        // Style/genre related
  | 'culture'      // Cultural/world-music related
  | 'analysis'     // Analysis tool configuration
  | 'custom';      // User-defined miscellaneous

/**
 * Result of constraint validation.
 */
export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Information about a constraint conflict.
 */
export interface ConflictInfo {
  readonly conflictingType: string;
  readonly reason: string;
  readonly severity: 'error' | 'warning' | 'info';
}

// ============================================================================
// CUSTOM CONSTRAINT TYPE
// ============================================================================

/**
 * Base type for user-defined constraints.
 * The `type` field must start with 'custom:' or a user namespace.
 */
export interface CustomConstraint {
  readonly type: string;
  readonly hard: boolean;
  readonly weight?: number;
  /** Arbitrary parameters defined by the constraint */
  readonly params: Record<string, unknown>;
}

/**
 * Type guard for custom constraints.
 */
export function isCustomConstraint(c: MusicConstraint | CustomConstraint): c is CustomConstraint {
  return 'params' in c && (c.type.startsWith('custom:') || c.type.includes(':'));
}

// ============================================================================
// CONSTRAINT REGISTRY
// ============================================================================

/**
 * Registry for custom constraint definitions.
 * Singleton pattern for global access.
 */
class ConstraintRegistry {
  private definitions = new Map<string, CustomConstraintDefinition>();
  private prologLoaders = new Map<string, string>();
  
  /**
   * Register a custom constraint definition.
   */
  register<T extends CustomConstraint>(definition: CustomConstraintDefinition<T>): void {
    if (this.definitions.has(definition.type)) {
      console.warn(`Constraint type '${definition.type}' is being re-registered`);
    }
    this.definitions.set(definition.type, definition as CustomConstraintDefinition);
  }
  
  /**
   * Unregister a constraint definition.
   */
  unregister(type: string): boolean {
    return this.definitions.delete(type);
  }
  
  /**
   * Get a constraint definition by type.
   */
  get(type: string): CustomConstraintDefinition | undefined {
    return this.definitions.get(type);
  }
  
  /**
   * Check if a constraint type is registered.
   */
  has(type: string): boolean {
    return this.definitions.has(type);
  }
  
  /**
   * Get all registered constraint types.
   */
  getAllTypes(): string[] {
    return Array.from(this.definitions.keys());
  }
  
  /**
   * Get all definitions in a category.
   */
  getByCategory(category: CustomConstraintCategory): CustomConstraintDefinition[] {
    return Array.from(this.definitions.values()).filter(d => d.category === category);
  }
  
  /**
   * Register custom Prolog code to be loaded with the constraint.
   */
  registerPrologCode(constraintType: string, prologCode: string): void {
    this.prologLoaders.set(constraintType, prologCode);
  }
  
  /**
   * Get Prolog code for a constraint type.
   */
  getPrologCode(constraintType: string): string | undefined {
    return this.prologLoaders.get(constraintType);
  }
  
  /**
   * Get all registered Prolog code.
   */
  getAllPrologCode(): string {
    return Array.from(this.prologLoaders.values()).join('\n\n');
  }
  
  /**
   * Convert a custom constraint to Prolog fact.
   */
  constraintToPrologFact(constraint: CustomConstraint, specId: string): string | null {
    const def = this.definitions.get(constraint.type);
    if (!def) {
      console.warn(`No definition for constraint type '${constraint.type}'`);
      return null;
    }
    return def.toPrologFact(constraint, specId);
  }
  
  /**
   * Convert a custom constraint to Prolog term.
   */
  constraintToPrologTerm(constraint: CustomConstraint): string | null {
    const def = this.definitions.get(constraint.type);
    if (!def) {
      return null;
    }
    return def.toPrologTerm(constraint);
  }
  
  /**
   * Validate a custom constraint.
   */
  validate(constraint: CustomConstraint): ValidationResult {
    const def = this.definitions.get(constraint.type);
    if (!def) {
      return {
        valid: false,
        errors: [`Unknown constraint type: ${constraint.type}`],
        warnings: [],
      };
    }
    if (def.validate) {
      return def.validate(constraint);
    }
    return { valid: true, errors: [], warnings: [] };
  }
  
  /**
   * Find conflicts for a constraint against a list of others.
   */
  findConflicts(constraint: CustomConstraint, others: MusicConstraint[]): ConflictInfo[] {
    const def = this.definitions.get(constraint.type);
    if (!def || !def.getConflicts) {
      return [];
    }
    return def.getConflicts(constraint, others);
  }
  
  /**
   * Clear all registrations (mainly for testing).
   */
  clear(): void {
    this.definitions.clear();
    this.prologLoaders.clear();
  }
}

/**
 * Global constraint registry instance.
 */
export const constraintRegistry = new ConstraintRegistry();

// ============================================================================
// HELPER FUNCTIONS FOR CREATING CUSTOM CONSTRAINTS
// ============================================================================

/**
 * Create a custom constraint with the given parameters.
 */
export function createCustomConstraint(
  type: string,
  params: Record<string, unknown>,
  hard = false,
  weight?: number
): CustomConstraint {
  return weight !== undefined
    ? { type, hard, weight, params }
    : { type, hard, params };
}

/**
 * Define and register a simple custom constraint.
 * Convenience function for common cases.
 */
export function defineSimpleConstraint(options: {
  type: string;
  displayName: string;
  description: string;
  category: CustomConstraintCategory;
  prologPredicate: string;
  parameterNames: string[];
  prologCode?: string;
}): void {
  const definition: CustomConstraintDefinition = {
    type: options.type,
    displayName: options.displayName,
    description: options.description,
    category: options.category,
    
    toPrologFact(constraint: CustomConstraint, specId: string): string {
      const hard = constraint.hard ? 'hard' : 'soft';
      const weight = constraint.weight ?? 1.0;
      const term = this.toPrologTerm(constraint);
      return `spec_constraint(${specId}, ${term}, ${hard}, ${weight}).`;
    },
    
    toPrologTerm(constraint: CustomConstraint): string {
      const args = options.parameterNames
        .map(name => {
          const val = constraint.params[name];
          if (typeof val === 'string') return val;
          if (typeof val === 'number') return String(val);
          if (typeof val === 'boolean') return val ? 'true' : 'false';
          return JSON.stringify(val);
        })
        .join(', ');
      return `${options.prologPredicate}(${args})`;
    },
  };
  
  constraintRegistry.register(definition);
  
  if (options.prologCode) {
    constraintRegistry.registerPrologCode(options.type, options.prologCode);
  }
}

// ============================================================================
// CARD INTEGRATION
// ============================================================================

/**
 * Interface for cards that contribute custom constraints.
 */
export interface ConstraintContributingCard {
  /** Get the constraint definitions this card contributes */
  getConstraintDefinitions(): CustomConstraintDefinition[];
  
  /** Get Prolog code this card requires */
  getPrologCode?(): string;
  
  /** Get current constraints from card state */
  getActiveConstraints(): CustomConstraint[];
}

/**
 * Register all constraints from a card.
 */
export function registerCardConstraints(card: ConstraintContributingCard): void {
  for (const def of card.getConstraintDefinitions()) {
    constraintRegistry.register(def);
  }
  
  if (card.getPrologCode) {
    const code = card.getPrologCode();
    if (code) {
      // Use first constraint type as key
      const defs = card.getConstraintDefinitions();
      const firstDef = defs[0];
      if (firstDef) {
        constraintRegistry.registerPrologCode(firstDef.type, code);
      }
    }
  }
}

// ============================================================================
// PROLOG LOADER INTEGRATION
// ============================================================================

/**
 * Generate Prolog code to load all custom constraint predicates.
 */
export function generateCustomPrologLoader(): string {
  const customCode = constraintRegistry.getAllPrologCode();
  
  if (!customCode.trim()) {
    return '%% No custom constraint Prolog code registered\n';
  }
  
  return `
%% ============================================================================
%% CUSTOM CONSTRAINT PREDICATES (User-Defined)
%% ============================================================================

${customCode}

%% Mark custom constraints as loaded
custom_constraints_loaded.
`;
}

/**
 * Get all custom constraints as Prolog facts for a given spec.
 */
export function customConstraintsToPrologFacts(
  constraints: CustomConstraint[],
  specId = 'current'
): string[] {
  const facts: string[] = [];
  
  for (const constraint of constraints) {
    const fact = constraintRegistry.constraintToPrologFact(constraint, specId);
    if (fact) {
      facts.push(fact);
    }
  }
  
  return facts;
}
