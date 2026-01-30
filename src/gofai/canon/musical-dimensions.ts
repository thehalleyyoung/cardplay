/**
 * @file Musical Dimensions - Typed Representation for Perceptual and Symbolic Axes
 * @module gofai/canon/musical-dimensions
 * 
 * Implements Step 086: Define a typed representation for "musical dimensions" that
 * can host both perceptual axes (brightness, warmth) and symbolic-theory axes
 * (harmonic tension, rhythmic complexity).
 * 
 * Musical dimensions are abstract axes along which music can vary. They include:
 * 
 * **Perceptual dimensions**: Subjective qualities (bright/dark, wide/narrow, busy/sparse)
 * - Based on psychoacoustics and perception
 * - Continuous scales
 * - Culturally influenced but broadly applicable
 * 
 * **Symbolic-theory dimensions**: Music-theoretic properties (tension, dissonance, complexity)
 * - Based on music theory and analysis
 * - Can be discrete or continuous
 * - Style/genre-dependent
 * 
 * **Hybrid dimensions**: Mix perceptual and symbolic (e.g., "lift" = register + harmonic motion)
 * 
 * This module provides a unified type system for all dimensions, enabling:
 * - Extensions to add new dimensions without forking core
 * - Cross-referencing between perceptual and symbolic aspects
 * - Lever mappings that span multiple dimension types
 * - Analysis that computes dimension values from project state
 * 
 * @see gofai_goalB.md Step 086
 * @see docs/gofai/musical-dimensions.md
 */

import type { AxisId, GofaiId } from './types.js';
import { createAxisId } from './types.js';

// ============================================================================
// Dimension Classification
// ============================================================================

/**
 * The fundamental type of a musical dimension.
 */
export type DimensionType =
  | 'perceptual'      // Subjective perceptual quality
  | 'symbolic'        // Music-theoretic property
  | 'hybrid'          // Combines perceptual and symbolic
  | 'production';     // Technical/production quality

/**
 * The domain of a dimension (what it describes).
 */
export type DimensionDomain =
  | 'timbre'          // Sound color/texture
  | 'harmony'         // Chord/pitch relationships
  | 'melody'          // Linear pitch motion
  | 'rhythm'          // Temporal patterns
  | 'dynamics'        // Loudness/intensity
  | 'articulation'    // Note attack/release
  | 'space'           // Stereo/spatial properties
  | 'structure'       // Form/organization
  | 'texture'         // Density/layering
  | 'affect';         // Emotional/expressive quality

/**
 * Value type of a dimension.
 */
export type DimensionValueType =
  | 'continuous'      // Real number (e.g., brightness: 0.0-1.0)
  | 'discrete'        // Integer (e.g., chord extensions: 0, 1, 2, 3+)
  | 'ordinal'         // Ordered categories (e.g., complexity: low < medium < high)
  | 'nominal'         // Unordered categories (e.g., mode: major, minor, dorian, ...)
  | 'boolean';        // Binary (e.g., syncopated: yes/no)

// ============================================================================
// Musical Dimension Definition
// ============================================================================

/**
 * A musical dimension.
 * 
 * This is the core type representing an abstract axis along which music varies.
 */
export interface MusicalDimension {
  /** Unique identifier */
  readonly id: AxisId;
  
  /** Human-readable name */
  readonly name: string;
  
  /** Detailed description */
  readonly description: string;
  
  /** Dimension type */
  readonly type: DimensionType;
  
  /** Domain(s) this dimension describes */
  readonly domains: readonly DimensionDomain[];
  
  /** Value type */
  readonly valueType: DimensionValueType;
  
  /** Value range/constraints */
  readonly valueConstraints: DimensionValueConstraints;
  
  /** Pole descriptions (extremes of the dimension) */
  readonly poles: DimensionPoles;
  
  /** Related dimensions (correlated or opposite) */
  readonly relationships: readonly DimensionRelationship[];
  
  /** Whether this is a core dimension or extension */
  readonly namespace?: string;
  
  /** Perceptual basis (if perceptual or hybrid) */
  readonly perceptualBasis?: PerceptualBasis;
  
  /** Symbolic basis (if symbolic or hybrid) */
  readonly symbolicBasis?: SymbolicBasis;
  
