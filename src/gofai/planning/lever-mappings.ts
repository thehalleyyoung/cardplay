/**
 * Lever Mappings from Perceptual Axes to Candidate Opcodes
 * 
 * Implements Step 253 from gofai_goalB.md:
 * - Define lever mappings from perceptual axes to candidate opcodes
 * - Maps user-friendly goals like "lift" or "intimacy" to concrete musical operations
 * 
 * This module is the core of "intelligent planning": it encodes musical knowledge
 * about how to achieve perceptual goals through specific transformations.
 * Each axis can map to multiple levers, and the planner chooses based on context,
 * constraints, and cost.
 * 
 * @module gofai/planning/lever-mappings
 */

import type { AxisId } from '../canon/types';
import { createAxisId } from '../canon/types';
import type {
  Opcode,
  OpcodeCategory,
} from './plan-types';
import type { CPLScope } from '../canon/cpl-types';

/**
 * Direction along a perceptual axis
 */
export type PerceptualDirection = 'increase' | 'decrease';

/**
 * A lever: a concrete way to move along a perceptual axis
 */
export interface Lever {
  readonly id: string;
  readonly axis: AxisId;
  readonly direction: PerceptualDirection;
  readonly name: string;
  readonly description: string;
  
  /** Opcode template this lever instantiates */
  readonly opcodeCategory: OpcodeCategory;
  readonly opcodeType: string;
  
  /** Base cost for this lever (before context adjustments) */
  readonly baseCost: number;
  
  /** Typical effectiveness (0.0 - 1.0) */
  readonly effectiveness: number;
  
  /** Musical contexts where this lever is appropriate */
  readonly appropriateContexts: readonly LeverContext[];
  
  /** Contexts where this lever should be avoided */
  readonly avoidContexts?: readonly LeverContext[];
  
  /** Required musical elements */
  readonly requires: readonly ('melody' | 'harmony' | 'rhythm' | 'production-layer' | 'orchestration')[];
  
  /** Function to instantiate this lever into an opcode */
  readonly instantiate: (amount: number, scope: CPLScope, context: PlanningContext) => Opcode | null;
}

/**
 * Context in which lever selection happens
 */
export interface LeverContext {
  readonly type: 'genre' | 'section' | 'layer-role' | 'density-level' | 'production-capability';
  readonly value: string;
}

/**
 * Full planning context (passed to lever instantiation)
 */
export interface PlanningContext {
  readonly scope: CPLScope;
  readonly availableCapabilities: ReadonlySet<string>;
  readonly currentDensity?: number;
  readonly layerRoles?: ReadonlySet<string>;
  readonly hasHarmony: boolean;
  readonly hasMelody: boolean;
  readonly genre?: string;
  readonly section?: string;
}

/**
 * Registry of all lever mappings
 */
export class LeverRegistry {
  private readonly levers = new Map<string, Lever>();
  private readonly axisMappings = new Map<AxisId, Set<Lever>>();
  
  register(lever: Lever): void {
    this.levers.set(lever.id, lever);
    
    if (!this.axisMappings.has(lever.axis)) {
      this.axisMappings.set(lever.axis, new Set());
    }
    this.axisMappings.get(lever.axis)!.add(lever);
  }
  
  getLeversForAxis(axis: AxisId, direction: PerceptualDirection): readonly Lever[] {
    const axisLevers = this.axisMappings.get(axis);
    if (!axisLevers) return [];
    
    return Array.from(axisLevers)
      .filter(lever => lever.direction === direction)
      .sort((a, b) => b.effectiveness - a.effectiveness);
  }
  
  getLever(id: string): Lever | undefined {
    return this.levers.get(id);
  }
  
  getAllLevers(): readonly Lever[] {
    return Array.from(this.levers.values());
  }
}

/**
 * Global lever registry (populated below)
 */
export const leverRegistry = new LeverRegistry();

