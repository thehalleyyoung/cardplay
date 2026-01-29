/**
 * @fileoverview Tests for Tracker + Phrases Board
 */

import { describe, it, expect } from 'vitest';
import { trackerPhrasesBoard } from './tracker-phrases-board';
import { validateBoard } from '../validate';

describe('trackerPhrasesBoard', () => {
  it('validates successfully', () => {
    expect(() => validateBoard(trackerPhrasesBoard)).not.toThrow();
  });

  it('has correct control level', () => {
    expect(trackerPhrasesBoard.controlLevel).toBe('assisted');
  });

  it('enables phrase database in drag-drop mode', () => {
    expect(trackerPhrasesBoard.compositionTools.phraseDatabase.enabled).toBe(true);
    expect(trackerPhrasesBoard.compositionTools.phraseDatabase.mode).toBe('drag-drop');
  });

  it('disables generators and AI tools', () => {
    expect(trackerPhrasesBoard.compositionTools.phraseGenerators.enabled).toBe(false);
    expect(trackerPhrasesBoard.compositionTools.aiComposer.enabled).toBe(false);
  });

  it('includes phrase library deck', () => {
    const phraseLibraryDeck = trackerPhrasesBoard.decks.find(d => d.type === 'phrases-deck');
    expect(phraseLibraryDeck).toBeDefined();
    expect(phraseLibraryDeck?.id).toBe('phrase-library');
  });

  it('includes pattern editor deck', () => {
    const patternDeck = trackerPhrasesBoard.decks.find(d => d.type === 'pattern-deck');
    expect(patternDeck).toBeDefined();
    expect(patternDeck?.id).toBe('pattern-editor');
  });

  it('includes properties deck', () => {
    const propertiesDeck = trackerPhrasesBoard.decks.find(d => d.type === 'properties-deck');
    expect(propertiesDeck).toBeDefined();
  });

  it('includes phrase-specific shortcuts', () => {
    expect(trackerPhrasesBoard.shortcuts['phrase:search']).toBeDefined();
    expect(trackerPhrasesBoard.shortcuts['phrase:preview']).toBeDefined();
    expect(trackerPhrasesBoard.shortcuts['phrase:commit-selection']).toBeDefined();
  });

  it('has correct category and tags', () => {
    expect(trackerPhrasesBoard.category).toBe('Assisted');
    expect(trackerPhrasesBoard.tags).toContain('tracker');
    expect(trackerPhrasesBoard.tags).toContain('phrases');
    expect(trackerPhrasesBoard.tags).toContain('assisted');
  });

  it('has phrase library accent theme', () => {
    expect(trackerPhrasesBoard.theme.colors.primary).toBe('#8e44ad');
    expect(trackerPhrasesBoard.theme.controlIndicators.showSuggestions).toBe(true);
  });

  it('disallows control level override per track', () => {
    expect(trackerPhrasesBoard.policy?.allowControlLevelOverridePerTrack).toBe(false);
  });

  it('has correct primary view', () => {
    expect(trackerPhrasesBoard.primaryView).toBe('tracker');
  });
});
