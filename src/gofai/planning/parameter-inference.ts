/**
 * GOFAI Parameter Inference System — Step 262
 *
 * Maps vague natural language degree specifications ("a little", "much", "very")
 * to concrete numeric parameter values. This system is context-aware and
 * integrates with user preference profiles.
 *
 * Key responsibilities:
 * 1. Map degree modifiers to magnitude ranges
 * 2. Context-aware value selection (depends on parameter type, axis, scope)
 * 3. User profile integration (conservative vs aggressive preferences)
 * 4. Safe defaults with explicit provenance
 * 5. Clarification triggers when ambiguity is too high
 *
 * Design principles:
 * - Conservative by default (prefer smaller changes)
 * - Musically sensible (parameter-type aware)
 * - Explainable (provenance for every inference)
 * - Overridable (user can always specify exact values)
 *
 * Reference: gofai_goalB.md Step 262, gofaimusicplus.md §7.3
 *
 * @module gofai/planning/parameter-inference
 */

import type {
  AxisId,
  OpcodeId,
  LexemeId,
} from '../canon/types.js';
import type {
  CPLGoal,
} from '../canon/cpl-types.js';
import type { PlanSkeleton, OpenParameter } from './plan-skeleton.js';

// =============================================================================
// Core Types
// =============================================================================

/**
 * Degree specification for magnitude.
 */
export interface Degree {
  readonly modifier?: string;
  readonly phrase?: string;
  readonly explicitValue?: number;
}

/**
 * Magnitude with provenance and confidence.
 */
export interface InferredMagnitude {
  /** The inferred numeric value (normalized to [0, 1] where applicable) */
  readonly value: number;

  /** Confidence in this inference (0-1) */
  readonly confidence: number;

  /** How this value was inferred */
  readonly source: InferenceSource;

  /** Human explanation of the inference */
  readonly explanation: string;

  /** Alternative values if this one seems uncertain */
  readonly alternatives?: readonly AlternativeMagnitude[];
}

/**
 * Alternative magnitude value.
 */
export interface AlternativeMagnitude {
  readonly value: number;
  readonly reason: string;
  readonly confidence: number;
}

/**
 * Source of an inferred value.
 */
export type InferenceSource =
  | { readonly type: 'explicit'; readonly utterance: string }
  | { readonly type: 'degree-modifier'; readonly modifier: LexemeId }
  | { readonly type: 'context-default'; readonly context: string }
  | { readonly type: 'user-profile'; readonly profileKey: string }
  | { readonly type: 'parameter-default'; readonly parameterId: string }
  | { readonly type: 'axis-typical'; readonly axis: AxisId }
  | { readonly type: 'opcode-default'; readonly opcode: OpcodeId };

/**
 * Context for parameter inference.
 */
export interface InferenceContext {
  /** The goal we're inferring for */
  readonly goal: CPLGoal;

  /** The axis being manipulated (if applicable) */
  readonly axis?: AxisId;

  /** The opcode that will use this parameter */
  readonly opcode?: OpcodeId;

  /** The parameter being inferred */
  readonly parameter: OpenParameter;

  /** Scope size (affects "safe" magnitudes) */
  readonly scopeSize?: 'small' | 'medium' | 'large';

  /** User's conservativeness preference (0=conservative, 1=aggressive) */
  readonly userAggressiveness?: number;

  /** Whether this edit is reversible */
  readonly reversible: boolean;

  /** Historical values user has accepted for similar edits */
  readonly history?: readonly number[];
}

/**
 * Result of parameter inference.
 */
export type InferenceResult =
  | { readonly ok: true; readonly magnitude: InferredMagnitude }
  | {
      readonly ok: false;
      readonly reason: string;
      readonly needsClarification: boolean;
      readonly suggestions?: readonly string[];
    };

// =============================================================================
// Degree Modifier Mappings
// =============================================================================

/**
 * Degree modifiers mapped to magnitude ranges.
 * 
 * These are baseline ranges that get adjusted by context.
 */
const DEGREE_MAGNITUDE_RANGES: Record<
  string,
  { min: number; max: number; typical: number }
