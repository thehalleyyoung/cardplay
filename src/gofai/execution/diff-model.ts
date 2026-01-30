/**
 * @file Canonical Diff Model
 * @module gofai/execution/diff-model
 * 
 * Implements Step 304: Define a canonical diff model: event diffs, container diffs,
 * card graph diffs, param diffs, each with stable ordering.
 * 
 * The diff model provides a structured, deterministic representation of changes
 * between two project states. It is designed to be:
 * - Deterministic: Same change → same diff (stable ordering)
 * - Compositional: Diffs can be sequenced, merged, inverted
 * - Inspectable: Every level of detail available
 * - Serializable: Can be saved, shared, displayed
 * - Reversible: Can generate inverse diffs for undo
 * 
 * Diff granularity:
 * - Project level: Overall summary
 * - Entity level: Per-event, per-track, per-card changes
 * - Field level: Which properties changed
 * - Value level: Old vs new values
 * 
 * @see gofai_goalB.md Step 304
 * @see gofai_goalB.md Step 326 (diff rendering)
 */

// ============================================================================
// Core Diff Types
// ============================================================================

/**
 * A canonical diff represents all changes between two project states.
 * 
 * The diff is organized hierarchically:
 * - Top level: Project-wide summary
 * - Entity level: Changes per entity type
 * - Field level: Changes per property
 * 
 * All diffs use stable ordering (sorted by ID) for determinism.
 */
export interface CanonicalDiff {
  /** Diff format version */
  readonly version: string;
  
  /** Unique diff ID */
  readonly id: string;
  
  /** When this diff was computed */
  readonly timestamp: number;
  
  /** Project metadata changes */
  readonly metadata: MetadataDiff;
  
  /** Event changes */
  readonly events: EventDiff;
  
  /** Track changes */
  readonly tracks: TrackDiff;
  
  /** Card changes */
  readonly cards: CardDiff;
  
  /** Section marker changes */
  readonly sections: SectionDiff;
  
  /** Routing changes */
  readonly routing: RoutingDiff;
  
  /** Change summary (counts) */
  readonly summary: DiffSummary;
  
  /** Human-readable summary */
  readonly humanSummary: string;
}

/**
 * Summary statistics for a diff.
 */
export interface DiffSummary {
  /** Total number of changes */
  readonly totalChanges: number;
  
  /** Number of additions */
  readonly additions: number;
  
  /** Number of removals */
  readonly removals: number;
  
  /** Number of modifications */
  readonly modifications: number;
  
  /** Affected entity counts by type */
  readonly affectedEntities: {
    readonly events: number;
    readonly tracks: number;
    readonly cards: number;
    readonly sections: number;
    readonly routing: number;
  };
}

// ============================================================================
// Metadata Diff
// ============================================================================

/**
 * Project metadata changes (tempo, time signature, etc.).
 */
export interface MetadataDiff {
  /** Tempo change */
  readonly tempo?: ValueChange<number>;
  
  /** Time signature change */
  readonly timeSignature?: ValueChange<{ numerator: number; denominator: number }>;
  
  /** Length change (in ticks) */
  readonly lengthTicks?: ValueChange<number>;
  
  /** Length change (in bars) */
  readonly lengthBars?: ValueChange<number>;
}

/**
 * A change in a value.
 */
export interface ValueChange<T> {
  readonly old: T;
  readonly new: T;
}

// ============================================================================
// Event Diff
// ============================================================================

/**
 * Changes to events.
 */
export interface EventDiff {
  /** Added events */
  readonly added: readonly AddedEvent[];
  
  /** Removed events */
  readonly removed: readonly RemovedEvent[];
  
  /** Modified events */
  readonly modified: readonly ModifiedEvent[];
  
  /** Summary statistics */
  readonly summary: {
    readonly totalAdded: number;
    readonly totalRemoved: number;
    readonly totalModified: number;
    readonly byKind: Record<string, { added: number; removed: number; modified: number }>;
  };
}

/**
 * An added event.
 */
export interface AddedEvent {
  readonly type: 'added';
  readonly id: string;
  readonly kind: string;
  readonly startTick: number;
  readonly durationTicks: number;
  readonly trackId: string;
  readonly payload: unknown;
  readonly tags: readonly string[];
}

/**
 * A removed event.
 */
export interface RemovedEvent {
  readonly type: 'removed';
  readonly id: string;
  readonly kind: string;
  readonly startTick: number;
  readonly durationTicks: number;
  readonly trackId: string;
  readonly payload: unknown;
  readonly tags: readonly string[];
}

/**
 * A modified event.
 */
