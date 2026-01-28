/**
 * @fileoverview Preset Preview System.
 * 
 * Provides audio preview functionality for presets, allowing users to hear
 * presets before selecting them.
 * 
 * @module @cardplay/core/ui/components/preset-preview
 */

import type { Card } from '../../cards/card';
import type { Parameter } from '../../cards/parameters';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Preview configuration for a card type.
 */
export interface PreviewConfig {
  /** Duration of preview in milliseconds */
  readonly duration: number;
  /** MIDI notes to trigger (pitch, velocity, duration) */
  readonly midiNotes: readonly PreviewNote[];
  /** Chord progression if applicable */
  readonly chordProgression?: readonly PreviewChord[];
  /** Tempo for preview */
  readonly tempo: number;
  /** Time signature */
  readonly timeSignature: readonly [number, number];
  /** Fade out at end (ms) */
  readonly fadeOutDuration: number;
}

/**
 * MIDI note for preview.
 */
export interface PreviewNote {
  /** MIDI pitch (0-127) */
  readonly pitch: number;
  /** Velocity (0-127) */
  readonly velocity: number;
  /** Start time in milliseconds from preview start */
  readonly startMs: number;
  /** Duration in milliseconds */
  readonly durationMs: number;
  /** Channel (default 0) */
  readonly channel?: number;
}

/**
 * Chord for preview.
 */
export interface PreviewChord {
  /** Root pitch (0-127) */
  readonly root: number;
  /** Chord quality */
  readonly quality: 'major' | 'minor' | 'dominant7' | 'minor7' | 'major7' | 'diminished' | 'augmented';
  /** Start time in milliseconds */
  readonly startMs: number;
  /** Duration in milliseconds */
  readonly durationMs: number;
}

/**
 * Preset preview state.
 */
export interface PresetPreviewState {
  /** Currently previewing preset ID */
  readonly previewingPresetId?: string | undefined;
  /** Audio context for preview */
  readonly audioContext?: AudioContext | undefined;
  /** Preview audio node */
  readonly audioNode?: AudioNode | undefined;
  /** Start time of preview */
  readonly startTime?: number | undefined;
  /** Preview scheduled stop time */
  readonly stopTime?: number | undefined;
  /** Is preview playing */
  readonly isPlaying: boolean;
  /** Is preview loading */
  readonly isLoading: boolean;
  /** Error message */
  readonly error?: string | undefined;
}

/**
 * Preset preview manager configuration.
 */
export interface PresetPreviewManagerConfig {
  /** Audio context to use */
  readonly audioContext: AudioContext;
  /** Card instance for preview */
  readonly card: Card<unknown, unknown>;
  /** Parameters for card */
  readonly parameters: readonly Parameter[];
  /** Preview config for this card type */
  readonly previewConfig: PreviewConfig;
  /** Callback when preview starts */
  readonly onPreviewStart?: (presetId: string) => void;
  /** Callback when preview stops */
  readonly onPreviewStop?: (presetId: string) => void;
  /** Callback on error */
  readonly onError?: (error: string) => void;
}

// ============================================================================
// DEFAULT PREVIEW CONFIGURATIONS
// ============================================================================

/**
 * Default preview configuration for melodic instruments.
 */
export const MELODIC_PREVIEW_CONFIG: PreviewConfig = Object.freeze({
  duration: 4000,
  midiNotes: Object.freeze([
    // C major scale ascending
    { pitch: 60, velocity: 100, startMs: 0, durationMs: 400 },      // C
    { pitch: 62, velocity: 95, startMs: 400, durationMs: 400 },     // D
    { pitch: 64, velocity: 100, startMs: 800, durationMs: 400 },    // E
    { pitch: 65, velocity: 95, startMs: 1200, durationMs: 400 },    // F
    { pitch: 67, velocity: 110, startMs: 1600, durationMs: 400 },   // G
    { pitch: 69, velocity: 100, startMs: 2000, durationMs: 400 },   // A
    { pitch: 71, velocity: 95, startMs: 2400, durationMs: 400 },    // B
    { pitch: 72, velocity: 120, startMs: 2800, durationMs: 800 },   // C (octave)
  ]),
  tempo: 120,
  timeSignature: [4, 4] as [number, number],
  fadeOutDuration: 200,
});

