/**
 * @fileoverview Reveal Panel Audio Visualization Integration.
 * 
 * Extends the Reveal Panel with audio visualization tabs:
 * - Waveform display
 * - Spectrum analyzer
 * - Level meters
 * - Phase correlation
 * 
 * @module @cardplay/ui/reveal-panel-audio
 * @see INTEGRATION_FIXES_CHECKLIST.md Phase F.7
 */

import type { RevealTab, RevealPanelContext } from './components/reveal-panel';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Audio visualization mode.
 */
export type VisualizationMode = 
  | 'waveform'
  | 'spectrum'
  | 'spectrogram'
  | 'levels'
  | 'correlation';

/**
 * Visualization configuration.
 */
export interface VisualizationConfig {
  /** FFT size for spectrum analysis */
  fftSize: number;
  /** Smoothing time constant (0-1) */
  smoothing: number;
  /** Min decibels for display */
  minDecibels: number;
  /** Max decibels for display */
  maxDecibels: number;
  /** Colors for visualization */
  colors: {
    background: string;
    waveform: string;
    spectrum: string;
    grid: string;
    peak: string;
    text: string;
  };
  /** Display options */
  showGrid: boolean;
  showLabels: boolean;
  showPeaks: boolean;
  /** Update rate in Hz */
  frameRate: number;
}

/**
 * Level meter state.
 */
export interface LevelMeterState {
  readonly left: number;       // dB
  readonly right: number;      // dB
  readonly leftPeak: number;   // dB
  readonly rightPeak: number;  // dB
  readonly leftClip: boolean;
  readonly rightClip: boolean;
}

/**
 * Correlation meter state.
 */
export interface CorrelationState {
  readonly correlation: number;  // -1 to +1
  readonly phase: number;        // 0 to 360 degrees
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_CONFIG: VisualizationConfig = {
  fftSize: 2048,
  smoothing: 0.8,
  minDecibels: -90,
  maxDecibels: 0,
  colors: {
    background: '#1a1a2e',
    waveform: '#00ff88',
    spectrum: '#00aaff',
    grid: '#333366',
    peak: '#ff4444',
    text: '#aaaaaa',
  },
  showGrid: true,
  showLabels: true,
  showPeaks: true,
  frameRate: 60,
};

function createAnalyzerBuffer(length: number): Float32Array<ArrayBuffer> {
  return new Float32Array(new ArrayBuffer(length * Float32Array.BYTES_PER_ELEMENT));
}

// ============================================================================
// AUDIO ANALYZER
// ============================================================================

/**
 * AudioAnalyzer - Extracts audio data for visualization.
 */
export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyzerNode: AnalyserNode | null = null;
  private splitterNode: ChannelSplitterNode | null = null;
  private leftAnalyzer: AnalyserNode | null = null;
  private rightAnalyzer: AnalyserNode | null = null;
  
  private config: VisualizationConfig;
  private timeDomainData: Float32Array<ArrayBuffer> = createAnalyzerBuffer(0);
  private frequencyData: Float32Array<ArrayBuffer> = createAnalyzerBuffer(0);
  private leftTimeData: Float32Array<ArrayBuffer> = createAnalyzerBuffer(0);
  private rightTimeData: Float32Array<ArrayBuffer> = createAnalyzerBuffer(0);
  
  private peakLeft = -Infinity;
  private peakRight = -Infinity;
  private peakHoldTime = 1000; // ms
  private lastPeakUpdateLeft = 0;
  private lastPeakUpdateRight = 0;
  
