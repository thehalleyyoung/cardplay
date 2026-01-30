/**
 * @file Canonical Diff Model (Step 304)
 * @module gofai/execution/canonical-diff
 *
 * Implements a canonical diff model with stable ordering for event diffs, container diffs,
 * card graph diffs, and parameter diffs.
 *
 * This module addresses Step 304 from gofai_goalB.md:
 * "Define a canonical diff model: event diffs, container diffs, card graph diffs, param diffs,
 *  each with stable ordering."
 *
 * Design principles:
 * - Diffs are stable: repeated diffing produces identical output
 * - Diffs are minimal: only changed entities are reported
 * - Diffs are hierarchical: summary → category → entity → field
 * - Diffs are human-readable: include descriptions and summaries
 * - Diffs are machine-verifiable: typed structure for constraint checking
 *
 * Integration:
 * - Works with edit-package.ts for storing diffs
 * - Works with transactional-execution.ts for generating diffs
 * - Works with constraint checkers for validation
 * - Works with UI for rendering before/after views
 */

import type { CardPlayId } from '../../canon/cardplay-id';

/**
 * Branded ID types for diff tracking.
 */
export type EventId = string & { readonly __brand: 'EventId' };
export type TrackId = string & { readonly __brand: 'TrackId' };
export type CardId = string & { readonly __brand: 'CardId' };
export type SectionId = string & { readonly __brand: 'SectionId' };
export type RouteId = string & { readonly __brand: 'RouteId' };
export type ParamId = string & { readonly __brand: 'ParamId' };

/**
 * Change operation type.
 */
export type ChangeOp = 'add' | 'remove' | 'modify' | 'move' | 'replace';

/**
 * Base change record.
 */
export interface BaseChange<T = unknown> {
  readonly op: ChangeOp;
  readonly before?: T;
  readonly after?: T;
  readonly description?: string;
}

// ============================================================================
// Event Diffs
// ============================================================================

/**
 * Event field that was changed.
 */
export type EventField =
  | 'start' // Timing (onset)
  | 'duration' // Length
  | 'pitch' // MIDI pitch
  | 'velocity' // Loudness
  | 'tags' // Metadata tags
  | 'role' // Musical role
  | 'other'; // Other payload fields

/**
 * Event field change.
 */
export interface EventFieldChange extends BaseChange {
  readonly field: EventField;
  readonly path?: string; // For nested fields
}

/**
 * Event change record.
 */
export interface EventChange {
  readonly eventId: EventId;
  readonly op: ChangeOp;
  readonly trackId?: TrackId;
  readonly sectionId?: SectionId;
  readonly fields?: readonly EventFieldChange[];
  readonly summary: string;
}

/**
 * Event diff summary by category.
 */
export interface EventDiffSummary {
  readonly added: number;
  readonly removed: number;
  readonly modified: number;
  readonly moved: number;
  readonly byField: ReadonlyMap<EventField, number>;
  readonly byTrack: ReadonlyMap<TrackId, number>;
  readonly bySection: ReadonlyMap<SectionId, number>;
}

/**
 * Event diff.
 */
export interface EventDiff {
  readonly changes: readonly EventChange[];
  readonly summary: EventDiffSummary;
}

/**
 * Create event diff from before/after event sets.
 */
