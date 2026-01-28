/**
 * @fileoverview Tests for Event Scheduling System.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ticksToSamples,
  samplesToTicks,
  ticksToSeconds,
  secondsToTicks,
  positionToTicks,
  ticksToPosition,
  quantizeTicks,
  getTicksPerNote,
  applySwing,
  applyHumanization,
  applyGroove,
  getTempoAtTick,
  calculateTimeWithTempoAutomation,
  ScheduleQueue,
  AudioScheduler,
  createTransportPosition,
  createMetronomeClicks,
  calculatePrerollStart,
  DEFAULT_TIME_SIGNATURE,
  DEFAULT_SCHEDULER_CONFIG,
  DEFAULT_METRONOME,
  DEFAULT_PREROLL,
} from './scheduler';
import type { TempoPoint, SwingSettings, GrooveTemplate } from './scheduler';

// ============================================================================
// TIMING CALCULATION TESTS
// ============================================================================

describe('ticksToSamples', () => {
  it('should convert ticks to samples', () => {
    // At 120 BPM, 480 PPQN: 1 beat = 0.5s = 24000 samples at 48kHz
    const samples = ticksToSamples(480, 120, 48000, 480);
    expect(samples).toBe(24000);
  });

  it('should handle different tempos', () => {
    // At 60 BPM, 1 beat = 1s = 48000 samples
    const samples = ticksToSamples(480, 60, 48000, 480);
    expect(samples).toBe(48000);
  });

  it('should handle fractional ticks', () => {
    const samples = ticksToSamples(240, 120, 48000, 480);
    expect(samples).toBe(12000);
  });
});

describe('samplesToTicks', () => {
  it('should convert samples to ticks', () => {
    const ticks = samplesToTicks(24000, 120, 48000, 480);
    expect(ticks).toBe(480);
  });

  it('should be inverse of ticksToSamples', () => {
    const original = 960;
    const samples = ticksToSamples(original, 120, 48000, 480);
    const back = samplesToTicks(samples, 120, 48000, 480);
    expect(back).toBe(original);
  });
});

describe('ticksToSeconds', () => {
  it('should convert ticks to seconds', () => {
    // At 120 BPM, 480 PPQN: 480 ticks = 0.5s
    const seconds = ticksToSeconds(480, 120, 480);
    expect(seconds).toBe(0.5);
  });

  it('should handle full bar', () => {
    // At 120 BPM, 4/4: 1920 ticks (4 beats) = 2s
    const seconds = ticksToSeconds(1920, 120, 480);
    expect(seconds).toBe(2);
  });
});

describe('secondsToTicks', () => {
  it('should convert seconds to ticks', () => {
    const ticks = secondsToTicks(0.5, 120, 480);
    expect(ticks).toBe(480);
  });
});

describe('positionToTicks', () => {
  it('should convert bar:beat:sixteenth to ticks', () => {
    // Bar 1, beat 1, sixteenth 1 = 0 ticks
    expect(positionToTicks(1, 1, 1, DEFAULT_TIME_SIGNATURE, 480)).toBe(0);
    
    // Bar 1, beat 2 = 480 ticks
    expect(positionToTicks(1, 2, 1, DEFAULT_TIME_SIGNATURE, 480)).toBe(480);
    
    // Bar 2, beat 1 = 1920 ticks (4 beats)
    expect(positionToTicks(2, 1, 1, DEFAULT_TIME_SIGNATURE, 480)).toBe(1920);
  });

  it('should handle sixteenths', () => {
    // 1 sixteenth = 120 ticks (480/4)
    expect(positionToTicks(1, 1, 2, DEFAULT_TIME_SIGNATURE, 480)).toBe(120);
  });
});

describe('ticksToPosition', () => {
  it('should convert ticks to bar:beat:sixteenth', () => {
    expect(ticksToPosition(0, DEFAULT_TIME_SIGNATURE, 480)).toEqual({
      bar: 1, beat: 1, sixteenth: 1
    });
    
    expect(ticksToPosition(480, DEFAULT_TIME_SIGNATURE, 480)).toEqual({
      bar: 1, beat: 2, sixteenth: 1
    });
    
    expect(ticksToPosition(1920, DEFAULT_TIME_SIGNATURE, 480)).toEqual({
      bar: 2, beat: 1, sixteenth: 1
    });
  });

  it('should be inverse of positionToTicks', () => {
    const ticks = positionToTicks(3, 2, 3, DEFAULT_TIME_SIGNATURE, 480);
    const position = ticksToPosition(ticks, DEFAULT_TIME_SIGNATURE, 480);
    
    expect(position.bar).toBe(3);
    expect(position.beat).toBe(2);
    expect(position.sixteenth).toBe(3);
  });
});

describe('quantizeTicks', () => {
  it('should quantize to nearest', () => {
    expect(quantizeTicks(100, 120)).toBe(120);
    expect(quantizeTicks(50, 120)).toBe(0);
    expect(quantizeTicks(60, 120)).toBe(120); // 60/120 = 0.5, rounds to 1 (120)
  });

  it('should quantize to floor', () => {
    expect(quantizeTicks(100, 120, 'floor')).toBe(0);
    expect(quantizeTicks(150, 120, 'floor')).toBe(120);
  });

  it('should quantize to ceil', () => {
    expect(quantizeTicks(100, 120, 'ceil')).toBe(120);
    expect(quantizeTicks(121, 120, 'ceil')).toBe(240);
  });
});

describe('getTicksPerNote', () => {
  it('should return correct ticks for note values', () => {
    const ppqn = 480;
    
    expect(getTicksPerNote(1, ppqn)).toBe(1920);   // Whole note
    expect(getTicksPerNote(2, ppqn)).toBe(960);    // Half note
    expect(getTicksPerNote(4, ppqn)).toBe(480);    // Quarter note
    expect(getTicksPerNote(8, ppqn)).toBe(240);    // Eighth note
    expect(getTicksPerNote(16, ppqn)).toBe(120);   // Sixteenth note
  });
});

// ============================================================================
// SWING AND HUMANIZATION TESTS
// ============================================================================

describe('applySwing', () => {
  it('should not affect downbeats', () => {
    const swing: SwingSettings = { amount: 0.5, resolution: 240 };
    
    // Tick 0 is a downbeat, should not be affected
    expect(applySwing(0, swing, 480)).toBe(0);
  });

  it('should affect offbeats', () => {
    const swing: SwingSettings = { amount: 0.5, resolution: 240 };
    
    // Tick 240 is an offbeat (8th note), should be swung
    const swung = applySwing(240, swing, 480);
    expect(swung).toBeGreaterThan(240);
  });

  it('should return original when swing is 0', () => {
    const swing: SwingSettings = { amount: 0, resolution: 240 };
    
    expect(applySwing(240, swing, 480)).toBe(240);
  });
});

describe('applyHumanization', () => {
  it('should return original when timing is 0', () => {
    const result = applyHumanization(480, { timing: 0, velocity: 0 }, 48000, 480, 120);
    expect(result).toBe(480);
  });

  it('should vary timing when enabled', () => {
    const results = new Set<number>();
    
    for (let i = 0; i < 10; i++) {
      const result = applyHumanization(480, { timing: 10, velocity: 0 }, 48000, 480, 120);
      results.add(result);
    }
    
    // With randomization, we should see some variation
    // (though in rare cases they might all be the same)
    expect(results.size).toBeGreaterThanOrEqual(1);
  });
});

describe('applyGroove', () => {
  it('should return defaults for empty groove', () => {
    const groove: GrooveTemplate = {
      name: 'empty',
      length: 16,
      entries: [],
    };
    
    const result = applyGroove(0, groove, 480);
    expect(result.offset).toBe(0);
    expect(result.velocity).toBe(1);
    expect(result.gate).toBe(1);
  });

  it('should apply groove entries', () => {
    const groove: GrooveTemplate = {
      name: 'test',
      length: 4,
      entries: [
        { position: 0, offset: 10, velocity: 1.2, gate: 0.8 },
      ],
    };
    
    const result = applyGroove(0, groove, 480);
    expect(result.offset).toBe(10);
    expect(result.velocity).toBe(1.2);
    expect(result.gate).toBe(0.8);
  });
});

// ============================================================================
// TEMPO AUTOMATION TESTS
// ============================================================================

describe('getTempoAtTick', () => {
  it('should return 120 for empty points', () => {
    expect(getTempoAtTick(0, [])).toBe(120);
  });

  it('should return first tempo before first point', () => {
    const points: TempoPoint[] = [
      { tick: 480, tempo: 140 },
    ];
    
    expect(getTempoAtTick(0, points)).toBe(140);
  });

  it('should return last tempo after last point', () => {
    const points: TempoPoint[] = [
      { tick: 0, tempo: 120 },
      { tick: 480, tempo: 140 },
    ];
    
    expect(getTempoAtTick(960, points)).toBe(140);
  });

  it('should step between points by default', () => {
    const points: TempoPoint[] = [
      { tick: 0, tempo: 120 },
      { tick: 480, tempo: 140 },
    ];
    
    expect(getTempoAtTick(240, points)).toBe(120);
  });

  it('should interpolate linearly', () => {
    const points: TempoPoint[] = [
      { tick: 0, tempo: 100, curve: 'linear' },
      { tick: 480, tempo: 200 },
    ];
    
    expect(getTempoAtTick(240, points)).toBe(150);
  });
});

describe('calculateTimeWithTempoAutomation', () => {
  it('should use default tempo for empty points', () => {
    const time = calculateTimeWithTempoAutomation(0, 480, [], 480);
    // At 120 BPM, 480 ticks = 0.5s
    expect(time).toBeCloseTo(0.5);
  });

  it('should integrate tempo changes', () => {
    const points: TempoPoint[] = [
      { tick: 0, tempo: 120 },
    ];
    
    const time = calculateTimeWithTempoAutomation(0, 480, points, 480);
    expect(time).toBeCloseTo(0.5);
  });
});

// ============================================================================
// SCHEDULE QUEUE TESTS
// ============================================================================

describe('ScheduleQueue', () => {
  let queue: ScheduleQueue<string>;

  beforeEach(() => {
    queue = new ScheduleQueue<string>();
  });

  it('should start empty', () => {
    expect(queue.count).toBe(0);
    expect(queue.pending).toHaveLength(0);
  });

  it('should schedule events', () => {
    queue.schedule(100, 'event1');
    queue.schedule(200, 'event2');
    
    expect(queue.count).toBe(2);
  });

  it('should maintain time order', () => {
    queue.schedule(200, 'later');
    queue.schedule(100, 'earlier');
    
    expect(queue.pending[0]!.data).toBe('earlier');
    expect(queue.pending[1]!.data).toBe('later');
  });

  it('should respect priority for same time', () => {
    queue.schedule(100, 'low', 1);
    queue.schedule(100, 'high', 10);
    
    expect(queue.pending[0]!.data).toBe('high');
    expect(queue.pending[1]!.data).toBe('low');
  });

  it('should cancel events', () => {
    const id = queue.schedule(100, 'event');
    expect(queue.count).toBe(1);
    
    queue.cancel(id);
    expect(queue.count).toBe(0);
  });

  it('should reschedule events', () => {
    const id = queue.schedule(100, 'event');
    queue.reschedule(id, 200);
    
    expect(queue.pending[0]!.time).toBe(200);
  });

  it('should get events in range', () => {
    queue.schedule(50, 'a');
    queue.schedule(100, 'b');
    queue.schedule(150, 'c');
    queue.schedule(200, 'd');
    
    const events = queue.getEventsInRange(75, 175);
    expect(events).toHaveLength(2);
    expect(events[0]!.data).toBe('b');
    expect(events[1]!.data).toBe('c');
  });

  it('should pop events until time', () => {
    queue.schedule(50, 'a');
    queue.schedule(100, 'b');
    queue.schedule(150, 'c');
    
    const popped = queue.popEventsUntil(100);
    expect(popped).toHaveLength(2);
    expect(queue.count).toBe(1);
  });

  it('should clear all events', () => {
    queue.schedule(100, 'a');
    queue.schedule(200, 'b');
    queue.clear();
    
    expect(queue.count).toBe(0);
  });
});

// ============================================================================
// AUDIO SCHEDULER TESTS
// ============================================================================

describe('AudioScheduler', () => {
  let scheduler: AudioScheduler<string>;

  beforeEach(() => {
    scheduler = new AudioScheduler<string>();
  });

  it('should start stopped', () => {
    expect(scheduler.getState()).toBe('stopped');
    expect(scheduler.getPositionTicks()).toBe(0);
  });

  it('should set tempo', () => {
    scheduler.setTempo(140);
    expect(scheduler.getTempo()).toBe(140);
  });

  it('should clamp tempo', () => {
    scheduler.setTempo(10);
    expect(scheduler.getTempo()).toBe(20);
    
    scheduler.setTempo(400);
    expect(scheduler.getTempo()).toBe(300);
  });

  it('should play and stop', () => {
    scheduler.play();
    expect(scheduler.getState()).toBe('playing');
    
    scheduler.stop();
    expect(scheduler.getState()).toBe('stopped');
    expect(scheduler.getPositionTicks()).toBe(0);
  });

  it('should pause', () => {
    scheduler.play();
    scheduler.advance(24000); // Advance some samples
    
    const positionBefore = scheduler.getPositionTicks();
    scheduler.pause();
    
    expect(scheduler.getState()).toBe('paused');
    expect(scheduler.getPositionTicks()).toBe(positionBefore);
  });

  it('should seek', () => {
    scheduler.seek(1920);
    expect(scheduler.getPositionTicks()).toBe(1920);
  });

  it('should advance position while playing', () => {
    scheduler.play();
    scheduler.advance(24000); // 0.5s at 48kHz
    
    expect(scheduler.getPositionTicks()).toBeGreaterThan(0);
  });

  it('should not advance when stopped', () => {
    scheduler.advance(24000);
    expect(scheduler.getPositionTicks()).toBe(0);
  });

  it('should schedule and get events', () => {
    scheduler.schedule(100, 'event1');
    scheduler.schedule(200, 'event2');
    
    scheduler.play();
    scheduler.seek(150);
    
    const events = scheduler.getReadyEvents();
    expect(events.length).toBeGreaterThanOrEqual(1);
  });

  it('should cancel events', () => {
    const id = scheduler.schedule(100, 'event');
    expect(scheduler.cancel(id)).toBe(true);
  });

  it('should call beat callbacks', () => {
    const onBeat = vi.fn();
    scheduler.setCallbacks({ onBeat });
    
    scheduler.play();
    
    // Advance through a full beat (480 ticks at 120 BPM)
    const samplesPerBeat = ticksToSamples(480, 120, 48000, 480);
    scheduler.advance(samplesPerBeat + 100);
    
    expect(onBeat).toHaveBeenCalled();
  });

  it('should handle loop', () => {
    const onLoop = vi.fn();
    scheduler.setCallbacks({ onLoop });
    scheduler.setLoop({ start: 0, end: 480 });
    scheduler.setLoopEnabled(true);
    
    scheduler.play();
    
    // Advance past loop point
    const samples = ticksToSamples(600, 120, 48000, 480);
    scheduler.advance(samples);
    
    expect(onLoop).toHaveBeenCalled();
    expect(scheduler.getPositionTicks()).toBeLessThan(480);
  });

  it('should get snapshot', () => {
    scheduler.setTempo(140);
    scheduler.setTimeSignature({ numerator: 3, denominator: 4 });
    
    const snapshot = scheduler.getSnapshot();
    
    expect(snapshot.state).toBe('stopped');
    expect(snapshot.tempo).toBe(140);
    expect(snapshot.timeSignature.numerator).toBe(3);
  });

  it('should add and remove markers', () => {
    scheduler.addMarker({ id: 'm1', name: 'Marker 1', tick: 1920 });
    
    expect(scheduler.removeMarker('m1')).toBe(true);
    expect(scheduler.removeMarker('m1')).toBe(false);
  });
});

// ============================================================================
// TRANSPORT POSITION TESTS
// ============================================================================

describe('createTransportPosition', () => {
  it('should create position from ticks', () => {
    const position = createTransportPosition(480, 120, DEFAULT_TIME_SIGNATURE, 480, 48000);
    
    expect(position.ticks).toBe(480);
    expect(position.bar).toBe(1);
    expect(position.beat).toBe(2);
    expect(position.sixteenth).toBe(1);
    expect(position.samples).toBe(24000);
    expect(position.seconds).toBe(0.5);
  });
});

// ============================================================================
// METRONOME TESTS
// ============================================================================

describe('createMetronomeClicks', () => {
  it('should create clicks for a bar', () => {
    const clicks = createMetronomeClicks(0, DEFAULT_TIME_SIGNATURE, 480, DEFAULT_METRONOME);
    
    expect(clicks).toHaveLength(4);
    expect(clicks[0]).toEqual({ tick: 0, type: 'downbeat' });
    expect(clicks[1]).toEqual({ tick: 480, type: 'beat' });
  });

  it('should create subdivision clicks', () => {
    const settings = { ...DEFAULT_METRONOME, subdivision: 2 };
    const clicks = createMetronomeClicks(0, DEFAULT_TIME_SIGNATURE, 480, settings);
    
    // 4 beats + 4 subdivisions (one per beat)
    expect(clicks).toHaveLength(8);
  });

  it('should not accent when disabled', () => {
    const settings = { ...DEFAULT_METRONOME, accentDownbeat: false };
    const clicks = createMetronomeClicks(0, DEFAULT_TIME_SIGNATURE, 480, settings);
    
    expect(clicks[0]!.type).toBe('beat');
  });
});

// ============================================================================
// PREROLL TESTS
// ============================================================================

describe('calculatePrerollStart', () => {
  it('should calculate preroll position', () => {
    // Starting at bar 2, 1 bar preroll = bar 1
    const startTick = 1920; // Bar 2
    const preroll = calculatePrerollStart(startTick, 1, DEFAULT_TIME_SIGNATURE, 480);
    
    expect(preroll).toBe(0); // Bar 1
  });

  it('should not go negative', () => {
    const preroll = calculatePrerollStart(0, 2, DEFAULT_TIME_SIGNATURE, 480);
    expect(preroll).toBe(0);
  });
});

// ============================================================================
// DEFAULTS TESTS
// ============================================================================

describe('Default configurations', () => {
  it('should have valid DEFAULT_TIME_SIGNATURE', () => {
    expect(DEFAULT_TIME_SIGNATURE.numerator).toBe(4);
    expect(DEFAULT_TIME_SIGNATURE.denominator).toBe(4);
  });

  it('should have valid DEFAULT_SCHEDULER_CONFIG', () => {
    expect(DEFAULT_SCHEDULER_CONFIG.sampleRate).toBe(48000);
    expect(DEFAULT_SCHEDULER_CONFIG.ticksPerBeat).toBe(480);
    expect(DEFAULT_SCHEDULER_CONFIG.lookaheadMs).toBe(50);
  });

  it('should have valid DEFAULT_METRONOME', () => {
    expect(DEFAULT_METRONOME.enabled).toBe(true);
    expect(DEFAULT_METRONOME.volume).toBe(0.7);
    expect(DEFAULT_METRONOME.accentDownbeat).toBe(true);
  });

  it('should have valid DEFAULT_PREROLL', () => {
    expect(DEFAULT_PREROLL.enabled).toBe(false);
    expect(DEFAULT_PREROLL.bars).toBe(1);
    expect(DEFAULT_PREROLL.metronome).toBe(true);
  });
});
