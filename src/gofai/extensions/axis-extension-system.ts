/**
 * @file axis-extension-system.ts
 * @status CANONICAL - Step 087
 * Step 087 [Ext][Sem] — Define how an extension can add a new axis (e.g., "grit")
 * and map it to levers without editing core.
 *
 * This module defines the extension interface for custom perceptual/musical axes.
 * Extensions can register new axes with complete semantic definitions, and the
 * planner will automatically incorporate them into lever selection without any
 * changes to core GOFAI code.
 *
 * Key design principles:
 * 1. Axes are namespaced (extension:axis_name)
 * 2. Extensions provide complete axis semantics (range, opposites, dimensions)
 * 3. Axes map to parameter bindings via declarations
 * 4. Core planner remains axis-agnostic and data-driven
 * 5. Axis definitions are versioned and validated
 *
 * @see src/gofai/extensions/pack-annotations-schema.ts for AxisAnnotation
 * @see docs/gofai/extension-spec.md for usage examples
 */

import type { GofaiId } from '../canon/types.ts';
import type { AxisAnnotation } from './pack-annotations-schema.ts';

/**
 * Unique identifier for an axis.
 * Builtin axes are un-namespaced (e.g., "brightness", "width")
 * Extension axes must be namespaced (e.g., "my-pack:grit")
 */
export type AxisId = GofaiId;

/**
 * Type of axis, determining how it's interpreted by the planner.
 */
export type AxisType =
  | 'perceptual'      // Human perceptual qualities (brightness, warmth, grit)
  | 'acoustic'        // Physical acoustic properties (frequency, amplitude)
  | 'symbolic'        // Music theory concepts (harmonic tension, rhythmic complexity)
  | 'production'      // Production qualities (width, depth, glue)
  | 'compositional';  // Compositional dimensions (density, lift, forward motion)

/**
 * Value range specification for an axis.
 */
export interface AxisRange {
  /** Minimum value (inclusive) */
  readonly min: number;
  /** Maximum value (inclusive) */
  readonly max: number;
  /** Neutral/default value */
  readonly neutral: number;
  /** Whether axis is bipolar (has meaningful negative direction) */
  readonly bipolar: boolean;
}

/**
 * A dimension that contributes to this axis.
 * E.g., "brightness" might be composed of:
 * - high_frequency_content (weight: 0.6)
 * - spectral_centroid (weight: 0.3)
 * - presence_boost (weight: 0.1)
 */
export interface AxisDimension {
  /** Dimension identifier (can reference other axes or acoustic features) */
  readonly dimensionId: string;
  /** Weight of this dimension's contribution (0-1) */
  readonly weight: number;
  /** Optional description of how this dimension relates to the axis */
  readonly description?: string;
}

/**
 * Complete axis definition.
 */
export interface AxisDefinition {
  /** Unique axis identifier (namespaced for extensions) */
  readonly id: AxisId;
  /** Human-readable display name */
  readonly displayName: string;
  /** Type of axis */
  readonly type: AxisType;
  /** Value range specification */
  readonly range: AxisRange;
  /** Opposite axis (if meaningful) */
  readonly opposite?: AxisId;
  /** Related axes (correlated or commonly co-adjusted) */
  readonly related?: readonly AxisId[];
  /** Dimensions that contribute to this axis */
  readonly dimensions?: readonly AxisDimension[];
  /** Detailed description of what this axis represents */
  readonly description: string;
  /** Example phrases that reference this axis */
  readonly examples?: readonly string[];
  /** Tags for categorization and search */
  readonly tags?: readonly string[];
  /** Extension namespace (undefined for builtins) */
  readonly namespace?: string;
  /** Schema version */
  readonly schemaVersion: '1.0';
}

/**
 * Registry of all known axes (builtin + extension).
 */
export class AxisRegistry {
  private axes = new Map<AxisId, AxisDefinition>();
  private byNamespace = new Map<string, Set<AxisId>>();
  