/**
 * Helper to create a lever
 */
function defineLever(config: Omit<Lever, 'id'> & { id?: string }): Lever {
  const id = config.id ?? `lever:${config.axis}:${config.direction}:${config.opcodeType}`;
  const lever: Lever = { id, ...config } as Lever;
  leverRegistry.register(lever);
  return lever;
}

// =======================
// LIFT AXIS LEVERS
// =======================

defineLever({
  axis: createAxisId('lift'),
  direction: 'increase',
  name: 'Raise Register',
  description: 'Move pitches to a higher octave for more lift',
  opcodeCategory: 'event',
  opcodeType: 'shift_register',
  baseCost: 2.0,
  effectiveness: 0.8,
  appropriateContexts: [
    { type: 'layer-role', value: 'melody' },
    { type: 'layer-role', value: 'harmony' },
  ],
  requires: ['melody'],
  instantiate: (amount, scope, context) => ({
    type: 'shift_register',
    category: 'event',
    scope,
    params: {
      octaves: Math.round(amount * 1.5), // 0.5 for small, 1.5 for large
      constrainToRange: { min: 48, max: 96 }, // C3 to C7
    },
  } as any),
});

defineLever({
  axis: createAxisId('lift'),
  direction: 'increase',
  name: 'Brighten Voicings',
  description: 'Add higher chord extensions for more lift',
  opcodeCategory: 'harmony',
  opcodeType: 'add_extensions',
  baseCost: 3.0,
  effectiveness: 0.7,
  appropriateContexts: [
    { type: 'layer-role', value: 'harmony' },
    { type: 'density-level', value: 'moderate' },
  ],
  requires: ['harmony'],
  instantiate: (amount, scope, context) => {
    if (!context.hasHarmony) return null;
    return {
      type: 'add_extensions',
      category: 'harmony',
      scope,
      params: {
        extensions: amount > 0.7 ? ['9', '11', '13'] : amount > 0.4 ? ['9', '11'] : ['9'],
        avoidClashes: true,
      },
    } as any;
  },
});

defineLever({
  axis: createAxisId('lift'),
  direction: 'increase',
  name: 'Increase Top-Layer Activity',
  description: 'Add more events in the highest register',
  opcodeCategory: 'texture',
  opcodeType: 'thicken_texture',
  baseCost: 4.0,
  effectiveness: 0.6,
  appropriateContexts: [
    { type: 'section', value: 'chorus' },
    { type: 'density-level', value: 'low' },
  ],
  requires: ['orchestration'],
  instantiate: (amount, scope, context) => ({
    type: 'thicken_texture',
    category: 'texture',
    scope,
    params: {
      method: 'octave-displacement',
      targetLayers: Math.ceil(amount * 2 + 1),
    },
  } as any),
});

defineLever({
  axis: createAxisId('lift'),
  direction: 'increase',
  name: 'Add High Brightness',
  description: 'Boost high frequencies for lift',
  opcodeCategory: 'production',
  opcodeType: 'adjust_brightness',
  baseCost: 1.5,
  effectiveness: 0.7,
  appropriateContexts: [
    { type: 'production-capability', value: 'dsp' },
  ],
  requires: ['production-layer'],
  instantiate: (amount, scope, context) => {
    if (!context.availableCapabilities.has('dsp:set-param')) return null;
    return {
      type: 'adjust_brightness',
      category: 'production',
      scope,
      params: {
        direction: 'brighter',
        amount,
        method: 'eq',
      },
    } as any;
  },
});

// =======================
// INTIMACY AXIS LEVERS
// =======================

