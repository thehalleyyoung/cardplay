/**
 * @fileoverview Board Validation Tests
 * 
 * Tests for board definition validation.
 * 
 * @module @cardplay/boards/validate.test
 */

import { describe, it, expect } from 'vitest';
import { validateBoard, assertValidBoard } from './validate';
import type { Board } from './types';

describe('validateBoard', () => {
  const validBoard: Board = {
    id: 'valid-board',
    name: 'Valid Board',
    description: 'A valid board',
    icon: '✅',
    category: 'Manual',
    controlLevel: 'full-manual',
    difficulty: 'beginner',
    tags: ['test'],
    primaryView: 'tracker',
    philosophy: 'Test philosophy',
    compositionTools: {
      phraseDatabase: { enabled: false, mode: 'hidden' },
      harmonyExplorer: { enabled: false, mode: 'hidden' },
      phraseGenerators: { enabled: false, mode: 'hidden' },
      arrangerCard: { enabled: false, mode: 'hidden' },
      aiComposer: { enabled: false, mode: 'hidden' },
    },
    panels: [
      {
        id: 'main',
        role: 'composition',
        position: 'center',
      },
    ],
    layout: {
      type: 'dock',
      panels: [],
    },
    decks: [
      {
        id: 'deck-1',
        type: 'pattern-deck',
        cardLayout: 'stack',
        allowReordering: false,
        allowDragOut: false,
      },
    ],
    connections: [],
    shortcuts: {},
    author: 'Test Author',
    version: '1.0.0',
  };
  
  it('should accept a valid board', () => {
    const result = validateBoard(validBoard);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
  
  it('should reject empty board id', () => {
    const board = { ...validBoard, id: '' };
    const result = validateBoard(board);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.toLowerCase().includes('board id'))).toBe(true);
  });
  
  it('should reject missing name', () => {
    const board = { ...validBoard, name: '' };
    const result = validateBoard(board);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.toLowerCase().includes('board name'))).toBe(true);
  });
  
  it('should reject duplicate deck ids', () => {
    const board: Board = {
      ...validBoard,
      decks: [
        {
          id: 'deck-1',
          type: 'pattern-deck',
          cardLayout: 'stack',
          allowReordering: false,
          allowDragOut: false,
        },
        {
          id: 'deck-1', // Duplicate!
          type: 'notation-deck',
          cardLayout: 'stack',
          allowReordering: false,
          allowDragOut: false,
        },
      ],
    };
    const result = validateBoard(board);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.toLowerCase().includes('duplicate deck id'))).toBe(true);
  });
  
  it('should reject duplicate panel ids', () => {
    const board: Board = {
      ...validBoard,
      panels: [
        {
          id: 'panel-1',
          role: 'composition',
          position: 'center',
        },
        {
          id: 'panel-1', // Duplicate!
          role: 'browser',
          position: 'left',
        },
      ],
    };
    const result = validateBoard(board);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.toLowerCase().includes('duplicate panel id'))).toBe(true);
  });
  
  it('should warn about inconsistent tool config (enabled false but mode not hidden)', () => {
    const board: Board = {
      ...validBoard,
      compositionTools: {
        ...validBoard.compositionTools,
        phraseDatabase: { enabled: false, mode: 'drag-drop' }, // Inconsistent!
      },
    };
    const result = validateBoard(board);
    // This is a warning, not an error, so board is still valid
    expect(result.errors.some(e => e.severity === 'warning' && e.message.toLowerCase().includes('tool'))).toBe(true);
  });
  
  it('assertValidBoard should throw on invalid board', () => {
    const board = { ...validBoard, id: '' };
    expect(() => assertValidBoard(board)).toThrow(/invalid board/i);
  });
});
