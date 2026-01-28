/**
 * @fileoverview Wavetable Visualizer - Multi-Mode Visualization Components
 * 
 * Implements comprehensive visualization for wavetable synthesis:
 * - 3D surface visualization (WebGL/Canvas)
 * - 2D stacked waveform view
 * - Spectrogram view
 * - Oscilloscope view
 * - Phase correlation display
 * - Harmonic analyzer
 * 
 * @module @cardplay/core/audio/wavetable-visualizer
 */

// ============================================================================
// VISUALIZER TYPES
// ============================================================================

/** Visualization mode */
export type VisualizationMode =
  | '3d_surface'
  | '2d_stack'
  | 'spectrogram'
  | 'oscilloscope'
  | 'phase_correlation'
  | 'harmonics';

/** Color scheme for visualization */
export type ColorScheme =
  | 'default'
  | 'spectrum'
  | 'heat'
  | 'cool'
  | 'monochrome'
  | 'neon';

/** Render target type */
export type RenderTarget = 'canvas2d' | 'webgl';

/** 3D view camera settings */
export interface CameraSettings {
  rotationX: number;  // degrees
  rotationY: number;  // degrees
  rotationZ: number;  // degrees
  zoom: number;       // 0.1 - 10
  panX: number;       // normalized
  panY: number;       // normalized
}

/** Visualization settings */
export interface VisualizationSettings {
  mode: VisualizationMode;
  colorScheme: ColorScheme;
  renderTarget: RenderTarget;
  width: number;
  height: number;
  backgroundColor: string;
  foregroundColor: string;
  gridColor: string;
  showGrid: boolean;
  showLabels: boolean;
  antialiasing: boolean;
  frameRate: number;
  // Mode-specific
  camera: CameraSettings;
  spectrogramFftSize: number;
  oscilloscopeTimeWindow: number; // ms
  harmonicsCount: number;
}

/** Default visualization settings */
export const DEFAULT_VISUALIZATION_SETTINGS: VisualizationSettings = {
  mode: '2d_stack',
  colorScheme: 'spectrum',
  renderTarget: 'canvas2d',
  width: 800,
  height: 600,
  backgroundColor: '#1a1a2e',
  foregroundColor: '#00ff88',
  gridColor: '#333355',
  showGrid: true,
  showLabels: true,
  antialiasing: true,
  frameRate: 60,
  camera: {
    rotationX: 30,
    rotationY: -45,
    rotationZ: 0,
    zoom: 1,
    panX: 0,
    panY: 0,
  },
  spectrogramFftSize: 1024,
  oscilloscopeTimeWindow: 20,
  harmonicsCount: 32,
};

/** Rendered frame data */
export interface RenderedFrame {
  imageData: ImageData | null;
  timestamp: number;
}

// ============================================================================
// COLOR UTILITIES
// ============================================================================

/**
 * Color utilities for visualization
 */
export class ColorUtils {
  /**
   * HSL to RGB conversion
   */
  static hslToRgb(h: number, s: number, l: number): [number, number, number] {
    let r: number, g: number, b: number;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number): number => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  /**
   * Get color from color scheme
   */
  static getColor(
    value: number,
    scheme: ColorScheme
  ): [number, number, number] {
    const v = Math.max(0, Math.min(1, value));

    switch (scheme) {
      case 'spectrum':
        return this.hslToRgb(v * 0.8, 0.9, 0.5);

      case 'heat':
        if (v < 0.5) {
          return [Math.floor(v * 2 * 255), 0, 0];
        } else {
          return [255, Math.floor((v - 0.5) * 2 * 255), 0];
        }

      case 'cool':
        return this.hslToRgb(0.5 + v * 0.3, 0.8, 0.4 + v * 0.3);

      case 'monochrome':
        const gray = Math.floor(v * 255);
        return [gray, gray, gray];

      case 'neon':
        if (v < 0.33) {
          return [Math.floor(v * 3 * 255), 0, 255];
        } else if (v < 0.66) {
          return [255, Math.floor((v - 0.33) * 3 * 255), 255 - Math.floor((v - 0.33) * 3 * 255)];
        } else {
          return [255, 255, Math.floor((v - 0.66) * 3 * 255)];
        }

      default:
        return [0, Math.floor(v * 255), Math.floor(v * 136)];
    }
  }

