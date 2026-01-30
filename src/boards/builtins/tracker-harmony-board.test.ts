/**
 * @fileoverview Tests for Tracker + Harmony Board (G001-G030)
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { trackerHarmonyBoard } from './tracker-harmony-board';
import { validateBoard } from '../validate';
import { getBoardRegistry } from '../registry';

describe('Tracker + Harmony Board (G001-G030)', () => {
  describe('Board Definition (G001-G005)', () => {
    it('G001-G002: has correct id, name, and metadata', () => {
      expect(trackerHarmonyBoard.id).toBe('tracker-harmony');
      expect(trackerHarmonyBoard.name).toBe('Tracker + Harmony');
      expect(trackerHarmonyBoard.description).toContain('harmony hints');
      expect(trackerHarmonyBoard.icon).toBe('🎵');
      expect(trackerHarmonyBoard.category).toBe('Assisted');
    });

    it('G003: has manual-with-hints control level', () => {
      expect(trackerHarmonyBoard.controlLevel).toBe('manual-with-hints');
      expect(trackerHarmonyBoard.philosophy.toLowerCase()).toContain('you write');
      expect(trackerHarmonyBoard.philosophy.toLowerCase()).toContain('hints');
    });

    it('G004: enables harmony explorer in display-only mode', () => {
      expect(trackerHarmonyBoard.compositionTools.harmonyExplorer.enabled).toBe(true);
      expect(trackerHarmonyBoard.compositionTools.harmonyExplorer.mode).toBe('display-only');
      
      // Other tools hidden
      expect(trackerHarmonyBoard.compositionTools.phraseDatabase.enabled).toBe(false);
      expect(trackerHarmonyBoard.compositionTools.phraseGenerators.enabled).toBe(false);
      expect(trackerHarmonyBoard.compositionTools.aiComposer.enabled).toBe(false);
    });

    it('G005: sets tracker as primary view', () => {
      expect(trackerHarmonyBoard.primaryView).toBe('tracker');
    });
  });

  describe('Layout & Decks (G006-G010)', () => {
    it('G006: defines layout with harmony helper, pattern editor, and properties', () => {
      expect(trackerHarmonyBoard.layout.panels.length).toBeGreaterThanOrEqual(3);
      
      const harmonyPanel = trackerHarmonyBoard.layout.panels.find(p => p.id === 'harmony');
      expect(harmonyPanel).toBeDefined();
      expect(harmonyPanel?.position).toBe('left');
      
      const patternPanel = trackerHarmonyBoard.layout.panels.find(p => p.id === 'pattern');
      expect(patternPanel).toBeDefined();
      expect(patternPanel?.position).toBe('center');
      
      const inspectorPanel = trackerHarmonyBoard.layout.panels.find(p => p.id === 'inspector');
      expect(inspectorPanel).toBeDefined();
      expect(inspectorPanel?.position).toBe('right');
    });

    it('G007: includes harmony-display deck in left panel', () => {
      const harmonyDeck = trackerHarmonyBoard.decks.find(d => d.type === 'harmony-deck');
      expect(harmonyDeck).toBeDefined();
      expect(harmonyDeck?.id).toBe('harmony-display');
    });

    it('G008: includes pattern-editor deck in center panel', () => {
      const patternDeck = trackerHarmonyBoard.decks.find(d => d.type === 'pattern-deck');
      expect(patternDeck).toBeDefined();
      expect(patternDeck?.id).toBe('pattern-editor');
    });

    it('G009: includes optional instrument-browser deck', () => {
      const instrumentsDeck = trackerHarmonyBoard.decks.find(d => d.type === 'instruments-deck');
      expect(instrumentsDeck).toBeDefined();
      expect(instrumentsDeck?.id).toBe('instruments');
    });

    it('G010: includes properties deck in right panel', () => {
      const propertiesDeck = trackerHarmonyBoard.decks.find(d => d.type === 'properties-deck');
      expect(propertiesDeck).toBeDefined();
      expect(propertiesDeck?.id).toBe('properties');
    });
  });

  describe('Shortcuts & Theme (G021-G022)', () => {
    it('G021: defines harmony-specific shortcuts', () => {
      expect(trackerHarmonyBoard.shortcuts).toBeDefined();
      expect(trackerHarmonyBoard.shortcuts['set-chord']).toBe('Cmd+K');
      expect(trackerHarmonyBoard.shortcuts['set-key']).toBe('Cmd+Shift+K');
      expect(trackerHarmonyBoard.shortcuts['toggle-harmony-colors']).toBe('Cmd+H');
      expect(trackerHarmonyBoard.shortcuts['toggle-roman-numerals']).toBe('Cmd+Shift+H');
    });

    it('G022: has hint-specific theme colors', () => {
      expect(trackerHarmonyBoard.theme?.colors?.primary).toBeDefined();
      expect(trackerHarmonyBoard.theme?.controlIndicators?.showHints).toBe(true);
      expect(trackerHarmonyBoard.theme?.controlIndicators?.showSuggestions).toBe(false);
      expect(trackerHarmonyBoard.theme?.controlIndicators?.showGenerative).toBe(false);
    });
  });

  describe('Board Policy & Lifecycle (G019)', () => {
    it('has correct board policy settings', () => {
      expect(trackerHarmonyBoard.policy?.allowToolToggles).toBe(true);
      expect(trackerHarmonyBoard.policy?.allowControlLevelOverridePerTrack).toBe(false);
    });

    it('has lifecycle hooks defined', () => {
      expect(trackerHarmonyBoard.onActivate).toBeDefined();
      expect(trackerHarmonyBoard.onDeactivate).toBeDefined();
    });

    it('lifecycle hooks execute without errors', () => {
      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      trackerHarmonyBoard.onActivate?.();
      expect(consoleLog).toHaveBeenCalledWith('Tracker + Harmony board activated');
      
      trackerHarmonyBoard.onDeactivate?.();
      expect(consoleLog).toHaveBeenCalledWith('Tracker + Harmony board deactivated');
      
      consoleLog.mockRestore();
    });
  });

  describe('Validation (G023)', () => {
    it('passes board validation', () => {
      const result = validateBoard(trackerHarmonyBoard);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('G023: can be registered in board registry', () => {
      const registry = getBoardRegistry();
      
      // Should not throw
      expect(() => {
        registry.register(trackerHarmonyBoard);
      }).not.toThrow();
      
      // Should be retrievable
      const retrieved = registry.get('tracker-harmony');
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('tracker-harmony');
    });
  });

  describe('G024: Board Recommendations', () => {
    it('should be recommended for learning harmony workflows', () => {
      expect(trackerHarmonyBoard.tags).toContain('learning');
      expect(trackerHarmonyBoard.tags).toContain('theory');
      expect(trackerHarmonyBoard.tags).toContain('harmony');
    });

    it('should be in Assisted category', () => {
      expect(trackerHarmonyBoard.category).toBe('Assisted');
    });

    it('should have intermediate difficulty', () => {
      expect(trackerHarmonyBoard.difficulty).toBe('intermediate');
    });
  });

  describe('G025: Deck Visibility (Smoke Test)', () => {
    it('shows harmony deck', () => {
      const harmonyDeck = trackerHarmonyBoard.decks.find(d => d.type === 'harmony-deck');
      expect(harmonyDeck).toBeDefined();
    });

    it('hides phrase/generator/AI decks', () => {
      const phraseDecks = trackerHarmonyBoard.decks.filter(d => 
        d.type === 'phrase-library' || 
        d.type === 'phrase-deck'
      );
      expect(phraseDecks).toHaveLength(0);
      
      const generatorDecks = trackerHarmonyBoard.decks.filter(d => 
        d.type === 'generator' || 
        d.type === 'generator-deck'
      );
      expect(generatorDecks).toHaveLength(0);
      
      const aiDecks = trackerHarmonyBoard.decks.filter(d => 
        d.type === 'ai-composer' ||
        d.type === 'composer-deck'
      );
      expect(aiDecks).toHaveLength(0);
    });
  });

  describe('Integration Readiness', () => {
    it('has all required fields for board switching', () => {
      expect(trackerHarmonyBoard.id).toBeTruthy();
      expect(trackerHarmonyBoard.name).toBeTruthy();
      expect(trackerHarmonyBoard.controlLevel).toBeTruthy();
      expect(trackerHarmonyBoard.primaryView).toBeTruthy();
      expect(trackerHarmonyBoard.decks.length).toBeGreaterThan(0);
      expect(trackerHarmonyBoard.layout.panels.length).toBeGreaterThan(0);
    });

    it('has valid deck types that could map to factories', () => {
      trackerHarmonyBoard.decks.forEach(deck => {
        expect(deck.type).toBeTruthy();
        expect(deck.id).toBeTruthy();
        expect(deck.cardLayout).toBeTruthy();
      });
    });
  });

  describe('Harmony Coloring Integration (G026-G027)', () => {
    it('G026: changing chord updates tracker coloring deterministically', async () => {
      const { classifyNote } = await import('../../music/harmony-helper');
      
      // Test notes: C4, E4, G4, B4 (60, 64, 67, 71)
      const testNotes = [60, 64, 67, 71];
      
      // Context 1: C major key, C major chord
      const context1 = { key: 'C', chord: 'C' };
      const colors1 = testNotes.map(note => classifyNote(note, context1));
      
      expect(colors1[0]?.noteClass).toBe('chord-tone'); // C - chord tone
      expect(colors1[1]?.noteClass).toBe('chord-tone'); // E - chord tone
      expect(colors1[2]?.noteClass).toBe('chord-tone'); // G - chord tone
      expect(colors1[3]?.noteClass).toBe('scale-tone'); // B - scale tone (not in C chord)
      
      // Context 2: C major key, Am chord
      const context2 = { key: 'C', chord: 'Am' };
      const colors2 = testNotes.map(note => classifyNote(note, context2));
      
      expect(colors2[0]?.noteClass).toBe('chord-tone'); // C - chord tone in Am
      expect(colors2[1]?.noteClass).toBe('chord-tone'); // E - chord tone in Am
      expect(colors2[2]?.noteClass).toBe('scale-tone'); // G - scale tone (not in Am chord)
      expect(colors2[3]?.noteClass).toBe('scale-tone'); // B - scale tone
      
      // Context 3: C major key, G7 chord
      const context3 = { key: 'C', chord: 'G7' };
      const colors3 = testNotes.map(note => classifyNote(note, context3));
      
      expect(colors3[0]?.noteClass).toBe('scale-tone'); // C - scale tone (not in G7)
      expect(colors3[1]?.noteClass).toBe('scale-tone'); // E - scale tone
      expect(colors3[2]?.noteClass).toBe('chord-tone'); // G - chord tone (root)
      expect(colors3[3]?.noteClass).toBe('chord-tone'); // B - chord tone (3rd of G7)
    });

    it('G026: chord changes produce consistent results', async () => {
      const { classifyNote } = await import('../../music/harmony-helper');
      
      const midiNote = 60; // C4
      const context = { key: 'C', chord: 'C' };
      
      // Should produce same result every time (deterministic)
      const result1 = classifyNote(midiNote, context);
      const result2 = classifyNote(midiNote, context);
      const result3 = classifyNote(midiNote, context);
      
      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
      expect(result1.noteClass).toBe('chord-tone');
    });

    it('G027: chord edits are undoable via UndoStack', async () => {
      // This test verifies the structure exists for undo integration
      // Actual undo behavior is tested in the UndoStack integration tests
      const { BoardSettingsStore } = await import('../settings/store');
      
      const boardId = 'tracker-harmony';
      
      // Get initial state
      const initialSettings = BoardSettingsStore.getSettings(boardId);
      const initialChord = initialSettings.harmony?.currentChord;
      
      // Change chord
      BoardSettingsStore.setCurrentChord(boardId, 'Dm');
      const afterChange = BoardSettingsStore.getSettings(boardId);
      expect(afterChange.harmony?.currentChord).toBe('Dm');
      
      // Simulate undo by restoring initial chord
      BoardSettingsStore.setCurrentChord(boardId, initialChord || null);
      const afterUndo = BoardSettingsStore.getSettings(boardId);
      expect(afterUndo.harmony?.currentChord).toBe(initialChord);
    });
  });
});
