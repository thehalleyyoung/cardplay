/**
 * @fileoverview Theory Card Definitions (C091–C099, C100)
 *
 * Defines the UI-level card metadata for all Branch C theory cards.
 * Each card:
 * 1. Declares its parameters and their types
 * 2. Provides a method to extract MusicConstraints from current state
 * 3. Registers itself with the constraintMappers registry
 *
 * Theory cards are "constraint-contributing cards" — they do not generate
 * audio directly, but shape the MusicSpec that constrains generators,
 * analyzers, and recommendation engines.
 *
 * @module @cardplay/ai/theory/theory-cards
 */

import type {
  MusicConstraint,
  MusicSpec,
  // RootName,
  // ModeName,
  TonalityModel,
  StyleTag,
  CultureTag,
  GalantSchemaName,
  RagaName,
  TalaName,
  JatiType,
  CelticTuneType,
  ChineseModeName,
  FilmMood,
  FilmDevice,
  AccentModel,
  CadenceType,
  // DensityLevel,
  // PatternRole,
  // ArrangerStyle,
  // Explainable,
} from './music-spec';

import { withConstraints, withoutConstraintType } from './music-spec';

// ============================================================================
// THEORY CARD PROTOCOL
// ============================================================================

/**
 * State of a single theory card parameter.
 */
export interface TheoryCardParamState<T = unknown> {
  /** Current value */
  readonly value: T;
  /** Whether the user has explicitly set this (vs default/recommended) */
  readonly userSet: boolean;
  /** Whether this param is currently contributing constraints */
  readonly active: boolean;
}

/**
 * A theory card's complete parameter state.
 */
export type TheoryCardState = Readonly<Record<string, TheoryCardParamState>>;

/**
 * Metadata describing a theory card parameter.
 */
export interface TheoryCardParamDef {
  readonly id: string;
  readonly label: string;
  readonly type: 'enum' | 'range' | 'number' | 'boolean' | 'compound';
  readonly enumValues?: readonly string[];
  readonly range?: { readonly min: number; readonly max: number; readonly step?: number };
  readonly defaultValue: unknown;
  /** The constraint type this param produces */
  readonly constraintType: MusicConstraint['type'];
  /** Hard or soft constraint */
  readonly hard: boolean;
  /** Default weight (soft constraints) */
  readonly weight: number;
  /** Tooltip / description */
  readonly description: string;
}

/**
 * Metadata describing a theory card.
 */
export interface TheoryCardDef {
  /** Unique card type ID (e.g., 'theory:tonality_model') */
  readonly cardId: string;
  /** Display name */
  readonly displayName: string;
  /** Short description */
  readonly description: string;
  /** Category for grouping */
  readonly category: 'theory' | 'analysis' | 'generation' | 'world' | 'style';
  /** Culture affinity (which CultureTags this card is most relevant for) */
  readonly cultures: readonly CultureTag[];
  /** Parameters */
  readonly params: readonly TheoryCardParamDef[];
  /** Extract constraints from current state */
  readonly extractConstraints: (state: TheoryCardState) => MusicConstraint[];
  /** Apply constraints to a MusicSpec */
  readonly applyToSpec: (state: TheoryCardState, spec: MusicSpec) => MusicSpec;
}

// ============================================================================
// CONSTRAINT EXTRACTION HELPERS
// ============================================================================

function getParam<T>(state: TheoryCardState, paramId: string): T | undefined {
  const param = state[paramId];
  if (!param || !param.active) return undefined;
  return param.value as T;
}

function activeParam(value: unknown, userSet = false): TheoryCardParamState {
  return { value, userSet, active: true };
}

/**
 * Create default state from a card definition.
 */
export function defaultCardState(def: TheoryCardDef): TheoryCardState {
  const state: Record<string, TheoryCardParamState> = {};
  for (const param of def.params) {
    state[param.id] = activeParam(param.defaultValue);
  }
  return state;
}

// ============================================================================
// C091 — CONSTRAINT PACK CARD
// ============================================================================

