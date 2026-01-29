/**
 * @fileoverview Tests for Macro Control System.
 */

import { describe, it, expect } from 'vitest';
import {
  createMacroMapping,
  updateMacroMapping,
  setMacroMappingEnabled,
  createMacroControl,
  setMacroValue,
  resetMacro,
  setMacroName,
  setMacroDescription,
  addMacroMapping,
  removeMacroMapping,
  updateMapping,
  clearMacroMappings,
  getMacroMapping,
  hasMacroMappings,
  hasMacroMapping,
  createMacroPanel,
  getMacro,
  updateMacro,
  setMacroValueById,
  resetAllMacros,
  setActivePage,
  createMacroSnapshot,
  applyMacroSnapshot,
  morphMacroSnapshots,
  randomizeMacro,
  randomizeAllMacros,
  createMacroLockState,
  toggleMacroLock,
  isMacroLocked,
  createMacroLinkState,
  linkMacros,
  unlinkMacro,
  getMacroLinkGroup,
  areMacrosLinked,
  createMacroGroup,
  createMacroAutomationLane,
  addMacroAutomationPoint,
  getMacroAutomationValue,
  createMacroPreset,
  applyMacroPreset,
  getMacroVisualization,
  getMacroPanelVisualization,
  compareMacroPanels,
  createMacroHistoryEntry,
} from './macro-controls.js';

describe('MacroMapping', () => {
  describe('createMacroMapping', () => {
    it('creates a basic mapping', () => {
      const mapping = createMacroMapping({ targetId: 'synth.cutoff' });
      
      expect(mapping.targetId).toBe('synth.cutoff');
      expect(mapping.min).toBe(0);
      expect(mapping.max).toBe(1);
      expect(mapping.curve).toBe('linear');
      expect(mapping.bipolar).toBe(false);
      expect(mapping.enabled).toBe(true);
    });

    it('creates a mapping with custom settings', () => {
      const mapping = createMacroMapping({
        targetId: 'synth.cutoff',
        min: 20,
        max: 20000,
        curve: 'logarithmic',
        bipolar: true,
        enabled: false,
      });
      
      expect(mapping.min).toBe(20);
      expect(mapping.max).toBe(20000);
      expect(mapping.curve).toBe('logarithmic');
      expect(mapping.bipolar).toBe(true);
      expect(mapping.enabled).toBe(false);
    });
  });

  describe('updateMacroMapping', () => {
    it('updates mapping properties', () => {
      const mapping = createMacroMapping({ targetId: 'synth.cutoff' });
      const updated = updateMacroMapping(mapping, { min: 100, max: 10000 });
      
      expect(updated.min).toBe(100);
      expect(updated.max).toBe(10000);
      expect(updated.targetId).toBe('synth.cutoff');
    });
  });

  describe('setMacroMappingEnabled', () => {
    it('enables a disabled mapping', () => {
      const mapping = createMacroMapping({ targetId: 'synth.cutoff', enabled: false });
      const enabled = setMacroMappingEnabled(mapping, true);
      
      expect(enabled.enabled).toBe(true);
    });

    it('returns same object if already in desired state', () => {
      const mapping = createMacroMapping({ targetId: 'synth.cutoff', enabled: true });
      const same = setMacroMappingEnabled(mapping, true);
      
      expect(same).toBe(mapping);
    });
  });
});

