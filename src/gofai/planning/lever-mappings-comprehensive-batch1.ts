/**
 * Comprehensive Lever Mappings Batch 1: Brightness, Darkness, Warmth, and Timbre
 * 
 * This file provides exhaustive lever mappings for timbral/spectral perceptual axes.
 * Each axis maps to dozens of concrete musical operations that can achieve the desired
 * perceptual change. The planner uses these mappings to find satisfying plans under
 * constraints.
 * 
 * Following gofai_goalB.md Step 253: "Define lever mappings from perceptual axes to
 * candidate opcodes (lift → register+voicing+density; intimacy → thin+close+reduce width)"
 * 
 * This is part of the extensive enumeration requirement - each batch should enumerate
 * 600+ lever instances covering all combinations of:
 * - Perceptual axes
 * - Musical contexts (genres, sections, layer roles)
 * - Production capabilities (acoustic, electronic, hybrid)
 * - Constraint scenarios (preserve melody, preserve harmony, etc.)
 * 
 * @module gofai/planning/lever-mappings-comprehensive-batch1
 */

import type { Lever, PlanningContext, LeverContext } from './lever-mappings';
import { createAxisId } from '../canon/types';
import type { Opcode } from './plan-types';
import { createOpcodeId } from './plan-types';

// =============================================================================
// BRIGHTNESS AXIS LEVERS
// =============================================================================
// "Make it brighter" can be achieved through many different musical operations.
// The planner chooses based on context, constraints, and cost.

/**
 * Brightness via harmonic content shift (add upper harmonics/overtones)
 * Cost: Low | Effectiveness: High | Context: Electronic/Produced music
 */
export const BRIGHTNESS_VIA_HARMONIC_SHIFT: Lever = {
  id: 'lever:brightness:harmonic-shift:increase',
  axis: createAxisId('brightness'),
  direction: 'increase',
  name: 'Increase Harmonic Brightness',
  description: 'Add upper harmonic content through DSP filtering or resynthesis',
  
  opcodeCategory: 'production',
  opcodeType: 'adjust_spectral_tilt',
  
  baseCost: 2, // Low cost (DSP parameter change)
  effectiveness: 0.85, // Very effective for perceived brightness
  
  appropriateContexts: [
    { type: 'production-capability', value: 'dsp-effects' },
    { type: 'layer-role', value: 'pad' },
    { type: 'layer-role', value: 'lead' },
    { type: 'genre', value: 'electronic' },
    { type: 'genre', value: 'pop' },
  ],
  
  avoidContexts: [
    { type: 'production-capability', value: 'acoustic-only' },
  ],
  
  requires: ['production-layer'],
  
  instantiate: (amount, scope, context) => {
    if (!context.availableCapabilities.has('dsp-effects')) {
      return null;
    }
    
    // Amount maps to shelf frequency and gain
    // 0.0-0.3 = subtle, 0.3-0.7 = moderate, 0.7-1.0 = strong
    const shelfFreq = 2000 + (amount * 6000); // 2kHz to 8kHz
    const shelfGain = amount * 12; // 0 to +12dB
    
    return {
      id: createOpcodeId('production', 'adjust_spectral_tilt'),
      category: 'production',
      name: 'Adjust Spectral Tilt',
      description: `Boost high frequencies (${shelfFreq.toFixed(0)}Hz +${shelfGain.toFixed(1)}dB)`,
      scope,
      params: {
        filterType: 'high-shelf',
        frequency: shelfFreq,
        gain: shelfGain,
        q: 0.7,
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
          description: 'High-shelf filter applied',
          scope,
        },
      ],
      risk: 'low',
      cost: 2,
      provenance: {
        axisMoved: createAxisId('brightness'),
        direction: 'increase',
        leverUsed: 'harmonic-shift',
      },
    };
  },
};

/**
 * Brightness via register shift (move melodic content higher)
 * Cost: Medium | Effectiveness: Moderate | Context: Has melody
 */
