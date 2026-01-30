/**
 * Step 068 [Sem] — MusicSpec to CPL Constraint Mapping
 * 
 * Defines the bidirectional mapping between MusicSpec constraints (from the AI theory system)
 * and CPL constraints (in the GOFAI natural language system).
 * 
 * @module gofai/semantics/musicspec-cpl-mapping
 */

// Placeholder types (actual imports would come from real modules)
type RootName = string;
type ModeName = string;
type ChordQuality = string;
type CultureTag = string;
type StyleTag = string;
type TonalityModel = string;
type GalantSchemaName = string;
type OrnamentType = string;
type AccentModel = string;
type TalaName = string;
type JatiType = string;
type CelticTuneType = string;
type ChineseModeName = string;
type RagaName = string;

// ============================================================================
// Mapping Result Type
// ============================================================================

/**
 * Result of a mapping operation with provenance.
 */
export interface MappingResult<T> {
  /** The mapped value */
  value: T;
  
  /** Whether the mapping is lossless */
  lossless: boolean;
  
  /** What information was lost (if lossy) */
  loss?: string;
  
  /** Confidence (0-1) */
  confidence: number;
  
  /** Source of mapping */
  source: 'direct' | 'heuristic' | 'approximation';
}

/**
 * Mapping context for conversions.
 */
export interface MappingContext {
  /** Current project state (for context-dependent mappings) */
  projectState?: any;
  
  /** Whether to prefer lossless mappings even if verbose */
  preferLossless?: boolean;
  
  /** Whether to fail on lossy mappings or approximate */
  strictMode?: boolean;
  
  /** Language/culture context */
  culture?: CultureTag;
  
  /** Extension namespace (for custom constraints) */
  namespace?: string;
}

// ============================================================================
// MusicSpec Constraint Types
// ============================================================================

export interface MusicSpecConstraintBase {
  readonly type: string;
  readonly confidence?: number;
  readonly source?: 'user' | 'inferred' | 'default';
}

export interface MusicSpecConstraintKey extends MusicSpecConstraintBase {
  readonly type: 'key';
  readonly root: RootName;
  readonly mode: ModeName;
}

export interface MusicSpecConstraintTempo extends MusicSpecConstraintBase {
  readonly type: 'tempo';
  readonly bpm: number;
  readonly allowFlex?: boolean;
  readonly flexRange?: { min: number; max: number };
}

export interface MusicSpecConstraintMeter extends MusicSpecConstraintBase {
  readonly type: 'meter';
  readonly numerator: number;
  readonly denominator: number;
  readonly accentModel?: AccentModel;
}

export interface MusicSpecConstraintStyle extends MusicSpecConstraintBase {
  readonly type: 'style';
  readonly style: StyleTag;
}

export interface MusicSpecConstraintCulture extends MusicSpecConstraintBase {
  readonly type: 'culture';
  readonly culture: CultureTag;
}

export interface MusicSpecConstraintSchema extends MusicSpecConstraintBase {
  readonly type: 'schema';
  readonly schema: GalantSchemaName;
  readonly section?: string;
}

export interface MusicSpecConstraintRaga extends MusicSpecConstraintBase {
  readonly type: 'raga';
  readonly raga: RagaName;
}

export interface MusicSpecConstraintTala extends MusicSpecConstraintBase {
  readonly type: 'tala';
  readonly tala: TalaName;
  readonly jati?: JatiType;
}

export interface ChordSpec {
  readonly root: RootName;
  readonly quality: ChordQuality;
  readonly duration?: number;
  readonly inversion?: number;
}

export interface MusicSpecConstraintChordProgression extends MusicSpecConstraintBase {
  readonly type: 'chord_progression';
  readonly progression: readonly ChordSpec[];
  readonly preserveExact?: boolean;
}

export interface MusicSpecConstraintMelodyRange extends MusicSpecConstraintBase {
  readonly type: 'melody_range';
  readonly minPitch: number;
  readonly maxPitch: number;
  readonly registerName?: string;
}

export interface MusicSpecConstraintOrnament extends MusicSpecConstraintBase {
  readonly type: 'ornament';
  readonly ornamentType: OrnamentType;
  readonly density?: 'sparse' | 'moderate' | 'dense';
}

export interface MusicSpecConstraintVoiceLeading extends MusicSpecConstraintBase {
  readonly type: 'voice_leading';
  readonly style: 'strict' | 'moderate' | 'free';
  readonly avoidParallels?: boolean;
  readonly preferStepwise?: boolean;
}

export interface MusicSpecConstraintDensity extends MusicSpecConstraintBase {
  readonly type: 'density';
  readonly notesPerBeat: number;
  readonly variation?: 'constant' | 'varying';
}

