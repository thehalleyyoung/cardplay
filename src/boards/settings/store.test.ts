/**
 * @fileoverview Board Settings Store Tests (G019-G020)
 * 
 * @module @cardplay/boards/settings/store.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BoardSettingsStore } from './store';
import type { HarmonySettings } from './types';

describe('BoardSettingsStore', () => {
  beforeEach(() => {
    // Clear settings before each test
    BoardSettingsStore.clearAll();
  });
  
  describe('getSettings', () => {
    it('creates default settings for new board', () => {
      const settings = BoardSettingsStore.getSettings('test-board');
      
      expect(settings.boardId).toBe('test-board');
      expect(settings.harmony).toBeDefined();
      expect(settings.visualDensity).toBeDefined();
      expect(settings.generator).toBeDefined();
    });
    
    it('returns same settings on repeated calls', () => {
      const first = BoardSettingsStore.getSettings('test-board');
      const second = BoardSettingsStore.getSettings('test-board');
      
      expect(second).toBe(first);
    });
  });
  
  describe('harmony settings (G019-G020)', () => {
    it('starts with harmony colors disabled', () => {
      const settings = BoardSettingsStore.getSettings('test-board');
      
      expect(settings.harmony?.showHarmonyColors).toBe(false);
    });
    
    it('starts with roman numerals disabled', () => {
      const settings = BoardSettingsStore.getSettings('test-board');
      
      expect(settings.harmony?.showRomanNumerals).toBe(false);
    });
    
    it('toggles harmony colors on/off (G019)', () => {
      const boardId = 'test-board';
      
      // Toggle on
      let newValue = BoardSettingsStore.toggleHarmonyColors(boardId);
      expect(newValue).toBe(true);
      
      let settings = BoardSettingsStore.getSettings(boardId);
      expect(settings.harmony?.showHarmonyColors).toBe(true);
      
      // Toggle off
      newValue = BoardSettingsStore.toggleHarmonyColors(boardId);
      expect(newValue).toBe(false);
      
      settings = BoardSettingsStore.getSettings(boardId);
      expect(settings.harmony?.showHarmonyColors).toBe(false);
    });
    
    it('toggles roman numerals on/off (G020)', () => {
      const boardId = 'test-board';
      
      // Toggle on
      let newValue = BoardSettingsStore.toggleRomanNumerals(boardId);
      expect(newValue).toBe(true);
      
      let settings = BoardSettingsStore.getSettings(boardId);
      expect(settings.harmony?.showRomanNumerals).toBe(true);
      
      // Toggle off
      newValue = BoardSettingsStore.toggleRomanNumerals(boardId);
      expect(newValue).toBe(false);
      
      settings = BoardSettingsStore.getSettings(boardId);
      expect(settings.harmony?.showRomanNumerals).toBe(false);
    });
    
    it('sets current key', () => {
      const boardId = 'test-board';
      
      BoardSettingsStore.setCurrentKey(boardId, 'Dm');
      
      const settings = BoardSettingsStore.getSettings(boardId);
      expect(settings.harmony?.currentKey).toBe('Dm');
    });
    
    it('sets current chord', () => {
      const boardId = 'test-board';
      
      BoardSettingsStore.setCurrentChord(boardId, 'Cmaj7');
      
      const settings = BoardSettingsStore.getSettings(boardId);
      expect(settings.harmony?.currentChord).toBe('Cmaj7');
    });
    
    it('updates harmony settings partially', () => {
      const boardId = 'test-board';
      
      BoardSettingsStore.updateHarmonySettings(boardId, {
        showHarmonyColors: true,
        currentKey: 'G'
      });
      
      const settings = BoardSettingsStore.getSettings(boardId);
      expect(settings.harmony?.showHarmonyColors).toBe(true);
      expect(settings.harmony?.currentKey).toBe('G');
      expect(settings.harmony?.showRomanNumerals).toBe(false); // Unchanged
    });
  });
  
  describe('subscribe', () => {
    it('notifies listeners on settings change', () => {
      const boardId = 'test-board';
      const changes: Array<{ boardId: string; settings: any }> = [];
      
      const unsubscribe = BoardSettingsStore.subscribe((id, settings) => {
        changes.push({ boardId: id, settings });
      });
      
      BoardSettingsStore.toggleHarmonyColors(boardId);
      
      expect(changes).toHaveLength(1);
      expect(changes[0]?.boardId).toBe(boardId);
      expect(changes[0]?.settings.harmony?.showHarmonyColors).toBe(true);
      
      unsubscribe();
    });
    
    it('stops notifying after unsubscribe', () => {
      const boardId = 'test-board';
      let callCount = 0;
      
      const unsubscribe = BoardSettingsStore.subscribe(() => {
        callCount++;
      });
      
      BoardSettingsStore.toggleHarmonyColors(boardId);
      expect(callCount).toBe(1);
      
      unsubscribe();
      
      BoardSettingsStore.toggleHarmonyColors(boardId);
      expect(callCount).toBe(1); // No additional calls
    });
  });
  
  describe('resetSettings', () => {
    it('resets board settings to defaults', () => {
      const boardId = 'test-board';
      
      // Modify settings
      BoardSettingsStore.updateHarmonySettings(boardId, {
        showHarmonyColors: true,
        currentKey: 'Bb'
      });
      
      // Reset
      BoardSettingsStore.resetSettings(boardId);
      
      // Check defaults restored
      const settings = BoardSettingsStore.getSettings(boardId);
      expect(settings.harmony?.showHarmonyColors).toBe(false);
      expect(settings.harmony?.currentKey).toBe('C');
    });
  });
});