export interface ModifiedEvent {
  readonly type: 'modified';
  readonly id: string;
  readonly kind: string;
  readonly changes: EventFieldChanges;
}

/**
 * Field-level changes to an event.
 */
export interface EventFieldChanges {
  readonly startTick?: ValueChange<number>;
  readonly durationTicks?: ValueChange<number>;
  readonly trackId?: ValueChange<string>;
  readonly payload?: PayloadChange;
  readonly tags?: TagsChange;
}

/**
 * Change to event payload.
 */
export interface PayloadChange {
  readonly old: unknown;
  readonly new: unknown;
  readonly fields?: Record<string, ValueChange<unknown>>;
}

/**
 * Change to event tags.
 */
export interface TagsChange {
  readonly added: readonly string[];
  readonly removed: readonly string[];
}

// ============================================================================
// Track Diff
// ============================================================================

/**
 * Changes to tracks.
 */
export interface TrackDiff {
  /** Added tracks */
  readonly added: readonly AddedTrack[];
  
  /** Removed tracks */
  readonly removed: readonly RemovedTrack[];
  
  /** Modified tracks */
  readonly modified: readonly ModifiedTrack[];
  
  /** Summary statistics */
  readonly summary: {
    readonly totalAdded: number;
    readonly totalRemoved: number;
    readonly totalModified: number;
  };
}

/**
 * An added track.
 */
export interface AddedTrack {
  readonly type: 'added';
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly trackType: string;
  readonly gain: number;
  readonly pan: number;
  readonly muted: boolean;
  readonly soloed: boolean;
}

/**
 * A removed track.
 */
export interface RemovedTrack {
  readonly type: 'removed';
  readonly id: string;
  readonly name: string;
  readonly role: string;
}

/**
 * A modified track.
 */
export interface ModifiedTrack {
  readonly type: 'modified';
  readonly id: string;
  readonly name: string;
  readonly changes: TrackFieldChanges;
}

/**
 * Field-level changes to a track.
 */
export interface TrackFieldChanges {
  readonly name?: ValueChange<string>;
  readonly role?: ValueChange<string>;
  readonly gain?: ValueChange<number>;
  readonly pan?: ValueChange<number>;
  readonly muted?: ValueChange<boolean>;
  readonly soloed?: ValueChange<boolean>;
}

// ============================================================================
// Card Diff
// ============================================================================

/**
 * Changes to cards.
 */
export interface CardDiff {
  /** Added cards */
  readonly added: readonly AddedCard[];
  
  /** Removed cards */
  readonly removed: readonly RemovedCard[];
  
  /** Modified cards */
  readonly modified: readonly ModifiedCard[];
  
  /** Summary statistics */
  readonly summary: {
    readonly totalAdded: number;
    readonly totalRemoved: number;
    readonly totalModified: number;
    readonly byType: Record<string, { added: number; removed: number; modified: number }>;
  };
}

/**
 * An added card.
 */
export interface AddedCard {
  readonly type: 'added';
  readonly id: string;
  readonly cardType: string;
  readonly name: string;
  readonly trackId: string;
  readonly position: number;
  readonly parameters: Record<string, unknown>;
}

/**
 * A removed card.
 */
export interface RemovedCard {
  readonly type: 'removed';
  readonly id: string;
  readonly cardType: string;
  readonly name: string;
  readonly trackId: string;
}

/**
 * A modified card.
 */
export interface ModifiedCard {
  readonly type: 'modified';
  readonly id: string;
  readonly cardType: string;
  readonly name: string;
  readonly changes: CardFieldChanges;
}

/**
 * Field-level changes to a card.
 */
export interface CardFieldChanges {
  readonly name?: ValueChange<string>;
  readonly position?: ValueChange<number>;
  readonly bypassed?: ValueChange<boolean>;
  readonly parameters?: Record<string, ParameterChange>;
}

/**
 * Change to a card parameter.
 */
export interface ParameterChange {
  readonly paramId: string;
  readonly paramName: string;
  readonly old: unknown;
  readonly new: unknown;
  readonly unit?: string;
}

// ============================================================================
// Section Diff
// ============================================================================

/**
 * Changes to section markers.
 */
export interface SectionDiff {
  /** Added sections */
  readonly added: readonly AddedSection[];
  
  /** Removed sections */
  readonly removed: readonly RemovedSection[];
  
  /** Modified sections */
  readonly modified: readonly ModifiedSection[];
  
  /** Summary statistics */
  readonly summary: {
    readonly totalAdded: number;
    readonly totalRemoved: number;
    readonly totalModified: number;
  };
}

