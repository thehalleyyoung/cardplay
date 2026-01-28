/**
 * @fileoverview Visualization Components for Audio/MIDI.
 * 
 * Comprehensive visualization infrastructure including:
 * - Waveform display with multiple render modes
 * - Spectrogram with FFT analysis
 * - Piano keyboard (interactive, virtual MIDI controller)
 * - Level meters (peak, RMS, VU, LUFS)
 * - Phase/correlation meters
 * - Timeline/ruler display
 * - Beat grid and playhead
 * - Velocity and automation lanes
 */

// ============================================================================
// WAVEFORM DISPLAY
// ============================================================================

/**
 * Waveform render mode.
 */
export type WaveformRenderMode = 
  | 'line'        // Single line connecting peaks
  | 'bars'        // Vertical bars per sample
  | 'mirror'      // Mirrored above/below center
  | 'filled'      // Filled area to center
  | 'gradient';   // Gradient filled area

/**
 * Waveform channel mode.
 */
export type WaveformChannelMode = 
  | 'mono'        // Sum to mono
  | 'stereo'      // Left and right separate
  | 'mid-side'    // M/S display
  | 'difference'; // L-R difference

/**
 * Waveform data point (min/max for time range).
 */
export interface WaveformPeak {
  readonly min: number;
  readonly max: number;
  readonly rms: number;
}

/**
 * Waveform display configuration.
 */
export interface WaveformConfig {
  readonly renderMode: WaveformRenderMode;
  readonly channelMode: WaveformChannelMode;
  readonly color: string;
  readonly backgroundColor: string;
  readonly lineWidth: number;
  readonly showRMS: boolean;
  readonly rmsColor: string;
  readonly showCenterLine: boolean;
  readonly centerLineColor: string;
  readonly antiAlias: boolean;
  readonly pixelRatio: number;
  readonly normalize: boolean;
  readonly logScale: boolean;
  readonly clipIndicator: boolean;
  readonly clipColor: string;
}

/**
 * Default waveform configuration.
 */
export const DEFAULT_WAVEFORM_CONFIG: WaveformConfig = {
  renderMode: 'filled',
  channelMode: 'mono',
  color: '#3b82f6',
  backgroundColor: '#1a1a2e',
  lineWidth: 1,
  showRMS: true,
  rmsColor: '#60a5fa',
  showCenterLine: true,
  centerLineColor: '#333355',
  antiAlias: true,
  pixelRatio: 2,
  normalize: false,
  logScale: false,
  clipIndicator: true,
  clipColor: '#ef4444',
};

/**
 * Calculate peaks from audio buffer for display.
 * 
 * @param samples - Float32Array of audio samples
 * @param targetWidth - Number of peaks to generate (pixels)
 * @param startSample - Start sample index
 * @param endSample - End sample index
 * @returns Array of peak data for rendering
 */
export function calculateWaveformPeaks(
  samples: Float32Array,
  targetWidth: number,
  startSample: number = 0,
  endSample: number = samples.length
): readonly WaveformPeak[] {
  const sampleRange = endSample - startSample;
  const samplesPerPixel = Math.max(1, Math.floor(sampleRange / targetWidth));
  const peaks: WaveformPeak[] = [];

  for (let i = 0; i < targetWidth; i++) {
    const blockStart = startSample + i * samplesPerPixel;
    const blockEnd = Math.min(blockStart + samplesPerPixel, endSample);
    
    let min = Infinity;
    let max = -Infinity;
    let sumSquares = 0;
    let count = 0;

    for (let j = blockStart; j < blockEnd; j++) {
      const sample = samples[j] ?? 0;
      min = Math.min(min, sample);
      max = Math.max(max, sample);
      sumSquares += sample * sample;
      count++;
    }

    peaks.push({
      min: min === Infinity ? 0 : min,
      max: max === -Infinity ? 0 : max,
      rms: count > 0 ? Math.sqrt(sumSquares / count) : 0,
    });
  }

  return peaks;
}

/**
 * Normalize waveform peaks to fit display.
 */
export function normalizeWaveformPeaks(
  peaks: readonly WaveformPeak[],
  headroom: number = 0.95
): readonly WaveformPeak[] {
  let maxAbs = 0;
  
  for (const peak of peaks) {
    maxAbs = Math.max(maxAbs, Math.abs(peak.min), Math.abs(peak.max));
  }
  
  if (maxAbs === 0) return peaks;
  
  const scale = headroom / maxAbs;
  
  return peaks.map(peak => ({
    min: peak.min * scale,
    max: peak.max * scale,
    rms: peak.rms * scale,
  }));
}

/**
 * Calculate stereo waveform peaks from left/right channels.
 */