  constructor(config: Partial<VisualizationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Initialize with audio context and source node.
   */
  initialize(audioContext: AudioContext, sourceNode?: AudioNode): void {
    this.audioContext = audioContext;
    
    // Main analyzer for combined signal
    this.analyzerNode = audioContext.createAnalyser();
    this.analyzerNode.fftSize = this.config.fftSize;
    this.analyzerNode.smoothingTimeConstant = this.config.smoothing;
    this.analyzerNode.minDecibels = this.config.minDecibels;
    this.analyzerNode.maxDecibels = this.config.maxDecibels;
    
    // Create data arrays
    this.timeDomainData = createAnalyzerBuffer(this.analyzerNode.fftSize);
    this.frequencyData = createAnalyzerBuffer(this.analyzerNode.frequencyBinCount);
    
    // Create channel splitter for stereo analysis
    this.splitterNode = audioContext.createChannelSplitter(2);
    
    // Left channel analyzer
    this.leftAnalyzer = audioContext.createAnalyser();
    this.leftAnalyzer.fftSize = this.config.fftSize;
    this.leftAnalyzer.smoothingTimeConstant = this.config.smoothing;
    this.leftTimeData = createAnalyzerBuffer(this.leftAnalyzer.fftSize);
    
    // Right channel analyzer
    this.rightAnalyzer = audioContext.createAnalyser();
    this.rightAnalyzer.fftSize = this.config.fftSize;
    this.rightAnalyzer.smoothingTimeConstant = this.config.smoothing;
    this.rightTimeData = createAnalyzerBuffer(this.rightAnalyzer.fftSize);
    
    // Connect splitter to individual analyzers
    this.splitterNode.connect(this.leftAnalyzer, 0);
    this.splitterNode.connect(this.rightAnalyzer, 1);
    
    // Connect source if provided
    if (sourceNode) {
      sourceNode.connect(this.analyzerNode);
      sourceNode.connect(this.splitterNode);
    }
  }
  
  /**
   * Connect to an audio source node.
   */
  connect(sourceNode: AudioNode): void {
    if (this.analyzerNode) {
      sourceNode.connect(this.analyzerNode);
    }
    if (this.splitterNode) {
      sourceNode.connect(this.splitterNode);
    }
  }
  
  /**
   * Disconnect from audio graph.
   */
  disconnect(): void {
    if (this.analyzerNode) {
      this.analyzerNode.disconnect();
    }
    if (this.splitterNode) {
      this.splitterNode.disconnect();
    }
    if (this.leftAnalyzer) {
      this.leftAnalyzer.disconnect();
    }
    if (this.rightAnalyzer) {
      this.rightAnalyzer.disconnect();
    }
  }
  
  /**
   * Get time domain data (waveform).
   */
  getTimeDomainData(): Float32Array {
    if (this.analyzerNode) {
      this.analyzerNode.getFloatTimeDomainData(this.timeDomainData);
    }
    return this.timeDomainData;
  }
  
  /**
   * Get frequency data (spectrum).
   */
  getFrequencyData(): Float32Array {
    if (this.analyzerNode) {
      this.analyzerNode.getFloatFrequencyData(this.frequencyData);
    }
    return this.frequencyData;
  }
  
  /**
   * Get stereo level meters.
   */
  getLevelMeterState(): LevelMeterState {
    const now = Date.now();
    
    // Get left channel level
    if (this.leftAnalyzer) {
      this.leftAnalyzer.getFloatTimeDomainData(this.leftTimeData);
    }
    const leftRms = this.calculateRMS(this.leftTimeData);
    const leftDb = 20 * Math.log10(Math.max(leftRms, 0.0001));
    
    // Get right channel level
    if (this.rightAnalyzer) {
      this.rightAnalyzer.getFloatTimeDomainData(this.rightTimeData);
    }
    const rightRms = this.calculateRMS(this.rightTimeData);
    const rightDb = 20 * Math.log10(Math.max(rightRms, 0.0001));
    
    // Update peaks with hold
    if (leftDb > this.peakLeft) {
      this.peakLeft = leftDb;
      this.lastPeakUpdateLeft = now;
    } else if (now - this.lastPeakUpdateLeft > this.peakHoldTime) {
      this.peakLeft = Math.max(leftDb, this.peakLeft - 0.5);
    }
    
    if (rightDb > this.peakRight) {
      this.peakRight = rightDb;
      this.lastPeakUpdateRight = now;
    } else if (now - this.lastPeakUpdateRight > this.peakHoldTime) {
      this.peakRight = Math.max(rightDb, this.peakRight - 0.5);
    }
    
    return {
      left: leftDb,
      right: rightDb,
      leftPeak: this.peakLeft,
      rightPeak: this.peakRight,
      leftClip: leftDb >= -0.3,
      rightClip: rightDb >= -0.3,
    };
  }
  
  /**
   * Get stereo correlation.
   */
  getCorrelationState(): CorrelationState {
    if (!this.leftAnalyzer || !this.rightAnalyzer) {
      return { correlation: 0, phase: 0 };
    }
    
    this.leftAnalyzer.getFloatTimeDomainData(this.leftTimeData);
    this.rightAnalyzer.getFloatTimeDomainData(this.rightTimeData);
    
    // Calculate correlation coefficient
    let sumLeft = 0, sumRight = 0, sumProduct = 0;
    let sumLeftSq = 0, sumRightSq = 0;
    
    const n = this.leftTimeData.length;
    for (let i = 0; i < n; i++) {
      const l = this.leftTimeData[i] ?? 0;
      const r = this.rightTimeData[i] ?? 0;
      sumLeft += l;
      sumRight += r;
      sumProduct += l * r;
      sumLeftSq += l * l;
      sumRightSq += r * r;
    }
    
    const meanLeft = sumLeft / n;
    const meanRight = sumRight / n;
    const varLeft = sumLeftSq / n - meanLeft * meanLeft;
    const varRight = sumRightSq / n - meanRight * meanRight;
    const covariance = sumProduct / n - meanLeft * meanRight;
    
    const stdLeft = Math.sqrt(Math.max(0, varLeft));
    const stdRight = Math.sqrt(Math.max(0, varRight));
    
    const correlation = stdLeft > 0 && stdRight > 0
      ? covariance / (stdLeft * stdRight)
      : 0;
    
    // Estimate phase (simplified)
    let maxCorr = -Infinity;
    let bestOffset = 0;
    const maxLag = 100;
    
    for (let lag = -maxLag; lag <= maxLag; lag++) {
      let corr = 0;
      const start = Math.max(0, -lag);
      const end = Math.min(n, n - lag);
      
      for (let i = start; i < end; i++) {
        const l = this.leftTimeData[i] ?? 0;
        const r = this.rightTimeData[i + lag] ?? 0;
        corr += l * r;
      }
      
      if (corr > maxCorr) {
        maxCorr = corr;
        bestOffset = lag;
      }
    }
    
    const sampleRate = this.audioContext?.sampleRate ?? 44100;
    const phase = (bestOffset / sampleRate) * 360 * 1000; // degrees
    
    return {
      correlation: Math.max(-1, Math.min(1, correlation)),
      phase: phase % 360,
    };
  }
  
  /**
   * Reset peak hold.
   */
  resetPeaks(): void {
    this.peakLeft = -Infinity;
    this.peakRight = -Infinity;
  }
  
  /**
   * Update configuration.
   */
  updateConfig(config: Partial<VisualizationConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.analyzerNode) {
      this.analyzerNode.fftSize = this.config.fftSize;
      this.analyzerNode.smoothingTimeConstant = this.config.smoothing;
      this.analyzerNode.minDecibels = this.config.minDecibels;
      this.analyzerNode.maxDecibels = this.config.maxDecibels;
      
      this.timeDomainData = createAnalyzerBuffer(this.analyzerNode.fftSize);
      this.frequencyData = createAnalyzerBuffer(this.analyzerNode.frequencyBinCount);
    }
  }
  
