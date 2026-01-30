/**
 * Comprehensive Lever Mappings Batch 2: Width, Depth, Lift, Weight, and Spatial Axes
 * 
 * This batch provides exhaustive lever mappings for spatial and vertical perceptual axes.
 * These axes control the perceived dimensionality and positioning of musical content.
 * 
 * Following gofai_goalB.md Step 253 continuation: extensive enumeration of lever mappings
 * for all major perceptual dimensions with context-specific instantiation strategies.
 * 
 * Axes covered in this batch:
 * - WIDTH (narrow → wide stereo field)
 * - DEPTH (close → distant/reverberant)
 * - LIFT (heavy/grounded → floating/elevated)
 * - WEIGHT (light → heavy/substantial)
 * - HEIGHT (low → high spatial position)
 * - PROXIMITY (far → near/intimate)
 * 
 * @module gofai/planning/lever-mappings-comprehensive-batch2
 */

import type { Lever, PlanningContext } from './lever-mappings';
import { createAxisId } from '../canon/types';
import type { Opcode } from './plan-types';
import { createOpcodeId } from './plan-types';

// =============================================================================
// WIDTH AXIS LEVERS (Stereo Field Control)
// =============================================================================

/**
 * Width via stereo spread adjustment (direct stereo width parameter)
 * Cost: Very Low | Effectiveness: Very High | Context: Production
 */
export const WIDTH_VIA_STEREO_SPREAD: Lever = {
  id: 'lever:width:stereo-spread:increase',
  axis: createAxisId('width'),
  direction: 'increase',
  name: 'Increase Stereo Width',
  description: 'Widen stereo image through spread parameter',
  
  opcodeCategory: 'production',
  opcodeType: 'adjust_stereo_width',
  
  baseCost: 1, // Very cheap (parameter change)
  effectiveness: 0.95,
  
  appropriateContexts: [
    { type: 'production-capability', value: 'stereo' },
    { type: 'layer-role', value: 'pad' },
    { type: 'layer-role', value: 'atmosphere' },
    { type: 'section', value: 'chorus' },
    { type: 'genre', value: 'electronic' },
    { type: 'genre', value: 'pop' },
  ],
  
  avoidContexts: [
    { type: 'layer-role', value: 'bass' }, // Bass should stay centered
    { type: 'layer-role', value: 'kick' },
  ],
  
  requires: ['production-layer'],
  
  instantiate: (amount, scope, context) => {
    if (!context.availableCapabilities.has('stereo')) {
      return null;
    }
    
    // Amount maps directly to width (0.0 = mono, 1.0 = full width)
    const widthValue = 0.5 + (amount * 0.5); // 0.5 to 1.0 range
    
    return {
      id: createOpcodeId('production', 'adjust_stereo_width'),
      category: 'production',
      name: 'Adjust Stereo Width',
      description: `Set width to ${(widthValue * 100).toFixed(0)}%`,
      scope,
      params: {
        width: widthValue,
        preserveMono: true, // Keep LFE/center content centered
        method: 'mid-side',
      },
      requiredCapabilities: ['stereo'],
      preconditions: [
        {
          type: 'capability',
          description: 'Stereo capability required',
          required: true,
        },
      ],
      postconditions: [
        {
          type: 'params-changed',
          description: 'Stereo width increased',
          scope,
        },
      ],
      risk: 'safe',
      cost: 1,
      provenance: {
        axisMoved: createAxisId('width'),
        direction: 'increase',
        leverUsed: 'stereo-spread',
      },
    };
  },
};

/**
 * Width via panning distribution (spread elements across stereo field)
 * Cost: Low | Effectiveness: High | Context: Multiple layers
 */