export function calculateStereoWaveformPeaks(
  left: Float32Array,
  right: Float32Array,
  targetWidth: number,
  mode: WaveformChannelMode
): { left: readonly WaveformPeak[]; right: readonly WaveformPeak[] } {
  if (mode === 'mono') {
    // Sum to mono
    const mono = new Float32Array(left.length);
    for (let i = 0; i < left.length; i++) {
      mono[i] = ((left[i] ?? 0) + (right[i] ?? 0)) * 0.5;
    }
    const peaks = calculateWaveformPeaks(mono, targetWidth);
    return { left: peaks, right: peaks };
  }
  
  if (mode === 'mid-side') {
    const mid = new Float32Array(left.length);
    const side = new Float32Array(left.length);
    for (let i = 0; i < left.length; i++) {
      const l = left[i] ?? 0;
      const r = right[i] ?? 0;
      mid[i] = (l + r) * 0.5;
      side[i] = (l - r) * 0.5;
    }
    return {
      left: calculateWaveformPeaks(mid, targetWidth),
      right: calculateWaveformPeaks(side, targetWidth),
    };
  }
  
  if (mode === 'difference') {
    const diff = new Float32Array(left.length);
    for (let i = 0; i < left.length; i++) {
      diff[i] = (left[i] ?? 0) - (right[i] ?? 0);
    }
    const peaks = calculateWaveformPeaks(diff, targetWidth);
    return { left: peaks, right: peaks };
  }
  
  // stereo
  return {
    left: calculateWaveformPeaks(left, targetWidth),
    right: calculateWaveformPeaks(right, targetWidth),
  };
}

/**
 * Waveform state for rendering.
 */
export interface WaveformState {
  readonly peaks: { left: readonly WaveformPeak[]; right: readonly WaveformPeak[] };
  readonly duration: number;
  readonly sampleRate: number;
  readonly channels: number;
  readonly zoom: number;
  readonly scrollOffset: number;
  readonly selection: { start: number; end: number } | null;
  readonly playheadPosition: number | null;
}

/**
 * Create initial waveform state.
 */
export function createWaveformState(
  left: Float32Array,
  right: Float32Array | null,
  sampleRate: number,
  width: number,
  config: WaveformConfig = DEFAULT_WAVEFORM_CONFIG
): WaveformState {
  const r = right ?? left;
  const peaks = calculateStereoWaveformPeaks(left, r, width, config.channelMode);
  
  return {
    peaks,
    duration: left.length / sampleRate,
    sampleRate,
    channels: right ? 2 : 1,
    zoom: 1,
    scrollOffset: 0,
    selection: null,
    playheadPosition: null,
  };
}

// ============================================================================
// SPECTROGRAM DISPLAY
// ============================================================================

/**
 * Spectrogram color scheme.
 */
export type SpectrogramColorScheme = 
  | 'grayscale'
  | 'heat'
  | 'rainbow'
  | 'magma'
  | 'plasma'
  | 'viridis'
  | 'inferno';

/**
 * Spectrogram scale type.
 */
export type SpectrogramScale = 'linear' | 'logarithmic' | 'mel';

/**
 * Spectrogram configuration.
 */
export interface SpectrogramConfig {
  readonly fftSize: number;           // 256, 512, 1024, 2048, 4096, 8192
  readonly hopSize: number;           // Samples between FFT frames
  readonly windowFunction: 'hann' | 'hamming' | 'blackman' | 'rectangular';
  readonly colorScheme: SpectrogramColorScheme;
  readonly frequencyScale: SpectrogramScale;
  readonly minFrequency: number;      // Hz
  readonly maxFrequency: number;      // Hz
  readonly minDecibels: number;       // dB floor
  readonly maxDecibels: number;       // dB ceiling
  readonly smoothing: number;         // 0-1 temporal smoothing
}

/**
 * Default spectrogram configuration.
 */
export const DEFAULT_SPECTROGRAM_CONFIG: SpectrogramConfig = {
  fftSize: 2048,
  hopSize: 512,
  windowFunction: 'hann',
  colorScheme: 'magma',
  frequencyScale: 'logarithmic',
  minFrequency: 20,
  maxFrequency: 20000,
  minDecibels: -90,
  maxDecibels: -10,
  smoothing: 0.5,
};

/**
 * Window function generators.
 */
export const windowFunctions = {
  rectangular: (_n: number, _N: number): number => 1,
  
  hann: (n: number, N: number): number => 
    0.5 * (1 - Math.cos(2 * Math.PI * n / (N - 1))),
  
  hamming: (n: number, N: number): number =>
    0.54 - 0.46 * Math.cos(2 * Math.PI * n / (N - 1)),
  
  blackman: (n: number, N: number): number =>
    0.42 - 0.5 * Math.cos(2 * Math.PI * n / (N - 1)) +
    0.08 * Math.cos(4 * Math.PI * n / (N - 1)),
};

/**
 * Generate window function array.
 */
export function generateWindow(
  type: keyof typeof windowFunctions,
  size: number
): Float32Array {
  const window = new Float32Array(size);
  const fn = windowFunctions[type];
  
  for (let i = 0; i < size; i++) {
    window[i] = fn(i, size);
  }
  
  return window;
}

/**
 * Calculate magnitude spectrum from FFT result.
 */
export function calculateMagnitudeSpectrum(
  real: Float32Array,
  imag: Float32Array,
  minDb: number = -90,
  maxDb: number = -10
): Float32Array {
  const size = real.length / 2; // Only positive frequencies
  const magnitudes = new Float32Array(size);
  const range = maxDb - minDb;
  
  for (let i = 0; i < size; i++) {
    const r = real[i] ?? 0;
    const im = imag[i] ?? 0;
    const magnitude = Math.sqrt(r * r + im * im);
    const db = 20 * Math.log10(magnitude + 1e-10);
    magnitudes[i] = Math.max(0, Math.min(1, (db - minDb) / range));
  }
  
  return magnitudes;
}

/**
 * Map frequency to y-coordinate based on scale.
 */
