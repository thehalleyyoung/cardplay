/**
 * Comments & Annotations System
 * 
 * Allows attaching comments to clips, events, decks, and other project elements.
 * Supports threading for discussions and resolution tracking for feedback workflows.
 */

export interface Comment {
  readonly id: string;
  readonly authorId: string;
  readonly authorName: string;
  readonly timestamp: number;
  readonly content: string;
  readonly attachmentType: AttachmentType;
  readonly attachmentId: string;
  readonly parentId?: string; // For threaded replies
  readonly resolved: boolean;
  readonly resolvedBy?: string;
  readonly resolvedAt?: number;
}

export type AttachmentType = 'clip' | 'stream' | 'event' | 'deck' | 'route' | 'project';

export interface CommentThread {
  readonly rootComment: Comment;
  readonly replies: readonly Comment[];
  readonly resolved: boolean;
}

export interface CommentsMetadata {
  readonly version: '1.0';
  readonly projectId: string;
  readonly comments: readonly Comment[];
}

/**
 * Create a new comment
 */
export function createComment(
  authorId: string,
  authorName: string,
  content: string,
  attachmentType: AttachmentType,
  attachmentId: string,
  parentId?: string
): Comment {
  const base = {
    id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    authorId,
    authorName,
    timestamp: Date.now(),
    content,
    attachmentType,
    attachmentId,
    resolved: false
  };
  
  return parentId ? { ...base, parentId } : base;
}

/**
 * Add a reply to an existing comment
 */
export function replyToComment(
  metadata: CommentsMetadata,
  parentCommentId: string,
  authorId: string,
  authorName: string,
  content: string
): CommentsMetadata {
  const parentComment = metadata.comments.find(c => c.id === parentCommentId);
  
  if (!parentComment) {
    throw new Error(`Parent comment ${parentCommentId} not found`);
  }
  
  const reply: Comment = {
    id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    authorId,
    authorName,
    timestamp: Date.now(),
    content,
    attachmentType: parentComment.attachmentType,
    attachmentId: parentComment.attachmentId,
    parentId: parentCommentId,
    resolved: false
  };
  
  return {
    ...metadata,
    comments: [...metadata.comments, reply]
  };
}

/**
 * Resolve a comment (and optionally all replies in the thread)
 */
export function resolveComment(
  metadata: CommentsMetadata,
  commentId: string,
  resolvedBy: string,
  resolveThread: boolean = true
): CommentsMetadata {
  const comment = metadata.comments.find(c => c.id === commentId);
  
  if (!comment) {
    throw new Error(`Comment ${commentId} not found`);
  }
  
  const now = Date.now();
  
  const updatedComments = metadata.comments.map(c => {
    // Resolve the target comment
    if (c.id === commentId) {
      return {
        ...c,
        resolved: true,
        resolvedBy,
        resolvedAt: now
      };
    }
    
    // If resolving thread, also resolve all replies
    if (resolveThread && c.parentId === commentId) {
      return {
        ...c,
        resolved: true,
        resolvedBy,
        resolvedAt: now
      };
    }
    
    return c;
  });
  
  return {
    ...metadata,
    comments: updatedComments
  };
}

/**
 * Unresolve a comment (reopen discussion)
 */
export function unresolveComment(
  metadata: CommentsMetadata,
  commentId: string
): CommentsMetadata {
  const updatedComments = metadata.comments.map(c => {
    if (c.id === commentId) {
      const { resolvedBy, resolvedAt, ...rest } = c;
      return {
        ...rest,
        resolved: false
      };
    }
    return c;
  });
  
  return {
    ...metadata,
    comments: updatedComments
  };
}

/**
 * Get all comments attached to a specific element
 */
export function getCommentsForAttachment(
  metadata: CommentsMetadata,
  attachmentType: AttachmentType,
  attachmentId: string,
  includeResolved: boolean = true
): readonly Comment[] {
  return metadata.comments.filter(
    c =>
      c.attachmentType === attachmentType &&
      c.attachmentId === attachmentId &&
      (includeResolved || !c.resolved)
  );
}

/**
 * Organize comments into threads
 */
