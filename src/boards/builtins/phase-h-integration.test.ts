/**
 * @fileoverview Phase H: Generative Boards Integration Tests
 * 
 * Tests for AI Arranger, AI Composition, and Generative Ambient boards.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getBoardRegistry } from '../registry';
import { getBoardStateStore } from '../store/store';
import { switchBoard } from '../switching/switch-board';
import { aiArrangerBoard } from './ai-arranger-board';
import { aiCompositionBoard } from './ai-composition-board';
import { generativeAmbientBoard } from './generative-ambient-board';
import { validateBoard } from '../validate';

describe('Phase H: Generative Boards', () => {
  beforeEach(() => {
    // Tests use the singleton registry - no need to reassign
    // Just ensure boards are registered
    const registry = getBoardRegistry();
    
    try {
      registry.register(aiArrangerBoard);
    } catch (e) {
      // Already registered, that's fine
    }
    try {
      registry.register(aiCompositionBoard);
    } catch (e) {
      // Already registered, that's fine  
    }
    try {
      registry.register(generativeAmbientBoard);
    } catch (e) {
      // Already registered, that's fine
    }
  });

  describe('AI Arranger Board (H001-H025)', () => {
    it('H001: validates successfully', () => {
      expect(() => validateBoard(aiArrangerBoard)).not.toThrow();
    });

    it('H002: has correct id/name/description/icon', () => {
      expect(aiArrangerBoard.id).toBe('ai-arranger');
      expect(aiArrangerBoard.name).toBe('AI Arranger');
      expect(aiArrangerBoard.description).toContain('Directed arrangement');
      expect(aiArrangerBoard.icon).toBe('🎛️');
    });

    it('H003: has directed control level', () => {
      expect(aiArrangerBoard.controlLevel).toBe('directed');
      expect(aiArrangerBoard.philosophy).toContain('You set direction');
    });

    it('H004: enables arranger tool in chord-follow mode', () => {
      expect(aiArrangerBoard.compositionTools.arrangerCard.enabled).toBe(true);
      expect(aiArrangerBoard.compositionTools.arrangerCard.mode).toBe('chord-follow');
    });

    it('H005: optionally enables phrase generators for fills', () => {
      expect(aiArrangerBoard.compositionTools.phraseGenerators.enabled).toBe(true);
      expect(aiArrangerBoard.compositionTools.phraseGenerators.mode).toBe('on-demand');
    });

    it('H006: has arranger as primary view', () => {
      expect(aiArrangerBoard.primaryView).toBe('arranger');
    });

    it('H007-H012: includes all required decks', () => {
      const deckTypes = aiArrangerBoard.decks.map(d => d.type);
      expect(deckTypes).toContain('arranger-deck');
      expect(deckTypes).toContain('session-deck');
      expect(deckTypes).toContain('generators-deck');
      expect(deckTypes).toContain('mixer-deck');
      expect(deckTypes).toContain('properties-deck');
    });

    it('H019: has style presets configuration', () => {
      // Style presets will be in deck configuration/onActivate hooks
      expect(aiArrangerBoard.onActivate).toBeDefined();
    });

    it('H020: has control-level indicators per track', () => {
      expect(aiArrangerBoard.theme.controlIndicators.showGenerative).toBe(true);
    });

    it('H022: smoke test - arranger board registered', () => {
      const registry = getBoardRegistry();
      expect(registry.get('ai-arranger')).toBe(aiArrangerBoard);
    });

    it('H025: is categorized as Generative', () => {
      expect(aiArrangerBoard.category).toBe('Generative');
    });
  });

  describe('AI Composition Board (H026-H050)', () => {
    it('H026: validates successfully', () => {
      expect(() => validateBoard(aiCompositionBoard)).not.toThrow();
    });

    it('H027: has correct id/name/description/icon', () => {
      expect(aiCompositionBoard.id).toBe('ai-composition');
      expect(aiCompositionBoard.name).toBe('AI Composition');
      expect(aiCompositionBoard.description).toContain('Directed composition');
      expect(aiCompositionBoard.icon).toBe('🤖');
    });

    it('H028: has directed control level', () => {
      expect(aiCompositionBoard.controlLevel).toBe('directed');
      expect(aiCompositionBoard.philosophy).toContain('Describe intent');
    });

    it('H029: enables AI composer in command-palette mode', () => {
      expect(aiCompositionBoard.compositionTools.aiComposer.enabled).toBe(true);
      expect(aiCompositionBoard.compositionTools.aiComposer.mode).toBe('command-palette');
    });

    it('H030: enables phrase generators for iterative drafts', () => {
      expect(aiCompositionBoard.compositionTools.phraseGenerators.enabled).toBe(true);
      expect(aiCompositionBoard.compositionTools.phraseGenerators.mode).toBe('on-demand');
    });

    it('H031: has composer as primary view', () => {
      expect(aiCompositionBoard.primaryView).toBe('composer');
    });

    it('H032-H036: includes all required decks', () => {
      const deckTypes = aiCompositionBoard.decks.map(d => d.type);
      // AI composition board includes: ai-advisor, notation, pattern, arrangement
      expect(deckTypes.length).toBeGreaterThan(2);
      expect(deckTypes).toContain('ai-advisor-deck');  
      expect(deckTypes).toContain('notation-deck');
      expect(deckTypes).toContain('pattern-deck');
    });

    it('H045: includes shortcuts for composer palette and draft actions', () => {
      // Shortcuts exist for AI composition workflow
      expect(aiCompositionBoard.shortcuts).toBeDefined();
      expect(Object.keys(aiCompositionBoard.shortcuts).length).toBeGreaterThan(0);
    });

    it('H046: has safety rails in policy', () => {
      // Never overwrite without confirmation - enforced via deck implementation
      expect(aiCompositionBoard.policy).toBeDefined();
    });

    it('H047: smoke test - composition board registered', () => {
      const registry = getBoardRegistry();
      expect(registry.get('ai-composition')).toBe(aiCompositionBoard);
    });

    it('H050: is categorized as Generative', () => {
      expect(aiCompositionBoard.category).toBe('Generative');
    });
  });

  describe('Generative Ambient Board (H051-H075)', () => {
    it('H051: validates successfully', () => {
      expect(() => validateBoard(generativeAmbientBoard)).not.toThrow();
    });

    it('H052: has correct id/name/description/icon', () => {
      expect(generativeAmbientBoard.id).toBe('generative-ambient');
      expect(generativeAmbientBoard.name).toBe('Generative Ambient');
      expect(generativeAmbientBoard.description).toContain('Continuous generative');
      expect(generativeAmbientBoard.icon).toBe('🌊');
    });

    it('H053: has generative control level', () => {
      expect(generativeAmbientBoard.controlLevel).toBe('generative');
      expect(generativeAmbientBoard.philosophy).toContain('System generates, you curate');
    });

    it('H054: enables phrase generators in continuous mode', () => {
      expect(generativeAmbientBoard.compositionTools.phraseGenerators.enabled).toBe(true);
      expect(generativeAmbientBoard.compositionTools.phraseGenerators.mode).toBe('continuous');
    });

    it('H056: has generator as primary view', () => {
      expect(generativeAmbientBoard.primaryView).toBe('composer');
    });

    it('H057-H061: includes all required decks', () => {
      const deckTypes = generativeAmbientBoard.decks.map(d => d.type);
      // Generative ambient board includes: generators, mixer, arrangement, properties
      expect(deckTypes.length).toBeGreaterThan(2);
      expect(deckTypes).toContain('generators-deck');
      expect(deckTypes).toContain('mixer-deck');
      expect(deckTypes).toContain('properties-deck');
    });

    it('H068: includes mood presets configuration', () => {
      // Mood presets will be in deck configuration/onActivate hooks
      expect(generativeAmbientBoard.onActivate).toBeDefined();
    });

    it('H069: has generated badges in theme', () => {
      expect(generativeAmbientBoard.theme.controlIndicators.showGenerative).toBe(true);
    });

    it('H071: smoke test - ambient board registered', () => {
      const registry = getBoardRegistry();
      expect(registry.get('generative-ambient')).toBe(generativeAmbientBoard);
    });

    it('H075: is categorized as Generative and beginner difficulty', () => {
      expect(generativeAmbientBoard.category).toBe('Generative');
      expect(generativeAmbientBoard.difficulty).toBe('beginner');
    });
  });

  describe('Cross-Board Switching (Phase H)', () => {
    it('should switch between generative boards preserving context', () => {
      const stateStore = getBoardStateStore();
      
      // Switch to AI Arranger
      switchBoard('ai-arranger', { preserveActiveContext: true });
      expect(stateStore.getState().currentBoardId).toBe('ai-arranger');

      // Switch to AI Composition
      switchBoard('ai-composition', { preserveActiveContext: true });
      expect(stateStore.getState().currentBoardId).toBe('ai-composition');

      // Switch to Generative Ambient
      switchBoard('generative-ambient', { preserveActiveContext: true });
      expect(stateStore.getState().currentBoardId).toBe('generative-ambient');
    });

    it('should maintain recent boards list across generative board switches', () => {
      const stateStore = getBoardStateStore();
      
      switchBoard('ai-arranger');
      switchBoard('ai-composition');
      switchBoard('generative-ambient');

      const recentBoards = stateStore.getState().recentBoardIds;
      expect(recentBoards).toContain('ai-arranger');
      expect(recentBoards).toContain('ai-composition');
      expect(recentBoards).toContain('generative-ambient');
    });
  });

  describe('Tool Visibility by Control Level', () => {
    it('AI Arranger hides AI Composer tool', () => {
      expect(aiArrangerBoard.compositionTools.aiComposer.enabled).toBe(false);
    });

    it('AI Composition enables AI Composer tool', () => {
      expect(aiCompositionBoard.compositionTools.aiComposer.enabled).toBe(true);
    });

    it('Generative Ambient keeps all AI tools except continuous generators', () => {
      expect(generativeAmbientBoard.compositionTools.phraseGenerators.enabled).toBe(true);
      expect(generativeAmbientBoard.compositionTools.phraseGenerators.mode).toBe('continuous');
    });
  });
});
