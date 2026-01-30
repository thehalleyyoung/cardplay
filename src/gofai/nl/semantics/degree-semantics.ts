/**
 * GOFAI NL Semantics — Degree Semantics
 *
 * Models the semantics of vague adjectives ("warmer", "darker", "brighter")
 * as axis changes with candidate interpretations. Degree semantics provides
 * the bridge between natural language scalar adjectives and the numeric
 * perceptual axis values that the DSP system operates on.
 *
 * ## Design Principles
 *
 * 1. **Vagueness is explicit**: "brighter" doesn't map to a specific Hz boost.
 *    Instead it maps to an axis (brightness) and a direction (increase) with
 *    an underspecified magnitude. The magnitude is resolved via user profiles,
 *    defaults, or clarification.
 *
 * 2. **Monotonic lever mappings**: each scalar adjective maps to one or more
 *    perceptual axes, and each axis maps monotonically to DSP levers. "More
 *    bright" always means "increase" on the brightness axis.
 *
 * 3. **Degree modifiers compose**: "much brighter" > "brighter" > "slightly
 *    brighter". Modifiers scale the intensity multiplicatively.
 *
 * 4. **Multiple candidate interpretations**: "darker" could mean (a) reduce
 *    brightness, (b) reduce high-frequency content, or (c) add saturation.
 *    All candidates are preserved; disambiguation happens downstream.
 *
 * ## Degree Types
 *
 * ```
 * Degree ::= Comparative   ("brighter", "more warm")
 *          | Superlative   ("brightest", "most warm")
 *          | Equative      ("as bright as")
 *          | Excessive     ("too bright")
 *          | Sufficient    ("bright enough")
 *          | Absolute      ("120 BPM", "3 dB")
 *          | Relative      ("a bit brighter", "much darker")
 * ```
 *
 * @module gofai/nl/semantics/degree-semantics
 * @see gofai_goalA.md Step 135
 */

// =============================================================================
// DEGREE TYPES — the formal model of scalar change
// =============================================================================

/**
 * A degree expression: a scalar change description.
 */
export interface DegreeExpression {
  /** The type of degree expression */
  readonly type: DegreeExpressionType;

  /** The axis (or candidate axes) this degree targets */
  readonly axisCandidates: readonly AxisCandidate[];

  /** The direction of change */
  readonly direction: ScalarDirection;

  /** The magnitude of the change */
  readonly magnitude: DegreeMagnitude;

  /** The comparison standard (if comparative/equative) */
  readonly standard: ComparisonStandard | null;

  /** The adjective that produced this degree */
  readonly adjective: AdjectiveSource;

  /** Provenance */
  readonly span: DegreeSpan;
}

export type DegreeExpressionType =
  | 'comparative'    // "brighter", "more warm"
  | 'superlative'    // "brightest", "most warm"
  | 'equative'       // "as bright as"
  | 'excessive'      // "too bright"
  | 'sufficient'     // "bright enough"
  | 'absolute'       // "120 BPM", "3 dB"
  | 'relative'       // "a bit brighter", "much darker"
  | 'positive';      // "bright" (base form, context-dependent)

/**
 * The direction of scalar change.
 */
export type ScalarDirection =
  | 'increase'     // More of the axis value
  | 'decrease'     // Less of the axis value
  | 'set'          // Set to a specific value
  | 'equalize'     // Make equal to a standard
  | 'maximize'     // Set to maximum
  | 'minimize';    // Set to minimum

/**
 * The magnitude of a degree change.
 */
export interface DegreeMagnitude {
  /** Intensity on a 0–1 scale */
  readonly intensity: number;

  /** Named level (human-readable) */
  readonly level: MagnitudeLevel;

  /** Whether the magnitude was explicitly specified or inferred */
  readonly explicit: boolean;

  /** If absolute: the numeric value */
  readonly absoluteValue: number | null;

  /** If absolute: the unit */
  readonly absoluteUnit: string | null;

  /** The modifier that produced this magnitude (if any) */
  readonly modifier: DegreeModifierInfo | null;
}

export type MagnitudeLevel =
  | 'imperceptible'  // ~0.05
  | 'tiny'           // ~0.15
  | 'small'          // ~0.25
  | 'moderate'       // ~0.5
  | 'large'          // ~0.7
  | 'very_large'     // ~0.85
  | 'extreme';       // ~1.0

/**
 * A degree modifier (e.g., "very", "slightly", "much").
 */
export interface DegreeModifierInfo {
  /** The modifier word */
  readonly word: string;

  /** Multiplicative factor (e.g., "very" = 1.5, "slightly" = 0.3) */
  readonly factor: number;

  /** Whether this is an intensifier (> 1) or attenuator (< 1) */
  readonly type: 'intensifier' | 'attenuator';
}

/**
 * The comparison standard (what we're comparing to).
 */
export interface ComparisonStandard {
  /** What we're comparing to */
  readonly type: StandardType;

  /** Reference value (if explicit) */
  readonly referenceValue: string | null;