export function frequencyToY(
  frequency: number,
  height: number,
  minFreq: number,
  maxFreq: number,
  scale: SpectrogramScale
): number {
  if (scale === 'linear') {
    return height - (frequency - minFreq) / (maxFreq - minFreq) * height;
  }
  
  if (scale === 'logarithmic') {
    const logMin = Math.log10(minFreq);
    const logMax = Math.log10(maxFreq);
    const logFreq = Math.log10(Math.max(minFreq, frequency));
    return height - (logFreq - logMin) / (logMax - logMin) * height;
  }
  
  // Mel scale
  const melMin = 1127 * Math.log(1 + minFreq / 700);
  const melMax = 1127 * Math.log(1 + maxFreq / 700);
  const melFreq = 1127 * Math.log(1 + frequency / 700);
  return height - (melFreq - melMin) / (melMax - melMin) * height;
}

/**
 * Map bin index to frequency.
 */
export function binToFrequency(
  bin: number,
  fftSize: number,
  sampleRate: number
): number {
  return bin * sampleRate / fftSize;
}

/**
 * Color gradient for spectrogram.
 */
export interface ColorGradient {
  readonly stops: readonly { position: number; color: string }[];
}

/**
 * Predefined color gradients.
 */
export const spectrogramGradients: Record<SpectrogramColorScheme, ColorGradient> = {
  grayscale: {
    stops: [
      { position: 0, color: '#000000' },
      { position: 1, color: '#ffffff' },
    ],
  },
  heat: {
    stops: [
      { position: 0, color: '#000000' },
      { position: 0.33, color: '#cc0000' },
      { position: 0.66, color: '#ffcc00' },
      { position: 1, color: '#ffffff' },
    ],
  },
  rainbow: {
    stops: [
      { position: 0, color: '#0000ff' },
      { position: 0.25, color: '#00ffff' },
      { position: 0.5, color: '#00ff00' },
      { position: 0.75, color: '#ffff00' },
      { position: 1, color: '#ff0000' },
    ],
  },
  magma: {
    stops: [
      { position: 0, color: '#000004' },
      { position: 0.25, color: '#3b0f70' },
      { position: 0.5, color: '#b63679' },
      { position: 0.75, color: '#fe9f6d' },
      { position: 1, color: '#fcfdbf' },
    ],
  },
  plasma: {
    stops: [
      { position: 0, color: '#0d0887' },
      { position: 0.25, color: '#7e03a8' },
      { position: 0.5, color: '#cc4778' },
      { position: 0.75, color: '#f89540' },
      { position: 1, color: '#f0f921' },
    ],
  },
  viridis: {
    stops: [
      { position: 0, color: '#440154' },
      { position: 0.25, color: '#3b528b' },
      { position: 0.5, color: '#21918c' },
      { position: 0.75, color: '#5ec962' },
      { position: 1, color: '#fde725' },
    ],
  },
  inferno: {
    stops: [
      { position: 0, color: '#000004' },
      { position: 0.25, color: '#420a68' },
      { position: 0.5, color: '#932667' },
      { position: 0.75, color: '#dd513a' },
      { position: 1, color: '#fca50a' },
    ],
  },
};

// ============================================================================
// PIANO KEYBOARD
// ============================================================================

/**
 * Piano key type.
 */
export type KeyType = 'white' | 'black';

/**
 * Piano key definition.
 */
export interface PianoKey {
  readonly midiNote: number;
  readonly noteName: string;
  readonly octave: number;
  readonly type: KeyType;
  readonly x: number;           // X position (relative to octave)
  readonly width: number;       // Relative width
}

/**
 * Piano keyboard configuration.
 */
export interface PianoKeyboardConfig {
  readonly startNote: number;   // MIDI note number
  readonly endNote: number;     // MIDI note number
  readonly whiteKeyWidth: number;
  readonly whiteKeyHeight: number;
  readonly blackKeyWidth: number;    // Relative to white key
  readonly blackKeyHeight: number;   // Relative to white key
  readonly gap: number;
  readonly showLabels: boolean;
  readonly highlightColor: string;
  readonly pressedColor: string;
  readonly whiteKeyColor: string;
  readonly blackKeyColor: string;
  readonly labelColor: string;
}

/**
 * Default piano keyboard configuration.
 */
export const DEFAULT_PIANO_CONFIG: PianoKeyboardConfig = {
  startNote: 21,    // A0
  endNote: 108,     // C8
  whiteKeyWidth: 24,
  whiteKeyHeight: 120,
  blackKeyWidth: 0.6,
  blackKeyHeight: 0.65,
  gap: 1,
  showLabels: true,
  highlightColor: '#3b82f6',
  pressedColor: '#1d4ed8',
  whiteKeyColor: '#ffffff',
  blackKeyColor: '#1a1a1a',
  labelColor: '#666666',
};

/**
 * Note names in octave.
 */
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

/**
 * Check if MIDI note is a black key.
 */
export function isBlackKey(midiNote: number): boolean {
  const noteInOctave = midiNote % 12;
  return [1, 3, 6, 8, 10].includes(noteInOctave);
}

/**
 * Get note name from MIDI note.
 */