export function diffEvents(
  before: readonly EventRecord[],
  after: readonly EventRecord[]
): EventDiff {
  const beforeMap = new Map(before.map((e) => [e.id, e]));
  const afterMap = new Map(after.map((e) => [e.id, e]));

  const changes: EventChange[] = [];

  // Find added events
  for (const [id, event] of Array.from(afterMap)) {
    if (!beforeMap.has(id)) {
      changes.push({
        eventId: id,
        op: 'add',
        trackId: event.trackId,
        sectionId: event.sectionId,
        summary: `Added event ${id}`,
      });
    }
  }

  // Find removed events
  for (const [id, event] of Array.from(beforeMap)) {
    if (!afterMap.has(id)) {
      changes.push({
        eventId: id,
        op: 'remove',
        trackId: event.trackId,
        sectionId: event.sectionId,
        summary: `Removed event ${id}`,
      });
    }
  }

  // Find modified events
  for (const [id, beforeEvent] of Array.from(beforeMap)) {
    const afterEvent = afterMap.get(id);
    if (afterEvent) {
      const fieldChanges = diffEventFields(beforeEvent, afterEvent);
      if (fieldChanges.length > 0) {
        changes.push({
          eventId: id,
          op: 'modify',
          trackId: afterEvent.trackId,
          sectionId: afterEvent.sectionId,
          fields: fieldChanges,
          summary: `Modified event ${id}: ${fieldChanges.map((f) => f.field).join(', ')}`,
        });
      }
    }
  }

  // Sort for stable ordering
  changes.sort((a, b) => {
    // Sort by track, then section, then event ID
    const trackCmp = (a.trackId || '').localeCompare(b.trackId || '');
    if (trackCmp !== 0) return trackCmp;

    const sectionCmp = (a.sectionId || '').localeCompare(b.sectionId || '');
    if (sectionCmp !== 0) return sectionCmp;

    return a.eventId.localeCompare(b.eventId);
  });

  const summary = summarizeEventChanges(changes);

  return { changes, summary };
}

/**
 * Diff individual event fields.
 */
function diffEventFields(before: EventRecord, after: EventRecord): EventFieldChange[] {
  const changes: EventFieldChange[] = [];

  if (before.start !== after.start) {
    changes.push({
      op: 'modify',
      field: 'start',
      before: before.start,
      after: after.start,
      description: `Timing: ${before.start} → ${after.start}`,
    });
  }

  if (before.duration !== after.duration) {
    changes.push({
      op: 'modify',
      field: 'duration',
      before: before.duration,
      after: after.duration,
      description: `Duration: ${before.duration} → ${after.duration}`,
    });
  }

  if (before.pitch !== after.pitch) {
    changes.push({
      op: 'modify',
      field: 'pitch',
      before: before.pitch,
      after: after.pitch,
      description: `Pitch: ${before.pitch} → ${after.pitch}`,
    });
  }

  if (before.velocity !== after.velocity) {
    changes.push({
      op: 'modify',
      field: 'velocity',
      before: before.velocity,
      after: after.velocity,
      description: `Velocity: ${before.velocity} → ${after.velocity}`,
    });
  }

  // Tags (array comparison)
  if (!arraysEqual(before.tags || [], after.tags || [])) {
    changes.push({
      op: 'modify',
      field: 'tags',
      before: before.tags,
      after: after.tags,
      description: `Tags changed`,
    });
  }

  if (before.role !== after.role) {
    changes.push({
      op: 'modify',
      field: 'role',
      before: before.role,
      after: after.role,
      description: `Role: ${before.role} → ${after.role}`,
    });
  }

  return changes;
}

/**
 * Summarize event changes.
 */
function summarizeEventChanges(changes: readonly EventChange[]): EventDiffSummary {
  let added = 0;
  let removed = 0;
  let modified = 0;
  let moved = 0;

  const byField = new Map<EventField, number>();
  const byTrack = new Map<TrackId, number>();
  const bySection = new Map<SectionId, number>();

  for (const change of changes) {
    switch (change.op) {
      case 'add':
        added++;
        break;
      case 'remove':
        removed++;
        break;
      case 'modify':
        modified++;
        break;
      case 'move':
        moved++;
        break;
    }

    if (change.fields) {
      for (const field of change.fields) {
        byField.set(field.field, (byField.get(field.field) || 0) + 1);
      }
    }

    if (change.trackId) {
      byTrack.set(change.trackId, (byTrack.get(change.trackId) || 0) + 1);
    }

    if (change.sectionId) {
      bySection.set(change.sectionId, (bySection.get(change.sectionId) || 0) + 1);
    }
  }

  return { added, removed, modified, moved, byField, byTrack, bySection };
}

// ============================================================================
// Card Graph Diffs
// ============================================================================

