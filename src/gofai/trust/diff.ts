/**
 * Diff Trust Primitive
 *
 * The diff system provides structured before/after comparisons for every
 * GOFAI edit. Diffs are the primary artifact for trust: the user can see
 * exactly what changed and verify it matches their intent.
 *
 * ## Design Principles
 *
 * 1. **Granularity**: Diffs operate at event, parameter, and structure levels
 * 2. **Stability**: Same edit always produces the same diff
 * 3. **Readability**: Human-friendly summaries alongside machine-readable data
 * 4. **Composability**: Diffs from multiple steps can be merged
 * 5. **Invertibility**: Every diff has a computable inverse for undo
 *
 * ## Three Levels of Diff
 *
 * - **EventDiff**: Changes to note/control/automation events
 * - **ParamDiff**: Changes to card parameters
 * - **StructureDiff**: Changes to project structure (add/remove cards, layers, sections)
 *
 * @module gofai/trust/diff
 */

// =============================================================================
// Diff Kinds
// =============================================================================

/**
 * The kind of change in a diff entry.
 */
export type DiffKind = 'add' | 'remove' | 'modify' | 'move' | 'reorder';

// =============================================================================
// Event Diffs
// =============================================================================

/**
 * A diff entry for a single event change.
 *
 * Events are the core musical data (notes, control changes, automation
 * points). Event diffs track changes at the individual event level.
 */
export interface EventDiff {
  /** Kind of change */
  readonly kind: DiffKind;

  /** Event ID (stable identifier) */
  readonly eventId: string;

  /** Event kind (note, cc, automation, etc.) */
  readonly eventKind: string;

  /** Layer/track the event belongs to */
  readonly layerId?: string;

  /** Before state (undefined for additions) */
  readonly before?: EventSnapshot;

  /** After state (undefined for removals) */
  readonly after?: EventSnapshot;

  /** Human-readable description of the change */
  readonly description: string;

  /** Time position in ticks */
  readonly tick: number;
}

/**
 * A snapshot of an event's state at a point in time.
 *
 * This captures enough information to display the event and to
 * reconstruct it for undo.
 */
export interface EventSnapshot {
  /** Time position in ticks */
  readonly tick: number;

  /** Duration in ticks (for note events) */
  readonly duration?: number;

  /** MIDI note number (for note events) */
  readonly pitch?: number;

  /** Velocity (for note events) */
  readonly velocity?: number;

  /** Control value (for CC events) */
  readonly value?: number;

  /** All properties as key-value pairs (for generic access) */
  readonly properties: Readonly<Record<string, unknown>>;

  /** Tags/roles on this event */
  readonly tags?: readonly string[];
}

// =============================================================================
// Parameter Diffs
// =============================================================================

/**
 * A diff entry for a card parameter change.
 */
export interface ParamDiff {
  /** Kind of change (usually 'modify') */
  readonly kind: DiffKind;

  /** Card ID */
  readonly cardId: string;

  /** Card display name */
  readonly cardName: string;

  /** Parameter name */
  readonly paramName: string;

  /** Parameter display name */
  readonly paramDisplayName: string;

  /** Value before the change */
  readonly before: unknown;

  /** Value after the change */
  readonly after: unknown;

  /** Unit of the parameter (if applicable) */
  readonly unit?: string;

  /** Human-readable description */
  readonly description: string;
}

// =============================================================================
// Structure Diffs
// =============================================================================

/**
 * A diff entry for a structural change (adding/removing entities).
 */
export interface StructureDiff {
  /** Kind of structural change */
  readonly kind: 'add' | 'remove' | 'move' | 'rename';

  /** What type of entity */
  readonly entityType: 'card' | 'layer' | 'section' | 'marker' | 'route';

  /** Entity ID */
  readonly entityId: string;

  /** Entity display name */
  readonly entityName: string;

  /** Description of the structural change */
  readonly description: string;

  /** For moves: source position info */
  readonly from?: string;

  /** For moves: destination position info */
  readonly to?: string;
}

// =============================================================================
// Diff Entry (Union)
// =============================================================================

/**
 * A single diff entry (any kind).
 */
export type DiffEntry =
  | { readonly type: 'event'; readonly diff: EventDiff }
  | { readonly type: 'param'; readonly diff: ParamDiff }
  | { readonly type: 'structure'; readonly diff: StructureDiff };