export function midiNoteToName(midiNote: number): string {
  const noteIndex = midiNote % 12;
  const octave = Math.floor(midiNote / 12) - 1;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

/**
 * Get octave from MIDI note.
 */
export function midiNoteToOctave(midiNote: number): number {
  return Math.floor(midiNote / 12) - 1;
}

/**
 * Calculate black key X offset within octave.
 * Black keys are positioned between white keys, but not evenly.
 */
export function getBlackKeyOffset(noteInOctave: number): number {
  // Positions relative to the left edge of the octave's white keys
  // C# between C and D, D# between D and E, etc.
  const offsets: Record<number, number> = {
    1: 0.65,   // C#
    3: 1.75,   // D#
    6: 3.6,    // F#
    8: 4.65,   // G#
    10: 5.7,   // A#
  };
  return offsets[noteInOctave] ?? 0;
}

/**
 * Generate piano keyboard layout.
 */
export function generatePianoKeys(
  config: PianoKeyboardConfig = DEFAULT_PIANO_CONFIG
): readonly PianoKey[] {
  const keys: PianoKey[] = [];
  
  // First pass: count white keys for positioning
  let whiteKeyCount = 0;
  
  for (let note = config.startNote; note <= config.endNote; note++) {
    if (!isBlackKey(note)) {
      whiteKeyCount++;
    }
  }
  
  // Second pass: generate keys
  let whiteKeyIndex = 0;
  
  for (let note = config.startNote; note <= config.endNote; note++) {
    const noteInOctave = note % 12;
    const type: KeyType = isBlackKey(note) ? 'black' : 'white';
    
    if (type === 'white') {
      keys.push({
        midiNote: note,
        noteName: NOTE_NAMES[noteInOctave]!,
        octave: midiNoteToOctave(note),
        type: 'white',
        x: whiteKeyIndex * (config.whiteKeyWidth + config.gap),
        width: config.whiteKeyWidth,
      });
      whiteKeyIndex++;
    } else {
      // Find the previous white key for positioning
      const prevWhiteKeyIndex = whiteKeyIndex - 1;
      const blackKeyWidth = config.whiteKeyWidth * config.blackKeyWidth;
      
      keys.push({
        midiNote: note,
        noteName: NOTE_NAMES[noteInOctave]!,
        octave: midiNoteToOctave(note),
        type: 'black',
        x: prevWhiteKeyIndex * (config.whiteKeyWidth + config.gap) + 
           config.whiteKeyWidth - blackKeyWidth / 2,
        width: blackKeyWidth,
      });
    }
  }
  
  return keys;
}

/**
 * Piano keyboard state.
 */
export interface PianoKeyboardState {
  readonly keys: readonly PianoKey[];
  readonly pressedNotes: ReadonlySet<number>;
  readonly highlightedNotes: ReadonlySet<number>;
  readonly velocity: number;
  readonly octaveShift: number;
}

/**
 * Create piano keyboard state.
 */
export function createPianoKeyboardState(
  config: PianoKeyboardConfig = DEFAULT_PIANO_CONFIG
): PianoKeyboardState {
  return {
    keys: generatePianoKeys(config),
    pressedNotes: new Set(),
    highlightedNotes: new Set(),
    velocity: 100,
    octaveShift: 0,
  };
}

/**
 * Handle note on.
 */
export function pianoNoteOn(
  state: PianoKeyboardState,
  midiNote: number
): PianoKeyboardState {
  const newPressed = new Set(state.pressedNotes);
  newPressed.add(midiNote);
  return { ...state, pressedNotes: newPressed };
}

/**
 * Handle note off.
 */
export function pianoNoteOff(
  state: PianoKeyboardState,
  midiNote: number
): PianoKeyboardState {
  const newPressed = new Set(state.pressedNotes);
  newPressed.delete(midiNote);
  return { ...state, pressedNotes: newPressed };
}

/**
 * Highlight notes (e.g., for scale display).
 */
export function highlightNotes(
  state: PianoKeyboardState,
  notes: readonly number[]
): PianoKeyboardState {
  return { ...state, highlightedNotes: new Set(notes) };
}

// ============================================================================
// LEVEL METERS
// ============================================================================

/**
 * Meter type.
 */
export type LevelMeterType = 'peak' | 'rms' | 'vu' | 'ppm' | 'lufs';

/**
 * Meter scale.
 */
export type LevelMeterScale = 'linear' | 'logarithmic' | 'k-weighted';

/**
 * Meter orientation.
 */
export type LevelMeterOrientation = 'horizontal' | 'vertical';

/**
 * Level meter configuration.
 */
export interface LevelMeterConfig {
  readonly type: LevelMeterType;
  readonly scale: LevelMeterScale;
  readonly orientation: LevelMeterOrientation;
  readonly minDb: number;
  readonly maxDb: number;
  readonly warningLevel: number;    // dB
  readonly criticalLevel: number;   // dB (usually 0 dB)
  readonly peakHoldTime: number;    // ms
  readonly peakFallRate: number;    // dB/second
  readonly ballistics: number;      // 0-1 smoothing
  readonly showPeakHold: boolean;
  readonly showScale: boolean;
  readonly showValue: boolean;
  readonly stereo: boolean;
  readonly normalColor: string;
  readonly warningColor: string;
  readonly criticalColor: string;
  readonly peakColor: string;
  readonly backgroundColor: string;
}

/**
 * Default level meter configuration.
 */
export const DEFAULT_LEVEL_METER_CONFIG: LevelMeterConfig = {
  type: 'peak',
  scale: 'logarithmic',
  orientation: 'vertical',
  minDb: -60,
  maxDb: 6,
  warningLevel: -12,
  criticalLevel: 0,
  peakHoldTime: 2000,
  peakFallRate: 20,
  ballistics: 0.9,
  showPeakHold: true,
  showScale: true,
  showValue: true,
  stereo: true,
  normalColor: '#22c55e',
  warningColor: '#eab308',
  criticalColor: '#ef4444',
  peakColor: '#ffffff',
  backgroundColor: '#1a1a1a',
};

/**
 * Level meter reading.
 */
export interface LevelMeterReading {
  readonly current: number;      // Current level in dB
  readonly peak: number;         // Peak level in dB
  readonly peakHeld: boolean;    // Whether peak is being held
  readonly clipping: boolean;    // Whether signal is clipping
}

/**
 * Level meter state.
 */
export interface LevelMeterState {
  readonly left: LevelMeterReading;
  readonly right: LevelMeterReading;
  readonly mono: LevelMeterReading;
  readonly correlation: number;  // -1 to 1
}

/**
 * Convert linear amplitude to dB.
 */
export function amplitudeToDb(amplitude: number): number {
  return 20 * Math.log10(Math.max(amplitude, 1e-10));
}

/**
 * Convert dB to linear amplitude.
 */
export function dbToAmplitude(db: number): number {
  return Math.pow(10, db / 20);
}

/**
 * Calculate level from samples.
 */
export function calculateLevel(
  samples: Float32Array,
  type: LevelMeterType
): number {
  if (type === 'peak') {
    let peak = 0;
    for (let i = 0; i < samples.length; i++) {
      peak = Math.max(peak, Math.abs(samples[i] ?? 0));
    }
    return amplitudeToDb(peak);
  }
  
  if (type === 'rms') {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i] ?? 0;
      sum += s * s;
    }
    return amplitudeToDb(Math.sqrt(sum / samples.length));
  }
  
  // VU meter: RMS with specific ballistics (300ms integration)
  // PPM: Peak with specific ballistics
  // For simplicity, use RMS for now
  return calculateLevel(samples, 'rms');
}

