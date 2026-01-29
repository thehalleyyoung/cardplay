/**
 * @fileoverview CardParamSchema -> Constraint Mapping Registry (C075-C076)
 *
 * Defines the canonical mapping between card parameter schemas and
 * MusicConstraint types. This is the single source of truth for how
 * card UI parameter changes translate to Prolog-queryable constraints.
 *
 * @module @cardplay/ai/theory/constraint-mappers
 */

import type {
  MusicConstraint,
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
} from './music-spec';

// ============================================================================
// CARD PARAM SCHEMA (C075)
// ============================================================================

/**
 * Describes a single card parameter's type and constraints.
 */
export interface CardParamSchema {
  /** Unique parameter identifier within the card */
  readonly paramId: string;
  /** Human-readable label */
  readonly label: string;
  /** Parameter value type */
  readonly valueType: 'string' | 'number' | 'boolean' | 'enum' | 'range';
  /** For enum types: allowed values */
  readonly enumValues?: readonly string[];
  /** For range types: min/max/step */
  readonly range?: { readonly min: number; readonly max: number; readonly step?: number };
  /** Default value */
  readonly defaultValue: unknown;
  /** Whether this parameter maps to a hard constraint */
  readonly hard?: boolean;
  /** Default weight for soft constraints */
  readonly defaultWeight?: number;
  /** The MusicConstraint type this parameter maps to */
  readonly constraintType: MusicConstraint['type'];
}

/**
 * Full schema for a card's parameters.
 */
export interface CardSchema {
  /** Card type identifier */
  readonly cardId: string;
  /** Human-readable card name */
  readonly displayName: string;
  /** Card description */
  readonly description: string;
  /** Category */
  readonly category: 'theory' | 'analysis' | 'generation' | 'world' | 'style';
  /** Parameters and their schemas */
  readonly params: readonly CardParamSchema[];
}

// ============================================================================
// CONSTRAINT MAPPER (C076)
// ============================================================================

/**
 * Maps a card parameter value to a MusicConstraint.
 */
export type ConstraintMapper<T = unknown> = (
  value: T,
  paramSchema: CardParamSchema
) => MusicConstraint | null;

/**
 * Registry entry for a constraint mapper.
 */
interface ConstraintMapperEntry {
  readonly cardId: string;
  readonly paramId: string;
  readonly mapper: ConstraintMapper;
  readonly schema: CardParamSchema;
}

/**
 * Registry of constraint mappers keyed by "cardId:paramId".
 */
class ConstraintMapperRegistry {
  private mappers = new Map<string, ConstraintMapperEntry>();
  private cardSchemas = new Map<string, CardSchema>();

  private key(cardId: string, paramId: string): string {
    return `${cardId}:${paramId}`;
  }

  /**
   * Register a mapper for a specific card parameter.
   */
  register(
    cardId: string,
    paramId: string,
    schema: CardParamSchema,
    mapper: ConstraintMapper
  ): void {
    this.mappers.set(this.key(cardId, paramId), {
      cardId,
      paramId,
      mapper,
      schema,
    });
  }

  /**
   * Register a full card schema and auto-register default mappers.
   */
  registerCard(schema: CardSchema, mappers?: Record<string, ConstraintMapper>): void {
    this.cardSchemas.set(schema.cardId, schema);
    for (const param of schema.params) {
      const mapper = mappers?.[param.paramId] ?? createDefaultMapper(param);
      this.register(schema.cardId, param.paramId, param, mapper);
    }
  }

  /**
   * Get the mapper for a card parameter.
   */
  getMapper(cardId: string, paramId: string): ConstraintMapperEntry | undefined {
    return this.mappers.get(this.key(cardId, paramId));
  }

  /**
   * Map a card parameter value to a constraint.
   */
  mapToConstraint(cardId: string, paramId: string, value: unknown): MusicConstraint | null {
    const entry = this.mappers.get(this.key(cardId, paramId));
    if (!entry) return null;
    return entry.mapper(value, entry.schema);
  }

  /**
   * Map all parameters of a card to constraints.
   */
  mapCardToConstraints(
    cardId: string,
    params: Record<string, unknown>
  ): MusicConstraint[] {
    const constraints: MusicConstraint[] = [];
    for (const [paramId, value] of Object.entries(params)) {
      const constraint = this.mapToConstraint(cardId, paramId, value);
      if (constraint) constraints.push(constraint);
    }
    return constraints;
  }

  /**
   * Get the schema for a card.
   */
  getCardSchema(cardId: string): CardSchema | undefined {
    return this.cardSchemas.get(cardId);
  }

  /**
   * Get all registered card IDs.
   */
  getRegisteredCards(): string[] {
    return Array.from(this.cardSchemas.keys());
  }

