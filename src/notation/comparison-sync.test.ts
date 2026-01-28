/**
 * @fileoverview Tests for Notation Comparison and Audio Sync.
 * 
 * @module @cardplay/core/notation/comparison-sync.test
 */

import { describe, it, expect } from 'vitest';
import {
  compareNotationMeasures,
  generateComparisonSummary,
  getComparisonHighlightClass,
  tickToAudioTime,
  audioTimeToTick,
  generateWaveformPeaks,
  generateWaveformRMS,
  type WaveformData,
  type TickToTimeMapping,
} from './comparison-sync';
import type { NotationMeasure, NotationEvent } from './types';
import { asTick } from '../types/primitives';

describe('Notation Comparison', () => {
  const createTestEvent = (pitch: number): NotationEvent => ({
    id: `test-${pitch}`,
    notes: [{ id: `note-${pitch}`, pitch }],
    duration: { base: 'quarter', dots: 0 },
    tick: 0,
    voice: 0,
    staff: 0,
    isRest: false,
  });
  
  const createTestMeasure = (events: NotationEvent[]): NotationMeasure => {
    const eventMap = new Map<number, NotationEvent[]>();
    eventMap.set(0, events);
    return {
      number: 1,
      events: eventMap,
    };
  };
  
  describe('compareNotationMeasures', () => {
    it('should detect added events', () => {
      const oldMeasures = [createTestMeasure([createTestEvent(60)])];
      const newMeasures = [createTestMeasure([createTestEvent(60), createTestEvent(62)])];
      
      const diffs = compareNotationMeasures(oldMeasures, newMeasures);
      const addedDiffs = diffs.filter(d => d.type === 'added');
      
      expect(addedDiffs).toHaveLength(1);
      expect(addedDiffs[0].newEvent?.notes[0].pitch).toBe(62);
    });
    
    it('should detect removed events', () => {
      const oldMeasures = [createTestMeasure([createTestEvent(60), createTestEvent(62)])];
      const newMeasures = [createTestMeasure([createTestEvent(60)])];
      
      const diffs = compareNotationMeasures(oldMeasures, newMeasures);
      const removedDiffs = diffs.filter(d => d.type === 'removed');
      
      expect(removedDiffs).toHaveLength(1);
      expect(removedDiffs[0].oldEvent?.notes[0].pitch).toBe(62);
    });
    
    it('should detect modified events', () => {
      const oldEvent = { ...createTestEvent(60), duration: { base: 'quarter' as const, dots: 0 } };
      const newEvent = { ...createTestEvent(60), duration: { base: 'half' as const, dots: 0 } };
      
      const oldMeasures = [createTestMeasure([oldEvent])];
      const newMeasures = [createTestMeasure([newEvent])];
      
      const diffs = compareNotationMeasures(oldMeasures, newMeasures);
      const modifiedDiffs = diffs.filter(d => d.type === 'modified');
      
      expect(modifiedDiffs).toHaveLength(1);
      expect(modifiedDiffs[0].description).toContain('duration');
    });
    
    it('should detect unchanged events', () => {
      const event = createTestEvent(60);
      const oldMeasures = [createTestMeasure([event])];
      const newMeasures = [createTestMeasure([{ ...event }])];
      
      const diffs = compareNotationMeasures(oldMeasures, newMeasures);
      const unchangedDiffs = diffs.filter(d => d.type === 'unchanged');
      
      expect(unchangedDiffs).toHaveLength(1);
    });
    
    it('should handle empty measures', () => {
      const diffs = compareNotationMeasures([], []);
      expect(diffs).toHaveLength(0);
    });
    
    it('should handle added measures', () => {
      const oldMeasures: NotationMeasure[] = [];
      const newMeasures = [createTestMeasure([createTestEvent(60)])];
      
      const diffs = compareNotationMeasures(oldMeasures, newMeasures);
      expect(diffs.filter(d => d.type === 'added')).toHaveLength(1);
    });
  });
  
  describe('generateComparisonSummary', () => {
    it('should count all diff types', () => {
      const event = createTestEvent(60);
      const diffs = [
        { type: 'added' as const, newEvent: createTestEvent(60), measureIndex: 0, voice: 0 },
        { type: 'added' as const, newEvent: createTestEvent(62), measureIndex: 0, voice: 0 },
        { type: 'removed' as const, oldEvent: createTestEvent(64), measureIndex: 0, voice: 0 },
        { type: 'modified' as const, oldEvent: event, newEvent: event, measureIndex: 0, voice: 0 },
        { type: 'unchanged' as const, oldEvent: event, newEvent: event, measureIndex: 0, voice: 0 },
      ];
      
      const summary = generateComparisonSummary(diffs);
      
      expect(summary.added).toBe(2);
      expect(summary.removed).toBe(1);
      expect(summary.modified).toBe(1);
      expect(summary.unchanged).toBe(1);
      expect(summary.totalChanges).toBe(4);
    });
  });
  
  describe('getComparisonHighlightClass', () => {
    it('should return correct CSS class for each diff type', () => {
      const event = createTestEvent(60);
      
      expect(getComparisonHighlightClass({
        type: 'added',
        newEvent: event,
        measureIndex: 0,
        voice: 0,
      })).toBe('notation-diff-added');
      
      expect(getComparisonHighlightClass({
        type: 'removed',
        oldEvent: event,
        measureIndex: 0,
        voice: 0,
      })).toBe('notation-diff-removed');
      
      expect(getComparisonHighlightClass({
        type: 'modified',
        oldEvent: event,
        newEvent: event,
        measureIndex: 0,
        voice: 0,
      })).toBe('notation-diff-modified');
      
      expect(getComparisonHighlightClass({
        type: 'unchanged',
        oldEvent: event,
        newEvent: event,
        measureIndex: 0,
        voice: 0,
      })).toBe('');
    });
  });
});

