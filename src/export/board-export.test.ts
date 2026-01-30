/**
 * Tests for board export/import system
 */

import { describe, it, expect } from 'vitest';
import {
  exportBoardConfiguration,
  importBoardConfiguration,
  serializeBoardConfiguration,
  parseBoardConfiguration,
  checkBoardCompatibility,
  type BoardExportData
} from '../export/board-export';
import type { Board } from '../boards/types';

describe('board-export', () => {
  const mockBoard: Board = {
    id: 'test-board',
    name: 'Test Board',
    description: 'A test board',
    icon: '🎵',
    controlLevel: 'manual-with-hints',
    philosophy: 'Test board philosophy',
    primaryView: 'tracker',
    compositionTools: {
      phraseDatabase: { enabled: false, mode: 'hidden' },
      harmonyExplorer: { enabled: false, mode: 'hidden' },
      phraseGenerators: { enabled: false, mode: 'hidden' },
      arrangerCard: { enabled: false, mode: 'hidden' },
      aiComposer: { enabled: false, mode: 'hidden' }
    },
    layout: {
      type: 'dock',
      panels: [
        { id: 'main-panel', location: 'center', size: 1 }
      ]
    },
    panels: [],
    decks: [
      {
        id: 'deck-1',
        type: 'pattern-deck',
        panelId: 'main-panel',
        cardLayout: 'stack',
        allowReordering: true,
        allowDragOut: true
      }
    ],
    connections: [],
    shortcuts: {},
    tags: ['test', 'board'],
    difficulty: 'beginner',
    category: 'Manual',
    author: 'Test Author',
    version: '1.0'
  };

  describe('exportBoardConfiguration', () => {
    it('should export board with valid manifest', () => {
      const result = exportBoardConfiguration(mockBoard);

      expect(result.manifest.version).toBe('1.0');
      expect(result.manifest.type).toBe('board-configuration');
      expect(result.manifest.exportedAt).toBeDefined();
      expect(result.manifest.cardplayVersion).toBe('1.0.0');
    });

    it('should include board data', () => {
      const result = exportBoardConfiguration(mockBoard);

      expect(result.board).toEqual(mockBoard);
    });

    it('should include metadata', () => {
      const result = exportBoardConfiguration(mockBoard);

      expect(result.metadata.name).toBe(mockBoard.name);
      expect(result.metadata.description).toBe(mockBoard.description);
      expect(result.metadata.tags).toEqual(mockBoard.tags);
    });

    it('should include custom metadata', () => {
      const result = exportBoardConfiguration(mockBoard, undefined, {
        author: 'Test Author',
        tags: ['custom', 'tags']
      });

      expect(result.metadata.author).toBe('Test Author');
      expect(result.metadata.tags).toEqual(['custom', 'tags']);
    });

    it('should include deck states when provided', () => {
      const deckStates = {
        'deck-1': {
          activeCards: ['card-1'],
          scrollPosition: { x: 0, y: 100 },
          focusedItem: null,
          filterState: null
        }
      };

      const result = exportBoardConfiguration(mockBoard, deckStates);

      expect(result.deckStates).toEqual(deckStates);
    });
  });

  describe('importBoardConfiguration', () => {
    it('should import valid board configuration', () => {
      const exportData = exportBoardConfiguration(mockBoard);
      const result = importBoardConfiguration(exportData);

      expect(result.success).toBe(true);
      expect(result.board).toBeDefined();
      expect(result.board?.id).toBe(mockBoard.id);
    });

    it('should assign new ID when requested', () => {
      const exportData = exportBoardConfiguration(mockBoard);
      const result = importBoardConfiguration(exportData, { assignNewId: true });

      expect(result.success).toBe(true);
      expect(result.board?.id).not.toBe(mockBoard.id);
      expect(result.board?.id).toContain('imported');
    });

    it('should preserve deck states when requested', () => {
      const deckStates = {
        'deck-1': {
          activeCards: ['card-1'],
          scrollPosition: { x: 0, y: 100 },
          focusedItem: null,
          filterState: null
        }
      };

      const exportData = exportBoardConfiguration(mockBoard, deckStates);
      const result = importBoardConfiguration(exportData, { 
        preserveDeckStates: true 
      });

      expect(result.success).toBe(true);
      expect(result.deckStates).toEqual(deckStates);
    });

    it('should reject invalid export type', () => {
      const invalidData = {
        manifest: {
          version: '1.0',
          type: 'invalid-type',
          exportedAt: new Date().toISOString(),
          cardplayVersion: '1.0.0'
        },
        board: mockBoard,
        metadata: {
          name: 'Test',
          createdAt: new Date().toISOString()
        }
      } as unknown as BoardExportData;

      const result = importBoardConfiguration(invalidData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('Invalid export type');
    });

    it('should reject invalid board structure', () => {
      const invalidData = {
        manifest: {
          version: '1.0',
          type: 'board-configuration',
          exportedAt: new Date().toISOString(),
          cardplayVersion: '1.0.0'
        },
        board: { id: '', name: '' } as Board,
        metadata: {
          name: 'Test',
          createdAt: new Date().toISOString()
        }
      };

      const result = importBoardConfiguration(invalidData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should validate only when requested', () => {
      const exportData = exportBoardConfiguration(mockBoard);
      const result = importBoardConfiguration(exportData, { validateOnly: true });

      expect(result.success).toBe(true);
      expect(result.board).toBeUndefined();
      expect(result.deckStates).toBeUndefined();
    });

    it('should warn about version mismatch', () => {
      const exportData = exportBoardConfiguration(mockBoard);
      exportData.manifest.version = '0.9' as '1.0';

      const result = importBoardConfiguration(exportData);

      expect(result.success).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some(w => w.includes('version'))).toBe(true);
    });
  });

  describe('serializeBoardConfiguration', () => {
    it('should serialize to valid JSON', () => {
      const exportData = exportBoardConfiguration(mockBoard);
      const json = serializeBoardConfiguration(exportData);

      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should create pretty-printed JSON', () => {
      const exportData = exportBoardConfiguration(mockBoard);
      const json = serializeBoardConfiguration(exportData);

      expect(json).toContain('\n');
      expect(json).toContain('  ');
    });
  });

  describe('parseBoardConfiguration', () => {
    it('should parse valid JSON', () => {
      const exportData = exportBoardConfiguration(mockBoard);
      const json = serializeBoardConfiguration(exportData);
      const parsed = parseBoardConfiguration(json);

      expect(parsed.manifest.type).toBe('board-configuration');
      expect(parsed.board.id).toBe(mockBoard.id);
    });

    it('should throw on invalid JSON', () => {
      expect(() => parseBoardConfiguration('invalid json')).toThrow();
    });
  });

  describe('checkBoardCompatibility', () => {
    it('should mark valid board as compatible', () => {
      const exportData = exportBoardConfiguration(mockBoard);
      const compat = checkBoardCompatibility(exportData);

      expect(compat.compatible).toBe(true);
      expect(compat.issues).toHaveLength(0);
    });

    it('should detect missing control level', () => {
      const exportData = exportBoardConfiguration(mockBoard);
      delete (exportData.board as Partial<Board>).controlLevel;

      const compat = checkBoardCompatibility(exportData);

      expect(compat.compatible).toBe(false);
      expect(compat.issues.some(i => i.includes('control level'))).toBe(true);
    });

    it('should detect missing primary view', () => {
      const exportData = exportBoardConfiguration(mockBoard);
      delete (exportData.board as Partial<Board>).primaryView;

      const compat = checkBoardCompatibility(exportData);

      expect(compat.compatible).toBe(false);
      expect(compat.issues.some(i => i.includes('primary view'))).toBe(true);
    });

    it('should detect missing layout', () => {
      const exportData = exportBoardConfiguration(mockBoard);
      delete (exportData.board as Partial<Board>).layout;

      const compat = checkBoardCompatibility(exportData);

      expect(compat.compatible).toBe(false);
      expect(compat.issues.some(i => i.includes('layout'))).toBe(true);
    });

    it('should detect empty decks as incompatible', () => {
      const exportData = exportBoardConfiguration(mockBoard);
      exportData.board.decks = [];

      const compat = checkBoardCompatibility(exportData);

      // Empty decks should make board incompatible since it has no functionality
      expect(compat.compatible).toBe(false);
      expect(compat.issues.some(i => i.includes('no decks'))).toBe(true);
    });

    it('should detect deck missing type', () => {
      const exportData = exportBoardConfiguration(mockBoard);
      exportData.board.decks = [
        { id: 'deck-1', type: undefined as any, panelId: 'main-panel', cardLayout: 'stack', allowReordering: true, allowDragOut: true }
      ];

      const compat = checkBoardCompatibility(exportData);

      expect(compat.compatible).toBe(false);
      expect(compat.issues.some(i => i.includes('missing type'))).toBe(true);
    });

    it('should warn about version mismatch', () => {
      const exportData = exportBoardConfiguration(mockBoard);
      exportData.manifest.version = '0.9' as '1.0';

      const compat = checkBoardCompatibility(exportData);

      expect(compat.warnings.some(w => w.includes('version'))).toBe(true);
    });
  });

  describe('round-trip', () => {
    it('should preserve board data through export/import', () => {
      const exportData = exportBoardConfiguration(mockBoard);
      const result = importBoardConfiguration(exportData);

      expect(result.success).toBe(true);
      expect(result.board).toEqual(mockBoard);
    });

    it('should preserve board and deck states through export/import', () => {
      const deckStates = {
        'deck-1': {
          activeCards: ['card-1', 'card-2'],
          scrollPosition: { x: 50, y: 100 },
          focusedItem: 'card-1',
          filterState: { search: 'test' }
        }
      };

      const exportData = exportBoardConfiguration(mockBoard, deckStates);
      const json = serializeBoardConfiguration(exportData);
      const parsed = parseBoardConfiguration(json);
      const result = importBoardConfiguration(parsed, { 
        preserveDeckStates: true 
      });

      expect(result.success).toBe(true);
      expect(result.board).toEqual(mockBoard);
      expect(result.deckStates).toEqual(deckStates);
    });
  });
});
