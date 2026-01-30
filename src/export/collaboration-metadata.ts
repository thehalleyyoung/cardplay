/**
 * Collaboration Metadata System
 * 
 * Tracks contributors, roles, and changes in collaborative projects.
 * Enables proper attribution and history tracking without cloud dependency.
 */

export interface Contributor {
  readonly id: string;
  readonly name: string;
  readonly email?: string;
  readonly role: ContributorRole;
  readonly joinedAt: number;
  readonly lastActiveAt: number;
}

export type ContributorRole = 
  | 'composer'
  | 'arranger'
  | 'mixer'
  | 'producer'
  | 'sound-designer'
  | 'performer'
  | 'editor'
  | 'reviewer';

export interface ChangelogEntry {
  readonly id: string;
  readonly timestamp: number;
  readonly contributorId: string;
  readonly type: ChangeType;
  readonly description: string;
  readonly affectedStreams?: readonly string[];
  readonly affectedClips?: readonly string[];
  readonly affectedDecks?: readonly string[];
}

export type ChangeType =
  | 'composition'
  | 'arrangement'
  | 'mixing'
  | 'routing'
  | 'effects'
  | 'instruments'
  | 'automation'
  | 'structure';

export interface CollaborationMetadata {
  readonly version: '1.0';
  readonly projectId: string;
  readonly projectName: string;
  readonly contributors: readonly Contributor[];
  readonly changelog: readonly ChangelogEntry[];
  readonly createdAt: number;
  readonly lastModifiedAt: number;
  readonly lastModifiedBy: string;
}

/**
 * Create new collaboration metadata for a project
 */
export function createCollaborationMetadata(
  projectId: string,
  projectName: string,
  initialContributor: Omit<Contributor, 'joinedAt' | 'lastActiveAt'>
): CollaborationMetadata {
  const now = Date.now();
  
  const contributor: Contributor = {
    ...initialContributor,
    joinedAt: now,
    lastActiveAt: now
  };
  
  return {
    version: '1.0',
    projectId,
    projectName,
    contributors: [contributor],
    changelog: [],
    createdAt: now,
    lastModifiedAt: now,
    lastModifiedBy: contributor.id
  };
}

/**
 * Add a contributor to the project
 */
export function addContributor(
  metadata: CollaborationMetadata,
  contributor: Omit<Contributor, 'joinedAt' | 'lastActiveAt'>
): CollaborationMetadata {
  const now = Date.now();
  
  // Check if contributor already exists
  if (metadata.contributors.some(c => c.id === contributor.id)) {
    throw new Error(`Contributor ${contributor.id} already exists`);
  }
  
  const newContributor: Contributor = {
    ...contributor,
    joinedAt: now,
    lastActiveAt: now
  };
  
  return {
    ...metadata,
    contributors: [...metadata.contributors, newContributor],
    lastModifiedAt: now
  };
}

/**
 * Update contributor's last active time
 */
export function updateContributorActivity(
  metadata: CollaborationMetadata,
  contributorId: string
): CollaborationMetadata {
  const now = Date.now();
  
  const contributors = metadata.contributors.map(c =>
    c.id === contributorId
      ? { ...c, lastActiveAt: now }
      : c
  );
  
  return {
    ...metadata,
    contributors,
    lastModifiedAt: now,
    lastModifiedBy: contributorId
  };
}

/**
 * Add a changelog entry
 */
export function addChangelogEntry(
  metadata: CollaborationMetadata,
  entry: Omit<ChangelogEntry, 'id' | 'timestamp'>
): CollaborationMetadata {
  const now = Date.now();
  
  const newEntry: ChangelogEntry = {
    ...entry,
    id: `change-${now}-${Math.random().toString(36).slice(2, 11)}`,
    timestamp: now
  };
  
  return {
    ...metadata,
    changelog: [...metadata.changelog, newEntry],
    lastModifiedAt: now,
    lastModifiedBy: entry.contributorId
  };
}

/**
 * Get changelog entries by contributor
 */
export function getChangesByContributor(
  metadata: CollaborationMetadata,
  contributorId: string
): readonly ChangelogEntry[] {
  return metadata.changelog.filter(e => e.contributorId === contributorId);
}

/**
 * Get changelog entries by type
 */
export function getChangesByType(
  metadata: CollaborationMetadata,
  type: ChangeType
): readonly ChangelogEntry[] {
  return metadata.changelog.filter(e => e.type === type);
}

/**
 * Get changelog entries in time range
 */
export function getChangesInRange(
  metadata: CollaborationMetadata,
  startTime: number,
  endTime: number
): readonly ChangelogEntry[] {
  return metadata.changelog.filter(
    e => e.timestamp >= startTime && e.timestamp <= endTime
  );
}

/**
 * Get most active contributors by change count
 */
export function getMostActiveContributors(
  metadata: CollaborationMetadata,
  limit: number = 5
): Array<{ contributor: Contributor; changeCount: number }> {
  const changeCounts = new Map<string, number>();
  
  for (const entry of metadata.changelog) {
    const count = changeCounts.get(entry.contributorId) || 0;
    changeCounts.set(entry.contributorId, count + 1);
  }
  
  return metadata.contributors
    .map(contributor => ({
      contributor,
      changeCount: changeCounts.get(contributor.id) || 0
    }))
    .sort((a, b) => b.changeCount - a.changeCount)
    .slice(0, limit);
}

/**
 * Generate a summary of collaboration activity
 */
export function generateCollaborationSummary(
  metadata: CollaborationMetadata
): {
  totalContributors: number;
  totalChanges: number;
  changesByType: Record<ChangeType, number>;
  mostActiveContributor: Contributor | null;
  timespan: number;
} {
  const changesByType = metadata.changelog.reduce(
    (acc, entry) => {
      acc[entry.type] = (acc[entry.type] || 0) + 1;
      return acc;
    },
    {} as Record<ChangeType, number>
  );
  
  const mostActive = getMostActiveContributors(metadata, 1)[0];
  
  return {
    totalContributors: metadata.contributors.length,
    totalChanges: metadata.changelog.length,
    changesByType,
    mostActiveContributor: mostActive?.contributor || null,
    timespan: metadata.lastModifiedAt - metadata.createdAt
  };
}

/**
 * Export collaboration metadata to JSON
 */
export function exportCollaborationMetadata(
  metadata: CollaborationMetadata
): string {
  return JSON.stringify(metadata, null, 2);
}

/**
 * Import collaboration metadata from JSON
 */
export function importCollaborationMetadata(
  json: string
): CollaborationMetadata {
  const data = JSON.parse(json);
  
  // Validate version
  if (data.version !== '1.0') {
    throw new Error(`Unsupported collaboration metadata version: ${data.version}`);
  }
  
  // Validate required fields
  if (!data.projectId || !data.projectName || !Array.isArray(data.contributors)) {
    throw new Error('Invalid collaboration metadata: missing required fields');
  }
  
  return data as CollaborationMetadata;
}