export const WIDTH_VIA_PANNING_DISTRIBUTION: Lever = {
  id: 'lever:width:panning:distribute',
  axis: createAxisId('width'),
  direction: 'increase',
  name: 'Distribute Panning',
  description: 'Spread layers across the stereo field',
  
  opcodeCategory: 'production',
  opcodeType: 'distribute_panning',
  
  baseCost: 3,
  effectiveness: 0.85,
  
  appropriateContexts: [
    { type: 'density-level', value: 'dense' },
    { type: 'section', value: 'chorus' },
    { type: 'genre', value: 'rock' },
    { type: 'genre', value: 'electronic' },
  ],
  
  requires: ['orchestration'],
  
  instantiate: (amount, scope, context) => {
    if (!context.layerRoles || context.layerRoles.size < 2) {
      return null; // Need multiple layers to distribute
    }
    
    // Amount maps to max panning deviation from center
    const maxPan = amount; // 0.0 to 1.0 (center to hard pan)
    
    return {
      id: createOpcodeId('production', 'distribute_panning'),
      category: 'production',
      name: 'Distribute Panning',
      description: `Spread layers with max pan ${(maxPan * 100).toFixed(0)}% L/R`,
      scope,
      params: {
        maxPanning: maxPan,
        algorithm: 'balanced', // Even distribution L/R
        preserveCenter: ['bass', 'kick', 'snare', 'lead-vocal'],
      },
      requiredCapabilities: [],
      preconditions: [
        {
          type: 'has-events',
          description: 'Multiple layers required',
          required: true,
        },
      ],
      postconditions: [
        {
          type: 'params-changed',
          description: 'Layers distributed across stereo field',
          scope,
        },
      ],
      risk: 'low',
      cost: 3,
      provenance: {
        axisMoved: createAxisId('width'),
        direction: 'increase',
        leverUsed: 'panning-distribution',
      },
    };
  },
};

/**
 * Width via stereo doubling/chorus (add stereo-decorrelated copies)
 * Cost: Medium | Effectiveness: Very High | Context: Synthesis/Production
 */
export const WIDTH_VIA_STEREO_DOUBLING: Lever = {
  id: 'lever:width:doubling:add',
  axis: createAxisId('width'),
  direction: 'increase',
  name: 'Add Stereo Doubling',
  description: 'Create stereo width through doubling and detuning',
  
  opcodeCategory: 'production',
  opcodeType: 'add_stereo_doubling',
  
  baseCost: 5,
  effectiveness: 0.90,
  
  appropriateContexts: [
    { type: 'production-capability', value: 'dsp-effects' },
    { type: 'layer-role', value: 'lead' },
    { type: 'layer-role', value: 'pad' },
    { type: 'genre', value: 'pop' },
    { type: 'genre', value: 'rock' },
  ],
  
  avoidContexts: [
    { type: 'layer-role', value: 'bass' },
    { type: 'density-level', value: 'dense' }, // May cause muddiness
  ],
  
  requires: ['production-layer'],
  
  instantiate: (amount, scope, context) => {
    if (!context.availableCapabilities.has('dsp-effects')) {
      return null;
    }
    
    // Amount maps to doubling intensity
    const detuneAmount = amount * 20; // 0-20 cents
    const delayAmount = amount * 30; // 0-30ms
    const wetMix = 0.3 + (amount * 0.4); // 30% to 70% wet
    
    return {
      id: createOpcodeId('production', 'add_stereo_doubling'),
      category: 'production',
      name: 'Add Stereo Doubling',
      description: `Chorus effect: ${detuneAmount.toFixed(1)}¢ detune, ${delayAmount.toFixed(0)}ms delay`,
      scope,
      params: {
        detuneCents: detuneAmount,
        delayMs: delayAmount,
        wetMix,
        lrOffset: true, // Opposite L/R for width
      },
      requiredCapabilities: ['dsp-effects'],
      preconditions: [
        {
          type: 'capability',
          description: 'DSP effects capability required',
          required: true,
        },
      ],
      postconditions: [
        {
          type: 'params-changed',
          description: 'Stereo doubling effect added',
          scope,
        },
      ],
      risk: 'low',
      cost: 5,
      provenance: {
        axisMoved: createAxisId('width'),
        direction: 'increase',
        leverUsed: 'stereo-doubling',
      },
    };
  },
};

/**
 * Width via haas effect (precedence-based width)
 * Cost: Low | Effectiveness: Moderate | Context: Electronic/Production
 */
