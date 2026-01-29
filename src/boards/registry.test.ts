/**
 * @fileoverview Board Registry Tests
 * 
 * Tests for board registration, retrieval, search, and filtering.
 * 
 * @module @cardplay/boards/registry.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BoardRegistry } from './registry';
import type { Board } from './types';

describe('BoardRegistry', () => {
  let registry: BoardRegistry;
  
  const mockBoard: Board = {
    id: 'test-board',
    name: 'Test Board',
    description: 'A test board for unit testing',
    icon: '🧪',
    category: 'Manual',
    controlLevel: 'full-manual',
    difficulty: 'beginner',
    tags: ['test', 'manual'],
    primaryView: 'tracker',
    philosophy: 'Testing philosophy',
    compositionTools: {
      phraseDatabase: { enabled: false, mode: 'hidden' },
      harmonyExplorer: { enabled: false, mode: 'hidden' },
      phraseGenerators: { enabled: false, mode: 'hidden' },
      arrangerCard: { enabled: false, mode: 'hidden' },
      aiComposer: { enabled: false, mode: 'hidden' },
    },
    panels: [],
    layout: {
      type: 'dock',
      panels: [],
    },
    decks: [],
    connections: [],
    shortcuts: {},
    author: 'Test Author',
    version: '1.0.0',
  };
  
  beforeEach(() => {
    registry = new BoardRegistry();
  });
  
  describe('register', () => {
    it('should register a valid board', () => {
      expect(() => registry.register(mockBoard)).not.toThrow();
      expect(registry.get('test-board')).toBe(mockBoard);
    });
    
    it('should throw on duplicate board id', () => {
      registry.register(mockBoard);
      expect(() => registry.register(mockBoard)).toThrow(/already registered/i);
    });
    
    it('should validate board before registration', () => {
      const invalidBoard = { ...mockBoard, id: '' };
      expect(() => registry.register(invalidBoard as Board)).toThrow();
    });
  });
  
  describe('get', () => {
    it('should return registered board', () => {
      registry.register(mockBoard);
      expect(registry.get('test-board')).toBe(mockBoard);
    });
    
    it('should return undefined for unknown board', () => {
      expect(registry.get('unknown-board')).toBeUndefined();
    });
  });
  
  describe('list', () => {
    it('should return all registered boards', () => {
      const board2: Board = { ...mockBoard, id: 'board-2', name: 'Board 2' };
      registry.register(mockBoard);
      registry.register(board2);
      
      const boards = registry.list();
      expect(boards).toHaveLength(2);
      expect(boards).toContain(mockBoard);
      expect(boards).toContain(board2);
    });
    
    it('should return boards sorted by category then name', () => {
      const manual1: Board = { ...mockBoard, id: 'manual-1', name: 'Z Manual', category: 'Manual' };
      const manual2: Board = { ...mockBoard, id: 'manual-2', name: 'A Manual', category: 'Manual' };
      const assisted: Board = { ...mockBoard, id: 'assisted-1', name: 'Assisted', category: 'Assisted' };
      
      registry.register(manual1);
      registry.register(assisted);
      registry.register(manual2);
      
      const boards = registry.list();
      expect(boards[0].id).toBe('assisted-1'); // Assisted comes before Manual
      expect(boards[1].id).toBe('manual-2'); // A comes before Z
      expect(boards[2].id).toBe('manual-1');
    });
  });
  
  describe('getByControlLevel', () => {
    it('should filter boards by control level', () => {
      const manual: Board = { ...mockBoard, id: 'manual', controlLevel: 'full-manual' };
      const assisted: Board = { ...mockBoard, id: 'assisted', controlLevel: 'assisted' };
      
      registry.register(manual);
      registry.register(assisted);
      
      const manualBoards = registry.getByControlLevel('full-manual');
      expect(manualBoards).toHaveLength(1);
      expect(manualBoards[0].id).toBe('manual');
    });
  });
  
  describe('search', () => {
    it('should find boards by name', () => {
      registry.register(mockBoard);
      const results = registry.search('Test');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('test-board');
    });
    
    it('should find boards by description', () => {
      registry.register(mockBoard);
      const results = registry.search('unit testing');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('test-board');
    });
    
    it('should find boards by tags', () => {
      registry.register(mockBoard);
      const results = registry.search('manual');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('test-board');
    });
    
    it('should be case-insensitive', () => {
      registry.register(mockBoard);
      const results = registry.search('TEST');
      expect(results).toHaveLength(1);
    });
    
    it('should return empty array when no matches', () => {
      registry.register(mockBoard);
      const results = registry.search('nonexistent');
      expect(results).toHaveLength(0);
    });
  });
  
  describe('getByDifficulty', () => {
    it('should filter boards by difficulty', () => {
      const beginner: Board = { ...mockBoard, id: 'beginner', difficulty: 'beginner' };
      const advanced: Board = { ...mockBoard, id: 'advanced', difficulty: 'advanced' };
      
      registry.register(beginner);
      registry.register(advanced);
      
      const beginnerBoards = registry.getByDifficulty('beginner');
      expect(beginnerBoards).toHaveLength(1);
      expect(beginnerBoards[0].id).toBe('beginner');
    });
  });
});
