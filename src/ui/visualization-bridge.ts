/**
 * @fileoverview Visualization Bridge - Phase 4 → Phase 43 Integration.
 * 
 * This module bridges the Phase 4 visualization components (waveform, meters,
 * spectrum, piano keyboard, etc.) with the Phase 43 CardPlay UI system
 * (SyncVisualization, canvas components, reveal panel visualizations).
 * 
 * Key integrations:
 * - Phase 4 WaveformConfig → Phase 43 WaveformCanvas
 * - Phase 4 LevelMeter → Phase 43 MeterCanvas
 * - Phase 4 Spectrogram → Phase 43 SpectrumCanvas
 * - Phase 4 PianoKeyboard → Phase 43 MIDI visualization
 * - Sync visualization data structures
 * - Real-time update bridges
 * 
 * @see cardplayui.md Section 6: Sync Visualization
 * @see currentsteps.md Phase 4.4: Visualization Components
 * @see currentsteps.md Phase 43.5: Visualization Canvases
 */

import type {
  WaveformConfig,
  WaveformPeak,
} from './visualization';

// ============================================================================
// SYNC VISUALIZATION TYPES (from cardplayui.md Section 6)
// ============================================================================

/**
 * Time signature configuration.
 */
export interface TimeSignature {
  readonly numerator: number;
  readonly denominator: number;
}

/**
 * Transport state for sync visualization.
 * @see cardplayui.md Section 6.1
 */
export interface TransportState {
  readonly isPlaying: boolean;
  readonly position: number;        // seconds
  readonly tempo: number;           // BPM
  readonly timeSignature: TimeSignature;
  readonly beat: number;            // current beat (0-based)
  readonly bar: number;             // current bar
}

/**
 * Waveform state for sync visualization.
 */
export interface WaveformState {
  readonly samples: Float32Array;   // display buffer
  readonly position: number;        // playhead in samples
  readonly zoom: number;            // samples per pixel
}

/**
 * MIDI activity state for sync visualization.
 */
export interface MIDIActivityState {
  readonly activeNotes: Set<number>;
  readonly lastNoteOn: { note: number; velocity: number; time: number } | null;
  readonly lastCC: { cc: number; value: number; time: number } | null;
  readonly pitchBend: number;       // -1 to 1
  readonly modWheel: number;        // 0 to 1
  readonly activity: number;        // 0-1 recent activity level
}

/**
 * Audio levels state for sync visualization.
 */
export interface LevelsState {
  readonly peakL: number;           // 0-1
  readonly peakR: number;
  readonly rmsL: number;
  readonly rmsR: number;
  readonly clip: boolean;           // true if clipping
}

/**
 * Modulation state for sync visualization.
 */
export interface ModulationState {
  readonly lfo1: number;            // -1 to 1
  readonly lfo2: number;
  readonly env1: number;            // 0 to 1 (amp envelope)
  readonly env2: number;            // filter envelope
  readonly macro1: number;          // 0 to 1
  readonly macro2: number;
  readonly macro3: number;
  readonly macro4: number;
}

/**
 * Voice state for sync visualization.
 */
export interface VoiceState {
  readonly active: number;
  readonly max: number;
  readonly stealing: boolean;
}

/**
 * Performance metrics state.
 */
export interface PerformanceState {
  readonly cpuPercent: number;
  readonly memoryMB: number;
  readonly latencyMs: number;
  readonly bufferUnderruns: number;
}

/**
 * Complete sync visualization state.
 * @see cardplayui.md Section 6.1
 */
export interface SyncVisualization {
  readonly transport: TransportState;
  readonly waveform: WaveformState;
  readonly midi: MIDIActivityState;
  readonly levels: LevelsState;
  readonly modulation: ModulationState;
  readonly voices: VoiceState;
  readonly performance: PerformanceState;
}

/**
 * Create initial sync visualization state.
 */
export function createSyncVisualization(): SyncVisualization {
  return {
    transport: {
      isPlaying: false,
      position: 0,
      tempo: 120,
      timeSignature: { numerator: 4, denominator: 4 },
      beat: 0,
      bar: 0,
    },
    waveform: {
      samples: new Float32Array(1024),
      position: 0,
      zoom: 1,
    },
    midi: {
      activeNotes: new Set(),
      lastNoteOn: null,
      lastCC: null,
      pitchBend: 0,
      modWheel: 0,
      activity: 0,
    },
    levels: {
      peakL: 0,
      peakR: 0,
      rmsL: 0,
      rmsR: 0,
      clip: false,
    },
    modulation: {
      lfo1: 0,
      lfo2: 0,
      env1: 0,
      env2: 0,
      macro1: 0.5,
      macro2: 0.5,
      macro3: 0.5,
      macro4: 0.5,
    },
    voices: {
      active: 0,
      max: 16,
      stealing: false,
    },
    performance: {
      cpuPercent: 0,
      memoryMB: 0,
      latencyMs: 0,
      bufferUnderruns: 0,
    },
  };
}

// ============================================================================
// VISUALIZATION THEME BRIDGE
// ============================================================================

/**
 * Visualization color scheme following cardplayui.md theming.
 */
export interface VisualizationColors {
  // Waveform
  readonly waveformForeground: string;
  readonly waveformBackground: string;
  readonly waveformRMS: string;
  readonly waveformCenterLine: string;
  readonly waveformPlayhead: string;
  readonly waveformSelection: string;
  readonly waveformClip: string;
  