/**
 * Default preview configuration for pad/ambient sounds.
 */
export const PAD_PREVIEW_CONFIG: PreviewConfig = Object.freeze({
  duration: 6000,
  midiNotes: Object.freeze([
    // Sustained chord
    { pitch: 60, velocity: 80, startMs: 0, durationMs: 5000 },      // C
    { pitch: 64, velocity: 75, startMs: 0, durationMs: 5000 },      // E
    { pitch: 67, velocity: 70, startMs: 0, durationMs: 5000 },      // G
    { pitch: 72, velocity: 65, startMs: 0, durationMs: 5000 },      // C (octave)
  ]),
  tempo: 80,
  timeSignature: [4, 4] as [number, number],
  fadeOutDuration: 500,
});

/**
 * Default preview configuration for bass.
 */
export const BASS_PREVIEW_CONFIG: PreviewConfig = Object.freeze({
  duration: 4000,
  midiNotes: Object.freeze([
    // Walking bass pattern
    { pitch: 36, velocity: 110, startMs: 0, durationMs: 500 },      // C
    { pitch: 38, velocity: 100, startMs: 500, durationMs: 500 },    // D
    { pitch: 40, velocity: 105, startMs: 1000, durationMs: 500 },   // E
    { pitch: 41, velocity: 100, startMs: 1500, durationMs: 500 },   // F
    { pitch: 43, velocity: 115, startMs: 2000, durationMs: 500 },   // G
    { pitch: 41, velocity: 100, startMs: 2500, durationMs: 500 },   // F
    { pitch: 40, velocity: 105, startMs: 3000, durationMs: 500 },   // E
    { pitch: 36, velocity: 120, startMs: 3500, durationMs: 500 },   // C
  ]),
  tempo: 120,
  timeSignature: [4, 4] as [number, number],
  fadeOutDuration: 200,
});

/**
 * Default preview configuration for drums.
 */
export const DRUM_PREVIEW_CONFIG: PreviewConfig = Object.freeze({
  duration: 4000,
  midiNotes: Object.freeze([
    // Basic rock beat
    // Kick
    { pitch: 36, velocity: 120, startMs: 0, durationMs: 100 },
    { pitch: 36, velocity: 110, startMs: 500, durationMs: 100 },
    { pitch: 36, velocity: 120, startMs: 1000, durationMs: 100 },
    { pitch: 36, velocity: 110, startMs: 1500, durationMs: 100 },
    // Snare
    { pitch: 38, velocity: 115, startMs: 500, durationMs: 100 },
    { pitch: 38, velocity: 115, startMs: 1500, durationMs: 100 },
    { pitch: 38, velocity: 120, startMs: 2500, durationMs: 100 },
    { pitch: 38, velocity: 110, startMs: 3500, durationMs: 100 },
    // Hi-hat (8th notes)
    { pitch: 42, velocity: 90, startMs: 0, durationMs: 100 },
    { pitch: 42, velocity: 70, startMs: 250, durationMs: 100 },
    { pitch: 42, velocity: 90, startMs: 500, durationMs: 100 },
    { pitch: 42, velocity: 70, startMs: 750, durationMs: 100 },
    { pitch: 42, velocity: 90, startMs: 1000, durationMs: 100 },
    { pitch: 42, velocity: 70, startMs: 1250, durationMs: 100 },
    { pitch: 42, velocity: 90, startMs: 1500, durationMs: 100 },
    { pitch: 42, velocity: 70, startMs: 1750, durationMs: 100 },
    { pitch: 42, velocity: 90, startMs: 2000, durationMs: 100 },
    { pitch: 42, velocity: 70, startMs: 2250, durationMs: 100 },
    { pitch: 42, velocity: 90, startMs: 2500, durationMs: 100 },
    { pitch: 42, velocity: 70, startMs: 2750, durationMs: 100 },
    { pitch: 42, velocity: 90, startMs: 3000, durationMs: 100 },
    { pitch: 42, velocity: 70, startMs: 3250, durationMs: 100 },
    { pitch: 42, velocity: 90, startMs: 3500, durationMs: 100 },
    { pitch: 42, velocity: 70, startMs: 3750, durationMs: 100 },
  ]),
  tempo: 120,
  timeSignature: [4, 4] as [number, number],
  fadeOutDuration: 100,
});

