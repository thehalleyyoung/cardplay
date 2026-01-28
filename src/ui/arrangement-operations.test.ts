/**
 * @fileoverview Tests for Arrangement Operations.
 * 
 * Tests all edit modes (ripple, shuffle, slip, slide) and time manipulation operations.
 * 
 * @module @cardplay/ui/arrangement-operations.test
 */

import { describe, it, expect } from 'vitest';
import {
  rippleEditClip,
  rippleDeleteClip,
  shuffleEditClip,
  slipEditClip,
  slideEditClip,
  insertTime,
  deleteTime,
  copyTimeRange,
  pasteTimeRange,
  duplicateSection,
  moveSection,
  loopSection,
  extendSection,
  truncateSection,
  bounceToAudio,
  bounceToMIDI,
  bounceInPlace,
  consolidateClips,
  splitAtTransients,
  quantizeClips,
  alignClips,
  createSection,
  getClipsInRange,
  type ArrangementSection,
} from './arrangement-operations';
import { asTick, asTickDuration } from '../types/primitives';
import type { Clip, Track } from './components/arrangement-panel';

// ============================================================================
// TEST FIXTURES
// ============================================================================

function createTestClip(
  id: string,
  trackId: string,
  start: number,
  duration: number,
  name: string = `Clip ${id}`
): Clip {
  return {
    id,
    trackId,
    name,
    color: '#3498db',
    start: asTick(start),
    duration: asTickDuration(duration),
    offset: asTick(0),
    muted: false,
    selected: false,
  };
}

function createTestTrack(id: string, name: string): Track {
  return {
    id,
    name,
    color: '#3498db',
    height: 100,
    type: 'midi',
    muted: false,
    solo: false,
    armed: false,
    volume: 0.8,
    pan: 0,
    collapsed: false,
    selected: false,
  };
}

// ============================================================================
// RIPPLE EDIT TESTS
// ============================================================================

describe('rippleEditClip', () => {
  it('should shift following clips when extending a clip', () => {
    const clips = [
      createTestClip('1', 'track1', 0, 100, 'A'),
      createTestClip('2', 'track1', 100, 100, 'B'),
      createTestClip('3', 'track1', 200, 100, 'C'),
    ];

    const result = rippleEditClip(clips, '1', undefined, asTickDuration(150));

    expect(result.clips[0].duration).toBe(150);
    expect(result.clips[1].start).toBe(150); // B shifts right by 50
    expect(result.clips[2].start).toBe(250); // C shifts right by 50
  });

  it('should shift following clips when moving a clip', () => {
    const clips = [
      createTestClip('1', 'track1', 0, 100, 'A'),
      createTestClip('2', 'track1', 100, 100, 'B'),
      createTestClip('3', 'track1', 200, 100, 'C'),
    ];

    const result = rippleEditClip(clips, '2', asTick(150), undefined);

    expect(result.clips[0].start).toBe(0); // A unchanged
    expect(result.clips[1].start).toBe(150); // B moves to 150
    expect(result.clips[2].start).toBe(250); // C ripples to 250
  });

  it('should only affect clips on the same track', () => {
    const clips = [
      createTestClip('1', 'track1', 0, 100, 'A'),
      createTestClip('2', 'track1', 100, 100, 'B'),
      createTestClip('3', 'track2', 100, 100, 'C'),
    ];

    const result = rippleEditClip(clips, '1', undefined, asTickDuration(150));

    expect(result.clips[0].duration).toBe(150);
    expect(result.clips[1].start).toBe(150); // B ripples
    expect(result.clips[2].start).toBe(100); // C unchanged (different track)
  });

  it('should handle shrinking a clip', () => {
    const clips = [
      createTestClip('1', 'track1', 0, 100, 'A'),
      createTestClip('2', 'track1', 100, 100, 'B'),
      createTestClip('3', 'track1', 200, 100, 'C'),
    ];

    const result = rippleEditClip(clips, '1', undefined, asTickDuration(50));

    expect(result.clips[0].duration).toBe(50);
    expect(result.clips[1].start).toBe(50); // B shifts left
    expect(result.clips[2].start).toBe(150); // C shifts left
  });
});