  // Meters
  readonly meterBackground: string;
  readonly meterGreen: string;
  readonly meterYellow: string;
  readonly meterRed: string;
  readonly meterPeak: string;
  readonly meterClip: string;
  
  // Spectrum
  readonly spectrumForeground: string;
  readonly spectrumBackground: string;
  readonly spectrumPeakHold: string;
  readonly spectrumGrid: string;
  
  // Piano roll / MIDI
  readonly pianoWhiteKey: string;
  readonly pianoBlackKey: string;
  readonly pianoActiveKey: string;
  readonly pianoKeyBorder: string;
  readonly noteActive: string;
  readonly noteInactive: string;
  readonly velocityBar: string;
  readonly pitchBendLine: string;
  
  // Oscilloscope
  readonly scopeForeground: string;
  readonly scopeBackground: string;
  readonly scopeGrid: string;
  readonly scopeTrigger: string;
  
  // Beat indicators
  readonly beatActive: string;
  readonly beatInactive: string;
  readonly beatDownbeat: string;
  readonly barLine: string;
}

/**
 * Dark theme visualization colors (default).
 */
export const DARK_VIZ_COLORS: VisualizationColors = {
  // Waveform
  waveformForeground: '#3b82f6',
  waveformBackground: '#1a1a2e',
  waveformRMS: '#60a5fa',
  waveformCenterLine: '#333355',
  waveformPlayhead: '#ffffff',
  waveformSelection: 'rgba(59, 130, 246, 0.3)',
  waveformClip: '#ef4444',
  
  // Meters
  meterBackground: '#1a1a2e',
  meterGreen: '#22c55e',
  meterYellow: '#f59e0b',
  meterRed: '#ef4444',
  meterPeak: '#ffffff',
  meterClip: '#ef4444',
  
  // Spectrum
  spectrumForeground: '#8b5cf6',
  spectrumBackground: '#1a1a2e',
  spectrumPeakHold: '#a78bfa',
  spectrumGrid: '#333355',
  
  // Piano roll / MIDI
  pianoWhiteKey: '#e5e5e5',
  pianoBlackKey: '#2a2a3e',
  pianoActiveKey: '#3b82f6',
  pianoKeyBorder: '#555577',
  noteActive: '#22c55e',
  noteInactive: '#4a5568',
  velocityBar: '#f59e0b',
  pitchBendLine: '#ec4899',
  
  // Oscilloscope
  scopeForeground: '#22c55e',
  scopeBackground: '#1a1a2e',
  scopeGrid: '#333355',
  scopeTrigger: '#f59e0b',
  
  // Beat indicators
  beatActive: '#f59e0b',
  beatInactive: '#4a5568',
  beatDownbeat: '#22c55e',
  barLine: '#6b7280',
};

/**
 * Light theme visualization colors.
 */
export const LIGHT_VIZ_COLORS: VisualizationColors = {
  // Waveform
  waveformForeground: '#2563eb',
  waveformBackground: '#f8fafc',
  waveformRMS: '#3b82f6',
  waveformCenterLine: '#cbd5e1',
  waveformPlayhead: '#1e293b',
  waveformSelection: 'rgba(37, 99, 235, 0.2)',
  waveformClip: '#dc2626',
  
  // Meters
  meterBackground: '#f1f5f9',
  meterGreen: '#16a34a',
  meterYellow: '#d97706',
  meterRed: '#dc2626',
  meterPeak: '#1e293b',
  meterClip: '#dc2626',
  
  // Spectrum
  spectrumForeground: '#7c3aed',
  spectrumBackground: '#f8fafc',
  spectrumPeakHold: '#8b5cf6',
  spectrumGrid: '#e2e8f0',
  
  // Piano roll / MIDI
  pianoWhiteKey: '#ffffff',
  pianoBlackKey: '#334155',
  pianoActiveKey: '#2563eb',
  pianoKeyBorder: '#94a3b8',
  noteActive: '#16a34a',
  noteInactive: '#94a3b8',
  velocityBar: '#d97706',
  pitchBendLine: '#db2777',
  
  // Oscilloscope
  scopeForeground: '#16a34a',
  scopeBackground: '#f8fafc',
  scopeGrid: '#e2e8f0',
  scopeTrigger: '#d97706',
  
  // Beat indicators
  beatActive: '#d97706',
  beatInactive: '#94a3b8',
  beatDownbeat: '#16a34a',
  barLine: '#64748b',
};

/**
 * High contrast visualization colors for accessibility.
 */
