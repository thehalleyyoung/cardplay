/**
 * GOFAI NL Semantics — Semantic Typing & Affective Adjective Mappings
 *
 * Steps 171–175:
 *   171: Semantic typing for scopes (section refs, bar-range, selectors)
 *   172: Semantic typing for targets (axis modifiers ↔ axis bindings)
 *   173: "make it feel X" → affective adjective → axis bundle mapping
 *   174: "hit harder / more punch" → impact axis + candidate levers
 *   175: "more hopeful" → tension/release + brightness + register
 *
 * @module gofai/nl/semantics/semantic-typing
 */

import type {
  CPLScope,
  CPLTimeRange,
  CPLSelector,
  CPLGoal,
  CPLAmount,
  CPLConstraint,
  Provenance,
} from '../../canon/cpl-types';

// =============================================================================
// § 171 — Semantic Typing for Scopes
// =============================================================================

/**
 * Kind of scope reference a user expression can resolve to.
 */
export type ScopeRefKind =
  | 'section'        // "the chorus", "verse 2"
  | 'bar-range'      // "bars 4-8"
  | 'beat-range'     // "beat 3 of bar 2"
  | 'time-range'     // "0:30 to 1:00"
  | 'marker-range'   // "from marker A to B"
  | 'selection'      // "the selected region"
  | 'entity-set'     // "all synth tracks"
  | 'whole-project'; // "the whole thing"

/**
 * Section reference descriptor.
 */
export interface SectionRef {
  readonly kind: 'section';
  /** Name or ordinal ("chorus", "verse 2") */
  readonly name: string;
  /** Occurrence number (1 = first, 2 = second, etc.) */
  readonly occurrence?: number;
  /** Whether this is a generic reference ("every chorus") */
  readonly universal: boolean;
}

/**
 * Bar-range descriptor — typed ranges for bar references.
 */
export interface BarRangeRef {
  readonly kind: 'bar-range';
  /** Start bar number (1-indexed) */
  readonly startBar: number;
  /** End bar number (inclusive) */
  readonly endBar: number;
  /** Optional beat offset within start bar */
  readonly startBeat?: number;
  /** Optional beat offset within end bar */
  readonly endBeat?: number;
  /** Whether the range is relative to a section */
  readonly relativeToSection?: string;
}

/**
 * Beat-range descriptor.
 */
export interface BeatRangeRef {
  readonly kind: 'beat-range';
  /** Bar number */
  readonly bar: number;
  /** Start beat (1-indexed) */
  readonly startBeat: number;
  /** End beat (inclusive) */
  readonly endBeat: number;
}

/**
 * Time-range descriptor (absolute).
 */
export interface TimeRangeRef {
  readonly kind: 'time-range';
  /** Start in seconds */
  readonly startSeconds: number;
  /** End in seconds */
  readonly endSeconds: number;
}

/**
 * Marker-range descriptor.
 */
export interface MarkerRangeRef {
  readonly kind: 'marker-range';
  /** Start marker name */
  readonly startMarker: string;
  /** End marker name */
  readonly endMarker: string;
}

/**
 * Selection reference (the current UI selection).
 */
export interface SelectionRef {
  readonly kind: 'selection';
  /** Whether it's the primary or a named selection */
  readonly selectionName: 'primary' | string;
}

/**
 * Entity set reference (tracks, layers, cards matching predicates).
 */
export interface EntitySetRef {
  readonly kind: 'entity-set';
  /** Predicate type */
  readonly predicateType: EntityPredicateType;
  /** Predicate value */
  readonly value: string;
  /** Whether to select all matches */
  readonly selectAll: boolean;
  /** Ordinal (e.g., "the first synth track") */
  readonly ordinal?: number;
}

/**
 * Whole-project reference.
 */
export interface WholeProjectRef {
  readonly kind: 'whole-project';
}

/**
 * Entity predicate for selectors.
 */
export type EntityPredicateType =
  | 'track-name'     // by name
  | 'track-type'     // by type (audio, MIDI, aux)
  | 'layer-type'     // by layer type
  | 'role'           // by role (lead, bass, drums)
  | 'tag'            // by tag
  | 'card-type'      // by card type
  | 'instrument'     // by instrument name
  | 'contains'       // tracks containing X
  | 'empty'          // empty tracks
  | 'muted'          // muted tracks
  | 'soloed';        // soloed tracks

/**
 * Union of all typed scope references.
 */
export type TypedScopeRef =
  | SectionRef
  | BarRangeRef
  | BeatRangeRef
  | TimeRangeRef
  | MarkerRangeRef
  | SelectionRef
  | EntitySetRef
  | WholeProjectRef;

// ---------------------------------------------------------------------------
// Scope typing validation
// ---------------------------------------------------------------------------

/**
 * A scope type validation result.
 */
export interface ScopeTypeCheckResult {
  readonly valid: boolean;
  readonly errors: readonly ScopeTypeError[];
  readonly warnings: readonly ScopeTypeWarning[];
  readonly resolvedRef: TypedScopeRef | undefined;
}

/**
 * Scope type error.
 */
export interface ScopeTypeError {
  readonly code: ScopeTypeErrorCode;
  readonly message: string;
  readonly span?: readonly [number, number];
}

export type ScopeTypeErrorCode =
  | 'invalid_section_name'
  | 'bar_out_of_range'
  | 'beat_out_of_range'
  | 'time_out_of_range'
  | 'unknown_marker'
  | 'no_selection_active'
  | 'entity_not_found'
  | 'ambiguous_reference'
  | 'type_mismatch';

/**
 * Scope type warning (non-fatal).
 */
export interface ScopeTypeWarning {
  readonly code: string;
  readonly message: string;
}

/**
 * Known section names for validation.
 */
export const KNOWN_SECTION_NAMES: ReadonlySet<string> = new Set([
  'intro',
  'verse',
  'chorus',
  'bridge',
  'pre-chorus',
  'post-chorus',
  'hook',
  'breakdown',
  'build',
  'buildup',
  'drop',
  'outro',
  'coda',
  'interlude',
  'solo',
  'tag',
  'refrain',
  'turnaround',
  'vamp',
  'middle-eight',
  'instrumental',
  'transition',
]);

/**
 * Scope type-checking context: what's available in the project.
 */
export interface ScopeCheckContext {
  /** Available section names (from project structure) */
  readonly sectionNames: readonly string[];
  /** Total number of bars */
  readonly totalBars: number;
  /** Beats per bar (time signature numerator) */
  readonly beatsPerBar: number;
  /** Total duration in seconds */
  readonly totalSeconds: number;
  /** Available marker names */
  readonly markers: readonly string[];
  /** Whether a UI selection is active */
  readonly hasSelection: boolean;
  /** Available track names */
  readonly trackNames: readonly string[];
  /** Available tags */
  readonly tags: readonly string[];
}

/**
 * Default context for when no project info is available.
 */
export const DEFAULT_SCOPE_CHECK_CONTEXT: ScopeCheckContext = {
  sectionNames: [],
  totalBars: 0,
  beatsPerBar: 4,
  totalSeconds: 0,
  markers: [],
  hasSelection: false,
  trackNames: [],
  tags: [],
};

/**
 * Validate a section reference against project context.
 */