  /**
   * Get gradient stops for color scheme
   */
  static getGradientStops(scheme: ColorScheme): Array<{ position: number; color: string }> {
    const stops: Array<{ position: number; color: string }> = [];

    for (let i = 0; i <= 10; i++) {
      const position = i / 10;
      const [r, g, b] = this.getColor(position, scheme);
      stops.push({
        position,
        color: `rgb(${r}, ${g}, ${b})`,
      });
    }

    return stops;
  }
}

// ============================================================================
// SIMPLE FFT FOR VISUALIZATION
// ============================================================================

class VisualizerFFT {
  private size: number;
  private cosTable: Float32Array;
  private sinTable: Float32Array;
  private reverseBits: Uint32Array;

  constructor(size: number) {
    this.size = size;
    this.cosTable = new Float32Array(size / 2);
    this.sinTable = new Float32Array(size / 2);
    this.reverseBits = new Uint32Array(size);

    for (let i = 0; i < size / 2; i++) {
      const angle = -2 * Math.PI * i / size;
      this.cosTable[i] = Math.cos(angle);
      this.sinTable[i] = Math.sin(angle);
    }

    const bits = Math.log2(size);
    for (let i = 0; i < size; i++) {
      let reversed = 0;
      for (let j = 0; j < bits; j++) {
        reversed = (reversed << 1) | ((i >> j) & 1);
      }
      this.reverseBits[i] = reversed;
    }
  }

  forward(real: Float32Array, imag: Float32Array): void {
    const n = this.size;

    for (let i = 0; i < n; i++) {
      const j = this.reverseBits[i]!;
      if (j > i) {
        [real[i], real[j]] = [real[j]!, real[i]!];
        [imag[i], imag[j]] = [imag[j]!, imag[i]!];
      }
    }

    for (let size = 2; size <= n; size *= 2) {
      const halfSize = size / 2;
      const step = n / size;

      for (let i = 0; i < n; i += size) {
        for (let j = 0; j < halfSize; j++) {
          const k = j * step;
          const evenIndex = i + j;
          const oddIndex = i + j + halfSize;

          const tReal = real[oddIndex]! * this.cosTable[k]! - imag[oddIndex]! * this.sinTable[k]!;
          const tImag = real[oddIndex]! * this.sinTable[k]! + imag[oddIndex]! * this.cosTable[k]!;

          real[oddIndex] = real[evenIndex]! - tReal;
          imag[oddIndex] = imag[evenIndex]! - tImag;
          real[evenIndex]! += tReal;
          imag[evenIndex]! += tImag;
        }
      }
    }
  }

  getMagnitudes(real: Float32Array, imag: Float32Array): Float32Array {
    const halfSize = this.size / 2;
    const magnitudes = new Float32Array(halfSize);

    for (let i = 0; i < halfSize; i++) {
      magnitudes[i] = Math.sqrt(real[i]! * real[i]! + imag[i]! * imag[i]!);
    }

    return magnitudes;
  }
}

// ============================================================================
// 2D CANVAS RENDERER
// ============================================================================

/**
 * 2D Canvas renderer for wavetable visualization
 */
export class Canvas2DRenderer {
  private canvas: OffscreenCanvas | null = null;
  private ctx: OffscreenCanvasRenderingContext2D | null = null;
  private settings: VisualizationSettings;
  private fft: VisualizerFFT;

  constructor(settings: Partial<VisualizationSettings> = {}) {
    this.settings = { ...DEFAULT_VISUALIZATION_SETTINGS, ...settings };
    this.fft = new VisualizerFFT(this.settings.spectrogramFftSize);
    this.initCanvas();
  }

  private initCanvas(): void {
    this.canvas = new OffscreenCanvas(this.settings.width, this.settings.height);
    this.ctx = this.canvas.getContext('2d', {
      alpha: false,
      desynchronized: true,
    });
  }