> = {
  // Minimal changes
  'slightly': { min: 0.05, max: 0.15, typical: 0.10 },
  'a_bit': { min: 0.05, max: 0.15, typical: 0.10 },
  'a_little': { min: 0.08, max: 0.20, typical: 0.15 },
  'somewhat': { min: 0.10, max: 0.25, typical: 0.18 },

  // Moderate changes (default baseline)
  'moderately': { min: 0.15, max: 0.35, typical: 0.25 },
  '(no_modifier)': { min: 0.20, max: 0.40, typical: 0.30 },

  // Significant changes
  'fairly': { min: 0.25, max: 0.45, typical: 0.35 },
  'quite': { min: 0.30, max: 0.50, typical: 0.40 },
  'pretty': { min: 0.30, max: 0.50, typical: 0.40 },
  'significantly': { min: 0.35, max: 0.55, typical: 0.45 },

  // Large changes
  'very': { min: 0.40, max: 0.65, typical: 0.50 },
  'really': { min: 0.45, max: 0.70, typical: 0.55 },
  'substantially': { min: 0.50, max: 0.75, typical: 0.60 },
  'considerably': { min: 0.50, max: 0.75, typical: 0.60 },

  // Extreme changes
  'extremely': { min: 0.60, max: 0.85, typical: 0.70 },
  'massively': { min: 0.65, max: 0.90, typical: 0.75 },
  'dramatically': { min: 0.70, max: 0.95, typical: 0.80 },
  'totally': { min: 0.75, max: 1.00, typical: 0.85 },
  'completely': { min: 0.80, max: 1.00, typical: 0.90 },
  'absolutely': { min: 0.85, max: 1.00, typical: 0.95 },
};

/**
 * Explicit numeric phrases mapped to values.
 * Comprehensive mapping of common natural language magnitude expressions.
 */
