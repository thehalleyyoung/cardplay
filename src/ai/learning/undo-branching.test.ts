/**
 * @fileoverview Undo History Branching Tests
 *
 * M385: Tests for undo history branching (create alternate versions).
 *
 * @module @cardplay/ai/learning/undo-branching.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  pushUndoState,
  undoState,
  redoState,
  branchFromUndo,
  switchUndoBranch,
  switchUndoToMain,
  getCurrentUndoSnapshot,
  getActiveUndoBranch,
  getUndoBranches,
  deleteUndoBranch,
  getUndoTreeSummary,
  jumpToUndoSnapshot,
  getUndoMainTimeline,
  resetUndoTree,
} from './undo-branching';

describe('UndoBranching', () => {
  beforeEach(() => {
    resetUndoTree();
  });

  // ===========================================================================
  // Basic undo/redo
  // ===========================================================================

  describe('basic undo/redo', () => {
    it('pushes states onto the timeline', () => {
      pushUndoState({ count: 0 }, 'Initial');
      pushUndoState({ count: 1 }, 'Increment');
      pushUndoState({ count: 2 }, 'Increment');

      const timeline = getUndoMainTimeline();
      expect(timeline).toHaveLength(3);
      expect(timeline[0].description).toBe('Initial');
      expect(timeline[2].description).toBe('Increment');
    });

    it('undoes to previous state', () => {
      pushUndoState({ count: 0 }, 'Initial');
      pushUndoState({ count: 1 }, 'Inc');

      const undone = undoState();
      expect(undone).not.toBeNull();
      expect(undone!.state).toEqual({ count: 0 });
    });

    it('redoes to next state', () => {
      pushUndoState({ count: 0 }, 'Initial');
      pushUndoState({ count: 1 }, 'Inc');
      undoState();

      const redone = redoState();
      expect(redone).not.toBeNull();
      expect(redone!.state).toEqual({ count: 1 });
    });

    it('returns null when nothing to undo', () => {
      expect(undoState()).toBeNull();
      pushUndoState({ count: 0 }, 'Only state');
      expect(undoState()).toBeNull(); // Can't undo past first state
    });

    it('returns null when nothing to redo', () => {
      pushUndoState({ count: 0 }, 'State');
      expect(redoState()).toBeNull();
    });

    it('truncates future when pushing after undo', () => {
      pushUndoState({ count: 0 }, 'A');
      pushUndoState({ count: 1 }, 'B');
      pushUndoState({ count: 2 }, 'C');
      undoState(); // at B
      undoState(); // at A
      pushUndoState({ count: 10 }, 'New B');

      const timeline = getUndoMainTimeline();
      expect(timeline).toHaveLength(2);
      expect(timeline[1].state).toEqual({ count: 10 });
    });

    it('deep-clones state to prevent mutation', () => {
      const state = { nested: { val: 1 } };
      pushUndoState(state as Record<string, unknown>, 'Test');
      state.nested.val = 999;

      const snapshot = getCurrentUndoSnapshot();
      expect((snapshot!.state as any).nested.val).toBe(1);
    });
  });

  // ===========================================================================
  // M385: Branching
  // ===========================================================================

  describe('branching from undo history (M385)', () => {
    beforeEach(() => {
      pushUndoState({ version: 1 }, 'Version 1');
      pushUndoState({ version: 2 }, 'Version 2');
      pushUndoState({ version: 3 }, 'Version 3');
    });

    it('creates a branch from the current position', () => {
      undoState(); // at version 2
      const branch = branchFromUndo('experiment-A', 'Try different approach');
      expect(branch).not.toBeNull();
      expect(branch!.name).toBe('experiment-A');
      expect(branch!.description).toBe('Try different approach');
      expect(branch!.snapshotIds).toHaveLength(0); // Empty until we push
    });

    it('prevents duplicate branch names', () => {
      branchFromUndo('branch1');
      expect(branchFromUndo('branch1')).toBeNull();
    });

    it('lists all branches', () => {
      undoState();
      branchFromUndo('A');
      branchFromUndo('B');
      expect(getUndoBranches()).toHaveLength(2);
    });

    it('switches to a branch and back to main', () => {
      undoState(); // at version 2
      branchFromUndo('alt');

      const altSnap = switchUndoBranch('alt');
      expect(altSnap).not.toBeNull();
      expect(getActiveUndoBranch()).toBe('alt');

      const mainSnap = switchUndoToMain();
      expect(mainSnap).not.toBeNull();
      expect(getActiveUndoBranch()).toBeNull();
    });

    it('returns null when switching to unknown branch', () => {
      expect(switchUndoBranch('nope')).toBeNull();
    });

    it('pushes states onto the active branch', () => {
      undoState(); // at version 2
      branchFromUndo('alt');
      switchUndoBranch('alt');

      pushUndoState({ version: '2-alt-1' }, 'Alternate path 1');
      pushUndoState({ version: '2-alt-2' }, 'Alternate path 2');

      const branches = getUndoBranches();
      const alt = branches.find(b => b.name === 'alt');
      expect(alt!.snapshotIds).toHaveLength(2);

      // Main timeline is unchanged
      switchUndoToMain();
      const timeline = getUndoMainTimeline();
      expect(timeline).toHaveLength(3); // Original 3 still intact
    });

    it('deletes a branch', () => {
      branchFromUndo('deleteme');
      expect(deleteUndoBranch('deleteme')).toBe(true);
      expect(getUndoBranches()).toHaveLength(0);
    });

    it('delete returns false for unknown branch', () => {
      expect(deleteUndoBranch('nope')).toBe(false);
    });

    it('switches to main when active branch is deleted', () => {
      branchFromUndo('temp');
      switchUndoBranch('temp');
      deleteUndoBranch('temp');
      expect(getActiveUndoBranch()).toBeNull();
    });
  });

  // ===========================================================================
  // Tree summary and navigation
  // ===========================================================================

  describe('tree summary and navigation', () => {
    it('provides tree summary', () => {
      pushUndoState({ a: 1 }, 'A');
      pushUndoState({ a: 2 }, 'B');
      branchFromUndo('alt');

      const summary = getUndoTreeSummary();
      expect(summary.mainTimelineLength).toBe(2);
      expect(summary.currentPosition).toBe(0); // At tip
      expect(summary.branches).toHaveLength(1);
      expect(summary.totalSnapshots).toBe(2);
    });

    it('jumps to a specific snapshot', () => {
      const s1 = pushUndoState({ v: 1 }, 'First');
      pushUndoState({ v: 2 }, 'Second');
      pushUndoState({ v: 3 }, 'Third');

      const jumped = jumpToUndoSnapshot(s1.snapshotId);
      expect(jumped).not.toBeNull();
      expect(jumped!.state).toEqual({ v: 1 });
    });

    it('returns null for unknown snapshot ID', () => {
      expect(jumpToUndoSnapshot('nonexistent')).toBeNull();
    });

    it('tracks current position after undo', () => {
      pushUndoState({ a: 1 }, 'A');
      pushUndoState({ a: 2 }, 'B');
      pushUndoState({ a: 3 }, 'C');
      undoState();

      const summary = getUndoTreeSummary();
      expect(summary.currentPosition).toBe(1); // 1 step back from tip
    });
  });
});
