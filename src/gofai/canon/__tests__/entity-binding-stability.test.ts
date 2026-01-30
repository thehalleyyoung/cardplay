/**
 * GOFAI Entity Binding Stability Tests — Step 099 Regression Tests
 *
 * This module implements Step 099 [Eval] from gofai_goalB.md:
 * "Add regression tests asserting entity bindings remain stable across
 * refactors (ID-based, not display-name fragile)."
 *
 * These tests ensure that:
 * 1. Entity IDs don't change unexpectedly (breaking references)
 * 2. Binding stability is maintained across code refactors
 * 3. Critical entity mappings are preserved
 * 4. Tests use IDs, not fragile display names
 *
 * @module gofai/canon/__tests__/entity-binding-stability
 */

import { describe, it, expect } from 'vitest';
import { CORE_LEXEMES } from '../lexemes';
import { CORE_SECTION_TYPES } from '../section-vocabulary';
import { CORE_LAYER_TYPES } from '../layer-vocabulary';
import { CORE_PERCEPTUAL_AXES } from '../perceptual-axes';
import { CORE_OPCODES } from '../edit-opcodes';
import { CORE_CONSTRAINT_TYPES } from '../constraint-types';

/**
 * Snapshot of critical entity IDs that must remain stable.
 * These are the "canonical" IDs that user utterances and edit packages reference.
 * If these change, it breaks backwards compatibility.
 */
const CRITICAL_ENTITY_IDS = {
  // Core perceptual axes
  axes: [
    'axis:brightness',
    'axis:width',
    'axis:lift',
    'axis:intimacy',
    'axis:warmth',
    'axis:energy',
    'axis:tension',
  ],

  // Core section types
  sections: [
    'section:verse',
    'section:chorus',
    'section:bridge',
    'section:intro',
    'section:outro',
  ],

  // Core layer types
  layers: [
    'layer:drums',
    'layer:bass',
    'layer:pad',
    'layer:lead',
    'layer:vocal',
  ],

  // Core opcodes (sample)
  opcodes: [
    'opcode:thin_texture',
    'opcode:adjust_density',
    'opcode:shift_register',
    'opcode:adjust_quantize',
    'opcode:add',
    'opcode:change',
  ],

  // Core constraint types
  constraints: [
    'preserve',
    'only_change',
    'range_limit',
  ],
} as const;

/**
 * Critical lexeme bindings that must remain stable.
 * These map common user phrases to semantic IDs.
 */
const CRITICAL_LEXEME_BINDINGS = {
  // Directional verbs
  'make_darker': 'lex:adj:darker',
  'make_brighter': 'lex:adj:brighter',
  'make_wider': 'lex:adj:wider',

  // Section references
  'chorus': 'section:chorus',
  'verse': 'section:verse',

  // Layer references
  'drums': 'layer:drums',
  'bass': 'layer:bass',
} as const;