const EXPLICIT_NUMERIC_PHRASES: Record<string, number> = {
  // Size metaphors
  'tiny': 0.05,
  'minuscule': 0.04,
  'microscopic': 0.03,
  'small': 0.15,
  'little': 0.12,
  'petite': 0.10,
  'medium': 0.30,
  'mid-sized': 0.32,
  'moderate-sized': 0.28,
  'large': 0.50,
  'big': 0.48,
  'sizable': 0.52,
  'huge': 0.70,
  'enormous': 0.72,
  'gigantic': 0.75,
  'massive': 0.85,
  'colossal': 0.88,
  'astronomical': 0.92,
  'gargantuan': 0.90,

  // Perceptual salience
  'subtle': 0.10,
  'understated': 0.12,
  'delicate': 0.08,
  'faint': 0.07,
  'gentle': 0.11,
  'soft': 0.13,
  'noticeable': 0.25,
  'perceptible': 0.23,
  'evident': 0.27,
  'clear': 0.28,
  'obvious': 0.45,
  'apparent': 0.43,
  'prominent': 0.48,
  'striking': 0.52,
  'dramatic': 0.70,
  'bold': 0.68,
  'pronounced': 0.72,
  'intense': 0.75,
  'extreme': 0.90,
  'radical': 0.88,
  'severe': 0.92,

  // Degree of change
  'minimal': 0.08,
  'slight': 0.10,
  'marginal': 0.09,
  'incremental': 0.12,
  'modest': 0.18,
  'moderate': 0.30,
  'fair': 0.35,
  'considerable': 0.45,
  'substantial': 0.55,
  'significant': 0.50,
  'major': 0.75,
  'profound': 0.78,
  'sweeping': 0.82,
  'maximal': 0.95,
  'total': 0.98,
  'complete': 1.00,
  'absolute': 1.00,
  
  // Musical intensity descriptors
  'whisper': 0.06,
  'murmur': 0.08,
  'breathe': 0.07,
  'caress': 0.10,
  'touch': 0.12,
  'nudge': 0.15,
  'tap': 0.18,
  'push': 0.35,
  'shove': 0.50,
  'slam': 0.75,
  'crash': 0.85,
  'explode': 0.95,

  // Comparative descriptors
  'hair': 0.04, // "a hair more"
  'smidge': 0.05,
  'tad': 0.08,
  'touch': 0.10,
  'dash': 0.12,
  'pinch': 0.10,
  'splash': 0.15,
  'dollop': 0.20,
  'chunk': 0.40,
  'heap': 0.60,
  'ton': 0.80,
  'mountain': 0.90,

  // Percentage-like phrases
  'fraction': 0.15,
  'quarter': 0.25,
  'third': 0.33,
  'half': 0.50,
  'double': 0.50, // means "increase by 50%" in most contexts
  'triple': 0.67,

  // Speed/time descriptors (for tempo changes)
  'crawl': 0.15, // much slower
  'drag': 0.20,
  'slow': 0.25,
  'leisurely': 0.22,
  'easy': 0.18,
  'brisk': 0.35,
  'quick': 0.40,
  'fast': 0.45,
  'rapid': 0.50,
  'swift': 0.48,
  'hurried': 0.52,
  'rushed': 0.55,
  'race': 0.70,
  'sprint': 0.75,
  'blaze': 0.85,
  'lightning': 0.92,

  // Texture/density descriptors
  'sparse': 0.15,
  'thin': 0.20,
  'light': 0.25,
  'airy': 0.22,
  'open': 0.28,
  'spacious': 0.30,
  'full': 0.50,
  'rich': 0.55,
  'thick': 0.60,
  'dense': 0.70,
  'heavy': 0.75,
  'packed': 0.80,
  'crowded': 0.85,
  'saturated': 0.90,

  // Brightness/spectral descriptors
  'dull': 0.20,
  'muted': 0.25,
  'warm': 0.35,
  'balanced': 0.50,
  'crisp': 0.60,
  'bright': 0.70,
  'brilliant': 0.75,
  'sparkling': 0.80,
  'shimmering': 0.85,
  'blinding': 0.95,

  // Width/spatial descriptors
  'narrow': 0.20,
  'focused': 0.25,
  'centered': 0.30,
  'spread': 0.50,
  'wide': 0.70,
  'broad': 0.75,
  'expansive': 0.85,
  'panoramic': 0.95,

  // Distance/depth descriptors
  'close': 0.20,
  'intimate': 0.25,
  'near': 0.30,
  'present': 0.45,
  'distant': 0.70,
  'far': 0.75,
  'remote': 0.85,
  'vast': 0.90,

  // Emotional intensity
  'timid': 0.12,
  'shy': 0.15,
  'reserved': 0.20,
  'confident': 0.45,
  'assertive': 0.55,
  'aggressive': 0.70,
  'fierce': 0.80,
  'savage': 0.90,
  'brutal': 0.95,

  // Energy level descriptors
  'lifeless': 0.05,
  'sleepy': 0.10,
  'drowsy': 0.12,
  'calm': 0.20,
  'relaxed': 0.25,
  'content': 0.30,
  'active': 0.50,
  'lively': 0.60,
  'energetic': 0.70,
  'vibrant': 0.75,
  'electric': 0.85,
  'manic': 0.92,
  'frantic': 0.95,
  'chaotic': 0.98,
};

// =============================================================================
// Axis-Specific Adjustments
// =============================================================================

/**
 * Some axes need different magnitude scales.
 * For example, pitch changes are more sensitive than width changes.
 */
const AXIS_SENSITIVITY_MULTIPLIERS: Record<string, number> = {
  // Pitch/harmony (very sensitive)
  'pitch': 0.6,
  'register': 0.7,
  'harmony': 0.7,

  // Rhythm (moderately sensitive)
  'tempo': 0.75,
  'swing': 0.75,
  'timing': 0.8,

  // Spatial (less sensitive)
  'width': 1.0,
  'depth': 1.0,
  'pan': 1.0,

  // Spectral (moderately sensitive)
  'brightness': 0.85,
  'warmth': 0.85,
  'air': 0.9,

  // Dynamics (moderately sensitive)
  'loudness': 0.8,
  'impact': 0.8,

  // Density (less sensitive)
  'density': 1.0,
  'busyness': 1.0,

  // Texture (less sensitive)
  'roughness': 0.9,
  'smoothness': 0.9,
};

/**
 * Parameter type affects safe ranges.
 */
const PARAMETER_TYPE_ADJUSTMENTS: Record<
  string,
  { conservative: number; safe: number }