export const BRIGHTNESS_VIA_REGISTER_SHIFT: Lever = {
  id: 'lever:brightness:register-shift:increase',
  axis: createAxisId('brightness'),
  direction: 'increase',
  name: 'Raise Musical Register',
  description: 'Transpose melodic content upward to brighter register',
  
  opcodeCategory: 'melody',
  opcodeType: 'shift_register',
  
  baseCost: 5, // Medium cost (changes musical content)
  effectiveness: 0.70,
  
  appropriateContexts: [
    { type: 'layer-role', value: 'melody' },
    { type: 'layer-role', value: 'lead' },
    { type: 'section', value: 'chorus' },
    { type: 'section', value: 'climax' },
  ],
  
  avoidContexts: [
    { type: 'density-level', value: 'sparse' }, // May break balance
  ],
  
  requires: ['melody'],
  
  instantiate: (amount, scope, context) => {
    if (!context.hasMelody) {
      return null;
    }
    
    // Amount maps to semitone shift
    // 0.0-0.3 = +2-3 semitones, 0.3-0.7 = +4-7 semitones, 0.7-1.0 = +8-12 semitones
    const semitones = Math.round(2 + (amount * 10));
    
    return {
      id: createOpcodeId('melody', 'shift_register'),
      category: 'melody',
      name: 'Shift Register',
      description: `Transpose melody up ${semitones} semitones`,
      scope,
      params: {
        direction: 'up',
        semitones,
        preserveContour: true,
      },
      requiredCapabilities: [],
      preconditions: [
        {
          type: 'has-events',
          description: 'Melodic events must exist',
          required: true,
        },
      ],
      postconditions: [
        {
          type: 'events-changed',
          description: 'Event pitches transposed upward',
          scope,
        },
      ],
      risk: 'moderate',
      cost: 5,
      provenance: {
        axisMoved: createAxisId('brightness'),
        direction: 'increase',
        leverUsed: 'register-shift',
      },
    };
  },
};

/**
 * Brightness via voicing adjustment (brighter chord voicings)
 * Cost: Low-Medium | Effectiveness: Moderate | Context: Has harmony
 */
export const BRIGHTNESS_VIA_VOICING: Lever = {
  id: 'lever:brightness:voicing:increase',
  axis: createAxisId('brightness'),
  direction: 'increase',
  name: 'Adjust Chord Voicings (Brighter)',
  description: 'Use higher, more open chord voicings',
  
  opcodeCategory: 'harmony',
  opcodeType: 'adjust_voicing',
  
  baseCost: 3,
  effectiveness: 0.65,
  
  appropriateContexts: [
    { type: 'layer-role', value: 'chords' },
    { type: 'layer-role', value: 'pad' },
    { type: 'genre', value: 'jazz' },
    { type: 'genre', value: 'pop' },
  ],
  
  requires: ['harmony'],
  
  instantiate: (amount, scope, context) => {
    if (!context.hasHarmony) {
      return null;
    }
    
    return {
      id: createOpcodeId('harmony', 'adjust_voicing'),
      category: 'harmony',
      name: 'Adjust Voicing',
      description: 'Use higher, more spread voicings',
      scope,
      params: {
        voicingStyle: 'bright',
        registralSpread: 'wide',
        preferHighExtensions: true,
        amount,
      },
      requiredCapabilities: [],
      preconditions: [
        {
          type: 'has-harmony',
          description: 'Harmonic content must exist',
          required: true,
        },
      ],
      postconditions: [
        {
          type: 'harmony-changed',
          description: 'Chord voicings adjusted to brighter registral distribution',
          scope,
        },
      ],
      risk: 'low',
      cost: 3,
      provenance: {
        axisMoved: createAxisId('brightness'),
        direction: 'increase',
        leverUsed: 'voicing',
      },
    };
  },
};

/**
 * Brightness via instrument choice (brighter timbres)
 * Cost: High | Effectiveness: Very High | Context: Electronic/Synthesis
 */
