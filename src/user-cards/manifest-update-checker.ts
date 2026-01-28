/**
 * @fileoverview Manifest Update Checker.
 * 
 * Provides automatic update checking for installed card packs:
 * - Check for available updates
 * - Version comparison and compatibility
 * - Update notifications
 * - Automatic/manual update workflows
 * - Update scheduling
 * 
 * @module @cardplay/user-cards/manifest-update-checker
 */

import type { CardManifest } from './manifest';
import type { RegistryClient } from './manifest-registry';
import { createRegistryClient } from './manifest-registry';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Update status for a package.
 */
export type UpdateStatus = 
  | 'up-to-date'
  | 'update-available'
  | 'major-update'
  | 'security-update'
  | 'deprecated'
  | 'unknown';

/**
 * Update information.
 */
export interface UpdateInfo {
  /** Package name */
  name: string;
  /** Current version */
  currentVersion: string;
  /** Latest version */
  latestVersion: string;
  /** Update status */
  status: UpdateStatus;
  /** Is major version change */
  isMajor: boolean;
  /** Is minor version change */
  isMinor: boolean;
  /** Is patch version change */
  isPatch: boolean;
  /** Changelog excerpt */
  changelog?: string;
  /** Breaking changes warning */
  breakingChanges?: string[];
  /** Security fixes */
  securityFixes?: string[];
  /** Package is deprecated */
  deprecated?: boolean;
  /** Deprecation message */
  deprecationMessage?: string;
  /** Update URL */
  updateUrl?: string;
}

/**
 * Update check result.
 */
export interface UpdateCheckResult {
  /** Total packages checked */
  total: number;
  /** Packages with updates */
  updatesAvailable: number;
  /** Security updates available */
  securityUpdates: number;
  /** Deprecated packages */
  deprecated: number;
  /** Update details */
  updates: UpdateInfo[];
  /** Timestamp of check */
  checkedAt: number;
}

/**
 * Update check options.
 */
export interface UpdateCheckOptions {
  /** Registry URL */
  registry?: string;
  /** Check prerelease versions */
  includePrerelease?: boolean;
  /** Check dev dependencies */
  includeDevDeps?: boolean;
  /** Check peer dependencies */
  includePeerDeps?: boolean;
  /** Timeout (ms) */
  timeout?: number;
  /** Parallel checks */
  parallel?: number;
}

/**
 * Update scheduler options.
 */
export interface UpdateScheduleOptions {
  /** Check interval (ms) */
  interval?: number;
  /** Auto-check on startup */
  checkOnStartup?: boolean;
  /** Auto-install patch updates */
  autoInstallPatch?: boolean;
  /** Notify for major updates */
  notifyMajor?: boolean;
  /** Notify for minor updates */
  notifyMinor?: boolean;
}

// ============================================================================
// VERSION COMPARISON
// ============================================================================

/**
 * Parses a semver string into components.
 */
function parseSemver(version: string): { major: number; minor: number; patch: number; prerelease?: string } {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
  if (!match) {
    throw new Error(`Invalid semver: ${version}`);
  }
  
  const result: { major: number; minor: number; patch: number; prerelease?: string } = {
    major: parseInt(match[1] || '0', 10),
    minor: parseInt(match[2] || '0', 10),
    patch: parseInt(match[3] || '0', 10),
  };
  if (match[4]) {
    result.prerelease = match[4];
  }
  return result;
}

/**
 * Compares two semver versions (internal).
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
function compareSemverInternal(a: string, b: string): number {
  const va = parseSemver(a);
  const vb = parseSemver(b);
  
  if (va.major !== vb.major) return va.major - vb.major;
  if (va.minor !== vb.minor) return va.minor - vb.minor;
  if (va.patch !== vb.patch) return va.patch - vb.patch;
  
  // Handle prerelease
  const aHasPre = !!va.prerelease;
  const bHasPre = !!vb.prerelease;
  
  if (aHasPre && !bHasPre) return -1;
  if (!aHasPre && bHasPre) return 1;
  if (aHasPre && bHasPre && va.prerelease && vb.prerelease) {
    return va.prerelease.localeCompare(vb.prerelease);
  }
  
  return 0;
}

/**
 * Compares two semver versions.
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareSemver(a: string, b: string): number {
  return compareSemverInternal(a, b);
}

/**
 * Checks if an update is a major version change.
 */
function isMajorUpdate(current: string, latest: string): boolean {
  const curr = parseSemver(current);
  const last = parseSemver(latest);
  return last.major > curr.major;
}

/**
 * Checks if an update is a minor version change.
 */
function isMinorUpdate(current: string, latest: string): boolean {
  const curr = parseSemver(current);
  const last = parseSemver(latest);
  return last.major === curr.major && last.minor > curr.minor;
}

/**
 * Checks if an update is a patch version change.
 */
function isPatchUpdate(current: string, latest: string): boolean {
  const curr = parseSemver(current);
  const last = parseSemver(latest);
  return last.major === curr.major && last.minor === curr.minor && last.patch > curr.patch;
}

// ============================================================================
// UPDATE CHECKER
// ============================================================================

/**
 * Update checker for card packs.
 */
export class UpdateChecker {
  private client: RegistryClient;
  private options: Required<UpdateCheckOptions>;
  private cache: Map<string, UpdateInfo> = new Map();
  private lastCheck: number = 0;
  
  constructor(options: UpdateCheckOptions = {}) {
    this.options = {
      registry: 'https://registry.cardplay.app',
      includePrerelease: false,
      includeDevDeps: false,
      includePeerDeps: false,
      timeout: 30000,
      parallel: 5,
      ...options,
    };
    
    this.client = createRegistryClient(this.options.registry);
  }
  