  /**
   * Render 2D stacked waveform view
   */
  render2DStack(
    frames: Float32Array[],
    currentFrame: number,
    playbackPosition: number
  ): ImageData | null {
    if (!this.ctx || !this.canvas) return null;

    const { width, height, backgroundColor, gridColor, showGrid } = this.settings;
    const frameCount = frames.length;
    const frameSize = frames[0]?.length ?? 0;
    if (frameSize === 0) return null;

    // Clear
    this.ctx.fillStyle = backgroundColor;
    this.ctx.fillRect(0, 0, width, height);

    // Draw grid
    if (showGrid) {
      this.ctx.strokeStyle = gridColor;
      this.ctx.lineWidth = 1;

      // Vertical lines
      for (let i = 0; i <= 8; i++) {
        const x = (i / 8) * width;
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, height);
        this.ctx.stroke();
      }

      // Horizontal lines
      for (let i = 0; i <= 4; i++) {
        const y = (i / 4) * height;
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(width, y);
        this.ctx.stroke();
      }
    }

    // Calculate visible frame range
    const framesPerPixel = Math.max(1, Math.floor(frameCount / (height * 0.8)));
    const visibleFrames = Math.min(frameCount, Math.floor(height * 0.8));

    // Draw stacked waveforms
    for (let f = 0; f < visibleFrames; f++) {
      const frameIndex = Math.floor(f * framesPerPixel);
      if (frameIndex >= frameCount) break;

      const frame = frames[frameIndex];
      if (!frame) continue;
      const y = (f / visibleFrames) * height * 0.8 + height * 0.1;

      // Calculate color based on position
      const [r, g, b] = ColorUtils.getColor(f / visibleFrames, this.settings.colorScheme);

      // Highlight current frame
      const alpha = frameIndex === currentFrame ? 1 : 0.6;
      this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      this.ctx.lineWidth = frameIndex === currentFrame ? 2 : 1;

      this.ctx.beginPath();
      for (let s = 0; s < frameSize; s++) {
        const x = (s / frameSize) * width;
        const sampleY = y - (frame[s] ?? 0) * (height * 0.08);

        if (s === 0) {
          this.ctx.moveTo(x, sampleY);
        } else {
          this.ctx.lineTo(x, sampleY);
        }
      }
      this.ctx.stroke();
    }

    // Draw playback position
    if (playbackPosition >= 0 && playbackPosition <= 1) {
      const posY = playbackPosition * height * 0.8 + height * 0.1;
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([5, 5]);
      this.ctx.beginPath();
      this.ctx.moveTo(0, posY);
      this.ctx.lineTo(width, posY);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }

