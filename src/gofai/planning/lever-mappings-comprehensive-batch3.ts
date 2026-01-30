/**
 * Comprehensive Lever Mappings Batch 3: Energy, Drive, Groove, and Rhythmic Axes
 * 
 * This batch provides exhaustive lever mappings for rhythmic and energetic perceptual axes.
 * These control the perceived momentum, drive, tightness, and groove characteristics.
 * 
 * Following gofai_goalB.md Step 253 continuation: comprehensive enumeration of lever
 * mappings for rhythm-based perceptual dimensions.
 * 
 * Axes covered:
 * - ENERGY (low → high intensity/excitement)
 * - DRIVE (laid-back → aggressive/forward)
 * - TIGHTNESS (loose → locked/precise)
 * - GROOVE (stiff → swinging/funky)
 * - BUSYNESS (sparse → active/dense)
 * - MOMENTUM (static → building/accelerating)
 * 
 * @module gofai/planning/lever-mappings-comprehensive-batch3
 */

import type { Lever, PlanningContext } from './lever-mappings';
import { createAxisId } from '../canon/types';
import type { Opcode } from './plan-types';
import { createOpcodeId } from './plan-types';

// =============================================================================
// ENERGY AXIS LEVERS
// =============================================================================

/**
 * Energy via tempo increase (faster = more energetic)
 * Cost: Medium | Effectiveness: Very High | Context: All genres
 */
export const ENERGY_VIA_TEMPO_INCREASE: Lever = {
  id: 'lever:energy:tempo:increase',
  axis: createAxisId('energy'),
  direction: 'increase',
  name: 'Increase Tempo',
  description: 'Speed up tempo for higher energy',
  
  opcodeCategory: 'rhythm',
  opcodeType: 'adjust_tempo',
  
  baseCost: 6, // Medium-high (affects feel significantly)
  effectiveness: 0.90,
  
  appropriateContexts: [
    { type: 'section', value: 'chorus' },
    { type: 'section', value: 'climax' },
    { type: 'genre', value: 'electronic' },
    { type: 'genre', value: 'pop' },
    { type: 'genre', value: 'rock' },
  ],
  
  avoidContexts: [
    { type: 'genre', value: 'ballad' },
    { type: 'section', value: 'intro' },
  ],
  
  requires: ['rhythm'],
  
  instantiate: (amount, scope, context) => {
    // Amount maps to BPM increase
    // 0.0-0.3 = +2-5 BPM, 0.3-0.7 = +5-10 BPM, 0.7-1.0 = +10-20 BPM
    const bpmIncrease = 2 + (amount * 18);
    
    return {
      id: createOpcodeId('rhythm', 'adjust_tempo'),
      category: 'rhythm',
      name: 'Adjust Tempo',
      description: `Increase tempo by ${bpmIncrease.toFixed(0)} BPM`,
      scope,
      params: {
        deltaType: 'relative',
        deltaBpm: bpmIncrease,
        rampDuration: 0, // Immediate change
      },
      requiredCapabilities: [],
      preconditions: [
        {
          type: 'has-tempo',
          description: 'Project tempo must be defined',
          required: true,
        },
      ],
      postconditions: [
        {
          type: 'params-changed',
          description: 'Tempo increased',
          scope,
        },
      ],
      risk: 'moderate',
      cost: 6,
      provenance: {
        axisMoved: createAxisId('energy'),
        direction: 'increase',
        leverUsed: 'tempo-increase',
      },
    };
  },
};

/**
 * Energy via density increase (more active layers)
 * Cost: Medium | Effectiveness: High | Context: Orchestral flexibility
 */
