/**
 * @fileoverview Pack Version Constraints.
 * 
 * Provides utilities for pack version constraint checking:
 * - Semver constraint parsing and matching
 * - Dependency version resolution
 * - Conflict detection
 * - Update checking
 * 
 * @module @cardplay/user-cards/pack-version
 */

import type { SemverConstraint, CardManifest } from './manifest';
import type { InstalledPack } from './pack';

// ============================================================================
// VERSION PARSING
// ============================================================================

/**
 * Parsed semantic version.
 */
export interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  build?: string;
  raw: string;
}

/**
 * Parses a semver string.
 */
export function parseVersion(version: string): ParsedVersion | null {
  const regex = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
  const match = version.match(regex);
  
  if (!match) return null;
  
  const result: ParsedVersion = {
    major: parseInt(match[1]!, 10),
    minor: parseInt(match[2]!, 10),
    patch: parseInt(match[3]!, 10),
    raw: version,
  };
  
  if (match[4] !== undefined) result.prerelease = match[4];
  if (match[5] !== undefined) result.build = match[5];
  
  return result;
}

/**
 * Compares two versions.
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareVersions(a: string | ParsedVersion, b: string | ParsedVersion): number {
  const vA = typeof a === 'string' ? parseVersion(a) : a;
  const vB = typeof b === 'string' ? parseVersion(b) : b;
  
  if (!vA || !vB) return 0;
  
  if (vA.major !== vB.major) return vA.major - vB.major;
  if (vA.minor !== vB.minor) return vA.minor - vB.minor;
  if (vA.patch !== vB.patch) return vA.patch - vB.patch;
  
  // Handle prerelease
  if (vA.prerelease && !vB.prerelease) return -1;
  if (!vA.prerelease && vB.prerelease) return 1;
  if (vA.prerelease && vB.prerelease) {
    return vA.prerelease.localeCompare(vB.prerelease);
  }
  
  return 0;
}

/**
 * Gets the next major version.
 */
export function nextMajor(version: string): string {
  const v = parseVersion(version);
  if (!v) return version;
  return `${v.major + 1}.0.0`;
}

/**
 * Gets the next minor version.
 */
export function nextMinor(version: string): string {
  const v = parseVersion(version);
  if (!v) return version;
  return `${v.major}.${v.minor + 1}.0`;
}

/**
 * Gets the next patch version.
 */
export function nextPatch(version: string): string {
  const v = parseVersion(version);
  if (!v) return version;
  return `${v.major}.${v.minor}.${v.patch + 1}`;
}

// ============================================================================
// CONSTRAINT MATCHING
// ============================================================================

/**
 * Checks if a version satisfies a constraint.
 */
export function satisfiesConstraint(version: string, constraint: SemverConstraint | string): boolean {
  if (typeof constraint === 'string') {
    return matchRangeString(version, constraint);
  }
  
  const v = parseVersion(version);
  if (!v) return false;
  
  // Exact match
  if (constraint.exact) {
    return version === constraint.exact;
  }
  
  // Min constraint
  if (constraint.min) {
    const min = parseVersion(constraint.min);
    if (min && compareVersions(v, min) < 0) {
      return false;
    }
  }
  
  // Max constraint
  if (constraint.max) {
    const max = parseVersion(constraint.max);
    if (max && compareVersions(v, max) >= 0) {
      return false;
    }
  }
  
  // Range constraint
  if (constraint.range) {
    return matchRangeString(version, constraint.range);
  }
  
  return true;
}

/**
 * Matches a version against a range string.
 */