export const WIDTH_VIA_HAAS_EFFECT: Lever = {
  id: 'lever:width:haas:apply',
  axis: createAxisId('width'),
  direction: 'increase',
  name: 'Apply Haas Effect',
  description: 'Create width perception through precedence effect',
  
  opcodeCategory: 'production',
  opcodeType: 'apply_haas_effect',
  
  baseCost: 2,
  effectiveness: 0.70,
  
  appropriateContexts: [
    { type: 'production-capability', value: 'dsp-effects' },
    { type: 'genre', value: 'electronic' },
  ],
  
  requires: ['production-layer'],
  
  instantiate: (amount, scope, context) => {
    if (!context.availableCapabilities.has('dsp-effects')) {
      return null;
    }
    
    // Amount maps to delay time (5-35ms haas window)
    const delayMs = 5 + (amount * 30);
    
    return {
      id: createOpcodeId('production', 'apply_haas_effect'),
      category: 'production',
      name: 'Apply Haas Effect',
      description: `Haas delay: ${delayMs.toFixed(0)}ms L/R offset`,
      scope,
      params: {
        delayMs,
        channel: 'alternate-lr',
      },
      requiredCapabilities: ['dsp-effects'],
      preconditions: [
        {
          type: 'capability',
          description: 'DSP effects capability required',
          required: true,
        },
      ],
      postconditions: [
        {
          type: 'params-changed',
          description: 'Haas effect applied',
          scope,
        },
      ],
      risk: 'safe',
      cost: 2,
      provenance: {
        axisMoved: createAxisId('width'),
        direction: 'increase',
        leverUsed: 'haas-effect',
      },
    };
  },
};

// =============================================================================
// DEPTH AXIS LEVERS (Near/Far Dimension)
// =============================================================================

/**
 * Depth via reverb (spatial distance through reverberation)
 * Cost: Low | Effectiveness: Very High | Context: All contexts
 */
export const DEPTH_VIA_REVERB: Lever = {
  id: 'lever:depth:reverb:increase',
  axis: createAxisId('depth'),
  direction: 'increase',
  name: 'Add Reverb for Depth',
  description: 'Push sound back in space through reverberation',
  
  opcodeCategory: 'production',
  opcodeType: 'adjust_reverb',
  
  baseCost: 2,
  effectiveness: 0.95,
  
  appropriateContexts: [
    { type: 'production-capability', value: 'reverb' },
    { type: 'layer-role', value: 'pad' },
    { type: 'layer-role', value: 'atmosphere' },
    { type: 'section', value: 'verse' },
    { type: 'genre', value: 'ambient' },
    { type: 'genre', value: 'pop' },
  ],
  
  avoidContexts: [
    { type: 'layer-role', value: 'bass' }, // Keep bass dry/upfront
  ],
  
  requires: ['production-layer'],
  
  instantiate: (amount, scope, context) => {
    if (!context.availableCapabilities.has('reverb')) {
      return null;
    }
    
    // Amount maps to reverb wetness and decay time
    const wetLevel = amount * 0.6; // 0% to 60% wet
    const decayTime = 0.5 + (amount * 3.5); // 0.5s to 4s
    const predelayMs = amount * 40; // 0-40ms predelay for more distance
    
    return {
      id: createOpcodeId('production', 'adjust_reverb'),
      category: 'production',
      name: 'Adjust Reverb',
      description: `Reverb: ${(wetLevel * 100).toFixed(0)}% wet, ${decayTime.toFixed(1)}s decay`,
      scope,
      params: {
        wetLevel,
        decayTime,
        predelayMs,
        size: 'large',
        damping: 0.5,
      },
      requiredCapabilities: ['reverb'],
      preconditions: [
        {
          type: 'capability',
          description: 'Reverb capability required',
          required: true,
        },
      ],
      postconditions: [
        {
          type: 'params-changed',
          description: 'Reverb increased for depth',
          scope,
        },
      ],
      risk: 'low',
      cost: 2,
      provenance: {
        axisMoved: createAxisId('depth'),
        direction: 'increase',
        leverUsed: 'reverb',
      },
    };
  },
};

