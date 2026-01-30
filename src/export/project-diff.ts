/**
 * Project Diff System
 * 
 * Compares different versions of projects to identify changes in streams,
 * clips, routing, and other project elements. Detects merge conflicts when
 * combining changes from multiple contributors.
 */

import type { EventStreamRecord } from '../state/event-store';
import type { ClipRecord } from '../state/clip-registry';

export interface ProjectSnapshot {
  readonly version: string;
  readonly timestamp: number;
  readonly streams: readonly EventStreamRecord[];
  readonly clips: readonly ClipRecord[];
  readonly routing: readonly RouteConnection[];
  readonly metadata?: Record<string, unknown>;
}

export interface RouteConnection {
  readonly id: string;
  readonly sourceId: string;
  readonly targetId: string;
  readonly type: 'audio' | 'midi' | 'modulation';
}

export interface StreamDiff {
  readonly streamId: string;
  readonly changeType: 'added' | 'removed' | 'modified';
  readonly oldStream?: EventStreamRecord;
  readonly newStream?: EventStreamRecord;
  readonly eventChanges?: {
    readonly added: number;
    readonly removed: number;
    readonly modified: number;
  };
}

export interface ClipDiff {
  readonly clipId: string;
  readonly changeType: 'added' | 'removed' | 'modified';
  readonly oldClip?: ClipRecord;
  readonly newClip?: ClipRecord;
  readonly changes?: readonly string[]; // Field names that changed
}

export interface RoutingDiff {
  readonly changeType: 'added' | 'removed' | 'modified';
  readonly oldRoute?: RouteConnection;
  readonly newRoute?: RouteConnection;
}

export interface ProjectDiff {
  readonly fromVersion: string;
  readonly toVersion: string;
  readonly fromTimestamp: number;
  readonly toTimestamp: number;
  readonly streamDiffs: readonly StreamDiff[];
  readonly clipDiffs: readonly ClipDiff[];
  readonly routingDiffs: readonly RoutingDiff[];
  readonly hasConflicts: boolean;
  readonly conflicts: readonly MergeConflict[];
}

export type ConflictType = 'stream-modified' | 'clip-modified' | 'routing-conflict';

export interface MergeConflict {
  readonly id: string;
  readonly type: ConflictType;
  readonly description: string;
  readonly localChange: unknown;
  readonly remoteChange: unknown;
  readonly baseVersion?: unknown;
}

/**
 * Create a snapshot of the current project state
 */
export function createProjectSnapshot(
  streams: readonly EventStreamRecord[],
  clips: readonly ClipRecord[],
  routing: readonly RouteConnection[],
  metadata?: Record<string, unknown>
): ProjectSnapshot {
  const snapshot: ProjectSnapshot = {
    version: '1.0',
    timestamp: Date.now(),
    streams: [...streams],
    clips: [...clips],
    routing: [...routing],
    ...(metadata ? { metadata } : {})
  };
  
  return snapshot;
}

/**
 * Compare two project snapshots and generate a diff
 */
export function diffProjects(
  oldSnapshot: ProjectSnapshot,
  newSnapshot: ProjectSnapshot
): ProjectDiff {
  const streamDiffs = diffStreams(oldSnapshot.streams, newSnapshot.streams);
  const clipDiffs = diffClips(oldSnapshot.clips, newSnapshot.clips);
  const routingDiffs = diffRouting(oldSnapshot.routing, newSnapshot.routing);
  
  // Detect conflicts (for now, we don't have a three-way merge scenario)
  const conflicts: MergeConflict[] = [];
  
  return {
    fromVersion: oldSnapshot.version,
    toVersion: newSnapshot.version,
    fromTimestamp: oldSnapshot.timestamp,
    toTimestamp: newSnapshot.timestamp,
    streamDiffs,
    clipDiffs,
    routingDiffs,
    hasConflicts: conflicts.length > 0,
    conflicts
  };
}

/**
 * Compare streams between two snapshots
 */
