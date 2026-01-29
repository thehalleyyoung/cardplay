/**
 * @fileoverview Tests for Generated Content Styling (J009)
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getContentClass,
  createContentBadge,
  getManualMetadata,
  getGeneratedMetadata,
  freezeGenerated,
  GENERATED_CLASSES,
} from './generated-styling';
import type { GenerationMetadata } from './generated-styling';

describe('Generated Content Styling', () => {
  describe('getContentClass', () => {
    it('should return manual class for manual events', () => {
      expect(getContentClass(false, false)).toBe(GENERATED_CLASSES.manualEvent);
    });
    
    it('should return generated class for generated events', () => {
      expect(getContentClass(true, false)).toBe(GENERATED_CLASSES.generatedEvent);
    });
    
    it('should return frozen class for frozen events', () => {
      expect(getContentClass(true, true)).toBe(GENERATED_CLASSES.frozenEvent);
    });
    
    it('should prioritize frozen over generated', () => {
      // If both flags are true, frozen takes priority
      expect(getContentClass(true, true)).toBe(GENERATED_CLASSES.frozenEvent);
    });
  });
  
  describe('createContentBadge', () => {
    it('should create generated badge with correct class', () => {
      const badge = createContentBadge('generated');
      expect(badge.className).toBe('generated-badge');
      expect(badge.textContent).toBe('AI');
      expect(badge.title).toContain('Generated');
    });
    
    it('should create frozen badge with correct class', () => {
      const badge = createContentBadge('frozen');
      expect(badge.className).toBe('frozen-badge');
      expect(badge.textContent).toBe('Frozen');
      expect(badge.title).toContain('Was generated');
    });
    
    it('should create manual badge (hidden by default)', () => {
      const badge = createContentBadge('manual');
      expect(badge.className).toBe('manual-badge');
      expect(badge.textContent).toBe('Manual');
      expect(badge.style.display).toBe('none');
    });
    
    it('should create HTML elements', () => {
      const badge = createContentBadge('generated');
      expect(badge instanceof HTMLElement).toBe(true);
      expect(badge.tagName).toBe('SPAN');
    });
  });
  
  describe('Generation Metadata', () => {
    describe('getManualMetadata', () => {
      it('should return metadata for manual events', () => {
        const metadata = getManualMetadata();
        expect(metadata.generated).toBe(false);
        expect(metadata.generatorType).toBeUndefined();
        expect(metadata.frozen).toBeUndefined();
      });
    });
    
    describe('getGeneratedMetadata', () => {
      it('should return metadata for generated events', () => {
        const metadata = getGeneratedMetadata('melody');
        expect(metadata.generated).toBe(true);
        expect(metadata.generatorType).toBe('melody');
        expect(metadata.generatedAt).toBeGreaterThan(0);
        expect(metadata.frozen).toBeUndefined();
      });
      
      it('should work with different generator types', () => {
        const melody = getGeneratedMetadata('melody');
        const bass = getGeneratedMetadata('bass');
        const drums = getGeneratedMetadata('drums');
        
        expect(melody.generatorType).toBe('melody');
        expect(bass.generatorType).toBe('bass');
        expect(drums.generatorType).toBe('drums');
      });
      
      it('should include timestamp', () => {
        const before = Date.now();
        const metadata = getGeneratedMetadata('arp');
        const after = Date.now();
        
        expect(metadata.generatedAt).toBeGreaterThanOrEqual(before);
        expect(metadata.generatedAt).toBeLessThanOrEqual(after);
      });
    });
    
    describe('freezeGenerated', () => {
      it('should mark generated event as frozen', () => {
        const generated = getGeneratedMetadata('bass');
        const frozen = freezeGenerated(generated);
        
        expect(frozen.generated).toBe(true);
        expect(frozen.frozen).toBe(true);
        expect(frozen.generatorType).toBe('bass');
        expect(frozen.generatedAt).toBe(generated.generatedAt);
        expect(frozen.frozenAt).toBeGreaterThan(0);
      });
      
      it('should preserve original generation metadata', () => {
        const generated = getGeneratedMetadata('drums');
        const frozen = freezeGenerated(generated);
        
        expect(frozen.generated).toBe(generated.generated);
        expect(frozen.generatorType).toBe(generated.generatorType);
        expect(frozen.generatedAt).toBe(generated.generatedAt);
      });
      
      it('should add freeze timestamp', () => {
        const generated = getGeneratedMetadata('fill');
        const before = Date.now();
        const frozen = freezeGenerated(generated);
        const after = Date.now();
        
        expect(frozen.frozenAt).toBeGreaterThanOrEqual(before);
        expect(frozen.frozenAt).toBeLessThanOrEqual(after);
      });
    });
  });
  
  describe('CSS Classes', () => {
    it('should export correct class names', () => {
      expect(GENERATED_CLASSES.generatedEvent).toBe('content-generated');
      expect(GENERATED_CLASSES.manualEvent).toBe('content-manual');
      expect(GENERATED_CLASSES.frozenEvent).toBe('content-frozen');
    });
    
    it('should be read-only (TypeScript enforced)', () => {
      // TypeScript enforces this at compile time via 'as const'
      // Just verify the constants exist and have correct values
      expect(GENERATED_CLASSES.generatedEvent).toBe('content-generated');
      expect(GENERATED_CLASSES.manualEvent).toBe('content-manual');
      expect(GENERATED_CLASSES.frozenEvent).toBe('content-frozen');
    });
  });
  
  describe('Integration Scenarios', () => {
    it('should support complete generation lifecycle', () => {
      // 1. Start with manual event
      let metadata = getManualMetadata();
      expect(getContentClass(metadata.generated, false)).toBe('content-manual');
      
      // 2. Generate event
      metadata = getGeneratedMetadata('melody');
      expect(getContentClass(metadata.generated, false)).toBe('content-generated');
      
      // 3. Freeze event
      metadata = freezeGenerated(metadata);
      expect(getContentClass(metadata.generated, !!metadata.frozen)).toBe('content-frozen');
    });
    
    it('should support badge display lifecycle', () => {
      // Generate event → show AI badge
      let badge = createContentBadge('generated');
      expect(badge.textContent).toBe('AI');
      expect(badge.style.display).not.toBe('none');
      
      // Freeze event → show Frozen badge
      badge = createContentBadge('frozen');
      expect(badge.textContent).toBe('Frozen');
      expect(badge.style.display).not.toBe('none');
    });
  });
});