  /** Whether the standard is implicit (context-dependent) */
  readonly implicit: boolean;
}

export type StandardType =
  | 'current_value'   // "brighter" = brighter than current value
  | 'explicit_value'  // "brighter than 5000 Hz"
  | 'other_entity'    // "brighter than the verse"
  | 'norm'            // "brighter than normal/default"
  | 'previous_state'; // "brighter than before"

/**
 * The adjective that produced a degree expression.
 */
export interface AdjectiveSource {
  /** The adjective lemma (base form) */
  readonly lemma: string;

  /** The surface form used ("brighter", "more warm", etc.) */
  readonly surfaceForm: string;

  /** The morphological form */
  readonly form: AdjectiveForm;

  /** Whether this adjective is gradable */
  readonly gradable: boolean;

  /** The antonym (if known) */
  readonly antonym: string | null;
}

export type AdjectiveForm =
  | 'positive'      // "bright"
  | 'comparative'   // "brighter"
  | 'superlative'   // "brightest"
  | 'nominalized';  // "brightness"

/**
 * Provenance span.
 */
export interface DegreeSpan {
  readonly start: number;
  readonly end: number;
}

// =============================================================================
// AXIS CANDIDATES — possible axis interpretations for an adjective
// =============================================================================

/**
 * An axis candidate: a possible axis interpretation for a vague adjective.
 */
export interface AxisCandidate {
  /** The axis name */
  readonly axisName: string;

  /** How likely this axis is the intended one (0–1) */
  readonly likelihood: number;

  /** The direction on this axis */
  readonly direction: 'increase' | 'decrease';

  /** Why this axis is a candidate */
  readonly reason: string;

  /** Whether this is the default interpretation */
  readonly isDefault: boolean;

  /** DSP levers that this axis maps to */
  readonly levers: readonly LeverMapping[];
}

/**
 * A mapping from an axis value to a DSP lever.
 */
export interface LeverMapping {
  /** The lever name (e.g., "eq_high_shelf_gain") */
  readonly leverName: string;

  /** The lever's parameter range [min, max] */
  readonly range: readonly [number, number];

  /** Monotonicity: does increasing the axis increase or decrease this lever? */
  readonly monotonicity: 'positive' | 'negative';

  /** Weight in the overall axis mapping (when multiple levers) */
  readonly weight: number;
}

// =============================================================================
// ADJECTIVE–AXIS DATABASE — mapping adjectives to axes
// =============================================================================

/**
 * An adjective–axis mapping entry.
 */
export interface AdjectiveAxisEntry {
  /** The adjective lemma */
  readonly lemma: string;

  /** All surface forms (positive, comparative, superlative) */
  readonly forms: readonly string[];

  /** The primary axis */
  readonly primaryAxis: string;

  /** Whether this adjective increases or decreases the primary axis */
  readonly primaryDirection: 'increase' | 'decrease';

  /** Default intensity for this adjective (base form) */
  readonly defaultIntensity: number;

  /** The antonym */
  readonly antonym: string | null;

  /** All axis candidates (including secondary interpretations) */
  readonly candidates: readonly AxisCandidate[];
}

/**
 * The adjective–axis database.
 * Maps adjective lemmas to axis candidates.
 */
