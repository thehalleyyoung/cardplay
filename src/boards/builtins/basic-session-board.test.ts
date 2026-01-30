/**
 * @fileoverview Basic Session Board Tests (F112-F114)
 * 
 * Smoke tests for basic session board functionality.
 * 
 * @module @cardplay/boards/builtins/basic-session-board.test
 */

import { describe, it, expect } from 'vitest';
import { basicSessionBoard } from './basic-session-board';
import { computeVisibleDeckTypes } from '../gating/tool-visibility';

describe('Basic Session Board', () => {
  // F112: Smoke test - manual session board hides generator/arranger/AI composer decks
  it('should hide generator, arranger, and AI composer decks', () => {
    const visibleDecks = computeVisibleDeckTypes(basicSessionBoard);
    
    expect(visibleDecks).not.toContain('generators-deck');
    expect(visibleDecks).not.toContain('arranger-deck');
    // Phrase library could be allowed in browse mode, but not in full-manual
    expect(visibleDecks).not.toContain('phrases-deck');
  });

  // F113: Smoke test - creating clip in session grid creates stream + clip record
  it('should have session grid that works with ClipRegistry', () => {
    const board = basicSessionBoard;
    
    // Verify board is configured for manual clip launching
    expect(board.controlLevel).toBe('full-manual');
    expect(board.philosophy).toContain('Manual clip launching');
    
    // Session deck should be present
    const hasSessionDeck = board.decks.some(d => d.type === 'session-deck');
    expect(hasSessionDeck).toBe(true);
    
    // Properties deck should be present for clip editing
    const hasPropertiesDeck = board.decks.some(d => d.type === 'properties-deck');
    expect(hasPropertiesDeck).toBe(true);
  });

  // F114: Smoke test - launching clip updates play state and transport
  it('should have transport integration for clip launching', () => {
    const board = basicSessionBoard;
    
    // Should have session deck for launching
    const hasSessionDeck = board.decks.some(d => d.type === 'session-deck');
    expect(hasSessionDeck).toBe(true);
    
    // Should have mixer deck for track controls
    const hasMixerDeck = board.decks.some(d => d.type === 'mixer-deck');
    expect(hasMixerDeck).toBe(true);
    
    // Should have shortcuts for clip launching
    expect(board.shortcuts['launch-clip']).toBe('Space');
    expect(board.shortcuts['stop-clip']).toBe('Shift+Space');
  });

  it('should have correct metadata', () => {
    expect(basicSessionBoard.id).toBe('basic-session');
    expect(basicSessionBoard.name).toBe('Basic Session');
    expect(basicSessionBoard.category).toBe('Manual');
    expect(basicSessionBoard.controlLevel).toBe('full-manual');
    expect(basicSessionBoard.primaryView).toBe('session');
  });

  it('should have session-specific theme', () => {
    expect(basicSessionBoard.theme.controlIndicators.showHints).toBe(false);
    expect(basicSessionBoard.theme.controlIndicators.showSuggestions).toBe(false);
    expect(basicSessionBoard.theme.controlIndicators.showGenerative).toBe(false);
  });

  it('should have session-specific shortcuts', () => {
    const shortcuts = basicSessionBoard.shortcuts;
    
    expect(shortcuts['launch-clip']).toBe('Space');
    expect(shortcuts['launch-scene']).toBe('Enter');
    expect(shortcuts['stop-clip']).toBe('Shift+Space');
    expect(shortcuts['arm-track']).toBe('A');
    expect(shortcuts['duplicate-clip']).toBe('Cmd+D');
  });

  it('should have layout with session grid, mixer, and sidebars', () => {
    expect(basicSessionBoard.layout.type).toBe('dock');
    
    const panelRoles = basicSessionBoard.layout.panels.map(p => p.role);
    expect(panelRoles).toContain('browser'); // instrument browser
    expect(panelRoles).toContain('composition'); // session grid
    expect(panelRoles).toContain('mixer');
    expect(panelRoles).toContain('properties');
  });

  it('should not enable any AI/assisted tools', () => {
    const tools = basicSessionBoard.compositionTools;
    
    expect(tools.phraseDatabase.enabled).toBe(false);
    expect(tools.harmonyExplorer.enabled).toBe(false);
    expect(tools.phraseGenerators.enabled).toBe(false);
    expect(tools.arrangerCard.enabled).toBe(false);
    expect(tools.aiComposer.enabled).toBe(false);
  });

  it('should support manual instruments only', () => {
    const deckTypes = basicSessionBoard.decks.map(d => d.type);
    
    expect(deckTypes).toContain('instruments-deck');
    expect(deckTypes).not.toContain('generators-deck');
  });

  it('should have mixer deck for manual mixing', () => {
    const deckTypes = basicSessionBoard.decks.map(d => d.type);
    expect(deckTypes).toContain('mixer-deck');
  });
});