export function validateSectionRef(
  ref: SectionRef,
  ctx: ScopeCheckContext,
): ScopeTypeCheckResult {
  const errors: ScopeTypeError[] = [];
  const warnings: ScopeTypeWarning[] = [];

  const nameLower = ref.name.toLowerCase();

  // Check if the section name is known generically
  const isGenericSection = KNOWN_SECTION_NAMES.has(nameLower);

  // Check if it exists in the project
  const projectSections = ctx.sectionNames.map(s => s.toLowerCase());
  const existsInProject = projectSections.includes(nameLower);

  if (!isGenericSection && !existsInProject) {
    errors.push({
      code: 'invalid_section_name',
      message: `Unknown section name "${ref.name}". Known sections: ${ctx.sectionNames.join(', ') || '(none)'}`,
    });
  }

  if (isGenericSection && !existsInProject && ctx.sectionNames.length > 0) {
    warnings.push({
      code: 'section_not_in_project',
      message: `Section "${ref.name}" is a valid type but not found in this project`,
    });
  }

  if (ref.occurrence !== undefined) {
    const count = projectSections.filter(s => s === nameLower).length;
    if (count > 0 && ref.occurrence > count) {
      errors.push({
        code: 'invalid_section_name',
        message: `Section "${ref.name}" has ${count} occurrence(s) but occurrence #${ref.occurrence} was requested`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    resolvedRef: errors.length === 0 ? ref : undefined,
  };
}

/**
 * Validate a bar-range reference against project context.
 */
export function validateBarRangeRef(
  ref: BarRangeRef,
  ctx: ScopeCheckContext,
): ScopeTypeCheckResult {
  const errors: ScopeTypeError[] = [];
  const warnings: ScopeTypeWarning[] = [];

  if (ref.startBar < 1) {
    errors.push({
      code: 'bar_out_of_range',
      message: `Start bar ${ref.startBar} must be ≥ 1`,
    });
  }

  if (ref.endBar < ref.startBar) {
    errors.push({
      code: 'bar_out_of_range',
      message: `End bar ${ref.endBar} must be ≥ start bar ${ref.startBar}`,
    });
  }

  if (ctx.totalBars > 0 && ref.endBar > ctx.totalBars) {
    errors.push({
      code: 'bar_out_of_range',
      message: `End bar ${ref.endBar} exceeds total bars (${ctx.totalBars})`,
    });
  }

  if (ref.startBeat !== undefined) {
    if (ref.startBeat < 1 || ref.startBeat > ctx.beatsPerBar) {
      errors.push({
        code: 'beat_out_of_range',
        message: `Start beat ${ref.startBeat} out of range (1–${ctx.beatsPerBar})`,
      });
    }
  }

  if (ref.endBeat !== undefined) {
    if (ref.endBeat < 1 || ref.endBeat > ctx.beatsPerBar) {
      errors.push({
        code: 'beat_out_of_range',
        message: `End beat ${ref.endBeat} out of range (1–${ctx.beatsPerBar})`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    resolvedRef: errors.length === 0 ? ref : undefined,
  };
}

/**
 * Validate a time-range reference.
 */
export function validateTimeRangeRef(
  ref: TimeRangeRef,
  ctx: ScopeCheckContext,
): ScopeTypeCheckResult {
  const errors: ScopeTypeError[] = [];
  const warnings: ScopeTypeWarning[] = [];

  if (ref.startSeconds < 0) {
    errors.push({
      code: 'time_out_of_range',
      message: `Start time ${ref.startSeconds}s must be ≥ 0`,
    });
  }

  if (ref.endSeconds < ref.startSeconds) {
    errors.push({
      code: 'time_out_of_range',
      message: `End time ${ref.endSeconds}s must be ≥ start time ${ref.startSeconds}s`,
    });
  }

  if (ctx.totalSeconds > 0 && ref.endSeconds > ctx.totalSeconds) {
    warnings.push({
      code: 'time_exceeds_duration',
      message: `End time ${ref.endSeconds}s exceeds project duration (${ctx.totalSeconds}s)`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    resolvedRef: errors.length === 0 ? ref : undefined,
  };
}

/**
 * Validate a marker-range reference.
 */
export function validateMarkerRangeRef(
  ref: MarkerRangeRef,
  ctx: ScopeCheckContext,
): ScopeTypeCheckResult {
  const errors: ScopeTypeError[] = [];
  const warnings: ScopeTypeWarning[] = [];

  const markersLower = ctx.markers.map(m => m.toLowerCase());

  if (!markersLower.includes(ref.startMarker.toLowerCase())) {
    errors.push({
      code: 'unknown_marker',
      message: `Unknown start marker "${ref.startMarker}". Available: ${ctx.markers.join(', ') || '(none)'}`,
    });
  }

  if (!markersLower.includes(ref.endMarker.toLowerCase())) {
    errors.push({
      code: 'unknown_marker',
      message: `Unknown end marker "${ref.endMarker}". Available: ${ctx.markers.join(', ') || '(none)'}`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    resolvedRef: errors.length === 0 ? ref : undefined,
  };
}

/**
 * Validate an entity-set reference.
 */
export function validateEntitySetRef(
  ref: EntitySetRef,
  ctx: ScopeCheckContext,
): ScopeTypeCheckResult {
  const errors: ScopeTypeError[] = [];
  const warnings: ScopeTypeWarning[] = [];

  if (ref.predicateType === 'track-name') {
    const trackNamesLower = ctx.trackNames.map(t => t.toLowerCase());
    if (ctx.trackNames.length > 0 && !trackNamesLower.includes(ref.value.toLowerCase())) {
      errors.push({
        code: 'entity_not_found',
        message: `Track "${ref.value}" not found. Available: ${ctx.trackNames.join(', ')}`,
      });
    }
  }

  if (ref.predicateType === 'tag') {
    const tagsLower = ctx.tags.map(t => t.toLowerCase());
    if (ctx.tags.length > 0 && !tagsLower.includes(ref.value.toLowerCase())) {
      warnings.push({
        code: 'tag_not_found',
        message: `Tag "${ref.value}" not found in project tags`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    resolvedRef: errors.length === 0 ? ref : undefined,
  };
}

/**
 * Master scope validator — dispatches to typed validators.
 */
export function validateTypedScopeRef(
  ref: TypedScopeRef,
  ctx: ScopeCheckContext = DEFAULT_SCOPE_CHECK_CONTEXT,
): ScopeTypeCheckResult {
  switch (ref.kind) {
    case 'section':
      return validateSectionRef(ref, ctx);
    case 'bar-range':
      return validateBarRangeRef(ref, ctx);
    case 'time-range':
      return validateTimeRangeRef(ref, ctx);
    case 'marker-range':
      return validateMarkerRangeRef(ref, ctx);
    case 'entity-set':
      return validateEntitySetRef(ref, ctx);
    case 'beat-range': {
      const errors: ScopeTypeError[] = [];
      if (ref.bar < 1 || (ctx.totalBars > 0 && ref.bar > ctx.totalBars)) {
        errors.push({
          code: 'bar_out_of_range',
          message: `Bar ${ref.bar} out of range (1–${ctx.totalBars || '?'})`,
        });
      }
      if (ref.startBeat < 1 || ref.startBeat > ctx.beatsPerBar) {
        errors.push({
          code: 'beat_out_of_range',
          message: `Start beat ${ref.startBeat} out of range (1–${ctx.beatsPerBar})`,
        });
      }
      if (ref.endBeat < ref.startBeat || ref.endBeat > ctx.beatsPerBar) {
        errors.push({
          code: 'beat_out_of_range',
          message: `End beat ${ref.endBeat} out of range (${ref.startBeat}–${ctx.beatsPerBar})`,
        });
      }
      return {
        valid: errors.length === 0,
        errors,
        warnings: [],
        resolvedRef: errors.length === 0 ? ref : undefined,
      };
    }
    case 'selection': {
      const errors: ScopeTypeError[] = [];
      if (!ctx.hasSelection && ref.selectionName === 'primary') {
        errors.push({
          code: 'no_selection_active',
          message: 'No selection is currently active',
        });
      }
      return {
        valid: errors.length === 0,
        errors,
        warnings: [],
        resolvedRef: errors.length === 0 ? ref : undefined,
      };
    }
    case 'whole-project':
      return { valid: true, errors: [], warnings: [], resolvedRef: ref };
  }
}

/**
 * Convert a typed scope ref to a CPL scope node.
 */
export function typedScopeRefToCPL(
  ref: TypedScopeRef,
  provenance?: Provenance,
): CPLScope {
  const baseScope: CPLScope = Object.assign(
    { type: 'scope' as const, id: `scope-${ref.kind}-${Date.now()}` },
    provenance ? { provenance } : {},
  ) as CPLScope;

  switch (ref.kind) {
    case 'section': {
      const sections = ref.universal
        ? [ref.name]
        : [ref.occurrence ? `${ref.name}:${ref.occurrence}` : ref.name];
      const timeRange: CPLTimeRange = {
        type: 'time-range',
        id: `tr-section-${Date.now()}`,
        sections,
      };
      return Object.assign({}, baseScope, { timeRange });
    }
    case 'bar-range': {
      const timeRange: CPLTimeRange = {
        type: 'time-range',
        id: `tr-bars-${Date.now()}`,
        bars: [ref.startBar, ref.endBar] as const,
      };
      return Object.assign({}, baseScope, { timeRange });
    }
    case 'beat-range': {
      const timeRange: CPLTimeRange = {
        type: 'time-range',
        id: `tr-beats-${Date.now()}`,
        bars: [ref.bar, ref.bar] as const,
      };
      return Object.assign({}, baseScope, { timeRange });
    }
    case 'time-range': {
      const timeRange: CPLTimeRange = {
        type: 'time-range',
        id: `tr-time-${Date.now()}`,
        start: ref.startSeconds * 1000, // Convert to ticks (simplified)
        end: ref.endSeconds * 1000,
      };
      return Object.assign({}, baseScope, { timeRange });
    }
    case 'marker-range': {
      const timeRange: CPLTimeRange = {
        type: 'time-range',
        id: `tr-markers-${Date.now()}`,
        sections: [`@marker:${ref.startMarker}`, `@marker:${ref.endMarker}`],
      };
      return Object.assign({}, baseScope, { timeRange });
    }
    case 'selection':
      return Object.assign({}, baseScope, {
        entities: {
          type: 'selector' as const,
          id: `sel-selection-${Date.now()}`,
          kind: 'all' as const,
          value: `@selection:${ref.selectionName}`,
        } satisfies CPLSelector,
      });
    case 'entity-set': {
      const selectorKindMap: Record<EntityPredicateType, CPLSelector['kind']> = {
        'track-name': 'track',
        'track-type': 'track',
        'layer-type': 'layer',
        'role': 'role',
        'tag': 'tag',
        'card-type': 'card',
        'instrument': 'track',
        'contains': 'track',
        'empty': 'track',
        'muted': 'track',
        'soloed': 'track',
      };
      const entities: CPLSelector = {
        type: 'selector',
        id: `sel-entity-${Date.now()}`,
        kind: selectorKindMap[ref.predicateType],
        value: ref.value,
      };
      return Object.assign({}, baseScope, { entities });
    }
    case 'whole-project':
      return baseScope;
  }
}

// =============================================================================
// § 172 — Semantic Typing for Targets (Axis Modifier ↔ Axis Bindings)
// =============================================================================

/**
 * A target typing context: what axes and levers exist.
 */
export interface TargetTypeContext {
  /** Known perceptual axis names */
  readonly axisNames: readonly string[];
  /** Axis → lever mappings */
  readonly axisLevers: ReadonlyMap<string, readonly string[]>;
  /** Entity → axis binding (e.g., "the bass" binds to bass-related axes) */
  readonly entityAxisBindings: ReadonlyMap<string, readonly string[]>;
  /** Known lever names */
  readonly leverNames: readonly string[];
}

/**
 * Axis modifier: an intent to modify a named axis.
 */
export interface AxisModifier {
  readonly axis: string;
  readonly direction: 'increase' | 'decrease' | 'set';
  readonly amount?: CPLAmount;
  /** Source (e.g., "brighter" → brightness axis) */
  readonly sourceWord?: string;
}

/**
 * Target type check result.
 */
export interface TargetTypeCheckResult {
  readonly valid: boolean;
  readonly errors: readonly TargetTypeError[];
  readonly warnings: readonly TargetTypeWarning[];
  readonly resolvedModifier: AxisModifier | undefined;
  /** Candidate levers that could implement this axis change */
  readonly candidateLevers: readonly string[];
}

/**
 * Target type error.
 */
export interface TargetTypeError {
  readonly code: TargetTypeErrorCode;
  readonly message: string;
}

export type TargetTypeErrorCode =
  | 'unknown_axis'
  | 'axis_not_bindable'
  | 'conflicting_direction'
  | 'invalid_amount'
  | 'no_levers_available';

/**
 * Target type warning.
 */
export interface TargetTypeWarning {
  readonly code: string;
  readonly message: string;
}

/**
 * Default axes in the system.
 */
export const DEFAULT_AXES: readonly string[] = [
  'brightness',
  'warmth',
  'density',
  'spaciousness',
  'tension',
  'energy',
  'complexity',
  'weight',
  'depth',
  'width',
  'clarity',
  'aggression',
  'smoothness',
  'sharpness',
  'fullness',
  'thinness',
  'presence',
  'air',
  'mud',
  'harshness',
  'punch',
  'impact',
  'shimmer',
  'grittiness',
  'lushness',
];

/**
 * Default axis-to-lever mappings.
 * Maps each axis to the levers (parameters) that can change it.
 */
export const DEFAULT_AXIS_LEVER_MAP: ReadonlyMap<string, readonly string[]> = new Map([
  ['brightness', ['eq-high-shelf', 'eq-presence', 'filter-cutoff', 'saturation', 'exciter']],
  ['warmth', ['eq-low-mid', 'saturation', 'tube-drive', 'tape-emulation', 'filter-cutoff']],
  ['density', ['compression-ratio', 'compression-threshold', 'event-density', 'layer-count', 'velocity-spread']],
  ['spaciousness', ['reverb-size', 'reverb-mix', 'delay-mix', 'stereo-width', 'pre-delay']],
  ['tension', ['dissonance', 'tempo-ramp', 'filter-sweep', 'dynamics-range', 'velocity-curve']],
  ['energy', ['velocity-range', 'event-density', 'tempo', 'dynamics-level', 'compression-ratio']],
  ['complexity', ['voice-count', 'rhythmic-variation', 'harmonic-density', 'event-density', 'layer-count']],
  ['weight', ['eq-low-shelf', 'sub-bass', 'compression-attack', 'bus-compression', 'fundamental']],
  ['depth', ['reverb-mix', 'reverb-size', 'eq-presence', 'delay-feedback', 'pre-delay']],
  ['width', ['stereo-width', 'pan-spread', 'haas-delay', 'mid-side-ratio', 'chorus-spread']],
  ['clarity', ['eq-presence', 'compression-ratio', 'de-esser', 'transient-shaping', 'filter-resonance']],
  ['aggression', ['distortion', 'saturation', 'transient-shaping', 'compression-ratio', 'eq-presence']],
  ['smoothness', ['eq-high-shelf', 'compression-attack', 'saturation', 'filter-resonance', 'de-esser']],
  ['sharpness', ['transient-shaping', 'eq-presence', 'compression-attack', 'exciter', 'filter-resonance']],
  ['fullness', ['eq-low-mid', 'eq-mid', 'compression-ratio', 'layer-count', 'stereo-width']],
  ['thinness', ['eq-low-cut', 'eq-low-mid', 'layer-count', 'filter-cutoff', 'stereo-width']],
  ['presence', ['eq-presence', 'compression-ratio', 'saturation', 'transient-shaping', 'vocal-rider']],
  ['air', ['eq-high-shelf', 'exciter', 'reverb-mix', 'stereo-width', 'shimmer']],
  ['mud', ['eq-low-mid', 'eq-low-cut', 'compression-ratio', 'reverb-mix', 'filter-resonance']],
  ['harshness', ['eq-presence', 'de-esser', 'saturation', 'filter-resonance', 'compression-ratio']],
  ['punch', ['transient-shaping', 'compression-attack', 'eq-mid', 'bus-compression', 'parallel-compression']],
  ['impact', ['transient-shaping', 'compression-attack', 'eq-low-shelf', 'bus-compression', 'limiter-threshold']],
  ['shimmer', ['eq-high-shelf', 'chorus-rate', 'reverb-mix', 'exciter', 'modulation-depth']],
  ['grittiness', ['distortion', 'saturation', 'bit-crush', 'tape-emulation', 'amp-sim']],
  ['lushness', ['reverb-mix', 'chorus-depth', 'modulation-depth', 'stereo-width', 'layer-count']],
]);

/**
 * Default entity-to-axis bindings.
 * E.g., "the bass" naturally binds to weight/fullness/low-frequency axes.
 */
export const DEFAULT_ENTITY_AXIS_BINDINGS: ReadonlyMap<string, readonly string[]> = new Map([
  ['bass', ['weight', 'fullness', 'warmth', 'punch']],
  ['kick', ['weight', 'punch', 'impact', 'depth']],
  ['snare', ['punch', 'sharpness', 'clarity', 'impact']],
  ['hi-hat', ['brightness', 'sharpness', 'air', 'clarity']],
  ['cymbals', ['brightness', 'shimmer', 'air', 'harshness']],
  ['vocal', ['presence', 'clarity', 'warmth', 'air']],
  ['vocals', ['presence', 'clarity', 'warmth', 'air']],
  ['guitar', ['brightness', 'warmth', 'grittiness', 'presence']],
  ['piano', ['brightness', 'warmth', 'clarity', 'fullness']],
  ['keys', ['brightness', 'warmth', 'clarity', 'fullness']],
  ['synth', ['brightness', 'warmth', 'spaciousness', 'density']],
  ['pad', ['spaciousness', 'warmth', 'lushness', 'depth']],
  ['strings', ['warmth', 'lushness', 'smoothness', 'fullness']],
  ['brass', ['brightness', 'presence', 'aggression', 'warmth']],
  ['drums', ['punch', 'impact', 'energy', 'density']],
  ['percussion', ['sharpness', 'clarity', 'energy', 'density']],
  ['lead', ['presence', 'brightness', 'clarity', 'energy']],
  ['mix', ['clarity', 'width', 'depth', 'fullness']],
  ['master', ['clarity', 'width', 'fullness', 'energy']],
]);

/**
 * Build a default target type context.
 */
export function buildDefaultTargetTypeContext(): TargetTypeContext {
  const allLevers = new Set<string>();
  for (const levers of DEFAULT_AXIS_LEVER_MAP.values()) {
    for (const lever of levers) {
      allLevers.add(lever);
    }
  }
  return {
    axisNames: DEFAULT_AXES,
    axisLevers: DEFAULT_AXIS_LEVER_MAP,
    entityAxisBindings: DEFAULT_ENTITY_AXIS_BINDINGS,
    leverNames: [...allLevers],
  };
}

/**
 * Validate an axis modifier against the target type context.
 */
export function validateAxisModifier(
  modifier: AxisModifier,
  ctx: TargetTypeContext = buildDefaultTargetTypeContext(),
): TargetTypeCheckResult {
  const errors: TargetTypeError[] = [];
  const warnings: TargetTypeWarning[] = [];
  let candidateLevers: string[] = [];

  // Check if axis is known
  if (!ctx.axisNames.includes(modifier.axis)) {
    errors.push({
      code: 'unknown_axis',
      message: `Unknown axis "${modifier.axis}". Known axes: ${ctx.axisNames.slice(0, 10).join(', ')}...`,
    });
  } else {
    // Get candidate levers
    const levers = ctx.axisLevers.get(modifier.axis);
    if (levers && levers.length > 0) {
      candidateLevers = [...levers];
    } else {
      warnings.push({
        code: 'no_default_levers',
        message: `Axis "${modifier.axis}" has no default lever mappings`,
      });
    }
  }

  // Validate amount if present
  if (modifier.amount) {
    if (modifier.amount.type === 'absolute' && modifier.amount.value !== undefined) {
      if (modifier.amount.value < 0 || modifier.amount.value > 1000) {
        warnings.push({
          code: 'extreme_amount',
          message: `Amount value ${modifier.amount.value} is outside typical range (0–100)`,
        });
      }
    }
    if (modifier.amount.type === 'percentage' && modifier.amount.value !== undefined) {
      if (modifier.amount.value < -100 || modifier.amount.value > 1000) {
        warnings.push({
          code: 'extreme_percentage',
          message: `Percentage ${modifier.amount.value}% is outside typical range`,
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    resolvedModifier: errors.length === 0 ? modifier : undefined,
    candidateLevers,
  };
}

/**
 * Resolve entity-bound axis modifiers.
 * E.g., "make the bass heavier" → entity "bass" binds to weight axis → increase weight.
 */
export function resolveEntityAxisBinding(
  entityName: string,
  axisHint: string | undefined,
  ctx: TargetTypeContext = buildDefaultTargetTypeContext(),
): readonly string[] {
  const entityLower = entityName.toLowerCase();
  const bindings = ctx.entityAxisBindings.get(entityLower);
  if (!bindings || bindings.length === 0) {
    return [];
  }

  if (axisHint) {
    // If there's a hint, check if the entity has that binding
    const hintLower = axisHint.toLowerCase();
    if (bindings.includes(hintLower)) {
      return [hintLower];
    }
    // No match — return all bindings with a note
    return [...bindings];
  }

  return [...bindings];
}

/**
 * Convert an axis modifier to a CPL goal.
 */
export function axisModifierToCPL(
  modifier: AxisModifier,
  provenance?: Provenance,
): CPLGoal {
  const base: CPLGoal = Object.assign(
    { type: 'goal' as const, id: `goal-axis-${modifier.axis}-${Date.now()}`, variant: 'axis-goal' as const },
    provenance ? { provenance } : {},
  ) as CPLGoal;
  return Object.assign(base, {
    axis: modifier.axis,
    direction: modifier.direction,
    targetValue: modifier.amount,
  });
}

// =============================================================================
// § 173 — "Make It Feel X" — Affective Adjective → Axis Bundle Mapping
// =============================================================================

/**
 * An affective adjective mapping: maps an adjective to a bundle of axis changes.
 */
export interface AffectiveAdjectiveMapping {
  /** The adjective ("dark", "bright", "aggressive", "smooth") */
  readonly adjective: string;
  /** Category of affect */
  readonly category: AffectiveCategory;
  /** Axis bundle: which axes change and by how much */
  readonly axisBundle: readonly AffectiveAxisEntry[];
  /** Candidate levers to achieve this affect */
  readonly candidateLevers: readonly AffectiveLeverCandidate[];
  /** Opposite adjective (if any) */
  readonly opposite?: string;
  /** Intensity default (0–1) */
  readonly defaultIntensity: number;
  /** Synonyms */
  readonly synonyms: readonly string[];
}

/**
 * Category of affective adjectives.
 */
export type AffectiveCategory =
  | 'tonal'          // brightness, warmth, darkness
  | 'spatial'        // wide, narrow, deep, close
  | 'dynamic'        // punchy, smooth, aggressive, gentle
  | 'textural'       // gritty, silky, rough, clean
  | 'emotional'      // happy, sad, hopeful, dark, angry
  | 'energetic'      // energetic, laid-back, driving, mellow
  | 'aesthetic'      // vintage, modern, lo-fi, hi-fi, polished, raw
  | 'density';       // thick, thin, sparse, dense, full

/**
 * Entry in an affective axis bundle.
 */
export interface AffectiveAxisEntry {
  /** Axis name */
  readonly axis: string;
  /** Direction of change for this axis */
  readonly direction: 'increase' | 'decrease';
  /** Relative weight of this axis in the bundle (0–1) */
  readonly weight: number;
}

/**
 * Candidate lever for implementing an affective change.
 */
export interface AffectiveLeverCandidate {
  /** Lever name */
  readonly lever: string;
  /** Direction for this lever */
  readonly direction: 'increase' | 'decrease' | 'set';
  /** Priority (higher = try first) */
  readonly priority: number;
  /** Suggested value (if applicable) */
  readonly suggestedValue?: number;
}

/**
 * Full database of affective adjective mappings.
 */
export const AFFECTIVE_ADJECTIVE_DB: readonly AffectiveAdjectiveMapping[] = [
  // ── Tonal ──
  {
    adjective: 'bright',
    category: 'tonal',
    axisBundle: [
      { axis: 'brightness', direction: 'increase', weight: 1.0 },
      { axis: 'presence', direction: 'increase', weight: 0.5 },
      { axis: 'air', direction: 'increase', weight: 0.3 },
    ],
    candidateLevers: [
      { lever: 'eq-high-shelf', direction: 'increase', priority: 1 },
      { lever: 'exciter', direction: 'increase', priority: 2 },
      { lever: 'filter-cutoff', direction: 'increase', priority: 3 },
    ],
    opposite: 'dark',
    defaultIntensity: 0.5,
    synonyms: ['brighter', 'sparkling', 'shiny', 'brilliant', 'crisp'],
  },
  {
    adjective: 'dark',
    category: 'tonal',
    axisBundle: [
      { axis: 'brightness', direction: 'decrease', weight: 1.0 },
      { axis: 'warmth', direction: 'increase', weight: 0.5 },
      { axis: 'weight', direction: 'increase', weight: 0.3 },
    ],
    candidateLevers: [
      { lever: 'eq-high-shelf', direction: 'decrease', priority: 1 },
      { lever: 'filter-cutoff', direction: 'decrease', priority: 2 },
      { lever: 'eq-low-mid', direction: 'increase', priority: 3 },
    ],
    opposite: 'bright',
    defaultIntensity: 0.5,
    synonyms: ['darker', 'shadowy', 'moody', 'subdued'],
  },
  {
    adjective: 'warm',
    category: 'tonal',
    axisBundle: [
      { axis: 'warmth', direction: 'increase', weight: 1.0 },
      { axis: 'brightness', direction: 'decrease', weight: 0.3 },
      { axis: 'smoothness', direction: 'increase', weight: 0.4 },
    ],
    candidateLevers: [
      { lever: 'saturation', direction: 'increase', priority: 1 },
      { lever: 'eq-low-mid', direction: 'increase', priority: 2 },
      { lever: 'tube-drive', direction: 'increase', priority: 3 },
      { lever: 'tape-emulation', direction: 'increase', priority: 4 },
    ],
    opposite: 'cold',
    defaultIntensity: 0.5,
    synonyms: ['warmer', 'cozy', 'toasty', 'rich'],
  },
  {
    adjective: 'cold',
    category: 'tonal',
    axisBundle: [
      { axis: 'warmth', direction: 'decrease', weight: 1.0 },
      { axis: 'brightness', direction: 'increase', weight: 0.4 },
      { axis: 'sharpness', direction: 'increase', weight: 0.3 },
    ],
    candidateLevers: [
      { lever: 'eq-low-mid', direction: 'decrease', priority: 1 },
      { lever: 'eq-high-shelf', direction: 'increase', priority: 2 },
      { lever: 'saturation', direction: 'decrease', priority: 3 },
    ],
    opposite: 'warm',
    defaultIntensity: 0.5,
    synonyms: ['colder', 'icy', 'sterile', 'clinical'],
  },
  // ── Spatial ──
  {
    adjective: 'wide',
    category: 'spatial',
    axisBundle: [
      { axis: 'width', direction: 'increase', weight: 1.0 },
      { axis: 'spaciousness', direction: 'increase', weight: 0.6 },
    ],
    candidateLevers: [
      { lever: 'stereo-width', direction: 'increase', priority: 1 },
      { lever: 'pan-spread', direction: 'increase', priority: 2 },
      { lever: 'haas-delay', direction: 'increase', priority: 3 },
      { lever: 'chorus-spread', direction: 'increase', priority: 4 },
    ],
    opposite: 'narrow',
    defaultIntensity: 0.5,
    synonyms: ['wider', 'spacious', 'expansive', 'spread out', 'open'],
  },
  {
    adjective: 'narrow',
    category: 'spatial',
    axisBundle: [
      { axis: 'width', direction: 'decrease', weight: 1.0 },
      { axis: 'spaciousness', direction: 'decrease', weight: 0.4 },
    ],
    candidateLevers: [
      { lever: 'stereo-width', direction: 'decrease', priority: 1 },
      { lever: 'pan-spread', direction: 'decrease', priority: 2 },
      { lever: 'mid-side-ratio', direction: 'increase', priority: 3 },
    ],
    opposite: 'wide',
    defaultIntensity: 0.5,
    synonyms: ['narrower', 'tight', 'focused', 'mono-ish'],
  },
  {
    adjective: 'deep',
    category: 'spatial',
    axisBundle: [
      { axis: 'depth', direction: 'increase', weight: 1.0 },
      { axis: 'spaciousness', direction: 'increase', weight: 0.5 },
      { axis: 'weight', direction: 'increase', weight: 0.3 },
    ],
    candidateLevers: [
      { lever: 'reverb-mix', direction: 'increase', priority: 1 },
      { lever: 'reverb-size', direction: 'increase', priority: 2 },
      { lever: 'pre-delay', direction: 'increase', priority: 3 },
      { lever: 'eq-presence', direction: 'decrease', priority: 4 },
    ],
    opposite: 'shallow',
    defaultIntensity: 0.5,
    synonyms: ['deeper', 'cavernous', 'bottomless', 'immersive'],
  },
  {
    adjective: 'dry',
    category: 'spatial',
    axisBundle: [
      { axis: 'spaciousness', direction: 'decrease', weight: 1.0 },
      { axis: 'depth', direction: 'decrease', weight: 0.6 },
      { axis: 'clarity', direction: 'increase', weight: 0.3 },
    ],
    candidateLevers: [
      { lever: 'reverb-mix', direction: 'decrease', priority: 1 },
      { lever: 'delay-mix', direction: 'decrease', priority: 2 },
      { lever: 'chorus-depth', direction: 'decrease', priority: 3 },
    ],
    opposite: 'wet',
    defaultIntensity: 0.5,
    synonyms: ['drier', 'dead', 'upfront', 'in-your-face'],
  },
  {
    adjective: 'wet',
    category: 'spatial',
    axisBundle: [
      { axis: 'spaciousness', direction: 'increase', weight: 1.0 },
      { axis: 'depth', direction: 'increase', weight: 0.5 },
      { axis: 'lushness', direction: 'increase', weight: 0.4 },
    ],
    candidateLevers: [
      { lever: 'reverb-mix', direction: 'increase', priority: 1 },
      { lever: 'delay-mix', direction: 'increase', priority: 2 },
      { lever: 'chorus-depth', direction: 'increase', priority: 3 },
    ],
    opposite: 'dry',
    defaultIntensity: 0.5,
    synonyms: ['wetter', 'drenched', 'swimming', 'washed'],
  },
  // ── Dynamic ──
  {
    adjective: 'punchy',
    category: 'dynamic',
    axisBundle: [
      { axis: 'punch', direction: 'increase', weight: 1.0 },
      { axis: 'impact', direction: 'increase', weight: 0.7 },
      { axis: 'energy', direction: 'increase', weight: 0.3 },
    ],
    candidateLevers: [
      { lever: 'transient-shaping', direction: 'increase', priority: 1 },
      { lever: 'compression-attack', direction: 'decrease', priority: 2 },
      { lever: 'parallel-compression', direction: 'increase', priority: 3 },
      { lever: 'eq-mid', direction: 'increase', priority: 4 },
    ],
    opposite: 'soft',
    defaultIntensity: 0.6,
    synonyms: ['punchier', 'snappy', 'tight', 'driving'],
  },
  {
    adjective: 'smooth',
    category: 'dynamic',
    axisBundle: [
      { axis: 'smoothness', direction: 'increase', weight: 1.0 },
      { axis: 'harshness', direction: 'decrease', weight: 0.6 },
      { axis: 'sharpness', direction: 'decrease', weight: 0.4 },
    ],
    candidateLevers: [
      { lever: 'compression-attack', direction: 'increase', priority: 1 },
      { lever: 'eq-presence', direction: 'decrease', priority: 2 },
      { lever: 'saturation', direction: 'increase', priority: 3, suggestedValue: 0.2 },
      { lever: 'de-esser', direction: 'increase', priority: 4 },
    ],
    opposite: 'rough',
    defaultIntensity: 0.5,
    synonyms: ['smoother', 'silky', 'buttery', 'satin', 'velvety'],
  },
  {
    adjective: 'aggressive',
    category: 'dynamic',
    axisBundle: [
      { axis: 'aggression', direction: 'increase', weight: 1.0 },
      { axis: 'energy', direction: 'increase', weight: 0.6 },
      { axis: 'sharpness', direction: 'increase', weight: 0.4 },
      { axis: 'grittiness', direction: 'increase', weight: 0.3 },
    ],
    candidateLevers: [
      { lever: 'distortion', direction: 'increase', priority: 1 },
      { lever: 'compression-ratio', direction: 'increase', priority: 2 },
      { lever: 'transient-shaping', direction: 'increase', priority: 3 },
      { lever: 'eq-presence', direction: 'increase', priority: 4 },
    ],
    opposite: 'gentle',
    defaultIntensity: 0.6,
    synonyms: ['more aggressive', 'edgy', 'fierce', 'intense', 'in-your-face'],
  },
  {
    adjective: 'gentle',
    category: 'dynamic',
    axisBundle: [
      { axis: 'aggression', direction: 'decrease', weight: 1.0 },
      { axis: 'smoothness', direction: 'increase', weight: 0.5 },
      { axis: 'warmth', direction: 'increase', weight: 0.3 },
    ],
    candidateLevers: [
      { lever: 'compression-attack', direction: 'increase', priority: 1 },
      { lever: 'eq-presence', direction: 'decrease', priority: 2 },
      { lever: 'transient-shaping', direction: 'decrease', priority: 3 },
    ],
    opposite: 'aggressive',
    defaultIntensity: 0.5,
    synonyms: ['gentler', 'soft', 'mellow', 'tender', 'delicate'],
  },
  // ── Textural ──
  {
    adjective: 'gritty',
    category: 'textural',
    axisBundle: [
      { axis: 'grittiness', direction: 'increase', weight: 1.0 },
      { axis: 'warmth', direction: 'increase', weight: 0.3 },
      { axis: 'aggression', direction: 'increase', weight: 0.3 },
    ],
    candidateLevers: [
      { lever: 'saturation', direction: 'increase', priority: 1 },
      { lever: 'distortion', direction: 'increase', priority: 2 },
      { lever: 'bit-crush', direction: 'increase', priority: 3 },
      { lever: 'tape-emulation', direction: 'increase', priority: 4 },
    ],
    opposite: 'clean',
    defaultIntensity: 0.5,
    synonyms: ['grittier', 'dirty', 'crunchy', 'raw', 'distorted'],
  },
  {
    adjective: 'clean',
    category: 'textural',
    axisBundle: [
      { axis: 'grittiness', direction: 'decrease', weight: 1.0 },
      { axis: 'clarity', direction: 'increase', weight: 0.6 },
      { axis: 'harshness', direction: 'decrease', weight: 0.3 },
    ],
    candidateLevers: [
      { lever: 'distortion', direction: 'decrease', priority: 1 },
      { lever: 'saturation', direction: 'decrease', priority: 2 },
      { lever: 'eq-presence', direction: 'increase', priority: 3 },
    ],
    opposite: 'gritty',
    defaultIntensity: 0.5,
    synonyms: ['cleaner', 'pristine', 'polished', 'crystal-clear', 'transparent'],
  },
  // ── Emotional ──
  {
    adjective: 'happy',
    category: 'emotional',
    axisBundle: [
      { axis: 'brightness', direction: 'increase', weight: 0.7 },
      { axis: 'energy', direction: 'increase', weight: 0.6 },
      { axis: 'warmth', direction: 'increase', weight: 0.4 },
      { axis: 'air', direction: 'increase', weight: 0.3 },
    ],
    candidateLevers: [
      { lever: 'eq-high-shelf', direction: 'increase', priority: 1 },
      { lever: 'tempo', direction: 'increase', priority: 2 },
      { lever: 'exciter', direction: 'increase', priority: 3 },
    ],
    opposite: 'sad',
    defaultIntensity: 0.5,
    synonyms: ['happier', 'joyful', 'uplifting', 'cheerful', 'upbeat'],
  },
  {
    adjective: 'sad',
    category: 'emotional',
    axisBundle: [
      { axis: 'brightness', direction: 'decrease', weight: 0.6 },
      { axis: 'energy', direction: 'decrease', weight: 0.5 },
      { axis: 'warmth', direction: 'increase', weight: 0.3 },
      { axis: 'spaciousness', direction: 'increase', weight: 0.4 },
    ],
    candidateLevers: [
      { lever: 'eq-high-shelf', direction: 'decrease', priority: 1 },
      { lever: 'reverb-mix', direction: 'increase', priority: 2 },
      { lever: 'tempo', direction: 'decrease', priority: 3 },
    ],
    opposite: 'happy',
    defaultIntensity: 0.5,
    synonyms: ['sadder', 'melancholic', 'somber', 'mournful', 'wistful'],
  },
  {
    adjective: 'angry',
    category: 'emotional',
    axisBundle: [
      { axis: 'aggression', direction: 'increase', weight: 1.0 },
      { axis: 'energy', direction: 'increase', weight: 0.7 },
      { axis: 'sharpness', direction: 'increase', weight: 0.5 },
      { axis: 'density', direction: 'increase', weight: 0.3 },
    ],
    candidateLevers: [
      { lever: 'distortion', direction: 'increase', priority: 1 },
      { lever: 'compression-ratio', direction: 'increase', priority: 2 },
      { lever: 'transient-shaping', direction: 'increase', priority: 3 },
      { lever: 'eq-presence', direction: 'increase', priority: 4 },
    ],
    opposite: 'calm',
    defaultIntensity: 0.6,
    synonyms: ['angrier', 'furious', 'enraged', 'hostile', 'wrathful'],
  },
  {
    adjective: 'calm',
    category: 'emotional',
    axisBundle: [
      { axis: 'aggression', direction: 'decrease', weight: 0.7 },
      { axis: 'energy', direction: 'decrease', weight: 0.5 },
      { axis: 'smoothness', direction: 'increase', weight: 0.6 },
      { axis: 'spaciousness', direction: 'increase', weight: 0.4 },
    ],
    candidateLevers: [
      { lever: 'compression-attack', direction: 'increase', priority: 1 },
      { lever: 'reverb-mix', direction: 'increase', priority: 2 },
      { lever: 'transient-shaping', direction: 'decrease', priority: 3 },
      { lever: 'eq-presence', direction: 'decrease', priority: 4 },
    ],
    opposite: 'angry',
    defaultIntensity: 0.5,
    synonyms: ['calmer', 'peaceful', 'serene', 'tranquil', 'zen'],
  },
  {
    adjective: 'dreamy',
    category: 'emotional',
    axisBundle: [
      { axis: 'spaciousness', direction: 'increase', weight: 0.8 },
      { axis: 'smoothness', direction: 'increase', weight: 0.6 },
      { axis: 'warmth', direction: 'increase', weight: 0.4 },
      { axis: 'lushness', direction: 'increase', weight: 0.7 },
      { axis: 'depth', direction: 'increase', weight: 0.5 },
    ],
    candidateLevers: [
      { lever: 'reverb-mix', direction: 'increase', priority: 1 },
      { lever: 'chorus-depth', direction: 'increase', priority: 2 },
      { lever: 'modulation-depth', direction: 'increase', priority: 3 },
      { lever: 'filter-cutoff', direction: 'decrease', priority: 4 },
    ],
    opposite: 'harsh',
    defaultIntensity: 0.6,
    synonyms: ['dreamier', 'ethereal', 'floaty', 'hazy', 'otherworldly'],
  },
  {
    adjective: 'nostalgic',
    category: 'emotional',
    axisBundle: [
      { axis: 'warmth', direction: 'increase', weight: 0.8 },
      { axis: 'brightness', direction: 'decrease', weight: 0.4 },
      { axis: 'grittiness', direction: 'increase', weight: 0.3 },
      { axis: 'spaciousness', direction: 'increase', weight: 0.3 },
    ],
    candidateLevers: [
      { lever: 'tape-emulation', direction: 'increase', priority: 1 },
      { lever: 'saturation', direction: 'increase', priority: 2 },
      { lever: 'eq-high-shelf', direction: 'decrease', priority: 3 },
      { lever: 'vinyl-noise', direction: 'increase', priority: 4 },
    ],
    defaultIntensity: 0.5,
    synonyms: ['retro', 'throwback', 'old-school', 'vintage-sounding'],
  },
  // ── Energetic ──
  {
    adjective: 'energetic',
    category: 'energetic',
    axisBundle: [
      { axis: 'energy', direction: 'increase', weight: 1.0 },
      { axis: 'density', direction: 'increase', weight: 0.5 },
      { axis: 'punch', direction: 'increase', weight: 0.4 },
      { axis: 'brightness', direction: 'increase', weight: 0.3 },
    ],
    candidateLevers: [
      { lever: 'velocity-range', direction: 'increase', priority: 1 },
      { lever: 'event-density', direction: 'increase', priority: 2 },
      { lever: 'compression-ratio', direction: 'increase', priority: 3 },
      { lever: 'tempo', direction: 'increase', priority: 4 },
    ],
    opposite: 'laid-back',
    defaultIntensity: 0.6,
    synonyms: ['more energetic', 'lively', 'dynamic', 'vibrant', 'high-energy'],
  },
  {
    adjective: 'laid-back',
    category: 'energetic',
    axisBundle: [
      { axis: 'energy', direction: 'decrease', weight: 0.8 },
      { axis: 'smoothness', direction: 'increase', weight: 0.5 },
      { axis: 'warmth', direction: 'increase', weight: 0.3 },
      { axis: 'spaciousness', direction: 'increase', weight: 0.3 },
    ],
    candidateLevers: [
      { lever: 'velocity-range', direction: 'decrease', priority: 1 },
      { lever: 'compression-attack', direction: 'increase', priority: 2 },
      { lever: 'tempo', direction: 'decrease', priority: 3 },
    ],
    opposite: 'energetic',
    defaultIntensity: 0.5,
    synonyms: ['more laid-back', 'relaxed', 'chill', 'easygoing', 'mellow'],
  },
  // ── Aesthetic ──
  {
    adjective: 'vintage',
    category: 'aesthetic',
    axisBundle: [
      { axis: 'warmth', direction: 'increase', weight: 0.8 },
      { axis: 'grittiness', direction: 'increase', weight: 0.5 },
      { axis: 'brightness', direction: 'decrease', weight: 0.3 },
      { axis: 'air', direction: 'decrease', weight: 0.2 },
    ],
    candidateLevers: [
      { lever: 'tape-emulation', direction: 'increase', priority: 1 },
      { lever: 'saturation', direction: 'increase', priority: 2 },
      { lever: 'eq-high-shelf', direction: 'decrease', priority: 3 },
      { lever: 'bit-crush', direction: 'increase', priority: 4, suggestedValue: 0.15 },
    ],
    opposite: 'modern',
    defaultIntensity: 0.5,
    synonyms: ['retro', 'old-school', 'classic', 'analog', 'lo-fi'],
  },
  {
    adjective: 'modern',
    category: 'aesthetic',
    axisBundle: [
      { axis: 'clarity', direction: 'increase', weight: 0.7 },
      { axis: 'brightness', direction: 'increase', weight: 0.5 },
      { axis: 'width', direction: 'increase', weight: 0.4 },
      { axis: 'air', direction: 'increase', weight: 0.3 },
    ],
    candidateLevers: [
      { lever: 'eq-presence', direction: 'increase', priority: 1 },
      { lever: 'exciter', direction: 'increase', priority: 2 },
      { lever: 'stereo-width', direction: 'increase', priority: 3 },
      { lever: 'limiter-threshold', direction: 'decrease', priority: 4 },
    ],
    opposite: 'vintage',
    defaultIntensity: 0.5,
    synonyms: ['contemporary', 'current', 'fresh', 'hi-fi', 'polished'],
  },
  // ── Density ──
  {
    adjective: 'thick',
    category: 'density',
    axisBundle: [
      { axis: 'density', direction: 'increase', weight: 1.0 },
      { axis: 'fullness', direction: 'increase', weight: 0.7 },
      { axis: 'weight', direction: 'increase', weight: 0.4 },
    ],
    candidateLevers: [
      { lever: 'layer-count', direction: 'increase', priority: 1 },
      { lever: 'compression-ratio', direction: 'increase', priority: 2 },
      { lever: 'eq-low-mid', direction: 'increase', priority: 3 },
      { lever: 'stereo-width', direction: 'increase', priority: 4 },
    ],
    opposite: 'thin',
    defaultIntensity: 0.5,
    synonyms: ['thicker', 'fat', 'chunky', 'beefy', 'meaty'],
  },
  {
    adjective: 'thin',
    category: 'density',
    axisBundle: [
      { axis: 'density', direction: 'decrease', weight: 0.8 },
      { axis: 'fullness', direction: 'decrease', weight: 0.7 },
      { axis: 'thinness', direction: 'increase', weight: 0.5 },
    ],
    candidateLevers: [
      { lever: 'eq-low-cut', direction: 'increase', priority: 1 },
      { lever: 'layer-count', direction: 'decrease', priority: 2 },
      { lever: 'eq-low-mid', direction: 'decrease', priority: 3 },
    ],
    opposite: 'thick',
    defaultIntensity: 0.5,
    synonyms: ['thinner', 'lean', 'stripped-back', 'skeletal', 'sparse'],
  },
  {
    adjective: 'full',
    category: 'density',
    axisBundle: [
      { axis: 'fullness', direction: 'increase', weight: 1.0 },
      { axis: 'density', direction: 'increase', weight: 0.5 },
      { axis: 'width', direction: 'increase', weight: 0.4 },
      { axis: 'weight', direction: 'increase', weight: 0.3 },
    ],
    candidateLevers: [
      { lever: 'eq-low-mid', direction: 'increase', priority: 1 },
      { lever: 'layer-count', direction: 'increase', priority: 2 },
      { lever: 'stereo-width', direction: 'increase', priority: 3 },
      { lever: 'compression-ratio', direction: 'increase', priority: 4 },
    ],
    opposite: 'empty',
    defaultIntensity: 0.5,
    synonyms: ['fuller', 'filled out', 'complete', 'rounded'],
  },
  {
    adjective: 'lush',
    category: 'density',
    axisBundle: [
      { axis: 'lushness', direction: 'increase', weight: 1.0 },
      { axis: 'spaciousness', direction: 'increase', weight: 0.6 },
      { axis: 'warmth', direction: 'increase', weight: 0.4 },
      { axis: 'width', direction: 'increase', weight: 0.4 },
    ],
    candidateLevers: [
      { lever: 'reverb-mix', direction: 'increase', priority: 1 },
      { lever: 'chorus-depth', direction: 'increase', priority: 2 },
      { lever: 'modulation-depth', direction: 'increase', priority: 3 },
      { lever: 'stereo-width', direction: 'increase', priority: 4 },
    ],
    opposite: 'bare',
    defaultIntensity: 0.6,
    synonyms: ['lusher', 'luxurious', 'opulent', 'rich', 'sumptuous'],
  },
];

/**
 * Index for fast lookup: adjective → mapping.
 * Includes synonyms in the index.
 */
export const AFFECTIVE_ADJECTIVE_INDEX: ReadonlyMap<string, AffectiveAdjectiveMapping> = (() => {
  const index = new Map<string, AffectiveAdjectiveMapping>();
  for (const mapping of AFFECTIVE_ADJECTIVE_DB) {
    index.set(mapping.adjective, mapping);
    for (const synonym of mapping.synonyms) {
      if (!index.has(synonym)) {
        index.set(synonym, mapping);
      }
    }
    if (mapping.opposite && !index.has(mapping.opposite)) {
      // We don't add opposites as they should be their own entries
    }
  }
  return index;
})();

/**
 * Look up the axis bundle for an affective adjective.
 */
export function lookupAffectiveAdjective(
  adjective: string,
): AffectiveAdjectiveMapping | undefined {
  return AFFECTIVE_ADJECTIVE_INDEX.get(adjective.toLowerCase());
}

/**
 * Result of applying "make it feel X" semantics.
 */
export interface MakeItFeelResult {
  /** The adjective that was matched */
  readonly adjective: string;
  /** The mapping used */
  readonly mapping: AffectiveAdjectiveMapping;
  /** The intensity (0–1) */
  readonly intensity: number;
  /** Generated CPL goals */
  readonly goals: readonly CPLGoal[];
  /** Generated CPL constraints (preserve what's not being changed) */
  readonly constraints: readonly CPLConstraint[];
  /** Candidate lever recommendations */
  readonly leverRecommendations: readonly AffectiveLeverCandidate[];
  /** Scope restriction (if any) */
  readonly scope: CPLScope | undefined;
}

/**
 * Apply "make it feel X" semantics.
 *
 * Given an affective adjective and optional intensity + scope, generate CPL goals.
 */
export function applyMakeItFeelSemantics(
  adjective: string,
  options: {
    readonly intensity?: number;
    readonly scope?: CPLScope;
    readonly provenance?: Provenance;
  } = {},
): MakeItFeelResult | undefined {
  const mapping = lookupAffectiveAdjective(adjective);
  if (!mapping) return undefined;

  const intensity = options.intensity ?? mapping.defaultIntensity;
  const goals: CPLGoal[] = [];

  for (const entry of mapping.axisBundle) {
    const effectiveWeight = entry.weight * intensity;
    const amount: CPLAmount = {
      type: 'qualitative',
      value: effectiveWeight,
      qualifier: effectiveWeight > 0.7 ? 'much' : effectiveWeight > 0.4 ? 'somewhat' : 'a-little',
    };

    const goal: CPLGoal = Object.assign(
      {
        type: 'goal' as const,
        id: `goal-feel-${adjective}-${entry.axis}-${Date.now()}`,
        variant: 'axis-goal' as const,
        ...(options.provenance ? { provenance: options.provenance } : {}),
      },
      {
        axis: entry.axis,
        direction: entry.direction,
        targetValue: amount,
        ...(options.scope ? { scope: options.scope } : {}),
      },
    );
    goals.push(goal);
  }

  // Generate preservation constraints for axes NOT in the bundle
  const changedAxes = new Set(mapping.axisBundle.map(e => e.axis));
  const constraints: CPLConstraint[] = [];

  // Only add a general preservation constraint (not per-axis to avoid bloat)
  if (changedAxes.size > 0) {
    const constraintDesc = `Preserve axes not targeted by "${adjective}" transform`;
    constraints.push({
      type: 'constraint',
      id: `constraint-feel-preserve-${Date.now()}`,
      variant: 'preserve',
      strength: 'soft',
      description: constraintDesc,
    });
  }

  return {
    adjective: mapping.adjective,
    mapping,
    intensity,
    goals,
    constraints,
    leverRecommendations: [...mapping.candidateLevers],
    scope: options.scope,
  };
}

// =============================================================================
// § 174 — "Hit Harder / More Punch" → Impact Axis + Candidate Levers
// =============================================================================

/**
 * Impact-related phrase patterns.
 *
 * Maps colloquial impact/punch phrases to specific axis bundles.
 */
export interface ImpactPhraseMapping {
  /** The phrase or pattern */
  readonly phrase: string;
  /** Keywords that trigger this mapping */
  readonly keywords: readonly string[];
  /** Axis bundle */
  readonly axisBundle: readonly AffectiveAxisEntry[];
  /** Candidate levers */
  readonly candidateLevers: readonly AffectiveLeverCandidate[];
  /** Default intensity */
  readonly defaultIntensity: number;
  /** Category of impact */
  readonly impactCategory: ImpactCategory;
}

export type ImpactCategory =
  | 'transient-impact'    // hit harder, more attack
  | 'dynamic-punch'       // more punch, snappier
  | 'weight-impact'       // heavier, more weight
  | 'presence-impact'     // more in-your-face, upfront
  | 'energy-impact'       // more drive, more energy
  | 'compression-impact'; // more glue, more cohesion

/**
 * Database of impact/punch phrase mappings.
 */
export const IMPACT_PHRASE_DB: readonly ImpactPhraseMapping[] = [
  {
    phrase: 'hit harder',
    keywords: ['hit', 'harder', 'slam', 'smack', 'bang'],
    axisBundle: [
      { axis: 'impact', direction: 'increase', weight: 1.0 },
      { axis: 'punch', direction: 'increase', weight: 0.8 },
      { axis: 'energy', direction: 'increase', weight: 0.4 },
    ],
    candidateLevers: [
      { lever: 'transient-shaping', direction: 'increase', priority: 1 },
      { lever: 'compression-attack', direction: 'decrease', priority: 2 },
      { lever: 'eq-low-shelf', direction: 'increase', priority: 3 },
      { lever: 'parallel-compression', direction: 'increase', priority: 4 },
      { lever: 'bus-compression', direction: 'increase', priority: 5 },
    ],
    defaultIntensity: 0.7,
    impactCategory: 'transient-impact',
  },
  {
    phrase: 'more punch',
    keywords: ['punch', 'punchier', 'punchy', 'snap', 'snappier', 'snappy'],
    axisBundle: [
      { axis: 'punch', direction: 'increase', weight: 1.0 },
      { axis: 'impact', direction: 'increase', weight: 0.6 },
      { axis: 'clarity', direction: 'increase', weight: 0.3 },
    ],
    candidateLevers: [
      { lever: 'transient-shaping', direction: 'increase', priority: 1 },
      { lever: 'compression-attack', direction: 'decrease', priority: 2 },
      { lever: 'eq-mid', direction: 'increase', priority: 3 },
      { lever: 'parallel-compression', direction: 'increase', priority: 4 },
    ],
    defaultIntensity: 0.6,
    impactCategory: 'dynamic-punch',
  },
  {
    phrase: 'more weight',
    keywords: ['weight', 'heavier', 'heavy', 'weightier', 'heft', 'hefty', 'bottom'],
    axisBundle: [
      { axis: 'weight', direction: 'increase', weight: 1.0 },
      { axis: 'fullness', direction: 'increase', weight: 0.5 },
      { axis: 'depth', direction: 'increase', weight: 0.3 },
    ],
    candidateLevers: [
      { lever: 'eq-low-shelf', direction: 'increase', priority: 1 },
      { lever: 'sub-bass', direction: 'increase', priority: 2 },
      { lever: 'bus-compression', direction: 'increase', priority: 3 },
      { lever: 'fundamental', direction: 'increase', priority: 4 },
    ],
    defaultIntensity: 0.6,
    impactCategory: 'weight-impact',
  },
  {
    phrase: 'more upfront',
    keywords: ['upfront', 'forward', 'in-your-face', 'closer', 'present', 'prominent'],
    axisBundle: [
      { axis: 'presence', direction: 'increase', weight: 1.0 },
      { axis: 'clarity', direction: 'increase', weight: 0.5 },
      { axis: 'depth', direction: 'decrease', weight: 0.3 },
    ],
    candidateLevers: [
      { lever: 'eq-presence', direction: 'increase', priority: 1 },
      { lever: 'compression-ratio', direction: 'increase', priority: 2 },
      { lever: 'reverb-mix', direction: 'decrease', priority: 3 },
      { lever: 'vocal-rider', direction: 'increase', priority: 4 },
    ],
    defaultIntensity: 0.6,
    impactCategory: 'presence-impact',
  },
  {
    phrase: 'more drive',
    keywords: ['drive', 'driving', 'driven', 'push', 'pushing', 'forward motion'],
    axisBundle: [
      { axis: 'energy', direction: 'increase', weight: 1.0 },
      { axis: 'density', direction: 'increase', weight: 0.4 },
      { axis: 'punch', direction: 'increase', weight: 0.3 },
      { axis: 'aggression', direction: 'increase', weight: 0.2 },
    ],
    candidateLevers: [
      { lever: 'velocity-range', direction: 'increase', priority: 1 },
      { lever: 'compression-ratio', direction: 'increase', priority: 2 },
      { lever: 'event-density', direction: 'increase', priority: 3 },
      { lever: 'transient-shaping', direction: 'increase', priority: 4 },
    ],
    defaultIntensity: 0.6,
    impactCategory: 'energy-impact',
  },
  {
    phrase: 'more glue',
    keywords: ['glue', 'glued', 'cohesive', 'cohesion', 'together', 'tighter mix'],
    axisBundle: [
      { axis: 'density', direction: 'increase', weight: 0.5 },
      { axis: 'smoothness', direction: 'increase', weight: 0.4 },
      { axis: 'fullness', direction: 'increase', weight: 0.3 },
    ],
    candidateLevers: [
      { lever: 'bus-compression', direction: 'increase', priority: 1 },
      { lever: 'compression-ratio', direction: 'increase', priority: 2, suggestedValue: 3.0 },
      { lever: 'compression-attack', direction: 'increase', priority: 3 },
      { lever: 'saturation', direction: 'increase', priority: 4, suggestedValue: 0.15 },
    ],
    defaultIntensity: 0.5,
    impactCategory: 'compression-impact',
  },
  {
    phrase: 'more bite',
    keywords: ['bite', 'bitey', 'teeth', 'edge', 'cut through'],
    axisBundle: [
      { axis: 'aggression', direction: 'increase', weight: 0.7 },
      { axis: 'sharpness', direction: 'increase', weight: 0.8 },
      { axis: 'presence', direction: 'increase', weight: 0.5 },
    ],
    candidateLevers: [
      { lever: 'eq-presence', direction: 'increase', priority: 1 },
      { lever: 'saturation', direction: 'increase', priority: 2 },
      { lever: 'transient-shaping', direction: 'increase', priority: 3 },
      { lever: 'distortion', direction: 'increase', priority: 4, suggestedValue: 0.2 },
    ],
    defaultIntensity: 0.6,
    impactCategory: 'presence-impact',
  },
  {
    phrase: 'more air',
    keywords: ['air', 'airy', 'breathe', 'breathing', 'open up', 'shimmer'],
    axisBundle: [
      { axis: 'air', direction: 'increase', weight: 1.0 },
      { axis: 'brightness', direction: 'increase', weight: 0.4 },
      { axis: 'spaciousness', direction: 'increase', weight: 0.3 },
    ],
    candidateLevers: [
      { lever: 'eq-high-shelf', direction: 'increase', priority: 1 },
      { lever: 'exciter', direction: 'increase', priority: 2 },
      { lever: 'reverb-mix', direction: 'increase', priority: 3, suggestedValue: 0.15 },
      { lever: 'stereo-width', direction: 'increase', priority: 4 },
    ],
    defaultIntensity: 0.5,
    impactCategory: 'presence-impact',
  },
  {
    phrase: 'more boom',
    keywords: ['boom', 'boomier', 'boomy', 'thunder', 'rumble', 'thump'],
    axisBundle: [
      { axis: 'weight', direction: 'increase', weight: 1.0 },
      { axis: 'impact', direction: 'increase', weight: 0.6 },
      { axis: 'depth', direction: 'increase', weight: 0.4 },
    ],
    candidateLevers: [
      { lever: 'eq-low-shelf', direction: 'increase', priority: 1 },
      { lever: 'sub-bass', direction: 'increase', priority: 2 },
      { lever: 'compression-attack', direction: 'decrease', priority: 3 },
      { lever: 'reverb-size', direction: 'increase', priority: 4 },
    ],
    defaultIntensity: 0.6,
    impactCategory: 'weight-impact',
  },
  {
    phrase: 'more sizzle',
    keywords: ['sizzle', 'sizzly', 'fizz', 'sparkle', 'crackle', 'top-end'],
    axisBundle: [
      { axis: 'brightness', direction: 'increase', weight: 0.8 },
      { axis: 'shimmer', direction: 'increase', weight: 0.7 },
      { axis: 'air', direction: 'increase', weight: 0.5 },
    ],
    candidateLevers: [
      { lever: 'eq-high-shelf', direction: 'increase', priority: 1 },
      { lever: 'exciter', direction: 'increase', priority: 2 },
      { lever: 'saturation', direction: 'increase', priority: 3, suggestedValue: 0.1 },
    ],
    defaultIntensity: 0.5,
    impactCategory: 'presence-impact',
  },
];

/**
 * Impact phrase keyword index for fast lookup.
 */
export const IMPACT_KEYWORD_INDEX: ReadonlyMap<string, ImpactPhraseMapping> = (() => {
  const index = new Map<string, ImpactPhraseMapping>();
  for (const mapping of IMPACT_PHRASE_DB) {
    for (const keyword of mapping.keywords) {
      if (!index.has(keyword)) {
        index.set(keyword, mapping);
      }
    }
  }
  return index;
})();

/**
 * Detect impact/punch phrases in text.
 */
export function detectImpactPhrases(text: string): readonly ImpactPhraseMapping[] {
  const lower = text.toLowerCase();
  const matches: ImpactPhraseMapping[] = [];
  const seen = new Set<string>();

  for (const mapping of IMPACT_PHRASE_DB) {
    if (seen.has(mapping.phrase)) continue;
    for (const keyword of mapping.keywords) {
      if (lower.includes(keyword)) {
        matches.push(mapping);
        seen.add(mapping.phrase);
        break;
      }
    }
  }

  return matches;
}

/**
 * Result of applying impact semantics.
 */
export interface ImpactSemanticResult {
  readonly phrase: string;
  readonly impactCategory: ImpactCategory;
  readonly goals: readonly CPLGoal[];
  readonly leverRecommendations: readonly AffectiveLeverCandidate[];
}

/**
 * Apply impact phrase semantics to generate CPL goals.
 */
export function applyImpactSemantics(
  mapping: ImpactPhraseMapping,
  options: {
    readonly intensity?: number;
    readonly scope?: CPLScope;
    readonly provenance?: Provenance;
  } = {},
): ImpactSemanticResult {
  const intensity = options.intensity ?? mapping.defaultIntensity;
  const goals: CPLGoal[] = [];

  for (const entry of mapping.axisBundle) {
    const effectiveWeight = entry.weight * intensity;
    const amount: CPLAmount = {
      type: 'qualitative',
      value: effectiveWeight,
      qualifier: effectiveWeight > 0.7 ? 'much' : effectiveWeight > 0.4 ? 'somewhat' : 'a-little',
    };

    const goal: CPLGoal = Object.assign(
      {
        type: 'goal' as const,
        id: `goal-impact-${mapping.phrase.replace(/\s/g, '-')}-${entry.axis}-${Date.now()}`,
        variant: 'axis-goal' as const,
        ...(options.provenance ? { provenance: options.provenance } : {}),
      },
      {
        axis: entry.axis,
        direction: entry.direction,
        targetValue: amount,
        ...(options.scope ? { scope: options.scope } : {}),
      },
    );
    goals.push(goal);
  }

  return {
    phrase: mapping.phrase,
    impactCategory: mapping.impactCategory,
    goals,
    leverRecommendations: [...mapping.candidateLevers],
  };
}

// =============================================================================
// § 175 — "More Hopeful" — Complex Emotion → Multi-Axis Mapping
// =============================================================================

/**
 * Complex emotional adjective mapping.
 *
 * Unlike simple affective adjectives, these map to multiple axes with
 * explicit constraint interactions (e.g., "hopeful" = tension/release +
 * brightness + register lift, with constraints to not lose warmth).
 */
export interface ComplexEmotionMapping {
  /** The emotion keyword */
  readonly emotion: string;
  /** Category */
  readonly category: ComplexEmotionCategory;
  /** Primary axis changes */
  readonly primaryAxes: readonly AffectiveAxisEntry[];
  /** Secondary axis changes (lower priority) */
  readonly secondaryAxes: readonly AffectiveAxisEntry[];
  /** Constraint interactions: axes that must NOT be over-changed */
  readonly constraintAxes: readonly EmotionConstraintAxis[];
  /** Candidate levers organized by tier */
  readonly leverTiers: readonly EmotionLeverTier[];
  /** Default intensity */
  readonly defaultIntensity: number;
  /** Opposite emotion */
  readonly opposite?: string;
  /** Synonyms */
  readonly synonyms: readonly string[];
  /** Musical-theoretical notes for the planner */
  readonly plannerNotes: string;
}

export type ComplexEmotionCategory =
  | 'aspiration'     // hopeful, yearning, longing
  | 'tension'        // anxious, restless, uneasy
  | 'resolution'     // resolved, satisfied, complete
  | 'ambivalence'    // bittersweet, conflicted, nostalgic
  | 'transcendence'  // epic, triumphant, soaring
  | 'intimacy'       // intimate, personal, vulnerable
  | 'mystery'        // mysterious, enigmatic, otherworldly
  | 'power';         // powerful, commanding, authoritative

/**
 * Constraint axis: an axis that must stay within bounds when applying the emotion.
 */
export interface EmotionConstraintAxis {
  /** Axis name */
  readonly axis: string;
  /** Maximum allowed change magnitude (0–1) */
  readonly maxChange: number;
  /** Direction that's constrained (or both) */
  readonly constrainedDirection: 'increase' | 'decrease' | 'both';
  /** Reason for the constraint */
  readonly reason: string;
}

/**
 * Tier of levers for emotion implementation.
 */
export interface EmotionLeverTier {
  /** Tier label */
  readonly tier: 'primary' | 'secondary' | 'contextual';
  /** Levers in this tier */
  readonly levers: readonly AffectiveLeverCandidate[];
  /** Condition for this tier to be used (human-readable) */
  readonly condition?: string;
}

/**
 * Database of complex emotion mappings.
 */
export const COMPLEX_EMOTION_DB: readonly ComplexEmotionMapping[] = [
  {
    emotion: 'hopeful',
    category: 'aspiration',
    primaryAxes: [
      { axis: 'brightness', direction: 'increase', weight: 0.7 },
      { axis: 'warmth', direction: 'increase', weight: 0.5 },
      { axis: 'air', direction: 'increase', weight: 0.4 },
    ],
    secondaryAxes: [
      { axis: 'spaciousness', direction: 'increase', weight: 0.3 },
      { axis: 'energy', direction: 'increase', weight: 0.2 },
      { axis: 'smoothness', direction: 'increase', weight: 0.2 },
    ],
    constraintAxes: [
      { axis: 'aggression', maxChange: 0.1, constrainedDirection: 'increase', reason: 'Hopeful should not sound aggressive' },
      { axis: 'density', maxChange: 0.2, constrainedDirection: 'increase', reason: 'Hopeful needs breathing room, not density' },
      { axis: 'grittiness', maxChange: 0.1, constrainedDirection: 'increase', reason: 'Hope is clean and clear, not gritty' },
    ],
    leverTiers: [
      {
        tier: 'primary',
        levers: [
          { lever: 'eq-high-shelf', direction: 'increase', priority: 1 },
          { lever: 'reverb-mix', direction: 'increase', priority: 2, suggestedValue: 0.25 },
          { lever: 'exciter', direction: 'increase', priority: 3, suggestedValue: 0.15 },
        ],
      },
      {
        tier: 'secondary',
        levers: [
          { lever: 'saturation', direction: 'increase', priority: 4, suggestedValue: 0.1 },
          { lever: 'stereo-width', direction: 'increase', priority: 5 },
          { lever: 'chorus-depth', direction: 'increase', priority: 6, suggestedValue: 0.2 },
        ],
      },
      {
        tier: 'contextual',
        levers: [
          { lever: 'filter-cutoff', direction: 'increase', priority: 7 },
          { lever: 'dynamics-range', direction: 'increase', priority: 8 },
        ],
        condition: 'If the source material is dark or compressed',
      },
    ],
    defaultIntensity: 0.5,
    opposite: 'despairing',
    synonyms: ['more hopeful', 'optimistic', 'uplifting', 'promising', 'expectant', 'sanguine'],
    plannerNotes: 'Hopeful maps to tension→release trajectory. In harmony, prefer major or Lydian color. In dynamics, gentle crescendo shapes. Register should be mid-to-high with ascending motion.',
  },
  {
    emotion: 'yearning',
    category: 'aspiration',
    primaryAxes: [
      { axis: 'warmth', direction: 'increase', weight: 0.7 },
      { axis: 'tension', direction: 'increase', weight: 0.6 },
      { axis: 'spaciousness', direction: 'increase', weight: 0.5 },
    ],
    secondaryAxes: [
      { axis: 'depth', direction: 'increase', weight: 0.4 },
      { axis: 'smoothness', direction: 'increase', weight: 0.3 },
      { axis: 'lushness', direction: 'increase', weight: 0.3 },
    ],
    constraintAxes: [
      { axis: 'aggression', maxChange: 0.15, constrainedDirection: 'increase', reason: 'Yearning is tender, not aggressive' },
      { axis: 'sharpness', maxChange: 0.1, constrainedDirection: 'increase', reason: 'Yearning should not be sharp' },
    ],
    leverTiers: [
      {
        tier: 'primary',
        levers: [
          { lever: 'reverb-mix', direction: 'increase', priority: 1 },
          { lever: 'filter-sweep', direction: 'increase', priority: 2 },
          { lever: 'chorus-depth', direction: 'increase', priority: 3 },
        ],
      },
      {
        tier: 'secondary',
        levers: [
          { lever: 'saturation', direction: 'increase', priority: 4, suggestedValue: 0.15 },
          { lever: 'modulation-depth', direction: 'increase', priority: 5 },
          { lever: 'delay-feedback', direction: 'increase', priority: 6 },
        ],
      },
    ],
    defaultIntensity: 0.6,
    opposite: 'indifferent',
    synonyms: ['longing', 'pining', 'wistful yearning', 'aching'],
    plannerNotes: 'Yearning maps to sustained unresolved tension. Prefer suspensions (sus4, add9) and delayed resolutions. Dynamics should swell. Register varies (low = deep yearning, high = desperate yearning).',
  },
  {
    emotion: 'anxious',
    category: 'tension',
    primaryAxes: [
      { axis: 'tension', direction: 'increase', weight: 1.0 },
      { axis: 'sharpness', direction: 'increase', weight: 0.5 },
      { axis: 'density', direction: 'increase', weight: 0.4 },
    ],
    secondaryAxes: [
      { axis: 'energy', direction: 'increase', weight: 0.3 },
      { axis: 'clarity', direction: 'increase', weight: 0.2 },
    ],
    constraintAxes: [
      { axis: 'warmth', maxChange: 0.3, constrainedDirection: 'decrease', reason: 'Too cold makes it feel alien, not anxious' },
      { axis: 'spaciousness', maxChange: 0.2, constrainedDirection: 'increase', reason: 'Anxiety is claustrophobic, not spacious' },
    ],
    leverTiers: [
      {
        tier: 'primary',
        levers: [
          { lever: 'filter-resonance', direction: 'increase', priority: 1 },
          { lever: 'compression-ratio', direction: 'increase', priority: 2 },
          { lever: 'velocity-curve', direction: 'increase', priority: 3 },
        ],
      },
      {
        tier: 'secondary',
        levers: [
          { lever: 'event-density', direction: 'increase', priority: 4 },
          { lever: 'rhythmic-variation', direction: 'increase', priority: 5 },
          { lever: 'eq-presence', direction: 'increase', priority: 6 },
        ],
      },
    ],
    defaultIntensity: 0.6,
    opposite: 'calm',
    synonyms: ['more anxious', 'nervous', 'restless', 'uneasy', 'tense', 'jittery'],
    plannerNotes: 'Anxiety maps to unresolvable tension. Prefer minor seconds, tritones, and rhythmic instability. Short, tight reverb. Fast LFOs or tremolo. High density with no resting points.',
  },
  {
    emotion: 'triumphant',
    category: 'transcendence',
    primaryAxes: [
      { axis: 'energy', direction: 'increase', weight: 1.0 },
      { axis: 'brightness', direction: 'increase', weight: 0.7 },
      { axis: 'fullness', direction: 'increase', weight: 0.7 },
      { axis: 'width', direction: 'increase', weight: 0.6 },
    ],
    secondaryAxes: [
      { axis: 'impact', direction: 'increase', weight: 0.5 },
      { axis: 'presence', direction: 'increase', weight: 0.4 },
      { axis: 'air', direction: 'increase', weight: 0.3 },
    ],
    constraintAxes: [
      { axis: 'warmth', maxChange: 0.2, constrainedDirection: 'decrease', reason: 'Triumph needs warmth — too cold is clinical' },
    ],
    leverTiers: [
      {
        tier: 'primary',
        levers: [
          { lever: 'layer-count', direction: 'increase', priority: 1 },
          { lever: 'stereo-width', direction: 'increase', priority: 2 },
          { lever: 'eq-high-shelf', direction: 'increase', priority: 3 },
          { lever: 'compression-ratio', direction: 'increase', priority: 4 },
        ],
      },
      {
        tier: 'secondary',
        levers: [
          { lever: 'exciter', direction: 'increase', priority: 5 },
          { lever: 'reverb-size', direction: 'increase', priority: 6 },
          { lever: 'bus-compression', direction: 'increase', priority: 7 },
        ],
      },
    ],
    defaultIntensity: 0.7,
    opposite: 'defeated',
    synonyms: ['more triumphant', 'victorious', 'epic', 'glorious', 'soaring', 'majestic'],
    plannerNotes: 'Triumph maps to full resolution after buildup. Major key, wide voicings, brass/string-type timbres. Full-spectrum energy, loud dynamics, big reverb tail.',
  },
  {
    emotion: 'intimate',
    category: 'intimacy',
    primaryAxes: [
      { axis: 'warmth', direction: 'increase', weight: 0.8 },
      { axis: 'presence', direction: 'increase', weight: 0.6 },
      { axis: 'clarity', direction: 'increase', weight: 0.4 },
    ],
    secondaryAxes: [
      { axis: 'spaciousness', direction: 'decrease', weight: 0.3 },
      { axis: 'density', direction: 'decrease', weight: 0.3 },
      { axis: 'smoothness', direction: 'increase', weight: 0.3 },
    ],
    constraintAxes: [
      { axis: 'aggression', maxChange: 0.05, constrainedDirection: 'increase', reason: 'Intimacy must not feel aggressive' },
      { axis: 'width', maxChange: 0.2, constrainedDirection: 'increase', reason: 'Intimacy is close, not wide' },
      { axis: 'energy', maxChange: 0.2, constrainedDirection: 'increase', reason: 'Intimacy is quiet, not energetic' },
    ],
    leverTiers: [
      {
        tier: 'primary',
        levers: [
          { lever: 'reverb-mix', direction: 'decrease', priority: 1 },
          { lever: 'eq-presence', direction: 'increase', priority: 2 },
          { lever: 'saturation', direction: 'increase', priority: 3, suggestedValue: 0.1 },
        ],
      },
      {
        tier: 'secondary',
        levers: [
          { lever: 'stereo-width', direction: 'decrease', priority: 4 },
          { lever: 'compression-attack', direction: 'increase', priority: 5 },
          { lever: 'dynamics-level', direction: 'decrease', priority: 6 },
        ],
      },
    ],
    defaultIntensity: 0.5,
    opposite: 'distant',
    synonyms: ['more intimate', 'close', 'personal', 'vulnerable', 'tender', 'confessional'],
    plannerNotes: 'Intimacy maps to proximity and quietness. Dry vocal, close mic, minimal arrangement. Finger-picked guitar over strummed. Soft dynamics, breath noises kept.',
  },
  {
    emotion: 'mysterious',
    category: 'mystery',
    primaryAxes: [
      { axis: 'depth', direction: 'increase', weight: 0.8 },
      { axis: 'spaciousness', direction: 'increase', weight: 0.6 },
      { axis: 'brightness', direction: 'decrease', weight: 0.5 },
    ],
    secondaryAxes: [
      { axis: 'warmth', direction: 'increase', weight: 0.3 },
      { axis: 'tension', direction: 'increase', weight: 0.3 },
      { axis: 'lushness', direction: 'increase', weight: 0.2 },
    ],
    constraintAxes: [
      { axis: 'clarity', maxChange: 0.3, constrainedDirection: 'increase', reason: 'Mystery requires some obscurity' },
      { axis: 'aggression', maxChange: 0.1, constrainedDirection: 'increase', reason: 'Mystery is subtle, not aggressive' },
    ],
    leverTiers: [
      {
        tier: 'primary',
        levers: [
          { lever: 'reverb-size', direction: 'increase', priority: 1 },
          { lever: 'filter-cutoff', direction: 'decrease', priority: 2 },
          { lever: 'delay-feedback', direction: 'increase', priority: 3 },
        ],
      },
      {
        tier: 'secondary',
        levers: [
          { lever: 'modulation-depth', direction: 'increase', priority: 4 },
          { lever: 'eq-high-shelf', direction: 'decrease', priority: 5 },
          { lever: 'pre-delay', direction: 'increase', priority: 6 },
        ],
      },
    ],
    defaultIntensity: 0.5,
    opposite: 'obvious',
    synonyms: ['more mysterious', 'enigmatic', 'cryptic', 'eerie', 'haunting', 'otherworldly'],
    plannerNotes: 'Mystery maps to ambiguity and depth. Prefer modal ambiguity (Dorian, Phrygian), long reverbs, filtered pads. Elements should emerge and recede. Sparse arrangement with lots of space.',
  },
  {
    emotion: 'powerful',
    category: 'power',
    primaryAxes: [
      { axis: 'impact', direction: 'increase', weight: 1.0 },
      { axis: 'energy', direction: 'increase', weight: 0.8 },
      { axis: 'fullness', direction: 'increase', weight: 0.7 },
      { axis: 'weight', direction: 'increase', weight: 0.6 },
    ],
    secondaryAxes: [
      { axis: 'width', direction: 'increase', weight: 0.5 },
      { axis: 'presence', direction: 'increase', weight: 0.4 },
      { axis: 'density', direction: 'increase', weight: 0.3 },
    ],
    constraintAxes: [
      { axis: 'thinness', maxChange: 0.05, constrainedDirection: 'increase', reason: 'Power must not sound thin' },
    ],
    leverTiers: [
      {
        tier: 'primary',
        levers: [
          { lever: 'bus-compression', direction: 'increase', priority: 1 },
          { lever: 'limiter-threshold', direction: 'decrease', priority: 2 },
          { lever: 'eq-low-shelf', direction: 'increase', priority: 3 },
          { lever: 'layer-count', direction: 'increase', priority: 4 },
        ],
      },
      {
        tier: 'secondary',
        levers: [
          { lever: 'parallel-compression', direction: 'increase', priority: 5 },
          { lever: 'stereo-width', direction: 'increase', priority: 6 },
          { lever: 'transient-shaping', direction: 'increase', priority: 7 },
        ],
      },
    ],
    defaultIntensity: 0.7,
    opposite: 'weak',
    synonyms: ['more powerful', 'strong', 'commanding', 'authoritative', 'mighty', 'dominant'],
    plannerNotes: 'Power maps to full-spectrum energy with controlled dynamics. Heavy bus compression, dense arrangement, parallel processing. Both low-end weight and high-end presence.',
  },
  {
    emotion: 'bittersweet',
    category: 'ambivalence',
    primaryAxes: [
      { axis: 'warmth', direction: 'increase', weight: 0.7 },
      { axis: 'tension', direction: 'increase', weight: 0.4 },
      { axis: 'brightness', direction: 'increase', weight: 0.3 },
    ],
    secondaryAxes: [
      { axis: 'spaciousness', direction: 'increase', weight: 0.4 },
      { axis: 'smoothness', direction: 'increase', weight: 0.3 },
      { axis: 'depth', direction: 'increase', weight: 0.2 },
    ],
    constraintAxes: [
      { axis: 'aggression', maxChange: 0.1, constrainedDirection: 'increase', reason: 'Bittersweet is tender' },
      { axis: 'density', maxChange: 0.2, constrainedDirection: 'increase', reason: 'Bittersweet needs space for emotion' },
    ],
    leverTiers: [
      {
        tier: 'primary',
        levers: [
          { lever: 'saturation', direction: 'increase', priority: 1, suggestedValue: 0.15 },
          { lever: 'reverb-mix', direction: 'increase', priority: 2 },
          { lever: 'eq-high-shelf', direction: 'increase', priority: 3, suggestedValue: 0.1 },
        ],
      },
      {
        tier: 'secondary',
        levers: [
          { lever: 'chorus-depth', direction: 'increase', priority: 4 },
          { lever: 'delay-mix', direction: 'increase', priority: 5, suggestedValue: 0.15 },
        ],
      },
    ],
    defaultIntensity: 0.5,
    synonyms: ['more bittersweet', 'conflicted', 'poignant', 'tender-sad', 'wistful-happy'],
    plannerNotes: 'Bittersweet maps to simultaneous major/minor tension. Minor key with major 7ths or vice versa. Warm but slightly bright. Medium tempo with rubato feel. Mix of open and closed voicings.',
  },
];

/**
 * Complex emotion keyword index for fast lookup.
 */
export const COMPLEX_EMOTION_INDEX: ReadonlyMap<string, ComplexEmotionMapping> = (() => {
  const index = new Map<string, ComplexEmotionMapping>();
  for (const mapping of COMPLEX_EMOTION_DB) {
    index.set(mapping.emotion, mapping);
    for (const synonym of mapping.synonyms) {
      if (!index.has(synonym)) {
        index.set(synonym, mapping);
      }
    }
  }
  return index;
})();

/**
 * Look up a complex emotion mapping.
 */
export function lookupComplexEmotion(
  emotion: string,
): ComplexEmotionMapping | undefined {
  return COMPLEX_EMOTION_INDEX.get(emotion.toLowerCase());
}

/**
 * Result of applying complex emotion semantics.
 */
export interface ComplexEmotionResult {
  readonly emotion: string;
  readonly mapping: ComplexEmotionMapping;
  readonly intensity: number;
  readonly goals: readonly CPLGoal[];
  readonly constraints: readonly CPLConstraint[];
  readonly leverTiers: readonly EmotionLeverTier[];
  readonly plannerNotes: string;
  readonly scope: CPLScope | undefined;
}

/**
 * Apply complex emotion semantics to generate CPL goals and constraints.
 */
export function applyComplexEmotionSemantics(
  emotion: string,
  options: {
    readonly intensity?: number;
    readonly scope?: CPLScope;
    readonly provenance?: Provenance;
  } = {},
): ComplexEmotionResult | undefined {
  const mapping = lookupComplexEmotion(emotion);
  if (!mapping) return undefined;

  const intensity = options.intensity ?? mapping.defaultIntensity;
  const goals: CPLGoal[] = [];

  // Primary axes → high-weight goals
  for (const entry of mapping.primaryAxes) {
    const effectiveWeight = entry.weight * intensity;
    const amount: CPLAmount = {
      type: 'qualitative',
      value: effectiveWeight,
      qualifier: effectiveWeight > 0.7 ? 'much' : effectiveWeight > 0.4 ? 'somewhat' : 'a-little',
    };

    goals.push(Object.assign(
      {
        type: 'goal' as const,
        id: `goal-emotion-${emotion}-primary-${entry.axis}-${Date.now()}`,
        variant: 'axis-goal' as const,
        ...(options.provenance ? { provenance: options.provenance } : {}),
      },
      {
        axis: entry.axis,
        direction: entry.direction,
        targetValue: amount,
        ...(options.scope ? { scope: options.scope } : {}),
      },
    ));
  }

  // Secondary axes → lower-weight goals
  for (const entry of mapping.secondaryAxes) {
    const effectiveWeight = entry.weight * intensity * 0.6; // Scale down secondary
    const amount: CPLAmount = {
      type: 'qualitative',
      value: effectiveWeight,
      qualifier: effectiveWeight > 0.4 ? 'somewhat' : 'a-little',
    };

    goals.push(Object.assign(
      {
        type: 'goal' as const,
        id: `goal-emotion-${emotion}-secondary-${entry.axis}-${Date.now()}`,
        variant: 'axis-goal' as const,
        ...(options.provenance ? { provenance: options.provenance } : {}),
      },
      {
        axis: entry.axis,
        direction: entry.direction,
        targetValue: amount,
        ...(options.scope ? { scope: options.scope } : {}),
      },
    ));
  }

  // Constraint axes → CPL constraints
  const constraints: CPLConstraint[] = [];
  for (const ca of mapping.constraintAxes) {
    constraints.push({
      type: 'constraint',
      id: `constraint-emotion-${emotion}-${ca.axis}-${Date.now()}`,
      variant: 'range',
      strength: 'soft',
      description: `${ca.reason} (max Δ${ca.maxChange} on ${ca.axis})`,
    });
  }

  return {
    emotion: mapping.emotion,
    mapping,
    intensity,
    goals,
    constraints,
    leverTiers: mapping.leverTiers,
    plannerNotes: mapping.plannerNotes,
    scope: options.scope,
  };
}

// =============================================================================
// § Combined Detection — Detect All Affective/Impact/Emotion Patterns
// =============================================================================

/**
 * Result of detecting affective semantics in text.
 */
export interface AffectiveDetectionResult {
  /** Matched affective adjective mappings */
  readonly affectiveMatches: readonly AffectiveAdjectiveMapping[];
  /** Matched impact phrase mappings */
  readonly impactMatches: readonly ImpactPhraseMapping[];
  /** Matched complex emotion mappings */
  readonly complexEmotionMatches: readonly ComplexEmotionMapping[];
  /** Total number of matches */
  readonly totalMatches: number;
}

/**
 * Detect all affective/impact/emotion patterns in text.
 */
export function detectAffectiveSemantics(text: string): AffectiveDetectionResult {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);

  // Affective adjectives
  const affectiveMatches: AffectiveAdjectiveMapping[] = [];
  const seenAffective = new Set<string>();
  for (const word of words) {
    const mapping = AFFECTIVE_ADJECTIVE_INDEX.get(word);
    if (mapping && !seenAffective.has(mapping.adjective)) {
      affectiveMatches.push(mapping);
      seenAffective.add(mapping.adjective);
    }
  }

  // Impact phrases
  const impactMatches = [...detectImpactPhrases(text)];

  // Complex emotions
  const complexEmotionMatches: ComplexEmotionMapping[] = [];
  const seenEmotion = new Set<string>();
  for (const word of words) {
    const mapping = COMPLEX_EMOTION_INDEX.get(word);
    if (mapping && !seenEmotion.has(mapping.emotion)) {
      complexEmotionMatches.push(mapping);
      seenEmotion.add(mapping.emotion);
    }
  }

  // Also check multi-word patterns for complex emotions
  for (const mapping of COMPLEX_EMOTION_DB) {
    if (seenEmotion.has(mapping.emotion)) continue;
    for (const synonym of mapping.synonyms) {
      if (lower.includes(synonym) && !seenEmotion.has(mapping.emotion)) {
        complexEmotionMatches.push(mapping);
        seenEmotion.add(mapping.emotion);
        break;
      }
    }
  }

  return {
    affectiveMatches,
    impactMatches,
    complexEmotionMatches,
    totalMatches: affectiveMatches.length + impactMatches.length + complexEmotionMatches.length,
  };
}

/**
 * Generate all CPL goals from detected affective semantics.
 */
export function generateAffectiveCPLGoals(
  detection: AffectiveDetectionResult,
  options: {
    readonly intensity?: number;
    readonly scope?: CPLScope;
    readonly provenance?: Provenance;
  } = {},
): {
  readonly goals: readonly CPLGoal[];
  readonly constraints: readonly CPLConstraint[];
  readonly leverRecommendations: readonly AffectiveLeverCandidate[];
} {
  const goals: CPLGoal[] = [];
  const constraints: CPLConstraint[] = [];
  const leverRecommendations: AffectiveLeverCandidate[] = [];

  // Process affective adjectives
  for (const mapping of detection.affectiveMatches) {
    const result = applyMakeItFeelSemantics(mapping.adjective, options);
    if (result) {
      goals.push(...result.goals);
      constraints.push(...result.constraints);
      leverRecommendations.push(...result.leverRecommendations);
    }
  }

  // Process impact phrases
  for (const mapping of detection.impactMatches) {
    const result = applyImpactSemantics(mapping, options);
    goals.push(...result.goals);
    leverRecommendations.push(...result.leverRecommendations);
  }

  // Process complex emotions
  for (const mapping of detection.complexEmotionMatches) {
    const result = applyComplexEmotionSemantics(mapping.emotion, options);
    if (result) {
      goals.push(...result.goals);
      constraints.push(...result.constraints);
      for (const tier of result.leverTiers) {
        leverRecommendations.push(...tier.levers);
      }
    }
  }

  // Deduplicate lever recommendations by lever name, keeping highest priority
  const leverMap = new Map<string, AffectiveLeverCandidate>();
  for (const rec of leverRecommendations) {
    const existing = leverMap.get(rec.lever);
    if (!existing || rec.priority < existing.priority) {
      leverMap.set(rec.lever, rec);
    }
  }

  return {
    goals,
    constraints,
    leverRecommendations: [...leverMap.values()].sort((a, b) => a.priority - b.priority),
  };
}

// =============================================================================
// § Formatting and Reporting
// =============================================================================

/**
 * Format a scope type check result as human-readable text.
 */
export function formatScopeTypeCheck(result: ScopeTypeCheckResult): string {
  const lines: string[] = [];
  if (result.valid) {
    lines.push('Scope type check: VALID');
  } else {
    lines.push('Scope type check: INVALID');
  }
  for (const error of result.errors) {
    lines.push(`  ERROR [${error.code}]: ${error.message}`);
  }
  for (const warning of result.warnings) {
    lines.push(`  WARN  [${warning.code}]: ${warning.message}`);
  }
  return lines.join('\n');
}

/**
 * Format a target type check result as human-readable text.
 */
export function formatTargetTypeCheck(result: TargetTypeCheckResult): string {
  const lines: string[] = [];
  if (result.valid) {
    lines.push('Target type check: VALID');
  } else {
    lines.push('Target type check: INVALID');
  }
  for (const error of result.errors) {
    lines.push(`  ERROR [${error.code}]: ${error.message}`);
  }
  for (const warning of result.warnings) {
    lines.push(`  WARN  [${warning.code}]: ${warning.message}`);
  }
  if (result.candidateLevers.length > 0) {
    lines.push(`  Candidate levers: ${result.candidateLevers.join(', ')}`);
  }
  return lines.join('\n');
}

/**
 * Format an affective detection result as human-readable text.
 */
export function formatAffectiveDetection(result: AffectiveDetectionResult): string {
  const lines: string[] = [];
  lines.push(`Affective detection: ${result.totalMatches} match(es)`);

  if (result.affectiveMatches.length > 0) {
    lines.push('  Affective adjectives:');
    for (const m of result.affectiveMatches) {
      const axes = m.axisBundle.map(a => `${a.axis}(${a.direction},w=${a.weight})`).join(', ');
      lines.push(`    "${m.adjective}" [${m.category}] → ${axes}`);
    }
  }

  if (result.impactMatches.length > 0) {
    lines.push('  Impact phrases:');
    for (const m of result.impactMatches) {
      const axes = m.axisBundle.map(a => `${a.axis}(${a.direction},w=${a.weight})`).join(', ');
      lines.push(`    "${m.phrase}" [${m.impactCategory}] → ${axes}`);
    }
  }

  if (result.complexEmotionMatches.length > 0) {
    lines.push('  Complex emotions:');
    for (const m of result.complexEmotionMatches) {
      const primaryAxes = m.primaryAxes.map(a => `${a.axis}(${a.direction})`).join(', ');
      lines.push(`    "${m.emotion}" [${m.category}] → primary: ${primaryAxes}`);
      lines.push(`      Constraints: ${m.constraintAxes.map(c => `${c.axis}≤Δ${c.maxChange}`).join(', ')}`);
    }
  }

  return lines.join('\n');
}