export const ADJECTIVE_AXIS_DATABASE: ReadonlyMap<string, AdjectiveAxisEntry> = new Map([
  // ── Brightness / Tone ──────────────────────────────────────────────
  ['bright', {
    lemma: 'bright',
    forms: ['bright', 'brighter', 'brightest', 'brightness'],
    primaryAxis: 'brightness',
    primaryDirection: 'increase',
    defaultIntensity: 0.5,
    antonym: 'dark',
    candidates: [
      { axisName: 'brightness', likelihood: 0.7, direction: 'increase', reason: 'Primary: spectral brightness (high-frequency content)', isDefault: true, levers: [{ leverName: 'eq_high_shelf_gain', range: [-12, 12], monotonicity: 'positive', weight: 0.6 }, { leverName: 'eq_presence_gain', range: [-6, 6], monotonicity: 'positive', weight: 0.4 }] },
      { axisName: 'clarity', likelihood: 0.2, direction: 'increase', reason: 'Secondary: tonal clarity', isDefault: false, levers: [] },
      { axisName: 'energy', likelihood: 0.1, direction: 'increase', reason: 'Tertiary: perceived energy', isDefault: false, levers: [] },
    ],
  }],
  ['dark', {
    lemma: 'dark',
    forms: ['dark', 'darker', 'darkest', 'darkness'],
    primaryAxis: 'brightness',
    primaryDirection: 'decrease',
    defaultIntensity: 0.5,
    antonym: 'bright',
    candidates: [
      { axisName: 'brightness', likelihood: 0.6, direction: 'decrease', reason: 'Primary: reduce high-frequency content', isDefault: true, levers: [{ leverName: 'eq_high_shelf_gain', range: [-12, 12], monotonicity: 'negative', weight: 0.5 }, { leverName: 'eq_low_shelf_gain', range: [-6, 6], monotonicity: 'positive', weight: 0.3 }] },
      { axisName: 'warmth', likelihood: 0.25, direction: 'increase', reason: 'Secondary: add warmth/analog character', isDefault: false, levers: [] },
      { axisName: 'saturation', likelihood: 0.15, direction: 'increase', reason: 'Tertiary: add harmonic saturation', isDefault: false, levers: [] },
    ],
  }],

  // ── Warmth ─────────────────────────────────────────────────────────
  ['warm', {
    lemma: 'warm',
    forms: ['warm', 'warmer', 'warmest', 'warmth'],
    primaryAxis: 'warmth',
    primaryDirection: 'increase',
    defaultIntensity: 0.5,
    antonym: 'cold',
    candidates: [
      { axisName: 'warmth', likelihood: 0.7, direction: 'increase', reason: 'Primary: analog warmth (mid-low frequency emphasis)', isDefault: true, levers: [{ leverName: 'eq_low_mid_gain', range: [-6, 6], monotonicity: 'positive', weight: 0.4 }, { leverName: 'saturation_amount', range: [0, 100], monotonicity: 'positive', weight: 0.4 }, { leverName: 'eq_high_shelf_gain', range: [-12, 12], monotonicity: 'negative', weight: 0.2 }] },
      { axisName: 'brightness', likelihood: 0.2, direction: 'decrease', reason: 'Secondary: reduce harshness', isDefault: false, levers: [] },
      { axisName: 'saturation', likelihood: 0.1, direction: 'increase', reason: 'Tertiary: harmonic richness', isDefault: false, levers: [] },
    ],
  }],
  ['cold', {
    lemma: 'cold',
    forms: ['cold', 'colder', 'coldest'],
    primaryAxis: 'warmth',
    primaryDirection: 'decrease',
    defaultIntensity: 0.5,
    antonym: 'warm',
    candidates: [
      { axisName: 'warmth', likelihood: 0.7, direction: 'decrease', reason: 'Primary: reduce warmth', isDefault: true, levers: [] },
      { axisName: 'brightness', likelihood: 0.2, direction: 'increase', reason: 'Secondary: increase clinical brightness', isDefault: false, levers: [] },
      { axisName: 'intimacy', likelihood: 0.1, direction: 'decrease', reason: 'Tertiary: increase distance', isDefault: false, levers: [] },
    ],
  }],

  // ── Loudness ───────────────────────────────────────────────────────
  ['loud', {
    lemma: 'loud',
    forms: ['loud', 'louder', 'loudest', 'loudness'],
    primaryAxis: 'loudness',
    primaryDirection: 'increase',
    defaultIntensity: 0.5,
    antonym: 'quiet',
    candidates: [
      { axisName: 'loudness', likelihood: 0.85, direction: 'increase', reason: 'Primary: increase volume/gain', isDefault: true, levers: [{ leverName: 'gain', range: [-60, 12], monotonicity: 'positive', weight: 0.7 }, { leverName: 'compressor_makeup_gain', range: [0, 24], monotonicity: 'positive', weight: 0.3 }] },
      { axisName: 'energy', likelihood: 0.15, direction: 'increase', reason: 'Secondary: increase perceived energy', isDefault: false, levers: [] },
    ],
  }],
  ['quiet', {
    lemma: 'quiet',
    forms: ['quiet', 'quieter', 'quietest'],
    primaryAxis: 'loudness',
    primaryDirection: 'decrease',
    defaultIntensity: 0.5,
    antonym: 'loud',
    candidates: [
      { axisName: 'loudness', likelihood: 0.85, direction: 'decrease', reason: 'Primary: decrease volume', isDefault: true, levers: [{ leverName: 'gain', range: [-60, 12], monotonicity: 'negative', weight: 1.0 }] },
      { axisName: 'intimacy', likelihood: 0.15, direction: 'increase', reason: 'Secondary: more intimate feel', isDefault: false, levers: [] },
    ],
  }],

  // ── Width / Space ──────────────────────────────────────────────────
  ['wide', {
    lemma: 'wide',
    forms: ['wide', 'wider', 'widest', 'width'],
    primaryAxis: 'width',
    primaryDirection: 'increase',
    defaultIntensity: 0.5,
    antonym: 'narrow',
    candidates: [
      { axisName: 'width', likelihood: 0.8, direction: 'increase', reason: 'Primary: stereo width', isDefault: true, levers: [{ leverName: 'stereo_width', range: [0, 200], monotonicity: 'positive', weight: 0.7 }, { leverName: 'pan_spread', range: [0, 100], monotonicity: 'positive', weight: 0.3 }] },
      { axisName: 'depth', likelihood: 0.2, direction: 'increase', reason: 'Secondary: spatial depth', isDefault: false, levers: [] },
    ],
  }],
  ['narrow', {
    lemma: 'narrow',
    forms: ['narrow', 'narrower', 'narrowest'],
    primaryAxis: 'width',
    primaryDirection: 'decrease',
    defaultIntensity: 0.5,
    antonym: 'wide',
    candidates: [
      { axisName: 'width', likelihood: 0.85, direction: 'decrease', reason: 'Primary: reduce stereo width', isDefault: true, levers: [{ leverName: 'stereo_width', range: [0, 200], monotonicity: 'negative', weight: 1.0 }] },
      { axisName: 'intimacy', likelihood: 0.15, direction: 'increase', reason: 'Secondary: more focused/intimate', isDefault: false, levers: [] },
    ],
  }],

  // ── Density / Fullness ─────────────────────────────────────────────
  ['busy', {
    lemma: 'busy',
    forms: ['busy', 'busier', 'busiest'],
    primaryAxis: 'density',
    primaryDirection: 'increase',
    defaultIntensity: 0.6,
    antonym: 'sparse',
    candidates: [
      { axisName: 'density', likelihood: 0.8, direction: 'increase', reason: 'Primary: arrangement density', isDefault: true, levers: [] },
      { axisName: 'complexity', likelihood: 0.2, direction: 'increase', reason: 'Secondary: rhythmic/melodic complexity', isDefault: false, levers: [] },
    ],
  }],
  ['sparse', {
    lemma: 'sparse',
    forms: ['sparse', 'sparser', 'sparsest'],
    primaryAxis: 'density',
    primaryDirection: 'decrease',
    defaultIntensity: 0.5,
    antonym: 'busy',
    candidates: [
      { axisName: 'density', likelihood: 0.85, direction: 'decrease', reason: 'Primary: reduce arrangement density', isDefault: true, levers: [] },
      { axisName: 'complexity', likelihood: 0.15, direction: 'decrease', reason: 'Secondary: simplify', isDefault: false, levers: [] },
    ],
  }],

  // ── Energy ─────────────────────────────────────────────────────────
  ['energetic', {
    lemma: 'energetic',
    forms: ['energetic'],
    primaryAxis: 'energy',
    primaryDirection: 'increase',
    defaultIntensity: 0.6,
    antonym: 'calm',
    candidates: [
      { axisName: 'energy', likelihood: 0.7, direction: 'increase', reason: 'Primary: overall energy', isDefault: true, levers: [] },
      { axisName: 'loudness', likelihood: 0.15, direction: 'increase', reason: 'Secondary: loudness contributes to energy', isDefault: false, levers: [] },
      { axisName: 'density', likelihood: 0.15, direction: 'increase', reason: 'Tertiary: busier arrangements feel more energetic', isDefault: false, levers: [] },
    ],
  }],
  ['calm', {
    lemma: 'calm',
    forms: ['calm', 'calmer', 'calmest'],
    primaryAxis: 'energy',
    primaryDirection: 'decrease',
    defaultIntensity: 0.5,
    antonym: 'energetic',
    candidates: [
      { axisName: 'energy', likelihood: 0.7, direction: 'decrease', reason: 'Primary: reduce energy', isDefault: true, levers: [] },
      { axisName: 'density', likelihood: 0.15, direction: 'decrease', reason: 'Secondary: reduce density', isDefault: false, levers: [] },
      { axisName: 'loudness', likelihood: 0.15, direction: 'decrease', reason: 'Tertiary: reduce loudness', isDefault: false, levers: [] },
    ],
  }],

  // ── Tension ────────────────────────────────────────────────────────
  ['tense', {
    lemma: 'tense',
    forms: ['tense', 'tenser', 'tensest', 'tension'],
    primaryAxis: 'tension',
    primaryDirection: 'increase',
    defaultIntensity: 0.6,
    antonym: 'relaxed',
    candidates: [
      { axisName: 'tension', likelihood: 0.85, direction: 'increase', reason: 'Primary: harmonic/melodic tension', isDefault: true, levers: [] },
      { axisName: 'energy', likelihood: 0.15, direction: 'increase', reason: 'Secondary: energy contributes to tension', isDefault: false, levers: [] },
    ],
  }],
  ['relaxed', {
    lemma: 'relaxed',
    forms: ['relaxed'],
    primaryAxis: 'tension',
    primaryDirection: 'decrease',
    defaultIntensity: 0.5,
    antonym: 'tense',
    candidates: [
      { axisName: 'tension', likelihood: 0.8, direction: 'decrease', reason: 'Primary: reduce tension', isDefault: true, levers: [] },
      { axisName: 'groove_tightness', likelihood: 0.2, direction: 'decrease', reason: 'Secondary: looser groove', isDefault: false, levers: [] },
    ],
  }],

  // ── Punch / Impact ─────────────────────────────────────────────────
  ['punchy', {
    lemma: 'punchy',
    forms: ['punchy', 'punchier', 'punchiest'],
    primaryAxis: 'punch',
    primaryDirection: 'increase',
    defaultIntensity: 0.6,
    antonym: 'soft',
    candidates: [
      { axisName: 'punch', likelihood: 0.7, direction: 'increase', reason: 'Primary: transient impact', isDefault: true, levers: [{ leverName: 'compressor_attack', range: [0.1, 200], monotonicity: 'negative', weight: 0.4 }, { leverName: 'transient_shaper_attack', range: [-100, 100], monotonicity: 'positive', weight: 0.6 }] },
      { axisName: 'attack', likelihood: 0.2, direction: 'increase', reason: 'Secondary: faster attack', isDefault: false, levers: [] },
      { axisName: 'loudness', likelihood: 0.1, direction: 'increase', reason: 'Tertiary: perceived loudness', isDefault: false, levers: [] },
    ],
  }],
  ['soft', {
    lemma: 'soft',
    forms: ['soft', 'softer', 'softest', 'softness'],
    primaryAxis: 'punch',
    primaryDirection: 'decrease',
    defaultIntensity: 0.5,
    antonym: 'punchy',
    candidates: [
      { axisName: 'punch', likelihood: 0.4, direction: 'decrease', reason: 'Primary: reduce transient impact', isDefault: true, levers: [] },
      { axisName: 'attack', likelihood: 0.3, direction: 'decrease', reason: 'Secondary: slower attack', isDefault: false, levers: [] },
      { axisName: 'loudness', likelihood: 0.2, direction: 'decrease', reason: 'Tertiary: reduce loudness', isDefault: false, levers: [] },
      { axisName: 'brightness', likelihood: 0.1, direction: 'decrease', reason: 'Quaternary: reduce brightness', isDefault: false, levers: [] },
    ],
  }],

  // ── Tight / Groove ─────────────────────────────────────────────────
  ['tight', {
    lemma: 'tight',
    forms: ['tight', 'tighter', 'tightest', 'tightness'],
    primaryAxis: 'groove_tightness',
    primaryDirection: 'increase',
    defaultIntensity: 0.5,
    antonym: 'loose',
    candidates: [
      { axisName: 'groove_tightness', likelihood: 0.8, direction: 'increase', reason: 'Primary: rhythmic precision', isDefault: true, levers: [{ leverName: 'quantize_strength', range: [0, 100], monotonicity: 'positive', weight: 0.6 }, { leverName: 'swing_amount', range: [0, 100], monotonicity: 'negative', weight: 0.4 }] },
      { axisName: 'punch', likelihood: 0.2, direction: 'increase', reason: 'Secondary: tighter = punchier', isDefault: false, levers: [] },
    ],
  }],
  ['loose', {
    lemma: 'loose',
    forms: ['loose', 'looser', 'loosest'],
    primaryAxis: 'groove_tightness',
    primaryDirection: 'decrease',
    defaultIntensity: 0.5,
    antonym: 'tight',
    candidates: [
      { axisName: 'groove_tightness', likelihood: 0.8, direction: 'decrease', reason: 'Primary: reduce quantization/tightness', isDefault: true, levers: [{ leverName: 'quantize_strength', range: [0, 100], monotonicity: 'negative', weight: 0.5 }, { leverName: 'swing_amount', range: [0, 100], monotonicity: 'positive', weight: 0.5 }] },
      { axisName: 'attack', likelihood: 0.2, direction: 'decrease', reason: 'Secondary: softer transients', isDefault: false, levers: [] },
    ],
  }],

  // ── Clarity ────────────────────────────────────────────────────────
  ['clear', {
    lemma: 'clear',
    forms: ['clear', 'clearer', 'clearest', 'clarity'],
    primaryAxis: 'clarity',
    primaryDirection: 'increase',
    defaultIntensity: 0.5,
    antonym: 'muddy',
    candidates: [
      { axisName: 'clarity', likelihood: 0.7, direction: 'increase', reason: 'Primary: spectral separation/intelligibility', isDefault: true, levers: [{ leverName: 'eq_low_cut', range: [20, 300], monotonicity: 'positive', weight: 0.3 }, { leverName: 'eq_presence_gain', range: [-6, 6], monotonicity: 'positive', weight: 0.4 }, { leverName: 'compressor_ratio', range: [1, 20], monotonicity: 'positive', weight: 0.3 }] },
      { axisName: 'brightness', likelihood: 0.2, direction: 'increase', reason: 'Secondary: brightness aids clarity', isDefault: false, levers: [] },
      { axisName: 'width', likelihood: 0.1, direction: 'increase', reason: 'Tertiary: wider stereo improves separation', isDefault: false, levers: [] },
    ],
  }],
  ['muddy', {
    lemma: 'muddy',
    forms: ['muddy', 'muddier', 'muddiest'],
    primaryAxis: 'clarity',
    primaryDirection: 'decrease',
    defaultIntensity: 0.5,
    antonym: 'clear',
    candidates: [
      { axisName: 'clarity', likelihood: 0.8, direction: 'decrease', reason: 'Primary: reduced clarity (too much low-mid energy)', isDefault: true, levers: [] },
      { axisName: 'warmth', likelihood: 0.2, direction: 'increase', reason: 'Secondary: excessive warmth causes muddiness', isDefault: false, levers: [] },
    ],
  }],

  // ── Depth / Space ──────────────────────────────────────────────────
  ['deep', {
    lemma: 'deep',
    forms: ['deep', 'deeper', 'deepest', 'depth'],
    primaryAxis: 'depth',
    primaryDirection: 'increase',
    defaultIntensity: 0.5,
    antonym: 'shallow',
    candidates: [
      { axisName: 'depth', likelihood: 0.6, direction: 'increase', reason: 'Primary: spatial depth (reverb/delay)', isDefault: true, levers: [{ leverName: 'reverb_size', range: [0, 100], monotonicity: 'positive', weight: 0.5 }, { leverName: 'reverb_mix', range: [0, 100], monotonicity: 'positive', weight: 0.5 }] },
      { axisName: 'register', likelihood: 0.25, direction: 'decrease', reason: 'Secondary: low register (deep bass)', isDefault: false, levers: [] },
      { axisName: 'warmth', likelihood: 0.15, direction: 'increase', reason: 'Tertiary: deep = warm low end', isDefault: false, levers: [] },
    ],
  }],

  // ── Sustain ────────────────────────────────────────────────────────
  ['sustained', {
    lemma: 'sustained',
    forms: ['sustained', 'long', 'longer', 'longest'],
    primaryAxis: 'sustain',
    primaryDirection: 'increase',
    defaultIntensity: 0.5,
    antonym: 'short',
    candidates: [
      { axisName: 'sustain', likelihood: 0.8, direction: 'increase', reason: 'Primary: longer note/sound duration', isDefault: true, levers: [{ leverName: 'adsr_release', range: [0, 5000], monotonicity: 'positive', weight: 0.5 }, { leverName: 'reverb_decay', range: [0, 10], monotonicity: 'positive', weight: 0.5 }] },
      { axisName: 'depth', likelihood: 0.2, direction: 'increase', reason: 'Secondary: longer reverb tails add depth', isDefault: false, levers: [] },
    ],
  }],
  ['short', {
    lemma: 'short',
    forms: ['short', 'shorter', 'shortest'],
    primaryAxis: 'sustain',
    primaryDirection: 'decrease',
    defaultIntensity: 0.5,
    antonym: 'sustained',
    candidates: [
      { axisName: 'sustain', likelihood: 0.7, direction: 'decrease', reason: 'Primary: shorter note/sound duration', isDefault: true, levers: [{ leverName: 'adsr_release', range: [0, 5000], monotonicity: 'negative', weight: 0.5 }, { leverName: 'gate_threshold', range: [-60, 0], monotonicity: 'positive', weight: 0.5 }] },
      { axisName: 'punch', likelihood: 0.3, direction: 'increase', reason: 'Secondary: shorter = punchier', isDefault: false, levers: [] },
    ],
  }],
]);

