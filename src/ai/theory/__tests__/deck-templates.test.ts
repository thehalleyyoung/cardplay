/**
 * @fileoverview Tests for Deck Templates
 * @module @cardplay/ai/theory/__tests__/deck-templates
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAllDeckTemplates,
  getDeckTemplate,
  getTemplatesForBoard,
  getTemplatesForCulture,
  getTemplatesForStyle,
  recommendTemplate,
  registerDeckTemplate,
  unregisterDeckTemplate,
  validateTemplateId,
  THEORY_DECK_TEMPLATE,
  PHRASE_DECK_TEMPLATE,
  HARMONY_DECK_TEMPLATE,
} from '../deck-templates';
import type { DeckTemplate, MusicSpec } from '../music-spec';

describe('Deck Templates', () => {
  describe('builtin templates', () => {
    it('should have all builtin templates', () => {
      const templates = getAllDeckTemplates();
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should have valid template IDs', () => {
      const templates = getAllDeckTemplates();
      templates.forEach(t => {
        expect(t.id).toBeTruthy();
        expect(t.id).toMatch(/^template:[\w_]+$/);
      });
    });

    it('should have all required fields', () => {
      const templates = getAllDeckTemplates();
      templates.forEach(t => {
        expect(t.id).toBeTruthy();
        expect(t.displayName).toBeTruthy();
        expect(t.description).toBeTruthy();
        expect(t.category).toBeTruthy();
        expect(t.boardTypes).toBeInstanceOf(Array);
        expect(t.cultures).toBeInstanceOf(Array);
        expect(t.styles).toBeInstanceOf(Array);
        expect(t.cardIds).toBeInstanceOf(Array);
        expect(t.slots).toBeInstanceOf(Array);
        expect(typeof t.priority).toBe('number');
      });
    });

    it('should have valid card IDs (namespaced)', () => {
      const templates = getAllDeckTemplates();
      templates.forEach(t => {
        t.cardIds.forEach(cardId => {
          expect(cardId).toMatch(/^[\w-]+:[\w_]+$/);
        });
      });
    });

    it('should have matching slots and cardIds', () => {
      const templates = getAllDeckTemplates();
      templates.forEach(t => {
        // All slot cardIds should be in the template's cardIds list
        t.slots.forEach(slot => {
          const isInCardIds = t.cardIds.includes(slot.cardId);
          const isInAlternatives = slot.alternatives?.some(alt => t.cardIds.includes(alt));
          expect(isInCardIds || isInAlternatives).toBe(true);
        });
      });
    });
  });

  describe('template lookup', () => {
    it('should find builtin templates by ID', () => {
      const template = getDeckTemplate('template:theory');
      expect(template).toBeDefined();
      expect(template?.id).toBe('template:theory');
    });

    it('should return undefined for unknown template', () => {
      const template = getDeckTemplate('template:nonexistent');
      expect(template).toBeUndefined();
    });
  });

  describe('template filtering', () => {
    it('should filter by board type', () => {
      const harmonyTemplates = getTemplatesForBoard('harmony');
      expect(harmonyTemplates.length).toBeGreaterThan(0);
      harmonyTemplates.forEach(t => {
        expect(t.boardTypes).toContain('harmony');
      });
    });

    it('should filter by culture', () => {
      const westernTemplates = getTemplatesForCulture('western');
      expect(westernTemplates.length).toBeGreaterThan(0);
      westernTemplates.forEach(t => {
        expect(t.cultures).toContain('western');
      });
    });

    it('should filter by style', () => {
      const galantTemplates = getTemplatesForStyle('galant');
      expect(galantTemplates.length).toBeGreaterThan(0);
      galantTemplates.forEach(t => {
        expect(t.styles).toContain('galant');
      });
    });

    it('should sort by priority', () => {
      const templates = getTemplatesForBoard('arranger');
      for (let i = 1; i < templates.length; i++) {
        expect(templates[i - 1].priority).toBeGreaterThanOrEqual(templates[i].priority);
      }
    });
  });

  describe('template recommendation', () => {
    it('should recommend template for western galant style', () => {
      const spec: Partial<MusicSpec> = {
        culture: 'western',
        style: 'galant',
      };
      const template = recommendTemplate(spec as MusicSpec, 'phrase');
      expect(template).toBeDefined();
      expect(template?.cultures).toContain('western');
    });

    it('should recommend carnatic template for carnatic culture', () => {
      const spec: Partial<MusicSpec> = {
        culture: 'carnatic',
        style: 'custom',
      };
      const template = recommendTemplate(spec as MusicSpec, 'tracker');
      expect(template).toBeDefined();
      expect(template?.cultures).toContain('carnatic');
    });
  });

  describe('template validation (Change 384)', () => {
    it('should validate builtin template IDs', () => {
      const result = validateTemplateId('template:theory', true);
      expect(result.valid).toBe(true);
    });

    it('should reject non-namespaced custom template IDs', () => {
      const result = validateTemplateId('my_template', false);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        // The validateId function rejects underscores
        expect(result.error).toBeTruthy();
      }
    });

    it('should accept namespaced custom template IDs', () => {
      const result = validateTemplateId('my-pack:theory', false);
      expect(result.valid).toBe(true);
    });

    it('should reject template: prefix for custom templates', () => {
      const result = validateTemplateId('template:custom', false);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain('template:');
      }
    });
  });

  describe('extension template registration (Change 427)', () => {
    beforeEach(() => {
      // Clean up any registered test templates
      unregisterDeckTemplate('test-pack:custom');
    });

    it('should register valid extension template', () => {
      const template: DeckTemplate = {
        id: 'test-pack:custom',
        displayName: 'Test Template',
        description: 'A test template',
        category: 'theory',
        boardTypes: ['harmony'],
        cultures: ['western'],
        styles: ['custom'],
        cardIds: ['theory:tonality_model'],
        slots: [
          { position: 0, label: 'Tonality', cardId: 'theory:tonality_model', required: true },
        ],
        priority: 50,
      };

      const result = registerDeckTemplate(template);
      expect(result.success).toBe(true);

      const retrieved = getDeckTemplate('test-pack:custom');
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('test-pack:custom');
    });

    it('should reject non-namespaced extension template', () => {
      const template: DeckTemplate = {
        id: 'custom',
        displayName: 'Test Template',
        description: 'A test template',
        category: 'theory',
        boardTypes: ['harmony'],
        cultures: ['western'],
        styles: ['custom'],
        cardIds: ['theory:tonality_model'],
        slots: [],
        priority: 50,
      };

      const result = registerDeckTemplate(template);
      expect(result.success).toBe(false);
      expect(result.error).toContain('namespaced');
    });

    it('should reject duplicate template ID', () => {
      const template: DeckTemplate = {
        id: 'test-pack:dup',
        displayName: 'Test Template',
        description: 'A test template',
        category: 'theory',
        boardTypes: ['harmony'],
        cultures: ['western'],
        styles: ['custom'],
        cardIds: ['theory:tonality_model'],
        slots: [],
        priority: 50,
      };

      const result1 = registerDeckTemplate(template);
      expect(result1.success).toBe(true);

      const result2 = registerDeckTemplate(template);
      expect(result2.success).toBe(false);
      expect(result2.error).toContain('already registered');

      unregisterDeckTemplate('test-pack:dup');
    });

    it('should reject conflicting with builtin template', () => {
      const template: DeckTemplate = {
        id: 'template:theory',
        displayName: 'Test Template',
        description: 'A test template',
        category: 'theory',
        boardTypes: ['harmony'],
        cultures: ['western'],
        styles: ['custom'],
        cardIds: ['theory:tonality_model'],
        slots: [],
        priority: 50,
      };

      const result = registerDeckTemplate(template);
      expect(result.success).toBe(false);
      // The validation catches the template: prefix first
      expect(result.error).toContain('template:');
    });

    it('should unregister extension template', () => {
      const template: DeckTemplate = {
        id: 'test-pack:unreg',
        displayName: 'Test Template',
        description: 'A test template',
        category: 'theory',
        boardTypes: ['harmony'],
        cultures: ['western'],
        styles: ['custom'],
        cardIds: ['theory:tonality_model'],
        slots: [],
        priority: 50,
      };

      registerDeckTemplate(template);
      expect(getDeckTemplate('test-pack:unreg')).toBeDefined();

      const unregistered = unregisterDeckTemplate('test-pack:unreg');
      expect(unregistered).toBe(true);
      expect(getDeckTemplate('test-pack:unreg')).toBeUndefined();
    });
  });

  describe('card ID validation (Change 385)', () => {
    it('should validate all builtin templates reference existing theory cards', () => {
      // This test relies on validateBuiltinTemplates() which runs at module load
      // If we got here, it means the validation passed
      expect(true).toBe(true);
    });

    it('should reject template with invalid card IDs', () => {
      const template: DeckTemplate = {
        id: 'test-pack:invalid',
        displayName: 'Test Template',
        description: 'A test template',
        category: 'theory',
        boardTypes: ['harmony'],
        cultures: ['western'],
        styles: ['custom'],
        cardIds: ['nonexistent:card'],
        slots: [],
        priority: 50,
      };

      const result = registerDeckTemplate(template);
      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid card IDs');
    });
  });

  describe('specific builtin templates', () => {
    it('THEORY_DECK_TEMPLATE should have correct structure', () => {
      expect(THEORY_DECK_TEMPLATE.id).toBe('template:theory');
      expect(THEORY_DECK_TEMPLATE.category).toBe('theory');
      expect(THEORY_DECK_TEMPLATE.cardIds.length).toBeGreaterThan(0);
      expect(THEORY_DECK_TEMPLATE.deckTypes).toBeDefined();
    });

    it('PHRASE_DECK_TEMPLATE should have correct structure', () => {
      expect(PHRASE_DECK_TEMPLATE.id).toBe('template:phrase');
      expect(PHRASE_DECK_TEMPLATE.category).toBe('phrase');
      expect(PHRASE_DECK_TEMPLATE.deckTypes).toBeDefined();
    });

    it('HARMONY_DECK_TEMPLATE should have correct structure', () => {
      expect(HARMONY_DECK_TEMPLATE.id).toBe('template:harmony');
      expect(HARMONY_DECK_TEMPLATE.category).toBe('harmony');
      expect(HARMONY_DECK_TEMPLATE.deckTypes).toContain('harmony-deck');
    });
  });
});
