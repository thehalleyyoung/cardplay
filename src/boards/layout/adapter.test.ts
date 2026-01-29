/**
 * @fileoverview Layout Adapter Tests
 * 
 * B125: Tests for default layout runtime generation.
 */

import { describe, it, expect } from 'vitest';
import { createDefaultLayoutRuntime, mergePersistedLayout } from './adapter';
import type { Board } from '../types';

describe('Layout Adapter', () => {
  const createTestBoard = (): Board => ({
    id: 'test-board',
    name: 'Test Board',
    description: 'Test board for layout',
    icon: '🎹',
    category: 'testing',
    version: '1.0.0',
    controlLevel: 'full-manual',
    compositionTools: {
      phraseDatabase: { enabled: false, mode: 'hidden' },
      harmonyExplorer: { enabled: false, mode: 'hidden' },
      phraseGenerators: { enabled: false, mode: 'hidden' },
      arrangerCard: { enabled: false, mode: 'hidden' },
      aiComposer: { enabled: false, mode: 'hidden' },
    },
    primaryView: 'tracker',
    layout: {
      type: 'dock',
      panels: [
        {
          id: 'left',
          role: 'browser',
          position: 'left',
          defaultWidth: 250,
        },
        {
          id: 'center',
          role: 'composition',
          position: 'center',
        },
        {
          id: 'right',
          role: 'properties',
          position: 'right',
          defaultWidth: 300,
        },
      ],
    },
    decks: [],
    difficulty: 'beginner',
    tags: ['test'],
  });

  describe('createDefaultLayoutRuntime', () => {
    it('should create runtime from board definition', () => {
      const board = createTestBoard();
      const runtime = createDefaultLayoutRuntime(board);

      expect(runtime).toBeDefined();
      expect(runtime.root).toBeDefined();
      expect(runtime.panels).toBeDefined();
      expect(runtime.timestamp).toBeGreaterThan(0);
    });

    it('should create panel runtimes for all panels', () => {
      const board = createTestBoard();
      const runtime = createDefaultLayoutRuntime(board);

      expect(runtime.panels.size).toBe(3);
      expect(runtime.panels.has('left')).toBe(true);
      expect(runtime.panels.has('center')).toBe(true);
      expect(runtime.panels.has('right')).toBe(true);
    });

    it('should respect default panel widths', () => {
      const board = createTestBoard();
      const runtime = createDefaultLayoutRuntime(board);

      const leftPanel = runtime.panels.get('left');
      const rightPanel = runtime.panels.get('right');

      expect(leftPanel?.size).toBe('250px');
      expect(rightPanel?.size).toBe('300px');
    });

    it('should use default width when not specified', () => {
      const board = createTestBoard();
      const runtime = createDefaultLayoutRuntime(board);

      const centerPanel = runtime.panels.get('center');
      expect(centerPanel?.size).toBe('300px'); // Default fallback
    });

    it('should initialize panels as not collapsed', () => {
      const board = createTestBoard();
      const runtime = createDefaultLayoutRuntime(board);

      runtime.panels.forEach(panel => {
        expect(panel.collapsed).toBe(false);
      });
    });

    it('should initialize panels with null active tab', () => {
      const board = createTestBoard();
      const runtime = createDefaultLayoutRuntime(board);

      runtime.panels.forEach(panel => {
        expect(panel.activeTabId).toBeNull();
      });
    });

    it('should initialize panel scroll positions to zero', () => {
      const board = createTestBoard();
      const runtime = createDefaultLayoutRuntime(board);

      runtime.panels.forEach(panel => {
        expect(panel.scrollTop).toBe(0);
        expect(panel.scrollLeft).toBe(0);
      });
    });

    it('should initialize panels as visible', () => {
      const board = createTestBoard();
      const runtime = createDefaultLayoutRuntime(board);

      runtime.panels.forEach(panel => {
        expect(panel.visible).toBe(true);
      });
    });

    it('should handle board with no panels', () => {
      const board = createTestBoard();
      board.layout.panels = [];

      const runtime = createDefaultLayoutRuntime(board);

      expect(runtime.panels.size).toBe(0);
    });

    it('should create stable layout for same board', () => {
      const board = createTestBoard();
      const runtime1 = createDefaultLayoutRuntime(board);
      const runtime2 = createDefaultLayoutRuntime(board);

      expect(runtime1.panels.size).toBe(runtime2.panels.size);
      expect(Array.from(runtime1.panels.keys()).sort()).toEqual(
        Array.from(runtime2.panels.keys()).sort()
      );
    });
  });

  describe('mergePersistedLayout', () => {
    it('should merge persisted sizes into default runtime', () => {
      const board = createTestBoard();
      const defaultRuntime = createDefaultLayoutRuntime(board);

      const persisted = {
        root: defaultRuntime.root,
        panels: new Map([
          ['left', { ...defaultRuntime.panels.get('left')!, size: '400px' }],
          ['right', { ...defaultRuntime.panels.get('right')!, size: '500px' }],
        ]),
        timestamp: Date.now(),
      };

      const merged = mergePersistedLayout(board, persisted);

      expect(merged.panels.get('left')?.size).toBe('400px');
      expect(merged.panels.get('right')?.size).toBe('500px');
    });

    it('should merge persisted collapsed state', () => {
      const board = createTestBoard();
      const defaultRuntime = createDefaultLayoutRuntime(board);

      const persisted = {
        root: defaultRuntime.root,
        panels: new Map([
          ['left', { ...defaultRuntime.panels.get('left')!, collapsed: true }],
        ]),
        timestamp: Date.now(),
      };

      const merged = mergePersistedLayout(board, persisted);

      expect(merged.panels.get('left')?.collapsed).toBe(true);
    });

    it('should merge persisted active tab IDs', () => {
      const board = createTestBoard();
      const defaultRuntime = createDefaultLayoutRuntime(board);

      const persisted = {
        root: defaultRuntime.root,
        panels: new Map([
          ['left', { ...defaultRuntime.panels.get('left')!, activeTabId: 'tab-1' }],
          ['center', { ...defaultRuntime.panels.get('center')!, activeTabId: 'tab-2' }],
        ]),
        timestamp: Date.now(),
      };

      const merged = mergePersistedLayout(board, persisted);

      expect(merged.panels.get('left')?.activeTabId).toBe('tab-1');
      expect(merged.panels.get('center')?.activeTabId).toBe('tab-2');
    });

    it('should merge persisted scroll positions', () => {
      const board = createTestBoard();
      const defaultRuntime = createDefaultLayoutRuntime(board);

      const persisted = {
        root: defaultRuntime.root,
        panels: new Map([
          ['left', { ...defaultRuntime.panels.get('left')!, scrollTop: 100, scrollLeft: 50 }],
        ]),
        timestamp: Date.now(),
      };

      const merged = mergePersistedLayout(board, persisted);

      expect(merged.panels.get('left')?.scrollTop).toBe(100);
      expect(merged.panels.get('left')?.scrollLeft).toBe(50);
    });

    it('should ignore persisted panels not in board definition', () => {
      const board = createTestBoard();
      const defaultRuntime = createDefaultLayoutRuntime(board);

      const persisted = {
        root: defaultRuntime.root,
        panels: new Map([
          ['left', defaultRuntime.panels.get('left')!],
          ['nonexistent', {
            id: 'nonexistent',
            position: 'left' as const,
            size: '200px',
            collapsed: false,
            activeTabId: null,
            tabOrder: [],
            scrollTop: 0,
            scrollLeft: 0,
            visible: true,
          }],
        ]),
        timestamp: Date.now(),
      };

      const merged = mergePersistedLayout(board, persisted);

      expect(merged.panels.has('nonexistent')).toBe(false);
      expect(merged.panels.size).toBe(3); // Only the 3 defined panels
    });

    it('should add missing panels from board definition', () => {
      const board = createTestBoard();
      const defaultRuntime = createDefaultLayoutRuntime(board);

      // Persisted state is missing 'right' panel
      const persisted = {
        root: defaultRuntime.root,
        panels: new Map([
          ['left', defaultRuntime.panels.get('left')!],
          ['center', defaultRuntime.panels.get('center')!],
        ]),
        timestamp: Date.now(),
      };

      const merged = mergePersistedLayout(board, persisted);

      expect(merged.panels.has('right')).toBe(true);
      expect(merged.panels.size).toBe(3);
    });

    it('should not mutate persisted layout', () => {
      const board = createTestBoard();
      const defaultRuntime = createDefaultLayoutRuntime(board);

      const persisted = {
        root: defaultRuntime.root,
        panels: new Map([
          ['left', { ...defaultRuntime.panels.get('left')!, size: '400px' }],
        ]),
        timestamp: Date.now(),
      };

      const originalSize = persisted.panels.get('left')?.size;
      
      mergePersistedLayout(board, persisted);

      expect(persisted.panels.get('left')?.size).toBe(originalSize);
    });

    it('should update timestamp on merge', () => {
      const board = createTestBoard();
      const defaultRuntime = createDefaultLayoutRuntime(board);

      const oldTimestamp = Date.now() - 10000;
      const persisted = {
        root: defaultRuntime.root,
        panels: defaultRuntime.panels,
        timestamp: oldTimestamp,
      };

      const merged = mergePersistedLayout(board, persisted);

      expect(merged.timestamp).toBeGreaterThan(oldTimestamp);
    });
  });
});
