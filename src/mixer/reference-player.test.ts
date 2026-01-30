/**
 * Tests for Reference Track Player System
 */

import { describe, test, it, expect, beforeEach, vi } from 'vitest';
import {
  generateId,
  extractFileName,
  formatDuration,
  calculateRMSLevel,
  matchLevels,
  applyGain,
  createSplitOutput,
  validateReferenceFile,
  ReferencePlayerStore,
  REFERENCE_CATEGORIES,
  DEFAULT_PLAYBACK_STATE,
  DEFAULT_COMPARE_SETTINGS,
} from './reference-player';

describe('Reference Player', () => {
  // --------------------------------------------------------------------------
  // Utility Functions
  // --------------------------------------------------------------------------
  
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });
    
    it('should start with ref_ prefix', () => {
      const id = generateId();
      expect(id).toMatch(/^ref_/);
    });
  });
  
  describe('extractFileName', () => {
    it('should extract file name from path', () => {
      expect(extractFileName('/path/to/song.wav')).toBe('song');
    });
    
    it('should handle Windows paths', () => {
      expect(extractFileName('C:\\Music\\reference.mp3')).toBe('reference');
    });
    
    it('should handle files with multiple dots', () => {
      expect(extractFileName('/path/my.song.v2.wav')).toBe('my.song.v2');
    });
    
    it('should handle just a filename', () => {
      expect(extractFileName('track.flac')).toBe('track');
    });
  });
  
  describe('formatDuration', () => {
    it('should format seconds as MM:SS', () => {
      expect(formatDuration(0)).toBe('0:00');
      expect(formatDuration(30)).toBe('0:30');
      expect(formatDuration(65)).toBe('1:05');
      expect(formatDuration(180)).toBe('3:00');
    });
    
    it('should handle long durations', () => {
      expect(formatDuration(600)).toBe('10:00');
      expect(formatDuration(3599)).toBe('59:59');
    });
  });
  
  describe('calculateRMSLevel', () => {
    it('should calculate RMS level', () => {
      const samples = new Float32Array(1000).fill(0.5);
      const level = calculateRMSLevel(samples);
      expect(level).toBeCloseTo(-6.02, 1);
    });
    
    it('should return -Infinity for empty array', () => {
      expect(calculateRMSLevel(new Float32Array(0))).toBe(-Infinity);
    });
    
    it('should return -Infinity for silence', () => {
      expect(calculateRMSLevel(new Float32Array(100).fill(0))).toBe(-Infinity);
    });
  });
  
  describe('matchLevels', () => {
    it('should calculate level offset', () => {
      const reference = new Float32Array(100).fill(0.5);
      const mix = new Float32Array(100).fill(0.25);
      
      const result = matchLevels(reference, mix);
      
      expect(result.offset).toBeCloseTo(-6, 1); // Mix is ~6dB quieter
    });
    
    it('should return zero offset for matching levels', () => {
      const samples = new Float32Array(100).fill(0.5);
      const result = matchLevels(samples, samples);
      expect(result.offset).toBeCloseTo(0, 5);
    });
  });
  
  describe('applyGain', () => {
    it('should apply gain to samples', () => {
      const samples = new Float32Array([0.5, 0.5, 0.5]);
      const result = applyGain(samples, 6); // +6dB ≈ 2x
      
      expect(result[0]).toBeCloseTo(1, 1);
    });
    
    it('should attenuate with negative gain', () => {
      const samples = new Float32Array([1, 1, 1]);
      const result = applyGain(samples, -6); // -6dB ≈ 0.5x
      
      expect(result[0]).toBeCloseTo(0.5, 1);
    });
    
    it('should not modify original samples', () => {
      const samples = new Float32Array([0.5]);
      applyGain(samples, 6);
      expect(samples[0]).toBe(0.5);
    });
  });
  
  describe('createSplitOutput', () => {
    it('should create split output', () => {
      const reference = new Float32Array([1, 1, 1, 1, 1, 1, 1, 1]);
      const mix = new Float32Array([0, 0, 0, 0, 0, 0, 0, 0]);
      
      const result = createSplitOutput(reference, mix, 0.5, 2);
      
      // First half should be reference (1s)
      expect(result[0]).toBe(1);
      expect(result[1]).toBe(1);
      // Second half should be mix (0s)
      expect(result[6]).toBe(0);
      expect(result[7]).toBe(0);
    });
    
    it('should handle 0 split position (all mix)', () => {
      const reference = new Float32Array([1, 1, 1, 1]);
      const mix = new Float32Array([0, 0, 0, 0]);
      
      const result = createSplitOutput(reference, mix, 0, 2);
      expect(result.every(s => s === 0)).toBe(true);
    });
    
    it('should handle 1 split position (all reference)', () => {
      const reference = new Float32Array([1, 1, 1, 1]);
      const mix = new Float32Array([0, 0, 0, 0]);
      
      const result = createSplitOutput(reference, mix, 1, 2);
      expect(result.every(s => s === 1)).toBe(true);
    });
  });
  
  describe('validateReferenceFile', () => {
    it('should accept supported formats', () => {
      expect(validateReferenceFile('test.wav').valid).toBe(true);
      expect(validateReferenceFile('test.aiff').valid).toBe(true);
      expect(validateReferenceFile('test.flac').valid).toBe(true);
      expect(validateReferenceFile('test.mp3').valid).toBe(true);
      expect(validateReferenceFile('test.ogg').valid).toBe(true);
    });
    
    it('should reject unsupported formats', () => {
      const result = validateReferenceFile('test.txt');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('.txt');
    });
  });
  
  // --------------------------------------------------------------------------
  // Reference Player Store
  // --------------------------------------------------------------------------
  
  describe('ReferencePlayerStore', () => {
    let store: ReferencePlayerStore;
    
    beforeEach(() => {
      store = new ReferencePlayerStore();
    });
    
    describe('track management', () => {
      it('should import track', () => {
        const track = store.importTrack('/path/to/song.wav');
        
        expect(track.id).toBeDefined();
        expect(track.name).toBe('song');
        expect(track.filePath).toBe('/path/to/song.wav');
      });
      
      it('should import track with options', () => {
        const track = store.importTrack('/path/to/song.wav', {
          duration: 180,
          sampleRate: 48000,
          channels: 2,
        });
        
        expect(track.duration).toBe(180);
        expect(track.sampleRate).toBe(48000);
      });
      
      it('should reject unsupported format', () => {
        expect(() => store.importTrack('/path/to/file.txt')).toThrow();
      });
      
      it('should get all tracks', () => {
        store.importTrack('/path/song1.wav');
        store.importTrack('/path/song2.wav');
        
        expect(store.getTracks()).toHaveLength(2);
      });
      
      it('should get track by ID', () => {
        const track = store.importTrack('/path/song.wav');
        const retrieved = store.getTrack(track.id);
        
        expect(retrieved).toEqual(track);
      });
      
      it('should remove track', () => {
        const track = store.importTrack('/path/song.wav');
        expect(store.removeTrack(track.id)).toBe(true);
        expect(store.getTracks()).toHaveLength(0);
      });
    });
    
    describe('active track', () => {
      it('should set active track', () => {
        const track = store.importTrack('/path/song.wav', { duration: 180 });
        store.setActiveTrack(track.id);
        
        expect(store.getActiveTrack()).toEqual(track);
      });
      
      it('should clear active track', () => {
        const track = store.importTrack('/path/song.wav');
        store.setActiveTrack(track.id);
        store.setActiveTrack(null);
        
        expect(store.getActiveTrack()).toBeNull();
      });
      
      it('should throw for invalid track ID', () => {
        expect(() => store.setActiveTrack('invalid')).toThrow();
      });
      
      it('should stop playback when changing active track', () => {
        const track = store.importTrack('/path/song.wav');
        store.setActiveTrack(track.id);
        store.play();
        
        const track2 = store.importTrack('/path/song2.wav');
        store.setActiveTrack(track2.id);
        
        expect(store.getPlaybackState().isPlaying).toBe(false);
      });
    });
    
    describe('playback control', () => {
      beforeEach(() => {
        const track = store.importTrack('/path/song.wav', { duration: 180 });
        store.setActiveTrack(track.id);
      });
      
      it('should play', () => {
        store.play();
        expect(store.getPlaybackState().isPlaying).toBe(true);
      });
      
      it('should pause', () => {
        store.play();
        store.pause();
        expect(store.getPlaybackState().isPlaying).toBe(false);
      });
      
      it('should stop', () => {
        store.play();
        store.seek(60);
        store.stop();
        
        const state = store.getPlaybackState();
        expect(state.isPlaying).toBe(false);
        expect(state.currentTime).toBe(0);
      });
      
      it('should toggle playback', () => {
        store.togglePlayback();
        expect(store.getPlaybackState().isPlaying).toBe(true);
        
        store.togglePlayback();
        expect(store.getPlaybackState().isPlaying).toBe(false);
      });
      
      it('should seek', () => {
        store.seek(60);
        expect(store.getPlaybackState().currentTime).toBe(60);
      });
      
      it('should clamp seek to valid range', () => {
        store.seek(-10);
        expect(store.getPlaybackState().currentTime).toBe(0);
        
        store.seek(1000);
        expect(store.getPlaybackState().currentTime).toBe(180);
      });
      
      it('should set volume', () => {
        store.setVolume(0.5);
        expect(store.getPlaybackState().volume).toBe(0.5);
      });
      
      it('should clamp volume', () => {
        store.setVolume(2);
        expect(store.getPlaybackState().volume).toBe(1);
        
        store.setVolume(-1);
        expect(store.getPlaybackState().volume).toBe(0);
      });
      
      it('should toggle mute', () => {
        store.toggleMute();
        expect(store.getPlaybackState().muted).toBe(true);
        
        store.toggleMute();
        expect(store.getPlaybackState().muted).toBe(false);
      });
      
      it('should set loop', () => {
        store.setLoop(true, 10, 30);
        
        const state = store.getPlaybackState();
        expect(state.loop).toBe(true);
        expect(state.loopStart).toBe(10);
        expect(state.loopEnd).toBe(30);
      });
    });
    
    describe('comparison control', () => {
      it('should set compare mode', () => {
        store.setCompareMode('reference');
        expect(store.getCompareSettings().mode).toBe('reference');
      });
      
      it('should set split position', () => {
        store.setSplitPosition(0.7);
        expect(store.getCompareSettings().splitPosition).toBe(0.7);
      });
      
      it('should clamp split position', () => {
        store.setSplitPosition(1.5);
        expect(store.getCompareSettings().splitPosition).toBe(1);
      });
      
      it('should toggle auto match level', () => {
        const initial = store.getCompareSettings().autoMatchLevel;
        store.toggleAutoMatchLevel();
        expect(store.getCompareSettings().autoMatchLevel).toBe(!initial);
      });
      
      it('should set reference gain offset', () => {
        store.setReferenceGainOffset(-3);
        expect(store.getCompareSettings().referenceGainOffset).toBe(-3);
      });
      
      it('should toggle sync to mix position', () => {
        store.toggleSyncToMixPosition();
        expect(store.getCompareSettings().syncToMixPosition).toBe(true);
      });
    });
    
    describe('library management', () => {
      it('should add track to library', () => {
        const track = store.importTrack('/path/song.wav');
        const entry = store.addToLibrary(track.id, 'Pop', 'Great reference');
        
        expect(entry.track).toEqual(track);
        expect(entry.category).toBe('Pop');
        expect(entry.notes).toBe('Great reference');
      });
      
      it('should throw for non-existent track', () => {
        expect(() => store.addToLibrary('invalid')).toThrow();
      });
      
      it('should update library entry', () => {
        const track = store.importTrack('/path/song.wav');
        store.addToLibrary(track.id, 'Pop');
        
        store.updateLibraryEntry(track.id, { category: 'Rock' });
        
        const library = store.getLibrary();
        expect(library[0].category).toBe('Rock');
      });
      
      it('should toggle favorite', () => {
        const track = store.importTrack('/path/song.wav');
        store.addToLibrary(track.id);
        
        store.toggleFavorite(track.id);
        expect(store.getFavorites()).toHaveLength(1);
        
        store.toggleFavorite(track.id);
        expect(store.getFavorites()).toHaveLength(0);
      });
      
      it('should get library by category', () => {
        const track1 = store.importTrack('/path/song1.wav');
        const track2 = store.importTrack('/path/song2.wav');
        
        store.addToLibrary(track1.id, 'Pop');
        store.addToLibrary(track2.id, 'Rock');
        
        expect(store.getLibraryByCategory('Pop')).toHaveLength(1);
        expect(store.getLibraryByCategory('Rock')).toHaveLength(1);
      });
    });
    
    describe('subscriptions', () => {
      it('should notify on changes', () => {
        const listener = vi.fn();
        store.subscribe(listener);
        
        store.importTrack('/path/song.wav');
        expect(listener).toHaveBeenCalled();
      });
      
      it('should support unsubscribe', () => {
        const listener = vi.fn();
        const unsubscribe = store.subscribe(listener);
        
        unsubscribe();
        store.importTrack('/path/song.wav');
        
        expect(listener).not.toHaveBeenCalled();
      });
    });
    
    describe('clear', () => {
      it('should reset all state', () => {
        const track = store.importTrack('/path/song.wav');
        store.setActiveTrack(track.id);
        store.play();
        store.setCompareMode('reference');
        
        store.clear();
        
        expect(store.getTracks()).toHaveLength(0);
        expect(store.getActiveTrack()).toBeNull();
        expect(store.getPlaybackState().isPlaying).toBe(false);
        expect(store.getCompareSettings().mode).toBe('off');
      });
    });
  });
  
  // --------------------------------------------------------------------------
  // Constants
  // --------------------------------------------------------------------------
  
  describe('constants', () => {
    it('should have reference categories', () => {
      expect(REFERENCE_CATEGORIES).toContain('Pop');
      expect(REFERENCE_CATEGORIES).toContain('Rock');
      expect(REFERENCE_CATEGORIES).toContain('Electronic');
    });
    
    it('should have default playback state', () => {
      expect(DEFAULT_PLAYBACK_STATE.isPlaying).toBe(false);
      expect(DEFAULT_PLAYBACK_STATE.volume).toBe(1);
    });
    
    it('should have default compare settings', () => {
      expect(DEFAULT_COMPARE_SETTINGS.mode).toBe('off');
      expect(DEFAULT_COMPARE_SETTINGS.autoMatchLevel).toBe(true);
    });
  });
});