// =============================================================================
// DEGREE MODIFIER DATABASE
// =============================================================================

/**
 * Degree modifier entry.
 */
export interface DegreeModifierEntry {
  /** The modifier word */
  readonly word: string;

  /** All surface forms */
  readonly forms: readonly string[];

  /** Multiplicative factor */
  readonly factor: number;

  /** Whether this intensifies or attenuates */
  readonly type: 'intensifier' | 'attenuator';

  /** Corresponding magnitude level shift */
  readonly levelShift: number;
}

/**
 * Built-in degree modifiers.
 */
export const DEGREE_MODIFIER_DATABASE: ReadonlyMap<string, DegreeModifierEntry> = new Map([
  // Intensifiers
  ['very', { word: 'very', forms: ['very'], factor: 1.5, type: 'intensifier', levelShift: 2 }],
  ['really', { word: 'really', forms: ['really'], factor: 1.4, type: 'intensifier', levelShift: 2 }],
  ['much', { word: 'much', forms: ['much'], factor: 1.6, type: 'intensifier', levelShift: 2 }],
  ['way', { word: 'way', forms: ['way'], factor: 1.7, type: 'intensifier', levelShift: 3 }],
  ['far', { word: 'far', forms: ['far'], factor: 1.5, type: 'intensifier', levelShift: 2 }],
  ['significantly', { word: 'significantly', forms: ['significantly'], factor: 1.5, type: 'intensifier', levelShift: 2 }],
  ['considerably', { word: 'considerably', forms: ['considerably'], factor: 1.4, type: 'intensifier', levelShift: 2 }],
  ['noticeably', { word: 'noticeably', forms: ['noticeably'], factor: 1.3, type: 'intensifier', levelShift: 1 }],
  ['extremely', { word: 'extremely', forms: ['extremely'], factor: 2.0, type: 'intensifier', levelShift: 3 }],
  ['super', { word: 'super', forms: ['super'], factor: 1.8, type: 'intensifier', levelShift: 3 }],
  ['ridiculously', { word: 'ridiculously', forms: ['ridiculously'], factor: 2.5, type: 'intensifier', levelShift: 4 }],

  // Attenuators
  ['slightly', { word: 'slightly', forms: ['slightly'], factor: 0.3, type: 'attenuator', levelShift: -2 }],
  ['a bit', { word: 'a bit', forms: ['a bit'], factor: 0.35, type: 'attenuator', levelShift: -2 }],
  ['a little', { word: 'a little', forms: ['a little'], factor: 0.3, type: 'attenuator', levelShift: -2 }],
  ['somewhat', { word: 'somewhat', forms: ['somewhat'], factor: 0.5, type: 'attenuator', levelShift: -1 }],
  ['marginally', { word: 'marginally', forms: ['marginally'], factor: 0.2, type: 'attenuator', levelShift: -3 }],
  ['subtly', { word: 'subtly', forms: ['subtly'], factor: 0.25, type: 'attenuator', levelShift: -2 }],
  ['barely', { word: 'barely', forms: ['barely'], factor: 0.1, type: 'attenuator', levelShift: -4 }],
  ['just a touch', { word: 'just a touch', forms: ['just a touch'], factor: 0.15, type: 'attenuator', levelShift: -3 }],
]);