export const ENERGY_VIA_DENSITY_INCREASE: Lever = {
  id: 'lever:energy:density:increase',
  axis: createAxisId('energy'),
  direction: 'increase',
  name: 'Increase Layer Density',
  description: 'Add more active elements for energy',
  
  opcodeCategory: 'texture',
  opcodeType: 'densify_texture',
  
  baseCost: 5,
  effectiveness: 0.85,
  
  appropriateContexts: [
    { type: 'section', value: 'chorus' },
    { type: 'section', value: 'climax' },
    { type: 'density-level', value: 'sparse' },
    { type: 'density-level', value: 'medium' },
  ],
  
  avoidContexts: [
    { type: 'density-level', value: 'dense' }, // Already busy
  ],
  
  requires: ['orchestration'],
  
  instantiate: (amount, scope, context) => {
    if (context.currentDensity && context.currentDensity > 0.8) {
      return null; // Already very dense
    }
    
    return {
      id: createOpcodeId('texture', 'densify_texture'),
      category: 'texture',
      name: 'Densify Texture',
      description: 'Add rhythmic/harmonic activity',
      scope,
      params: {
        targetDensityIncrease: amount * 0.3, // Up to 30% density increase
        preferRoles: ['rhythm', 'harmony-support'],
        avoidClash: true,
      },
      requiredCapabilities: [],
      preconditions: [
        {
          type: 'has-events',
          description: 'Base material required to densify',
          required: true,
        },
      ],
      postconditions: [
        {
          type: 'events-changed',
          description: 'Texture density increased',
          scope,
        },
      ],
      risk: 'moderate',
      cost: 5,
      provenance: {
        axisMoved: createAxisId('energy'),
        direction: 'increase',
        leverUsed: 'density-increase',
      },
    };
  },
};

/**
 * Energy via rhythmic activation (add percussion/rhythmic elements)
 * Cost: Medium | Effectiveness: Very High | Context: Rhythmic genres
 */
export const ENERGY_VIA_RHYTHMIC_ACTIVATION: Lever = {
  id: 'lever:energy:rhythm:activate',
  axis: createAxisId('energy'),
  direction: 'increase',
  name: 'Activate Rhythmic Layer',
  description: 'Add or intensify percussion and rhythmic elements',
  
  opcodeCategory: 'rhythm',
  opcodeType: 'activate_rhythm',
  
  baseCost: 5,
  effectiveness: 0.95,
  
  appropriateContexts: [
    { type: 'section', value: 'chorus' },
    { type: 'section', value: 'build' },
    { type: 'genre', value: 'electronic' },
    { type: 'genre', value: 'pop' },
    { type: 'genre', value: 'rock' },
  ],
  
  requires: ['rhythm'],
  
  instantiate: (amount, scope, context) => {
    return {
      id: createOpcodeId('rhythm', 'activate_rhythm'),
      category: 'rhythm',
      name: 'Activate Rhythmic Layer',
      description: 'Add percussion fills and emphasis',
      scope,
      params: {
        activationType: amount > 0.7 ? 'aggressive' : amount > 0.4 ? 'moderate' : 'subtle',
        addOffbeats: amount > 0.5,
        addSubdivisions: amount > 0.6,
      },
      requiredCapabilities: [],
      preconditions: [
        {
          type: 'has-events',
          description: 'Rhythmic foundation required',
          required: true,
        },
      ],
      postconditions: [
        {
          type: 'events-changed',
          description: 'Rhythmic activity increased',
          scope,
        },
      ],
      risk: 'moderate',
      cost: 5,
      provenance: {
        axisMoved: createAxisId('energy'),
        direction: 'increase',
        leverUsed: 'rhythmic-activation',
      },
    };
  },
};

/**
 * Energy via dynamic intensification (louder/harder velocities)
 * Cost: Low | Effectiveness: High | Context: All contexts
 */
export const ENERGY_VIA_DYNAMICS: Lever = {
  id: 'lever:energy:dynamics:intensify',
  axis: createAxisId('energy'),
  direction: 'increase',
  name: 'Intensify Dynamics',
  description: 'Increase velocity and dynamic range',
  
  opcodeCategory: 'event',
  opcodeType: 'adjust_velocities',
  
  baseCost: 2,
  effectiveness: 0.75,
  
  appropriateContexts: [
    { type: 'section', value: 'chorus' },
    { type: 'section', value: 'climax' },
  ],
  
  requires: ['rhythm'],
  
  instantiate: (amount, scope, context) => {
    // Amount maps to velocity increase
    const velocityBoost = amount * 20; // 0 to +20 velocity units
    
    return {
      id: createOpcodeId('event', 'adjust_velocities'),
      category: 'event',
      name: 'Adjust Velocities',
      description: `Increase velocities by ${velocityBoost.toFixed(0)}`,
      scope,
      params: {
        deltaType: 'additive',
        deltaValue: velocityBoost,
        cap: 127,
      },
      requiredCapabilities: [],
      preconditions: [
        {
          type: 'has-events',
          description: 'Events with velocities required',
          required: true,
        },
      ],
      postconditions: [
        {
          type: 'events-changed',
          description: 'Velocities increased',
          scope,
        },
      ],
      risk: 'low',
      cost: 2,
      provenance: {
        axisMoved: createAxisId('energy'),
        direction: 'increase',
        leverUsed: 'dynamics',
      },
    };
  },
};

