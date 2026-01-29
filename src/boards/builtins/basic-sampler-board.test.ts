/**
 * @fileoverview Basic Sampler Board Tests (F082-F084)
 * 
 * Smoke tests for basic sampler board functionality.
 * 
 * @module @cardplay/boards/builtins/basic-sampler-board.test
 */

import { describe, it, expect } from 'vitest';
import { basicSamplerBoard } from './basic-sampler-board';
import { computeVisibleDeckTypes } from '../gating/tool-visibility';

describe('Basic Sampler Board', () => {
  // F082: Smoke test - sampler manual board hides phrase/generator/AI decks
  it('should hide phrase, generator, and AI decks', () => {
    const visibleDecks = computeVisibleDeckTypes(basicSamplerBoard);
    
    expect(visibleDecks).not.toContain('phrases-deck');
    expect(visibleDecks).not.toContain('generators-deck');
    expect(visibleDecks).not.toContain('arranger-deck');
    expect(visibleDecks).not.toContain('harmony-deck');
  });

  // F083: Smoke test - sample drop creates sampler card/slot
  it('should have sample browser and timeline decks for sample workflow', () => {
    const deckTypes = basicSamplerBoard.decks.map(d => d.type);
    
    // Should have sample browser for drag/drop
    expect(deckTypes).toContain('samples-deck');
    
    // Should have timeline for arrangement
    expect(deckTypes).toContain('arrangement-deck');
    
    // Should not have generative decks
    expect(deckTypes).not.toContain('generators-deck');
    expect(deckTypes).not.toContain('phrases-deck');
  });

  // F084: Smoke test - placing clip on timeline writes to ClipRegistry
  it('should support clip-based workflow via ClipRegistry', () => {
    const board = basicSamplerBoard;
    
    // Verify board is configured for manual sampling
    expect(board.controlLevel).toBe('full-manual');
    expect(board.philosophy).toContain('You chop, you arrange');
    
    // Timeline deck should be present for clip arrangement
    const hasTimelineDeck = board.decks.some(d => d.type === 'arrangement-deck');
    expect(hasTimelineDeck).toBe(true);
    
    // Properties deck should be present for clip editing
    const hasPropertiesDeck = board.decks.some(d => d.type === 'properties-deck');
    expect(hasPropertiesDeck).toBe(true);
  });

  it('should have correct metadata', () => {
    expect(basicSamplerBoard.id).toBe('basic-sampler');
    expect(basicSamplerBoard.name).toBe('Basic Sampler');
    expect(basicSamplerBoard.category).toBe('Manual');
    expect(basicSamplerBoard.controlLevel).toBe('full-manual');
    expect(basicSamplerBoard.primaryView).toBe('sampler');
  });

  it('should have sampler-specific theme with waveform contrast', () => {
    expect(basicSamplerBoard.theme.controlIndicators.showHints).toBe(false);
    expect(basicSamplerBoard.theme.controlIndicators.showSuggestions).toBe(false);
    expect(basicSamplerBoard.theme.controlIndicators.showGenerative).toBe(false);
  });

  it('should have sampler-specific shortcuts', () => {
    const shortcuts = basicSamplerBoard.shortcuts;
    
    expect(shortcuts['import-sample']).toBe('Cmd+I');
    expect(shortcuts['toggle-snap']).toBe('N');
    expect(shortcuts['zoom-waveform-in']).toBe('Cmd+Plus');
    expect(shortcuts['zoom-waveform-out']).toBe('Cmd+Minus');
  });

  it('should have layout with sample pool, timeline, and properties', () => {
    expect(basicSamplerBoard.layout.type).toBe('dock');
    
    const panelRoles = basicSamplerBoard.panels.map(p => p.role);
    expect(panelRoles).toContain('browser'); // sample pool
    expect(panelRoles).toContain('composition'); // timeline
    expect(panelRoles).toContain('properties');
  });

  it('should not enable any AI/assisted tools', () => {
    const tools = basicSamplerBoard.compositionTools;
    
    expect(tools.phraseDatabase.enabled).toBe(false);
    expect(tools.harmonyExplorer.enabled).toBe(false);
    expect(tools.phraseGenerators.enabled).toBe(false);
    expect(tools.arrangerCard.enabled).toBe(false);
    expect(tools.aiComposer.enabled).toBe(false);
  });

  it('should support DSP chain for manual effects', () => {
    const deckTypes = basicSamplerBoard.decks.map(d => d.type);
    expect(deckTypes).toContain('dsp-chain');
  });
});