/**
 * An added section.
 */
export interface AddedSection {
  readonly type: 'added';
  readonly id: string;
  readonly sectionType: string;
  readonly name: string;
  readonly startTick: number;
  readonly endTick: number;
  readonly startBar: number;
  readonly endBar: number;
}

/**
 * A removed section.
 */
export interface RemovedSection {
  readonly type: 'removed';
  readonly id: string;
  readonly sectionType: string;
  readonly name: string;
  readonly startTick: number;
  readonly endTick: number;
}

/**
 * A modified section.
 */
export interface ModifiedSection {
  readonly type: 'modified';
  readonly id: string;
  readonly name: string;
  readonly changes: SectionFieldChanges;
}

/**
 * Field-level changes to a section.
 */
export interface SectionFieldChanges {
  readonly name?: ValueChange<string>;
  readonly sectionType?: ValueChange<string>;
  readonly startTick?: ValueChange<number>;
  readonly endTick?: ValueChange<number>;
  readonly startBar?: ValueChange<number>;
  readonly endBar?: ValueChange<number>;
}

// ============================================================================
// Routing Diff
// ============================================================================

/**
 * Changes to routing connections.
 */
export interface RoutingDiff {
  /** Added connections */
  readonly added: readonly AddedConnection[];
  
  /** Removed connections */
  readonly removed: readonly RemovedConnection[];
  
  /** Modified connections */
  readonly modified: readonly ModifiedConnection[];
  
  /** Summary statistics */
  readonly summary: {
    readonly totalAdded: number;
    readonly totalRemoved: number;
    readonly totalModified: number;
  };
}

/**
 * An added connection.
 */
export interface AddedConnection {
  readonly type: 'added';
  readonly id: string;
  readonly sourceTrackId: string;
  readonly sourcePort: string;
  readonly targetTrackId: string;
  readonly targetPort: string;
  readonly signalType: string;
}

/**
 * A removed connection.
 */
export interface RemovedConnection {
  readonly type: 'removed';
  readonly id: string;
  readonly sourceTrackId: string;
  readonly sourcePort: string;
  readonly targetTrackId: string;
  readonly targetPort: string;
}

/**
 * A modified connection.
 */
export interface ModifiedConnection {
  readonly type: 'modified';
  readonly id: string;
  readonly changes: ConnectionFieldChanges;
}

/**
 * Field-level changes to a connection.
 */
export interface ConnectionFieldChanges {
  readonly sourceTrackId?: ValueChange<string>;
  readonly sourcePort?: ValueChange<string>;
  readonly targetTrackId?: ValueChange<string>;
  readonly targetPort?: ValueChange<string>;
}

// ============================================================================
// Diff Computation
// ============================================================================

/**
 * Compute a canonical diff between two project states.
 * 
 * This is the main entry point for diff generation.
 */
export function computeCanonicalDiff(
  before: ProjectSnapshot,
  after: ProjectSnapshot
): CanonicalDiff {
  const eventDiff = computeEventDiff(before.events, after.events);
  const trackDiff = computeTrackDiff(before.tracks, after.tracks);
  const cardDiff = computeCardDiff(before.cards, after.cards);
  const sectionDiff = computeSectionDiff(before.sections, after.sections);
  const routingDiff = computeRoutingDiff(before.routing, after.routing);
  const metadataDiff = computeMetadataDiff(before.metadata, after.metadata);
  
  const totalChanges = 
    eventDiff.summary.totalAdded + eventDiff.summary.totalRemoved + eventDiff.summary.totalModified +
    trackDiff.summary.totalAdded + trackDiff.summary.totalRemoved + trackDiff.summary.totalModified +
    cardDiff.summary.totalAdded + cardDiff.summary.totalRemoved + cardDiff.summary.totalModified +
    sectionDiff.summary.totalAdded + sectionDiff.summary.totalRemoved + sectionDiff.summary.totalModified +
    routingDiff.summary.totalAdded + routingDiff.summary.totalRemoved + routingDiff.summary.totalModified;
  
  const summary: DiffSummary = {
    totalChanges,
    additions: 
      eventDiff.summary.totalAdded +
      trackDiff.summary.totalAdded +
      cardDiff.summary.totalAdded +
      sectionDiff.summary.totalAdded +
      routingDiff.summary.totalAdded,
    removals:
      eventDiff.summary.totalRemoved +
      trackDiff.summary.totalRemoved +
      cardDiff.summary.totalRemoved +
      sectionDiff.summary.totalRemoved +
      routingDiff.summary.totalRemoved,
    modifications:
      eventDiff.summary.totalModified +
      trackDiff.summary.totalModified +
      cardDiff.summary.totalModified +
      sectionDiff.summary.totalModified +
      routingDiff.summary.totalModified,
    affectedEntities: {
      events: eventDiff.summary.totalAdded + eventDiff.summary.totalRemoved + eventDiff.summary.totalModified,
      tracks: trackDiff.summary.totalAdded + trackDiff.summary.totalRemoved + trackDiff.summary.totalModified,
      cards: cardDiff.summary.totalAdded + cardDiff.summary.totalRemoved + cardDiff.summary.totalModified,
      sections: sectionDiff.summary.totalAdded + sectionDiff.summary.totalRemoved + sectionDiff.summary.totalModified,
      routing: routingDiff.summary.totalAdded + routingDiff.summary.totalRemoved + routingDiff.summary.totalModified,
    },
  };
  
  return {
    version: '1.0.0',
    id: generateDiffId(),
    timestamp: Date.now(),
    metadata: metadataDiff,
    events: eventDiff,
    tracks: trackDiff,
    cards: cardDiff,
    sections: sectionDiff,
    routing: routingDiff,
    summary,
    humanSummary: generateHumanSummary(summary, eventDiff, trackDiff, cardDiff, sectionDiff, routingDiff),
  };
}