export type MusicSpecConstraint =
  | MusicSpecConstraintKey
  | MusicSpecConstraintTempo
  | MusicSpecConstraintMeter
  | MusicSpecConstraintStyle
  | MusicSpecConstraintCulture
  | MusicSpecConstraintSchema
  | MusicSpecConstraintRaga
  | MusicSpecConstraintTala
  | MusicSpecConstraintChordProgression
  | MusicSpecConstraintMelodyRange
  | MusicSpecConstraintOrnament
  | MusicSpecConstraintVoiceLeading
  | MusicSpecConstraintDensity;

// ============================================================================
// CPL Constraint Types (Placeholders)
// ============================================================================

export interface CPLConstraintBase {
  type: string;
}

export interface PreserveConstraint extends CPLConstraintBase {
  type: 'preserve';
  what: string;
  how: 'exact' | 'functional' | 'recognizable';
  spec?: any;
}

export interface OnlyChangeConstraint extends CPLConstraintBase {
  type: 'only_change';
  what: string;
  spec?: any;
}

export interface AvoidConstraint extends CPLConstraintBase {
  type: 'avoid';
  what: string;
  spec?: any;
}

export interface RequireConstraint extends CPLConstraintBase {
  type: 'require';
  what: string;
  spec?: any;
}

export interface PreferConstraint extends CPLConstraintBase {
  type: 'prefer';
  what: string;
  spec?: any;
}

export type CPLConstraint =
  | PreserveConstraint
  | OnlyChangeConstraint
  | AvoidConstraint
  | RequireConstraint
  | PreferConstraint;

// ============================================================================
// Core Mapping Functions
// ============================================================================

/**
 * Convert a MusicSpec constraint to CPL constraints.
 */
export function musicSpecToCPL(
  constraint: MusicSpecConstraint,
  context: MappingContext = {}
): MappingResult<readonly CPLConstraint[]> {
  switch (constraint.type) {
    case 'key':
      return mapKeyConstraint(constraint, context);
    case 'tempo':
      return mapTempoConstraint(constraint, context);
    case 'meter':
      return mapMeterConstraint(constraint, context);
    case 'style':
      return mapStyleConstraint(constraint, context);
    case 'culture':
      return mapCultureConstraint(constraint, context);
    case 'schema':
      return mapSchemaConstraint(constraint, context);
    case 'raga':
      return mapRagaConstraint(constraint, context);
    case 'tala':
      return mapTalaConstraint(constraint, context);
    case 'chord_progression':
      return mapChordProgressionConstraint(constraint, context);
    case 'melody_range':
      return mapMelodyRangeConstraint(constraint, context);
    case 'ornament':
      return mapOrnamentConstraint(constraint, context);
    case 'voice_leading':
      return mapVoiceLeadingConstraint(constraint, context);
    case 'density':
      return mapDensityConstraint(constraint, context);
    default:
      return {
        value: [{
          type: 'preserve',
          what: 'custom',
          how: 'exact',
          spec: constraint,
        }],
        lossless: false,
        loss: 'Unknown constraint type',
        confidence: 0.5,
        source: 'approximation',
      };
  }
}

/**
 * Convert CPL constraints to MusicSpec constraints.
 */
export function cplToMusicSpec(
  constraints: readonly CPLConstraint[],
  context: MappingContext = {}
): MappingResult<readonly MusicSpecConstraint[]> {
  const results: MusicSpecConstraint[] = [];
  let overallLossless = true;
  let losses: string[] = [];
  let minConfidence = 1.0;
  
  for (const cpl of constraints) {
    const mapped = mapCPLToMusicSpec(cpl, context);
    results.push(...mapped.value);
    
    if (!mapped.lossless) {
      overallLossless = false;
      if (mapped.loss) losses.push(mapped.loss);
    }
    
    minConfidence = Math.min(minConfidence, mapped.confidence);
  }
  
  return {
    value: results,
    lossless: overallLossless,
    loss: losses.length > 0 ? losses.join('; ') : undefined,
    confidence: minConfidence,
    source: overallLossless ? 'direct' : 'approximation',
  };
}

function mapCPLToMusicSpec(
  constraint: CPLConstraint,
  context: MappingContext
): MappingResult<readonly MusicSpecConstraint[]> {
  // Simplified implementation
  return {
    value: [],
    lossless: false,
    loss: 'CPL to MusicSpec mapping not fully implemented',
    confidence: 0.5,
    source: 'approximation',
  };
}

// ============================================================================
// Individual Mappers: MusicSpec → CPL
// ============================================================================

function mapKeyConstraint(
  constraint: MusicSpecConstraintKey,
  context: MappingContext
): MappingResult<readonly CPLConstraint[]> {
  const cpl: PreserveConstraint = {
    type: 'preserve',
    what: 'key',
    how: 'exact',
    spec: {
      root: constraint.root,
      mode: constraint.mode,
    },
  };
  
  return {
    value: [cpl],
    lossless: true,
    confidence: constraint.confidence ?? 1.0,
    source: 'direct',
  };
}

