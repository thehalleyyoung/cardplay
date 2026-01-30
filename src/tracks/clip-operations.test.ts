/**
 * Tests for Clip Operations: Consolidation, Freeze, and Bounce
 * Tests M261-M263 implementations
 */

import { describe, test, expect, beforeEach } from 'vitest';
import {
  Clip,
  Track,
  TimeRange,
  ConsolidateOptions,
  FreezeOptions,
  BounceOptions,
  calculateClipsTimeRange,
  clipsOverlap,
  sortClipsByStart,
  mergeOverlappingRegions,
  consolidateClips,
  consolidateClipsOnTrack,
  freezeTrack,
  unfreezeTrack,
  bounceInPlace,
  bounceSelectedClips,
  freezeTracks,
  unfreezeTracks,
  ClipOperationsStore,
} from './clip-operations';

// --------------------------------------------------------------------------
// Test Fixtures
// --------------------------------------------------------------------------

function createTestClip(
  id: string,
  trackId: string,
  start: number,
  end: number,
  overrides: Partial<Clip> = {}
): Clip {
  return {
    id,
    trackId,
    name: `Clip ${id}`,
    start,
    end,
    offset: 0,
    gain: 1.0,
    fadeIn: 0,
    fadeOut: 0,
    muted: false,
    sourceType: 'audio',
    ...overrides,
  };
}

function createTestTrack(
  id: string,
  clips: Clip[] = [],
  plugins: number = 0
): Track {
  return {
    id,
    name: `Track ${id}`,
    clips,
    plugins: Array.from({ length: plugins }, (_, i) => ({
      pluginId: `plugin_${i}`,
      enabled: true,
      parameters: { param1: 0.5 },
    })),
    frozen: false,
    volume: 1.0,
    pan: 0,
    muted: false,
    solo: false,
  };
}

// --------------------------------------------------------------------------
// Utility Tests
// --------------------------------------------------------------------------

describe('Clip Utilities', () => {
  describe('calculateClipsTimeRange', () => {
    test('returns null for empty array', () => {
      expect(calculateClipsTimeRange([])).toBeNull();
    });

    test('returns correct range for single clip', () => {
      const clip = createTestClip('1', 'track1', 100, 200);
      const range = calculateClipsTimeRange([clip]);
      expect(range).toEqual({ start: 100, end: 200, unit: 'samples' });
    });

    test('returns correct range for multiple clips', () => {
      const clips = [
        createTestClip('1', 'track1', 100, 200),
        createTestClip('2', 'track1', 50, 150),
        createTestClip('3', 'track1', 180, 300),
      ];
      const range = calculateClipsTimeRange(clips);
      expect(range).toEqual({ start: 50, end: 300, unit: 'samples' });
    });
  });

  describe('clipsOverlap', () => {
    test('detects overlapping clips', () => {
      const a = createTestClip('1', 't', 100, 200);
      const b = createTestClip('2', 't', 150, 250);
      expect(clipsOverlap(a, b)).toBe(true);
    });

    test('detects non-overlapping clips', () => {
      const a = createTestClip('1', 't', 100, 200);
      const b = createTestClip('2', 't', 200, 300);
      expect(clipsOverlap(a, b)).toBe(false);
    });

    test('detects contained clips', () => {
      const a = createTestClip('1', 't', 100, 300);
      const b = createTestClip('2', 't', 150, 250);
      expect(clipsOverlap(a, b)).toBe(true);
    });
  });

  describe('sortClipsByStart', () => {
    test('sorts clips by start time', () => {
      const clips = [
        createTestClip('1', 't', 300, 400),
        createTestClip('2', 't', 100, 200),
        createTestClip('3', 't', 200, 300),
      ];
      const sorted = sortClipsByStart(clips);
      expect(sorted.map(c => c.id)).toEqual(['2', '3', '1']);
    });

    test('preserves original array', () => {
      const clips = [
        createTestClip('1', 't', 300, 400),
        createTestClip('2', 't', 100, 200),
      ];
      sortClipsByStart(clips);
      expect(clips[0].id).toBe('1');
    });
  });

  describe('mergeOverlappingRegions', () => {
    test('returns empty for no clips', () => {
      expect(mergeOverlappingRegions([])).toEqual([]);
    });

    test('handles non-overlapping clips', () => {
      const clips = [
        createTestClip('1', 't', 100, 200),
        createTestClip('2', 't', 300, 400),
      ];
      const regions = mergeOverlappingRegions(clips);
      expect(regions).toHaveLength(2);
    });

    test('merges overlapping clips into one region', () => {
      const clips = [
        createTestClip('1', 't', 100, 200),
        createTestClip('2', 't', 150, 250),
        createTestClip('3', 't', 200, 300),
      ];
      const regions = mergeOverlappingRegions(clips);
      expect(regions).toHaveLength(1);
      expect(regions[0]).toEqual({ start: 100, end: 300, unit: 'samples' });
    });

    test('handles adjacent clips', () => {
      const clips = [
        createTestClip('1', 't', 100, 200),
        createTestClip('2', 't', 200, 300),
      ];
      const regions = mergeOverlappingRegions(clips);
      expect(regions).toHaveLength(1);
    });
  });
});