> = {
  // Melody changes are risky
  'melody': { conservative: 0.5, safe: 0.3 },
  
  // Harmony changes are moderately risky
  'harmony': { conservative: 0.6, safe: 0.4 },
  
  // Rhythm changes are moderately risky
  'rhythm': { conservative: 0.7, safe: 0.5 },
  
  // Voicing changes are safer
  'voicing': { conservative: 0.9, safe: 0.7 },
  
  // Arrangement changes are safe
  'arrangement': { conservative: 1.0, safe: 0.8 },
  
  // Mix parameters are very safe
  'mix': { conservative: 1.2, safe: 1.0 },
  
  // DSP parameters are very safe
  'dsp': { conservative: 1.2, safe: 1.0 },
};

// =============================================================================
// Core Inference Functions
// =============================================================================

/**
 * Infer parameter magnitude from degree specification and context.
 */
export function inferParameterMagnitude(
  degree: Degree | undefined,
  context: InferenceContext
): InferenceResult {
  // 1. Check for explicit numeric value
  if (degree?.explicitValue !== undefined) {
    return {
      ok: true,
      magnitude: {
        value: degree.explicitValue,
        confidence: 1.0,
        source: {
          type: 'explicit',
          utterance: String(degree.explicitValue),
        },
        explanation: `Explicit value: ${degree.explicitValue}`,
      },
    };
  }

  // 2. Check for explicit phrase mapping
  if (degree?.phrase) {
    const phraseValue = EXPLICIT_NUMERIC_PHRASES[degree.phrase];
    if (phraseValue !== undefined) {
      const adjusted = applyContextAdjustments(phraseValue, context);
      return {
        ok: true,
        magnitude: {
          value: adjusted.value,
          confidence: 0.9,
          source: {
            type: 'degree-modifier',
            modifier: degree.phrase as LexemeId,
          },
          explanation: `Phrase "${degree.phrase}" → ${adjusted.value.toFixed(2)} (adjusted for context)`,
          alternatives: adjusted.alternatives,
        },
      };
    }
  }

  // 3. Map degree modifier to magnitude range
  if (degree?.modifier) {
    const range = DEGREE_MAGNITUDE_RANGES[degree.modifier];
    if (range) {
      const selected = selectFromRange(range, context);
      return {
        ok: true,
        magnitude: {
          value: selected.value,
          confidence: selected.confidence,
          source: {
            type: 'degree-modifier',
            modifier: degree.modifier as LexemeId,
          },
          explanation: selected.explanation,
          alternatives: selected.alternatives,
        },
      };
    }
  }

  // 4. Use context defaults
  const contextDefault = inferFromContext(context);
  if (contextDefault) {
    return { ok: true, magnitude: contextDefault };
  }

  // 5. Fall back to conservative default
  return {
    ok: false,
    reason: 'Cannot infer magnitude without degree specification or context',
    needsClarification: true,
    suggestions: [
      'Specify a degree: "a little", "moderately", "very", etc.',
      'Provide explicit value: "increase by 0.3"',
      'Use comparative: "brighter than before"',
    ],
  };
}

/**
 * Select a value from a magnitude range based on context.
 */
function selectFromRange(
  range: { min: number; max: number; typical: number },
  context: InferenceContext
): {
  value: number;
  confidence: number;
  explanation: string;
  alternatives: AlternativeMagnitude[];
} {
  // Start with typical value
  let value = range.typical;
  let explanation = `Typical value for this degree: ${value.toFixed(2)}`;

  // Adjust for axis sensitivity
  if (context.axis) {
    const sensitivity = AXIS_SENSITIVITY_MULTIPLIERS[context.axis] ?? 1.0;
    value *= sensitivity;
    if (sensitivity !== 1.0) {
      explanation += `; adjusted for ${context.axis} sensitivity (×${sensitivity.toFixed(2)})`;
    }
  }

  // Adjust for parameter type risk
  const paramType = inferParameterType(context);
  if (paramType) {
    const typeAdj = PARAMETER_TYPE_ADJUSTMENTS[paramType];
    if (typeAdj) {
      const factor = context.reversible ? typeAdj.safe : typeAdj.conservative;
      value *= factor;
      if (factor !== 1.0) {
        explanation += `; ${paramType} parameter (×${factor.toFixed(2)})`;
      }
    }
  }

  // Adjust for user aggressiveness
  if (context.userAggressiveness !== undefined) {
    // 0 = conservative (use min), 1 = aggressive (use max)
    const userFactor = 0.8 + context.userAggressiveness * 0.4; // [0.8, 1.2]
    value *= userFactor;
    if (Math.abs(userFactor - 1.0) > 0.05) {
      explanation += `; user preference (×${userFactor.toFixed(2)})`;
    }
  }

  // Adjust for scope size
  if (context.scopeSize === 'large') {
    value *= 0.9; // Be more conservative with large scopes
    explanation += `; large scope (×0.9)`;
  } else if (context.scopeSize === 'small') {
    value *= 1.1; // Can be more aggressive with small scopes
    explanation += `; small scope (×1.1)`;
  }

  // Clamp to range
  value = Math.max(range.min, Math.min(range.max, value));

  // Determine confidence based on range width
  const rangeWidth = range.max - range.min;
  const confidence = rangeWidth < 0.2 ? 0.9 : rangeWidth < 0.4 ? 0.8 : 0.7;

  // Generate alternatives
  const alternatives: AlternativeMagnitude[] = [];
  
  if (value > range.min + 0.05) {
    alternatives.push({
      value: Math.max(range.min, value * 0.7),
      reason: 'More conservative option',
      confidence: confidence * 0.85,
    });
  }

  if (value < range.max - 0.05) {
    alternatives.push({
      value: Math.min(range.max, value * 1.3),
      reason: 'More aggressive option',
      confidence: confidence * 0.85,
    });
  }

  return { value, confidence, explanation, alternatives };
}