/**
 * Card field that was changed.
 */
export type CardField = 'position' | 'enabled' | 'params' | 'routing' | 'metadata';

/**
 * Card change record.
 */
export interface CardChange {
  readonly cardId: CardId;
  readonly op: ChangeOp;
  readonly trackId?: TrackId;
  readonly cardType?: CardPlayId;
  readonly field?: CardField;
  readonly summary: string;
}

/**
 * Card parameter change.
 */
export interface CardParamChange extends BaseChange {
  readonly cardId: CardId;
  readonly paramId: ParamId;
  readonly paramName: string;
  readonly description: string;
}

/**
 * Card graph diff summary.
 */
export interface CardGraphDiffSummary {
  readonly cardsAdded: number;
  readonly cardsRemoved: number;
  readonly cardsModified: number;
  readonly paramChanges: number;
  readonly byTrack: ReadonlyMap<TrackId, number>;
}

/**
 * Card graph diff.
 */
export interface CardGraphDiff {
  readonly cardChanges: readonly CardChange[];
  readonly paramChanges: readonly CardParamChange[];
  readonly summary: CardGraphDiffSummary;
}

/**
 * Create card graph diff.
 */
export function diffCardGraph(before: readonly CardRecord[], after: readonly CardRecord[]): CardGraphDiff {
  const beforeMap = new Map(before.map((c) => [c.id, c]));
  const afterMap = new Map(after.map((c) => [c.id, c]));

  const cardChanges: CardChange[] = [];
  const paramChanges: CardParamChange[] = [];

  // Find added cards
  for (const [id, card] of Array.from(afterMap)) {
    if (!beforeMap.has(id)) {
      cardChanges.push({
        cardId: id,
        op: 'add',
        trackId: card.trackId,
        cardType: card.type,
        summary: `Added card ${card.name || id}`,
      });
    }
  }

  // Find removed cards
  for (const [id, card] of Array.from(beforeMap)) {
    if (!afterMap.has(id)) {
      cardChanges.push({
        cardId: id,
        op: 'remove',
        trackId: card.trackId,
        cardType: card.type,
        summary: `Removed card ${card.name || id}`,
      });
    }
  }

  // Find modified cards
  for (const [id, beforeCard] of Array.from(beforeMap)) {
    const afterCard = afterMap.get(id);
    if (afterCard) {
      // Check position
      if (beforeCard.position !== afterCard.position) {
        cardChanges.push({
          cardId: id,
          op: 'modify',
          trackId: afterCard.trackId,
          field: 'position',
          summary: `Moved card ${afterCard.name || id}`,
        });
      }

      // Check enabled
      if (beforeCard.enabled !== afterCard.enabled) {
        cardChanges.push({
          cardId: id,
          op: 'modify',
          trackId: afterCard.trackId,
          field: 'enabled',
          summary: `${afterCard.enabled ? 'Enabled' : 'Disabled'} card ${afterCard.name || id}`,
        });
      }

      // Check params
      const paramDiffs = diffCardParams(id, beforeCard, afterCard);
      paramChanges.push(...paramDiffs);
    }
  }

  // Sort for stable ordering
  cardChanges.sort((a, b) => {
    const trackCmp = (a.trackId || '').localeCompare(b.trackId || '');
    if (trackCmp !== 0) return trackCmp;
    return a.cardId.localeCompare(b.cardId);
  });

  paramChanges.sort((a, b) => {
    const cardCmp = a.cardId.localeCompare(b.cardId);
    if (cardCmp !== 0) return cardCmp;
    return a.paramId.localeCompare(b.paramId);
  });

  const summary = summarizeCardGraphChanges(cardChanges, paramChanges);

  return { cardChanges, paramChanges, summary };
}

/**
 * Diff card parameters.
 */