  /**
   * Clear the registry (for testing).
   */
  clear(): void {
    this.mappers.clear();
    this.cardSchemas.clear();
  }
}

/**
 * Create a default mapper based on the parameter schema.
 */
function createDefaultMapper(_schema: CardParamSchema): ConstraintMapper {
  return (value: unknown, paramSchema: CardParamSchema): MusicConstraint | null => {
    if (value === undefined || value === null) return null;

    const hard = paramSchema.hard ?? false;
    const weight = paramSchema.defaultWeight ?? 0.7;

    switch (paramSchema.constraintType) {
      case 'key':
        if (typeof value === 'object' && value !== null) {
          const v = value as { root?: RootName; mode?: ModeName };
          if (v.root && v.mode) {
            return { type: 'key', hard, weight, root: v.root, mode: v.mode };
          }
        }
        return null;

      case 'tempo':
        if (typeof value === 'number') {
          return { type: 'tempo', hard, weight, bpm: value };
        }
        return null;

      case 'meter':
        if (typeof value === 'object' && value !== null) {
          const v = value as { numerator?: number; denominator?: number };
          if (v.numerator && v.denominator) {
            return { type: 'meter', hard, weight, numerator: v.numerator, denominator: v.denominator };
          }
        }
        return null;

      case 'tonality_model':
        if (typeof value === 'string') {
          return { type: 'tonality_model', hard, weight, model: value as TonalityModel };
        }
        return null;

      case 'style':
        if (typeof value === 'string') {
          return { type: 'style', hard, weight, style: value as StyleTag };
        }
        return null;

      case 'culture':
        if (typeof value === 'string') {
          return { type: 'culture', hard, weight, culture: value as CultureTag };
        }
        return null;

      case 'schema':
        if (typeof value === 'string') {
          return { type: 'schema', hard, weight, schema: value as GalantSchemaName };
        }
        return null;

      case 'raga':
        if (typeof value === 'string') {
          return { type: 'raga', hard: true, raga: value as RagaName };
        }
        return null;

      case 'tala':
        if (typeof value === 'string') {
          return { type: 'tala', hard: true, tala: value as TalaName };
        }
        if (typeof value === 'object' && value !== null) {
          const v = value as { tala?: TalaName; jati?: JatiType };
          if (v.tala) {
            return v.jati
              ? { type: 'tala', hard: true, tala: v.tala, jati: v.jati }
              : { type: 'tala', hard: true, tala: v.tala };
          }
        }
        return null;

      case 'celtic_tune':
        if (typeof value === 'string') {
          return { type: 'celtic_tune', hard: true, tuneType: value as CelticTuneType };
        }
        return null;

      case 'chinese_mode':
        if (typeof value === 'string') {
          return { type: 'chinese_mode', hard: true, mode: value as ChineseModeName };
        }
        if (typeof value === 'object' && value !== null) {
          const v = value as { mode?: ChineseModeName; includeBian?: boolean };
          if (v.mode) {
            return { type: 'chinese_mode', hard: true, mode: v.mode, ...(v.includeBian !== undefined && { includeBian: v.includeBian }) };
          }
        }
        return null;

      case 'film_mood':
        if (typeof value === 'string') {
          return { type: 'film_mood', hard, weight, mood: value as FilmMood };
        }
        return null;

      case 'film_device':
        if (typeof value === 'string') {
          return { type: 'film_device', hard, weight, device: value as FilmDevice };
        }
        return null;

      case 'phrase_density':
        if (typeof value === 'string') {
          return { type: 'phrase_density', hard, weight, density: value as 'sparse' | 'medium' | 'dense' };
        }
        return null;

      case 'contour':
        if (typeof value === 'string') {
          return { type: 'contour', hard, weight, contour: value as 'ascending' | 'descending' | 'arch' | 'inverted_arch' | 'level' };
        }
        return null;

      case 'grouping':
        if (typeof value === 'number') {
          return { type: 'grouping', hard: false, weight, sensitivity: Math.max(0, Math.min(1, value)) };
        }
        return null;

      case 'accent':
        if (typeof value === 'string') {
          return { type: 'accent', hard, weight, model: value as AccentModel };
        }
        return null;

      case 'gamaka_density':
        if (typeof value === 'string') {
          return { type: 'gamaka_density', hard, weight, density: value as 'light' | 'medium' | 'heavy' };
        }
        return null;

      case 'ornament_budget':
        if (typeof value === 'number') {
          return { type: 'ornament_budget', hard, weight, maxPerBeat: value };
        }
        return null;

      case 'harmonic_rhythm':
        if (typeof value === 'number') {
          return { type: 'harmonic_rhythm', hard, weight, changesPerBar: value };
        }
        return null;

      case 'cadence':
        if (typeof value === 'string') {
          return { type: 'cadence', hard, weight, cadenceType: value as CadenceType };
        }
        return null;

      default:
        return null;
    }
  };
}