/**
 * Apply context-specific adjustments to a base value.
 */
function applyContextAdjustments(
  baseValue: number,
  context: InferenceContext
): {
  value: number;
  alternatives: AlternativeMagnitude[];
} {
  let value = baseValue;

  // Apply axis sensitivity
  if (context.axis) {
    const sensitivity = AXIS_SENSITIVITY_MULTIPLIERS[context.axis] ?? 1.0;
    value *= sensitivity;
  }

  // Apply parameter type adjustment
  const paramType = inferParameterType(context);
  if (paramType) {
    const typeAdj = PARAMETER_TYPE_ADJUSTMENTS[paramType];
    if (typeAdj) {
      const factor = context.reversible ? typeAdj.safe : typeAdj.conservative;
      value *= factor;
    }
  }

  // Clamp to reasonable range
  value = Math.max(0.01, Math.min(1.0, value));

  const alternatives: AlternativeMagnitude[] = [
    {
      value: Math.max(0.01, value * 0.7),
      reason: 'Smaller change',
      confidence: 0.8,
    },
    {
      value: Math.min(1.0, value * 1.3),
      reason: 'Larger change',
      confidence: 0.8,
    },
  ];

  return { value, alternatives };
}

/**
 * Infer magnitude from context alone (when no degree specified).
 */
function inferFromContext(
  context: InferenceContext
): InferredMagnitude | null {
  // Use user history if available
  if (context.history && context.history.length > 0) {
    const avg =
      context.history.reduce((sum, v) => sum + v, 0) / context.history.length;
    return {
      value: avg,
      confidence: 0.75,
      source: {
        type: 'user-profile',
        profileKey: 'historical-average',
      },
      explanation: `Based on your typical changes (avg: ${avg.toFixed(2)})`,
    };
  }

  // Use axis-specific typical values
  if (context.axis) {
    const axisTypical = getAxisTypicalMagnitude(context.axis);
    if (axisTypical) {
      return {
        value: axisTypical,
        confidence: 0.65,
        source: {
          type: 'axis-typical',
          axis: context.axis,
        },
        explanation: `Typical magnitude for ${context.axis} adjustments`,
      };
    }
  }

  // Use opcode defaults
  if (context.opcode) {
    const opcodeDefault = getOpcodeDefaultMagnitude(context.opcode);
    if (opcodeDefault) {
      return {
        value: opcodeDefault,
        confidence: 0.70,
        source: {
          type: 'opcode-default',
          opcode: context.opcode,
        },
        explanation: `Default magnitude for ${context.opcode} operation`,
      };
    }
  }

  // Conservative fallback
  return {
    value: 0.25, // Conservative default
    confidence: 0.50,
    source: {
      type: 'context-default',
      context: 'conservative-fallback',
    },
    explanation: 'Conservative default (no context available)',
    alternatives: [
      {
        value: 0.15,
        reason: 'More conservative',
        confidence: 0.5,
      },
      {
        value: 0.35,
        reason: 'More noticeable',
        confidence: 0.5,
      },
    ],
  };
}