defineLever({
  axis: createAxisId('intimacy'),
  direction: 'increase',
  name: 'Thin Texture',
  description: 'Remove layers for more intimate feel',
  opcodeCategory: 'texture',
  opcodeType: 'thin_texture',
  baseCost: 3.0,
  effectiveness: 0.9,
  appropriateContexts: [
    { type: 'density-level', value: 'high' },
    { type: 'section', value: 'verse' },
  ],
  requires: ['orchestration'],
  instantiate: (amount, scope, context) => ({
    type: 'thin_texture',
    category: 'texture',
    scope,
    params: {
      targetLayers: Math.max(1, Math.floor(3 - amount * 2)),
      removeMethod: 'least-salient',
      preserveMelody: true,
    },
  } as any),
});

defineLever({
  axis: createAxisId('intimacy'),
  direction: 'increase',
  name: 'Reduce Width',
  description: 'Narrow stereo field for closeness',
  opcodeCategory: 'production',
  opcodeType: 'adjust_width',
  baseCost: 1.5,
  effectiveness: 0.8,
  appropriateContexts: [
    { type: 'production-capability', value: 'dsp' },
  ],
  requires: ['production-layer'],
  instantiate: (amount, scope, context) => {
    if (!context.availableCapabilities.has('dsp:set-param')) return null;
    return {
      type: 'adjust_width',
      category: 'production',
      scope,
      params: {
        direction: 'narrower',
        amount,
        method: 'stereo-spread',
      },
    } as any;
  },
});

defineLever({
  axis: createAxisId('intimacy'),
  direction: 'increase',
  name: 'Close Voicings',
  description: 'Tighten harmonic spacing',
  opcodeCategory: 'harmony',
  opcodeType: 'revoice',
  baseCost: 2.5,
  effectiveness: 0.7,
  appropriateContexts: [
    { type: 'layer-role', value: 'harmony' },
  ],
  requires: ['harmony'],
  instantiate: (amount, scope, context) => {
    if (!context.hasHarmony) return null;
    return {
      type: 'revoice',
      category: 'harmony',
      scope,
      params: {
        voicingStyle: 'close',
        registerTarget: 'centered',
        preserveMelody: true,
      },
    } as any;
  },
});

defineLever({
  axis: createAxisId('intimacy'),
  direction: 'increase',
  name: 'Reduce Density',
  description: 'Remove passing notes for simplicity',
  opcodeCategory: 'event',
  opcodeType: 'thin_density',
  baseCost: 2.0,
  effectiveness: 0.6,
  appropriateContexts: [
    { type: 'density-level', value: 'high' },
  ],
  requires: ['melody'],
  instantiate: (amount, scope, context) => ({
    type: 'thin_density',
    category: 'event',
    scope,
    params: {
      targetDensity: 1.0 - amount * 0.5,
      method: 'remove-passing',
      preserveDownbeats: true,
    },
  } as any),
});

// =======================
// TENSION AXIS LEVERS
// =======================

defineLever({
  axis: createAxisId('tension'),
  direction: 'increase',
  name: 'Add Dissonance',
  description: 'Use dissonant chord substitutions',
  opcodeCategory: 'harmony',
  opcodeType: 'substitute_chords',
  baseCost: 4.0,
  effectiveness: 0.9,
  appropriateContexts: [
    { type: 'section', value: 'bridge' },
    { type: 'genre', value: 'jazz' },
  ],
  requires: ['harmony'],
  instantiate: (amount, scope, context) => {
    if (!context.hasHarmony) return null;
    return {
      type: 'substitute_chords',
      category: 'harmony',
      scope,
      params: {
        substitutionType: amount > 0.7 ? 'tritone' : 'chromatic-mediant',
        preserveFunction: amount < 0.5,
      },
    } as any;
  },
});

defineLever({
  axis: createAxisId('tension'),
  direction: 'increase',
  name: 'Add Syncopation',
  description: 'Increase rhythmic tension through off-beat accents',
  opcodeCategory: 'rhythm',
  opcodeType: 'adjust_swing',
  baseCost: 2.5,
  effectiveness: 0.7,
  appropriateContexts: [
    { type: 'layer-role', value: 'rhythm' },
  ],
  requires: ['rhythm'],
  instantiate: (amount, scope, context) => ({
    type: 'adjust_swing',
    category: 'rhythm',
    scope,
    params: {
      swingAmount: 0.5 + amount * 0.3,
      gridDivision: 16,
    },
  } as any),
});

