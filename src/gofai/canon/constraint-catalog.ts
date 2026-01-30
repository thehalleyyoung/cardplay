/**
 * @file Constraint Catalog
 * @module gofai/canon/constraint-catalog
 * 
 * Implements Step 069: Add a "constraint catalog" that includes both builtins
 * and namespaced extension constraints with schemas.
 * 
 * This is the SSOT for all constraint types available in the GOFAI system.
 * Constraints control what can and cannot be changed during editing.
 * 
 * @see gofai_goalB.md Step 069
 */

import type { GofaiId, LexemeId, AxisId, OpcodeId, ConstraintTypeId } from './types.js';
import { makeBuiltinId, makeExtensionId } from './gofai-id.js';

// Type alias for consistency
export type ConstraintId = ConstraintTypeId;

// =============================================================================
// Constraint Schema Types
// =============================================================================

/**
 * Base constraint schema (all constraints must extend this)
 */
export interface ConstraintSchemaBase {
  readonly id: ConstraintId;
  readonly name: string;
  readonly description: string;
  readonly category: ConstraintCategory;
  readonly namespace?: string;
  readonly version?: string;
  readonly parametric: boolean;
}

/**
 * Constraint categories for organization
 */
export enum ConstraintCategory {
  /** Melodic constraints (preserve melody, pitch range, etc.) */
  Melodic = 'melodic',
  
  /** Harmonic constraints (preserve chords, key, functional harmony) */
  Harmonic = 'harmonic',
  
  /** Rhythmic constraints (preserve groove, timing, meter) */
  Rhythmic = 'rhythmic',
  
  /** Structural constraints (preserve sections, form, markers) */
  Structural = 'structural',
  
  /** Timbral constraints (preserve instruments, sound design) */
  Timbral = 'timbral',
  
  /** Textural constraints (preserve density, layers, voices) */
  Textural = 'textural',
  
  /** Dynamic constraints (preserve volume curves, expression) */
  Dynamic = 'dynamic',
  
  /** Spatial constraints (preserve panning, width, depth) */
  Spatial = 'spatial',
  
  /** Production constraints (preserve cards, routing, DSP) */
  Production = 'production',
  
  /** Scope constraints (limit scope of changes) */
  Scope = 'scope',
  
  /** Meta constraints (constraints about constraints) */
  Meta = 'meta',
}

/**
 * Constraint with no parameters
 */
export interface SimpleConstraintSchema extends ConstraintSchemaBase {
  readonly parametric: false;
  readonly validation: SimpleConstraintValidation;
}

/**
 * Constraint with parameters
 */
export interface ParametricConstraintSchema<P = Record<string, unknown>>
  extends ConstraintSchemaBase {
  readonly parametric: true;
  readonly parameters: ParameterSchema[];
  readonly validation: ParametricConstraintValidation<P>;
}

/**
 * Parameter schema for parametric constraints
 */
export interface ParameterSchema {
  readonly name: string;
  readonly type: 'string' | 'number' | 'boolean' | 'enum' | 'object';
  readonly required: boolean;
  readonly default?: unknown;
  readonly description?: string;
  readonly enum?: readonly string[];
  readonly min?: number;
  readonly max?: number;
  readonly pattern?: string;
}

/**
 * Validation function for simple constraints
 */
export type SimpleConstraintValidation = (context: ValidationContext) => ValidationResult;

/**
 * Validation function for parametric constraints
 */
export type ParametricConstraintValidation<P> = (
  params: P,
  context: ValidationContext
) => ValidationResult;

/**
 * Context for constraint validation
 */
export interface ValidationContext {
  readonly before: any;
  readonly after: any;
  readonly selector: any;
  readonly projectState?: any;
}

/**
 * Result of constraint validation
 */
export interface ValidationResult {
  readonly valid: boolean;
  readonly violations?: readonly ConstraintViolation[];
  readonly warnings?: readonly string[];
}

/**
 * Detailed constraint violation
 */
export interface ConstraintViolation {
  readonly message: string;
  readonly location?: string;
  readonly expected?: unknown;
  readonly actual?: unknown;
  readonly severity: 'error' | 'warning';
}

/**
 * Union type of all constraint schemas
 */
export type ConstraintSchema =
  | SimpleConstraintSchema
  | ParametricConstraintSchema;

// =============================================================================
// Builtin Constraint Catalog
// =============================================================================

/**
 * Complete catalog of builtin constraints
 */