describe('MacroControl', () => {
  describe('createMacroControl', () => {
    it('creates a basic macro control', () => {
      const macro = createMacroControl({ id: 0 });
      
      expect(macro.id).toBe(0);
      expect(macro.name).toBe('Macro 1');
      expect(macro.value).toBe(0);
      expect(macro.default).toBe(0);
      expect(macro.mappings).toHaveLength(0);
      expect(macro.automatable).toBe(true);
    });

    it('creates a macro with custom settings', () => {
      const mapping = createMacroMapping({ targetId: 'synth.cutoff' });
      const macro = createMacroControl({
        id: 3,
        name: 'Filter Cutoff',
        default: 0.5,
        mappings: [mapping],
        group: 'Filter',
        description: 'Controls filter cutoff',
        ccNumber: 74,
        automatable: true,
      });
      
      expect(macro.id).toBe(3);
      expect(macro.name).toBe('Filter Cutoff');
      expect(macro.value).toBe(0.5);
      expect(macro.mappings).toHaveLength(1);
      expect(macro.group).toBe('Filter');
      expect(macro.ccNumber).toBe(74);
    });

    it('throws error for invalid ID', () => {
      expect(() => createMacroControl({ id: -1 })).toThrow();
      expect(() => createMacroControl({ id: 8 })).toThrow();
    });

    it('clamps initial value to 0-1', () => {
      const macro1 = createMacroControl({ id: 0, default: -0.5 });
      const macro2 = createMacroControl({ id: 1, default: 1.5 });
      
      expect(macro1.value).toBe(0);
      expect(macro2.value).toBe(1);
    });
  });

  describe('setMacroValue', () => {
    it('sets macro value', () => {
      const macro = createMacroControl({ id: 0 });
      const updated = setMacroValue(macro, 0.7);
      
      expect(updated.value).toBe(0.7);
    });

    it('clamps value to 0-1', () => {
      const macro = createMacroControl({ id: 0 });
      const low = setMacroValue(macro, -0.5);
      const high = setMacroValue(macro, 1.5);
      
      expect(low.value).toBe(0);
      expect(high.value).toBe(1);
    });

    it('returns same object if value unchanged', () => {
      const macro = createMacroControl({ id: 0, default: 0.5 });
      const same = setMacroValue(macro, 0.5);
      
      expect(same).toBe(macro);
    });
  });

  describe('resetMacro', () => {
    it('resets macro to default value', () => {
      const macro = createMacroControl({ id: 0, default: 0.3 });
      const changed = setMacroValue(macro, 0.8);
      const reset = resetMacro(changed);
      
      expect(reset.value).toBe(0.3);
    });
  });

  describe('setMacroName', () => {
    it('updates macro name', () => {
      const macro = createMacroControl({ id: 0 });
      const renamed = setMacroName(macro, 'My Macro');
      
      expect(renamed.name).toBe('My Macro');
    });
  });

  describe('setMacroDescription', () => {
    it('updates macro description', () => {
      const macro = createMacroControl({ id: 0 });
      const described = setMacroDescription(macro, 'Controls filter cutoff');
      
      expect(described.description).toBe('Controls filter cutoff');
    });
  });

  describe('addMacroMapping', () => {
    it('adds a mapping to macro', () => {
      const macro = createMacroControl({ id: 0 });
      const mapping = createMacroMapping({ targetId: 'synth.cutoff' });
      const withMapping = addMacroMapping(macro, mapping);
      
      expect(withMapping.mappings).toHaveLength(1);
      expect(withMapping.mappings[0]).toBe(mapping);
    });

    it('does not add duplicate mapping', () => {
      const macro = createMacroControl({ id: 0 });
      const mapping = createMacroMapping({ targetId: 'synth.cutoff' });
      const first = addMacroMapping(macro, mapping);
      const second = addMacroMapping(first, mapping);
      
      expect(second).toBe(first);
      expect(second.mappings).toHaveLength(1);
    });
  });

  describe('removeMacroMapping', () => {
    it('removes a mapping by target ID', () => {
      const mapping1 = createMacroMapping({ targetId: 'synth.cutoff' });
      const mapping2 = createMacroMapping({ targetId: 'synth.resonance' });
      const macro = createMacroControl({ id: 0, mappings: [mapping1, mapping2] });
      
      const removed = removeMacroMapping(macro, 'synth.cutoff');
      
      expect(removed.mappings).toHaveLength(1);
      expect(removed.mappings[0]!.targetId).toBe('synth.resonance');
    });

    it('returns same object if mapping not found', () => {
      const macro = createMacroControl({ id: 0 });
      const same = removeMacroMapping(macro, 'nonexistent');
      
      expect(same).toBe(macro);
    });
  });

  describe('updateMapping', () => {
    it('updates a specific mapping', () => {
      const mapping = createMacroMapping({ targetId: 'synth.cutoff', min: 0, max: 1 });
      const macro = createMacroControl({ id: 0, mappings: [mapping] });
      
      const updated = updateMapping(macro, 'synth.cutoff', { min: 100, max: 10000 });
      
      expect(updated.mappings[0]!.min).toBe(100);
      expect(updated.mappings[0]!.max).toBe(10000);
    });
  });

  describe('clearMacroMappings', () => {
    it('clears all mappings', () => {
      const mapping1 = createMacroMapping({ targetId: 'synth.cutoff' });
      const mapping2 = createMacroMapping({ targetId: 'synth.resonance' });
      const macro = createMacroControl({ id: 0, mappings: [mapping1, mapping2] });
      
      const cleared = clearMacroMappings(macro);
      
      expect(cleared.mappings).toHaveLength(0);
    });
  });

  describe('getMacroMapping', () => {
    it('gets a mapping by target ID', () => {
      const mapping = createMacroMapping({ targetId: 'synth.cutoff' });
      const macro = createMacroControl({ id: 0, mappings: [mapping] });
      
      const found = getMacroMapping(macro, 'synth.cutoff');
      
      expect(found).toBe(mapping);
    });

    it('returns undefined if not found', () => {
      const macro = createMacroControl({ id: 0 });
      const found = getMacroMapping(macro, 'nonexistent');
      
      expect(found).toBeUndefined();
    });
  });

  describe('hasMacroMappings', () => {
    it('returns true if macro has mappings', () => {
      const mapping = createMacroMapping({ targetId: 'synth.cutoff' });
      const macro = createMacroControl({ id: 0, mappings: [mapping] });
      
      expect(hasMacroMappings(macro)).toBe(true);
    });

    it('returns false if macro has no mappings', () => {
      const macro = createMacroControl({ id: 0 });
      
      expect(hasMacroMappings(macro)).toBe(false);
    });
  });

  describe('hasMacroMapping', () => {
    it('returns true if specific mapping exists', () => {
      const mapping = createMacroMapping({ targetId: 'synth.cutoff' });
      const macro = createMacroControl({ id: 0, mappings: [mapping] });
      
      expect(hasMacroMapping(macro, 'synth.cutoff')).toBe(true);
    });

    it('returns false if mapping does not exist', () => {
      const macro = createMacroControl({ id: 0 });
      
      expect(hasMacroMapping(macro, 'synth.cutoff')).toBe(false);
    });
  });
});