// --------------------------------------------------------------------------
// M261: Consolidation Tests
// --------------------------------------------------------------------------

describe('M261: Clip Consolidation', () => {
  describe('consolidateClips', () => {
    test('fails with no clips', () => {
      const result = consolidateClips([]);
      expect(result.success).toBe(false);
      expect(result.message).toContain('No clips provided');
    });

    test('fails with clips from different tracks', () => {
      const clips = [
        createTestClip('1', 'track1', 100, 200),
        createTestClip('2', 'track2', 200, 300),
      ];
      const result = consolidateClips(clips);
      expect(result.success).toBe(false);
      expect(result.message).toContain('different tracks');
    });

    test('fails when all clips are muted', () => {
      const clips = [
        createTestClip('1', 't', 100, 200, { muted: true }),
        createTestClip('2', 't', 200, 300, { muted: true }),
      ];
      const result = consolidateClips(clips);
      expect(result.success).toBe(false);
      expect(result.message).toContain('muted');
    });

    test('consolidates clips successfully', () => {
      const clips = [
        createTestClip('1', 'track1', 100, 200),
        createTestClip('2', 'track1', 200, 300),
        createTestClip('3', 'track1', 300, 400),
      ];
      const result = consolidateClips(clips);
      
      expect(result.success).toBe(true);
      expect(result.newClip).not.toBeNull();
      expect(result.newClip!.start).toBe(100);
      expect(result.newClip!.end).toBe(400);
      expect(result.originalClips).toHaveLength(3);
    });

    test('filters muted clips during consolidation', () => {
      const clips = [
        createTestClip('1', 't', 100, 200),
        createTestClip('2', 't', 200, 300, { muted: true }),
        createTestClip('3', 't', 300, 400),
      ];
      const result = consolidateClips(clips);
      
      expect(result.success).toBe(true);
      expect(result.timing.startTime).toBe(100);
      expect(result.timing.endTime).toBe(400);
    });

    test('respects normalizeGain option', () => {
      const clips = [
        createTestClip('1', 't', 100, 200, { gain: 0.5 }),
        createTestClip('2', 't', 200, 300, { gain: 0.8 }),
      ];
      
      const resultNormalized = consolidateClips(clips, { normalizeGain: true });
      expect(resultNormalized.newClip!.gain).toBe(1.0);
      
      const resultPreserved = consolidateClips(clips, { normalizeGain: false });
      expect(resultPreserved.newClip!.gain).toBe(0.8);
    });

    test('includes fades from first and last clips', () => {
      const clips = [
        createTestClip('1', 't', 100, 200, { fadeIn: 10 }),
        createTestClip('2', 't', 200, 300, { fadeOut: 20 }),
      ];
      const result = consolidateClips(clips, { includeFades: true });
      
      expect(result.newClip!.fadeIn).toBe(10);
      expect(result.newClip!.fadeOut).toBe(20);
    });
  });

  describe('consolidateClipsOnTrack', () => {
    test('updates track with consolidated clip', () => {
      const track = createTestTrack('t1', [
        createTestClip('1', 't1', 100, 200),
        createTestClip('2', 't1', 200, 300),
        createTestClip('3', 't1', 500, 600),
      ]);
      
      const { track: updatedTrack, result } = consolidateClipsOnTrack(
        track,
        ['1', '2'],
        { preserveOriginals: false }
      );
      
      expect(result.success).toBe(true);
      expect(updatedTrack.clips).toHaveLength(2); // consolidated + untouched
      expect(updatedTrack.clips.some(c => c.id === '3')).toBe(true);
    });

    test('preserves original clips when option set', () => {
      const track = createTestTrack('t1', [
        createTestClip('1', 't1', 100, 200),
        createTestClip('2', 't1', 200, 300),
      ]);
      
      const { track: updatedTrack } = consolidateClipsOnTrack(
        track,
        ['1', '2'],
        { preserveOriginals: true }
      );
      
      expect(updatedTrack.clips).toHaveLength(3); // 2 originals + 1 consolidated
    });
  });
});