defineLever({
  axis: createAxisId('tension'),
  direction: 'decrease',
  name: 'Resolve Harmony',
  description: 'Use consonant, resolved chords',
  opcodeCategory: 'harmony',
  opcodeType: 'substitute_chords',
  baseCost: 3.0,
  effectiveness: 0.8,
  appropriateContexts: [
    { type: 'section', value: 'outro' },
  ],
  requires: ['harmony'],
  instantiate: (amount, scope, context) => {
    if (!context.hasHarmony) return null;
    return {
      type: 'substitute_chords',
      category: 'harmony',
      scope,
      params: {
        substitutionType: 'relative',
        preserveFunction: true,
      },
    } as any;
  },
});

// =======================
// BRIGHTNESS AXIS LEVERS
// =======================

defineLever({
  axis: createAxisId('brightness'),
  direction: 'increase',
  name: 'Boost High Frequencies',
  description: 'Add treble for brightness',
  opcodeCategory: 'production',
  opcodeType: 'adjust_brightness',
  baseCost: 1.0,
  effectiveness: 0.9,
  appropriateContexts: [
    { type: 'production-capability', value: 'dsp' },
  ],
  requires: ['production-layer'],
  instantiate: (amount, scope, context) => {
    if (!context.availableCapabilities.has('dsp:set-param')) return null;
    return {
      type: 'adjust_brightness',
      category: 'production',
      scope,
      params: {
        direction: 'brighter',
        amount,
        method: 'eq',
      },
    } as any;
  },
});

defineLever({
  axis: createAxisId('brightness'),
  direction: 'increase',
  name: 'Raise Melody Register',
  description: 'Move melody higher for perceived brightness',
  opcodeCategory: 'melody',
  opcodeType: 'extend_range',
  baseCost: 2.0,
  effectiveness: 0.6,
  appropriateContexts: [
    { type: 'layer-role', value: 'melody' },
  ],
  requires: ['melody'],
  instantiate: (amount, scope, context) => ({
    type: 'extend_range',
    category: 'melody',
    scope,
    params: {
      direction: 'up',
      targetRange: { min: 60, max: 84 }, // C4 to C6
      method: 'octave-displacement',
    },
  } as any),
});

defineLever({
  axis: createAxisId('brightness'),
  direction: 'decrease',
  name: 'Roll Off Highs',
  description: 'Reduce treble for warmth',
  opcodeCategory: 'production',
  opcodeType: 'adjust_brightness',
  baseCost: 1.0,
  effectiveness: 0.9,
  appropriateContexts: [
    { type: 'production-capability', value: 'dsp' },
  ],
  requires: ['production-layer'],
  instantiate: (amount, scope, context) => {
    if (!context.availableCapabilities.has('dsp:set-param')) return null;
    return {
      type: 'adjust_brightness',
      category: 'production',
      scope,
      params: {
        direction: 'darker',
        amount,
        method: 'eq',
      },
    } as any;
  },
});

// =======================
// WIDTH AXIS LEVERS
// =======================

defineLever({
  axis: createAxisId('width'),
  direction: 'increase',
  name: 'Widen Stereo Field',
  description: 'Spread audio for width',
  opcodeCategory: 'production',
  opcodeType: 'adjust_width',
  baseCost: 1.0,
  effectiveness: 0.95,
  appropriateContexts: [
    { type: 'production-capability', value: 'dsp' },
  ],
  requires: ['production-layer'],
  instantiate: (amount, scope, context) => {
    if (!context.availableCapabilities.has('dsp:set-param')) return null;
    return {
      type: 'adjust_width',
      category: 'production',
      scope,
      params: {
        direction: 'wider',
        amount,
        method: 'stereo-spread',
      },
    } as any;
  },
});