/**
 * Default preview configuration for lead synth.
 */
export const LEAD_PREVIEW_CONFIG: PreviewConfig = Object.freeze({
  duration: 4000,
  midiNotes: Object.freeze([
    // Melodic phrase
    { pitch: 72, velocity: 110, startMs: 0, durationMs: 600 },      // C
    { pitch: 74, velocity: 100, startMs: 600, durationMs: 300 },    // D
    { pitch: 76, velocity: 110, startMs: 900, durationMs: 600 },    // E
    { pitch: 74, velocity: 95, startMs: 1500, durationMs: 300 },    // D
    { pitch: 72, velocity: 100, startMs: 1800, durationMs: 400 },   // C
    { pitch: 67, velocity: 120, startMs: 2200, durationMs: 1800 },  // G (sustained)
  ]),
  tempo: 140,
  timeSignature: [4, 4] as [number, number],
  fadeOutDuration: 300,
});

/**
 * Get preview config for card category.
 */
export function getPreviewConfigForCategory(category: string): PreviewConfig {
  switch (category.toLowerCase()) {
    case 'bass':
      return BASS_PREVIEW_CONFIG;
    case 'drums':
    case 'percussion':
      return DRUM_PREVIEW_CONFIG;
    case 'pad':
    case 'ambient':
    case 'strings':
      return PAD_PREVIEW_CONFIG;
    case 'lead':
    case 'synth':
      return LEAD_PREVIEW_CONFIG;
    case 'keys':
    case 'piano':
    case 'organ':
    default:
      return MELODIC_PREVIEW_CONFIG;
  }
}

// ============================================================================
// PREVIEW STATE MANAGEMENT
// ============================================================================

/**
 * Create initial preset preview state.
 */
export function createPresetPreviewState(): PresetPreviewState {
  return Object.freeze({
    isPlaying: false,
    isLoading: false,
  });
}

/**
 * Start preview for a preset.
 */
export function startPreview(
  state: PresetPreviewState,
  presetId: string,
  audioContext: AudioContext
): PresetPreviewState {
  return Object.freeze({
    ...state,
    previewingPresetId: presetId,
    audioContext,
    isLoading: true,
    error: undefined,
  });
}

/**
 * Set preview playing.
 */
export function setPreviewPlaying(
  state: PresetPreviewState,
  audioNode: AudioNode,
  startTime: number,
  stopTime: number
): PresetPreviewState {
  return Object.freeze({
    ...state,
    audioNode,
    startTime,
    stopTime,
    isPlaying: true,
    isLoading: false,
  });
}

/**
 * Stop preview.
 */
export function stopPreview(state: PresetPreviewState): PresetPreviewState {
  // Clean up audio node if exists
  if (state.audioNode && state.audioContext) {
    try {
      state.audioNode.disconnect();
    } catch (_e) {
      // Ignore errors on disconnect
    }
  }

  return Object.freeze({
    ...state,
    previewingPresetId: undefined,
    audioNode: undefined,
    startTime: undefined,
    stopTime: undefined,
    isPlaying: false,
    isLoading: false,
  });
}

/**
 * Set preview error.
 */
export function setPreviewError(
  state: PresetPreviewState,
  error: string
): PresetPreviewState {
  return Object.freeze({
    ...state,
    isPlaying: false,
    isLoading: false,
    error,
  });
}

// ============================================================================
// MIDI NOTE SCHEDULING
// ============================================================================