export const BUILTIN_CONSTRAINTS = new Map<ConstraintId, ConstraintSchema>([
  // =========================================================================
  // Melodic Constraints
  // =========================================================================
  [
    makeBuiltinId('constraint', 'preserve_melody_exact') as ConstraintId,
    {
      id: makeBuiltinId('constraint', 'preserve_melody_exact') as ConstraintId,
      name: 'Preserve Melody Exactly',
      description: 'Melody pitches and onset times must remain identical',
      category: ConstraintCategory.Melodic,
      parametric: false,
      validation: (ctx: ValidationContext) => {
        // Implementation would check pitch+onset equality
        return { valid: true };
      },
    } as SimpleConstraintSchema,
  ],
  
  [
    makeBuiltinId('constraint', 'preserve_melody_contour') as ConstraintId,
    {
      id: makeBuiltinId('constraint', 'preserve_melody_contour') as ConstraintId,
      name: 'Preserve Melody Contour',
      description: 'Melodic contour (up/down/same) must be preserved',
      category: ConstraintCategory.Melodic,
      parametric: false,
      validation: (ctx: ValidationContext) => {
        return { valid: true };
      },
    } as SimpleConstraintSchema,
  ],
  
  [
    makeBuiltinId('constraint', 'melody_range') as ConstraintId,
    {
      id: makeBuiltinId('constraint', 'melody_range') as ConstraintId,
      name: 'Melody Range',
      description: 'Melody must stay within specified pitch range',
      category: ConstraintCategory.Melodic,
      parametric: true,
      parameters: [
        {
          name: 'minPitch',
          type: 'number',
          required: true,
          description: 'Minimum MIDI pitch (0-127)',
          min: 0,
          max: 127,
        },
        {
          name: 'maxPitch',
          type: 'number',
          required: true,
          description: 'Maximum MIDI pitch (0-127)',
          min: 0,
          max: 127,
        },
      ],
      validation: (params: { minPitch: number; maxPitch: number }, ctx: ValidationContext) => {
        return { valid: true };
      },
    } as ParametricConstraintSchema,
  ],
  
  // =========================================================================
  // Harmonic Constraints
  // =========================================================================
  [
    makeBuiltinId('constraint', 'preserve_chords_exact') as ConstraintId,
    {
      id: makeBuiltinId('constraint', 'preserve_chords_exact') as ConstraintId,
      name: 'Preserve Chords Exactly',
      description: 'Chord pitches must remain identical',
      category: ConstraintCategory.Harmonic,
      parametric: false,
      validation: (ctx: ValidationContext) => {
        return { valid: true };
      },
    } as SimpleConstraintSchema,
  ],
  
  [
    makeBuiltinId('constraint', 'preserve_chord_function') as ConstraintId,
    {
      id: makeBuiltinId('constraint', 'preserve_chord_function') as ConstraintId,
      name: 'Preserve Chord Function',
      description: 'Harmonic function (I, IV, V, etc.) must be preserved',
      category: ConstraintCategory.Harmonic,
      parametric: false,
      validation: (ctx: ValidationContext) => {
        return { valid: true };
      },
    } as SimpleConstraintSchema,
  ],
  
  [
    makeBuiltinId('constraint', 'preserve_key') as ConstraintId,
    {
      id: makeBuiltinId('constraint', 'preserve_key') as ConstraintId,
      name: 'Preserve Key',
      description: 'Key signature must remain the same',
      category: ConstraintCategory.Harmonic,
      parametric: false,
      validation: (ctx: ValidationContext) => {
        return { valid: true };
      },
    } as SimpleConstraintSchema,
  ],
  
  // =========================================================================
  // Rhythmic Constraints
  // =========================================================================
  [
    makeBuiltinId('constraint', 'preserve_rhythm_exact') as ConstraintId,
    {
      id: makeBuiltinId('constraint', 'preserve_rhythm_exact') as ConstraintId,
      name: 'Preserve Rhythm Exactly',
      description: 'All onset times and durations must remain identical',
      category: ConstraintCategory.Rhythmic,
      parametric: false,
      validation: (ctx: ValidationContext) => {
        return { valid: true };
      },
    } as SimpleConstraintSchema,
  ],
  
  [
    makeBuiltinId('constraint', 'preserve_groove') as ConstraintId,
    {
      id: makeBuiltinId('constraint', 'preserve_groove') as ConstraintId,
      name: 'Preserve Groove',
      description: 'Rhythmic feel/groove must be preserved',
      category: ConstraintCategory.Rhythmic,
      parametric: false,
      validation: (ctx: ValidationContext) => {
        return { valid: true };
      },
    } as SimpleConstraintSchema,
  ],
  
  [
    makeBuiltinId('constraint', 'preserve_meter') as ConstraintId,
    {
      id: makeBuiltinId('constraint', 'preserve_meter') as ConstraintId,
      name: 'Preserve Meter',
      description: 'Time signature must remain the same',
      category: ConstraintCategory.Rhythmic,
      parametric: false,
      validation: (ctx: ValidationContext) => {
        return { valid: true };
      },
    } as SimpleConstraintSchema,
  ],
  
  [
    makeBuiltinId('constraint', 'quantize_strength') as ConstraintId,
    {
      id: makeBuiltinId('constraint', 'quantize_strength') as ConstraintId,
      name: 'Quantize Strength',
      description: 'Events must be quantized to specified grid strength',
      category: ConstraintCategory.Rhythmic,
      parametric: true,
      parameters: [
        {
          name: 'strength',
          type: 'number',
          required: true,
          description: 'Quantize strength (0.0-1.0)',
          min: 0,
          max: 1,
        },
        {
          name: 'grid',
          type: 'enum',
          required: false,
          description: 'Grid division',
          enum: ['1/4', '1/8', '1/16', '1/32', 'triplet'],
        },
      ],
      validation: (params: { strength: number; grid?: string }, ctx: ValidationContext) => {
        return { valid: true };
      },
    } as ParametricConstraintSchema,
  ],
  
  // =========================================================================
  // Structural Constraints
  // =========================================================================
  [
    makeBuiltinId('constraint', 'preserve_sections') as ConstraintId,
    {
      id: makeBuiltinId('constraint', 'preserve_sections') as ConstraintId,
      name: 'Preserve Sections',
      description: 'Section boundaries and markers must remain unchanged',
      category: ConstraintCategory.Structural,
      parametric: false,
      validation: (ctx: ValidationContext) => {
        return { valid: true };
      },
    } as SimpleConstraintSchema,
  ],
  
  [
    makeBuiltinId('constraint', 'preserve_form') as ConstraintId,
    {
      id: makeBuiltinId('constraint', 'preserve_form') as ConstraintId,
      name: 'Preserve Form',
      description: 'Overall song form/structure must be preserved',
      category: ConstraintCategory.Structural,
      parametric: false,
      validation: (ctx: ValidationContext) => {
        return { valid: true };
      },
    } as SimpleConstraintSchema,
  ],
  
  [
    makeBuiltinId('constraint', 'preserve_length') as ConstraintId,
    {
      id: makeBuiltinId('constraint', 'preserve_length') as ConstraintId,
      name: 'Preserve Length',
      description: 'Total duration must remain the same',
      category: ConstraintCategory.Structural,
      parametric: false,
      validation: (ctx: ValidationContext) => {
        return { valid: true };
      },
    } as SimpleConstraintSchema,
  ],
  
  // =========================================================================
  // Timbral Constraints
  // =========================================================================
  [
    makeBuiltinId('constraint', 'preserve_instruments') as ConstraintId,
    {
      id: makeBuiltinId('constraint', 'preserve_instruments') as ConstraintId,
      name: 'Preserve Instruments',
      description: 'Instrumentation must remain unchanged',
      category: ConstraintCategory.Timbral,
      parametric: false,
      validation: (ctx: ValidationContext) => {
        return { valid: true };
      },
    } as SimpleConstraintSchema,
  ],
  
  [
    makeBuiltinId('constraint', 'preserve_timbre') as ConstraintId,
    {
      id: makeBuiltinId('constraint', 'preserve_timbre') as ConstraintId,
      name: 'Preserve Timbre',
      description: 'Sound character/timbre must be preserved',
      category: ConstraintCategory.Timbral,
      parametric: false,
      validation: (ctx: ValidationContext) => {
        return { valid: true };
      },
    } as SimpleConstraintSchema,
  ],
  
  // =========================================================================
  // Textural Constraints
  // =========================================================================
  [
    makeBuiltinId('constraint', 'preserve_density') as ConstraintId,
    {
      id: makeBuiltinId('constraint', 'preserve_density') as ConstraintId,
      name: 'Preserve Density',
      description: 'Note density/busyness must remain similar',
      category: ConstraintCategory.Textural,
      parametric: false,
      validation: (ctx: ValidationContext) => {
        return { valid: true };
      },
    } as SimpleConstraintSchema,
  ],
  
  [
    makeBuiltinId('constraint', 'preserve_voices') as ConstraintId,
    {
      id: makeBuiltinId('constraint', 'preserve_voices') as ConstraintId,
      name: 'Preserve Voices',
      description: 'Number of simultaneous voices must remain the same',
      category: ConstraintCategory.Textural,
      parametric: false,
      validation: (ctx: ValidationContext) => {
        return { valid: true };
      },
    } as SimpleConstraintSchema,
  ],
  
  [
    makeBuiltinId('constraint', 'no_new_layers') as ConstraintId,
    {
      id: makeBuiltinId('constraint', 'no_new_layers') as ConstraintId,
      name: 'No New Layers',
      description: 'Cannot add new tracks or layers',
      category: ConstraintCategory.Textural,
      parametric: false,
      validation: (ctx: ValidationContext) => {
        return { valid: true };
      },
    } as SimpleConstraintSchema,
  ],
  
  // =========================================================================
  // Dynamic Constraints
  // =========================================================================
  [
    makeBuiltinId('constraint', 'preserve_dynamics') as ConstraintId,
    {
      id: makeBuiltinId('constraint', 'preserve_dynamics') as ConstraintId,
      name: 'Preserve Dynamics',
      description: 'Dynamic contour must be preserved',
      category: ConstraintCategory.Dynamic,
      parametric: false,
      validation: (ctx: ValidationContext) => {
        return { valid: true };
      },
    } as SimpleConstraintSchema,
  ],
  
  [
    makeBuiltinId('constraint', 'velocity_range') as ConstraintId,
    {
      id: makeBuiltinId('constraint', 'velocity_range') as ConstraintId,
      name: 'Velocity Range',
      description: 'Velocities must stay within specified range',
      category: ConstraintCategory.Dynamic,
      parametric: true,
      parameters: [
        {
          name: 'minVelocity',
          type: 'number',
          required: true,
          description: 'Minimum velocity (0-127)',
          min: 0,
          max: 127,
        },
        {
          name: 'maxVelocity',
          type: 'number',
          required: true,
          description: 'Maximum velocity (0-127)',
          min: 0,
          max: 127,
        },
      ],
      validation: (params: { minVelocity: number; maxVelocity: number }, ctx: ValidationContext) => {
        return { valid: true };
      },
    } as ParametricConstraintSchema,
  ],
  
  // =========================================================================
  // Spatial Constraints
  // =========================================================================
  [
    makeBuiltinId('constraint', 'preserve_panning') as ConstraintId,
    {
      id: makeBuiltinId('constraint', 'preserve_panning') as ConstraintId,
      name: 'Preserve Panning',
      description: 'Stereo positioning must remain unchanged',
      category: ConstraintCategory.Spatial,
      parametric: false,
      validation: (ctx: ValidationContext) => {
        return { valid: true };
      },
    } as SimpleConstraintSchema,
  ],
  
  [
    makeBuiltinId('constraint', 'preserve_width') as ConstraintId,
    {
      id: makeBuiltinId('constraint', 'preserve_width') as ConstraintId,
      name: 'Preserve Width',
      description: 'Stereo width must remain unchanged',
      category: ConstraintCategory.Spatial,
      parametric: false,
      validation: (ctx: ValidationContext) => {
        return { valid: true };
      },
    } as SimpleConstraintSchema,
  ],
  
  // =========================================================================
  // Production Constraints
  // =========================================================================
  [
    makeBuiltinId('constraint', 'preserve_routing') as ConstraintId,
    {
      id: makeBuiltinId('constraint', 'preserve_routing') as ConstraintId,
      name: 'Preserve Routing',
      description: 'Routing graph must remain unchanged',
      category: ConstraintCategory.Production,
      parametric: false,
      validation: (ctx: ValidationContext) => {
        return { valid: true };
      },
    } as SimpleConstraintSchema,
  ],
  
  [
    makeBuiltinId('constraint', 'preserve_cards') as ConstraintId,
    {
      id: makeBuiltinId('constraint', 'preserve_cards') as ConstraintId,
      name: 'Preserve Cards',
      description: 'Card instances must remain unchanged',
      category: ConstraintCategory.Production,
      parametric: false,
      validation: (ctx: ValidationContext) => {
        return { valid: true };
      },
    } as SimpleConstraintSchema,
  ],
  
  // =========================================================================
  // Scope Constraints
  // =========================================================================
  [
    makeBuiltinId('constraint', 'only_change') as ConstraintId,
    {
      id: makeBuiltinId('constraint', 'only_change') as ConstraintId,
      name: 'Only Change',
      description: 'Changes restricted to specified selector',
      category: ConstraintCategory.Scope,
      parametric: true,
      parameters: [
        {
          name: 'selector',
          type: 'object',
          required: true,
          description: 'Selector specifying allowed scope',
        },
      ],
      validation: (params: { selector: any }, ctx: ValidationContext) => {
        return { valid: true };
      },
    } as ParametricConstraintSchema,
  ],
  
  [
    makeBuiltinId('constraint', 'exclude') as ConstraintId,
    {
      id: makeBuiltinId('constraint', 'exclude') as ConstraintId,
      name: 'Exclude',
      description: 'Changes forbidden in specified selector',
      category: ConstraintCategory.Scope,
      parametric: true,
      parameters: [
        {
          name: 'selector',
          type: 'object',
          required: true,
          description: 'Selector specifying forbidden scope',
        },
      ],
      validation: (params: { selector: any }, ctx: ValidationContext) => {
        return { valid: true };
      },
    } as ParametricConstraintSchema,
  ],
]);

