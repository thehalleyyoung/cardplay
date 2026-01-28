/**
 * @fileoverview Score revision tracking and version control.
 * 
 * Tracks changes to scores over time with diff/patch capabilities,
 * enabling collaborative editing and undo/redo functionality.
 * 
 * @module @cardplay/core/notation/revisions
 */

// ============================================================================
// REVISION TYPES
// ============================================================================

/**
 * Revision record for score history.
 */
export interface Revision {
  readonly id: string;
  readonly timestamp: number;
  readonly author: string;
  readonly message: string;
  readonly changes: ReadonlyArray<Change>;
  readonly parentId?: string; // Parent revision ID
}

/**
 * Individual change operation.
 */
export interface Change {
  readonly type: ChangeType;
  readonly target: ChangeTarget;
  readonly oldValue?: any;
  readonly newValue?: any;
}

/**
 * Types of changes that can be tracked.
 */
export type ChangeType =
  | 'add'
  | 'remove'
  | 'modify'
  | 'move'
  | 'transpose';

/**
 * Target of a change operation.
 */
export interface ChangeTarget {
  readonly type: 'note' | 'measure' | 'metadata' | 'attribute' | 'annotation';
  readonly measureIndex?: number;
  readonly noteIndex?: number;
  readonly path?: string; // JSON path for nested properties
}

/**
 * Revision history for a score.
 */
export interface RevisionHistory {
  readonly revisions: ReadonlyArray<Revision>;
  readonly currentRevisionId: string;
  readonly branches: ReadonlyMap<string, string>; // Branch name -> revision ID
}

// ============================================================================
// REVISION CREATION
// ============================================================================

/**
 * Create new revision.
 */
export function createRevision(
  changes: ReadonlyArray<Change>,
  author: string,
  message: string,
  parentId?: string
): Revision {
  return {
    id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    author,
    message,
    changes,
    ...(parentId !== undefined && { parentId }),
  };
}

/**
 * Create change record.
 */
export function createChange(
  type: ChangeType,
  target: ChangeTarget,
  oldValue?: any,
  newValue?: any
): Change {
  return { type, target, oldValue, newValue };
}

// ============================================================================
// REVISION HISTORY MANAGEMENT
// ============================================================================

/**
 * Initialize empty revision history.
 */
export function createRevisionHistory(initialRevision?: Revision): RevisionHistory {
  const revisions = initialRevision ? [initialRevision] : [];
  const currentRevisionId = initialRevision?.id || '';
  
  return {
    revisions,
    currentRevisionId,
    branches: new Map([['main', currentRevisionId]]),
  };
}

/**
 * Add revision to history.
 */
export function addRevision(
  history: RevisionHistory,
  revision: Revision
): RevisionHistory {
  return {
    ...history,
    revisions: [...history.revisions, revision],
    currentRevisionId: revision.id,
    branches: new Map(history.branches).set('main', revision.id),
  };
}

/**
 * Get revision by ID.
 */
export function getRevision(
  history: RevisionHistory,
  revisionId: string
): Revision | null {
  return history.revisions.find((r) => r.id === revisionId) || null;
}

/**
 * Get revision chain from current back to root.
 */
export function getRevisionChain(
  history: RevisionHistory,
  revisionId: string
): ReadonlyArray<Revision> {
  const chain: Revision[] = [];
  let current = getRevision(history, revisionId);
  
  while (current) {
    chain.unshift(current);
    current = current.parentId ? getRevision(history, current.parentId) : null;
  }
  
  return chain;
}

/**
 * Get all revisions by author.
 */
export function getRevisionsByAuthor(
  history: RevisionHistory,
  author: string
): ReadonlyArray<Revision> {
  return history.revisions.filter((r) => r.author === author);
}

/**
 * Get revisions in date range.
 */
export function getRevisionsInRange(
  history: RevisionHistory,
  startTimestamp: number,
  endTimestamp: number
): ReadonlyArray<Revision> {
  return history.revisions.filter(
    (r) => r.timestamp >= startTimestamp && r.timestamp <= endTimestamp
  );
}

