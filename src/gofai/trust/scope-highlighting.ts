/**
 * Scope Highlighting Trust Primitive
 *
 * The scope highlighting system provides visual indication of which
 * regions of the project will be affected by a GOFAI edit. This is
 * the "show, don't just tell" component of the trust surface.
 *
 * ## Design Principles
 *
 * 1. **Precise**: Highlighting matches exactly what will change
 * 2. **Layered**: Different highlight kinds for different change types
 * 3. **Non-intrusive**: Highlights overlay existing UI, don't replace it
 * 4. **Interactive**: Clicking highlights navigates to affected regions
 * 5. **Deterministic**: Same scope = same highlights
 *
 * ## Highlight Kinds
 *
 * - `affected`: Region will be changed (primary highlight)
 * - `preserved`: Region is explicitly protected by constraints
 * - `reference`: Region was referenced but won't change (context)
 * - `scope-boundary`: Edge of the affected scope
 * - `warning`: Region might be affected in unexpected ways
 *
 * ## Usage in UI
 *
 * The GOFAI deck computes scope highlights from a CPL scope and
 * passes them to the timeline, tracker, and arrangement editors
 * for overlay rendering.
 *
 * @module gofai/trust/scope-highlighting
 */

// =============================================================================
// Highlight Kinds
// =============================================================================

/**
 * The kind of scope highlight.
 */
export type HighlightKind =
  | 'affected'           // Will be changed
  | 'preserved'          // Explicitly protected
  | 'reference'          // Referenced but unchanged
  | 'scope-boundary'     // Edge of scope
  | 'warning';           // Potential unexpected effect

// =============================================================================
// Highlight Layers
// =============================================================================

/**
 * Which UI layer a highlight applies to.
 *
 * Highlights can target different parts of the editor simultaneously:
 * - `timeline`: The arrangement/timeline view (sections, markers)
 * - `tracker`: The tracker/pattern view (individual events)
 * - `mixer`: The mixer/routing view (channels, cards)
 * - `piano-roll`: The piano roll view (note events)
 * - `notation`: The notation view (if active)
 */
export type HighlightLayer =
  | 'timeline'
  | 'tracker'
  | 'mixer'
  | 'piano-roll'
  | 'notation'
  | 'all';

// =============================================================================
// Highlight Region
// =============================================================================

/**
 * A single highlighted region in the project.
 */
export interface HighlightRegion {
  /** Unique region ID for UI key management */
  readonly id: string;

  /** Time range in ticks (start inclusive, end exclusive) */
  readonly tickStart: number;
  readonly tickEnd: number;

  /** Layer/track ID (undefined means all layers) */
  readonly layerId?: string;

  /** Layer display name (for tooltips) */
  readonly layerName?: string;

  /** Pitch range (for piano roll, MIDI note numbers) */
  readonly pitchMin?: number;
  readonly pitchMax?: number;

  /** Human-readable description (for tooltips) */
  readonly description: string;

  /** Number of events in this region (for density info) */
  readonly eventCount: number;
}

// =============================================================================
// Scope Highlight
// =============================================================================

/**
 * A scope highlight — a region + kind + layer assignment.
 */
export interface ScopeHighlight {
  /** Unique highlight ID */
  readonly id: string;

  /** Kind of highlight */
  readonly kind: HighlightKind;

  /** Which UI layers to display this highlight on */
  readonly layers: readonly HighlightLayer[];

  /** The highlighted region */
  readonly region: HighlightRegion;

  /** Visual priority (higher = rendered on top) */
  readonly priority: number;

  /** Opacity (0-1, for visual layering) */
  readonly opacity: number;

  /** Color hint (for themes; actual color is CSS-defined) */
  readonly colorHint: HighlightColorHint;

  /** Whether this highlight is interactive (clickable) */
  readonly interactive: boolean;

  /** Action to perform on click (if interactive) */
  readonly clickAction?: HighlightClickAction;
}

/**
 * Color hint for theming.
 */
export type HighlightColorHint =
  | 'primary'      // Main action color (blue/purple)
  | 'success'      // Preserved/safe (green)
  | 'warning'      // Caution (orange)
  | 'danger'       // Risk (red)
  | 'info'         // Reference/context (grey/teal)
  | 'neutral';     // Background (grey)

/**
 * Action to perform when a highlight is clicked.
 */
export interface HighlightClickAction {
  /** Action type */
  readonly type: 'navigate' | 'select' | 'inspect' | 'explain';

  /** Target ID (section, layer, event, etc.) */
  readonly targetId: string;

  /** Target type */
  readonly targetType: 'section' | 'layer' | 'event' | 'card';
}

