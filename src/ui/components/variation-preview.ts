/**
 * @fileoverview Variation Preview and A/B Comparison System
 * 
 * Provides UI for previewing variations before applying them,
 * including A/B comparison and variation history tracking.
 * 
 * @module @cardplay/core/ui/components/variation-preview
 */

import type { Event } from '../../types/event';
import type {
  VariationResult,
} from '../../cards/phrase-variations';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Preview state for a variation
 */
export interface VariationPreviewState {
  /** Original events */
  readonly original: readonly Event<any>[];
  /** Current variation result */
  readonly current: VariationResult<any> | null;
  /** Alternative variation for A/B comparison */
  readonly alternative: VariationResult<any> | null;
  /** Which version is currently playing ('original' | 'current' | 'alternative') */
  readonly playing: 'original' | 'current' | 'alternative' | null;
  /** Loop playback */
  readonly looping: boolean;
  /** Variation history for undo/redo */
  readonly history: readonly VariationResult<any>[];
  /** Current history position */
  readonly historyPosition: number;
}

/**
 * A/B comparison result
 */
export interface ABComparison {
  readonly optionA: VariationResult<any>;
  readonly optionB: VariationResult<any>;
  readonly currentlyPlaying: 'A' | 'B' | null;
  readonly userPreference: 'A' | 'B' | 'neither' | null;
}

/**
 * Preview action
 */
