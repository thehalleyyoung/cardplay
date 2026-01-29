/**
 * @fileoverview Project Versioning System
 *
 * M308: Version naming conventions for project versions.
 * M309: Project version save/load with naming.
 * M310: Project comparison view (diff between versions).
 *
 * Provides local-only, in-memory project version management.
 * Each version is a named snapshot of project state (JSON-serialisable).
 *
 * @module @cardplay/ai/learning/project-versioning
 */

import { getPrologAdapter, type PrologAdapter } from '../engine/prolog-adapter';
import { loadPersonaKB } from '../knowledge/persona-loader';

// =============================================================================
// Types
// =============================================================================

/** M308: Version naming convention. */
export interface VersionNamingConvention {
  readonly id: string;
  readonly description: string;
}

/** A saved project version. */
export interface ProjectVersion {
  readonly versionId: string;
  readonly versionName: string;
  readonly convention: string;
  readonly createdAt: string;
  readonly projectData: Record<string, unknown>;
  readonly tags: readonly string[];
  readonly notes: string;
}

/** A diff entry between two project versions. */
export interface VersionDiffEntry {
  readonly path: string;
  readonly type: 'added' | 'removed' | 'changed';
  readonly oldValue?: unknown;
  readonly newValue?: unknown;
}

/** Result of comparing two versions. */
export interface VersionComparison {
  readonly fromVersion: string;
  readonly toVersion: string;
  readonly totalChanges: number;
  readonly additions: number;
  readonly removals: number;
  readonly modifications: number;
  readonly diffs: readonly VersionDiffEntry[];
}

// =============================================================================
// Version Store
// =============================================================================

/**
 * In-memory project version store.
 * Local-only — no network calls.
 */
class ProjectVersionStore {
  private versions: Map<string, ProjectVersion> = new Map();
  private nextId = 1;

  /**
   * M309: Save a new project version.
   *
   * @param name - Human-readable version name.
   * @param convention - Naming convention used (e.g., 'date_based').
   * @param projectData - Snapshot of the project state.
   * @param tags - Optional tags for categorisation.
   * @param notes - Optional notes about this version.
   */
  save(
    name: string,
    convention: string,
    projectData: Record<string, unknown>,
    tags: string[] = [],
    notes = ''
  ): ProjectVersion {
    const versionId = `v${this.nextId++}_${Date.now()}`;
    const version: ProjectVersion = {
      versionId,
      versionName: name,
      convention,
      createdAt: new Date().toISOString(),
      projectData: structuredCloneShallow(projectData),
      tags,
      notes,
    };
    this.versions.set(versionId, version);
    return version;
  }

  /**
   * M309: Load a project version by ID.
   */
  load(versionId: string): ProjectVersion | null {
    return this.versions.get(versionId) ?? null;
  }

  /**
   * M309: List all saved versions, newest first.
   */
  listVersions(): ProjectVersion[] {
    return [...this.versions.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * M309: Delete a version.
   */
  deleteVersion(versionId: string): boolean {
    return this.versions.delete(versionId);
  }

  /**
   * M310: Compare two versions and return a diff.
   */
  compare(fromVersionId: string, toVersionId: string): VersionComparison | null {
    const fromVersion = this.versions.get(fromVersionId);
    const toVersion = this.versions.get(toVersionId);
    if (!fromVersion || !toVersion) return null;

    const diffs = diffObjects(fromVersion.projectData, toVersion.projectData);

    return {
      fromVersion: fromVersionId,
      toVersion: toVersionId,
      totalChanges: diffs.length,
      additions: diffs.filter((d) => d.type === 'added').length,
      removals: diffs.filter((d) => d.type === 'removed').length,
      modifications: diffs.filter((d) => d.type === 'changed').length,
      diffs,
    };
  }

  /**
   * Get count of stored versions.
   */
  count(): number {
    return this.versions.size;
  }

  /**
   * Clear all versions.
   */
  reset(): void {
    this.versions.clear();
    this.nextId = 1;
  }

  /**
   * Export all versions as a JSON-serialisable array.
   */
  exportAll(): ProjectVersion[] {
    return this.listVersions();
  }

  /**
   * Import versions (additive).
   */
  importVersions(versions: ProjectVersion[]): void {
    for (const v of versions) {
      if (!this.versions.has(v.versionId)) {
        this.versions.set(v.versionId, v);
      }
    }
  }
}

// =============================================================================
// Diff Utilities
// =============================================================================

/**
 * Shallow diff two objects, returning a flat list of changes.
 * Operates on the top-level keys only (one level deep).
 */
function diffObjects(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>,
  prefix = ''
): VersionDiffEntry[] {
  const diffs: VersionDiffEntry[] = [];
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  for (const key of allKeys) {
    const path = prefix ? `${prefix}.${key}` : key;
    const hasOld = key in oldObj;
    const hasNew = key in newObj;

    if (hasOld && !hasNew) {
      diffs.push({ path, type: 'removed', oldValue: oldObj[key] });
    } else if (!hasOld && hasNew) {
      diffs.push({ path, type: 'added', newValue: newObj[key] });
    } else if (hasOld && hasNew) {
      const oldVal = oldObj[key];
      const newVal = newObj[key];

      // Deep compare for nested objects (one more level)
      if (
        typeof oldVal === 'object' && oldVal !== null &&
        typeof newVal === 'object' && newVal !== null &&
        !Array.isArray(oldVal) && !Array.isArray(newVal)
      ) {
        diffs.push(
          ...diffObjects(
            oldVal as Record<string, unknown>,
            newVal as Record<string, unknown>,
            path
          )
        );
      } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        diffs.push({ path, type: 'changed', oldValue: oldVal, newValue: newVal });
      }
    }
  }

  return diffs;
}

/**
 * Shallow clone a record (one level deep).
 */
function structuredCloneShallow(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null) {
      result[key] = JSON.parse(JSON.stringify(value));
    } else {
      result[key] = value;
    }
  }
  return result;
}

