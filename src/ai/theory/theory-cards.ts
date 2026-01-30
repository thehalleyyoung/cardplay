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
  RootName,
  ModeName,
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

import { withConstraints, withoutConstraintType, withCulture, withStyle } from './music-spec';

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
    {
      id: 'eduppu',
      label: 'Eduppu (starting beat)',
      type: 'enum',
      enumValues: ['sama', 'vishama', 'atita', 'anagata'],
      defaultValue: 'sama',
      constraintType: 'tala', // Eduppu is part of tala/rhythm system
      hard: false,
      weight: 0.7,
      description: 'Starting beat position: sama=on sam, vishama=offbeat, atita=after sam, anagata=before sam',
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
    const eduppu = getParam<'sama' | 'vishama' | 'atita' | 'anagata'>(state, 'eduppu');
    if (eduppu && eduppu !== 'sama') {
      // Store eduppu as metadata rather than constraint (no standard eduppu constraint type)
      // It would be handled in the actual generation logic
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
// C412 — LEITMOTIF LIBRARY INTEGRATION WITH FILM SCORING
// ============================================================================

/**
 * Cue suggestion based on leitmotif and film mood
 */
export interface LeitmotifCueSuggestion {
  readonly motifId: string;
  readonly label: string;
  readonly transformation: 'none' | 'augmentation' | 'diminution' | 'inversion' | 'retrograde' | 'reharmonize';
  readonly mood: FilmMood;
  readonly reason: string;
  readonly priority: number;
}

/**
 * Mood to leitmotif transformation mapping
 */
export const MOOD_TRANSFORM_SUGGESTIONS: ReadonlyMap<FilmMood, readonly ('none' | 'augmentation' | 'diminution' | 'inversion' | 'retrograde' | 'reharmonize')[]> = new Map([
  ['heroic', ['none', 'augmentation']],
  ['ominous', ['inversion', 'diminution', 'retrograde']],
  ['tender', ['none', 'augmentation']],
  ['wonder', ['augmentation', 'none']],
  ['mystery', ['inversion', 'retrograde']],
  ['sorrow', ['diminution', 'augmentation']],
  ['comedy', ['diminution', 'inversion']],
  ['action', ['diminution', 'none']],
]);

/**
 * Get leitmotif cue suggestions for a given film scoring context.
 * 
 * This is the C412 integration: leitmotif library integration with film scoring card.
 */
export function getLeitmotifCueSuggestions(
  filmMood: FilmMood,
  filmDevice: FilmDevice,
  availableMotifs: readonly { id: string; label: string; character?: string }[]
): LeitmotifCueSuggestion[] {
  const suggestions: LeitmotifCueSuggestion[] = [];
  const transforms = MOOD_TRANSFORM_SUGGESTIONS.get(filmMood) ?? ['none'];
  
  for (const motif of availableMotifs) {
    // Suggest based on mood compatibility
    for (let i = 0; i < transforms.length && i < 2; i++) {
      const transform = transforms[i]!;
      
      let reason = `${motif.label || motif.id} works well with ${filmMood} mood`;
      let priority = 0.7 - i * 0.1;
      
      // Boost priority for device-specific suggestions
      if (filmDevice === 'ostinato' && transform === 'diminution') {
        reason += ' (diminution creates effective ostinato)';
        priority += 0.2;
      } else if (filmDevice === 'pedal_point' && transform === 'augmentation') {
        reason += ' (augmentation over pedal creates grandeur)';
        priority += 0.15;
      } else if (filmDevice === 'chromatic_mediant' && transform === 'reharmonize') {
        reason += ' (reharmonize for mediant shift)';
        priority += 0.15;
      }
      
      suggestions.push({
        motifId: motif.id,
        label: motif.label || motif.id,
        transformation: transform,
        mood: filmMood,
        reason,
        priority: Math.min(1, priority),
      });
    }
  }
  
  return suggestions.sort((a, b) => b.priority - a.priority);
}

/**
 * Film Scoring with Leitmotif Integration Card
 * Combines film mood/device selection with leitmotif suggestions
 */
export const FILM_LEITMOTIF_INTEGRATION_CARD: TheoryCardDef = {
  cardId: 'theory:film_leitmotif_integration',
  displayName: 'Film + Leitmotif',
  description: 'Film scoring card with integrated leitmotif suggestions and transformations',
  category: 'style',
  cultures: ['western', 'hybrid'],
  params: [
    ...FILM_SCORING_CARD.params,
    {
      id: 'activeMotif',
      label: 'Active leitmotif',
      type: 'enum',
      enumValues: ['none', 'motif_a', 'motif_b', 'motif_c', 'motif_d'],
      defaultValue: 'none',
      constraintType: 'leitmotif',
      hard: false,
      weight: 0.6,
      description: 'Select a leitmotif to integrate with the cue',
    },
    {
      id: 'motifTransform',
      label: 'Motif transform',
      type: 'enum',
      enumValues: ['auto', 'none', 'augmentation', 'diminution', 'inversion', 'retrograde', 'reharmonize'],
      defaultValue: 'auto',
      constraintType: 'leitmotif',
      hard: false,
      weight: 0.4,
      description: 'Transformation for the motif (auto = based on mood)',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    // Get film constraints
    const filmConstraints = FILM_SCORING_CARD.extractConstraints(state);
    
    // Add leitmotif constraint if active
    const activeMotif = getParam<string>(state, 'activeMotif');
    if (activeMotif && activeMotif !== 'none') {
      const mood = getParam<FilmMood>(state, 'mood') ?? 'heroic';
      const transformParam = getParam<string>(state, 'motifTransform');
      
      // Auto-select transform based on mood
      let transform: 'none' | 'augmentation' | 'diminution' | 'inversion' | 'retrograde' | 'reharmonize' = 'none';
      if (transformParam === 'auto') {
        const transforms = MOOD_TRANSFORM_SUGGESTIONS.get(mood);
        transform = transforms?.[0] ?? 'none';
      } else if (transformParam && transformParam !== 'none') {
        transform = transformParam as 'augmentation' | 'diminution' | 'inversion' | 'retrograde' | 'reharmonize';
      }
      
      if (transform !== 'none') {
        filmConstraints.push({
          type: 'leitmotif',
          hard: false,
          weight: 0.6,
          motifId: activeMotif,
          transformOp: transform,
        });
      } else {
        filmConstraints.push({
          type: 'leitmotif',
          hard: false,
          weight: 0.6,
          motifId: activeMotif,
        });
      }
    }
    
    return filmConstraints;
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(
      withoutConstraintType(
        withoutConstraintType(
          withoutConstraintType(
            withoutConstraintType(spec, 'film_mood'),
            'film_device'
          ),
          'phrase_density'
        ),
        'leitmotif'
      ),
      ...this.extractConstraints(state)
    );
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
// C302 — SCHEMA BROWSER CARD
// ============================================================================

export const SCHEMA_BROWSER_CARD: TheoryCardDef = {
  cardId: 'schema:browser',
  displayName: 'Schema Browser',
  description: 'Browse, preview, and select galant schemata with skeleton rendering',
  category: 'generation',
  cultures: ['western', 'hybrid'],
  params: [
    {
      id: 'category',
      label: 'Category',
      type: 'enum',
      enumValues: ['all', 'opening', 'continuation', 'cadential', 'sequential'],
      defaultValue: 'all',
      constraintType: 'schema',
      hard: false,
      weight: 0.3,
      description: 'Filter schemata by their typical phrase position',
    },
    {
      id: 'selectedSchema',
      label: 'Selected',
      type: 'enum',
      enumValues: [
        'none', 'prinner', 'fonte', 'monte', 'romanesca', 'meyer',
        'quiescenza', 'do_re_mi', 'cadential_64', 'lament_bass',
      ],
      defaultValue: 'none',
      constraintType: 'schema',
      hard: false,
      weight: 0.7,
      description: 'Currently selected schema for preview',
    },
    {
      id: 'previewKey',
      label: 'Preview key',
      type: 'enum',
      enumValues: ['c', 'd', 'e', 'f', 'g', 'a', 'b'],
      defaultValue: 'c',
      constraintType: 'key',
      hard: false,
      weight: 0.5,
      description: 'Key to render the schema skeleton in',
    },
    {
      id: 'showBass',
      label: 'Show bass line',
      type: 'boolean',
      defaultValue: true,
      constraintType: 'schema',
      hard: false,
      weight: 0.3,
      description: 'Display the bass line skeleton',
    },
    {
      id: 'showUpper',
      label: 'Show upper voice',
      type: 'boolean',
      defaultValue: true,
      constraintType: 'schema',
      hard: false,
      weight: 0.3,
      description: 'Display the upper voice skeleton',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    const schema = getParam<GalantSchemaName | 'none'>(state, 'selectedSchema');
    if (schema && schema !== 'none') {
      return [{ type: 'schema', hard: false, weight: 0.7, schema: schema as GalantSchemaName }];
    }
    return [];
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    const constraints = this.extractConstraints(state);
    if (constraints.length === 0) return spec;
    return withConstraints(withoutConstraintType(spec, 'schema'), ...constraints);
  },
};

// ============================================================================
// C303 — SCHEMA TO CHORDS CARD
// ============================================================================

export const SCHEMA_TO_CHORDS_CARD: TheoryCardDef = {
  cardId: 'schema:to_chords',
  displayName: 'Schema to Chords',
  description: 'Generate chord progression from a galant schema in the current key',
  category: 'generation',
  cultures: ['western', 'hybrid'],
  params: [
    {
      id: 'schema',
      label: 'Schema',
      type: 'enum',
      enumValues: [
        'prinner', 'fonte', 'monte', 'romanesca', 'meyer',
        'quiescenza', 'do_re_mi', 'cadential_64', 'lament_bass',
      ],
      defaultValue: 'prinner',
      constraintType: 'schema',
      hard: false,
      weight: 0.8,
      description: 'Schema to realize as chords',
    },
    {
      id: 'voicingStyle',
      label: 'Voicing style',
      type: 'enum',
      enumValues: ['close', 'open', 'keyboard', 'guitar'],
      defaultValue: 'close',
      constraintType: 'style',
      hard: false,
      weight: 0.5,
      description: 'How to voice the resulting chords',
    },
    {
      id: 'addExtensions',
      label: 'Add extensions',
      type: 'boolean',
      defaultValue: false,
      constraintType: 'style',
      hard: false,
      weight: 0.3,
      description: 'Add 7ths and extensions where appropriate',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    const schema = getParam<GalantSchemaName>(state, 'schema');
    return [{ type: 'schema', hard: false, weight: 0.8, schema: schema ?? 'prinner' }];
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(withoutConstraintType(spec, 'schema'), ...this.extractConstraints(state));
  },
};

// ============================================================================
// C304 — SCHEMA TO BASS CARD
// ============================================================================

export const SCHEMA_TO_BASS_CARD: TheoryCardDef = {
  cardId: 'schema:to_bass',
  displayName: 'Schema to Bass',
  description: 'Generate bassline events from a galant schema',
  category: 'generation',
  cultures: ['western', 'hybrid'],
  params: [
    {
      id: 'schema',
      label: 'Schema',
      type: 'enum',
      enumValues: [
        'prinner', 'fonte', 'monte', 'romanesca', 'meyer',
        'quiescenza', 'do_re_mi', 'lament_bass',
      ],
      defaultValue: 'prinner',
      constraintType: 'schema',
      hard: false,
      weight: 0.8,
      description: 'Schema to realize as bass line',
    },
    {
      id: 'octave',
      label: 'Octave',
      type: 'range',
      range: { min: 1, max: 4, step: 1 },
      defaultValue: 2,
      constraintType: 'style',
      hard: false,
      weight: 0.4,
      description: 'Bass register (octave)',
    },
    {
      id: 'rhythm',
      label: 'Rhythm style',
      type: 'enum',
      enumValues: ['whole', 'half', 'walking', 'alberti'],
      defaultValue: 'half',
      constraintType: 'style',
      hard: false,
      weight: 0.5,
      description: 'Rhythmic treatment of bass notes',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    const schema = getParam<GalantSchemaName>(state, 'schema');
    return [{ type: 'schema', hard: false, weight: 0.8, schema: schema ?? 'prinner' }];
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(withoutConstraintType(spec, 'schema'), ...this.extractConstraints(state));
  },
};

// ============================================================================
// C305 — SCHEMA TO MELODY CARD
// ============================================================================

export const SCHEMA_TO_MELODY_CARD: TheoryCardDef = {
  cardId: 'schema:to_melody',
  displayName: 'Schema to Melody',
  description: 'Generate upper-voice melody from a galant schema',
  category: 'generation',
  cultures: ['western', 'hybrid'],
  params: [
    {
      id: 'schema',
      label: 'Schema',
      type: 'enum',
      enumValues: [
        'prinner', 'fonte', 'monte', 'romanesca', 'meyer',
        'do_re_mi',
      ],
      defaultValue: 'prinner',
      constraintType: 'schema',
      hard: false,
      weight: 0.8,
      description: 'Schema to realize as melody',
    },
    {
      id: 'elaboration',
      label: 'Elaboration level',
      type: 'range',
      range: { min: 0, max: 3, step: 1 },
      defaultValue: 1,
      constraintType: 'phrase_density',
      hard: false,
      weight: 0.5,
      description: '0=skeletal, 1=passing tones, 2=diminutions, 3=ornamented',
    },
    {
      id: 'range',
      label: 'Range',
      type: 'enum',
      enumValues: ['narrow', 'medium', 'wide'],
      defaultValue: 'medium',
      constraintType: 'style',
      hard: false,
      weight: 0.4,
      description: 'Melodic range constraint',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    const schema = getParam<GalantSchemaName>(state, 'schema');
    const elaboration = getParam<number>(state, 'elaboration') ?? 1;
    const density = elaboration === 0 ? 'sparse' : elaboration === 1 ? 'medium' : 'dense';
    return [
      { type: 'schema', hard: false, weight: 0.8, schema: schema ?? 'prinner' },
      { type: 'phrase_density', hard: false, weight: 0.5, density },
    ];
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(
      withoutConstraintType(withoutConstraintType(spec, 'schema'), 'phrase_density'),
      ...this.extractConstraints(state)
    );
  },
};

// ============================================================================
// C306 — SCHEMA VARIATION CARD
// ============================================================================

export type SchemaVariationOp = 'transpose' | 'invert' | 'sequence' | 'expand' | 'compress' | 'diminish' | 'augment';

export const SCHEMA_VARIATION_CARD: TheoryCardDef = {
  cardId: 'schema:variation',
  displayName: 'Schema Variation',
  description: 'Apply variation operators to an existing schema',
  category: 'generation',
  cultures: ['western', 'hybrid'],
  params: [
    {
      id: 'sourceSchema',
      label: 'Source schema',
      type: 'enum',
      enumValues: [
        'prinner', 'fonte', 'monte', 'romanesca', 'meyer',
      ],
      defaultValue: 'prinner',
      constraintType: 'schema',
      hard: false,
      weight: 0.7,
      description: 'Base schema to apply variations to',
    },
    {
      id: 'operation',
      label: 'Variation op',
      type: 'enum',
      enumValues: ['transpose', 'invert', 'sequence', 'expand', 'compress', 'diminish', 'augment'],
      defaultValue: 'sequence',
      constraintType: 'schema',
      hard: false,
      weight: 0.6,
      description: 'Type of variation to apply',
    },
    {
      id: 'amount',
      label: 'Amount',
      type: 'range',
      range: { min: 1, max: 4, step: 1 },
      defaultValue: 1,
      constraintType: 'schema',
      hard: false,
      weight: 0.4,
      description: 'Degree of variation (steps, repetitions, etc.)',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    const schema = getParam<GalantSchemaName>(state, 'sourceSchema');
    return [{ type: 'schema', hard: false, weight: 0.7, schema: schema ?? 'prinner' }];
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(withoutConstraintType(spec, 'schema'), ...this.extractConstraints(state));
  },
};

// ============================================================================
// C307 — SCHEMA CONSTRAINT CARD
// ============================================================================

export const SCHEMA_CONSTRAINT_CARD: TheoryCardDef = {
  cardId: 'schema:constraint',
  displayName: 'Schema Constraint',
  description: 'Bind phrase generator to specific schema patterns',
  category: 'theory',
  cultures: ['western', 'hybrid'],
  params: [
    {
      id: 'schemaList',
      label: 'Allowed schemata',
      type: 'enum',
      enumValues: [
        'any', 'openings_only', 'continuations_only', 'cadentials_only',
        'prinner', 'fonte', 'monte', 'romanesca',
      ],
      defaultValue: 'any',
      constraintType: 'schema',
      hard: false,
      weight: 0.8,
      description: 'Which schemata the generator may use',
    },
    {
      id: 'hardConstraint',
      label: 'Hard constraint',
      type: 'boolean',
      defaultValue: false,
      constraintType: 'schema',
      hard: true,
      weight: 1.0,
      description: 'If true, generator must use specified schema(ta)',
    },
    {
      id: 'chainLength',
      label: 'Chain length',
      type: 'range',
      range: { min: 1, max: 4, step: 1 },
      defaultValue: 2,
      constraintType: 'schema',
      hard: false,
      weight: 0.5,
      description: 'Number of schemata to chain in sequence',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    const schema = getParam<string>(state, 'schemaList');
    const hard = getParam<boolean>(state, 'hardConstraint') ?? false;
    if (schema === 'any') return [];
    // Map category selections to first schema of that category
    const schemaMap: Record<string, GalantSchemaName> = {
      'openings_only': 'romanesca',
      'continuations_only': 'prinner',
      'cadentials_only': 'cadential_64',
    };
    const mappedSchema = schemaMap[schema as keyof typeof schemaMap];
    const actualSchema: GalantSchemaName = mappedSchema !== undefined ? mappedSchema : (schema as GalantSchemaName);
    return [{ type: 'schema', hard, weight: hard ? 1.0 : 0.8, schema: actualSchema }];
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    const constraints = this.extractConstraints(state);
    if (constraints.length === 0) return spec;
    return withConstraints(withoutConstraintType(spec, 'schema'), ...constraints);
  },
};

// ============================================================================
// C1162 — PARENT SCALE CARD (chord → parent scale lookup)
// ============================================================================

/**
 * C1162: ParentScaleCard — given a chord, look up its parent Lydian scale(s).
 * Based on George Russell's concept that every chord implies a parent scale.
 */
export const PARENT_SCALE_CARD: TheoryCardDef = {
  cardId: 'theory:parent_scale',
  displayName: 'Parent Scale',
  description: 'Chord → parent Lydian scale lookup with alternatives',
  category: 'theory',
  cultures: ['western', 'hybrid'],
  params: [
    {
      id: 'chordRoot',
      label: 'Chord Root',
      type: 'enum',
      enumValues: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'],
      defaultValue: 'C',
      constraintType: 'key',
      hard: false,
      weight: 0.6,
      description: 'Root of the chord to analyze',
    },
    {
      id: 'chordQuality',
      label: 'Chord Quality',
      type: 'enum',
      enumValues: ['major7', 'minor7', 'dominant7', 'half_diminished7', 'diminished7', 'augmented', 'sus4', 'minor_major7'],
      defaultValue: 'major7',
      constraintType: 'style',
      hard: false,
      weight: 0.5,
      description: 'Quality of the chord to find parent scale for',
    },
    {
      id: 'showAlternatives',
      label: 'Show Alternatives',
      type: 'boolean',
      defaultValue: true,
      constraintType: 'style',
      hard: false,
      weight: 0.3,
      description: 'Show alternative parent scales (not just primary)',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    const quality = getParam<string>(state, 'chordQuality');
    // Map chord quality to its primary parent Lydian scale
    const parentScaleMap: Record<string, ModeName> = {
      'major7': 'lydian',        // Cmaj7 → C Lydian
      'dominant7': 'mixolydian', // C7 → C Lydian b7
      'minor7': 'dorian',       // Cm7 → C Dorian (parent = Bb Lydian)
      'half_diminished7': 'locrian', // Cm7b5 → C Locrian
      'diminished7': 'octatonic',
      'augmented': 'whole_tone',
      'sus4': 'mixolydian',
      'minor_major7': 'melodic_minor',
    };
    const mode = parentScaleMap[quality ?? 'major7'] ?? 'lydian';
    const rootStr = getParam<string>(state, 'chordRoot') ?? 'C';
    const keyMap: Record<string, RootName> = {
      'C': 'c', 'Db': 'dflat', 'D': 'd', 'Eb': 'eflat', 'E': 'e', 'F': 'f',
      'Gb': 'gflat', 'G': 'g', 'Ab': 'aflat', 'A': 'a', 'Bb': 'bflat', 'B': 'b'
    };
    return [{ type: 'key', hard: false, weight: 0.7, root: keyMap[rootStr] ?? 'c', mode }];
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(
      withoutConstraintType(spec, 'key'),
      ...this.extractConstraints(state)
    );
  },
};

// ============================================================================
// C1164 — CHORD-SCALE UNITY CARD
// ============================================================================

/**
 * C1164: ChordScaleUnityCard — shows chord and scale as a unified entity.
 * In LCC, a chord IS its parent scale; this card makes that unity visible.
 */
export const CHORD_SCALE_UNITY_CARD: TheoryCardDef = {
  cardId: 'theory:chord_scale_unity',
  displayName: 'Chord-Scale Unity',
  description: 'View chord and scale as one unified entity (LCC principle)',
  category: 'theory',
  cultures: ['western', 'hybrid'],
  params: [
    {
      id: 'unityRoot',
      label: 'Root',
      type: 'enum',
      enumValues: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'],
      defaultValue: 'C',
      constraintType: 'key',
      hard: false,
      weight: 0.7,
      description: 'Root of the chord-scale entity',
    },
    {
      id: 'unityScale',
      label: 'Scale Type',
      type: 'enum',
      enumValues: ['lydian', 'lydian_augmented', 'lydian_diminished', 'lydian_b7', 'auxiliary_augmented', 'auxiliary_diminished'],
      defaultValue: 'lydian',
      constraintType: 'key',
      hard: false,
      weight: 0.6,
      description: 'Scale type in the Lydian Chromatic order',
    },
    {
      id: 'voicingType',
      label: 'Voicing',
      type: 'enum',
      enumValues: ['close', 'open', 'quartal', 'cluster'],
      defaultValue: 'close',
      constraintType: 'style',
      hard: false,
      weight: 0.3,
      description: 'How to voice the chord portion of the unity',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    const scaleType = getParam<string>(state, 'unityScale') ?? 'lydian';
    const rootStr = getParam<string>(state, 'unityRoot') ?? 'C';
    const keyMap: Record<string, RootName> = {
      'C': 'c', 'Db': 'dflat', 'D': 'd', 'Eb': 'eflat', 'E': 'e', 'F': 'f',
      'Gb': 'gflat', 'G': 'g', 'Ab': 'aflat', 'A': 'a', 'Bb': 'bflat', 'B': 'b'
    };
    const modeMap: Record<string, ModeName> = {
      'lydian': 'lydian', 'lydian_augmented': 'lydian', 'lydian_diminished': 'lydian',
      'lydian_b7': 'mixolydian', 'auxiliary_augmented': 'whole_tone', 'auxiliary_diminished': 'octatonic',
    };
    return [
      { type: 'key', hard: false, weight: 0.7, root: keyMap[rootStr] ?? 'c', mode: modeMap[scaleType] ?? 'lydian' },
      { type: 'style', hard: false, weight: 0.4, style: 'jazz' },
    ];
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(
      withStyle(withoutConstraintType(spec, 'key'), 'jazz'),
      ...this.extractConstraints(state)
    );
  },
};

// ============================================================================
// C1165 — UPPER STRUCTURE CARD
// ============================================================================

/**
 * C1165: UpperStructureCard — polychord voicing builder.
 * Upper structure triads overlay a basic chord to create tensions.
 */
export const UPPER_STRUCTURE_CARD: TheoryCardDef = {
  cardId: 'theory:upper_structure',
  displayName: 'Upper Structure',
  description: 'Polychord voicing builder: overlay triads for rich tensions',
  category: 'theory',
  cultures: ['western', 'hybrid'],
  params: [
    {
      id: 'baseChordRoot',
      label: 'Base Root',
      type: 'enum',
      enumValues: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'],
      defaultValue: 'C',
      constraintType: 'key',
      hard: false,
      weight: 0.6,
      description: 'Root of the base chord (typically dominant 7th)',
    },
    {
      id: 'baseQuality',
      label: 'Base Quality',
      type: 'enum',
      enumValues: ['dominant7', 'minor7', 'major7'],
      defaultValue: 'dominant7',
      constraintType: 'style',
      hard: false,
      weight: 0.4,
      description: 'Quality of the base chord',
    },
    {
      id: 'upperTriad',
      label: 'Upper Triad',
      type: 'enum',
      enumValues: ['II_major', 'bIII_major', 'bV_major', 'bVI_major', 'VI_major', 'bII_major'],
      defaultValue: 'II_major',
      constraintType: 'style',
      hard: false,
      weight: 0.5,
      description: 'Upper structure triad (relative to base root)',
    },
    {
      id: 'spread',
      label: 'Spread',
      type: 'enum',
      enumValues: ['compact', 'spread', 'wide'],
      defaultValue: 'spread',
      constraintType: 'style',
      hard: false,
      weight: 0.2,
      description: 'How widely spaced the upper structure voicing should be',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    const rootStr = getParam<string>(state, 'baseChordRoot') ?? 'C';
    const keyMap: Record<string, RootName> = {
      'C': 'c', 'Db': 'dflat', 'D': 'd', 'Eb': 'eflat', 'E': 'e', 'F': 'f',
      'Gb': 'gflat', 'G': 'g', 'Ab': 'aflat', 'A': 'a', 'Bb': 'bflat', 'B': 'b'
    };
    return [
      { type: 'key', hard: false, weight: 0.6, root: keyMap[rootStr] ?? 'c', mode: 'mixolydian' },
      { type: 'style', hard: false, weight: 0.5, style: 'jazz' },
    ];
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(
      withStyle(spec, 'jazz'),
      ...this.extractConstraints(state)
    );
  },
};

// ============================================================================
// C1163 — TONAL GRAVITY VISUALIZER CARD
// ============================================================================

/**
 * C1163: TonalGravityVisualizerCard — circular display of pitch gravity.
 * Uses LCC tonal gravity to show consonance/dissonance relationships
 * around the circle of fifths in Lydian Chromatic order.
 */
export const TONAL_GRAVITY_VISUALIZER_CARD: TheoryCardDef = {
  cardId: 'theory:tonal_gravity_visualizer',
  displayName: 'Tonal Gravity',
  description: 'Visualize tonal gravity on a circular display (LCC-based)',
  category: 'theory',
  cultures: ['western', 'hybrid'],
  params: [
    {
      id: 'tonic',
      label: 'Tonic',
      type: 'enum',
      enumValues: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'],
      defaultValue: 'C',
      constraintType: 'key',
      hard: false,
      weight: 0.8,
      description: 'Center tonic for gravity visualization',
    },
    {
      id: 'displayMode',
      label: 'Display',
      type: 'enum',
      enumValues: ['circle_of_fifths', 'chromatic_order', 'lydian_order'],
      defaultValue: 'lydian_order',
      constraintType: 'style',
      hard: false,
      weight: 0.2,
      description: 'Pitch ordering on the circular display',
    },
    {
      id: 'gravityType',
      label: 'Gravity',
      type: 'enum',
      enumValues: ['vertical', 'horizontal', 'supra_vertical'],
      defaultValue: 'vertical',
      constraintType: 'style',
      hard: false,
      weight: 0.3,
      description: 'Type of tonal gravity to display',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    const rootStr = getParam<string>(state, 'tonic') ?? 'C';
    const keyMap: Record<string, RootName> = {
      'C': 'c', 'Db': 'dflat', 'D': 'd', 'Eb': 'eflat', 'E': 'e', 'F': 'f',
      'Gb': 'gflat', 'G': 'g', 'Ab': 'aflat', 'A': 'a', 'Bb': 'bflat', 'B': 'b'
    };
    return [
      { type: 'key', hard: false, weight: 0.8, root: keyMap[rootStr] ?? 'c', mode: 'lydian' },
    ];
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(spec, ...this.extractConstraints(state));
  },
};

// ============================================================================
// C1342 — REHARMONIZATION CARD
// ============================================================================

/**
 * C1342: ReharmonizationCard — technique picker for chord reharmonization.
 * Supports tritone subs, Coltrane changes, modal interchange, and more.
 */
export const REHARMONIZATION_CARD: TheoryCardDef = {
  cardId: 'theory:reharmonization',
  displayName: 'Reharmonization',
  description: 'Chord reharmonization technique picker and preview',
  category: 'theory',
  cultures: ['western', 'hybrid'],
  params: [
    {
      id: 'technique',
      label: 'Technique',
      type: 'enum',
      enumValues: ['tritone_sub', 'coltrane_changes', 'modal_interchange', 'chromatic_mediant', 'backdoor', 'deceptive'],
      defaultValue: 'tritone_sub',
      constraintType: 'style',
      hard: false,
      weight: 0.7,
      description: 'Reharmonization technique to apply',
    },
    {
      id: 'preserveGuideTones',
      label: 'Preserve Guides',
      type: 'boolean',
      defaultValue: true,
      constraintType: 'style',
      hard: false,
      weight: 0.6,
      description: 'Ensure 3rd and 7th are preserved across substitution',
    },
    {
      id: 'melodyCheck',
      label: 'Melody Check',
      type: 'boolean',
      defaultValue: true,
      constraintType: 'style',
      hard: false,
      weight: 0.5,
      description: 'Reject reharmonizations that clash with melody',
    },
  ],
  extractConstraints(_state: TheoryCardState): MusicConstraint[] {
    return [{ type: 'style', hard: false, weight: 0.7, style: 'jazz' }];
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(withStyle(spec, 'jazz'), ...this.extractConstraints(state));
  },
};

// ============================================================================
// C1343 — TRITONE SUB CARD
// ============================================================================

/**
 * C1343: TritoneSubCard — one-click tritone substitution insertion.
 */
export const TRITONE_SUB_CARD: TheoryCardDef = {
  cardId: 'theory:tritone_sub',
  displayName: 'Tritone Sub',
  description: 'One-click tritone substitution: replaces V7 with bII7',
  category: 'theory',
  cultures: ['western', 'hybrid'],
  params: [
    {
      id: 'targetChord',
      label: 'Target',
      type: 'enum',
      enumValues: ['V7', 'II7', 'VI7', 'III7', 'all_dominants'],
      defaultValue: 'V7',
      constraintType: 'style',
      hard: false,
      weight: 0.8,
      description: 'Which dominant chord(s) to apply tritone sub to',
    },
    {
      id: 'approachType',
      label: 'Approach',
      type: 'enum',
      enumValues: ['direct', 'chromatic_approach', 'diminished_passing'],
      defaultValue: 'direct',
      constraintType: 'style',
      hard: false,
      weight: 0.4,
      description: 'How to approach the tritone sub chord',
    },
  ],
  extractConstraints(_state: TheoryCardState): MusicConstraint[] {
    return [{ type: 'style', hard: false, weight: 0.8, style: 'jazz' }];
  },
  applyToSpec(_state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(withStyle(spec, 'jazz'), ...this.extractConstraints(_state));
  },
};

// ============================================================================
// C1344 — COLTRANE CHANGES CARD
// ============================================================================

/**
 * C1344: ColtraneChangesCard — cycle substitution builder.
 * Based on John Coltrane's "Giant Steps" harmonic approach.
 */
export const COLTRANE_CHANGES_CARD: TheoryCardDef = {
  cardId: 'theory:coltrane_changes',
  displayName: 'Coltrane Changes',
  description: 'Cycle substitution builder: major-third axis movement',
  category: 'theory',
  cultures: ['western', 'hybrid'],
  params: [
    {
      id: 'axisType',
      label: 'Axis',
      type: 'enum',
      enumValues: ['major_third', 'minor_third', 'augmented'],
      defaultValue: 'major_third',
      constraintType: 'style',
      hard: false,
      weight: 0.7,
      description: 'Interval cycle for substitution (major 3rd = Giant Steps)',
    },
    {
      id: 'density',
      label: 'Density',
      type: 'enum',
      enumValues: ['sparse', 'standard', 'dense'],
      defaultValue: 'standard',
      constraintType: 'harmonic_rhythm',
      hard: false,
      weight: 0.5,
      description: 'How many substitution chords per original chord',
    },
    {
      id: 'startingKey',
      label: 'Starting Key',
      type: 'enum',
      enumValues: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'],
      defaultValue: 'C',
      constraintType: 'key',
      hard: false,
      weight: 0.6,
      description: 'Starting key for the Coltrane cycle',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    const rootStr = getParam<string>(state, 'startingKey') ?? 'C';
    const keyMap: Record<string, RootName> = {
      'C': 'c', 'Db': 'dflat', 'D': 'd', 'Eb': 'eflat', 'E': 'e', 'F': 'f',
      'Gb': 'gflat', 'G': 'g', 'Ab': 'aflat', 'A': 'a', 'Bb': 'bflat', 'B': 'b'
    };
    return [
      { type: 'key', hard: false, weight: 0.6, root: keyMap[rootStr] ?? 'c', mode: 'major' },
      { type: 'style', hard: false, weight: 0.7, style: 'jazz' },
    ];
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(withStyle(spec, 'jazz'), ...this.extractConstraints(state));
  },
};

// ============================================================================
// C1391 — BEBOP SCALE CARD
// ============================================================================

/**
 * C1391: BebopScaleCard — adds chromatic passing tone to 7-note scales.
 */
export const BEBOP_SCALE_CARD: TheoryCardDef = {
  cardId: 'theory:bebop_scale',
  displayName: 'Bebop Scale',
  description: 'Bebop scale types: adds passing tone for strong-beat chord tones',
  category: 'theory',
  cultures: ['western', 'hybrid'],
  params: [
    {
      id: 'bebopType',
      label: 'Type',
      type: 'enum',
      enumValues: ['dominant', 'major', 'dorian', 'melodic_minor'],
      defaultValue: 'dominant',
      constraintType: 'key',
      hard: false,
      weight: 0.7,
      description: 'Bebop scale type (determines passing tone placement)',
    },
    {
      id: 'bebopRoot',
      label: 'Root',
      type: 'enum',
      enumValues: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'],
      defaultValue: 'C',
      constraintType: 'key',
      hard: false,
      weight: 0.6,
      description: 'Root note of the bebop scale',
    },
    {
      id: 'practiceMode',
      label: 'Practice',
      type: 'enum',
      enumValues: ['ascending', 'descending', 'patterns', 'enclosures'],
      defaultValue: 'ascending',
      constraintType: 'style',
      hard: false,
      weight: 0.3,
      description: 'Practice mode for bebop scale exercises',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    const rootStr = getParam<string>(state, 'bebopRoot') ?? 'C';
    const keyMap: Record<string, RootName> = {
      'C': 'c', 'Db': 'dflat', 'D': 'd', 'Eb': 'eflat', 'E': 'e', 'F': 'f',
      'Gb': 'gflat', 'G': 'g', 'Ab': 'aflat', 'A': 'a', 'Bb': 'bflat', 'B': 'b'
    };
    const bebopType = getParam<string>(state, 'bebopType') ?? 'dominant';
    const modeMap: Record<string, ModeName> = {
      'dominant': 'mixolydian', 'major': 'ionian', 'dorian': 'dorian', 'melodic_minor': 'melodic_minor',
    };
    return [
      { type: 'key', hard: false, weight: 0.7, root: keyMap[rootStr] ?? 'c', mode: modeMap[bebopType] ?? 'mixolydian' },
      { type: 'style', hard: false, weight: 0.6, style: 'jazz' },
    ];
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(
      withStyle(withoutConstraintType(spec, 'key'), 'jazz'),
      ...this.extractConstraints(state)
    );
  },
};

// ============================================================================
// C1392 — ENCLOSURE CARD
// ============================================================================

/**
 * C1392: EnclosureCard — chromatic enclosure pattern generator.
 */
export const ENCLOSURE_CARD: TheoryCardDef = {
  cardId: 'theory:enclosure',
  displayName: 'Enclosure',
  description: 'Chromatic enclosure patterns: approach target notes from above and below',
  category: 'theory',
  cultures: ['western', 'hybrid'],
  params: [
    {
      id: 'enclosureType',
      label: 'Type',
      type: 'enum',
      enumValues: ['chromatic', 'diatonic', 'double_chromatic', 'delayed'],
      defaultValue: 'chromatic',
      constraintType: 'style',
      hard: false,
      weight: 0.6,
      description: 'Enclosure approach type',
    },
    {
      id: 'targetNotes',
      label: 'Targets',
      type: 'enum',
      enumValues: ['chord_tones', 'guide_tones', 'tensions', 'all_scale'],
      defaultValue: 'chord_tones',
      constraintType: 'style',
      hard: false,
      weight: 0.5,
      description: 'Which notes to target with enclosures',
    },
    {
      id: 'rhythmicPlacement',
      label: 'Placement',
      type: 'enum',
      enumValues: ['on_beat', 'off_beat', 'anticipation'],
      defaultValue: 'on_beat',
      constraintType: 'style',
      hard: false,
      weight: 0.4,
      description: 'Where the target note lands rhythmically',
    },
  ],
  extractConstraints(_state: TheoryCardState): MusicConstraint[] {
    return [{ type: 'style', hard: false, weight: 0.6, style: 'jazz' }];
  },
  applyToSpec(_state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(withStyle(spec, 'jazz'), ...this.extractConstraints(_state));
  },
};

// ============================================================================
// C1393 — DIGITAL PATTERN CARD
// ============================================================================

/**
 * C1393: DigitalPatternCard — "1235", "1357" style bebop digital patterns.
 */
export const DIGITAL_PATTERN_CARD: TheoryCardDef = {
  cardId: 'theory:digital_pattern',
  displayName: 'Digital Pattern',
  description: 'Bebop digital patterns (1235, 1357) over chord changes',
  category: 'theory',
  cultures: ['western', 'hybrid'],
  params: [
    {
      id: 'pattern',
      label: 'Pattern',
      type: 'enum',
      enumValues: ['1235', '1357', '3579', '5713', '7135', 'custom'],
      defaultValue: '1235',
      constraintType: 'style',
      hard: false,
      weight: 0.6,
      description: 'Scale degree pattern to apply over each chord',
    },
    {
      id: 'direction',
      label: 'Direction',
      type: 'enum',
      enumValues: ['ascending', 'descending', 'alternating', 'random'],
      defaultValue: 'ascending',
      constraintType: 'style',
      hard: false,
      weight: 0.3,
      description: 'Directional tendency for the pattern sequence',
    },
  ],
  extractConstraints(_state: TheoryCardState): MusicConstraint[] {
    return [{ type: 'style', hard: false, weight: 0.6, style: 'jazz' }];
  },
  applyToSpec(_state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(withStyle(spec, 'jazz'), ...this.extractConstraints(_state));
  },
};

// ============================================================================
// C1394 — GUIDE TONE CARD
// ============================================================================

/**
 * C1394: GuideToneCard — guide tone line generator for smooth voice leading.
 */
export const GUIDE_TONE_CARD: TheoryCardDef = {
  cardId: 'theory:guide_tone',
  displayName: 'Guide Tone',
  description: 'Guide tone line generator: 3rds and 7ths connected by step',
  category: 'theory',
  cultures: ['western', 'hybrid'],
  params: [
    {
      id: 'voiceCount',
      label: 'Voices',
      type: 'enum',
      enumValues: ['1', '2'],
      defaultValue: '2',
      constraintType: 'style',
      hard: false,
      weight: 0.5,
      description: 'Number of guide tone voices (1 = 3rds only, 2 = 3rds + 7ths)',
    },
    {
      id: 'connectionType',
      label: 'Connection',
      type: 'enum',
      enumValues: ['step', 'common_tone', 'chromatic'],
      defaultValue: 'step',
      constraintType: 'style',
      hard: false,
      weight: 0.6,
      description: 'How guide tones connect between chords',
    },
    {
      id: 'embellishment',
      label: 'Embellish',
      type: 'enum',
      enumValues: ['none', 'passing', 'neighbor', 'enclosure'],
      defaultValue: 'none',
      constraintType: 'style',
      hard: false,
      weight: 0.3,
      description: 'Embellishment type between guide tones',
    },
  ],
  extractConstraints(_state: TheoryCardState): MusicConstraint[] {
    return [{ type: 'style', hard: false, weight: 0.6, style: 'jazz' }];
  },
  applyToSpec(_state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(withStyle(spec, 'jazz'), ...this.extractConstraints(_state));
  },
};

// ============================================================================
// C1395 — LICK LIBRARY CARD
// ============================================================================

/**
 * C1395: LickLibraryCard — browse, search, and insert jazz vocabulary.
 */
export const LICK_LIBRARY_CARD: TheoryCardDef = {
  cardId: 'theory:lick_library',
  displayName: 'Lick Library',
  description: 'Browse and insert jazz vocabulary: ii-V-I licks, turnarounds, tags',
  category: 'theory',
  cultures: ['western', 'hybrid'],
  params: [
    {
      id: 'lickCategory',
      label: 'Category',
      type: 'enum',
      enumValues: ['ii_V_I', 'turnaround', 'blues', 'rhythm_changes', 'minor_ii_V', 'modal'],
      defaultValue: 'ii_V_I',
      constraintType: 'style',
      hard: false,
      weight: 0.5,
      description: 'Category of jazz vocabulary to browse',
    },
    {
      id: 'difficulty',
      label: 'Difficulty',
      type: 'enum',
      enumValues: ['beginner', 'intermediate', 'advanced'],
      defaultValue: 'intermediate',
      constraintType: 'style',
      hard: false,
      weight: 0.3,
      description: 'Difficulty level of the vocabulary',
    },
    {
      id: 'transposeToKey',
      label: 'Transpose To',
      type: 'enum',
      enumValues: ['original', 'C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'G', 'D', 'A', 'E', 'B'],
      defaultValue: 'original',
      constraintType: 'key',
      hard: false,
      weight: 0.4,
      description: 'Transpose lick to this key (or keep original)',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    const constraints: MusicConstraint[] = [
      { type: 'style', hard: false, weight: 0.5, style: 'jazz' },
    ];
    const key = getParam<string>(state, 'transposeToKey');
    if (key && key !== 'original') {
      const keyMap: Record<string, RootName> = {
        'C': 'c', 'Db': 'dflat', 'D': 'd', 'Eb': 'eflat', 'E': 'e', 'F': 'f',
        'Gb': 'gflat', 'G': 'g', 'Ab': 'aflat', 'A': 'a', 'Bb': 'bflat', 'B': 'b'
      };
      constraints.push({ type: 'key', hard: false, weight: 0.4, root: keyMap[key] ?? 'c', mode: 'major' });
    }
    return constraints;
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(withStyle(spec, 'jazz'), ...this.extractConstraints(state));
  },
};

// ============================================================================
// C735 — SET BUILDER CARD (Celtic tune set management)
// ============================================================================

/**
 * C735: SetBuilderCard — chain multiple Celtic tunes into sets with
 * compatible keys, modes, and tempos.
 */
// ============================================================================
// C1396 — MOTIF DEVELOPER CARD
// ============================================================================

/**
 * C936: FillBuilderCard — drum fills, melodic fills, risers.
 * Wraps generate_fill/4 Prolog predicate.
 */
export const FILL_BUILDER_CARD: TheoryCardDef = {
  cardId: 'theory:fill_builder',
  displayName: 'Fill Builder',
  description: 'Generate drum fills, melodic fills, and risers for transitions',
  category: 'theory',
  cultures: ['western', 'hybrid'],
  params: [
    {
      id: 'fillType',
      label: 'Type',
      type: 'enum',
      enumValues: ['drum_fill', 'melodic_fill', 'riser_fill'],
      defaultValue: 'drum_fill',
      constraintType: 'style',
      hard: false,
      weight: 0.6,
      description: 'Type of fill to generate',
    },
    {
      id: 'intensity',
      label: 'Intensity',
      type: 'enum',
      enumValues: ['subtle', 'moderate', 'intense', 'dramatic'],
      defaultValue: 'moderate',
      constraintType: 'style',
      hard: false,
      weight: 0.5,
      description: 'Fill intensity level',
    },
    {
      id: 'duration',
      label: 'Duration',
      type: 'enum',
      enumValues: ['1_beat', '2_beats', '1_bar', '2_bars'],
      defaultValue: '1_bar',
      constraintType: 'style',
      hard: false,
      weight: 0.4,
      description: 'Duration of the fill',
    },
  ],
  extractConstraints(_state: TheoryCardState): MusicConstraint[] {
    return [{ type: 'style', hard: false, weight: 0.5, style: 'pop' }];
  },
  applyToSpec(_state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(spec, ...this.extractConstraints(_state));
  },
};

// ============================================================================
// C1396 — MOTIF DEVELOPER CARD
// ============================================================================

/**
 * C1396: MotifDeveloperCard — input motif, select technique, generate variations.
 */
export const MOTIF_DEVELOPER_CARD: TheoryCardDef = {
  cardId: 'theory:motif_developer',
  displayName: 'Motif Developer',
  description: 'Develop motifs using classical and jazz techniques',
  category: 'theory',
  cultures: ['western', 'hybrid'],
  params: [
    {
      id: 'technique',
      label: 'Technique',
      type: 'enum',
      enumValues: ['augmentation', 'diminution', 'inversion', 'retrograde', 'sequence', 'fragmentation', 'extension'],
      defaultValue: 'sequence',
      constraintType: 'style',
      hard: false,
      weight: 0.6,
      description: 'Motivic development technique to apply',
    },
    {
      id: 'intervalPreservation',
      label: 'Interval Pres.',
      type: 'enum',
      enumValues: ['exact', 'tonal', 'free'],
      defaultValue: 'tonal',
      constraintType: 'style',
      hard: false,
      weight: 0.5,
      description: 'How strictly to preserve intervals during transformation',
    },
  ],
  extractConstraints(_state: TheoryCardState): MusicConstraint[] {
    return [{ type: 'style', hard: false, weight: 0.5, style: 'jazz' }];
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(spec, ...this.extractConstraints(state));
  },
};

// ============================================================================
// C1397 — OUTSIDE CARD
// ============================================================================

/**
 * C1397: OutsideCard — controlled tension using outside playing.
 */
export const OUTSIDE_CARD: TheoryCardDef = {
  cardId: 'theory:outside',
  displayName: 'Outside Playing',
  description: 'Control chromatic tension: side-slipping, superimposition, bitonal',
  category: 'theory',
  cultures: ['western', 'hybrid'],
  params: [
    {
      id: 'outsideTechnique',
      label: 'Technique',
      type: 'enum',
      enumValues: ['side_slip', 'superimposition', 'bitonal', 'triad_pair', 'hexatonic'],
      defaultValue: 'side_slip',
      constraintType: 'style',
      hard: false,
      weight: 0.7,
      description: 'Type of outside technique',
    },
    {
      id: 'tensionLevel',
      label: 'Tension',
      type: 'enum',
      enumValues: ['mild', 'moderate', 'extreme'],
      defaultValue: 'moderate',
      constraintType: 'style',
      hard: false,
      weight: 0.5,
      description: 'How far outside to go',
    },
    {
      id: 'resolutionStrategy',
      label: 'Resolution',
      type: 'enum',
      enumValues: ['immediate', 'delayed', 'gradual', 'none'],
      defaultValue: 'delayed',
      constraintType: 'style',
      hard: false,
      weight: 0.4,
      description: 'How the outside passage resolves back inside',
    },
  ],
  extractConstraints(_state: TheoryCardState): MusicConstraint[] {
    return [{ type: 'style', hard: false, weight: 0.7, style: 'jazz' }];
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(withStyle(spec, 'jazz'), ...this.extractConstraints(state));
  },
};

// ============================================================================
// C735 — SET BUILDER CARD (Celtic tune set management)
// ============================================================================

export const SET_BUILDER_CARD: TheoryCardDef = {
  cardId: 'theory:set_builder',
  displayName: 'Set Builder',
  description: 'Chain tunes into sets with compatible keys, modes, and tempos',
  category: 'world',
  cultures: ['celtic', 'hybrid'],
  params: [
    {
      id: 'setSize',
      label: 'Set size',
      type: 'number',
      defaultValue: 3,
      constraintType: 'celtic_tune',
      hard: false,
      weight: 0.5,
      description: 'Number of tunes in the set (typically 2-4)',
    },
    {
      id: 'keyStrategy',
      label: 'Key strategy',
      type: 'enum',
      enumValues: ['same_key', 'related_keys', 'any_key'],
      defaultValue: 'related_keys',
      constraintType: 'key',
      hard: false,
      weight: 0.7,
      description: 'How to select keys for tunes in the set',
    },
    {
      id: 'tempoGradient',
      label: 'Tempo gradient',
      type: 'enum',
      enumValues: ['steady', 'gradual_increase', 'gradual_decrease'],
      defaultValue: 'gradual_increase',
      constraintType: 'tempo',
      hard: false,
      weight: 0.4,
      description: 'How tempo changes across tunes in the set',
    },
    {
      id: 'tuneTypeConsistency',
      label: 'Tune type',
      type: 'enum',
      enumValues: ['same_type', 'mixed'],
      defaultValue: 'same_type',
      constraintType: 'celtic_tune',
      hard: false,
      weight: 0.6,
      description: 'Whether all tunes should be the same type (e.g., all reels)',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    const constraints: MusicConstraint[] = [];
    const tuneTypeConsistency = getParam<string>(state, 'tuneTypeConsistency');
    if (tuneTypeConsistency === 'same_type') {
      constraints.push({
        type: 'celtic_tune',
        tuneType: 'reel',
        hard: false,
        weight: 0.6,
      });
    }
    constraints.push({
      type: 'culture',
      culture: 'celtic',
      hard: false,
      weight: 0.8,
    });
    return constraints;
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(
      withCulture(spec, 'celtic'),
      ...this.extractConstraints(state)
    );
  },
};

// ============================================================================
// C1161 — LYDIAN CHROMATIC CARD
// ============================================================================

/**
 * Lydian Chromatic Concept card.
 * Based on George Russell's Lydian Chromatic Concept of Tonal Organization.
 */
export const LYDIAN_CHROMATIC_CARD: TheoryCardDef = {
  cardId: 'theory:lydian_chromatic',
  displayName: 'Lydian Chromatic',
  description: 'George Russell\'s Lydian Chromatic Concept: tonal gravity, parent scales, chord-scale relationships',
  category: 'theory',
  cultures: ['western', 'hybrid'],
  params: [
    {
      id: 'lydianTonic',
      label: 'Lydian Tonic',
      type: 'enum',
      enumValues: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'],
      defaultValue: 'C',
      constraintType: 'key',
      hard: false,
      weight: 0.8,
      description: 'The Lydian tonic (primary consonance center)',
    },
    {
      id: 'principalScale',
      label: 'Principal Scale',
      type: 'enum',
      enumValues: [
        'lydian',
        'lydian_augmented',
        'lydian_diminished',
        'lydian_b7',
        'auxiliary_augmented',
        'auxiliary_diminished',
        'auxiliary_diminished_blues',
      ],
      defaultValue: 'lydian',
      constraintType: 'key',
      hard: false,
      weight: 0.7,
      description: 'Principal scale in the Lydian Chromatic order',
    },
    {
      id: 'gravityMode',
      label: 'Gravity Mode',
      type: 'enum',
      enumValues: ['vertical', 'horizontal', 'supra_vertical'],
      defaultValue: 'vertical',
      constraintType: 'style',
      hard: false,
      weight: 0.5,
      description: 'Vertical (static), horizontal (motion), supra-vertical (advanced)',
    },
  ],
  extractConstraints(state: TheoryCardState): MusicConstraint[] {
    const constraints: MusicConstraint[] = [];
    const tonic = getParam<string>(state, 'lydianTonic');
    if (tonic) {
      const keyMap: Record<string, RootName> = {
        'C': 'c', 'Db': 'dflat', 'D': 'd', 'Eb': 'eflat', 'E': 'e', 'F': 'f',
        'Gb': 'gflat', 'G': 'g', 'Ab': 'aflat', 'A': 'a', 'Bb': 'bflat', 'B': 'b'
      };
      const keyRoot = keyMap[tonic] ?? 'c';
      constraints.push({ type: 'key', hard: false, weight: 0.8, root: keyRoot, mode: 'lydian' });
    }
    const scale = getParam<string>(state, 'principalScale');
    if (scale) {
      const scaleMap: Record<string, ModeName> = {
        'lydian': 'lydian',
        'lydian_augmented': 'lydian',
        'lydian_diminished': 'lydian',
        'lydian_b7': 'mixolydian',
        'auxiliary_augmented': 'whole_tone',
        'auxiliary_diminished': 'octatonic',
        'auxiliary_diminished_blues': 'blues',
      };
      const modeName = scaleMap[scale] ?? 'lydian';
      constraints.push({
        type: 'key',
        hard: false,
        weight: 0.7,
        root: (getParam<string>(state, 'lydianTonic')?.toLowerCase() as RootName | undefined) ?? 'c',
        mode: modeName
      });
    }
    return constraints;
  },
  applyToSpec(state: TheoryCardState, spec: MusicSpec): MusicSpec {
    return withConstraints(
      withoutConstraintType(spec, 'key'),
      ...this.extractConstraints(state)
    );
  },
};

/**
 * LCC scale definitions for phrase generation
 */
export const LCC_SCALES: Record<string, readonly number[]> = {
  'lydian': [0, 2, 4, 6, 7, 9, 11],
  'lydian_augmented': [0, 2, 4, 6, 8, 9, 11],
  'lydian_diminished': [0, 2, 3, 6, 7, 9, 11],
  'lydian_b7': [0, 2, 4, 6, 7, 9, 10],
  'auxiliary_augmented': [0, 2, 4, 6, 8, 10],
  'auxiliary_diminished': [0, 2, 3, 5, 6, 8, 9, 11],
  'auxiliary_diminished_blues': [0, 2, 3, 4, 6, 7, 9, 10, 11],
};

/**
 * Get LCC scale intervals
 */
export function getLCCScaleIntervals(scaleName: string): readonly number[] {
  return LCC_SCALES[scaleName] ?? LCC_SCALES['lydian']!;
}

/**
 * Calculate tonal gravity level for a note relative to Lydian tonic.
 * Lower values = higher consonance (closer to the tonic in the Lydian Chromatic order).
 */
export function calculateTonalGravity(note: number, lydianTonic: number): number {
  const interval = ((note - lydianTonic) % 12 + 12) % 12;
  const gravityOrder: Record<number, number> = {
    0: 0, 7: 1, 2: 2, 9: 3, 4: 4, 11: 5, 6: 6,
    1: 7, 8: 8, 3: 9, 10: 10, 5: 11,
  };
  return gravityOrder[interval] ?? 12;
}

/**
 * Bebop scale definitions — 8-note scales adding a chromatic passing tone.
 */
export const BEBOP_SCALES: Record<string, readonly number[]> = {
  'dominant': [0, 2, 4, 5, 7, 9, 10, 11],       // Mixolydian + natural 7
  'major': [0, 2, 4, 5, 7, 8, 9, 11],            // Ionian + #5
  'dorian': [0, 2, 3, 4, 5, 7, 9, 10],           // Dorian + natural 3
  'melodic_minor': [0, 2, 3, 5, 7, 8, 9, 11],    // Mel. minor + b6
};

/**
 * Get bebop scale intervals
 */
export function getBebopScaleIntervals(bebopType: string): readonly number[] {
  return BEBOP_SCALES[bebopType] ?? BEBOP_SCALES['dominant']!;
}

/**
 * Upper structure triad intervals relative to chord root.
 * Each maps to the tensions it creates over a dominant 7th.
 */
export const UPPER_STRUCTURE_TRIADS: Record<string, { intervals: readonly number[]; tensions: string }> = {
  'II_major': { intervals: [2, 6, 9], tensions: '9, #11, 13' },
  'bIII_major': { intervals: [3, 7, 10], tensions: '#9, 5, b7' },
  'bV_major': { intervals: [6, 10, 1], tensions: '#11, b7, b9' },
  'bVI_major': { intervals: [8, 0, 3], tensions: '#5, root, #9' },
  'VI_major': { intervals: [9, 1, 4], tensions: '13, b9, 3' },
  'bII_major': { intervals: [1, 5, 8], tensions: 'b9, 4, #5' },
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
  // Film/trailer cards (C228-C229, C411, C412)
  TRAILER_BUILD_CARD,
  LEITMOTIF_LIBRARY_CARD,
  LEITMOTIF_MATCHER_CARD,
  FILM_LEITMOTIF_INTEGRATION_CARD,
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
  // Schema generator cards (C302-C307)
  SCHEMA_BROWSER_CARD,
  SCHEMA_TO_CHORDS_CARD,
  SCHEMA_TO_BASS_CARD,
  SCHEMA_TO_MELODY_CARD,
  SCHEMA_VARIATION_CARD,
  SCHEMA_CONSTRAINT_CARD,
  // Celtic set builder (C735)
  SET_BUILDER_CARD,
  // LCC cards (C1161-C1165)
  LYDIAN_CHROMATIC_CARD,
  PARENT_SCALE_CARD,
  CHORD_SCALE_UNITY_CARD,
  UPPER_STRUCTURE_CARD,
  // Tonal gravity visualizer (C1163)
  TONAL_GRAVITY_VISUALIZER_CARD,
  // Jazz reharmonization cards (C1342-C1344)
  REHARMONIZATION_CARD,
  TRITONE_SUB_CARD,
  COLTRANE_CHANGES_CARD,
  // Jazz improv cards (C1391-C1395)
  BEBOP_SCALE_CARD,
  ENCLOSURE_CARD,
  DIGITAL_PATTERN_CARD,
  GUIDE_TONE_CARD,
  LICK_LIBRARY_CARD,
  // Fill builder (C936)
  FILL_BUILDER_CARD,
  // Jazz advanced cards (C1396-C1397)
  MOTIF_DEVELOPER_CARD,
  OUTSIDE_CARD,
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

// ============================================================================
// CONFLICT DETECTION (C469)
// ============================================================================

/**
 * Constraint conflict info
 */
export interface ConstraintConflict {
  /** First constraint type */
  readonly constraint1: string;
  /** Second constraint type */
  readonly constraint2: string;
  /** Conflict reason */
  readonly reason: string;
  /** Severity */
  readonly severity: 'warning' | 'error';
}

/**
 * Card conflict badge info for UI
 */
export interface CardConflictBadge {
  /** Card ID that has conflict */
  readonly cardId: string;
  /** Conflicts with which other cards */
  readonly conflictsWith: readonly string[];
  /** Conflict details */
  readonly conflicts: readonly ConstraintConflict[];
  /** Badge type */
  readonly badgeType: 'warning' | 'error';
  /** Tooltip text */
  readonly tooltip: string;
}

/**
 * Known constraint type conflicts
 */
const CONSTRAINT_CONFLICTS: readonly { type1: string; type2: string; reason: string }[] = [
  { type1: 'film_device', type2: 'schema', reason: 'Film device may override schema voice leading' },
  { type1: 'raga', type2: 'key', reason: 'Raga defines its own scale; key constraint is redundant' },
  { type1: 'raga', type2: 'scale', reason: 'Raga defines aroha/avaroha; external scale conflicts' },
  { type1: 'chinese_mode', type2: 'key', reason: 'Chinese mode implies pentatonic scale' },
  { type1: 'celtic_tune', type2: 'meter_accent', reason: 'Celtic tune type defines its own metric accents' },
  { type1: 'tala', type2: 'meter', reason: 'Tala defines cycle structure; meter constraint is redundant' },
  { type1: 'film_mood', type2: 'raga', reason: 'Film mood implies Western harmony; conflicts with raga' },
  { type1: 'schema', type2: 'raga', reason: 'Galant schemata assume Western tonality; conflicts with raga' },
];

/**
 * Detect conflicts between constraints from multiple cards.
 * 
 * This is the C469 integration: show "conflict" badge on cards when constraints incompatible.
 */
export function detectConstraintConflicts(
  cards: ReadonlyArray<{ def: TheoryCardDef; state: TheoryCardState }>
): CardConflictBadge[] {
  const badges: CardConflictBadge[] = [];
  const cardConstraints: Map<string, { cardId: string; constraints: MusicConstraint[] }> = new Map();
  
  // Collect constraints by card
  for (const { def, state } of cards) {
    const constraints = def.extractConstraints(state);
    if (constraints.length > 0) {
      cardConstraints.set(def.cardId, { cardId: def.cardId, constraints });
    }
  }
  
  // Check each pair of cards for conflicts
  const cardIds = Array.from(cardConstraints.keys());
  
  for (let i = 0; i < cardIds.length; i++) {
    const cardId1 = cardIds[i]!;
    const { constraints: constraints1 } = cardConstraints.get(cardId1)!;
    const conflicts: ConstraintConflict[] = [];
    const conflictsWith: string[] = [];
    
    for (let j = i + 1; j < cardIds.length; j++) {
      const cardId2 = cardIds[j]!;
      const { constraints: constraints2 } = cardConstraints.get(cardId2)!;
      
      // Check for constraint type conflicts
      for (const c1 of constraints1) {
        for (const c2 of constraints2) {
          const conflict = CONSTRAINT_CONFLICTS.find(
            cf => (cf.type1 === c1.type && cf.type2 === c2.type) ||
                  (cf.type1 === c2.type && cf.type2 === c1.type)
          );
          
          if (conflict) {
            conflicts.push({
              constraint1: c1.type,
              constraint2: c2.type,
              reason: conflict.reason,
              severity: 'warning',
            });
            if (!conflictsWith.includes(cardId2)) {
              conflictsWith.push(cardId2);
            }
          }
        }
      }
    }
    
    if (conflicts.length > 0) {
      badges.push({
        cardId: cardId1,
        conflictsWith,
        conflicts,
        badgeType: conflicts.some(c => c.severity === 'error') ? 'error' : 'warning',
        tooltip: `Conflicts with: ${conflictsWith.join(', ')}`,
      });
    }
  }
  
  return badges;
}

/**
 * Get conflict badge for a specific card
 */
export function getCardConflictBadge(
  cardId: string,
  allCards: ReadonlyArray<{ def: TheoryCardDef; state: TheoryCardState }>
): CardConflictBadge | undefined {
  const allBadges = detectConstraintConflicts(allCards);
  return allBadges.find(b => b.cardId === cardId);
}
