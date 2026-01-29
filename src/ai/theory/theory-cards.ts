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
// CARD REGISTRY
// ============================================================================

/**
 * All theory card definitions.
 */
export const THEORY_CARDS: readonly TheoryCardDef[] = [
  CONSTRAINT_PACK_CARD,
  TONALITY_MODEL_CARD,
  METER_ACCENT_CARD,
  GROUPING_CARD,
  SCHEMA_CARD,
  FILM_SCORING_CARD,
  CARNATIC_RAGA_TALA_CARD,
  CELTIC_TUNE_CARD,
  CHINESE_MODE_CARD,
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