// =============================================================================
// Diff Summary
// =============================================================================

/**
 * A human-readable summary line for diff display.
 */
export interface DiffSummaryLine {
  /** Category icon */
  readonly icon: 'add' | 'remove' | 'change' | 'move' | 'info';

  /** Scope label (e.g., "Chorus 2", "Drums") */
  readonly scope: string;

  /** Change description */
  readonly text: string;

  /** Number of individual changes in this line */
  readonly count: number;
}

// =============================================================================
// Diff Report
// =============================================================================

/**
 * A complete diff report for a GOFAI edit.
 *
 * This is the primary diff artifact. It contains:
 * - All individual changes (events, params, structure)
 * - Human-readable summaries
 * - Aggregate statistics
 * - The inverse diff (for undo)
 *
 * ## Invariants
 *
 * 1. `entries` is sorted by time position, then entity type
 * 2. `inverse` applied after the forward diff restores original state
 * 3. `summary` is non-empty for non-trivial diffs
 * 4. `stats` counts match `entries` counts exactly
 */
export interface DiffReport {
  /** Unique diff ID (derived from edit package ID) */
  readonly id: string;

  /** All individual diff entries, sorted */
  readonly entries: readonly DiffEntry[];

  /** Human-readable summary lines for UI display */
  readonly summaryLines: readonly DiffSummaryLine[];

  /** One-line human-readable summary */
  readonly humanSummary: string;

  /** Aggregate statistics */
  readonly stats: DiffStats;

  /** The inverse diff (for undo). Applying inverse after forward = no change */
  readonly inverse: DiffReport | undefined;

  /** Scope boundaries affected */
  readonly affectedScopes: readonly AffectedScopeInfo[];

  /** Timestamp when the diff was computed */
  readonly computedAt: number;
}

/**
 * Aggregate statistics for a diff.
 */
export interface DiffStats {
  /** Total number of events added */
  readonly eventsAdded: number;

  /** Total number of events removed */
  readonly eventsRemoved: number;

  /** Total number of events modified */
  readonly eventsModified: number;

  /** Total number of events moved */
  readonly eventsMoved: number;

  /** Total number of parameters changed */
  readonly paramsChanged: number;

  /** Total number of structural changes */
  readonly structuralChanges: number;

  /** Total number of all changes */
  readonly totalChanges: number;

  /** Number of distinct layers/tracks affected */
  readonly layersAffected: number;

  /** Number of distinct sections affected */
  readonly sectionsAffected: number;
}

/**
 * Information about an affected scope in the diff.
 */
export interface AffectedScopeInfo {
  /** Scope kind */
  readonly kind: 'section' | 'layer' | 'card' | 'global';

  /** Scope label */
  readonly label: string;