    return this.ctx.getImageData(0, 0, width, height);
  }

  /**
   * Render spectrogram view
   */
  renderSpectrogram(
    frames: Float32Array[],
    currentFrame: number
  ): ImageData | null {
    if (!this.ctx || !this.canvas) return null;

    const { width, height, backgroundColor } = this.settings;
    const frameCount = frames.length;
    const frameSize = frames[0]?.length ?? 0;
    if (frameSize === 0) return null;

    // Clear
    this.ctx.fillStyle = backgroundColor;
    this.ctx.fillRect(0, 0, width, height);

    const fftSize = this.settings.spectrogramFftSize;
    const halfFft = fftSize / 2;
    const real = new Float32Array(fftSize);
    const imag = new Float32Array(fftSize);

    // Create image data
    const imageData = this.ctx.createImageData(width, height);
    const data = imageData.data;

    // For each column (frame)
    for (let x = 0; x < width; x++) {
      const frameIndex = Math.floor((x / width) * frameCount);
      const frame = frames[frameIndex];
      if (!frame) continue;

      // Prepare FFT input with windowing
      for (let i = 0; i < fftSize; i++) {
        const sampleIndex = Math.floor((i / fftSize) * frameSize);
        const window = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / fftSize); // Hann window
        real[i] = (frame[sampleIndex] ?? 0) * window;
        imag[i] = 0;
      }

      // Perform FFT
      this.fft.forward(real, imag);
      const magnitudes = this.fft.getMagnitudes(real, imag);

      // Find max for normalization
      let maxMag = 0;
      for (let i = 0; i < halfFft; i++) {
        maxMag = Math.max(maxMag, magnitudes[i] ?? 0);
      }

      // Draw column
      for (let y = 0; y < height; y++) {
        const freqBin = Math.floor((1 - y / height) * halfFft);
        const magnitude = maxMag > 0 ? (magnitudes[freqBin] ?? 0) / maxMag : 0;

        // Apply logarithmic scaling for better visibility
        const logMag = magnitude > 0 ? Math.log10(1 + magnitude * 9) : 0;

        const [r, g, b] = ColorUtils.getColor(logMag, this.settings.colorScheme);
        const offset = (y * width + x) * 4;
        data[offset] = r;
        data[offset + 1] = g;
        data[offset + 2] = b;
        data[offset + 3] = 255;
      }
    }

    // Mark current frame
    const currentX = Math.floor((currentFrame / frameCount) * width);
    for (let y = 0; y < height; y++) {
      const offset = (y * width + currentX) * 4;
      data[offset] = 255;
      data[offset + 1] = 255;
      data[offset + 2] = 255;
      data[offset + 3] = 255;
    }

    this.ctx.putImageData(imageData, 0, 0);
    return imageData;
  }

  /**
   * Render oscilloscope view
   */
  renderOscilloscope(
    frame: Float32Array,
    triggerLevel = 0
  ): ImageData | null {
    if (!this.ctx || !this.canvas) return null;

    const { width, height, backgroundColor, foregroundColor, gridColor, showGrid } = this.settings;

    // Clear
    this.ctx.fillStyle = backgroundColor;
    this.ctx.fillRect(0, 0, width, height);

    // Draw grid
    if (showGrid) {
      this.ctx.strokeStyle = gridColor;
      this.ctx.lineWidth = 1;

      // Vertical divisions
      for (let i = 0; i <= 10; i++) {
        const x = (i / 10) * width;
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, height);
        this.ctx.stroke();
      }

      // Horizontal divisions
      for (let i = 0; i <= 8; i++) {
        const y = (i / 8) * height;
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(width, y);
        this.ctx.stroke();
      }

      // Center line
      this.ctx.strokeStyle = '#555577';
      this.ctx.beginPath();
      this.ctx.moveTo(0, height / 2);
      this.ctx.lineTo(width, height / 2);
      this.ctx.stroke();
    }

    // Find trigger point (rising edge crossing)
    let triggerIndex = 0;
    for (let i = 1; i < frame.length; i++) {
      const prevSample = frame[i - 1] ?? 0;
      const currSample = frame[i] ?? 0;
      if (prevSample < triggerLevel && currSample >= triggerLevel) {
        triggerIndex = i;
        break;
      }
    }

    // Draw waveform
    this.ctx.strokeStyle = foregroundColor;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();

    const samplesPerPixel = Math.max(1, frame.length / width);

    for (let x = 0; x < width; x++) {
      const sampleIndex = Math.floor(x * samplesPerPixel + triggerIndex) % frame.length;
      const sample = frame[sampleIndex] ?? 0;
      const y = height / 2 - sample * (height / 2.5);

      if (x === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }

    this.ctx.stroke();

    // Add glow effect
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = foregroundColor;
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    return this.ctx.getImageData(0, 0, width, height);
  }

  /**
   * Render harmonics analyzer
   */
  renderHarmonics(
    frame: Float32Array,
    harmonicsCount = 32
  ): ImageData | null {
    if (!this.ctx || !this.canvas) return null;

    const { width, height, backgroundColor, gridColor, showGrid, showLabels } = this.settings;
    const fftSize = 2048;

    // Clear
    this.ctx.fillStyle = backgroundColor;
    this.ctx.fillRect(0, 0, width, height);

    // Perform FFT
    const real = new Float32Array(fftSize);
    const imag = new Float32Array(fftSize);

    for (let i = 0; i < fftSize; i++) {
      const sampleIndex = Math.floor((i / fftSize) * frame.length);
      real[i] = frame[sampleIndex] ?? 0;
      imag[i] = 0;
    }

    const fft = new VisualizerFFT(fftSize);
    fft.forward(real, imag);

    // Calculate harmonic magnitudes
    const harmonics: number[] = [];
    let maxMag = 0;

    for (let h = 1; h <= harmonicsCount; h++) {
      const realVal = real[h] ?? 0;
      const imagVal = imag[h] ?? 0;
      const mag = Math.sqrt(realVal * realVal + imagVal * imagVal) * 2 / fftSize;
      harmonics.push(mag);
      maxMag = Math.max(maxMag, mag);
    }

    // Normalize
    if (maxMag > 0) {
      for (let i = 0; i < harmonics.length; i++) {
        harmonics[i] = (harmonics[i] ?? 0) / maxMag;
      }
    }

    // Draw grid
    if (showGrid) {
      this.ctx.strokeStyle = gridColor;
      this.ctx.lineWidth = 1;

      // Horizontal grid lines (dB scale)
      for (let i = 0; i <= 6; i++) {
        const y = (i / 6) * height * 0.8 + height * 0.1;
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(width, y);
        this.ctx.stroke();
      }
    }

    // Draw bars
    const barWidth = (width * 0.8) / harmonicsCount;
    const barGap = barWidth * 0.2;

    for (let h = 0; h < harmonicsCount; h++) {
      const harmonicVal = harmonics[h] ?? 0;
      const x = width * 0.1 + h * barWidth;
      const barHeight = harmonicVal * height * 0.7;
      const y = height * 0.85 - barHeight;

      // Color based on magnitude
      const [r, g, b] = ColorUtils.getColor(harmonicVal, this.settings.colorScheme);

      // Draw bar
      this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      this.ctx.fillRect(x + barGap / 2, y, barWidth - barGap, barHeight);

      // Add glow
      this.ctx.shadowBlur = 5;
      this.ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
      this.ctx.fillRect(x + barGap / 2, y, barWidth - barGap, barHeight);
      this.ctx.shadowBlur = 0;
    }

    // Draw labels
    if (showLabels) {
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '10px monospace';
      this.ctx.textAlign = 'center';

      for (let h = 0; h < harmonicsCount; h += 4) {
        const x = width * 0.1 + (h + 0.5) * barWidth;
        this.ctx.fillText(`${h + 1}`, x, height * 0.95);
      }

      // Y-axis labels (dB)
      this.ctx.textAlign = 'right';
      for (let i = 0; i <= 6; i++) {
        const y = (i / 6) * height * 0.8 + height * 0.1;
        const db = -i * 10;
        this.ctx.fillText(`${db}dB`, width * 0.08, y + 4);
      }
    }

    return this.ctx.getImageData(0, 0, width, height);
  }

  /**
   * Render phase correlation (Lissajous)
   */
  renderPhaseCorrelation(
    leftChannel: Float32Array,
    rightChannel: Float32Array
  ): ImageData | null {
    if (!this.ctx || !this.canvas) return null;

    const { width, height, backgroundColor, foregroundColor, gridColor, showGrid } = this.settings;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = Math.min(width, height) * 0.4;

    // Clear
    this.ctx.fillStyle = backgroundColor;
    this.ctx.fillRect(0, 0, width, height);

    // Draw grid/guides
    if (showGrid) {
      this.ctx.strokeStyle = gridColor;
      this.ctx.lineWidth = 1;

      // Crosshairs
      this.ctx.beginPath();
      this.ctx.moveTo(centerX, 0);
      this.ctx.lineTo(centerX, height);
      this.ctx.moveTo(0, centerY);
      this.ctx.lineTo(width, centerY);
      this.ctx.stroke();

      // Diagonal guides
      this.ctx.setLineDash([5, 5]);
      this.ctx.beginPath();
      this.ctx.moveTo(centerX - scale, centerY - scale);
      this.ctx.lineTo(centerX + scale, centerY + scale);
      this.ctx.moveTo(centerX - scale, centerY + scale);
      this.ctx.lineTo(centerX + scale, centerY - scale);
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      // Circle
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, scale, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    // Draw Lissajous pattern
    const sampleCount = Math.min(leftChannel.length, rightChannel.length, 2048);

    this.ctx.strokeStyle = foregroundColor;
    this.ctx.lineWidth = 1.5;
    this.ctx.globalAlpha = 0.7;
    this.ctx.beginPath();

    for (let i = 0; i < sampleCount; i++) {
      const x = centerX + (leftChannel[i] ?? 0) * scale;
      const y = centerY - (rightChannel[i] ?? 0) * scale;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }

    this.ctx.stroke();
    this.ctx.globalAlpha = 1;

    // Add glow
    this.ctx.shadowBlur = 8;
    this.ctx.shadowColor = foregroundColor;
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    return this.ctx.getImageData(0, 0, width, height);
  }

  /**
   * Update settings
   */
  updateSettings(settings: Partial<VisualizationSettings>): void {
    const needsResize = 
      settings.width !== undefined && settings.width !== this.settings.width ||
      settings.height !== undefined && settings.height !== this.settings.height;

    this.settings = { ...this.settings, ...settings };

    if (needsResize) {
      this.initCanvas();
    }
  }

  /**
   * Get current settings
   */
  getSettings(): VisualizationSettings {
    return { ...this.settings };
  }
}