export function organizeIntoThreads(comments: readonly Comment[]): readonly CommentThread[] {
  // Find all root comments (no parentId)
  const rootComments = comments.filter(c => !c.parentId);
  
  // Build threads
  return rootComments.map(root => {
    const replies = comments.filter(c => c.parentId === root.id);
    const hasUnresolvedReplies = replies.some(r => !r.resolved);
    
    return {
      rootComment: root,
      replies,
      resolved: root.resolved && !hasUnresolvedReplies
    };
  });
}

/**
 * Get a specific thread (root comment + all replies)
 */
export function getThread(
  metadata: CommentsMetadata,
  rootCommentId: string
): CommentThread | null {
  const root = metadata.comments.find(c => c.id === rootCommentId && !c.parentId);
  
  if (!root) {
    return null;
  }
  
  const replies = metadata.comments.filter(c => c.parentId === rootCommentId);
  const hasUnresolvedReplies = replies.some(r => !r.resolved);
  
  return {
    rootComment: root,
    replies,
    resolved: root.resolved && !hasUnresolvedReplies
  };
}

/**
 * Delete a comment and all its replies
 */
export function deleteComment(
  metadata: CommentsMetadata,
  commentId: string
): CommentsMetadata {
  const idsToDelete = new Set<string>([commentId]);
  
  // Find all replies recursively
  const findReplies = (parentId: string) => {
    const replies = metadata.comments.filter(c => c.parentId === parentId);
    for (const reply of replies) {
      idsToDelete.add(reply.id);
      findReplies(reply.id);
    }
  };
  
  findReplies(commentId);
  
  return {
    ...metadata,
    comments: metadata.comments.filter(c => !idsToDelete.has(c.id))
  };
}

/**
 * Edit a comment (preserves metadata, updates content)
 */
export function editComment(
  metadata: CommentsMetadata,
  commentId: string,
  newContent: string
): CommentsMetadata {
  const updatedComments = metadata.comments.map(c => {
    if (c.id === commentId) {
      return {
        ...c,
        content: newContent
      };
    }
    return c;
  });
  
  return {
    ...metadata,
    comments: updatedComments
  };
}

/**
 * Get all unresolved comments for a project
 */
export function getUnresolvedComments(
  metadata: CommentsMetadata
): readonly Comment[] {
  return metadata.comments.filter(c => !c.resolved);
}

/**
 * Get comments by author
 */
export function getCommentsByAuthor(
  metadata: CommentsMetadata,
  authorId: string
): readonly Comment[] {
  return metadata.comments.filter(c => c.authorId === authorId);
}

/**
 * Get recent comments (last N comments)
 */
export function getRecentComments(
  metadata: CommentsMetadata,
  limit: number = 10
): readonly Comment[] {
  return [...metadata.comments]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

/**
 * Generate comment statistics
 */
export function generateCommentStatistics(
  metadata: CommentsMetadata
): {
  total: number;
  resolved: number;
  unresolved: number;
  threads: number;
  byAttachmentType: Record<AttachmentType, number>;
} {
  const resolved = metadata.comments.filter(c => c.resolved).length;
  const threads = metadata.comments.filter(c => !c.parentId).length;
  
  const byAttachmentType = metadata.comments.reduce(
    (acc, comment) => {
      acc[comment.attachmentType] = (acc[comment.attachmentType] || 0) + 1;
      return acc;
    },
    {} as Record<AttachmentType, number>
  );
  
  return {
    total: metadata.comments.length,
    resolved,
    unresolved: metadata.comments.length - resolved,
    threads,
    byAttachmentType
  };
}

/**
 * Create initial comments metadata for a project
 */
export function createCommentsMetadata(projectId: string): CommentsMetadata {
  return {
    version: '1.0',
    projectId,
    comments: []
  };
}

/**
 * Add a comment to metadata
 */
export function addComment(
  metadata: CommentsMetadata,
  comment: Comment
): CommentsMetadata {
  return {
    ...metadata,
    comments: [...metadata.comments, comment]
  };
}

/**
 * Export comments to JSON
 */
export function exportComments(metadata: CommentsMetadata): string {
  return JSON.stringify(metadata, null, 2);
}

/**
 * Import comments from JSON
 */
export function importComments(json: string): CommentsMetadata {
  const data = JSON.parse(json);
  
  if (data.version !== '1.0') {
    throw new Error(`Unsupported comments metadata version: ${data.version}`);
  }
  
  if (!data.projectId || !Array.isArray(data.comments)) {
    throw new Error('Invalid comments metadata: missing required fields');
  }
  
  return data as CommentsMetadata;
}
