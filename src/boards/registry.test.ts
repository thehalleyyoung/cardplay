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
      expect(() => registry.register(mockBoard, { isBuiltin: true })).not.toThrow();
      expect(registry.get('test-board')).toBe(mockBoard);
    });
    
    it('should throw on duplicate board id', () => {
      registry.register(mockBoard, { isBuiltin: true });
      expect(() => registry.register(mockBoard, { isBuiltin: true })).toThrow(/already registered/i);
    });
    
    it('should validate board before registration', () => {
      const invalidBoard = { ...mockBoard, id: '' };
      expect(() => registry.register(invalidBoard as Board, { isBuiltin: true })).toThrow();
    });
  });
  
  describe('get', () => {
    it('should return registered board', () => {
      registry.register(mockBoard, { isBuiltin: true });
      expect(registry.get('test-board')).toBe(mockBoard);
    });
    });
    
    it('should return undefined for unknown board', () => {
      expect(registry.get('unknown-board')).toBeUndefined();
    });
  });
  
  describe('list', () => {
    it('should return all registered boards', () => {
      const board2: Board = { ...mockBoard, id: 'board-2', name: 'Board 2' };
      registry.register(mockBoard, { isBuiltin: true });
      registry.register(board2, { isBuiltin: true });
      
      const boards = registry.list();
      expect(boards).toHaveLength(2);
      expect(boards).toContain(mockBoard);
      expect(boards).toContain(board2);
    });
    
    it('should return boards sorted by category then name', () => {
      const manual1: Board = { ...mockBoard, id: 'manual-1', name: 'Z Manual', category: 'Manual' };
      const manual2: Board = { ...mockBoard, id: 'manual-2', name: 'A Manual', category: 'Manual' };
      const assisted: Board = { ...mockBoard, id: 'assisted-1', name: 'Assisted', category: 'Assisted' };
      
      registry.register(manual1, { isBuiltin: true });
      registry.register(assisted, { isBuiltin: true });
      registry.register(manual2, { isBuiltin: true });
      
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
      
      registry.register(manual, { isBuiltin: true });
      registry.register(assisted, { isBuiltin: true });
      
      const manualBoards = registry.getByControlLevel('full-manual');
      expect(manualBoards).toHaveLength(1);
      expect(manualBoards[0].id).toBe('manual');
    });
  });
  
  describe('search', () => {
    it('should find boards by name', () => {
      registry.register(mockBoard, { isBuiltin: true });
      const results = registry.search('Test');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('test-board');
    });
    
    it('should find boards by description', () => {
      registry.register(mockBoard, { isBuiltin: true });
      const results = registry.search('unit testing');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('test-board');
    });
    
    it('should find boards by tags', () => {
      registry.register(mockBoard, { isBuiltin: true });
      const results = registry.search('manual');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('test-board');
    });
    
    it('should be case-insensitive', () => {
      registry.register(mockBoard, { isBuiltin: true });
      const results = registry.search('TEST');
      expect(results).toHaveLength(1);
    });
    
    it('should return empty array when no matches', () => {
      registry.register(mockBoard, { isBuiltin: true });
      const results = registry.search('nonexistent');
      expect(results).toHaveLength(0);
    });
    
    it('C085: should prioritize prefix matches over contains', () => {
      const board1 = { ...mockBoard, id: 'board-1', name: 'Test Board', description: 'First board' };
      const board2 = { ...mockBoard, id: 'board-2', name: 'My Test', description: 'Second board' };
      const board3 = { ...mockBoard, id: 'board-3', name: 'Another Board', description: 'Test description' };
      
      registry.register(board1, { isBuiltin: true });
      registry.register(board2, { isBuiltin: true });
      registry.register(board3, { isBuiltin: true });
      
      const results = registry.search('test');
      
      // All should match
      expect(results).toHaveLength(3);
      
      // board1 and board3 start with "Test" - prefix matches first
      const firstTwo = results.slice(0, 2).map(b => b.id);
      expect(firstTwo).toContain('board-1');
      expect(firstTwo).toContain('board-3');
    });
  });
  
  describe('getByDifficulty', () => {
    it('should filter boards by difficulty', () => {
      const beginner: Board = { ...mockBoard, id: 'beginner', difficulty: 'beginner' };
      const advanced: Board = { ...mockBoard, id: 'advanced', difficulty: 'advanced' };
      
      registry.register(beginner, { isBuiltin: true });
      registry.register(advanced, { isBuiltin: true });
      
      const beginnerBoards = registry.getByDifficulty('beginner');
      expect(beginnerBoards).toHaveLength(1);
      expect(beginnerBoards[0].id).toBe('beginner');
    });
  });
});