// ============================================================================
// 3D SURFACE RENDERER (Canvas 2D pseudo-3D)
// ============================================================================

/**
 * 3D surface renderer using 2D canvas with perspective projection
 */
export class Surface3DRenderer {
  private canvas: OffscreenCanvas | null = null;
  private ctx: OffscreenCanvasRenderingContext2D | null = null;
  private settings: VisualizationSettings;

  constructor(settings: Partial<VisualizationSettings> = {}) {
    this.settings = { ...DEFAULT_VISUALIZATION_SETTINGS, ...settings };
    this.initCanvas();
  }

  private initCanvas(): void {
    this.canvas = new OffscreenCanvas(this.settings.width, this.settings.height);
    this.ctx = this.canvas.getContext('2d', { alpha: false });
  }

  /**
   * Project 3D point to 2D screen coordinates
   */
  private project(x: number, y: number, z: number): { x: number; y: number; depth: number } {
    const { rotationX, rotationY, rotationZ, zoom, panX, panY } = this.settings.camera;
    const { width, height } = this.settings;

    // Convert degrees to radians
    const rx = rotationX * Math.PI / 180;
    const ry = rotationY * Math.PI / 180;
    const rz = rotationZ * Math.PI / 180;

    // Rotation around X axis
    let y1 = y * Math.cos(rx) - z * Math.sin(rx);
    let z1 = y * Math.sin(rx) + z * Math.cos(rx);

    // Rotation around Y axis
    let x2 = x * Math.cos(ry) + z1 * Math.sin(ry);
    let z2 = -x * Math.sin(ry) + z1 * Math.cos(ry);

    // Rotation around Z axis
    let x3 = x2 * Math.cos(rz) - y1 * Math.sin(rz);
    let y3 = x2 * Math.sin(rz) + y1 * Math.cos(rz);

    // Perspective projection
    const fov = 500;
    const distance = 5;
    const scale = fov / (distance - z2) * zoom;

    const screenX = width / 2 + x3 * scale + panX * width;
    const screenY = height / 2 - y3 * scale + panY * height;

    return { x: screenX, y: screenY, depth: z2 };
  }

