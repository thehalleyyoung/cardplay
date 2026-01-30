/**
 * Cost Hierarchy — User-Aligned Edit Costs
 * 
 * Implements Step 255 from gofai_goalB.md Phase 5:
 * Define a cost hierarchy aligned with user expectations about what's "expensive" to change.
 * 
 * This module provides a detailed, musically-informed cost model that reflects:
 * - Creative salience (melody changes are more significant than reverb tweaks)
 * - Reversibility (destructive operations cost more)
 * - Cognitive load (complex operations cost more)
 * - Musical conventions (some changes are "big moves" in music production)
 * 
 * The cost hierarchy is designed to make "least-change" planning align with
 * musician intuitions about minimal edits.
 * 
 * @module gofai/planning/cost-hierarchy
 */

import type { OpcodeId, OpcodeCategory } from './plan-types';
import { createOpcodeId } from './plan-types';

// =============================================================================
// Cost Hierarchy Layers
// =============================================================================

/**
 * Primary cost tier based on musical/creative significance
 */
export enum CostTier {
  /** Nearly free — Metadata, labels, visual-only changes */
  TRIVIAL = 1,
  
  /** Very low cost — DSP parameters, subtle tweaks */
  MINIMAL = 2,
  
  /** Low cost — Texture, density, arrangement details */
  LOW = 3,
  
  /** Moderate cost — Rhythm, groove, voicing */
  MODERATE = 4,
  
  /** High cost — Harmony, structure, register */
  HIGH = 5,
  
  /** Very high cost — Melody, core content */
  VERY_HIGH = 6,
  
  /** Critical cost — Destructive, hard-to-reverse operations */
  CRITICAL = 7,
}

/**
 * Secondary cost factors that modify the base tier
 */
export interface CostModifiers {
  /** Destructive operations (delete, clear, replace) */
  readonly destructive: number; // multiplier: 1.8
  
  /** Operations that affect multiple layers/sections */
  readonly broadScope: number; // multiplier: 1.3
  
  /** Operations that require analysis/inference */
  readonly inferenceRequired: number; // multiplier: 1.2
  
  /** Operations that might violate constraints */
  readonly constraintRisky: number; // multiplier: 1.5
  
  /** Operations requiring user decision */
  readonly ambiguous: number; // multiplier: 1.4
  
  /** Operations that are hard to preview accurately */
  readonly unpredictable: number; // multiplier: 1.3
}

/**
 * Standard cost modifiers
 */
export const STANDARD_COST_MODIFIERS: CostModifiers = {
  destructive: 1.8,
  broadScope: 1.3,
  inferenceRequired: 1.2,
  constraintRisky: 1.5,
  ambiguous: 1.4,
  unpredictable: 1.3,
};

// =============================================================================
// Opcode Cost Assignments
// =============================================================================

/**
 * Detailed cost assignment for specific opcodes
 */
export interface OpcodeCostSpec {
  readonly id: OpcodeId;
  readonly baseTier: CostTier;
  readonly modifiers: readonly (keyof CostModifiers)[];
  readonly rationale: string;
}

/**
 * Comprehensive opcode cost catalog
 * 
 * This catalog assigns costs based on:
 * 1. Musical significance (how "big" is this change?)
 * 2. Reversibility (can the user easily undo mental model of change?)
 * 3. Risk (might this break something or violate expectations?)
 * 4. Complexity (does this require understanding musical theory?)
 */
