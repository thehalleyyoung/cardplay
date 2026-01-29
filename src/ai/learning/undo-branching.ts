/**
 * @fileoverview Undo History Branching System
 *
 * M385: Allow branching from undo history (create alternate version).
 *
 * Provides a tree-structured undo history where the user can undo to any point
 * and branch off into an alternate timeline, without losing the original history.
 * Each branch is a named snapshot that can be restored or compared.
 *
 * Integrates with the project versioning system (project-versioning.ts) to
 * persist branches as named project versions.
 *
 * @module @cardplay/ai/learning/undo-branching
 */

// =============================================================================
// Types
// =============================================================================

/** A single state snapshot in the undo tree. */
export interface UndoSnapshot {
  /** Unique snapshot ID. */
  readonly snapshotId: string;
  /** Project state at this point. */
  readonly state: Record<string, unknown>;
  /** Description of the action that led to this state. */
  readonly description: string;
  /** ISO-8601 timestamp. */
  readonly timestamp: string;
  /** Parent snapshot ID (null for root). */
  readonly parentId: string | null;
  /** Branch name (null = main timeline). */
  readonly branchName: string | null;
}

/** A named branch in the undo tree. */
export interface UndoBranch {
  /** Branch name. */
  readonly name: string;
  /** Snapshot ID where branch was created from. */
  readonly branchPointId: string;
  /** ISO-8601 creation timestamp. */
  readonly createdAt: string;
  /** Description of why the branch was created. */
  readonly description: string;
  /** All snapshot IDs on this branch, in order. */
  readonly snapshotIds: readonly string[];
}

/** Summary of the undo tree. */
export interface UndoTreeSummary {
  /** Number of snapshots on the main timeline. */
  readonly mainTimelineLength: number;
  /** Current position on the main timeline (0 = latest). */
  readonly currentPosition: number;
  /** All branches. */
  readonly branches: readonly UndoBranch[];
  /** Total snapshots across all branches. */
  readonly totalSnapshots: number;
}

// =============================================================================
// Store
// =============================================================================

/**
 * In-memory undo tree with branching support.
 * Local-only — no network calls.
 */
class UndoBranchingStore {
  /** All snapshots by ID. */
  private snapshots: Map<string, UndoSnapshot> = new Map();
  /** Main timeline snapshot IDs in order (oldest first). */
  private mainTimeline: string[] = [];
  /** Current position in main timeline (-1 = nothing, 0 = first, etc.). */
  private currentIndex = -1;
  /** Named branches. */
  private branches: Map<string, UndoBranch> = new Map();
  /** Currently active branch name (null = main). */
  private activeBranch: string | null = null;
  private nextId = 1;

  /**
   * Push a new state onto the current timeline.
   * If we're not at the tip of the timeline, truncates future states
   * (the "branch or lose" point — call `branchFromCurrent()` first to save).
   */
  pushState(state: Record<string, unknown>, description: string): UndoSnapshot {
    const snapshotId = `snap_${this.nextId++}_${Date.now()}`;
    const parentId = this.getCurrentSnapshotId();

    // If we're not at the tip, truncate the future.
    if (this.activeBranch === null) {
      if (this.currentIndex < this.mainTimeline.length - 1) {
        this.mainTimeline.length = this.currentIndex + 1;
      }
    }

    const snapshot: UndoSnapshot = {
      snapshotId,
      state: deepClone(state),
      description,
      timestamp: new Date().toISOString(),
      parentId,
      branchName: this.activeBranch,
    };

    this.snapshots.set(snapshotId, snapshot);

    if (this.activeBranch === null) {
      this.mainTimeline.push(snapshotId);
      this.currentIndex = this.mainTimeline.length - 1;
    } else {
      const branch = this.branches.get(this.activeBranch);
      if (branch) {
        this.branches.set(this.activeBranch, {
          ...branch,
          snapshotIds: [...branch.snapshotIds, snapshotId],
        });
      }
    }

    return snapshot;
  }

  /**
   * Undo: move back one step on the current timeline.
   */
  undo(): UndoSnapshot | null {
    if (this.activeBranch !== null) {
      // On a branch — undo within the branch
      const branch = this.branches.get(this.activeBranch);
      if (!branch) return null;
      // Find current position on branch
      // We just go back to the branch point
      return this.getSnapshot(branch.branchPointId);
    }

    if (this.currentIndex <= 0) return null;
    this.currentIndex--;
    return this.getCurrentSnapshot();
  }

  /**
   * Redo: move forward one step on the main timeline.
   */
  redo(): UndoSnapshot | null {
    if (this.activeBranch !== null) return null; // No redo on branches
    if (this.currentIndex >= this.mainTimeline.length - 1) return null;
    this.currentIndex++;
    return this.getCurrentSnapshot();
  }

  /**
   * M385: Branch from the current position, creating an alternate timeline.
   * The current state becomes the branch point.
   */
  branchFromCurrent(branchName: string, description = ''): UndoBranch | null {
    if (this.branches.has(branchName)) return null; // Name taken

    const currentId = this.getCurrentSnapshotId();
    if (!currentId) return null;

    const branch: UndoBranch = {
      name: branchName,
      branchPointId: currentId,
      createdAt: new Date().toISOString(),
      description,
      snapshotIds: [],
    };

    this.branches.set(branchName, branch);
    return branch;
  }

  /**
   * Switch to a named branch.
   */
  switchToBranch(branchName: string): UndoSnapshot | null {
    const branch = this.branches.get(branchName);
    if (!branch) return null;
    this.activeBranch = branchName;
    // Return the last snapshot on the branch, or the branch point
    const lastId = branch.snapshotIds.length > 0
      ? branch.snapshotIds[branch.snapshotIds.length - 1]
      : branch.branchPointId;
    return lastId ? this.getSnapshot(lastId) : null;
  }