  /**
   * Render 3D surface
   */
  render3DSurface(
    frames: Float32Array[],
    currentFrame: number,
    _playbackPosition: number
  ): ImageData | null {
    if (!this.ctx || !this.canvas) return null;

    const { width, height, backgroundColor, showGrid } = this.settings;
    const frameCount = frames.length;
    const frameSize = frames[0]?.length ?? 0;
    if (frameSize === 0) return null;

    // Clear
    this.ctx.fillStyle = backgroundColor;
    this.ctx.fillRect(0, 0, width, height);

    // Define surface dimensions
    const surfaceWidth = 2;
    const surfaceDepth = 2;
    const surfaceHeight = 0.8;

    // Sample reduction for performance
    const frameStep = Math.max(1, Math.floor(frameCount / 64));
    const sampleStep = Math.max(1, Math.floor(frameSize / 128));

    // Collect all quads with depth sorting
    const quads: Array<{
      points: Array<{ x: number; y: number }>;
      depth: number;
      color: [number, number, number];
      isCurrent: boolean;
    }> = [];

    for (let f = 0; f < frameCount; f += frameStep) {
      const frame = frames[f];
      if (!frame) continue;
      const zPos = (f / frameCount - 0.5) * surfaceDepth;

      for (let s = 0; s < frameSize - sampleStep; s += sampleStep) {
        const xPos1 = (s / frameSize - 0.5) * surfaceWidth;
        const xPos2 = ((s + sampleStep) / frameSize - 0.5) * surfaceWidth;
        const yPos1 = (frame[s] ?? 0) * surfaceHeight;
        const yPos2 = (frame[s + sampleStep] ?? 0) * surfaceHeight;

        const nextFrameIndex = Math.min(f + frameStep, frameCount - 1);
        const nextFrame = frames[nextFrameIndex];
        if (!nextFrame) continue;
        const zPos2 = (nextFrameIndex / frameCount - 0.5) * surfaceDepth;
        const yPos3 = (nextFrame[s] ?? 0) * surfaceHeight;
        const yPos4 = (nextFrame[s + sampleStep] ?? 0) * surfaceHeight;

        // Project quad corners
        const p1 = this.project(xPos1, yPos1, zPos);
        const p2 = this.project(xPos2, yPos2, zPos);
        const p3 = this.project(xPos2, yPos4, zPos2);
        const p4 = this.project(xPos1, yPos3, zPos2);

        const avgDepth = (p1.depth + p2.depth + p3.depth + p4.depth) / 4;
        const avgHeight = (yPos1 + yPos2 + yPos3 + yPos4) / 4 / surfaceHeight;

        // Color based on height
        const colorValue = (avgHeight + 1) / 2;
        const color = ColorUtils.getColor(colorValue, this.settings.colorScheme);

        quads.push({
          points: [
            { x: p1.x, y: p1.y },
            { x: p2.x, y: p2.y },
            { x: p3.x, y: p3.y },
            { x: p4.x, y: p4.y },
          ],
          depth: avgDepth,
          color,
          isCurrent: f === currentFrame || Math.abs(f - currentFrame) < frameStep,
        });
      }
    }

    // Sort by depth (back to front)
    quads.sort((a, b) => a.depth - b.depth);

    // Draw quads
    for (const quad of quads) {
      const [r, g, b] = quad.color;

      // Calculate lighting based on depth
      const lightFactor = 0.5 + (quad.depth + 2) / 4 * 0.5;
      const lr = Math.floor(r * lightFactor);
      const lg = Math.floor(g * lightFactor);
      const lb = Math.floor(b * lightFactor);

      this.ctx.fillStyle = `rgb(${lr}, ${lg}, ${lb})`;
      this.ctx.strokeStyle = quad.isCurrent ? '#ffffff' : `rgb(${lr * 0.7}, ${lg * 0.7}, ${lb * 0.7})`;
      this.ctx.lineWidth = quad.isCurrent ? 2 : 0.5;

      this.ctx.beginPath();
      const firstPoint = quad.points[0];
      if (firstPoint) {
        this.ctx.moveTo(firstPoint.x, firstPoint.y);
      }
      for (let i = 1; i < quad.points.length; i++) {
        const pt = quad.points[i];
        if (pt) {
          this.ctx.lineTo(pt.x, pt.y);
        }
      }
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
    }

    // Draw axes if grid enabled
    if (showGrid) {
      this.ctx.strokeStyle = '#666688';
      this.ctx.lineWidth = 1;

      // X axis
      const xStart = this.project(-surfaceWidth / 2, 0, 0);
      const xEnd = this.project(surfaceWidth / 2, 0, 0);
      this.ctx.beginPath();
      this.ctx.moveTo(xStart.x, xStart.y);
      this.ctx.lineTo(xEnd.x, xEnd.y);
      this.ctx.stroke();

      // Y axis
      const yStart = this.project(0, -surfaceHeight, 0);
      const yEnd = this.project(0, surfaceHeight, 0);
      this.ctx.beginPath();
      this.ctx.moveTo(yStart.x, yStart.y);
      this.ctx.lineTo(yEnd.x, yEnd.y);
      this.ctx.stroke();

      // Z axis
      const zStart = this.project(0, 0, -surfaceDepth / 2);
      const zEnd = this.project(0, 0, surfaceDepth / 2);
      this.ctx.beginPath();
      this.ctx.moveTo(zStart.x, zStart.y);
      this.ctx.lineTo(zEnd.x, zEnd.y);
      this.ctx.stroke();
    }

    return this.ctx.getImageData(0, 0, width, height);
  }