export const OPCODE_COST_CATALOG: readonly OpcodeCostSpec[] = [
  // =========================================================================
  // METADATA & VISUAL (TRIVIAL)
  // =========================================================================
  {
    id: createOpcodeId('metadata', 'rename'),
    baseTier: CostTier.TRIVIAL,
    modifiers: [],
    rationale: 'Labels have no effect on audio',
  },
  {
    id: createOpcodeId('metadata', 'set_color'),
    baseTier: CostTier.TRIVIAL,
    modifiers: [],
    rationale: 'Visual change only',
  },
  {
    id: createOpcodeId('metadata', 'add_comment'),
    baseTier: CostTier.TRIVIAL,
    modifiers: [],
    rationale: 'Annotation has no musical effect',
  },
  
  // =========================================================================
  // PRODUCTION & DSP (MINIMAL to LOW)
  // =========================================================================
  {
    id: createOpcodeId('production', 'adjust_reverb'),
    baseTier: CostTier.MINIMAL,
    modifiers: [],
    rationale: 'Reverb is expected to be tweaked frequently',
  },
  {
    id: createOpcodeId('production', 'adjust_delay'),
    baseTier: CostTier.MINIMAL,
    modifiers: [],
    rationale: 'Delay is a common adjustment',
  },
  {
    id: createOpcodeId('production', 'adjust_eq'),
    baseTier: CostTier.MINIMAL,
    modifiers: [],
    rationale: 'EQ tweaks are routine',
  },
  {
    id: createOpcodeId('production', 'adjust_compression'),
    baseTier: CostTier.LOW,
    modifiers: [],
    rationale: 'Compression affects dynamics but not notes',
  },
  {
    id: createOpcodeId('production', 'adjust_width'),
    baseTier: CostTier.MINIMAL,
    modifiers: [],
    rationale: 'Stereo width is a mix parameter',
  },
  {
    id: createOpcodeId('production', 'adjust_pan'),
    baseTier: CostTier.MINIMAL,
    modifiers: [],
    rationale: 'Panning is a standard mixing task',
  },
  {
    id: createOpcodeId('production', 'adjust_volume'),
    baseTier: CostTier.MINIMAL,
    modifiers: [],
    rationale: 'Volume is the most basic parameter',
  },
  {
    id: createOpcodeId('production', 'add_effect'),
    baseTier: CostTier.LOW,
    modifiers: ['inferenceRequired'],
    rationale: 'Adding effects requires choosing which one',
  },
  {
    id: createOpcodeId('production', 'remove_effect'),
    baseTier: CostTier.LOW,
    modifiers: ['destructive'],
    rationale: 'Removing effects is semi-destructive',
  },
  {
    id: createOpcodeId('production', 'adjust_distortion'),
    baseTier: CostTier.LOW,
    modifiers: [],
    rationale: 'Distortion affects timbre significantly but is reversible',
  },
  {
    id: createOpcodeId('production', 'adjust_filter_cutoff'),
    baseTier: CostTier.LOW,
    modifiers: [],
    rationale: 'Filter cutoff is a key timbre parameter',
  },
  
  // =========================================================================
  // TEXTURE & DENSITY (LOW to MODERATE)
  // =========================================================================
  {
    id: createOpcodeId('texture', 'thin'),
    baseTier: CostTier.LOW,
    modifiers: ['destructive'],
    rationale: 'Thinning removes content but is usually safe',
  },
  {
    id: createOpcodeId('texture', 'densify'),
    baseTier: CostTier.MODERATE,
    modifiers: ['inferenceRequired'],
    rationale: 'Adding events requires musical decisions',
  },
  {
    id: createOpcodeId('texture', 'reduce_density'),
    baseTier: CostTier.LOW,
    modifiers: ['destructive'],
    rationale: 'Reducing density is semi-reversible',
  },
  {
    id: createOpcodeId('texture', 'increase_density'),
    baseTier: CostTier.MODERATE,
    modifiers: ['inferenceRequired'],
    rationale: 'Increasing density adds new material',
  },
  {
    id: createOpcodeId('texture', 'simplify'),
    baseTier: CostTier.MODERATE,
    modifiers: ['destructive'],
    rationale: 'Simplification is destructive but intentional',
  },
  {
    id: createOpcodeId('texture', 'add_layer'),
    baseTier: CostTier.MODERATE,
    modifiers: ['inferenceRequired', 'broadScope'],
    rationale: 'Adding layers affects overall arrangement',
  },
  {
    id: createOpcodeId('texture', 'remove_layer'),
    baseTier: CostTier.MODERATE,
    modifiers: ['destructive', 'broadScope'],
    rationale: 'Removing layers is a significant change',
  },
  
  // =========================================================================
  // RHYTHM & TIMING (MODERATE)
  // =========================================================================
  {
    id: createOpcodeId('rhythm', 'quantize'),
    baseTier: CostTier.MODERATE,
    modifiers: ['destructive'],
    rationale: 'Quantization loses timing nuance',
  },
  {
    id: createOpcodeId('rhythm', 'humanize'),
    baseTier: CostTier.LOW,
    modifiers: [],
    rationale: 'Humanization is subtle and reversible',
  },
  {
    id: createOpcodeId('rhythm', 'add_swing'),
    baseTier: CostTier.MODERATE,
    modifiers: [],
    rationale: 'Swing changes groove feel significantly',
  },
  {
    id: createOpcodeId('rhythm', 'adjust_swing'),
    baseTier: CostTier.LOW,
    modifiers: [],
    rationale: 'Swing adjustment is a common tweak',
  },
  {
    id: createOpcodeId('rhythm', 'shift_timing'),
    baseTier: CostTier.LOW,
    modifiers: [],
    rationale: 'Timing shifts are simple transformations',
  },
  {
    id: createOpcodeId('rhythm', 'halftime'),
    baseTier: CostTier.HIGH,
    modifiers: ['broadScope'],
    rationale: 'Halftime is a major structural change',
  },
  {
    id: createOpcodeId('rhythm', 'doubletime'),
    baseTier: CostTier.HIGH,
    modifiers: ['broadScope'],
    rationale: 'Doubletime is a major structural change',
  },
  {
    id: createOpcodeId('rhythm', 'syncopate'),
    baseTier: CostTier.MODERATE,
    modifiers: ['inferenceRequired'],
    rationale: 'Syncopation requires rhythmic analysis',
  },
  {
    id: createOpcodeId('rhythm', 'straighten'),
    baseTier: CostTier.MODERATE,
    modifiers: ['destructive'],
    rationale: 'Straightening loses rhythmic character',
  },
  
  // =========================================================================
  // REGISTER & PITCH (MODERATE to HIGH)
  // =========================================================================
  {
    id: createOpcodeId('event', 'transpose'),
    baseTier: CostTier.MODERATE,
    modifiers: [],
    rationale: 'Transposition is common but affects all pitches',
  },
  {
    id: createOpcodeId('event', 'shift_register'),
    baseTier: CostTier.MODERATE,
    modifiers: ['constraintRisky'],
    rationale: 'Register shifts might exceed instrument range',
  },
  {
    id: createOpcodeId('melody', 'raise_register'),
    baseTier: CostTier.HIGH,
    modifiers: ['constraintRisky'],
    rationale: 'Melody register affects character significantly',
  },
  {
    id: createOpcodeId('melody', 'lower_register'),
    baseTier: CostTier.HIGH,
    modifiers: ['constraintRisky'],
    rationale: 'Melody register affects character significantly',
  },
  
  // =========================================================================
  // HARMONY (HIGH)
  // =========================================================================
  {
    id: createOpcodeId('harmony', 'revoice'),
    baseTier: CostTier.MODERATE,
    modifiers: [],
    rationale: 'Revoicing preserves function but changes color',
  },
  {
    id: createOpcodeId('harmony', 'add_extensions'),
    baseTier: CostTier.MODERATE,
    modifiers: ['inferenceRequired'],
    rationale: 'Extensions add color without changing function',
  },
  {
    id: createOpcodeId('harmony', 'simplify_harmony'),
    baseTier: CostTier.HIGH,
    modifiers: ['destructive'],
    rationale: 'Simplifying harmony loses information',
  },
  {
    id: createOpcodeId('harmony', 'substitute_chord'),
    baseTier: CostTier.HIGH,
    modifiers: ['inferenceRequired', 'constraintRisky'],
    rationale: 'Chord substitution changes function',
  },
  {
    id: createOpcodeId('harmony', 'reharmonize'),
    baseTier: CostTier.VERY_HIGH,
    modifiers: ['destructive', 'inferenceRequired', 'constraintRisky'],
    rationale: 'Reharmonization is a major creative change',
  },
  {
    id: createOpcodeId('harmony', 'modulate'),
    baseTier: CostTier.VERY_HIGH,
    modifiers: ['broadScope', 'inferenceRequired'],
    rationale: 'Modulation changes the entire tonal center',
  },
  {
    id: createOpcodeId('harmony', 'chromaticize'),
    baseTier: CostTier.HIGH,
    modifiers: ['inferenceRequired'],
    rationale: 'Adding chromaticism significantly changes color',
  },
  
  // =========================================================================
  // MELODY (VERY HIGH)
  // =========================================================================
  {
    id: createOpcodeId('melody', 'ornament'),
    baseTier: CostTier.MODERATE,
    modifiers: ['inferenceRequired'],
    rationale: 'Ornamentation adds detail without changing contour',
  },
  {
    id: createOpcodeId('melody', 'simplify_melody'),
    baseTier: CostTier.HIGH,
    modifiers: ['destructive'],
    rationale: 'Simplifying melody loses character',
  },
  {
    id: createOpcodeId('melody', 'shape_contour'),
    baseTier: CostTier.VERY_HIGH,
    modifiers: ['destructive', 'constraintRisky'],
    rationale: 'Changing contour alters melodic identity',
  },
  {
    id: createOpcodeId('melody', 'vary_melody'),
    baseTier: CostTier.VERY_HIGH,
    modifiers: ['inferenceRequired', 'unpredictable'],
    rationale: 'Melody variation is a creative/compositional change',
  },
  {
    id: createOpcodeId('melody', 'rewrite_melody'),
    baseTier: CostTier.CRITICAL,
    modifiers: ['destructive', 'inferenceRequired', 'unpredictable'],
    rationale: 'Rewriting melody is essentially composition',
  },
  
  // =========================================================================
  // STRUCTURE (HIGH to CRITICAL)
  // =========================================================================
  {
    id: createOpcodeId('structure', 'duplicate_section'),
    baseTier: CostTier.MODERATE,
    modifiers: ['broadScope'],
    rationale: 'Duplication is safe but affects form',
  },
  {
    id: createOpcodeId('structure', 'insert_break'),
    baseTier: CostTier.MODERATE,
    modifiers: ['broadScope'],
    rationale: 'Breaks are common structural devices',
  },
  {
    id: createOpcodeId('structure', 'extend_section'),
    baseTier: CostTier.HIGH,
    modifiers: ['inferenceRequired', 'broadScope'],
    rationale: 'Extension requires generating new material',
  },
  {
    id: createOpcodeId('structure', 'shorten_section'),
    baseTier: CostTier.HIGH,
    modifiers: ['destructive', 'broadScope'],
    rationale: 'Shortening loses content',
  },
  {
    id: createOpcodeId('structure', 'rearrange'),
    baseTier: CostTier.HIGH,
    modifiers: ['broadScope', 'ambiguous'],
    rationale: 'Rearrangement changes overall form',
  },
  {
    id: createOpcodeId('structure', 'delete_section'),
    baseTier: CostTier.CRITICAL,
    modifiers: ['destructive', 'broadScope'],
    rationale: 'Deleting sections is highly destructive',
  },
  
  // =========================================================================
  // ROUTING (LOW to MODERATE)
  // =========================================================================
  {
    id: createOpcodeId('routing', 'add_card'),
    baseTier: CostTier.LOW,
    modifiers: ['inferenceRequired'],
    rationale: 'Adding cards is common but requires choice',
  },
  {
    id: createOpcodeId('routing', 'remove_card'),
    baseTier: CostTier.MODERATE,
    modifiers: ['destructive'],
    rationale: 'Removing cards loses signal processing',
  },
  {
    id: createOpcodeId('routing', 'reorder_cards'),
    baseTier: CostTier.LOW,
    modifiers: [],
    rationale: 'Reordering is safe and reversible',
  },
  {
    id: createOpcodeId('routing', 'connect'),
    baseTier: CostTier.LOW,
    modifiers: [],
    rationale: 'Connections are standard routing tasks',
  },
  {
    id: createOpcodeId('routing', 'disconnect'),
    baseTier: CostTier.MODERATE,
    modifiers: ['destructive'],
    rationale: 'Disconnecting might silence audio',
  },
  {
    id: createOpcodeId('routing', 'replace_card'),
    baseTier: CostTier.MODERATE,
    modifiers: ['destructive', 'inferenceRequired'],
    rationale: 'Replacement is semi-destructive',
  },
];