  /** Analysis method (how to compute from project state) */
  readonly analysisMethod?: AnalysisMethod;
  
  /** Lever mappings (how to actuate this dimension) */
  readonly leverMappings: readonly LeverMapping[];
  
  /** Examples in natural language */
  readonly examples: readonly string[];
}

/**
 * Value constraints for a dimension.
 */
export type DimensionValueConstraints =
  | { readonly type: 'continuous'; readonly min: number; readonly max: number; readonly default: number }
  | { readonly type: 'discrete'; readonly min: number; readonly max: number; readonly default: number }
  | { readonly type: 'ordinal'; readonly levels: readonly string[]; readonly default: string }
  | { readonly type: 'nominal'; readonly categories: readonly string[]; readonly default: string }
  | { readonly type: 'boolean'; readonly default: boolean };

/**
 * Descriptions of the dimension's poles (extremes).
 */
export interface DimensionPoles {
  /** Negative pole (low values) */
  readonly negative: PoleDescription;
  
  /** Positive pole (high values) */
  readonly positive: PoleDescription;
  
  /** Neutral/center point (if meaningful) */
  readonly neutral?: PoleDescription;
}

export interface PoleDescription {
  /** Pole name */
  readonly name: string;
  
  /** Description */
  readonly description: string;
  
  /** Example values */
  readonly examples: readonly string[];
  
  /** Associated lexemes */
  readonly lexemes: readonly string[];
}

/**
 * Relationship to another dimension.
 */
export interface DimensionRelationship {
  /** Related dimension */
  readonly dimension: AxisId;
  
  /** Type of relationship */
  readonly type: 'correlated' | 'anti-correlated' | 'orthogonal' | 'subsumes' | 'component-of';
  
  /** Strength of relationship (0-1) */
  readonly strength: number;
  
  /** Explanation */
  readonly description: string;
}

// ============================================================================
// Perceptual Dimensions
// ============================================================================

/**
 * Perceptual basis for a dimension.
 * 
 * Describes the psychoacoustic or cognitive foundation.
 */
export interface PerceptualBasis {
  /** Primary perceptual attribute */
  readonly primaryAttribute: PerceptualAttribute;
  
  /** Secondary attributes */
  readonly secondaryAttributes: readonly PerceptualAttribute[];
  
  /** Psychoacoustic correlates */
  readonly acousticCorrelates: readonly AcousticCorrelate[];
  
  /** Cultural/contextual factors */
  readonly contextFactors: readonly string[];
}

export type PerceptualAttribute =
  | 'brightness'          // Spectral centroid, high-frequency energy
  | 'warmth'              // Low-frequency energy, harmonics
  | 'roughness'           // Sensory dissonance, beating
  | 'sharpness'           // Attack transients, edges
  | 'fullness'            // Spectral density
  | 'spaciousness'        // Stereo width, reverb
  | 'presence'            // Mid-range energy, clarity
  | 'hardness'            // Attack, sustain envelope
  | 'richness'            // Harmonic complexity
  | 'tension'             // Perceptual expectation/resolution
  | 'activity'            // Temporal density, busyness
  | 'smoothness';         // Legato, spectral continuity

export interface AcousticCorrelate {
  /** Acoustic property */
  readonly property: string;
  
  /** How it maps to the dimension */
  readonly mapping: 'linear' | 'logarithmic' | 'inverse' | 'complex';
  
  /** Weight (importance) */
  readonly weight: number;
}

// ============================================================================
// Symbolic-Theory Dimensions
// ============================================================================

/**
 * Symbolic basis for a dimension.
 * 
 * Describes the music-theoretic foundation.
 */
export interface SymbolicBasis {
  /** Music theory domain */
  readonly domain: 'harmony' | 'melody' | 'rhythm' | 'counterpoint' | 'form';
  
  /** Theoretical concepts */
  readonly concepts: readonly TheoreticConcept[];
  
  /** Computational model */
  readonly model?: TheoreticModel;
  
  /** Style/genre dependencies */
  readonly styleDependencies: readonly string[];
}

export interface TheoreticConcept {
  /** Concept name */
  readonly name: string;
  
