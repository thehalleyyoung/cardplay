/**
 * @file axis-parameter-bindings.ts
 * @status CANONICAL - Step 088
 * Step 088 [Ext][Type] — Define a schema for "axis → parameter bindings"
 * (e.g., width → param stereoWidth on certain cards).
 *
 * This module defines the complete binding system between perceptual axes and
 * actual card parameters. Extensions can declare bindings without modifying core code,
 * enabling "make it wider" to automatically map to the right parameter on the right card.
 *
 * Key design principles:
 * 1. Bindings are declarative and data-driven
 * 2. Bindings can be card-specific or role-based
 * 3. Direction and scaling are explicit (linear, exponential, inverted)
 * 4. Amount phrases map to concrete parameter values
 * 5. Bindings are validated and versioned
 *
 * @see src/gofai/extensions/axis-extension-system.ts for axis definitions
 * @see src/gofai/extensions/pack-annotations-schema.ts for pack manifest
 */

import type { AxisId } from './axis-extension-system.ts';
import type { CardPlayId } from '../../canon/id-validation.ts';
import type { GofaiId } from '../canon/types.ts';

/**
 * Direction of axis-to-parameter mapping.
 */
export type AxisParameterDirection =
  | 'positive'      // Increasing axis value increases parameter value
  | 'negative'      // Increasing axis value decreases parameter value
  | 'nonlinear';    // Custom transfer function required

/**
 * Scaling curve for parameter mapping.
 */
export type AxisParameterScaling =
  | 'linear'        // Linear interpolation
  | 'exponential'   // Exponential curve (for frequency, gain, etc.)
  | 'logarithmic'   // Log curve (inverse of exponential)
  | 'quadratic'     // Squared curve (gentle start, steep end)
  | 'custom';       // Custom function provided

/**
 * Amount phrase mapping to normalized value (0-1).
 * Extensions can add custom amount phrases.
 */
export interface AmountMapping {
  /** The phrase (e.g., "a little", "a lot", "slightly") */
  readonly phrase: string;
  /** Normalized value (0-1) within axis range */
  readonly value: number;
  /** Optional aliases for this phrase */
  readonly aliases?: readonly string[];
}

/**
 * Standard amount phrases used across all axes.
 * Extensions can override or extend these.
 */
export const STANDARD_AMOUNT_MAPPINGS: readonly AmountMapping[] = [
  { phrase: 'a tiny bit', value: 0.1, aliases: ['just a touch', 'barely'] },
  { phrase: 'a little', value: 0.2, aliases: ['slightly', 'a bit'] },
  { phrase: 'somewhat', value: 0.3, aliases: ['kind of', 'sort of'] },
  { phrase: 'moderately', value: 0.5, aliases: ['medium', 'halfway'] },
  { phrase: 'quite a bit', value: 0.7, aliases: ['pretty', 'fairly'] },
  { phrase: 'a lot', value: 0.8, aliases: ['much', 'very'] },
  { phrase: 'extremely', value: 0.95, aliases: ['massively', 'totally'] }
];

/**
 * Parameter value range with optional special values.
 */
export interface ParameterRange {
  /** Minimum value */
  readonly min: number;
  /** Maximum value */
  readonly max: number;
  /** Default/neutral value */
  readonly default: number;
  /** Optional special values with semantic meaning */
  readonly specialValues?: readonly {
    readonly value: number;
    readonly meaning: string;
  }[];
}

/**
 * Unit type for parameter values.
 */
export type ParameterUnit =
  | 'none'          // Dimensionless (0-1, multiplier)
  | 'hertz'         // Frequency (Hz)
  | 'decibels'      // Amplitude (dB)
  | 'milliseconds'  // Time (ms)
  | 'seconds'       // Time (s)
  | 'beats'         // Musical time (beats)
  | 'bars'          // Musical time (bars)
  | 'semitones'     // Pitch (semitones)
  | 'cents'         // Pitch (cents)
  | 'percent'       // Percentage (0-100)
  | 'ratio'         // Ratio (e.g., compression ratio)
  | 'degrees'       // Phase (degrees)
  | 'radians';      // Phase (radians)