// =============================================================================
// Cost Lookup and Calculation
// =============================================================================

/**
 * Build a fast lookup map from opcode ID to cost spec
 */
export function buildCostLookup(
  catalog: readonly OpcodeCostSpec[] = OPCODE_COST_CATALOG
): ReadonlyMap<OpcodeId, OpcodeCostSpec> {
  return new Map(catalog.map(spec => [spec.id, spec]));
}

/**
 * Cached cost lookup
 */
let costLookupCache: ReadonlyMap<OpcodeId, OpcodeCostSpec> | undefined;

/**
 * Get cost lookup map (cached)
 */
export function getCostLookup(): ReadonlyMap<OpcodeId, OpcodeCostSpec> {
  if (!costLookupCache) {
    costLookupCache = buildCostLookup();
  }
  return costLookupCache;
}

/**
 * Calculate final cost for an opcode
 * 
 * @param opcodeId Opcode identifier
 * @param scopeSize Scope size multiplier (1.0 = default)
 * @param customModifiers Override standard modifiers
 * @returns Final cost value
 */
export function calculateOpcodeCostFromHierarchy(
  opcodeId: OpcodeId,
  scopeSize: number = 1.0,
  customModifiers: Partial<CostModifiers> = {}
): number {
  const lookup = getCostLookup();
  const spec = lookup.get(opcodeId);
  
  if (!spec) {
    // Unknown opcode - assign moderate cost as fallback
    return CostTier.MODERATE * scopeSize;
  }
  
  // Start with base tier cost
  let cost = spec.baseTier;
  
  // Apply modifiers
  const modifiers = { ...STANDARD_COST_MODIFIERS, ...customModifiers };
  for (const modifierKey of spec.modifiers) {
    cost *= modifiers[modifierKey];
  }
  
  // Apply scope multiplier (logarithmic to avoid explosion)
  cost *= 1.0 + Math.log(scopeSize + 1) * 0.2;
  
  return cost;
}