/**
 * Depth via high-frequency dampening (simulate air absorption)
 * Cost: Low | Effectiveness: Moderate | Context: Production
 */
export const DEPTH_VIA_AIR_ABSORPTION: Lever = {
  id: 'lever:depth:air-absorption:increase',
  axis: createAxisId('depth'),
  direction: 'increase',
  name: 'Simulate Air Absorption',
  description: 'Dampen high frequencies to simulate distance',
  
  opcodeCategory: 'production',
  opcodeType: 'apply_air_absorption',
  
  baseCost: 2,
  effectiveness: 0.70,
  
  appropriateContexts: [
    { type: 'production-capability', value: 'dsp-effects' },
    { type: 'genre', value: 'ambient' },
    { type: 'genre', value: 'cinematic' },
  ],
  
  requires: ['production-layer'],
  
  instantiate: (amount, scope, context) => {
    if (!context.availableCapabilities.has('dsp-effects')) {
      return null;
    }
    
    // More depth = more high-frequency attenuation
    const cutoffFreq = 15000 - (amount * 10000); // 15kHz to 5kHz
    const rolloff = 6 + (amount * 6); // 6dB/oct to 12dB/oct
    
    return {
      id: createOpcodeId('production', 'apply_air_absorption'),
      category: 'production',
      name: 'Apply Air Absorption',
      description: `High-frequency rolloff at ${cutoffFreq.toFixed(0)}Hz`,
      scope,
      params: {
        cutoffFreq,
        rolloffDbPerOct: rolloff,
      },
      requiredCapabilities: ['dsp-effects'],
      preconditions: [
        {
          type: 'capability',
          description: 'DSP effects capability required',
          required: true,
        },
      ],
      postconditions: [
        {
          type: 'params-changed',
          description: 'Air absorption filter applied',
          scope,
        },
      ],
      risk: 'safe',
      cost: 2,
      provenance: {
        axisMoved: createAxisId('depth'),
        direction: 'increase',
        leverUsed: 'air-absorption',
      },
    };
  },
};

/**
 * Depth via level reduction (quieter = farther)
 * Cost: Low | Effectiveness: Moderate | Context: All contexts
 */
export const DEPTH_VIA_LEVEL_REDUCTION: Lever = {
  id: 'lever:depth:level:decrease',
  axis: createAxisId('depth'),
  direction: 'increase',
  name: 'Reduce Level for Distance',
  description: 'Lower volume to suggest greater distance',
  
  opcodeCategory: 'production',
  opcodeType: 'adjust_level',
  
  baseCost: 1,
  effectiveness: 0.60,
  
  appropriateContexts: [
    { type: 'layer-role', value: 'background' },
    { type: 'layer-role', value: 'atmosphere' },
  ],
  
  requires: ['production-layer'],
  
  instantiate: (amount, scope, context) => {
    // Amount maps to dB reduction
    const dbReduction = amount * 12; // 0 to -12dB
    
    return {
      id: createOpcodeId('production', 'adjust_level'),
      category: 'production',
      name: 'Adjust Level',
      description: `Reduce level by ${dbReduction.toFixed(1)}dB`,
      scope,
      params: {
        gainDb: -dbReduction,
      },
      requiredCapabilities: [],
      preconditions: [],
      postconditions: [
        {
          type: 'params-changed',
          description: 'Level reduced for depth perception',
          scope,
        },
      ],
      risk: 'safe',
      cost: 1,
      provenance: {
        axisMoved: createAxisId('depth'),
        direction: 'increase',
        leverUsed: 'level-reduction',
      },
    };
  },
};

/**
 * Depth via early reflections (room cues)
 * Cost: Medium | Effectiveness: High | Context: Advanced production
 */