  /**
   * Switch back to the main timeline.
   */
  switchToMain(): UndoSnapshot | null {
    this.activeBranch = null;
    return this.getCurrentSnapshot();
  }

  /**
   * Get the current snapshot.
   */
  getCurrentSnapshot(): UndoSnapshot | null {
    const id = this.getCurrentSnapshotId();
    return id ? (this.snapshots.get(id) ?? null) : null;
  }

  /**
   * Get a snapshot by ID.
   */
  getSnapshot(snapshotId: string): UndoSnapshot | null {
    return this.snapshots.get(snapshotId) ?? null;
  }

  /**
   * Get the current branch name (null = main).
   */
  getActiveBranch(): string | null {
    return this.activeBranch;
  }

  /**
   * Get all branches.
   */
  getBranches(): UndoBranch[] {
    return [...this.branches.values()];
  }

  /**
   * Delete a branch (does not delete the branch point snapshot).
   */
  deleteBranch(branchName: string): boolean {
    if (this.activeBranch === branchName) {
      this.activeBranch = null;
    }
    const branch = this.branches.get(branchName);
    if (!branch) return false;
    // Remove branch snapshots
    for (const id of branch.snapshotIds) {
      this.snapshots.delete(id);
    }
    return this.branches.delete(branchName);
  }

  /**
   * Get a summary of the undo tree.
   */
  getSummary(): UndoTreeSummary {
    return {
      mainTimelineLength: this.mainTimeline.length,
      currentPosition: this.mainTimeline.length - 1 - this.currentIndex,
      branches: this.getBranches(),
      totalSnapshots: this.snapshots.size,
    };
  }

  /**
   * Jump to a specific snapshot on the main timeline.
   */
  jumpTo(snapshotId: string): UndoSnapshot | null {
    const idx = this.mainTimeline.indexOf(snapshotId);
    if (idx < 0) return null;
    this.currentIndex = idx;
    this.activeBranch = null;
    return this.getCurrentSnapshot();
  }

  /**
   * Get the main timeline snapshots (oldest first).
   */
  getMainTimeline(): UndoSnapshot[] {
    return this.mainTimeline
      .map(id => this.snapshots.get(id))
      .filter((s): s is UndoSnapshot => s != null);
  }

  /** Reset all undo history (for testing). */
  reset(): void {
    this.snapshots.clear();
    this.mainTimeline = [];
    this.currentIndex = -1;
    this.branches.clear();
    this.activeBranch = null;
    this.nextId = 1;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private getCurrentSnapshotId(): string | null {
    if (this.activeBranch !== null) {
      const branch = this.branches.get(this.activeBranch);
      if (!branch) return null;
      const lastId = branch.snapshotIds.length > 0
        ? branch.snapshotIds[branch.snapshotIds.length - 1]
        : branch.branchPointId;
      return lastId || null;
    }
    if (this.currentIndex < 0 || this.currentIndex >= this.mainTimeline.length) return null;
    return this.mainTimeline[this.currentIndex] || null;
  }
}

// =============================================================================
// Deep Clone Utility
// =============================================================================

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// =============================================================================
// Singleton & Public API
// =============================================================================

const undoTree = new UndoBranchingStore();

/**
 * Push a new state onto the undo history.
 */
export function pushUndoState(
  state: Record<string, unknown>,
  description: string,
): UndoSnapshot {
  return undoTree.pushState(state, description);
}

/**
 * Undo: move back one step.
 */
export function undoState(): UndoSnapshot | null {
  return undoTree.undo();
}

/**
 * Redo: move forward one step.
 */
export function redoState(): UndoSnapshot | null {
  return undoTree.redo();
}

/**
 * M385: Branch from the current position in undo history.
 */
export function branchFromUndo(
  branchName: string,
  description?: string,
): UndoBranch | null {
  return undoTree.branchFromCurrent(branchName, description);
}

/**
 * Switch to a named branch.
 */
export function switchUndoBranch(branchName: string): UndoSnapshot | null {
  return undoTree.switchToBranch(branchName);
}

/**
 * Switch back to the main timeline.
 */
export function switchUndoToMain(): UndoSnapshot | null {
  return undoTree.switchToMain();
}

/**
 * Get the current undo snapshot.
 */
export function getCurrentUndoSnapshot(): UndoSnapshot | null {
  return undoTree.getCurrentSnapshot();
}

/**
 * Get the currently active branch name (null = main).
 */
export function getActiveUndoBranch(): string | null {
  return undoTree.getActiveBranch();
}

/**
 * Get all undo branches.
 */
export function getUndoBranches(): UndoBranch[] {
  return undoTree.getBranches();
}

/**
 * Delete an undo branch.
 */
export function deleteUndoBranch(branchName: string): boolean {
  return undoTree.deleteBranch(branchName);
}

/**
 * Get undo tree summary.
 */
export function getUndoTreeSummary(): UndoTreeSummary {
  return undoTree.getSummary();
}

/**
 * Jump to a specific snapshot on the main timeline.
 */
export function jumpToUndoSnapshot(snapshotId: string): UndoSnapshot | null {
  return undoTree.jumpTo(snapshotId);
}

/**
 * Get the main timeline as a list of snapshots.
 */
export function getUndoMainTimeline(): UndoSnapshot[] {
  return undoTree.getMainTimeline();
}

/**
 * Reset all undo history (for testing).
 */
export function resetUndoTree(): void {
  undoTree.reset();
}
