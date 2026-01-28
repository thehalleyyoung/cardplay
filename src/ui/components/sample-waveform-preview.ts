/**
 * @fileoverview Sample Waveform Preview Component
 * 
 * Comprehensive waveform preview panel for the sample browser.
 * Features:
 * - Zoomable waveform display
 * - Start/end selection markers
 * - Loop region display
 * - Transient detection and markers
 * - Metadata panel (tempo, key, sample rate, etc.)
 * - Peak/RMS toggle
 * - Spectrum preview
 * - Loudness display
 * 
 * @module @cardplay/ui/components/sample-waveform-preview
 */

import type { SampleMetadata } from './sample-browser';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Waveform preview configuration.
 */
export interface WaveformPreviewConfig {
  /** Canvas width in pixels */
  width?: number;
  /** Canvas height in pixels */
  height?: number;
  /** Show grid lines */
  showGrid?: boolean;
  /** Show transient markers */
  showTransients?: boolean;
  /** Show loop region */
  showLoopRegion?: boolean;
  /** Waveform display mode */
  displayMode?: WaveformDisplayMode;
  /** Color scheme */
  colors?: WaveformColors;
  /** Enable zoom controls */
  enableZoom?: boolean;
  /** Enable selection */
  enableSelection?: boolean;
}

/**
 * Waveform display mode.
 */
export type WaveformDisplayMode = 
  | 'peak'           // Peak waveform (default)
  | 'rms'            // RMS waveform
  | 'both'           // Peak + RMS overlay
  | 'mirror'         // Mirrored waveform
  | 'spectrum';      // Spectrogram view

/**
 * Color scheme for waveform preview.
 */
export interface WaveformColors {
  background: string;
  waveform: string;
  waveformFill: string;
  grid: string;
  selection: string;
  loopRegion: string;
  transientMarker: string;
  playhead: string;
  rms: string;
}

/**
 * Selection region.
 */
export interface SelectionRegion {
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
}

/**
 * Loop region.
 */
export interface LoopRegion {
  /** Loop start time in seconds */
  start: number;
  /** Loop end time in seconds */
  end: number;
  /** Loop crossfade length in seconds */
  crossfade: number;
}

/**
 * Transient marker.
 */
export interface TransientMarker {
  /** Time position in seconds */
  time: number;
  /** Transient strength (0-1) */
  strength: number;
  /** Marker type */
  type: 'onset' | 'peak' | 'zero-crossing';
}

/**
 * Waveform data.
 */
export interface WaveformData {
  /** Peak samples (downsampled for display) */
  peaks: Float32Array;
  /** RMS samples (downsampled for display) */
  rms: Float32Array;
  /** Sample rate */
  sampleRate: number;
  /** Duration in seconds */
  duration: number;
  /** Number of channels */
  channels: number;
}

/**
 * Zoom state.
 */
export interface ZoomState {
  /** Zoom level (1 = no zoom, 2 = 2x zoom, etc.) */
  level: number;
  /** Center position (0-1, normalized) */
  center: number;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const DEFAULT_CONFIG: Required<WaveformPreviewConfig> = {
  width: 800,
  height: 200,
  showGrid: true,
  showTransients: true,
  showLoopRegion: true,
  displayMode: 'peak',
  colors: {
    background: '#1a1a1a',
    waveform: '#4CAF50',
    waveformFill: 'rgba(76, 175, 80, 0.3)',
    grid: '#333333',
    selection: 'rgba(33, 150, 243, 0.3)',
    loopRegion: 'rgba(255, 152, 0, 0.2)',
    transientMarker: '#FF5722',
    playhead: '#FFFFFF',
    rms: '#FFC107'
  },
  enableZoom: true,
  enableSelection: true
};

// ============================================================================
// WAVEFORM PREVIEW CLASS
// ============================================================================

/**
 * Sample waveform preview component.
 */
export class SampleWaveformPreview {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: Required<WaveformPreviewConfig>;
  
  private waveformData: WaveformData | null = null;
  private selection: SelectionRegion | null = null;
  private loopRegion: LoopRegion | null = null;
  private transients: TransientMarker[] = [];
  private zoom: ZoomState = { level: 1, center: 0.5 };
  private playheadPosition: number = 0; // 0-1 normalized
  
  private isDragging: boolean = false;
  private dragType: 'selection-start' | 'selection-end' | 'loop-start' | 'loop-end' | 'scroll' | null = null;
  
  /**
   * Create a new waveform preview.
   */
  constructor(config: WaveformPreviewConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.config.width;
    this.canvas.height = this.config.height;
    this.canvas.style.cursor = 'crosshair';
    
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas 2D context');
    }
    this.ctx = ctx;
    
    // Setup event listeners
    this.setupEventListeners();
  }
  
  /**
   * Get the canvas element.
   */
  getElement(): HTMLCanvasElement {
    return this.canvas;
  }
  
  /**
   * Load audio data for preview.
   */
  async loadAudio(audioBuffer: AudioBuffer): Promise<void> {
    this.waveformData = await this.generateWaveformData(audioBuffer);
    this.transients = await this.detectTransients(audioBuffer);
    this.render();
  }
  
  /**
   * Set sample metadata (for UI purposes).
   */
  setMetadata(metadata: SampleMetadata): void {
    // Auto-detect loop region from metadata if available
    if (metadata.bpm && metadata.duration) {
      // Default to 1-bar loop for rhythmic samples
      const beatDuration = 60 / metadata.bpm;
      const barDuration = beatDuration * 4;
      if (metadata.duration >= barDuration) {
        this.loopRegion = {
          start: 0,
          end: Math.min(barDuration, metadata.duration),
          crossfade: 0.01 // 10ms default crossfade
        };
      }
    }
  }
  
  /**
   * Set selection region.
   */
  setSelection(selection: SelectionRegion | null): void {
    this.selection = selection;
    this.render();
  }
  
  /**
   * Get current selection.
   */
  getSelection(): SelectionRegion | null {
    return this.selection;
  }
  
  /**
   * Set loop region.
   */
  setLoopRegion(loop: LoopRegion | null): void {
    this.loopRegion = loop;
    this.render();
  }
  
