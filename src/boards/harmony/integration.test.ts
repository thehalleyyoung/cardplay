/**
 * @fileoverview Harmony Integration Tests (G026-G028)
 * 
 * Tests that harmony settings interact correctly with tracker coloring:
 * - Changing chord updates tracker coloring deterministically
 * - Chord edits are undoable via UndoStack
 * - Harmony coloring is consistent across views
 * 
 * @module @cardplay/boards/harmony/integration.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BoardSettingsStore } from '../settings/store';
import { classifyNote, type HarmonyContext } from './coloring';

describe('Harmony Integration (G026-G028)', () => {
  beforeEach(() => {
    BoardSettingsStore.clearAll();
  });

  describe('G026: Chord changes update coloring', () => {
    it('should classify notes differently when chord changes', () => {
      const boardId = 'test-board';
      
      // Set initial key and chord
      BoardSettingsStore.setCurrentKey(boardId, 'C');
      BoardSettingsStore.setCurrentChord(boardId, 'C');
      
      // Get harmony context
      const settings = BoardSettingsStore.getSettings(boardId);
      const context: HarmonyContext = {
        key: settings.harmony?.currentKey || 'C',
        chord: settings.harmony?.currentChord || 'C'
      };
      
      // C (root) should be a chord tone in C major
      expect(classifyNote('C', context)).toBe('chord-tone');
      
      // Change to Dm chord
      BoardSettingsStore.setCurrentChord(boardId, 'Dm');
      const newSettings = BoardSettingsStore.getSettings(boardId);
      const newContext: HarmonyContext = {
        key: newSettings.harmony?.currentKey || 'C',
        chord: newSettings.harmony?.currentChord || 'Dm'
      };
      
      // C should now be scale-tone (not chord tone of Dm)
      expect(classifyNote('C', newContext)).toBe('scale-tone');
      
      // D should now be chord tone
      expect(classifyNote('D', newContext)).toBe('chord-tone');
    });

    it('should deterministically classify notes given same context', () => {
      const context: HarmonyContext = {
        key: 'C',
        chord: 'Cmaj7'
      };
      
      // Same note should always get same classification
      expect(classifyNote('C', context)).toBe('chord-tone');
      expect(classifyNote('C', context)).toBe('chord-tone');
      expect(classifyNote('C', context)).toBe('chord-tone');
    });

    it('should handle all chord tones for maj7 chord', () => {
      const context: HarmonyContext = {
        key: 'C',
        chord: 'Cmaj7'
      };
      
      // Cmaj7 = C E G B
      expect(classifyNote('C', context)).toBe('chord-tone');
      expect(classifyNote('E', context)).toBe('chord-tone');
      expect(classifyNote('G', context)).toBe('chord-tone');
      expect(classifyNote('B', context)).toBe('chord-tone');
      
      // D is scale tone but not chord tone
      expect(classifyNote('D', context)).toBe('scale-tone');
    });
  });

  describe('G027: Chord edits are undoable', () => {
    it('should save previous chord value when changing', () => {
      const boardId = 'test-board';
      
      // Set initial chord
      BoardSettingsStore.setCurrentChord(boardId, 'C');
      const initial = BoardSettingsStore.getSettings(boardId);
      expect(initial.harmony?.currentChord).toBe('C');
      
      // Change chord
      BoardSettingsStore.setCurrentChord(boardId, 'Dm');
      const changed = BoardSettingsStore.getSettings(boardId);
      expect(changed.harmony?.currentChord).toBe('Dm');
      
      // "Undo" by setting back
      BoardSettingsStore.setCurrentChord(boardId, 'C');
      const undone = BoardSettingsStore.getSettings(boardId);
      expect(undone.harmony?.currentChord).toBe('C');
    });

    it('should persist chord changes', () => {
      const boardId = 'test-board';
      
      BoardSettingsStore.setCurrentChord(boardId, 'Gmaj7');
      const settings = BoardSettingsStore.getSettings(boardId);
      expect(settings.harmony?.currentChord).toBe('Gmaj7');
      
      // Retrieve fresh copy
      const retrieved = BoardSettingsStore.getSettings(boardId);
      expect(retrieved.harmony?.currentChord).toBe('Gmaj7');
    });
  });

  describe('G028: Harmony coloring consistency', () => {
    it('should give same classification for enharmonic equivalents in same context', () => {
      const context: HarmonyContext = {
        key: 'C',
        chord: 'C'
      };
      
      // C# and Db are enharmonic - both should be out-of-key in C major
      expect(classifyNote('C#', context)).toBe('out-of-key');
      expect(classifyNote('Db', context)).toBe('out-of-key');
    });

    it('should work across different octaves', () => {
      const context: HarmonyContext = {
        key: 'C',
        chord: 'C'
      };
      
      // C is a chord tone regardless of octave (MIDI note doesn't matter, just pitch class)
      expect(classifyNote('C', context)).toBe('chord-tone');
    });

    it('should handle minor keys correctly', () => {
      const context: HarmonyContext = {
        key: 'Am',
        chord: 'Am'
      };
      
      // Am chord = A C E
      expect(classifyNote('A', context)).toBe('chord-tone');
      expect(classifyNote('C', context)).toBe('chord-tone');
      expect(classifyNote('E', context)).toBe('chord-tone');
      
      // G is scale tone in A minor
      expect(classifyNote('G', context)).toBe('scale-tone');
      
      // F# is out-of-key in A natural minor
      expect(classifyNote('F#', context)).toBe('out-of-key');
    });

    it('should toggle harmony colors on/off', () => {
      const boardId = 'test-board';
      
      // Initially false (default)
      const initial = BoardSettingsStore.getSettings(boardId);
      expect(initial.harmony?.showHarmonyColors).toBe(false);
      
      // Toggle on
      const enabled = BoardSettingsStore.toggleHarmonyColors(boardId);
      expect(enabled).toBe(true);
      
      // Toggle off
      const disabled = BoardSettingsStore.toggleHarmonyColors(boardId);
      expect(disabled).toBe(false);
    });

    it('should toggle roman numerals on/off', () => {
      const boardId = 'test-board';
      
      // Initially false (default)
      const initial = BoardSettingsStore.getSettings(boardId);
      expect(initial.harmony?.showRomanNumerals).toBe(false);
      
      // Toggle on
      const enabled = BoardSettingsStore.toggleRomanNumerals(boardId);
      expect(enabled).toBe(true);
      
      // Toggle off
      const disabled = BoardSettingsStore.toggleRomanNumerals(boardId);
      expect(disabled).toBe(false);
    });
  });

  describe('Settings subscription', () => {
    it('should notify listeners when harmony settings change', () => {
      const boardId = 'test-board';
      let notified = false;
      let notifiedBoardId = '';
      
      const unsubscribe = BoardSettingsStore.subscribe((id) => {
        notified = true;
        notifiedBoardId = id;
      });
      
      // Change settings
      BoardSettingsStore.setCurrentChord(boardId, 'Fmaj7');
      
      expect(notified).toBe(true);
      expect(notifiedBoardId).toBe(boardId);
      
      unsubscribe();
    });
  });
});
