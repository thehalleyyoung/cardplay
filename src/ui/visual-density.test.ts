/**
 * @fileoverview Visual Density Manager Tests
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  VisualDensityManager,
  DENSITY_PRESETS,
  type VisualDensity
} from './visual-density';

describe('VisualDensityManager', () => {
  let manager: VisualDensityManager;
  
  beforeEach(() => {
    // Mock localStorage
    const storage = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
        clear: () => storage.clear(),
        key: (index: number) => Array.from(storage.keys())[index] ?? null,
        get length() { return storage.size; }
      },
      writable: true,
      configurable: true
    });
    
    // Fresh instance for each test
    // @ts-expect-error - Resetting singleton for testing
    VisualDensityManager.instance = undefined;
    manager = VisualDensityManager.getInstance();
  });
  
  afterEach(() => {
    // Clean up
    // @ts-expect-error - Resetting singleton
    VisualDensityManager.instance = undefined;
  });
  
  describe('getConfig', () => {
    it('returns comfortable preset by default', () => {
      const config = manager.getConfig('test-board', 'tracker');
      expect(config).toEqual(DENSITY_PRESETS.comfortable.tracker);
    });
    
    it('returns correct preset after setBoardDensity', () => {
      manager.setBoardDensity('test-board', 'compact');
      
      const config = manager.getConfig('test-board', 'tracker');
      expect(config).toEqual(DENSITY_PRESETS.compact.tracker);
    });
    
    it('respects view-specific overrides', () => {
      manager.setBoardDensity('test-board', 'comfortable');
      manager.setViewDensity('test-board', 'tracker', 'compact');
      
      const trackerConfig = manager.getConfig('test-board', 'tracker');
      const sessionConfig = manager.getConfig('test-board', 'session');
      
      expect(trackerConfig).toEqual(DENSITY_PRESETS.compact.tracker);
      expect(sessionConfig).toEqual(DENSITY_PRESETS.comfortable.session);
    });
  });
  
  describe('setBoardDensity', () => {
    it('sets density for board', () => {
      manager.setBoardDensity('test-board', 'spacious');
      
      const density = manager.getBoardDensity('test-board');
      expect(density).toBe('spacious');
    });
    
    it('notifies listeners on change', () => {
      let called = false;
      manager.subscribe(() => {
        called = true;
      });
      
      manager.setBoardDensity('test-board', 'compact');
      
      expect(called).toBe(true);
    });
    
    it('persists to localStorage', () => {
      manager.setBoardDensity('test-board', 'compact');
      
      const stored = localStorage.getItem('cardplay.density.v1');
      expect(stored).toBeTruthy();
      
      const data = JSON.parse(stored!);
      expect(data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            boardId: 'test-board',
            globalDensity: 'compact'
          })
        ])
      );
    });
    
    it('preserves view overrides when changing global density', () => {
      manager.setBoardDensity('test-board', 'comfortable');
      manager.setViewDensity('test-board', 'tracker', 'compact');
      
      manager.setBoardDensity('test-board', 'spacious');
      
      // Tracker should still be compact
      const trackerConfig = manager.getConfig('test-board', 'tracker');
      expect(trackerConfig).toEqual(DENSITY_PRESETS.compact.tracker);
      
      // Session should be spacious (global)
      const sessionConfig = manager.getConfig('test-board', 'session');
      expect(sessionConfig).toEqual(DENSITY_PRESETS.spacious.session);
    });
  });
  
  describe('setViewDensity', () => {
    it('sets density for specific view', () => {
      manager.setViewDensity('test-board', 'tracker', 'compact');
      
      const trackerConfig = manager.getConfig('test-board', 'tracker');
      expect(trackerConfig).toEqual(DENSITY_PRESETS.compact.tracker);
    });
    
    it('does not affect other views', () => {
      manager.setBoardDensity('test-board', 'comfortable');
      manager.setViewDensity('test-board', 'tracker', 'spacious');
      
      const sessionConfig = manager.getConfig('test-board', 'session');
      expect(sessionConfig).toEqual(DENSITY_PRESETS.comfortable.session);
    });
  });
  
  describe('resetBoardDensity', () => {
    it('resets to default', () => {
      manager.setBoardDensity('test-board', 'compact');
      manager.resetBoardDensity('test-board');
      
      const density = manager.getBoardDensity('test-board');
      expect(density).toBe('comfortable');
    });
    
    it('removes from localStorage', () => {
      manager.setBoardDensity('test-board', 'compact');
      manager.resetBoardDensity('test-board');
      
      const stored = localStorage.getItem('cardplay.density.v1');
      const data = stored ? JSON.parse(stored) : [];
      
      const hasBoardSettings = data.some((s: any) => s.boardId === 'test-board');
      expect(hasBoardSettings).toBe(false);
    });
  });
  
  describe('subscribe', () => {
    it('calls listener on change', () => {
      let callCount = 0;
      manager.subscribe(() => {
        callCount++;
      });
      
      manager.setBoardDensity('test-board', 'compact');
      manager.setBoardDensity('test-board', 'spacious');
      
      expect(callCount).toBe(2);
    });
    
    it('unsubscribe stops calling listener', () => {
      let callCount = 0;
      const unsubscribe = manager.subscribe(() => {
        callCount++;
      });
      
      manager.setBoardDensity('test-board', 'compact');
      unsubscribe();
      manager.setBoardDensity('test-board', 'spacious');
      
      expect(callCount).toBe(1);
    });
  });
  
  describe('applyCSSVariables', () => {
    it('sets CSS custom properties on element', () => {
      const element = document.createElement('div');
      manager.setBoardDensity('test-board', 'compact');
      
      manager.applyCSSVariables('test-board', 'tracker', element);
      
      const config = DENSITY_PRESETS.compact.tracker;
      expect(element.style.getPropertyValue('--row-height')).toBe(`${config.rowHeight}px`);
      expect(element.style.getPropertyValue('--font-size')).toBe(`${config.fontSize}px`);
      expect(element.style.getPropertyValue('--line-height')).toBe(`${config.lineHeight}`);
    });
  });
  
  describe('DENSITY_PRESETS', () => {
    it('has all required view types', () => {
      const densities: VisualDensity[] = ['compact', 'comfortable', 'spacious'];
      const views = ['tracker', 'session', 'pianoRoll', 'timeline'];
      
      densities.forEach(density => {
        views.forEach(view => {
          expect(DENSITY_PRESETS[density]).toHaveProperty(view);
        });
      });
    });
    
    it('has increasing row heights from compact to spacious', () => {
      expect(DENSITY_PRESETS.compact.tracker.rowHeight)
        .toBeLessThan(DENSITY_PRESETS.comfortable.tracker.rowHeight);
      expect(DENSITY_PRESETS.comfortable.tracker.rowHeight)
        .toBeLessThan(DENSITY_PRESETS.spacious.tracker.rowHeight);
    });
    
    it('has valid config values', () => {
      const densities: VisualDensity[] = ['compact', 'comfortable', 'spacious'];
      const views = ['tracker', 'session', 'pianoRoll', 'timeline'] as const;
      
      densities.forEach(density => {
        views.forEach(view => {
          const config = DENSITY_PRESETS[density][view];
          
          expect(config.rowHeight).toBeGreaterThan(0);
          expect(config.columnPadding).toBeGreaterThanOrEqual(0);
          expect(config.fontSize).toBeGreaterThan(0);
          expect(config.lineHeight).toBeGreaterThan(0);
          expect(config.cellPadding).toBeGreaterThanOrEqual(0);
        });
      });
    });
  });
});