/**
 * Global constraint mapper registry singleton.
 */
export const constraintMappers = new ConstraintMapperRegistry();

// ============================================================================
// BUILT-IN CARD SCHEMAS (C075)
// ============================================================================

// These define the parameter schemas for each theory card type.
// When a card implementation is created, it registers itself here.

export const TONALITY_MODEL_CARD_SCHEMA: CardSchema = {
  cardId: 'theory:tonality_model',
  displayName: 'Tonality Model',
  description: 'Select and configure the tonality detection model',
  category: 'theory',
  params: [
    {
      paramId: 'model',
      label: 'Model',
      valueType: 'enum',
      enumValues: ['ks_profile', 'dft_phase', 'spiral_array'],
      defaultValue: 'ks_profile',
      constraintType: 'tonality_model',
      hard: false,
      defaultWeight: 0.8,
    },
  ],
};

export const METER_ACCENT_CARD_SCHEMA: CardSchema = {
  cardId: 'theory:meter_accent',
  displayName: 'Meter & Accent',
  description: 'Configure meter, swing, and accent model',
  category: 'theory',
  params: [
    {
      paramId: 'numerator',
      label: 'Beats per bar',
      valueType: 'number',
      range: { min: 1, max: 16 },
      defaultValue: 4,
      constraintType: 'meter',
      hard: true,
    },
    {
      paramId: 'denominator',
      label: 'Beat unit',
      valueType: 'enum',
      enumValues: ['2', '4', '8', '16'],
      defaultValue: '4',
      constraintType: 'meter',
      hard: true,
    },
    {
      paramId: 'accentModel',
      label: 'Accent model',
      valueType: 'enum',
      enumValues: ['standard', 'compound', 'swing', 'celtic_dance', 'carnatic_tala'],
      defaultValue: 'standard',
      constraintType: 'accent',
      hard: false,
      defaultWeight: 0.6,
    },
  ],
};

export const GROUPING_CARD_SCHEMA: CardSchema = {
  cardId: 'theory:grouping',
  displayName: 'Phrase Grouping (GTTM)',
  description: 'GTTM-inspired phrase boundary detection sensitivity',
  category: 'analysis',
  params: [
    {
      paramId: 'sensitivity',
      label: 'Boundary sensitivity',
      valueType: 'range',
      range: { min: 0, max: 1, step: 0.05 },
      defaultValue: 0.5,
      constraintType: 'grouping',
      hard: false,
      defaultWeight: 0.5,
    },
  ],
};

export const SCHEMA_CARD_SCHEMA: CardSchema = {
  cardId: 'theory:schema',
  displayName: 'Galant Schema',
  description: 'Select galant schema for phrase generation/analysis',
  category: 'theory',
  params: [
    {
      paramId: 'schema',
      label: 'Schema',
      valueType: 'enum',
      enumValues: [
        'prinner', 'fonte', 'monte', 'romanesca', 'meyer',
        'quiescenza', 'do_re_mi', 'cadential_64', 'lament_bass',
        'ponte', 'passo_indietro', 'circolo', 'indugio',
      ],
      defaultValue: 'prinner',
      constraintType: 'schema',
      hard: false,
      defaultWeight: 0.7,
    },
    {
      paramId: 'cadenceType',
      label: 'Cadence landing',
      valueType: 'enum',
      enumValues: ['authentic', 'perfect_authentic', 'imperfect_authentic', 'half', 'plagal', 'deceptive'],
      defaultValue: 'authentic',
      constraintType: 'cadence',
      hard: false,
      defaultWeight: 0.6,
    },
    {
      paramId: 'harmonicRhythm',
      label: 'Harmonic rhythm (chords/bar)',
      valueType: 'range',
      range: { min: 1, max: 8, step: 1 },
      defaultValue: 2,
      constraintType: 'harmonic_rhythm',
      hard: false,
      defaultWeight: 0.5,
    },
  ],
};

export const FILM_SCORING_CARD_SCHEMA: CardSchema = {
  cardId: 'theory:film_scoring',
  displayName: 'Film Scoring',
  description: 'Mood, devices, and orchestration for film/media scoring',
  category: 'style',
  params: [
    {
      paramId: 'mood',
      label: 'Mood',
      valueType: 'enum',
      enumValues: ['heroic', 'ominous', 'tender', 'wonder', 'mystery', 'sorrow', 'comedy', 'action'],
      defaultValue: 'heroic',
      constraintType: 'film_mood',
      hard: false,
      defaultWeight: 0.8,
    },
    {
      paramId: 'device',
      label: 'Primary device',
      valueType: 'enum',
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
      defaultWeight: 0.6,
    },
  ],
};

