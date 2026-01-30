import { describe, it, expect } from 'vitest';
import {
  createProjectSnapshot,
  diffProjects,
  detectMergeConflicts,
  generateDiffSummary,
  type ProjectSnapshot,
  type EventStreamRecord,
  type ClipRecord,
  type RouteConnection
} from './project-diff';
import type { Event } from '../types/event';
import { asTick, asTickDuration } from '../types/primitives';
import { generateEventId } from '../types/event-id';
import { EventKinds } from '../types/event-kind';

describe('Project Diff', () => {
  // Helper to create test events
  const createTestEvent = (start: number): Event => ({
    id: generateEventId(),
    kind: EventKinds.NOTE,
    start: asTick(start),
    duration: asTickDuration(96),
    payload: { note: 60, velocity: 100 }
  });
  
  // Helper to create test streams
  const createTestStream = (id: string, name: string, eventCount: number): EventStreamRecord => ({
    id,
    name,
    events: Array.from({ length: eventCount }, (_, i) => 
      createTestEvent(i * 96)
    )
  });
  
  // Helper to create test clips
  const createTestClip = (id: string, name: string, streamId: string): ClipRecord => ({
    id,
    name,
    color: '#ff0000',
    streamId,
    duration: asTickDuration(1920),
    loop: true
  });
  
  // Helper to create test routes
  const createTestRoute = (id: string, sourceId: string, targetId: string): RouteConnection => ({
    id,
    sourceId,
    targetId,
    type: 'audio'
  });
  
  describe('createProjectSnapshot', () => {
    it('creates a snapshot with all project data', () => {
      const streams = [createTestStream('stream-1', 'Stream 1', 3)];
      const clips = [createTestClip('clip-1', 'Clip 1', 'stream-1')];
      const routing = [createTestRoute('route-1', 'deck-1', 'deck-2')];
      
      const snapshot = createProjectSnapshot(streams, clips, routing, { foo: 'bar' });
      
      expect(snapshot.version).toBe('1.0');
      expect(snapshot.timestamp).toBeTruthy();
      expect(snapshot.streams).toHaveLength(1);
      expect(snapshot.clips).toHaveLength(1);
      expect(snapshot.routing).toHaveLength(1);
      expect(snapshot.metadata).toEqual({ foo: 'bar' });
    });
  });
  
  describe('diffProjects - stream changes', () => {
    it('detects added streams', () => {
      const oldSnapshot = createProjectSnapshot([], [], []);
      const newSnapshot = createProjectSnapshot(
        [createTestStream('stream-1', 'Stream 1', 2)],
        [],
        []
      );
      
      const diff = diffProjects(oldSnapshot, newSnapshot);
      
      expect(diff.streamDiffs).toHaveLength(1);
      expect(diff.streamDiffs[0].changeType).toBe('added');
      expect(diff.streamDiffs[0].streamId).toBe('stream-1');
      expect(diff.streamDiffs[0].newStream).toBeTruthy();
    });
    
    it('detects removed streams', () => {
      const oldSnapshot = createProjectSnapshot(
        [createTestStream('stream-1', 'Stream 1', 2)],
        [],
        []
      );
      const newSnapshot = createProjectSnapshot([], [], []);
      
      const diff = diffProjects(oldSnapshot, newSnapshot);
      
      expect(diff.streamDiffs).toHaveLength(1);
      expect(diff.streamDiffs[0].changeType).toBe('removed');
      expect(diff.streamDiffs[0].streamId).toBe('stream-1');
      expect(diff.streamDiffs[0].oldStream).toBeTruthy();
    });
    
    it('detects modified streams', () => {
      const oldSnapshot = createProjectSnapshot(
        [createTestStream('stream-1', 'Stream 1', 2)],
        [],
        []
      );
      const newSnapshot = createProjectSnapshot(
        [createTestStream('stream-1', 'Stream 1 Modified', 3)],
        [],
        []
      );
      
      const diff = diffProjects(oldSnapshot, newSnapshot);
      
      expect(diff.streamDiffs).toHaveLength(1);
      expect(diff.streamDiffs[0].changeType).toBe('modified');
      expect(diff.streamDiffs[0].streamId).toBe('stream-1');
      expect(diff.streamDiffs[0].oldStream).toBeTruthy();
      expect(diff.streamDiffs[0].newStream).toBeTruthy();
      expect(diff.streamDiffs[0].eventChanges).toBeTruthy();
    });
    
    it('detects no changes when streams are identical', () => {
      const stream = createTestStream('stream-1', 'Stream 1', 2);
      const oldSnapshot = createProjectSnapshot([stream], [], []);
      const newSnapshot = createProjectSnapshot([stream], [], []);
      
      const diff = diffProjects(oldSnapshot, newSnapshot);
      
      expect(diff.streamDiffs).toHaveLength(0);
    });
  });
  
  describe('diffProjects - clip changes', () => {
    it('detects added clips', () => {
      const oldSnapshot = createProjectSnapshot([], [], []);
      const newSnapshot = createProjectSnapshot(
        [],
        [createTestClip('clip-1', 'Clip 1', 'stream-1')],
        []
      );
      
      const diff = diffProjects(oldSnapshot, newSnapshot);
      
      expect(diff.clipDiffs).toHaveLength(1);
      expect(diff.clipDiffs[0].changeType).toBe('added');
      expect(diff.clipDiffs[0].clipId).toBe('clip-1');
      expect(diff.clipDiffs[0].newClip).toBeTruthy();
    });
    
    it('detects removed clips', () => {
      const oldSnapshot = createProjectSnapshot(
        [],
        [createTestClip('clip-1', 'Clip 1', 'stream-1')],
        []
      );
      const newSnapshot = createProjectSnapshot([], [], []);
      
      const diff = diffProjects(oldSnapshot, newSnapshot);
      
      expect(diff.clipDiffs).toHaveLength(1);
      expect(diff.clipDiffs[0].changeType).toBe('removed');
      expect(diff.clipDiffs[0].clipId).toBe('clip-1');
      expect(diff.clipDiffs[0].oldClip).toBeTruthy();
    });
    
    it('detects modified clips', () => {
      const oldClip = createTestClip('clip-1', 'Clip 1', 'stream-1');
      const newClip = { ...oldClip, name: 'Clip 1 Modified', color: '#00ff00' };
      
      const oldSnapshot = createProjectSnapshot([], [oldClip], []);
      const newSnapshot = createProjectSnapshot([], [newClip], []);
      
      const diff = diffProjects(oldSnapshot, newSnapshot);
      
      expect(diff.clipDiffs).toHaveLength(1);
      expect(diff.clipDiffs[0].changeType).toBe('modified');
      expect(diff.clipDiffs[0].clipId).toBe('clip-1');
      expect(diff.clipDiffs[0].changes).toContain('name');
      expect(diff.clipDiffs[0].changes).toContain('color');
    });
  });
  
  describe('diffProjects - routing changes', () => {
    it('detects added routes', () => {
      const oldSnapshot = createProjectSnapshot([], [], []);
      const newSnapshot = createProjectSnapshot(
        [],
        [],
        [createTestRoute('route-1', 'deck-1', 'deck-2')]
      );
      
      const diff = diffProjects(oldSnapshot, newSnapshot);
      
      expect(diff.routingDiffs).toHaveLength(1);
      expect(diff.routingDiffs[0].changeType).toBe('added');
      expect(diff.routingDiffs[0].newRoute).toBeTruthy();
    });
    
    it('detects removed routes', () => {
      const oldSnapshot = createProjectSnapshot(
        [],
        [],
        [createTestRoute('route-1', 'deck-1', 'deck-2')]
      );
      const newSnapshot = createProjectSnapshot([], [], []);
      
      const diff = diffProjects(oldSnapshot, newSnapshot);
      
      expect(diff.routingDiffs).toHaveLength(1);
      expect(diff.routingDiffs[0].changeType).toBe('removed');
      expect(diff.routingDiffs[0].oldRoute).toBeTruthy();
    });
    
    it('detects modified routes', () => {
      const oldRoute = createTestRoute('route-1', 'deck-1', 'deck-2');
      const newRoute = { ...oldRoute, targetId: 'deck-3' };
      
      const oldSnapshot = createProjectSnapshot([], [], [oldRoute]);
      const newSnapshot = createProjectSnapshot([], [], [newRoute]);
      
      const diff = diffProjects(oldSnapshot, newSnapshot);
      
      expect(diff.routingDiffs).toHaveLength(1);
      expect(diff.routingDiffs[0].changeType).toBe('modified');
      expect(diff.routingDiffs[0].oldRoute).toBeTruthy();
      expect(diff.routingDiffs[0].newRoute).toBeTruthy();
    });
  });
  
  describe('detectMergeConflicts', () => {
    it('detects stream conflicts', () => {
      const baseStream = createTestStream('stream-1', 'Base', 2);
      const localStream = createTestStream('stream-1', 'Local Edit', 3);
      const remoteStream = createTestStream('stream-1', 'Remote Edit', 4);
      
      const baseSnapshot = createProjectSnapshot([baseStream], [], []);
      const localSnapshot = createProjectSnapshot([localStream], [], []);
      const remoteSnapshot = createProjectSnapshot([remoteStream], [], []);
      
      const conflicts = detectMergeConflicts(baseSnapshot, localSnapshot, remoteSnapshot);
      
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe('stream-modified');
      expect(conflicts[0].id).toContain('stream-1');
    });
    
    it('detects clip conflicts', () => {
      const baseClip = createTestClip('clip-1', 'Base', 'stream-1');
      const localClip = { ...baseClip, name: 'Local Edit' };
      const remoteClip = { ...baseClip, name: 'Remote Edit' };
      
      const baseSnapshot = createProjectSnapshot([], [baseClip], []);
      const localSnapshot = createProjectSnapshot([], [localClip], []);
      const remoteSnapshot = createProjectSnapshot([], [remoteClip], []);
      
      const conflicts = detectMergeConflicts(baseSnapshot, localSnapshot, remoteSnapshot);
      
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe('clip-modified');
      expect(conflicts[0].id).toContain('clip-1');
    });
    
    it('detects no conflicts when changes dont overlap', () => {
      const baseSnapshot = createProjectSnapshot(
        [createTestStream('stream-1', 'Base', 2)],
        [],
        []
      );
      
      const localSnapshot = createProjectSnapshot(
        [
          createTestStream('stream-1', 'Base', 2),
          createTestStream('stream-2', 'Local', 1)
        ],
        [],
        []
      );
      
      const remoteSnapshot = createProjectSnapshot(
        [
          createTestStream('stream-1', 'Base', 2),
          createTestStream('stream-3', 'Remote', 1)
        ],
        [],
        []
      );
      
      const conflicts = detectMergeConflicts(baseSnapshot, localSnapshot, remoteSnapshot);
      
      expect(conflicts).toHaveLength(0);
    });
  });
  
  describe('generateDiffSummary', () => {
    it('generates accurate summary', () => {
      const oldSnapshot = createProjectSnapshot(
        [createTestStream('stream-1', 'Stream 1', 2)],
        [createTestClip('clip-1', 'Clip 1', 'stream-1')],
        [createTestRoute('route-1', 'deck-1', 'deck-2')]
      );
      
      const newSnapshot = createProjectSnapshot(
        [
          createTestStream('stream-1', 'Stream 1 Modified', 3), // modified
          createTestStream('stream-2', 'Stream 2', 1) // added
        ],
        [
          createTestClip('clip-2', 'Clip 2', 'stream-2') // added (clip-1 removed)
        ],
        [
          createTestRoute('route-1', 'deck-1', 'deck-3'), // modified
          createTestRoute('route-2', 'deck-2', 'deck-4') // added
        ]
      );
      
      const diff = diffProjects(oldSnapshot, newSnapshot);
      const summary = generateDiffSummary(diff);
      
      expect(summary.streamChanges.added).toBe(1);
      expect(summary.streamChanges.removed).toBe(0);
      expect(summary.streamChanges.modified).toBe(1);
      
      expect(summary.clipChanges.added).toBe(1);
      expect(summary.clipChanges.removed).toBe(1);
      expect(summary.clipChanges.modified).toBe(0);
      
      expect(summary.routingChanges.added).toBe(1);
      expect(summary.routingChanges.removed).toBe(0);
      expect(summary.routingChanges.modified).toBe(1);
      
      expect(summary.totalChanges).toBe(6);
    });
  });
});