// =============================================================================
// DEGREE CONSTRUCTION — building degree expressions
// =============================================================================

/**
 * Build a degree expression from an adjective and optional modifier.
 */
export function buildDegreeExpression(
  adjective: string,
  form: AdjectiveForm,
  modifier: string | null = null,
  absoluteValue: number | null = null,
  absoluteUnit: string | null = null,
  span: DegreeSpan = { start: 0, end: 0 },
): DegreeExpression | null {
  // Look up the adjective
  const normalizedAdj = adjective.toLowerCase();
  let entry: AdjectiveAxisEntry | undefined;

  for (const [, e] of ADJECTIVE_AXIS_DATABASE) {
    if (e.forms.some(f => f.toLowerCase() === normalizedAdj) || e.lemma === normalizedAdj) {
      entry = e;
      break;
    }
  }

  if (!entry) return null;

  // Determine expression type
  let type: DegreeExpressionType;
  if (absoluteValue !== null) {
    type = 'absolute';
  } else if (form === 'comparative') {
    type = modifier ? 'relative' : 'comparative';
  } else if (form === 'superlative') {
    type = 'superlative';
  } else {
    type = modifier ? 'relative' : 'positive';
  }

  // Compute magnitude
  let intensity = entry.defaultIntensity;
  let modifierInfo: DegreeModifierInfo | null = null;

  if (modifier) {
    const modEntry = DEGREE_MODIFIER_DATABASE.get(modifier.toLowerCase());
    if (modEntry) {
      intensity = Math.min(1, Math.max(0, intensity * modEntry.factor));
      modifierInfo = {
        word: modEntry.word,
        factor: modEntry.factor,
        type: modEntry.type,
      };
    }
  }

  // Comparative form adds a base bump
  if (form === 'comparative') {
    intensity = Math.min(1, intensity * 1.2);
  } else if (form === 'superlative') {
    intensity = 1.0;
  }

  const level = intensityToLevel(intensity);
  const direction = computeDirection(form, entry.primaryDirection);

  const magnitude: DegreeMagnitude = {
    intensity,
    level,
    explicit: absoluteValue !== null || modifier !== null,
    absoluteValue,
    absoluteUnit,
    modifier: modifierInfo,
  };

  const standard: ComparisonStandard | null =
    type === 'comparative' || type === 'relative'
      ? { type: 'current_value', referenceValue: null, implicit: true }
      : type === 'superlative'
        ? { type: 'norm', referenceValue: null, implicit: true }
        : null;

  return {
    type,
    axisCandidates: [...entry.candidates],
    direction,
    magnitude,
    standard,
    adjective: {
      lemma: entry.lemma,
      surfaceForm: adjective,
      form,
      gradable: true,
      antonym: entry.antonym,
    },
    span,
  };
}