  /** Number of changes in this scope */
  readonly changeCount: number;
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a diff report from individual entries.
 *
 * This function:
 * 1. Sorts entries by time position
 * 2. Computes aggregate statistics
 * 3. Generates human-readable summaries
 * 4. Computes the inverse diff (for undo)
 */
export function createDiffReport(
  id: string,
  entries: readonly DiffEntry[],
  computedAt?: number,
): DiffReport {
  const sorted = [...entries].sort(compareDiffEntries);
  const stats = computeDiffStats(sorted);
  const summaryLines = generateSummaryLines(sorted);
  const humanSummary = generateHumanSummary(stats);
  const affectedScopes = computeAffectedScopes(sorted);
  const inverse = computeInverse(id, sorted);

  return {
    id,
    entries: sorted,
    summaryLines,
    humanSummary,
    stats,
    inverse,
    affectedScopes,
    computedAt: computedAt ?? 0,
  };
}

/**
 * Merge two diff reports into one.
 *
 * Used when combining diffs from multiple plan steps.
 */
export function mergeDiffReports(
  id: string,
  a: DiffReport,
  b: DiffReport,
): DiffReport {
  return createDiffReport(id, [...a.entries, ...b.entries]);
}

// =============================================================================
// Internal Helpers
// =============================================================================

function compareDiffEntries(a: DiffEntry, b: DiffEntry): number {
  const tickA = getDiffEntryTick(a);
  const tickB = getDiffEntryTick(b);
  if (tickA !== tickB) return tickA - tickB;

  // Stable secondary sort by type
  const typeOrder = { event: 0, param: 1, structure: 2 } as const;
  const typeA = typeOrder[a.type];
  const typeB = typeOrder[b.type];
  if (typeA !== typeB) return typeA - typeB;

  // Tertiary sort by entity ID
  const idA = getDiffEntryId(a);
  const idB = getDiffEntryId(b);
  return idA < idB ? -1 : idA > idB ? 1 : 0;
}

function getDiffEntryTick(entry: DiffEntry): number {
  if (entry.type === 'event') return entry.diff.tick;
  return 0;
}

function getDiffEntryId(entry: DiffEntry): string {
  switch (entry.type) {
    case 'event':
      return entry.diff.eventId;
    case 'param':
      return `${entry.diff.cardId}:${entry.diff.paramName}`;
    case 'structure':
      return entry.diff.entityId;
  }
}

function computeDiffStats(entries: readonly DiffEntry[]): DiffStats {
  let eventsAdded = 0;
  let eventsRemoved = 0;
  let eventsModified = 0;
  let eventsMoved = 0;
  let paramsChanged = 0;
  let structuralChanges = 0;

  const layers = new Set<string>();
  const sections = new Set<string>();

  for (const entry of entries) {
    switch (entry.type) {
      case 'event':
        switch (entry.diff.kind) {
          case 'add':
            eventsAdded++;
            break;
          case 'remove':
            eventsRemoved++;
            break;
          case 'modify':
            eventsModified++;
            break;
          case 'move':
            eventsMoved++;
            break;
        }
        if (entry.diff.layerId) layers.add(entry.diff.layerId);
        break;
      case 'param':
        paramsChanged++;
        break;
      case 'structure':
        structuralChanges++;
        if (entry.diff.entityType === 'layer') {
          layers.add(entry.diff.entityId);
        }
        if (entry.diff.entityType === 'section') {
          sections.add(entry.diff.entityId);
        }
        break;
    }
  }

  const totalChanges =
    eventsAdded +
    eventsRemoved +
    eventsModified +
    eventsMoved +
    paramsChanged +
    structuralChanges;

  return {
    eventsAdded,
    eventsRemoved,
    eventsModified,
    eventsMoved,
    paramsChanged,
    structuralChanges,
    totalChanges,
    layersAffected: layers.size,
    sectionsAffected: sections.size,
  };
}

function generateSummaryLines(
  entries: readonly DiffEntry[],
): DiffSummaryLine[] {
  // Group by scope (layer + section)
  const groups = new Map<
    string,
    { icon: DiffSummaryLine['icon']; scope: string; count: number; changes: string[] }
  >();

  for (const entry of entries) {
    const scope = getDiffEntryScope(entry);
    const key = scope;
    if (!groups.has(key)) {
      groups.set(key, { icon: 'change', scope, count: 0, changes: [] });
    }
    const group = groups.get(key)!;
    group.count++;

    const desc = getDiffEntryDescription(entry);
    if (group.changes.length < 3) {
      group.changes.push(desc);
    }

    // Set icon to the most impactful kind
    const icon = getDiffEntryIcon(entry);
    if (icon === 'add' || icon === 'remove') {
      group.icon = icon;
    }
  }

  return Array.from(groups.values()).map((g) => ({
    icon: g.icon,
    scope: g.scope,
    text:
      g.count <= 3
        ? g.changes.join('; ')
        : `${g.changes.slice(0, 2).join('; ')} and ${g.count - 2} more`,
    count: g.count,
  }));
}

function getDiffEntryScope(entry: DiffEntry): string {
  switch (entry.type) {
    case 'event':
      return entry.diff.layerId ?? 'Global';
    case 'param':
      return entry.diff.cardName;
    case 'structure':
      return entry.diff.entityType;
  }
}

function getDiffEntryDescription(entry: DiffEntry): string {
  switch (entry.type) {
    case 'event':
      return entry.diff.description;
    case 'param':
      return entry.diff.description;
    case 'structure':
      return entry.diff.description;
  }
}

function getDiffEntryIcon(entry: DiffEntry): DiffSummaryLine['icon'] {
  const kind = entry.type === 'event'
    ? entry.diff.kind
    : entry.type === 'param'
      ? entry.diff.kind
      : entry.diff.kind;

  switch (kind) {
    case 'add':
      return 'add';
    case 'remove':
      return 'remove';
    case 'move':
      return 'move';
    default:
      return 'change';
  }
}

function generateHumanSummary(stats: DiffStats): string {
  if (stats.totalChanges === 0) return 'No changes';

  const parts: string[] = [];

  if (stats.eventsAdded > 0) parts.push(`${stats.eventsAdded} added`);
  if (stats.eventsRemoved > 0) parts.push(`${stats.eventsRemoved} removed`);
  if (stats.eventsModified > 0) parts.push(`${stats.eventsModified} modified`);
  if (stats.eventsMoved > 0) parts.push(`${stats.eventsMoved} moved`);
  if (stats.paramsChanged > 0)
    parts.push(`${stats.paramsChanged} params changed`);
  if (stats.structuralChanges > 0)
    parts.push(`${stats.structuralChanges} structural`);

  const scopeParts: string[] = [];
  if (stats.layersAffected > 0)
    scopeParts.push(
      `${stats.layersAffected} layer${stats.layersAffected === 1 ? '' : 's'}`,
    );
  if (stats.sectionsAffected > 0)
    scopeParts.push(
      `${stats.sectionsAffected} section${stats.sectionsAffected === 1 ? '' : 's'}`,
    );

  const main = parts.join(', ');
  const scope = scopeParts.length > 0 ? ` across ${scopeParts.join(' and ')}` : '';

  return `${main}${scope}`;
}

function computeAffectedScopes(
  entries: readonly DiffEntry[],
): AffectedScopeInfo[] {
  const scopes = new Map<string, { kind: AffectedScopeInfo['kind']; label: string; count: number }>();

  for (const entry of entries) {
    let kind: AffectedScopeInfo['kind'];
    let label: string;

    switch (entry.type) {
      case 'event':
        kind = 'layer';
        label = entry.diff.layerId ?? 'Global';
        break;
      case 'param':
        kind = 'card';
        label = entry.diff.cardName;
        break;
      case 'structure':
        kind = entry.diff.entityType === 'section'
          ? 'section'
          : entry.diff.entityType === 'layer'
            ? 'layer'
            : 'global';
        label = entry.diff.entityName;
        break;
    }

    const key = `${kind}:${label}`;
    if (!scopes.has(key)) {
      scopes.set(key, { kind, label, count: 0 });
    }
    scopes.get(key)!.count++;
  }

  return Array.from(scopes.values()).map((s) => ({
    kind: s.kind,
    label: s.label,
    changeCount: s.count,
  }));
}

function computeInverse(
  id: string,
  entries: readonly DiffEntry[],
): DiffReport | undefined {
  if (entries.length === 0) return undefined;

  const inverseEntries: DiffEntry[] = entries.map(invertDiffEntry).reverse();

  // Build inverse without recursion (inverse of inverse is undefined)
  const sorted = [...inverseEntries].sort(compareDiffEntries);
  const stats = computeDiffStats(sorted);
  const summaryLines = generateSummaryLines(sorted);
  const humanSummary = `Undo: ${generateHumanSummary(stats)}`;
  const affectedScopes = computeAffectedScopes(sorted);

  return {
    id: `${id}:inverse`,
    entries: sorted,
    summaryLines,
    humanSummary,
    stats,
    inverse: undefined,
    affectedScopes,
    computedAt: 0,
  };
}

function invertDiffEntry(entry: DiffEntry): DiffEntry {
  switch (entry.type) {
    case 'event': {
      const d = entry.diff;
      const invertedKind: DiffKind =
        d.kind === 'add' ? 'remove' : d.kind === 'remove' ? 'add' : d.kind;
      return {
        type: 'event',
        diff: {
          ...d,
          kind: invertedKind,
          before: d.after,
          after: d.before,
          description: `Undo: ${d.description}`,
        },
      };
    }
    case 'param': {
      const d = entry.diff;
      return {
        type: 'param',
        diff: {
          ...d,
          before: d.after,
          after: d.before,
          description: `Undo: ${d.description}`,
        },
      };
    }
    case 'structure': {
      const d = entry.diff;
      const invertedKind: StructureDiff['kind'] =
        d.kind === 'add' ? 'remove' : d.kind === 'remove' ? 'add' : d.kind;
      return {
        type: 'structure',
        diff: {
          ...d,
          kind: invertedKind,
          from: d.to,
          to: d.from,
          description: `Undo: ${d.description}`,
        },
      };
    }
  }
}
