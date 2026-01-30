/**
 * Tests for Dynamics Analyzer System
 */

import { describe, test, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateRMS,
  calculatePeak,
  estimateTruePeak,
  calculateLUFS,
  detectCompression,
  detectLimiting,
  generateRecommendation,
  DynamicsAnalyzerStore,
  DEFAULT_ANALYZER_CONFIG,
  DynamicsStats,
  CompressionAnalysis,
  LimitingAnalysis,
} from './dynamics-analyzer';

describe('Dynamics Analyzer', () => {
  // --------------------------------------------------------------------------
  // RMS Calculation
  // --------------------------------------------------------------------------
  
  describe('calculateRMS', () => {
    it('should calculate RMS for constant signal', () => {
      const samples = new Float32Array(1000).fill(0.5);
      const rms = calculateRMS(samples);
      expect(rms).toBeCloseTo(-6.02, 1); // 0.5 = -6 dB
    });
    
    it('should return -Infinity for empty array', () => {
      const samples = new Float32Array(0);
      expect(calculateRMS(samples)).toBe(-Infinity);
    });
    
    it('should return -Infinity for silent signal', () => {
      const samples = new Float32Array(1000).fill(0);
      expect(calculateRMS(samples)).toBe(-Infinity);
    });
    
    it('should calculate RMS for sine wave', () => {
      const samples = new Float32Array(4410);
      for (let i = 0; i < samples.length; i++) {
        samples[i] = Math.sin(2 * Math.PI * 440 * i / 44100);
      }
      const rms = calculateRMS(samples);
      // Sine wave RMS = peak / sqrt(2) = 1 / 1.414 = 0.707 = -3 dB
      expect(rms).toBeCloseTo(-3, 0);
    });
  });
  
  // --------------------------------------------------------------------------
  // Peak Calculation
  // --------------------------------------------------------------------------
  
  describe('calculatePeak', () => {
    it('should find peak in signal', () => {
      const samples = new Float32Array([0.1, 0.5, 0.8, 0.3, 0.1]);
      const peak = calculatePeak(samples);
      expect(peak).toBeCloseTo(-1.94, 1); // 0.8 = -1.94 dB
    });
    
    it('should handle negative peaks', () => {
      const samples = new Float32Array([0.1, -0.9, 0.3]);
      const peak = calculatePeak(samples);
      expect(peak).toBeCloseTo(-0.92, 1); // 0.9 = -0.92 dB
    });
    
    it('should return -Infinity for empty array', () => {
      expect(calculatePeak(new Float32Array(0))).toBe(-Infinity);
    });
    
    it('should return 0 dB for full scale', () => {
      const samples = new Float32Array([0.5, 1.0, 0.5]);
      expect(calculatePeak(samples)).toBeCloseTo(0, 1);
    });
  });
  
  // --------------------------------------------------------------------------
  // True Peak Estimation
  // --------------------------------------------------------------------------
  
  describe('estimateTruePeak', () => {
    it('should estimate true peak', () => {
      const samples = new Float32Array([0.1, 0.8, -0.2, 0.3]);
      const truePeak = estimateTruePeak(samples);
      expect(truePeak).toBeGreaterThanOrEqual(-2);
    });
    
    it('should detect inter-sample peaks', () => {
      const samples = new Float32Array([0.7, -0.7, 0.7, -0.7]);
      const peak = calculatePeak(samples);
      const truePeak = estimateTruePeak(samples);
      expect(truePeak).toBeGreaterThanOrEqual(peak);
    });
    
    it('should return -Infinity for empty array', () => {
      expect(estimateTruePeak(new Float32Array(0))).toBe(-Infinity);
    });
  });
  
  // --------------------------------------------------------------------------
  // LUFS Calculation
  // --------------------------------------------------------------------------
  
  describe('calculateLUFS', () => {
    it('should calculate LUFS', () => {
      const samples = new Float32Array(1000).fill(0.5);
      const lufs = calculateLUFS(samples, 48000);
      expect(lufs).toBeLessThan(0); // Should be negative dB
    });
    
    it('should be lower than RMS due to K-weighting offset', () => {
      const samples = new Float32Array(1000).fill(0.5);
      const rms = calculateRMS(samples);
      const lufs = calculateLUFS(samples, 48000);
      expect(lufs).toBeLessThan(rms);
    });
  });
  
  // --------------------------------------------------------------------------
  // Compression Detection
  // --------------------------------------------------------------------------
  
  describe('detectCompression', () => {
    it('should detect no compression when input equals output', () => {
      const peaks = [-20, -15, -10, -5, -3];
      const result = detectCompression(peaks, peaks);
      expect(result.detected).toBe(false);
      expect(result.estimatedRatio).toBeCloseTo(1, 0);
    });
    
    it('should detect compression when output is reduced', () => {
      const input = [-20, -15, -10, -5, 0];
      const output = [-20, -15, -12, -8, -6];
      const result = detectCompression(input, output);
      expect(result.detected).toBe(true);
      expect(result.gainReduction).toBeGreaterThan(0);
    });
    
    it('should return no detection for insufficient data', () => {
      const result = detectCompression([], []);
      expect(result.detected).toBe(false);
      expect(result.confidence).toBe(0);
    });
    
    it('should estimate compression ratio', () => {
      // Strong compression scenario with clear gain reduction
      const input = [-40, -30, -20, -10, 0, 10];
      const output = [-40, -30, -20, -12, -6, -3];
      const result = detectCompression(input, output);
      // Should at least detect that compression is happening
      expect(result.detected).toBe(true);
      // And estimate some ratio > 1
      expect(result.estimatedRatio).toBeGreaterThanOrEqual(1);
    });
  });
  
  // --------------------------------------------------------------------------
  // Limiting Detection
  // --------------------------------------------------------------------------
  
  describe('detectLimiting', () => {
    it('should detect limiting at ceiling', () => {
      const peaks = [-10, -5, -0.3, -0.3, -0.3, -0.3, -0.3, -0.3];
      const result = detectLimiting(peaks, -0.3);
      expect(result.detected).toBe(true);
    });
    
    it('should detect over-limiting', () => {
      const peaks = new Array(10).fill(-0.3);
      const result = detectLimiting(peaks, -0.3);
      expect(result.isOverLimited).toBe(true);
    });
    
    it('should count clips over ceiling', () => {
      const peaks = [-10, -5, 0, 0.1, 0.2];
      const result = detectLimiting(peaks, -0.3);
      expect(result.clipCount).toBe(3);
    });
    
    it('should handle empty array', () => {
      const result = detectLimiting([]);
      expect(result.detected).toBe(false);
      expect(result.clipCount).toBe(0);
    });
  });
  
  // --------------------------------------------------------------------------
  // Recommendation Generation
  // --------------------------------------------------------------------------
  
  describe('generateRecommendation', () => {
    const baseStats: DynamicsStats = {
      peakLevel: -3,
      rmsLevel: -12,
      lufs: -14,
      dynamicRange: 9,
      crestFactor: 2.8,
      truePeak: -2.5,
    };
    
    const noCompression: CompressionAnalysis = {
      detected: false,
      estimatedRatio: 1,
      estimatedThreshold: 0,
      estimatedAttack: 0,
      estimatedRelease: 0,
      gainReduction: 0,
      confidence: 0,
    };
    
    const noLimiting: LimitingAnalysis = {
      detected: false,
      ceiling: -0.3,
      gainReduction: 0,
      clipCount: 0,
      isOverLimited: false,
    };
    
    it('should return good for balanced dynamics', () => {
      const result = generateRecommendation(
        baseStats,
        noCompression,
        noLimiting,
        DEFAULT_ANALYZER_CONFIG
      );
      expect(result.level).toBe('good');
    });
    
    it('should warn about narrow dynamic range', () => {
      const narrowStats = { ...baseStats, dynamicRange: 3 };
      const result = generateRecommendation(
        narrowStats,
        noCompression,
        noLimiting,
        DEFAULT_ANALYZER_CONFIG
      );
      expect(result.level).toBe('warning');
      expect(result.message).toContain('over-compressed');
    });
    
    it('should warn about wide dynamic range', () => {
      const wideStats = { ...baseStats, dynamicRange: 25 };
      const result = generateRecommendation(
        wideStats,
        noCompression,
        noLimiting,
        DEFAULT_ANALYZER_CONFIG
      );
      expect(result.level).toBe('warning');
      expect(result.suggestions.some(s => s.includes('compression'))).toBe(true);
    });
    
    it('should report problem for over-limiting', () => {
      const overLimited: LimitingAnalysis = {
        ...noLimiting,
        detected: true,
        isOverLimited: true,
      };
      const result = generateRecommendation(
        baseStats,
        noCompression,
        overLimited,
        DEFAULT_ANALYZER_CONFIG
      );
      expect(result.level).toBe('problem');
      expect(result.message).toContain('over-limited');
    });
    
    it('should suggest LUFS adjustment when off target', () => {
      const loudStats = { ...baseStats, lufs: -8 };
      const result = generateRecommendation(
        loudStats,
        noCompression,
        noLimiting,
        DEFAULT_ANALYZER_CONFIG
      );
      expect(result.suggestions.some(s => s.includes('Reduce'))).toBe(true);
    });
  });
  
  // --------------------------------------------------------------------------
  // DynamicsAnalyzerStore
  // --------------------------------------------------------------------------
  
  describe('DynamicsAnalyzerStore', () => {
    let store: DynamicsAnalyzerStore;
    
    beforeEach(() => {
      store = new DynamicsAnalyzerStore();
    });
    
    describe('configuration', () => {
      it('should use default config', () => {
        const config = store.getConfig();
        expect(config.sampleRate).toBe(48000);
        expect(config.targetLufs).toBe(-14);
      });
      
      it('should accept custom config', () => {
        const customStore = new DynamicsAnalyzerStore({ targetLufs: -16 });
        expect(customStore.getConfig().targetLufs).toBe(-16);
      });
      
      it('should update config', () => {
        store.updateConfig({ targetDynamicRange: 10 });
        expect(store.getConfig().targetDynamicRange).toBe(10);
      });
    });
    
    describe('analysis', () => {
      it('should analyze samples', () => {
        const samples = new Float32Array(1000).fill(0.5);
        const assessment = store.analyze(samples);
        
        expect(assessment.stats.peakLevel).toBeDefined();
        expect(assessment.stats.rmsLevel).toBeDefined();
        expect(assessment.compression).toBeDefined();
        expect(assessment.limiting).toBeDefined();
        expect(assessment.recommendation).toBeDefined();
      });
      
      it('should store current assessment', () => {
        const samples = new Float32Array(1000).fill(0.5);
        store.analyze(samples);
        
        const current = store.getCurrentAssessment();
        expect(current).not.toBeNull();
      });
      
      it('should build history', () => {
        const samples = new Float32Array(1000).fill(0.5);
        
        store.analyze(samples);
        store.analyze(samples);
        store.analyze(samples);
        
        const history = store.getHistory();
        expect(history.length).toBe(3);
      });
    });
    
    describe('statistics', () => {
      it('should calculate average stats', () => {
        const samples = new Float32Array(1000).fill(0.5);
        store.analyze(samples);
        store.analyze(samples);
        
        const avgStats = store.getAverageStats();
        expect(avgStats).not.toBeNull();
        expect(avgStats!.peakLevel).toBeDefined();
      });
      
      it('should return null for empty history', () => {
        expect(store.getAverageStats()).toBeNull();
      });
      
      it('should track peak gain reduction', () => {
        const samples = new Float32Array(1000).fill(0.5);
        store.analyze(samples);
        
        const peakGR = store.getPeakGainReduction();
        expect(peakGR).toBeGreaterThanOrEqual(0);
      });
    });
    
    describe('reset', () => {
      it('should clear all data', () => {
        const samples = new Float32Array(1000).fill(0.5);
        store.analyze(samples);
        store.analyze(samples);
        
        store.reset();
        
        expect(store.getCurrentAssessment()).toBeNull();
        expect(store.getHistory()).toHaveLength(0);
        expect(store.getAverageStats()).toBeNull();
      });
    });
    
    describe('subscriptions', () => {
      it('should notify on analysis', () => {
        const listener = vi.fn();
        store.subscribe(listener);
        
        const samples = new Float32Array(1000).fill(0.5);
        store.analyze(samples);
        
        expect(listener).toHaveBeenCalled();
      });
      
      it('should support unsubscribe', () => {
        const listener = vi.fn();
        const unsubscribe = store.subscribe(listener);
        
        unsubscribe();
        
        const samples = new Float32Array(1000).fill(0.5);
        store.analyze(samples);
        
        expect(listener).not.toHaveBeenCalled();
      });
      
      it('should notify on reset', () => {
        const listener = vi.fn();
        store.subscribe(listener);
        
        store.reset();
        
        expect(listener).toHaveBeenCalledWith(null);
      });
    });
  });
});