// ============================================================================
// DIFF AND PATCH
// ============================================================================

/**
 * Compute diff between two score states.
 */
export function computeDiff(
  oldState: any,
  newState: any
): ReadonlyArray<Change> {
  const changes: Change[] = [];
  
  // Compare notes
  if (oldState.notes && newState.notes) {
    // Added notes
    for (let i = oldState.notes.length; i < newState.notes.length; i++) {
      changes.push({
        type: 'add',
        target: { type: 'note', noteIndex: i },
        newValue: newState.notes[i],
      });
    }
    
    // Removed notes
    for (let i = newState.notes.length; i < oldState.notes.length; i++) {
      changes.push({
        type: 'remove',
        target: { type: 'note', noteIndex: i },
        oldValue: oldState.notes[i],
      });
    }
    
    // Modified notes
    const minLength = Math.min(oldState.notes.length, newState.notes.length);
    for (let i = 0; i < minLength; i++) {
      if (!deepEqual(oldState.notes[i], newState.notes[i])) {
        changes.push({
          type: 'modify',
          target: { type: 'note', noteIndex: i },
          oldValue: oldState.notes[i],
          newValue: newState.notes[i],
        });
      }
    }
  }
  
  // Compare metadata
  if (!deepEqual(oldState.metadata, newState.metadata)) {
    changes.push({
      type: 'modify',
      target: { type: 'metadata' },
      oldValue: oldState.metadata,
      newValue: newState.metadata,
    });
  }
  
  return changes;
}

/**
 * Apply patch (changes) to state.
 */
export function applyPatch(state: any, changes: ReadonlyArray<Change>): any {
  let newState = { ...state };
  
  for (const change of changes) {
    switch (change.type) {
      case 'add':
        if (change.target.type === 'note' && change.target.noteIndex !== undefined) {
          newState.notes = [...(newState.notes || [])];
          newState.notes.splice(change.target.noteIndex, 0, change.newValue);
        }
        break;
        
      case 'remove':
        if (change.target.type === 'note' && change.target.noteIndex !== undefined) {
          newState.notes = [...(newState.notes || [])];
          newState.notes.splice(change.target.noteIndex, 1);
        }
        break;
        
      case 'modify':
        if (change.target.type === 'note' && change.target.noteIndex !== undefined) {
          newState.notes = [...(newState.notes || [])];
          newState.notes[change.target.noteIndex] = change.newValue;
        } else if (change.target.type === 'metadata') {
          newState.metadata = change.newValue;
        }
        break;
        
      case 'transpose':
        if (change.target.type === 'note') {
          // Transpose all notes by the specified interval
          const interval = change.newValue;
          newState.notes = newState.notes.map((note: any) => ({
            ...note,
            pitch: note.pitch + interval,
          }));
        }
        break;
    }
  }
  
  return newState;
}

/**
 * Invert changes to create undo operation.
 */
export function invertChanges(changes: ReadonlyArray<Change>): ReadonlyArray<Change> {
  return changes.map((change) => {
    switch (change.type) {
      case 'add':
        return { ...change, type: 'remove' as const };
      case 'remove':
        return { ...change, type: 'add' as const };
      case 'modify':
        return {
          ...change,
          oldValue: change.newValue,
          newValue: change.oldValue,
        };
      default:
        return change;
    }
  }).reverse();
}

// ============================================================================
// BRANCHING
// ============================================================================

/**
 * Create new branch from current revision.
 */
export function createBranch(
  history: RevisionHistory,
  branchName: string,
  fromRevisionId?: string
): RevisionHistory {
  const revisionId = fromRevisionId || history.currentRevisionId;
  const newBranches = new Map(history.branches);
  newBranches.set(branchName, revisionId);
  
  return {
    ...history,
    branches: newBranches,
  };
}

/**
 * Switch to different branch.
 */
export function switchBranch(
  history: RevisionHistory,
  branchName: string
): RevisionHistory {
  const revisionId = history.branches.get(branchName);
  if (!revisionId) {
    throw new Error(`Branch ${branchName} not found`);
  }
  
  return {
    ...history,
    currentRevisionId: revisionId,
  };
}