defineLever({
  axis: createAxisId('width'),
  direction: 'increase',
  name: 'Spread Voicings',
  description: 'Use wide-interval voicings',
  opcodeCategory: 'harmony',
  opcodeType: 'revoice',
  baseCost: 2.5,
  effectiveness: 0.6,
  appropriateContexts: [
    { type: 'layer-role', value: 'harmony' },
  ],
  requires: ['harmony'],
  instantiate: (amount, scope, context) => {
    if (!context.hasHarmony) return null;
    return {
      type: 'revoice',
      category: 'harmony',
      scope,
      params: {
        voicingStyle: 'open',
        registerTarget: undefined,
        preserveMelody: true,
      },
    } as any;
  },
});

defineLever({
  axis: createAxisId('width'),
  direction: 'decrease',
  name: 'Narrow Stereo Field',
  description: 'Center audio for focus',
  opcodeCategory: 'production',
  opcodeType: 'adjust_width',
  baseCost: 1.0,
  effectiveness: 0.95,
  appropriateContexts: [
    { type: 'production-capability', value: 'dsp' },
  ],
  requires: ['production-layer'],
  instantiate: (amount, scope, context) => {
    if (!context.availableCapabilities.has('dsp:set-param')) return null;
    return {
      type: 'adjust_width',
      category: 'production',
      scope,
      params: {
        direction: 'narrower',
        amount,
        method: 'stereo-spread',
      },
    } as any;
  },
});

// =======================
// ENERGY AXIS LEVERS
// =======================

defineLever({
  axis: createAxisId('energy'),
  direction: 'increase',
  name: 'Increase Density',
  description: 'Add more notes for energy',
  opcodeCategory: 'event',
  opcodeType: 'densify',
  baseCost: 3.5,
  effectiveness: 0.8,
  appropriateContexts: [
    { type: 'section', value: 'chorus' },
    { type: 'density-level', value: 'low' },
  ],
  requires: ['rhythm'],
  instantiate: (amount, scope, context) => ({
    type: 'densify',
    category: 'event',
    scope,
    params: {
      targetDensity: 1.0 + amount,
      method: 'subdivide',
      respectHarmony: true,
    },
  } as any),
});

defineLever({
  axis: createAxisId('energy'),
  direction: 'increase',
  name: 'Increase Velocity',
  description: 'Play notes louder for energy',
  opcodeCategory: 'event',
  opcodeType: 'adjust_velocity',
  baseCost: 1.5,
  effectiveness: 0.7,
  appropriateContexts: [],
  requires: ['rhythm'],
  instantiate: (amount, scope, context) => ({
    type: 'adjust_velocity',
    category: 'event',
    scope,
    params: {
      scale: 1.0 + amount * 0.3,
      targetRange: { min: 40, max: 127 },
    },
  } as any),
});

defineLever({
  axis: createAxisId('energy'),
  direction: 'increase',
  name: 'Add Compression',
  description: 'Compress for punch and energy',
  opcodeCategory: 'production',
  opcodeType: 'add_compression',
  baseCost: 2.0,
  effectiveness: 0.6,
  appropriateContexts: [
    { type: 'production-capability', value: 'dsp' },
  ],
  requires: ['production-layer'],
  instantiate: (amount, scope, context) => {
    if (!context.availableCapabilities.has('dsp:set-param')) return null;
    return {
      type: 'add_compression',
      category: 'production',
      scope,
      params: {
        ratio: 4 + amount * 4,
        threshold: -20 + amount * 10,
        attack: 10,
        release: 100,
        makeupGain: 3,
      },
    } as any;
  },
});