/**
 * Schedule MIDI notes for preview.
 * 
 * This is a simplified version - in real implementation, this would integrate
 * with the audio engine and card processing.
 */
export function scheduleMIDINotes(
  notes: readonly PreviewNote[],
  _audioContext: AudioContext,
  startTime: number
): void {
  // In real implementation, this would:
  // 1. Create a MIDI event stream from the notes
  // 2. Pass through the card with the preset applied
  // 3. Connect to audio output
  // For now, this is a placeholder that shows the intent
  
  for (const note of notes) {
    const noteStartTime = startTime + note.startMs / 1000;
    const noteEndTime = noteStartTime + note.durationMs / 1000;
    
    // TODO: Implement actual MIDI note triggering through card
    console.log(
      `Schedule note: pitch=${note.pitch}, vel=${note.velocity}, ` +
      `start=${noteStartTime.toFixed(3)}, end=${noteEndTime.toFixed(3)}`
    );
  }
}

/**
 * Generate chord notes from chord specification.
 */
export function generateChordNotes(chord: PreviewChord): readonly PreviewNote[] {
  const intervals: Record<PreviewChord['quality'], readonly number[]> = {
    'major': [0, 4, 7],
    'minor': [0, 3, 7],
    'dominant7': [0, 4, 7, 10],
    'minor7': [0, 3, 7, 10],
    'major7': [0, 4, 7, 11],
    'diminished': [0, 3, 6],
    'augmented': [0, 4, 8],
  };

  const chordIntervals = intervals[chord.quality];
  const velocity = 90;

  return chordIntervals.map(interval => ({
    pitch: chord.root + interval,
    velocity,
    startMs: chord.startMs,
    durationMs: chord.durationMs,
  }));
}

// ============================================================================
// PRESET PREVIEW CSS
// ============================================================================

/**
 * CSS for preset preview controls.
 */
export const PRESET_PREVIEW_CSS = `
.preset-preview {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.preset-preview__button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--color-primary);
  color: var(--color-text-inverse);
  cursor: pointer;
  transition: all 150ms;
  position: relative;
}

.preset-preview__button:hover {
  background: var(--color-primary-hover);
  transform: scale(1.05);
}

.preset-preview__button:active {
  transform: scale(0.95);
}

.preset-preview__button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.preset-preview__button--playing {
  animation: preset-preview-playing 2s ease-in-out infinite;
}

@keyframes preset-preview-playing {
  0%, 100% {
    box-shadow: 0 0 0 0 var(--color-primary);
  }
  50% {
    box-shadow: 0 0 0 4px var(--color-primary-alpha);
  }
}

.preset-preview__button--loading::after {
  content: '';
  position: absolute;
  inset: -2px;
  border: 2px solid transparent;
  border-top-color: var(--color-primary);
  border-radius: var(--radius-sm);
  animation: preset-preview-spin 1s linear infinite;
}

@keyframes preset-preview-spin {
  to { transform: rotate(360deg); }
}

.preset-preview__status {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.preset-preview__status--playing {
  color: var(--color-primary);
  font-weight: var(--font-medium);
}

.preset-preview__status--error {
  color: var(--color-red);
}

.preset-preview__waveform {
  width: 100px;
  height: 24px;
  background: var(--color-surface-elevated);
  border-radius: var(--radius-xs);
  position: relative;
  overflow: hidden;
}

.preset-preview__waveform-bar {
  position: absolute;
  bottom: 0;
  width: 2px;
  background: var(--color-primary);
  transition: height 50ms;
}

.preset-preview__progress {
  height: 2px;
  background: var(--color-primary-alpha);
  border-radius: var(--radius-xs);
  overflow: hidden;
  margin-top: var(--spacing-xs);
}

.preset-preview__progress-bar {
  height: 100%;
  background: var(--color-primary);
  transition: width 100ms linear;
}
`;

/**
 * Apply preset preview CSS to document.
 */
export function applyPresetPreviewCSS(): void {
  const styleId = 'cardplay-preset-preview-css';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = PRESET_PREVIEW_CSS;
    document.head.appendChild(style);
  }
}