export type PreviewAction =
  | { type: 'LOAD_ORIGINAL'; events: readonly Event<any>[] }
  | { type: 'APPLY_VARIATION'; result: VariationResult<any> }
  | { type: 'SET_ALTERNATIVE'; result: VariationResult<any> }
  | { type: 'PLAY'; version: 'original' | 'current' | 'alternative' }
  | { type: 'STOP' }
  | { type: 'TOGGLE_LOOP' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET' }
  | { type: 'COMMIT' }
  | { type: 'SWITCH_AB' };

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * Initial preview state
 */
export function createInitialPreviewState(): VariationPreviewState {
  return {
    original: [],
    current: null,
    alternative: null,
    playing: null,
    looping: false,
    history: [],
    historyPosition: -1,
  };
}

/**
 * Reducer for preview state
 */
export function previewReducer(
  state: VariationPreviewState,
  action: PreviewAction
): VariationPreviewState {
  switch (action.type) {
    case 'LOAD_ORIGINAL':
      return {
        ...state,
        original: action.events,
        current: null,
        alternative: null,
        history: [],
        historyPosition: -1,
      };
    
    case 'APPLY_VARIATION':
      // Add to history
      const newHistory = [
        ...state.history.slice(0, state.historyPosition + 1),
        action.result,
      ];
      
      return {
        ...state,
        current: action.result,
        history: newHistory,
        historyPosition: newHistory.length - 1,
      };
    
    case 'SET_ALTERNATIVE':
      return {
        ...state,
        alternative: action.result,
      };
    
    case 'PLAY':
      return {
        ...state,
        playing: action.version,
      };
    
    case 'STOP':
      return {
        ...state,
        playing: null,
      };
    
    case 'TOGGLE_LOOP':
      return {
        ...state,
        looping: !state.looping,
      };
    
    case 'UNDO':
      if (state.historyPosition > 0) {
        const newPosition = state.historyPosition - 1;
        return {
          ...state,
          current: state.history[newPosition] ?? null,
          historyPosition: newPosition,
        };
      }
      return state;
    
    case 'REDO':
      if (state.historyPosition < state.history.length - 1) {
        const newPosition = state.historyPosition + 1;
        return {
          ...state,
          current: state.history[newPosition] ?? null,
          historyPosition: newPosition,
        };
      }
      return state;
    
    case 'RESET':
      return {
        ...state,
        current: null,
        alternative: null,
        playing: null,
        history: [],
        historyPosition: -1,
      };
    
    case 'COMMIT':
      // Committing replaces original with current
      return {
        ...state,
        original: state.current?.transformed ?? state.original,
        current: null,
        alternative: null,
        history: [],
        historyPosition: -1,
      };
    
    case 'SWITCH_AB':
      // Swap current and alternative
      return {
        ...state,
        current: state.alternative,
        alternative: state.current,
      };
    
    default:
      return state;
  }
}

// ============================================================================
// A/B COMPARISON
// ============================================================================

/**
 * Create A/B comparison from current state
 */
export function createABComparison(
  state: VariationPreviewState
): ABComparison | null {
  if (!state.current || !state.alternative) {
    return null;
  }
  
  return {
    optionA: state.current,
    optionB: state.alternative,
    currentlyPlaying: state.playing === 'current' ? 'A' : state.playing === 'alternative' ? 'B' : null,
    userPreference: null,
  };
}

/**
 * Select preference in A/B comparison
 */
export function selectABPreference(
  comparison: ABComparison,
  preference: 'A' | 'B'
): VariationResult<any> {
  return preference === 'A' ? comparison.optionA : comparison.optionB;
}

// ============================================================================
// VISUALIZATION
// ============================================================================

/**
 * Render comparison view
 */
export interface ComparisonVisualizationConfig {
  /** Canvas width */
  readonly width: number;
  /** Canvas height */
  readonly height: number;
  /** Show differences only */
  readonly highlightDifferences: boolean;
  /** Show waveform preview */
  readonly showWaveform: boolean;
  /** Color scheme */
  readonly colors: {
    readonly original: string;
    readonly current: string;
    readonly alternative: string;
    readonly difference: string;
  };
}

/**
 * Default visualization config
 */
export const DEFAULT_COMPARISON_CONFIG: ComparisonVisualizationConfig = {
  width: 800,
  height: 400,
  highlightDifferences: true,
  showWaveform: false,
  colors: {
    original: '#60A5FA',     // Blue
    current: '#34D399',      // Green
    alternative: '#F59E0B',  // Amber
    difference: '#EF4444',   // Red
  },
};

/**
 * Render variation comparison
 */
export function renderVariationComparison(
  ctx: CanvasRenderingContext2D,
  state: VariationPreviewState,
  config: ComparisonVisualizationConfig = DEFAULT_COMPARISON_CONFIG
): void {
  ctx.clearRect(0, 0, config.width, config.height);
  
  const sectionHeight = config.height / 3;
  
  // Render original
  ctx.save();
  ctx.fillStyle = config.colors.original;
  ctx.globalAlpha = 0.7;
  renderEvents(ctx, state.original, 0, sectionHeight, config.width);
  ctx.restore();
  
  // Render current variation
  if (state.current) {
    ctx.save();
    ctx.fillStyle = config.colors.current;
    ctx.globalAlpha = state.playing === 'current' ? 1.0 : 0.7;
    renderEvents(ctx, state.current.transformed, sectionHeight, sectionHeight, config.width);
    ctx.restore();
    
    // Label
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px sans-serif';
    ctx.fillText(state.current.description, 10, sectionHeight + 20);
  }
  
  // Render alternative variation
  if (state.alternative) {
    ctx.save();
    ctx.fillStyle = config.colors.alternative;
    ctx.globalAlpha = state.playing === 'alternative' ? 1.0 : 0.7;
    renderEvents(ctx, state.alternative.transformed, sectionHeight * 2, sectionHeight, config.width);
    ctx.restore();
    
    // Label
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px sans-serif';
    ctx.fillText(state.alternative.description, 10, sectionHeight * 2 + 20);
  }
  
  // Draw section dividers
  ctx.strokeStyle = '#4B5563';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, sectionHeight);
  ctx.lineTo(config.width, sectionHeight);
  ctx.moveTo(0, sectionHeight * 2);
  ctx.lineTo(config.width, sectionHeight * 2);
  ctx.stroke();
  
  // Draw labels
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '10px monospace';
  ctx.fillText('ORIGINAL', 10, 15);
  if (state.current) ctx.fillText('VARIATION A', 10, sectionHeight + 15);
  if (state.alternative) ctx.fillText('VARIATION B', 10, sectionHeight * 2 + 15);
}

/**
 * Render events as simplified piano roll
 */