  /**
   * Get current config.
   */
  getConfig(): VisualizationConfig {
    return { ...this.config };
  }
  
  private calculateRMS(data: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = data[i] ?? 0;
      sum += v * v;
    }
    return Math.sqrt(sum / data.length);
  }
}

// ============================================================================
// VISUALIZATION RENDERER
// ============================================================================

/**
 * VisualizationRenderer - Renders audio visualizations to canvas.
 */
export class VisualizationRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private analyzer: AudioAnalyzer;
  private mode: VisualizationMode;
  private config: VisualizationConfig;
  
  private animationFrame: number | null = null;
  private isRunning = false;
  
  constructor(
    canvas: HTMLCanvasElement,
    analyzer: AudioAnalyzer,
    mode: VisualizationMode = 'waveform',
    config: Partial<VisualizationConfig> = {}
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.analyzer = analyzer;
    this.mode = mode;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Start rendering.
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.render();
  }
  
  /**
   * Stop rendering.
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
  
  /**
   * Set visualization mode.
   */
  setMode(mode: VisualizationMode): void {
    this.mode = mode;
  }
  
  /**
   * Update config.
   */
  updateConfig(config: Partial<VisualizationConfig>): void {
    this.config = { ...this.config, ...config };
    this.analyzer.updateConfig(config);
  }
  
  private render = (): void => {
    if (!this.isRunning) return;
    
    // Clear
    this.ctx.fillStyle = this.config.colors.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Render based on mode
    switch (this.mode) {
      case 'waveform':
        this.renderWaveform();
        break;
      case 'spectrum':
        this.renderSpectrum();
        break;
      case 'levels':
        this.renderLevels();
        break;
      case 'correlation':
        this.renderCorrelation();
        break;
      case 'spectrogram':
        this.renderSpectrogram();
        break;
    }
    
    // Draw grid
    if (this.config.showGrid) {
      this.renderGrid();
    }
    
    this.animationFrame = requestAnimationFrame(this.render);
  };
  
  private renderWaveform(): void {
    const data = this.analyzer.getTimeDomainData();
    const { width, height } = this.canvas;
    
    this.ctx.strokeStyle = this.config.colors.waveform;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    
    const sliceWidth = width / data.length;
    let x = 0;
    
    for (let i = 0; i < data.length; i++) {
      const v = data[i] ?? 0;
      const y = (1 - v) * height / 2;
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    this.ctx.stroke();
    
    // Center line
    this.ctx.strokeStyle = this.config.colors.grid;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(0, height / 2);
    this.ctx.lineTo(width, height / 2);
    this.ctx.stroke();
  }
  
  private renderSpectrum(): void {
    const data = this.analyzer.getFrequencyData();
    const { width, height } = this.canvas;
    
    const barCount = Math.min(data.length, 128);
    const barWidth = width / barCount;
    const minDb = this.config.minDecibels;
    const maxDb = this.config.maxDecibels;
    const range = maxDb - minDb;
    
    for (let i = 0; i < barCount; i++) {
      // Use logarithmic frequency mapping
      const logIndex = Math.floor(Math.pow(i / barCount, 2) * data.length);
      const db = data[logIndex] ?? minDb;
      const normalized = (db - minDb) / range;
      const barHeight = Math.max(0, normalized * height);
      
      // Gradient from spectrum color to peak color
      const intensity = normalized;
      this.ctx.fillStyle = intensity > 0.9 
        ? this.config.colors.peak
        : this.config.colors.spectrum;
      
      this.ctx.fillRect(
        i * barWidth,
        height - barHeight,
        barWidth - 1,
        barHeight
      );
    }
    
    // Labels
    if (this.config.showLabels) {
      this.ctx.fillStyle = this.config.colors.text;
      this.ctx.font = '10px monospace';
      this.ctx.textAlign = 'center';
      
      const freqLabels = [100, 1000, 10000];
      for (const freq of freqLabels) {
        const x = Math.sqrt(freq / 20000) * width;
        this.ctx.fillText(`${freq >= 1000 ? freq / 1000 + 'k' : freq}`, x, height - 4);
      }
    }
  }
  
  private renderLevels(): void {
    const levels = this.analyzer.getLevelMeterState();
    const { width, height } = this.canvas;
    
    const meterWidth = width / 3;
    const meterHeight = height - 40;
    const gap = 20;
    
    // Left meter
    this.renderMeter(
      gap,
      20,
      meterWidth - gap,
      meterHeight,
      levels.left,
      levels.leftPeak,
      levels.leftClip,
      'L'
    );
    
    // Right meter
    this.renderMeter(
      meterWidth + gap / 2,
      20,
      meterWidth - gap,
      meterHeight,
      levels.right,
      levels.rightPeak,
      levels.rightClip,
      'R'
    );
    
    // Correlation display
    const correlation = this.analyzer.getCorrelationState();
    this.renderCorrelationMeter(
      meterWidth * 2 + gap,
      20,
      meterWidth - gap * 2,
      meterHeight,
      correlation.correlation
    );
  }
  
  private renderMeter(
    x: number,
    y: number,
    width: number,
    height: number,
    level: number,
    peak: number,
    clip: boolean,
    label: string
  ): void {
    const minDb = this.config.minDecibels;
    const maxDb = this.config.maxDecibels;
    const range = maxDb - minDb;
    
    // Background
    this.ctx.fillStyle = '#222';
    this.ctx.fillRect(x, y, width, height);
    
    // Level bar
    const levelNorm = Math.max(0, Math.min(1, (level - minDb) / range));
    const barHeight = levelNorm * height;
    
    // Gradient for level
    const gradient = this.ctx.createLinearGradient(0, y + height, 0, y);
    gradient.addColorStop(0, '#00ff00');
    gradient.addColorStop(0.7, '#ffff00');
    gradient.addColorStop(1, '#ff0000');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x, y + height - barHeight, width, barHeight);
    
    // Peak indicator
    if (this.config.showPeaks) {
      const peakNorm = Math.max(0, Math.min(1, (peak - minDb) / range));
      const peakY = y + height - peakNorm * height;
      
      this.ctx.fillStyle = clip ? this.config.colors.peak : '#ffffff';
      this.ctx.fillRect(x, peakY - 2, width, 4);
    }
    
    // Clip indicator
    if (clip) {
      this.ctx.fillStyle = this.config.colors.peak;
      this.ctx.fillRect(x, y, width, 10);
    }
    
    // dB scale
    if (this.config.showLabels) {
      this.ctx.fillStyle = this.config.colors.text;
      this.ctx.font = '9px monospace';
      this.ctx.textAlign = 'right';
      
      const dbMarks = [0, -6, -12, -24, -48];
      for (const db of dbMarks) {
        const markY = y + height - ((db - minDb) / range) * height;
        this.ctx.fillText(`${db}`, x - 4, markY + 3);
        
        // Tick mark
        this.ctx.fillStyle = this.config.colors.grid;
        this.ctx.fillRect(x, markY, 3, 1);
        this.ctx.fillStyle = this.config.colors.text;
      }
    }
    
    // Label
    this.ctx.fillStyle = this.config.colors.text;
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(label, x + width / 2, y + height + 16);
    
    // Current level text
    this.ctx.fillText(
      level > -90 ? `${level.toFixed(1)}` : '-∞',
      x + width / 2,
      y + height + 30
    );
  }
  
  private renderCorrelation(): void {
    const correlation = this.analyzer.getCorrelationState();
    const { width, height } = this.canvas;
    
    // Lissajous display
    const leftData = this.analyzer.getTimeDomainData();
    const cx = width / 2;
    const cy = height / 2;
    const scale = Math.min(width, height) / 3;
    
    this.ctx.strokeStyle = this.config.colors.waveform;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    
    // Plot left vs right (simplified - using mono data)
    for (let i = 0; i < leftData.length - 1; i++) {
      const x = cx + (leftData[i] ?? 0) * scale;
      const y = cy + (leftData[i + 1] ?? 0) * scale;
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    
    this.ctx.stroke();
    
    // Correlation meter at bottom
    this.renderCorrelationMeter(
      20,
      height - 40,
      width - 40,
      20,
      correlation.correlation
    );
    
    // Labels
    this.ctx.fillStyle = this.config.colors.text;
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      `Correlation: ${correlation.correlation.toFixed(2)}`,
      width / 2,
      height - 8
    );
  }
  
  private renderCorrelationMeter(
    x: number,
    y: number,
    width: number,
    height: number,
    correlation: number
  ): void {
    // Background
    this.ctx.fillStyle = '#222';
    this.ctx.fillRect(x, y, width, height);
    
    // Center line (mono)
    const centerX = x + width / 2;
    this.ctx.strokeStyle = this.config.colors.grid;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, y);
    this.ctx.lineTo(centerX, y + height);
    this.ctx.stroke();
    
    // Correlation indicator
    const indicatorX = centerX + correlation * (width / 2);
    const indicatorWidth = 4;
    
    // Color based on correlation
    let color: string;
    if (correlation > 0.5) {
      color = '#00ff00'; // Good stereo
    } else if (correlation > 0) {
      color = '#ffff00'; // Moderate
    } else if (correlation > -0.5) {
      color = '#ff8800'; // Phase issues
    } else {
      color = '#ff0000'; // Out of phase
    }
    
    this.ctx.fillStyle = color;
    this.ctx.fillRect(indicatorX - indicatorWidth / 2, y, indicatorWidth, height);
    
    // Labels
    if (this.config.showLabels) {
      this.ctx.fillStyle = this.config.colors.text;
      this.ctx.font = '10px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('-1', x + 10, y + height + 12);
      this.ctx.fillText('0', centerX, y + height + 12);
      this.ctx.fillText('+1', x + width - 10, y + height + 12);
    }
  }
  
  private spectrogramHistory: Uint8Array[] = [];
  private maxHistoryLength = 200;
  
  private renderSpectrogram(): void {
    const data = this.analyzer.getFrequencyData();
    const { width, height } = this.canvas;
    
    // Convert to uint8 for history
    const normalized = new Uint8Array(data.length);
    const minDb = this.config.minDecibels;
    const range = this.config.maxDecibels - minDb;
    
    for (let i = 0; i < data.length; i++) {
      const db = data[i] ?? minDb;
      normalized[i] = Math.floor(Math.max(0, Math.min(255, ((db - minDb) / range) * 255)));
    }
    
    // Add to history
    this.spectrogramHistory.push(normalized);
    if (this.spectrogramHistory.length > this.maxHistoryLength) {
      this.spectrogramHistory.shift();
    }
    
    // Draw spectrogram
    const colWidth = width / this.maxHistoryLength;
    const rowHeight = height / 64; // Simplified to 64 frequency bands
    
    for (let t = 0; t < this.spectrogramHistory.length; t++) {
      const col = this.spectrogramHistory[t];
      if (!col) continue;
      const x = t * colWidth;
      
      for (let f = 0; f < 64; f++) {
        // Logarithmic frequency mapping
        const freqIndex = Math.floor(Math.pow(f / 64, 2) * col.length);
        const intensity = (col[freqIndex] ?? 0) / 255;
        
        // Color mapping (blue → cyan → green → yellow → red)
        const r = intensity > 0.75 ? 255 : Math.floor(intensity * 4 * 255);
        const g = intensity < 0.5 ? Math.floor(intensity * 2 * 255) : 255 - Math.floor((intensity - 0.5) * 2 * 255);
        const b = intensity < 0.25 ? 255 : Math.floor((1 - intensity) * 255);
        
        this.ctx.fillStyle = `rgb(${r},${g},${b})`;
        this.ctx.fillRect(x, height - (f + 1) * rowHeight, colWidth, rowHeight);
      }
    }
  }
  
  private renderGrid(): void {
    const { width, height } = this.canvas;
    
    this.ctx.strokeStyle = this.config.colors.grid;
    this.ctx.lineWidth = 0.5;
    
    // Vertical lines
    for (let i = 1; i < 4; i++) {
      const x = (width / 4) * i;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }
    
    // Horizontal lines
    for (let i = 1; i < 4; i++) {
      const y = (height / 4) * i;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }
  }
}