function mapTempoConstraint(
  constraint: MusicSpecConstraintTempo,
  context: MappingContext
): MappingResult<readonly CPLConstraint[]> {
  if (constraint.allowFlex && constraint.flexRange) {
    const cpl: RequireConstraint = {
      type: 'require',
      what: 'tempo',
      spec: {
        min: constraint.flexRange.min,
        max: constraint.flexRange.max,
        target: constraint.bpm,
      },
    };
    
    return {
      value: [cpl],
      lossless: true,
      confidence: constraint.confidence ?? 1.0,
      source: 'direct',
    };
  } else {
    const cpl: PreserveConstraint = {
      type: 'preserve',
      what: 'tempo',
      how: 'exact',
      spec: { bpm: constraint.bpm },
    };
    
    return {
      value: [cpl],
      lossless: true,
      confidence: constraint.confidence ?? 1.0,
      source: 'direct',
    };
  }
}

function mapMeterConstraint(
  constraint: MusicSpecConstraintMeter,
  context: MappingContext
): MappingResult<readonly CPLConstraint[]> {
  const constraints: CPLConstraint[] = [];
  
  constraints.push({
    type: 'preserve',
    what: 'meter',
    how: 'exact',
    spec: {
      numerator: constraint.numerator,
      denominator: constraint.denominator,
    },
  });
  
  if (constraint.accentModel) {
    constraints.push({
      type: 'prefer',
      what: 'accent_pattern',
      spec: { model: constraint.accentModel },
    });
  }
  
  return {
    value: constraints,
    lossless: true,
    confidence: constraint.confidence ?? 1.0,
    source: 'direct',
  };
}

function mapStyleConstraint(
  constraint: MusicSpecConstraintStyle,
  context: MappingContext
): MappingResult<readonly CPLConstraint[]> {
  const constraintType = (constraint.confidence ?? 1.0) >= 0.8 ? 'require' : 'prefer';
  
  const cpl: RequireConstraint | PreferConstraint = {
    type: constraintType,
    what: 'style',
    spec: { style: constraint.style },
  };
  
  return {
    value: [cpl],
    lossless: true,
    confidence: constraint.confidence ?? 1.0,
    source: 'direct',
  };
}

function mapCultureConstraint(
  constraint: MusicSpecConstraintCulture,
  context: MappingContext
): MappingResult<readonly CPLConstraint[]> {
  const cpl: RequireConstraint = {
    type: 'require',
    what: 'culture',
    spec: { culture: constraint.culture },
  };
  
  return {
    value: [cpl],
    lossless: true,
    confidence: constraint.confidence ?? 1.0,
    source: 'direct',
  };
}

function mapSchemaConstraint(
  constraint: MusicSpecConstraintSchema,
  context: MappingContext
): MappingResult<readonly CPLConstraint[]> {
  const cpl: RequireConstraint = {
    type: 'require',
    what: 'schema',
    spec: {
      schema: constraint.schema,
      section: constraint.section,
    },
  };
  
  return {
    value: [cpl],
    lossless: true,
    confidence: constraint.confidence ?? 1.0,
    source: 'direct',
  };
}

function mapRagaConstraint(
  constraint: MusicSpecConstraintRaga,
  context: MappingContext
): MappingResult<readonly CPLConstraint[]> {
  const cpl: RequireConstraint = {
    type: 'require',
    what: 'raga',
    spec: { raga: constraint.raga },
  };
  
  return {
    value: [cpl],
    lossless: true,
    confidence: constraint.confidence ?? 1.0,
    source: 'direct',
  };
}

function mapTalaConstraint(
  constraint: MusicSpecConstraintTala,
  context: MappingContext
): MappingResult<readonly CPLConstraint[]> {
  const cpl: RequireConstraint = {
    type: 'require',
    what: 'tala',
    spec: {
      tala: constraint.tala,
      jati: constraint.jati,
    },
  };
  
  return {
    value: [cpl],
    lossless: true,
    confidence: constraint.confidence ?? 1.0,
    source: 'direct',
  };
}

function mapChordProgressionConstraint(
  constraint: MusicSpecConstraintChordProgression,
  context: MappingContext
): MappingResult<readonly CPLConstraint[]> {
  const cpl: PreserveConstraint = {
    type: 'preserve',
    what: 'harmony',
    how: constraint.preserveExact ? 'exact' : 'functional',
    spec: {
      chords: constraint.progression.map(chord => ({
        root: chord.root,
        quality: chord.quality,
        duration: chord.duration,
        inversion: chord.inversion,
      })),
    },
  };
  
  return {
    value: [cpl],
    lossless: constraint.preserveExact ?? false,
    loss: constraint.preserveExact ? undefined : 'Functional preservation may lose timing details',
    confidence: constraint.confidence ?? (constraint.preserveExact ? 1.0 : 0.9),
    source: constraint.preserveExact ? 'direct' : 'heuristic',
  };
}