defineLever({
  axis: createAxisId('energy'),
  direction: 'decrease',
  name: 'Reduce Density',
  description: 'Thin out notes for calm',
  opcodeCategory: 'event',
  opcodeType: 'thin_density',
  baseCost: 2.0,
  effectiveness: 0.75,
  appropriateContexts: [
    { type: 'section', value: 'verse' },
    { type: 'density-level', value: 'high' },
  ],
  requires: ['rhythm'],
  instantiate: (amount, scope, context) => ({
    type: 'thin_density',
    category: 'event',
    scope,
    params: {
      targetDensity: 1.0 - amount * 0.5,
      method: 'remove-offbeat',
      preserveDownbeats: true,
    },
  } as any),
});

// =======================
// GROOVE/TIGHTNESS AXIS LEVERS
// =======================

defineLever({
  axis: createAxisId('groove_tightness'),
  direction: 'increase',
  name: 'Quantize Tighter',
  description: 'Snap to grid for tight groove',
  opcodeCategory: 'rhythm',
  opcodeType: 'adjust_quantize_strength',
  baseCost: 1.5,
  effectiveness: 0.85,
  appropriateContexts: [
    { type: 'layer-role', value: 'rhythm' },
  ],
  requires: ['rhythm'],
  instantiate: (amount, scope, context) => ({
    type: 'adjust_quantize_strength',
    category: 'rhythm',
    scope,
    params: {
      strength: 0.5 + amount * 0.5,
      gridDivision: 16,
    },
  } as any),
});

defineLever({
  axis: createAxisId('groove_tightness'),
  direction: 'decrease',
  name: 'Add Humanization',
  description: 'Loosen timing for organic groove',
  opcodeCategory: 'event',
  opcodeType: 'humanize_timing',
  baseCost: 1.5,
  effectiveness: 0.80,
  appropriateContexts: [
    { type: 'layer-role', value: 'rhythm' },
  ],
  requires: ['rhythm'],
  instantiate: (amount, scope, context) => ({
    type: 'humanize_timing',
    category: 'event',
    scope,
    params: {
      amount,
      maxDeviationTicks: Math.floor(amount * 48), // Up to 32nd note deviation
      preserveGroove: true,
    },
  } as any),
});

// =======================
// BUSYNESS AXIS LEVERS
// =======================

defineLever({
  axis: createAxisId('busyness'),
  direction: 'increase',
  name: 'Increase Note Density',
  description: 'Add more notes for busyness',
  opcodeCategory: 'event',
  opcodeType: 'densify',
  baseCost: 3.0,
  effectiveness: 0.9,
  appropriateContexts: [
    { type: 'density-level', value: 'low' },
  ],
  requires: ['rhythm'],
  instantiate: (amount, scope, context) => ({
    type: 'densify',
    category: 'event',
    scope,
    params: {
      targetDensity: 1.0 + amount * 1.5,
      method: 'subdivide',
      respectHarmony: true,
    },
  } as any),
});

defineLever({
  axis: createAxisId('busyness'),
  direction: 'increase',
  name: 'Add Ornamentation',
  description: 'Add melodic ornaments for complexity',
  opcodeCategory: 'melody',
  opcodeType: 'add_ornamentation',
  baseCost: 3.5,
  effectiveness: 0.7,
  appropriateContexts: [
    { type: 'layer-role', value: 'melody' },
  ],
  requires: ['melody'],
  instantiate: (amount, scope, context) => ({
    type: 'add_ornamentation',
    category: 'melody',
    scope,
    params: {
      ornamentTypes: ['trill', 'mordent', 'turn', 'grace-note'],
      density: amount,
      respectStyle: true,
    },
  } as any),
});