/**
 * Apply meter ballistics (smoothing).
 */
export function applyMeterBallistics(
  current: number,
  target: number,
  ballistics: number,
  deltaTime: number
): number {
  const factor = Math.pow(ballistics, deltaTime * 60);
  return current + (target - current) * (1 - factor);
}

/**
 * Update peak hold.
 */
export function updatePeakHold(
  currentPeak: number,
  newLevel: number,
  holdTime: number,
  fallRate: number,
  deltaTime: number,
  lastPeakTime: number,
  currentTime: number
): { peak: number; held: boolean; peakTime: number } {
  if (newLevel >= currentPeak) {
    return { peak: newLevel, held: true, peakTime: currentTime };
  }
  
  if (currentTime - lastPeakTime < holdTime) {
    return { peak: currentPeak, held: true, peakTime: lastPeakTime };
  }
  
  // Fall
  const newPeak = currentPeak - fallRate * (deltaTime / 1000);
  return { peak: Math.max(newLevel, newPeak), held: false, peakTime: lastPeakTime };
}

/**
 * Map dB level to meter position (0-1).
 */
export function dbToMeterPosition(
  db: number,
  config: LevelMeterConfig
): number {
  if (config.scale === 'linear') {
    return (db - config.minDb) / (config.maxDb - config.minDb);
  }
  
  // Logarithmic: use more resolution in upper range
  const normalizedDb = (db - config.minDb) / (config.maxDb - config.minDb);
  return Math.max(0, Math.min(1, normalizedDb));
}

/**
 * Get meter segment color.
 */
export function getMeterColor(
  db: number,
  config: LevelMeterConfig
): string {
  if (db >= config.criticalLevel) return config.criticalColor;
  if (db >= config.warningLevel) return config.warningColor;
  return config.normalColor;
}

/**
 * Generate meter scale marks.
 */
export function generateMeterScale(
  config: LevelMeterConfig
): readonly { db: number; position: number; label: string }[] {
  const marks: { db: number; position: number; label: string }[] = [];
  
  // Common dB marks
  const dbMarks = [0, -3, -6, -12, -18, -24, -36, -48, -60];
  
  for (const db of dbMarks) {
    if (db >= config.minDb && db <= config.maxDb) {
      marks.push({
        db,
        position: dbToMeterPosition(db, config),
        label: db === 0 ? '0' : `${db}`,
      });
    }
  }
  
  return marks.sort((a, b) => b.db - a.db);
}

// ============================================================================
// PHASE/CORRELATION METER
// ============================================================================

/**
 * Phase meter configuration.
 */
export interface PhaseMeterConfig {
  readonly width: number;
  readonly height: number;
  readonly integrationTime: number;  // ms
  readonly smoothing: number;        // 0-1
  readonly showScale: boolean;
  readonly showValue: boolean;
  readonly positiveColor: string;    // In-phase
  readonly negativeColor: string;    // Out-of-phase
  readonly backgroundColor: string;
}

/**
 * Default phase meter configuration.
 */
export const DEFAULT_PHASE_METER_CONFIG: PhaseMeterConfig = {
  width: 200,
  height: 30,
  integrationTime: 50,
  smoothing: 0.95,
  showScale: true,
  showValue: true,
  positiveColor: '#22c55e',
  negativeColor: '#ef4444',
  backgroundColor: '#1a1a1a',
};

