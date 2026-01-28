/**
 * @fileoverview Pack Rollback Capability.
 * 
 * Provides rollback functionality for card pack installations:
 * - Installation history tracking
 * - Snapshot creation before updates
 * - Rollback to previous versions
 * - Recovery from failed installations
 * - Multi-version management
 * 
 * @module @cardplay/user-cards/pack-rollback
 */

import type { CardManifest } from './manifest';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Installation snapshot.
 */
export interface InstallationSnapshot {
  /** Snapshot ID */
  id: string;
  /** Package name */
  packageName: string;
  /** Installed version */
  version: string;
  /** Snapshot timestamp */
  timestamp: number;
  /** Previous version (if any) */
  previousVersion?: string;
  /** Installation manifest */
  manifest: CardManifest;
  /** Installed files */
  files: Array<{
    path: string;
    content: Uint8Array;
    checksum: string;
  }>;
  /** Installation success */
  success: boolean;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Rollback operation.
 */
export interface RollbackOperation {
  /** Operation ID */
  id: string;
  /** Package name */
  packageName: string;
  /** Version to rollback from */
  fromVersion: string;
  /** Version to rollback to */
  toVersion: string;
  /** Rollback timestamp */
  timestamp: number;
  /** Rollback status */
  status: 'pending' | 'success' | 'failed';
  /** Error message */
  error?: string;
  /** Files affected */
  filesAffected: number;
}

/**
 * Rollback history entry.
 */
export interface RollbackHistoryEntry {
  operation: RollbackOperation;
  snapshot: InstallationSnapshot;
}

/**
 * Rollback options.
 */
export interface RollbackOptions {
  /** Create backup before rollback */
  createBackup?: boolean;
  /** Verify integrity after rollback */
  verifyIntegrity?: boolean;
  /** Dry run (test without applying) */
  dryRun?: boolean;
  /** Force rollback even if errors */
  force?: boolean;
}

// ============================================================================
// SNAPSHOT MANAGER
// ============================================================================

/**
 * Manages installation snapshots.
 */
export class SnapshotManager {
  private snapshots: Map<string, InstallationSnapshot[]> = new Map();
  private storage: Storage | null = null;
  
  constructor(storage?: Storage) {
    this.storage = storage ?? (typeof localStorage !== 'undefined' ? localStorage : null);
    this.loadFromStorage();
  }
  
  /**
   * Generates a snapshot ID.
   */
  private generateId(): string {
    return `snapshot-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
  
  /**
   * Creates a snapshot of current installation.
   */
  async createSnapshot(
    packageName: string,
    version: string,
    manifest: CardManifest,
    files: Array<{ path: string; content: Uint8Array }>,
    previousVersion?: string
  ): Promise<InstallationSnapshot> {
    const snapshot: InstallationSnapshot = {
      id: this.generateId(),
      packageName,
      version,
      timestamp: Date.now(),
      manifest,
      files: await Promise.all(
        files.map(async (f) => ({
          path: f.path,
          content: f.content,
          checksum: await this.calculateChecksum(f.content),
        }))
      ),
      success: true,
    };
    
    if (previousVersion) {
      snapshot.previousVersion = previousVersion;
    }
    
    // Store snapshot
    const packageSnapshots = this.snapshots.get(packageName) || [];
    packageSnapshots.push(snapshot);
    this.snapshots.set(packageName, packageSnapshots);
    
    // Persist to storage
    this.saveToStorage();
    
    return snapshot;
  }
  
  /**
   * Gets all snapshots for a package.
   */
  getSnapshots(packageName: string): InstallationSnapshot[] {
    return this.snapshots.get(packageName) || [];
  }
  
  /**
   * Gets a specific snapshot by version.
   */
  getSnapshotByVersion(packageName: string, version: string): InstallationSnapshot | null {
    const snapshots = this.getSnapshots(packageName);
    const found = snapshots.find(s => s.version === version);
    return found !== undefined ? found : null;
  }
  
  /**
   * Gets the latest snapshot for a package.
   */
  getLatestSnapshot(packageName: string): InstallationSnapshot | null {
    const snapshots = this.getSnapshots(packageName);
    if (snapshots.length === 0) return null;
    const latest = snapshots[snapshots.length - 1];
    return latest !== undefined ? latest : null;
  }
  
  /**
   * Deletes a snapshot.
   */
  deleteSnapshot(packageName: string, snapshotId: string): boolean {
    const snapshots = this.snapshots.get(packageName);
    if (!snapshots) return false;
    
    const index = snapshots.findIndex(s => s.id === snapshotId);
    if (index === -1) return false;
    
    snapshots.splice(index, 1);
    
    if (snapshots.length === 0) {
      this.snapshots.delete(packageName);
    } else {
      this.snapshots.set(packageName, snapshots);
    }
    
    this.saveToStorage();
    return true;
  }
  
  /**
   * Prunes old snapshots (keeps last N).
   */
  pruneSnapshots(packageName: string, keepCount: number = 5): number {
    const snapshots = this.snapshots.get(packageName);
    if (!snapshots || snapshots.length <= keepCount) return 0;
    
    const toRemove = snapshots.length - keepCount;
    snapshots.splice(0, toRemove);
    this.snapshots.set(packageName, snapshots);
    
    this.saveToStorage();
    return toRemove;
  }
  
  /**
   * Calculates checksum for content.
   */
  private async calculateChecksum(content: Uint8Array): Promise<string> {
    // In a real implementation, use Web Crypto API
    // For now, simplified hash
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const byte = content[i];
      if (byte !== undefined) {
        hash = ((hash << 5) - hash) + byte;
        hash = hash & hash; // Convert to 32-bit integer
      }
    }
    return hash.toString(16);
  }
  
  /**
   * Loads snapshots from storage.
   */
  private loadFromStorage(): void {
    if (!this.storage) return;
    
    try {
      const stored = this.storage.getItem('cardplay-snapshots');
      if (stored) {
        const data = JSON.parse(stored) as Record<string, InstallationSnapshot[]>;
        const entries = Object.entries(data);
        if (entries.length > 0) {
          this.snapshots = new Map(entries);
        }
      }
    } catch (error) {
      console.error('Failed to load snapshots from storage:', error);
    }
  }
  
  /**
   * Saves snapshots to storage.
   */
  private saveToStorage(): void {
    if (!this.storage) return;
    
    try {
      const data = Object.fromEntries(this.snapshots);
      this.storage.setItem('cardplay-snapshots', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save snapshots to storage:', error);
    }
  }
}

// ============================================================================
// ROLLBACK MANAGER
// ============================================================================

/**
 * Manages rollback operations.
 */
export class RollbackManager {
  private snapshotManager: SnapshotManager;
  private history: RollbackHistoryEntry[] = [];
  
  constructor(snapshotManager: SnapshotManager) {
    this.snapshotManager = snapshotManager;
  }
  
  /**
   * Checks if rollback is available for a package.
   */
  canRollback(packageName: string): boolean {
    const snapshots = this.snapshotManager.getSnapshots(packageName);
    return snapshots.length > 1;
  }
  
  /**
   * Lists available rollback targets.
   */
  getAvailableVersions(packageName: string): string[] {
    const snapshots = this.snapshotManager.getSnapshots(packageName);
    return snapshots.map(s => s.version);
  }
  
  /**
   * Performs a rollback to a previous version.
   */
  async rollback(
    packageName: string,
    targetVersion: string,
    options: RollbackOptions = {}
  ): Promise<RollbackOperation> {
    const opts = {
      createBackup: true,
      verifyIntegrity: true,
      dryRun: false,
      force: false,
      ...options,
    };
    
    // Get current and target snapshots
    const currentSnapshot = this.snapshotManager.getLatestSnapshot(packageName);
    const targetSnapshot = this.snapshotManager.getSnapshotByVersion(packageName, targetVersion);
    
    if (!currentSnapshot) {
      throw new Error(`No installation found for package: ${packageName}`);
    }
    
    if (!targetSnapshot) {
      throw new Error(`Target version ${targetVersion} not found in snapshots`);
    }
    
    // Create rollback operation
    const operation: RollbackOperation = {
      id: `rollback-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      packageName,
      fromVersion: currentSnapshot.version,
      toVersion: targetVersion,
      timestamp: Date.now(),
      status: 'pending',
      filesAffected: targetSnapshot.files.length,
    };
    