  /**
   * Get current loop region.
   */
  getLoopRegion(): LoopRegion | null {
    return this.loopRegion;
  }
  
  /**
   * Set zoom level and center.
   */
  setZoom(level: number, center?: number): void {
    this.zoom.level = Math.max(1, Math.min(100, level));
    if (center !== undefined) {
      this.zoom.center = Math.max(0, Math.min(1, center));
    }
    this.render();
  }
  
  /**
   * Get current zoom state.
   */
  getZoom(): ZoomState {
    return { ...this.zoom };
  }
  
  /**
   * Set playhead position (0-1 normalized).
   */
  setPlayhead(position: number): void {
    this.playheadPosition = Math.max(0, Math.min(1, position));
    this.render();
  }
  
  /**
   * Set display mode.
   */
  setDisplayMode(mode: WaveformDisplayMode): void {
    this.config.displayMode = mode;
    this.render();
  }
  
  /**
   * Set color scheme.
   */
  setColors(colors: Partial<WaveformColors>): void {
    this.config.colors = { ...this.config.colors, ...colors };
    this.render();
  }
  
  /**
   * Export selected region as audio buffer.
   */
  exportSelection(): AudioBuffer | null {
    if (!this.waveformData || !this.selection) return null;
    
    // This would need the original audio buffer
    // Implementation depends on how audio data is stored
    return null;
  }
  
  /**
   * Find zero-crossing near a time position (for clean cuts).
   */
  findZeroCrossing(time: number): number {
    if (!this.waveformData) return time;
    
    const sampleRate = this.waveformData.sampleRate;
    const sample = Math.floor(time * sampleRate);
    const searchWindow = Math.floor(sampleRate * 0.01); // 10ms window
    
    // Search for zero crossing in both directions
    const peaks = this.waveformData.peaks;
    let minDistance = Infinity;
    let bestSample = sample;
    
    for (let i = -searchWindow; i <= searchWindow; i++) {
      const idx = sample + i;
      if (idx >= 0 && idx < peaks.length - 1) {
        const current = peaks[idx] ?? 0;
        const next = peaks[idx + 1] ?? 0;
        
        // Check for sign change (zero crossing)
        if (current * next <= 0) {
          const distance = Math.abs(i);
          if (distance < minDistance) {
            minDistance = distance;
            bestSample = idx;
          }
        }
      }
    }
    
    return bestSample / sampleRate;
  }
  
  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================
  
  /**
   * Generate downsampled waveform data for display.
   */
  private async generateWaveformData(audioBuffer: AudioBuffer): Promise<WaveformData> {
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;
    const channels = audioBuffer.numberOfChannels;
    
    // Downsample to approximately 1 sample per pixel
    const targetSamples = this.config.width * 2; // Oversample for zoom
    const blockSize = Math.floor(audioBuffer.length / targetSamples);
    
    const peaks = new Float32Array(targetSamples);
    const rms = new Float32Array(targetSamples);
    
    // Mix down to mono for display
    const channelData = audioBuffer.getChannelData(0);
    
    for (let i = 0; i < targetSamples; i++) {
      const start = i * blockSize;
      const end = Math.min(start + blockSize, audioBuffer.length);
      
      let max = 0;
      let sumSquares = 0;
      const count = end - start;
      
      for (let j = start; j < end; j++) {
        const sample = Math.abs(channelData[j] ?? 0);
        max = Math.max(max, sample);
        sumSquares += sample * sample;
      }
      
      peaks[i] = max;
      rms[i] = Math.sqrt(sumSquares / count);
    }
    
    return {
      peaks,
      rms,
      sampleRate,
      duration,
      channels
    };
  }
  
  /**
   * Detect transients in audio.
   */
  private async detectTransients(audioBuffer: AudioBuffer): Promise<TransientMarker[]> {
    if (!this.config.showTransients) return [];
    
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const transients: TransientMarker[] = [];
    
    // Simple onset detection using spectral flux
    const windowSize = Math.floor(sampleRate * 0.01); // 10ms window
    const hopSize = Math.floor(windowSize / 2);
    const threshold = 0.3; // Onset threshold
    
    let prevEnergy = 0;
    
    for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
      let energy = 0;
      for (let j = 0; j < windowSize; j++) {
        const sample = channelData[i + j] ?? 0;
        energy += sample * sample;
      }
      energy = Math.sqrt(energy / windowSize);
      
      // Detect sharp increase in energy
      const flux = energy - prevEnergy;
      if (flux > threshold && prevEnergy < energy * 0.5) {
        transients.push({
          time: i / sampleRate,
          strength: flux,
          type: 'onset'
        });
      }
      
      prevEnergy = energy;
    }
    
