/**
 * @fileoverview Wavetable Editor - Interactive Wavetable Creation & Editing
 * 
 * Implements comprehensive wavetable editing capabilities:
 * - Frame navigation and preview
 * - Waveform drawing with pencil, line, spline tools
 * - Harmonic editor (additive synthesis)
 * - Spectral tools (FFT-based manipulation)
 * - Wavetable morphing and interpolation
 * - Import/export functionality
 * 
 * @module @cardplay/core/audio/wavetable-editor
 */

// ============================================================================
// EDITOR TYPES
// ============================================================================

/** Editor tool type */
export type WavetableEditorTool =
  | 'select'
  | 'pencil'
  | 'line'
  | 'spline'
  | 'smooth'
  | 'normalize'
  | 'invert'
  | 'reverse'
  | 'shift'
  | 'stretch'
  | 'harmonic'
  | 'spectral';

/** Selection mode */
export type SelectionMode = 'point' | 'range' | 'frame' | 'all';

/** Interpolation mode for morphing */
export type MorphInterpolation = 'linear' | 'cosine' | 'cubic' | 'spectral';

/** Harmonic preset type */
export type HarmonicPreset = 
  | 'sine' 
  | 'triangle' 
  | 'square' 
  | 'sawtooth' 
  | 'pulse25' 
  | 'pulse10'
  | 'organ'
  | 'formant_a'
  | 'formant_e'
  | 'formant_i'
  | 'formant_o'
  | 'formant_u';

/** Selection region */
export interface EditorSelection {
  mode: SelectionMode;
  startFrame: number;
  endFrame: number;
  startSample: number;
  endSample: number;
}

/** Edit operation for undo */
export interface EditOperation {
  type: 'modify' | 'insert' | 'delete' | 'transform';
  frameIndex: number;
  frameCount: number;
  previousData: Float32Array[];
  timestamp: number;
}

/** Harmonic definition */
export interface HarmonicData {
  amplitude: number;
  phase: number;
}

/** Spectral frame data */
export interface SpectralFrame {
  magnitudes: Float32Array;
  phases: Float32Array;
}

// ============================================================================
// WAVETABLE EDITOR STATE
// ============================================================================

/** Editor state */
export interface WavetableEditorState {
  // Wavetable data
  frameSize: number;
  frameCount: number;
  frames: Float32Array[];
  name: string;
  
  // Current position
  currentFrame: number;
  playbackPosition: number;
  
  // Selection
  selection: EditorSelection | null;
  
  // Tool state
  currentTool: WavetableEditorTool;
  
  // Harmonic view
  harmonicsVisible: boolean;
  harmonicCount: number;
  harmonics: HarmonicData[];
  
  // Spectral view
  spectralVisible: boolean;
  spectralData: SpectralFrame | null;
  
  // Undo/Redo
  undoStack: EditOperation[];
  redoStack: EditOperation[];
  maxUndoLevels: number;
  
  // View settings
  zoom: number;
  scrollX: number;
  gridEnabled: boolean;
  snapToGrid: boolean;
  gridDivision: number;
}

/** Default editor state */
export const DEFAULT_EDITOR_STATE: Omit<WavetableEditorState, 'frames'> = {
  frameSize: 2048,
  frameCount: 256,
  name: 'Untitled Wavetable',
  currentFrame: 0,
  playbackPosition: 0,
  selection: null,
  currentTool: 'pencil',
  harmonicsVisible: false,
  harmonicCount: 64,
  harmonics: [],
  spectralVisible: false,
  spectralData: null,
  undoStack: [],
  redoStack: [],
  maxUndoLevels: 100,
  zoom: 1,
  scrollX: 0,
  gridEnabled: true,
  snapToGrid: false,
  gridDivision: 8,
};

// ============================================================================
// MATH UTILITIES
// ============================================================================

/**
 * Simple FFT implementation for spectral editing
 */
class SimpleFFT {
  private size: number;
  private cosTable: Float32Array;
  private sinTable: Float32Array;
  private reverseBits: Uint32Array;

  constructor(size: number) {
    this.size = size;
    this.cosTable = new Float32Array(size / 2);
    this.sinTable = new Float32Array(size / 2);
    this.reverseBits = new Uint32Array(size);

    // Precompute twiddle factors
    for (let i = 0; i < size / 2; i++) {
      const angle = -2 * Math.PI * i / size;
      this.cosTable[i] = Math.cos(angle);
      this.sinTable[i] = Math.sin(angle);
    }

    // Precompute bit-reversal
    const bits = Math.log2(size);
    for (let i = 0; i < size; i++) {
      let reversed = 0;
      for (let j = 0; j < bits; j++) {
        reversed = (reversed << 1) | ((i >> j) & 1);
      }
      this.reverseBits[i] = reversed;
    }
  }