function diffStreams(
  oldStreams: readonly EventStreamRecord[],
  newStreams: readonly EventStreamRecord[]
): readonly StreamDiff[] {
  const diffs: StreamDiff[] = [];
  const oldStreamMap = new Map(oldStreams.map(s => [s.id, s]));
  const newStreamMap = new Map(newStreams.map(s => [s.id, s]));
  
  // Find added and modified streams
  for (const newStream of newStreams) {
    const oldStream = oldStreamMap.get(newStream.id);
    
    if (!oldStream) {
      // Stream was added
      diffs.push({
        streamId: newStream.id,
        changeType: 'added',
        newStream
      });
    } else if (!streamsEqual(oldStream, newStream)) {
      // Stream was modified
      const eventChanges = diffStreamEvents(oldStream, newStream);
      diffs.push({
        streamId: newStream.id,
        changeType: 'modified',
        oldStream,
        newStream,
        eventChanges
      });
    }
  }
  
  // Find removed streams
  for (const oldStream of oldStreams) {
    if (!newStreamMap.has(oldStream.id)) {
      diffs.push({
        streamId: oldStream.id,
        changeType: 'removed',
        oldStream
      });
    }
  }
  
  return diffs;
}

/**
 * Compare events between two streams (simplified)
 */
function diffStreamEvents(
  oldStream: EventStreamRecord,
  newStream: EventStreamRecord
): { added: number; removed: number; modified: number } {
  const oldEventIds = new Set(oldStream.events.map(e => e.id));
  const newEventIds = new Set(newStream.events.map(e => e.id));
  
  let added = 0;
  let removed = 0;
  let modified = 0;
  
  // Count added events
  for (const eventId of newEventIds) {
    if (!oldEventIds.has(eventId)) {
      added++;
    }
  }
  
  // Count removed events
  for (const eventId of oldEventIds) {
    if (!newEventIds.has(eventId)) {
      removed++;
    }
  }
  
  // Count modified events (events that exist in both but may have changed)
  // For simplicity, we're not doing deep equality checks here
  const commonIds = new Set([...oldEventIds].filter(id => newEventIds.has(id)));
  modified = commonIds.size;
  
  return { added, removed, modified };
}

/**
 * Compare clips between two snapshots
 */
function diffClips(
  oldClips: readonly ClipRecord[],
  newClips: readonly ClipRecord[]
): readonly ClipDiff[] {
  const diffs: ClipDiff[] = [];
  const oldClipMap = new Map(oldClips.map(c => [c.id, c]));
  const newClipMap = new Map(newClips.map(c => [c.id, c]));
  
  // Find added and modified clips
  for (const newClip of newClips) {
    const oldClip = oldClipMap.get(newClip.id);
    
    if (!oldClip) {
      diffs.push({
        clipId: newClip.id,
        changeType: 'added',
        newClip
      });
    } else if (!clipsEqual(oldClip, newClip)) {
      const changes = getClipChanges(oldClip, newClip);
      diffs.push({
        clipId: newClip.id,
        changeType: 'modified',
        oldClip,
        newClip,
        changes
      });
    }
  }
  
  // Find removed clips
  for (const oldClip of oldClips) {
    if (!newClipMap.has(oldClip.id)) {
      diffs.push({
        clipId: oldClip.id,
        changeType: 'removed',
        oldClip
      });
    }
  }
  
  return diffs;
}

/**
 * Get list of changed fields in a clip
 */
function getClipChanges(
  oldClip: ClipRecord,
  newClip: ClipRecord
): readonly string[] {
  const changes: string[] = [];
  
  if (oldClip.name !== newClip.name) changes.push('name');
  if (oldClip.color !== newClip.color) changes.push('color');
  if (oldClip.streamId !== newClip.streamId) changes.push('streamId');
  if (oldClip.duration !== newClip.duration) changes.push('duration');
  if (oldClip.loop !== newClip.loop) changes.push('loop');
  
  return changes;
}

/**
 * Compare routing between two snapshots
 */
function diffRouting(
  oldRouting: readonly RouteConnection[],
  newRouting: readonly RouteConnection[]
): readonly RoutingDiff[] {
  const diffs: RoutingDiff[] = [];
  const oldRouteMap = new Map(oldRouting.map(r => [r.id, r]));
  const newRouteMap = new Map(newRouting.map(r => [r.id, r]));
  
  // Find added and modified routes
  for (const newRoute of newRouting) {
    const oldRoute = oldRouteMap.get(newRoute.id);
    
    if (!oldRoute) {
      diffs.push({
        changeType: 'added',
        newRoute
      });
    } else if (!routesEqual(oldRoute, newRoute)) {
      diffs.push({
        changeType: 'modified',
        oldRoute,
        newRoute
      });
    }
  }
  
  // Find removed routes
  for (const oldRoute of oldRouting) {
    if (!newRouteMap.has(oldRoute.id)) {
      diffs.push({
        changeType: 'removed',
        oldRoute
      });
    }
  }
  
  return diffs;
}