// ============================================================================
// REVEAL TAB FACTORY
// ============================================================================

/**
 * Create audio visualization tabs for the Reveal Panel.
 */
export function createAudioVisualizationTabs(
  analyzer: AudioAnalyzer
): RevealTab[] {
  return [
    {
      id: 'audio-waveform',
      label: 'Waveform',
      icon: '〰️',
      content: (_context: RevealPanelContext) => {
        return createVisualizationCanvas(analyzer, 'waveform');
      },
    },
    {
      id: 'audio-spectrum',
      label: 'Spectrum',
      icon: '📊',
      content: (_context: RevealPanelContext) => {
        return createVisualizationCanvas(analyzer, 'spectrum');
      },
    },
    {
      id: 'audio-levels',
      label: 'Levels',
      icon: '📶',
      content: (_context: RevealPanelContext) => {
        return createVisualizationCanvas(analyzer, 'levels');
      },
    },
    {
      id: 'audio-correlation',
      label: 'Stereo',
      icon: '◉',
      content: (_context: RevealPanelContext) => {
        return createVisualizationCanvas(analyzer, 'correlation');
      },
    },
  ];
}

/**
 * Create a canvas element with visualization renderer.
 */
function createVisualizationCanvas(
  analyzer: AudioAnalyzer,
  mode: VisualizationMode
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'audio-visualization';
  container.style.cssText = `
    width: 100%;
    height: 200px;
    background: #1a1a2e;
    border-radius: 4px;
    overflow: hidden;
  `;
  
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 200;
  canvas.style.cssText = 'width: 100%; height: 100%;';
  container.appendChild(canvas);
  
  const renderer = new VisualizationRenderer(canvas, analyzer, mode);
  
  // Start rendering when added to DOM
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        if (document.contains(container)) {
          renderer.start();
        } else {
          renderer.stop();
        }
      }
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Resize handler
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }
  });
  
  resizeObserver.observe(container);
  
  return container;
}

// ============================================================================
// SINGLETON ANALYZER
// ============================================================================

let analyzerInstance: AudioAnalyzer | null = null;

/**
 * Get or create the singleton audio analyzer.
 */
export function getAudioAnalyzer(): AudioAnalyzer {
  if (!analyzerInstance) {
    analyzerInstance = new AudioAnalyzer();
  }
  return analyzerInstance;
}

/**
 * Initialize the audio analyzer with audio context.
 */
export function initializeAudioAnalyzer(
  audioContext: AudioContext,
  sourceNode?: AudioNode
): AudioAnalyzer {
  const analyzer = getAudioAnalyzer();
  analyzer.initialize(audioContext, sourceNode);
  return analyzer;
}