  /**
   * Register a new axis.
   * @throws if axis ID is already registered
   * @throws if extension axis is not namespaced
   */
  register(axis: AxisDefinition): void {
    if (this.axes.has(axis.id)) {
      throw new Error(`Axis ${axis.id} is already registered`);
    }
    
    // Validate namespacing
    if (axis.namespace) {
      if (!axis.id.includes(':')) {
        throw new Error(
          `Extension axis ${axis.id} must be namespaced (expected ${axis.namespace}:${axis.id})`
        );
      }
      const [nsPrefix] = axis.id.split(':');
      if (nsPrefix !== axis.namespace) {
        throw new Error(
          `Axis namespace mismatch: ID has prefix '${nsPrefix}' but namespace is '${axis.namespace}'`
        );
      }
    } else if (axis.id.includes(':')) {
      throw new Error(
        `Builtin axis ${axis.id} must not contain ':' (namespacing reserved for extensions)`
      );
    }
    
    // Validate range
    if (axis.range.min >= axis.range.max) {
      throw new Error(`Invalid axis range for ${axis.id}: min must be < max`);
    }
    if (axis.range.neutral < axis.range.min || axis.range.neutral > axis.range.max) {
      throw new Error(
        `Invalid neutral value for ${axis.id}: must be within [${axis.range.min}, ${axis.range.max}]`
      );
    }
    
    // Validate dimensions weights sum to ~1.0 if present
    if (axis.dimensions && axis.dimensions.length > 0) {
      const totalWeight = axis.dimensions.reduce((sum, dim) => sum + dim.weight, 0);
      if (Math.abs(totalWeight - 1.0) > 0.01) {
        console.warn(
          `Axis ${axis.id} dimension weights sum to ${totalWeight.toFixed(3)}, expected ~1.0`
        );
      }
    }
    
    this.axes.set(axis.id, axis);
    
    if (axis.namespace) {
      const nsSet = this.byNamespace.get(axis.namespace) ?? new Set();
      nsSet.add(axis.id);
      this.byNamespace.set(axis.namespace, nsSet);
    }
  }
  
  /**
   * Unregister an axis (for hot reload or cleanup).
   */
  unregister(axisId: AxisId): boolean {
    const axis = this.axes.get(axisId);
    if (!axis) return false;
    
    this.axes.delete(axisId);
    
    if (axis.namespace) {
      const nsSet = this.byNamespace.get(axis.namespace);
      if (nsSet) {
        nsSet.delete(axisId);
        if (nsSet.size === 0) {
          this.byNamespace.delete(axis.namespace);
        }
      }
    }
    
    return true;
  }
  
  /**
   * Get axis definition by ID.
   */
  get(axisId: AxisId): AxisDefinition | undefined {
    return this.axes.get(axisId);
  }
  
  /**
   * Get all registered axes.
   */
  getAll(): readonly AxisDefinition[] {
    return Array.from(this.axes.values());
  }
  
  /**
   * Get all axes of a specific type.
   */
  getByType(type: AxisType): readonly AxisDefinition[] {
    return Array.from(this.axes.values()).filter(axis => axis.type === type);
  }
  
  /**
   * Get all axes from a specific namespace.
   */
  getByNamespace(namespace: string): readonly AxisDefinition[] {
    const ids = this.byNamespace.get(namespace);
    if (!ids) return [];
    return Array.from(ids).map(id => this.axes.get(id)!).filter(Boolean);
  }
  
  /**
   * Check if an axis exists.
   */
  has(axisId: AxisId): boolean {
    return this.axes.has(axisId);
  }
  
  /**
   * Find axes by tags.
   */
  findByTags(tags: readonly string[]): readonly AxisDefinition[] {
    const tagSet = new Set(tags);
    return Array.from(this.axes.values()).filter(axis =>
      axis.tags?.some(tag => tagSet.has(tag))
    );
  }
  
  /**
   * Find opposite axis if defined.
   */
  getOpposite(axisId: AxisId): AxisDefinition | undefined {
    const axis = this.axes.get(axisId);
    return axis?.opposite ? this.axes.get(axis.opposite) : undefined;
  }
  
  /**
   * Get related axes.
   */
  getRelated(axisId: AxisId): readonly AxisDefinition[] {
    const axis = this.axes.get(axisId);
    if (!axis?.related) return [];
    return axis.related.map(id => this.axes.get(id)!).filter(Boolean);
  }
  
  /**
   * Clear all axes (for testing).
   */
  clear(): void {
    this.axes.clear();
    this.byNamespace.clear();
  }
}

/**
 * Singleton axis registry instance.
 */
export const axisRegistry = new AxisRegistry();

/**
 * Helper to create builtin axis definitions.
 */
export function defineBuiltinAxis(
  id: string,
  displayName: string,
  type: AxisType,
  range: AxisRange,
  description: string,
  options?: {
    opposite?: string;
    related?: readonly string[];
    dimensions?: readonly AxisDimension[];
    examples?: readonly string[];
    tags?: readonly string[];
  }
): AxisDefinition {
  if (id.includes(':')) {
    throw new Error(`Builtin axis ID '${id}' must not contain ':'`);
  }
  
  return {
    id: id as AxisId,
    displayName,
    type,
    range,
    description,
    opposite: options?.opposite as AxisId | undefined,
    related: options?.related as readonly AxisId[] | undefined,
    dimensions: options?.dimensions,
    examples: options?.examples,
    tags: options?.tags,
    schemaVersion: '1.0'
  };
}

