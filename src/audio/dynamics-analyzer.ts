/**
 * Dynamics Analyzer System
 * 
 * Implements M295: Add dynamics analyzer showing compression/limiting.
 * Provides real-time analysis of dynamic range and compression behavior.
 */

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

/** Dynamic range statistics */
export interface DynamicsStats {
  peakLevel: number; // dBFS
  rmsLevel: number; // dBFS
  lufs: number; // LUFS (Loudness Units Full Scale)
  dynamicRange: number; // dB difference between peak and RMS
  crestFactor: number; // Peak to RMS ratio
  truePeak: number; // dBTP
}

/** Compression detection result */
export interface CompressionAnalysis {
  detected: boolean;
  estimatedRatio: number; // 1:1, 2:1, 4:1, etc.
  estimatedThreshold: number; // dB
  estimatedAttack: number; // ms
  estimatedRelease: number; // ms
  gainReduction: number; // dB
  confidence: number; // 0-1
}

/** Limiting detection result */
export interface LimitingAnalysis {
  detected: boolean;
  ceiling: number; // dB
  gainReduction: number; // dB
  clipCount: number; // Number of potential clips
  isOverLimited: boolean;
}

/** Overall dynamics assessment */
export interface DynamicsAssessment {
  stats: DynamicsStats;
  compression: CompressionAnalysis;
  limiting: LimitingAnalysis;
  recommendation: DynamicsRecommendation;
  timestamp: number;
}

/** Dynamics recommendation */
export interface DynamicsRecommendation {
  level: 'good' | 'warning' | 'problem';
  message: string;
  suggestions: string[];
}

/** Historical dynamics data point */
export interface DynamicsHistoryPoint {
  timestamp: number;
  peak: number;
  rms: number;
  gainReduction: number;
}

/** Analyzer configuration */
export interface DynamicsAnalyzerConfig {
  sampleRate: number;
  windowSizeMs: number;
  overlapPercent: number;
  historyLengthSeconds: number;
  targetLufs: number;
  targetDynamicRange: number;
}

// --------------------------------------------------------------------------
// Default configuration
// --------------------------------------------------------------------------

export const DEFAULT_ANALYZER_CONFIG: DynamicsAnalyzerConfig = {
  sampleRate: 48000,
  windowSizeMs: 100,
  overlapPercent: 50,
  historyLengthSeconds: 30,
  targetLufs: -14, // Streaming standard
  targetDynamicRange: 8, // dB
};

// --------------------------------------------------------------------------
// Analysis functions
// --------------------------------------------------------------------------

/**
 * Calculate RMS of samples
 */
export function calculateRMS(samples: Float32Array): number {
  if (samples.length === 0) return -Infinity;
  
  let sumSquares = 0;
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    if (sample !== undefined) {
      sumSquares += sample * sample;
    }
  }
  
  const rms = Math.sqrt(sumSquares / samples.length);
  return rms > 0 ? 20 * Math.log10(rms) : -Infinity;
}

/**
 * Calculate peak level
 */
export function calculatePeak(samples: Float32Array): number {
  if (samples.length === 0) return -Infinity;
  
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    if (sample !== undefined) {
      const abs = Math.abs(sample);
      if (abs > peak) peak = abs;
    }
  }
  
  return peak > 0 ? 20 * Math.log10(peak) : -Infinity;
}

/**
 * Estimate true peak (oversampled peak detection)
 */
export function estimateTruePeak(samples: Float32Array): number {
  // Simplified true peak estimation using linear interpolation
  // Real implementation would use oversampling
  let truePeak = 0;
  
  for (let i = 0; i < samples.length - 1; i++) {
    const currentSample = samples[i];
    const nextSample = samples[i + 1];
    if (currentSample === undefined || nextSample === undefined) continue;
    
    const current = Math.abs(currentSample);
    const next = Math.abs(nextSample);
    
    // Check for inter-sample peak
    if ((currentSample >= 0 && nextSample < 0) || 
        (currentSample < 0 && nextSample >= 0)) {
      // Zero crossing - interpolate
      const interpolated = (current + next) / 2 * 1.1; // Approximate
      if (interpolated > truePeak) truePeak = interpolated;
    }
    
    if (current > truePeak) truePeak = current;
  }
  
  return truePeak > 0 ? 20 * Math.log10(truePeak) : -Infinity;
}

/**
 * Calculate LUFS (simplified momentary loudness)
 */
export function calculateLUFS(samples: Float32Array, _sampleRate: number): number {
  // Simplified LUFS calculation
  // Real implementation would use K-weighting filter and gating
  const rms = calculateRMS(samples);
  
  // Approximate K-weighting offset
  const kWeightingOffset = 0.691;
  
  return rms - kWeightingOffset;
}

/**
 * Detect compression characteristics
 */