describe('rippleDeleteClip', () => {
  it('should close the gap when deleting a clip', () => {
    const clips = [
      createTestClip('1', 'track1', 0, 100, 'A'),
      createTestClip('2', 'track1', 100, 100, 'B'),
      createTestClip('3', 'track1', 200, 100, 'C'),
    ];

    const result = rippleDeleteClip(clips, '2');

    expect(result.clips.length).toBe(2);
    expect(result.clips[0].id).toBe('1');
    expect(result.clips[1].id).toBe('3');
    expect(result.clips[1].start).toBe(100); // C moved to where B was
  });

  it('should only affect clips on the same track', () => {
    const clips = [
      createTestClip('1', 'track1', 0, 100, 'A'),
      createTestClip('2', 'track1', 100, 100, 'B'),
      createTestClip('3', 'track2', 200, 100, 'C'),
    ];

    const result = rippleDeleteClip(clips, '2');

    expect(result.clips.length).toBe(2);
    expect(result.clips[1].start).toBe(200); // C unchanged (different track)
  });
});

// ============================================================================
// SHUFFLE EDIT TESTS
// ============================================================================

describe('shuffleEditClip', () => {
  it('should shuffle clips when moving right', () => {
    const clips = [
      createTestClip('1', 'track1', 0, 100, 'A'),
      createTestClip('2', 'track1', 100, 100, 'B'),
      createTestClip('3', 'track1', 200, 100, 'C'),
    ];

    const result = shuffleEditClip(clips, '1', asTick(150));

    expect(result.clips[0].start).toBe(150); // A moves to 150
    expect(result.clips[1].start).toBe(0);   // B shuffles to 0
    expect(result.clips[2].start).toBe(200); // C unchanged
  });

  it('should shuffle clips when moving left', () => {
    const clips = [
      createTestClip('1', 'track1', 0, 100, 'A'),
      createTestClip('2', 'track1', 100, 100, 'B'),
      createTestClip('3', 'track1', 200, 100, 'C'),
    ];

    const result = shuffleEditClip(clips, '3', asTick(50));

    expect(result.clips[0].start).toBe(0);   // A unchanged
    expect(result.clips[1].start).toBe(200); // B shuffles right
    expect(result.clips[2].start).toBe(50);  // C moves to 50
  });
});

// ============================================================================
// SLIP EDIT TESTS
// ============================================================================

describe('slipEditClip', () => {
  it('should change clip offset without moving boundaries', () => {
    const clips = [
      createTestClip('1', 'track1', 0, 100, 'A'),
      createTestClip('2', 'track1', 100, 100, 'B'),
    ];

    const result = slipEditClip(clips, '1', asTick(50));

    expect(result.clips[0].start).toBe(0);       // Position unchanged
    expect(result.clips[0].duration).toBe(100);  // Duration unchanged
    expect(result.clips[0].offset).toBe(50);     // Offset changed
    expect(result.clips[1].start).toBe(100);     // Other clips unchanged
  });
});

// ============================================================================
// SLIDE EDIT TESTS
// ============================================================================

describe('slideEditClip', () => {
  it('should adjust neighbors when sliding a clip', () => {
    const clips = [
      createTestClip('1', 'track1', 0, 100, 'A'),
      createTestClip('2', 'track1', 100, 100, 'B'),
      createTestClip('3', 'track1', 200, 100, 'C'),
    ];

    const result = slideEditClip(clips, '2', asTick(150));

    expect(result.clips[0].duration).toBe(150); // A extends to fill gap
    expect(result.clips[1].start).toBe(150);    // B moves to 150
    expect(result.clips[2].start).toBe(250);    // C moves to abut B
  });
});

// ============================================================================
// INSERT TIME TESTS
// ============================================================================

describe('insertTime', () => {
  it('should shift clips after insertion point', () => {
    const clips = [
      createTestClip('1', 'track1', 0, 100, 'A'),
      createTestClip('2', 'track1', 100, 100, 'B'),
      createTestClip('3', 'track1', 200, 100, 'C'),
    ];

    const result = insertTime(clips, asTick(150), asTickDuration(50));

    expect(result.clips[0].start).toBe(0);   // A unchanged
    expect(result.clips[0].duration).toBe(100); // A unchanged
    expect(result.clips[1].start).toBe(100); // B unchanged (starts before insertion)
    expect(result.clips[1].duration).toBe(150); // B extended (spans insertion)
    expect(result.clips[2].start).toBe(250); // C shifted right
  });

  it('should affect all tracks when no filter specified', () => {
    const clips = [
      createTestClip('1', 'track1', 100, 100, 'A'),
      createTestClip('2', 'track2', 100, 100, 'B'),
    ];

    const result = insertTime(clips, asTick(100), asTickDuration(50));

    expect(result.clips[0].start).toBe(150);
    expect(result.clips[1].start).toBe(150);
  });

  it('should only affect specified tracks when filter provided', () => {
    const clips = [
      createTestClip('1', 'track1', 100, 100, 'A'),
      createTestClip('2', 'track2', 100, 100, 'B'),
    ];

    const result = insertTime(clips, asTick(100), asTickDuration(50), ['track1']);

    expect(result.clips[0].start).toBe(150); // track1 affected
    expect(result.clips[1].start).toBe(100); // track2 unchanged
  });
});