  /** Description */
  readonly description: string;
  
  /** Sources (theory references) */
  readonly sources: readonly string[];
}

export type TheoreticModel =
  | { readonly type: 'pitch-class-set'; readonly operations: readonly string[] }
  | { readonly type: 'voice-leading'; readonly rules: readonly string[] }
  | { readonly type: 'functional-harmony'; readonly progressions: readonly string[] }
  | { readonly type: 'contour'; readonly features: readonly string[] }
  | { readonly type: 'metric'; readonly hierarchies: readonly string[] };

// ============================================================================
// Analysis Methods
// ============================================================================

/**
 * Method for analyzing a dimension from project state.
 */
export interface AnalysisMethod {
  /** Analysis type */
  readonly type: 'static' | 'dynamic' | 'statistical';
  
  /** Input requirements */
  readonly inputs: readonly AnalysisInput[];
  
  /** Computation strategy */
  readonly strategy: AnalysisStrategy;
  
  /** Output format */
  readonly output: AnalysisOutput;
  
  /** Caching policy */
  readonly cacheable: boolean;
  
  /** Computational cost (for scheduling) */
  readonly cost: 'low' | 'medium' | 'high';
}

export type AnalysisInput =
  | { readonly type: 'events'; readonly scope: string }
  | { readonly type: 'spectrum'; readonly scope: string }
  | { readonly type: 'harmony'; readonly scope: string }
  | { readonly type: 'structure'; readonly scope: string };

export type AnalysisStrategy =
  | { readonly type: 'rule-based'; readonly rules: readonly string[] }
  | { readonly type: 'statistical'; readonly features: readonly string[] }
  | { readonly type: 'prolog-query'; readonly query: string }
  | { readonly type: 'external'; readonly handlerId: string };

export type AnalysisOutput =
  | { readonly type: 'scalar'; readonly range: [number, number] }
  | { readonly type: 'vector'; readonly dimensions: number }
  | { readonly type: 'categorical'; readonly categories: readonly string[] }
  | { readonly type: 'timeseries'; readonly resolution: number };

// ============================================================================
// Lever Mappings
// ============================================================================

/**
 * Mapping from a dimension to concrete edit operations.
 */
export interface LeverMapping {
  /** Lever ID */
  readonly id: string;
  
  /** Description */
  readonly description: string;
  
  /** Edit operations this lever triggers */
  readonly operations: readonly LeverOperation[];
  
  /** Applicable contexts (scopes where this lever works) */
  readonly contexts: readonly string[];
  
  /** Priority (for disambiguation) */
  readonly priority: number;
}

export interface LeverOperation {
  /** Operation type */
  readonly type: 'card-param' | 'event-transform' | 'structure-edit' | 'routing-change';
  
  /** Target (what gets changed) */
  readonly target: string;
  
  /** Mapping function (dimension value → edit amount) */
  readonly mapping: MappingFunction;
  
  /** Constraints (when this operation is valid) */
  readonly constraints: readonly string[];
}

export type MappingFunction =
  | { readonly type: 'linear'; readonly scale: number; readonly offset: number }
  | { readonly type: 'exponential'; readonly base: number; readonly scale: number }
  | { readonly type: 'sigmoid'; readonly midpoint: number; readonly steepness: number }
  | { readonly type: 'piecewise'; readonly segments: readonly { readonly x: number; readonly y: number }[] }
  | { readonly type: 'custom'; readonly functionId: string };

// ============================================================================
// Core Perceptual Dimensions
// ============================================================================

/**
 * Brightness: Spectral centroid, high-frequency energy.
 */