export const HIGH_CONTRAST_VIZ_COLORS: VisualizationColors = {
  // Waveform
  waveformForeground: '#ffff00',
  waveformBackground: '#000000',
  waveformRMS: '#00ffff',
  waveformCenterLine: '#ffffff',
  waveformPlayhead: '#ffffff',
  waveformSelection: 'rgba(255, 255, 0, 0.4)',
  waveformClip: '#ff0000',
  
  // Meters
  meterBackground: '#000000',
  meterGreen: '#00ff00',
  meterYellow: '#ffff00',
  meterRed: '#ff0000',
  meterPeak: '#ffffff',
  meterClip: '#ff0000',
  
  // Spectrum
  spectrumForeground: '#ff00ff',
  spectrumBackground: '#000000',
  spectrumPeakHold: '#ffffff',
  spectrumGrid: '#ffffff',
  
  // Piano roll / MIDI
  pianoWhiteKey: '#ffffff',
  pianoBlackKey: '#000000',
  pianoActiveKey: '#00ffff',
  pianoKeyBorder: '#ffffff',
  noteActive: '#00ff00',
  noteInactive: '#808080',
  velocityBar: '#ffff00',
  pitchBendLine: '#ff00ff',
  
  // Oscilloscope
  scopeForeground: '#00ff00',
  scopeBackground: '#000000',
  scopeGrid: '#ffffff',
  scopeTrigger: '#ffff00',
  
  // Beat indicators
  beatActive: '#ffff00',
  beatInactive: '#808080',
  beatDownbeat: '#00ff00',
  barLine: '#ffffff',
};

/**
 * Renoise-style visualization colors.
 */
export const RENOISE_VIZ_COLORS: VisualizationColors = {
  // Waveform
  waveformForeground: '#88cc44',
  waveformBackground: '#222222',
  waveformRMS: '#99dd55',
  waveformCenterLine: '#444444',
  waveformPlayhead: '#ffffff',
  waveformSelection: 'rgba(136, 204, 68, 0.3)',
  waveformClip: '#ff4444',
  
  // Meters
  meterBackground: '#222222',
  meterGreen: '#88cc44',
  meterYellow: '#ccaa44',
  meterRed: '#cc4444',
  meterPeak: '#ffffff',
  meterClip: '#ff4444',
  
  // Spectrum
  spectrumForeground: '#4488cc',
  spectrumBackground: '#222222',
  spectrumPeakHold: '#66aadd',
  spectrumGrid: '#444444',
  
  // Piano roll / MIDI (tracker-style with hex display)
  pianoWhiteKey: '#888888',
  pianoBlackKey: '#333333',
  pianoActiveKey: '#88cc44',
  pianoKeyBorder: '#555555',
  noteActive: '#88cc44',
  noteInactive: '#555555',
  velocityBar: '#ccaa44',
  pitchBendLine: '#cc88cc',
  
  // Oscilloscope
  scopeForeground: '#88cc44',
  scopeBackground: '#222222',
  scopeGrid: '#444444',
  scopeTrigger: '#ccaa44',
  
  // Beat indicators
  beatActive: '#88cc44',
  beatInactive: '#555555',
  beatDownbeat: '#ccaa44',
  barLine: '#666666',
};

/**
 * Ableton-style visualization colors.
 */
export const ABLETON_VIZ_COLORS: VisualizationColors = {
  // Waveform
  waveformForeground: '#aec8e0',
  waveformBackground: '#1e1e1e',
  waveformRMS: '#c8dae8',
  waveformCenterLine: '#383838',
  waveformPlayhead: '#ffffff',
  waveformSelection: 'rgba(174, 200, 224, 0.3)',
  waveformClip: '#ff5f56',
  
  // Meters
  meterBackground: '#1e1e1e',
  meterGreen: '#7ec850',
  meterYellow: '#f0ad4e',
  meterRed: '#ff5f56',
  meterPeak: '#ffffff',
  meterClip: '#ff5f56',
  
  // Spectrum
  spectrumForeground: '#ff764d',
  spectrumBackground: '#1e1e1e',
  spectrumPeakHold: '#ff9770',
  spectrumGrid: '#383838',
  
  // Piano roll / MIDI (clip-style)
  pianoWhiteKey: '#d4d4d4',
  pianoBlackKey: '#444444',
  pianoActiveKey: '#ff764d',
  pianoKeyBorder: '#5a5a5a',
  noteActive: '#96d35f',
  noteInactive: '#5a5a5a',
  velocityBar: '#f0ad4e',
  pitchBendLine: '#e066ff',
  
  // Oscilloscope
  scopeForeground: '#96d35f',
  scopeBackground: '#1e1e1e',
  scopeGrid: '#383838',
  scopeTrigger: '#f0ad4e',
  
  // Beat indicators
  beatActive: '#ff764d',
  beatInactive: '#5a5a5a',
  beatDownbeat: '#96d35f',
  barLine: '#6a6a6a',
};

/**
 * All visualization color themes.
 */
export const VIZ_COLOR_THEMES = {
  dark: DARK_VIZ_COLORS,
  light: LIGHT_VIZ_COLORS,
  'high-contrast': HIGH_CONTRAST_VIZ_COLORS,
  renoise: RENOISE_VIZ_COLORS,
  ableton: ABLETON_VIZ_COLORS,
} as const;

export type VizThemeName = keyof typeof VIZ_COLOR_THEMES;

// ============================================================================
// WAVEFORM BRIDGE (Phase 4 → Phase 43)
// ============================================================================

/**
 * Extended waveform config bridging Phase 4 WaveformConfig to Phase 43 needs.
 */
export interface BridgedWaveformConfig extends WaveformConfig {
  // Phase 43 additions
  readonly playheadColor: string;
  readonly selectionColor: string;
  readonly showPlayhead: boolean;
  readonly showSelection: boolean;
  readonly selectionStart: number;
  readonly selectionEnd: number;
  readonly playheadPosition: number;
  readonly autoScroll: boolean;
  readonly scrollOffset: number;
  readonly samplesPerPixel: number;
  readonly sampleRate: number;
}