export const CARNATIC_RAGA_TALA_CARD_SCHEMA: CardSchema = {
  cardId: 'theory:carnatic_raga_tala',
  displayName: 'Carnatic Raga/Tala',
  description: 'Raga, tala, jati, and gamaka density for Carnatic music',
  category: 'world',
  params: [
    {
      paramId: 'raga',
      label: 'Raga',
      valueType: 'enum',
      enumValues: [
        'mohanam', 'hamsadhwani', 'kalyani', 'keeravani',
        'shankarabharanam', 'hindolam', 'abhogi', 'todi', 'bhairavi', 'kambhoji',
      ],
      defaultValue: 'mohanam',
      constraintType: 'raga',
      hard: true,
    },
    {
      paramId: 'tala',
      label: 'Tala',
      valueType: 'enum',
      enumValues: ['adi', 'rupaka', 'misra_chapu', 'khanda_chapu', 'jhampa', 'triputa', 'ata', 'eka'],
      defaultValue: 'adi',
      constraintType: 'tala',
      hard: true,
    },
    {
      paramId: 'gamakaDensity',
      label: 'Gamaka density',
      valueType: 'enum',
      enumValues: ['light', 'medium', 'heavy'],
      defaultValue: 'medium',
      constraintType: 'gamaka_density',
      hard: false,
      defaultWeight: 0.6,
    },
  ],
};

export const CELTIC_TUNE_CARD_SCHEMA: CardSchema = {
  cardId: 'theory:celtic_tune',
  displayName: 'Celtic Tune',
  description: 'Tune type, mode, ornaments, and drone for Celtic music',
  category: 'world',
  params: [
    {
      paramId: 'tuneType',
      label: 'Tune type',
      valueType: 'enum',
      enumValues: ['reel', 'jig', 'slip_jig', 'hornpipe', 'strathspey', 'polka', 'march', 'air'],
      defaultValue: 'reel',
      constraintType: 'celtic_tune',
      hard: true,
    },
    {
      paramId: 'ornamentBudget',
      label: 'Max ornaments per beat',
      valueType: 'range',
      range: { min: 0, max: 4, step: 1 },
      defaultValue: 2,
      constraintType: 'ornament_budget',
      hard: false,
      defaultWeight: 0.5,
    },
  ],
};

export const CHINESE_MODE_CARD_SCHEMA: CardSchema = {
  cardId: 'theory:chinese_mode',
  displayName: 'Chinese Mode',
  description: 'Pentatonic mode, bian tones, and heterophony for Chinese music',
  category: 'world',
  params: [
    {
      paramId: 'mode',
      label: 'Mode',
      valueType: 'enum',
      enumValues: ['gong', 'shang', 'jiao', 'zhi', 'yu'],
      defaultValue: 'gong',
      constraintType: 'chinese_mode',
      hard: true,
    },
    {
      paramId: 'phraseDensity',
      label: 'Phrase density',
      valueType: 'enum',
      enumValues: ['sparse', 'medium', 'dense'],
      defaultValue: 'medium',
      constraintType: 'phrase_density',
      hard: false,
      defaultWeight: 0.5,
    },
  ],
};

export const CONSTRAINT_PACK_CARD_SCHEMA: CardSchema = {
  cardId: 'theory:constraint_pack',
  displayName: 'Constraint Pack',
  description: 'Apply preset constraint combinations with optional overrides',
  category: 'style',
  params: [
    {
      paramId: 'packId',
      label: 'Pack',
      valueType: 'enum',
      enumValues: [
        'cinematic_heroic', 'galant_phrase', 'carnatic_alapana',
        'celtic_reel', 'chinese_heterophony',
        'horror', 'fantasy', 'action',
      ],
      defaultValue: 'cinematic_heroic',
      constraintType: 'style', // Pack overrides multiple constraints
      hard: false,
      defaultWeight: 0.7,
    },
  ],
};

// ============================================================================
// AUTO-REGISTER BUILT-IN SCHEMAS
// ============================================================================

const BUILT_IN_SCHEMAS: CardSchema[] = [
  TONALITY_MODEL_CARD_SCHEMA,
  METER_ACCENT_CARD_SCHEMA,
  GROUPING_CARD_SCHEMA,
  SCHEMA_CARD_SCHEMA,
  FILM_SCORING_CARD_SCHEMA,
  CARNATIC_RAGA_TALA_CARD_SCHEMA,
  CELTIC_TUNE_CARD_SCHEMA,
  CHINESE_MODE_CARD_SCHEMA,
  CONSTRAINT_PACK_CARD_SCHEMA,
];

for (const schema of BUILT_IN_SCHEMAS) {
  constraintMappers.registerCard(schema);
}