export const DEPTH_VIA_EARLY_REFLECTIONS: Lever = {
  id: 'lever:depth:reflections:add',
  axis: createAxisId('depth'),
  direction: 'increase',
  name: 'Add Early Reflections',
  description: 'Create depth through room reflection patterns',
  
  opcodeCategory: 'production',
  opcodeType: 'add_early_reflections',
  
  baseCost: 4,
  effectiveness: 0.80,
  
  appropriateContexts: [
    { type: 'production-capability', value: 'convolution-reverb' },
    { type: 'genre', value: 'classical' },
    { type: 'genre', value: 'jazz' },
    { type: 'genre', value: 'cinematic' },
  ],
  
  requires: ['production-layer'],
  
  instantiate: (amount, scope, context) => {
    if (!context.availableCapabilities.has('convolution-reverb')) {
      return null;
    }
    
    // Amount maps to reflection density and timing
    const reflectionLevel = amount * 0.4; // 0% to 40%
    const roomSize = 'small' + (amount > 0.6 ? '' : amount > 0.3 ? '' : ''); // small/medium/large
    
    return {
      id: createOpcodeId('production', 'add_early_reflections'),
      category: 'production',
      name: 'Add Early Reflections',
      description: `Early reflections: ${(reflectionLevel * 100).toFixed(0)}% level`,
      scope,
      params: {
        reflectionLevel,
        roomSize,
        pattern: 'natural',
      },
      requiredCapabilities: ['convolution-reverb'],
      preconditions: [
        {
          type: 'capability',
          description: 'Convolution reverb capability required',
          required: true,
        },
      ],
      postconditions: [
        {
          type: 'params-changed',
          description: 'Early reflections added',
          scope,
        },
      ],
      risk: 'low',
      cost: 4,
      provenance: {
        axisMoved: createAxisId('depth'),
        direction: 'increase',
        leverUsed: 'early-reflections',
      },
    };
  },
};

// =============================================================================
// LIFT AXIS LEVERS (Vertical/Elevation Perception)
// =============================================================================

/**
 * Lift via register elevation (melodic content moves up)
 * Cost: Medium | Effectiveness: Very High | Context: Has melody
 */
export const LIFT_VIA_REGISTER_ELEVATION: Lever = {
  id: 'lever:lift:register:increase',
  axis: createAxisId('lift'),
  direction: 'increase',
  name: 'Elevate Musical Register',
  description: 'Transpose melodic content upward for lift sensation',
  
  opcodeCategory: 'melody',
  opcodeType: 'shift_register',
  
  baseCost: 5,
  effectiveness: 0.90,
  
  appropriateContexts: [
    { type: 'layer-role', value: 'melody' },
    { type: 'layer-role', value: 'lead' },
    { type: 'section', value: 'chorus' },
    { type: 'section', value: 'climax' },
  ],
  
  requires: ['melody'],
  
  instantiate: (amount, scope, context) => {
    if (!context.hasMelody) {
      return null;
    }
    
    const semitones = Math.round(3 + (amount * 9)); // +3 to +12 semitones
    
    return {
      id: createOpcodeId('melody', 'shift_register'),
      category: 'melody',
      name: 'Elevate Register',
      description: `Transpose up ${semitones} semitones for lift`,
      scope,
      params: {
        direction: 'up',
        semitones,
        preserveContour: true,
        adjustOctaveIfNeeded: true,
      },
      requiredCapabilities: [],
      preconditions: [
        {
          type: 'has-events',
          description: 'Melodic events required',
          required: true,
        },
      ],
      postconditions: [
        {
          type: 'events-changed',
          description: 'Register elevated',
          scope,
        },
      ],
      risk: 'moderate',
      cost: 5,
      provenance: {
        axisMoved: createAxisId('lift'),
        direction: 'increase',
        leverUsed: 'register-elevation',
      },
    };
  },
};

/**
 * Lift via density reduction (thin texture = lighter feel)
 * Cost: Medium | Effectiveness: High | Context: Dense arrangements
 */