/**
 * Create bridged waveform config from Phase 4 config.
 */
export function createBridgedWaveformConfig(
  phase4Config: Partial<WaveformConfig> = {},
  vizColors: VisualizationColors = DARK_VIZ_COLORS
): BridgedWaveformConfig {
  return {
    // Phase 4 defaults
    renderMode: phase4Config.renderMode ?? 'filled',
    channelMode: phase4Config.channelMode ?? 'mono',
    color: phase4Config.color ?? vizColors.waveformForeground,
    backgroundColor: phase4Config.backgroundColor ?? vizColors.waveformBackground,
    lineWidth: phase4Config.lineWidth ?? 1,
    showRMS: phase4Config.showRMS ?? true,
    rmsColor: phase4Config.rmsColor ?? vizColors.waveformRMS,
    showCenterLine: phase4Config.showCenterLine ?? true,
    centerLineColor: phase4Config.centerLineColor ?? vizColors.waveformCenterLine,
    antiAlias: phase4Config.antiAlias ?? true,
    pixelRatio: phase4Config.pixelRatio ?? 2,
    normalize: phase4Config.normalize ?? false,
    logScale: phase4Config.logScale ?? false,
    clipIndicator: phase4Config.clipIndicator ?? true,
    clipColor: phase4Config.clipColor ?? vizColors.waveformClip,
    
    // Phase 43 additions
    playheadColor: vizColors.waveformPlayhead,
    selectionColor: vizColors.waveformSelection,
    showPlayhead: true,
    showSelection: false,
    selectionStart: 0,
    selectionEnd: 0,
    playheadPosition: 0,
    autoScroll: true,
    scrollOffset: 0,
    samplesPerPixel: 256,
    sampleRate: 44100,
  };
}

/**
 * Waveform display state for Phase 43 integration.
 */
export interface WaveformDisplayState {
  readonly config: BridgedWaveformConfig;
  readonly peaks: readonly WaveformPeak[];
  readonly width: number;
  readonly height: number;
  readonly isDragging: boolean;
  readonly dragStart: number | null;
  readonly hoverPosition: number | null;
}

/**
 * Create initial waveform display state.
 */
export function createWaveformDisplayState(
  width: number = 800,
  height: number = 120,
  colors: VisualizationColors = DARK_VIZ_COLORS
): WaveformDisplayState {
  return {
    config: createBridgedWaveformConfig({}, colors),
    peaks: [],
    width,
    height,
    isDragging: false,
    dragStart: null,
    hoverPosition: null,
  };
}

// ============================================================================
// METER BRIDGE (Phase 4 → Phase 43)
// ============================================================================

/**
 * Meter type enumeration.
 */
export type MeterType = 
  | 'peak'      // Peak meter with decay
  | 'rms'       // RMS meter
  | 'vu'        // VU-style meter
  | 'lufs'      // Loudness meter
  | 'combined'; // Peak + RMS overlay

/**
 * Meter orientation.
 */
export type MeterOrientation = 'horizontal' | 'vertical';

/**
 * Meter configuration bridging Phase 4 to Phase 43.
 */
export interface BridgedMeterConfig {
  readonly type: MeterType;
  readonly orientation: MeterOrientation;
  readonly stereo: boolean;
  readonly width: number;
  readonly height: number;
  readonly peakHoldTime: number;     // ms
  readonly peakDecayRate: number;    // dB/sec
  readonly rmsWindowSize: number;    // ms
  readonly minDb: number;
  readonly maxDb: number;
  readonly clipThreshold: number;    // dB
  readonly colors: {
    readonly background: string;
    readonly green: string;
    readonly yellow: string;
    readonly red: string;
    readonly peak: string;
    readonly clip: string;
  };
  readonly showScale: boolean;
  readonly scaleMarks: readonly number[];  // dB values
  readonly showLabels: boolean;
  readonly showClipIndicator: boolean;
}

/**
 * Default meter configuration.
 */
export const DEFAULT_METER_CONFIG: BridgedMeterConfig = {
  type: 'combined',
  orientation: 'vertical',
  stereo: true,
  width: 40,
  height: 200,
  peakHoldTime: 2000,
  peakDecayRate: 20,
  rmsWindowSize: 300,
  minDb: -60,
  maxDb: 6,
  clipThreshold: 0,
  colors: {
    background: DARK_VIZ_COLORS.meterBackground,
    green: DARK_VIZ_COLORS.meterGreen,
    yellow: DARK_VIZ_COLORS.meterYellow,
    red: DARK_VIZ_COLORS.meterRed,
    peak: DARK_VIZ_COLORS.meterPeak,
    clip: DARK_VIZ_COLORS.meterClip,
  },
  showScale: true,
  scaleMarks: [0, -6, -12, -18, -24, -36, -48, -60],
  showLabels: true,
  showClipIndicator: true,
};

/**
 * Create meter config with custom colors.
 */
