/**
 * @fileoverview Deck Template Registry Snapshot Tests
 * 
 * Change 496: Snapshot test for deck template registry output.
 * Ensures deck templates stay stable.
 * 
 * @module @cardplay/src/tests/snapshots/deck-template-registry.snapshot.test
 */

import { describe, it, expect } from 'vitest';
import { getAllDeckTemplates, getDeckTemplate } from '../../ai/theory/deck-templates';

describe('Deck Template Registry Snapshots', () => {
  it('should match registered deck template IDs snapshot', () => {
    const templates = getAllDeckTemplates();
    const templateIds = templates.map(t => t.id).sort();

    expect(templateIds).toMatchSnapshot();
  });

  it('should match deck template metadata snapshot', () => {
    const templates = getAllDeckTemplates();

    const metadata = templates.map(template => {
      return {
        id: template.id,
        displayName: template.displayName,
        category: template.category,
        hasNamespace: template.id.includes(':'),
        namespace: template.id.includes(':') ? template.id.split(':')[0] : null,
        boardTypesCount: template.boardTypes.length,
        boardTypes: [...template.boardTypes].sort(),
        cardIdsCount: template.cardIds.length,
        culturesCount: template.cultures.length,
        stylesCount: template.styles.length,
        slotsCount: template.slots.length,
        priority: template.priority,
      };
    }).sort((a, b) => a.id.localeCompare(b.id));

    expect(metadata).toMatchSnapshot();
  });

  it('should match builtin deck templates snapshot', () => {
    const templates = getAllDeckTemplates();
    
    // Builtin templates use 'template:' prefix
    const builtinTemplates = templates
      .filter(t => t.id.startsWith('template:'))
      .map(t => t.id)
      .sort();

    expect(builtinTemplates).toMatchSnapshot();
  });

  it('should match deck template categories snapshot', () => {
    const templates = getAllDeckTemplates();
    const categories = [...new Set(templates.map(t => t.category))].sort();

    expect(categories).toMatchSnapshot();
  });

  it('should match deck template board types snapshot', () => {
    const templates = getAllDeckTemplates();
    const boardTypes = new Set<string>();
    
    for (const template of templates) {
      for (const boardType of template.boardTypes) {
        boardTypes.add(boardType);
      }
    }

    const sortedBoardTypes = Array.from(boardTypes).sort();
    expect(sortedBoardTypes).toMatchSnapshot();
  });

  it('should validate all template IDs are unique', () => {
    const templates = getAllDeckTemplates();
    const templateIds = templates.map(t => t.id);
    const uniqueIds = [...new Set(templateIds)];

    expect(templateIds.length).toBe(uniqueIds.length);
  });

  it('should validate template ID format', () => {
    const templates = getAllDeckTemplates();

    const invalidIds = templates
      .map(t => t.id)
      .filter(id => {
        // Should be either 'template:name' or 'namespace:name'
        if (!id.includes(':')) return true;
        
        const [prefix, name] = id.split(':');
        
        // Prefix and name should be lowercase with hyphens/underscores
        const validPrefix = /^[a-z0-9-_]+$/.test(prefix);
        const validName = /^[a-z0-9-_]+$/.test(name);
        
        return !validPrefix || !validName;
      });

    expect(invalidIds).toEqual([]);
  });

  it('should validate all template card IDs are namespaced', () => {
    const templates = getAllDeckTemplates();

    const nonNamespacedCardIds: string[] = [];
    
    for (const template of templates) {
      for (const cardId of template.cardIds) {
        if (!cardId.includes(':')) {
          nonNamespacedCardIds.push(`${template.id} -> ${cardId}`);
        }
      }
    }

    // All card IDs should be namespaced
    expect(nonNamespacedCardIds).toEqual([]);
  });

  it('should match deck template card IDs snapshot', () => {
    const templates = getAllDeckTemplates();

    const allCardIds = new Set<string>();
    
    for (const template of templates) {
      for (const cardId of template.cardIds) {
        allCardIds.add(cardId);
      }
    }

    const sortedCardIds = Array.from(allCardIds).sort();
    expect(sortedCardIds).toMatchSnapshot();
  });

  it('should validate template priorities are reasonable', () => {
    const templates = getAllDeckTemplates();

    const priorities = templates.map(t => ({
      id: t.id,
      priority: t.priority,
    }));

    // Priorities should be positive
    const invalidPriorities = priorities.filter(p => p.priority < 0);
    expect(invalidPriorities).toEqual([]);

    // Priorities should be in a reasonable range (0-100)
    const outOfRangePriorities = priorities.filter(p => p.priority > 100);
    expect(outOfRangePriorities).toEqual([]);
  });

  it('should match template slot structure snapshot', () => {
    const templates = getAllDeckTemplates();

    const slotStructures = templates.map(template => {
      return {
        templateId: template.id,
        slots: template.slots.map(slot => ({
          position: slot.position,
          label: slot.label,
          cardId: slot.cardId,
          required: slot.required,
          hasAlternatives: !!slot.alternatives && slot.alternatives.length > 0,
          alternativesCount: slot.alternatives?.length ?? 0,
        })),
      };
    }).sort((a, b) => a.templateId.localeCompare(b.templateId));

    expect(slotStructures).toMatchSnapshot();
  });

  it('should validate slot positions are sequential', () => {
    const templates = getAllDeckTemplates();

    const invalidSlots: string[] = [];
    
    for (const template of templates) {
      const positions = template.slots.map(s => s.position).sort((a, b) => a - b);
      
      // Check if positions are 0, 1, 2, 3, ... (sequential)
      for (let i = 0; i < positions.length; i++) {
        if (positions[i] !== i) {
          invalidSlots.push(`${template.id}: expected position ${i}, found ${positions[i]}`);
        }
      }
    }

    expect(invalidSlots).toEqual([]);
  });

  it('should validate slot card IDs match template card IDs', () => {
    const templates = getAllDeckTemplates();

    const mismatches: string[] = [];
    
    for (const template of templates) {
      const templateCardIds = new Set(template.cardIds);
      
      for (const slot of template.slots) {
        if (!templateCardIds.has(slot.cardId)) {
          mismatches.push(`${template.id}: slot ${slot.position} references ${slot.cardId} not in cardIds`);
        }
        
        // Check alternatives
        if (slot.alternatives) {
          for (const alt of slot.alternatives) {
            if (!templateCardIds.has(alt)) {
              mismatches.push(`${template.id}: slot ${slot.position} alternative ${alt} not in cardIds`);
            }
          }
        }
      }
    }

    expect(mismatches).toEqual([]);
  });
});