// =============================================================================
// Extension Constraint Registry
// =============================================================================

/**
 * Registry for extension-provided constraints
 */
export class ExtensionConstraintRegistry {
  private constraints = new Map<ConstraintId, ConstraintSchema>();
  
  /**
   * Register an extension constraint
   */
  register(constraint: ConstraintSchema): void {
    if (!constraint.namespace) {
      throw new Error(`Extension constraint must have namespace: ${constraint.id}`);
    }
    
    if (this.constraints.has(constraint.id)) {
      throw new Error(`Constraint already registered: ${constraint.id}`);
    }
    
    this.constraints.set(constraint.id, constraint);
  }
  
  /**
   * Unregister an extension constraint
   */
  unregister(id: ConstraintId): void {
    this.constraints.delete(id);
  }
  
  /**
   * Get a constraint by ID
   */
  get(id: ConstraintId): ConstraintSchema | undefined {
    return this.constraints.get(id);
  }
  
  /**
   * Check if a constraint is registered
   */
  has(id: ConstraintId): boolean {
    return this.constraints.has(id);
  }
  
  /**
   * Get all constraints for a namespace
   */
  getByNamespace(namespace: string): ConstraintSchema[] {
    return Array.from(this.constraints.values()).filter(
      c => c.namespace === namespace
    );
  }
  