function diffCardParams(cardId: CardId, before: CardRecord, after: CardRecord): CardParamChange[] {
  const changes: CardParamChange[] = [];

  const allParamIds = new Set([
    ...Object.keys(before.params || {}),
    ...Object.keys(after.params || {}),
  ]);

  for (const paramId of Array.from(allParamIds)) {
    const beforeVal = before.params?.[paramId];
    const afterVal = after.params?.[paramId];

    if (beforeVal !== afterVal) {
      changes.push({
        cardId,
        paramId: paramId as ParamId,
        paramName: paramId,
        op: beforeVal === undefined ? 'add' : afterVal === undefined ? 'remove' : 'modify',
        before: beforeVal,
        after: afterVal,
        description: `${paramId}: ${formatValue(beforeVal)} → ${formatValue(afterVal)}`,
      });
    }
  }

  return changes;
}

/**
 * Summarize card graph changes.
 */
function summarizeCardGraphChanges(
  cardChanges: readonly CardChange[],
  paramChanges: readonly CardParamChange[]
): CardGraphDiffSummary {
  let cardsAdded = 0;
  let cardsRemoved = 0;
  let cardsModified = 0;

  const byTrack = new Map<TrackId, number>();

  for (const change of cardChanges) {
    switch (change.op) {
      case 'add':
        cardsAdded++;
        break;
      case 'remove':
        cardsRemoved++;
        break;
      case 'modify':
        cardsModified++;
        break;
    }

    if (change.trackId) {
      byTrack.set(change.trackId, (byTrack.get(change.trackId) || 0) + 1);
    }
  }

  return {
    cardsAdded,
    cardsRemoved,
    cardsModified,
    paramChanges: paramChanges.length,
    byTrack,
  };
}

// ============================================================================
// Track and Container Diffs
// ============================================================================

/**
 * Track change record.
 */
export interface TrackChange {
  readonly trackId: TrackId;
  readonly op: ChangeOp;
  readonly name?: string;
  readonly field?: 'name' | 'enabled' | 'solo' | 'mute' | 'volume' | 'pan';
  readonly before?: unknown;
  readonly after?: unknown;
  readonly summary: string;
}

/**
 * Track diff.
 */
export interface TrackDiff {
  readonly changes: readonly TrackChange[];
  readonly summary: {
    readonly added: number;
    readonly removed: number;
    readonly modified: number;
  };
}

/**
 * Create track diff.
 */
export function diffTracks(before: readonly TrackRecord[], after: readonly TrackRecord[]): TrackDiff {
  const beforeMap = new Map(before.map((t) => [t.id, t]));
  const afterMap = new Map(after.map((t) => [t.id, t]));

  const changes: TrackChange[] = [];

  // Find added tracks
  for (const [id, track] of Array.from(afterMap)) {
    if (!beforeMap.has(id)) {
      changes.push({
        trackId: id,
        op: 'add',
        name: track.name,
        summary: `Added track "${track.name}"`,
      });
    }
  }

  // Find removed tracks
  for (const [id, track] of Array.from(beforeMap)) {
    if (!afterMap.has(id)) {
      changes.push({
        trackId: id,
        op: 'remove',
        name: track.name,
        summary: `Removed track "${track.name}"`,
      });
    }
  }

  // Find modified tracks
  for (const [id, beforeTrack] of Array.from(beforeMap)) {
    const afterTrack = afterMap.get(id);
    if (afterTrack) {
      if (beforeTrack.name !== afterTrack.name) {
        changes.push({
          trackId: id,
          op: 'modify',
          field: 'name',
          before: beforeTrack.name,
          after: afterTrack.name,
          summary: `Renamed track "${beforeTrack.name}" → "${afterTrack.name}"`,
        });
      }

      if (beforeTrack.enabled !== afterTrack.enabled) {
        changes.push({
          trackId: id,
          op: 'modify',
          field: 'enabled',
          before: beforeTrack.enabled,
          after: afterTrack.enabled,
          summary: `${afterTrack.enabled ? 'Enabled' : 'Disabled'} track "${afterTrack.name}"`,
        });
      }

      if (beforeTrack.mute !== afterTrack.mute) {
        changes.push({
          trackId: id,
          op: 'modify',
          field: 'mute',
          before: beforeTrack.mute,
          after: afterTrack.mute,
          summary: `${afterTrack.mute ? 'Muted' : 'Unmuted'} track "${afterTrack.name}"`,
        });
      }

      if (beforeTrack.solo !== afterTrack.solo) {
        changes.push({
          trackId: id,
          op: 'modify',
          field: 'solo',
          before: beforeTrack.solo,
          after: afterTrack.solo,
          summary: `${afterTrack.solo ? 'Soloed' : 'Unsoloed'} track "${afterTrack.name}"`,
        });
      }
    }
  }

  // Sort for stable ordering
  changes.sort((a, b) => a.trackId.localeCompare(b.trackId));

  const added = changes.filter((c) => c.op === 'add').length;
  const removed = changes.filter((c) => c.op === 'remove').length;
  const modified = changes.filter((c) => c.op === 'modify').length;

  return {
    changes,
    summary: { added, removed, modified },
  };
}