/**
 * Helper to create extension axis from pack annotation.
 */
export function axisDefinitionFromAnnotation(
  axisId: AxisId,
  annotation: AxisAnnotation,
  namespace: string
): AxisDefinition {
  const range = annotation.range ?? { min: 0, max: 1, neutral: 0.5, bipolar: false };
  const type = annotation.type ?? 'perceptual';
  const description = annotation.description ?? `Axis ${axisId}`;
  
  return {
    id: axisId,
    displayName: annotation.displayName,
    type,
    range: {
      min: range.min ?? 0,
      max: range.max ?? 1,
      neutral: range.neutral ?? 0.5,
      bipolar: range.bipolar ?? false
    },
    opposite: annotation.opposite as AxisId | undefined,
    related: annotation.related as readonly AxisId[] | undefined,
    dimensions: annotation.dimensions?.map(d => ({
      dimensionId: d.name,
      weight: d.weight ?? 1.0,
      description: d.description
    })),
    description,
    namespace,
    schemaVersion: '1.0'
  };
}

// ============================================================================
// Builtin Axes Registration
// ============================================================================

/**
 * Register all builtin perceptual axes.
 * These are the core axes that don't require any extensions.
 */
export function registerBuiltinAxes(): void {
  // Perceptual: Brightness
  axisRegistry.register(defineBuiltinAxis(
    'brightness',
    'Brightness',
    'perceptual',
    { min: 0, max: 1, neutral: 0.5, bipolar: false },
    'High-frequency emphasis and spectral tilt; bright sounds have more treble energy',
    {
      opposite: 'darkness',
      related: ['warmth', 'air'],
      dimensions: [
        { dimensionId: 'high_frequency_content', weight: 0.6, description: '8kHz+ energy' },
        { dimensionId: 'spectral_centroid', weight: 0.3, description: 'Center of mass of spectrum' },
        { dimensionId: 'presence_boost', weight: 0.1, description: '2-5kHz presence region' }
      ],
      examples: ['make it brighter', 'add more brightness', 'brighten the hi-hats'],
      tags: ['timbre', 'frequency', 'EQ']
    }
  ));
  
  // Perceptual: Darkness
  axisRegistry.register(defineBuiltinAxis(
    'darkness',
    'Darkness',
    'perceptual',
    { min: 0, max: 1, neutral: 0.5, bipolar: false },
    'Low-frequency emphasis and rolled-off highs; dark sounds have more bass weight',
    {
      opposite: 'brightness',
      related: ['warmth', 'weight'],
      dimensions: [
        { dimensionId: 'low_frequency_content', weight: 0.5, description: 'Sub-bass and bass energy' },
        { dimensionId: 'high_frequency_rolloff', weight: 0.4, description: 'Treble attenuation' },
        { dimensionId: 'muddiness', weight: 0.1, description: 'Low-mid emphasis' }
      ],
      examples: ['make it darker', 'darken the mix', 'more darkness'],
      tags: ['timbre', 'frequency', 'EQ']
    }
  ));
  
  // Perceptual: Warmth
  axisRegistry.register(defineBuiltinAxis(
    'warmth',
    'Warmth',
    'perceptual',
    { min: 0, max: 1, neutral: 0.5, bipolar: false },
    'Pleasant low-mid emphasis with smooth highs; warm sounds feel inviting and analog',
    {
      related: ['darkness', 'brightness', 'intimacy'],
      dimensions: [
        { dimensionId: 'low_mid_boost', weight: 0.5, description: '200-500Hz richness' },
        { dimensionId: 'harmonic_distortion', weight: 0.3, description: 'Even harmonic saturation' },
        { dimensionId: 'high_rolloff', weight: 0.2, description: 'Gentle treble taming' }
      ],
      examples: ['make it warmer', 'add warmth', 'warm up the bass'],
      tags: ['timbre', 'frequency', 'saturation']
    }
  ));
  
  // Production: Width
  axisRegistry.register(defineBuiltinAxis(
    'width',
    'Width',
    'production',
    { min: 0, max: 1, neutral: 0.5, bipolar: false },
    'Stereo spread and spatial breadth; wide sounds feel expansive',
    {
      opposite: 'narrowness',
      related: ['depth', 'space'],
      dimensions: [
        { dimensionId: 'stereo_spread', weight: 0.6, description: 'Decorrelation between L/R' },
        { dimensionId: 'side_signal_level', weight: 0.3, description: 'M/S processing' },
        { dimensionId: 'panning_variance', weight: 0.1, description: 'Spread across stereo field' }
      ],
      examples: ['make it wider', 'widen the pads', 'more stereo width'],
      tags: ['stereo', 'space', 'production']
    }
  ));
  
  // Production: Depth
  axisRegistry.register(defineBuiltinAxis(
    'depth',
    'Depth',
    'production',
    { min: 0, max: 1, neutral: 0.5, bipolar: false },
    'Front-to-back spatial positioning; depth creates sense of layers',
    {
      related: ['width', 'space', 'intimacy'],
      dimensions: [
        { dimensionId: 'reverb_amount', weight: 0.5, description: 'Reverb send level' },
        { dimensionId: 'high_frequency_damping', weight: 0.3, description: 'Distance cue via HF loss' },
        { dimensionId: 'early_reflections', weight: 0.2, description: 'Room ambience' }
      ],
      examples: ['add more depth', 'push it back', 'increase depth'],
      tags: ['reverb', 'space', 'production']
    }
  ));
  
  // Compositional: Lift
  axisRegistry.register(defineBuiltinAxis(
    'lift',
    'Lift',
    'compositional',
    { min: 0, max: 1, neutral: 0.5, bipolar: false },
    'Upward energy and trajectory; lift creates a sense of rising or opening',
    {
      opposite: 'weight',
      related: ['brightness', 'density', 'forward_motion'],
      dimensions: [
        { dimensionId: 'register_height', weight: 0.4, description: 'Pitch center of mass' },
        { dimensionId: 'upward_contour', weight: 0.3, description: 'Rising melodic motion' },
        { dimensionId: 'brightness', weight: 0.2, description: 'Brightness increase' },
        { dimensionId: 'density_increase', weight: 0.1, description: 'Adding layers/events' }
      ],
      examples: ['give it more lift', 'lift the chorus', 'add lift'],
      tags: ['energy', 'trajectory', 'arrangement']
    }
  ));
  
  // Compositional: Weight
  axisRegistry.register(defineBuiltinAxis(
    'weight',
    'Weight',
    'compositional',
    { min: 0, max: 1, neutral: 0.5, bipolar: false },
    'Downward pull and gravity; weight grounds and anchors the music',
    {
      opposite: 'lift',
      related: ['darkness', 'density'],
      dimensions: [
        { dimensionId: 'low_frequency_emphasis', weight: 0.5, description: 'Bass prominence' },
        { dimensionId: 'register_lowness', weight: 0.3, description: 'Lower pitch center' },
        { dimensionId: 'rhythmic_density', weight: 0.2, description: 'Thicker rhythmic texture' }
      ],
      examples: ['add more weight', 'make it weightier', 'ground it'],
      tags: ['energy', 'bass', 'arrangement']
    }
  ));
  
  // Compositional: Density
  axisRegistry.register(defineBuiltinAxis(
    'density',
    'Density',
    'compositional',
    { min: 0, max: 1, neutral: 0.5, bipolar: true },
    'Thickness of texture: event rate, layer count, spectral occupancy',
    {
      opposite: 'sparseness',
      related: ['busyness', 'complexity'],
      dimensions: [
        { dimensionId: 'event_rate', weight: 0.4, description: 'Notes per unit time' },
        { dimensionId: 'layer_count', weight: 0.3, description: 'Number of simultaneous voices' },
        { dimensionId: 'spectral_occupancy', weight: 0.3, description: 'Frequency range coverage' }
      ],
      examples: ['make it denser', 'thin it out', 'increase density'],
      tags: ['texture', 'arrangement', 'complexity']
    }
  ));
  
  // Compositional: Forward Motion
  axisRegistry.register(defineBuiltinAxis(
    'forward_motion',
    'Forward Motion',
    'compositional',
    { min: 0, max: 1, neutral: 0.5, bipolar: false },
    'Propulsive energy driving the music forward; creates momentum and inevitability',
    {
      related: ['tension', 'energy', 'rhythmic_drive'],
      dimensions: [
        { dimensionId: 'rhythmic_drive', weight: 0.4, description: 'Groove intensity' },
        { dimensionId: 'harmonic_progression', weight: 0.3, description: 'Chord motion strength' },
        { dimensionId: 'dynamic_trajectory', weight: 0.2, description: 'Volume/intensity curve' },
        { dimensionId: 'anticipation', weight: 0.1, description: 'Leading tones and tension' }
      ],
      examples: ['add forward motion', 'drive it forward', 'more momentum'],
      tags: ['energy', 'rhythm', 'harmony']
    }
  ));
  
  // Symbolic: Harmonic Tension
  axisRegistry.register(defineBuiltinAxis(
    'harmonic_tension',
    'Harmonic Tension',
    'symbolic',
    { min: 0, max: 1, neutral: 0.5, bipolar: true },
    'Dissonance and instability vs. consonance and resolution',
    {
      opposite: 'harmonic_stability',
      related: ['chromaticism', 'complexity'],
      dimensions: [
        { dimensionId: 'dissonance_level', weight: 0.5, description: 'Roughness of intervals' },
        { dimensionId: 'chromaticism', weight: 0.3, description: 'Non-diatonic notes' },
        { dimensionId: 'voice_leading_tension', weight: 0.2, description: 'Approach to resolution' }
      ],
      examples: ['increase tension', 'add harmonic tension', 'make it tenser'],
      tags: ['harmony', 'theory', 'tension']
    }
  ));
  
  // Production: Intimacy
  axisRegistry.register(defineBuiltinAxis(
    'intimacy',
    'Intimacy',
    'production',
    { min: 0, max: 1, neutral: 0.5, bipolar: false },
    'Closeness and presence; intimate sounds feel near and personal',
    {
      related: ['warmth', 'dryness', 'presence'],
      dimensions: [
        { dimensionId: 'dry_signal_emphasis', weight: 0.4, description: 'Minimal reverb' },
        { dimensionId: 'proximity_effect', weight: 0.3, description: 'Close-mic bass boost' },
        { dimensionId: 'presence_boost', weight: 0.2, description: '2-5kHz clarity' },
        { dimensionId: 'breathiness', weight: 0.1, description: 'Vocal detail' }
      ],
      examples: ['make it more intimate', 'bring it closer', 'add intimacy'],
      tags: ['space', 'production', 'presence']
    }
  ));
  
  // Production: Air
  axisRegistry.register(defineBuiltinAxis(
    'air',
    'Air',
    'production',
    { min: 0, max: 1, neutral: 0.5, bipolar: false },
    'Ultra-high-frequency sparkle and breathability; adds shimmer and openness',
    {
      related: ['brightness', 'space'],
      dimensions: [
        { dimensionId: 'ultra_high_boost', weight: 0.7, description: '10kHz+ shelf' },
        { dimensionId: 'reverb_high_pass', weight: 0.2, description: 'Bright reverb tail' },
        { dimensionId: 'harmonic_excitation', weight: 0.1, description: 'High harmonic generation' }
      ],
      examples: ['add air', 'give it more air', 'open up the top end'],
      tags: ['timbre', 'frequency', 'production']
    }
  ));
  
  // Compositional: Rhythmic Complexity
  axisRegistry.register(defineBuiltinAxis(
    'rhythmic_complexity',
    'Rhythmic Complexity',
    'compositional',
    { min: 0, max: 1, neutral: 0.5, bipolar: true },
    'Intricacy of rhythmic patterns: syncopation, polyrhythm, subdivision density',
    {
      opposite: 'rhythmic_simplicity',
      related: ['density', 'busyness'],
      dimensions: [
        { dimensionId: 'syncopation_degree', weight: 0.4, description: 'Off-beat emphasis' },
        { dimensionId: 'subdivision_depth', weight: 0.3, description: 'Note value granularity' },
        { dimensionId: 'polyrhythmic_layers', weight: 0.3, description: 'Cross-rhythms' }
      ],
      examples: ['add rhythmic complexity', 'simplify the rhythm', 'make it more intricate'],
      tags: ['rhythm', 'complexity', 'groove']
    }
  ));
}

// Register builtin axes immediately
registerBuiltinAxes();

/**
 * Extension registration helper.
 * Called when a pack with GOFAI extensions is loaded.
 */
export function registerExtensionAxes(
  axes: Record<string, AxisAnnotation>,
  namespace: string
): void {
  for (const [axisId, annotation] of Object.entries(axes)) {
    const fullId = `${namespace}:${axisId}` as AxisId;
    const definition = axisDefinitionFromAnnotation(fullId, annotation, namespace);
    
    try {
      axisRegistry.register(definition);
    } catch (err) {
      console.error(`Failed to register axis ${fullId} from namespace ${namespace}:`, err);
      throw err;
    }
  }
}

/**
 * Extension unregistration helper.
 * Called when a pack is unloaded or disabled.
 */
export function unregisterExtensionAxes(namespace: string): void {
  const axes = axisRegistry.getByNamespace(namespace);
  for (const axis of axes) {
    axisRegistry.unregister(axis.id);
  }
}