/**
 * Map an intensity value to a named level.
 */
function intensityToLevel(intensity: number): MagnitudeLevel {
  if (intensity <= 0.05) return 'imperceptible';
  if (intensity <= 0.2) return 'tiny';
  if (intensity <= 0.35) return 'small';
  if (intensity <= 0.6) return 'moderate';
  if (intensity <= 0.8) return 'large';
  if (intensity <= 0.95) return 'very_large';
  return 'extreme';
}

/**
 * Compute the scalar direction from form and axis direction.
 */
function computeDirection(
  form: AdjectiveForm,
  axisDirection: 'increase' | 'decrease',
): ScalarDirection {
  switch (form) {
    case 'superlative':
      return axisDirection === 'increase' ? 'maximize' : 'minimize';
    default:
      return axisDirection;
  }
}

// =============================================================================
// DEGREE COMPOSITION — combining degree expressions
// =============================================================================

/**
 * Apply a degree modifier to an existing degree expression.
 */
export function applyModifier(
  degree: DegreeExpression,
  modifier: string,
): DegreeExpression {
  const modEntry = DEGREE_MODIFIER_DATABASE.get(modifier.toLowerCase());
  if (!modEntry) return degree;

  const newIntensity = Math.min(1, Math.max(0, degree.magnitude.intensity * modEntry.factor));

  return {
    ...degree,
    type: 'relative',
    magnitude: {
      ...degree.magnitude,
      intensity: newIntensity,
      level: intensityToLevel(newIntensity),
      explicit: true,
      modifier: {
        word: modEntry.word,
        factor: modEntry.factor,
        type: modEntry.type,
      },
    },
  };
}