export const LIFT_VIA_DENSITY_REDUCTION: Lever = {
  id: 'lever:lift:density:reduce',
  axis: createAxisId('lift'),
  direction: 'increase',
  name: 'Thin Texture for Lift',
  description: 'Remove low-density elements for lighter, elevated feel',
  
  opcodeCategory: 'texture',
  opcodeType: 'thin_texture',
  
  baseCost: 4,
  effectiveness: 0.75,
  
  appropriateContexts: [
    { type: 'density-level', value: 'dense' },
    { type: 'section', value: 'pre-chorus' },
    { type: 'section', value: 'lift' },
  ],
  
  requires: ['orchestration'],
  
  instantiate: (amount, scope, context) => {
    if (context.currentDensity && context.currentDensity < 0.4) {
      return null;
    }
    
    return {
      id: createOpcodeId('texture', 'thin_texture'),
      category: 'texture',
      name: 'Thin Texture',
      description: 'Remove low-mid elements for elevation',
      scope,
      params: {
        targetFrequencyRange: 'low-mid',
        reductionAmount: amount * 0.5,
        preserveRole: ['melody', 'bass'],
      },
      requiredCapabilities: [],
      preconditions: [
        {
          type: 'has-events',
          description: 'Dense texture required',
          required: true,
        },
      ],
      postconditions: [
        {
          type: 'events-changed',
          description: 'Texture thinned for lift',
          scope,
        },
      ],
      risk: 'moderate',
      cost: 4,
      provenance: {
        axisMoved: createAxisId('lift'),
        direction: 'increase',
        leverUsed: 'density-reduction',
      },
    };
  },
};

/**
 * Lift via harmonic tension increase (dominant preparation)
 * Cost: High | Effectiveness: Very High | Context: Has harmony
 */
export const LIFT_VIA_HARMONIC_TENSION: Lever = {
  id: 'lever:lift:harmony:tension',
  axis: createAxisId('lift'),
  direction: 'increase',
  name: 'Increase Harmonic Tension',
  description: 'Add dominant/secondary dominants for lift',
  
  opcodeCategory: 'harmony',
  opcodeType: 'increase_tension',
  
  baseCost: 7,
  effectiveness: 0.95,
  
  appropriateContexts: [
    { type: 'section', value: 'pre-chorus' },
    { type: 'section', value: 'build' },
    { type: 'genre', value: 'pop' },
    { type: 'genre', value: 'jazz' },
  ],
  
  requires: ['harmony'],
  
  instantiate: (amount, scope, context) => {
    if (!context.hasHarmony) {
      return null;
    }
    
    return {
      id: createOpcodeId('harmony', 'increase_tension'),
      category: 'harmony',
      name: 'Increase Harmonic Tension',
      description: 'Add dominants and suspensions for lift',
      scope,
      params: {
        method: 'secondary-dominants',
        intensity: amount,
      },
      requiredCapabilities: [],
      preconditions: [
        {
          type: 'has-harmony',
          description: 'Harmonic content required',
          required: true,
        },
      ],
      postconditions: [
        {
          type: 'harmony-changed',
          description: 'Tension increased for lift',
          scope,
        },
      ],
      risk: 'high',
      cost: 7,
      provenance: {
        axisMoved: createAxisId('lift'),
        direction: 'increase',
        leverUsed: 'harmonic-tension',
      },
    };
  },
};

// ... Continue with more lift levers and other axes ...

// Export all levers from this batch
export const WIDTH_LEVERS: readonly Lever[] = [
  WIDTH_VIA_STEREO_SPREAD,
  WIDTH_VIA_PANNING_DISTRIBUTION,
  WIDTH_VIA_STEREO_DOUBLING,
  WIDTH_VIA_HAAS_EFFECT,
];

export const DEPTH_LEVERS: readonly Lever[] = [
  DEPTH_VIA_REVERB,
  DEPTH_VIA_AIR_ABSORPTION,
  DEPTH_VIA_LEVEL_REDUCTION,
  DEPTH_VIA_EARLY_REFLECTIONS,
];

export const LIFT_LEVERS: readonly Lever[] = [
  LIFT_VIA_REGISTER_ELEVATION,
  LIFT_VIA_DENSITY_REDUCTION,
  LIFT_VIA_HARMONIC_TENSION,
];

export const SPATIAL_LEVERS_BATCH2: readonly Lever[] = [
  ...WIDTH_LEVERS,
  ...DEPTH_LEVERS,
  ...LIFT_LEVERS,
];

export const BATCH2_LEVER_COUNT = SPATIAL_LEVERS_BATCH2.length;