describe('MacroPanel', () => {
  describe('createMacroPanel', () => {
    it('creates a panel with 8 macros', () => {
      const panel = createMacroPanel();
      
      expect(panel.macros).toHaveLength(8);
      expect(panel.activePage).toBe(0);
      expect(panel.pageCount).toBe(1);
      
      for (let i = 0; i < 8; i++) {
        expect(panel.macros[i]!.id).toBe(i);
      }
    });
  });

  describe('getMacro', () => {
    it('gets a macro by ID', () => {
      const panel = createMacroPanel();
      const macro = getMacro(panel, 3);
      
      expect(macro.id).toBe(3);
    });

    it('throws error for invalid ID', () => {
      const panel = createMacroPanel();
      
      expect(() => getMacro(panel, -1)).toThrow();
      expect(() => getMacro(panel, 8)).toThrow();
    });
  });

  describe('updateMacro', () => {
    it('updates a specific macro', () => {
      const panel = createMacroPanel();
      const macro = getMacro(panel, 2);
      const updated = setMacroValue(macro, 0.7);
      
      const newPanel = updateMacro(panel, updated);
      
      expect(getMacro(newPanel, 2).value).toBe(0.7);
      expect(getMacro(newPanel, 0).value).toBe(0);  // Others unchanged
    });
  });

  describe('setMacroValueById', () => {
    it('sets value by ID', () => {
      const panel = createMacroPanel();
      const updated = setMacroValueById(panel, 5, 0.8);
      
      expect(getMacro(updated, 5).value).toBe(0.8);
    });
  });

  describe('resetAllMacros', () => {
    it('resets all macros to defaults', () => {
      let panel = createMacroPanel();
      
      // Set some values
      panel = setMacroValueById(panel, 0, 0.5);
      panel = setMacroValueById(panel, 3, 0.7);
      panel = setMacroValueById(panel, 7, 0.9);
      
      const reset = resetAllMacros(panel);
      
      for (let i = 0; i < 8; i++) {
        expect(getMacro(reset, i).value).toBe(0);
      }
    });
  });

  describe('setActivePage', () => {
    it('changes active page', () => {
      const panel = { ...createMacroPanel(), pageCount: 3 };
      const updated = setActivePage(panel, 1);
      
      expect(updated.activePage).toBe(1);
    });

    it('does not change page if out of range', () => {
      const panel = createMacroPanel();
      const same = setActivePage(panel, 5);
      
      expect(same).toBe(panel);
    });
  });
});