    return transients;
  }
  
  /**
   * Setup mouse/touch event listeners.
   */
  private setupEventListeners(): void {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
    this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
  }
  
  /**
   * Handle mouse down event.
   */
  private handleMouseDown(event: MouseEvent): void {
    if (!this.config.enableSelection) return;
    
    const x = event.offsetX;
    const time = this.pixelToTime(x);
    
    // Check if clicking on existing markers
    if (this.selection) {
      const startX = this.timeToPixel(this.selection.start);
      const endX = this.timeToPixel(this.selection.end);
      
      if (Math.abs(x - startX) < 5) {
        this.dragType = 'selection-start';
        this.isDragging = true;
        return;
      }
      if (Math.abs(x - endX) < 5) {
        this.dragType = 'selection-end';
        this.isDragging = true;
        return;
      }
    }
    
    if (this.loopRegion) {
      const startX = this.timeToPixel(this.loopRegion.start);
      const endX = this.timeToPixel(this.loopRegion.end);
      
      if (Math.abs(x - startX) < 5) {
        this.dragType = 'loop-start';
        this.isDragging = true;
        return;
      }
      if (Math.abs(x - endX) < 5) {
        this.dragType = 'loop-end';
        this.isDragging = true;
        return;
      }
    }
    
    // Start new selection
    this.selection = { start: time, end: time };
    this.isDragging = true;
    this.dragType = 'selection-end';
  }
  
  /**
   * Handle mouse move event.
   */
  private handleMouseMove(event: MouseEvent): void {
    if (!this.isDragging) {
      // Update cursor based on hover position
      this.updateCursor(event.offsetX);
      return;
    }
    
    const time = this.pixelToTime(event.offsetX);
    
    switch (this.dragType) {
      case 'selection-start':
        if (this.selection && time < this.selection.end) {
          this.selection.start = time;
          this.render();
        }
        break;
      
      case 'selection-end':
        if (this.selection && time > this.selection.start) {
          this.selection.end = time;
          this.render();
        }
        break;
      
      case 'loop-start':
        if (this.loopRegion && time < this.loopRegion.end) {
          this.loopRegion.start = time;
          this.render();
        }
        break;
      
      case 'loop-end':
        if (this.loopRegion && time > this.loopRegion.start) {
          this.loopRegion.end = time;
          this.render();
        }
        break;
    }
  }
  
  /**
   * Handle mouse up event.
   */
  private handleMouseUp(): void {
    this.isDragging = false;
    this.dragType = null;
  }
  
  /**
   * Handle mouse wheel event (zoom).
   */
  private handleWheel(event: WheelEvent): void {
    if (!this.config.enableZoom) return;
    
    event.preventDefault();
    
    const delta = -event.deltaY * 0.001;
    const newZoom = this.zoom.level * (1 + delta);
    
    // Update zoom center to mouse position
    const mousePos = event.offsetX / this.config.width;
    this.setZoom(newZoom, mousePos);
  }
  
  /**
   * Handle double click (create loop region from selection).
   */
  private handleDoubleClick(_event: MouseEvent): void {
    if (this.selection) {
      this.loopRegion = {
        start: this.selection.start,
        end: this.selection.end,
        crossfade: 0.01
      };
      this.render();
    }
  }
  
  /**
   * Update cursor based on hover position.
   */
  private updateCursor(x: number): void {
    let cursor = 'crosshair';
    
    // Check if hovering over markers
    if (this.selection) {
      const startX = this.timeToPixel(this.selection.start);
      const endX = this.timeToPixel(this.selection.end);
      
      if (Math.abs(x - startX) < 5 || Math.abs(x - endX) < 5) {
        cursor = 'ew-resize';
      }
    }
    
    if (this.loopRegion) {
      const startX = this.timeToPixel(this.loopRegion.start);
      const endX = this.timeToPixel(this.loopRegion.end);
      
      if (Math.abs(x - startX) < 5 || Math.abs(x - endX) < 5) {
        cursor = 'ew-resize';
      }
    }
    
    this.canvas.style.cursor = cursor;
  }
  
  /**
   * Convert pixel X coordinate to time in seconds.
   */
  private pixelToTime(x: number): number {
    if (!this.waveformData) return 0;
    
    const viewStart = (this.zoom.center - 0.5 / this.zoom.level) * this.waveformData.duration;
    const viewEnd = (this.zoom.center + 0.5 / this.zoom.level) * this.waveformData.duration;
    
    return viewStart + (x / this.config.width) * (viewEnd - viewStart);
  }
  
  /**
   * Convert time in seconds to pixel X coordinate.
   */
  private timeToPixel(time: number): number {
    if (!this.waveformData) return 0;
    
    const viewStart = (this.zoom.center - 0.5 / this.zoom.level) * this.waveformData.duration;
    const viewEnd = (this.zoom.center + 0.5 / this.zoom.level) * this.waveformData.duration;
    
    return ((time - viewStart) / (viewEnd - viewStart)) * this.config.width;
  }
  
  /**
   * Render the waveform preview.
   */
  private render(): void {
    this.ctx.clearRect(0, 0, this.config.width, this.config.height);
    
    // Background
    this.ctx.fillStyle = this.config.colors.background;
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);
    
    if (!this.waveformData) return;
    
    // Grid
    if (this.config.showGrid) {
      this.drawGrid();
    }
    
    // Loop region (behind waveform)
    if (this.loopRegion && this.config.showLoopRegion) {
      this.drawLoopRegion();
    }
    
    // Selection (behind waveform)
    if (this.selection) {
      this.drawSelection();
    }
    
    // Waveform
    switch (this.config.displayMode) {
      case 'peak':
        this.drawPeakWaveform();
        break;
      case 'rms':
        this.drawRMSWaveform();
        break;
      case 'both':
        this.drawPeakWaveform();
        this.drawRMSWaveform();
        break;
      case 'mirror':
        this.drawMirrorWaveform();
        break;
      case 'spectrum':
        // Spectrogram would be more complex, draw peak for now
        this.drawPeakWaveform();
        break;
    }
    
    // Transients
    if (this.config.showTransients) {
      this.drawTransients();
    }
    
    // Playhead
    if (this.playheadPosition > 0) {
      this.drawPlayhead();
    }
  }
  
  /**
   * Draw grid lines.
   */
  private drawGrid(): void {
    const ctx = this.ctx;
    ctx.strokeStyle = this.config.colors.grid;
    ctx.lineWidth = 1;
    
    // Horizontal center line
    ctx.beginPath();
    ctx.moveTo(0, this.config.height / 2);
    ctx.lineTo(this.config.width, this.config.height / 2);
    ctx.stroke();
    
    // Vertical time divisions
    const divisions = 8;
    for (let i = 1; i < divisions; i++) {
      const x = (this.config.width / divisions) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.config.height);
      ctx.stroke();
    }
  }
  
  /**
   * Draw selection region.
   */
  private drawSelection(): void {
    if (!this.selection || !this.waveformData) return;
    
    const startX = this.timeToPixel(this.selection.start);
    const endX = this.timeToPixel(this.selection.end);
    
    this.ctx.fillStyle = this.config.colors.selection;
    this.ctx.fillRect(startX, 0, endX - startX, this.config.height);
    
    // Selection markers
    this.ctx.strokeStyle = this.config.colors.selection;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(startX, 0);
    this.ctx.lineTo(startX, this.config.height);
    this.ctx.moveTo(endX, 0);
    this.ctx.lineTo(endX, this.config.height);
    this.ctx.stroke();
  }
  
  /**
   * Draw loop region.
   */
  private drawLoopRegion(): void {
    if (!this.loopRegion || !this.waveformData) return;
    
    const startX = this.timeToPixel(this.loopRegion.start);
    const endX = this.timeToPixel(this.loopRegion.end);
    
    this.ctx.fillStyle = this.config.colors.loopRegion;
    this.ctx.fillRect(startX, 0, endX - startX, this.config.height);
    
    // Loop markers
    this.ctx.strokeStyle = this.config.colors.loopRegion;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(startX, 0);
    this.ctx.lineTo(startX, this.config.height);
    this.ctx.moveTo(endX, 0);
    this.ctx.lineTo(endX, this.config.height);
    this.ctx.stroke();
  }
  
  /**
   * Draw peak waveform.
   */
  private drawPeakWaveform(): void {
    const data = this.waveformData;
    if (!data) return;
    
    const ctx = this.ctx;
    const height = this.config.height;
    const halfHeight = height / 2;
    
    // Calculate visible range
    const viewStart = (this.zoom.center - 0.5 / this.zoom.level);
    const viewEnd = (this.zoom.center + 0.5 / this.zoom.level);
    
    const startSample = Math.floor(viewStart * data.peaks.length);
    const endSample = Math.ceil(viewEnd * data.peaks.length);
    const visibleSamples = endSample - startSample;
    
    ctx.fillStyle = this.config.colors.waveformFill;
    ctx.strokeStyle = this.config.colors.waveform;
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    ctx.moveTo(0, halfHeight);
    
    // Draw top half
    for (let x = 0; x < this.config.width; x++) {
      const sampleIndex = startSample + Math.floor((x / this.config.width) * visibleSamples);
      const value = data.peaks[sampleIndex] ?? 0;
      const y = halfHeight - value * halfHeight;
      ctx.lineTo(x, y);
    }
    
    // Draw bottom half (mirror)
    for (let x = this.config.width - 1; x >= 0; x--) {
      const sampleIndex = startSample + Math.floor((x / this.config.width) * visibleSamples);
      const value = data.peaks[sampleIndex] ?? 0;
      const y = halfHeight + value * halfHeight;
      ctx.lineTo(x, y);
    }
    
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  
  /**
   * Draw RMS waveform.
   */
  private drawRMSWaveform(): void {
    const data = this.waveformData;
    if (!data) return;
    
    const ctx = this.ctx;
    const height = this.config.height;
    const halfHeight = height / 2;
    
    const viewStart = (this.zoom.center - 0.5 / this.zoom.level);
    const viewEnd = (this.zoom.center + 0.5 / this.zoom.level);
    
    const startSample = Math.floor(viewStart * data.rms.length);
    const endSample = Math.ceil(viewEnd * data.rms.length);
    const visibleSamples = endSample - startSample;
    
    ctx.strokeStyle = this.config.colors.rms;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let x = 0; x < this.config.width; x++) {
      const sampleIndex = startSample + Math.floor((x / this.config.width) * visibleSamples);
      const value = data.rms[sampleIndex] ?? 0;
      const y = halfHeight - value * halfHeight;
      
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
  }
  
  /**
   * Draw mirror waveform.
   */
  private drawMirrorWaveform(): void {
    const data = this.waveformData;
    if (!data) return;
    
    const ctx = this.ctx;
    const height = this.config.height;
    const halfHeight = height / 2;
    
    const viewStart = (this.zoom.center - 0.5 / this.zoom.level);
    const viewEnd = (this.zoom.center + 0.5 / this.zoom.level);
    
    const startSample = Math.floor(viewStart * data.peaks.length);
    const endSample = Math.ceil(viewEnd * data.peaks.length);
    const visibleSamples = endSample - startSample;
    
    ctx.fillStyle = this.config.colors.waveformFill;
    ctx.strokeStyle = this.config.colors.waveform;
    ctx.lineWidth = 1;
    
    // Top waveform
    ctx.beginPath();
    ctx.moveTo(0, halfHeight);
    
    for (let x = 0; x < this.config.width; x++) {
      const sampleIndex = startSample + Math.floor((x / this.config.width) * visibleSamples);
      const value = data.peaks[sampleIndex] ?? 0;
      const y = halfHeight - value * halfHeight;
      ctx.lineTo(x, y);
    }
    
    ctx.lineTo(this.config.width, halfHeight);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Bottom waveform (mirrored)
    ctx.beginPath();
    ctx.moveTo(0, halfHeight);
    
    for (let x = 0; x < this.config.width; x++) {
      const sampleIndex = startSample + Math.floor((x / this.config.width) * visibleSamples);
      const value = data.peaks[sampleIndex] ?? 0;
      const y = halfHeight + value * halfHeight;
      ctx.lineTo(x, y);
    }
    
    ctx.lineTo(this.config.width, halfHeight);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  
  /**
   * Draw transient markers.
   */
  private drawTransients(): void {
    if (!this.waveformData) return;
    
    const ctx = this.ctx;
    ctx.strokeStyle = this.config.colors.transientMarker;
    ctx.lineWidth = 1;
    
    for (const transient of this.transients) {
      const x = this.timeToPixel(transient.time);
      
      // Only draw if visible
      if (x >= 0 && x <= this.config.width) {
        const height = this.config.height * transient.strength;
        ctx.beginPath();
        ctx.moveTo(x, (this.config.height - height) / 2);
        ctx.lineTo(x, (this.config.height + height) / 2);
        ctx.stroke();
      }
    }
  }
  
  /**
   * Draw playhead.
   */
  private drawPlayhead(): void {
    if (!this.waveformData) return;
    
    const time = this.playheadPosition * this.waveformData.duration;
    const x = this.timeToPixel(time);
    
    if (x >= 0 && x <= this.config.width) {
      const ctx = this.ctx;
      ctx.strokeStyle = this.config.colors.playhead;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.config.height);
      ctx.stroke();
    }
  }
}

