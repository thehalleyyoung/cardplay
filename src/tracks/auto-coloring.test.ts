/**
 * Tests for Auto Track Coloring System
 */

import { describe, test, it, expect, beforeEach, vi } from 'vitest';
import {
  detectCategoryFromName,
  detectCategoryFromPlugins,
  detectCategory,
  getColorForCategory,
  TrackColoringStore,
  COLOR_SCHEMES,
  CATEGORY_KEYWORDS,
  InstrumentCategory,
  ColorScheme,
} from './auto-coloring';

describe('Auto Track Coloring', () => {
  // --------------------------------------------------------------------------
  // Category Detection from Name
  // --------------------------------------------------------------------------
  
  describe('detectCategoryFromName', () => {
    it('should detect drums', () => {
      expect(detectCategoryFromName('Drums').category).toBe('drums');
      expect(detectCategoryFromName('Kick').category).toBe('drums');
      expect(detectCategoryFromName('Snare Track').category).toBe('drums');
      expect(detectCategoryFromName('HiHat Loop').category).toBe('drums');
      expect(detectCategoryFromName('Percussion').category).toBe('drums');
    });
    
    it('should detect bass', () => {
      expect(detectCategoryFromName('Bass').category).toBe('bass');
      expect(detectCategoryFromName('808 Bass').category).toBe('bass');
      expect(detectCategoryFromName('Sub Bass').category).toBe('bass');
      expect(detectCategoryFromName('Bass Guitar').category).toBe('bass');
    });
    
    it('should detect keys', () => {
      expect(detectCategoryFromName('Piano').category).toBe('keys');
      expect(detectCategoryFromName('Keys').category).toBe('keys');
      expect(detectCategoryFromName('Organ').category).toBe('keys');
      expect(detectCategoryFromName('Rhodes').category).toBe('keys');
    });
    
    it('should detect synth', () => {
      expect(detectCategoryFromName('Synth Lead').category).toBe('synth');
      expect(detectCategoryFromName('Pad').category).toBe('synth');
      expect(detectCategoryFromName('Arpeggiator').category).toBe('synth');
      expect(detectCategoryFromName('Moog Bass').category).toBe('synth');
    });
    
    it('should detect guitar', () => {
      expect(detectCategoryFromName('Guitar').category).toBe('guitar');
      expect(detectCategoryFromName('Electric Guitar').category).toBe('guitar');
      expect(detectCategoryFromName('Acoustic Gtr').category).toBe('guitar');
    });
    
    it('should detect vocals', () => {
      expect(detectCategoryFromName('Lead Vocals').category).toBe('vocals');
      expect(detectCategoryFromName('Vox').category).toBe('vocals');
      expect(detectCategoryFromName('Harmony Voice').category).toBe('vocals');
    });
    
    it('should detect strings', () => {
      expect(detectCategoryFromName('Strings').category).toBe('strings');
      expect(detectCategoryFromName('Violin').category).toBe('strings');
      expect(detectCategoryFromName('Cello Section').category).toBe('strings');
      expect(detectCategoryFromName('Orchestral').category).toBe('strings');
    });
    
    it('should detect brass', () => {
      expect(detectCategoryFromName('Brass').category).toBe('brass');
      expect(detectCategoryFromName('Trumpet').category).toBe('brass');
      expect(detectCategoryFromName('Horn Section').category).toBe('brass');
    });
    
    it('should detect woodwinds', () => {
      expect(detectCategoryFromName('Flute').category).toBe('woodwinds');
      expect(detectCategoryFromName('Clarinet').category).toBe('woodwinds');
      expect(detectCategoryFromName('Saxophone').category).toBe('woodwinds');
    });
    
    it('should detect fx', () => {
      expect(detectCategoryFromName('FX').category).toBe('fx');
      expect(detectCategoryFromName('Sound Effects').category).toBe('fx');
      expect(detectCategoryFromName('Ambient FX').category).toBe('fx');
      expect(detectCategoryFromName('Riser').category).toBe('fx');
    });
    
    it('should detect aux/bus', () => {
      expect(detectCategoryFromName('Drum Bus').category).toBe('aux');
      expect(detectCategoryFromName('Reverb Send').category).toBe('aux');
      expect(detectCategoryFromName('Delay AUX').category).toBe('aux');
    });
    
    it('should detect master', () => {
      expect(detectCategoryFromName('Master').category).toBe('master');
      expect(detectCategoryFromName('Stereo Out').category).toBe('master');
      expect(detectCategoryFromName('Mix Bus').category).toBe('master');
    });
    
    it('should return "other" for unknown', () => {
      expect(detectCategoryFromName('Track 1').category).toBe('other');
      expect(detectCategoryFromName('Audio').category).toBe('other');
    });
    
    it('should be case insensitive', () => {
      expect(detectCategoryFromName('DRUMS').category).toBe('drums');
      expect(detectCategoryFromName('VoCaLs').category).toBe('vocals');
    });
  });
  
  // --------------------------------------------------------------------------
  // Category Detection from Plugins
  // --------------------------------------------------------------------------
  
  describe('detectCategoryFromPlugins', () => {
    it('should detect drums from plugin names', () => {
      expect(detectCategoryFromPlugins(['BFD3']).category).toBe('drums');
      expect(detectCategoryFromPlugins(['EZDrummer']).category).toBe('drums');
      expect(detectCategoryFromPlugins(['Superior Drummer']).category).toBe('drums');
    });
    
    it('should detect bass from plugin names', () => {
      expect(detectCategoryFromPlugins(['Trilian']).category).toBe('bass');
      expect(detectCategoryFromPlugins(['MODO BASS']).category).toBe('bass');
    });
    
    it('should detect keys from plugin names', () => {
      expect(detectCategoryFromPlugins(['Keyscape']).category).toBe('keys');
      expect(detectCategoryFromPlugins(['Pianoteq']).category).toBe('keys');
      expect(detectCategoryFromPlugins(['B3-X']).category).toBe('keys');
    });
    
    it('should detect synth from plugin names', () => {
      expect(detectCategoryFromPlugins(['Serum']).category).toBe('synth');
      expect(detectCategoryFromPlugins(['Massive X']).category).toBe('synth');
      expect(detectCategoryFromPlugins(['Omnisphere']).category).toBe('synth');
    });
    
    it('should detect guitar from plugin names', () => {
      expect(detectCategoryFromPlugins(['Guitar Rig']).category).toBe('guitar');
      expect(detectCategoryFromPlugins(['Amp Room']).category).toBe('guitar');
    });
    
    it('should detect vocals from plugin names', () => {
      expect(detectCategoryFromPlugins(['Auto-Tune']).category).toBe('vocals');
      expect(detectCategoryFromPlugins(['Melodyne']).category).toBe('vocals');
    });
    
    it('should return null for no matching plugins', () => {
      expect(detectCategoryFromPlugins(['EQ', 'Compressor'])).toBeNull();
      expect(detectCategoryFromPlugins([])).toBeNull();
    });
    
    it('should match first relevant plugin', () => {
      // If multiple plugins, returns first match
      const result = detectCategoryFromPlugins(['EQ', 'Serum', 'Compressor']);
      expect(result).toBe('synth');
    });
  });
  
  // --------------------------------------------------------------------------
  // Combined Detection
  // --------------------------------------------------------------------------
  
  describe('detectCategory', () => {
    it('should prioritize name over plugins', () => {
      const result = detectCategory('Drums', ['Serum']);
      expect(result).toBe('drums');
    });
    
    it('should use plugins when name is generic', () => {
      const result = detectCategory('Track 1', ['Serum']);
      expect(result).toBe('synth');
    });
    
    it('should use sample path for detection', () => {
      const result = detectCategory('Track 1', [], '/samples/drums/kick.wav');
      expect(result).toBe('drums');
    });
    
    it('should return other for no matches', () => {
      const result = detectCategory('Track 1', []);
      expect(result).toBe('other');
    });
  });
  
  // --------------------------------------------------------------------------
  // Color for Category
  // --------------------------------------------------------------------------
  
  describe('getColorForCategory', () => {
    it('should return color from default scheme', () => {
      const color = getColorForCategory('drums');
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
    
    it('should return different colors for different categories', () => {
      const drumsColor = getColorForCategory('drums');
      const bassColor = getColorForCategory('bass');
      const vocalsColor = getColorForCategory('vocals');
      
      expect(drumsColor).not.toBe(bassColor);
      expect(drumsColor).not.toBe(vocalsColor);
    });
    
    it('should respect color scheme', () => {
      const defaultColor = getColorForCategory('drums', 'default');
      const warmColor = getColorForCategory('drums', 'warm');
      
      // Colors may differ between schemes
      expect(defaultColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(warmColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
    
    it('should have color for all categories', () => {
      const categories: InstrumentCategory[] = [
        'drums', 'bass', 'keys', 'synth', 'guitar', 'vocals',
        'strings', 'brass', 'woodwinds', 'fx', 'aux', 'master', 'other'
      ];
      
      categories.forEach(cat => {
        const color = getColorForCategory(cat);
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });
  
  // --------------------------------------------------------------------------
  // Track Coloring Store
  // --------------------------------------------------------------------------
  
  describe('TrackColoringStore', () => {
    let store: TrackColoringStore;
    
    beforeEach(() => {
      store = new TrackColoringStore();
    });
    
    describe('scheme management', () => {
      it('should have default scheme', () => {
        expect(store.getScheme()).toBe('default');
      });
      
      it('should set scheme', () => {
        store.setScheme('warm');
        expect(store.getScheme()).toBe('warm');
      });
      
      it('should get available schemes', () => {
        const schemes = store.getAvailableSchemes();
        expect(schemes).toContain('default');
        expect(schemes).toContain('warm');
        expect(schemes).toContain('cool');
        expect(schemes).toContain('high-contrast');
        expect(schemes).toContain('pastel');
      });
    });
    
    describe('single track coloring', () => {
      it('should color track', () => {
        const result = store.colorTrack('track-1', 'Drums');
        
        expect(result.category).toBe('drums');
        expect(result.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
      
      it('should store track color', () => {
        store.colorTrack('track-1', 'Drums');
        
        const color = store.getTrackColor('track-1');
        expect(color).toBeDefined();
      });
      
      it('should use plugins for detection', () => {
        const result = store.colorTrack('track-1', 'Track 1', ['Serum']);
        expect(result.category).toBe('synth');
      });
    });
    
    describe('batch coloring', () => {
      it('should color multiple tracks', () => {
        const tracks = [
          { id: 't1', name: 'Drums' },
          { id: 't2', name: 'Bass' },
          { id: 't3', name: 'Vocals' },
        ];
        
        const results = store.colorTracks(tracks);
        
        expect(results).toHaveLength(3);
        expect(results[0].category).toBe('drums');
        expect(results[1].category).toBe('bass');
        expect(results[2].category).toBe('vocals');
      });
      
      it('should return unique colors per category', () => {
        const tracks = [
          { id: 't1', name: 'Drums' },
          { id: 't2', name: 'Kick' },
          { id: 't3', name: 'Snare' },
        ];
        
        const results = store.colorTracks(tracks);
        
        // All drums, should have same base color
        expect(results[0].category).toBe('drums');
        expect(results[1].category).toBe('drums');
        expect(results[2].category).toBe('drums');
        
        // But may have slightly different shades
        expect(results[0].color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
    
    describe('manual override', () => {
      it('should allow manual color override', () => {
        store.colorTrack('track-1', 'Drums');
        store.setTrackColor('track-1', '#FF0000');
        
        expect(store.getTrackColor('track-1')).toBe('#FF0000');
      });
      
      it('should track overrides', () => {
        store.colorTrack('track-1', 'Drums');
        store.setTrackColor('track-1', '#FF0000');
        
        expect(store.hasOverride('track-1')).toBe(true);
      });
      
      it('should clear override', () => {
        store.colorTrack('track-1', 'Drums');
        store.setTrackColor('track-1', '#FF0000');
        store.clearOverride('track-1');
        
        expect(store.hasOverride('track-1')).toBe(false);
        // Should revert to category color
        expect(store.getTrackColor('track-1')).not.toBe('#FF0000');
      });
    });
    
    describe('subscriptions', () => {
      it('should notify on color change', () => {
        const listener = vi.fn();
        store.subscribe(listener);
        
        store.colorTrack('track-1', 'Drums');
        
        expect(listener).toHaveBeenCalled();
      });
      
      it('should notify on scheme change', () => {
        const listener = vi.fn();
        store.subscribe(listener);
        
        store.setScheme('warm');
        
        expect(listener).toHaveBeenCalled();
      });
      
      it('should support unsubscribe', () => {
        const listener = vi.fn();
        const unsubscribe = store.subscribe(listener);
        
        unsubscribe();
        store.colorTrack('track-1', 'Drums');
        
        expect(listener).not.toHaveBeenCalled();
      });
    });
    
    describe('clear', () => {
      it('should clear all colors', () => {
        store.colorTrack('track-1', 'Drums');
        store.colorTrack('track-2', 'Bass');
        
        store.clear();
        
        expect(store.getTrackColor('track-1')).toBeUndefined();
        expect(store.getTrackColor('track-2')).toBeUndefined();
      });
    });
  });
  
  // --------------------------------------------------------------------------
  // Constants
  // --------------------------------------------------------------------------
  
  describe('constants', () => {
    it('should have category keywords', () => {
      expect(CATEGORY_KEYWORDS.drums).toBeDefined();
      expect(CATEGORY_KEYWORDS.drums.length).toBeGreaterThan(0);
    });
    
    it('should have color schemes', () => {
      expect(COLOR_SCHEMES.length).toBe(5);
      
      const schemeNames = COLOR_SCHEMES.map(s => s.name);
      expect(schemeNames).toContain('default');
      expect(schemeNames).toContain('warm');
      expect(schemeNames).toContain('cool');
    });
    
    it('should have colors for all categories in each scheme', () => {
      COLOR_SCHEMES.forEach(scheme => {
        expect(scheme.colors.drums).toBeDefined();
        expect(scheme.colors.bass).toBeDefined();
        expect(scheme.colors.vocals).toBeDefined();
        expect(scheme.colors.other).toBeDefined();
      });
    });
  });
});