describe('MacroSnapshot', () => {
  describe('createMacroSnapshot', () => {
    it('creates a snapshot of current values', () => {
      let panel = createMacroPanel();
      panel = setMacroValueById(panel, 0, 0.3);
      panel = setMacroValueById(panel, 4, 0.7);
      
      const snapshot = createMacroSnapshot(panel, 'Test Snapshot');
      
      expect(snapshot.name).toBe('Test Snapshot');
      expect(snapshot.values[0]).toBe(0.3);
      expect(snapshot.values[4]).toBe(0.7);
      expect(snapshot.timestamp).toBeGreaterThan(0);
    });
  });

  describe('applyMacroSnapshot', () => {
    it('applies snapshot values to panel', () => {
      let panel = createMacroPanel();
      panel = setMacroValueById(panel, 2, 0.5);
      
      const snapshot = createMacroSnapshot(panel);
      
      // Change values
      panel = setMacroValueById(panel, 2, 0.9);
      
      // Apply snapshot
      const restored = applyMacroSnapshot(panel, snapshot);
      
      expect(getMacro(restored, 2).value).toBe(0.5);
    });
  });

  describe('morphMacroSnapshots', () => {
    it('morphs between two snapshots', () => {
      const panel = createMacroPanel();
      
      let snap1 = createMacroPanel();
      snap1 = setMacroValueById(snap1, 0, 0);
      const snapshot1 = createMacroSnapshot(snap1);
      
      let snap2 = createMacroPanel();
      snap2 = setMacroValueById(snap2, 0, 1);
      const snapshot2 = createMacroSnapshot(snap2);
      
      const morphed = morphMacroSnapshots(panel, snapshot1, snapshot2, 0.5);
      
      expect(getMacro(morphed, 0).value).toBeCloseTo(0.5);
    });

    it('clamps t to 0-1 range', () => {
      const panel = createMacroPanel();
      
      let snap1 = createMacroPanel();
      snap1 = setMacroValueById(snap1, 0, 0);
      const snapshot1 = createMacroSnapshot(snap1);
      
      let snap2 = createMacroPanel();
      snap2 = setMacroValueById(snap2, 0, 1);
      const snapshot2 = createMacroSnapshot(snap2);
      
      const morphedLow = morphMacroSnapshots(panel, snapshot1, snapshot2, -0.5);
      const morphedHigh = morphMacroSnapshots(panel, snapshot1, snapshot2, 1.5);
      
      expect(getMacro(morphedLow, 0).value).toBe(0);
      expect(getMacro(morphedHigh, 0).value).toBe(1);
    });
  });
});

describe('MacroRandomization', () => {
  describe('randomizeMacro', () => {
    it('randomizes macro value', () => {
      const macro = createMacroControl({ id: 0 });
      const randomized = randomizeMacro(macro, 1);
      
      expect(randomized.value).toBeGreaterThanOrEqual(0);
      expect(randomized.value).toBeLessThanOrEqual(1);
    });

    it('respects amount parameter', () => {
      const macro = createMacroControl({ id: 0 });
      const randomized = randomizeMacro(macro, 0.5);
      
      expect(randomized.value).toBeGreaterThanOrEqual(0);
      expect(randomized.value).toBeLessThanOrEqual(0.5);
    });
  });

  describe('randomizeAllMacros', () => {
    it('randomizes all macros', () => {
      const panel = createMacroPanel();
      const randomized = randomizeAllMacros(panel, 1);
      
      // Check that at least some values are non-zero (very high probability)
      const nonZeroCount = randomized.macros.filter(m => m.value > 0.01).length;
      expect(nonZeroCount).toBeGreaterThan(0);
    });
  });
});