// ============================================================================
// METADATA PANEL
// ============================================================================

/**
 * Sample metadata display panel.
 */
export interface MetadataPanelConfig {
  showTempo?: boolean;
  showKey?: boolean;
  showSampleRate?: boolean;
  showBitDepth?: boolean;
  showChannels?: boolean;
  showDuration?: boolean;
  showFileSize?: boolean;
  showFormat?: boolean;
  editable?: boolean;
}

/**
 * Create metadata panel HTML.
 */
export function createMetadataPanel(
  metadata: SampleMetadata,
  config: MetadataPanelConfig = {}
): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'sample-metadata-panel';
  panel.style.cssText = `
    padding: 12px;
    background: #2a2a2a;
    border-radius: 4px;
    font-family: monospace;
    font-size: 12px;
    color: #e0e0e0;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 8px 16px;
  `;
  
  const addField = (label: string, value: string, show: boolean = true) => {
    if (!show) return;
    
    const labelEl = document.createElement('div');
    labelEl.textContent = label + ':';
    labelEl.style.fontWeight = 'bold';
    labelEl.style.color = '#888';
    
    const valueEl = document.createElement('div');
    valueEl.textContent = value;
    
    panel.appendChild(labelEl);
    panel.appendChild(valueEl);
  };
  
  // File info
  addField('Name', metadata.name, true);
  addField('Format', metadata.format.toUpperCase(), config.showFormat !== false);
  addField('Size', formatFileSize(metadata.sizeBytes), config.showFileSize !== false);
  
  // Audio info
  addField('Duration', formatDuration(metadata.duration), config.showDuration !== false);
  addField('Sample Rate', `${metadata.sampleRate} Hz`, config.showSampleRate !== false);
  addField('Channels', metadata.channels === 1 ? 'Mono' : 'Stereo', config.showChannels !== false);
  
  // Musical info
  if (metadata.key) {
    addField('Key', metadata.key, config.showKey !== false);
  }
  if (metadata.bpm) {
    addField('Tempo', `${metadata.bpm.toFixed(1)} BPM`, config.showTempo !== false);
  }
  
  // Tags
  if (metadata.tags.length > 0) {
    addField('Tags', metadata.tags.join(', '), true);
  }
  
  return panel;
}