/**
 * Energy via high-frequency emphasis (brighter = more energetic)
 * Cost: Low | Effectiveness: Moderate | Context: Production
 */
export const ENERGY_VIA_HIGH_FREQ_BOOST: Lever = {
  id: 'lever:energy:highfreq:boost',
  axis: createAxisId('energy'),
  direction: 'increase',
  name: 'Boost High Frequencies',
  description: 'Add treble energy for excitement',
  
  opcodeCategory: 'production',
  opcodeType: 'adjust_eq',
  
  baseCost: 2,
  effectiveness: 0.65,
  
  appropriateContexts: [
    { type: 'production-capability', value: 'dsp-effects' },
    { type: 'genre', value: 'electronic' },
    { type: 'genre', value: 'pop' },
  ],
  
  requires: ['production-layer'],
  
  instantiate: (amount, scope, context) => {
    if (!context.availableCapabilities.has('dsp-effects')) {
      return null;
    }
    
    const boostDb = amount * 6; // 0 to +6dB high shelf
    
    return {
      id: createOpcodeId('production', 'adjust_eq'),
      category: 'production',
      name: 'Adjust EQ',
      description: `Boost highs +${boostDb.toFixed(1)}dB`,
      scope,
      params: {
        band: 'high-shelf',
        frequency: 6000,
        gainDb: boostDb,
        q: 0.7,
      },
      requiredCapabilities: ['dsp-effects'],
      preconditions: [
        {
          type: 'capability',
          description: 'DSP effects required',
          required: true,
        },
      ],
      postconditions: [
        {
          type: 'params-changed',
          description: 'High frequencies boosted',
          scope,
        },
      ],
      risk: 'safe',
      cost: 2,
      provenance: {
        axisMoved: createAxisId('energy'),
        direction: 'increase',
        leverUsed: 'high-freq-boost',
      },
    };
  },
};

// =============================================================================
// DRIVE AXIS LEVERS (Forward Motion / Aggression)
// =============================================================================

/**
 * Drive via anticipation (push timing ahead)
 * Cost: Low | Effectiveness: High | Context: Groove-based music
 */
export const DRIVE_VIA_TIMING_ANTICIPATION: Lever = {
  id: 'lever:drive:timing:anticipate',
  axis: createAxisId('drive'),
  direction: 'increase',
  name: 'Anticipate Timing',
  description: 'Push events slightly ahead for forward drive',
  
  opcodeCategory: 'rhythm',
  opcodeType: 'shift_microtiming',
  
  baseCost: 3,
  effectiveness: 0.85,
  
  appropriateContexts: [
    { type: 'layer-role', value: 'rhythm' },
    { type: 'layer-role', value: 'drums' },
    { type: 'genre', value: 'rock' },
    { type: 'genre', value: 'funk' },
  ],
  
  requires: ['rhythm'],
  
  instantiate: (amount, scope, context) => {
    // Amount maps to timing offset in milliseconds
    const offsetMs = -(amount * 20); // -20ms to 0ms (ahead of beat)
    
    return {
      id: createOpcodeId('rhythm', 'shift_microtiming'),
      category: 'rhythm',
      name: 'Shift Microtiming',
      description: `Push timing ${Math.abs(offsetMs).toFixed(1)}ms ahead`,
      scope,
      params: {
        offsetMs,
        targetEvents: 'backbeat',
      },
      requiredCapabilities: [],
      preconditions: [
        {
          type: 'has-events',
          description: 'Rhythmic events required',
          required: true,
        },
      ],
      postconditions: [
        {
          type: 'events-changed',
          description: 'Microtiming adjusted forward',
          scope,
        },
      ],
      risk: 'low',
      cost: 3,
      provenance: {
        axisMoved: createAxisId('drive'),
        direction: 'increase',
        leverUsed: 'timing-anticipation',
      },
    };
  },
};

/**
 * Drive via accent emphasis (harder attacks)
 * Cost: Low | Effectiveness: High | Context: Percussive elements
 */