function renderEvents(
  ctx: CanvasRenderingContext2D,
  events: readonly Event<any>[],
  yOffset: number,
  height: number,
  width: number
): void {
  if (events.length === 0) return;
  
  // Find time and pitch range
  const starts = events.map(e => e.start as number);
  const ends = events.map(e => (e.start as number) + ((e.duration ?? 0) as number));
  const pitches = events
    .map(e => (e.payload as any)?.pitch)
    .filter((p): p is number => typeof p === 'number');
  
  if (pitches.length === 0) return;
  
  const minTime = Math.min(...starts);
  const maxTime = Math.max(...ends);
  const minPitch = Math.min(...pitches);
  const maxPitch = Math.max(...pitches);
  
  const timeScale = (maxTime - minTime) > 0 ? width / (maxTime - minTime) : 1;
  const pitchScale = (maxPitch - minPitch) > 0 ? height / (maxPitch - minPitch + 1) : 1;
  
  // Draw events
  events.forEach(event => {
    const payload = event.payload as any;
    if (typeof payload?.pitch !== 'number') return;
    
    const x = ((event.start as number) - minTime) * timeScale;
    const y = yOffset + height - ((payload.pitch - minPitch) * pitchScale);
    const w = ((event.duration ?? 0) as number) * timeScale;
    const h = pitchScale * 0.8;
    
    ctx.fillRect(x, y - h, Math.max(w, 2), h);
  });
}

// ============================================================================
// HISTORY VISUALIZATION
// ============================================================================

/**
 * Render variation history timeline
 */
export function renderVariationHistory(
  ctx: CanvasRenderingContext2D,
  state: VariationPreviewState,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  if (state.history.length === 0) return;
  
  ctx.save();
  
  const stepWidth = width / Math.max(state.history.length, 1);
  const nodeRadius = 6;
  
  // Draw timeline line
  ctx.strokeStyle = '#4B5563';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + height / 2);
  ctx.lineTo(x + width, y + height / 2);
  ctx.stroke();
  
  // Draw history nodes
  state.history.forEach((result, idx) => {
    const nodeX = x + (idx + 0.5) * stepWidth;
    const nodeY = y + height / 2;
    const isActive = idx === state.historyPosition;
    const isFuture = idx > state.historyPosition;
    
    // Draw node
    ctx.beginPath();
    ctx.arc(nodeX, nodeY, nodeRadius, 0, Math.PI * 2);
    ctx.fillStyle = isActive ? '#10B981' : isFuture ? '#374151' : '#6B7280';
    ctx.fill();
    ctx.strokeStyle = isActive ? '#34D399' : '#4B5563';
    ctx.lineWidth = isActive ? 2 : 1;
    ctx.stroke();
    
    // Draw variation type label (on hover - would need interaction state)
    if (isActive) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px sans-serif';
      const label = result.config.type;
      const metrics = ctx.measureText(label);
      ctx.fillText(label, nodeX - metrics.width / 2, nodeY - nodeRadius - 5);
    }
  });
  
  // Draw undo/redo indicators
  if (state.historyPosition > 0) {
    ctx.fillStyle = '#10B981';
    ctx.font = '12px sans-serif';
    ctx.fillText('← Undo', x, y - 5);
  }
  
  if (state.historyPosition < state.history.length - 1) {
    ctx.fillStyle = '#10B981';
    ctx.font = '12px sans-serif';
    const text = 'Redo →';
    const metrics = ctx.measureText(text);
    ctx.fillText(text, x + width - metrics.width, y - 5);
  }
  
  ctx.restore();
}

// ============================================================================
// PLAYBACK CONTROLS
// ============================================================================

/**
 * Playback control state
 */
export interface PlaybackControlsState {
  readonly isPlaying: boolean;
  readonly position: number;  // In ticks
  readonly duration: number;  // In ticks
  readonly volume: number;    // 0-1
  readonly tempo: number;     // BPM
}

/**
 * Render playback controls
 */
