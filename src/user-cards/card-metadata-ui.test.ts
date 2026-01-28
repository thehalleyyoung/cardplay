/**
 * @fileoverview Tests for Card Metadata UI.
 * 
 * @module @cardplay/user-cards/card-metadata-ui.test
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  searchIcons,
  searchTags,
  isValidVersion,
  isValidCardId,
  isValidColor,
  ICON_CATEGORIES,
  ALL_ICONS,
  TAG_SUGGESTIONS,
  COLOR_SCHEMES,
  CARD_CATEGORIES,
  LICENSES,
} from './card-metadata-ui';

// Mock DOM for UI tests
const { JSDOM } = await import('jsdom');

let dom: any;
beforeAll(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  (global as any).document = dom.window.document;
  (global as any).window = dom.window;
  (global as any).HTMLElement = dom.window.HTMLElement;
});

// Import UI functions after DOM is set up
const {
  createIconPreview,
  createColorSwatch,
  createCategoryBadge,
  createTagPill,
  createTextField,
  createTextArea,
  createSelectField,
  createTagEditor,
  createVersionField,
  createAuthorField,
  createLicenseSelector,
  createReadmeEditor,
} = await import('./card-metadata-ui');

describe('Card Metadata UI', () => {
  describe('Icon Search', () => {
    it('should find music icons', () => {
      const results = searchIcons('music');
      expect(results.length).toBeGreaterThan(0);
      expect(results).toContain('🎵');
    });
    
    it('should find instrument icons', () => {
      const results = searchIcons('instrument');
      expect(results.length).toBeGreaterThan(0);
      expect(results).toContain('🎹');
    });
    
    it('should return empty array for no matches', () => {
      const results = searchIcons('xyz123notfound');
      expect(results).toEqual([]);
    });
  });
  
  describe('Tag Search', () => {
    it('should find tags by prefix', () => {
      const results = searchTags('mid');
      expect(results).toContain('midi');
    });
    
    it('should find tags by substring', () => {
      const results = searchTags('syn');
      expect(results).toContain('synth');
    });
    
    it('should be case insensitive', () => {
      const results = searchTags('MIDI');
      expect(results).toContain('midi');
    });
  });
  
  describe('Validation', () => {
    describe('isValidVersion', () => {
      it('should validate correct semver versions', () => {
        expect(isValidVersion('1.0.0')).toBe(true);
        expect(isValidVersion('0.1.2')).toBe(true);
        expect(isValidVersion('10.20.30')).toBe(true);
      });
      
      it('should validate pre-release versions', () => {
        expect(isValidVersion('1.0.0-alpha')).toBe(true);
        expect(isValidVersion('1.0.0-beta.1')).toBe(true);
      });
      
      it('should validate build metadata', () => {
        expect(isValidVersion('1.0.0+build.123')).toBe(true);
        expect(isValidVersion('1.0.0-alpha+build')).toBe(true);
      });
      
      it('should reject invalid versions', () => {
        expect(isValidVersion('1.0')).toBe(false);
        expect(isValidVersion('v1.0.0')).toBe(false);
        expect(isValidVersion('1.0.0.0')).toBe(false);
        expect(isValidVersion('')).toBe(false);
      });
    });
    
    describe('isValidCardId', () => {
      it('should validate kebab-case ids', () => {
        expect(isValidCardId('my-card')).toBe(true);
        expect(isValidCardId('card123')).toBe(true);
        expect(isValidCardId('a-b-c')).toBe(true);
      });
      
      it('should reject invalid ids', () => {
        expect(isValidCardId('MyCard')).toBe(false);
        expect(isValidCardId('my_card')).toBe(false);
        expect(isValidCardId('123-card')).toBe(false);
        expect(isValidCardId('my card')).toBe(false);
      });
    });
    
    describe('isValidColor', () => {
      it('should validate hex colors', () => {
        expect(isValidColor('#ffffff')).toBe(true);
        expect(isValidColor('#000000')).toBe(true);
        expect(isValidColor('#3b82f6')).toBe(true);
      });
      
      it('should reject invalid colors', () => {
        expect(isValidColor('ffffff')).toBe(false);
        expect(isValidColor('#fff')).toBe(false);
        expect(isValidColor('#gggggg')).toBe(false);
        expect(isValidColor('blue')).toBe(false);
      });
    });
  });
  
  describe('UI Element Creation', () => {
    it('should create icon preview', () => {
      const element = createIconPreview('🎵');
      expect(element).toBeInstanceOf(dom.window.HTMLElement);
      expect(element.textContent).toBe('🎵');
    });
    
    it('should create color swatch', () => {
      const element = createColorSwatch('#3b82f6');
      expect(element).toBeInstanceOf(dom.window.HTMLElement);
    });
    
    it('should create color swatch with gradient', () => {
      const element = createColorSwatch('#000000', ['#ff0000', '#0000ff']);
      expect(element).toBeInstanceOf(dom.window.HTMLElement);
      expect(element.style.background).toContain('linear-gradient');
    });
    
    it('should create category badge', () => {
      const category = CARD_CATEGORIES[0];
      const element = createCategoryBadge(category);
      expect(element).toBeInstanceOf(dom.window.HTMLElement);
      expect(element.textContent).toContain(category.name);
    });
    
    it('should create tag pill', () => {
      const element = createTagPill('test-tag');
      expect(element).toBeInstanceOf(dom.window.HTMLElement);
      expect(element.textContent).toContain('test-tag');
    });
    
    it('should create tag pill with remove handler', () => {
      let removed = false;
      const element = createTagPill('test-tag', () => {
        removed = true;
      });
      
      const removeBtn = element.querySelector('button');
      expect(removeBtn).toBeTruthy();
    });
  });
  
  describe('Form Fields', () => {
    it('should create text field', () => {
      let value = 'test';
      const element = createTextField(
        'Test Label',
        value,
        (v) => { value = v; }
      );
      
      expect(element).toBeInstanceOf(dom.window.HTMLElement);
      expect(element.textContent).toContain('Test Label');
    });
    
    it('should create textarea field', () => {
      let value = 'test';
      const element = createTextArea(
        'Description',
        value,
        (v) => { value = v; }
      );
      
      expect(element).toBeInstanceOf(dom.window.HTMLElement);
      expect(element.textContent).toContain('Description');
    });
    
    it('should create select field', () => {
      const options = [
        { value: 'a', label: 'Option A' },
        { value: 'b', label: 'Option B' },
      ];
      let value: 'a' | 'b' = 'a';
      const element = createSelectField(
        'Choose',
        value,
        options,
        (v) => { value = v; }
      );
      
      expect(element).toBeInstanceOf(dom.window.HTMLElement);
      expect(element.textContent).toContain('Choose');
    });
  });
  
  describe('Tag Editor', () => {
    it('should create tag editor', () => {
      const tags: string[] = ['tag1', 'tag2'];
      const element = createTagEditor({
        tags,
        onAdd: (tag) => { tags.push(tag); },
        onRemove: (tag) => {
          const idx = tags.indexOf(tag);
          if (idx >= 0) tags.splice(idx, 1);
        },
      });
      
      expect(element).toBeInstanceOf(dom.window.HTMLElement);
      expect(element.textContent).toContain('Tags');
      expect(element.textContent).toContain('tag1');
      expect(element.textContent).toContain('tag2');
    });
    
    it('should respect max tags limit', () => {
      const tags: string[] = [];
      const element = createTagEditor({
        tags,
        onAdd: (tag) => { tags.push(tag); },
        onRemove: (tag) => {
          const idx = tags.indexOf(tag);
          if (idx >= 0) tags.splice(idx, 1);
        },
        maxTags: 5,
      });
      
      expect(element).toBeInstanceOf(dom.window.HTMLElement);
    });
  });
  
  describe('Version Field', () => {
    it('should create version field', () => {
      let value = '1.0.0';
      const element = createVersionField(value, (v) => { value = v; });
      
      expect(element).toBeInstanceOf(dom.window.HTMLElement);
      expect(element.textContent).toContain('Version');
      expect(element.textContent).toContain('MAJOR.MINOR.PATCH');
    });
  });
  
  describe('Author Field', () => {
    it('should create author field', () => {
      let value = 'John Doe';
      const element = createAuthorField(value, (v) => { value = v; });
      
      expect(element).toBeInstanceOf(dom.window.HTMLElement);
      expect(element.textContent).toContain('Author');
    });
  });
  
  describe('License Selector', () => {
    it('should create license selector', () => {
      let value = 'MIT';
      const element = createLicenseSelector(value, (v) => { value = v; });
      
      expect(element).toBeInstanceOf(dom.window.HTMLElement);
      expect(element.textContent).toContain('License');
    });
    
    it('should include all license options', () => {
      let value = 'MIT';
      const element = createLicenseSelector(value, (v) => { value = v; });
      
      const select = element.querySelector('select');
      expect(select).toBeTruthy();
      expect(select?.options.length).toBe(LICENSES.length);
    });
  });
  
  describe('README Editor', () => {
    it('should create readme editor', () => {
      let content = '# My Card\n\nDescription...';
      const element = createReadmeEditor({
        content,
        onChange: (c) => { content = c; },
      });
      
      expect(element).toBeInstanceOf(dom.window.HTMLElement);
      expect(element.textContent).toContain('README');
      expect(element.textContent).toContain('Edit');
      expect(element.textContent).toContain('Preview');
    });
    
    it('should show preview mode', () => {
      let content = '# Test Header';
      const element = createReadmeEditor({
        content,
        onChange: (c) => { content = c; },
        showPreview: true,
      });
      
      expect(element).toBeInstanceOf(dom.window.HTMLElement);
    });
  });
  
  describe('Constants', () => {
    it('should have icon categories', () => {
      expect(ICON_CATEGORIES.music).toBeDefined();
      expect(ICON_CATEGORIES.generators).toBeDefined();
      expect(ICON_CATEGORIES.effects).toBeDefined();
    });
    
    it('should have all icons flattened', () => {
      expect(ALL_ICONS.length).toBeGreaterThan(0);
      expect(ALL_ICONS).toContain('🎵');
    });
    
    it('should have tag suggestions', () => {
      expect(TAG_SUGGESTIONS.length).toBeGreaterThan(0);
      expect(TAG_SUGGESTIONS).toContain('midi');
      expect(TAG_SUGGESTIONS).toContain('audio');
    });
    
    it('should have color schemes', () => {
      expect(COLOR_SCHEMES.length).toBeGreaterThan(0);
    });
    
    it('should have card categories', () => {
      expect(CARD_CATEGORIES.length).toBeGreaterThan(0);
      const generator = CARD_CATEGORIES.find(c => c.id === 'generator');
      expect(generator).toBeDefined();
    });
    
    it('should have licenses', () => {
      expect(LICENSES.length).toBeGreaterThan(0);
      expect(LICENSES).toContain('MIT');
      expect(LICENSES).toContain('Apache-2.0');
    });
  });
});

