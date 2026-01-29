/**
 * Template Registry Tests
 * Testing template loading, validation, and browser functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getTemplateRegistry, resetTemplateRegistry } from './registry';
import type { ProjectTemplate } from './types';

describe('TemplateRegistry', () => {
  beforeEach(() => {
    resetTemplateRegistry();
    const registry = getTemplateRegistry();
    registry.clear();
  });

  describe('O018: Template Loading', () => {
    it('loads templates correctly', () => {
      const registry = getTemplateRegistry();
      const templates = registry.getAll();
      
      expect(templates).toBeDefined();
      expect(Array.isArray(templates)).toBe(true);
    });

    it('registers templates with valid metadata', () => {
      const registry = getTemplateRegistry();
      
      const mockTemplate: ProjectTemplate = {
        metadata: {
          id: 'test-template',
          name: 'Test Template',
          description: 'A test template',
          genre: 'electronic',
          difficulty: 'beginner',
          estimatedTime: '10 min',
          tags: ['test'],
          author: 'Test Author',
          version: '1.0.0',
          createdAt: new Date().toISOString(),
        },
        streams: [],
        clips: [],
        board: {
          boardId: 'basic-tracker',
        },
      };

      registry.register(mockTemplate);
      const retrieved = registry.get('test-template');
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.metadata.id).toBe('test-template');
      expect(retrieved?.metadata.name).toBe('Test Template');
    });

    it('replaces duplicate template IDs with warning', () => {
      const registry = getTemplateRegistry();
      
      const template: ProjectTemplate = {
        metadata: {
          id: 'duplicate-test',
          name: 'Template 1',
          description: 'First',
          genre: 'electronic',
          difficulty: 'beginner',
          estimatedTime: '5 min',
          tags: [],
          author: 'Test',
          version: '1.0.0',
          createdAt: new Date().toISOString(),
        },
        streams: [],
        clips: [],
        board: { boardId: 'basic-tracker' },
      };

      registry.register(template);
      
      // Should not throw, but replaces
      registry.register({
        ...template,
        metadata: { ...template.metadata, name: 'Template 2' },
      });
      
      const retrieved = registry.get('duplicate-test');
      expect(retrieved?.metadata.name).toBe('Template 2');
    });
  });

  describe('O019: Template Metadata Accuracy', () => {
    it('validates template metadata fields', () => {
      const registry = getTemplateRegistry();
      
      const template: ProjectTemplate = {
        metadata: {
          id: 'metadata-test',
          name: 'Metadata Test',
          description: 'Testing metadata',
          genre: 'electronic',
          difficulty: 'intermediate',
          estimatedTime: '15 min',
          tags: ['test', 'metadata'],
          author: 'Test Author',
          version: '1.0.0',
          createdAt: new Date().toISOString(),
        },
        streams: [],
        clips: [],
        board: { boardId: 'tracker-phrases' },
      };

      registry.register(template);
      const retrieved = registry.get('metadata-test');
      
      expect(retrieved?.metadata.genre).toBe('electronic');
      expect(retrieved?.metadata.difficulty).toBe('intermediate');
      expect(retrieved?.metadata.tags).toContain('test');
      expect(retrieved?.metadata.tags).toContain('metadata');
      expect(retrieved?.metadata.estimatedTime).toBe('15 min');
    });

    it('ensures all required fields are present', () => {
      const registry = getTemplateRegistry();
      
      const template: ProjectTemplate = {
        metadata: {
          id: 'complete-test',
          name: 'Complete Template',
          description: 'Has all fields',
          genre: 'jazz',
          difficulty: 'advanced',
          estimatedTime: '30 min',
          tags: ['complete'],
          author: 'Complete Author',
          version: '1.0.0',
          createdAt: new Date().toISOString(),
        },
        streams: [],
        clips: [],
        board: { boardId: 'notation-harmony' },
      };

      registry.register(template);
      const retrieved = registry.get('complete-test');
      
      expect(retrieved?.metadata.id).toBeDefined();
      expect(retrieved?.metadata.name).toBeDefined();
      expect(retrieved?.metadata.description).toBeDefined();
      expect(retrieved?.metadata.genre).toBeDefined();
      expect(retrieved?.metadata.difficulty).toBeDefined();
      expect(retrieved?.board.boardId).toBeDefined();
      expect(retrieved?.metadata.author).toBeDefined();
      expect(retrieved?.metadata.version).toBeDefined();
    });
  });

  describe('O020: Template Browser Integration', () => {
    it('shows all registered templates', () => {
      const registry = getTemplateRegistry();
      
      const templates: ProjectTemplate[] = [
        {
          metadata: {
            id: 'template-1',
            name: 'Template 1',
            description: 'First',
            genre: 'electronic',
            difficulty: 'beginner',
            estimatedTime: '10 min',
            tags: [],
            author: 'Author 1',
            version: '1.0.0',
            createdAt: new Date().toISOString(),
          },
          streams: [],
          clips: [],
          board: { boardId: 'basic-tracker' },
        },
        {
          metadata: {
            id: 'template-2',
            name: 'Template 2',
            description: 'Second',
            genre: 'jazz',
            difficulty: 'intermediate',
            estimatedTime: '20 min',
            tags: [],
            author: 'Author 2',
            version: '1.0.0',
            createdAt: new Date().toISOString(),
          },
          streams: [],
          clips: [],
          board: { boardId: 'notation-harmony' },
        },
      ];

      templates.forEach((t) => registry.register(t));
      const all = registry.getAll();
      
      expect(all).toHaveLength(2);
      expect(all.map((t) => t.metadata.id)).toContain('template-1');
      expect(all.map((t) => t.metadata.id)).toContain('template-2');
    });

    it('filters templates by genre', () => {
      const registry = getTemplateRegistry();
      
      registry.register({
        metadata: {
          id: 'electronic-1',
          name: 'Electronic',
          description: 'Electronic music',
          genre: 'electronic',
          difficulty: 'beginner',
          estimatedTime: '10 min',
          tags: [],
          author: 'Test',
          version: '1.0.0',
          createdAt: new Date().toISOString(),
        },
        streams: [],
        clips: [],
        board: { boardId: 'basic-tracker' },
      });

      registry.register({
        metadata: {
          id: 'jazz-1',
          name: 'Jazz',
          description: 'Jazz music',
          genre: 'jazz',
          difficulty: 'beginner',
          estimatedTime: '10 min',
          tags: [],
          author: 'Test',
          version: '1.0.0',
          createdAt: new Date().toISOString(),
        },
        streams: [],
        clips: [],
        board: { boardId: 'notation-harmony' },
      });

      const electronic = registry.getByGenre('electronic');
      const jazz = registry.getByGenre('jazz');
      
      expect(electronic).toHaveLength(1);
      expect(electronic[0].metadata.id).toBe('electronic-1');
      expect(jazz).toHaveLength(1);
      expect(jazz[0].metadata.id).toBe('jazz-1');
    });

    it('filters templates by difficulty', () => {
      const registry = getTemplateRegistry();
      
      registry.register({
        metadata: {
          id: 'beginner-1',
          name: 'Beginner',
          description: 'Easy',
          genre: 'electronic',
          difficulty: 'beginner',
          estimatedTime: '10 min',
          tags: [],
          author: 'Test',
          version: '1.0.0',
          createdAt: new Date().toISOString(),
        },
        streams: [],
        clips: [],
        board: { boardId: 'basic-tracker' },
      });

      registry.register({
        metadata: {
          id: 'advanced-1',
          name: 'Advanced',
          description: 'Hard',
          genre: 'jazz',
          difficulty: 'advanced',
          estimatedTime: '60 min',
          tags: [],
          author: 'Test',
          version: '1.0.0',
          createdAt: new Date().toISOString(),
        },
        streams: [],
        clips: [],
        board: { boardId: 'composer' },
      });

      const beginner = registry.getByDifficulty('beginner');
      const advanced = registry.getByDifficulty('advanced');
      
      expect(beginner).toHaveLength(1);
      expect(beginner[0].metadata.id).toBe('beginner-1');
      expect(advanced).toHaveLength(1);
      expect(advanced[0].metadata.id).toBe('advanced-1');
    });

    it('searches templates by text', () => {
      const registry = getTemplateRegistry();
      
      registry.register({
        metadata: {
          id: 'lofi-beat',
          name: 'Lofi Hip Hop Beat',
          description: 'Chill lofi beat template',
          genre: 'hip-hop',
          difficulty: 'beginner',
          estimatedTime: '15 min',
          tags: ['lofi', 'hip-hop', 'chill'],
          author: 'Test',
          version: '1.0.0',
          createdAt: new Date().toISOString(),
        },
        streams: [],
        clips: [],
        board: { boardId: 'session-generators' },
      });

      const results = registry.search({ searchText: 'lofi' });
      
      expect(results).toHaveLength(1);
      expect(results[0].metadata.id).toBe('lofi-beat');
    });
  });

  describe('Template Validation', () => {
    it('validates board_id references valid board', () => {
      const registry = getTemplateRegistry();
      
      const template: ProjectTemplate = {
        metadata: {
          id: 'valid-board',
          name: 'Valid Board Template',
          description: 'Uses valid board',
          genre: 'electronic',
          difficulty: 'beginner',
          estimatedTime: '10 min',
          tags: [],
          author: 'Test',
          version: '1.0.0',
          createdAt: new Date().toISOString(),
        },
        streams: [],
        clips: [],
        board: { boardId: 'basic-tracker' },
      };

      expect(() => registry.register(template)).not.toThrow();
    });

    it('validates genre is valid value', () => {
      const registry = getTemplateRegistry();
      
      const validGenres = [
        'electronic',
        'jazz',
        'orchestral',
        'hip-hop',
        'ambient',
        'rock',
        'experimental',
        'sound-design',
      ];

      validGenres.forEach((genre) => {
        const template: ProjectTemplate = {
          metadata: {
            id: `genre-${genre}`,
            name: `${genre} template`,
            description: 'Test',
            genre: genre as any,
            difficulty: 'beginner',
            estimatedTime: '10 min',
            tags: [],
            author: 'Test',
            version: '1.0.0',
            createdAt: new Date().toISOString(),
          },
          streams: [],
          clips: [],
          board: { boardId: 'basic-tracker' },
        };

        expect(() => registry.register(template)).not.toThrow();
      });
    });
  });
});