// --------------------------------------------------------------------------
// M262: Freeze Track Tests
// --------------------------------------------------------------------------

describe('M262: Freeze Track', () => {
  describe('freezeTrack', () => {
    test('freezes track with plugins', () => {
      const track = createTestTrack('t1', [], 3);
      const { track: frozenTrack, result } = freezeTrack(track);
      
      expect(result.success).toBe(true);
      expect(frozenTrack.frozen).toBe(true);
      expect(frozenTrack.plugins.every(p => !p.enabled)).toBe(true);
      expect(frozenTrack.frozenPluginStates).toHaveLength(3);
      expect(result.originalPluginCount).toBe(3);
    });

    test('fails when track already frozen', () => {
      const track = createTestTrack('t1', [], 2);
      const { track: frozenTrack } = freezeTrack(track);
      const { result } = freezeTrack(frozenTrack);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('already frozen');
    });

    test('fails when track has no plugins or clips', () => {
      const track = createTestTrack('t1', [], 0);
      const { result } = freezeTrack(track);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('no plugins or clips');
    });

    test('estimates CPU savings', () => {
      const track = createTestTrack('t1', [], 5);
      const { result } = freezeTrack(track);
      
      expect(result.cpuSavingsEstimate).toBeGreaterThan(0);
      expect(result.cpuSavingsEstimate).toBeLessThanOrEqual(50);
    });
  });

  describe('unfreezeTrack', () => {
    test('unfreezes track and restores plugins', () => {
      const track = createTestTrack('t1', [], 3);
      const { track: frozenTrack } = freezeTrack(track);
      const { track: unfrozenTrack, success } = unfreezeTrack(frozenTrack);
      
      expect(success).toBe(true);
      expect(unfrozenTrack.frozen).toBe(false);
      expect(unfrozenTrack.plugins.every(p => p.enabled)).toBe(true);
      expect(unfrozenTrack.frozenPluginStates).toBeUndefined();
    });

    test('fails when track not frozen', () => {
      const track = createTestTrack('t1', [], 2);
      const { success, message } = unfreezeTrack(track);
      
      expect(success).toBe(false);
      expect(message).toContain('not frozen');
    });
  });

  describe('batch freeze operations', () => {
    test('freezeTracks freezes multiple tracks', () => {
      const tracks = [
        createTestTrack('t1', [], 2),
        createTestTrack('t2', [], 3),
        createTestTrack('t3', [], 1),
      ];
      
      const { tracks: frozenTracks, results } = freezeTracks(tracks);
      
      expect(frozenTracks.every(t => t.frozen)).toBe(true);
      expect(results.filter(r => r.success)).toHaveLength(3);
    });

    test('unfreezeTracks unfreezes multiple tracks', () => {
      const tracks = [
        createTestTrack('t1', [], 2),
        createTestTrack('t2', [], 3),
      ];
      
      const { tracks: frozenTracks } = freezeTracks(tracks);
      const { tracks: unfrozenTracks, successes } = unfreezeTracks(frozenTracks);
      
      expect(unfrozenTracks.every(t => !t.frozen)).toBe(true);
      expect(successes).toBe(2);
    });
  });
});

