/**
 * @fileoverview Visualization Canvases
 * 
 * Canvas-based visualizations for audio monitoring:
 * - Waveform display (real-time and static)
 * - Level meters (peak, RMS, LUFS)
 * - Spectrum analyzer (FFT)
 * - Oscilloscope
 * - Phase correlation
 * - Stereo field
 * 
 * @module @cardplay/ui/components/visualization-canvas
 */

// ============================================================================
// TYPES
// ============================================================================

/** Visualization mode */
export type VisualizationMode = 
  | 'waveform'
  | 'meter'
  | 'spectrum'
  | 'oscilloscope'
  | 'phase'
  | 'stereo';

/** Color theme */
export interface VisualizationTheme {
  background: string;
  foreground: string;
  accent: string;
  grid: string;
  peak: string;
  rms: string;
  clip: string;
  gradient?: string[];
}

/** Base canvas options */
export interface VisualizationCanvasOptions {
  width?: number;
  height?: number;
  theme?: Partial<VisualizationTheme>;
  fps?: number;
  smoothing?: number;
}

/** Waveform options */
export interface WaveformCanvasOptions extends VisualizationCanvasOptions {
  style?: 'line' | 'filled' | 'bars' | 'mirror';
  showGrid?: boolean;
  showPeakHold?: boolean;
  peakHoldTime?: number;
  lineWidth?: number;
}

/** Meter options */
export interface MeterCanvasOptions extends VisualizationCanvasOptions {
  orientation?: 'horizontal' | 'vertical';
  segments?: number;
  showPeak?: boolean;
  showRMS?: boolean;
  showLUFS?: boolean;
  peakFalloff?: number;
  reference?: number;  // dB reference (0 = digital full scale)
  range?: number;      // dB range
  stereo?: boolean;
}

/** Spectrum options */
export interface SpectrumCanvasOptions extends VisualizationCanvasOptions {
  fftSize?: number;
  minFreq?: number;
  maxFreq?: number;
  minDb?: number;
  maxDb?: number;
  scale?: 'linear' | 'logarithmic';
  style?: 'bars' | 'line' | 'filled';
  showFreqLabels?: boolean;
  showDbLabels?: boolean;
}

/** Oscilloscope options */
export interface OscilloscopeCanvasOptions extends VisualizationCanvasOptions {
  timeScale?: number;    // ms per division
  voltageScale?: number; // amplitude per division
  triggerLevel?: number;
  triggerEdge?: 'rising' | 'falling';
  showGrid?: boolean;
  showTrigger?: boolean;
  persistence?: number;  // 0-1, trail persistence
}

// ============================================================================
// DEFAULT THEME
// ============================================================================

const DEFAULT_THEME: VisualizationTheme = {
  background: '#1a1a1a',
  foreground: '#6366f1',
  accent: '#22c55e',
  grid: '#333333',
  peak: '#f59e0b',
  rms: '#6366f1',
  clip: '#ef4444',
  gradient: ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'],
};

// ============================================================================
// BASE VISUALIZATION CANVAS
// ============================================================================

export abstract class BaseVisualizationCanvas {
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected theme: VisualizationTheme;
  protected width: number;
  protected height: number;
  protected fps: number;
  protected smoothing: number;
  
  protected animationFrame: number | null = null;
  protected lastFrameTime: number = 0;
  protected isRunning: boolean = false;
  
  constructor(options: VisualizationCanvasOptions = {}) {
    this.width = options.width ?? 200;
    this.height = options.height ?? 100;
    this.fps = options.fps ?? 60;
    this.smoothing = options.smoothing ?? 0.8;
    this.theme = { ...DEFAULT_THEME, ...options.theme };
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.className = 'visualization-canvas';
    
    this.ctx = this.canvas.getContext('2d')!;
  }
  
  /**
   * Get canvas element
   */
  getElement(): HTMLCanvasElement {
    return this.canvas;
  }
  