/**
 * Calculate stereo correlation.
 * Returns value from -1 (out of phase) to 1 (in phase).
 */
export function calculateCorrelation(
  left: Float32Array,
  right: Float32Array
): number {
  let sumLR = 0;
  let sumL2 = 0;
  let sumR2 = 0;
  
  for (let i = 0; i < left.length; i++) {
    const l = left[i] ?? 0;
    const r = right[i] ?? 0;
    sumLR += l * r;
    sumL2 += l * l;
    sumR2 += r * r;
  }
  
  const denominator = Math.sqrt(sumL2 * sumR2);
  if (denominator < 1e-10) return 0;
  
  return sumLR / denominator;
}

/**
 * Phase meter state.
 */
export interface PhaseMeterState {
  readonly correlation: number;      // -1 to 1
  readonly history: readonly number[];
  readonly integrationSamples: number;
}

/**
 * Create phase meter state.
 */
export function createPhaseMeterState(
  sampleRate: number,
  integrationTime: number = 50
): PhaseMeterState {
  return {
    correlation: 0,
    history: [],
    integrationSamples: Math.floor(sampleRate * integrationTime / 1000),
  };
}

// ============================================================================
// TIMELINE / RULER
// ============================================================================

/**
 * Timeline display mode.
 */
export type TimelineMode = 'time' | 'bars' | 'samples';

/**
 * Timeline configuration.
 */
export interface TimelineConfig {
  readonly mode: TimelineMode;
  readonly tempo: number;
  readonly timeSignature: { numerator: number; denominator: number };
  readonly sampleRate: number;
  readonly pixelsPerSecond: number;
  readonly minTickSpacing: number;   // Minimum pixels between ticks
  readonly showMajorTicks: boolean;
  readonly showMinorTicks: boolean;
  readonly showLabels: boolean;
  readonly showPlayhead: boolean;
  readonly backgroundColor: string;
  readonly tickColor: string;
  readonly majorTickColor: string;
  readonly labelColor: string;
  readonly playheadColor: string;
}

/**
 * Default timeline configuration.
 */
export const DEFAULT_TIMELINE_CONFIG: TimelineConfig = {
  mode: 'bars',
  tempo: 120,
  timeSignature: { numerator: 4, denominator: 4 },
  sampleRate: 48000,
  pixelsPerSecond: 100,
  minTickSpacing: 50,
  showMajorTicks: true,
  showMinorTicks: true,
  showLabels: true,
  showPlayhead: true,
  backgroundColor: '#1a1a1a',
  tickColor: '#444444',
  majorTickColor: '#666666',
  labelColor: '#aaaaaa',
  playheadColor: '#3b82f6',
};

/**
 * Timeline tick mark.
 */
export interface TimelineTick {
  readonly x: number;
  readonly major: boolean;
  readonly label: string;
  readonly time: number;     // Seconds
  readonly bar?: number;     // Bar number (if mode is 'bars')
  readonly beat?: number;    // Beat within bar
}

/**
 * Calculate bar duration in seconds.
 */
export function calculateBarDuration(
  tempo: number,
  numerator: number,
  denominator: number
): number {
  const beatDuration = 60 / tempo;
  const beatsPerBar = numerator * (4 / denominator);
  return beatDuration * beatsPerBar;
}

/**
 * Generate timeline ticks.
 */
export function generateTimelineTicks(
  startTime: number,
  endTime: number,
  config: TimelineConfig
): readonly TimelineTick[] {
  const ticks: TimelineTick[] = [];
  
  if (config.mode === 'bars') {
    const barDuration = calculateBarDuration(
      config.tempo,
      config.timeSignature.numerator,
      config.timeSignature.denominator
    );
    const beatDuration = 60 / config.tempo;
    
    const startBar = Math.floor(startTime / barDuration);
    const endBar = Math.ceil(endTime / barDuration);
    
    for (let bar = startBar; bar <= endBar; bar++) {
      const barTime = bar * barDuration;
      const barX = (barTime - startTime) * config.pixelsPerSecond;
      
      // Major tick at bar line
      if (barX >= 0) {
        ticks.push({
          x: barX,
          major: true,
          label: `${bar + 1}`,
          time: barTime,
          bar: bar + 1,
          beat: 1,
        });
      }
      
      // Minor ticks for beats
      if (config.showMinorTicks) {
        for (let beat = 1; beat < config.timeSignature.numerator; beat++) {
          const beatTime = barTime + beat * beatDuration;
          const beatX = (beatTime - startTime) * config.pixelsPerSecond;
          
          if (beatX >= 0 && beatTime <= endTime) {
            ticks.push({
              x: beatX,
              major: false,
              label: '',
              time: beatTime,
              bar: bar + 1,
              beat: beat + 1,
            });
          }
        }
      }
    }
  } else if (config.mode === 'time') {
    // Time-based ticks (seconds/minutes)
    const duration = endTime - startTime;
    const pixelDuration = duration * config.pixelsPerSecond;
    
    // Determine tick interval
    let tickInterval = 1; // seconds
    if (pixelDuration / duration < config.minTickSpacing) {
      tickInterval = Math.ceil(config.minTickSpacing / config.pixelsPerSecond);
    }
    
    // Round to nice values
    const niceIntervals = [0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 30, 60];
    for (const interval of niceIntervals) {
      if (interval * config.pixelsPerSecond >= config.minTickSpacing) {
        tickInterval = interval;
        break;
      }
    }
    
    const startTick = Math.floor(startTime / tickInterval) * tickInterval;
    
    for (let t = startTick; t <= endTime; t += tickInterval) {
      const x = (t - startTime) * config.pixelsPerSecond;
      
      if (x >= 0) {
        const major = t % (tickInterval * 4) === 0 || tickInterval >= 1 && t % 1 === 0;
        const minutes = Math.floor(t / 60);
        const seconds = t % 60;
        
        ticks.push({
          x,
          major,
          label: major ? `${minutes}:${seconds.toFixed(0).padStart(2, '0')}` : '',
          time: t,
        });
      }
    }
  }
  
  return ticks;
}