/**
 * Complete binding from axis to card parameter.
 */
export interface AxisParameterBinding {
  /** Unique binding identifier (for debugging/provenance) */
  readonly id: GofaiId;
  /** Axis being bound */
  readonly axisId: AxisId;
  /** Target card ID (or wildcard pattern like "core:*" for role-based) */
  readonly cardId: CardPlayId | string;
  /** Parameter name on the card */
  readonly parameterName: string;
  /** Direction of mapping */
  readonly direction: AxisParameterDirection;
  /** Scaling curve */
  readonly scaling: AxisParameterScaling;
  /** Parameter range */
  readonly range: ParameterRange;
  /** Parameter unit */
  readonly unit: ParameterUnit;
  /** Amount phrase mappings (overrides or extends standard) */
  readonly amountMappings?: readonly AmountMapping[] | undefined;
  /** Custom transfer function reference (for 'custom' scaling) */
  readonly transferFunction?: string | undefined;
  /** Confidence/priority (0-1, higher = preferred in case of conflicts) */
  readonly confidence: number;
  /** Description of what this binding does */
  readonly description: string;
  /** Optional preconditions (e.g., "only when filter type is lowpass") */
  readonly preconditions?: readonly string[] | undefined;
  /** Extension namespace (undefined for builtins) */
  readonly namespace?: string | undefined;
  /** Schema version */
  readonly schemaVersion: '1.0';
}

/**
 * Role-based binding: applies to any card fulfilling a musical role.
 * E.g., "width" → stereo parameter on any card with role "spatial".
 */
export interface RoleBasedBinding {
  /** Unique binding identifier */
  readonly id: GofaiId;
  /** Axis being bound */
  readonly axisId: AxisId;
  /** Musical role (e.g., "spatial", "filter", "dynamics", "reverb") */
  readonly role: string;
  /** Parameter name pattern (can use wildcards) */
  readonly parameterPattern: string;
  /** Direction of mapping */
  readonly direction: AxisParameterDirection;
  /** Scaling curve */
  readonly scaling: AxisParameterScaling;
  /** Confidence/priority */
  readonly confidence: number;
  /** Description */
  readonly description: string;
  /** Extension namespace */
  readonly namespace?: string;
}

/**
 * Registry of axis-to-parameter bindings.
 */
export class AxisParameterBindingRegistry {
  private bindings = new Map<GofaiId, AxisParameterBinding>();
  private roleBindings = new Map<GofaiId, RoleBasedBinding>();
  private byAxis = new Map<AxisId, Set<GofaiId>>();
  private byCard = new Map<CardPlayId | string, Set<GofaiId>>();
  private byNamespace = new Map<string, Set<GofaiId>>();
  
  /**
   * Register an axis-to-parameter binding.
   */
  register(binding: AxisParameterBinding): void {
    if (this.bindings.has(binding.id)) {
      throw new Error(`Binding ${binding.id} is already registered`);
    }
    
    // Validate
    if (binding.confidence < 0 || binding.confidence > 1) {
      throw new Error(`Binding ${binding.id} confidence must be in [0, 1]`);
    }
    if (binding.range.min >= binding.range.max) {
      throw new Error(`Binding ${binding.id} range invalid: min must be < max`);
    }
    if (binding.range.default < binding.range.min || binding.range.default > binding.range.max) {
      throw new Error(`Binding ${binding.id} default value outside range`);
    }
    
    this.bindings.set(binding.id, binding);
    
    // Index by axis
    const axisSet = this.byAxis.get(binding.axisId) ?? new Set();
    axisSet.add(binding.id);
    this.byAxis.set(binding.axisId, axisSet);
    
    // Index by card
    const cardSet = this.byCard.get(binding.cardId) ?? new Set();
    cardSet.add(binding.id);
    this.byCard.set(binding.cardId, cardSet);
    
    // Index by namespace
    if (binding.namespace) {
      const nsSet = this.byNamespace.get(binding.namespace) ?? new Set();
      nsSet.add(binding.id);
      this.byNamespace.set(binding.namespace, nsSet);
    }
  }
  