/**
 * Merge two revisions (simple fast-forward merge).
 */
export function mergeRevisions(
  history: RevisionHistory,
  sourceRevisionId: string,
  targetRevisionId: string,
  author: string,
  message: string
): RevisionHistory {
  const sourceRev = getRevision(history, sourceRevisionId);
  const targetRev = getRevision(history, targetRevisionId);
  
  if (!sourceRev || !targetRev) {
    throw new Error('Invalid revision IDs');
  }
  
  // Create merge revision
  const mergeRevision = createRevision(
    [], // No changes in merge commit
    author,
    message,
    targetRevisionId
  );
  
  return addRevision(history, mergeRevision);
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Deep equality check for revision comparison.
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  
  return true;
}

/**
 * Format revision for display.
 */
export function formatRevision(revision: Revision): string {
  const date = new Date(revision.timestamp).toLocaleString();
  const changeCount = revision.changes.length;
  const changeText = changeCount === 1 ? 'change' : 'changes';
  
  return `${revision.id.slice(0, 8)} - ${revision.author} - ${date} - ${changeCount} ${changeText}: ${revision.message}`;
}

/**
 * Generate revision summary statistics.
 */
export function getRevisionStats(history: RevisionHistory): {
  totalRevisions: number;
  authors: Set<string>;
  oldestRevision: Revision | null;
  newestRevision: Revision | null;
  branches: number;
} {
  const authors = new Set(history.revisions.map((r) => r.author));
  const sorted = [...history.revisions].sort((a, b) => a.timestamp - b.timestamp);
  
  return {
    totalRevisions: history.revisions.length,
    authors,
    oldestRevision: sorted[0] || null,
    newestRevision: sorted[sorted.length - 1] || null,
    branches: history.branches.size,
  };
}

// ============================================================================
// ADVANCED REVISION TRACKING
// ============================================================================

/**
 * Get revision by index (0 = oldest, -1 = newest).
 */
export function getRevisionByIndex(
  history: RevisionHistory,
  index: number
): Revision | null {
  const sorted = [...history.revisions].sort((a, b) => a.timestamp - b.timestamp);
  const actualIndex = index < 0 ? sorted.length + index : index;
  return sorted[actualIndex] || null;
}

/**
 * Tag a revision for easy reference.
 */
export interface RevisionTag {
  readonly name: string;
  readonly revisionId: string;
  readonly description?: string;
  readonly timestamp: number;
}

/**
 * Revision history with tags.
 */
export interface TaggedRevisionHistory extends RevisionHistory {
  readonly tags: ReadonlyArray<RevisionTag>;
}

/**
 * Add tag to revision.
 */
export function tagRevision(
  history: TaggedRevisionHistory,
  revisionId: string,
  tagName: string,
  description?: string
): TaggedRevisionHistory {
  const tag: RevisionTag = {
    name: tagName,
    revisionId,
    timestamp: Date.now(),
    ...(description && { description }),
  };
  
  return {
    ...history,
    tags: [...history.tags, tag],
  };
}

/**
 * Get revision by tag name.
 */
export function getRevisionByTag(
  history: TaggedRevisionHistory,
  tagName: string
): Revision | null {
  const tag = history.tags.find(t => t.name === tagName);
  if (!tag) return null;
  return getRevision(history, tag.revisionId);
}

/**
 * Export revision history to JSON.
 */
export function exportRevisionHistory(
  history: RevisionHistory
): string {
  return JSON.stringify({
    revisions: history.revisions,
    currentRevisionId: history.currentRevisionId,
    branches: Array.from(history.branches.entries()),
  }, null, 2);
}

/**
 * Import revision history from JSON.
 */
export function importRevisionHistory(
  json: string
): RevisionHistory {
  const data = JSON.parse(json);
  return {
    revisions: data.revisions || [],
    currentRevisionId: data.currentRevisionId || '',
    branches: new Map(data.branches || []),
  };
}