  /**
   * Resize canvas
   */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
  }
  
  /**
   * Set theme
   */
  setTheme(theme: Partial<VisualizationTheme>): void {
    this.theme = { ...this.theme, ...theme };
  }
  
  /**
   * Start animation
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.animate();
  }
  
  /**
   * Stop animation
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
  
  /**
   * Animation loop
   */
  private animate = (): void => {
    if (!this.isRunning) return;
    
    const now = performance.now();
    const elapsed = now - this.lastFrameTime;
    const frameInterval = 1000 / this.fps;
    
    if (elapsed >= frameInterval) {
      this.lastFrameTime = now - (elapsed % frameInterval);
      this.render();
    }
    
    this.animationFrame = requestAnimationFrame(this.animate);
  };
  
  /**
   * Clear canvas
   */
  protected clear(): void {
    this.ctx.fillStyle = this.theme.background;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }
  
  /**
   * Render (to be implemented by subclasses)
   */
  protected abstract render(): void;
  
  /**
   * Update data (to be implemented by subclasses)
   */
  abstract updateData(data: Float32Array | number | number[]): void;
  
  /**
   * Dispose
   */
  dispose(): void {
    this.stop();
  }
}

// ============================================================================
// WAVEFORM CANVAS
// ============================================================================

export class WaveformCanvas extends BaseVisualizationCanvas {
  private style: 'line' | 'filled' | 'bars' | 'mirror';
  private showGrid: boolean;
  private showPeakHold: boolean;
  private peakHoldTime: number;
  private lineWidth: number;
  
  private waveformData: Float32Array = new Float32Array(0);
  private peakHoldValue: number = 0;
  private peakHoldTimestamp: number = 0;
  
  constructor(options: WaveformCanvasOptions = {}) {
    super(options);
    
    this.style = options.style ?? 'line';
    this.showGrid = options.showGrid ?? true;
    this.showPeakHold = options.showPeakHold ?? true;
    this.peakHoldTime = options.peakHoldTime ?? 2000;
    this.lineWidth = options.lineWidth ?? 1.5;
  }
  
  updateData(data: Float32Array): void {
    this.waveformData = data;
    
    // Calculate peak
    let max = 0;
    for (let i = 0; i < data.length; i++) {
      const sample = data[i];
      if (sample !== undefined) {
        max = Math.max(max, Math.abs(sample));
      }
    }

    // Peak hold
    if (max > this.peakHoldValue) {
      this.peakHoldValue = max;
      this.peakHoldTimestamp = performance.now();
    } else if (performance.now() - this.peakHoldTimestamp > this.peakHoldTime) {
      this.peakHoldValue *= 0.95; // Falloff
    }
  }
  
  protected render(): void {
    this.clear();
    
    if (this.showGrid) {
      this.drawGrid();
    }
    
    if (this.waveformData.length === 0) return;
    
    switch (this.style) {
      case 'line':
        this.drawLineWaveform();
        break;
      case 'filled':
        this.drawFilledWaveform();
        break;
      case 'bars':
        this.drawBarsWaveform();
        break;
      case 'mirror':
        this.drawMirrorWaveform();
        break;
    }
    
    if (this.showPeakHold) {
      this.drawPeakHold();
    }
  }
  