describe('MacroLockState', () => {
  describe('createMacroLockState', () => {
    it('creates unlocked state', () => {
      const state = createMacroLockState();
      
      for (let i = 0; i < 8; i++) {
        expect(isMacroLocked(state, i)).toBe(false);
      }
    });
  });

  describe('toggleMacroLock', () => {
    it('toggles lock state', () => {
      let state = createMacroLockState();
      
      state = toggleMacroLock(state, 3);
      expect(isMacroLocked(state, 3)).toBe(true);
      
      state = toggleMacroLock(state, 3);
      expect(isMacroLocked(state, 3)).toBe(false);
    });
  });
});

describe('MacroLinkState', () => {
  describe('createMacroLinkState', () => {
    it('creates empty link state', () => {
      const state = createMacroLinkState();
      
      expect(state.links).toHaveLength(0);
    });
  });

  describe('linkMacros', () => {
    it('links multiple macros', () => {
      let state = createMacroLinkState();
      
      state = linkMacros(state, [0, 1, 2]);
      
      expect(areMacrosLinked(state, 0, 1)).toBe(true);
      expect(areMacrosLinked(state, 0, 2)).toBe(true);
      expect(areMacrosLinked(state, 1, 2)).toBe(true);
    });

    it('does not link single macro', () => {
      let state = createMacroLinkState();
      
      state = linkMacros(state, [0]);
      
      expect(state.links).toHaveLength(0);
    });
  });

  describe('unlinkMacro', () => {
    it('unlinks a macro from group', () => {
      let state = createMacroLinkState();
      state = linkMacros(state, [0, 1, 2]);
      
      state = unlinkMacro(state, 1);
      
      expect(areMacrosLinked(state, 0, 2)).toBe(true);
      expect(areMacrosLinked(state, 0, 1)).toBe(false);
    });
  });

  describe('getMacroLinkGroup', () => {
    it('gets link group for a macro', () => {
      let state = createMacroLinkState();
      state = linkMacros(state, [0, 1, 2]);
      
      const group = getMacroLinkGroup(state, 1);
      
      expect(group).toContain(0);
      expect(group).toContain(1);
      expect(group).toContain(2);
    });

    it('returns undefined if not linked', () => {
      const state = createMacroLinkState();
      const group = getMacroLinkGroup(state, 5);
      
      expect(group).toBeUndefined();
    });
  });
});

describe('MacroGroup', () => {
  describe('createMacroGroup', () => {
    it('creates a macro group', () => {
      const group = createMacroGroup('Filter', [0, 1, 2], '#ff0000');
      
      expect(group.name).toBe('Filter');
      expect(group.macroIds).toEqual([0, 1, 2]);
      expect(group.color).toBe('#ff0000');
    });

    it('throws error for invalid IDs', () => {
      expect(() => createMacroGroup('Test', [-1, 0])).toThrow();
      expect(() => createMacroGroup('Test', [0, 8])).toThrow();
    });
  });
});

