import { describe, it, expect } from 'vitest';
import {
  createCommentsMetadata,
  createComment,
  addComment,
  replyToComment,
  resolveComment,
  unresolveComment,
  getCommentsForAttachment,
  organizeIntoThreads,
  getThread,
  deleteComment,
  editComment,
  getUnresolvedComments,
  getCommentsByAuthor,
  getRecentComments,
  generateCommentStatistics,
  exportComments,
  importComments
} from './comments';

describe('Comments & Annotations', () => {
  describe('createCommentsMetadata', () => {
    it('creates empty metadata', () => {
      const metadata = createCommentsMetadata('proj-1');
      
      expect(metadata.version).toBe('1.0');
      expect(metadata.projectId).toBe('proj-1');
      expect(metadata.comments).toHaveLength(0);
    });
  });
  
  describe('createComment', () => {
    it('creates a comment with all fields', () => {
      const comment = createComment(
        'user-1',
        'Alice',
        'This clip needs more reverb',
        'clip',
        'clip-1'
      );
      
      expect(comment.id).toBeTruthy();
      expect(comment.authorId).toBe('user-1');
      expect(comment.authorName).toBe('Alice');
      expect(comment.content).toBe('This clip needs more reverb');
      expect(comment.attachmentType).toBe('clip');
      expect(comment.attachmentId).toBe('clip-1');
      expect(comment.resolved).toBe(false);
      expect(comment.parentId).toBeUndefined();
    });
    
    it('creates a reply with parentId', () => {
      const comment = createComment(
        'user-1',
        'Alice',
        'Reply content',
        'clip',
        'clip-1',
        'parent-comment-id'
      );
      
      expect(comment.parentId).toBe('parent-comment-id');
    });
  });
  
  describe('addComment', () => {
    it('adds a comment to metadata', () => {
      let metadata = createCommentsMetadata('proj-1');
      const comment = createComment('user-1', 'Alice', 'Test', 'clip', 'clip-1');
      
      metadata = addComment(metadata, comment);
      
      expect(metadata.comments).toHaveLength(1);
      expect(metadata.comments[0]).toBe(comment);
    });
  });
  
  describe('replyToComment', () => {
    it('adds a reply to existing comment', () => {
      let metadata = createCommentsMetadata('proj-1');
      const parent = createComment('user-1', 'Alice', 'Original', 'clip', 'clip-1');
      metadata = addComment(metadata, parent);
      
      metadata = replyToComment(metadata, parent.id, 'user-2', 'Bob', 'Reply');
      
      expect(metadata.comments).toHaveLength(2);
      expect(metadata.comments[1].parentId).toBe(parent.id);
      expect(metadata.comments[1].authorName).toBe('Bob');
      expect(metadata.comments[1].content).toBe('Reply');
    });
    
    it('throws error for non-existent parent', () => {
      const metadata = createCommentsMetadata('proj-1');
      
      expect(() => {
        replyToComment(metadata, 'non-existent', 'user-1', 'Alice', 'Reply');
      }).toThrow('Parent comment non-existent not found');
    });
  });
  
  describe('resolveComment', () => {
    it('resolves a single comment', () => {
      let metadata = createCommentsMetadata('proj-1');
      const comment = createComment('user-1', 'Alice', 'Test', 'clip', 'clip-1');
      metadata = addComment(metadata, comment);
      
      metadata = resolveComment(metadata, comment.id, 'user-2', false);
      
      expect(metadata.comments[0].resolved).toBe(true);
      expect(metadata.comments[0].resolvedBy).toBe('user-2');
      expect(metadata.comments[0].resolvedAt).toBeTruthy();
    });
    
    it('resolves a comment and all replies in thread', () => {
      let metadata = createCommentsMetadata('proj-1');
      const parent = createComment('user-1', 'Alice', 'Original', 'clip', 'clip-1');
      metadata = addComment(metadata, parent);
      metadata = replyToComment(metadata, parent.id, 'user-2', 'Bob', 'Reply 1');
      metadata = replyToComment(metadata, parent.id, 'user-3', 'Charlie', 'Reply 2');
      
      metadata = resolveComment(metadata, parent.id, 'user-4', true);
      
      expect(metadata.comments.every(c => c.resolved)).toBe(true);
      expect(metadata.comments.every(c => c.resolvedBy === 'user-4')).toBe(true);
    });
    
    it('throws error for non-existent comment', () => {
      const metadata = createCommentsMetadata('proj-1');
      
      expect(() => {
        resolveComment(metadata, 'non-existent', 'user-1');
      }).toThrow('Comment non-existent not found');
    });
  });
  
  describe('unresolveComment', () => {
    it('reopens a resolved comment', () => {
      let metadata = createCommentsMetadata('proj-1');
      const comment = createComment('user-1', 'Alice', 'Test', 'clip', 'clip-1');
      metadata = addComment(metadata, comment);
      metadata = resolveComment(metadata, comment.id, 'user-2', false);
      
      metadata = unresolveComment(metadata, comment.id);
      
      expect(metadata.comments[0].resolved).toBe(false);
      expect(metadata.comments[0].resolvedBy).toBeUndefined();
      expect(metadata.comments[0].resolvedAt).toBeUndefined();
    });
  });
  
  describe('getCommentsForAttachment', () => {
    it('filters comments by attachment', () => {
      let metadata = createCommentsMetadata('proj-1');
      metadata = addComment(metadata, createComment('u1', 'A', 'C1', 'clip', 'clip-1'));
      metadata = addComment(metadata, createComment('u1', 'A', 'C2', 'clip', 'clip-1'));
      metadata = addComment(metadata, createComment('u1', 'A', 'C3', 'stream', 'stream-1'));
      
      const comments = getCommentsForAttachment(metadata, 'clip', 'clip-1');
      
      expect(comments).toHaveLength(2);
      expect(comments.every(c => c.attachmentType === 'clip')).toBe(true);
    });
    
    it('excludes resolved comments when requested', () => {
      let metadata = createCommentsMetadata('proj-1');
      const comment1 = createComment('u1', 'A', 'C1', 'clip', 'clip-1');
      const comment2 = createComment('u1', 'A', 'C2', 'clip', 'clip-1');
      metadata = addComment(metadata, comment1);
      metadata = addComment(metadata, comment2);
      metadata = resolveComment(metadata, comment1.id, 'u2', false);
      
      const comments = getCommentsForAttachment(metadata, 'clip', 'clip-1', false);
      
      expect(comments).toHaveLength(1);
      expect(comments[0].id).toBe(comment2.id);
    });
  });
  
  describe('organizeIntoThreads', () => {
    it('organizes comments into threads', () => {
      let metadata = createCommentsMetadata('proj-1');
      const root1 = createComment('u1', 'A', 'Root 1', 'clip', 'clip-1');
      const root2 = createComment('u1', 'A', 'Root 2', 'clip', 'clip-1');
      metadata = addComment(metadata, root1);
      metadata = addComment(metadata, root2);
      metadata = replyToComment(metadata, root1.id, 'u2', 'B', 'Reply to 1');
      metadata = replyToComment(metadata, root1.id, 'u3', 'C', 'Another reply to 1');
      
      const threads = organizeIntoThreads(metadata.comments);
      
      expect(threads).toHaveLength(2);
      expect(threads[0].rootComment.id).toBe(root1.id);
      expect(threads[0].replies).toHaveLength(2);
      expect(threads[1].rootComment.id).toBe(root2.id);
      expect(threads[1].replies).toHaveLength(0);
    });
    
    it('marks thread as resolved only if all comments resolved', () => {
      let metadata = createCommentsMetadata('proj-1');
      const root = createComment('u1', 'A', 'Root', 'clip', 'clip-1');
      metadata = addComment(metadata, root);
      metadata = replyToComment(metadata, root.id, 'u2', 'B', 'Reply');
      metadata = resolveComment(metadata, root.id, 'u3', false);
      
      const threads = organizeIntoThreads(metadata.comments);
      
      expect(threads[0].resolved).toBe(false);
    });
  });
  
  describe('getThread', () => {
    it('retrieves a specific thread', () => {
      let metadata = createCommentsMetadata('proj-1');
      const root = createComment('u1', 'A', 'Root', 'clip', 'clip-1');
      metadata = addComment(metadata, root);
      metadata = replyToComment(metadata, root.id, 'u2', 'B', 'Reply');
      
      const thread = getThread(metadata, root.id);
      
      expect(thread).toBeTruthy();
      expect(thread!.rootComment.id).toBe(root.id);
      expect(thread!.replies).toHaveLength(1);
    });
    
    it('returns null for non-existent thread', () => {
      const metadata = createCommentsMetadata('proj-1');
      const thread = getThread(metadata, 'non-existent');
      
      expect(thread).toBeNull();
    });
  });
  
  describe('deleteComment', () => {
    it('deletes a comment and all replies', () => {
      let metadata = createCommentsMetadata('proj-1');
      const root = createComment('u1', 'A', 'Root', 'clip', 'clip-1');
      metadata = addComment(metadata, root);
      metadata = replyToComment(metadata, root.id, 'u2', 'B', 'Reply 1');
      metadata = replyToComment(metadata, root.id, 'u3', 'C', 'Reply 2');
      
      metadata = deleteComment(metadata, root.id);
      
      expect(metadata.comments).toHaveLength(0);
    });
    
    it('deletes only the specified comment if it has no replies', () => {
      let metadata = createCommentsMetadata('proj-1');
      const comment1 = createComment('u1', 'A', 'C1', 'clip', 'clip-1');
      const comment2 = createComment('u1', 'A', 'C2', 'clip', 'clip-1');
      metadata = addComment(metadata, comment1);
      metadata = addComment(metadata, comment2);
      
      metadata = deleteComment(metadata, comment1.id);
      
      expect(metadata.comments).toHaveLength(1);
      expect(metadata.comments[0].id).toBe(comment2.id);
    });
  });
  
  describe('editComment', () => {
    it('updates comment content', () => {
      let metadata = createCommentsMetadata('proj-1');
      const comment = createComment('u1', 'A', 'Original', 'clip', 'clip-1');
      metadata = addComment(metadata, comment);
      
      metadata = editComment(metadata, comment.id, 'Updated content');
      
      expect(metadata.comments[0].content).toBe('Updated content');
    });
  });
  
  describe('query functions', () => {
    it('getUnresolvedComments filters correctly', () => {
      let metadata = createCommentsMetadata('proj-1');
      const c1 = createComment('u1', 'A', 'C1', 'clip', 'clip-1');
      const c2 = createComment('u1', 'A', 'C2', 'clip', 'clip-1');
      metadata = addComment(metadata, c1);
      metadata = addComment(metadata, c2);
      metadata = resolveComment(metadata, c1.id, 'u2', false);
      
      const unresolved = getUnresolvedComments(metadata);
      
      expect(unresolved).toHaveLength(1);
      expect(unresolved[0].id).toBe(c2.id);
    });
    
    it('getCommentsByAuthor filters correctly', () => {
      let metadata = createCommentsMetadata('proj-1');
      metadata = addComment(metadata, createComment('u1', 'Alice', 'C1', 'clip', 'clip-1'));
      metadata = addComment(metadata, createComment('u2', 'Bob', 'C2', 'clip', 'clip-1'));
      metadata = addComment(metadata, createComment('u1', 'Alice', 'C3', 'clip', 'clip-1'));
      
      const comments = getCommentsByAuthor(metadata, 'u1');
      
      expect(comments).toHaveLength(2);
      expect(comments.every(c => c.authorId === 'u1')).toBe(true);
    });
    
    it('getRecentComments returns latest comments', () => {
      let metadata = createCommentsMetadata('proj-1');
      for (let i = 0; i < 15; i++) {
        metadata = addComment(metadata, createComment('u1', 'A', `C${i}`, 'clip', 'clip-1'));
      }
      
      const recent = getRecentComments(metadata, 5);
      
      expect(recent).toHaveLength(5);
      // Should be ordered by timestamp descending
      for (let i = 1; i < recent.length; i++) {
        expect(recent[i - 1].timestamp).toBeGreaterThanOrEqual(recent[i].timestamp);
      }
    });
  });
  
  describe('generateCommentStatistics', () => {
    it('generates accurate statistics', () => {
      let metadata = createCommentsMetadata('proj-1');
      metadata = addComment(metadata, createComment('u1', 'A', 'C1', 'clip', 'clip-1'));
      metadata = addComment(metadata, createComment('u1', 'A', 'C2', 'stream', 'stream-1'));
      metadata = addComment(metadata, createComment('u1', 'A', 'C3', 'clip', 'clip-2'));
      metadata = resolveComment(metadata, metadata.comments[0].id, 'u2', false);
      
      const stats = generateCommentStatistics(metadata);
      
      expect(stats.total).toBe(3);
      expect(stats.resolved).toBe(1);
      expect(stats.unresolved).toBe(2);
      expect(stats.threads).toBe(3);
      expect(stats.byAttachmentType.clip).toBe(2);
      expect(stats.byAttachmentType.stream).toBe(1);
    });
  });
  
  describe('export/import', () => {
    it('exports and imports correctly', () => {
      let metadata = createCommentsMetadata('proj-1');
      metadata = addComment(metadata, createComment('u1', 'Alice', 'Test', 'clip', 'clip-1'));
      
      const exported = exportComments(metadata);
      const imported = importComments(exported);
      
      expect(imported.version).toBe(metadata.version);
      expect(imported.projectId).toBe(metadata.projectId);
      expect(imported.comments).toHaveLength(metadata.comments.length);
    });
    
    it('rejects invalid version', () => {
      const invalid = JSON.stringify({ version: '2.0', projectId: 'p1', comments: [] });
      
      expect(() => {
        importComments(invalid);
      }).toThrow('Unsupported comments metadata version');
    });
    
    it('rejects missing required fields', () => {
      const invalid = JSON.stringify({ version: '1.0' });
      
      expect(() => {
        importComments(invalid);
      }).toThrow('Invalid comments metadata: missing required fields');
    });
  });
});