export const BRIGHTNESS_DIMENSION: MusicalDimension = {
  id: createAxisId('brightness'),
  name: 'Brightness',
  description: 'The perceived lightness or darkness of a sound\'s timbre',
  type: 'perceptual',
  domains: ['timbre'],
  valueType: 'continuous',
  valueConstraints: { type: 'continuous', min: 0, max: 1, default: 0.5 },
  poles: {
    negative: {
      name: 'Dark',
      description: 'Low spectral centroid, muted highs',
      examples: ['muted', 'dull', 'mellow', 'warm'],
      lexemes: ['dark', 'darker', 'muted', 'dull'],
    },
    positive: {
      name: 'Bright',
      description: 'High spectral centroid, emphasized highs',
      examples: ['brilliant', 'shimmery', 'crisp', 'airy'],
      lexemes: ['bright', 'brighter', 'brilliant', 'shimmery'],
    },
  },
  relationships: [
    {
      dimension: createAxisId('warmth'),
      type: 'anti-correlated',
      strength: 0.6,
      description: 'Brighter sounds tend to feel less warm',
    },
  ],
  perceptualBasis: {
    primaryAttribute: 'brightness',
    secondaryAttributes: ['sharpness'],
    acousticCorrelates: [
      { property: 'spectral_centroid', mapping: 'linear', weight: 1.0 },
      { property: 'high_frequency_energy', mapping: 'logarithmic', weight: 0.7 },
    ],
    contextFactors: ['reference timbre', 'musical context'],
  },
  leverMappings: [
    {
      id: 'brightness-eq',
      description: 'Adjust high-frequency content via EQ',
      operations: [
        {
          type: 'card-param',
          target: 'eq:high_shelf:gain',
          mapping: { type: 'linear', scale: 12, offset: 0 },
          constraints: ['eq_card_present'],
        },
      ],
      contexts: ['any'],
      priority: 1,
    },
  ],
  examples: [
    'Make it brighter',
    'Darker sound',
    'More brilliance in the highs',
  ],
};

/**
 * Warmth: Low-frequency energy, analog character.
 */
export const WARMTH_DIMENSION: MusicalDimension = {
  id: createAxisId('warmth'),
  name: 'Warmth',
  description: 'The perceived warmth or coolness of a sound',
  type: 'perceptual',
  domains: ['timbre'],
  valueType: 'continuous',
  valueConstraints: { type: 'continuous', min: 0, max: 1, default: 0.5 },
  poles: {
    negative: {
      name: 'Cool',
      description: 'Reduced low-frequency energy, digital/clinical',
      examples: ['cool', 'sterile', 'digital', 'thin'],
      lexemes: ['cool', 'cold', 'sterile', 'clinical'],
    },
    positive: {
      name: 'Warm',
      description: 'Rich low-frequency energy, analog character',
      examples: ['warm', 'cozy', 'analog', 'rich'],
      lexemes: ['warm', 'warmer', 'cozy', 'analog'],
    },
  },
  relationships: [
    {
      dimension: createAxisId('brightness'),
      type: 'anti-correlated',
      strength: 0.6,
      description: 'Warmer sounds tend to feel less bright',
    },
  ],
  perceptualBasis: {
    primaryAttribute: 'warmth',
    secondaryAttributes: ['fullness'],
    acousticCorrelates: [
      { property: 'low_frequency_energy', mapping: 'logarithmic', weight: 1.0 },
      { property: 'harmonic_warmth', mapping: 'linear', weight: 0.5 },
    ],
    contextFactors: ['reference timbre'],
  },
  leverMappings: [
    {
      id: 'warmth-eq',
      description: 'Adjust low-frequency content and saturation',
      operations: [
        {
          type: 'card-param',
          target: 'eq:low_shelf:gain',
          mapping: { type: 'linear', scale: 6, offset: 0 },
          constraints: ['eq_card_present'],
        },
      ],
      contexts: ['any'],
      priority: 1,
    },
  ],
  examples: [
    'Make it warmer',
    'Cooler, more clinical sound',
    'Add some analog warmth',
  ],
};

// ============================================================================
// Core Symbolic Dimensions
// ============================================================================

/**
 * Harmonic Tension: Perceptual expectation and resolution.
 */