  /**
   * Forward FFT
   */
  forward(real: Float32Array, imag: Float32Array): void {
    const n = this.size;

    // Bit-reversal permutation
    for (let i = 0; i < n; i++) {
      const j = this.reverseBits[i];
      if (j !== undefined && j > i) {
        const ri = real[i]!, rj = real[j]!;
        const ii = imag[i]!, ij = imag[j]!;
        real[i] = rj;
        real[j] = ri;
        imag[i] = ij;
        imag[j] = ii;
      }
    }

    // Cooley-Tukey FFT
    for (let size = 2; size <= n; size *= 2) {
      const halfSize = size / 2;
      const step = n / size;

      for (let i = 0; i < n; i += size) {
        for (let j = 0; j < halfSize; j++) {
          const k = j * step;
          const evenIndex = i + j;
          const oddIndex = i + j + halfSize;

          const realOdd = real[oddIndex] ?? 0;
          const imagOdd = imag[oddIndex] ?? 0;
          const cosK = this.cosTable[k] ?? 0;
          const sinK = this.sinTable[k] ?? 0;
          const realEven = real[evenIndex] ?? 0;
          const imagEven = imag[evenIndex] ?? 0;

          const tReal = realOdd * cosK - imagOdd * sinK;
          const tImag = realOdd * sinK + imagOdd * cosK;

          real[oddIndex] = realEven - tReal;
          imag[oddIndex] = imagEven - tImag;
          real[evenIndex] = realEven + tReal;
          imag[evenIndex] = imagEven + tImag;
        }
      }
    }
  }

  /**
   * Inverse FFT
   */
  inverse(real: Float32Array, imag: Float32Array): void {
    // Conjugate
    for (let i = 0; i < this.size; i++) {
      imag[i] = -(imag[i] ?? 0);
    }

    // Forward FFT
    this.forward(real, imag);

    // Conjugate and scale
    const scale = 1 / this.size;
    for (let i = 0; i < this.size; i++) {
      real[i] = (real[i] ?? 0) * scale;
      imag[i] = -(imag[i] ?? 0) * scale;
    }
  }
}

// ============================================================================
// WAVETABLE EDITOR CLASS
// ============================================================================

/**
 * Wavetable editor for creating and modifying wavetables
 */
export class WavetableEditor {
  private state: WavetableEditorState;
  private fft: SimpleFFT;

  constructor(frameSize = 2048, frameCount = 256) {
    // Initialize frames
    const frames: Float32Array[] = [];
    for (let i = 0; i < frameCount; i++) {
      frames.push(new Float32Array(frameSize));
    }

    this.state = {
      ...DEFAULT_EDITOR_STATE,
      frameSize,
      frameCount,
      frames,
      harmonics: Array(DEFAULT_EDITOR_STATE.harmonicCount).fill(null).map(() => ({
        amplitude: 0,
        phase: 0,
      })),
    };

    this.fft = new SimpleFFT(frameSize);

    // Initialize first frame with sine wave
    this.applyHarmonicPreset('sine', 0);
  }

  // ==========================================================================
  // FRAME ACCESS
  // ==========================================================================

  /**
   * Get frame data
   */
  getFrame(index: number): Float32Array | null {
    if (index < 0 || index >= this.state.frameCount) return null;
    return this.state.frames[index] ?? null;
  }

  /**
   * Set frame data
   */
  setFrame(index: number, data: Float32Array): void {
    if (index < 0 || index >= this.state.frameCount) return;
    if (data.length !== this.state.frameSize) return;

    const frame = this.state.frames[index];
    if (!frame) return;

    this.pushUndo('modify', index, 1);
    frame.set(data);
    this.state.redoStack = [];
  }

  /**
   * Get current frame
   */
  getCurrentFrame(): Float32Array {
    return this.state.frames[this.state.currentFrame] ?? new Float32Array(this.state.frameSize);
  }

  /**
   * Set current frame index
   */
  setCurrentFrame(index: number): void {
    this.state.currentFrame = Math.max(0, Math.min(this.state.frameCount - 1, index));
    this.updateHarmonicsFromFrame();
    this.updateSpectralFromFrame();
  }

  /**
   * Get all frames
   */
  getAllFrames(): Float32Array[] {
    return this.state.frames;
  }

  // ==========================================================================
  // UNDO/REDO
  // ==========================================================================

