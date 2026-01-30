/**
 * Degree Affordances — UI Specification for Amount Controls
 *
 * Step 044 [HCI]: Define UI affordances for degrees: sliders,
 * discrete "tiny/small/moderate/large", and explicit numeric overrides.
 *
 * ## Purpose
 *
 * When a user says "make it brighter", they've specified a direction
 * but not an AMOUNT. The system needs to:
 *
 * 1. Apply a default amount (typically "moderate")
 * 2. Show the amount in the preview so the user can adjust
 * 3. Provide controls for fine-tuning the amount
 *
 * This module specifies the degree system — how amounts are represented,
 * displayed, and adjusted by the user.
 *
 * ## Three Representations
 *
 * Amounts exist in three equivalent forms:
 *
 * 1. **Verbal**: "tiny", "small", "moderate", "large", "extreme"
 *    - Used in natural language and in UI labels
 *    - Maps to the 5-level discrete scale
 *
 * 2. **Numeric**: 0.0 to 1.0 (normalized, axis-independent)
 *    - Used internally for planning and cost estimation
 *    - Maps to the continuous slider position
 *
 * 3. **Domain-specific**: "3 semitones", "5 dB", "120 BPM"
 *    - Used for axes that have natural units
 *    - Shown as numeric input with unit label
 *
 * ## UI Controls
 *
 * The preview pane provides three degree controls:
 *
 * 1. **Discrete chips**: 5 labeled buttons (tiny → extreme)
 * 2. **Continuous slider**: For fine-grained control
 * 3. **Numeric input**: For axes with specific units
 *
 * The control shown depends on the axis type and user preference.
 *
 * @module gofai/pipeline/degree-affordances
 */

// =============================================================================
// Degree Scale
// =============================================================================

/**
 * The five discrete degree levels.
 *
 * These are the canonical verbal labels for change amounts.
 * They map to a normalized numeric range and to domain-specific
 * amounts per axis.
 */
export type DegreeLevel =
  | 'tiny'       // Barely perceptible change
  | 'small'      // Subtle but noticeable
  | 'moderate'   // Clear, balanced change (DEFAULT)
  | 'large'      // Significant, dramatic change
  | 'extreme';   // Maximum practical change

/**
 * All degree levels in order, for iteration.
 */
export const DEGREE_LEVELS: readonly DegreeLevel[] = [
  'tiny', 'small', 'moderate', 'large', 'extreme',
];

/**
 * Numeric ranges for each degree level (normalized 0.0 – 1.0).
 */
export interface DegreeRange {
  readonly level: DegreeLevel;
  readonly min: number;
  readonly max: number;
  readonly default: number;
  readonly label: string;
  readonly description: string;
}

/**
 * The canonical degree ranges.
 */
export const DEGREE_RANGES: readonly DegreeRange[] = [
  {
    level: 'tiny',
    min: 0.0,
    max: 0.15,
    default: 0.08,
    label: 'Tiny',
    description: 'Barely perceptible — a subtle nudge',
  },
  {
    level: 'small',
    min: 0.15,
    max: 0.35,
    default: 0.25,
    label: 'Small',
    description: 'Noticeable on close listening, subtle in context',
  },
  {
    level: 'moderate',
    min: 0.35,
    max: 0.65,
    default: 0.5,
    label: 'Moderate',
    description: 'Clear, balanced change — the default amount',
  },
  {
    level: 'large',
    min: 0.65,
    max: 0.85,
    default: 0.75,
    label: 'Large',
    description: 'Significant, dramatic change',
  },
  {
    level: 'extreme',
    min: 0.85,
    max: 1.0,
    default: 0.95,
    label: 'Extreme',
    description: 'Maximum practical change — use with caution',
  },
];

/**
 * Get the DegreeRange for a given level.
 */
export function getDegreeRange(level: DegreeLevel): DegreeRange {
  const range = DEGREE_RANGES.find(r => r.level === level);
  if (range === undefined) {
    // Should never happen with the enum, but return moderate as safe default
    return DEGREE_RANGES[2]!;
  }
  return range;
}

/**
 * Map a verbal expression to a degree level.
 */