// ============================================================================
// Section and Structure Diffs
// ============================================================================

/**
 * Section change record.
 */
export interface SectionChange {
  readonly sectionId: SectionId;
  readonly op: ChangeOp;
  readonly name?: string;
  readonly field?: 'name' | 'start' | 'end' | 'label';
  readonly before?: unknown;
  readonly after?: unknown;
  readonly summary: string;
}

/**
 * Section diff.
 */
export interface SectionDiff {
  readonly changes: readonly SectionChange[];
  readonly summary: {
    readonly added: number;
    readonly removed: number;
    readonly modified: number;
  };
}

/**
 * Create section diff.
 */
export function diffSections(
  before: readonly SectionRecord[],
  after: readonly SectionRecord[]
): SectionDiff {
  const beforeMap = new Map(before.map((s) => [s.id, s]));
  const afterMap = new Map(after.map((s) => [s.id, s]));

  const changes: SectionChange[] = [];

  // Find added sections
  for (const [id, section] of Array.from(afterMap)) {
    if (!beforeMap.has(id)) {
      changes.push({
        sectionId: id,
        op: 'add',
        name: section.name,
        summary: `Added section "${section.name}"`,
      });
    }
  }

  // Find removed sections
  for (const [id, section] of Array.from(beforeMap)) {
    if (!afterMap.has(id)) {
      changes.push({
        sectionId: id,
        op: 'remove',
        name: section.name,
        summary: `Removed section "${section.name}"`,
      });
    }
  }

  // Find modified sections
  for (const [id, beforeSection] of Array.from(beforeMap)) {
    const afterSection = afterMap.get(id);
    if (afterSection) {
      if (beforeSection.name !== afterSection.name) {
        changes.push({
          sectionId: id,
          op: 'modify',
          field: 'name',
          before: beforeSection.name,
          after: afterSection.name,
          summary: `Renamed section "${beforeSection.name}" → "${afterSection.name}"`,
        });
      }

      if (beforeSection.start !== afterSection.start || beforeSection.end !== afterSection.end) {
        changes.push({
          sectionId: id,
          op: 'modify',
          field: 'start',
          before: { start: beforeSection.start, end: beforeSection.end },
          after: { start: afterSection.start, end: afterSection.end },
          summary: `Resized section "${afterSection.name}"`,
        });
      }
    }
  }

  // Sort for stable ordering (by start position)
  changes.sort((a, b) => {
    const aSection = afterMap.get(a.sectionId) || beforeMap.get(a.sectionId);
    const bSection = afterMap.get(b.sectionId) || beforeMap.get(b.sectionId);
    if (aSection && bSection) {
      return aSection.start - bSection.start;
    }
    return a.sectionId.localeCompare(b.sectionId);
  });

  const added = changes.filter((c) => c.op === 'add').length;
  const removed = changes.filter((c) => c.op === 'remove').length;
  const modified = changes.filter((c) => c.op === 'modify').length;

  return {
    changes,
    summary: { added, removed, modified },
  };
}

// ============================================================================
// Routing Diffs
// ============================================================================

/**
 * Routing change record.
 */