/**
 * Get cost tier name for display
 */
export function getCostTierName(tier: CostTier): string {
  switch (tier) {
    case CostTier.TRIVIAL:
      return 'Trivial';
    case CostTier.MINIMAL:
      return 'Minimal';
    case CostTier.LOW:
      return 'Low';
    case CostTier.MODERATE:
      return 'Moderate';
    case CostTier.HIGH:
      return 'High';
    case CostTier.VERY_HIGH:
      return 'Very High';
    case CostTier.CRITICAL:
      return 'Critical';
  }
}

/**
 * Get human-readable cost description
 */
export function describeCost(opcodeId: OpcodeId): {
  tier: string;
  cost: number;
  rationale: string;
  modifiers: string[];
} {
  const lookup = getCostLookup();
  const spec = lookup.get(opcodeId);
  
  if (!spec) {
    return {
      tier: 'Unknown',
      cost: CostTier.MODERATE,
      rationale: 'Cost not defined for this opcode',
      modifiers: [],
    };
  }
  
  return {
    tier: getCostTierName(spec.baseTier),
    cost: calculateOpcodeCostFromHierarchy(opcodeId),
    rationale: spec.rationale,
    modifiers: spec.modifiers.slice(), // Copy array
  };
}

/**
 * Compare two opcodes by cost
 * 
 * @returns -1 if op1 cheaper, 1 if op2 cheaper, 0 if equal
 */