  /**
   * Rotate camera
   */
  rotateCamera(deltaX: number, deltaY: number): void {
    this.settings.camera.rotationY += deltaX;
    this.settings.camera.rotationX += deltaY;

    // Clamp X rotation
    this.settings.camera.rotationX = Math.max(-89, Math.min(89, this.settings.camera.rotationX));
  }

  /**
   * Zoom camera
   */
  zoomCamera(delta: number): void {
    this.settings.camera.zoom *= 1 + delta * 0.1;
    this.settings.camera.zoom = Math.max(0.1, Math.min(10, this.settings.camera.zoom));
  }

  /**
   * Reset camera
   */
  resetCamera(): void {
    this.settings.camera = { ...DEFAULT_VISUALIZATION_SETTINGS.camera };
  }

  /**
   * Update settings
   */
  updateSettings(settings: Partial<VisualizationSettings>): void {
    const needsResize =
      settings.width !== undefined && settings.width !== this.settings.width ||
      settings.height !== undefined && settings.height !== this.settings.height;

    this.settings = { ...this.settings, ...settings };

    if (needsResize) {
      this.initCanvas();
    }
  }
}

// ============================================================================
// MAIN VISUALIZER CLASS
// ============================================================================

/**
 * Main wavetable visualizer that combines all rendering modes
 */