export interface RoutingChange {
  readonly routeId?: RouteId;
  readonly op: ChangeOp;
  readonly sourceId?: string;
  readonly targetId?: string;
  readonly summary: string;
}

/**
 * Routing diff.
 */
export interface RoutingDiff {
  readonly changes: readonly RoutingChange[];
  readonly summary: {
    readonly added: number;
    readonly removed: number;
    readonly modified: number;
  };
}

/**
 * Create routing diff.
 */
export function diffRouting(
  before: readonly RouteRecord[],
  after: readonly RouteRecord[]
): RoutingDiff {
  const beforeSet = new Set(before.map((r) => `${r.source}->${r.target}`));
  const afterSet = new Set(after.map((r) => `${r.source}->${r.target}`));

  const changes: RoutingChange[] = [];

  // Find added routes
  for (const route of after) {
    const key = `${route.source}->${route.target}`;
    if (!beforeSet.has(key)) {
      changes.push({
        op: 'add',
        sourceId: route.source,
        targetId: route.target,
        summary: `Connected ${route.source} → ${route.target}`,
      });
    }
  }

  // Find removed routes
  for (const route of before) {
    const key = `${route.source}->${route.target}`;
    if (!afterSet.has(key)) {
      changes.push({
        op: 'remove',
        sourceId: route.source,
        targetId: route.target,
        summary: `Disconnected ${route.source} → ${route.target}`,
      });
    }
  }

  // Sort for stable ordering
  changes.sort((a, b) => {
    const aKey = `${a.sourceId}->${a.targetId}`;
    const bKey = `${b.sourceId}->${b.targetId}`;
    return aKey.localeCompare(bKey);
  });

  const added = changes.filter((c) => c.op === 'add').length;
  const removed = changes.filter((c) => c.op === 'remove').length;
  const modified = changes.filter((c) => c.op === 'modify').length;

  return {
    changes,
    summary: { added, removed, modified },
  };
}

// ============================================================================
// Unified Project Diff
// ============================================================================

/**
 * Complete project diff.
 */
export interface ProjectDiff {
  readonly events: EventDiff;
  readonly cardGraph: CardGraphDiff;
  readonly tracks: TrackDiff;
  readonly sections: SectionDiff;
  readonly routing: RoutingDiff;
  readonly timestamp: Date;
}

/**
 * Project state snapshot for diffing.
 */
export interface ProjectSnapshot {
  readonly events: readonly EventRecord[];
  readonly cards: readonly CardRecord[];
  readonly tracks: readonly TrackRecord[];
  readonly sections: readonly SectionRecord[];
  readonly routes: readonly RouteRecord[];
}

/**
 * Create complete project diff.
 */
export function diffProject(before: ProjectSnapshot, after: ProjectSnapshot): ProjectDiff {
  return {
    events: diffEvents(before.events, after.events),
    cardGraph: diffCardGraph(before.cards, after.cards),
    tracks: diffTracks(before.tracks, after.tracks),
    sections: diffSections(before.sections, after.sections),
    routing: diffRouting(before.routes, after.routes),
    timestamp: new Date(),
  };
}

/**
 * Check if diff is empty (no changes).
 */
export function isDiffEmpty(diff: ProjectDiff): boolean {
  return (
    diff.events.changes.length === 0 &&
    diff.cardGraph.cardChanges.length === 0 &&
    diff.cardGraph.paramChanges.length === 0 &&
    diff.tracks.changes.length === 0 &&
    diff.sections.changes.length === 0 &&
    diff.routing.changes.length === 0
  );
}

/**
 * Format project diff as human-readable summary.
 */
