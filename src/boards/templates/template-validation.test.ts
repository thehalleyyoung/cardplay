/**
 * Template Export and Validation Tests (O025-O026)
 * 
 * Tests for template packaging, export, and asset validation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getTemplateRegistry, resetTemplateRegistry } from './registry';
import { registerBuiltinTemplates } from './builtins';
import type { ProjectTemplate } from './types';

describe('Template Export and Validation (O025-O026)', () => {
  beforeEach(() => {
    resetTemplateRegistry();
  });

  describe('O025: Template Export', () => {
    it('exports template with all metadata', () => {
      const registry = getTemplateRegistry();
      registerBuiltinTemplates();
      
      const template = registry.get('lofi-hip-hop');
      expect(template).toBeDefined();
      
      if (!template) return;
      
      // Export should include all metadata
      const exported = {
        metadata: template.metadata,
        streams: template.streams,
        clips: template.clips,
        board: template.board,
      };
      
      expect(exported.metadata.id).toBe('lofi-hip-hop');
      expect(exported.metadata.name).toBeDefined();
      expect(exported.metadata.description).toBeDefined();
      expect(exported.metadata.genre).toBeDefined();
      expect(exported.metadata.difficulty).toBeDefined();
      expect(exported.metadata.tags).toBeDefined();
      expect(Array.isArray(exported.metadata.tags)).toBe(true);
    });

    it('exports template with streams and clips', () => {
      const registry = getTemplateRegistry();
      registerBuiltinTemplates();
      
      const template = registry.get('house-track');
      expect(template).toBeDefined();
      
      if (!template) return;
      
      // Should have stream and clip data
      expect(Array.isArray(template.streams)).toBe(true);
      expect(Array.isArray(template.clips)).toBe(true);
      
      // Each stream should have valid structure
      template.streams.forEach(stream => {
        expect(stream.name).toBeDefined();
        expect(Array.isArray(stream.events)).toBe(true);
      });
      
      // Each clip should reference a valid stream
      template.clips.forEach(clip => {
        expect(clip.name).toBeDefined();
        expect(clip.streamId).toBeDefined();
        expect(typeof clip.loop).toBe('boolean');
      });
    });

    it('exports template with board configuration', () => {
      const registry = getTemplateRegistry();
      registerBuiltinTemplates();
      
      const template = registry.get('jazz-standard');
      expect(template).toBeDefined();
      
      if (!template) return;
      
      // Should have board configuration
      expect(template.board).toBeDefined();
      expect(template.board.boardId).toBeDefined();
      
      // Board ID should match a valid builtin board
      const validBoardIds = [
        'notation-manual',
        'basic-tracker',
        'basic-sampler',
        'basic-session',
        'tracker-harmony',
        'tracker-phrases',
        'session-generators',
        'notation-harmony',
        'ai-arranger',
        'ai-composition',
        'generative-ambient',
        'composer',
        'producer',
        'live-performance',
      ];
      expect(validBoardIds).toContain(template.board.boardId);
    });

    it('exports template with versioning info', () => {
      const registry = getTemplateRegistry();
      registerBuiltinTemplates();
      
      const template = registry.get('techno-track');
      expect(template).toBeDefined();
      
      if (!template) return;
      
      // Should have version metadata
      expect(template.metadata.version).toBeDefined();
      expect(template.metadata.author).toBeDefined();
      expect(template.metadata.createdAt).toBeDefined();
      
      // Version should be valid semver
      const versionRegex = /^\d+\.\d+\.\d+$/;
      expect(versionRegex.test(template.metadata.version)).toBe(true);
    });

    it('exports template as serializable JSON', () => {
      const registry = getTemplateRegistry();
      registerBuiltinTemplates();
      
      const template = registry.get('ambient-soundscape');
      expect(template).toBeDefined();
      
      if (!template) return;
      
      // Should be serializable to JSON
      const json = JSON.stringify(template);
      expect(json).toBeDefined();
      expect(json.length).toBeGreaterThan(0);
      
      // Should be parseable back
      const parsed = JSON.parse(json);
      expect(parsed.metadata.id).toBe(template.metadata.id);
      expect(parsed.metadata.name).toBe(template.metadata.name);
    });

    it('exports multiple templates as a collection', () => {
      const registry = getTemplateRegistry();
      registerBuiltinTemplates();
      
      const allTemplates = registry.getAll();
      expect(allTemplates.length).toBeGreaterThan(0);
      
      // Export all as collection
      const collection = allTemplates.map(t => ({
        metadata: t.metadata,
        streams: t.streams,
        clips: t.clips,
        board: t.board,
      }));
      
      // Should be serializable
      const json = JSON.stringify(collection);
      expect(json).toBeDefined();
      
      // Should parse back
      const parsed = JSON.parse(json);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(allTemplates.length);
    });
  });

  describe('O026: Template Asset Validation', () => {
    it('validates template has required metadata fields', () => {
      const registry = getTemplateRegistry();
      registerBuiltinTemplates();
      
      const templates = registry.getAll();
      expect(templates.length).toBeGreaterThan(0);
      
      templates.forEach(template => {
        // Required metadata
        expect(template.metadata.id).toBeDefined();
        expect(template.metadata.name).toBeDefined();
        expect(template.metadata.description).toBeDefined();
        expect(template.metadata.genre).toBeDefined();
        expect(template.metadata.difficulty).toBeDefined();
        expect(template.metadata.version).toBeDefined();
        expect(template.metadata.author).toBeDefined();
        
        // ID should be kebab-case
        expect(/^[a-z0-9-]+$/.test(template.metadata.id)).toBe(true);
        
        // Version should be semver
        expect(/^\d+\.\d+\.\d+$/.test(template.metadata.version)).toBe(true);
      });
    });

    it('validates template streams have valid structure', () => {
      const registry = getTemplateRegistry();
      registerBuiltinTemplates();
      
      const templates = registry.getAll();
      
      templates.forEach(template => {
        expect(Array.isArray(template.streams)).toBe(true);
        
        template.streams.forEach(stream => {
          // Required fields
          expect(stream.name).toBeDefined();
          expect(typeof stream.name).toBe('string');
          expect(stream.name.length).toBeGreaterThan(0);
          
          // Events should be array
          expect(Array.isArray(stream.events)).toBe(true);
          
          // Each event should have valid structure
          stream.events.forEach(event => {
            expect(event.kind).toBeDefined();
            expect(event.start).toBeDefined();
            expect(typeof event.start).toBe('number');
            expect(event.start).toBeGreaterThanOrEqual(0);
          });
        });
      });
    });

    it('validates template clips reference valid streams', () => {
      const registry = getTemplateRegistry();
      registerBuiltinTemplates();
      
      const templates = registry.getAll();
      
      templates.forEach(template => {
        expect(Array.isArray(template.clips)).toBe(true);
        
        const streamIds = new Set(template.streams.map(s => s.id || s.name));
        
        template.clips.forEach(clip => {
          // Required fields
          expect(clip.name).toBeDefined();
          expect(clip.streamId).toBeDefined();
          
          // Stream reference should be valid
          // Note: Some templates may use placeholder IDs
          if (streamIds.size > 0) {
            const hasValidRef = streamIds.has(clip.streamId) || clip.streamId.startsWith('placeholder-');
            expect(hasValidRef).toBe(true);
          }
          
          // Loop should be boolean
          expect(typeof clip.loop).toBe('boolean');
        });
      });
    });

    it('validates template board references exist', () => {
      const registry = getTemplateRegistry();
      registerBuiltinTemplates();
      
      const templates = registry.getAll();
      const validBoardIds = [
        'notation-manual',
        'basic-tracker',
        'basic-sampler',
        'basic-session',
        'tracker-harmony',
        'tracker-phrases',
        'session-generators',
        'notation-harmony',
        'ai-arranger',
        'ai-composition',
        'generative-ambient',
        'composer',
        'producer',
        'live-performance',
      ];
      
      templates.forEach(template => {
        expect(template.board).toBeDefined();
        expect(template.board.boardId).toBeDefined();
        expect(validBoardIds).toContain(template.board.boardId);
      });
    });

    it('validates template has no missing assets', () => {
      const registry = getTemplateRegistry();
      registerBuiltinTemplates();
      
      const templates = registry.getAll();
      
      templates.forEach(template => {
        // Check for required assets
        const hasStreams = template.streams.length > 0;
        const hasClips = template.clips.length > 0;
        const hasBoard = template.board?.boardId;
        
        // At minimum, should have board configuration
        expect(hasBoard).toBeTruthy();
        
        // If has clips, should have streams
        if (hasClips) {
          expect(hasStreams).toBe(true);
        }
      });
    });

    it('validates template difficulty levels are valid', () => {
      const registry = getTemplateRegistry();
      registerBuiltinTemplates();
      
      const templates = registry.getAll();
      const validDifficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
      
      templates.forEach(template => {
        expect(validDifficulties).toContain(template.metadata.difficulty);
      });
    });

    it('validates template tags are non-empty', () => {
      const registry = getTemplateRegistry();
      registerBuiltinTemplates();
      
      const templates = registry.getAll();
      
      templates.forEach(template => {
        expect(Array.isArray(template.metadata.tags)).toBe(true);
        expect(template.metadata.tags.length).toBeGreaterThan(0);
        
        template.metadata.tags.forEach(tag => {
          expect(typeof tag).toBe('string');
          expect(tag.length).toBeGreaterThan(0);
        });
      });
    });

    it('detects missing stream references in clips', () => {
      const registry = getTemplateRegistry();
      
      // Create a template with invalid clip reference
      const invalidTemplate: ProjectTemplate = {
        metadata: {
          id: 'invalid-test',
          name: 'Invalid Test',
          description: 'Test template with missing stream',
          genre: 'test',
          difficulty: 'beginner',
          estimatedTime: '1 min',
          tags: ['test'],
          author: 'Test',
          version: '1.0.0',
          createdAt: new Date().toISOString(),
        },
        streams: [
          { id: 'stream-1', name: 'Valid Stream', events: [] },
        ],
        clips: [
          { name: 'Valid Clip', streamId: 'stream-1', loop: false },
          { name: 'Invalid Clip', streamId: 'nonexistent-stream', loop: false },
        ],
        board: {
          boardId: 'basic-tracker',
        },
      };
      
      registry.register(invalidTemplate);
      
      const template = registry.get('invalid-test');
      expect(template).toBeDefined();
      
      if (!template) return;
      
      const streamIds = new Set(template.streams.map(s => s.id || s.name));
      const invalidClips = template.clips.filter(c => !streamIds.has(c.streamId));
      
      expect(invalidClips.length).toBeGreaterThan(0);
    });

    it('validates estimated time format', () => {
      const registry = getTemplateRegistry();
      registerBuiltinTemplates();
      
      const templates = registry.getAll();
      
      templates.forEach(template => {
        if (template.metadata.estimatedTime) {
          // Should contain time unit (may be 'min' or 'hour' with or without space)
          const hasValidFormat = 
            /\d+\s*(min|hour|hr|h|m)/i.test(template.metadata.estimatedTime);
          expect(hasValidFormat).toBe(true);
        }
      });
    });
  });

  describe('Template Package Validation', () => {
    it('validates complete template package structure', () => {
      const registry = getTemplateRegistry();
      registerBuiltinTemplates();
      
      const template = registry.get('film-score-sketch');
      expect(template).toBeDefined();
      
      if (!template) return;
      
      // Package should contain all required sections
      const packageStructure = {
        metadata: template.metadata,
        streams: template.streams,
        clips: template.clips,
        board: template.board,
      };
      
      // Validate metadata section
      expect(packageStructure.metadata.id).toBeDefined();
      expect(packageStructure.metadata.name).toBeDefined();
      expect(packageStructure.metadata.description).toBeDefined();
      
      // Validate content sections
      expect(Array.isArray(packageStructure.streams)).toBe(true);
      expect(Array.isArray(packageStructure.clips)).toBe(true);
      expect(packageStructure.board.boardId).toBeDefined();
      
      // Should be serializable
      const json = JSON.stringify(packageStructure);
      expect(json.length).toBeGreaterThan(0);
      
      // Should round-trip
      const parsed = JSON.parse(json);
      expect(parsed.metadata.id).toBe(template.metadata.id);
    });

    it('validates template package size is reasonable', () => {
      const registry = getTemplateRegistry();
      registerBuiltinTemplates();
      
      const templates = registry.getAll();
      
      templates.forEach(template => {
        const json = JSON.stringify(template);
        const sizeInKB = json.length / 1024;
        
        // Templates should be under 1MB (reasonable for JSON)
        expect(sizeInKB).toBeLessThan(1024);
      });
    });
  });
});