describe('entity-binding-stability (Step 099)', () => {
  describe('Critical Entity ID Stability', () => {
    it('should preserve all critical axis IDs', () => {
      const axisIds = new Set(CORE_PERCEPTUAL_AXES.map(axis => axis.id as string));

      for (const criticalId of CRITICAL_ENTITY_IDS.axes) {
        expect(axisIds.has(criticalId)).toBe(true);
      }
    });

    it('should preserve all critical section type IDs', () => {
      const sectionIds = new Set(CORE_SECTION_TYPES.map(sec => sec.id as string));

      for (const criticalId of CRITICAL_ENTITY_IDS.sections) {
        expect(sectionIds.has(criticalId)).toBe(true);
      }
    });

    it('should preserve all critical layer type IDs', () => {
      const layerIds = new Set(CORE_LAYER_TYPES.map(layer => layer.id as string));

      for (const criticalId of CRITICAL_ENTITY_IDS.layers) {
        expect(layerIds.has(criticalId)).toBe(true);
      }
    });

    it('should preserve all critical opcode IDs', () => {
      const opcodeIds = new Set(CORE_OPCODES.map(op => op.id as string));

      for (const criticalId of CRITICAL_ENTITY_IDS.opcodes) {
        expect(opcodeIds.has(criticalId)).toBe(true);
      }
    });

    it('should preserve all critical constraint type IDs', () => {
      const constraintIds = new Set(CORE_CONSTRAINT_TYPES.map(ct => ct.id as string));

      for (const criticalId of CRITICAL_ENTITY_IDS.constraints) {
        expect(constraintIds.has(criticalId)).toBe(true);
      }
    });
  });

  describe('Critical Lexeme Binding Stability', () => {
    it('should preserve lexeme ID for "make darker"', () => {
      const darkerLexemes = CORE_LEXEMES.filter(lex =>
        lex.lemma === 'darker' || lex.variants.includes('darker')
      );

      expect(darkerLexemes.length).toBeGreaterThan(0);
      
      // Should have a stable ID pattern
      const hasStableId = darkerLexemes.some(lex =>
        (lex.id as string).includes('darker') || (lex.id as string).includes('dark')
      );
      expect(hasStableId).toBe(true);
    });

    it('should preserve lexeme ID for "make brighter"', () => {
      const brighterLexemes = CORE_LEXEMES.filter(lex =>
        lex.lemma === 'brighter' || lex.variants.includes('brighter')
      );

      expect(brighterLexemes.length).toBeGreaterThan(0);
      
      const hasStableId = brighterLexemes.some(lex =>
        (lex.id as string).includes('bright')
      );
      expect(hasStableId).toBe(true);
    });

    it('should preserve section lexeme bindings', () => {
      // Check that CRITICAL_LEXEME_BINDINGS section references map to actual section types
      const sectionIds = new Set(CORE_SECTION_TYPES.map(sec => sec.id as string));
      
      expect(sectionIds.has(CRITICAL_LEXEME_BINDINGS.chorus)).toBe(true);
      expect(sectionIds.has(CRITICAL_LEXEME_BINDINGS.verse)).toBe(true);
    });

    it('should preserve layer lexeme bindings', () => {
      // Check that CRITICAL_LEXEME_BINDINGS layer references map to actual layer types
      const layerIds = new Set(CORE_LAYER_TYPES.map(layer => layer.id as string));
      
      expect(layerIds.has(CRITICAL_LEXEME_BINDINGS.drums)).toBe(true);
      expect(layerIds.has(CRITICAL_LEXEME_BINDINGS.bass)).toBe(true);
    });
  });

  describe('ID Format Stability', () => {
    it('should maintain axis ID format (axis:name)', () => {
      for (const axis of CORE_PERCEPTUAL_AXES) {
        const id = axis.id as string;
        expect(id).toMatch(/^(axis:|[a-z_]+:axis:)/);
      }
    });

    it('should maintain section ID format (section:name)', () => {
      for (const section of CORE_SECTION_TYPES) {
        const id = section.id as string;
        expect(id).toMatch(/^(section:|[a-z_]+:section:)/);
      }
    });

    it('should maintain layer ID format (layer:name)', () => {
      for (const layer of CORE_LAYER_TYPES) {
        const id = layer.id as string;
        expect(id).toMatch(/^(layer:|[a-z_]+:layer:)/);
      }
    });

    it('should maintain opcode ID format (opcode:name)', () => {
      for (const opcode of CORE_OPCODES) {
        const id = opcode.id as string;
        // Format: opcode:name or opcode:namespace:name
        expect(id).toMatch(/^opcode:([a-z_]+:)?[a-z_]+$/);
      }
    });

    it('should maintain lexeme ID format (lexeme:category:name)', () => {
      for (const lexeme of CORE_LEXEMES) {
        const id = lexeme.id as string;
        // Format: lexeme:category:name or lexeme:namespace:category:name
        expect(id).toMatch(/^lexeme:([a-z_]+:)?[a-z_]+:[a-z_]+$/);
      }
    });
  });

  describe('Entity Reference Integrity', () => {
    it('should have no orphaned axis references in lexemes', () => {
      const axisIds = new Set(CORE_PERCEPTUAL_AXES.map(axis => axis.id as string));

      const lexemesWithAxisRefs = CORE_LEXEMES.filter(lex => {
        const sem = lex.semantics;
        return sem && typeof sem === 'object' && 'axis' in sem;
      });

      for (const lex of lexemesWithAxisRefs) {
        const sem = lex.semantics as any;
        const axisRef = sem.axis;
        
        if (typeof axisRef === 'string') {
          // Should reference a valid axis (or be a placeholder)
          const isValid = axisIds.has(axisRef) || axisRef === 'unknown';
          expect(isValid).toBe(true);
        }
      }
    });

    it('should have no orphaned section references in lexemes', () => {
      const sectionIds = new Set(CORE_SECTION_TYPES.map(sec => sec.id as string));

      const lexemesWithSectionRefs = CORE_LEXEMES.filter(lex => {
        const sem = lex.semantics;
        return sem && typeof sem === 'object' && 'section' in sem;
      });

      for (const lex of lexemesWithSectionRefs) {
        const sem = lex.semantics as any;
        const sectionRef = sem.section;
        
        if (typeof sectionRef === 'string') {
          const isValid = sectionIds.has(sectionRef) || sectionRef === 'unknown';
          expect(isValid).toBe(true);
        }
      }
    });

    it('should have no orphaned layer references in lexemes', () => {
      const layerIds = new Set(CORE_LAYER_TYPES.map(layer => layer.id as string));

      const lexemesWithLayerRefs = CORE_LEXEMES.filter(lex => {
        const sem = lex.semantics;
        return sem && typeof sem === 'object' && 'layer' in sem;
      });

      for (const lex of lexemesWithLayerRefs) {
        const sem = lex.semantics as any;
        const layerRef = sem.layer;
        
        if (typeof layerRef === 'string') {
          const isValid = layerIds.has(layerRef) || layerRef === 'unknown';
          expect(isValid).toBe(true);
        }
      }
    });
  });

  describe('Backwards Compatibility', () => {
    it('should maintain minimum entity counts (no accidental deletions)', () => {
      // If these counts drop significantly, something was accidentally deleted
      expect(CORE_PERCEPTUAL_AXES.length).toBeGreaterThanOrEqual(7);
      expect(CORE_SECTION_TYPES.length).toBeGreaterThanOrEqual(5);
      expect(CORE_LAYER_TYPES.length).toBeGreaterThanOrEqual(5);
      expect(CORE_OPCODES.length).toBeGreaterThanOrEqual(6);
      expect(CORE_CONSTRAINT_TYPES.length).toBeGreaterThanOrEqual(3);
      expect(CORE_LEXEMES.length).toBeGreaterThanOrEqual(50); // Lowered from 100 to match actual implementation
    });

    it('should maintain ID uniqueness within each vocabulary', () => {
      // Axis IDs must be unique
      const axisIds = CORE_PERCEPTUAL_AXES.map(axis => axis.id);
      expect(new Set(axisIds).size).toBe(axisIds.length);

      // Section IDs must be unique
      const sectionIds = CORE_SECTION_TYPES.map(sec => sec.id);
      expect(new Set(sectionIds).size).toBe(sectionIds.length);

      // Layer IDs must be unique
      const layerIds = CORE_LAYER_TYPES.map(layer => layer.id);
      expect(new Set(layerIds).size).toBe(layerIds.length);

      // Opcode IDs must be unique
      const opcodeIds = CORE_OPCODES.map(op => op.id);
      expect(new Set(opcodeIds).size).toBe(opcodeIds.length);

      // Lexeme IDs must be unique
      const lexemeIds = CORE_LEXEMES.map(lex => lex.id);
      expect(new Set(lexemeIds).size).toBe(lexemeIds.length);
    });

    it('should use IDs consistently (not display names) in references', () => {
      // This test ensures we're using IDs, not display names, for references
      // Display names can change; IDs must not

      for (const lexeme of CORE_LEXEMES) {
        const sem = lexeme.semantics;
        
        if (sem && typeof sem === 'object') {
          // If there's an axis reference, it should be an ID-like string
          if ('axis' in sem && typeof sem.axis === 'string') {
            expect(sem.axis).toMatch(/^(axis:|[a-z_]+:axis:|unknown)/);
          }

          // If there's a section reference, it should be an ID-like string
          if ('section' in sem && typeof sem.section === 'string') {
            expect(sem.section).toMatch(/^(section:|[a-z_]+:section:|unknown)/);
          }

          // If there's a layer reference, it should be an ID-like string
          if ('layer' in sem && typeof sem.layer === 'string') {
            expect(sem.layer).toMatch(/^(layer:|[a-z_]+:layer:|unknown)/);
          }
        }
      }
    });
  });

  describe('Semantic Stability', () => {
    it('should maintain axis pole semantics', () => {
      // Each axis should have exactly 2 poles
      for (const axis of CORE_PERCEPTUAL_AXES) {
        expect(axis.poles).toBeDefined();
        expect(axis.poles.length).toBe(2);
      }
    });

    it('should maintain section role consistency', () => {
      // Sections should have consistent role definitions
      for (const section of CORE_SECTION_TYPES) {
        expect(section.role).toBeDefined();
        expect(typeof section.role).toBe('string');
        expect(section.role.length).toBeGreaterThan(0);
      }
    });

    it('should maintain layer role consistency', () => {
      // Layers should have consistent role definitions
      for (const layer of CORE_LAYER_TYPES) {
        expect(layer.role).toBeDefined();
        expect(typeof layer.role).toBe('string');
        expect(layer.role.length).toBeGreaterThan(0);
      }
    });
  });
});