/**
 * Infer parameter type from context.
 */
function inferParameterType(context: InferenceContext): string | null {
  // Could be derived from goal type, axis, opcode, etc.
  // This is a simplified version
  if (context.parameter.name?.includes('pitch')) return 'melody';
  if (context.parameter.name?.includes('chord')) return 'harmony';
  if (context.parameter.name?.includes('rhythm')) return 'rhythm';
  if (context.parameter.name?.includes('voicing')) return 'voicing';
  if (context.parameter.name?.includes('mix')) return 'mix';
  if (context.parameter.name?.includes('gain')) return 'mix';
  if (context.parameter.name?.includes('pan')) return 'mix';
  if (context.parameter.name?.includes('reverb')) return 'dsp';
  if (context.parameter.name?.includes('delay')) return 'dsp';
  
  // Default based on axis
  if (context.axis) {
    if (['pitch', 'register', 'melody'].includes(context.axis)) return 'melody';
    if (['harmony', 'chord'].includes(context.axis)) return 'harmony';
    if (['tempo', 'swing', 'timing'].includes(context.axis)) return 'rhythm';
    if (['width', 'depth', 'pan'].includes(context.axis)) return 'mix';
  }

  return 'arrangement'; // Safe default
}

/**
 * Get typical magnitude for an axis.
 */
function getAxisTypicalMagnitude(axis: AxisId): number | null {
  const typicalMagnitudes: Record<string, number> = {
    'brightness': 0.30,
    'warmth': 0.30,
    'width': 0.35,
    'depth': 0.30,
    'density': 0.30,
    'lift': 0.35,
    'intimacy': 0.30,
    'energy': 0.35,
    'tension': 0.25, // More sensitive
    'loudness': 0.25, // More sensitive
  };

  return typicalMagnitudes[axis] ?? null;
}

/**
 * Get default magnitude for an opcode.
 */
function getOpcodeDefaultMagnitude(opcode: OpcodeId): number | null {
  const opcodeMagnitudes: Record<string, number> = {
    'boost_highs': 0.30,
    'cut_lows': 0.25,
    'add_reverb': 0.35,
    'widen_stereo': 0.40,
    'thin_texture': 0.30,
    'densify': 0.30,
    'raise_register': 0.25,
    'lower_register': 0.25,
  };

  return opcodeMagnitudes[opcode] ?? null;
}

// =============================================================================
// Batch Inference for Plan Skeletons
// =============================================================================

/**
 * Infer all open parameters in a plan skeleton.
 */
export function inferAllParameters(
  skeleton: PlanSkeleton,
  context: Omit<InferenceContext, 'parameter' | 'goal'>
): Map<string, InferenceResult> {
  const results = new Map<string, InferenceResult>();

  for (const param of skeleton.openParameters) {
    // Extract goals from intent
    const goals = skeleton.intent.goals || [];
    if (goals.length === 0) continue; // Skip if no goals
    
    const fullContext: InferenceContext = {
      ...context,
      parameter: param,
      goal: goals[0], // Use first goal as primary
      axis: skeleton.levers[0]?.lever ?? undefined, // Use first lever's axis
      opcode: skeleton.levers[0]?.candidates[0]?.opcodeId ?? undefined, // Use first candidate
    };

    const degree = param.hint as Degree | undefined;
    const result = inferParameterMagnitude(degree, fullContext);
    results.set(param.name, result);
  }

  return results;
}

/**
 * Check if inferred parameters have sufficient confidence.
 */
export function hassufficientConfidence(
  inferences: Map<string, InferenceResult>,
  threshold: number = 0.7
): boolean {
  for (const result of inferences.values()) {
    if (!result.ok) return false;
    if (result.magnitude.confidence < threshold) return false;
  }
  return true;
}

/**
 * Get explanation for all inferred parameters.
 */
export function explainInferences(
  inferences: Map<string, InferenceResult>
): string {
  const parts: string[] = [];

  for (const [paramName, result] of inferences.entries()) {
    if (result.ok) {
      parts.push(`${paramName}: ${result.magnitude.explanation}`);
    } else {
      parts.push(`${paramName}: ${result.reason}`);
    }
  }

  return parts.join('\n');
}