// ============================================================================
// DELETE TIME TESTS
// ============================================================================

describe('deleteTime', () => {
  it('should delete clips entirely within range', () => {
    const clips = [
      createTestClip('1', 'track1', 0, 100, 'A'),
      createTestClip('2', 'track1', 100, 100, 'B'),
      createTestClip('3', 'track1', 200, 100, 'C'),
    ];

    const result = deleteTime(clips, { start: asTick(100), end: asTick(200) });

    expect(result.clips.length).toBe(2);
    expect(result.clips[0].id).toBe('1');
    expect(result.clips[1].id).toBe('3');
    expect(result.clips[1].start).toBe(100); // C shifted back
  });

  it('should trim clips that partially overlap range', () => {
    const clips = [
      createTestClip('1', 'track1', 50, 100, 'A'),  // Ends at 150
      createTestClip('2', 'track1', 150, 100, 'B'), // Starts at 150
    ];

    const result = deleteTime(clips, { start: asTick(100), end: asTick(200) });

    expect(result.clips[0].duration).toBe(50); // A trimmed to 50
    expect(result.clips[1].start).toBe(100);   // B shifted and trimmed
    expect(result.clips[1].duration).toBe(50); // B duration reduced
  });

  it('should punch out middle of clips that span range', () => {
    const clips = [
      createTestClip('1', 'track1', 0, 300, 'A'), // Spans 0-300
    ];

    const result = deleteTime(clips, { start: asTick(100), end: asTick(200) });

    expect(result.clips[0].duration).toBe(200); // A shortened by 100
  });
});

// ============================================================================
// COPY/PASTE TIME RANGE TESTS
// ============================================================================

describe('copyTimeRange and pasteTimeRange', () => {
  it('should copy and paste a time range', () => {
    const clips = [
      createTestClip('1', 'track1', 0, 100, 'A'),
      createTestClip('2', 'track1', 100, 100, 'B'),
    ];

    const clipboard = copyTimeRange(
      clips,
      { start: asTick(0), end: asTick(100) },
      ['track1']
    );

    expect(clipboard.clips.length).toBe(1);
    expect(clipboard.clips[0].name).toBe('A');
    expect(clipboard.clips[0].start).toBe(0); // Relative position

    const result = pasteTimeRange(clips, clipboard, asTick(200), 'insert');

    expect(result.clips.length).toBe(3); // Original 2 + 1 pasted
    expect(result.clips[2].start).toBe(200); // Pasted at position 200
  });

  it('should handle overwrite paste mode', () => {
    const clips = [
      createTestClip('1', 'track1', 0, 100, 'A'),
      createTestClip('2', 'track1', 100, 100, 'B'),
      createTestClip('3', 'track1', 200, 100, 'C'),
    ];

    const clipboard = copyTimeRange(
      clips,
      { start: asTick(0), end: asTick(100) },
      ['track1']
    );

    const result = pasteTimeRange(clips, clipboard, asTick(100), 'overwrite');

    // B should be deleted, A should be pasted at 100
    const clipsAtPosition100 = result.clips.filter(c => c.start === 100);
    expect(clipsAtPosition100.length).toBeGreaterThan(0);
  });

  it('should copy clips that partially overlap range', () => {
    const clips = [
      createTestClip('1', 'track1', 50, 100, 'A'),  // 50-150
      createTestClip('2', 'track1', 150, 100, 'B'), // 150-250
    ];

    const clipboard = copyTimeRange(
      clips,
      { start: asTick(100), end: asTick(200) },
      ['track1']
    );

    expect(clipboard.clips.length).toBe(2);
    expect(clipboard.clips[0].start).toBe(0); // Relative to range start
    expect(clipboard.clips[0].duration).toBe(50); // Trimmed from 100-150
    expect(clipboard.clips[1].start).toBe(50); // Relative: 150-100
    expect(clipboard.clips[1].duration).toBe(50); // Trimmed to 150-200
  });
});