// --------------------------------------------------------------------------
// M263: Bounce In Place Tests
// --------------------------------------------------------------------------

describe('M263: Bounce In Place', () => {
  describe('bounceInPlace', () => {
    test('bounces clips in range', () => {
      const track = createTestTrack('t1', [
        createTestClip('1', 't1', 100, 200),
        createTestClip('2', 't1', 150, 250),
      ]);
      
      const options: BounceOptions = {
        range: { start: 100, end: 300, unit: 'samples' },
        includePlugins: true,
        includeAutomation: true,
        replaceOriginal: true,
        normalize: false,
      };
      
      const { track: bouncedTrack, result } = bounceInPlace(track, options);
      
      expect(result.success).toBe(true);
      expect(result.newClip).not.toBeNull();
      expect(result.newClip!.start).toBe(100);
      expect(result.newClip!.end).toBe(300);
    });

    test('fails with no clips in range', () => {
      const track = createTestTrack('t1', [
        createTestClip('1', 't1', 100, 200),
      ]);
      
      const options: BounceOptions = {
        range: { start: 300, end: 400, unit: 'samples' },
        includePlugins: true,
        includeAutomation: true,
        replaceOriginal: true,
        normalize: false,
      };
      
      const { result } = bounceInPlace(track, options);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('No clips in selection');
    });

    test('replaces original clips when option set', () => {
      const track = createTestTrack('t1', [
        createTestClip('1', 't1', 100, 200),
        createTestClip('2', 't1', 200, 300),
        createTestClip('3', 't1', 400, 500),
      ]);
      
      const options: BounceOptions = {
        range: { start: 100, end: 300, unit: 'samples' },
        includePlugins: true,
        includeAutomation: true,
        replaceOriginal: true,
        normalize: false,
      };
      
      const { track: bouncedTrack } = bounceInPlace(track, options);
      
      // Should have bounced clip + clip 3 (outside range)
      expect(bouncedTrack.clips).toHaveLength(2);
      expect(bouncedTrack.clips.some(c => c.id === '3')).toBe(true);
    });

    test('respects custom output name', () => {
      const track = createTestTrack('t1', [
        createTestClip('1', 't1', 100, 200),
      ]);
      
      const options: BounceOptions = {
        range: { start: 50, end: 250, unit: 'samples' },
        includePlugins: true,
        includeAutomation: true,
        replaceOriginal: false,
        normalize: false,
        outputName: 'My Bounced Clip',
      };
      
      const { result } = bounceInPlace(track, options);
      
      expect(result.newClip!.name).toBe('My Bounced Clip');
    });
  });

  describe('bounceSelectedClips', () => {
    test('bounces selected clips', () => {
      const track = createTestTrack('t1', [
        createTestClip('1', 't1', 100, 200),
        createTestClip('2', 't1', 200, 300),
        createTestClip('3', 't1', 400, 500),
      ]);
      
      const { track: bouncedTrack, result } = bounceSelectedClips(
        track,
        ['1', '2'],
        { replaceOriginal: true }
      );
      
      expect(result.success).toBe(true);
      expect(result.range.start).toBe(100);
      expect(result.range.end).toBe(300);
    });

    test('fails with no selection', () => {
      const track = createTestTrack('t1', [
        createTestClip('1', 't1', 100, 200),
      ]);
      
      const { result } = bounceSelectedClips(track, []);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('No clips selected');
    });
  });
});

// --------------------------------------------------------------------------
// M272: Consolidation Preserves Timing Tests
// --------------------------------------------------------------------------

