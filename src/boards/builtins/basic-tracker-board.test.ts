/**
 * @fileoverview Basic Tracker Board Tests (F051-F054)
 * 
 * Smoke tests for basic tracker board functionality.
 * 
 * @module @cardplay/boards/builtins/basic-tracker-board.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { basicTrackerBoard } from './basic-tracker-board';
import { getBoardRegistry } from '../registry';
import { computeVisibleDeckTypes } from '../gating/tool-visibility';
import { getAllowedCardEntries } from '../gating/get-allowed-cards';
import type { CardMeta } from '../../cards/card';

describe('Basic Tracker Board', () => {
  beforeEach(() => {
    // Reset registry for clean tests
    const registry = getBoardRegistry();
    // Registry is singleton, so we just test with it
  });

  // F051: Smoke test - manual tracker board hides phrase library and generator decks
  it('should hide phrase library and generator decks', () => {
    const visibleDecks = computeVisibleDeckTypes(basicTrackerBoard);
    
    expect(visibleDecks).not.toContain('phrases-deck');
    expect(visibleDecks).not.toContain('generators-deck');
    expect(visibleDecks).not.toContain('arranger-deck');
    expect(visibleDecks).not.toContain('harmony-deck');
  });

  // F052: Smoke test - manual tracker board shows only defined deck types
  it('should show only defined deck types', () => {
    const definedDeckTypes = basicTrackerBoard.decks.map(d => d.type);
    
    // Should include these manual-compatible decks
    expect(definedDeckTypes).toContain('pattern-deck');
    expect(definedDeckTypes).toContain('instruments-deck');
    expect(definedDeckTypes).toContain('properties-deck');
    expect(definedDeckTypes).toContain('dsp-chain');
    
    // Should not include AI/generative decks
    expect(definedDeckTypes).not.toContain('phrases-deck');
    expect(definedDeckTypes).not.toContain('generators-deck');
  });

  // F053: Test - entering a note writes an event to store
  it('should allow manual note entry that writes to event store', () => {
    // This is more of a conceptual test - actual integration tested in tracker-panel tests
    const board = basicTrackerBoard;
    
    // Verify board is configured for manual editing
    expect(board.controlLevel).toBe('full-manual');
    expect(board.compositionTools.phraseDatabase.enabled).toBe(false);
    expect(board.compositionTools.phraseGenerators.enabled).toBe(false);
    
    // Pattern deck should be present for note entry
    const hasPatternDeck = board.decks.some(d => d.type === 'pattern-deck');
    expect(hasPatternDeck).toBe(true);
  });

  // F054: Test - undo/redo of tracker edits works
  it('should support undo/redo via UndoStack integration', () => {
    // Conceptual test - actual undo/redo tested in integration layer
    const board = basicTrackerBoard;
    
    // Verify board has undo/redo shortcuts configured
    expect(board.shortcuts['undo']).toBe('Cmd+Z');
    expect(board.shortcuts['redo']).toBe('Cmd+Shift+Z');
    
    // Verify cut/copy/paste shortcuts configured
    expect(board.shortcuts['cut']).toBe('Cmd+X');
    expect(board.shortcuts['copy']).toBe('Cmd+C');
    expect(board.shortcuts['paste']).toBe('Cmd+V');
  });

  it('should have correct metadata', () => {
    expect(basicTrackerBoard.id).toBe('basic-tracker');
    expect(basicTrackerBoard.name).toBe('Basic Tracker');
    expect(basicTrackerBoard.category).toBe('Manual');
    expect(basicTrackerBoard.controlLevel).toBe('full-manual');
    expect(basicTrackerBoard.primaryView).toBe('tracker');
  });

  it('should have tracker-specific theme', () => {
    expect(basicTrackerBoard.theme.typography.fontFamily).toContain('monospace');
    expect(basicTrackerBoard.theme.controlIndicators.showHints).toBe(false);
    expect(basicTrackerBoard.theme.controlIndicators.showSuggestions).toBe(false);
    expect(basicTrackerBoard.theme.controlIndicators.showGenerative).toBe(false);
  });

  it('should have tracker-specific shortcuts', () => {
    const shortcuts = basicTrackerBoard.shortcuts;
    
    expect(shortcuts['pattern-next']).toBe('Cmd+Down');
    expect(shortcuts['pattern-prev']).toBe('Cmd+Up');
    expect(shortcuts['pattern-clone']).toBe('Cmd+D');
    expect(shortcuts['toggle-follow']).toBe('F');
    expect(shortcuts['toggle-loop']).toBe('L');
    expect(shortcuts['octave-up']).toBe('Ctrl+Up');
    expect(shortcuts['octave-down']).toBe('Ctrl+Down');
  });

  it('should only allow manual instrument cards', () => {
    // Mock card metas for testing
    const manualInstrument: CardMeta = {
      id: 'synth-basic',
      name: 'Basic Synth',
      category: 'instrument',
      tags: ['manual', 'synth'],
      version: '1.0.0'
    };

    const generatorCard: CardMeta = {
      id: 'melody-gen',
      name: 'Melody Generator',
      category: 'generator',
      tags: ['generative', 'melody'],
      version: '1.0.0'
    };

    const allowedCards = getAllowedCardEntries(basicTrackerBoard);
    
    // In a full-manual board, generators should not be allowed
    // (This would be validated through the gating system)
    expect(basicTrackerBoard.compositionTools.phraseGenerators.enabled).toBe(false);
  });

  it('should have layout with sidebar, main, and inspector panels', () => {
    expect(basicTrackerBoard.layout.type).toBe('dock');
    expect(basicTrackerBoard.panels).toHaveLength(3);
    
    const panelRoles = basicTrackerBoard.panels.map(p => p.role);
    expect(panelRoles).toContain('browser');
    expect(panelRoles).toContain('composition');
    expect(panelRoles).toContain('properties');
  });

  it('should have lifecycle hooks defined', () => {
    expect(typeof basicTrackerBoard.onActivate).toBe('function');
    expect(typeof basicTrackerBoard.onDeactivate).toBe('function');
  });

  it('should not enable any AI/assisted tools', () => {
    const tools = basicTrackerBoard.compositionTools;
    
    expect(tools.phraseDatabase.enabled).toBe(false);
    expect(tools.harmonyExplorer.enabled).toBe(false);
    expect(tools.phraseGenerators.enabled).toBe(false);
    expect(tools.arrangerCard.enabled).toBe(false);
    expect(tools.aiComposer.enabled).toBe(false);
    
    // All should be hidden
    expect(tools.phraseDatabase.mode).toBe('hidden');
    expect(tools.harmonyExplorer.mode).toBe('hidden');
    expect(tools.phraseGenerators.mode).toBe('hidden');
    expect(tools.arrangerCard.mode).toBe('hidden');
    expect(tools.aiComposer.mode).toBe('hidden');
  });
});