/**
 * Check if two streams are equal (shallow comparison)
 */
function streamsEqual(a: EventStreamRecord, b: EventStreamRecord): boolean {
  return (
    a.id === b.id &&
    a.name === b.name &&
    a.events.length === b.events.length
  );
}

/**
 * Check if two clips are equal
 */
function clipsEqual(a: ClipRecord, b: ClipRecord): boolean {
  return (
    a.id === b.id &&
    a.name === b.name &&
    a.color === b.color &&
    a.streamId === b.streamId &&
    a.duration === b.duration &&
    a.loop === b.loop
  );
}

/**
 * Check if two routes are equal
 */
function routesEqual(a: RouteConnection, b: RouteConnection): boolean {
  return (
    a.id === b.id &&
    a.sourceId === b.sourceId &&
    a.targetId === b.targetId &&
    a.type === b.type
  );
}

/**
 * Detect merge conflicts between three versions (base, local, remote)
 */
export function detectMergeConflicts(
  baseSnapshot: ProjectSnapshot,
  localSnapshot: ProjectSnapshot,
  remoteSnapshot: ProjectSnapshot
): readonly MergeConflict[] {
  const conflicts: MergeConflict[] = [];
  
  // Find streams modified in both local and remote
  const baseDiff = diffProjects(baseSnapshot, localSnapshot);
  const remoteDiff = diffProjects(baseSnapshot, remoteSnapshot);
  
  // Check for conflicting stream modifications
  for (const localStreamDiff of baseDiff.streamDiffs) {
    if (localStreamDiff.changeType !== 'modified') continue;
    
    const remoteStreamDiff = remoteDiff.streamDiffs.find(
      d => d.streamId === localStreamDiff.streamId && d.changeType === 'modified'
    );
    
    if (remoteStreamDiff) {
      conflicts.push({
        id: `stream-conflict-${localStreamDiff.streamId}`,
        type: 'stream-modified',
        description: `Stream "${localStreamDiff.newStream?.name}" was modified in both versions`,
        localChange: localStreamDiff.newStream,
        remoteChange: remoteStreamDiff.newStream,
        baseVersion: localStreamDiff.oldStream
      });
    }
  }
  
  // Check for conflicting clip modifications
  for (const localClipDiff of baseDiff.clipDiffs) {
    if (localClipDiff.changeType !== 'modified') continue;
    
    const remoteClipDiff = remoteDiff.clipDiffs.find(
      d => d.clipId === localClipDiff.clipId && d.changeType === 'modified'
    );
    
    if (remoteClipDiff) {
      conflicts.push({
        id: `clip-conflict-${localClipDiff.clipId}`,
        type: 'clip-modified',
        description: `Clip "${localClipDiff.newClip?.name}" was modified in both versions`,
        localChange: localClipDiff.newClip,
        remoteChange: remoteClipDiff.newClip,
        baseVersion: localClipDiff.oldClip
      });
    }
  }
  
  return conflicts;
}

/**
 * Generate a summary of the diff
 */
export function generateDiffSummary(diff: ProjectDiff): {
  totalChanges: number;
  streamChanges: { added: number; removed: number; modified: number };
  clipChanges: { added: number; removed: number; modified: number };
  routingChanges: { added: number; removed: number; modified: number };
} {
  const streamChanges = {
    added: diff.streamDiffs.filter(d => d.changeType === 'added').length,
    removed: diff.streamDiffs.filter(d => d.changeType === 'removed').length,
    modified: diff.streamDiffs.filter(d => d.changeType === 'modified').length
  };
  
  const clipChanges = {
    added: diff.clipDiffs.filter(d => d.changeType === 'added').length,
    removed: diff.clipDiffs.filter(d => d.changeType === 'removed').length,
    modified: diff.clipDiffs.filter(d => d.changeType === 'modified').length
  };
  
  const routingChanges = {
    added: diff.routingDiffs.filter(d => d.changeType === 'added').length,
    removed: diff.routingDiffs.filter(d => d.changeType === 'removed').length,
    modified: diff.routingDiffs.filter(d => d.changeType === 'modified').length
  };
  
  const totalChanges = 
    streamChanges.added + streamChanges.removed + streamChanges.modified +
    clipChanges.added + clipChanges.removed + clipChanges.modified +
    routingChanges.added + routingChanges.removed + routingChanges.modified;
  
  return {
    totalChanges,
    streamChanges,
    clipChanges,
    routingChanges
  };
}