// ============================================================================
// SECTION OPERATIONS TESTS
// ============================================================================

describe('duplicateSection', () => {
  it('should duplicate a section after the original', () => {
    const clips = [
      createTestClip('1', 'track1', 0, 100, 'A'),
      createTestClip('2', 'track1', 100, 100, 'B'),
    ];

    const tracks = [createTestTrack('track1', 'Track 1')];
    const section = createSection(
      { start: asTick(0), end: asTick(200) },
      tracks,
      'Section 1'
    );

    const result = duplicateSection(clips, section);

    expect(result.clips.length).toBe(4); // 2 original + 2 duplicated
    expect(result.clips[2].start).toBe(200); // First duplicate starts at 200
  });
});

describe('moveSection', () => {
  it('should move a section to a new position', () => {
    const clips = [
      createTestClip('1', 'track1', 0, 100, 'A'),
      createTestClip('2', 'track1', 100, 100, 'B'),
      createTestClip('3', 'track1', 200, 100, 'C'),
    ];

    const tracks = [createTestTrack('track1', 'Track 1')];
    const section = createSection(
      { start: asTick(0), end: asTick(200) },
      tracks,
      'Section 1'
    );

    const result = moveSection(clips, section, asTick(300));

    // C at 200 should move left to fill gap (ripple effect)
    // A and B should be moved to 300+
    const clipsAtOriginalStart = result.clips.filter(c => c.start === 0);
    expect(clipsAtOriginalStart.length).toBe(1); // C rippled to 0

    const clipsAt300 = result.clips.filter(c => c.start >= 300);
    expect(clipsAt300.length).toBe(2); // A and B moved to 300+
    expect(result.clips.length).toBe(3); // All 3 clips still exist
  });
});

describe('loopSection', () => {
  it('should loop a section N times', () => {
    const clips = [
      createTestClip('1', 'track1', 0, 100, 'A'),
    ];

    const tracks = [createTestTrack('track1', 'Track 1')];
    const section = createSection(
      { start: asTick(0), end: asTick(100) },
      tracks,
      'Section 1'
    );

    const result = loopSection(clips, section, 3);

    expect(result.clips.length).toBe(3); // Original + 2 copies
    expect(result.clips[0].start).toBe(0);
    expect(result.clips[1].start).toBe(100);
    expect(result.clips[2].start).toBe(200);
  });
});

describe('extendSection', () => {
  it('should extend a section by repeating the end', () => {
    const clips = [
      createTestClip('1', 'track1', 50, 50, 'A'), // Last 50 ticks
    ];

    const tracks = [createTestTrack('track1', 'Track 1')];
    const section = createSection(
      { start: asTick(0), end: asTick(100) },
      tracks,
      'Section 1'
    );

    const result = extendSection(clips, section, asTickDuration(50));

    expect(result.clips.length).toBe(2); // Original + extended part
    expect(result.clips[1].start).toBe(100); // Extension starts at 100
  });
});

describe('truncateSection', () => {
  it('should truncate a section to shorter duration', () => {
    const clips = [
      createTestClip('1', 'track1', 0, 100, 'A'),
      createTestClip('2', 'track1', 100, 100, 'B'),
    ];

    const tracks = [createTestTrack('track1', 'Track 1')];
    const section = createSection(
      { start: asTick(0), end: asTick(200) },
      tracks,
      'Section 1'
    );

    const result = truncateSection(clips, section, asTickDuration(150));

    // Content after 150 should be deleted
    const clipsAfter150 = result.clips.filter(c => c.start >= 150);
    expect(clipsAfter150.length).toBe(0);
  });
});

// ============================================================================
// HELPER FUNCTIONS TESTS
// ============================================================================