/**
 * Format file size in human-readable format.
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format duration in human-readable format.
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(2);
  return mins > 0 ? `${mins}:${secs.padStart(5, '0')}` : `${secs}s`;
}

// ============================================================================
// EDITABLE METADATA PANEL
// ============================================================================

/**
 * Metadata field change callback.
 */
export type MetadataChangeCallback = (field: string, value: string | number) => void;

/**
 * Create editable metadata panel.
 */
export function createEditableMetadataPanel(
  metadata: SampleMetadata,
  onChange: MetadataChangeCallback,
  config: MetadataPanelConfig = {}
): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'sample-metadata-panel editable';
  panel.style.cssText = `
    padding: 12px;
    background: #2a2a2a;
    border-radius: 4px;
    font-family: monospace;
    font-size: 12px;
    color: #e0e0e0;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 8px 16px;
  `;
  
  const addEditableField = (label: string, field: string, value: string | number, type: 'text' | 'number' = 'text') => {
    const labelEl = document.createElement('div');
    labelEl.textContent = label + ':';
    labelEl.style.fontWeight = 'bold';
    labelEl.style.color = '#888';
    
    const input = document.createElement('input');
    input.type = type;
    input.value = String(value);
    input.style.cssText = `
      background: #1a1a1a;
      border: 1px solid #444;
      border-radius: 3px;
      color: #e0e0e0;
      padding: 4px 8px;
      font-family: monospace;
      font-size: 12px;
      width: 100%;
    `;
    
    input.addEventListener('change', () => {
      const newValue = type === 'number' ? parseFloat(input.value) : input.value;
      onChange(field, newValue);
    });
    
    panel.appendChild(labelEl);
    panel.appendChild(input);
  };
  
  const addField = (label: string, value: string) => {
    const labelEl = document.createElement('div');
    labelEl.textContent = label + ':';
    labelEl.style.fontWeight = 'bold';
    labelEl.style.color = '#888';
    
    const valueEl = document.createElement('div');
    valueEl.textContent = value;
    
    panel.appendChild(labelEl);
    panel.appendChild(valueEl);
  };
  
  // Editable fields
  if (config.editable) {
    addEditableField('Name', 'name', metadata.name);
    if (metadata.key) {
      addEditableField('Key', 'key', metadata.key);
    }
    if (metadata.bpm) {
      addEditableField('Tempo', 'bpm', metadata.bpm, 'number');
    }
  } else {
    addField('Name', metadata.name);
    if (metadata.key) {
      addField('Key', metadata.key);
    }
    if (metadata.bpm) {
      addField('Tempo', `${metadata.bpm.toFixed(1)} BPM`);
    }
  }
  
  // Read-only fields
  addField('Format', metadata.format.toUpperCase());
  addField('Size', formatFileSize(metadata.sizeBytes));
  addField('Duration', formatDuration(metadata.duration));
  addField('Sample Rate', `${metadata.sampleRate} Hz`);
  addField('Channels', metadata.channels === 1 ? 'Mono' : 'Stereo');
  
  return panel;
}

// ============================================================================
// BATCH METADATA EDITOR
// ============================================================================

/**
 * Batch metadata edit configuration.
 */
export interface BatchMetadataEdit {
  /** Sample IDs to edit */
  sampleIds: readonly string[];
  /** Fields to edit */
  fields: {
    key?: string;
    bpm?: number;
    tags?: readonly string[];
    category?: string;
  };
}

/**
 * Create batch metadata editor.
 */