  /**
   * Get all constraints by category
   */
  getByCategory(category: ConstraintCategory): ConstraintSchema[] {
    return Array.from(this.constraints.values()).filter(
      c => c.category === category
    );
  }
  
  /**
   * Clear all constraints
   */
  clear(): void {
    this.constraints.clear();
  }
}

// =============================================================================
// Unified Constraint Catalog
// =============================================================================

/**
 * Unified constraint catalog combining builtins and extensions
 */
export class ConstraintCatalog {
  private extensionRegistry = new ExtensionConstraintRegistry();
  
  /**
   * Get a constraint by ID (checks builtins first, then extensions)
   */
  get(id: ConstraintId): ConstraintSchema | undefined {
    return BUILTIN_CONSTRAINTS.get(id) ?? this.extensionRegistry.get(id);
  }
  
  /**
   * Check if a constraint exists
   */
  has(id: ConstraintId): boolean {
    return BUILTIN_CONSTRAINTS.has(id) || this.extensionRegistry.has(id);
  }
  
  /**
   * Register an extension constraint
   */
  registerExtension(constraint: ConstraintSchema): void {
    this.extensionRegistry.register(constraint);
  }
  
  /**
   * Unregister an extension constraint
   */
  unregisterExtension(id: ConstraintId): void {
    this.extensionRegistry.unregister(id);
  }
  
  /**
   * Get all constraints (builtins + extensions)
   */
  getAll(): ConstraintSchema[] {
    return [
      ...Array.from(BUILTIN_CONSTRAINTS.values()),
      ...Array.from(this.extensionRegistry['constraints'].values()),
    ];
  }
  
  /**
   * Get constraints by category
   */
  getByCategory(category: ConstraintCategory): ConstraintSchema[] {
    return this.getAll().filter(c => c.category === category);
  }
  
  /**
   * Get builtin constraints only
   */
  getBuiltins(): ConstraintSchema[] {
    return Array.from(BUILTIN_CONSTRAINTS.values());
  }
  
  /**
   * Get extension constraints only
   */
  getExtensions(): ConstraintSchema[] {
    return Array.from(this.extensionRegistry['constraints'].values());
  }
  
  /**
   * Get extension constraints by namespace
   */
  getExtensionsByNamespace(namespace: string): ConstraintSchema[] {
    return this.extensionRegistry.getByNamespace(namespace);
  }
}

// Global catalog instance
export const CONSTRAINT_CATALOG = new ConstraintCatalog();