  private drawGrid(): void {
    const ctx = this.ctx;
    ctx.strokeStyle = this.theme.grid;
    ctx.lineWidth = 0.5;
    
    // Horizontal center line
    ctx.beginPath();
    ctx.moveTo(0, this.height / 2);
    ctx.lineTo(this.width, this.height / 2);
    ctx.stroke();
    
    // Vertical divisions
    const divisions = 8;
    for (let i = 1; i < divisions; i++) {
      const x = (this.width / divisions) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
  }
  
  private drawLineWaveform(): void {
    const ctx = this.ctx;
    const data = this.waveformData;
    const step = data.length / this.width;
    const halfHeight = this.height / 2;
    
    ctx.strokeStyle = this.theme.foreground;
    ctx.lineWidth = this.lineWidth;
    ctx.beginPath();
    
    for (let x = 0; x < this.width; x++) {
      const index = Math.floor(x * step);
      const value = data[index] ?? 0;
      const y = halfHeight - value * halfHeight;
      
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
  }
  
  private drawFilledWaveform(): void {
    const ctx = this.ctx;
    const data = this.waveformData;
    const step = data.length / this.width;
    const halfHeight = this.height / 2;
    
    ctx.fillStyle = this.theme.foreground;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, halfHeight);
    
    for (let x = 0; x < this.width; x++) {
      const index = Math.floor(x * step);
      const value = data[index] ?? 0;
      const y = halfHeight - value * halfHeight;
      ctx.lineTo(x, y);
    }
    
    ctx.lineTo(this.width, halfHeight);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    
    // Draw line on top
    this.drawLineWaveform();
  }
  
  private drawBarsWaveform(): void {
    const ctx = this.ctx;
    const data = this.waveformData;
    const barWidth = 3;
    const gap = 1;
    const numBars = Math.floor(this.width / (barWidth + gap));
    const samplesPerBar = Math.floor(data.length / numBars);
    const halfHeight = this.height / 2;
    
    ctx.fillStyle = this.theme.foreground;
    
    for (let i = 0; i < numBars; i++) {
      let max = 0;
      for (let j = 0; j < samplesPerBar; j++) {
        const index = i * samplesPerBar + j;
        if (index < data.length) {
          const sample = data[index];
          if (sample !== undefined) {
            max = Math.max(max, Math.abs(sample));
          }
        }
      }
      
      const barHeight = max * halfHeight;
      const x = i * (barWidth + gap);
      
      ctx.fillRect(x, halfHeight - barHeight, barWidth, barHeight * 2);
    }
  }
  
  private drawMirrorWaveform(): void {
    const ctx = this.ctx;
    const data = this.waveformData;
    const step = data.length / this.width;
    const halfHeight = this.height / 2;
    
    // Upper waveform
    ctx.fillStyle = this.theme.foreground;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(0, halfHeight);
    
    for (let x = 0; x < this.width; x++) {
      const index = Math.floor(x * step);
      const value = Math.abs(data[index] ?? 0);
      const y = halfHeight - value * halfHeight;
      ctx.lineTo(x, y);
    }
    
    ctx.lineTo(this.width, halfHeight);
    ctx.closePath();
    ctx.fill();
    
    // Lower waveform (mirrored)
    ctx.beginPath();
    ctx.moveTo(0, halfHeight);
    
    for (let x = 0; x < this.width; x++) {
      const index = Math.floor(x * step);
      const value = Math.abs(data[index] ?? 0);
      const y = halfHeight + value * halfHeight;
      ctx.lineTo(x, y);
    }
    
    ctx.lineTo(this.width, halfHeight);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  
  private drawPeakHold(): void {
    const ctx = this.ctx;
    const halfHeight = this.height / 2;
    const y = halfHeight - this.peakHoldValue * halfHeight;
    
    ctx.strokeStyle = this.theme.peak;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 2]);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(this.width, y);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Mirror
    ctx.beginPath();
    ctx.moveTo(0, this.height - y);
    ctx.lineTo(this.width, this.height - y);
    ctx.stroke();
  }
}

// ============================================================================
// METER CANVAS
// ============================================================================

export class MeterCanvas extends BaseVisualizationCanvas {
  private orientation: 'horizontal' | 'vertical';
  private segments: number;
  private showPeak: boolean;
  private showRMS: boolean;
  private peakFalloff: number;
  private reference: number;
  private range: number;
  private stereo: boolean;
  
  private peakLevel: number = -Infinity;
  private rmsLevel: number = -Infinity;
  private peakHold: number = -Infinity;
  private peakHoldTime: number = 0;
  
  private rightPeakLevel: number = -Infinity;
  private rightRmsLevel: number = -Infinity;
  private rightPeakHold: number = -Infinity;
  
  constructor(options: MeterCanvasOptions = {}) {
    super(options);
    
    this.orientation = options.orientation ?? 'vertical';
    this.segments = options.segments ?? 40;
    this.showPeak = options.showPeak ?? true;
    this.showRMS = options.showRMS ?? true;
    // Note: showLUFS option is accepted but LUFS display is not yet implemented
    this.peakFalloff = options.peakFalloff ?? 0.5;
    this.reference = options.reference ?? 0;
    this.range = options.range ?? 60;
    this.stereo = options.stereo ?? false;
  }
  