/**
 * Project snapshot for diffing.
 */
export interface ProjectSnapshot {
  readonly metadata: ProjectMetadata;
  readonly events: readonly SnapshotEvent[];
  readonly tracks: readonly SnapshotTrack[];
  readonly cards: readonly SnapshotCard[];
  readonly sections: readonly SnapshotSection[];
  readonly routing: readonly SnapshotConnection[];
}

/**
 * Project metadata snapshot.
 */
export interface ProjectMetadata {
  readonly tempoBpm: number;
  readonly timeSignature: { numerator: number; denominator: number };
  readonly ticksPerQuarter: number;
  readonly lengthTicks: number;
  readonly lengthBars: number;
}

/**
 * Event snapshot.
 */
export interface SnapshotEvent {
  readonly id: string;
  readonly kind: string;
  readonly startTick: number;
  readonly durationTicks: number;
  readonly trackId: string;
  readonly payload: unknown;
  readonly tags: readonly string[];
}

/**
 * Track snapshot.
 */
export interface SnapshotTrack {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly trackType: string;
  readonly gain: number;
  readonly pan: number;
  readonly muted: boolean;
  readonly soloed: boolean;
}

/**
 * Card snapshot.
 */
export interface SnapshotCard {
  readonly id: string;
  readonly cardType: string;
  readonly name: string;
  readonly trackId: string;
  readonly position: number;
  readonly parameters: Record<string, unknown>;
  readonly bypassed: boolean;
}

/**
 * Section snapshot.
 */
export interface SnapshotSection {
  readonly id: string;
  readonly sectionType: string;
  readonly name: string;
  readonly startTick: number;
  readonly endTick: number;
  readonly startBar: number;
  readonly endBar: number;
}

/**
 * Connection snapshot.
 */
export interface SnapshotConnection {
  readonly id: string;
  readonly sourceTrackId: string;
  readonly sourcePort: string;
  readonly targetTrackId: string;
  readonly targetPort: string;
  readonly signalType: string;
}

/**
 * Compute metadata diff.
 */
function computeMetadataDiff(
  before: ProjectMetadata,
  after: ProjectMetadata
): MetadataDiff {
  const diff: Partial<MetadataDiff> = {};
  
  if (before.tempoBpm !== after.tempoBpm) {
    diff.tempo = { old: before.tempoBpm, new: after.tempoBpm };
  }
  
  if (
    before.timeSignature.numerator !== after.timeSignature.numerator ||
    before.timeSignature.denominator !== after.timeSignature.denominator
  ) {
    diff.timeSignature = {
      old: before.timeSignature,
      new: after.timeSignature,
    };
  }
  
  if (before.lengthTicks !== after.lengthTicks) {
    diff.lengthTicks = { old: before.lengthTicks, new: after.lengthTicks };
  }
  
  if (before.lengthBars !== after.lengthBars) {
    diff.lengthBars = { old: before.lengthBars, new: after.lengthBars };
  }
  
  return diff as MetadataDiff;
}

/**
 * Compute event diff.
 */