export function createBatchMetadataEditor(
  samples: readonly SampleMetadata[],
  onApply: (edit: BatchMetadataEdit) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'batch-metadata-editor';
  container.style.cssText = `
    padding: 16px;
    background: #2a2a2a;
    border-radius: 4px;
    font-family: sans-serif;
    color: #e0e0e0;
  `;
  
  const title = document.createElement('h3');
  title.textContent = `Editing ${samples.length} samples`;
  title.style.marginTop = '0';
  container.appendChild(title);
  
  const form = document.createElement('div');
  form.style.cssText = `
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 12px;
    align-items: center;
  `;
  
  // Key field
  const keyLabel = document.createElement('label');
  keyLabel.textContent = 'Key:';
  const keyInput = document.createElement('input');
  keyInput.type = 'text';
  keyInput.placeholder = '(unchanged)';
  form.appendChild(keyLabel);
  form.appendChild(keyInput);
  
  // BPM field
  const bpmLabel = document.createElement('label');
  bpmLabel.textContent = 'Tempo (BPM):';
  const bpmInput = document.createElement('input');
  bpmInput.type = 'number';
  bpmInput.placeholder = '(unchanged)';
  form.appendChild(bpmLabel);
  form.appendChild(bpmInput);
  
  // Tags field
  const tagsLabel = document.createElement('label');
  tagsLabel.textContent = 'Tags:';
  const tagsInput = document.createElement('input');
  tagsInput.type = 'text';
  tagsInput.placeholder = 'comma,separated,tags';
  form.appendChild(tagsLabel);
  form.appendChild(tagsInput);
  
  container.appendChild(form);
  
  // Buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex;
    gap: 8px;
    margin-top: 16px;
  `;
  
  const applyButton = document.createElement('button');
  applyButton.textContent = 'Apply to All';
  applyButton.style.cssText = `
    padding: 8px 16px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  `;
  applyButton.addEventListener('click', () => {
    const fields: BatchMetadataEdit['fields'] = {};
    
    if (keyInput.value) fields.key = keyInput.value;
    if (bpmInput.value) fields.bpm = parseFloat(bpmInput.value);
    if (tagsInput.value) fields.tags = tagsInput.value.split(',').map(t => t.trim()).filter(Boolean);
    
    onApply({
      sampleIds: samples.map(s => s.id),
      fields
    });
  });
  
  const cancelButton = document.createElement('button');
  cancelButton.textContent = 'Cancel';
  cancelButton.style.cssText = `
    padding: 8px 16px;
    background: #666;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  `;
  
  buttonContainer.appendChild(applyButton);
  buttonContainer.appendChild(cancelButton);
  container.appendChild(buttonContainer);
  
  return container;
}

// ============================================================================
// WAVEFORM COLOR CUSTOMIZATION
// ============================================================================

/**
 * Color theme presets.
 */
export const WAVEFORM_COLOR_THEMES = {
  default: {
    background: '#1a1a1a',
    waveform: '#4CAF50',
    waveformFill: 'rgba(76, 175, 80, 0.3)',
    grid: '#333333',
    selection: 'rgba(33, 150, 243, 0.3)',
    loopRegion: 'rgba(255, 152, 0, 0.2)',
    transientMarker: '#FF5722',
    playhead: '#FFFFFF',
    rms: '#FFC107'
  },
  blue: {
    background: '#0d1117',
    waveform: '#58a6ff',
    waveformFill: 'rgba(88, 166, 255, 0.3)',
    grid: '#21262d',
    selection: 'rgba(56, 139, 253, 0.3)',
    loopRegion: 'rgba(187, 128, 9, 0.2)',
    transientMarker: '#f85149',
    playhead: '#c9d1d9',
    rms: '#d29922'
  },
  purple: {
    background: '#1a1a2e',
    waveform: '#9d4edd',
    waveformFill: 'rgba(157, 78, 221, 0.3)',
    grid: '#2d2d44',
    selection: 'rgba(124, 58, 237, 0.3)',
    loopRegion: 'rgba(251, 146, 60, 0.2)',
    transientMarker: '#ef4444',
    playhead: '#f3f4f6',
    rms: '#f59e0b'
  },
  retro: {
    background: '#000000',
    waveform: '#00ff00',
    waveformFill: 'rgba(0, 255, 0, 0.2)',
    grid: '#003300',
    selection: 'rgba(0, 255, 255, 0.3)',
    loopRegion: 'rgba(255, 255, 0, 0.2)',
    transientMarker: '#ff00ff',
    playhead: '#ffffff',
    rms: '#ffff00'
  }
} as const;

/**
 * Create color theme selector.
 */
export function createColorThemeSelector(
  preview: SampleWaveformPreview,
  onThemeChange?: (theme: string) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'waveform-color-theme-selector';
  container.style.cssText = `
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 8px;
    background: #2a2a2a;
    border-radius: 4px;
  `;
  
  const label = document.createElement('label');
  label.textContent = 'Color Theme:';
  label.style.marginRight = '8px';
  container.appendChild(label);
  
  const select = document.createElement('select');
  select.style.cssText = `
    padding: 4px 8px;
    background: #1a1a1a;
    color: #e0e0e0;
    border: 1px solid #444;
    border-radius: 4px;
    cursor: pointer;
  `;
  
  Object.keys(WAVEFORM_COLOR_THEMES).forEach(theme => {
    const option = document.createElement('option');
    option.value = theme;
    option.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
    select.appendChild(option);
  });
  
  select.addEventListener('change', () => {
    const themeName = select.value as keyof typeof WAVEFORM_COLOR_THEMES;
    const colors = WAVEFORM_COLOR_THEMES[themeName];
    preview.setColors(colors);
    onThemeChange?.(themeName);
  });
  
  container.appendChild(select);
  return container;
}

// ============================================================================
// SPECTRUM PREVIEW (FFT DISPLAY)
// ============================================================================

/**
 * Spectrum analyzer configuration.
 */
export interface SpectrumConfig {
  width?: number;
  height?: number;
  fftSize?: number;
  smoothing?: number;
  minDecibels?: number;
  maxDecibels?: number;
  logScale?: boolean;
}

/**
 * Spectrum analyzer display.
 */
export class SpectrumPreview {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: Required<SpectrumConfig>;
  private spectrumData: Float32Array | null = null;
  
  constructor(config: SpectrumConfig = {}) {
    this.config = {
      width: config.width ?? 800,
      height: config.height ?? 200,
      fftSize: config.fftSize ?? 2048,
      smoothing: config.smoothing ?? 0.8,
      minDecibels: config.minDecibels ?? -90,
      maxDecibels: config.maxDecibels ?? -10,
      logScale: config.logScale ?? true
    };
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.config.width;
    this.canvas.height = this.config.height;
    
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;
  }
  