  updateData(levels: number | number[]): void {
    if (typeof levels === 'number') {
      this.updateLevels(levels, levels, -Infinity);
    } else if (Array.isArray(levels)) {
      const [peak, rms, lufs, rightPeak, rightRms] = levels;
      this.updateLevels(peak ?? -Infinity, rms ?? -Infinity, lufs ?? -Infinity, rightPeak, rightRms);
    }
  }
  
  private updateLevels(peak: number, rms: number, _lufs: number, rightPeak?: number, rightRms?: number): void {
    // Smooth values
    this.peakLevel = Math.max(peak, this.peakLevel - this.peakFalloff);
    this.rmsLevel = this.rmsLevel * this.smoothing + rms * (1 - this.smoothing);
    // Note: LUFS display not yet implemented
    
    // Peak hold
    if (peak > this.peakHold) {
      this.peakHold = peak;
      this.peakHoldTime = performance.now();
    } else if (performance.now() - this.peakHoldTime > 2000) {
      this.peakHold -= 0.1;
    }
    
    // Stereo
    if (this.stereo && rightPeak !== undefined) {
      this.rightPeakLevel = Math.max(rightPeak, this.rightPeakLevel - this.peakFalloff);
      this.rightRmsLevel = this.rightRmsLevel * this.smoothing + (rightRms ?? rightPeak) * (1 - this.smoothing);
      
      if (rightPeak > this.rightPeakHold) {
        this.rightPeakHold = rightPeak;
      }
    }
  }
  
  protected render(): void {
    this.clear();
    
    if (this.stereo) {
      this.drawStereoMeter();
    } else {
      this.drawMonoMeter();
    }
    
    this.drawScale();
  }
  
  private drawMonoMeter(): void {
    const isVertical = this.orientation === 'vertical';
    const meterWidth = isVertical ? this.width - 30 : this.width;
    const meterHeight = isVertical ? this.height : this.height - 20;
    
    // RMS bar
    if (this.showRMS) {
      this.drawMeterBar(this.rmsLevel, 0, meterWidth * 0.6, meterHeight, 'rms');
    }
    
    // Peak bar
    if (this.showPeak) {
      const peakX = this.showRMS ? meterWidth * 0.65 : 0;
      const peakWidth = this.showRMS ? meterWidth * 0.35 : meterWidth;
      this.drawMeterBar(this.peakLevel, peakX, peakWidth, meterHeight, 'peak');
    }
    
    // Peak hold indicator
    this.drawPeakHold(this.peakHold, 0, meterWidth, meterHeight);
  }
  
  private drawStereoMeter(): void {
    const isVertical = this.orientation === 'vertical';
    const meterWidth = (isVertical ? this.width - 30 : this.width) / 2 - 2;
    const meterHeight = isVertical ? this.height : this.height - 20;
    
    // Left channel
    this.drawMeterBar(this.peakLevel, 0, meterWidth, meterHeight, 'peak');
    this.drawPeakHold(this.peakHold, 0, meterWidth, meterHeight);
    
    // Right channel
    const rightX = meterWidth + 4;
    this.drawMeterBar(this.rightPeakLevel, rightX, meterWidth, meterHeight, 'peak');
    this.drawPeakHold(this.rightPeakHold, rightX, meterWidth, meterHeight);
  }
  
  private drawMeterBar(level: number, x: number, width: number, height: number, _type: 'peak' | 'rms'): void {
    const ctx = this.ctx;
    const isVertical = this.orientation === 'vertical';
    
    // Convert dB to normalized value
    const normalized = this.dbToNormalized(level);
    
    // Create gradient
    const gradient = isVertical 
      ? ctx.createLinearGradient(0, height, 0, 0)
      : ctx.createLinearGradient(0, 0, width, 0);
    
    const colors = this.theme.gradient ?? DEFAULT_THEME.gradient!;
    colors.forEach((color, i) => {
      gradient.addColorStop(i / (colors.length - 1), color);
    });
    
    ctx.fillStyle = gradient;
    
    if (isVertical) {
      const barHeight = normalized * height;
      ctx.fillRect(x, height - barHeight, width, barHeight);
    } else {
      const barWidth = normalized * width;
      ctx.fillRect(x, 0, barWidth, height);
    }
    
    // Segment lines
    ctx.strokeStyle = this.theme.background;
    ctx.lineWidth = 1;
    
    for (let i = 1; i < this.segments; i++) {
      const pos = (i / this.segments) * (isVertical ? height : width);
      ctx.beginPath();
      if (isVertical) {
        ctx.moveTo(x, pos);
        ctx.lineTo(x + width, pos);
      } else {
        ctx.moveTo(x + pos, 0);
        ctx.lineTo(x + pos, height);
      }
      ctx.stroke();
    }
  }
  