export const CONSTRAINT_PACK_CARD: TheoryCardDef = {
  cardId: 'theory:constraint_pack',
  displayName: 'Constraint Pack',
  description: 'Apply preset constraint combinations with optional overrides',
  category: 'style',
  cultures: ['western', 'carnatic', 'celtic', 'chinese', 'hybrid'],
  params: [
    {
      id: 'packId',
      label: 'Pack',
      type: 'enum',
      enumValues: [
        'cinematic_heroic', 'galant_phrase', 'carnatic_alapana',
        'celtic_reel', 'chinese_heterophony',
        'horror', 'fantasy', 'action',
        'romance', 'comedy', 'sci_fi',
      ],
      defaultValue: 'cinematic_heroic',
      constraintType: 'style',
      hard: false,
      weight: 0.7,
      description: 'Select a preset constraint pack to apply',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    // Pack constraints are applied via Prolog apply_pack/1,
    // not directly as TS constraints. This card emits a style hint.
    const packId = getParam<string>(state, 'packId');
    if (!packId) return [];
    // The pack ID maps to a Prolog constraint_pack/2 query
    return [{ type: 'style', hard: false, weight: 0.7, style: 'custom' as StyleTag }];
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    const constraints = this.extractConstraints(state);
    return withConstraints(spec, ...constraints);
  },
};

// ============================================================================
// C092 — TONALITY MODEL CARD
// ============================================================================

export const TONALITY_MODEL_CARD: TheoryCardDef = {
  cardId: 'theory:tonality_model',
  displayName: 'Tonality Model',
  description: 'Select and configure the tonality detection/scoring model',
  category: 'theory',
  cultures: ['western', 'hybrid'],
  params: [
    {
      id: 'model',
      label: 'Model',
      type: 'enum',
      enumValues: ['ks_profile', 'dft_phase', 'spiral_array'],
      defaultValue: 'ks_profile',
      constraintType: 'tonality_model',
      hard: false,
      weight: 0.8,
      description: 'Tonality detection algorithm: Krumhansl-Schmuckler profiles, DFT phase analysis, or Spiral Array embedding',
    },
    {
      id: 'ksWeight',
      label: 'KS weight',
      type: 'range',
      range: { min: 0, max: 1, step: 0.1 },
      defaultValue: 0.5,
      constraintType: 'tonality_model',
      hard: false,
      weight: 0.3,
      description: 'Weight for Krumhansl-Schmuckler model in hybrid detection',
    },
    {
      id: 'dftWeight',
      label: 'DFT weight',
      type: 'range',
      range: { min: 0, max: 1, step: 0.1 },
      defaultValue: 0.3,
      constraintType: 'tonality_model',
      hard: false,
      weight: 0.3,
      description: 'Weight for DFT phase model in hybrid detection',
    },
    {
      id: 'spiralWeight',
      label: 'Spiral weight',
      type: 'range',
      range: { min: 0, max: 1, step: 0.1 },
      defaultValue: 0.2,
      constraintType: 'tonality_model',
      hard: false,
      weight: 0.3,
      description: 'Weight for Spiral Array model in hybrid detection',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    const model = getParam<TonalityModel>(state, 'model');
    if (!model) return [];
    return [{ type: 'tonality_model', hard: false, weight: 0.8, model }];
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    const model = getParam<TonalityModel>(state, 'model');
    if (!model) return spec;
    const cleaned = withoutConstraintType(spec, 'tonality_model');
    return {
      ...cleaned,
      tonalityModel: model,
      constraints: [...cleaned.constraints, { type: 'tonality_model', hard: false, weight: 0.8, model }],
    };
  },

};

/**
 * C156: Extract the best_key_weighted/5 alpha weights from a TONALITY_MODEL_CARD state.
 * Returns { ks, dft, spiral } weights for use with best_key_weighted/5.
 */
export function getTonalityWeights(
  state: TheoryCardState
): { ks: number; dft: number; spiral: number } {
  const ks = getParam<number>(state, 'ksWeight') ?? 0.5;
  const dft = getParam<number>(state, 'dftWeight') ?? 0.3;
  const spiral = getParam<number>(state, 'spiralWeight') ?? 0.2;
  return { ks, dft, spiral };
}

// ============================================================================
// C093 — METER / ACCENT CARD
// ============================================================================

export const METER_ACCENT_CARD: TheoryCardDef = {
  cardId: 'theory:meter_accent',
  displayName: 'Meter & Accent',
  description: 'Configure meter signature, swing feel, and accent model',
  category: 'theory',
  cultures: ['western', 'carnatic', 'celtic', 'chinese', 'hybrid'],
  params: [
    {
      id: 'numerator',
      label: 'Beats per bar',
      type: 'number',
      range: { min: 1, max: 16 },
      defaultValue: 4,
      constraintType: 'meter',
      hard: true,
      weight: 1.0,
      description: 'Number of beats per bar (meter numerator)',
    },
    {
      id: 'denominator',
      label: 'Beat unit',
      type: 'enum',
      enumValues: ['2', '4', '8', '16'],
      defaultValue: '4',
      constraintType: 'meter',
      hard: true,
      weight: 1.0,
      description: 'Beat unit (meter denominator)',
    },
    {
      id: 'accentModel',
      label: 'Accent model',
      type: 'enum',
      enumValues: ['standard', 'compound', 'swing', 'celtic_dance', 'carnatic_tala'],
      defaultValue: 'standard',
      constraintType: 'accent',
      hard: false,
      weight: 0.6,
      description: 'Metrical accent pattern: standard, compound (6/8, etc.), swing, Celtic dance lifts, or Carnatic tala accents',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    const constraints: MusicConstraint[] = [];
    const num = getParam<number>(state, 'numerator');
    const den = getParam<string>(state, 'denominator');
    if (num !== undefined && den !== undefined) {
      constraints.push({ type: 'meter', hard: true, numerator: num, denominator: parseInt(den, 10) });
    }
    const accent = getParam<AccentModel>(state, 'accentModel');
    if (accent) {
      constraints.push({ type: 'accent', hard: false, weight: 0.6, model: accent });
    }
    return constraints;
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    const num = getParam<number>(state, 'numerator');
    const den = getParam<string>(state, 'denominator');
    let result = spec;
    if (num !== undefined && den !== undefined) {
      result = { ...result, meterNumerator: num, meterDenominator: parseInt(den, 10) };
    }
    return withConstraints(
      withoutConstraintType(withoutConstraintType(result, 'meter'), 'accent'),
      ...this.extractConstraints(state)
    );
  },
};

// ============================================================================
// C094 — GROUPING (GTTM) CARD
// ============================================================================

export const GROUPING_CARD: TheoryCardDef = {
  cardId: 'theory:grouping',
  displayName: 'Phrase Grouping (GTTM)',
  description: 'Configure GTTM-inspired phrase boundary detection sensitivity',
  category: 'analysis',
  cultures: ['western', 'hybrid'],
  params: [
    {
      id: 'sensitivity',
      label: 'Boundary sensitivity',
      type: 'range',
      range: { min: 0, max: 1, step: 0.05 },
      defaultValue: 0.5,
      constraintType: 'grouping',
      hard: false,
      weight: 0.5,
      description: 'How aggressively to detect phrase boundaries: 0 = few long phrases, 1 = many short phrases',
    },
    {
      id: 'contourBias',
      label: 'Melodic contour',
      type: 'enum',
      enumValues: ['ascending', 'descending', 'arch', 'inverted_arch', 'level'],
      defaultValue: 'arch',
      constraintType: 'contour',
      hard: false,
      weight: 0.4,
      description: 'Preferred melodic contour shape for generated phrases',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    const constraints: MusicConstraint[] = [];
    const sensitivity = getParam<number>(state, 'sensitivity');
    if (sensitivity !== undefined) {
      constraints.push({
        type: 'grouping', hard: false, weight: 0.5,
        sensitivity: Math.max(0, Math.min(1, sensitivity)),
      });
    }
    const contour = getParam<string>(state, 'contourBias');
    if (contour) {
      constraints.push({
        type: 'contour', hard: false, weight: 0.4,
        contour: contour as 'ascending' | 'descending' | 'arch' | 'inverted_arch' | 'level',
      });
    }
    return constraints;
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(
      withoutConstraintType(withoutConstraintType(spec, 'grouping'), 'contour'),
      ...this.extractConstraints(state)
    );
  },
};

// ============================================================================
// C095 — SCHEMA CARD
// ============================================================================

export const SCHEMA_CARD: TheoryCardDef = {
  cardId: 'theory:schema',
  displayName: 'Galant Schema',
  description: 'Select galant schema for phrase generation, analysis, and harmonic framing',
  category: 'theory',
  cultures: ['western', 'hybrid'],
  params: [
    {
      id: 'schema',
      label: 'Schema',
      type: 'enum',
      enumValues: [
        'prinner', 'fonte', 'monte', 'romanesca', 'meyer',
        'quiescenza', 'do_re_mi', 'cadential_64', 'lament_bass',
        'ponte', 'passo_indietro', 'circolo', 'indugio',
      ],
      defaultValue: 'prinner',
      constraintType: 'schema',
      hard: false,
      weight: 0.7,
      description: 'The galant schema to use as a structural skeleton',
    },
    {
      id: 'cadenceTarget',
      label: 'Cadence landing',
      type: 'enum',
      enumValues: ['authentic', 'perfect_authentic', 'imperfect_authentic', 'half', 'plagal', 'deceptive'],
      defaultValue: 'authentic',
      constraintType: 'cadence',
      hard: false,
      weight: 0.6,
      description: 'Target cadence type for the phrase ending',
    },
    {
      id: 'harmonicRhythm',
      label: 'Harmonic rhythm',
      type: 'range',
      range: { min: 1, max: 8, step: 1 },
      defaultValue: 2,
      constraintType: 'harmonic_rhythm',
      hard: false,
      weight: 0.5,
      description: 'Number of chord changes per bar',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    const constraints: MusicConstraint[] = [];
    const schema = getParam<GalantSchemaName>(state, 'schema');
    if (schema) {
      constraints.push({ type: 'schema', hard: false, weight: 0.7, schema });
    }
    const cadence = getParam<CadenceType>(state, 'cadenceTarget');
    if (cadence) {
      constraints.push({ type: 'cadence', hard: false, weight: 0.6, cadenceType: cadence });
    }
    const hr = getParam<number>(state, 'harmonicRhythm');
    if (hr !== undefined) {
      constraints.push({ type: 'harmonic_rhythm', hard: false, weight: 0.5, changesPerBar: hr });
    }
    return constraints;
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(
      withoutConstraintType(
        withoutConstraintType(
          withoutConstraintType(spec, 'schema'), 'cadence'
        ), 'harmonic_rhythm'
      ),
      ...this.extractConstraints(state)
    );
  },
};

// ============================================================================
// C096 — FILM SCORING CARD
// ============================================================================

export const FILM_SCORING_CARD: TheoryCardDef = {
  cardId: 'theory:film_scoring',
  displayName: 'Film Scoring',
  description: 'Mood, harmonic devices, and orchestration roles for film/media scoring',
  category: 'style',
  cultures: ['western', 'hybrid'],
  params: [
    {
      id: 'mood',
      label: 'Mood',
      type: 'enum',
      enumValues: ['heroic', 'ominous', 'tender', 'wonder', 'mystery', 'sorrow', 'comedy', 'action'],
      defaultValue: 'heroic',
      constraintType: 'film_mood',
      hard: false,
      weight: 0.8,
      description: 'Emotional color for the cue; influences mode, devices, and orchestration',
    },
    {
      id: 'primaryDevice',
      label: 'Primary device',
      type: 'enum',
      enumValues: [
        'pedal_point', 'drone', 'ostinato', 'planing',
        'chromatic_mediant', 'modal_mixture', 'lydian_tonic',
        'dorian_minor', 'phrygian_color', 'whole_tone_wash',
        'octatonic_action', 'cluster_tension', 'quartal_openness',
        'suspension_chain', 'cadence_deferral', 'trailer_rise',
      ],
      defaultValue: 'pedal_point',
      constraintType: 'film_device',
      hard: false,
      weight: 0.6,
      description: 'Primary harmonic/textural device',
    },
    {
      id: 'phraseDensity',
      label: 'Phrase density',
      type: 'enum',
      enumValues: ['sparse', 'medium', 'dense'],
      defaultValue: 'medium',
      constraintType: 'phrase_density',
      hard: false,
      weight: 0.5,
      description: 'Event density: sparse for underscore, dense for action',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    const constraints: MusicConstraint[] = [];
    const mood = getParam<FilmMood>(state, 'mood');
    if (mood) {
      constraints.push({ type: 'film_mood', hard: false, weight: 0.8, mood });
    }
    const device = getParam<FilmDevice>(state, 'primaryDevice');
    if (device) {
      constraints.push({ type: 'film_device', hard: false, weight: 0.6, device });
    }
    const density = getParam<'sparse' | 'medium' | 'dense'>(state, 'phraseDensity');
    if (density) {
      constraints.push({ type: 'phrase_density', hard: false, weight: 0.5, density });
    }
    return constraints;
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(
      withoutConstraintType(
        withoutConstraintType(
          withoutConstraintType(spec, 'film_mood'), 'film_device'
        ), 'phrase_density'
      ),
      ...this.extractConstraints(state)
    );
  },
};

// ============================================================================
// C097 — CARNATIC RAGA / TALA CARD
// ============================================================================

export const CARNATIC_RAGA_TALA_CARD: TheoryCardDef = {
  cardId: 'theory:carnatic_raga_tala',
  displayName: 'Carnatic Raga/Tala',
  description: 'Raga, tala, jati, eduppu, and gamaka density for Carnatic music',
  category: 'world',
  cultures: ['carnatic', 'hybrid'],
  params: [
    {
      id: 'raga',
      label: 'Raga',
      type: 'enum',
      enumValues: [
        'mohanam', 'hamsadhwani', 'kalyani', 'keeravani',
        'shankarabharanam', 'hindolam', 'abhogi',
        'todi', 'bhairavi', 'kambhoji',
      ],
      defaultValue: 'mohanam',
      constraintType: 'raga',
      hard: true,
      weight: 1.0,
      description: 'Select a Carnatic raga (determines arohana/avarohana, gamaka emphasis, pakad phrases)',
    },
    {
      id: 'tala',
      label: 'Tala',
      type: 'enum',
      enumValues: ['adi', 'rupaka', 'misra_chapu', 'khanda_chapu', 'jhampa', 'triputa', 'ata', 'eka'],
      defaultValue: 'adi',
      constraintType: 'tala',
      hard: true,
      weight: 1.0,
      description: 'Select a Carnatic tala (determines cycle length and beat groupings)',
    },
    {
      id: 'jati',
      label: 'Jati',
      type: 'enum',
      enumValues: ['tisra', 'chatusra', 'khanda', 'misra', 'sankeerna'],
      defaultValue: 'chatusra',
      constraintType: 'tala',
      hard: true,
      weight: 1.0,
      description: 'Laghu jati (beats per laghu): tisra=3, chatusra=4, khanda=5, misra=7, sankeerna=9',
    },
    {
      id: 'gamakaDensity',
      label: 'Gamaka density',
      type: 'enum',
      enumValues: ['light', 'medium', 'heavy'],
      defaultValue: 'medium',
      constraintType: 'gamaka_density',
      hard: false,
      weight: 0.6,
      description: 'How densely to apply gamakas (oscillations/bends)',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    const constraints: MusicConstraint[] = [];
    const raga = getParam<RagaName>(state, 'raga');
    if (raga) {
      constraints.push({ type: 'raga', hard: true, raga });
    }
    const tala = getParam<TalaName>(state, 'tala');
    const jati = getParam<JatiType>(state, 'jati');
    if (tala) {
      constraints.push(jati
        ? { type: 'tala', hard: true, tala, jati }
        : { type: 'tala', hard: true, tala }
      );
    }
    const density = getParam<'light' | 'medium' | 'heavy'>(state, 'gamakaDensity');
    if (density) {
      constraints.push({ type: 'gamaka_density', hard: false, weight: 0.6, density });
    }
    // Auto-add culture constraint
    constraints.push({ type: 'culture', hard: true, culture: 'carnatic' });
    return constraints;
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(
      withoutConstraintType(
        withoutConstraintType(
          withoutConstraintType(
            withoutConstraintType(spec, 'raga'), 'tala'
          ), 'gamaka_density'
        ), 'culture'
      ),
      ...this.extractConstraints(state)
    );
  },
};

// ============================================================================
// C098 — CELTIC TUNE CARD
// ============================================================================

export const CELTIC_TUNE_CARD: TheoryCardDef = {
  cardId: 'theory:celtic_tune',
  displayName: 'Celtic Tune',
  description: 'Tune type, mode, ornaments, form, and drone for Celtic music',
  category: 'world',
  cultures: ['celtic', 'hybrid'],
  params: [
    {
      id: 'tuneType',
      label: 'Tune type',
      type: 'enum',
      enumValues: ['reel', 'jig', 'slip_jig', 'hornpipe', 'strathspey', 'polka', 'march', 'air'],
      defaultValue: 'reel',
      constraintType: 'celtic_tune',
      hard: true,
      weight: 1.0,
      description: 'Dance/tune type (determines meter, tempo range, rhythm feel)',
    },
    {
      id: 'ornamentBudget',
      label: 'Max ornaments per beat',
      type: 'range',
      range: { min: 0, max: 4, step: 1 },
      defaultValue: 2,
      constraintType: 'ornament_budget',
      hard: false,
      weight: 0.5,
      description: 'Maximum ornament density (rolls, cuts, taps) per beat',
    },
    {
      id: 'accentModel',
      label: 'Dance accent',
      type: 'enum',
      enumValues: ['standard', 'celtic_dance'],
      defaultValue: 'celtic_dance',
      constraintType: 'accent',
      hard: false,
      weight: 0.6,
      description: 'Accent model: standard metrical accents or Celtic dance lifts',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    const constraints: MusicConstraint[] = [];
    const tuneType = getParam<CelticTuneType>(state, 'tuneType');
    if (tuneType) {
      constraints.push({ type: 'celtic_tune', hard: true, tuneType });
    }
    const ornamentBudget = getParam<number>(state, 'ornamentBudget');
    if (ornamentBudget !== undefined) {
      constraints.push({ type: 'ornament_budget', hard: false, weight: 0.5, maxPerBeat: ornamentBudget });
    }
    const accent = getParam<AccentModel>(state, 'accentModel');
    if (accent) {
      constraints.push({ type: 'accent', hard: false, weight: 0.6, model: accent });
    }
    // Auto-add culture constraint
    constraints.push({ type: 'culture', hard: true, culture: 'celtic' });
    return constraints;
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(
      withoutConstraintType(
        withoutConstraintType(
          withoutConstraintType(
            withoutConstraintType(spec, 'celtic_tune'), 'ornament_budget'
          ), 'accent'
        ), 'culture'
      ),
      ...this.extractConstraints(state)
    );
  },
};

// ============================================================================
// C099 — CHINESE MODE CARD
// ============================================================================

export const CHINESE_MODE_CARD: TheoryCardDef = {
  cardId: 'theory:chinese_mode',
  displayName: 'Chinese Mode',
  description: 'Pentatonic mode, bian tones, heterophony, and ornament style for Chinese music',
  category: 'world',
  cultures: ['chinese', 'hybrid'],
  params: [
    {
      id: 'mode',
      label: 'Mode',
      type: 'enum',
      enumValues: ['gong', 'shang', 'jiao', 'zhi', 'yu'],
      defaultValue: 'gong',
      constraintType: 'chinese_mode',
      hard: true,
      weight: 1.0,
      description: 'Chinese pentatonic mode (determines scale and tonal center)',
    },
    {
      id: 'includeBian',
      label: 'Include bian tones',
      type: 'boolean',
      defaultValue: false,
      constraintType: 'chinese_mode',
      hard: false,
      weight: 0.4,
      description: 'Add heptatonic bian (extra) tones as optional color notes',
    },
    {
      id: 'phraseDensity',
      label: 'Phrase density',
      type: 'enum',
      enumValues: ['sparse', 'medium', 'dense'],
      defaultValue: 'medium',
      constraintType: 'phrase_density',
      hard: false,
      weight: 0.5,
      description: 'Melodic event density per beat',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    const constraints: MusicConstraint[] = [];
    const mode = getParam<ChineseModeName>(state, 'mode');
    const includeBian = getParam<boolean>(state, 'includeBian');
    if (mode) {
      constraints.push({
        type: 'chinese_mode', hard: true,
        mode,
        includeBian: includeBian ?? false,
      });
    }
    const density = getParam<'sparse' | 'medium' | 'dense'>(state, 'phraseDensity');
    if (density) {
      constraints.push({ type: 'phrase_density', hard: false, weight: 0.5, density });
    }
    // Auto-add culture constraint
    constraints.push({ type: 'culture', hard: true, culture: 'chinese' });
    return constraints;
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(
      withoutConstraintType(
        withoutConstraintType(
          withoutConstraintType(spec, 'chinese_mode'), 'phrase_density'
        ), 'culture'
      ),
      ...this.extractConstraints(state)
    );
  },
};

// ============================================================================
// C411 — TRAILER BUILD CARD
// ============================================================================

export const TRAILER_BUILD_CARD: TheoryCardDef = {
  cardId: 'theory:trailer_build',
  displayName: 'Trailer Build',
  description: 'Build length, hits, risers, and percussion density for trailer cues',
  category: 'style',
  cultures: ['western', 'hybrid'],
  params: [
    {
      id: 'buildBars',
      label: 'Build length (bars)',
      type: 'range',
      range: { min: 4, max: 64, step: 4 },
      defaultValue: 16,
      constraintType: 'trailer_build',
      hard: false,
      weight: 0.7,
      description: 'Number of bars for the build section before the hit/drop',
    },
    {
      id: 'hitCount',
      label: 'Hit points',
      type: 'range',
      range: { min: 0, max: 8, step: 1 },
      defaultValue: 3,
      constraintType: 'trailer_build',
      hard: false,
      weight: 0.6,
      description: 'Number of synchronized hit points in the build',
    },
    {
      id: 'percussionDensity',
      label: 'Percussion density',
      type: 'enum',
      enumValues: ['sparse', 'medium', 'dense', 'very_dense'],
      defaultValue: 'dense',
      constraintType: 'trailer_build',
      hard: false,
      weight: 0.5,
      description: 'Percussion event density during the build',
    },
    {
      id: 'riserType',
      label: 'Riser type',
      type: 'enum',
      enumValues: ['noise_sweep', 'pitch_rise', 'percussion_roll', 'string_trem', 'combined'],
      defaultValue: 'combined',
      constraintType: 'trailer_build',
      hard: false,
      weight: 0.4,
      description: 'Type of riser effect leading to the hit',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    const constraints: MusicConstraint[] = [];
    const buildBars = getParam<number>(state, 'buildBars');
    const hitCount = getParam<number>(state, 'hitCount');
    const density = getParam<string>(state, 'percussionDensity');
    if (buildBars !== undefined && hitCount !== undefined) {
      constraints.push({
        type: 'trailer_build', hard: false, weight: 0.7,
        buildBars, hitCount,
        percussionDensity: (density ?? 'dense') as 'sparse' | 'medium' | 'dense' | 'very_dense',
      });
    }
    constraints.push({ type: 'style', hard: false, weight: 0.5, style: 'trailer' as StyleTag });
    return constraints;
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(
      withoutConstraintType(spec, 'trailer_build'),
      ...this.extractConstraints(state)
    );
  },
};

// ============================================================================
// C228 — LEITMOTIF LIBRARY CARD
// ============================================================================

export const LEITMOTIF_LIBRARY_CARD: TheoryCardDef = {
  cardId: 'theory:leitmotif_library',
  displayName: 'Leitmotif Library',
  description: 'Store and manage motif fingerprints with labels for recurring themes',
  category: 'analysis',
  cultures: ['western', 'hybrid'],
  params: [
    {
      id: 'activeMotifId',
      label: 'Active motif',
      type: 'enum',
      enumValues: ['motif_a', 'motif_b', 'motif_c', 'motif_d', 'motif_e'],
      defaultValue: 'motif_a',
      constraintType: 'leitmotif',
      hard: false,
      weight: 0.6,
      description: 'Select the active leitmotif for detection and transformation',
    },
    {
      id: 'transformOp',
      label: 'Transform',
      type: 'enum',
      enumValues: ['none', 'augmentation', 'diminution', 'inversion', 'retrograde', 'reharmonize'],
      defaultValue: 'none',
      constraintType: 'leitmotif',
      hard: false,
      weight: 0.4,
      description: 'Transformation to apply when inserting the motif',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    const motifId = getParam<string>(state, 'activeMotifId');
    if (!motifId) return [];
    const transformOp = getParam<string>(state, 'transformOp');
    if (transformOp && transformOp !== 'none') {
      return [{ type: 'leitmotif', hard: false, weight: 0.6, motifId, transformOp: transformOp as 'augmentation' | 'diminution' | 'inversion' | 'retrograde' | 'reharmonize' }];
    }
    return [{ type: 'leitmotif', hard: false, weight: 0.6, motifId }];
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(
      withoutConstraintType(spec, 'leitmotif'),
      ...this.extractConstraints(state)
    );
  },
};

// ============================================================================
// C229 — LEITMOTIF MATCHER CARD
// ============================================================================

export const LEITMOTIF_MATCHER_CARD: TheoryCardDef = {
  cardId: 'theory:leitmotif_matcher',
  displayName: 'Leitmotif Matcher',
  description: 'Detect occurrences of stored motifs in tracker/notation selections',
  category: 'analysis',
  cultures: ['western', 'hybrid'],
  params: [
    {
      id: 'matchThreshold',
      label: 'Match threshold',
      type: 'range',
      range: { min: 0.3, max: 1.0, step: 0.05 },
      defaultValue: 0.7,
      constraintType: 'leitmotif',
      hard: false,
      weight: 0.5,
      description: 'Minimum similarity score (0-1) to report a motif match',
    },
    {
      id: 'allowTransposed',
      label: 'Allow transposed',
      type: 'boolean',
      defaultValue: true,
      constraintType: 'leitmotif',
      hard: false,
      weight: 0.3,
      description: 'Whether to detect motifs transposed to different keys',
    },
  ],
  extractConstraints(): MusicConstraint[] {
    return [];
  },
  applyToSpec(_state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return spec;
  },
};

// ============================================================================
// C511 — DRONE CARD
// ============================================================================

export const DRONE_CARD: TheoryCardDef = {
  cardId: 'theory:drone',
  displayName: 'Drone',
  description: 'Tonic/dominant drone, sruti box, or pipes drone controls',
  category: 'world',
  cultures: ['carnatic', 'celtic', 'chinese', 'hybrid'],
  params: [
    {
      id: 'droneTone1',
      label: 'Drone tone 1',
      type: 'enum',
      enumValues: ['c', 'd', 'e', 'f', 'g', 'a', 'b', 'csharp', 'eflat', 'fsharp', 'gsharp', 'bflat'],
      defaultValue: 'c',
      constraintType: 'drone',
      hard: false,
      weight: 0.6,
      description: 'Primary drone pitch (typically tonic/Sa)',
    },
    {
      id: 'droneTone2',
      label: 'Drone tone 2',
      type: 'enum',
      enumValues: ['none', 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'csharp', 'eflat', 'fsharp', 'gsharp', 'bflat'],
      defaultValue: 'g',
      constraintType: 'drone',
      hard: false,
      weight: 0.4,
      description: 'Secondary drone pitch (typically Pa/dominant, or none)',
    },
    {
      id: 'droneStyle',
      label: 'Style',
      type: 'enum',
      enumValues: ['sustained', 'pulsing', 'sruti_box', 'pipes', 'open_strings'],
      defaultValue: 'sustained',
      constraintType: 'drone',
      hard: false,
      weight: 0.5,
      description: 'Drone articulation style',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    const tone1 = getParam<string>(state, 'droneTone1');
    const tone2 = getParam<string>(state, 'droneTone2');
    const style = getParam<string>(state, 'droneStyle');
    if (!tone1) return [];
    const tones = [tone1] as string[];
    if (tone2 && tone2 !== 'none') tones.push(tone2);
    return [{
      type: 'drone', hard: false, weight: 0.6,
      droneTones: tones as unknown as readonly import('./music-spec').RootName[],
      droneStyle: (style ?? 'sustained') as 'sustained' | 'pulsing' | 'sruti_box' | 'pipes' | 'open_strings',
    }];
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(
      withoutConstraintType(spec, 'drone'),
      ...this.extractConstraints(state)
    );
  },
};

// ============================================================================
// C512 — MRIDANGAM PATTERN CARD
// ============================================================================

export const MRIDANGAM_PATTERN_CARD: TheoryCardDef = {
  cardId: 'theory:mridangam_pattern',
  displayName: 'Mridangam Pattern',
  description: 'Tala pattern + konnakol mapping for Carnatic percussion',
  category: 'world',
  cultures: ['carnatic', 'hybrid'],
  params: [
    {
      id: 'tala',
      label: 'Tala',
      type: 'enum',
      enumValues: ['adi', 'rupaka', 'misra_chapu', 'khanda_chapu', 'jhampa', 'triputa', 'ata', 'eka'],
      defaultValue: 'adi',
      constraintType: 'tala',
      hard: true,
      weight: 1.0,
      description: 'Tala cycle for the pattern',
    },
    {
      id: 'patternDensity',
      label: 'Pattern density',
      type: 'enum',
      enumValues: ['sparse', 'medium', 'dense'],
      defaultValue: 'medium',
      constraintType: 'phrase_density',
      hard: false,
      weight: 0.5,
      description: 'Density of mridangam strokes per akshara',
    },
    {
      id: 'showKonnakol',
      label: 'Show konnakol',
      type: 'boolean',
      defaultValue: true,
      constraintType: 'tala',
      hard: false,
      weight: 0.2,
      description: 'Display konnakol syllables alongside pattern',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    const constraints: MusicConstraint[] = [];
    const tala = getParam<TalaName>(state, 'tala');
    if (tala) {
      constraints.push({ type: 'tala', hard: true, tala });
    }
    const density = getParam<'sparse' | 'medium' | 'dense'>(state, 'patternDensity');
    if (density) {
      constraints.push({ type: 'phrase_density', hard: false, weight: 0.5, density });
    }
    constraints.push({ type: 'culture', hard: true, culture: 'carnatic' });
    return constraints;
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(
      withoutConstraintType(withoutConstraintType(spec, 'tala'), 'culture'),
      ...this.extractConstraints(state)
    );
  },
};

// ============================================================================
// C513 — KORVAI GENERATOR CARD
// ============================================================================

export const KORVAI_GENERATOR_CARD: TheoryCardDef = {
  cardId: 'theory:korvai_generator',
  displayName: 'Korvai Generator',
  description: 'Mathematical cadence builder (korvai/mora) for Carnatic tala cycles',
  category: 'generation',
  cultures: ['carnatic', 'hybrid'],
  params: [
    {
      id: 'structure',
      label: 'Structure',
      type: 'enum',
      enumValues: ['korvai_3x', 'mora_3x', 'tihai', 'custom'],
      defaultValue: 'korvai_3x',
      constraintType: 'tala',
      hard: false,
      weight: 0.7,
      description: 'Korvai: 3-part cadence; Mora: 3x repeated phrase; Tihai: 3x ending',
    },
    {
      id: 'targetBeats',
      label: 'Target beats',
      type: 'range',
      range: { min: 4, max: 64, step: 1 },
      defaultValue: 16,
      constraintType: 'tala',
      hard: false,
      weight: 0.6,
      description: 'Total beat count the korvai must fill exactly',
    },
    {
      id: 'gapBeats',
      label: 'Gap beats',
      type: 'range',
      range: { min: 0, max: 8, step: 1 },
      defaultValue: 1,
      constraintType: 'tala',
      hard: false,
      weight: 0.4,
      description: 'Rest beats between repetitions',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    void state;
    return [{ type: 'culture', hard: true, culture: 'carnatic' }];
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(
      withoutConstraintType(spec, 'culture'),
      ...this.extractConstraints(state)
    );
  },
};

// ============================================================================
// C689 — ORNAMENT GENERATOR CARD (Celtic)
// ============================================================================

export const ORNAMENT_GENERATOR_CARD: TheoryCardDef = {
  cardId: 'theory:ornament_generator',
  displayName: 'Ornament Generator',
  description: 'Instrument-specific ornaments (cuts, taps, rolls, slides) for Celtic tunes',
  category: 'generation',
  cultures: ['celtic', 'hybrid'],
  params: [
    {
      id: 'instrument',
      label: 'Instrument',
      type: 'enum',
      enumValues: ['fiddle', 'flute', 'whistle', 'pipes', 'harp', 'bouzouki', 'concertina'],
      defaultValue: 'fiddle',
      constraintType: 'ornament_budget',
      hard: false,
      weight: 0.5,
      description: 'Target instrument (determines available ornament types)',
    },
    {
      id: 'ornamentBudget',
      label: 'Max ornaments/beat',
      type: 'range',
      range: { min: 0, max: 4, step: 1 },
      defaultValue: 2,
      constraintType: 'ornament_budget',
      hard: false,
      weight: 0.6,
      description: 'Maximum ornament density per beat',
    },
    {
      id: 'preferredOrnaments',
      label: 'Preferred types',
      type: 'enum',
      enumValues: ['cuts_taps', 'rolls', 'slides', 'crans', 'mixed'],
      defaultValue: 'mixed',
      constraintType: 'ornament_budget',
      hard: false,
      weight: 0.4,
      description: 'Which ornament families to emphasize',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    const constraints: MusicConstraint[] = [];
    const budget = getParam<number>(state, 'ornamentBudget');
    if (budget !== undefined) {
      constraints.push({ type: 'ornament_budget', hard: false, weight: 0.6, maxPerBeat: budget });
    }
    constraints.push({ type: 'culture', hard: true, culture: 'celtic' });
    return constraints;
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(
      withoutConstraintType(withoutConstraintType(spec, 'ornament_budget'), 'culture'),
      ...this.extractConstraints(state)
    );
  },
};

// ============================================================================
// C690 — BODHRAN CARD
// ============================================================================

export const BODHRAN_CARD: TheoryCardDef = {
  cardId: 'theory:bodhran',
  displayName: 'Bodhrán Pattern',
  description: 'Bodhrán pattern picker + humanization for Celtic tunes',
  category: 'generation',
  cultures: ['celtic', 'hybrid'],
  params: [
    {
      id: 'tuneType',
      label: 'Tune type',
      type: 'enum',
      enumValues: ['reel', 'jig', 'slip_jig', 'hornpipe', 'strathspey', 'polka'],
      defaultValue: 'reel',
      constraintType: 'celtic_tune',
      hard: false,
      weight: 0.7,
      description: 'Tune type determines the base pattern',
    },
    {
      id: 'humanize',
      label: 'Humanize amount',
      type: 'range',
      range: { min: 0, max: 1, step: 0.1 },
      defaultValue: 0.3,
      constraintType: 'swing',
      hard: false,
      weight: 0.3,
      description: 'Timing variation for natural feel (0=robot, 1=loose)',
    },
    {
      id: 'accentPattern',
      label: 'Accent pattern',
      type: 'enum',
      enumValues: ['standard', 'driving', 'relaxed', 'cross_rhythm'],
      defaultValue: 'standard',
      constraintType: 'accent',
      hard: false,
      weight: 0.5,
      description: 'Accent pattern style',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    const constraints: MusicConstraint[] = [];
    const tuneType = getParam<CelticTuneType>(state, 'tuneType');
    if (tuneType) {
      constraints.push({ type: 'celtic_tune', hard: false, weight: 0.7, tuneType });
    }
    constraints.push({ type: 'culture', hard: true, culture: 'celtic' });
    return constraints;
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(
      withoutConstraintType(spec, 'culture'),
      ...this.extractConstraints(state)
    );
  },
};

// ============================================================================
// C789 — HETEROPHONY CARD (Chinese)
// ============================================================================

export const HETEROPHONY_CARD: TheoryCardDef = {
  cardId: 'theory:heterophony',
  displayName: 'Heterophony',
  description: 'Voice count, variation depth, and timing spread for Chinese heterophonic texture',
  category: 'generation',
  cultures: ['chinese', 'hybrid'],
  params: [
    {
      id: 'voiceCount',
      label: 'Voice count',
      type: 'range',
      range: { min: 2, max: 6, step: 1 },
      defaultValue: 3,
      constraintType: 'heterophony',
      hard: false,
      weight: 0.7,
      description: 'Number of simultaneous voices playing variants of the same melody',
    },
    {
      id: 'variationDepth',
      label: 'Variation depth',
      type: 'enum',
      enumValues: ['subtle', 'moderate', 'free'],
      defaultValue: 'moderate',
      constraintType: 'heterophony',
      hard: false,
      weight: 0.6,
      description: 'How much each voice departs from the reference melody',
    },
    {
      id: 'timingSpread',
      label: 'Timing spread',
      type: 'range',
      range: { min: 0, max: 1, step: 0.1 },
      defaultValue: 0.3,
      constraintType: 'heterophony',
      hard: false,
      weight: 0.4,
      description: 'How much timing varies between voices (0=unison, 1=very free)',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    const constraints: MusicConstraint[] = [];
    const voices = getParam<number>(state, 'voiceCount');
    const depth = getParam<string>(state, 'variationDepth');
    const spread = getParam<number>(state, 'timingSpread');
    if (voices !== undefined) {
      constraints.push({
        type: 'heterophony', hard: false, weight: 0.7,
        voiceCount: voices,
        variationDepth: (depth ?? 'moderate') as 'subtle' | 'moderate' | 'free',
        timingSpread: spread ?? 0.3,
      });
    }
    constraints.push({ type: 'culture', hard: true, culture: 'chinese' });
    return constraints;
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(
      withoutConstraintType(withoutConstraintType(spec, 'heterophony'), 'culture'),
      ...this.extractConstraints(state)
    );
  },
};

// ============================================================================
// C790 — GUZHENG GLISS CARD
// ============================================================================

export const GUZHENG_GLISS_CARD: TheoryCardDef = {
  cardId: 'theory:guzheng_gliss',
  displayName: 'Guzheng Glissandi',
  description: 'Glissando rate, pitch set constraints for guzheng performance',
  category: 'generation',
  cultures: ['chinese', 'hybrid'],
  params: [
    {
      id: 'glissRate',
      label: 'Gliss rate',
      type: 'enum',
      enumValues: ['rare', 'occasional', 'frequent'],
      defaultValue: 'occasional',
      constraintType: 'ornament_budget',
      hard: false,
      weight: 0.5,
      description: 'How often glissandi occur per phrase',
    },
    {
      id: 'mode',
      label: 'Mode',
      type: 'enum',
      enumValues: ['gong', 'shang', 'jiao', 'zhi', 'yu'],
      defaultValue: 'gong',
      constraintType: 'chinese_mode',
      hard: true,
      weight: 1.0,
      description: 'Pentatonic mode restricting gliss pitch content',
    },
    {
      id: 'tremoloDepth',
      label: 'Tremolo depth',
      type: 'range',
      range: { min: 0, max: 1, step: 0.1 },
      defaultValue: 0.5,
      constraintType: 'ornament_budget',
      hard: false,
      weight: 0.4,
      description: 'Intensity of right-hand tremolo technique',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    const constraints: MusicConstraint[] = [];
    const mode = getParam<ChineseModeName>(state, 'mode');
    if (mode) {
      constraints.push({ type: 'chinese_mode', hard: true, mode, includeBian: false });
    }
    constraints.push({ type: 'culture', hard: true, culture: 'chinese' });
    return constraints;
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(
      withoutConstraintType(withoutConstraintType(spec, 'chinese_mode'), 'culture'),
      ...this.extractConstraints(state)
    );
  },
};

// ============================================================================
// C791 — ERHU ORNAMENT CARD
// ============================================================================

export const ERHU_ORNAMENT_CARD: TheoryCardDef = {
  cardId: 'theory:erhu_ornament',
  displayName: 'Erhu Ornaments',
  description: 'Slides/vibrato density for erhu performance',
  category: 'generation',
  cultures: ['chinese', 'hybrid'],
  params: [
    {
      id: 'slideDensity',
      label: 'Slide density',
      type: 'enum',
      enumValues: ['none', 'sparse', 'medium', 'dense'],
      defaultValue: 'medium',
      constraintType: 'ornament_budget',
      hard: false,
      weight: 0.5,
      description: 'Frequency of portamento/glissando slides between notes',
    },
    {
      id: 'vibratoDensity',
      label: 'Vibrato density',
      type: 'enum',
      enumValues: ['none', 'light', 'medium', 'heavy'],
      defaultValue: 'medium',
      constraintType: 'ornament_budget',
      hard: false,
      weight: 0.4,
      description: 'Amount of left-hand vibrato (yao zhong)',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    const constraints: MusicConstraint[] = [];
    const slideDensity = getParam<string>(state, 'slideDensity');
    const vibratoDensity = getParam<string>(state, 'vibratoDensity');
    const densityMap: Record<string, number> = { none: 0, sparse: 1, light: 1, medium: 2, dense: 3, heavy: 3 };
    const maxBudget = Math.max(densityMap[slideDensity ?? 'medium'] ?? 2, densityMap[vibratoDensity ?? 'medium'] ?? 2);
    constraints.push({ type: 'ornament_budget', hard: false, weight: 0.5, maxPerBeat: maxBudget });
    constraints.push({ type: 'culture', hard: true, culture: 'chinese' });
    return constraints;
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(
      withoutConstraintType(withoutConstraintType(spec, 'ornament_budget'), 'culture'),
      ...this.extractConstraints(state)
    );
  },
};

// ============================================================================
// C885 — TONALITY ANALYSIS CARD
// ============================================================================

export const TONALITY_ANALYSIS_CARD: TheoryCardDef = {
  cardId: 'analysis:tonality',
  displayName: 'Tonality Analysis',
  description: 'Compare KS vs DFT vs Spiral Array key detection on selected events',
  category: 'analysis',
  cultures: ['western', 'hybrid'],
  params: [
    {
      id: 'models',
      label: 'Models to compare',
      type: 'enum',
      enumValues: ['all', 'ks_only', 'dft_only', 'spiral_only', 'ks_dft', 'ks_spiral', 'dft_spiral'],
      defaultValue: 'all',
      constraintType: 'tonality_model',
      hard: false,
      weight: 0.3,
      description: 'Which tonality models to include in the comparison',
    },
    {
      id: 'windowSize',
      label: 'Window size (beats)',
      type: 'range',
      range: { min: 4, max: 64, step: 4 },
      defaultValue: 16,
      constraintType: 'grouping',
      hard: false,
      weight: 0.2,
      description: 'Analysis window size in beats for windowed tonality detection',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    const model = getParam<string>(state, 'models');
    if (!model || model === 'all') return [];
    const modelMap: Record<string, TonalityModel> = {
      ks_only: 'ks_profile', dft_only: 'dft_phase', spiral_only: 'spiral_array',
    };
    const resolved = modelMap[model];
    if (resolved) return [{ type: 'tonality_model', hard: false, weight: 0.3, model: resolved }];
    return [];
  },
  applyToSpec(_state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return spec;
  },
};

// ============================================================================
// C886 — GROUPING ANALYSIS CARD
// ============================================================================

export const GROUPING_ANALYSIS_CARD: TheoryCardDef = {
  cardId: 'analysis:grouping',
  displayName: 'Grouping Analysis',
  description: 'GTTM boundaries + phrase heads + cadence detection on selected events',
  category: 'analysis',
  cultures: ['western', 'hybrid'],
  params: [
    {
      id: 'sensitivity',
      label: 'Boundary sensitivity',
      type: 'range',
      range: { min: 0, max: 1, step: 0.05 },
      defaultValue: 0.5,
      constraintType: 'grouping',
      hard: false,
      weight: 0.5,
      description: 'How aggressively to detect phrase boundaries',
    },
    {
      id: 'showHeads',
      label: 'Show phrase heads',
      type: 'boolean',
      defaultValue: true,
      constraintType: 'grouping',
      hard: false,
      weight: 0.2,
      description: 'Highlight structurally prominent tones per segment',
    },
    {
      id: 'showCadences',
      label: 'Show cadences',
      type: 'boolean',
      defaultValue: true,
      constraintType: 'cadence',
      hard: false,
      weight: 0.2,
      description: 'Detect and mark cadences at phrase endings',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    const sensitivity = getParam<number>(state, 'sensitivity');
    if (sensitivity !== undefined) {
      return [{ type: 'grouping', hard: false, weight: 0.5, sensitivity }];
    }
    return [];
  },
  applyToSpec(_state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return spec;
  },
};

// ============================================================================
// C887 — SCHEMA ANALYSIS CARD
// ============================================================================

export const SCHEMA_ANALYSIS_CARD: TheoryCardDef = {
  cardId: 'analysis:schema',
  displayName: 'Schema Analysis',
  description: 'Galant schema matches and fit scores on selected chord/degree sequences',
  category: 'analysis',
  cultures: ['western', 'hybrid'],
  params: [
    {
      id: 'matchThreshold',
      label: 'Match threshold',
      type: 'range',
      range: { min: 0.3, max: 1.0, step: 0.05 },
      defaultValue: 0.6,
      constraintType: 'schema',
      hard: false,
      weight: 0.3,
      description: 'Minimum fit score to report a schema match',
    },
    {
      id: 'showVariations',
      label: 'Show variations',
      type: 'boolean',
      defaultValue: false,
      constraintType: 'schema',
      hard: false,
      weight: 0.2,
      description: 'Include schema variants in matching',
    },
  ],
  extractConstraints(): MusicConstraint[] {
    return [];
  },
  applyToSpec(_state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return spec;
  },
};

// ============================================================================
// C888 — CULTURE ANALYSIS CARD
// ============================================================================

export const CULTURE_ANALYSIS_CARD: TheoryCardDef = {
  cardId: 'analysis:culture',
  displayName: 'Culture Analysis',
  description: 'Raga/mode matches and confidence scores on selected melodic material',
  category: 'analysis',
  cultures: ['carnatic', 'celtic', 'chinese', 'western', 'hybrid'],
  params: [
    {
      id: 'cultures',
      label: 'Cultures to check',
      type: 'enum',
      enumValues: ['all', 'carnatic', 'celtic', 'chinese', 'western'],
      defaultValue: 'all',
      constraintType: 'culture',
      hard: false,
      weight: 0.3,
      description: 'Which cultural systems to match against',
    },
    {
      id: 'matchThreshold',
      label: 'Match threshold',
      type: 'range',
      range: { min: 0.3, max: 1.0, step: 0.05 },
      defaultValue: 0.5,
      constraintType: 'culture',
      hard: false,
      weight: 0.3,
      description: 'Minimum confidence to report a match',
    },
  ],
  extractConstraints(): MusicConstraint[] {
    return [];
  },
  applyToSpec(_state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return spec;
  },
};

// ============================================================================
// CARD REGISTRY
// ============================================================================

/**
 * All theory card definitions.
 */
export const THEORY_CARDS: readonly TheoryCardDef[] = [
  // Core theory cards (C091-C099)
  CONSTRAINT_PACK_CARD,
  TONALITY_MODEL_CARD,
  METER_ACCENT_CARD,
  GROUPING_CARD,
  SCHEMA_CARD,
  FILM_SCORING_CARD,
  CARNATIC_RAGA_TALA_CARD,
  CELTIC_TUNE_CARD,
  CHINESE_MODE_CARD,
  // Film/trailer cards (C228-C229, C411)
  TRAILER_BUILD_CARD,
  LEITMOTIF_LIBRARY_CARD,
  LEITMOTIF_MATCHER_CARD,
  // Carnatic cards (C511-C513)
  DRONE_CARD,
  MRIDANGAM_PATTERN_CARD,
  KORVAI_GENERATOR_CARD,
  // Celtic cards (C689-C690)
  ORNAMENT_GENERATOR_CARD,
  BODHRAN_CARD,
  // Chinese cards (C789-C791)
  HETEROPHONY_CARD,
  GUZHENG_GLISS_CARD,
  ERHU_ORNAMENT_CARD,
  // Analysis cards (C885-C888)
  TONALITY_ANALYSIS_CARD,
  GROUPING_ANALYSIS_CARD,
  SCHEMA_ANALYSIS_CARD,
  CULTURE_ANALYSIS_CARD,
];

/**
 * Lookup a theory card definition by ID.
 */
export function getTheoryCard(cardId: string): TheoryCardDef | undefined {
  return THEORY_CARDS.find(c => c.cardId === cardId);
}

/**
 * Get theory cards relevant for a specific culture.
 */
export function getTheoryCardsForCulture(culture: CultureTag): TheoryCardDef[] {
  return THEORY_CARDS.filter(c => c.cultures.includes(culture));
}

/**
 * Get theory cards by category.
 */
export function getTheoryCardsByCategory(category: TheoryCardDef['category']): TheoryCardDef[] {
  return THEORY_CARDS.filter(c => c.category === category);
}

/**
 * Apply all active theory card states to a MusicSpec.
 */
export function applyTheoryCards(
  cards: ReadonlyArray<{ def: TheoryCardDef; state: TheoryCardState }>,
  baseSpec: MusicSpec
): MusicSpec {
  return cards.reduce(
    (spec, { def, state }) => def.applyToSpec(state, spec),
    baseSpec
  );
}

/**
 * Extract all constraints from active theory cards.
 */
export function extractAllConstraints(
  cards: ReadonlyArray<{ def: TheoryCardDef; state: TheoryCardState }>
): MusicConstraint[] {
  return cards.flatMap(({ def, state }) => def.extractConstraints(state));
}