/**
 * Negate a degree expression ("not brighter" = "same or darker").
 */
export function negateDegree(degree: DegreeExpression): DegreeExpression {
  const oppositeDirection: ScalarDirection =
    degree.direction === 'increase' ? 'decrease'
    : degree.direction === 'decrease' ? 'increase'
    : degree.direction;

  // Use the antonym's candidates if available
  const antonym = degree.adjective.antonym;
  let candidates = degree.axisCandidates;

  if (antonym) {
    const antonymEntry = ADJECTIVE_AXIS_DATABASE.get(antonym);
    if (antonymEntry) {
      candidates = antonymEntry.candidates;
    }
  }

  return {
    ...degree,
    direction: oppositeDirection,
    axisCandidates: candidates,
    adjective: {
      ...degree.adjective,
      lemma: antonym ?? `not_${degree.adjective.lemma}`,
    },
  };
}

// =============================================================================
// DEGREE LOOKUP — finding axes from adjective forms
// =============================================================================

/**
 * Look up axis candidates for any form of a scalar adjective.
 */
export function lookupAdjectiveAxes(word: string): readonly AxisCandidate[] | null {
  const lower = word.toLowerCase();

  for (const [, entry] of ADJECTIVE_AXIS_DATABASE) {
    if (entry.forms.some(f => f.toLowerCase() === lower) || entry.lemma === lower) {
      return entry.candidates;
    }
  }

  return null;
}