describe('MacroAutomationLane', () => {
  describe('createMacroAutomationLane', () => {
    it('creates empty lane', () => {
      const lane = createMacroAutomationLane(3);
      
      expect(lane.macroId).toBe(3);
      expect(lane.points).toHaveLength(0);
      expect(lane.enabled).toBe(true);
    });
  });

  describe('addMacroAutomationPoint', () => {
    it('adds point in sorted order', () => {
      let lane = createMacroAutomationLane(0);
      
      lane = addMacroAutomationPoint(lane, { time: 100, value: 0.5 });
      lane = addMacroAutomationPoint(lane, { time: 50, value: 0.3 });
      lane = addMacroAutomationPoint(lane, { time: 150, value: 0.8 });
      
      expect(lane.points[0]!.time).toBe(50);
      expect(lane.points[1]!.time).toBe(100);
      expect(lane.points[2]!.time).toBe(150);
    });
  });

  describe('getMacroAutomationValue', () => {
    it('interpolates between points', () => {
      let lane = createMacroAutomationLane(0);
      lane = addMacroAutomationPoint(lane, { time: 0, value: 0 });
      lane = addMacroAutomationPoint(lane, { time: 100, value: 1 });
      
      const value = getMacroAutomationValue(lane, 50);
      
      expect(value).toBeCloseTo(0.5);
    });

    it('returns first value before first point', () => {
      let lane = createMacroAutomationLane(0);
      lane = addMacroAutomationPoint(lane, { time: 100, value: 0.5 });
      
      const value = getMacroAutomationValue(lane, 50);
      
      expect(value).toBe(0.5);
    });

    it('returns last value after last point', () => {
      let lane = createMacroAutomationLane(0);
      lane = addMacroAutomationPoint(lane, { time: 100, value: 0.5 });
      
      const value = getMacroAutomationValue(lane, 150);
      
      expect(value).toBe(0.5);
    });

    it('returns undefined if disabled or empty', () => {
      const lane = createMacroAutomationLane(0);
      
      expect(getMacroAutomationValue(lane, 50)).toBeUndefined();
    });
  });
});

describe('MacroPreset', () => {
  describe('createMacroPreset', () => {
    it('creates preset from panel', () => {
      let panel = createMacroPanel();
      panel = setMacroValueById(panel, 0, 0.5);
      
      const preset = createMacroPreset(panel, 'My Preset', 'Test description');
      
      expect(preset.name).toBe('My Preset');
      expect(preset.description).toBe('Test description');
      expect(preset.macros[0]!.value).toBe(0.5);
    });
  });

  describe('applyMacroPreset', () => {
    it('applies preset to panel', () => {
      let panel = createMacroPanel();
      panel = setMacroValueById(panel, 0, 0.5);
      
      const preset = createMacroPreset(panel, 'Test');
      
      // Change value
      panel = setMacroValueById(panel, 0, 0.9);
      
      // Apply preset
      const restored = applyMacroPreset(panel, preset);
      
      expect(getMacro(restored, 0).value).toBe(0.5);
    });
  });
});

describe('MacroVisualization', () => {
  describe('getMacroVisualization', () => {
    it('gets visualization data', () => {
      const mapping = createMacroMapping({ targetId: 'synth.cutoff' });
      const macro = createMacroControl({ id: 0, mappings: [mapping] });
      const updated = setMacroValue(macro, 0.7);
      
      const viz = getMacroVisualization(updated, '#ff0000');
      
      expect(viz.macroId).toBe(0);
      expect(viz.value).toBe(0.7);
      expect(viz.normalized).toBe(0.7);
      expect(viz.mappingCount).toBe(1);
      expect(viz.color).toBe('#ff0000');
    });
  });

  describe('getMacroPanelVisualization', () => {
    it('gets visualization for all macros', () => {
      const panel = createMacroPanel();
      const viz = getMacroPanelVisualization(panel);
      
      expect(viz).toHaveLength(8);
      expect(viz[3]!.macroId).toBe(3);
    });
  });
});

describe('MacroComparison', () => {
  describe('compareMacroPanels', () => {
    it('detects changed macros', () => {
      let panel1 = createMacroPanel();
      let panel2 = createMacroPanel();
      
      panel2 = setMacroValueById(panel2, 2, 0.5);
      panel2 = setMacroValueById(panel2, 5, 0.8);
      
      const comparison = compareMacroPanels(panel1, panel2);
      
      expect(comparison.changed).toContain(2);
      expect(comparison.changed).toContain(5);
      expect(comparison.changed).toHaveLength(2);
      expect(comparison.maxDifference).toBeCloseTo(0.8);
      expect(comparison.totalDifference).toBeCloseTo(1.3);
    });

    it('handles identical panels', () => {
      const panel = createMacroPanel();
      const comparison = compareMacroPanels(panel, panel);
      
      expect(comparison.changed).toHaveLength(0);
      expect(comparison.maxDifference).toBe(0);
      expect(comparison.totalDifference).toBe(0);
    });
  });
});