export const HARMONIC_TENSION_DIMENSION: MusicalDimension = {
  id: createAxisId('harmonic_tension'),
  name: 'Harmonic Tension',
  description: 'The degree of harmonic instability and expectation for resolution',
  type: 'hybrid',
  domains: ['harmony', 'affect'],
  valueType: 'continuous',
  valueConstraints: { type: 'continuous', min: 0, max: 1, default: 0.3 },
  poles: {
    negative: {
      name: 'Resolved',
      description: 'Stable, consonant, at rest',
      examples: ['resolved', 'stable', 'consonant', 'restful'],
      lexemes: ['resolved', 'stable', 'consonant', 'restful'],
    },
    positive: {
      name: 'Tense',
      description: 'Unstable, dissonant, expectant',
      examples: ['tense', 'unstable', 'dissonant', 'expectant'],
      lexemes: ['tense', 'tenser', 'unstable', 'dissonant'],
    },
  },
  relationships: [],
  perceptualBasis: {
    primaryAttribute: 'tension',
    secondaryAttributes: ['roughness'],
    acousticCorrelates: [
      { property: 'sensory_dissonance', mapping: 'linear', weight: 0.7 },
      { property: 'harmonic_entropy', mapping: 'logarithmic', weight: 0.8 },
    ],
    contextFactors: ['tonal context', 'musical style', 'prior harmony'],
  },
  symbolicBasis: {
    domain: 'harmony',
    concepts: [
      {
        name: 'Functional Harmony',
        description: 'Tonic-dominant relationships and resolution expectations',
        sources: ['Rameau', 'Schenker', 'Tymoczko'],
      },
      {
        name: 'Voice Leading Tension',
        description: 'Dissonance and resolution in individual voices',
        sources: ['Fux', 'Schoenberg'],
      },
    ],
    model: { type: 'functional-harmony', progressions: ['I-V-I', 'ii-V-I'] },
    styleDependencies: ['western-tonal'],
  },
  analysisMethod: {
    type: 'dynamic',
    inputs: [
      { type: 'harmony', scope: 'local' },
      { type: 'events', scope: 'context' },
    ],
    strategy: {
      type: 'prolog-query',
      query: 'harmonic_tension(Chord, Context, Tension)',
    },
    output: { type: 'scalar', range: [0, 1] },
    cacheable: true,
    cost: 'medium',
  },
  leverMappings: [
    {
      id: 'tension-chord-extensions',
      description: 'Add or remove chord extensions to adjust tension',
      operations: [
        {
          type: 'event-transform',
          target: 'chord_extensions',
          mapping: { type: 'linear', scale: 1, offset: 0 },
          constraints: ['harmonic_context_present'],
        },
      ],
      contexts: ['harmonic_editing'],
      priority: 1,
    },
  ],
  examples: [
    'Increase harmonic tension',
    'Make it more resolved',
    'Add some tension before the cadence',
  ],
};

// ============================================================================
// Dimension Registry
// ============================================================================

/**
 * Registry of all known dimensions.
 */
export class DimensionRegistry {
  private readonly dimensions = new Map<AxisId, MusicalDimension>();
  
  /**
   * Register a dimension.
   */
  register(dimension: MusicalDimension): void {
    if (this.dimensions.has(dimension.id)) {
      throw new Error(`Dimension already registered: ${dimension.id}`);
    }
    this.dimensions.set(dimension.id, dimension);
  }
  
  /**
   * Get a dimension by ID.
   */
  get(id: AxisId): MusicalDimension | undefined {
    return this.dimensions.get(id);
  }
  
  /**
   * Get all dimensions.
   */
  getAll(): readonly MusicalDimension[] {
    return Array.from(this.dimensions.values());
  }
  
  /**
   * Get dimensions by type.
   */
  getByType(type: DimensionType): readonly MusicalDimension[] {
    return this.getAll().filter(d => d.type === type);
  }
  
  /**
   * Get dimensions by domain.
   */
  getByDomain(domain: DimensionDomain): readonly MusicalDimension[] {
    return this.getAll().filter(d => d.domains.includes(domain));
  }
  
  /**
   * Get related dimensions.
   */
  getRelated(id: AxisId): readonly MusicalDimension[] {
    const dimension = this.get(id);
    if (!dimension) return [];
    
    return dimension.relationships
      .map(rel => this.get(rel.dimension))
      .filter((d): d is MusicalDimension => d !== undefined);
  }
}

/**
 * Global dimension registry.
 */
export const dimensionRegistry = new DimensionRegistry();

// Register core dimensions
dimensionRegistry.register(BRIGHTNESS_DIMENSION);
dimensionRegistry.register(WARMTH_DIMENSION);
dimensionRegistry.register(HARMONIC_TENSION_DIMENSION);
