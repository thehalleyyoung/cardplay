import { describe, it, expect } from 'vitest';
import {
  createCollaborationMetadata,
  addContributor,
  updateContributorActivity,
  addChangelogEntry,
  getChangesByContributor,
  getChangesByType,
  getChangesInRange,
  getMostActiveContributors,
  generateCollaborationSummary,
  exportCollaborationMetadata,
  importCollaborationMetadata,
  type Contributor,
  type ChangelogEntry
} from './collaboration-metadata';

describe('Collaboration Metadata', () => {
  describe('createCollaborationMetadata', () => {
    it('creates metadata with initial contributor', () => {
      const metadata = createCollaborationMetadata(
        'proj-1',
        'My Project',
        {
          id: 'user-1',
          name: 'Alice',
          email: 'alice@example.com',
          role: 'composer'
        }
      );
      
      expect(metadata.version).toBe('1.0');
      expect(metadata.projectId).toBe('proj-1');
      expect(metadata.projectName).toBe('My Project');
      expect(metadata.contributors).toHaveLength(1);
      expect(metadata.contributors[0].id).toBe('user-1');
      expect(metadata.contributors[0].name).toBe('Alice');
      expect(metadata.contributors[0].role).toBe('composer');
      expect(metadata.changelog).toHaveLength(0);
    });
    
    it('sets timestamps correctly', () => {
      const before = Date.now();
      const metadata = createCollaborationMetadata(
        'proj-1',
        'My Project',
        { id: 'user-1', name: 'Alice', role: 'composer' }
      );
      const after = Date.now();
      
      expect(metadata.createdAt).toBeGreaterThanOrEqual(before);
      expect(metadata.createdAt).toBeLessThanOrEqual(after);
      expect(metadata.lastModifiedAt).toBe(metadata.createdAt);
      expect(metadata.lastModifiedBy).toBe('user-1');
    });
  });
  
  describe('addContributor', () => {
    it('adds a new contributor', () => {
      const metadata = createCollaborationMetadata(
        'proj-1',
        'My Project',
        { id: 'user-1', name: 'Alice', role: 'composer' }
      );
      
      const updated = addContributor(metadata, {
        id: 'user-2',
        name: 'Bob',
        role: 'mixer'
      });
      
      expect(updated.contributors).toHaveLength(2);
      expect(updated.contributors[1].id).toBe('user-2');
      expect(updated.contributors[1].name).toBe('Bob');
      expect(updated.contributors[1].role).toBe('mixer');
    });
    
    it('throws error if contributor already exists', () => {
      const metadata = createCollaborationMetadata(
        'proj-1',
        'My Project',
        { id: 'user-1', name: 'Alice', role: 'composer' }
      );
      
      expect(() => {
        addContributor(metadata, {
          id: 'user-1',
          name: 'Alice Again',
          role: 'arranger'
        });
      }).toThrow('Contributor user-1 already exists');
    });
  });
  
  describe('updateContributorActivity', () => {
    it('updates last active time', () => {
      const metadata = createCollaborationMetadata(
        'proj-1',
        'My Project',
        { id: 'user-1', name: 'Alice', role: 'composer' }
      );
      
      const before = Date.now();
      const updated = updateContributorActivity(metadata, 'user-1');
      const after = Date.now();
      
      expect(updated.contributors[0].lastActiveAt).toBeGreaterThanOrEqual(before);
      expect(updated.contributors[0].lastActiveAt).toBeLessThanOrEqual(after);
      expect(updated.lastModifiedBy).toBe('user-1');
    });
  });
  
  describe('addChangelogEntry', () => {
    it('adds a changelog entry', () => {
      const metadata = createCollaborationMetadata(
        'proj-1',
        'My Project',
        { id: 'user-1', name: 'Alice', role: 'composer' }
      );
      
      const updated = addChangelogEntry(metadata, {
        contributorId: 'user-1',
        type: 'composition',
        description: 'Added verse melody',
        affectedStreams: ['stream-1']
      });
      
      expect(updated.changelog).toHaveLength(1);
      expect(updated.changelog[0].contributorId).toBe('user-1');
      expect(updated.changelog[0].type).toBe('composition');
      expect(updated.changelog[0].description).toBe('Added verse melody');
      expect(updated.changelog[0].affectedStreams).toEqual(['stream-1']);
      expect(updated.changelog[0].id).toBeTruthy();
      expect(updated.changelog[0].timestamp).toBeTruthy();
    });
    
    it('updates last modified info', () => {
      const metadata = createCollaborationMetadata(
        'proj-1',
        'My Project',
        { id: 'user-1', name: 'Alice', role: 'composer' }
      );
      
      const updated = addChangelogEntry(metadata, {
        contributorId: 'user-1',
        type: 'composition',
        description: 'Added verse melody'
      });
      
      expect(updated.lastModifiedBy).toBe('user-1');
      expect(updated.lastModifiedAt).toBeGreaterThanOrEqual(metadata.lastModifiedAt);
    });
  });
  
  describe('getChangesByContributor', () => {
    it('filters changes by contributor', () => {
      let metadata = createCollaborationMetadata(
        'proj-1',
        'My Project',
        { id: 'user-1', name: 'Alice', role: 'composer' }
      );
      
      metadata = addContributor(metadata, {
        id: 'user-2',
        name: 'Bob',
        role: 'mixer'
      });
      
      metadata = addChangelogEntry(metadata, {
        contributorId: 'user-1',
        type: 'composition',
        description: 'Added melody'
      });
      
      metadata = addChangelogEntry(metadata, {
        contributorId: 'user-2',
        type: 'mixing',
        description: 'Adjusted levels'
      });
      
      metadata = addChangelogEntry(metadata, {
        contributorId: 'user-1',
        type: 'arrangement',
        description: 'Added intro'
      });
      
      const aliceChanges = getChangesByContributor(metadata, 'user-1');
      expect(aliceChanges).toHaveLength(2);
      expect(aliceChanges.every(c => c.contributorId === 'user-1')).toBe(true);
      
      const bobChanges = getChangesByContributor(metadata, 'user-2');
      expect(bobChanges).toHaveLength(1);
      expect(bobChanges[0].contributorId).toBe('user-2');
    });
  });
  
  describe('getChangesByType', () => {
    it('filters changes by type', () => {
      let metadata = createCollaborationMetadata(
        'proj-1',
        'My Project',
        { id: 'user-1', name: 'Alice', role: 'composer' }
      );
      
      metadata = addChangelogEntry(metadata, {
        contributorId: 'user-1',
        type: 'composition',
        description: 'Added melody'
      });
      
      metadata = addChangelogEntry(metadata, {
        contributorId: 'user-1',
        type: 'mixing',
        description: 'Adjusted levels'
      });
      
      metadata = addChangelogEntry(metadata, {
        contributorId: 'user-1',
        type: 'composition',
        description: 'Added harmony'
      });
      
      const compositionChanges = getChangesByType(metadata, 'composition');
      expect(compositionChanges).toHaveLength(2);
      expect(compositionChanges.every(c => c.type === 'composition')).toBe(true);
      
      const mixingChanges = getChangesByType(metadata, 'mixing');
      expect(mixingChanges).toHaveLength(1);
    });
  });
  
  describe('getChangesInRange', () => {
    it('filters changes by time range', () => {
      let metadata = createCollaborationMetadata(
        'proj-1',
        'My Project',
        { id: 'user-1', name: 'Alice', role: 'composer' }
      );
      
      const time1 = Date.now();
      metadata = addChangelogEntry(metadata, {
        contributorId: 'user-1',
        type: 'composition',
        description: 'Change 1'
      });
      
      const time2 = Date.now();
      metadata = addChangelogEntry(metadata, {
        contributorId: 'user-1',
        type: 'composition',
        description: 'Change 2'
      });
      
      const time3 = Date.now();
      
      const changes = getChangesInRange(metadata, time1, time3);
      expect(changes).toHaveLength(2);
    });
  });
  
  describe('getMostActiveContributors', () => {
    it('ranks contributors by change count', () => {
      let metadata = createCollaborationMetadata(
        'proj-1',
        'My Project',
        { id: 'user-1', name: 'Alice', role: 'composer' }
      );
      
      metadata = addContributor(metadata, {
        id: 'user-2',
        name: 'Bob',
        role: 'mixer'
      });
      
      // Alice makes 3 changes
      for (let i = 0; i < 3; i++) {
        metadata = addChangelogEntry(metadata, {
          contributorId: 'user-1',
          type: 'composition',
          description: `Alice change ${i + 1}`
        });
      }
      
      // Bob makes 1 change
      metadata = addChangelogEntry(metadata, {
        contributorId: 'user-2',
        type: 'mixing',
        description: 'Bob change 1'
      });
      
      const mostActive = getMostActiveContributors(metadata, 5);
      expect(mostActive).toHaveLength(2);
      expect(mostActive[0].contributor.id).toBe('user-1');
      expect(mostActive[0].changeCount).toBe(3);
      expect(mostActive[1].contributor.id).toBe('user-2');
      expect(mostActive[1].changeCount).toBe(1);
    });
    
    it('respects the limit parameter', () => {
      let metadata = createCollaborationMetadata(
        'proj-1',
        'My Project',
        { id: 'user-1', name: 'Alice', role: 'composer' }
      );
      
      for (let i = 2; i <= 5; i++) {
        metadata = addContributor(metadata, {
          id: `user-${i}`,
          name: `User ${i}`,
          role: 'editor'
        });
      }
      
      const mostActive = getMostActiveContributors(metadata, 2);
      expect(mostActive).toHaveLength(2);
    });
  });
  
  describe('generateCollaborationSummary', () => {
    it('generates accurate summary', () => {
      let metadata = createCollaborationMetadata(
        'proj-1',
        'My Project',
        { id: 'user-1', name: 'Alice', role: 'composer' }
      );
      
      metadata = addContributor(metadata, {
        id: 'user-2',
        name: 'Bob',
        role: 'mixer'
      });
      
      metadata = addChangelogEntry(metadata, {
        contributorId: 'user-1',
        type: 'composition',
        description: 'Composition change'
      });
      
      metadata = addChangelogEntry(metadata, {
        contributorId: 'user-2',
        type: 'mixing',
        description: 'Mixing change'
      });
      
      metadata = addChangelogEntry(metadata, {
        contributorId: 'user-1',
        type: 'arrangement',
        description: 'Arrangement change'
      });
      
      const summary = generateCollaborationSummary(metadata);
      
      expect(summary.totalContributors).toBe(2);
      expect(summary.totalChanges).toBe(3);
      expect(summary.changesByType.composition).toBe(1);
      expect(summary.changesByType.mixing).toBe(1);
      expect(summary.changesByType.arrangement).toBe(1);
      expect(summary.mostActiveContributor?.id).toBe('user-1');
      expect(summary.timespan).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('export/import', () => {
    it('exports and imports metadata correctly', () => {
      let metadata = createCollaborationMetadata(
        'proj-1',
        'My Project',
        { id: 'user-1', name: 'Alice', role: 'composer' }
      );
      
      metadata = addChangelogEntry(metadata, {
        contributorId: 'user-1',
        type: 'composition',
        description: 'Added melody'
      });
      
      const exported = exportCollaborationMetadata(metadata);
      const imported = importCollaborationMetadata(exported);
      
      expect(imported.version).toBe(metadata.version);
      expect(imported.projectId).toBe(metadata.projectId);
      expect(imported.projectName).toBe(metadata.projectName);
      expect(imported.contributors).toHaveLength(metadata.contributors.length);
      expect(imported.changelog).toHaveLength(metadata.changelog.length);
    });
    
    it('rejects invalid version', () => {
      const invalid = JSON.stringify({ version: '2.0', projectId: 'p1', projectName: 'P1', contributors: [] });
      
      expect(() => {
        importCollaborationMetadata(invalid);
      }).toThrow('Unsupported collaboration metadata version');
    });
    
    it('rejects missing required fields', () => {
      const invalid = JSON.stringify({ version: '1.0' });
      
      expect(() => {
        importCollaborationMetadata(invalid);
      }).toThrow('Invalid collaboration metadata: missing required fields');
    });
  });
});
