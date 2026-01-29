/**
 * @fileoverview Board Recommendations Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  getRecommendedBoardIds, 
  getRecommendedBoards, 
  getDefaultBoardId,
  inferUserType 
} from './recommendations';
import { getBoardRegistry, resetBoardRegistry } from './registry';
import { registerBuiltinBoards } from './builtins/register';

describe('Board Recommendations', () => {
  beforeEach(() => {
    // Clear registry and re-register builtin boards for clean state
    resetBoardRegistry();
    registerBuiltinBoards();
  });

  describe('getRecommendedBoardIds', () => {
    it('returns board IDs for notation-composer', () => {
      const ids = getRecommendedBoardIds('notation-composer');
      expect(ids).toContain('notation-manual');
      expect(ids.length).toBeGreaterThan(0);
    });

    it('returns board IDs for tracker-user', () => {
      const ids = getRecommendedBoardIds('tracker-user');
      expect(ids).toContain('basic-tracker');
      expect(ids.length).toBeGreaterThan(0);
    });

    it('returns board IDs for producer', () => {
      const ids = getRecommendedBoardIds('producer');
      expect(ids).toContain('basic-session');
      expect(ids.length).toBeGreaterThan(0);
    });

    it('returns board IDs for sound-designer', () => {
      const ids = getRecommendedBoardIds('sound-designer');
      expect(ids).toContain('basic-sampler');
      expect(ids.length).toBeGreaterThan(0);
    });

    it('returns board IDs for beginner', () => {
      const ids = getRecommendedBoardIds('beginner');
      expect(ids).toContain('basic-tracker');
      expect(ids.length).toBeGreaterThan(0);
    });
  });

  describe('getRecommendedBoards', () => {
    it('returns actual board objects from registry', () => {
      const registry = getBoardRegistry();
      const boards = getRecommendedBoards('tracker-user', registry);
      
      expect(boards.length).toBeGreaterThan(0);
      boards.forEach(board => {
        expect(board).toHaveProperty('id');
        expect(board).toHaveProperty('name');
        expect(board).toHaveProperty('controlLevel');
      });
    });

    it('filters out non-existent boards', () => {
      const registry = getBoardRegistry();
      const boards = getRecommendedBoards('ai-explorer', registry);
      
      // Some AI boards may not be implemented yet, so this should not error
      expect(boards).toBeInstanceOf(Array);
      boards.forEach(board => {
        expect(board).toHaveProperty('id');
      });
    });
  });

  describe('getDefaultBoardId', () => {
    it('returns first recommended board for notation-composer', () => {
      const defaultId = getDefaultBoardId('notation-composer');
      expect(defaultId).toBe('notation-manual');
    });

    it('returns first recommended board for tracker-user', () => {
      const defaultId = getDefaultBoardId('tracker-user');
      expect(defaultId).toBe('basic-tracker');
    });
  });

  describe('inferUserType', () => {
    it('infers notation-composer from background', () => {
      const userType = inferUserType({ background: 'I compose notation scores' });
      expect(userType).toBe('notation-composer');
    });

    it('infers tracker-user from background', () => {
      const userType = inferUserType({ background: 'I use trackers like Renoise' });
      expect(userType).toBe('tracker-user');
    });

    it('infers producer from goal', () => {
      const userType = inferUserType({ goal: 'I want to produce beats' });
      expect(userType).toBe('producer');
    });

    it('infers sound-designer from background', () => {
      const userType = inferUserType({ background: 'I do sound design' });
      expect(userType).toBe('sound-designer');
    });

    it('defaults to beginner for no input', () => {
      const userType = inferUserType({});
      expect(userType).toBe('beginner');
    });
  });
});