export function parseDegreeExpression(expression: string): DegreeLevel | undefined {
  const lower = expression.toLowerCase().trim();

  // Tiny
  const tinyPatterns = [
    'tiny', 'a tiny bit', 'barely', 'just a hair', 'a smidge',
    'a touch', 'ever so slightly', 'just barely', 'the tiniest bit',
    'imperceptibly', 'a nudge',
  ];
  if (tinyPatterns.some(p => lower.includes(p))) return 'tiny';

  // Small
  const smallPatterns = [
    'slightly', 'a little', 'a bit', 'a little bit', 'just a little',
    'somewhat', 'a tad', 'subtly', 'gently', 'mildly',
  ];
  if (smallPatterns.some(p => lower.includes(p))) return 'small';

  // Large
  const largePatterns = [
    'a lot', 'much', 'significantly', 'considerably', 'substantially',
    'dramatically', 'way more', 'way less', 'really', 'quite a bit',
    'big time', 'heavily',
  ];
  if (largePatterns.some(p => lower.includes(p))) return 'large';

  // Extreme
  const extremePatterns = [
    'extreme', 'extremely', 'max', 'maximum', 'all the way',
    'as much as possible', 'completely', 'totally', 'absolutely',
    'to the max',
  ];
  if (extremePatterns.some(p => lower.includes(p))) return 'extreme';

  // Moderate (default / explicit)
  const moderatePatterns = [
    'moderate', 'moderately', 'noticeably', 'clearly',
    'a fair amount', 'decently',
  ];
  if (moderatePatterns.some(p => lower.includes(p))) return 'moderate';

  // No match — return undefined (will use default)
  return undefined;
}

/**
 * Get the numeric value for a degree level.
 */
export function degreeToNumeric(level: DegreeLevel): number {
  return getDegreeRange(level).default;
}

/**
 * Map a numeric value (0-1) to the nearest degree level.
 */
export function numericToDegree(value: number): DegreeLevel {
  const clamped = Math.max(0, Math.min(1, value));
  for (const range of DEGREE_RANGES) {
    if (clamped >= range.min && clamped <= range.max) {
      return range.level;
    }
  }
  return 'moderate'; // Fallback
}


// =============================================================================
// Axis-Specific Degree Mappings
// =============================================================================

/**
 * How a degree level maps to domain-specific units for a given axis.
 *
 * For example, "moderate brightness increase" might mean different
 * things in EQ terms vs arrangement terms.
 */
export interface AxisDegreeMapping {
  /** The axis this mapping applies to. */
  readonly axisId: string;
  /** Human-readable axis name. */
  readonly axisLabel: string;
  /** Whether this axis has a natural unit (dB, BPM, etc.). */
  readonly hasUnit: boolean;
  /** The unit name (if applicable). */
  readonly unit: string | undefined;
  /** Mapping from degree level to domain-specific description. */
  readonly levelMappings: readonly AxisLevelMapping[];
  /** Whether a numeric input makes sense for this axis. */
  readonly numericInputAvailable: boolean;
  /** Range for numeric input (if applicable). */
  readonly numericRange: { readonly min: number; readonly max: number } | undefined;
}

/**
 * A single mapping from degree level to domain-specific value.
 */
export interface AxisLevelMapping {
  readonly level: DegreeLevel;
  /** What this level means for this specific axis. */
  readonly description: string;
  /** Approximate domain value (if numeric). */
  readonly approximateValue: number | undefined;
}

/**
 * Canonical axis-degree mappings for common axes.
 */
