/**
 * @fileoverview Tests for Composer Board (Phase I: I001-I025)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { composerBoard } from './composer-board';
import { validateBoard } from '../validate';
import { getBoardRegistry } from '../registry';

describe('Composer Board (Phase I: I001-I025)', () => {
  beforeEach(() => {
    const registry = getBoardRegistry();
    try {
      registry.register(composerBoard);
    } catch (e) {
      // Already registered
    }
  });

  it('I001-I002: has correct id/name/description/icon', () => {
    expect(composerBoard.id).toBe('composer');
    expect(composerBoard.name).toBe('Composer');
    expect(composerBoard.description).toContain('Hybrid power user');
    expect(composerBoard.icon).toBe('🎼');
  });

  it('I003: has collaborative control level and correct philosophy', () => {
    expect(composerBoard.controlLevel).toBe('collaborative');
    expect(composerBoard.philosophy).toContain('Mix manual + assisted per track');
  });

  it('I004: enables all major composition tools', () => {
    expect(composerBoard.compositionTools.phraseDatabase.enabled).toBe(true);
    expect(composerBoard.compositionTools.phraseDatabase.mode).toBe('drag-drop');
    
    expect(composerBoard.compositionTools.harmonyExplorer.enabled).toBe(true);
    expect(composerBoard.compositionTools.harmonyExplorer.mode).toBe('suggest');
    
    expect(composerBoard.compositionTools.phraseGenerators.enabled).toBe(true);
    expect(composerBoard.compositionTools.phraseGenerators.mode).toBe('on-demand');
    
    expect(composerBoard.compositionTools.arrangerCard.enabled).toBe(true);
    expect(composerBoard.compositionTools.arrangerCard.mode).toBe('chord-follow');
  });

  it('I005: keeps AI composer hidden for MVP', () => {
    expect(composerBoard.compositionTools.aiComposer.enabled).toBe(false);
    expect(composerBoard.compositionTools.aiComposer.mode).toBe('hidden');
  });

  it('I006: sets composer as primary view', () => {
    expect(composerBoard.primaryView).toBe('composer');
  });

  it('I007-I015: has complete deck layout', () => {
    expect(composerBoard.decks).toBeDefined();
    expect(composerBoard.decks.length).toBeGreaterThanOrEqual(10);
    
    // I008: Arranger deck
    const arrangerDeck = composerBoard.decks.find(d => d.type === 'arranger-deck');
    expect(arrangerDeck).toBeDefined();
    expect(arrangerDeck?.id).toBe('arranger');
    
    // I009: Chord track deck (using harmony deck)
    const chordDeck = composerBoard.decks.find(d => d.type === 'harmony-deck');
    expect(chordDeck).toBeDefined();
    expect(chordDeck?.id).toBe('chord-track');
    
    // I010: Session grid deck
    const sessionDeck = composerBoard.decks.find(d => d.type === 'session-deck');
    expect(sessionDeck).toBeDefined();
    expect(sessionDeck?.id).toBe('session');
    
    // I011: Notation editor deck
    const notationDeck = composerBoard.decks.find(d => d.type === 'notation-deck');
    expect(notationDeck).toBeDefined();
    expect(notationDeck?.id).toBe('notation');
    
    // I012: Tracker editor deck
    const trackerDeck = composerBoard.decks.find(d => d.type === 'pattern-deck');
    expect(trackerDeck).toBeDefined();
    expect(trackerDeck?.id).toBe('tracker');
    
    // I013: Transport deck
    const transportDeck = composerBoard.decks.find(d => d.type === 'transport-deck');
    expect(transportDeck).toBeDefined();
    
    // I014: Generator deck
    const generatorDeck = composerBoard.decks.find(d => d.type === 'generators-deck');
    expect(generatorDeck).toBeDefined();
    expect(generatorDeck?.id).toBe('generators');
    
    // I015: Phrase library deck
    const phraseDeck = composerBoard.decks.find(d => d.type === 'phrases-deck');
    expect(phraseDeck).toBeDefined();
    expect(phraseDeck?.id).toBe('phrases');
  });

  it('I011-I012: notation and tracker editors use tabs layout', () => {
    const notationDeck = composerBoard.decks.find(d => d.type === 'notation-deck');
    const trackerDeck = composerBoard.decks.find(d => d.type === 'pattern-deck');
    
    expect(notationDeck?.cardLayout).toBe('tabs');
    expect(trackerDeck?.cardLayout).toBe('tabs');
  });

  it('I021-I022: allows per-track control level overrides', () => {
    expect(composerBoard.policy?.allowControlLevelOverridePerTrack).toBe(true);
  });

  it('validates successfully', () => {
    expect(() => validateBoard(composerBoard)).not.toThrow();
  });

  it('has hybrid category and expert difficulty', () => {
    expect(composerBoard.category).toBe('Hybrid');
    expect(composerBoard.difficulty).toBe('expert');
  });

  it('has comprehensive shortcut map', () => {
    expect(composerBoard.shortcuts).toBeDefined();
    expect(Object.keys(composerBoard.shortcuts).length).toBeGreaterThan(10);
    
    // Check key shortcuts exist
    expect(composerBoard.shortcuts['cmd+g']).toBe('generate-part');
    expect(composerBoard.shortcuts['cmd+f']).toBe('freeze-part');
    expect(composerBoard.shortcuts['space']).toBe('play-pause');
  });

  it('has collaborative theme colors', () => {
    expect(composerBoard.theme?.colors).toBeDefined();
    expect(composerBoard.theme?.colors?.primary).toBeDefined();
  });

  it('has lifecycle hooks', () => {
    expect(composerBoard.onActivate).toBeDefined();
    expect(composerBoard.onDeactivate).toBeDefined();
  });

  it('has connections between decks', () => {
    expect(composerBoard.connections).toBeDefined();
    expect(composerBoard.connections.length).toBeGreaterThan(0);
    
    // Check chord track feeds harmony to generators
    const harmonyConnection = composerBoard.connections.find(
      c => c.sourceId === 'chord-track' && c.targetId === 'generators'
    );
    expect(harmonyConnection).toBeDefined();
    expect(harmonyConnection?.connectionType).toBe('modulation');
  });
});