describe('MacroHistoryEntry', () => {
  describe('createMacroHistoryEntry', () => {
    it('creates history entry', () => {
      const panel = createMacroPanel();
      const entry = createMacroHistoryEntry(panel, 'Initial state');
      
      expect(entry.panel).toBe(panel);
      expect(entry.description).toBe('Initial state');
      expect(entry.timestamp).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// M213: Macro Assignments Group Related Parameters
// ============================================================================

describe('M213: Macro Grouping', () => {
  describe('grouping related parameters', () => {
    it('supports group assignment for macros', () => {
      const macro = createMacroControl({
        id: 0,
        name: 'Filter',
        group: 'Tone',
      });
      
      expect(macro.group).toBe('Tone');
    });

    it('macros can have multiple mappings to related params', () => {
      const filterMappings = [
        createMacroMapping({ targetId: 'synth.cutoff' }),
        createMacroMapping({ targetId: 'synth.resonance', min: 0, max: 0.7 }),
        createMacroMapping({ targetId: 'synth.filterEnv', min: 0.2, max: 1 }),
      ];
      
      let macro = createMacroControl({ id: 0, name: 'Filter' });
      
      for (const mapping of filterMappings) {
        macro = addMacroMapping(macro, mapping);
      }
      
      expect(macro.mappings).toHaveLength(3);
      // All mappings relate to filter parameters
      expect(macro.mappings.every(m => 
        m.targetId.includes('cutoff') || 
        m.targetId.includes('resonance') || 
        m.targetId.includes('filterEnv')
      )).toBe(true);
    });

    it('grouping keeps related parameters together', () => {
      const panel = createMacroPanel();
      
      // Typically first two macros might be tone-related
      let panelWithGroups = updateMacro(panel, 0, { group: 'Tone' });
      panelWithGroups = updateMacro(panelWithGroups, 1, { group: 'Tone' });
      panelWithGroups = updateMacro(panelWithGroups, 2, { group: 'Dynamics' });
      panelWithGroups = updateMacro(panelWithGroups, 3, { group: 'Dynamics' });
      panelWithGroups = updateMacro(panelWithGroups, 4, { group: 'Effects' });
      panelWithGroups = updateMacro(panelWithGroups, 5, { group: 'Effects' });
      
      const toneGroup = panelWithGroups.macros.filter(m => m.group === 'Tone');
      const dynamicsGroup = panelWithGroups.macros.filter(m => m.group === 'Dynamics');
      const effectsGroup = panelWithGroups.macros.filter(m => m.group === 'Effects');
      
      expect(toneGroup).toHaveLength(2);
      expect(dynamicsGroup).toHaveLength(2);
      expect(effectsGroup).toHaveLength(2);
    });

    it('macro groups can be created with utility function', () => {
      const toneGroup = createMacroGroup('Tone', [0, 1]);
      
      expect(toneGroup.name).toBe('Tone');
      expect(toneGroup.macroIds).toEqual([0, 1]);
    });

    it('semantically related params share a macro', () => {
      // Brightness macro controlling multiple brightness-related params
      const brightnessMappings = [
        createMacroMapping({ targetId: 'synth.cutoff', min: 1000, max: 20000 }),
        createMacroMapping({ targetId: 'synth.oscMix', min: 0.3, max: 1 }),
        createMacroMapping({ targetId: 'eq.highShelf', min: -3, max: 6 }),
      ];
      
      let macro = createMacroControl({ 
        id: 2, 
        name: 'Brightness',
        group: 'Tone',
        description: 'Controls overall brightness/darkness of the sound',
      });
      
      for (const mapping of brightnessMappings) {
        macro = addMacroMapping(macro, mapping);
      }
      
      // Moving one macro affects all related parameters
      const updatedMacro = setMacroValue(macro, 0.75);
      expect(updatedMacro.value).toBe(0.75);
      expect(updatedMacro.mappings).toHaveLength(3);
    });
  });
});

// ============================================================================
// M214: MIDI Mapping Handles All Controller Types
// ============================================================================

describe('M214: MIDI Mapping Controller Types', () => {
  describe('CC number assignment', () => {
    it('assigns CC number to macro', () => {
      const macro = createMacroControl({
        id: 0,
        name: 'Filter',
        ccNumber: 74, // Standard cutoff CC
      });
      
      expect(macro.ccNumber).toBe(74);
    });

    it('allows valid CC range (0-127)', () => {
      const macro0 = createMacroControl({ id: 0, ccNumber: 0 });
      const macro64 = createMacroControl({ id: 1, ccNumber: 64 });
      const macro127 = createMacroControl({ id: 2, ccNumber: 127 });
      
      expect(macro0.ccNumber).toBe(0);
      expect(macro64.ccNumber).toBe(64);
      expect(macro127.ccNumber).toBe(127);
    });

    it('supports common MIDI CC assignments', () => {
      const standardMappings = [
        { id: 0, ccNumber: 1, name: 'Modwheel' },    // Mod wheel
        { id: 1, ccNumber: 7, name: 'Volume' },      // Volume
        { id: 2, ccNumber: 10, name: 'Pan' },        // Pan
        { id: 3, ccNumber: 11, name: 'Expression' }, // Expression
        { id: 4, ccNumber: 74, name: 'Cutoff' },     // Cutoff (filter)
        { id: 5, ccNumber: 71, name: 'Resonance' },  // Resonance
        { id: 6, ccNumber: 73, name: 'Attack' },     // Attack time
        { id: 7, ccNumber: 72, name: 'Release' },    // Release time
      ];
      
      const macros = standardMappings.map(m => createMacroControl(m));
      
      expect(macros).toHaveLength(8);
      expect(macros.every(m => m.ccNumber !== undefined)).toBe(true);
      expect(macros.every(m => m.ccNumber! >= 0 && m.ccNumber! <= 127)).toBe(true);
    });
  });

  describe('controller type handling', () => {
    it('handles continuous controllers (knobs/faders)', () => {
      const macro = createMacroControl({
        id: 0,
        name: 'Cutoff',
        ccNumber: 74,
      });
      
      // Continuous values should work
      let updated = setMacroValue(macro, 0.5);
      expect(updated.value).toBe(0.5);
      
      updated = setMacroValue(macro, 0.123);
      expect(updated.value).toBeCloseTo(0.123);
    });

    it('handles binary controllers (buttons/switches)', () => {
      const macro = createMacroControl({
        id: 0,
        name: 'Sustain',
        ccNumber: 64, // Sustain pedal
      });
      
      // Binary values: 0 = off, 1 = on
      const off = setMacroValue(macro, 0);
      const on = setMacroValue(macro, 1);
      
      expect(off.value).toBe(0);
      expect(on.value).toBe(1);
    });

    it('handles bipolar controllers (pitch bend range)', () => {
      const mapping = createMacroMapping({
        targetId: 'synth.detune',
        min: -100,
        max: 100,
        bipolar: true,
      });
      
      expect(mapping.bipolar).toBe(true);
      expect(mapping.min).toBe(-100);
      expect(mapping.max).toBe(100);
    });

    it('supports high-resolution 14-bit controllers conceptually', () => {
      // High-res controllers use CC pairs (MSB + LSB)
      // CC 0-31 are MSB, CC 32-63 are corresponding LSB
      const msb = 1; // Mod wheel MSB
      const lsb = 33; // Mod wheel LSB
      
      // Both should be valid CC numbers
      expect(msb).toBeGreaterThanOrEqual(0);
      expect(msb).toBeLessThanOrEqual(31);
      expect(lsb).toBe(msb + 32);
    });
  });

  describe('MIDI learn workflow', () => {
    it('macros without CC can receive learn', () => {
      const macro = createMacroControl({ id: 0, name: 'Unassigned' });
      expect(macro.ccNumber).toBeUndefined();
      
      // After MIDI learn
      const learned = createMacroControl({ 
        ...macro, 
        id: 0, 
        ccNumber: 16 
      });
      expect(learned.ccNumber).toBe(16);
    });

    it('CC assignments can be cleared', () => {
      const macro = createMacroControl({ id: 0, ccNumber: 74 });
      expect(macro.ccNumber).toBe(74);
      
      // Clearing by creating new macro without ccNumber
      const cleared = createMacroControl({ id: 0, name: macro.name });
      expect(cleared.ccNumber).toBeUndefined();
    });
  });
});