/**
 * Timeline state.
 */
export interface TimelineState {
  readonly ticks: readonly TimelineTick[];
  readonly playheadPosition: number;   // Seconds
  readonly loopStart: number | null;
  readonly loopEnd: number | null;
  readonly selection: { start: number; end: number } | null;
  readonly zoom: number;
  readonly scrollOffset: number;
}

/**
 * Create timeline state.
 */
export function createTimelineState(
  duration: number,
  config: TimelineConfig = DEFAULT_TIMELINE_CONFIG
): TimelineState {
  return {
    ticks: generateTimelineTicks(0, duration, config),
    playheadPosition: 0,
    loopStart: null,
    loopEnd: null,
    selection: null,
    zoom: 1,
    scrollOffset: 0,
  };
}

// ============================================================================
// VELOCITY BARS
// ============================================================================

/**
 * Velocity bar data.
 */
export interface VelocityBar {
  readonly noteId: string;
  readonly x: number;
  readonly width: number;
  readonly velocity: number;    // 0-127
  readonly selected: boolean;
}

/**
 * Velocity display configuration.
 */
export interface VelocityConfig {
  readonly height: number;
  readonly minVelocity: number;
  readonly maxVelocity: number;
  readonly showGrid: boolean;
  readonly gridLines: readonly number[];  // Velocity values to show grid lines
  readonly barColor: string;
  readonly selectedColor: string;
  readonly backgroundColor: string;
  readonly gridColor: string;
}

/**
 * Default velocity configuration.
 */
export const DEFAULT_VELOCITY_CONFIG: VelocityConfig = {
  height: 60,
  minVelocity: 0,
  maxVelocity: 127,
  showGrid: true,
  gridLines: [32, 64, 96, 127],
  barColor: '#3b82f6',
  selectedColor: '#60a5fa',
  backgroundColor: '#1a1a1a',
  gridColor: '#333333',
};

/**
 * Velocity to height.
 */
export function velocityToHeight(
  velocity: number,
  totalHeight: number,
  config: VelocityConfig = DEFAULT_VELOCITY_CONFIG
): number {
  const range = config.maxVelocity - config.minVelocity;
  return ((velocity - config.minVelocity) / range) * totalHeight;
}

/**
 * Height to velocity.
 */
export function heightToVelocity(
  height: number,
  totalHeight: number,
  config: VelocityConfig = DEFAULT_VELOCITY_CONFIG
): number {
  const range = config.maxVelocity - config.minVelocity;
  const velocity = config.minVelocity + (height / totalHeight) * range;
  return Math.round(Math.max(config.minVelocity, Math.min(config.maxVelocity, velocity)));
}

// ============================================================================
// XY PAD CONTROLLER
// ============================================================================

/**
 * XY pad configuration.
 */
export interface XYPadConfig {
  readonly width: number;
  readonly height: number;
  readonly xMin: number;
  readonly xMax: number;
  readonly yMin: number;
  readonly yMax: number;
  readonly xLabel: string;
  readonly yLabel: string;
  readonly showGrid: boolean;
  readonly showCrosshair: boolean;
  readonly showValue: boolean;
  readonly padColor: string;
  readonly cursorColor: string;
  readonly gridColor: string;
  readonly borderRadius: number;
}

/**
 * Default XY pad configuration.
 */
export const DEFAULT_XY_PAD_CONFIG: XYPadConfig = {
  width: 200,
  height: 200,
  xMin: 0,
  xMax: 127,
  yMin: 0,
  yMax: 127,
  xLabel: 'X',
  yLabel: 'Y',
  showGrid: true,
  showCrosshair: true,
  showValue: true,
  padColor: '#1a1a1a',
  cursorColor: '#3b82f6',
  gridColor: '#333333',
  borderRadius: 8,
};

/**
 * XY pad state.
 */
export interface XYPadState {
  readonly x: number;        // Current X value
  readonly y: number;        // Current Y value
  readonly dragging: boolean;
  readonly history: readonly { x: number; y: number; time: number }[];
}

/**
 * Create XY pad state.
 */
export function createXYPadState(
  initialX: number = 64,
  initialY: number = 64
): XYPadState {
  return {
    x: initialX,
    y: initialY,
    dragging: false,
    history: [],
  };
}

/**
 * Convert pixel position to XY values.
 */