function computeEventDiff(
  before: readonly SnapshotEvent[],
  after: readonly SnapshotEvent[]
): EventDiff {
  const beforeMap = new Map(before.map(e => [e.id, e]));
  const afterMap = new Map(after.map(e => [e.id, e]));
  
  const added: AddedEvent[] = [];
  const removed: RemovedEvent[] = [];
  const modified: ModifiedEvent[] = [];
  
  // Find added and modified
  for (const afterEvent of after) {
    const beforeEvent = beforeMap.get(afterEvent.id);
    if (!beforeEvent) {
      added.push({ type: 'added', ...afterEvent });
    } else {
      const changes = computeEventChanges(beforeEvent, afterEvent);
      if (hasChanges(changes)) {
        modified.push({
          type: 'modified',
          id: afterEvent.id,
          kind: afterEvent.kind,
          changes,
        });
      }
    }
  }
  
  // Find removed
  for (const beforeEvent of before) {
    if (!afterMap.has(beforeEvent.id)) {
      removed.push({ type: 'removed', ...beforeEvent });
    }
  }
  
  // Sort for determinism
  added.sort((a, b) => a.id.localeCompare(b.id));
  removed.sort((a, b) => a.id.localeCompare(b.id));
  modified.sort((a, b) => a.id.localeCompare(b.id));
  
  // Compute by-kind summary
  const byKind: Record<string, { added: number; removed: number; modified: number }> = {};
  for (const event of added) {
    if (!byKind[event.kind]) byKind[event.kind] = { added: 0, removed: 0, modified: 0 };
    byKind[event.kind].added++;
  }
  for (const event of removed) {
    if (!byKind[event.kind]) byKind[event.kind] = { added: 0, removed: 0, modified: 0 };
    byKind[event.kind].removed++;
  }
  for (const event of modified) {
    if (!byKind[event.kind]) byKind[event.kind] = { added: 0, removed: 0, modified: 0 };
    byKind[event.kind].modified++;
  }
  
  return {
    added,
    removed,
    modified,
    summary: {
      totalAdded: added.length,
      totalRemoved: removed.length,
      totalModified: modified.length,
      byKind,
    },
  };
}

/**
 * Compute changes between two events.
 */
function computeEventChanges(
  before: SnapshotEvent,
  after: SnapshotEvent
): EventFieldChanges {
  const changes: Partial<EventFieldChanges> = {};
  
  if (before.startTick !== after.startTick) {
    changes.startTick = { old: before.startTick, new: after.startTick };
  }
  
  if (before.durationTicks !== after.durationTicks) {
    changes.durationTicks = { old: before.durationTicks, new: after.durationTicks };
  }
  
  if (before.trackId !== after.trackId) {
    changes.trackId = { old: before.trackId, new: after.trackId };
  }
  
  if (JSON.stringify(before.payload) !== JSON.stringify(after.payload)) {
    changes.payload = {
      old: before.payload,
      new: after.payload,
    };
  }
  
  const addedTags = after.tags.filter(t => !before.tags.includes(t));
  const removedTags = before.tags.filter(t => !after.tags.includes(t));
  if (addedTags.length > 0 || removedTags.length > 0) {
    changes.tags = {
      added: addedTags,
      removed: removedTags,
    };
  }
  
  return changes as EventFieldChanges;
}

/**
 * Compute track diff.
 */
function computeTrackDiff(
  before: readonly SnapshotTrack[],
  after: readonly SnapshotTrack[]
): TrackDiff {
  const beforeMap = new Map(before.map(t => [t.id, t]));
  const afterMap = new Map(after.map(t => [t.id, t]));
  
  const added: AddedTrack[] = [];
  const removed: RemovedTrack[] = [];
  const modified: ModifiedTrack[] = [];
  
  for (const afterTrack of after) {
    const beforeTrack = beforeMap.get(afterTrack.id);
    if (!beforeTrack) {
      added.push({ type: 'added', ...afterTrack });
    } else {
      const changes = computeTrackChanges(beforeTrack, afterTrack);
      if (hasChanges(changes)) {
        modified.push({
          type: 'modified',
          id: afterTrack.id,
          name: afterTrack.name,
          changes,
        });
      }
    }
  }
  
  for (const beforeTrack of before) {
    if (!afterMap.has(beforeTrack.id)) {
      removed.push({
        type: 'removed',
        id: beforeTrack.id,
        name: beforeTrack.name,
        role: beforeTrack.role,
      });
    }
  }
  
  added.sort((a, b) => a.id.localeCompare(b.id));
  removed.sort((a, b) => a.id.localeCompare(b.id));
  modified.sort((a, b) => a.id.localeCompare(b.id));
  
  return {
    added,
    removed,
    modified,
    summary: {
      totalAdded: added.length,
      totalRemoved: removed.length,
      totalModified: modified.length,
    },
  };
}