  /**
   * Push operation to undo stack
   */
  private pushUndo(type: EditOperation['type'], frameIndex: number, frameCount: number): void {
    const previousData: Float32Array[] = [];
    for (let i = 0; i < frameCount; i++) {
      const idx = frameIndex + i;
      const frame = this.state.frames[idx];
      if (idx < this.state.frameCount && frame) {
        previousData.push(new Float32Array(frame));
      }
    }

    this.state.undoStack.push({
      type,
      frameIndex,
      frameCount,
      previousData,
      timestamp: Date.now(),
    });

    // Limit undo levels
    while (this.state.undoStack.length > this.state.maxUndoLevels) {
      this.state.undoStack.shift();
    }
  }

  /**
   * Undo last operation
   */
  undo(): boolean {
    const op = this.state.undoStack.pop();
    if (!op) return false;

    // Save current state for redo
    const currentData: Float32Array[] = [];
    for (let i = 0; i < op.frameCount; i++) {
      const idx = op.frameIndex + i;
      const frame = this.state.frames[idx];
      if (idx < this.state.frameCount && frame) {
        currentData.push(new Float32Array(frame));
      }
    }

    this.state.redoStack.push({
      ...op,
      previousData: currentData,
    });

    // Restore previous state
    for (let i = 0; i < op.previousData.length; i++) {
      const idx = op.frameIndex + i;
      const frame = this.state.frames[idx];
      const prevData = op.previousData[i];
      if (idx < this.state.frameCount && frame && prevData) {
        frame.set(prevData);
      }
    }

    return true;
  }

  /**
   * Redo last undone operation
   */
  redo(): boolean {
    const op = this.state.redoStack.pop();
    if (!op) return false;

    // Save current state for undo
    const currentData: Float32Array[] = [];
    for (let i = 0; i < op.frameCount; i++) {
      const idx = op.frameIndex + i;
      const frame = this.state.frames[idx];
      if (idx < this.state.frameCount && frame) {
        currentData.push(new Float32Array(frame));
      }
    }

    this.state.undoStack.push({
      ...op,
      previousData: currentData,
    });

    // Restore redo state
    for (let i = 0; i < op.previousData.length; i++) {
      const idx = op.frameIndex + i;
      const frame = this.state.frames[idx];
      const prevData = op.previousData[i];
      if (idx < this.state.frameCount && frame && prevData) {
        frame.set(prevData);
      }
    }

    return true;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.state.undoStack.length > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.state.redoStack.length > 0;
  }

  // ==========================================================================
  // DRAWING TOOLS
  // ==========================================================================

  /**
   * Draw with pencil tool
   */
  drawPencil(frameIndex: number, samples: Array<{ x: number; y: number }>): void {
    const frame = this.getFrame(frameIndex);
    if (!frame) return;

    this.pushUndo('modify', frameIndex, 1);

    for (const sample of samples) {
      const sampleIndex = Math.floor(sample.x * this.state.frameSize);
      if (sampleIndex >= 0 && sampleIndex < this.state.frameSize) {
        frame[sampleIndex] = Math.max(-1, Math.min(1, sample.y));
      }
    }

    this.state.redoStack = [];
  }

  /**
   * Draw line between two points
   */
  drawLine(
    frameIndex: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): void {
    const frame = this.getFrame(frameIndex);
    if (!frame) return;

    this.pushUndo('modify', frameIndex, 1);

    const startSample = Math.floor(x1 * this.state.frameSize);
    const endSample = Math.floor(x2 * this.state.frameSize);
    const sampleCount = Math.abs(endSample - startSample) + 1;

    for (let i = 0; i <= sampleCount; i++) {
      const t = sampleCount > 0 ? i / sampleCount : 0;
      const sampleIndex = Math.floor(startSample + (endSample - startSample) * t);
      const value = y1 + (y2 - y1) * t;

      if (sampleIndex >= 0 && sampleIndex < this.state.frameSize) {
        frame[sampleIndex] = Math.max(-1, Math.min(1, value));
      }
    }

    this.state.redoStack = [];
  }

  /**
   * Draw spline through control points
   */
  drawSpline(
    frameIndex: number,
    controlPoints: Array<{ x: number; y: number }>
  ): void {
    const frame = this.getFrame(frameIndex);
    if (!frame || controlPoints.length < 2) return;

    this.pushUndo('modify', frameIndex, 1);

    // Convert control points to sample indices
    const points = controlPoints.map(p => ({
      x: Math.floor(p.x * this.state.frameSize),
      y: p.y,
    }));

    // Catmull-Rom spline interpolation
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      if (!p0 || !p1 || !p2 || !p3) continue;

      const startX = p1.x;
      const endX = p2.x;

      for (let x = startX; x <= endX; x++) {
        if (x < 0 || x >= this.state.frameSize) continue;

        const t = (endX - startX) > 0 ? (x - startX) / (endX - startX) : 0;
        const t2 = t * t;
        const t3 = t2 * t;

        const y = 0.5 * (
          (2 * p1.y) +
          (-p0.y + p2.y) * t +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
        );

        frame[x] = Math.max(-1, Math.min(1, y));
      }
    }

