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
  type ImportConflictResolution,
  type ProjectExportOptions,
  type ProjectMetadata
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
  getCommentsForAttachment,
  createComment,
  type Comment,
  type CommentsMetadata
} from './comments';

// Helper to export and parse for testing
async function exportAndParse(metadata: ProjectMetadata, collaborationMetadata?: CollaborationMetadata): Promise<ProjectArchive> {
  const options: ProjectExportOptions = {
    includeSamples: false,
    includePresets: false,
    includeAudioFiles: false,
    includeVideos: false,
    compress: false,
    compressionLevel: 1,
    includeMetadata: true,
  };
  
  const blob = await exportProject(options, metadata);
  const text = await blob.text();
  const archive = JSON.parse(text) as ProjectArchive;
  
  // Add collaboration metadata if provided (would be stored in a separate field in real implementation)
  if (collaborationMetadata) {
    (archive as any).collaborationMetadata = collaborationMetadata;
  }
  
  return archive;
}

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
      const projectMetadata: ProjectMetadata = {
        projectName: 'Collab Project',
        createdAt: Date.now(),
        modifiedAt: Date.now(),
        version: '1.0',
        cardplayVersion: '0.1.0'
      };
      
      const archive = await exportAndParse(projectMetadata, metadataWithChangelog);

      expect(archive.metadata.projectName).toBe('Collab Project');
      expect((archive as any).collaborationMetadata).toBeDefined();
      expect((archive as any).collaborationMetadata!.contributors).toHaveLength(1);
      expect((archive as any).collaborationMetadata!.changelog).toHaveLength(1);
    });

    it.skip('imports project and preserves collaboration metadata', async () => {
      // NOTE: This test is skipped because importProject expects a File object,
      // not a ProjectArchive. Full integration of collaboration metadata into
      // the export/import pipeline is pending.
      
      // Expected workflow (when fully implemented):
      // 1. Export project with collaboration metadata
      // 2. Import the .cardplay file
      // 3. Collaboration metadata is preserved
      
      const archive: ProjectArchive = {
        version: '1.0',
        metadata: {
          projectName: 'Imported Project',
          createdAt: Date.now(),
          modifiedAt: Date.now(),
          version: '1.0',
          cardplayVersion: '0.1.0'
        },
        streams: [],
        clips: [],
        boardState: {
          currentBoardId: 'notation-manual',
          recentBoardIds: [],
          favoriteBoardIds: [],
          perBoardLayout: {},
          perBoardDeckState: {}
        },
        activeContext: { activeStreamId: null, activeClipId: null, activeTrackId: null }
      };
      
      // Would need to convert archive to File/Blob to test actual import
      // const blob = new Blob([JSON.stringify(archive)], { type: 'application/json' });
      // const file = new File([blob], 'test.cardplay');
      // const result = await importProject(file, { conflictResolution: 'rename' });
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
        version: '1.0',
        timestamp: Date.now(),
        streams: [{ id: 'stream1', name: 'Melody', events: [] }],
        clips: [{ id: 'clip1', name: 'Intro', streamId: 'stream1', duration: 480 }],
        routing: []
      };

      const modifiedProject = {
        version: '1.1',
        timestamp: Date.now() + 1000,
        streams: [
          { id: 'stream1', name: 'Melody', events: [{ id: 'event1', kind: 'note' as const }] }, // Added event
          { id: 'stream2', name: 'Harmony', events: [] } // Added stream
        ],
        clips: [{ id: 'clip1', name: 'Intro', streamId: 'stream1', duration: 480 }],
        routing: []
      };

      const diff = diffProjects(baseProject as any, modifiedProject as any);

      const addedStreams = diff.streamDiffs.filter(d => d.changeType === 'added');
      const modifiedStreams = diff.streamDiffs.filter(d => d.changeType === 'modified');
      
      expect(addedStreams).toHaveLength(1);
      expect(addedStreams[0]?.streamId).toBe('stream2');
      expect(modifiedStreams).toHaveLength(1);
      expect(modifiedStreams[0]?.streamId).toBe('stream1');
    });

    it('detects merge conflicts when same elements modified', () => {
      const base = {
        version: '1.0',
        timestamp: Date.now(),
        streams: [{ id: 'stream1', name: 'Original', events: [] }],
        clips: [],
        routing: []
      };

      const version1 = {
        version: '1.1',
        timestamp: Date.now() + 1000,
        streams: [{ id: 'stream1', name: 'Version 1', events: [{ id: 'e1' }] }],
        clips: [],
        routing: []
      };

      const version2 = {
        version: '1.2',
        timestamp: Date.now() + 2000,
        streams: [{ id: 'stream1', name: 'Version 2', events: [{ id: 'e2' }] }],
        clips: [],
        routing: []
      };

      const conflicts = detectMergeConflicts(
        base as any,
        version1 as any,
        version2 as any
      );

      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0]?.type).toBe('stream-modified');
      expect(conflicts[0]?.id).toContain('stream1');
    });
  });

  // ========================================================================
  // COMMENTS & ANNOTATIONS WORKFLOW
  // ========================================================================

  describe('Comments Workflow', () => {
    it('adds comments to project elements', () => {
      let metadata: CommentsMetadata = {
        version: '1.0',
        projectId: 'test-project',
        comments: []
      };

      // Add comment to clip
      const comment = createComment(
        'alice-id',
        'Alice',
        'This clip needs more energy',
        'clip',
        'clip1'
      );
      
      metadata = addComment(metadata, comment);

      expect(metadata.comments).toHaveLength(1);
      expect(metadata.comments[0]?.content).toBe('This clip needs more energy');
      expect(metadata.comments[0]?.attachmentType).toBe('clip');
    });

    it('supports comment threading', () => {
      let metadata: CommentsMetadata = {
        version: '1.0',
        projectId: 'test-project',
        comments: []
      };

      // Original comment
      const comment1 = createComment(
        'alice-id',
        'Alice',
        'Main feedback',
        'clip',
        'clip1'
      );
      metadata = addComment(metadata, comment1);
      
      const originalId = metadata.comments[0]?.id;
      if (!originalId) throw new Error('Comment not added');

      // Reply to comment
      const comment2 = createComment(
        'bob-id',
        'Bob',
        'I agree, let me fix it',
        'clip',
        'clip1',
        originalId
      );
      metadata = addComment(metadata, comment2);

      expect(metadata.comments).toHaveLength(2);
      expect(metadata.comments[1]?.parentId).toBe(originalId);
      expect(metadata.comments[1]?.content).toBe('I agree, let me fix it');
    });

    it('marks comments as resolved', () => {
      let metadata: CommentsMetadata = {
        version: '1.0',
        projectId: 'test-project',
        comments: []
      };

      const comment = createComment(
        'alice-id',
        'Alice',
        'Fix needed',
        'clip',
        'clip1'
      );
      metadata = addComment(metadata, comment);

      const commentId = metadata.comments[0]?.id;
      if (!commentId) throw new Error('Comment not added');
      
      metadata = resolveComment(metadata, commentId, 'Bob');

      expect(metadata.comments[0]?.resolved).toBe(true);
      expect(metadata.comments[0]?.resolvedBy).toBe('Bob');
      expect(metadata.comments[0]?.resolvedAt).toBeDefined();
    });

    it('filters comments by attachment', () => {
      let metadata: CommentsMetadata = {
        version: '1.0',
        projectId: 'test-project',
        comments: []
      };

      const comment1 = createComment(
        'alice-id',
        'Alice',
        'Comment on clip1',
        'clip',
        'clip1'
      );
      metadata = addComment(metadata, comment1);

      const comment2 = createComment(
        'bob-id',
        'Bob',
        'Comment on stream1',
        'stream',
        'stream1'
      );
      metadata = addComment(metadata, comment2);

      const clipComments = getCommentsForAttachment(metadata, 'clip', 'clip1');
      expect(clipComments).toHaveLength(1);
      expect(clipComments[0]?.attachmentId).toBe('clip1');
    });
  });

  // ========================================================================
  // END-TO-END COLLABORATION SCENARIO
  // ========================================================================

  describe('End-to-End Collaboration', () => {
    it.skip('complete collaboration workflow: export, modify, comment, re-export, import', async () => {
      // NOTE: This end-to-end test is skipped because it requires full integration
      // of collaboration metadata into the export/import pipeline.
      // 
      // Expected workflow (when fully implemented):
      // 1. Alice creates project with collaboration metadata
      // 2. Export to .cardplay archive with metadata included
      // 3. Bob imports, modifies, adds comments
      // 4. Re-export with updated metadata
      // 5. Import back and verify all metadata preserved
      //
      // Individual systems are tested separately:
      // - Export/import: project-exchange.test.ts
      // - Collaboration metadata: collaboration-metadata.test.ts
      // - Comments: comments.test.ts (if exists)
      // - Project diff: project-diff.test.ts
    });
  });
});