describe('M272: Clip Consolidation Preserves Timing', () => {
  test('consolidated clip starts at earliest source clip', () => {
    const clips = [
      createTestClip('3', 'track1', 500, 600),
      createTestClip('1', 'track1', 100, 200),
      createTestClip('2', 'track1', 300, 400),
    ];
    const result = consolidateClips(clips);
    
    expect(result.success).toBe(true);
    expect(result.newClip!.start).toBe(100); // Earliest start
  });

  test('consolidated clip ends at latest source clip', () => {
    const clips = [
      createTestClip('1', 'track1', 100, 200),
      createTestClip('2', 'track1', 300, 400),
      createTestClip('3', 'track1', 200, 600),
    ];
    const result = consolidateClips(clips);
    
    expect(result.success).toBe(true);
    expect(result.newClip!.end).toBe(600); // Latest end
  });

  test('consolidated clip duration matches time range of sources', () => {
    const clips = [
      createTestClip('1', 'track1', 100, 200),
      createTestClip('2', 'track1', 300, 450),
    ];
    const result = consolidateClips(clips);
    
    expect(result.success).toBe(true);
    const expectedDuration = 450 - 100; // Latest end - earliest start
    const actualDuration = result.newClip!.end - result.newClip!.start;
    expect(actualDuration).toBe(expectedDuration);
  });

  test('timing info is accurate in result', () => {
    const clips = [
      createTestClip('1', 'track1', 150, 250),
      createTestClip('2', 'track1', 350, 500),
    ];
    const result = consolidateClips(clips);
    
    expect(result.timing.startTime).toBe(150);
    expect(result.timing.endTime).toBe(500);
    expect(result.timing.duration).toBe(350);
  });

  test('gaps between clips are preserved in timeline', () => {
    // Clips with a gap between them
    const clips = [
      createTestClip('1', 'track1', 100, 200),
      createTestClip('2', 'track1', 400, 500), // Gap from 200-400
    ];
    const result = consolidateClips(clips);
    
    // Consolidated clip spans entire range including gap
    expect(result.newClip!.start).toBe(100);
    expect(result.newClip!.end).toBe(500);
    // The gap is now part of the consolidated region
  });

  test('overlapping clips merge without timing shift', () => {
    const clips = [
      createTestClip('1', 'track1', 100, 300),
      createTestClip('2', 'track1', 200, 400), // Overlaps with clip 1
    ];
    const result = consolidateClips(clips);
    
    expect(result.newClip!.start).toBe(100);
    expect(result.newClip!.end).toBe(400);
  });
});

// --------------------------------------------------------------------------
// M273: Freeze Track Reduces CPU Tests
// --------------------------------------------------------------------------

describe('M273: Freeze Track Reduces CPU Correctly', () => {
  test('freeze disables all plugins', () => {
    const track = createTestTrack('t1', [], 5);
    const { track: frozenTrack } = freezeTrack(track);
    
    expect(frozenTrack.plugins.every(p => p.enabled === false)).toBe(true);
  });

  test('freeze estimates CPU savings proportional to plugin count', () => {
    const track1 = createTestTrack('t1', [], 1);
    const track5 = createTestTrack('t5', [], 5);
    const track10 = createTestTrack('t10', [], 10);
    
    const { result: result1 } = freezeTrack(track1);
    const { result: result5 } = freezeTrack(track5);
    const { result: result10 } = freezeTrack(track10);
    
    // More plugins = more CPU savings
    expect(result5.cpuSavingsEstimate).toBeGreaterThan(result1.cpuSavingsEstimate);
    expect(result10.cpuSavingsEstimate).toBeGreaterThan(result5.cpuSavingsEstimate);
  });

  test('freeze tracks batch operation accumulates CPU savings', () => {
    const tracks = [
      createTestTrack('t1', [], 3),
      createTestTrack('t2', [], 4),
      createTestTrack('t3', [], 2),
    ];
    
    const { results } = freezeTracks(tracks);
    
    const totalSavings = results.reduce((sum, r) => sum + r.cpuSavingsEstimate, 0);
    expect(totalSavings).toBeGreaterThan(0);
  });

  test('unfreeze re-enables all plugins', () => {
    const track = createTestTrack('t1', [], 4);
    const { track: frozenTrack } = freezeTrack(track);
    const { track: unfrozenTrack } = unfreezeTrack(frozenTrack);
    
    expect(unfrozenTrack.plugins.every(p => p.enabled === true)).toBe(true);
  });

  test('freeze stores original plugin states for restoration', () => {
    const track = createTestTrack('t1', [], 3);
    const { track: frozenTrack } = freezeTrack(track);
    
    expect(frozenTrack.frozenPluginStates).toHaveLength(3);
    frozenTrack.frozenPluginStates!.forEach((state, i) => {
      expect(state.pluginId).toBe(`plugin_${i}`);
      expect(state.wasEnabled).toBe(true);
    });
  });

  test('freeze preserves clips while disabling processing', () => {
    const track = createTestTrack('t1', [
      createTestClip('1', 't1', 100, 200),
      createTestClip('2', 't1', 300, 400),
    ], 3);
    
    const { track: frozenTrack } = freezeTrack(track);
    
    // Clips should remain unchanged
    expect(frozenTrack.clips).toHaveLength(2);
    expect(frozenTrack.clips[0].start).toBe(100);
    expect(frozenTrack.clips[1].start).toBe(300);
  });
});