export function pixelToXYValue(
  pixelX: number,
  pixelY: number,
  config: XYPadConfig
): { x: number; y: number } {
  const x = config.xMin + (pixelX / config.width) * (config.xMax - config.xMin);
  const y = config.yMax - (pixelY / config.height) * (config.yMax - config.yMin);
  
  return {
    x: Math.max(config.xMin, Math.min(config.xMax, Math.round(x))),
    y: Math.max(config.yMin, Math.min(config.yMax, Math.round(y))),
  };
}

/**
 * Convert XY values to pixel position.
 */
export function xyValueToPixel(
  x: number,
  y: number,
  config: XYPadConfig
): { pixelX: number; pixelY: number } {
  const pixelX = ((x - config.xMin) / (config.xMax - config.xMin)) * config.width;
  const pixelY = ((config.yMax - y) / (config.yMax - config.yMin)) * config.height;
  
  return { pixelX, pixelY };
}

// ============================================================================
// ENVELOPE EDITOR
// ============================================================================

/**
 * Envelope stage type.
 */
export type EnvelopeStageType = 'attack' | 'decay' | 'sustain' | 'release';

/**
 * Envelope point.
 */
export interface EnvelopePoint {
  readonly id: string;
  readonly time: number;     // 0-1 normalized or ms
  readonly value: number;    // 0-1 normalized
  readonly curve: number;    // -1 to 1 (negative = log, positive = exp)
  readonly stage: EnvelopeStageType;
}

/**
 * Envelope editor configuration.
 */
export interface EnvelopeEditorConfig {
  readonly width: number;
  readonly height: number;
  readonly showGrid: boolean;
  readonly showPoints: boolean;
  readonly showCurve: boolean;
  readonly showLabels: boolean;
  readonly attackColor: string;
  readonly decayColor: string;
  readonly sustainColor: string;
  readonly releaseColor: string;
  readonly pointColor: string;
  readonly pointRadius: number;
  readonly lineWidth: number;
  readonly backgroundColor: string;
  readonly gridColor: string;
}

/**
 * Default envelope editor configuration.
 */
export const DEFAULT_ENVELOPE_EDITOR_CONFIG: EnvelopeEditorConfig = {
  width: 300,
  height: 150,
  showGrid: true,
  showPoints: true,
  showCurve: true,
  showLabels: true,
  attackColor: '#22c55e',
  decayColor: '#eab308',
  sustainColor: '#3b82f6',
  releaseColor: '#ef4444',
  pointColor: '#ffffff',
  pointRadius: 6,
  lineWidth: 2,
  backgroundColor: '#1a1a1a',
  gridColor: '#333333',
};

/**
 * ADSR envelope parameters.
 */
export interface ADSREnvelope {
  readonly attack: number;    // ms
  readonly decay: number;     // ms
  readonly sustain: number;   // 0-1
  readonly release: number;   // ms
  readonly attackCurve: number;
  readonly decayCurve: number;
  readonly releaseCurve: number;
}

/**
 * Default ADSR envelope.
 */
export const DEFAULT_ADSR: ADSREnvelope = {
  attack: 10,
  decay: 100,
  sustain: 0.7,
  release: 200,
  attackCurve: 0,
  decayCurve: 0,
  releaseCurve: 0,
};

/**
 * Generate envelope points from ADSR.
 */
export function adsrToPoints(
  adsr: ADSREnvelope,
  totalTime: number = 1000
): readonly EnvelopePoint[] {
  const attackEnd = adsr.attack / totalTime;
  const decayEnd = (adsr.attack + adsr.decay) / totalTime;
  const sustainEnd = 0.7; // Fixed sustain portion
  const releaseEnd = 1;
  
  return [
    { id: 'start', time: 0, value: 0, curve: 0, stage: 'attack' },
    { id: 'attack', time: attackEnd, value: 1, curve: adsr.attackCurve, stage: 'attack' },
    { id: 'decay', time: decayEnd, value: adsr.sustain, curve: adsr.decayCurve, stage: 'decay' },
    { id: 'sustain', time: sustainEnd, value: adsr.sustain, curve: 0, stage: 'sustain' },
    { id: 'release', time: releaseEnd, value: 0, curve: adsr.releaseCurve, stage: 'release' },
  ];
}

/**
 * Calculate envelope value at time using curve interpolation.
 */
export function getEnvelopeValue(
  points: readonly EnvelopePoint[],
  time: number
): number {
  if (points.length === 0) return 0;
  if (time <= 0) return points[0]!.value;
  if (time >= points[points.length - 1]!.time) {
    return points[points.length - 1]!.value;
  }
  
  // Find surrounding points
  let p1 = points[0]!;
  let p2 = points[1] ?? p1;
  
  for (let i = 0; i < points.length - 1; i++) {
    if (points[i]!.time <= time && points[i + 1]!.time >= time) {
      p1 = points[i]!;
      p2 = points[i + 1]!;
      break;
    }
  }
  
  // Interpolate
  const t = (time - p1.time) / (p2.time - p1.time);
  
  // Apply curve
  let curvedT: number;
  if (p2.curve === 0) {
    curvedT = t; // Linear
  } else if (p2.curve > 0) {
    curvedT = Math.pow(t, 1 + p2.curve * 2); // Exponential
  } else {
    curvedT = 1 - Math.pow(1 - t, 1 - p2.curve * 2); // Logarithmic
  }
  
  return p1.value + (p2.value - p1.value) * curvedT;
}