/**
 * Compute changes between two tracks.
 */
function computeTrackChanges(
  before: SnapshotTrack,
  after: SnapshotTrack
): TrackFieldChanges {
  const changes: Partial<TrackFieldChanges> = {};
  
  if (before.name !== after.name) changes.name = { old: before.name, new: after.name };
  if (before.role !== after.role) changes.role = { old: before.role, new: after.role };
  if (before.gain !== after.gain) changes.gain = { old: before.gain, new: after.gain };
  if (before.pan !== after.pan) changes.pan = { old: before.pan, new: after.pan };
  if (before.muted !== after.muted) changes.muted = { old: before.muted, new: after.muted };
  if (before.soloed !== after.soloed) changes.soloed = { old: before.soloed, new: after.soloed };
  
  return changes as TrackFieldChanges;
}

/**
 * Compute card diff.
 */
function computeCardDiff(
  before: readonly SnapshotCard[],
  after: readonly SnapshotCard[]
): CardDiff {
  const beforeMap = new Map(before.map(c => [c.id, c]));
  const afterMap = new Map(after.map(c => [c.id, c]));
  
  const added: AddedCard[] = [];
  const removed: RemovedCard[] = [];
  const modified: ModifiedCard[] = [];
  
  for (const afterCard of after) {
    const beforeCard = beforeMap.get(afterCard.id);
    if (!beforeCard) {
      added.push({ type: 'added', ...afterCard });
    } else {
      const changes = computeCardChanges(beforeCard, afterCard);
      if (hasChanges(changes)) {
        modified.push({
          type: 'modified',
          id: afterCard.id,
          cardType: afterCard.cardType,
          name: afterCard.name,
          changes,
        });
      }
    }
  }
  
  for (const beforeCard of before) {
    if (!afterMap.has(beforeCard.id)) {
      removed.push({
        type: 'removed',
        id: beforeCard.id,
        cardType: beforeCard.cardType,
        name: beforeCard.name,
        trackId: beforeCard.trackId,
      });
    }
  }
  
  added.sort((a, b) => a.id.localeCompare(b.id));
  removed.sort((a, b) => a.id.localeCompare(b.id));
  modified.sort((a, b) => a.id.localeCompare(b.id));
  
  // Compute by-type summary
  const byType: Record<string, { added: number; removed: number; modified: number }> = {};
  for (const card of added) {
    if (!byType[card.cardType]) byType[card.cardType] = { added: 0, removed: 0, modified: 0 };
    byType[card.cardType].added++;
  }
  for (const card of removed) {
    if (!byType[card.cardType]) byType[card.cardType] = { added: 0, removed: 0, modified: 0 };
    byType[card.cardType].removed++;
  }
  for (const card of modified) {
    if (!byType[card.cardType]) byType[card.cardType] = { added: 0, removed: 0, modified: 0 };
    byType[card.cardType].modified++;
  }
  
  return {
    added,
    removed,
    modified,
    summary: {
      totalAdded: added.length,
      totalRemoved: removed.length,
      totalModified: modified.length,
      byType,
    },
  };
}

/**
 * Compute changes between two cards.
 */
function computeCardChanges(
  before: SnapshotCard,
  after: SnapshotCard
): CardFieldChanges {
  const changes: Partial<CardFieldChanges> = {};
  
  if (before.name !== after.name) changes.name = { old: before.name, new: after.name };
  if (before.position !== after.position) changes.position = { old: before.position, new: after.position };
  if (before.bypassed !== after.bypassed) changes.bypassed = { old: before.bypassed, new: after.bypassed };
  
  // Parameter changes
  const paramChanges: Record<string, ParameterChange> = {};
  const allParamIds = [...Object.keys(before.parameters), ...Object.keys(after.parameters)];
  const seenParamIds = new Set<string>();
  
  for (const paramId of allParamIds) {
    if (seenParamIds.has(paramId)) continue;
    seenParamIds.add(paramId);
    
    const beforeValue = before.parameters[paramId];
    const afterValue = after.parameters[paramId];
    
    if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
      paramChanges[paramId] = {
        paramId,
        paramName: paramId, // Would need card schema to get display name
        old: beforeValue,
        new: afterValue,
      };
    }
  }
  
  if (Object.keys(paramChanges).length > 0) {
    changes.parameters = paramChanges;
  }
  
  return changes as CardFieldChanges;
}

/**
 * Compute section diff.
 */