export function createMeterConfig(
  options: Partial<BridgedMeterConfig> = {},
  vizColors: VisualizationColors = DARK_VIZ_COLORS
): BridgedMeterConfig {
  return {
    ...DEFAULT_METER_CONFIG,
    ...options,
    colors: {
      background: vizColors.meterBackground,
      green: vizColors.meterGreen,
      yellow: vizColors.meterYellow,
      red: vizColors.meterRed,
      peak: vizColors.meterPeak,
      clip: vizColors.meterClip,
      ...options.colors,
    },
  };
}

/**
 * Meter state for real-time updates.
 */
export interface MeterState {
  readonly peakL: number;
  readonly peakR: number;
  readonly rmsL: number;
  readonly rmsR: number;
  readonly peakHoldL: number;
  readonly peakHoldR: number;
  readonly clipL: boolean;
  readonly clipR: boolean;
  readonly peakHoldTimeL: number;  // timestamp
  readonly peakHoldTimeR: number;
}

/**
 * Create initial meter state.
 */
export function createMeterState(): MeterState {
  return {
    peakL: 0,
    peakR: 0,
    rmsL: 0,
    rmsR: 0,
    peakHoldL: 0,
    peakHoldR: 0,
    clipL: false,
    clipR: false,
    peakHoldTimeL: 0,
    peakHoldTimeR: 0,
  };
}

/**
 * Update meter state with new level values.
 */
export function updateMeterState(
  state: MeterState,
  levels: LevelsState,
  config: BridgedMeterConfig,
  timestamp: number
): MeterState {
  let newState = { ...state };
  
  // Update peak values
  newState.peakL = levels.peakL;
  newState.peakR = levels.peakR;
  newState.rmsL = levels.rmsL;
  newState.rmsR = levels.rmsR;
  
  // Update peak hold (left)
  if (levels.peakL >= state.peakHoldL) {
    newState.peakHoldL = levels.peakL;
    newState.peakHoldTimeL = timestamp;
  } else if (timestamp - state.peakHoldTimeL > config.peakHoldTime) {
    // Decay peak hold
    const decayAmount = config.peakDecayRate * ((timestamp - state.peakHoldTimeL - config.peakHoldTime) / 1000);
    newState.peakHoldL = Math.max(0, state.peakHoldL - decayAmount / 60); // Convert dB to linear approx
  }
  
  // Update peak hold (right)
  if (levels.peakR >= state.peakHoldR) {
    newState.peakHoldR = levels.peakR;
    newState.peakHoldTimeR = timestamp;
  } else if (timestamp - state.peakHoldTimeR > config.peakHoldTime) {
    const decayAmount = config.peakDecayRate * ((timestamp - state.peakHoldTimeR - config.peakHoldTime) / 1000);
    newState.peakHoldR = Math.max(0, state.peakHoldR - decayAmount / 60);
  }
  
  // Update clip indicators
  newState.clipL = levels.peakL >= 1.0 || levels.clip;
  newState.clipR = levels.peakR >= 1.0 || levels.clip;
  
  return newState;
}

// ============================================================================
// SPECTRUM BRIDGE (Phase 4 → Phase 43)
// ============================================================================

/**
 * Spectrum analyzer configuration.
 */
export interface BridgedSpectrumConfig {
  readonly fftSize: number;           // 256, 512, 1024, 2048, 4096, 8192
  readonly smoothing: number;         // 0-1
  readonly minDb: number;
  readonly maxDb: number;
  readonly minFreq: number;           // Hz
  readonly maxFreq: number;           // Hz
  readonly logScale: boolean;         // Log frequency scale
  readonly showPeakHold: boolean;
  readonly peakHoldTime: number;      // ms
  readonly fillStyle: 'bars' | 'line' | 'filled' | 'gradient';
  readonly colors: {
    readonly foreground: string;
    readonly background: string;
    readonly peakHold: string;
    readonly grid: string;
  };
  readonly showGrid: boolean;
  readonly showLabels: boolean;
  readonly freqLabels: readonly number[];  // Hz values to label
}

/**
 * Default spectrum configuration.
 */
export const DEFAULT_SPECTRUM_CONFIG: BridgedSpectrumConfig = {
  fftSize: 2048,
  smoothing: 0.8,
  minDb: -90,
  maxDb: 0,
  minFreq: 20,
  maxFreq: 20000,
  logScale: true,
  showPeakHold: true,
  peakHoldTime: 2000,
  fillStyle: 'filled',
  colors: {
    foreground: DARK_VIZ_COLORS.spectrumForeground,
    background: DARK_VIZ_COLORS.spectrumBackground,
    peakHold: DARK_VIZ_COLORS.spectrumPeakHold,
    grid: DARK_VIZ_COLORS.spectrumGrid,
  },
  showGrid: true,
  showLabels: true,
  freqLabels: [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000],
};

/**
 * Create spectrum config with custom colors.
 */
export function createSpectrumConfig(
  options: Partial<BridgedSpectrumConfig> = {},
  vizColors: VisualizationColors = DARK_VIZ_COLORS
): BridgedSpectrumConfig {
  return {
    ...DEFAULT_SPECTRUM_CONFIG,
    ...options,
    colors: {
      foreground: vizColors.spectrumForeground,
      background: vizColors.spectrumBackground,
      peakHold: vizColors.spectrumPeakHold,
      grid: vizColors.spectrumGrid,
      ...options.colors,
    },
  };
}

// ============================================================================
// MIDI VISUALIZATION BRIDGE (Phase 4 → Phase 43)
// ============================================================================

