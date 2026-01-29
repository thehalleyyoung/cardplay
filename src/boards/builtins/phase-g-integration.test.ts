/**
 * @fileoverview Phase G Integration Tests - All Assisted Boards
 * 
 * Verifies that all Phase G assisted boards are properly defined,
 * registered, and configured correctly.
 * 
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getBoardRegistry } from '../registry';
import { registerBuiltinBoards } from './register';
import { validateBoard } from '../validate';
import { trackerHarmonyBoard } from './tracker-harmony-board';
import { notationHarmonyBoard } from './notation-harmony-board';
import { sessionGeneratorsBoard } from './session-generators-board';

describe('Phase G: Assisted Boards Integration', () => {
  beforeEach(() => {
    // Clear and re-register boards for each test
    const registry = getBoardRegistry();
    registry['boards'].clear(); // Access private member for testing
    registerBuiltinBoards();
  });

  describe('Board Registry Integration', () => {
    it('all Phase G boards are registered', () => {
      const registry = getBoardRegistry();
      
      const trackerHarmony = registry.get('tracker-harmony');
      const notationHarmony = registry.get('notation-harmony');
      const sessionGenerators = registry.get('session-generators');
      
      expect(trackerHarmony).toBeDefined();
      expect(notationHarmony).toBeDefined();
      expect(sessionGenerators).toBeDefined();
    });

    it('all Phase G boards are in Assisted category', () => {
      expect(trackerHarmonyBoard.category).toBe('Assisted');
      expect(notationHarmonyBoard.category).toBe('Assisted');
      expect(sessionGeneratorsBoard.category).toBe('Assisted');
    });

    it('all Phase G boards have appropriate control levels', () => {
      expect(trackerHarmonyBoard.controlLevel).toBe('manual-with-hints');
      expect(notationHarmonyBoard.controlLevel).toBe('assisted');
      expect(sessionGeneratorsBoard.controlLevel).toBe('assisted');
    });
  });

  describe('Tool Configuration Consistency', () => {
    it('Tracker + Harmony has harmony explorer in display-only mode', () => {
      expect(trackerHarmonyBoard.compositionTools.harmonyExplorer.enabled).toBe(true);
      expect(trackerHarmonyBoard.compositionTools.harmonyExplorer.mode).toBe('display-only');
      
      // No generation tools
      expect(trackerHarmonyBoard.compositionTools.phraseDatabase.enabled).toBe(false);
      expect(trackerHarmonyBoard.compositionTools.phraseGenerators.enabled).toBe(false);
      expect(trackerHarmonyBoard.compositionTools.aiComposer.enabled).toBe(false);
    });

    it('Notation + Harmony has harmony explorer in suggest mode', () => {
      expect(notationHarmonyBoard.compositionTools.harmonyExplorer.enabled).toBe(true);
      expect(notationHarmonyBoard.compositionTools.harmonyExplorer.mode).toBe('suggest');
      
      // No generation tools
      expect(notationHarmonyBoard.compositionTools.phraseDatabase.enabled).toBe(false);
      expect(notationHarmonyBoard.compositionTools.phraseGenerators.enabled).toBe(false);
      expect(notationHarmonyBoard.compositionTools.aiComposer.enabled).toBe(false);
    });

    it('Session + Generators has phrase generators enabled', () => {
      expect(sessionGeneratorsBoard.compositionTools.phraseGenerators.enabled).toBe(true);
      expect(sessionGeneratorsBoard.compositionTools.phraseGenerators.mode).toBe('on-demand');
      
      // AI composer hidden for MVP
      expect(sessionGeneratorsBoard.compositionTools.aiComposer.enabled).toBe(false);
    });
  });

  describe('Deck Configuration Consistency', () => {
    it('all boards have properties deck', () => {
      const trackerDecks = trackerHarmonyBoard.decks.map(d => d.type);
      const notationDecks = notationHarmonyBoard.decks.map(d => d.type);
      const sessionDecks = sessionGeneratorsBoard.decks.map(d => d.type);
      
      expect(trackerDecks).toContain('properties-deck');
      expect(notationDecks).toContain('properties-deck');
      expect(sessionDecks).toContain('properties-deck');
    });

    it('all boards have instrument browser (optional in some)', () => {
      const trackerDecks = trackerHarmonyBoard.decks.map(d => d.type);
      const notationDecks = notationHarmonyBoard.decks.map(d => d.type);
      const sessionDecks = sessionGeneratorsBoard.decks.map(d => d.type);
      
      expect(trackerDecks).toContain('instruments-deck');
      expect(notationDecks).toContain('instruments-deck');
      expect(sessionDecks).toContain('instruments-deck');
    });

    it('harmony boards have harmony deck', () => {
      const trackerDecks = trackerHarmonyBoard.decks.map(d => d.type);
      const notationDecks = notationHarmonyBoard.decks.map(d => d.type);
      
      expect(trackerDecks).toContain('harmony-deck');
      expect(notationDecks).toContain('harmony-deck');
    });

    it('session + generators has generator deck', () => {
      const sessionDecks = sessionGeneratorsBoard.decks.map(d => d.type);
      
      expect(sessionDecks).toContain('generators-deck');
    });
  });

  describe('Validation', () => {
    it('all Phase G boards pass validation', () => {
      const boards = [
        trackerHarmonyBoard,
        notationHarmonyBoard,
        sessionGeneratorsBoard
      ];
      
      boards.forEach(board => {
        const result = validateBoard(board);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });

  describe('Theme Configuration', () => {
    it('all boards have control indicators configured', () => {
      expect(trackerHarmonyBoard.theme?.controlIndicators).toBeDefined();
      expect(notationHarmonyBoard.theme?.controlIndicators).toBeDefined();
      expect(sessionGeneratorsBoard.theme?.controlIndicators).toBeDefined();
    });

    it('tracker + harmony shows only hints', () => {
      expect(trackerHarmonyBoard.theme?.controlIndicators?.showHints).toBe(true);
      expect(trackerHarmonyBoard.theme?.controlIndicators?.showSuggestions).toBe(false);
      expect(trackerHarmonyBoard.theme?.controlIndicators?.showGenerative).toBe(false);
    });

    it('notation + harmony shows hints and suggestions', () => {
      expect(notationHarmonyBoard.theme?.controlIndicators?.showHints).toBe(true);
      expect(notationHarmonyBoard.theme?.controlIndicators?.showSuggestions).toBe(true);
      expect(notationHarmonyBoard.theme?.controlIndicators?.showGenerative).toBe(false);
    });

    it('session + generators shows generative indicators', () => {
      expect(sessionGeneratorsBoard.theme?.controlIndicators?.showGenerative).toBe(true);
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('all boards have standard undo/redo shortcuts', () => {
      const boards = [
        trackerHarmonyBoard,
        notationHarmonyBoard,
        sessionGeneratorsBoard
      ];
      
      boards.forEach(board => {
        expect(board.shortcuts['undo']).toBeDefined();
        expect(board.shortcuts['redo']).toBeDefined();
      });
    });

    it('harmony boards have edit shortcuts', () => {
      expect(trackerHarmonyBoard.shortcuts['cut']).toBeDefined();
      expect(trackerHarmonyBoard.shortcuts['copy']).toBeDefined();
      expect(trackerHarmonyBoard.shortcuts['paste']).toBeDefined();
      
      expect(notationHarmonyBoard.shortcuts['cut']).toBeDefined();
      expect(notationHarmonyBoard.shortcuts['copy']).toBeDefined();
      expect(notationHarmonyBoard.shortcuts['paste']).toBeDefined();
    });

    it('harmony boards have harmony-specific shortcuts', () => {
      // Tracker + Harmony
      expect(trackerHarmonyBoard.shortcuts['set-chord']).toBe('Cmd+K');
      expect(trackerHarmonyBoard.shortcuts['toggle-harmony-colors']).toBe('Cmd+H');
      
      // Notation + Harmony
      expect(notationHarmonyBoard.shortcuts['harmony:open-suggestions']).toBe('Cmd+H');
      expect(notationHarmonyBoard.shortcuts['harmony:toggle-highlights']).toBe('Cmd+Shift+H');
    });

    it('session + generators has generation shortcuts', () => {
      expect(sessionGeneratorsBoard.shortcuts['generate']).toBe('Cmd+G');
      expect(sessionGeneratorsBoard.shortcuts['regenerate']).toBe('Cmd+Shift+G');
      expect(sessionGeneratorsBoard.shortcuts['freeze']).toBe('Cmd+F');
    });
  });

  describe('Board Policy', () => {
    it('all boards allow tool toggles', () => {
      expect(trackerHarmonyBoard.policy?.allowToolToggles).toBe(true);
      expect(notationHarmonyBoard.policy?.allowToolToggles).toBe(true);
      expect(sessionGeneratorsBoard.policy?.allowToolToggles).toBe(true);
    });

    it('all boards disallow per-track control level override', () => {
      expect(trackerHarmonyBoard.policy?.allowControlLevelOverridePerTrack).toBe(false);
      expect(notationHarmonyBoard.policy?.allowControlLevelOverridePerTrack).toBe(false);
      expect(sessionGeneratorsBoard.policy?.allowControlLevelOverridePerTrack).toBe(false);
    });

    it('all boards allow layout customization', () => {
      expect(trackerHarmonyBoard.policy?.allowLayoutCustomization).toBe(true);
      expect(notationHarmonyBoard.policy?.allowLayoutCustomization).toBe(true);
      expect(sessionGeneratorsBoard.policy?.allowLayoutCustomization).toBe(true);
    });
  });

  describe('Lifecycle Hooks', () => {
    it('all boards have lifecycle hooks defined', () => {
      expect(trackerHarmonyBoard.onActivate).toBeDefined();
      expect(trackerHarmonyBoard.onDeactivate).toBeDefined();
      
      expect(notationHarmonyBoard.onActivate).toBeDefined();
      expect(notationHarmonyBoard.onDeactivate).toBeDefined();
      
      expect(sessionGeneratorsBoard.onActivate).toBeDefined();
      expect(sessionGeneratorsBoard.onDeactivate).toBeDefined();
    });
  });

  describe('Metadata Quality', () => {
    it('all boards have comprehensive metadata', () => {
      const boards = [
        trackerHarmonyBoard,
        notationHarmonyBoard,
        sessionGeneratorsBoard
      ];
      
      boards.forEach(board => {
        expect(board.id).toBeTruthy();
        expect(board.name).toBeTruthy();
        expect(board.description.length).toBeGreaterThan(20);
        expect(board.icon).toBeTruthy();
        expect(board.category).toBeTruthy();
        expect(board.difficulty).toBeTruthy();
        expect(board.tags.length).toBeGreaterThan(0);
        expect(board.philosophy).toBeTruthy();
      });
    });

    it('all boards have unique IDs', () => {
      const ids = [
        trackerHarmonyBoard.id,
        notationHarmonyBoard.id,
        sessionGeneratorsBoard.id
      ];
      
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('all boards have appropriate difficulty levels', () => {
      expect(['beginner', 'intermediate', 'advanced', 'expert'])
        .toContain(trackerHarmonyBoard.difficulty);
      expect(['beginner', 'intermediate', 'advanced', 'expert'])
        .toContain(notationHarmonyBoard.difficulty);
      expect(['beginner', 'intermediate', 'advanced', 'expert'])
        .toContain(sessionGeneratorsBoard.difficulty);
    });
  });

  describe('Progressive Control Spectrum', () => {
    it('control levels progress appropriately', () => {
      // Tracker + Harmony: manual-with-hints (least assisted)
      expect(trackerHarmonyBoard.controlLevel).toBe('manual-with-hints');
      
      // Notation + Harmony and Session + Generators: assisted (more assisted)
      expect(notationHarmonyBoard.controlLevel).toBe('assisted');
      expect(sessionGeneratorsBoard.controlLevel).toBe('assisted');
    });

    it('tool enablement progresses appropriately', () => {
      // Tracker + Harmony: only harmony hints
      const trackerTools = trackerHarmonyBoard.compositionTools;
      const enabledTrackerTools = Object.values(trackerTools).filter(t => t.enabled);
      expect(enabledTrackerTools.length).toBe(1); // Only harmony explorer
      
      // Notation + Harmony: harmony suggestions
      const notationTools = notationHarmonyBoard.compositionTools;
      const enabledNotationTools = Object.values(notationTools).filter(t => t.enabled);
      expect(enabledNotationTools.length).toBe(1); // Only harmony explorer
      
      // Session + Generators: active generation
      const sessionTools = sessionGeneratorsBoard.compositionTools;
      const enabledSessionTools = Object.values(sessionTools).filter(t => t.enabled);
      expect(enabledSessionTools.length).toBe(1); // Only phrase generators
    });
  });

  // =========================================================================
  // G086-G088: Session + Generators Smoke Tests
  // =========================================================================
  
  describe('Session + Generators Board Smoke Tests (G086-G088)', () => {
    it('G086: generator deck visible, phrase library optional, AI composer hidden', () => {
      const deckTypes = sessionGeneratorsBoard.decks.map(d => d.type);
      
      // Generator deck should be present
      expect(deckTypes).toContain('generators-deck');
      
      // AI composer tool should be hidden
      expect(sessionGeneratorsBoard.compositionTools.aiComposer.enabled).toBe(false);
      expect(sessionGeneratorsBoard.compositionTools.aiComposer.mode).toBe('hidden');
      
      // Phrase library should be hidden in MVP (optional for later)
      expect(sessionGeneratorsBoard.compositionTools.phraseDatabase.enabled).toBe(false);
      expect(sessionGeneratorsBoard.compositionTools.phraseDatabase.mode).toBe('hidden');
    });

    it('G087: board is registered and visible in Assisted category', () => {
      const registry = getBoardRegistry();
      const board = registry.get('session-generators');
      
      expect(board).toBeDefined();
      expect(board?.category).toBe('Assisted');
      
      // Should appear in assisted boards list
      const assistedBoards = registry.getByControlLevel('assisted');
      const hasSessionGenerators = assistedBoards.some(b => b.id === 'session-generators');
      expect(hasSessionGenerators).toBe(true);
    });

    it('G088: all required deck types are present', () => {
      const deckTypes = sessionGeneratorsBoard.decks.map(d => d.type);
      
      // Core session + generator decks
      expect(deckTypes).toContain('session-deck');      // Clip grid
      expect(deckTypes).toContain('generators-deck');   // Generator controls
      expect(deckTypes).toContain('mixer-deck');        // Mixing
      expect(deckTypes).toContain('instruments-deck');  // Instrument browser
      expect(deckTypes).toContain('properties-deck');   // Inspector
    });

    it('G088: deck layout supports generator workflow', () => {
      const decks = sessionGeneratorsBoard.decks;
      
      // Session deck should be in center
      const sessionDeck = decks.find(d => d.type === 'session-deck');
      expect(sessionDeck).toBeDefined();
      
      // Generator deck should be accessible
      const generatorDeck = decks.find(d => d.type === 'generators-deck');
      expect(generatorDeck).toBeDefined();
      expect(generatorDeck?.cardLayout).toBe('stack');
      
      // Mixer should be present for balancing generated parts
      const mixerDeck = decks.find(d => d.type === 'mixer-deck');
      expect(mixerDeck).toBeDefined();
    });
  });
});
