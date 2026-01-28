/**
 * @fileoverview Tests for Freesound API Integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  searchFreesound,
  generateAttribution,
  isCC0,
  formatDuration,
  formatFileSize,
  detectKey,
  detectTempo,
  isDrumSound,
  isMusicalSound,
  PRESET_QUERIES,
  type FreesoundSound,
  type FreesoundSearchQuery,
} from './freesound-api.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('freesound-api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSound: FreesoundSound = {
    id: 12345,
    name: 'Test Kick Drum',
    tags: ['kick', 'drum', 'single-note', '120bpm'],
    description: 'A kick drum sample in C major',
    username: 'testuser',
    license: 'Creative Commons 0',
    duration: 1.5,
    samplerate: 48000,
    channels: 2,
    filesize: 144000,
    bitdepth: 16,
    bitrate: 320,
    type: 'wav',
    previews: {
      'preview-lq-mp3': 'https://example.com/preview-lq.mp3',
      'preview-lq-ogg': 'https://example.com/preview-lq.ogg',
      'preview-hq-mp3': 'https://example.com/preview-hq.mp3',
      'preview-hq-ogg': 'https://example.com/preview-hq.ogg',
    },
    url: 'https://freesound.org/people/testuser/sounds/12345/',
  };

  describe('searchFreesound', () => {
    it('should search Freesound with basic query', async () => {
      const mockResponse = {
        count: 1,
        next: null,
        previous: null,
        results: [mockSound],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const query: FreesoundSearchQuery = {
        query: 'kick drum',
        cc0Only: true,
      };

      const result = await searchFreesound(query);

      expect(result.count).toBe(1);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].id).toBe(12345);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('query=kick+drum')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('filter=license%3A%22Creative+Commons+0%22')
      );
    });

    it('should apply duration filters', async () => {
      const mockResponse = {
        count: 0,
        next: null,
        previous: null,
        results: [],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const query: FreesoundSearchQuery = {
        query: 'test',
        minDuration: 1.0,
        maxDuration: 5.0,
      };

      await searchFreesound(query);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('duration')
      );
    });

    it('should apply tag filters', async () => {
      const mockResponse = {
        count: 0,
        next: null,
        previous: null,
        results: [],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const query: FreesoundSearchQuery = {
        query: 'test',
        tags: ['drum', 'loop'],
      };

      await searchFreesound(query);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('tag%3Adrum')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('tag%3Aloop')
      );
    });

    it('should handle pagination', async () => {
      const mockResponse = {
        count: 100,
        next: 'https://example.com/next',
        previous: null,
        results: [],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const query: FreesoundSearchQuery = {
        query: 'test',
        page: 2,
        pageSize: 20,
      };

      const result = await searchFreesound(query);

      expect(result.count).toBe(100);
      expect(result.next).toBe('https://example.com/next');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page_size=20')
      );
    });

    it('should handle API errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const query: FreesoundSearchQuery = {
        query: 'test',
      };

      await expect(searchFreesound(query)).rejects.toThrow('Freesound API error');
    });
  });

  describe('utility functions', () => {
    it('should generate attribution text', () => {
      const attribution = generateAttribution(mockSound);

      expect(attribution).toContain(mockSound.name);
      expect(attribution).toContain(mockSound.username);
      expect(attribution).toContain(mockSound.license);
      expect(attribution).toContain(mockSound.url);
    });

    it('should detect CC0 license', () => {
      expect(isCC0(mockSound)).toBe(true);

      const nonCC0Sound = { ...mockSound, license: 'Attribution' };
      expect(isCC0(nonCC0Sound)).toBe(false);
    });

    it('should format duration', () => {
      expect(formatDuration(65)).toBe('1:05');
      expect(formatDuration(125)).toBe('2:05');
      expect(formatDuration(3665)).toBe('61:05');
    });

    it('should format file size', () => {
      expect(formatFileSize(500)).toBe('500 B');
      expect(formatFileSize(2048)).toBe('2.0 KB');
      expect(formatFileSize(1048576)).toBe('1.0 MB');
      expect(formatFileSize(2097152)).toBe('2.0 MB');
    });

    it('should detect key from tags', () => {
      const sound = {
        ...mockSound,
        tags: ['Cmaj', 'melody'],
        description: '',
      };

      const key = detectKey(sound);
      expect(key).toBeTruthy();
      expect(key).toMatch(/C/);
    });

    it('should detect key from description', () => {
      const sound = {
        ...mockSound,
        description: 'A sample in F# minor',
      };

      const key = detectKey(sound);
      expect(key).toBeTruthy();
    });

    it('should return null if key not detected', () => {
      const sound = {
        ...mockSound,
        tags: [],
        description: 'No key information',
      };

      const key = detectKey(sound);
      expect(key).toBeNull();
    });

    it('should detect tempo from tags', () => {
      const sound = {
        ...mockSound,
        tags: ['120bpm'],
      };

      const tempo = detectTempo(sound);
      expect(tempo).toBe(120);
    });

    it('should detect tempo from description', () => {
      const sound = {
        ...mockSound,
        description: 'Loop at 128 BPM',
      };

      const tempo = detectTempo(sound);
      expect(tempo).toBe(128);
    });

    it('should return null if tempo not detected', () => {
      const sound = {
        ...mockSound,
        tags: [],
        description: 'No tempo information',
      };

      const tempo = detectTempo(sound);
      expect(tempo).toBeNull();
    });

    it('should detect drum sounds', () => {
      const kickSound = {
        ...mockSound,
        name: 'Kick Drum',
        tags: ['drum'],
      };

      expect(isDrumSound(kickSound)).toBe(true);

      const pianoSound = {
        ...mockSound,
        name: 'Piano C4',
        tags: ['piano'],
      };

      expect(isDrumSound(pianoSound)).toBe(false);
    });

    it('should detect musical sounds', () => {
      const pianoSound = {
        ...mockSound,
        name: 'Piano C4',
        tags: ['piano', 'note'],
      };

      expect(isMusicalSound(pianoSound)).toBe(true);

      const noiseSound = {
        ...mockSound,
        name: 'White Noise',
        tags: ['noise', 'fx'],
      };

      expect(isMusicalSound(noiseSound)).toBe(false);
    });
  });

  describe('preset queries', () => {
    it('should have kick drum preset', () => {
      expect(PRESET_QUERIES.kick).toBeDefined();
      expect(PRESET_QUERIES.kick.query).toContain('kick');
      expect(PRESET_QUERIES.kick.cc0Only).toBe(true);
    });

    it('should have snare drum preset', () => {
      expect(PRESET_QUERIES.snare).toBeDefined();
      expect(PRESET_QUERIES.snare.query).toContain('snare');
    });

    it('should have hi-hat preset', () => {
      expect(PRESET_QUERIES.hihat).toBeDefined();
      expect(PRESET_QUERIES.hihat.minDuration).toBeLessThan(1);
    });

    it('should have percussion loop preset', () => {
      expect(PRESET_QUERIES.percussionLoop).toBeDefined();
      expect(PRESET_QUERIES.percussionLoop.tags).toContain('loop');
    });

    it('should have bass preset', () => {
      expect(PRESET_QUERIES.bass).toBeDefined();
    });

    it('should have synth pad preset', () => {
      expect(PRESET_QUERIES.synthPad).toBeDefined();
      expect(PRESET_QUERIES.synthPad.minDuration).toBeGreaterThan(0.5);
    });

    it('should have piano preset', () => {
      expect(PRESET_QUERIES.piano).toBeDefined();
    });

    it('should have guitar preset', () => {
      expect(PRESET_QUERIES.guitar).toBeDefined();
    });

    it('should have ambient preset', () => {
      expect(PRESET_QUERIES.ambient).toBeDefined();
      expect(PRESET_QUERIES.ambient.minDuration).toBeGreaterThan(4);
    });

    it('should have vocal preset', () => {
      expect(PRESET_QUERIES.vocal).toBeDefined();
    });
  });
});