/**
 * Piano keyboard configuration.
 */
export interface PianoKeyboardConfig {
  readonly startNote: number;         // MIDI note (0-127)
  readonly endNote: number;
  readonly whiteKeyWidth: number;
  readonly blackKeyWidthRatio: number; // Relative to white key
  readonly blackKeyHeightRatio: number;
  readonly orientation: 'horizontal' | 'vertical';
  readonly showLabels: boolean;
  readonly labelOctavesOnly: boolean;
  readonly colors: {
    readonly whiteKey: string;
    readonly blackKey: string;
    readonly activeKey: string;
    readonly keyBorder: string;
    readonly label: string;
  };
  readonly interactive: boolean;
  readonly velocitySensitive: boolean;
}

/**
 * Default piano keyboard configuration.
 */
export const DEFAULT_PIANO_CONFIG: PianoKeyboardConfig = {
  startNote: 36,  // C2
  endNote: 96,    // C7
  whiteKeyWidth: 24,
  blackKeyWidthRatio: 0.6,
  blackKeyHeightRatio: 0.6,
  orientation: 'horizontal',
  showLabels: true,
  labelOctavesOnly: true,
  colors: {
    whiteKey: DARK_VIZ_COLORS.pianoWhiteKey,
    blackKey: DARK_VIZ_COLORS.pianoBlackKey,
    activeKey: DARK_VIZ_COLORS.pianoActiveKey,
    keyBorder: DARK_VIZ_COLORS.pianoKeyBorder,
    label: '#888888',
  },
  interactive: true,
  velocitySensitive: true,
};

/**
 * Note display configuration for piano roll view.
 */
export interface NoteDisplayConfig {
  readonly noteHeight: number;
  readonly minNoteWidth: number;
  readonly showVelocity: boolean;
  readonly showNoteName: boolean;
  readonly trailLength: number;       // Number of past notes to show
  readonly colors: {
    readonly active: string;
    readonly inactive: string;
    readonly velocity: string;
  };
}

/**
 * Default note display configuration.
 */
export const DEFAULT_NOTE_DISPLAY_CONFIG: NoteDisplayConfig = {
  noteHeight: 8,
  minNoteWidth: 4,
  showVelocity: true,
  showNoteName: false,
  trailLength: 100,
  colors: {
    active: DARK_VIZ_COLORS.noteActive,
    inactive: DARK_VIZ_COLORS.noteInactive,
    velocity: DARK_VIZ_COLORS.velocityBar,
  },
};

/**
 * Note event for visualization.
 */
export interface NoteEvent {
  readonly note: number;
  readonly velocity: number;
  readonly startTime: number;
  readonly endTime: number | null;    // null = still playing
  readonly channel: number;
}

/**
 * MIDI visualization state.
 */
export interface MIDIVisualizationState {
  readonly activeNotes: Map<number, NoteEvent>;  // note -> event
  readonly noteHistory: readonly NoteEvent[];
  readonly lastCC: Map<number, number>;          // cc -> value
  readonly pitchBend: number;
  readonly modWheel: number;
  readonly aftertouch: number;
  readonly activity: number;
}

/**
 * Create initial MIDI visualization state.
 */
export function createMIDIVisualizationState(): MIDIVisualizationState {
  return {
    activeNotes: new Map(),
    noteHistory: [],
    lastCC: new Map(),
    pitchBend: 0,
    modWheel: 0,
    aftertouch: 0,
    activity: 0,
  };
}

// ============================================================================
// BEAT INDICATOR BRIDGE
// ============================================================================

/**
 * Beat indicator configuration.
 */
export interface BeatIndicatorConfig {
  readonly numBeats: number;
  readonly beatSize: number;
  readonly spacing: number;
  readonly orientation: 'horizontal' | 'vertical';
  readonly highlightDownbeat: boolean;
  readonly showSubdivisions: boolean;
  readonly subdivisions: number;
  readonly colors: {
    readonly active: string;
    readonly inactive: string;
    readonly downbeat: string;
    readonly subdivision: string;
  };
  readonly animationDuration: number;  // ms
}

/**
 * Default beat indicator configuration.
 */
export const DEFAULT_BEAT_CONFIG: BeatIndicatorConfig = {
  numBeats: 4,
  beatSize: 12,
  spacing: 8,
  orientation: 'horizontal',
  highlightDownbeat: true,
  showSubdivisions: false,
  subdivisions: 4,
  colors: {
    active: DARK_VIZ_COLORS.beatActive,
    inactive: DARK_VIZ_COLORS.beatInactive,
    downbeat: DARK_VIZ_COLORS.beatDownbeat,
    subdivision: '#3a3a4e',
  },
  animationDuration: 100,
};

// ============================================================================
// OSCILLOSCOPE BRIDGE
// ============================================================================

/**
 * Oscilloscope configuration.
 */
export interface OscilloscopeConfig {
  readonly bufferSize: number;
  readonly triggerLevel: number;      // -1 to 1
  readonly triggerMode: 'auto' | 'normal' | 'single';
  readonly triggerEdge: 'rising' | 'falling';
  readonly timebase: number;          // samples per division
  readonly amplitude: number;         // volts per division
  readonly mode: 'time' | 'xy';       // XY = Lissajous
  readonly showGrid: boolean;
  readonly gridDivisions: number;
  readonly colors: {
    readonly foreground: string;
    readonly background: string;
    readonly grid: string;
    readonly trigger: string;
  };
  readonly lineWidth: number;
  readonly antiAlias: boolean;
}