export function renderPlaybackControls(
  ctx: CanvasRenderingContext2D,
  state: PlaybackControlsState,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  ctx.save();
  
  // Background
  ctx.fillStyle = '#1F2937';
  ctx.fillRect(x, y, width, height);
  
  // Play/pause button
  const buttonSize = Math.min(height - 10, 40);
  const buttonX = x + 10;
  const buttonY = y + (height - buttonSize) / 2;
  
  ctx.fillStyle = state.isPlaying ? '#EF4444' : '#10B981';
  ctx.beginPath();
  ctx.arc(buttonX + buttonSize / 2, buttonY + buttonSize / 2, buttonSize / 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Play/pause icon
  ctx.fillStyle = '#FFFFFF';
  if (state.isPlaying) {
    // Pause icon
    const barWidth = buttonSize * 0.15;
    const barHeight = buttonSize * 0.4;
    const centerX = buttonX + buttonSize / 2;
    const centerY = buttonY + buttonSize / 2;
    ctx.fillRect(centerX - barWidth - 2, centerY - barHeight / 2, barWidth, barHeight);
    ctx.fillRect(centerX + 2, centerY - barHeight / 2, barWidth, barHeight);
  } else {
    // Play icon (triangle)
    const triangleSize = buttonSize * 0.3;
    const centerX = buttonX + buttonSize / 2 + 2;
    const centerY = buttonY + buttonSize / 2;
    ctx.beginPath();
    ctx.moveTo(centerX - triangleSize / 2, centerY - triangleSize / 2);
    ctx.lineTo(centerX + triangleSize / 2, centerY);
    ctx.lineTo(centerX - triangleSize / 2, centerY + triangleSize / 2);
    ctx.closePath();
    ctx.fill();
  }
  
  // Progress bar
  const progressX = buttonX + buttonSize + 20;
  const progressY = buttonY + buttonSize / 2 - 3;
  const progressWidth = width - (progressX - x) - 100;
  const progressHeight = 6;
  
  ctx.fillStyle = '#374151';
  ctx.fillRect(progressX, progressY, progressWidth, progressHeight);
  
  if (state.duration > 0) {
    const progress = state.position / state.duration;
    ctx.fillStyle = '#10B981';
    ctx.fillRect(progressX, progressY, progressWidth * progress, progressHeight);
  }
  
  // Time display
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '12px monospace';
  const timeText = `${formatTime(state.position)} / ${formatTime(state.duration)}`;
  ctx.fillText(timeText, progressX + progressWidth + 10, progressY + progressHeight);
  
  // Tempo display
  ctx.fillText(`${state.tempo.toFixed(0)} BPM`, progressX + progressWidth + 10, progressY + progressHeight + 15);
  
  ctx.restore();
}

/**
 * Format time in ticks to mm:ss
 */
function formatTime(ticks: number): string {
  const secondsPerTick = 1 / 480; // Assuming 480 PPQ
  const totalSeconds = ticks * secondsPerTick;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// ============================================================================
// QUICK COMPARISON UI
// ============================================================================

/**
 * Render quick A/B toggle buttons
 */
export function renderABToggle(
  ctx: CanvasRenderingContext2D,
  comparison: ABComparison,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  ctx.save();
  
  const buttonWidth = width / 2 - 5;
  const buttonHeight = height;
  
  // Button A
  const isPlayingA = comparison.currentlyPlaying === 'A';
  ctx.fillStyle = isPlayingA ? '#10B981' : '#374151';
  ctx.fillRect(x, y, buttonWidth, buttonHeight);
  
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('A', x + buttonWidth / 2, y + buttonHeight / 2 - 10);
  
  ctx.font = '10px sans-serif';
  ctx.fillText('Current', x + buttonWidth / 2, y + buttonHeight / 2 + 10);
  
  // Button B
  const isPlayingB = comparison.currentlyPlaying === 'B';
  ctx.fillStyle = isPlayingB ? '#10B981' : '#374151';
  ctx.fillRect(x + buttonWidth + 10, y, buttonWidth, buttonHeight);
  
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('B', x + buttonWidth + 10 + buttonWidth / 2, y + buttonHeight / 2 - 10);
  
  ctx.font = '10px sans-serif';
  ctx.fillText('Alternative', x + buttonWidth + 10 + buttonWidth / 2, y + buttonHeight / 2 + 10);
  
  // Preference indicator
  if (comparison.userPreference) {
    const preferenceX = comparison.userPreference === 'A' ? x + buttonWidth / 2 : x + buttonWidth + 10 + buttonWidth / 2;
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(preferenceX, y - 10, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', preferenceX, y - 10);
  }
  
  ctx.restore();
}