export class WavetableVisualizer {
  private settings: VisualizationSettings;
  private canvas2D: Canvas2DRenderer;
  private surface3D: Surface3DRenderer;
  private lastRenderTime = 0;

  constructor(settings: Partial<VisualizationSettings> = {}) {
    this.settings = { ...DEFAULT_VISUALIZATION_SETTINGS, ...settings };
    this.canvas2D = new Canvas2DRenderer(this.settings);
    this.surface3D = new Surface3DRenderer(this.settings);
  }

  /**
   * Render based on current mode
   */
  render(
    frames: Float32Array[],
    currentFrame: number,
    playbackPosition: number,
    leftChannel?: Float32Array,
    rightChannel?: Float32Array
  ): ImageData | null {
    const now = performance.now();
    const targetInterval = 1000 / this.settings.frameRate;

    if (now - this.lastRenderTime < targetInterval) {
      return null;
    }

    this.lastRenderTime = now;

    switch (this.settings.mode) {
      case '3d_surface':
        return this.surface3D.render3DSurface(frames, currentFrame, playbackPosition);

      case '2d_stack':
        return this.canvas2D.render2DStack(frames, currentFrame, playbackPosition);

      case 'spectrogram':
        return this.canvas2D.renderSpectrogram(frames, currentFrame);

      case 'oscilloscope': {
        const oscFrame = frames[currentFrame];
        return oscFrame ? this.canvas2D.renderOscilloscope(oscFrame) : null;
      }

      case 'harmonics': {
        const harmFrame = frames[currentFrame];
        return harmFrame ? this.canvas2D.renderHarmonics(harmFrame, this.settings.harmonicsCount) : null;
      }

      case 'phase_correlation':
        if (leftChannel && rightChannel) {
          return this.canvas2D.renderPhaseCorrelation(leftChannel, rightChannel);
        }
        return null;

      default:
        return null;
    }
  }

  /**
   * Set visualization mode
   */
  setMode(mode: VisualizationMode): void {
    this.settings.mode = mode;
  }

  /**
   * Get current mode
   */
  getMode(): VisualizationMode {
    return this.settings.mode;
  }

  /**
   * Set color scheme
   */
  setColorScheme(scheme: ColorScheme): void {
    this.settings.colorScheme = scheme;
    this.canvas2D.updateSettings({ colorScheme: scheme });
    this.surface3D.updateSettings({ colorScheme: scheme });
  }

  /**
   * Rotate 3D view
   */
  rotate3D(deltaX: number, deltaY: number): void {
    this.surface3D.rotateCamera(deltaX, deltaY);
  }

  /**
   * Zoom 3D view
   */
  zoom3D(delta: number): void {
    this.surface3D.zoomCamera(delta);
  }

  /**
   * Reset 3D view
   */
  reset3DView(): void {
    this.surface3D.resetCamera();
  }

  /**
   * Update settings
   */
  updateSettings(settings: Partial<VisualizationSettings>): void {
    this.settings = { ...this.settings, ...settings };
    this.canvas2D.updateSettings(settings);
    this.surface3D.updateSettings(settings);
  }

  /**
   * Get settings
   */
  getSettings(): VisualizationSettings {
    return { ...this.settings };
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createWavetableVisualizer(
  settings?: Partial<VisualizationSettings>
): WavetableVisualizer {
  return new WavetableVisualizer(settings);
}

export function createCanvas2DRenderer(
  settings?: Partial<VisualizationSettings>
): Canvas2DRenderer {
  return new Canvas2DRenderer(settings);
}

export function createSurface3DRenderer(
  settings?: Partial<VisualizationSettings>
): Surface3DRenderer {
  return new Surface3DRenderer(settings);
}