export function compareOpcodeCosts(
  opcodeId1: OpcodeId,
  opcodeId2: OpcodeId,
  scopeSize1: number = 1.0,
  scopeSize2: number = 1.0
): number {
  const cost1 = calculateOpcodeCostFromHierarchy(opcodeId1, scopeSize1);
  const cost2 = calculateOpcodeCostFromHierarchy(opcodeId2, scopeSize2);
  
  if (Math.abs(cost1 - cost2) < 0.001) {
    return 0;
  }
  return cost1 < cost2 ? -1 : 1;
}

// =============================================================================
// Cost Category Summaries
// =============================================================================

/**
 * Summarize costs by category
 */
export interface CategoryCostSummary {
  readonly category: OpcodeCategory;
  readonly averageTier: number;
  readonly minTier: CostTier;
  readonly maxTier: CostTier;
  readonly opcodeCount: number;
}

/**
 * Generate cost summaries for all categories
 */
export function summarizeCostsByCategory(
  catalog: readonly OpcodeCostSpec[] = OPCODE_COST_CATALOG
): readonly CategoryCostSummary[] {
  const byCategory = new Map<OpcodeCategory, OpcodeCostSpec[]>();
  
  // Group by category
  for (const spec of catalog) {
    const category = spec.id.split(':')[1] as OpcodeCategory;
    const existing = byCategory.get(category) ?? [];
    existing.push(spec);
    byCategory.set(category, existing);
  }
  
  // Summarize each category
  const summaries: CategoryCostSummary[] = [];
  for (const [category, specs] of byCategory) {
    const tiers = specs.map(s => s.baseTier);
    const averageTier = tiers.reduce((sum, t) => sum + t, 0) / tiers.length;
    const minTier = Math.min(...tiers) as CostTier;
    const maxTier = Math.max(...tiers) as CostTier;
    
    summaries.push({
      category,
      averageTier,
      minTier,
      maxTier,
      opcodeCount: specs.length,
    });
  }
  
  // Sort by average tier (highest cost first)
  summaries.sort((a, b) => b.averageTier - a.averageTier);
  
  return summaries;
}