function matchRangeString(version: string, range: string): boolean {
  const v = parseVersion(version);
  if (!v) return false;
  
  // Exact version
  if (!range.includes('*') && !range.includes('x') && !range.includes('>') && !range.includes('<') && !range.includes('^') && !range.includes('~')) {
    return version === range;
  }
  
  // Caret range (^1.2.3 means >=1.2.3 <2.0.0)
  if (range.startsWith('^')) {
    const base = parseVersion(range.slice(1));
    if (!base) return false;
    
    if (base.major === 0) {
      // ^0.x.y means >=0.x.y <0.(x+1).0
      return v.major === 0 && v.minor === base.minor && compareVersions(v, base) >= 0;
    }
    
    return v.major === base.major && compareVersions(v, base) >= 0;
  }
  
  // Tilde range (~1.2.3 means >=1.2.3 <1.3.0)
  if (range.startsWith('~')) {
    const base = parseVersion(range.slice(1));
    if (!base) return false;
    
    return v.major === base.major && v.minor === base.minor && compareVersions(v, base) >= 0;
  }
  
  // Wildcard (1.2.* or 1.2.x)
  if (range.includes('*') || range.includes('x')) {
    const parts = range.split('.');
    
    if (parts[0] && parts[0] !== '*' && parts[0] !== 'x') {
      if (v.major !== parseInt(parts[0], 10)) return false;
    }
    
    if (parts[1] && parts[1] !== '*' && parts[1] !== 'x') {
      if (v.minor !== parseInt(parts[1], 10)) return false;
    }
    
    if (parts[2] && parts[2] !== '*' && parts[2] !== 'x') {
      if (v.patch !== parseInt(parts[2], 10)) return false;
    }
    
    return true;
  }
  
  // Comparison operators (>=1.2.3, <2.0.0, etc.)
  if (range.startsWith('>=')) {
    const base = parseVersion(range.slice(2).trim());
    return base ? compareVersions(v, base) >= 0 : false;
  }
  
  if (range.startsWith('>')) {
    const base = parseVersion(range.slice(1).trim());
    return base ? compareVersions(v, base) > 0 : false;
  }
  
  if (range.startsWith('<=')) {
    const base = parseVersion(range.slice(2).trim());
    return base ? compareVersions(v, base) <= 0 : false;
  }
  
  if (range.startsWith('<')) {
    const base = parseVersion(range.slice(1).trim());
    return base ? compareVersions(v, base) < 0 : false;
  }
  
  // Range (1.2.3 - 2.3.4)
  if (range.includes(' - ')) {
    const [min, max] = range.split(' - ').map(s => s.trim());
    if (!min || !max) return false;
    
    const minVer = parseVersion(min);
    const maxVer = parseVersion(max);
    
    if (!minVer || !maxVer) return false;
    
    return compareVersions(v, minVer) >= 0 && compareVersions(v, maxVer) <= 0;
  }
  
  // OR ranges (1.2.3 || 2.3.4)
  if (range.includes('||')) {
    const parts = range.split('||').map(s => s.trim());
    return parts.some(part => matchRangeString(version, part));
  }
  
  // AND ranges (>=1.2.3 <2.0.0)
  if (range.includes(' ') && !range.includes('-')) {
    const parts = range.split(' ').filter(s => s.trim());
    return parts.every(part => matchRangeString(version, part));
  }
  
  return false;
}

/**
 * Finds the highest version that satisfies a constraint.
 */
export function selectBestVersion(
  versions: string[],
  constraint: SemverConstraint | string
): string | null {
  const satisfying = versions.filter(v => satisfiesConstraint(v, constraint));
  
  if (satisfying.length === 0) return null;
  
  return satisfying.sort(compareVersions).reverse()[0]!;
}

// ============================================================================
// DEPENDENCY RESOLUTION
// ============================================================================

/**
 * Dependency resolution result.
 */
export interface DependencyResolution {
  name: string;
  requestedVersion: SemverConstraint | string;
  resolvedVersion: string;
  satisfied: boolean;
  available: string[];
}

/**
 * Resolves dependencies against available versions.
 */
export function resolveDependencies(
  manifest: CardManifest,
  availableVersions: Map<string, string[]>
): Map<string, DependencyResolution> {
  const resolutions = new Map<string, DependencyResolution>();
  
  const deps = manifest.dependencies ?? {};
  
  for (const [name, constraint] of Object.entries(deps)) {
    const available = availableVersions.get(name) ?? [];
    const resolved = selectBestVersion(available, constraint);
    
    resolutions.set(name, {
      name,
      requestedVersion: constraint,
      resolvedVersion: resolved ?? '',
      satisfied: resolved !== null,
      available,
    });
  }
  
  return resolutions;
}

/**
 * Checks for dependency conflicts.
 */
export interface DependencyConflict {
  dependency: string;
  requiredBy: Array<{ package: string; constraint: SemverConstraint | string }>;
  reason: string;
}

/**
 * Detects dependency conflicts in a set of packages.
 */