  getElement(): HTMLCanvasElement {
    return this.canvas;
  }
  
  async analyzeAudio(audioBuffer: AudioBuffer): Promise<void> {
    // Perform FFT on audio buffer
    const channelData = audioBuffer.getChannelData(0);
    const fftSize = this.config.fftSize;
    const halfSize = fftSize / 2;
    
    // Simple FFT implementation (for demo - would use Web Audio API in production)
    this.spectrumData = new Float32Array(halfSize);
    
    // Average spectrum over entire sample
    const numWindows = Math.floor(channelData.length / fftSize);
    const spectrum = new Float32Array(halfSize);
    
    for (let w = 0; w < numWindows; w++) {
      const offset = w * fftSize;
      for (let i = 0; i < halfSize; i++) {
        const real = channelData[offset + i] ?? 0;
        const imag = channelData[offset + i + halfSize] ?? 0;
        const magnitude = Math.sqrt(real * real + imag * imag);
        spectrum[i] = (spectrum[i] ?? 0) + magnitude;
      }
    }
    
    // Average and convert to dB
    for (let i = 0; i < halfSize; i++) {
      const avg = (spectrum[i] ?? 0) / numWindows;
      const db = 20 * Math.log10(avg + 1e-10);
      this.spectrumData[i] = Math.max(this.config.minDecibels, Math.min(this.config.maxDecibels, db));
    }
    
    this.render();
  }
  