export function formatProjectDiff(diff: ProjectDiff): string {
  const parts: string[] = [];

  // Events
  if (diff.events.changes.length > 0) {
    const { added, removed, modified } = diff.events.summary;
    const eventParts: string[] = [];
    if (added > 0) eventParts.push(`${added} added`);
    if (removed > 0) eventParts.push(`${removed} removed`);
    if (modified > 0) eventParts.push(`${modified} modified`);
    parts.push(`Events: ${eventParts.join(', ')}`);
  }

  // Cards
  if (diff.cardGraph.cardChanges.length > 0 || diff.cardGraph.paramChanges.length > 0) {
    const { cardsAdded, cardsRemoved, cardsModified, paramChanges } = diff.cardGraph.summary;
    const cardParts: string[] = [];
    if (cardsAdded > 0) cardParts.push(`${cardsAdded} cards added`);
    if (cardsRemoved > 0) cardParts.push(`${cardsRemoved} cards removed`);
    if (cardsModified > 0) cardParts.push(`${cardsModified} cards modified`);
    if (paramChanges > 0) cardParts.push(`${paramChanges} params changed`);
    parts.push(`Cards: ${cardParts.join(', ')}`);
  }

  // Tracks
  if (diff.tracks.changes.length > 0) {
    const { added, removed, modified } = diff.tracks.summary;
    const trackParts: string[] = [];
    if (added > 0) trackParts.push(`${added} added`);
    if (removed > 0) trackParts.push(`${removed} removed`);
    if (modified > 0) trackParts.push(`${modified} modified`);
    parts.push(`Tracks: ${trackParts.join(', ')}`);
  }

  // Sections
  if (diff.sections.changes.length > 0) {
    const { added, removed, modified } = diff.sections.summary;
    const sectionParts: string[] = [];
    if (added > 0) sectionParts.push(`${added} added`);
    if (removed > 0) sectionParts.push(`${removed} removed`);
    if (modified > 0) sectionParts.push(`${modified} modified`);
    parts.push(`Sections: ${sectionParts.join(', ')}`);
  }

  // Routing
  if (diff.routing.changes.length > 0) {
    const { added, removed } = diff.routing.summary;
    const routingParts: string[] = [];
    if (added > 0) routingParts.push(`${added} connected`);
    if (removed > 0) routingParts.push(`${removed} disconnected`);
    parts.push(`Routing: ${routingParts.join(', ')}`);
  }

  return parts.length > 0 ? parts.join(' | ') : 'No changes';
}

// ============================================================================
// Helper Types and Utilities
// ============================================================================

/**
 * Event record for diffing.
 */
export interface EventRecord {
  readonly id: EventId;
  readonly trackId?: TrackId;
  readonly sectionId?: SectionId;
  readonly start: number;
  readonly duration: number;
  readonly pitch?: number;
  readonly velocity?: number;
  readonly tags?: readonly string[];
  readonly role?: string;
}

/**
 * Card record for diffing.
 */
export interface CardRecord {
  readonly id: CardId;
  readonly trackId?: TrackId;
  readonly type: CardPlayId;
  readonly name?: string;
  readonly position: number;
  readonly enabled: boolean;
  readonly params?: Record<string, unknown>;
}

/**
 * Track record for diffing.
 */
export interface TrackRecord {
  readonly id: TrackId;
  readonly name: string;
  readonly enabled: boolean;
  readonly mute: boolean;
  readonly solo: boolean;
}

/**
 * Section record for diffing.
 */
export interface SectionRecord {
  readonly id: SectionId;
  readonly name: string;
  readonly start: number;
  readonly end: number;
}

/**
 * Route record for diffing.
 */
export interface RouteRecord {
  readonly source: string;
  readonly target: string;
}

/**
 * Array equality check.
 */
function arraysEqual<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Format value for display.
 */
function formatValue(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'number') return value.toFixed(2);
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'boolean') return value.toString();
  if (Array.isArray(value)) return `[${value.length} items]`;
  return JSON.stringify(value);
}

/**
 * Serialize diff to JSON.
 */
export function serializeProjectDiff(diff: ProjectDiff): string {
  return JSON.stringify(diff, null, 2);
}

/**
 * Deserialize diff from JSON.
 */
export function deserializeProjectDiff(json: string): ProjectDiff {
  const parsed = JSON.parse(json);
  return {
    ...parsed,
    timestamp: new Date(parsed.timestamp),
  };
}
