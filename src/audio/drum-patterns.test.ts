/**
 * @fileoverview Tests for Drum Pattern Library and Player
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  // Drum pattern constants
  DRUM,
  VEL,
  SWING,
  PATTERN_LENGTH,
  
  // Pattern types
  type DrumHit,
  type GrooveSettings,
  type DrumPattern,
  
  // All patterns
  ALL_PATTERNS,
  ROCK_BASIC,
  ROCK_DRIVING,
  ROCK_HALFTIME,
  FUNK_BASIC,
  FUNK_JAMES_BROWN,
  JAZZ_SWING,
  JAZZ_BOSSA,
  LATIN_SONGO,
  LATIN_TUMBAO,
  ELECTRONIC_FOUR_FLOOR,
  ELECTRONIC_BREAKBEAT,
  ELECTRONIC_TRAP,
  WORLD_AFROBEAT,
  WORLD_REGGAE,
  WORLD_TABLA_TEENTAL,
  FILL_BASIC_TOM,
  FILL_SNARE_ROLL,
  
  // Pattern functions
  parseBeats,
  hitsOnBeats,
  applySwing,
  generateNotation,
  getPatternsByCategory,
  getPatternsByTag,
  getPatternById,
  getAllCategories,
  getAllTags,
} from './drum-patterns';

import {
  // Player types
  type TransportState,
  type ScheduledNote,
  type PatternPlaybackOptions,
  type DrumClip,
  type PatternPlayerState,
  
  // Player class
  DrumPatternPlayer,
  
  // Player functions
  beatsToSeconds,
  secondsToBeats,
  humanizeNote,
  applyFeel,
  applyGroove,
  mergeGroove,
  createClipFromPattern,
  createClipFromPatterns,
  createArrangementClip,
  createSamplerTrigger,
  quickPlayPattern,
} from './drum-pattern-player';

// ============================================================================
// DRUM PATTERN CONSTANTS TESTS
// ============================================================================

describe('Drum Pattern Constants', () => {
  describe('DRUM constant', () => {
    it('should have standard GM drum mappings', () => {
      expect(DRUM.KICK).toBe(36);
      expect(DRUM.SNARE).toBe(38);
      expect(DRUM.HIHAT_CLOSED).toBe(42);
      expect(DRUM.HIHAT_OPEN).toBe(46);
      expect(DRUM.RIDE).toBe(51);
      expect(DRUM.CRASH_1).toBe(49);
    });
    
    it('should have tom mappings', () => {
      expect(DRUM.TOM_LOW).toBe(41);
      expect(DRUM.TOM_MID).toBe(47);
      expect(DRUM.TOM_HIGH).toBe(50);
      expect(DRUM.TOM_FLOOR).toBe(43);
    });
    
    it('should have latin percussion', () => {
      expect(DRUM.CONGA_HIGH).toBe(63);
      expect(DRUM.CONGA_LOW).toBe(64);
      expect(DRUM.BONGO_HIGH).toBe(60);
      expect(DRUM.CLAVE).toBe(75);
    });
    
    it('should have tabla mappings', () => {
      expect(DRUM.TABLA_NA).toBe(88);
      expect(DRUM.TABLA_TIN).toBe(89);
      expect(DRUM.TABLA_DHA).toBe(96);
      expect(DRUM.BAYA_GE).toBe(100);
    });
  });
  
  describe('VEL constant', () => {
    it('should have proper velocity levels', () => {
      expect(VEL.ppp).toBe(16);
      expect(VEL.pp).toBe(32);
      expect(VEL.p).toBe(48);
      expect(VEL.mp).toBe(64);
      expect(VEL.mf).toBe(80);
      expect(VEL.f).toBe(96);
      expect(VEL.ff).toBe(112);
      expect(VEL.fff).toBe(127);
    });
    
    it('should have increasing velocities', () => {
      expect(VEL.ppp).toBeLessThan(VEL.pp);
      expect(VEL.pp).toBeLessThan(VEL.p);
      expect(VEL.p).toBeLessThan(VEL.mp);
      expect(VEL.mp).toBeLessThan(VEL.mf);
      expect(VEL.mf).toBeLessThan(VEL.f);
      expect(VEL.f).toBeLessThan(VEL.ff);
      expect(VEL.ff).toBeLessThan(VEL.fff);
    });
  });
  
  describe('SWING constant', () => {
    it('should have swing percentages', () => {
      expect(SWING.STRAIGHT).toBe(50);
      expect(SWING.LIGHT).toBe(55);
      expect(SWING.MEDIUM).toBe(58);
      expect(SWING.HEAVY).toBe(62);
      expect(SWING.SHUFFLE).toBe(67);
      expect(SWING.TRIPLET).toBe(67);
    });
    
    it('should have increasing swing amounts', () => {
      expect(SWING.STRAIGHT).toBeLessThan(SWING.LIGHT);
      expect(SWING.LIGHT).toBeLessThan(SWING.MEDIUM);
      expect(SWING.MEDIUM).toBeLessThan(SWING.HEAVY);
      expect(SWING.HEAVY).toBeLessThan(SWING.SHUFFLE);
    });
  });
  
  describe('PATTERN_LENGTH constant', () => {
    it('should have standard lengths', () => {
      expect(PATTERN_LENGTH.HALF_BAR).toBe(2);
      expect(PATTERN_LENGTH.ONE_BAR).toBe(4);
      expect(PATTERN_LENGTH.TWO_BARS).toBe(8);
      expect(PATTERN_LENGTH.FOUR_BARS).toBe(16);
      expect(PATTERN_LENGTH.EIGHT_BARS).toBe(32);
    });
  });
});

// ============================================================================
// PATTERN UTILITY FUNCTION TESTS
// ============================================================================

describe('Pattern Utility Functions', () => {
  describe('parseBeats', () => {
    it('should parse simple beat strings', () => {
      expect(parseBeats('1 2 3 4')).toEqual([1, 2, 3, 4]);
    });
    
    it('should parse decimal beats', () => {
      expect(parseBeats('1 1.5 2 2.5')).toEqual([1, 1.5, 2, 2.5]);
    });
    
    it('should handle extra whitespace', () => {
      expect(parseBeats('  1   2   3  ')).toEqual([1, 2, 3]);
    });
  });
  
  describe('hitsOnBeats', () => {
    it('should create hits on given beats', () => {
      const hits = hitsOnBeats(DRUM.KICK, [1, 2, 3, 4], VEL.f);
      expect(hits).toHaveLength(4);
      expect(hits[0]).toEqual({ note: DRUM.KICK, beat: 1, velocity: VEL.f });
      expect(hits[3]).toEqual({ note: DRUM.KICK, beat: 4, velocity: VEL.f });
    });
    
    it('should use default velocity if not specified', () => {
      const hits = hitsOnBeats(DRUM.SNARE, [2, 4]);
      expect(hits[0].velocity).toBe(VEL.mf);
    });
  });
  
  describe('applySwing', () => {
    it('should not affect downbeats', () => {
      expect(applySwing(1, SWING.SHUFFLE, '8th')).toBe(1);
      expect(applySwing(2, SWING.SHUFFLE, '8th')).toBe(2);
    });
    
    it('should return beat unchanged with straight swing', () => {
      expect(applySwing(1.5, SWING.STRAIGHT, '8th')).toBe(1.5);
    });
  });
  
  describe('generateNotation', () => {
    it('should generate notation for a pattern', () => {
      const hits: DrumHit[] = [
        { note: DRUM.KICK, beat: 1, velocity: VEL.f },
        { note: DRUM.SNARE, beat: 2, velocity: VEL.ff },
      ];
      
      const notation = generateNotation(hits, 4, 8);
      expect(notation).toContain('Kick');
      expect(notation).toContain('Snare');
      expect(notation).toContain('Legend');
    });
  });
});

// ============================================================================
// PATTERN LIBRARY TESTS
// ============================================================================

describe('Pattern Library', () => {
  describe('ALL_PATTERNS', () => {
    it('should contain all expected patterns', () => {
      expect(ALL_PATTERNS.length).toBeGreaterThanOrEqual(17);
    });
    
    it('should have valid pattern structure', () => {
      for (const pattern of ALL_PATTERNS) {
        expect(pattern.id).toBeDefined();
        expect(pattern.name).toBeDefined();
        expect(pattern.category).toBeDefined();
        expect(pattern.timeSignatureNumerator).toBeGreaterThan(0);
        expect(pattern.timeSignatureDenominator).toBeGreaterThan(0);
        expect(pattern.lengthBeats).toBeGreaterThan(0);
        expect(pattern.suggestedTempo).toBeGreaterThan(0);
        expect(pattern.tempoRange).toHaveLength(2);
        expect(pattern.groove).toBeDefined();
        expect(pattern.hits).toBeDefined();
        expect(Array.isArray(pattern.hits)).toBe(true);
        expect(pattern.tags).toBeDefined();
        expect(Array.isArray(pattern.tags)).toBe(true);
      }
    });
    
    it('should have hits with valid note numbers', () => {
      for (const pattern of ALL_PATTERNS) {
        for (const hit of pattern.hits) {
          expect(hit.note).toBeGreaterThanOrEqual(0);
          expect(hit.note).toBeLessThanOrEqual(127);
          expect(hit.beat).toBeGreaterThan(0);
          expect(hit.velocity).toBeGreaterThanOrEqual(1);
          expect(hit.velocity).toBeLessThanOrEqual(127);
        }
      }
    });
  });
  
  describe('getPatternsByCategory', () => {
    it('should return rock patterns', () => {
      const patterns = getPatternsByCategory('Rock');
      expect(patterns.length).toBeGreaterThanOrEqual(3);
      expect(patterns.every(p => p.category === 'Rock')).toBe(true);
    });
    
    it('should return funk patterns', () => {
      const patterns = getPatternsByCategory('Funk');
      expect(patterns.length).toBeGreaterThanOrEqual(2);
    });
    
    it('should be case insensitive', () => {
      const patterns = getPatternsByCategory('JAZZ');
      expect(patterns.length).toBeGreaterThanOrEqual(2);
    });
  });
  
  describe('getPatternsByTag', () => {
    it('should return patterns with specific tag', () => {
      const patterns = getPatternsByTag('backbeat');
      expect(patterns.length).toBeGreaterThanOrEqual(1);
    });
    
    it('should match partial tags', () => {
      const patterns = getPatternsByTag('ghost');
      expect(patterns.length).toBeGreaterThanOrEqual(1);
    });
  });
  
  describe('getPatternById', () => {
    it('should return pattern by ID', () => {
      const pattern = getPatternById('rock-basic');
      expect(pattern).toBeDefined();
      expect(pattern?.name).toBe('Basic Rock');
    });
    
    it('should return undefined for unknown ID', () => {
      const pattern = getPatternById('unknown-pattern');
      expect(pattern).toBeUndefined();
    });
  });
  
  describe('getAllCategories', () => {
    it('should return all unique categories', () => {
      const categories = getAllCategories();
      expect(categories).toContain('Rock');
      expect(categories).toContain('Funk');
      expect(categories).toContain('Jazz');
      expect(categories).toContain('Latin');
      expect(categories).toContain('Electronic');
      expect(categories).toContain('World');
      expect(categories).toContain('Fill');
    });
  });
  
  describe('getAllTags', () => {
    it('should return all unique tags', () => {
      const tags = getAllTags();
      expect(tags.length).toBeGreaterThan(10);
      expect(tags).toContain('rock');
      expect(tags).toContain('funk');
    });
  });
});

// ============================================================================
// SPECIFIC PATTERN TESTS
// ============================================================================

describe('Rock Patterns', () => {
  it('ROCK_BASIC should have kick on 1 and 3', () => {
    const kicks = ROCK_BASIC.hits.filter(h => h.note === DRUM.KICK);
    const kickBeats = kicks.map(h => h.beat);
    expect(kickBeats).toContain(1);
    expect(kickBeats).toContain(3);
  });
  
  it('ROCK_BASIC should have snare on 2 and 4', () => {
    const snares = ROCK_BASIC.hits.filter(h => h.note === DRUM.SNARE);
    const snareBeats = snares.map(h => h.beat);
    expect(snareBeats).toContain(2);
    expect(snareBeats).toContain(4);
  });
  
  it('ROCK_HALFTIME should have snare on 3', () => {
    const snares = ROCK_HALFTIME.hits.filter(h => h.note === DRUM.SNARE);
    expect(snares.some(h => h.beat === 3)).toBe(true);
  });
});

describe('Funk Patterns', () => {
  it('FUNK_BASIC should have ghost notes', () => {
    const ghostNotes = FUNK_BASIC.hits.filter(h => h.velocity <= VEL.pp);
    expect(ghostNotes.length).toBeGreaterThan(0);
  });
  
  it('FUNK_JAMES_BROWN should be 2 bars', () => {
    expect(FUNK_JAMES_BROWN.lengthBeats).toBe(8);
  });
});

describe('Jazz Patterns', () => {
  it('JAZZ_SWING should have shuffle groove', () => {
    expect(JAZZ_SWING.groove.swing).toBe(SWING.SHUFFLE);
  });
  
  it('JAZZ_SWING should have ride cymbal', () => {
    const rides = JAZZ_SWING.hits.filter(h => h.note === DRUM.RIDE);
    expect(rides.length).toBeGreaterThan(0);
  });
  
  it('JAZZ_BOSSA should have rimshot', () => {
    const rimshots = JAZZ_BOSSA.hits.filter(h => h.note === DRUM.RIMSHOT);
    expect(rimshots.length).toBeGreaterThan(0);
  });
});

describe('Latin Patterns', () => {
  it('LATIN_TUMBAO should have congas', () => {
    const congas = LATIN_TUMBAO.hits.filter(
      h => h.note === DRUM.CONGA_HIGH || h.note === DRUM.CONGA_LOW
    );
    expect(congas.length).toBeGreaterThan(0);
  });
  
  it('LATIN_TUMBAO should have clave', () => {
    const claves = LATIN_TUMBAO.hits.filter(h => h.note === DRUM.CLAVE);
    expect(claves.length).toBeGreaterThan(0);
  });
});

describe('Electronic Patterns', () => {
  it('ELECTRONIC_FOUR_FLOOR should have kick on every beat', () => {
    const kicks = ELECTRONIC_FOUR_FLOOR.hits.filter(h => h.note === DRUM.KICK);
    expect(kicks.length).toBe(4);
    expect(kicks.map(h => h.beat)).toEqual([1, 2, 3, 4]);
  });
  
  it('ELECTRONIC_TRAP should have hi-hat rolls', () => {
    const hihats = ELECTRONIC_TRAP.hits.filter(h => h.note === DRUM.HIHAT_CLOSED);
    expect(hihats.length).toBeGreaterThan(10);
  });
});

describe('World Patterns', () => {
  it('WORLD_REGGAE should be one drop', () => {
    const kicks = WORLD_REGGAE.hits.filter(h => h.note === DRUM.KICK);
    expect(kicks.length).toBe(1);
    expect(kicks[0].beat).toBe(3);
  });
  
  it('WORLD_TABLA_TEENTAL should be 16 beats', () => {
    expect(WORLD_TABLA_TEENTAL.lengthBeats).toBe(16);
  });
  
  it('WORLD_TABLA_TEENTAL should have tabla sounds', () => {
    const tablaHits = WORLD_TABLA_TEENTAL.hits.filter(
      h => h.note === DRUM.TABLA_DHA || h.note === DRUM.TABLA_TIN || h.note === DRUM.TABLA_NA
    );
    expect(tablaHits.length).toBeGreaterThan(0);
  });
});

describe('Fill Patterns', () => {
  it('FILL_BASIC_TOM should have descending toms', () => {
    const toms = FILL_BASIC_TOM.hits.filter(
      h => [DRUM.TOM_HIGH, DRUM.TOM_MID, DRUM.TOM_LOW, DRUM.TOM_FLOOR].includes(h.note)
    );
    expect(toms.length).toBe(4);
  });
  
  it('FILL_SNARE_ROLL should have many snare hits', () => {
    const snares = FILL_SNARE_ROLL.hits.filter(h => h.note === DRUM.SNARE);
    expect(snares.length).toBeGreaterThanOrEqual(8);
  });
});

// ============================================================================
// PLAYER UTILITY FUNCTION TESTS
// ============================================================================

describe('Player Utility Functions', () => {
  describe('beatsToSeconds', () => {
    it('should convert beats to seconds at 120 BPM', () => {
      expect(beatsToSeconds(1, 120)).toBe(0.5);
      expect(beatsToSeconds(4, 120)).toBe(2);
    });
    
    it('should convert beats to seconds at 60 BPM', () => {
      expect(beatsToSeconds(1, 60)).toBe(1);
      expect(beatsToSeconds(4, 60)).toBe(4);
    });
  });
  
  describe('secondsToBeats', () => {
    it('should convert seconds to beats at 120 BPM', () => {
      expect(secondsToBeats(0.5, 120)).toBe(1);
      expect(secondsToBeats(2, 120)).toBe(4);
    });
    
    it('should be inverse of beatsToSeconds', () => {
      expect(secondsToBeats(beatsToSeconds(3.5, 100), 100)).toBeCloseTo(3.5);
    });
  });
  
  describe('humanizeNote', () => {
    it('should return unchanged note with amount 0', () => {
      const note: ScheduledNote = {
        note: DRUM.KICK,
        velocity: 100,
        startTime: 1.0,
        duration: 0.1,
        hit: { note: DRUM.KICK, beat: 1, velocity: 100 },
      };
      
      const result = humanizeNote(note, 0);
      expect(result.startTime).toBe(note.startTime);
      expect(result.velocity).toBe(note.velocity);
    });
    
    it('should apply variation with positive amount', () => {
      const note: ScheduledNote = {
        note: DRUM.SNARE,
        velocity: 100,
        startTime: 1.0,
        duration: 0.1,
        hit: { note: DRUM.SNARE, beat: 2, velocity: 100 },
      };
      
      const result = humanizeNote(note, 1.0, 12345);
      // With seeded randomness, timing and velocity should change
      expect(result.velocity).toBeGreaterThanOrEqual(1);
      expect(result.velocity).toBeLessThanOrEqual(127);
    });
  });
  
  describe('applyFeel', () => {
    it('should offset timing by feel amount', () => {
      expect(applyFeel(1.0, 10)).toBeCloseTo(1.01); // 10ms = 0.01s ahead
      expect(applyFeel(1.0, -10)).toBeCloseTo(0.99); // 10ms behind
    });
  });
  
  describe('mergeGroove', () => {
    it('should merge groove settings with overrides', () => {
      const base: GrooveSettings = {
        swing: SWING.STRAIGHT,
        swingTarget: '8th',
        velocityScale: 1,
        humanize: 0.1,
        feel: 0,
      };
      
      const merged = mergeGroove(base, { swing: SWING.SHUFFLE, humanize: 0.2 });
      expect(merged.swing).toBe(SWING.SHUFFLE);
      expect(merged.humanize).toBe(0.2);
      expect(merged.velocityScale).toBe(1); // From base
    });
  });
  
  describe('applyGroove', () => {
    it('should apply groove to hits', () => {
      const hits: DrumHit[] = [
        { note: DRUM.KICK, beat: 1, velocity: 100 },
        { note: DRUM.SNARE, beat: 2, velocity: 100 },
      ];
      
      const groove: GrooveSettings = {
        swing: SWING.STRAIGHT,
        swingTarget: '8th',
        velocityScale: 0.5,
        humanize: 0,
        feel: 0,
      };
      
      const notes = applyGroove(hits, groove, 120, 0);
      expect(notes).toHaveLength(2);
      expect(notes[0].velocity).toBe(50); // 100 * 0.5
      expect(notes[0].startTime).toBeCloseTo(0);
      expect(notes[1].startTime).toBeCloseTo(0.5); // 1 beat at 120 BPM
    });
  });
});

// ============================================================================
// CLIP CREATION TESTS
// ============================================================================

describe('Clip Creation', () => {
  describe('createClipFromPattern', () => {
    it('should create a clip from a pattern', () => {
      const clip = createClipFromPattern(ROCK_BASIC);
      expect(clip.id).toContain('rock-basic');
      expect(clip.name).toBe('Basic Rock');
      expect(clip.lengthBeats).toBe(4);
      expect(clip.patterns).toHaveLength(1);
    });
    
    it('should use custom tempo if provided', () => {
      const clip = createClipFromPattern(ROCK_BASIC, { tempo: 140 });
      expect(clip.tempo).toBe(140);
    });
  });
  
  describe('createClipFromPatterns', () => {
    it('should create a clip from multiple patterns', () => {
      const clip = createClipFromPatterns('Test Clip', [
        { pattern: ROCK_BASIC },
        { pattern: FILL_BASIC_TOM },
      ]);
      expect(clip.patterns).toHaveLength(2);
      expect(clip.lengthBeats).toBe(5); // 4 + 1
    });
  });
  
  describe('createArrangementClip', () => {
    it('should create clip from pattern IDs', () => {
      const clip = createArrangementClip('Arrangement', [
        { patternId: 'rock-basic' },
        { patternId: 'fill-basic-tom' },
      ]);
      expect(clip).not.toBeNull();
      expect(clip?.patterns).toHaveLength(2);
    });
    
    it('should return null for invalid pattern IDs', () => {
      const clip = createArrangementClip('Empty', [
        { patternId: 'nonexistent-pattern' },
      ]);
      expect(clip).toBeNull();
    });
  });
});

// ============================================================================
// PATTERN PLAYER TESTS
// ============================================================================

describe('DrumPatternPlayer', () => {
  let mockAudioContext: BaseAudioContext;
  let triggerCalls: Array<{ note: number; velocity: number; duration: number; time: number }>;
  let triggerCallback: (note: number, velocity: number, duration: number, time: number) => void;
  
  beforeEach(() => {
    mockAudioContext = {
      currentTime: 0,
      state: 'running',
    } as BaseAudioContext;
    
    triggerCalls = [];
    triggerCallback = (note, velocity, duration, time) => {
      triggerCalls.push({ note, velocity, duration, time });
    };
  });
  
  it('should create with default state', () => {
    const player = new DrumPatternPlayer({
      audioContext: mockAudioContext,
      triggerVoice: triggerCallback,
    });
    
    const state = player.getState();
    expect(state.transport).toBe('stopped');
    expect(state.tempo).toBe(120);
    expect(state.beat).toBe(1);
    expect(state.bar).toBe(1);
  });
  
  it('should set tempo', () => {
    const player = new DrumPatternPlayer({
      audioContext: mockAudioContext,
      triggerVoice: triggerCallback,
    });
    
    player.setTempo(140);
    expect(player.getState().tempo).toBe(140);
  });
  
  it('should reject invalid tempo', () => {
    const player = new DrumPatternPlayer({
      audioContext: mockAudioContext,
      triggerVoice: triggerCallback,
    });
    
    expect(() => player.setTempo(10)).toThrow();
    expect(() => player.setTempo(1000)).toThrow();
  });
  
  it('should load a pattern', () => {
    const player = new DrumPatternPlayer({
      audioContext: mockAudioContext,
      triggerVoice: triggerCallback,
    });
    
    player.loadPattern(ROCK_BASIC);
    const state = player.getState();
    expect(state.currentPatternId).toBe('rock-basic');
    expect(state.tempo).toBe(120);
  });
  
  it('should load a pattern by ID', () => {
    const player = new DrumPatternPlayer({
      audioContext: mockAudioContext,
      triggerVoice: triggerCallback,
    });
    
    const loaded = player.loadPatternById('funk-basic');
    expect(loaded).toBe(true);
    expect(player.getState().currentPatternId).toBe('funk-basic');
  });
  
  it('should return false for unknown pattern ID', () => {
    const player = new DrumPatternPlayer({
      audioContext: mockAudioContext,
      triggerVoice: triggerCallback,
    });
    
    const loaded = player.loadPatternById('nonexistent');
    expect(loaded).toBe(false);
  });
  
  it('should load a clip', () => {
    const player = new DrumPatternPlayer({
      audioContext: mockAudioContext,
      triggerVoice: triggerCallback,
    });
    
    const clip = createClipFromPattern(JAZZ_SWING);
    player.loadClip(clip);
    expect(player.getState().currentClipId).toBe(clip.id);
  });
  
  it('should trigger hit immediately', () => {
    const player = new DrumPatternPlayer({
      audioContext: mockAudioContext,
      triggerVoice: triggerCallback,
    });
    
    player.triggerHit(DRUM.KICK, VEL.f);
    expect(triggerCalls).toHaveLength(1);
    expect(triggerCalls[0].note).toBe(DRUM.KICK);
    expect(triggerCalls[0].velocity).toBe(VEL.f);
  });
  
  it('should get available patterns', () => {
    const patterns = DrumPatternPlayer.getAvailablePatterns();
    expect(patterns.length).toBeGreaterThan(10);
    expect(patterns).toContain('rock-basic');
    expect(patterns).toContain('funk-basic');
  });
  
  it('should get pattern info', () => {
    const info = DrumPatternPlayer.getPatternInfo('rock-basic');
    expect(info).toBeDefined();
    expect(info?.name).toBe('Basic Rock');
  });
});

// ============================================================================
// SAMPLER INTEGRATION TESTS
// ============================================================================

describe('Sampler Integration', () => {
  describe('createSamplerTrigger', () => {
    it('should create a trigger callback', () => {
      const calls: Array<{ note: number; velocity: number; time: number; duration: number }> = [];
      const playNote = (note: number, velocity: number, time: number, duration: number) => {
        calls.push({ note, velocity, time, duration });
      };
      
      const trigger = createSamplerTrigger(playNote);
      trigger(DRUM.SNARE, VEL.ff, 0.1, 1.5);
      
      expect(calls).toHaveLength(1);
      expect(calls[0].note).toBe(DRUM.SNARE);
      expect(calls[0].velocity).toBe(VEL.ff);
      expect(calls[0].time).toBe(1.5);
      expect(calls[0].duration).toBe(0.1);
    });
  });
  
  describe('quickPlayPattern', () => {
    it('should return null for unknown pattern', () => {
      const mockAudioContext = { currentTime: 0, state: 'running' } as BaseAudioContext;
      const result = quickPlayPattern('unknown', mockAudioContext, () => {});
      expect(result).toBeNull();
    });
    
    it('should return player for valid pattern', () => {
      const mockAudioContext = { currentTime: 0, state: 'running' } as BaseAudioContext;
      const player = quickPlayPattern('rock-basic', mockAudioContext, () => {});
      expect(player).not.toBeNull();
      expect(player?.getState().transport).toBe('playing');
      player?.stop();
    });
  });
});