function computeSectionDiff(
  before: readonly SnapshotSection[],
  after: readonly SnapshotSection[]
): SectionDiff {
  const beforeMap = new Map(before.map(s => [s.id, s]));
  const afterMap = new Map(after.map(s => [s.id, s]));
  
  const added: AddedSection[] = [];
  const removed: RemovedSection[] = [];
  const modified: ModifiedSection[] = [];
  
  for (const afterSection of after) {
    const beforeSection = beforeMap.get(afterSection.id);
    if (!beforeSection) {
      added.push({ type: 'added', ...afterSection });
    } else {
      const changes = computeSectionChanges(beforeSection, afterSection);
      if (hasChanges(changes)) {
        modified.push({
          type: 'modified',
          id: afterSection.id,
          name: afterSection.name,
          changes,
        });
      }
    }
  }
  
  for (const beforeSection of before) {
    if (!afterMap.has(beforeSection.id)) {
      removed.push({
        type: 'removed',
        id: beforeSection.id,
        sectionType: beforeSection.sectionType,
        name: beforeSection.name,
        startTick: beforeSection.startTick,
        endTick: beforeSection.endTick,
      });
    }
  }
  
  added.sort((a, b) => a.id.localeCompare(b.id));
  removed.sort((a, b) => a.id.localeCompare(b.id));
  modified.sort((a, b) => a.id.localeCompare(b.id));
  
  return {
    added,
    removed,
    modified,
    summary: {
      totalAdded: added.length,
      totalRemoved: removed.length,
      totalModified: modified.length,
    },
  };
}

/**
 * Compute changes between two sections.
 */
function computeSectionChanges(
  before: SnapshotSection,
  after: SnapshotSection
): SectionFieldChanges {
  const changes: Partial<SectionFieldChanges> = {};
  
  if (before.name !== after.name) changes.name = { old: before.name, new: after.name };
  if (before.sectionType !== after.sectionType) changes.sectionType = { old: before.sectionType, new: after.sectionType };
  if (before.startTick !== after.startTick) changes.startTick = { old: before.startTick, new: after.startTick };
  if (before.endTick !== after.endTick) changes.endTick = { old: before.endTick, new: after.endTick };
  if (before.startBar !== after.startBar) changes.startBar = { old: before.startBar, new: after.startBar };
  if (before.endBar !== after.endBar) changes.endBar = { old: before.endBar, new: after.endBar };
  
  return changes as SectionFieldChanges;
}

/**
 * Compute routing diff.
 */
function computeRoutingDiff(
  before: readonly SnapshotConnection[],
  after: readonly SnapshotConnection[]
): RoutingDiff {
  const beforeMap = new Map(before.map(c => [c.id, c]));
  const afterMap = new Map(after.map(c => [c.id, c]));
  
  const added: AddedConnection[] = [];
  const removed: RemovedConnection[] = [];
  const modified: ModifiedConnection[] = [];
  
  for (const afterConn of after) {
    const beforeConn = beforeMap.get(afterConn.id);
    if (!beforeConn) {
      added.push({ type: 'added', ...afterConn });
    } else {
      const changes = computeConnectionChanges(beforeConn, afterConn);
      if (hasChanges(changes)) {
        modified.push({
          type: 'modified',
          id: afterConn.id,
          changes,
        });
      }
    }
  }
  
  for (const beforeConn of before) {
    if (!afterMap.has(beforeConn.id)) {
      removed.push({ type: 'removed', ...beforeConn });
    }
  }
  
  added.sort((a, b) => a.id.localeCompare(b.id));
  removed.sort((a, b) => a.id.localeCompare(b.id));
  modified.sort((a, b) => a.id.localeCompare(b.id));
  
  return {
    added,
    removed,
    modified,
    summary: {
      totalAdded: added.length,
      totalRemoved: removed.length,
      totalModified: modified.length,
    },
  };
}

/**
 * Compute changes between two connections.
 */
function computeConnectionChanges(
  before: SnapshotConnection,
  after: SnapshotConnection
): ConnectionFieldChanges {
  const changes: Partial<ConnectionFieldChanges> = {};
  
  if (before.sourceTrackId !== after.sourceTrackId) {
    changes.sourceTrackId = { old: before.sourceTrackId, new: after.sourceTrackId };
  }
  if (before.sourcePort !== after.sourcePort) {
    changes.sourcePort = { old: before.sourcePort, new: after.sourcePort };
  }
  if (before.targetTrackId !== after.targetTrackId) {
    changes.targetTrackId = { old: before.targetTrackId, new: after.targetTrackId };
  }
  if (before.targetPort !== after.targetPort) {
    changes.targetPort = { old: before.targetPort, new: after.targetPort };
  }
  
  return changes as ConnectionFieldChanges;
}