// --------------------------------------------------------------------------
// M274: Bounce In Place Matches Source Audio Tests
// --------------------------------------------------------------------------

describe('M274: Bounce In Place Matches Source Audio', () => {
  test('bounced clip covers exact range specified', () => {
    const track = createTestTrack('t1', [
      createTestClip('1', 't1', 100, 200),
      createTestClip('2', 't1', 200, 300),
    ]);
    
    const options: BounceOptions = {
      range: { start: 100, end: 300, unit: 'samples' },
      includePlugins: true,
      includeAutomation: true,
      replaceOriginal: true,
      normalize: false,
    };
    
    const { result } = bounceInPlace(track, options);
    
    expect(result.newClip!.start).toBe(100);
    expect(result.newClip!.end).toBe(300);
  });

  test('bounce range extends beyond clips if specified', () => {
    const track = createTestTrack('t1', [
      createTestClip('1', 't1', 150, 250),
    ]);
    
    const options: BounceOptions = {
      range: { start: 100, end: 300, unit: 'samples' }, // Wider than clip
      includePlugins: true,
      includeAutomation: true,
      replaceOriginal: true,
      normalize: false,
    };
    
    const { result } = bounceInPlace(track, options);
    
    // Bounced clip uses the specified range, not clip bounds
    expect(result.newClip!.start).toBe(100);
    expect(result.newClip!.end).toBe(300);
  });

  test('bounced clip inherits track context', () => {
    const track = createTestTrack('t1', [
      createTestClip('1', 't1', 100, 200),
    ]);
    
    const options: BounceOptions = {
      range: { start: 50, end: 250, unit: 'samples' },
      includePlugins: true,
      includeAutomation: true,
      replaceOriginal: false,
      normalize: false,
    };
    
    const { result } = bounceInPlace(track, options);
    
    expect(result.newClip!.trackId).toBe('t1');
  });

  test('bounce includes plugin processing flag', () => {
    const track = createTestTrack('t1', [
      createTestClip('1', 't1', 100, 200),
    ], 3);
    
    const optionsWithPlugins: BounceOptions = {
      range: { start: 50, end: 250, unit: 'samples' },
      includePlugins: true,
      includeAutomation: false,
      replaceOriginal: false,
      normalize: false,
    };
    
    const { result: resultWith } = bounceInPlace(track, optionsWithPlugins);
    expect(resultWith.includedPlugins).toBe(true);
    
    const optionsWithoutPlugins: BounceOptions = {
      ...optionsWithPlugins,
      includePlugins: false,
    };
    
    const { result: resultWithout } = bounceInPlace(track, optionsWithoutPlugins);
    expect(resultWithout.includedPlugins).toBe(false);
  });

  test('bounce includes automation flag', () => {
    const track = createTestTrack('t1', [
      createTestClip('1', 't1', 100, 200),
    ]);
    
    const optionsWithAuto: BounceOptions = {
      range: { start: 50, end: 250, unit: 'samples' },
      includePlugins: false,
      includeAutomation: true,
      replaceOriginal: false,
      normalize: false,
    };
    
    const { result } = bounceInPlace(track, optionsWithAuto);
    expect(result.includedAutomation).toBe(true);
  });

  test('bounce selected clips matches their combined range', () => {
    const track = createTestTrack('t1', [
      createTestClip('1', 't1', 100, 200),
      createTestClip('2', 't1', 300, 400),
      createTestClip('3', 't1', 600, 700),
    ]);
    
    const { result } = bounceSelectedClips(track, ['1', '2']);
    
    expect(result.range.start).toBe(100);
    expect(result.range.end).toBe(400);
  });

  test('bounced clip preserves source type', () => {
    const track = createTestTrack('t1', [
      createTestClip('1', 't1', 100, 200, { sourceType: 'audio' }),
    ]);
    
    const options: BounceOptions = {
      range: { start: 50, end: 250, unit: 'samples' },
      includePlugins: true,
      includeAutomation: true,
      replaceOriginal: false,
      normalize: false,
    };
    
    const { result } = bounceInPlace(track, options);
    
    // Bounced clips are always audio (rendered)
    expect(result.newClip!.sourceType).toBe('audio');
  });
});