describe('Audio Sync Visualization', () => {
  const createTestMapping = (): TickToTimeMapping => ({
    tempo: 120,
    ticksPerQuarter: 480,
    audioOffsetSeconds: 0,
  });
  
  describe('tickToAudioTime', () => {
    it('should convert tick to audio time correctly', () => {
      const mapping = createTestMapping();
      
      // At 120 BPM, 1 beat = 0.5 seconds
      // 480 ticks = 1 beat = 0.5 seconds
      expect(tickToAudioTime(asTick(0), mapping)).toBe(0);
      expect(tickToAudioTime(asTick(480), mapping)).toBe(0.5);
      expect(tickToAudioTime(asTick(960), mapping)).toBe(1.0);
      expect(tickToAudioTime(asTick(1920), mapping)).toBe(2.0);
    });
    
    it('should respect audio offset', () => {
      const mapping: TickToTimeMapping = {
        ...createTestMapping(),
        audioOffsetSeconds: 1.0,
      };
      
      expect(tickToAudioTime(asTick(0), mapping)).toBe(1.0);
      expect(tickToAudioTime(asTick(480), mapping)).toBe(1.5);
    });
  });
  
  describe('audioTimeToTick', () => {
    it('should convert audio time to tick correctly', () => {
      const mapping = createTestMapping();
      
      expect(audioTimeToTick(0, mapping)).toBe(0);
      expect(audioTimeToTick(0.5, mapping)).toBe(480);
      expect(audioTimeToTick(1.0, mapping)).toBe(960);
      expect(audioTimeToTick(2.0, mapping)).toBe(1920);
    });
    
    it('should respect audio offset', () => {
      const mapping: TickToTimeMapping = {
        ...createTestMapping(),
        audioOffsetSeconds: 1.0,
      };
      
      expect(audioTimeToTick(1.0, mapping)).toBe(0);
      expect(audioTimeToTick(1.5, mapping)).toBe(480);
    });
    
    it('should be inverse of tickToAudioTime', () => {
      const mapping = createTestMapping();
      const testTicks = [0, 480, 960, 1920, 3840];
      
      for (const tick of testTicks) {
        const time = tickToAudioTime(asTick(tick), mapping);
        const backToTick = audioTimeToTick(time, mapping);
        expect(backToTick).toBeCloseTo(tick, 2);
      }
    });
  });
  
  describe('generateWaveformPeaks', () => {
    it('should generate correct number of peaks', () => {
      const audioData: WaveformData = {
        samples: new Float32Array([0.5, -0.3, 0.8, -0.6, 0.2, -0.1, 0.9, -0.7]),
        sampleRate: 44100,
        durationSeconds: 1.0,
        channels: 1,
      };
      
      const peaks = generateWaveformPeaks(audioData, 4);
      expect(peaks).toHaveLength(4);
    });
    
    it('should find min and max correctly', () => {
      const audioData: WaveformData = {
        samples: new Float32Array([0.5, -0.8, 0.3, -0.2]),
        sampleRate: 44100,
        durationSeconds: 1.0,
        channels: 1,
      };
      
      const peaks = generateWaveformPeaks(audioData, 2);
      
      expect(peaks[0].min).toBeCloseTo(-0.8, 5);
      expect(peaks[0].max).toBeCloseTo(0.5, 5);
      expect(peaks[1].min).toBeCloseTo(-0.2, 5);
      expect(peaks[1].max).toBeCloseTo(0.3, 5);
    });
  });
  
  describe('generateWaveformRMS', () => {
    it('should generate correct number of RMS values', () => {
      const audioData: WaveformData = {
        samples: new Float32Array(Array(1000).fill(0).map(() => Math.random() * 2 - 1)),
        sampleRate: 44100,
        durationSeconds: 1.0,
        channels: 1,
      };
      
      const rms = generateWaveformRMS(audioData, 100, 10);
      expect(rms).toHaveLength(10);
    });
    
    it('should calculate RMS correctly for known values', () => {
      // RMS of [1, 1, 1, 1] = 1.0
      const audioData: WaveformData = {
        samples: new Float32Array([1, 1, 1, 1]),
        sampleRate: 44100,
        durationSeconds: 1.0,
        channels: 1,
      };
      
      const rms = generateWaveformRMS(audioData, 4, 1);
      expect(rms[0]).toBeCloseTo(1.0, 2);
    });
    
    it('should handle all zeros', () => {
      const audioData: WaveformData = {
        samples: new Float32Array([0, 0, 0, 0]),
        sampleRate: 44100,
        durationSeconds: 1.0,
        channels: 1,
      };
      
      const rms = generateWaveformRMS(audioData, 4, 1);
      expect(rms[0]).toBe(0);
    });
  });
});