  /**
   * Register a role-based binding.
   */
  registerRoleBased(binding: RoleBasedBinding): void {
    if (this.roleBindings.has(binding.id)) {
      throw new Error(`Role binding ${binding.id} is already registered`);
    }
    
    if (binding.confidence < 0 || binding.confidence > 1) {
      throw new Error(`Role binding ${binding.id} confidence must be in [0, 1]`);
    }
    
    this.roleBindings.set(binding.id, binding);
    
    // Also index by axis
    const axisSet = this.byAxis.get(binding.axisId) ?? new Set();
    axisSet.add(binding.id);
    this.byAxis.set(binding.axisId, axisSet);
  }
  
  /**
   * Get specific binding by ID.
   */
  get(bindingId: GofaiId): AxisParameterBinding | RoleBasedBinding | undefined {
    return this.bindings.get(bindingId) ?? this.roleBindings.get(bindingId);
  }
  
  /**
   * Get all bindings for an axis.
   */
  getByAxis(axisId: AxisId): readonly (AxisParameterBinding | RoleBasedBinding)[] {
    const ids = this.byAxis.get(axisId);
    if (!ids) return [];
    return Array.from(ids).map(id => this.get(id)!).filter(Boolean);
  }
  
  /**
   * Get all bindings for a specific card.
   */
  getByCard(cardId: CardPlayId | string): readonly AxisParameterBinding[] {
    const ids = this.byCard.get(cardId);
    if (!ids) return [];
    return Array.from(ids).map(id => this.bindings.get(id)!).filter(Boolean);
  }
  
  /**
   * Get all role-based bindings.
   */
  getRoleBasedBindings(): readonly RoleBasedBinding[] {
    return Array.from(this.roleBindings.values());
  }
  
  /**
   * Find applicable bindings for an axis on a card with given roles.
   */
  findBindings(
    axisId: AxisId,
    cardId: CardPlayId,
    roles: readonly string[]
  ): readonly (AxisParameterBinding | RoleBasedBinding)[] {
    const results: (AxisParameterBinding | RoleBasedBinding)[] = [];
    
    // Exact card bindings
    const cardBindings = Array.from(this.byCard.get(cardId) ?? [])
      .map(id => this.bindings.get(id))
      .filter((b): b is AxisParameterBinding => b !== undefined && b.axisId === axisId);
    results.push(...cardBindings);
    
    // Role-based bindings
    const roleSet = new Set(roles);
    const roleBindings = Array.from(this.roleBindings.values())
      .filter(b => b.axisId === axisId && roleSet.has(b.role));
    results.push(...roleBindings);
    
    // Sort by confidence (descending)
    results.sort((a, b) => b.confidence - a.confidence);
    
    return results;
  }
  
  /**
   * Resolve amount phrase to parameter value.
   */
  resolveAmount(
    bindingId: GofaiId,
    amountPhrase: string,
    axisValue: number
  ): number | undefined {
    const binding = this.bindings.get(bindingId);
    if (!binding) return undefined;
    
    // Use custom mappings if provided
    const mappings = binding.amountMappings ?? STANDARD_AMOUNT_MAPPINGS;
    
    // Find matching phrase
    const normalized = amountPhrase.toLowerCase().trim();
    const mapping = mappings.find(
      m => m.phrase === normalized || m.aliases?.includes(normalized)
    );
    
    if (!mapping) return undefined;
    
    // Scale to parameter range
    return this.scaleToParameter(binding, mapping.value * axisValue);
  }
  
  /**
   * Scale normalized axis value (0-1) to parameter value.
   */
  scaleToParameter(binding: AxisParameterBinding, normalizedValue: number): number {
    const { range, scaling, direction } = binding;
    
    // Apply direction
    let value = normalizedValue;
    if (direction === 'negative') {
      value = 1 - value;
    }
    
    // Apply scaling curve
    switch (scaling) {
      case 'linear':
        value = value; // Identity
        break;
      case 'exponential':
        value = Math.exp(value * Math.log(10)) / 10; // 0-1 → 0.1-1 exponential
        break;
      case 'logarithmic':
        value = Math.log(value * 9 + 1) / Math.log(10); // 0-1 → 0-1 logarithmic
        break;
      case 'quadratic':
        value = value * value;
        break;
      case 'custom':
        // Would call binding.transferFunction if provided
        console.warn(`Custom transfer function not yet implemented for ${binding.id}`);
        break;
    }
    
    // Map to parameter range
    return range.min + value * (range.max - range.min);
  }
  