// --------------------------------------------------------------------------
// ClipOperationsStore Tests
// --------------------------------------------------------------------------

describe('ClipOperationsStore', () => {
  let store: ClipOperationsStore;
  
  beforeEach(() => {
    store = new ClipOperationsStore();
  });

  test('manages tracks', () => {
    const track = createTestTrack('t1', [
      createTestClip('1', 't1', 100, 200),
    ]);
    
    store.setTrack(track);
    expect(store.getTrack('t1')).toBeDefined();
    expect(store.getAllTracks()).toHaveLength(1);
  });

  test('consolidates clips via store', () => {
    const track = createTestTrack('t1', [
      createTestClip('1', 't1', 100, 200),
      createTestClip('2', 't1', 200, 300),
    ]);
    store.setTrack(track);
    
    const result = store.consolidate('t1', ['1', '2']);
    
    expect(result.success).toBe(true);
    expect(store.getTrack('t1')!.clips).toHaveLength(1);
  });

  test('freezes track via store', () => {
    const track = createTestTrack('t1', [], 3);
    store.setTrack(track);
    
    const result = store.freeze('t1');
    
    expect(result.success).toBe(true);
    expect(store.getTrack('t1')!.frozen).toBe(true);
  });

  test('unfreezes track via store', () => {
    const track = createTestTrack('t1', [], 3);
    store.setTrack(track);
    
    store.freeze('t1');
    const { success } = store.unfreeze('t1');
    
    expect(success).toBe(true);
    expect(store.getTrack('t1')!.frozen).toBe(false);
  });

  test('bounces via store', () => {
    const track = createTestTrack('t1', [
      createTestClip('1', 't1', 100, 200),
    ]);
    store.setTrack(track);
    
    const result = store.bounce('t1', {
      range: { start: 0, end: 300, unit: 'samples' },
      includePlugins: true,
      includeAutomation: true,
      replaceOriginal: true,
      normalize: false,
    });
    
    expect(result.success).toBe(true);
  });

  test('tracks operation history', () => {
    const track = createTestTrack('t1', [
      createTestClip('1', 't1', 100, 200),
    ], 2);
    store.setTrack(track);
    
    store.consolidate('t1', ['1']);
    store.freeze('t1');
    store.unfreeze('t1');
    
    const history = store.getHistory();
    expect(history).toHaveLength(3);
    expect(history.map(h => h.action)).toEqual(['consolidate', 'freeze', 'unfreeze']);
  });

  test('handles missing track gracefully', () => {
    const consolidateResult = store.consolidate('missing', ['1']);
    expect(consolidateResult.success).toBe(false);
    
    const freezeResult = store.freeze('missing');
    expect(freezeResult.success).toBe(false);
    
    const unfreezeResult = store.unfreeze('missing');
    expect(unfreezeResult.success).toBe(false);
    
    const bounceResult = store.bounce('missing', {
      range: { start: 0, end: 100, unit: 'samples' },
      includePlugins: true,
      includeAutomation: true,
      replaceOriginal: true,
      normalize: false,
    });
    expect(bounceResult.success).toBe(false);
  });

  test('clears all data', () => {
    const track = createTestTrack('t1', [], 2);
    store.setTrack(track);
    store.freeze('t1');
    
    store.clear();
    
    expect(store.getAllTracks()).toHaveLength(0);
    expect(store.getHistory()).toHaveLength(0);
  });
});