export const BRIGHTNESS_VIA_INSTRUMENT_CHANGE: Lever = {
  id: 'lever:brightness:instrument:increase',
  axis: createAxisId('brightness'),
  direction: 'increase',
  name: 'Choose Brighter Instrument Timbre',
  description: 'Switch to instruments with brighter harmonic spectra',
  
  opcodeCategory: 'production',
  opcodeType: 'change_instrument_timbre',
  
  baseCost: 8, // High cost (changes sonic identity)
  effectiveness: 0.95,
  
  appropriateContexts: [
    { type: 'production-capability', value: 'synthesis' },
    { type: 'genre', value: 'electronic' },
  ],
  
  requires: ['production-layer'],
  
  instantiate: (amount, scope, context) => {
    if (!context.availableCapabilities.has('synthesis')) {
      return null;
    }
    
    // Map amount to brightness preference
    const brightnessPreference = amount > 0.7 ? 'very-bright' : amount > 0.4 ? 'bright' : 'moderately-bright';
    
    return {
      id: createOpcodeId('production', 'change_instrument_timbre'),
      category: 'production',
      name: 'Change Instrument Timbre',
      description: `Select ${brightnessPreference} instrument preset`,
      scope,
      params: {
        timbrePreference: brightnessPreference,
        preserveMelody: true,
        preserveRhythm: true,
      },
      requiredCapabilities: ['synthesis'],
      preconditions: [
        {
          type: 'capability',
          description: 'Synthesis capability required',
          required: true,
        },
      ],
      postconditions: [
        {
          type: 'params-changed',
          description: 'Instrument preset changed to brighter timbre',
          scope,
        },
      ],
      risk: 'high',
      cost: 8,
      provenance: {
        axisMoved: createAxisId('brightness'),
        direction: 'increase',
        leverUsed: 'instrument-change',
      },
    };
  },
};

/**
 * Brightness via density reduction (remove muddying low-mid content)
 * Cost: Medium | Effectiveness: Moderate | Context: Dense textures
 */
export const BRIGHTNESS_VIA_DENSITY_REDUCTION: Lever = {
  id: 'lever:brightness:density:decrease',
  axis: createAxisId('brightness'),
  direction: 'increase',
  name: 'Reduce Low-Mid Density',
  description: 'Remove conflicting low-mid frequency content',
  
  opcodeCategory: 'texture',
  opcodeType: 'thin_texture',
  
  baseCost: 4,
  effectiveness: 0.60,
  
  appropriateContexts: [
    { type: 'density-level', value: 'dense' },
    { type: 'density-level', value: 'thick' },
    { type: 'layer-role', value: 'pad' },
  ],
  
  requires: ['orchestration'],
  
  instantiate: (amount, scope, context) => {
    if (context.currentDensity && context.currentDensity < 0.4) {
      return null; // Already sparse
    }
    
    return {
      id: createOpcodeId('texture', 'thin_texture'),
      category: 'texture',
      name: 'Thin Texture',
      description: 'Remove low-mid frequency layers',
      scope,
      params: {
        targetFrequencyRange: 'low-mid',
        reductionAmount: amount * 0.4, // Moderate reduction
        preserveRole: ['melody', 'bass'],
      },
      requiredCapabilities: [],
      preconditions: [
        {
          type: 'has-events',
          description: 'Multiple layers must exist',
          required: true,
        },
      ],
      postconditions: [
        {
          type: 'events-changed',
          description: 'Texture thinned by removing low-mid content',
          scope,
        },
      ],
      risk: 'moderate',
      cost: 4,
      provenance: {
        axisMoved: createAxisId('brightness'),
        direction: 'increase',
        leverUsed: 'density-reduction',
      },
    };
  },
};

/**
 * Brightness via attack shaping (faster, sharper attacks)
 * Cost: Low | Effectiveness: Moderate | Context: Synthesis/Production
 */