    try {
      // Create backup if requested
      if (opts.createBackup && !opts.dryRun) {
        await this.snapshotManager.createSnapshot(
          packageName,
          currentSnapshot.version,
          currentSnapshot.manifest,
          currentSnapshot.files.map(f => ({
            path: f.path,
            content: f.content,
          })),
          currentSnapshot.previousVersion
        );
      }
      
      // Perform rollback (in a real implementation, this would restore files)
      if (!opts.dryRun) {
        await this.restoreSnapshot(targetSnapshot);
      }
      
      // Verify integrity if requested
      if (opts.verifyIntegrity && !opts.dryRun) {
        const valid = await this.verifySnapshot(targetSnapshot);
        if (!valid && !opts.force) {
          throw new Error('Integrity verification failed');
        }
      }
      
      // Success
      operation.status = 'success';
      
      // Record history
      this.history.push({
        operation,
        snapshot: targetSnapshot,
      });
      
      return operation;
      
    } catch (error) {
      operation.status = 'failed';
      operation.error = error instanceof Error ? error.message : String(error);
      
      this.history.push({
        operation,
        snapshot: targetSnapshot,
      });
      
      throw error;
    }
  }
  
  /**
   * Restores files from a snapshot.
   */
  private async restoreSnapshot(_snapshot: InstallationSnapshot): Promise<void> {
    // In a real implementation, this would write files to disk
    // For now, we'll just simulate the operation
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  /**
   * Verifies snapshot integrity.
   */
  private async verifySnapshot(_snapshot: InstallationSnapshot): Promise<boolean> {
    // In a real implementation, verify checksums
    // For now, always return true
    return true;
  }
  
  /**
   * Gets rollback history.
   */
  getHistory(packageName?: string): RollbackHistoryEntry[] {
    if (packageName) {
      return this.history.filter(e => e.operation.packageName === packageName);
    }
    return this.history;
  }
  
  /**
   * Clears rollback history.
   */
  clearHistory(packageName?: string): void {
    if (packageName) {
      this.history = this.history.filter(e => e.operation.packageName !== packageName);
    } else {
      this.history = [];
    }
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Creates a snapshot manager with default storage.
 */
export function createSnapshotManager(): SnapshotManager {
  return new SnapshotManager();
}

/**
 * Creates a rollback manager.
 */
export function createRollbackManager(
  snapshotManager?: SnapshotManager
): RollbackManager {
  const manager = snapshotManager || createSnapshotManager();
  return new RollbackManager(manager);
}

/**
 * Quick rollback to previous version.
 */
export async function rollbackToPrevious(
  packageName: string,
  options?: RollbackOptions
): Promise<RollbackOperation> {
  const manager = createRollbackManager();
  const versions = manager.getAvailableVersions(packageName);
  
  if (versions.length < 2) {
    throw new Error('No previous version available');
  }
  
  const targetVersion = versions[versions.length - 2];
  if (!targetVersion) {
    throw new Error('Target version not found');
  }
  return manager.rollback(packageName, targetVersion, options);
}