describe('getClipsInRange', () => {
  it('should return clips that overlap range', () => {
    const clips = [
      createTestClip('1', 'track1', 0, 100, 'A'),
      createTestClip('2', 'track1', 100, 100, 'B'),
      createTestClip('3', 'track1', 200, 100, 'C'),
    ];

    const result = getClipsInRange(
      clips,
      { start: asTick(50), end: asTick(150) }
    );

    expect(result.length).toBe(2); // A and B overlap
    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('2');
  });

  it('should filter by track IDs', () => {
    const clips = [
      createTestClip('1', 'track1', 0, 100, 'A'),
      createTestClip('2', 'track2', 0, 100, 'B'),
    ];

    const result = getClipsInRange(
      clips,
      { start: asTick(0), end: asTick(100) },
      ['track1']
    );

    expect(result.length).toBe(1);
    expect(result[0].id).toBe('1');
  });
});

// ============================================================================
// BOUNCE OPERATIONS TESTS
// ============================================================================

describe('bounceToAudio', () => {
  it('should convert clips to audio type', () => {
    const clips = [
      createTestClip('1', 'track1', 0, 100, 'Clip 1'),
      createTestClip('2', 'track1', 100, 100, 'Clip 2'),
    ];

    const result = bounceToAudio(clips, ['1']);

    expect(result.clips.length).toBe(2);
    expect(result.clips[0].id).toContain('bounced-audio');
    expect(result.clips[1].id).toBe('2');
  });

  it('should handle multiple clips', () => {
    const clips = [
      createTestClip('1', 'track1', 0, 100, 'Clip 1'),
      createTestClip('2', 'track1', 100, 100, 'Clip 2'),
      createTestClip('3', 'track1', 200, 100, 'Clip 3'),
    ];

    const result = bounceToAudio(clips, ['1', '3']);

    expect(result.clips[0].id).toContain('bounced-audio');
    expect(result.clips[1].id).toBe('2');
    expect(result.clips[2].id).toContain('bounced-audio');
  });
});

describe('bounceToMIDI', () => {
  it('should convert clips to MIDI type', () => {
    const clips = [
      createTestClip('1', 'track1', 0, 100, 'Clip 1'),
      createTestClip('2', 'track1', 100, 100, 'Clip 2'),
    ];

    const result = bounceToMIDI(clips, ['1']);

    expect(result.clips.length).toBe(2);
    expect(result.clips[0].id).toContain('bounced-midi');
    expect(result.clips[1].id).toBe('2');
  });
});

describe('bounceInPlace', () => {
  it('should replace clips with audio version', () => {
    const clips = [
      createTestClip('1', 'track1', 0, 100, 'Clip 1'),
      createTestClip('2', 'track1', 100, 100, 'Clip 2'),
    ];

    const result = bounceInPlace(clips, ['1']);

    expect(result.clips.length).toBe(2);
    expect(result.clips[0].id).toBe('1'); // Same ID
    expect(result.clips[0].start).toBe(0); // Same position
  });
});

describe('consolidateClips', () => {
  it('should merge multiple clips into one', () => {
    const clips = [
      createTestClip('1', 'track1', 0, 100, 'Clip 1'),
      createTestClip('2', 'track1', 100, 100, 'Clip 2'),
      createTestClip('3', 'track1', 200, 100, 'Clip 3'),
    ];

    const result = consolidateClips(clips, ['1', '2'], 'track1');

    expect(result.clips.length).toBe(2); // 1 consolidated + 1 untouched
    const consolidated = result.clips.find(c => c.name === 'Consolidated');
    expect(consolidated).toBeDefined();
    expect(consolidated!.start).toBe(0);
    expect(consolidated!.duration).toBe(200); // Spans both clips
  });

  it('should handle non-contiguous clips', () => {
    const clips = [
      createTestClip('1', 'track1', 0, 100, 'Clip 1'),
      createTestClip('2', 'track1', 200, 100, 'Clip 2'),
    ];

    const result = consolidateClips(clips, ['1', '2'], 'track1');

    const consolidated = result.clips.find(c => c.name === 'Consolidated');
    expect(consolidated!.start).toBe(0);
    expect(consolidated!.duration).toBe(300); // Includes gap
  });

  it('should return original clips if no targets', () => {
    const clips = [createTestClip('1', 'track1', 0, 100, 'Clip 1')];

    const result = consolidateClips(clips, [], 'track1');

    expect(result.clips).toEqual(clips);
  });
});