// =============================================================================
// Scope Visualization (Composite)
// =============================================================================

/**
 * A complete scope visualization — all highlights for a given CPL scope.
 *
 * This is the top-level artifact the UI consumes to render all
 * scope-related visual feedback.
 */
export interface ScopeVisualization {
  /** All highlights to render */
  readonly highlights: readonly ScopeHighlight[];

  /** The CPL scope this visualization represents */
  readonly scopeDescription: string;

  /** Overall tick range (bounding box of all highlights) */
  readonly tickRange: { readonly start: number; readonly end: number };

  /** Overall layer range (all affected layers) */
  readonly affectedLayers: readonly string[];

  /** Summary stats */
  readonly stats: ScopeStats;
}

/**
 * Summary statistics for scope visualization.
 */
export interface ScopeStats {
  /** Number of affected regions */
  readonly regionCount: number;

  /** Number of preserved regions */
  readonly preservedCount: number;

  /** Number of reference regions */
  readonly referenceCount: number;

  /** Number of warning regions */
  readonly warningCount: number;

  /** Total events in affected regions */
  readonly totalAffectedEvents: number;

  /** Total events in preserved regions */
  readonly totalPreservedEvents: number;
}

// =============================================================================
// Computation Functions
// =============================================================================

/**
 * Compute scope highlights from a CPL scope definition.
 *
 * This is the main entry point for the scope highlighting system.
 * It takes a scope definition (from a parsed CPL request) and
 * project world state, and produces a set of highlights.
 *
 * @param scopeDef - The scope definition from CPL
 * @param projectState - Current project state for resolving scope to events
 * @returns Array of scope highlights
 */
export function computeScopeHighlights(
  scopeDef: ScopeDefinition,
  projectState: ProjectStateForHighlighting,
): ScopeVisualization {
  const highlights: ScopeHighlight[] = [];
  let highlightIdCounter = 0;

  const nextId = (): string => `sh-${highlightIdCounter++}`;

  // 1. Compute affected regions
  for (const affected of scopeDef.affectedRegions) {
    highlights.push({
      id: nextId(),
      kind: 'affected',
      layers: computeTargetLayers(affected),
      region: {
        id: nextId(),
        tickStart: affected.tickStart,
        tickEnd: affected.tickEnd,
        layerId: affected.layerId,
        layerName: affected.layerName,
        pitchMin: affected.pitchMin,
        pitchMax: affected.pitchMax,
        description: affected.description ?? 'Affected region',
        eventCount: affected.eventCount ?? 0,
      },
      priority: 10,
      opacity: 0.3,
      colorHint: 'primary',
      interactive: true,
      clickAction: affected.layerId
        ? { type: 'select', targetId: affected.layerId, targetType: 'layer' }
        : undefined,
    });
  }

  // 2. Compute preserved regions (from constraints)
  for (const preserved of scopeDef.preservedRegions) {
    highlights.push({
      id: nextId(),
      kind: 'preserved',
      layers: computeTargetLayers(preserved),
      region: {
        id: nextId(),
        tickStart: preserved.tickStart,
        tickEnd: preserved.tickEnd,
        layerId: preserved.layerId,
        layerName: preserved.layerName,
        description: preserved.description ?? 'Preserved (protected)',
        eventCount: preserved.eventCount ?? 0,
      },
      priority: 20,
      opacity: 0.2,
      colorHint: 'success',
      interactive: true,
      clickAction: { type: 'inspect', targetId: preserved.constraintId ?? '', targetType: 'layer' },
    });
  }

  // 3. Compute scope boundaries
  const boundaries = computeScopeBoundaries(scopeDef);
  for (const boundary of boundaries) {
    highlights.push({
      id: nextId(),
      kind: 'scope-boundary',
      layers: ['all'],
      region: {
        id: nextId(),
        tickStart: boundary.tick,
        tickEnd: boundary.tick + 1,
        description: boundary.label,
        eventCount: 0,
      },
      priority: 30,
      opacity: 0.6,
      colorHint: 'neutral',
      interactive: false,
    });
  }

  // 4. Compute warning regions (if scope is broad)
  if (scopeDef.warningRegions) {
    for (const warning of scopeDef.warningRegions) {
      highlights.push({
        id: nextId(),
        kind: 'warning',
        layers: computeTargetLayers(warning),
        region: {
          id: nextId(),
          tickStart: warning.tickStart,
          tickEnd: warning.tickEnd,
          layerId: warning.layerId,
          description: warning.description ?? 'Potential unexpected changes',
          eventCount: warning.eventCount ?? 0,
        },
        priority: 15,
        opacity: 0.2,
        colorHint: 'warning',
        interactive: true,
      });
    }
  }

  // Compute overall stats
  const tickRange = computeTickRange(highlights);
  const affectedLayers = computeAffectedLayers(highlights);
  const stats = computeScopeStats(highlights);

  return {
    highlights,
    scopeDescription: scopeDef.description,
    tickRange,
    affectedLayers,
    stats,
  };
}