defineLever({
  axis: createAxisId('busyness'),
  direction: 'decrease',
  name: 'Simplify Texture',
  description: 'Remove notes for simplicity',
  opcodeCategory: 'event',
  opcodeType: 'thin_density',
  baseCost: 2.0,
  effectiveness: 0.9,
  appropriateContexts: [
    { type: 'density-level', value: 'high' },
  ],
  requires: ['rhythm'],
  instantiate: (amount, scope, context) => ({
    type: 'thin_density',
    category: 'event',
    scope,
    params: {
      targetDensity: 1.0 - amount * 0.6,
      method: 'remove-passing',
      preserveDownbeats: true,
    },
  } as any),
});

// =======================
// IMPACT AXIS LEVERS
// =======================

defineLever({
  axis: createAxisId('impact'),
  direction: 'increase',
  name: 'Add Punch',
  description: 'Enhance transients for impact',
  opcodeCategory: 'production',
  opcodeType: 'adjust_punch',
  baseCost: 2.0,
  effectiveness: 0.85,
  appropriateContexts: [
    { type: 'production-capability', value: 'dsp' },
    { type: 'layer-role', value: 'rhythm' },
  ],
  requires: ['production-layer'],
  instantiate: (amount, scope, context) => {
    if (!context.availableCapabilities.has('dsp:set-param')) return null;
    return {
      type: 'adjust_punch',
      category: 'production',
      scope,
      params: {
        direction: 'punchier',
        amount,
        targetFrequency: 80, // Focus on bass punch
      },
    } as any;
  },
});

defineLever({
  axis: createAxisId('impact'),
  direction: 'increase',
  name: 'Increase Peak Velocity',
  description: 'Emphasize loud notes for impact',
  opcodeCategory: 'event',
  opcodeType: 'adjust_velocity',
  baseCost: 1.5,
  effectiveness: 0.7,
  appropriateContexts: [
    { type: 'layer-role', value: 'rhythm' },
  ],
  requires: ['rhythm'],
  instantiate: (amount, scope, context) => ({
    type: 'adjust_velocity',
    category: 'event',
    scope,
    params: {
      delta: Math.floor(amount * 20),
      targetRange: { min: 80, max: 127 },
    },
  } as any),
});

/**
 * Get candidate levers for a goal
 */
export function getLeversForGoal(
  axis: AxisId,
  direction: PerceptualDirection,
  context: PlanningContext
): readonly Lever[] {
  const candidates = leverRegistry.getLeversForAxis(axis, direction);
  
  return candidates.filter(lever => {
    // Check required elements
    for (const req of lever.requires) {
      switch (req) {
        case 'melody':
          if (!context.hasMelody) return false;
          break;
        case 'harmony':
          if (!context.hasHarmony) return false;
          break;
        case 'production-layer':
          if (!context.availableCapabilities.has('dsp:set-param')) return false;
          break;
      }
    }
    
    // Check appropriate contexts
    if (lever.appropriateContexts.length > 0) {
      const hasAppropriateContext = lever.appropriateContexts.some(ctx => {
        switch (ctx.type) {
          case 'genre':
            return context.genre === ctx.value;
          case 'section':
            return context.section === ctx.value;
          case 'layer-role':
            return context.layerRoles?.has(ctx.value);
          case 'density-level':
            return matchesDensityLevel(context.currentDensity, ctx.value);
          case 'production-capability':
            return context.availableCapabilities.has(ctx.value);
          default:
            return false;
        }
      });
      if (!hasAppropriateContext) return false;
    }
    
    // Check avoid contexts
    if (lever.avoidContexts) {
      const hasAvoidContext = lever.avoidContexts.some(ctx => {
        switch (ctx.type) {
          case 'density-level':
            return matchesDensityLevel(context.currentDensity, ctx.value);
          default:
            return false;
        }
      });
      if (hasAvoidContext) return false;
    }
    
    return true;
  });
}

function matchesDensityLevel(density: number | undefined, level: string): boolean {
  if (density === undefined) return false;
  switch (level) {
    case 'low': return density < 0.4;
    case 'moderate': return density >= 0.4 && density <= 0.7;
    case 'high': return density > 0.7;
    default: return false;
  }
}