  /**
   * Scale parameter value back to normalized axis value (inverse).
   */
  scaleToAxis(binding: AxisParameterBinding, parameterValue: number): number {
    const { range, scaling, direction } = binding;
    
    // Normalize to 0-1
    let value = (parameterValue - range.min) / (range.max - range.min);
    value = Math.max(0, Math.min(1, value)); // Clamp
    
    // Invert scaling curve
    switch (scaling) {
      case 'linear':
        value = value;
        break;
      case 'exponential':
        value = Math.log(value * 10) / Math.log(10);
        break;
      case 'logarithmic':
        value = (Math.pow(10, value) - 1) / 9;
        break;
      case 'quadratic':
        value = Math.sqrt(value);
        break;
      case 'custom':
        console.warn(`Custom inverse not yet implemented for ${binding.id}`);
        break;
    }
    
    // Apply direction
    if (direction === 'negative') {
      value = 1 - value;
    }
    
    return value;
  }
  
  /**
   * Unregister a binding.
   */
  unregister(bindingId: GofaiId): boolean {
    const binding = this.bindings.get(bindingId);
    const roleBinding = this.roleBindings.get(bindingId);
    
    if (binding) {
      this.bindings.delete(bindingId);
      
      // Remove from indices
      const axisSet = this.byAxis.get(binding.axisId);
      if (axisSet) {
        axisSet.delete(bindingId);
        if (axisSet.size === 0) {
          this.byAxis.delete(binding.axisId);
        }
      }
      
      const cardSet = this.byCard.get(binding.cardId);
      if (cardSet) {
        cardSet.delete(bindingId);
        if (cardSet.size === 0) {
          this.byCard.delete(binding.cardId);
        }
      }
      
      if (binding.namespace) {
        const nsSet = this.byNamespace.get(binding.namespace);
        if (nsSet) {
          nsSet.delete(bindingId);
          if (nsSet.size === 0) {
            this.byNamespace.delete(binding.namespace);
          }
        }
      }
      
      return true;
    }
    
    if (roleBinding) {
      this.roleBindings.delete(bindingId);
      
      const axisSet = this.byAxis.get(roleBinding.axisId);
      if (axisSet) {
        axisSet.delete(bindingId);
        if (axisSet.size === 0) {
          this.byAxis.delete(roleBinding.axisId);
        }
      }
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Unregister all bindings from a namespace.
   */
  unregisterNamespace(namespace: string): void {
    const ids = this.byNamespace.get(namespace);
    if (!ids) return;
    
    for (const id of Array.from(ids)) {
      this.unregister(id);
    }
  }
  
  /**
   * Clear all bindings (for testing).
   */
  clear(): void {
    this.bindings.clear();
    this.roleBindings.clear();
    this.byAxis.clear();
    this.byCard.clear();
    this.byNamespace.clear();
  }
}

/**
 * Singleton binding registry.
 */
export const bindingRegistry = new AxisParameterBindingRegistry();

// ============================================================================
// Builtin Bindings Registration
// ============================================================================

/**
 * Register core axis-to-parameter bindings.
 */
export function registerBuiltinBindings(): void {
  // Width → Stereo Width parameter on any spatial card
  bindingRegistry.registerRoleBased({
    id: 'builtin:width_to_stereo' as GofaiId,
    axisId: 'width' as AxisId,
    role: 'spatial',
    parameterPattern: '*width*',
    direction: 'positive',
    scaling: 'linear',
    confidence: 0.9,
    description: 'Maps width axis to stereo width parameter on spatial processors'
  });
  
  // Brightness → High-frequency EQ
  bindingRegistry.registerRoleBased({
    id: 'builtin:brightness_to_highshelf' as GofaiId,
    axisId: 'brightness' as AxisId,
    role: 'equalizer',
    parameterPattern: 'high*gain',
    direction: 'positive',
    scaling: 'linear',
    confidence: 0.85,
    description: 'Maps brightness to high-shelf gain on EQ cards'
  });
  
  // Warmth → Low-mid boost
  bindingRegistry.registerRoleBased({
    id: 'builtin:warmth_to_lowmid' as GofaiId,
    axisId: 'warmth' as AxisId,
    role: 'equalizer',
    parameterPattern: '*lowmid*gain',
    direction: 'positive',
    scaling: 'linear',
    confidence: 0.8,
    description: 'Maps warmth to low-mid gain on EQ cards'
  });
  
  // Depth → Reverb amount
  bindingRegistry.registerRoleBased({
    id: 'builtin:depth_to_reverb' as GofaiId,
    axisId: 'depth' as AxisId,
    role: 'reverb',
    parameterPattern: '*mix*',
    direction: 'positive',
    scaling: 'exponential',
    confidence: 0.9,
    description: 'Maps depth to reverb mix parameter'
  });
  
  // Intimacy → Dry signal (inverse of reverb)
  bindingRegistry.registerRoleBased({
    id: 'builtin:intimacy_to_dry' as GofaiId,
    axisId: 'intimacy' as AxisId,
    role: 'reverb',
    parameterPattern: '*mix*',
    direction: 'negative',
    scaling: 'exponential',
    confidence: 0.85,
    description: 'Maps intimacy to reduced reverb (more dry signal)'
  });
  
  // Air → Ultra-high boost
  bindingRegistry.registerRoleBased({
    id: 'builtin:air_to_ultrahigh' as GofaiId,
    axisId: 'air' as AxisId,
    role: 'equalizer',
    parameterPattern: '*air*',
    direction: 'positive',
    scaling: 'linear',
    confidence: 0.9,
    description: 'Maps air to ultra-high frequency boost (10kHz+)'
  });
}

// Register builtin bindings
registerBuiltinBindings();

/**
 * Helper to create binding from pack annotation.
 */
export function createBindingFromAnnotation(
  bindingId: GofaiId,
  axisId: AxisId,
  cardId: CardPlayId,
  paramName: string,
  annotation: {
    readonly direction: AxisParameterDirection;
    readonly scaling?: AxisParameterScaling;
    readonly range?: ParameterRange;
    readonly unit?: ParameterUnit;
    readonly amountMappings?: readonly AmountMapping[];
    readonly confidence?: number;
    readonly description?: string;
  },
  namespace?: string
): AxisParameterBinding {
  return {
    id: bindingId,
    axisId,
    cardId,
    parameterName: paramName,
    direction: annotation.direction,
    scaling: annotation.scaling ?? 'linear',
    range: annotation.range ?? { min: 0, max: 1, default: 0.5 },
    unit: annotation.unit ?? 'none',
    amountMappings: annotation.amountMappings ?? undefined,
    transferFunction: undefined,
    confidence: annotation.confidence ?? 0.7,
    description: annotation.description ?? `Maps ${axisId} to ${paramName} on ${cardId}`,
    preconditions: undefined,
    namespace,
    schemaVersion: '1.0'
  };
}

/**
 * Register bindings from pack annotations.
 */
export function registerExtensionBindings(
  cardId: CardPlayId,
  axisBindings: Record<string, any>,
  namespace: string
): void {
  for (const [axisId, bindingData] of Object.entries(axisBindings)) {
    const fullAxisId = axisId.includes(':') ? axisId : `${namespace}:${axisId}`;
    
    for (const [paramName, paramData] of Object.entries(bindingData.parameters || {})) {
      const bindingId = `${namespace}:${cardId}_${axisId}_${paramName}` as GofaiId;
      
      try {
        const binding = createBindingFromAnnotation(
          bindingId,
          fullAxisId as AxisId,
          cardId,
          paramName,
          paramData as any,
          namespace
        );
        bindingRegistry.register(binding);
      } catch (err) {
        console.error(`Failed to register binding ${bindingId}:`, err);
        throw err;
      }
    }
  }
}

/**
 * Unregister all bindings from a namespace.
 */
export function unregisterExtensionBindings(namespace: string): void {
  bindingRegistry.unregisterNamespace(namespace);
}