export function detectCompression(
  inputPeaks: number[],
  outputPeaks: number[]
): CompressionAnalysis {
  if (inputPeaks.length < 2 || outputPeaks.length < 2) {
    return {
      detected: false,
      estimatedRatio: 1,
      estimatedThreshold: 0,
      estimatedAttack: 0,
      estimatedRelease: 0,
      gainReduction: 0,
      confidence: 0,
    };
  }
  
  // Calculate gain reduction
  const gainReductions: number[] = [];
  for (let i = 0; i < Math.min(inputPeaks.length, outputPeaks.length); i++) {
    const inputPeak = inputPeaks[i];
    const outputPeak = outputPeaks[i];
    if (inputPeak !== undefined && outputPeak !== undefined) {
      gainReductions.push(inputPeak - outputPeak);
    }
  }
  
  const avgGainReduction = gainReductions.length > 0 
    ? gainReductions.reduce((a, b) => a + b, 0) / gainReductions.length 
    : 0;
  const maxGainReduction = gainReductions.length > 0 
    ? Math.max(...gainReductions) 
    : 0;
  
  // Estimate threshold (where gain reduction starts)
  let threshold = 0;
  for (let i = 0; i < inputPeaks.length; i++) {
    const reduction = gainReductions[i];
    const peak = inputPeaks[i];
    if (reduction !== undefined && reduction > 0.5 && peak !== undefined) {
      threshold = peak;
      break;
    }
  }
  
  // Estimate ratio from input/output relationship
  const highInputs = inputPeaks.filter(p => p > threshold);
  const highOutputs = outputPeaks.slice(0, highInputs.length);
  
  let ratio = 1;
  if (highInputs.length > 0 && highOutputs.length > 0) {
    const inputRange = Math.max(...highInputs) - Math.min(...highInputs);
    const outputRange = Math.max(...highOutputs) - Math.min(...highOutputs);
    if (outputRange > 0) {
      ratio = inputRange / outputRange;
    }
  }
  
  const detected = maxGainReduction > 1;
  
  return {
    detected,
    estimatedRatio: Math.round(ratio * 10) / 10,
    estimatedThreshold: threshold,
    estimatedAttack: 10, // Default estimate
    estimatedRelease: 100, // Default estimate
    gainReduction: avgGainReduction,
    confidence: detected ? 0.7 : 0.3,
  };
}

/**
 * Detect limiting characteristics
 */
export function detectLimiting(peaks: number[], ceiling: number = -0.3): LimitingAnalysis {
  if (peaks.length === 0) {
    return {
      detected: false,
      ceiling: 0,
      gainReduction: 0,
      clipCount: 0,
      isOverLimited: false,
    };
  }
  
  // Count samples at or near ceiling
  const atCeiling = peaks.filter(p => p >= ceiling - 0.5).length;
  const overCeiling = peaks.filter(p => p > ceiling).length;
  
  const detected = atCeiling > peaks.length * 0.05;
  const isOverLimited = atCeiling > peaks.length * 0.3;
  
  // Estimate gain reduction from limiting
  const maxPeak = Math.max(...peaks);
  const gainReduction = maxPeak > ceiling ? maxPeak - ceiling : 0;
  
  return {
    detected,
    ceiling,
    gainReduction,
    clipCount: overCeiling,
    isOverLimited,
  };
}

/**
 * Generate dynamics recommendation
 */
export function generateRecommendation(
  stats: DynamicsStats,
  compression: CompressionAnalysis,
  limiting: LimitingAnalysis,
  config: DynamicsAnalyzerConfig
): DynamicsRecommendation {
  const suggestions: string[] = [];
  let level: 'good' | 'warning' | 'problem' = 'good';
  let message = 'Dynamics are well balanced';
  
  // Check LUFS
  const lufsDeviation = Math.abs(stats.lufs - config.targetLufs);
  if (lufsDeviation > 3) {
    level = 'warning';
    if (stats.lufs > config.targetLufs) {
      suggestions.push(`Reduce overall level by ${lufsDeviation.toFixed(1)} dB to meet target`);
    } else {
      suggestions.push(`Increase overall level by ${lufsDeviation.toFixed(1)} dB to meet target`);
    }
  }
  
  // Check dynamic range
  if (stats.dynamicRange < 4) {
    level = 'warning';
    message = 'Dynamic range is very narrow (over-compressed)';
    suggestions.push('Consider reducing compression ratio');
    suggestions.push('Increase attack time to let transients through');
  } else if (stats.dynamicRange > 20) {
    level = 'warning';
    message = 'Dynamic range may be too wide for streaming';
    suggestions.push('Consider gentle compression to reduce dynamic range');
  }
  
  // Check limiting
  if (limiting.isOverLimited) {
    level = 'problem';
    message = 'Audio appears over-limited (squashed)';
    suggestions.push('Reduce limiter input gain');
    suggestions.push('Consider using less aggressive limiting');
  } else if (limiting.clipCount > 0) {
    level = 'warning';
    suggestions.push('Potential clipping detected - check true peak levels');
  }
  
  // Check compression
  if (compression.detected && compression.estimatedRatio > 10) {
    if (level !== 'problem') level = 'warning';
    suggestions.push('Compression ratio is very high - consider parallel compression');
  }
  
  if (suggestions.length === 0) {
    suggestions.push('No changes recommended');
  }
  
  return { level, message, suggestions };
}