describe('splitAtTransients', () => {
  it('should split audio clips', () => {
    const clips = [
      { ...createTestClip('1', 'track1', 0, 1000, 'Clip 1'), waveform: [0.1, 0.2, 0.3] },
    ];

    const result = splitAtTransients(clips, ['1'], 0.5);

    expect(result.clips.length).toBeGreaterThan(1);
    expect(result.clips.every(c => c.id.startsWith('1-split'))).toBe(true);
  });

  it('should not split clips without waveform data', () => {
    const clips = [
      createTestClip('1', 'track1', 0, 1000, 'Clip 1'),
    ];

    const result = splitAtTransients(clips, ['1']);

    expect(result.clips.length).toBe(1);
    expect(result.clips[0].id).toBe('1');
  });

  it('should handle high sensitivity', () => {
    const clips = [
      { ...createTestClip('1', 'track1', 0, 1000, 'Clip 1'), waveform: [0.1, 0.2, 0.3] },
    ];

    const result = splitAtTransients(clips, ['1'], 1.0);

    expect(result.clips.length).toBeGreaterThan(3); // More splits with higher sensitivity
  });
});

describe('quantizeClips', () => {
  it('should snap clips to grid', () => {
    const clips = [
      createTestClip('1', 'track1', 15, 100, 'Clip 1'),
      createTestClip('2', 'track1', 85, 100, 'Clip 2'),
    ];

    const result = quantizeClips(clips, ['1', '2'], asTickDuration(50), 1.0);

    expect(result.clips[0].start).toBe(0); // Snapped to 0
    expect(result.clips[1].start).toBe(100); // Snapped to 100
  });

  it('should respect quantize strength', () => {
    const clips = [createTestClip('1', 'track1', 15, 100, 'Clip 1')];

    const result = quantizeClips(clips, ['1'], asTickDuration(50), 0.5);

    // Should move halfway between original (15) and quantized (0)
    // Rounded to nearest integer: Math.round(15 + (-15 * 0.5)) = Math.round(7.5) = 8
    expect(result.clips[0].start).toBe(8);
  });

  it('should not quantize unselected clips', () => {
    const clips = [
      createTestClip('1', 'track1', 15, 100, 'Clip 1'),
      createTestClip('2', 'track1', 85, 100, 'Clip 2'),
    ];

    const result = quantizeClips(clips, ['1'], asTickDuration(50), 1.0);

    expect(result.clips[0].start).toBe(0);
    expect(result.clips[1].start).toBe(85); // Unchanged
  });
});

describe('alignClips', () => {
  it('should align clips to start position', () => {
    const clips = [
      createTestClip('1', 'track1', 0, 100, 'Clip 1'),
      createTestClip('2', 'track1', 50, 100, 'Clip 2'),
      createTestClip('3', 'track1', 100, 100, 'Clip 3'),
    ];

    const result = alignClips(clips, ['1', '2', '3'], asTick(200), 'start');

    expect(result.clips.every(c => c.start === 200)).toBe(true);
  });

  it('should align clips to end position', () => {
    const clips = [
      createTestClip('1', 'track1', 0, 100, 'Clip 1'),
      createTestClip('2', 'track1', 50, 200, 'Clip 2'),
    ];

    const result = alignClips(clips, ['1', '2'], asTick(300), 'end');

    expect(result.clips[0].start).toBe(200); // 300 - 100
    expect(result.clips[1].start).toBe(100); // 300 - 200
  });

  it('should align clips to center position', () => {
    const clips = [
      createTestClip('1', 'track1', 0, 100, 'Clip 1'),
      createTestClip('2', 'track1', 50, 200, 'Clip 2'),
    ];

    const result = alignClips(clips, ['1', '2'], asTick(300), 'center');

    expect(result.clips[0].start).toBe(250); // 300 - 50
    expect(result.clips[1].start).toBe(200); // 300 - 100
  });

  it('should use first clip as reference if no position given', () => {
    const clips = [
      createTestClip('1', 'track1', 100, 100, 'Clip 1'),
      createTestClip('2', 'track1', 200, 100, 'Clip 2'),
    ];

    const result = alignClips(clips, ['1', '2'], undefined, 'start');

    expect(result.clips.every(c => c.start === 100)).toBe(true);
  });

  it('should return original clips if no targets', () => {
    const clips = [createTestClip('1', 'track1', 0, 100, 'Clip 1')];

    const result = alignClips(clips, [], asTick(100));

    expect(result.clips).toEqual(clips);
  });
});