export const AXIS_DEGREE_MAPPINGS: readonly AxisDegreeMapping[] = [
  // --- Brightness ---
  {
    axisId: 'brightness',
    axisLabel: 'Brightness',
    hasUnit: false,
    unit: undefined,
    levelMappings: [
      { level: 'tiny', description: 'Barely perceptible spectral shift', approximateValue: undefined },
      { level: 'small', description: 'Subtle high-frequency boost/cut', approximateValue: undefined },
      { level: 'moderate', description: 'Clear tonal change', approximateValue: undefined },
      { level: 'large', description: 'Dramatic spectral reshaping', approximateValue: undefined },
      { level: 'extreme', description: 'Maximum brightness shift', approximateValue: undefined },
    ],
    numericInputAvailable: false,
    numericRange: undefined,
  },

  // --- Energy ---
  {
    axisId: 'energy',
    axisLabel: 'Energy',
    hasUnit: false,
    unit: undefined,
    levelMappings: [
      { level: 'tiny', description: 'Subtle energy adjustment', approximateValue: undefined },
      { level: 'small', description: 'Noticeable energy change', approximateValue: undefined },
      { level: 'moderate', description: 'Clear energy shift', approximateValue: undefined },
      { level: 'large', description: 'Major energy transformation', approximateValue: undefined },
      { level: 'extreme', description: 'Complete energy overhaul', approximateValue: undefined },
    ],
    numericInputAvailable: false,
    numericRange: undefined,
  },

  // --- Tempo ---
  {
    axisId: 'tempo',
    axisLabel: 'Tempo',
    hasUnit: true,
    unit: 'BPM',
    levelMappings: [
      { level: 'tiny', description: '1-3 BPM change', approximateValue: 2 },
      { level: 'small', description: '3-8 BPM change', approximateValue: 5 },
      { level: 'moderate', description: '8-15 BPM change', approximateValue: 10 },
      { level: 'large', description: '15-30 BPM change', approximateValue: 20 },
      { level: 'extreme', description: '30+ BPM change', approximateValue: 40 },
    ],
    numericInputAvailable: true,
    numericRange: { min: 20, max: 300 },
  },

  // --- Transposition ---
  {
    axisId: 'transposition',
    axisLabel: 'Transposition',
    hasUnit: true,
    unit: 'semitones',
    levelMappings: [
      { level: 'tiny', description: '1 semitone', approximateValue: 1 },
      { level: 'small', description: '2-3 semitones', approximateValue: 2 },
      { level: 'moderate', description: '3-5 semitones', approximateValue: 4 },
      { level: 'large', description: '5-7 semitones (a fourth/fifth)', approximateValue: 7 },
      { level: 'extreme', description: '7-12 semitones (up to an octave)', approximateValue: 12 },
    ],
    numericInputAvailable: true,
    numericRange: { min: -24, max: 24 },
  },

  // --- Volume ---
  {
    axisId: 'volume',
    axisLabel: 'Volume',
    hasUnit: true,
    unit: 'dB',
    levelMappings: [
      { level: 'tiny', description: '0.5-1 dB', approximateValue: 0.5 },
      { level: 'small', description: '1-2 dB', approximateValue: 1.5 },
      { level: 'moderate', description: '2-4 dB', approximateValue: 3 },
      { level: 'large', description: '4-8 dB', approximateValue: 6 },
      { level: 'extreme', description: '8+ dB', approximateValue: 12 },
    ],
    numericInputAvailable: true,
    numericRange: { min: -60, max: 12 },
  },

  // --- Groove Tightness ---
  {
    axisId: 'groove_tightness',
    axisLabel: 'Groove Tightness',
    hasUnit: false,
    unit: undefined,
    levelMappings: [
      { level: 'tiny', description: 'Very subtle timing cleanup', approximateValue: undefined },
      { level: 'small', description: 'Light quantization', approximateValue: undefined },
      { level: 'moderate', description: 'Noticeable tightening', approximateValue: undefined },
      { level: 'large', description: 'Strong quantization', approximateValue: undefined },
      { level: 'extreme', description: 'Machine-perfect grid alignment', approximateValue: undefined },
    ],
    numericInputAvailable: false,
    numericRange: undefined,
  },

  // --- Width ---
  {
    axisId: 'width',
    axisLabel: 'Stereo Width',
    hasUnit: false,
    unit: undefined,
    levelMappings: [
      { level: 'tiny', description: 'Barely wider/narrower', approximateValue: undefined },
      { level: 'small', description: 'Subtle stereo change', approximateValue: undefined },
      { level: 'moderate', description: 'Noticeable width shift', approximateValue: undefined },
      { level: 'large', description: 'Dramatic stereo change', approximateValue: undefined },
      { level: 'extreme', description: 'Full mono ↔ full wide', approximateValue: undefined },
    ],
    numericInputAvailable: false,
    numericRange: undefined,
  },

  // --- Density ---
  {
    axisId: 'density',
    axisLabel: 'Arrangement Density',
    hasUnit: false,
    unit: undefined,
    levelMappings: [
      { level: 'tiny', description: 'Remove/add one minor element', approximateValue: undefined },
      { level: 'small', description: 'Adjust a couple of elements', approximateValue: undefined },
      { level: 'moderate', description: 'Add/remove a layer or two', approximateValue: undefined },
      { level: 'large', description: 'Significant arrangement change', approximateValue: undefined },
      { level: 'extreme', description: 'Major restructuring', approximateValue: undefined },
    ],
    numericInputAvailable: false,
    numericRange: undefined,
  },

  // --- Tension ---
  {
    axisId: 'tension',
    axisLabel: 'Tension',
    hasUnit: false,
    unit: undefined,
    levelMappings: [
      { level: 'tiny', description: 'Slight harmonic coloring', approximateValue: undefined },
      { level: 'small', description: 'Added tension device', approximateValue: undefined },
      { level: 'moderate', description: 'Clear tension increase', approximateValue: undefined },
      { level: 'large', description: 'Strong harmonic tension', approximateValue: undefined },
      { level: 'extreme', description: 'Maximum dissonance/suspension', approximateValue: undefined },
    ],
    numericInputAvailable: false,
    numericRange: undefined,
  },
];

/**
 * Get the axis degree mapping for a given axis ID.
 */
export function getAxisDegreeMapping(axisId: string): AxisDegreeMapping | undefined {
  return AXIS_DEGREE_MAPPINGS.find(m => m.axisId === axisId);
}


// =============================================================================
// UI Control Specifications
// =============================================================================

/**
 * Which UI control type to show for degree adjustment.
 */