// =============================================================================
// Input Types (from CPL scope resolution)
// =============================================================================

/**
 * A scope definition (input from CPL scope resolution).
 */
export interface ScopeDefinition {
  /** Human-readable scope description */
  readonly description: string;

  /** Regions that will be affected by the edit */
  readonly affectedRegions: readonly RegionSpec[];

  /** Regions explicitly preserved by constraints */
  readonly preservedRegions: readonly PreservedRegionSpec[];

  /** Regions with potential unexpected effects (optional) */
  readonly warningRegions?: readonly RegionSpec[];
}

/**
 * Specification for a region (input).
 */
export interface RegionSpec {
  readonly tickStart: number;
  readonly tickEnd: number;
  readonly layerId?: string;
  readonly layerName?: string;
  readonly pitchMin?: number;
  readonly pitchMax?: number;
  readonly description?: string;
  readonly eventCount?: number;
}

/**
 * Specification for a preserved region (input).
 */
export interface PreservedRegionSpec extends RegionSpec {
  readonly constraintId?: string;
  readonly constraintDescription?: string;
}

/**
 * Project state interface (subset needed for highlighting).
 */
export interface ProjectStateForHighlighting {
  /** Get layer display name by ID */
  getLayerName(layerId: string): string | undefined;

  /** Get section markers */
  getSectionMarkers(): readonly { tick: number; label: string }[];

  /** Get total project length in ticks */
  getTotalTicks(): number;
}

// =============================================================================
// Internal Helpers
// =============================================================================

interface BoundaryInfo {
  readonly tick: number;
  readonly label: string;
}

function computeTargetLayers(region: RegionSpec): readonly HighlightLayer[] {
  if (region.layerId) {
    // Specific layer → show in relevant views
    return ['timeline', 'tracker', 'piano-roll'];
  }
  return ['all'];
}

function computeScopeBoundaries(scopeDef: ScopeDefinition): BoundaryInfo[] {
  const ticks = new Set<number>();
  const boundaries: BoundaryInfo[] = [];

  for (const region of scopeDef.affectedRegions) {
    if (!ticks.has(region.tickStart)) {
      ticks.add(region.tickStart);
      boundaries.push({ tick: region.tickStart, label: 'Scope start' });
    }
    if (!ticks.has(region.tickEnd)) {
      ticks.add(region.tickEnd);
      boundaries.push({ tick: region.tickEnd, label: 'Scope end' });
    }
  }

  return boundaries.sort((a, b) => a.tick - b.tick);
}

function computeTickRange(
  highlights: readonly ScopeHighlight[],
): { start: number; end: number } {
  if (highlights.length === 0) return { start: 0, end: 0 };

  let start = Infinity;
  let end = -Infinity;

  for (const h of highlights) {
    if (h.region.tickStart < start) start = h.region.tickStart;
    if (h.region.tickEnd > end) end = h.region.tickEnd;
  }

  return { start: start === Infinity ? 0 : start, end: end === -Infinity ? 0 : end };
}

function computeAffectedLayers(
  highlights: readonly ScopeHighlight[],
): readonly string[] {
  const layers = new Set<string>();
  for (const h of highlights) {
    if (h.kind === 'affected' && h.region.layerId) {
      layers.add(h.region.layerId);
    }
  }
  return Array.from(layers).sort();
}

function computeScopeStats(
  highlights: readonly ScopeHighlight[],
): ScopeStats {
  let regionCount = 0;
  let preservedCount = 0;
  let referenceCount = 0;
  let warningCount = 0;
  let totalAffectedEvents = 0;
  let totalPreservedEvents = 0;

  for (const h of highlights) {
    switch (h.kind) {
      case 'affected':
        regionCount++;
        totalAffectedEvents += h.region.eventCount;
        break;
      case 'preserved':
        preservedCount++;
        totalPreservedEvents += h.region.eventCount;
        break;
      case 'reference':
        referenceCount++;
        break;
      case 'warning':
        warningCount++;
        break;
    }
  }

  return {
    regionCount,
    preservedCount,
    referenceCount,
    warningCount,
    totalAffectedEvents,
    totalPreservedEvents,
  };
}