// =============================================================================
// Version Naming Helpers
// =============================================================================

/**
 * M308: Generate a version name using a naming convention.
 */
export function generateVersionName(
  convention: string,
  projectName = 'Untitled',
  sequenceNumber = 1
): string {
  switch (convention) {
    case 'date_based':
      return `${projectName} – ${new Date().toISOString().slice(0, 10)}`;
    case 'numbered':
      return `${projectName} v${sequenceNumber}`;
    case 'milestone':
      return `${projectName} – Milestone ${sequenceNumber}`;
    case 'descriptive':
      return `${projectName} – Draft ${sequenceNumber}`;
    default:
      return `${projectName} v${sequenceNumber}`;
  }
}

/**
 * M308: Get naming conventions from the Prolog KB.
 */
export async function getVersionNamingConventions(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<VersionNamingConvention[]> {
  await loadPersonaKB('producer', adapter);
  const results = await adapter.queryAll(
    'version_naming_convention(Id, Description)'
  );
  if (results.length > 0) {
    return results.map((r) => ({
      id: String(r.Id),
      description: String(r.Description),
    }));
  }
  // Fallback: built-in conventions
  return [
    { id: 'date_based', description: 'Name versions by date (e.g., "My Song – 2026-01-28")' },
    { id: 'numbered', description: 'Sequential numbering (e.g., "My Song v3")' },
    { id: 'milestone', description: 'Milestone labels (e.g., "My Song – Milestone 2")' },
    { id: 'descriptive', description: 'Descriptive drafts (e.g., "My Song – Draft 4")' },
  ];
}

// =============================================================================
// Singleton & API
// =============================================================================

const versionStore = new ProjectVersionStore();

/**
 * M309: Save a project version.
 */
export function saveProjectVersion(
  name: string,
  convention: string,
  projectData: Record<string, unknown>,
  tags: string[] = [],
  notes = ''
): ProjectVersion {
  return versionStore.save(name, convention, projectData, tags, notes);
}

/**
 * M309: Load a project version by ID.
 */
export function loadProjectVersion(versionId: string): ProjectVersion | null {
  return versionStore.load(versionId);
}

/**
 * M309: List all saved project versions (newest first).
 */
export function listProjectVersions(): ProjectVersion[] {
  return versionStore.listVersions();
}

/**
 * M309: Delete a project version.
 */
export function deleteProjectVersion(versionId: string): boolean {
  return versionStore.deleteVersion(versionId);
}

/**
 * M310: Compare two project versions and return a structured diff.
 */
export function compareProjectVersions(
  fromVersionId: string,
  toVersionId: string
): VersionComparison | null {
  return versionStore.compare(fromVersionId, toVersionId);
}

/**
 * Get the number of saved versions.
 */
export function getProjectVersionCount(): number {
  return versionStore.count();
}

/**
 * Reset all project versions (for testing).
 */
export function resetProjectVersions(): void {
  versionStore.reset();
}

/**
 * Export all project versions as JSON-serialisable data.
 */
export function exportProjectVersions(): ProjectVersion[] {
  return versionStore.exportAll();
}

/**
 * Import previously exported versions.
 */
export function importProjectVersions(versions: ProjectVersion[]): void {
  versionStore.importVersions(versions);
}