function mapMelodyRangeConstraint(
  constraint: MusicSpecConstraintMelodyRange,
  context: MappingContext
): MappingResult<readonly CPLConstraint[]> {
  const cpl: RequireConstraint = {
    type: 'require',
    what: 'register',
    spec: {
      min: constraint.minPitch,
      max: constraint.maxPitch,
      name: constraint.registerName,
    },
  };
  
  return {
    value: [cpl],
    lossless: true,
    confidence: constraint.confidence ?? 1.0,
    source: 'direct',
  };
}

function mapOrnamentConstraint(
  constraint: MusicSpecConstraintOrnament,
  context: MappingContext
): MappingResult<readonly CPLConstraint[]> {
  const constraints: CPLConstraint[] = [];
  
  constraints.push({
    type: 'require',
    what: 'ornament_type',
    spec: { type: constraint.ornamentType },
  });
  
  if (constraint.density) {
    constraints.push({
      type: 'prefer',
      what: 'ornament_density',
      spec: { density: constraint.density },
    });
  }
  
  return {
    value: constraints,
    lossless: true,
    confidence: constraint.confidence ?? 1.0,
    source: 'direct',
  };
}

function mapVoiceLeadingConstraint(
  constraint: MusicSpecConstraintVoiceLeading,
  context: MappingContext
): MappingResult<readonly CPLConstraint[]> {
  const constraints: CPLConstraint[] = [];
  
  constraints.push({
    type: 'require',
    what: 'voice_leading',
    spec: { style: constraint.style },
  });
  
  if (constraint.avoidParallels) {
    constraints.push({
      type: 'avoid',
      what: 'parallel_motion',
      spec: { types: ['fifths', 'octaves'] },
    });
  }
  
  if (constraint.preferStepwise) {
    constraints.push({
      type: 'prefer',
      what: 'stepwise_motion',
      spec: {},
    });
  }
  
  return {
    value: constraints,
    lossless: true,
    confidence: constraint.confidence ?? 1.0,
    source: 'direct',
  };
}

function mapDensityConstraint(
  constraint: MusicSpecConstraintDensity,
  context: MappingContext
): MappingResult<readonly CPLConstraint[]> {
  const cpl: RequireConstraint = {
    type: 'require',
    what: 'density',
    spec: {
      notesPerBeat: constraint.notesPerBeat,
      variation: constraint.variation,
    },
  };
  
  return {
    value: [cpl],
    lossless: true,
    confidence: constraint.confidence ?? 1.0,
    source: 'direct',
  };
}

// ============================================================================
// Batch Utilities
// ============================================================================

/**
 * Convert multiple MusicSpec constraints to CPL.
 */
export function musicSpecListToCPL(
  constraints: readonly MusicSpecConstraint[],
  context: MappingContext = {}
): MappingResult<readonly CPLConstraint[]> {
  const results: CPLConstraint[] = [];
  let overallLossless = true;
  let losses: string[] = [];
  let minConfidence = 1.0;
  
  for (const ms of constraints) {
    const mapped = musicSpecToCPL(ms, context);
    results.push(...mapped.value);
    
    if (!mapped.lossless) {
      overallLossless = false;
      if (mapped.loss) losses.push(mapped.loss);
    }
    
    minConfidence = Math.min(minConfidence, mapped.confidence);
  }
  
  return {
    value: results,
    lossless: overallLossless,
    loss: losses.length > 0 ? losses.join('; ') : undefined,
    confidence: minConfidence,
    source: overallLossless ? 'direct' : 'heuristic',
  };
}

/**
 * Get mapping statistics.
 */
export function getMappingStatistics(
  constraints: readonly MusicSpecConstraint[],
  context: MappingContext = {}
): {
  total: number;
  lossless: number;
  lossy: number;
  avgConfidence: number;
  lossReasons: Record<string, number>;
} {
  let losslessCount = 0;
  let lossyCount = 0;
  let totalConfidence = 0;
  const lossReasons: Record<string, number> = {};
  
  for (const constraint of constraints) {
    const mapped = musicSpecToCPL(constraint, context);
    
    if (mapped.lossless) {
      losslessCount++;
    } else {
      lossyCount++;
      if (mapped.loss) {
        lossReasons[mapped.loss] = (lossReasons[mapped.loss] ?? 0) + 1;
      }
    }
    
    totalConfidence += mapped.confidence;
  }
  
  return {
    total: constraints.length,
    lossless: losslessCount,
    lossy: lossyCount,
    avgConfidence: constraints.length > 0 ? totalConfidence / constraints.length : 0,
    lossReasons,
  };
}