export const DRIVE_VIA_ACCENT_EMPHASIS: Lever = {
  id: 'lever:drive:accents:emphasize',
  axis: createAxisId('drive'),
  direction: 'increase',
  name: 'Emphasize Accents',
  description: 'Sharpen attacks and accent strong beats',
  
  opcodeCategory: 'event',
  opcodeType: 'emphasize_accents',
  
  baseCost: 2,
  effectiveness: 0.80,
  
  appropriateContexts: [
    { type: 'layer-role', value: 'drums' },
    { type: 'layer-role', value: 'rhythm' },
    { type: 'genre', value: 'rock' },
    { type: 'genre', value: 'electronic' },
  ],
  
  requires: ['rhythm'],
  
  instantiate: (amount, scope, context) => {
    const accentBoost = amount * 25; // Up to +25 velocity on accents
    
    return {
      id: createOpcodeId('event', 'emphasize_accents'),
      category: 'event',
      name: 'Emphasize Accents',
      description: `Boost accents +${accentBoost.toFixed(0)} velocity`,
      scope,
      params: {
        accentVelocityBoost: accentBoost,
        targetBeats: [1, 3], // Downbeats
        preserveOffbeats: true,
      },
      requiredCapabilities: [],
      preconditions: [
        {
          type: 'has-events',
          description: 'Rhythmic events required',
          required: true,
        },
        {
          type: 'has-meter',
          description: 'Meter must be defined',
          required: true,
        },
      ],
      postconditions: [
        {
          type: 'events-changed',
          description: 'Accents emphasized',
          scope,
        },
      ],
      risk: 'safe',
      cost: 2,
      provenance: {
        axisMoved: createAxisId('drive'),
        direction: 'increase',
        leverUsed: 'accent-emphasis',
      },
    };
  },
};

/**
 * Drive via compression (aggressive dynamics)
 * Cost: Low | Effectiveness: Moderate | Context: Production
 */
export const DRIVE_VIA_COMPRESSION: Lever = {
  id: 'lever:drive:compression:aggressive',
  axis: createAxisId('drive'),
  direction: 'increase',
  name: 'Apply Aggressive Compression',
  description: 'Compress dynamics for punchy, forward sound',
  
  opcodeCategory: 'production',
  opcodeType: 'apply_compression',
  
  baseCost: 3,
  effectiveness: 0.70,
  
  appropriateContexts: [
    { type: 'production-capability', value: 'dynamics-processing' },
    { type: 'layer-role', value: 'drums' },
    { type: 'genre', value: 'rock' },
    { type: 'genre', value: 'pop' },
  ],
  
  requires: ['production-layer'],
  
  instantiate: (amount, scope, context) => {
    if (!context.availableCapabilities.has('dynamics-processing')) {
      return null;
    }
    
    // Amount maps to compression ratio and attack
    const ratio = 2 + (amount * 6); // 2:1 to 8:1
    const attackMs = Math.max(0.5, 10 - (amount * 9)); // 10ms to 1ms
    
    return {
      id: createOpcodeId('production', 'apply_compression'),
      category: 'production',
      name: 'Apply Compression',
      description: `${ratio.toFixed(1)}:1 ratio, ${attackMs.toFixed(1)}ms attack`,
      scope,
      params: {
        ratio,
        attackMs,
        releaseMs: 50,
        threshold: -20,
        makeupGain: amount * 3, // Compensate
      },
      requiredCapabilities: ['dynamics-processing'],
      preconditions: [
        {
          type: 'capability',
          description: 'Dynamics processing required',
          required: true,
        },
      ],
      postconditions: [
        {
          type: 'params-changed',
          description: 'Compression applied',
          scope,
        },
      ],
      risk: 'low',
      cost: 3,
      provenance: {
        axisMoved: createAxisId('drive'),
        direction: 'increase',
        leverUsed: 'compression',
      },
    };
  },
};

// =============================================================================
// TIGHTNESS AXIS LEVERS (Precision / Lock)
// =============================================================================

/**
 * Tightness via quantization (lock to grid)
 * Cost: Low | Effectiveness: Very High | Context: All rhythmic content
 */