export function detectConflicts(packages: CardManifest[]): DependencyConflict[] {
  const conflicts: DependencyConflict[] = [];
  const requirements = new Map<string, Array<{ package: string; constraint: SemverConstraint | string }>>();
  
  // Collect all requirements
  for (const pkg of packages) {
    const deps = pkg.dependencies ?? {};
    
    for (const [depName, constraint] of Object.entries(deps)) {
      if (!requirements.has(depName)) {
        requirements.set(depName, []);
      }
      requirements.get(depName)!.push({
        package: pkg.name,
        constraint,
      });
    }
  }
  
  // Check for conflicting requirements
  for (const [depName, reqs] of requirements) {
    if (reqs.length < 2) continue;
    
    // Try to find a version that satisfies all constraints
    const allConstraints = reqs.map(r => r.constraint);
    const hasConflict = !hasCommonVersion(allConstraints);
    
    if (hasConflict) {
      conflicts.push({
        dependency: depName,
        requiredBy: reqs,
        reason: 'No version satisfies all constraints',
      });
    }
  }
  
  return conflicts;
}

/**
 * Checks if there's any version that satisfies all constraints.
 */
function hasCommonVersion(constraints: Array<SemverConstraint | string>): boolean {
  // Generate a test range of versions
  const testVersions = generateVersionRange('0.0.0', '100.0.0');
  
  for (const version of testVersions) {
    if (constraints.every(c => satisfiesConstraint(version, c))) {
      return true;
    }
  }
  
  return false;
}

/**
 * Generates a range of version strings for testing.
 */
function generateVersionRange(min: string, max: string): string[] {
  const versions: string[] = [];
  const minV = parseVersion(min);
  const maxV = parseVersion(max);
  
  if (!minV || !maxV) return [];
  
  // Generate a reasonable sampling
  for (let major = minV.major; major <= maxV.major && major < 100; major++) {
    for (let minor = 0; minor < 10; minor++) {
      for (let patch = 0; patch < 10; patch++) {
        versions.push(`${major}.${minor}.${patch}`);
      }
    }
  }
  
  return versions;
}

// ============================================================================
// UPDATE CHECKING
// ============================================================================

/**
 * Update check result.
 */
export interface UpdateCheck {
  package: string;
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  updateType: 'major' | 'minor' | 'patch' | 'prerelease' | 'none';
  breaking: boolean;
}

/**
 * Checks for package updates.
 */
export function checkForUpdates(
  installed: InstalledPack[],
  available: Map<string, string[]>
): UpdateCheck[] {
  const checks: UpdateCheck[] = [];
  
  for (const pkg of installed) {
    const versions = available.get(pkg.name) ?? [];
    const latest = versions.sort(compareVersions).reverse()[0];
    
    if (!latest) {
      checks.push({
        package: pkg.name,
        currentVersion: pkg.version,
        latestVersion: pkg.version,
        updateAvailable: false,
        updateType: 'none',
        breaking: false,
      });
      continue;
    }
    
    const current = parseVersion(pkg.version);
    const latestParsed = parseVersion(latest);
    
    if (!current || !latestParsed) continue;
    
    const comparison = compareVersions(current, latestParsed);
    const updateAvailable = comparison < 0;
    
    let updateType: UpdateCheck['updateType'] = 'none';
    let breaking = false;
    
    if (updateAvailable) {
      if (latestParsed.major > current.major) {
        updateType = 'major';
        breaking = true;
      } else if (latestParsed.minor > current.minor) {
        updateType = 'minor';
      } else if (latestParsed.patch > current.patch) {
        updateType = 'patch';
      } else if (latestParsed.prerelease) {
        updateType = 'prerelease';
      }
    }
    
    checks.push({
      package: pkg.name,
      currentVersion: pkg.version,
      latestVersion: latest,
      updateAvailable,
      updateType,
      breaking,
    });
  }
  
  return checks;
}

/**
 * Formats update check results.
 */
export function formatUpdateChecks(checks: UpdateCheck[]): string {
  const lines: string[] = [];
  
  const withUpdates = checks.filter(c => c.updateAvailable);
  
  if (withUpdates.length === 0) {
    return 'All packages are up to date.';
  }
  
  lines.push(`${withUpdates.length} package(s) have updates available:\n`);
  
  for (const check of withUpdates) {
    const symbol = check.breaking ? '⚠️ ' : '✓ ';
    lines.push(`${symbol}${check.package}: ${check.currentVersion} → ${check.latestVersion} (${check.updateType})`);
  }
  
  return lines.join('\n');
}