  private render(): void {
    if (!this.spectrumData) return;
    
    const ctx = this.ctx;
    const width = this.config.width;
    const height = this.config.height;
    
    // Clear
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      const y = (height / 10) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw spectrum
    ctx.fillStyle = '#4CAF50';
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const range = this.config.maxDecibels - this.config.minDecibels;
    
    for (let x = 0; x < width; x++) {
      let binIndex: number;
      if (this.config.logScale) {
        // Logarithmic frequency scale
        const logMin = Math.log2(1);
        const logMax = Math.log2(this.spectrumData.length);
        const logPos = logMin + (x / width) * (logMax - logMin);
        binIndex = Math.floor(Math.pow(2, logPos));
      } else {
        binIndex = Math.floor((x / width) * this.spectrumData.length);
      }
      
      const value = this.spectrumData[binIndex] ?? this.config.minDecibels;
      const normalized = (value - this.config.minDecibels) / range;
      const y = height - (normalized * height);
      
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

// ============================================================================
// LOUDNESS DISPLAY (LUFS/RMS/PEAK)
// ============================================================================

/**
 * Loudness statistics.
 */
export interface LoudnessStats {
  peakDb: number;
  rmsDb: number;
  lufs: number;
  truePeakDb: number;
  dynamicRange: number;
  crestFactor: number;
}

/**
 * Calculate loudness statistics from audio buffer.
 */
export function calculateLoudness(audioBuffer: AudioBuffer): LoudnessStats {
  const channelData = audioBuffer.getChannelData(0);
  let peak = 0;
  let sumSquares = 0;
  
  // Calculate peak and RMS
  for (let i = 0; i < channelData.length; i++) {
    const sample = Math.abs(channelData[i] ?? 0);
    peak = Math.max(peak, sample);
    sumSquares += sample * sample;
  }
  
  const rms = Math.sqrt(sumSquares / channelData.length);
  const peakDb = 20 * Math.log10(peak + 1e-10);
  const rmsDb = 20 * Math.log10(rms + 1e-10);
  
  // Simplified LUFS calculation (EBU R128 approximation)
  // Real implementation would use K-weighting filter
  const lufs = rmsDb - 23; // Rough approximation
  
  // Dynamic range
  const dynamicRange = peakDb - rmsDb;
  
  // Crest factor (peak-to-RMS ratio)
  const crestFactor = peak / (rms + 1e-10);
  
  return {
    peakDb,
    rmsDb,
    lufs,
    truePeakDb: peakDb, // Simplified
    dynamicRange,
    crestFactor
  };
}

/**
 * Create loudness display panel.
 */
export function createLoudnessDisplay(stats: LoudnessStats): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'loudness-display';
  panel.style.cssText = `
    padding: 12px;
    background: #2a2a2a;
    border-radius: 4px;
    font-family: monospace;
    font-size: 12px;
    color: #e0e0e0;
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 8px 16px;
    align-items: center;
  `;
  
  const addMeter = (label: string, value: number, unit: string, warn: boolean = false) => {
    const labelEl = document.createElement('div');
    labelEl.textContent = label;
    labelEl.style.fontWeight = 'bold';
    labelEl.style.color = '#888';
    
    const bar = document.createElement('div');
    bar.style.cssText = `
      height: 12px;
      background: #1a1a1a;
      border-radius: 6px;
      overflow: hidden;
      position: relative;
    `;
    
    const fill = document.createElement('div');
    const percentage = Math.max(0, Math.min(100, (value + 90) / 90 * 100)); // -90dB to 0dB = 0% to 100%
    fill.style.cssText = `
      height: 100%;
      width: ${percentage}%;
      background: ${warn && percentage > 90 ? '#f44336' : '#4CAF50'};
      transition: width 0.3s ease;
    `;
    bar.appendChild(fill);
    
    const valueEl = document.createElement('div');
    valueEl.textContent = `${value.toFixed(1)} ${unit}`;
    valueEl.style.fontWeight = 'bold';
    valueEl.style.color = warn && value > -1 ? '#f44336' : '#4CAF50';
    
    panel.appendChild(labelEl);
    panel.appendChild(bar);
    panel.appendChild(valueEl);
  };
  
  addMeter('Peak', stats.peakDb, 'dB', stats.peakDb > -1);
  addMeter('RMS', stats.rmsDb, 'dB', false);
  addMeter('LUFS', stats.lufs, 'LUFS', false);
  addMeter('True Peak', stats.truePeakDb, 'dBTP', stats.truePeakDb > -1);
  
  // Add text-only stats
  const statsEl = document.createElement('div');
  statsEl.style.cssText = `
    grid-column: 1 / -1;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #444;
    display: flex;
    gap: 16px;
  `;
  
  statsEl.innerHTML = `
    <span>Dynamic Range: ${stats.dynamicRange.toFixed(1)} dB</span>
    <span>Crest Factor: ${stats.crestFactor.toFixed(2)}</span>
  `;
  
  panel.appendChild(statsEl);
  
  return panel;
}

// ============================================================================
// COMPARISON VIEW (SIDE-BY-SIDE OR OVERLAY)
// ============================================================================

/**
 * Comparison mode.
 */
export type ComparisonMode = 'side-by-side' | 'overlay' | 'difference';

/**
 * Waveform comparison view.
 */
export class WaveformComparisonView {
  private container: HTMLElement;
  private preview1: SampleWaveformPreview;
  private preview2: SampleWaveformPreview;
  private mode: ComparisonMode = 'side-by-side';
  
  constructor(config: WaveformPreviewConfig = {}) {
    this.container = document.createElement('div');
    this.container.className = 'waveform-comparison';
    
    this.preview1 = new SampleWaveformPreview({ ...config, colors: { ...DEFAULT_CONFIG.colors, waveform: '#4CAF50' } });
    this.preview2 = new SampleWaveformPreview({ ...config, colors: { ...DEFAULT_CONFIG.colors, waveform: '#2196F3' } });
    
    this.updateLayout();
  }
  
  getElement(): HTMLElement {
    return this.container;
  }
  
  async loadSample1(audioBuffer: AudioBuffer, metadata?: SampleMetadata): Promise<void> {
    await this.preview1.loadAudio(audioBuffer);
    if (metadata) this.preview1.setMetadata(metadata);
  }
  
  async loadSample2(audioBuffer: AudioBuffer, metadata?: SampleMetadata): Promise<void> {
    await this.preview2.loadAudio(audioBuffer);
    if (metadata) this.preview2.setMetadata(metadata);
  }
  
  setMode(mode: ComparisonMode): void {
    this.mode = mode;
    this.updateLayout();
  }
  
  syncZoom(): void {
    const zoom1 = this.preview1.getZoom();
    this.preview2.setZoom(zoom1.level, zoom1.center);
  }
  
  syncPlayhead(position: number): void {
    this.preview1.setPlayhead(position);
    this.preview2.setPlayhead(position);
  }
  
  private updateLayout(): void {
    this.container.innerHTML = '';
    
    switch (this.mode) {
      case 'side-by-side':
        this.container.style.cssText = `
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        `;
        
        const wrapper1 = document.createElement('div');
        wrapper1.appendChild(this.preview1.getElement());
        
        const wrapper2 = document.createElement('div');
        wrapper2.appendChild(this.preview2.getElement());
        
        this.container.appendChild(wrapper1);
        this.container.appendChild(wrapper2);
        break;
        
      case 'overlay':
        this.container.style.cssText = 'position: relative;';
        
        const canvas1 = this.preview1.getElement();
        const canvas2 = this.preview2.getElement();
        
        canvas1.style.position = 'absolute';
        canvas1.style.top = '0';
        canvas1.style.left = '0';
        canvas2.style.position = 'absolute';
        canvas2.style.top = '0';
        canvas2.style.left = '0';
        canvas2.style.opacity = '0.5';
        
        this.container.appendChild(canvas1);
        this.container.appendChild(canvas2);
        break;
        
      case 'difference':
        // Difference mode would require a custom render
        // For now, show side-by-side
        this.container.style.cssText = `
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        `;
        this.container.appendChild(this.preview1.getElement());
        this.container.appendChild(this.preview2.getElement());
        break;
    }
  }
}

/**
 * Create comparison mode selector.
 */
export function createComparisonModeSelector(
  comparison: WaveformComparisonView
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'comparison-mode-selector';
  container.style.cssText = `
    display: flex;
    gap: 8px;
    padding: 8px;
    background: #2a2a2a;
    border-radius: 4px;
  `;
  
  const modes: ComparisonMode[] = ['side-by-side', 'overlay', 'difference'];
  
  modes.forEach(mode => {
    const button = document.createElement('button');
    button.textContent = mode.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    button.style.cssText = `
      padding: 6px 12px;
      background: #444;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.2s;
    `;
    
    button.addEventListener('click', () => {
      comparison.setMode(mode);
      // Highlight active button
      container.querySelectorAll('button').forEach(b => {
        (b as HTMLButtonElement).style.background = '#444';
      });
      button.style.background = '#4CAF50';
    });
    
    container.appendChild(button);
  });
  
  return container;
}

// ============================================================================
// ZOOM CONTROLS
// ============================================================================

/**
 * Create zoom control buttons.
 */
export function createZoomControls(preview: SampleWaveformPreview): HTMLElement {
  const container = document.createElement('div');
  container.className = 'waveform-zoom-controls';
  container.style.cssText = `
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 8px;
    background: #2a2a2a;
    border-radius: 4px;
  `;
  
  const createButton = (text: string, onClick: () => void) => {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.cssText = `
      padding: 4px 12px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    `;
    btn.addEventListener('click', onClick);
    return btn;
  };
  
  // Zoom in
  container.appendChild(createButton('Zoom In', () => {
    const zoom = preview.getZoom();
    preview.setZoom(zoom.level * 1.5);
  }));
  
  // Zoom out
  container.appendChild(createButton('Zoom Out', () => {
    const zoom = preview.getZoom();
    preview.setZoom(zoom.level / 1.5);
  }));
  
  // Fit
  container.appendChild(createButton('Fit', () => {
    preview.setZoom(1, 0.5);
  }));
  
  // Selection
  container.appendChild(createButton('Zoom to Selection', () => {
    const selection = preview.getSelection();
    if (selection) {
      const zoom = preview.getZoom();
      const duration = selection.end - selection.start;
      const center = (selection.start + selection.end) / 2;
      preview.setZoom(zoom.level / duration, center);
    }
  }));
  
  return container;
}