/**
 * Squash multiple revisions into one.
 */
export function squashRevisions(
  history: RevisionHistory,
  revisionIds: ReadonlyArray<string>,
  author: string,
  message: string
): RevisionHistory {
  // Collect all changes from revisions
  const allChanges: Change[] = [];
  for (const id of revisionIds) {
    const rev = getRevision(history, id);
    if (rev) {
      allChanges.push(...rev.changes);
    }
  }
  
  // Create squashed revision
  const squashedRevision = createRevision(
    allChanges,
    author,
    `Squashed ${revisionIds.length} revisions: ${message}`
  );
  
  // Remove individual revisions and add squashed one
  const remainingRevisions = history.revisions.filter(
    r => !revisionIds.includes(r.id)
  );
  
  return {
    ...history,
    revisions: [...remainingRevisions, squashedRevision],
    currentRevisionId: squashedRevision.id,
  };
}

/**
 * Cherry-pick specific changes from a revision.
 */
export function cherryPickChanges(
  history: RevisionHistory,
  sourceRevisionId: string,
  changeIndices: ReadonlyArray<number>,
  author: string,
  message: string
): RevisionHistory {
  const sourceRev = getRevision(history, sourceRevisionId);
  if (!sourceRev) {
    throw new Error(`Revision ${sourceRevisionId} not found`);
  }
  
  const selectedChanges = changeIndices
    .map(i => sourceRev.changes[i])
    .filter(c => c !== undefined);
  
  const cherryPickRev = createRevision(
    selectedChanges,
    author,
    `Cherry-picked from ${sourceRevisionId.slice(0, 8)}: ${message}`,
    history.currentRevisionId
  );
  
  return addRevision(history, cherryPickRev);
}

/**
 * Revert specific changes without creating new revision.
 */
export function revertChanges(
  state: any,
  changes: ReadonlyArray<Change>
): any {
  const invertedChanges = invertChanges(changes);
  return applyPatch(state, invertedChanges);
}

/**
 * Generate visual diff between two revisions.
 */
export interface RevisionDiff {
  readonly added: ReadonlyArray<Change>;
  readonly removed: ReadonlyArray<Change>;
  readonly modified: ReadonlyArray<Change>;
}

/**
 * Calculate diff between two revisions.
 */
export function calculateDiff(
  history: RevisionHistory,
  fromRevisionId: string,
  toRevisionId: string
): RevisionDiff {
  const fromRev = getRevision(history, fromRevisionId);
  const toRev = getRevision(history, toRevisionId);
  
  if (!fromRev || !toRev) {
    throw new Error('Invalid revision IDs');
  }
  
  const added: Change[] = [];
  const removed: Change[] = [];
  const modified: Change[] = [];
  
  // Simplified diff calculation
  for (const change of toRev.changes) {
    if (change.type === 'add') {
      added.push(change);
    } else if (change.type === 'remove') {
      removed.push(change);
    } else if (change.type === 'modify') {
      modified.push(change);
    }
  }
  
  return { added, removed, modified };
}

/**
 * Find common ancestor of two revisions.
 */
export function findCommonAncestor(
  history: RevisionHistory,
  revisionId1: string,
  revisionId2: string
): Revision | null {
  const ancestors1 = getAncestors(history, revisionId1);
  const ancestors2 = getAncestors(history, revisionId2);
  
  // Find first common ancestor
  for (const ancestor1 of ancestors1) {
    if (ancestors2.some(a => a.id === ancestor1.id)) {
      return ancestor1;
    }
  }
  
  return null;
}

/**
 * Get all ancestor revisions.
 */
function getAncestors(
  history: RevisionHistory,
  revisionId: string
): ReadonlyArray<Revision> {
  const ancestors: Revision[] = [];
  let currentId: string | undefined = revisionId;
  
  while (currentId) {
    const rev = getRevision(history, currentId);
    if (!rev) break;
    ancestors.push(rev);
    currentId = rev.parentId;
  }
  
  return ancestors;
}