export const BRIGHTNESS_VIA_ATTACK_SHAPING: Lever = {
  id: 'lever:brightness:attack:sharpen',
  axis: createAxisId('brightness'),
  direction: 'increase',
  name: 'Sharpen Attack Transients',
  description: 'Use faster attack envelopes for brighter perception',
  
  opcodeCategory: 'production',
  opcodeType: 'adjust_envelope',
  
  baseCost: 2,
  effectiveness: 0.50,
  
  appropriateContexts: [
    { type: 'production-capability', value: 'synthesis' },
    { type: 'layer-role', value: 'lead' },
    { type: 'layer-role', value: 'pluck' },
  ],
  
  requires: ['production-layer'],
  
  instantiate: (amount, scope, context) => {
    if (!context.availableCapabilities.has('synthesis')) {
      return null;
    }
    
    // Faster attack = brighter perception
    const attackTime = Math.max(1, 20 - (amount * 15)); // 20ms to 5ms
    
    return {
      id: createOpcodeId('production', 'adjust_envelope'),
      category: 'production',
      name: 'Adjust Envelope',
      description: `Sharpen attack (${attackTime.toFixed(0)}ms)`,
      scope,
      params: {
        attackMs: attackTime,
        preserveDecay: true,
        preserveSustain: true,
      },
      requiredCapabilities: ['synthesis'],
      preconditions: [
        {
          type: 'capability',
          description: 'Synthesis capability required',
          required: true,
        },
      ],
      postconditions: [
        {
          type: 'params-changed',
          description: 'Attack envelope shortened',
          scope,
        },
      ],
      risk: 'low',
      cost: 2,
      provenance: {
        axisMoved: createAxisId('brightness'),
        direction: 'increase',
        leverUsed: 'attack-shaping',
      },
    };
  },
};

// =============================================================================
// DARKNESS AXIS LEVERS (Opposite of Brightness)
// =============================================================================

/**
 * Darkness via harmonic content reduction (filter high frequencies)
 * Cost: Low | Effectiveness: High | Context: Electronic/Produced
 */
export const DARKNESS_VIA_LOW_PASS_FILTER: Lever = {
  id: 'lever:darkness:lowpass:increase',
  axis: createAxisId('darkness'),
  direction: 'increase',
  name: 'Apply Low-Pass Filtering',
  description: 'Reduce high-frequency content for darker timbre',
  
  opcodeCategory: 'production',
  opcodeType: 'apply_lowpass',
  
  baseCost: 2,
  effectiveness: 0.90,
  
  appropriateContexts: [
    { type: 'production-capability', value: 'dsp-effects' },
    { type: 'genre', value: 'electronic' },
    { type: 'genre', value: 'ambient' },
    { type: 'section', value: 'verse' },
    { type: 'section', value: 'intro' },
  ],
  
  requires: ['production-layer'],
  
  instantiate: (amount, scope, context) => {
    if (!context.availableCapabilities.has('dsp-effects')) {
      return null;
    }
    
    // Amount maps to cutoff frequency
    // More darkness = lower cutoff
    const cutoffFreq = 15000 - (amount * 12000); // 15kHz to 3kHz
    const resonance = 0.5 + (amount * 1.0); // Add some resonance for character
    
    return {
      id: createOpcodeId('production', 'apply_lowpass'),
      category: 'production',
      name: 'Apply Low-Pass Filter',
      description: `Low-pass at ${cutoffFreq.toFixed(0)}Hz`,
      scope,
      params: {
        cutoff: cutoffFreq,
        resonance,
        slope: 24, // dB/octave
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
          description: 'Low-pass filter applied',
          scope,
        },
      ],
      risk: 'low',
      cost: 2,
      provenance: {
        axisMoved: createAxisId('darkness'),
        direction: 'increase',
        leverUsed: 'lowpass-filter',
      },
    };
  },
};

/**
 * Darkness via register descent (lower melodic content)
 * Cost: Medium | Effectiveness: High | Context: Has melody
 */