/**
 * Look up the primary axis for an adjective.
 */
export function lookupPrimaryAxis(word: string): { axis: string; direction: 'increase' | 'decrease' } | null {
  const lower = word.toLowerCase();

  for (const [, entry] of ADJECTIVE_AXIS_DATABASE) {
    if (entry.forms.some(f => f.toLowerCase() === lower) || entry.lemma === lower) {
      return { axis: entry.primaryAxis, direction: entry.primaryDirection };
    }
  }

  return null;
}

/**
 * Check if a word is a known scalar adjective.
 */
export function isScalarAdjective(word: string): boolean {
  return lookupAdjectiveAxes(word) !== null;
}

/**
 * Check if a word is a degree modifier.
 */
export function isDegreeModifier(word: string): boolean {
  return DEGREE_MODIFIER_DATABASE.has(word.toLowerCase());
}

// =============================================================================
// DIAGNOSTICS — human-readable degree reports
// =============================================================================

/**
 * Format a degree expression as a diagnostic string.
 */
export function formatDegreeExpression(degree: DegreeExpression): string {
  const lines: string[] = [];

  lines.push(`Degree: ${degree.adjective.surfaceForm} (${degree.type})`);
  lines.push(`  Direction: ${degree.direction}`);
  lines.push(`  Magnitude: ${degree.magnitude.level} (${(degree.magnitude.intensity * 100).toFixed(0)}%)`);

  if (degree.magnitude.absoluteValue !== null) {
    lines.push(`  Value: ${degree.magnitude.absoluteValue}${degree.magnitude.absoluteUnit ?? ''}`);
  }

  if (degree.magnitude.modifier) {
    lines.push(`  Modifier: "${degree.magnitude.modifier.word}" (×${degree.magnitude.modifier.factor})`);
  }

  lines.push(`  Axis candidates:`);
  for (const c of degree.axisCandidates) {
    lines.push(`    ${c.axisName}: ${c.direction} (${(c.likelihood * 100).toFixed(0)}%)${c.isDefault ? ' [DEFAULT]' : ''}`);
  }

  return lines.join('\n');
}

// =============================================================================
// STATISTICS
// =============================================================================

/**
 * Get statistics about the degree semantics module.
 */
export function getDegreeSemanticStats(): {
  adjectives: number;
  totalAxisMappings: number;
  modifiers: number;
  magnitudeLevels: number;
  leverMappings: number;
} {
  let totalAxisMappings = 0;
  let leverMappings = 0;
  for (const [, entry] of ADJECTIVE_AXIS_DATABASE) {
    totalAxisMappings += entry.candidates.length;
    for (const c of entry.candidates) {
      leverMappings += c.levers.length;
    }
  }

  return {
    adjectives: ADJECTIVE_AXIS_DATABASE.size,
    totalAxisMappings,
    modifiers: DEGREE_MODIFIER_DATABASE.size,
    magnitudeLevels: 7,
    leverMappings,
  };
}

// =============================================================================
// RESET — for testing
// =============================================================================

/**
 * Reset module state (for testing).
 */
export function resetDegreeSemantics(): void {
  // Currently stateless — placeholder for future mutable state
}