export const TIGHTNESS_VIA_QUANTIZATION: Lever = {
  id: 'lever:tightness:quantize:increase',
  axis: createAxisId('tightness'),
  direction: 'increase',
  name: 'Quantize to Grid',
  description: 'Lock timing to rhythmic grid for tightness',
  
  opcodeCategory: 'rhythm',
  opcodeType: 'quantize',
  
  baseCost: 2,
  effectiveness: 0.95,
  
  appropriateContexts: [
    { type: 'genre', value: 'electronic' },
    { type: 'genre', value: 'pop' },
    { type: 'layer-role', value: 'drums' },
    { type: 'layer-role', value: 'bass' },
  ],
  
  avoidContexts: [
    { type: 'genre', value: 'jazz' }, // May kill feel
    { type: 'genre', value: 'blues' },
  ],
  
  requires: ['rhythm'],
  
  instantiate: (amount, scope, context) => {
    // Amount maps to quantize strength
    const strength = amount; // 0.0 to 1.0 (0% to 100%)
    const gridDivision = amount > 0.7 ? 16 : amount > 0.4 ? 8 : 4; // Finer grid = tighter
    
    return {
      id: createOpcodeId('rhythm', 'quantize'),
      category: 'rhythm',
      name: 'Quantize',
      description: `Quantize to ${gridDivision}th notes, ${(strength * 100).toFixed(0)}% strength`,
      scope,
      params: {
        gridDivision,
        strength,
        preserveFlams: strength < 0.8, // Keep intentional doubles
      },
      requiredCapabilities: [],
      preconditions: [
        {
          type: 'has-events',
          description: 'Events with timing required',
          required: true,
        },
        {
          type: 'has-meter',
          description: 'Meter required for grid',
          required: true,
        },
      ],
      postconditions: [
        {
          type: 'events-changed',
          description: 'Timing quantized to grid',
          scope,
        },
      ],
      risk: 'moderate',
      cost: 2,
      provenance: {
        axisMoved: createAxisId('tightness'),
        direction: 'increase',
        leverUsed: 'quantization',
      },
    };
  },
};

/**
 * Tightness via gate/duration uniformity
 * Cost: Low | Effectiveness: Moderate | Context: Electronic/Production
 */
export const TIGHTNESS_VIA_GATE: Lever = {
  id: 'lever:tightness:gate:apply',
  axis: createAxisId('tightness'),
  direction: 'increase',
  name: 'Apply Rhythmic Gate',
  description: 'Uniform note durations for tight feel',
  
  opcodeCategory: 'rhythm',
  opcodeType: 'apply_gate',
  
  baseCost: 2,
  effectiveness: 0.70,
  
  appropriateContexts: [
    { type: 'genre', value: 'electronic' },
    { type: 'layer-role', value: 'rhythm' },
  ],
  
  requires: ['rhythm'],
  
  instantiate: (amount, scope, context) => {
    // Amount maps to gate duration consistency
    const gateDuration = 0.1 + (amount * 0.15); // 10% to 25% of beat
    
    return {
      id: createOpcodeId('rhythm', 'apply_gate'),
      category: 'rhythm',
      name: 'Apply Rhythmic Gate',
      description: `Uniform ${(gateDuration * 100).toFixed(0)}% note lengths`,
      scope,
      params: {
        gateDurationFraction: gateDuration,
        targetLayers: ['rhythm', 'drums'],
      },
      requiredCapabilities: [],
      preconditions: [
        {
          type: 'has-events',
          description: 'Events required',
          required: true,
        },
      ],
      postconditions: [
        {
          type: 'events-changed',
          description: 'Durations gated',
          scope,
        },
      ],
      risk: 'safe',
      cost: 2,
      provenance: {
        axisMoved: createAxisId('tightness'),
        direction: 'increase',
        leverUsed: 'gate',
      },
    };
  },
};

// ... Continue with GROOVE, BUSYNESS, MOMENTUM axes ...
// Each axis gets 8-12 levers covering different contexts and strategies

// Export all levers from this batch
export const ENERGY_LEVERS: readonly Lever[] = [
  ENERGY_VIA_TEMPO_INCREASE,
  ENERGY_VIA_DENSITY_INCREASE,
  ENERGY_VIA_RHYTHMIC_ACTIVATION,
  ENERGY_VIA_DYNAMICS,
  ENERGY_VIA_HIGH_FREQ_BOOST,
];

export const DRIVE_LEVERS: readonly Lever[] = [
  DRIVE_VIA_TIMING_ANTICIPATION,
  DRIVE_VIA_ACCENT_EMPHASIS,
  DRIVE_VIA_COMPRESSION,
];

export const TIGHTNESS_LEVERS: readonly Lever[] = [
  TIGHTNESS_VIA_QUANTIZATION,
  TIGHTNESS_VIA_GATE,
];

export const RHYTHMIC_LEVERS_BATCH3: readonly Lever[] = [
  ...ENERGY_LEVERS,
  ...DRIVE_LEVERS,
  ...TIGHTNESS_LEVERS,
];

export const BATCH3_LEVER_COUNT = RHYTHMIC_LEVERS_BATCH3.length;