    this.state.redoStack = [];
  }

  // ==========================================================================
  // FRAME TRANSFORMATIONS
  // ==========================================================================

  /**
   * Normalize frame
   */
  normalizeFrame(frameIndex: number): void {
    const frame = this.getFrame(frameIndex);
    if (!frame) return;

    this.pushUndo('transform', frameIndex, 1);

    let maxAbs = 0;
    for (let i = 0; i < frame.length; i++) {
      const val = frame[i];
      if (val !== undefined) {
        maxAbs = Math.max(maxAbs, Math.abs(val));
      }
    }

    if (maxAbs > 0) {
      const scale = 1 / maxAbs;
      for (let i = 0; i < frame.length; i++) {
        const val = frame[i];
        if (val !== undefined) {
          frame[i] = val * scale;
        }
      }
    }

    this.state.redoStack = [];
  }

  /**
   * Invert frame (vertical flip)
   */
  invertFrame(frameIndex: number): void {
    const frame = this.getFrame(frameIndex);
    if (!frame) return;

    this.pushUndo('transform', frameIndex, 1);

    for (let i = 0; i < frame.length; i++) {
      const val = frame[i];
      if (val !== undefined) {
        frame[i] = -val;
      }
    }

    this.state.redoStack = [];
  }

  /**
   * Reverse frame (horizontal flip)
   */
  reverseFrame(frameIndex: number): void {
    const frame = this.getFrame(frameIndex);
    if (!frame) return;

    this.pushUndo('transform', frameIndex, 1);

    const half = Math.floor(frame.length / 2);
    for (let i = 0; i < half; i++) {
      const j = frame.length - 1 - i;
      const valI = frame[i] ?? 0;
      const valJ = frame[j] ?? 0;
      frame[i] = valJ;
      frame[j] = valI;
    }

    this.state.redoStack = [];
  }

  /**
   * Shift frame (phase shift)
   */
  shiftFrame(frameIndex: number, amount: number): void {
    const frame = this.getFrame(frameIndex);
    if (!frame) return;

    this.pushUndo('transform', frameIndex, 1);

    const shift = Math.floor(amount * frame.length);
    const temp = new Float32Array(frame.length);

    for (let i = 0; i < frame.length; i++) {
      const sourceIndex = (i - shift + frame.length) % frame.length;
      temp[i] = frame[sourceIndex] ?? 0;
    }

    frame.set(temp);
    this.state.redoStack = [];
  }

  /**
   * Smooth frame
   */
  smoothFrame(frameIndex: number, amount: number): void {
    const frame = this.getFrame(frameIndex);
    if (!frame) return;

    this.pushUndo('transform', frameIndex, 1);

    const windowSize = Math.max(3, Math.floor(amount * 20) | 1);
    const halfWindow = Math.floor(windowSize / 2);
    const temp = new Float32Array(frame.length);

    for (let i = 0; i < frame.length; i++) {
      let sum = 0;
      let count = 0;

      for (let j = -halfWindow; j <= halfWindow; j++) {
        const idx = (i + j + frame.length) % frame.length;
        const val = frame[idx];
        if (val !== undefined) {
          sum += val;
          count++;
        }
      }

      temp[i] = sum / count;
    }

    frame.set(temp);
    this.state.redoStack = [];
  }

  /**
   * Apply DC offset removal
   */
  removeDC(frameIndex: number): void {
    const frame = this.getFrame(frameIndex);
    if (!frame) return;

    this.pushUndo('transform', frameIndex, 1);

    // Calculate DC offset
    let sum = 0;
    for (let i = 0; i < frame.length; i++) {
      const val = frame[i];
      if (val !== undefined) {
        sum += val;
      }
    }
    const dc = sum / frame.length;

    // Remove DC
    for (let i = 0; i < frame.length; i++) {
      const val = frame[i];
      if (val !== undefined) {
        frame[i] = val - dc;
      }
    }

    this.state.redoStack = [];
  }

  // ==========================================================================
  // HARMONIC EDITOR
  // ==========================================================================

  /**
   * Get harmonics from frame
   */
  private updateHarmonicsFromFrame(): void {
    const frame = this.getCurrentFrame();
    const real = new Float32Array(this.state.frameSize);
    const imag = new Float32Array(this.state.frameSize);

    real.set(frame);
    this.fft.forward(real, imag);

    for (let i = 0; i < this.state.harmonicCount; i++) {
      const realVal = real[i] ?? 0;
      const imagVal = imag[i] ?? 0;
      const mag = Math.sqrt(realVal * realVal + imagVal * imagVal) * 2 / this.state.frameSize;
      const phase = Math.atan2(imagVal, realVal);

      this.state.harmonics[i] = {
        amplitude: Math.min(1, mag),
        phase: phase,
      };
    }
  }

  /**
   * Apply harmonics to frame
   */
  applyHarmonicsToFrame(frameIndex: number): void {
    const frame = this.getFrame(frameIndex);
    if (!frame) return;

    this.pushUndo('modify', frameIndex, 1);

    // Generate waveform from harmonics
    for (let i = 0; i < frame.length; i++) {
      let sample = 0;
      const phase = (2 * Math.PI * i) / frame.length;

      for (let h = 1; h < this.state.harmonicCount; h++) {
        const harmonic = this.state.harmonics[h];
        if (harmonic && harmonic.amplitude > 0.001) {
          sample += harmonic.amplitude * Math.sin(h * phase + harmonic.phase);
        }
      }

      frame[i] = Math.max(-1, Math.min(1, sample));
    }

    this.state.redoStack = [];
  }

  /**
   * Set harmonic amplitude
   */
  setHarmonicAmplitude(harmonicIndex: number, amplitude: number): void {
    const harmonic = this.state.harmonics[harmonicIndex];
    if (harmonicIndex >= 0 && harmonicIndex < this.state.harmonicCount && harmonic) {
      harmonic.amplitude = Math.max(0, Math.min(1, amplitude));
    }
  }

  /**
   * Set harmonic phase
   */
  setHarmonicPhase(harmonicIndex: number, phase: number): void {
    const harmonic = this.state.harmonics[harmonicIndex];
    if (harmonicIndex >= 0 && harmonicIndex < this.state.harmonicCount && harmonic) {
      harmonic.phase = phase;
    }
  }

  /**
   * Get harmonics
   */
  getHarmonics(): HarmonicData[] {
    return [...this.state.harmonics];
  }

  /**
   * Apply harmonic preset
   */
  applyHarmonicPreset(preset: HarmonicPreset, frameIndex: number): void {
    // Reset all harmonics
    for (let i = 0; i < this.state.harmonicCount; i++) {
      this.state.harmonics[i] = { amplitude: 0, phase: 0 };
    }

    switch (preset) {
      case 'sine':
        this.state.harmonics[1] = { amplitude: 1, phase: 0 };
        break;

      case 'triangle':
        for (let h = 1; h < this.state.harmonicCount; h += 2) {
          const sign = ((h - 1) / 2) % 2 === 0 ? 1 : -1;
          this.state.harmonics[h] = {
            amplitude: sign * (8 / (Math.PI * Math.PI)) / (h * h),
            phase: 0,
          };
        }
        break;

      case 'square':
        for (let h = 1; h < this.state.harmonicCount; h += 2) {
          this.state.harmonics[h] = {
            amplitude: (4 / Math.PI) / h,
            phase: 0,
          };
        }
        break;

      case 'sawtooth':
        for (let h = 1; h < this.state.harmonicCount; h++) {
          this.state.harmonics[h] = {
            amplitude: (2 / Math.PI) / h,
            phase: h % 2 === 0 ? 0 : Math.PI,
          };
        }
        break;

      case 'pulse25':
        for (let h = 1; h < this.state.harmonicCount; h++) {
          const amp = (2 / (h * Math.PI)) * Math.sin(h * Math.PI * 0.25);
          this.state.harmonics[h] = { amplitude: Math.abs(amp), phase: 0 };
        }
        break;

      case 'pulse10':
        for (let h = 1; h < this.state.harmonicCount; h++) {
          const amp = (2 / (h * Math.PI)) * Math.sin(h * Math.PI * 0.1);
          this.state.harmonics[h] = { amplitude: Math.abs(amp), phase: 0 };
        }
        break;

      case 'organ':
        // Hammond-style drawbar
        this.state.harmonics[1] = { amplitude: 0.8, phase: 0 };
        this.state.harmonics[2] = { amplitude: 0.6, phase: 0 };
        this.state.harmonics[3] = { amplitude: 0.5, phase: 0 };
        this.state.harmonics[4] = { amplitude: 0.3, phase: 0 };
        this.state.harmonics[6] = { amplitude: 0.2, phase: 0 };
        this.state.harmonics[8] = { amplitude: 0.1, phase: 0 };
        break;

      case 'formant_a':
        this.createFormant([730, 1090, 2440], frameIndex);
        return;

      case 'formant_e':
        this.createFormant([530, 1840, 2480], frameIndex);
        return;

      case 'formant_i':
        this.createFormant([270, 2290, 3010], frameIndex);
        return;

      case 'formant_o':
        this.createFormant([570, 840, 2410], frameIndex);
        return;

      case 'formant_u':
        this.createFormant([300, 870, 2240], frameIndex);
        return;
    }

    this.applyHarmonicsToFrame(frameIndex);
  }

  /**
   * Create formant-shaped wavetable
   */
  private createFormant(formantFreqs: number[], frameIndex: number): void {
    const frame = this.getFrame(frameIndex);
    if (!frame) return;

    this.pushUndo('modify', frameIndex, 1);

    const baseFreq = 100; // Assume 100Hz fundamental

    for (let h = 1; h < this.state.harmonicCount; h++) {
      const harmonicFreq = h * baseFreq;
      let amplitude = 1 / h; // Base harmonic rolloff

      // Apply formant resonances
      for (const formant of formantFreqs) {
        const distance = Math.abs(harmonicFreq - formant);
        const bandwidth = formant * 0.1;
        const resonance = Math.exp(-distance * distance / (2 * bandwidth * bandwidth));
        amplitude += resonance * 0.5;
      }

      this.state.harmonics[h] = {
        amplitude: Math.min(1, amplitude),
        phase: 0,
      };
    }

    this.applyHarmonicsToFrame(frameIndex);
    this.state.redoStack = [];
  }

  // ==========================================================================
  // SPECTRAL EDITOR
  // ==========================================================================

  /**
   * Update spectral data from frame
   */
  private updateSpectralFromFrame(): void {
    const frame = this.getCurrentFrame();
    const real = new Float32Array(this.state.frameSize);
    const imag = new Float32Array(this.state.frameSize);

    real.set(frame);
    this.fft.forward(real, imag);

    const halfSize = this.state.frameSize / 2;
    const magnitudes = new Float32Array(halfSize);
    const phases = new Float32Array(halfSize);

    for (let i = 0; i < halfSize; i++) {
      const realVal = real[i] ?? 0;
      const imagVal = imag[i] ?? 0;
      magnitudes[i] = Math.sqrt(realVal * realVal + imagVal * imagVal);
      phases[i] = Math.atan2(imagVal, realVal);
    }

    this.state.spectralData = { magnitudes, phases };
  }

  /**
   * Apply spectral modification
   */
  applySpectralToFrame(frameIndex: number): void {
    if (!this.state.spectralData) return;

    const frame = this.getFrame(frameIndex);
    if (!frame) return;

    this.pushUndo('modify', frameIndex, 1);

    const real = new Float32Array(this.state.frameSize);
    const imag = new Float32Array(this.state.frameSize);

    const halfSize = this.state.frameSize / 2;

    // Reconstruct from magnitudes and phases
    for (let i = 0; i < halfSize; i++) {
      const mag = this.state.spectralData.magnitudes[i] ?? 0;
      const phase = this.state.spectralData.phases[i] ?? 0;
      real[i] = mag * Math.cos(phase);
      imag[i] = mag * Math.sin(phase);

      // Mirror for conjugate symmetry
      if (i > 0) {
        real[this.state.frameSize - i] = real[i] ?? 0;
        imag[this.state.frameSize - i] = -(imag[i] ?? 0);
      }
    }

    this.fft.inverse(real, imag);
    frame.set(real);

    this.state.redoStack = [];
  }

  /**
   * Set spectral magnitude at bin
   */
  setSpectralMagnitude(bin: number, magnitude: number): void {
    if (this.state.spectralData && bin >= 0 && bin < this.state.spectralData.magnitudes.length) {
      this.state.spectralData.magnitudes[bin] = Math.max(0, magnitude);
    }
  }

  /**
   * Apply spectral filter (highpass/lowpass/bandpass)
   */
  applySpectralFilter(
    frameIndex: number,
    type: 'lowpass' | 'highpass' | 'bandpass',
    cutoff: number,
    bandwidth?: number
  ): void {
    const frame = this.getFrame(frameIndex);
    if (!frame) return;

    this.pushUndo('modify', frameIndex, 1);

    const real = new Float32Array(this.state.frameSize);
    const imag = new Float32Array(this.state.frameSize);

    real.set(frame);
    this.fft.forward(real, imag);

    const halfSize = this.state.frameSize / 2;
    const cutoffBin = Math.floor(cutoff * halfSize);
    const bw = bandwidth ? Math.floor(bandwidth * halfSize) : halfSize;

    for (let i = 0; i < halfSize; i++) {
      let gain = 1;

      switch (type) {
        case 'lowpass':
          if (i > cutoffBin) gain = 0;
          break;
        case 'highpass':
          if (i < cutoffBin) gain = 0;
          break;
        case 'bandpass':
          if (i < cutoffBin - bw / 2 || i > cutoffBin + bw / 2) gain = 0;
          break;
      }

      const realVal = real[i] ?? 0;
      const imagVal = imag[i] ?? 0;
      real[i] = realVal * gain;
      imag[i] = imagVal * gain;

      if (i > 0) {
        const realMirror = real[this.state.frameSize - i] ?? 0;
        const imagMirror = imag[this.state.frameSize - i] ?? 0;
        real[this.state.frameSize - i] = realMirror * gain;
        imag[this.state.frameSize - i] = imagMirror * gain;
      }
    }

    this.fft.inverse(real, imag);
    frame.set(real);

    this.state.redoStack = [];
  }

  // ==========================================================================
  // MORPHING & INTERPOLATION
  // ==========================================================================

  /**
   * Morph between two frames
   */
  morphFrames(
    sourceA: number,
    sourceB: number,
    targetIndex: number,
    amount: number,
    interpolation: MorphInterpolation = 'linear'
  ): void {
    const frameA = this.getFrame(sourceA);
    const frameB = this.getFrame(sourceB);
    const target = this.getFrame(targetIndex);

    if (!frameA || !frameB || !target) return;

    this.pushUndo('modify', targetIndex, 1);

    switch (interpolation) {
      case 'linear':
        for (let i = 0; i < this.state.frameSize; i++) {
          const valA = frameA[i] ?? 0;
          const valB = frameB[i] ?? 0;
          target[i] = valA * (1 - amount) + valB * amount;
        }
        break;

      case 'cosine': {
        const t = (1 - Math.cos(amount * Math.PI)) / 2;
        for (let i = 0; i < this.state.frameSize; i++) {
          const valA = frameA[i] ?? 0;
          const valB = frameB[i] ?? 0;
          target[i] = valA * (1 - t) + valB * t;
        }
        break;
      }

      case 'cubic': {
        // Smoothstep
        const t = amount * amount * (3 - 2 * amount);
        for (let i = 0; i < this.state.frameSize; i++) {
          const valA = frameA[i] ?? 0;
          const valB = frameB[i] ?? 0;
          target[i] = valA * (1 - t) + valB * t;
        }
        break;
      }

      case 'spectral': {
        // FFT-based morphing
        const realA = new Float32Array(this.state.frameSize);
        const imagA = new Float32Array(this.state.frameSize);
        const realB = new Float32Array(this.state.frameSize);
        const imagB = new Float32Array(this.state.frameSize);

        realA.set(frameA);
        realB.set(frameB);

        this.fft.forward(realA, imagA);
        this.fft.forward(realB, imagB);

        // Interpolate magnitudes and phases separately
        for (let i = 0; i < this.state.frameSize; i++) {
          const realAVal = realA[i] ?? 0;
          const imagAVal = imagA[i] ?? 0;
          const realBVal = realB[i] ?? 0;
          const imagBVal = imagB[i] ?? 0;
          const magA = Math.sqrt(realAVal * realAVal + imagAVal * imagAVal);
          const magB = Math.sqrt(realBVal * realBVal + imagBVal * imagBVal);
          const phaseA = Math.atan2(imagAVal, realAVal);
          const phaseB = Math.atan2(imagBVal, realBVal);

          const mag = magA * (1 - amount) + magB * amount;

          // Unwrap phase for smooth interpolation
          let phaseDiff = phaseB - phaseA;
          while (phaseDiff > Math.PI) phaseDiff -= 2 * Math.PI;
          while (phaseDiff < -Math.PI) phaseDiff += 2 * Math.PI;
          const phase = phaseA + phaseDiff * amount;

          realA[i] = mag * Math.cos(phase);
          imagA[i] = mag * Math.sin(phase);
        }

        this.fft.inverse(realA, imagA);
        target.set(realA);
        break;
      }
    }

    this.state.redoStack = [];
  }

  /**
   * Generate morph sequence between frames
   */
  generateMorphSequence(
    sourceA: number,
    sourceB: number,
    startIndex: number,
    count: number,
    interpolation: MorphInterpolation = 'spectral'
  ): void {
    for (let i = 0; i < count; i++) {
      const targetIndex = startIndex + i;
      if (targetIndex >= this.state.frameCount) break;

      const amount = count > 1 ? i / (count - 1) : 0;
      this.morphFrames(sourceA, sourceB, targetIndex, amount, interpolation);
    }
  }

  // ==========================================================================
  // COPY/PASTE
  // ==========================================================================

  private clipboard: Float32Array | null = null;

  /**
   * Copy frame to clipboard
   */
  copyFrame(frameIndex: number): void {
    const frame = this.getFrame(frameIndex);
    if (frame) {
      this.clipboard = new Float32Array(frame);
    }
  }

  /**
   * Paste clipboard to frame
   */
  pasteFrame(frameIndex: number): void {
    if (!this.clipboard) return;

    const frame = this.getFrame(frameIndex);
    if (!frame) return;

    this.pushUndo('modify', frameIndex, 1);
    frame.set(this.clipboard);
    this.state.redoStack = [];
  }

  /**
   * Check if clipboard has data
   */
  hasClipboard(): boolean {
    return this.clipboard !== null;
  }

  // ==========================================================================
  // IMPORT/EXPORT
  // ==========================================================================

  /**
   * Export wavetable as raw float data
   */
  exportRaw(): Float32Array {
    const totalSamples = this.state.frameSize * this.state.frameCount;
    const data = new Float32Array(totalSamples);

    for (let f = 0; f < this.state.frameCount; f++) {
      const offset = f * this.state.frameSize;
      const frame = this.state.frames[f];
      if (frame) {
        data.set(frame, offset);
      }
    }

    return data;
  }

  /**
   * Import raw float data
   */
  importRaw(data: Float32Array, frameSize: number): void {
    const frameCount = Math.floor(data.length / frameSize);
    if (frameCount === 0) return;

    // Clear undo stack for import
    this.state.undoStack = [];
    this.state.redoStack = [];

    // Resize if needed
    if (frameSize !== this.state.frameSize || frameCount !== this.state.frameCount) {
      this.state.frameSize = frameSize;
      this.state.frameCount = frameCount;
      this.state.frames = [];

      for (let i = 0; i < frameCount; i++) {
        this.state.frames.push(new Float32Array(frameSize));
      }

      this.fft = new SimpleFFT(frameSize);
    }

    // Copy data
    for (let f = 0; f < frameCount; f++) {
      const offset = f * frameSize;
      const frame = this.state.frames[f];
      if (frame) {
        frame.set(data.subarray(offset, offset + frameSize));
      }
    }

    this.state.currentFrame = 0;
    this.updateHarmonicsFromFrame();
    this.updateSpectralFromFrame();
  }

  /**
   * Export to WAV format data
   */
  exportWav(): ArrayBuffer {
    const sampleRate = 44100;
    const totalSamples = this.state.frameSize * this.state.frameCount;

    // WAV header + 16-bit PCM data
    const buffer = new ArrayBuffer(44 + totalSamples * 2);
    const view = new DataView(buffer);

    // RIFF header
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, buffer.byteLength - 8, true);
    view.setUint32(8, 0x57415645, false); // "WAVE"

    // fmt chunk
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true);          // chunk size
    view.setUint16(20, 1, true);           // audio format (PCM)
    view.setUint16(22, 1, true);           // num channels
    view.setUint32(24, sampleRate, true);  // sample rate
    view.setUint32(28, sampleRate * 2, true); // byte rate
    view.setUint16(32, 2, true);           // block align
    view.setUint16(34, 16, true);          // bits per sample

    // data chunk
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, totalSamples * 2, true);

    // Write samples
    let offset = 44;
    for (let f = 0; f < this.state.frameCount; f++) {
      const frame = this.state.frames[f];
      for (let s = 0; s < this.state.frameSize; s++) {
        const sampleVal = frame?.[s] ?? 0;
        const sample = Math.max(-1, Math.min(1, sampleVal));
        const int16 = Math.floor(sample * 32767);
        view.setInt16(offset, int16, true);
        offset += 2;
      }
    }

    return buffer;
  }

  // ==========================================================================
  // STATE ACCESS
  // ==========================================================================

  /**
   * Get editor state
   */
  getState(): WavetableEditorState {
    return this.state;
  }

  /**
   * Set tool
   */
  setTool(tool: WavetableEditorTool): void {
    this.state.currentTool = tool;
  }

  /**
   * Get current tool
   */
  getTool(): WavetableEditorTool {
    return this.state.currentTool;
  }

  /**
   * Set wavetable name
   */
  setName(name: string): void {
    this.state.name = name;
  }

  /**
   * Get wavetable name
   */
  getName(): string {
    return this.state.name;
  }

  /**
   * Get frame count
   */
  getFrameCount(): number {
    return this.state.frameCount;
  }

  /**
   * Get frame size
   */
  getFrameSize(): number {
    return this.state.frameSize;
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createWavetableEditor(
  frameSize = 2048,
  frameCount = 256
): WavetableEditor {
  return new WavetableEditor(frameSize, frameCount);
}