/**
 * Check if a changes object has any changes.
 */
function hasChanges(changes: object): boolean {
  return Object.keys(changes).length > 0;
}

/**
 * Generate a unique diff ID.
 */
function generateDiffId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `diff:${timestamp}:${random}`;
}

/**
 * Generate a human-readable summary.
 */
function generateHumanSummary(
  summary: DiffSummary,
  events: EventDiff,
  tracks: TrackDiff,
  cards: CardDiff,
  sections: SectionDiff,
  routing: RoutingDiff
): string {
  if (summary.totalChanges === 0) {
    return 'No changes';
  }
  
  const parts: string[] = [];
  
  if (events.summary.totalAdded + events.summary.totalRemoved + events.summary.totalModified > 0) {
    parts.push(
      `${events.summary.totalAdded + events.summary.totalRemoved + events.summary.totalModified} event changes` +
      ` (+${events.summary.totalAdded}, -${events.summary.totalRemoved}, ~${events.summary.totalModified})`
    );
  }
  
  if (tracks.summary.totalAdded + tracks.summary.totalRemoved + tracks.summary.totalModified > 0) {
    parts.push(
      `${tracks.summary.totalAdded + tracks.summary.totalRemoved + tracks.summary.totalModified} track changes` +
      ` (+${tracks.summary.totalAdded}, -${tracks.summary.totalRemoved}, ~${tracks.summary.totalModified})`
    );
  }
  
  if (cards.summary.totalAdded + cards.summary.totalRemoved + cards.summary.totalModified > 0) {
    parts.push(
      `${cards.summary.totalAdded + cards.summary.totalRemoved + cards.summary.totalModified} card changes` +
      ` (+${cards.summary.totalAdded}, -${cards.summary.totalRemoved}, ~${cards.summary.totalModified})`
    );
  }
  
  if (sections.summary.totalAdded + sections.summary.totalRemoved + sections.summary.totalModified > 0) {
    parts.push(
      `${sections.summary.totalAdded + sections.summary.totalRemoved + sections.summary.totalModified} section changes` +
      ` (+${sections.summary.totalAdded}, -${sections.summary.totalRemoved}, ~${sections.summary.totalModified})`
    );
  }
  
  if (routing.summary.totalAdded + routing.summary.totalRemoved + routing.summary.totalModified > 0) {
    parts.push(
      `${routing.summary.totalAdded + routing.summary.totalRemoved + routing.summary.totalModified} routing changes` +
      ` (+${routing.summary.totalAdded}, -${routing.summary.totalRemoved}, ~${routing.summary.totalModified})`
    );
  }
  
  return parts.join('; ');
}

// ============================================================================
// Diff Utilities
// ============================================================================

/**
 * Serialize a diff to JSON.
 */
export function serializeDiff(diff: CanonicalDiff): string {
  return JSON.stringify(diff, null, 2);
}

/**
 * Deserialize a diff from JSON.
 */
export function deserializeDiff(json: string): CanonicalDiff {
  return JSON.parse(json) as CanonicalDiff;
}

/**
 * Check if a diff is empty (no changes).
 */
export function isDiffEmpty(diff: CanonicalDiff): boolean {
  return diff.summary.totalChanges === 0;
}

/**
 * Get all changed entity IDs from a diff.
 */
export function getChangedEntityIds(diff: CanonicalDiff): {
  events: Set<string>;
  tracks: Set<string>;
  cards: Set<string>;
  sections: Set<string>;
  routing: Set<string>;
} {
  return {
    events: new Set([
      ...diff.events.added.map(e => e.id),
      ...diff.events.removed.map(e => e.id),
      ...diff.events.modified.map(e => e.id),
    ]),
    tracks: new Set([
      ...diff.tracks.added.map(t => t.id),
      ...diff.tracks.removed.map(t => t.id),
      ...diff.tracks.modified.map(t => t.id),
    ]),
    cards: new Set([
      ...diff.cards.added.map(c => c.id),
      ...diff.cards.removed.map(c => c.id),
      ...diff.cards.modified.map(c => c.id),
    ]),
    sections: new Set([
      ...diff.sections.added.map(s => s.id),
      ...diff.sections.removed.map(s => s.id),
      ...diff.sections.modified.map(s => s.id),
    ]),
    routing: new Set([
      ...diff.routing.added.map(r => r.id),
      ...diff.routing.removed.map(r => r.id),
      ...diff.routing.modified.map(r => r.id),
    ]),
  };
}