  /**
   * Checks for updates for a single package.
   */
  async checkPackage(manifest: CardManifest): Promise<UpdateInfo> {
    const name = manifest.name;
    const currentVersion = manifest.version;
    
    // Check cache
    const cached = this.cache.get(`${name}@${currentVersion}`);
    if (cached && Date.now() - this.lastCheck < 60000) { // 1 minute cache
      return cached;
    }
    
    try {
      // Fetch latest version from registry
      const response = await this.client.getPackage(name);
      
      if (!response.success || !response.data) {
        return {
          name,
          currentVersion,
          latestVersion: currentVersion,
          status: 'unknown',
          isMajor: false,
          isMinor: false,
          isPatch: false,
        };
      }
      
      const metadata = response.data;
      const latestVersion = metadata.latestVersion;
      
      // Compare versions
      const comparison = compareSemverInternal(currentVersion, latestVersion);
      const isMajor = isMajorUpdate(currentVersion, latestVersion);
      const isMinor = isMinorUpdate(currentVersion, latestVersion);
      const isPatch = isPatchUpdate(currentVersion, latestVersion);
      
      // Determine status
      let status: UpdateStatus = 'up-to-date';
      if (metadata.deprecated) {
        status = 'deprecated';
      } else if (comparison < 0) {
        status = isMajor ? 'major-update' : 'update-available';
      }
      
      const updateInfo: UpdateInfo = {
        name,
        currentVersion,
        latestVersion,
        status,
        isMajor,
        isMinor,
        isPatch,
        updateUrl: `${this.options.registry}/package/${name}@${latestVersion}`,
      };
      
      if (metadata.deprecated !== undefined) {
        updateInfo.deprecated = metadata.deprecated;
      }
      if (metadata.deprecationMessage) {
        updateInfo.deprecationMessage = metadata.deprecationMessage;
      }
      
      // Cache result
      this.cache.set(`${name}@${currentVersion}`, updateInfo);
      
      return updateInfo;
      
    } catch (error) {
      console.error(`Failed to check updates for ${name}:`, error);
      return {
        name,
        currentVersion,
        latestVersion: currentVersion,
        status: 'unknown',
        isMajor: false,
        isMinor: false,
        isPatch: false,
      };
    }
  }
  
  /**
   * Checks for updates for multiple packages.
   */
  async checkPackages(manifests: CardManifest[]): Promise<UpdateCheckResult> {
    this.lastCheck = Date.now();
    
    const updates: UpdateInfo[] = [];
    
    // Process in parallel batches
    for (let i = 0; i < manifests.length; i += this.options.parallel) {
      const batch = manifests.slice(i, i + this.options.parallel);
      const batchResults = await Promise.all(
        batch.map(m => this.checkPackage(m))
      );
      updates.push(...batchResults);
    }
    
    // Calculate statistics
    const updatesAvailable = updates.filter(
      u => u.status === 'update-available' || u.status === 'major-update' || u.status === 'security-update'
    ).length;
    
    const securityUpdates = updates.filter(u => u.status === 'security-update').length;
    const deprecated = updates.filter(u => u.deprecated).length;
    
    return {
      total: manifests.length,
      updatesAvailable,
      securityUpdates,
      deprecated,
      updates,
      checkedAt: this.lastCheck,
    };
  }
  
  /**
   * Clears the update cache.
   */
  clearCache(): void {
    this.cache.clear();
    this.lastCheck = 0;
  }
}

// ============================================================================
// UPDATE SCHEDULER
// ============================================================================

/**
 * Schedules automatic update checks.
 */
export class UpdateScheduler {
  private checker: UpdateChecker;
  private options: Required<UpdateScheduleOptions>;
  private intervalId: number | null = null;
  private listeners: Set<(result: UpdateCheckResult) => void> = new Set();
  
  constructor(
    checker: UpdateChecker,
    options: UpdateScheduleOptions = {}
  ) {
    this.checker = checker;
    this.options = {
      interval: 3600000, // 1 hour
      checkOnStartup: true,
      autoInstallPatch: false,
      notifyMajor: true,
      notifyMinor: true,
      ...options,
    };
  }
  
  /**
   * Adds an update listener.
   */
  onUpdate(callback: (result: UpdateCheckResult) => void): void {
    this.listeners.add(callback);
  }
  
  /**
   * Removes an update listener.
   */
  offUpdate(callback: (result: UpdateCheckResult) => void): void {
    this.listeners.delete(callback);
  }
  
  /**
   * Notifies all listeners.
   */
  private notify(result: UpdateCheckResult): void {
    for (const listener of this.listeners) {
      listener(result);
    }
  }
  
  /**
   * Starts the update scheduler.
   */
  start(manifests: CardManifest[]): void {
    if (this.intervalId !== null) {
      return; // Already running
    }
    
    const checkUpdates = async () => {
      const result = await this.checker.checkPackages(manifests);
      this.notify(result);
    };
    
    // Check on startup if enabled
    if (this.options.checkOnStartup) {
      checkUpdates();
    }
    
    // Schedule periodic checks
    this.intervalId = window.setInterval(checkUpdates, this.options.interval);
  }
  
  /**
   * Stops the update scheduler.
   */
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  /**
   * Checks if scheduler is running.
   */
  isRunning(): boolean {
    return this.intervalId !== null;
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick update check for a single package.
 */
export async function checkForUpdates(manifest: CardManifest): Promise<UpdateInfo> {
  const checker = new UpdateChecker();
  return checker.checkPackage(manifest);
}

/**
 * Quick update check for multiple packages.
 */
export async function checkAllUpdates(manifests: CardManifest[]): Promise<UpdateCheckResult> {
  const checker = new UpdateChecker();
  return checker.checkPackages(manifests);
}