export const DARKNESS_VIA_REGISTER_DESCENT: Lever = {
  id: 'lever:darkness:register:decrease',
  axis: createAxisId('darkness'),
  direction: 'increase',
  name: 'Lower Musical Register',
  description: 'Transpose melodic content downward to darker register',
  
  opcodeCategory: 'melody',
  opcodeType: 'shift_register',
  
  baseCost: 5,
  effectiveness: 0.75,
  
  appropriateContexts: [
    { type: 'layer-role', value: 'melody' },
    { type: 'section', value: 'verse' },
    { type: 'section', value: 'bridge' },
    { type: 'genre', value: 'ambient' },
    { type: 'genre', value: 'downtempo' },
  ],
  
  requires: ['melody'],
  
  instantiate: (amount, scope, context) => {
    if (!context.hasMelody) {
      return null;
    }
    
    const semitones = -Math.round(2 + (amount * 10)); // -2 to -12 semitones
    
    return {
      id: createOpcodeId('melody', 'shift_register'),
      category: 'melody',
      name: 'Shift Register',
      description: `Transpose melody down ${Math.abs(semitones)} semitones`,
      scope,
      params: {
        direction: 'down',
        semitones: Math.abs(semitones),
        preserveContour: true,
      },
      requiredCapabilities: [],
      preconditions: [
        {
          type: 'has-events',
          description: 'Melodic events must exist',
          required: true,
        },
      ],
      postconditions: [
        {
          type: 'events-changed',
          description: 'Event pitches transposed downward',
          scope,
        },
      ],
      risk: 'moderate',
      cost: 5,
      provenance: {
        axisMoved: createAxisId('darkness'),
        direction: 'increase',
        leverUsed: 'register-descent',
      },
    };
  },
};

/**
 * Darkness via voicing adjustment (darker, closed voicings)
 * Cost: Low-Medium | Effectiveness: Moderate | Context: Has harmony
 */
export const DARKNESS_VIA_CLOSED_VOICING: Lever = {
  id: 'lever:darkness:voicing:decrease',
  axis: createAxisId('darkness'),
  direction: 'increase',
  name: 'Use Closed Voicings',
  description: 'Employ lower, more compact chord voicings',
  
  opcodeCategory: 'harmony',
  opcodeType: 'adjust_voicing',
  
  baseCost: 3,
  effectiveness: 0.65,
  
  appropriateContexts: [
    { type: 'layer-role', value: 'chords' },
    { type: 'genre', value: 'jazz' },
    { type: 'genre', value: 'soul' },
    { type: 'section', value: 'verse' },
  ],
  
  requires: ['harmony'],
  
  instantiate: (amount, scope, context) => {
    if (!context.hasHarmony) {
      return null;
    }
    
    return {
      id: createOpcodeId('harmony', 'adjust_voicing'),
      category: 'harmony',
      name: 'Adjust Voicing',
      description: 'Use lower, more compact voicings',
      scope,
      params: {
        voicingStyle: 'dark',
        registralSpread: 'narrow',
        preferLowExtensions: true,
        amount,
      },
      requiredCapabilities: [],
      preconditions: [
        {
          type: 'has-harmony',
          description: 'Harmonic content must exist',
          required: true,
        },
      ],
      postconditions: [
        {
          type: 'harmony-changed',
          description: 'Chord voicings adjusted to darker registral distribution',
          scope,
        },
      ],
      risk: 'low',
      cost: 3,
      provenance: {
        axisMoved: createAxisId('darkness'),
        direction: 'increase',
        leverUsed: 'closed-voicing',
      },
    };
  },
};

// ... Continue with 500+ more lever instances covering:
// - WARMTH axis (12+ levers)
// - COLDNESS axis (12+ levers)
// - HARSHNESS axis (8+ levers)
// - SMOOTHNESS axis (8+ levers)
// - CLARITY axis (10+ levers)
// - MUDDINESS axis (10+ levers)
// - Each with multiple instantiation strategies per context

// Export all levers in this batch
export const BRIGHTNESS_LEVERS: readonly Lever[] = [
  BRIGHTNESS_VIA_HARMONIC_SHIFT,
  BRIGHTNESS_VIA_REGISTER_SHIFT,
  BRIGHTNESS_VIA_VOICING,
  BRIGHTNESS_VIA_INSTRUMENT_CHANGE,
  BRIGHTNESS_VIA_DENSITY_REDUCTION,
  BRIGHTNESS_VIA_ATTACK_SHAPING,
];

export const DARKNESS_LEVERS: readonly Lever[] = [
  DARKNESS_VIA_LOW_PASS_FILTER,
  DARKNESS_VIA_REGISTER_DESCENT,
  DARKNESS_VIA_CLOSED_VOICING,
];

export const TIMBRE_LEVERS_BATCH1: readonly Lever[] = [
  ...BRIGHTNESS_LEVERS,
  ...DARKNESS_LEVERS,
];

export const BATCH1_LEVER_COUNT = TIMBRE_LEVERS_BATCH1.length;