export type DegreeControlType =
  | 'discrete_chips'    // 5 labeled buttons
  | 'slider'            // Continuous slider
  | 'numeric_input'     // Text input with units
  | 'combined';         // Chips + slider + optional numeric

/**
 * Specification for a degree control in the preview UI.
 */
export interface DegreeControlSpec {
  /** The axis this control adjusts. */
  readonly axisId: string;
  /** The control type to render. */
  readonly controlType: DegreeControlType;
  /** Current degree level (for initial rendering). */
  readonly currentLevel: DegreeLevel;
  /** Current numeric value (0-1 normalized). */
  readonly currentValue: number;
  /** Whether this is user-adjustable or display-only. */
  readonly adjustable: boolean;
  /** Available discrete levels (for chips control). */
  readonly discreteLevels: readonly DegreeLevel[];
  /** Slider configuration (for slider control). */
  readonly sliderConfig: SliderConfig | undefined;
  /** Numeric input configuration (for numeric control). */
  readonly numericConfig: NumericInputConfig | undefined;
}

/**
 * Configuration for a continuous slider.
 */
export interface SliderConfig {
  /** Minimum value (0.0). */
  readonly min: number;
  /** Maximum value (1.0). */
  readonly max: number;
  /** Step increment. */
  readonly step: number;
  /** Labels at endpoints. */
  readonly minLabel: string;
  readonly maxLabel: string;
  /** Whether to show tick marks at degree level boundaries. */
  readonly showDegreeMarks: boolean;
}

/**
 * Configuration for a numeric input field.
 */
export interface NumericInputConfig {
  /** Minimum allowed value. */
  readonly min: number;
  /** Maximum allowed value. */
  readonly max: number;
  /** Step increment. */
  readonly step: number;
  /** Unit label (e.g., "BPM", "dB", "semitones"). */
  readonly unitLabel: string;
  /** Whether to allow decimal values. */
  readonly allowDecimals: boolean;
}

/**
 * Default slider configuration.
 */
export const DEFAULT_SLIDER_CONFIG: SliderConfig = {
  min: 0.0,
  max: 1.0,
  step: 0.01,
  minLabel: 'None',
  maxLabel: 'Maximum',
  showDegreeMarks: true,
};

/**
 * Create a DegreeControlSpec for a given axis and current level.
 */
export function createDegreeControlSpec(
  axisId: string,
  currentLevel: DegreeLevel,
): DegreeControlSpec {
  const mapping = getAxisDegreeMapping(axisId);
  const hasNumeric = mapping?.numericInputAvailable ?? false;

  let numericConfig: NumericInputConfig | undefined;
  if (hasNumeric && mapping?.numericRange !== undefined) {
    numericConfig = {
      min: mapping.numericRange.min,
      max: mapping.numericRange.max,
      step: 1,
      unitLabel: mapping.unit ?? '',
      allowDecimals: mapping.unit === 'dB',
    };
  }

  return {
    axisId,
    controlType: hasNumeric ? 'combined' : 'combined',
    currentLevel,
    currentValue: degreeToNumeric(currentLevel),
    adjustable: true,
    discreteLevels: [...DEGREE_LEVELS],
    sliderConfig: DEFAULT_SLIDER_CONFIG,
    numericConfig,
  };
}


// =============================================================================
// Degree Display Helpers
// =============================================================================

/**
 * Format a degree level for user display.
 *
 * Examples:
 * - "moderate brightness increase"
 * - "large energy boost"
 * - "+3 semitones (moderate)"
 */
export function formatDegreeDisplay(
  level: DegreeLevel,
  axisId: string,
  direction: 'increase' | 'decrease' | 'set',
): string {
  const mapping = getAxisDegreeMapping(axisId);
  const axisLabel = mapping?.axisLabel ?? axisId;

  if (mapping?.hasUnit && mapping.unit !== undefined) {
    const levelMapping = mapping.levelMappings.find(m => m.level === level);
    if (levelMapping?.approximateValue !== undefined) {
      const sign = direction === 'decrease' ? '-' : '+';
      return `${sign}${levelMapping.approximateValue} ${mapping.unit} (${level})`;
    }
  }

  const directionWord = direction === 'increase' ? 'increase' :
    direction === 'decrease' ? 'decrease' : 'set';

  return `${level} ${axisLabel} ${directionWord}`;
}

/**
 * Get the safety implication of a degree level.
 *
 * Higher degrees are riskier and may trigger additional confirmation.
 */
export function getDegreeSafetyImplication(
  level: DegreeLevel,
): 'safe' | 'caution' | 'risky' {
  switch (level) {
    case 'tiny':
    case 'small':
      return 'safe';
    case 'moderate':
      return 'safe';
    case 'large':
      return 'caution';
    case 'extreme':
      return 'risky';
  }
}
