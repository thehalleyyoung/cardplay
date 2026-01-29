/**
 * @fileoverview Tests for Session + Generators Board
 * 
 * @module @cardplay/boards/builtins/session-generators-board.test
 */

import { describe, it, expect } from 'vitest';
import { sessionGeneratorsBoard } from './session-generators-board';
import { validateBoard } from '../validate';

describe('Session + Generators Board (G061-G090)', () => {
  it('should have correct metadata', () => {
    expect(sessionGeneratorsBoard.id).toBe('session-generators');
    expect(sessionGeneratorsBoard.name).toBe('Session + Generators');
    expect(sessionGeneratorsBoard.category).toBe('Assisted');
    expect(sessionGeneratorsBoard.controlLevel).toBe('assisted');
    expect(sessionGeneratorsBoard.difficulty).toBe('intermediate');
  });

  it('should have phrase generators enabled in on-demand mode (G064)', () => {
    expect(sessionGeneratorsBoard.compositionTools.phraseGenerators.enabled).toBe(true);
    expect(sessionGeneratorsBoard.compositionTools.phraseGenerators.mode).toBe('on-demand');
  });

  it('should have AI composer hidden initially (G065)', () => {
    expect(sessionGeneratorsBoard.compositionTools.aiComposer.enabled).toBe(false);
    expect(sessionGeneratorsBoard.compositionTools.aiComposer.mode).toBe('hidden');
  });

  it('should have session as primary view (G065)', () => {
    expect(sessionGeneratorsBoard.primaryView).toBe('session');
  });

  it('should have correct deck layout (G067-G071)', () => {
    const deckIds = sessionGeneratorsBoard.decks.map(d => d.id);
    expect(deckIds).toContain('clip-session');      // G067
    expect(deckIds).toContain('generators');         // G068
    expect(deckIds).toContain('mixer');             // G069
    expect(deckIds).toContain('instruments');       // G070
    expect(deckIds).toContain('properties');        // G071
  });

  it('should have correct deck types', () => {
    const deckTypes = sessionGeneratorsBoard.decks.map(d => d.type);
    expect(deckTypes).toContain('session-deck');
    expect(deckTypes).toContain('generators-deck');
    expect(deckTypes).toContain('mixer-deck');
    expect(deckTypes).toContain('instruments-deck');
    expect(deckTypes).toContain('properties-deck');
  });

  it('should have generator shortcuts (G082)', () => {
    expect(sessionGeneratorsBoard.shortcuts['generate']).toBe('Cmd+G');
    expect(sessionGeneratorsBoard.shortcuts['regenerate']).toBe('Cmd+Shift+G');
    expect(sessionGeneratorsBoard.shortcuts['freeze']).toBe('Cmd+F');
  });

  it('should have post-processing shortcuts (G078)', () => {
    expect(sessionGeneratorsBoard.shortcuts['humanize']).toBe('Cmd+Shift+H');
    expect(sessionGeneratorsBoard.shortcuts['quantize']).toBe('Cmd+Q');
  });

  it('should have clip launching shortcuts (G082)', () => {
    expect(sessionGeneratorsBoard.shortcuts['launch-clip']).toBe('Enter');
    expect(sessionGeneratorsBoard.shortcuts['stop-clip']).toBe('Backspace');
    expect(sessionGeneratorsBoard.shortcuts['launch-scene']).toBe('Shift+Enter');
  });

  it('should show generative indicators (G083)', () => {
    expect(sessionGeneratorsBoard.theme.controlIndicators.showGenerative).toBe(true);
  });

  it('should allow tool toggles', () => {
    expect(sessionGeneratorsBoard.policy.allowToolToggles).toBe(true);
  });

  it('should not allow per-track control level override', () => {
    expect(sessionGeneratorsBoard.policy.allowControlLevelOverridePerTrack).toBe(false);
  });

  it('should pass board validation', () => {
    const result = validateBoard(sessionGeneratorsBoard);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should have lifecycle hooks defined', () => {
    expect(sessionGeneratorsBoard.onActivate).toBeDefined();
    expect(sessionGeneratorsBoard.onDeactivate).toBeDefined();
    expect(typeof sessionGeneratorsBoard.onActivate).toBe('function');
    expect(typeof sessionGeneratorsBoard.onDeactivate).toBe('function');
  });
});