/**
 * Default oscilloscope configuration.
 */
export const DEFAULT_SCOPE_CONFIG: OscilloscopeConfig = {
  bufferSize: 2048,
  triggerLevel: 0,
  triggerMode: 'auto',
  triggerEdge: 'rising',
  timebase: 256,
  amplitude: 1,
  mode: 'time',
  showGrid: true,
  gridDivisions: 8,
  colors: {
    foreground: DARK_VIZ_COLORS.scopeForeground,
    background: DARK_VIZ_COLORS.scopeBackground,
    grid: DARK_VIZ_COLORS.scopeGrid,
    trigger: DARK_VIZ_COLORS.scopeTrigger,
  },
  lineWidth: 2,
  antiAlias: true,
};

// ============================================================================
// RENDER HELPER FUNCTIONS (cardplayui.md implementations)
// ============================================================================

/**
 * Render level meter to canvas context.
 * Direct implementation from cardplayui.md Section 6.3.
 */
export function renderMeter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  peak: number,
  rms: number,
  clip: boolean,
  config: BridgedMeterConfig = DEFAULT_METER_CONFIG
): void {
  const { colors } = config;
  
  // Background
  ctx.fillStyle = colors.background;
  ctx.fillRect(x, y, width, height);
  
  // RMS (green/yellow/red gradient)
  const rmsHeight = rms * height;
  const gradient = ctx.createLinearGradient(x, y + height, x, y);
  gradient.addColorStop(0, colors.green);
  gradient.addColorStop(0.6, colors.green);
  gradient.addColorStop(0.8, colors.yellow);
  gradient.addColorStop(1, colors.red);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y + height - rmsHeight, width, rmsHeight);
  
  // Peak indicator (thin line)
  const peakY = y + height - (peak * height);
  ctx.fillStyle = clip ? colors.clip : colors.peak;
  ctx.fillRect(x, peakY, width, 2);
  
  // Clip indicator
  if (clip && config.showClipIndicator) {
    ctx.fillStyle = colors.clip;
    ctx.fillRect(x, y, width, 4);
  }
}

/**
 * Render beat indicator.
 * Implementation based on cardplayui.md Section 6.5.
 */
export function renderBeatIndicator(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  beat: number,
  config: BeatIndicatorConfig = DEFAULT_BEAT_CONFIG
): void {
  const { numBeats, beatSize, spacing, colors, highlightDownbeat } = config;
  const currentBeat = Math.floor(beat) % numBeats;
  
  for (let i = 0; i < numBeats; i++) {
    const bx = x + i * (beatSize + spacing);
    const isActive = i === currentBeat;
    const isDownbeat = i === 0 && highlightDownbeat;
    
    // Determine color
    let color: string;
    if (isActive) {
      color = isDownbeat ? colors.downbeat : colors.active;
    } else {
      color = colors.inactive;
    }
    
    // Draw beat indicator
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(bx + beatSize / 2, y + beatSize / 2, beatSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Add glow effect for active beat
    if (isActive) {
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();
    }
  }
}

/**
 * Render waveform to canvas.
 */
export function renderWaveform(
  ctx: CanvasRenderingContext2D,
  peaks: readonly WaveformPeak[],
  config: BridgedWaveformConfig,
  width: number,
  height: number
): void {
  const { backgroundColor, color, rmsColor, showRMS, showCenterLine, centerLineColor } = config;
  
  // Background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);
  
  // Center line
  if (showCenterLine) {
    ctx.strokeStyle = centerLineColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  }
  
  const centerY = height / 2;
  const scale = height / 2;
  
  // Draw RMS if enabled
  if (showRMS && peaks.length > 0) {
    ctx.fillStyle = rmsColor;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    
    for (let i = 0; i < peaks.length; i++) {
      const peak = peaks[i]!;
      const rmsHeight = peak.rms * scale;
      ctx.lineTo(i, centerY - rmsHeight);
    }
    
    for (let i = peaks.length - 1; i >= 0; i--) {
      const peak = peaks[i]!;
      const rmsHeight = peak.rms * scale;
      ctx.lineTo(i, centerY + rmsHeight);
    }
    
    ctx.closePath();
    ctx.fill();
  }
  
  // Draw peaks
  if (peaks.length > 0) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    
    // Top half (max values)
    for (let i = 0; i < peaks.length; i++) {
      const peak = peaks[i]!;
      ctx.lineTo(i, centerY - peak.max * scale);
    }
    
    // Bottom half (min values)
    for (let i = peaks.length - 1; i >= 0; i--) {
      const peak = peaks[i]!;
      ctx.lineTo(i, centerY - peak.min * scale);
    }
    
    ctx.closePath();
    ctx.fill();
  }
  
  // Playhead
  if (config.showPlayhead && config.playheadPosition >= 0) {
    const playheadX = (config.playheadPosition - config.scrollOffset) / config.samplesPerPixel;
    if (playheadX >= 0 && playheadX <= width) {
      ctx.strokeStyle = config.playheadColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
    }
  }
  
  // Selection
  if (config.showSelection && config.selectionStart !== config.selectionEnd) {
    const startX = (config.selectionStart - config.scrollOffset) / config.samplesPerPixel;
    const endX = (config.selectionEnd - config.scrollOffset) / config.samplesPerPixel;
    ctx.fillStyle = config.selectionColor;
    ctx.fillRect(startX, 0, endX - startX, height);
  }
}