  private drawPeakHold(level: number, x: number, width: number, height: number): void {
    const ctx = this.ctx;
    const isVertical = this.orientation === 'vertical';
    const normalized = this.dbToNormalized(level);
    
    ctx.fillStyle = level > this.reference ? this.theme.clip : this.theme.peak;
    
    if (isVertical) {
      const y = height - normalized * height;
      ctx.fillRect(x, y - 2, width, 4);
    } else {
      const barX = normalized * width;
      ctx.fillRect(x + barX - 2, 0, 4, height);
    }
  }
  
  private drawScale(): void {
    const ctx = this.ctx;
    const isVertical = this.orientation === 'vertical';
    
    ctx.fillStyle = this.theme.foreground;
    ctx.font = '9px Inter, sans-serif';
    
    const marks = [-60, -48, -36, -24, -12, -6, -3, 0, 3, 6];
    
    for (const db of marks) {
      if (db < -this.range || db > this.reference + 12) continue;
      
      const normalized = this.dbToNormalized(db);
      
      if (isVertical) {
        const y = this.height - normalized * this.height;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${db}`, this.width - 25, y);
      } else {
        const x = normalized * (this.width - 20);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`${db}`, x, this.height - 15);
      }
    }
  }
  
  private dbToNormalized(db: number): number {
    const minDb = -this.range;
    const maxDb = this.reference + 6;
    return Math.max(0, Math.min(1, (db - minDb) / (maxDb - minDb)));
  }
}

// ============================================================================
// SPECTRUM CANVAS
// ============================================================================

export class SpectrumCanvas extends BaseVisualizationCanvas {
  private minFreq: number;
  private maxFreq: number;
  private minDb: number;
  private maxDb: number;
  private scale: 'linear' | 'logarithmic';
  private style: 'bars' | 'line' | 'filled';
  private showFreqLabels: boolean;
  private showDbLabels: boolean;
  
  private smoothedData: Float32Array = new Float32Array(0);
  private sampleRate: number = 44100;
  
  constructor(options: SpectrumCanvasOptions = {}) {
    super(options);
    
    // Note: fftSize option is accepted but controlled externally
    this.minFreq = options.minFreq ?? 20;
    this.maxFreq = options.maxFreq ?? 20000;
    this.minDb = options.minDb ?? -90;
    this.maxDb = options.maxDb ?? 0;
    this.scale = options.scale ?? 'logarithmic';
    this.style = options.style ?? 'filled';
    this.showFreqLabels = options.showFreqLabels ?? true;
    this.showDbLabels = options.showDbLabels ?? true;
  }
  
  /**
   * Set sample rate
   */
  setSampleRate(rate: number): void {
    this.sampleRate = rate;
  }
  
  updateData(data: Float32Array): void {
    // Initialize smoothed data
    if (this.smoothedData.length !== data.length) {
      this.smoothedData = new Float32Array(data.length);
    }
    
    // Smooth
    for (let i = 0; i < data.length; i++) {
      const currentSmoothed = this.smoothedData[i] ?? 0;
      const currentData = data[i] ?? 0;
      this.smoothedData[i] = currentSmoothed * this.smoothing + currentData * (1 - this.smoothing);
    }
  }
  
  protected render(): void {
    this.clear();
    this.drawGrid();
    
    if (this.smoothedData.length === 0) return;
    
    switch (this.style) {
      case 'bars':
        this.drawBars();
        break;
      case 'line':
        this.drawLine();
        break;
      case 'filled':
        this.drawFilled();
        break;
    }
    
    if (this.showFreqLabels) this.drawFreqLabels();
    if (this.showDbLabels) this.drawDbLabels();
  }
  
  private drawGrid(): void {
    const ctx = this.ctx;
    ctx.strokeStyle = this.theme.grid;
    ctx.lineWidth = 0.5;
    
    // Frequency grid
    const freqs = this.scale === 'logarithmic'
      ? [30, 50, 100, 200, 500, 1000, 2000, 5000, 10000]
      : [2000, 4000, 6000, 8000, 10000, 12000, 14000, 16000, 18000];
    
    for (const freq of freqs) {
      const x = this.freqToX(freq);
      if (x > 0 && x < this.width - 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, this.height - 20);
        ctx.stroke();
      }
    }
    
    // dB grid
    for (let db = this.minDb; db <= this.maxDb; db += 12) {
      const y = this.dbToY(db);
      ctx.beginPath();
      ctx.moveTo(30, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
  }
  
  private drawBars(): void {
    const ctx = this.ctx;
    const barWidth = 3;
    const gap = 1;
    const numBars = Math.floor((this.width - 30) / (barWidth + gap));
    const binCount = this.smoothedData.length;
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, this.height, 0, 0);
    const gradientColors = this.theme.gradient ?? DEFAULT_THEME.gradient!;
    gradientColors.forEach((color, i) => {
      gradient.addColorStop(i / (gradientColors.length - 1), color);
    });
    ctx.fillStyle = gradient;
    
    for (let i = 0; i < numBars; i++) {
      const freq = this.xToFreq(30 + i * (barWidth + gap));
      const binIndex = Math.floor(freq / (this.sampleRate / 2) * binCount);
      
      if (binIndex >= 0 && binIndex < binCount) {
        const db = this.smoothedData[binIndex] ?? this.minDb;
        const y = this.dbToY(db);
        const x = 30 + i * (barWidth + gap);
        const barHeight = this.height - 20 - y;
        
        ctx.fillRect(x, y, barWidth, barHeight);
      }
    }
  }
  
  private drawLine(): void {
    const ctx = this.ctx;
    const binCount = this.smoothedData.length;
    
    ctx.strokeStyle = this.theme.foreground;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    
    let started = false;
    for (let x = 30; x < this.width; x++) {
      const freq = this.xToFreq(x);
      const binIndex = Math.floor(freq / (this.sampleRate / 2) * binCount);
      
      if (binIndex >= 0 && binIndex < binCount) {
        const db = this.smoothedData[binIndex] ?? this.minDb;
        const y = this.dbToY(db);
        
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
    }
    
    ctx.stroke();
  }
  
  private drawFilled(): void {
    const ctx = this.ctx;
    const binCount = this.smoothedData.length;
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, this.height, 0, 0);
    const gradientColors = this.theme.gradient ?? DEFAULT_THEME.gradient!;
    gradientColors.forEach((color, i) => {
      gradient.addColorStop(i / (gradientColors.length - 1), color);
    });
    
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(30, this.height - 20);
    
    for (let x = 30; x < this.width; x++) {
      const freq = this.xToFreq(x);
      const binIndex = Math.floor(freq / (this.sampleRate / 2) * binCount);
      
      if (binIndex >= 0 && binIndex < binCount) {
        const db = this.smoothedData[binIndex] ?? this.minDb;
        const y = this.dbToY(db);
        ctx.lineTo(x, y);
      }
    }
    
    ctx.lineTo(this.width, this.height - 20);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    
    // Draw line on top
    this.drawLine();
  }
  
  private drawFreqLabels(): void {
    const ctx = this.ctx;
    ctx.fillStyle = this.theme.foreground;
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    const labels = this.scale === 'logarithmic'
      ? [50, 100, 200, 500, '1k', '2k', '5k', '10k']
      : ['2k', '4k', '6k', '8k', '10k', '12k', '14k', '16k'];
    
    const freqs = this.scale === 'logarithmic'
      ? [50, 100, 200, 500, 1000, 2000, 5000, 10000]
      : [2000, 4000, 6000, 8000, 10000, 12000, 14000, 16000];
    
    for (let i = 0; i < freqs.length; i++) {
      const freq = freqs[i];
      const label = labels[i];
      if (freq !== undefined && label !== undefined) {
        const x = this.freqToX(freq);
        if (x > 40 && x < this.width - 20) {
          ctx.fillText(String(label), x, this.height - 15);
        }
      }
    }
  }
  
  private drawDbLabels(): void {
    const ctx = this.ctx;
    ctx.fillStyle = this.theme.foreground;
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    for (let db = this.minDb; db <= this.maxDb; db += 12) {
      const y = this.dbToY(db);
      ctx.fillText(`${db}`, 25, y);
    }
  }
  
  private freqToX(freq: number): number {
    const graphWidth = this.width - 30;
    
    if (this.scale === 'logarithmic') {
      const logMin = Math.log10(this.minFreq);
      const logMax = Math.log10(this.maxFreq);
      const logFreq = Math.log10(Math.max(this.minFreq, Math.min(this.maxFreq, freq)));
      return 30 + ((logFreq - logMin) / (logMax - logMin)) * graphWidth;
    } else {
      return 30 + ((freq - this.minFreq) / (this.maxFreq - this.minFreq)) * graphWidth;
    }
  }
  
  private xToFreq(x: number): number {
    const graphWidth = this.width - 30;
    const normalized = (x - 30) / graphWidth;
    
    if (this.scale === 'logarithmic') {
      const logMin = Math.log10(this.minFreq);
      const logMax = Math.log10(this.maxFreq);
      return Math.pow(10, logMin + normalized * (logMax - logMin));
    } else {
      return this.minFreq + normalized * (this.maxFreq - this.minFreq);
    }
  }
  
  private dbToY(db: number): number {
    const graphHeight = this.height - 20;
    const normalized = (db - this.minDb) / (this.maxDb - this.minDb);
    return graphHeight - normalized * graphHeight;
  }
}

// ============================================================================
// OSCILLOSCOPE CANVAS
// ============================================================================

export class OscilloscopeCanvas extends BaseVisualizationCanvas {
  private voltageScale: number;
  private triggerLevel: number;
  private triggerEdge: 'rising' | 'falling';
  private showGrid: boolean;
  private showTrigger: boolean;
  private persistence: number;
  
  private waveformData: Float32Array = new Float32Array(0);
  private previousFrames: ImageData[] = [];
  private maxPersistenceFrames: number = 10;
  
  constructor(options: OscilloscopeCanvasOptions = {}) {
    super(options);
    
    // Note: timeScale option is accepted but controlled externally
    this.voltageScale = options.voltageScale ?? 1;
    this.triggerLevel = options.triggerLevel ?? 0;
    this.triggerEdge = options.triggerEdge ?? 'rising';
    this.showGrid = options.showGrid ?? true;
    this.showTrigger = options.showTrigger ?? true;
    this.persistence = options.persistence ?? 0;
  }
  
  updateData(data: Float32Array): void {
    this.waveformData = data;
  }
  
  protected render(): void {
    // Persistence effect
    if (this.persistence > 0 && this.previousFrames.length > 0) {
      this.drawPersistence();
    } else {
      this.clear();
    }
    
    if (this.showGrid) {
      this.drawGrid();
    }
    
    if (this.showTrigger) {
      this.drawTriggerLevel();
    }
    
    if (this.waveformData.length === 0) return;
    
    this.drawWaveform();
    
    // Store frame for persistence
    if (this.persistence > 0) {
      this.storeFrame();
    }
  }
  
  private drawPersistence(): void {
    this.clear();
    
    const ctx = this.ctx;
    for (let i = 0; i < this.previousFrames.length; i++) {
      const frame = this.previousFrames[i];
      if (frame) {
        const alpha = (i / this.previousFrames.length) * this.persistence;
        ctx.globalAlpha = alpha;
        ctx.putImageData(frame, 0, 0);
      }
    }
    ctx.globalAlpha = 1;
  }
  
  private storeFrame(): void {
    const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
    this.previousFrames.push(imageData);
    
    if (this.previousFrames.length > this.maxPersistenceFrames) {
      this.previousFrames.shift();
    }
  }
  
  private drawGrid(): void {
    const ctx = this.ctx;
    ctx.strokeStyle = this.theme.grid;
    ctx.lineWidth = 0.5;
    
    // Vertical divisions (time)
    const xDivisions = 10;
    for (let i = 0; i <= xDivisions; i++) {
      const x = (this.width / xDivisions) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    
    // Horizontal divisions (voltage)
    const yDivisions = 8;
    for (let i = 0; i <= yDivisions; i++) {
      const y = (this.height / yDivisions) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
    
    // Center lines (brighter)
    ctx.strokeStyle = this.theme.foreground;
    ctx.globalAlpha = 0.3;
    
    ctx.beginPath();
    ctx.moveTo(this.width / 2, 0);
    ctx.lineTo(this.width / 2, this.height);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, this.height / 2);
    ctx.lineTo(this.width, this.height / 2);
    ctx.stroke();
    
    ctx.globalAlpha = 1;
  }
  
  private drawTriggerLevel(): void {
    const ctx = this.ctx;
    const y = this.height / 2 - this.triggerLevel * (this.height / 2) / this.voltageScale;
    
    ctx.strokeStyle = this.theme.peak;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(this.width, y);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Trigger arrow
    ctx.fillStyle = this.theme.peak;
    const arrowY = y + (this.triggerEdge === 'rising' ? -5 : 5);
    ctx.beginPath();
    ctx.moveTo(5, arrowY);
    ctx.lineTo(15, y);
    ctx.lineTo(5, y - (this.triggerEdge === 'rising' ? -5 : 5));
    ctx.fill();
  }
  
  private drawWaveform(): void {
    const ctx = this.ctx;
    const data = this.waveformData;
    const halfHeight = this.height / 2;
    
    // Find trigger point
    let triggerIndex = this.findTriggerPoint(data);
    
    ctx.strokeStyle = this.theme.accent;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    
    const samplesPerPixel = data.length / this.width;
    
    for (let x = 0; x < this.width; x++) {
      const index = triggerIndex + Math.floor(x * samplesPerPixel);
      if (index < 0 || index >= data.length) continue;
      
      const value = data[index];
      if (value === undefined) continue;
      const y = halfHeight - (value / this.voltageScale) * halfHeight;
      
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
  }
  
  private findTriggerPoint(data: Float32Array): number {
    const level = this.triggerLevel;
    const isRising = this.triggerEdge === 'rising';
    
    for (let i = 1; i < data.length / 2; i++) {
      const prev = data[i - 1];
      const curr = data[i];
      
      if (prev === undefined || curr === undefined) continue;
      
      if (isRising && prev < level && curr >= level) {
        return i;
      } else if (!isRising && prev > level && curr <= level) {
        return i;
      }
    }
    
    return 0;
  }
}

// ============================================================================
// FACTORIES
// ============================================================================

export function createWaveformCanvas(options?: WaveformCanvasOptions): WaveformCanvas {
  return new WaveformCanvas(options);
}

export function createMeterCanvas(options?: MeterCanvasOptions): MeterCanvas {
  return new MeterCanvas(options);
}

export function createSpectrumCanvas(options?: SpectrumCanvasOptions): SpectrumCanvas {
  return new SpectrumCanvas(options);
}

export function createOscilloscopeCanvas(options?: OscilloscopeCanvasOptions): OscilloscopeCanvas {
  return new OscilloscopeCanvas(options);
}

// ============================================================================
// CSS
// ============================================================================

export const VISUALIZATION_CANVAS_CSS = `
.visualization-canvas {
  display: block;
  border-radius: 4px;
  background: var(--cardplay-viz-bg, #1a1a1a);
}

.visualization-container {
  position: relative;
  display: inline-block;
}

.visualization-label {
  position: absolute;
  top: 4px;
  left: 8px;
  font-size: 10px;
  color: var(--cardplay-text-secondary, #888);
  pointer-events: none;
}
`;
