/**
 * @fileoverview Layout Serialization Tests
 * 
 * B126: Tests for layout serialize/deserialize stability.
 */

import { describe, it, expect } from 'vitest';
import { serializeLayoutRuntime } from './serialize';
import { deserializeLayoutRuntime } from './deserialize';
import type { BoardLayoutRuntime, PanelRuntime } from './runtime-types';

describe('Layout Serialization', () => {
  const createTestRuntime = (): BoardLayoutRuntime => {
    const panels = new Map<string, PanelRuntime>([
      ['left', {
        id: 'left',
        position: 'left',
        size: '250px',
        collapsed: false,
        activeTabId: 'tab-1',
        tabOrder: ['tab-1', 'tab-2'],
        scrollTop: 0,
        scrollLeft: 0,
        visible: true,
      }],
      ['center', {
        id: 'center',
        position: 'center',
        size: '100%',
        collapsed: false,
        activeTabId: null,
        tabOrder: [],
        scrollTop: 50,
        scrollLeft: 20,
        visible: true,
      }],
      ['right', {
        id: 'right',
        position: 'right',
        size: '300px',
        collapsed: true,
        activeTabId: 'tab-3',
        tabOrder: ['tab-3'],
        scrollTop: 100,
        scrollLeft: 0,
        visible: false,
      }],
    ]);

    return {
      root: {
        type: 'panel',
        panelId: 'center',
      },
      panels,
      timestamp: Date.now(),
    };
  };

  describe('serializeLayoutRuntime', () => {
    it('should serialize runtime to plain object', () => {
      const runtime = createTestRuntime();
      const serialized = serializeLayoutRuntime(runtime);

      expect(serialized).toBeDefined();
      expect(typeof serialized).toBe('object');
    });

    it('should convert Map to plain object', () => {
      const runtime = createTestRuntime();
      const serialized = serializeLayoutRuntime(runtime);

      expect(serialized.panels).toBeDefined();
      expect(serialized.panels).not.toBeInstanceOf(Map);
      expect(typeof serialized.panels).toBe('object');
    });

    it('should preserve all panel data', () => {
      const runtime = createTestRuntime();
      const serialized = serializeLayoutRuntime(runtime);

      const leftPanel = serialized.panels.left;
      expect(leftPanel).toBeDefined();
      expect(leftPanel.id).toBe('left');
      expect(leftPanel.position).toBe('left');
      expect(leftPanel.size).toBe('250px');
      expect(leftPanel.collapsed).toBe(false);
      expect(leftPanel.activeTabId).toBe('tab-1');
      expect(leftPanel.tabOrder).toEqual(['tab-1', 'tab-2']);
      expect(leftPanel.scrollTop).toBe(0);
      expect(leftPanel.scrollLeft).toBe(0);
      expect(leftPanel.visible).toBe(true);
    });

    it('should preserve timestamp', () => {
      const runtime = createTestRuntime();
      const serialized = serializeLayoutRuntime(runtime);

      expect(serialized.timestamp).toBe(runtime.timestamp);
    });

    it('should be JSON serializable', () => {
      const runtime = createTestRuntime();
      const serialized = serializeLayoutRuntime(runtime);

      expect(() => JSON.stringify(serialized)).not.toThrow();
    });

    it('should not include functions', () => {
      const runtime = createTestRuntime();
      const serialized = serializeLayoutRuntime(runtime);

      const json = JSON.stringify(serialized);
      const parsed = JSON.parse(json);

      // Should be able to round-trip without losing data
      expect(parsed.panels.left).toBeDefined();
    });
  });

  describe('deserializeLayoutRuntime', () => {
    it('should deserialize from plain object', () => {
      const runtime = createTestRuntime();
      const serialized = serializeLayoutRuntime(runtime);
      const deserialized = deserializeLayoutRuntime(serialized);

      expect(deserialized).toBeDefined();
      expect(deserialized.panels).toBeInstanceOf(Map);
    });

    it('should restore all panel data', () => {
      const runtime = createTestRuntime();
      const serialized = serializeLayoutRuntime(runtime);
      const deserialized = deserializeLayoutRuntime(serialized);

      const leftPanel = deserialized.panels.get('left');
      expect(leftPanel).toBeDefined();
      expect(leftPanel?.id).toBe('left');
      expect(leftPanel?.position).toBe('left');
      expect(leftPanel?.size).toBe('250px');
      expect(leftPanel?.collapsed).toBe(false);
      expect(leftPanel?.activeTabId).toBe('tab-1');
      expect(leftPanel?.tabOrder).toEqual(['tab-1', 'tab-2']);
      expect(leftPanel?.scrollTop).toBe(0);
      expect(leftPanel?.scrollLeft).toBe(0);
      expect(leftPanel?.visible).toBe(true);
    });

    it('should restore all panels', () => {
      const runtime = createTestRuntime();
      const serialized = serializeLayoutRuntime(runtime);
      const deserialized = deserializeLayoutRuntime(serialized);

      expect(deserialized.panels.size).toBe(3);
      expect(deserialized.panels.has('left')).toBe(true);
      expect(deserialized.panels.has('center')).toBe(true);
      expect(deserialized.panels.has('right')).toBe(true);
    });

    it('should restore timestamp', () => {
      const runtime = createTestRuntime();
      const serialized = serializeLayoutRuntime(runtime);
      const deserialized = deserializeLayoutRuntime(serialized);

      expect(deserialized.timestamp).toBe(runtime.timestamp);
    });
  });

  describe('round-trip stability', () => {
    it('should survive serialize → deserialize round-trip', () => {
      const original = createTestRuntime();
      const serialized = serializeLayoutRuntime(original);
      const deserialized = deserializeLayoutRuntime(serialized);

      expect(deserialized.panels.size).toBe(original.panels.size);
      expect(deserialized.timestamp).toBe(original.timestamp);

      // Check each panel
      original.panels.forEach((originalPanel, panelId) => {
        const deserializedPanel = deserialized.panels.get(panelId);
        expect(deserializedPanel).toBeDefined();
        expect(deserializedPanel?.id).toBe(originalPanel.id);
        expect(deserializedPanel?.position).toBe(originalPanel.position);
        expect(deserializedPanel?.size).toBe(originalPanel.size);
        expect(deserializedPanel?.collapsed).toBe(originalPanel.collapsed);
        expect(deserializedPanel?.activeTabId).toBe(originalPanel.activeTabId);
        expect(deserializedPanel?.tabOrder).toEqual(originalPanel.tabOrder);
        expect(deserializedPanel?.scrollTop).toBe(originalPanel.scrollTop);
        expect(deserializedPanel?.scrollLeft).toBe(originalPanel.scrollLeft);
        expect(deserializedPanel?.visible).toBe(originalPanel.visible);
      });
    });

    it('should survive JSON round-trip', () => {
      const original = createTestRuntime();
      const serialized = serializeLayoutRuntime(original);
      const json = JSON.stringify(serialized);
      const parsed = JSON.parse(json);
      const deserialized = deserializeLayoutRuntime(parsed);

      expect(deserialized.panels.size).toBe(original.panels.size);
      expect(deserialized.timestamp).toBe(original.timestamp);
    });

    it('should survive multiple round-trips', () => {
      let runtime = createTestRuntime();

      // Do 5 round-trips
      for (let i = 0; i < 5; i++) {
        const serialized = serializeLayoutRuntime(runtime);
        runtime = deserializeLayoutRuntime(serialized);
      }

      expect(runtime.panels.size).toBe(3);
      expect(runtime.panels.get('left')?.id).toBe('left');
    });

    it('should preserve null values', () => {
      const runtime = createTestRuntime();
      const centerPanel = runtime.panels.get('center');
      if (centerPanel) {
        centerPanel.activeTabId = null;
      }

      const serialized = serializeLayoutRuntime(runtime);
      const deserialized = deserializeLayoutRuntime(serialized);

      expect(deserialized.panels.get('center')?.activeTabId).toBeNull();
    });

    it('should preserve empty arrays', () => {
      const runtime = createTestRuntime();
      const centerPanel = runtime.panels.get('center');
      if (centerPanel) {
        centerPanel.tabOrder = [];
      }

      const serialized = serializeLayoutRuntime(runtime);
      const deserialized = deserializeLayoutRuntime(serialized);

      expect(deserialized.panels.get('center')?.tabOrder).toEqual([]);
    });

    it('should preserve zero values', () => {
      const runtime = createTestRuntime();
      const leftPanel = runtime.panels.get('left');
      if (leftPanel) {
        leftPanel.scrollTop = 0;
        leftPanel.scrollLeft = 0;
      }

      const serialized = serializeLayoutRuntime(runtime);
      const deserialized = deserializeLayoutRuntime(serialized);

      expect(deserialized.panels.get('left')?.scrollTop).toBe(0);
      expect(deserialized.panels.get('left')?.scrollLeft).toBe(0);
    });

    it('should preserve boolean values', () => {
      const runtime = createTestRuntime();
      
      const serialized = serializeLayoutRuntime(runtime);
      const deserialized = deserializeLayoutRuntime(serialized);

      expect(deserialized.panels.get('left')?.collapsed).toBe(false);
      expect(deserialized.panels.get('right')?.collapsed).toBe(true);
      expect(deserialized.panels.get('left')?.visible).toBe(true);
      expect(deserialized.panels.get('right')?.visible).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty panels map', () => {
      const runtime: BoardLayoutRuntime = {
        root: { type: 'panel', panelId: 'center' },
        panels: new Map(),
        timestamp: Date.now(),
      };

      const serialized = serializeLayoutRuntime(runtime);
      const deserialized = deserializeLayoutRuntime(serialized);

      expect(deserialized.panels.size).toBe(0);
    });

    it('should handle panel with all null/empty values', () => {
      const runtime: BoardLayoutRuntime = {
        root: { type: 'panel', panelId: 'empty' },
        panels: new Map([
          ['empty', {
            id: 'empty',
            position: 'center',
            size: '0px',
            collapsed: false,
            activeTabId: null,
            tabOrder: [],
            scrollTop: 0,
            scrollLeft: 0,
            visible: true,
          }],
        ]),
        timestamp: 0,
      };

      const serialized = serializeLayoutRuntime(runtime);
      const deserialized = deserializeLayoutRuntime(serialized);

      const panel = deserialized.panels.get('empty');
      expect(panel?.activeTabId).toBeNull();
      expect(panel?.tabOrder).toEqual([]);
      expect(panel?.scrollTop).toBe(0);
    });

    it('should handle very large scroll values', () => {
      const runtime = createTestRuntime();
      const leftPanel = runtime.panels.get('left');
      if (leftPanel) {
        leftPanel.scrollTop = 999999;
        leftPanel.scrollLeft = 888888;
      }

      const serialized = serializeLayoutRuntime(runtime);
      const deserialized = deserializeLayoutRuntime(serialized);

      expect(deserialized.panels.get('left')?.scrollTop).toBe(999999);
      expect(deserialized.panels.get('left')?.scrollLeft).toBe(888888);
    });
  });
});