/**
 * Render velocity bars for MIDI notes.
 */
export function renderVelocityBars(
  ctx: CanvasRenderingContext2D,
  notes: readonly NoteEvent[],
  x: number,
  y: number,
  width: number,
  height: number,
  colors: VisualizationColors = DARK_VIZ_COLORS
): void {
  if (notes.length === 0) return;
  
  const barWidth = Math.max(2, width / notes.length - 1);
  
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i]!;
    const barHeight = (note.velocity / 127) * height;
    const bx = x + i * (barWidth + 1);
    const by = y + height - barHeight;
    
    // Velocity gradient
    const gradient = ctx.createLinearGradient(bx, by + barHeight, bx, by);
    gradient.addColorStop(0, colors.velocityBar);
    gradient.addColorStop(1, colors.noteActive);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(bx, by, barWidth, barHeight);
  }
}

// ============================================================================
// CSS GENERATION FOR VISUALIZATION COMPONENTS
// ============================================================================

/**
 * Generate CSS custom properties for visualization theming.
 */
export function generateVisualizationCSS(colors: VisualizationColors): string {
  return `
/* Visualization Theme CSS Custom Properties */
:root {
  /* Waveform */
  --viz-waveform-fg: ${colors.waveformForeground};
  --viz-waveform-bg: ${colors.waveformBackground};
  --viz-waveform-rms: ${colors.waveformRMS};
  --viz-waveform-center: ${colors.waveformCenterLine};
  --viz-waveform-playhead: ${colors.waveformPlayhead};
  --viz-waveform-selection: ${colors.waveformSelection};
  --viz-waveform-clip: ${colors.waveformClip};
  
  /* Meters */
  --viz-meter-bg: ${colors.meterBackground};
  --viz-meter-green: ${colors.meterGreen};
  --viz-meter-yellow: ${colors.meterYellow};
  --viz-meter-red: ${colors.meterRed};
  --viz-meter-peak: ${colors.meterPeak};
  --viz-meter-clip: ${colors.meterClip};
  
  /* Spectrum */
  --viz-spectrum-fg: ${colors.spectrumForeground};
  --viz-spectrum-bg: ${colors.spectrumBackground};
  --viz-spectrum-peak: ${colors.spectrumPeakHold};
  --viz-spectrum-grid: ${colors.spectrumGrid};
  
  /* Piano / MIDI */
  --viz-piano-white: ${colors.pianoWhiteKey};
  --viz-piano-black: ${colors.pianoBlackKey};
  --viz-piano-active: ${colors.pianoActiveKey};
  --viz-piano-border: ${colors.pianoKeyBorder};
  --viz-note-active: ${colors.noteActive};
  --viz-note-inactive: ${colors.noteInactive};
  --viz-velocity: ${colors.velocityBar};
  --viz-pitch-bend: ${colors.pitchBendLine};
  
  /* Oscilloscope */
  --viz-scope-fg: ${colors.scopeForeground};
  --viz-scope-bg: ${colors.scopeBackground};
  --viz-scope-grid: ${colors.scopeGrid};
  --viz-scope-trigger: ${colors.scopeTrigger};
  
  /* Beat indicators */
  --viz-beat-active: ${colors.beatActive};
  --viz-beat-inactive: ${colors.beatInactive};
  --viz-beat-downbeat: ${colors.beatDownbeat};
  --viz-bar-line: ${colors.barLine};
}

/* Visualization canvas base styles */
.viz-canvas {
  image-rendering: crisp-edges;
  touch-action: none;
}

.viz-waveform {
  border-radius: var(--radius-sm, 4px);
  overflow: hidden;
}

.viz-meter {
  border-radius: var(--radius-xs, 2px);
  overflow: hidden;
}

.viz-spectrum {
  border-radius: var(--radius-sm, 4px);
  overflow: hidden;
}

.viz-piano {
  border-radius: var(--radius-sm, 4px);
  overflow: hidden;
}

.viz-scope {
  border-radius: var(--radius-sm, 4px);
  overflow: hidden;
  background: var(--viz-scope-bg);
}

.viz-beat-indicator {
  display: flex;
  gap: 4px;
  align-items: center;
}

.viz-beat {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--viz-beat-inactive);
  transition: background 0.1s ease, box-shadow 0.1s ease;
}

.viz-beat.active {
  background: var(--viz-beat-active);
  box-shadow: 0 0 8px var(--viz-beat-active);
}

.viz-beat.downbeat.active {
  background: var(--viz-beat-downbeat);
  box-shadow: 0 0 8px var(--viz-beat-downbeat);
}
`.trim();
}

/**
 * Apply visualization CSS to document.
 */
export function applyVisualizationCSS(colors: VisualizationColors = DARK_VIZ_COLORS): void {
  const styleId = 'cardplay-visualization-theme';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  
  styleEl.textContent = generateVisualizationCSS(colors);
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  DARK_VIZ_COLORS as DEFAULT_VIZ_COLORS,
};