// --------------------------------------------------------------------------
// Dynamics Analyzer Store
// --------------------------------------------------------------------------

export class DynamicsAnalyzerStore {
  private config: DynamicsAnalyzerConfig;
  private history: DynamicsHistoryPoint[] = [];
  private currentAssessment: DynamicsAssessment | null = null;
  private inputPeakHistory: number[] = [];
  private outputPeakHistory: number[] = [];
  private listeners: Set<(assessment: DynamicsAssessment | null) => void> = new Set();
  
  constructor(config?: Partial<DynamicsAnalyzerConfig>) {
    this.config = { ...DEFAULT_ANALYZER_CONFIG, ...config };
  }
  
  /**
   * Get configuration
   */
  getConfig(): DynamicsAnalyzerConfig {
    return { ...this.config };
  }
  
  /**
   * Update configuration
   */
  updateConfig(updates: Partial<DynamicsAnalyzerConfig>): void {
    Object.assign(this.config, updates);
  }
  
  /**
   * Analyze a block of samples
   */
  analyze(samples: Float32Array): DynamicsAssessment {
    const peak = calculatePeak(samples);
    const rms = calculateRMS(samples);
    const truePeak = estimateTruePeak(samples);
    const lufs = calculateLUFS(samples, this.config.sampleRate);
    
    const stats: DynamicsStats = {
      peakLevel: peak,
      rmsLevel: rms,
      lufs,
      dynamicRange: peak - rms,
      crestFactor: Math.pow(10, (peak - rms) / 20),
      truePeak,
    };
    
    // Track peak history for compression detection
    this.inputPeakHistory.push(peak);
    this.outputPeakHistory.push(peak); // In real use, would be post-processing peak
    
    // Limit history size
    const maxHistory = 100;
    if (this.inputPeakHistory.length > maxHistory) {
      this.inputPeakHistory.shift();
      this.outputPeakHistory.shift();
    }
    
    // Detect compression and limiting
    const compression = detectCompression(this.inputPeakHistory, this.outputPeakHistory);
    const limiting = detectLimiting(this.outputPeakHistory);
    
    // Generate recommendation
    const recommendation = generateRecommendation(stats, compression, limiting, this.config);
    
    // Create assessment
    const assessment: DynamicsAssessment = {
      stats,
      compression,
      limiting,
      recommendation,
      timestamp: Date.now(),
    };
    
    this.currentAssessment = assessment;
    
    // Add to history
    this.history.push({
      timestamp: Date.now(),
      peak,
      rms,
      gainReduction: compression.gainReduction,
    });
    
    // Limit history length
    const maxHistoryLength = (this.config.historyLengthSeconds * 1000) / this.config.windowSizeMs;
    if (this.history.length > maxHistoryLength) {
      this.history.shift();
    }
    
    this.notifyListeners();
    
    return assessment;
  }
  
  /**
   * Get current assessment
   */
  getCurrentAssessment(): DynamicsAssessment | null {
    return this.currentAssessment;
  }
  
  /**
   * Get history
   */
  getHistory(): DynamicsHistoryPoint[] {
    return [...this.history];
  }
  
  /**
   * Get average stats over history
   */
  getAverageStats(): DynamicsStats | null {
    if (this.history.length === 0) return null;
    
    const avgPeak = this.history.reduce((sum, h) => sum + h.peak, 0) / this.history.length;
    const avgRms = this.history.reduce((sum, h) => sum + h.rms, 0) / this.history.length;
    
    return {
      peakLevel: avgPeak,
      rmsLevel: avgRms,
      lufs: avgRms - 0.691, // Approximate
      dynamicRange: avgPeak - avgRms,
      crestFactor: Math.pow(10, (avgPeak - avgRms) / 20),
      truePeak: avgPeak + 0.5, // Estimate
    };
  }
  
  /**
   * Get peak gain reduction
   */
  getPeakGainReduction(): number {
    if (this.history.length === 0) return 0;
    return Math.max(...this.history.map(h => h.gainReduction));
  }
  
  /**
   * Reset the analyzer
   */
  reset(): void {
    this.history = [];
    this.inputPeakHistory = [];
    this.outputPeakHistory = [];
    this.currentAssessment = null;
    this.notifyListeners();
  }
  
  /**
   * Subscribe to updates
   */
  subscribe(listener: (assessment: DynamicsAssessment | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  private notifyListeners(): void {
    this.listeners.forEach(l => l(this.currentAssessment));
  }
}

// Singleton instance
export const dynamicsAnalyzerStore = new DynamicsAnalyzerStore();