/**
 * Validate cost hierarchy for consistency
 * 
 * Checks:
 * - All opcodes have unique IDs
 * - Cost tiers are reasonable
 * - Modifiers are recognized
 */
export function validateCostHierarchy(
  catalog: readonly OpcodeCostSpec[] = OPCODE_COST_CATALOG
): readonly string[] {
  const errors: string[] = [];
  const seenIds = new Set<OpcodeId>();
  
  for (const spec of catalog) {
    // Check for duplicate IDs
    if (seenIds.has(spec.id)) {
      errors.push(`Duplicate opcode ID: ${spec.id}`);
    }
    seenIds.add(spec.id);
    
    // Check tier is valid
    if (spec.baseTier < CostTier.TRIVIAL || spec.baseTier > CostTier.CRITICAL) {
      errors.push(`Invalid tier for ${spec.id}: ${spec.baseTier}`);
    }
    
    // Check modifiers are recognized
    const validModifiers: Array<keyof CostModifiers> = [
      'destructive',
      'broadScope',
      'inferenceRequired',
      'constraintRisky',
      'ambiguous',
      'unpredictable',
    ];
    for (const modifier of spec.modifiers) {
      if (!validModifiers.includes(modifier)) {
        errors.push(`Unknown modifier for ${spec.id}: ${modifier}`);
      }
    }
    
    // Check rationale is non-empty
    if (!spec.rationale || spec.rationale.trim().length === 0) {
      errors.push(`Missing rationale for ${spec.id}`);
    }
  }
  
  return errors;
}
