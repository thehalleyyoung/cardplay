/**
 * @fileoverview Collaboration Workflow Integration Tests
 * 
 * Documents end-to-end collaboration workflows including export/import, project diff,
 * comments, and collaboration metadata.
 * 
 * NOTE: These are currently documentation tests showing the expected workflow.
 * They test the individual systems (export, import, diff, comments, metadata) which
 * all have their own passing test suites. Full integration pending unified API.
 * 
 * @module @cardplay/export/collaboration-workflow.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  exportProject,
  importProject,
  type ProjectArchive,
  type ImportConflictResolution
} from './project-exchange';
import {
  addContributor,
  addChangelogEntry,
  getContributors,
  getChangelog,
  type CollaborationMetadata,
  type Contributor
} from './collaboration-metadata';
import {
  diffProjects,
  detectMergeConflicts,
  type ProjectDiff
} from './project-diff';
import {
  addComment,
  replyToComment,
  resolveComment,
  getComments,
  type Comment
} from './comments';

describe('Collaboration Workflow Integration', () => {
  let baseProjectMetadata: CollaborationMetadata;

  beforeEach(() => {
    baseProjectMetadata = {
      contributors: [],
      changelog: []
    };
  });

  // ========================================================================
  // EXPORT/IMPORT WORKFLOW
  // ========================================================================

  describe('Export/Import Workflow', () => {
    it('exports project with collaboration metadata', async () => {
      // Add contributors
      const metadata = addContributor(baseProjectMetadata, {
        id: 'user1',
        name: 'Alice',
        email: 'alice@example.com',
        role: 'composer',
        joinedAt: Date.now()
      });

      const metadataWithChangelog = addChangelogEntry(metadata, {
        id: 'change1',
        timestamp: Date.now(),
        contributorId: 'user1',
        action: 'create-stream',
        description: 'Created melody stream'
      });

      // Export with metadata
      const archive = await exportProject({
        streams: [],
        clips: [],
        routingGraph: { nodes: [], edges: [] },
        boardState: { activeBoard: 'notation-manual' },
        activeContext: { activeStreamId: null, activeClipId: null },
        metadata: { name: 'Collab Project' },
        collaborationMetadata: metadataWithChangelog
      });

      expect(archive.metadata.name).toBe('Collab Project');
      expect(archive.collaborationMetadata).toBeDefined();
      expect(archive.collaborationMetadata!.contributors).toHaveLength(1);
      expect(archive.collaborationMetadata!.changelog).toHaveLength(1);
    });

    it('imports project and preserves collaboration metadata', async () => {
      const archive: ProjectArchive = {
        version: '1.0.0',
        timestamp: Date.now(),
        metadata: { name: 'Imported Project' },
        streams: [],
        clips: [],
        routingGraph: { nodes: [], edges: [] },
        boardState: { activeBoard: 'notation-manual' },
        activeContext: { activeStreamId: null, activeClipId: null },
        collaborationMetadata: {
          contributors: [{
            id: 'user1',
            name: 'Bob',
            email: 'bob@example.com',
            role: 'producer',
            joinedAt: Date.now()
          }],
          changelog: [{
            id: 'change1',
            timestamp: Date.now(),
            contributorId: 'user1',
            action: 'create-clip',
            description: 'Created drum loop'
          }]
        }
      };

      const result = await importProject(archive, {
        conflictResolution: 'rename'
      });

      expect(result.success).toBe(true);
      expect(result.project.metadata.name).toBe('Imported Project');
      expect(result.project.collaborationMetadata).toBeDefined();
      expect(result.project.collaborationMetadata!.contributors).toHaveLength(1);
    });

    it('merges collaboration metadata from multiple contributors', async () => {
      // Original project
      const originalMetadata = addContributor(baseProjectMetadata, {
        id: 'user1',
        name: 'Alice',
        email: 'alice@example.com',
        role: 'composer',
        joinedAt: Date.now()
      });

      // Exported project from another contributor
      const importedMetadata = addContributor(baseProjectMetadata, {
        id: 'user2',
        name: 'Bob',
        email: 'bob@example.com',
        role: 'mixer',
        joinedAt: Date.now()
      });

      // Merge contributors
      const merged: CollaborationMetadata = {
        contributors: [
          ...originalMetadata.contributors,
          ...importedMetadata.contributors
        ],
        changelog: [
          ...originalMetadata.changelog,
          ...importedMetadata.changelog
        ]
      };

      expect(merged.contributors).toHaveLength(2);
      expect(merged.contributors.find(c => c.name === 'Alice')).toBeDefined();
      expect(merged.contributors.find(c => c.name === 'Bob')).toBeDefined();
    });
  });

  // ========================================================================
  // PROJECT DIFF WORKFLOW
  // ========================================================================

  describe('Project Diff Workflow', () => {
    it('detects changes between project versions', () => {
      const baseProject = {
        streams: [{ id: 'stream1', name: 'Melody', events: [] }],
        clips: [{ id: 'clip1', name: 'Intro', streamId: 'stream1', duration: 480 }]
      };

      const modifiedProject = {
        streams: [
          { id: 'stream1', name: 'Melody', events: [{ id: 'event1', kind: 'note' as const }] }, // Added event
          { id: 'stream2', name: 'Harmony', events: [] } // Added stream
        ],
        clips: [{ id: 'clip1', name: 'Intro', streamId: 'stream1', duration: 480 }]
      };

      const diff = diffProjects(baseProject as any, modifiedProject as any);

      const addedStreams = diff.streamDiffs.filter(d => d.changeType === 'added');
      const modifiedStreams = diff.streamDiffs.filter(d => d.changeType === 'modified');
      
      expect(addedStreams).toHaveLength(1);
      expect(addedStreams[0].streamId).toBe('stream2');
      expect(modifiedStreams).toHaveLength(1);
      expect(modifiedStreams[0].streamId).toBe('stream1');
    });

    it('detects merge conflicts when same elements modified', () => {
      const base = {
        streams: [{ id: 'stream1', name: 'Original', events: [] }]
      };

      const version1 = {
        streams: [{ id: 'stream1', name: 'Version 1', events: [{ id: 'e1' }] }]
      };

      const version2 = {
        streams: [{ id: 'stream1', name: 'Version 2', events: [{ id: 'e2' }] }]
      };

      const conflicts = detectMergeConflicts(
        base as any,
        version1 as any,
        version2 as any
      );

      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].type).toBe('stream-modified');
      expect(conflicts[0].id).toContain('stream1');
    });
  });

  // ========================================================================
  // COMMENTS & ANNOTATIONS WORKFLOW
  // ========================================================================

  describe('Comments Workflow', () => {
    it('adds comments to project elements', () => {
      const comments: Comment[] = [];

      // Add comment to clip
      const comment1 = addComment(comments, {
        author: 'Alice',
        content: 'This clip needs more energy',
        attachmentType: 'clip',
        attachmentId: 'clip1'
      });

      expect(comment1).toHaveLength(1);
      expect(comment1[0].content).toBe('This clip needs more energy');
      expect(comment1[0].attachmentType).toBe('clip');
    });

    it('supports comment threading', () => {
      let comments: Comment[] = [];

      // Original comment
      comments = addComment(comments, {
        author: 'Alice',
        content: 'Main feedback',
        attachmentType: 'clip',
        attachmentId: 'clip1'
      });

      const originalId = comments[0].id;

      // Reply to comment
      comments = replyToComment(comments, originalId, {
        author: 'Bob',
        content: 'I agree, let me fix it'
      });

      expect(comments).toHaveLength(2);
      expect(comments[1].parentId).toBe(originalId);
      expect(comments[1].content).toBe('I agree, let me fix it');
    });

    it('marks comments as resolved', () => {
      let comments: Comment[] = [];

      comments = addComment(comments, {
        author: 'Alice',
        content: 'Fix needed',
        attachmentType: 'clip',
        attachmentId: 'clip1'
      });

      const commentId = comments[0].id;
      comments = resolveComment(comments, commentId, 'Bob');

      expect(comments[0].resolved).toBe(true);
      expect(comments[0].resolvedBy).toBe('Bob');
      expect(comments[0].resolvedAt).toBeDefined();
    });

    it('filters comments by attachment', () => {
      let comments: Comment[] = [];

      comments = addComment(comments, {
        author: 'Alice',
        content: 'Comment on clip1',
        attachmentType: 'clip',
        attachmentId: 'clip1'
      });

      comments = addComment(comments, {
        author: 'Bob',
        content: 'Comment on stream1',
        attachmentType: 'stream',
        attachmentId: 'stream1'
      });

      const clipComments = getComments(comments, { attachmentId: 'clip1' });
      expect(clipComments).toHaveLength(1);
      expect(clipComments[0].attachmentId).toBe('clip1');
    });
  });

  // ========================================================================
  // END-TO-END COLLABORATION SCENARIO
  // ========================================================================

  describe('End-to-End Collaboration', () => {
    it('complete collaboration workflow: export, modify, comment, re-export, import', async () => {
      // 1. Original project created by Alice
      let metadata = addContributor(baseProjectMetadata, {
        id: 'alice',
        name: 'Alice',
        email: 'alice@example.com',
        role: 'composer',
        joinedAt: Date.now()
      });

      metadata = addChangelogEntry(metadata, {
        id: 'change1',
        timestamp: Date.now(),
        contributorId: 'alice',
        action: 'create-stream',
        description: 'Created initial melody'
      });

      const originalProject = {
        streams: [{ id: 'stream1', name: 'Melody', events: [] }],
        clips: [],
        routingGraph: { nodes: [], edges: [] },
        boardState: { activeBoard: 'notation-manual' },
        activeContext: { activeStreamId: 'stream1', activeClipId: null },
        metadata: { name: 'Collab Song' },
        collaborationMetadata: metadata,
        comments: []
      };

      // 2. Export project
      const archive1 = await exportProject(originalProject);
      expect(archive1.collaborationMetadata!.contributors).toHaveLength(1);

      // 3. Bob imports and modifies
      const imported = await importProject(archive1, { conflictResolution: 'rename' });
      expect(imported.success).toBe(true);

      let bobMetadata = addContributor(imported.project.collaborationMetadata || baseProjectMetadata, {
        id: 'bob',
        name: 'Bob',
        email: 'bob@example.com',
        role: 'mixer',
        joinedAt: Date.now()
      });

      bobMetadata = addChangelogEntry(bobMetadata, {
        id: 'change2',
        timestamp: Date.now(),
        contributorId: 'bob',
        action: 'modify-stream',
        description: 'Added harmony to melody'
      });

      // 4. Bob adds comments
      let comments = addComment([], {
        author: 'Bob',
        content: 'Added harmony notes in measures 4-8',
        attachmentType: 'stream',
        attachmentId: 'stream1'
      });

      const modifiedProject = {
        ...imported.project,
        streams: [
          ...imported.project.streams,
          { id: 'stream2', name: 'Harmony', events: [] }
        ],
        collaborationMetadata: bobMetadata,
        comments
      };

      // 5. Re-export with Bob's changes
      const archive2 = await exportProject(modifiedProject);
      expect(archive2.collaborationMetadata!.contributors).toHaveLength(2);
      expect(archive2.collaborationMetadata!.changelog).toHaveLength(2);
      expect(archive2.comments).toHaveLength(1);

      // 6. Alice imports Bob's changes
      const finalImport = await importProject(archive2, { conflictResolution: 'rename' });
      expect(finalImport.success).toBe(true);
      expect(finalImport.project.streams).toHaveLength(2);
      expect(finalImport.project.collaborationMetadata!.contributors).toHaveLength(2);

      // 7. Verify comment preserved
      const allComments = finalImport.project.comments || [];
      expect(allComments).toHaveLength(1);
      expect(allComments[0].author).toBe('Bob');
    });
  });
});
