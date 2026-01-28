/**
 * @fileoverview Notation Comparison and Audio Sync Visualization.
 * 
 * Provides:
 * - Version comparison view (old/new)
 * - Audio sync visualization (waveform alignment with notation)
 * 
 * Phase 11.5 (final items): Advanced notation features
 * 
 * Tasks:
 * - 2688: Add comparison view (old/new)
 * - 2689: Implement audio sync visualization
 * 
 * @module @cardplay/core/notation/comparison-sync
 */

import type { NotationMeasure, NotationEvent } from './types';
import type { Tick } from '../types/primitives';

// ============================================================================
// COMPARISON VIEW (Task 2688)
// ============================================================================

/**
 * Difference type for notation comparison.
 */
export type NotationDiffType = 
  | 'added' 
  | 'removed' 
  | 'modified' 
  | 'unchanged';

/**
 * A single difference item in notation comparison.
 */
export interface NotationDiff {
  /** Type of difference */
  readonly type: NotationDiffType;
  /** Old event (if exists) */
  readonly oldEvent?: NotationEvent;
  /** New event (if exists) */
  readonly newEvent?: NotationEvent;
  /** Measure index */
  readonly measureIndex: number;
  /** Voice number within measure */
  readonly voice: number;
  /** Description of change (for modified events) */
  readonly description?: string;
}

/**
 * Configuration for comparison view rendering.
 */
export interface ComparisonViewConfig {
  /** Show additions in green */
  readonly showAdditions: boolean;
  /** Show removals in red */
  readonly showRemovals: boolean;
  /** Show modifications in yellow */
  readonly showModifications: boolean;
  /** Highlight intensity (0-1) */
  readonly highlightOpacity: number;
  /** Show side-by-side comparison */
  readonly sideBySide: boolean;
  /** Show diff summary at top */
  readonly showSummary: boolean;
}

/**
 * Default comparison view configuration.
 */
export const DEFAULT_COMPARISON_CONFIG: ComparisonViewConfig = {
  showAdditions: true,
  showRemovals: true,
  showModifications: true,
  highlightOpacity: 0.3,
  sideBySide: false,
  showSummary: true,
};

/**
 * Summary statistics for notation comparison.
 */
export interface ComparisonSummary {
  /** Number of notes added */
  readonly added: number;
  /** Number of notes removed */
  readonly removed: number;
  /** Number of notes modified */
  readonly modified: number;
  /** Number of notes unchanged */
  readonly unchanged: number;
  /** Total number of changes */
  readonly totalChanges: number;
}

/**
 * Compares two notation measures and returns differences.
 * 
 * Task 2688: Add comparison view (old/new)
 */
export function compareNotationMeasures(
  oldMeasures: readonly NotationMeasure[],
  newMeasures: readonly NotationMeasure[]
): readonly NotationDiff[] {
  const diffs: NotationDiff[] = [];
  const maxMeasures = Math.max(oldMeasures.length, newMeasures.length);
  
  for (let measureIndex = 0; measureIndex < maxMeasures; measureIndex++) {
    const oldMeasure = oldMeasures[measureIndex];
    const newMeasure = newMeasures[measureIndex];
    
    if (!oldMeasure && newMeasure) {
      // Entire measure added
      newMeasure.events.forEach((events, voice) => {
        events.forEach(event => {
          diffs.push({
            type: 'added',
            newEvent: event,
            measureIndex,
            voice,
          });
        });
      });
      continue;
    }
    
    if (oldMeasure && !newMeasure) {
      // Entire measure removed
      oldMeasure.events.forEach((events, voice) => {
        events.forEach(event => {
          diffs.push({
            type: 'removed',
            oldEvent: event,
            measureIndex,
            voice,
          });
        });
      });
      continue;
    }
    
    if (!oldMeasure || !newMeasure) continue;
    
    // Get all voices from both measures
    const allVoices = new Set([
      ...oldMeasure.events.keys(),
      ...newMeasure.events.keys()
    ]);
    
    for (const voice of allVoices) {
      const oldEvents = oldMeasure.events.get(voice) ?? [];
      const newEvents = newMeasure.events.get(voice) ?? [];
      
      if (oldEvents.length === 0 && newEvents.length > 0) {
        // Voice added
        newEvents.forEach(event => {
          diffs.push({
            type: 'added',
            newEvent: event,
            measureIndex,
            voice,
          });
        });
        continue;
      }
      
      if (oldEvents.length > 0 && newEvents.length === 0) {
        // Voice removed
        oldEvents.forEach(event => {
          diffs.push({
            type: 'removed',
            oldEvent: event,
            measureIndex,
            voice,
          });
        });
        continue;
      }
      
      // Compare events within voice
      // Simple alignment by position (could be improved with LCS algorithm)
      const maxEvents = Math.max(oldEvents.length, newEvents.length);
      for (let i = 0; i < maxEvents; i++) {
        const oldEvent = oldEvents[i];
        const newEvent = newEvents[i];
        
        if (!oldEvent && newEvent) {
          diffs.push({
            type: 'added',
            newEvent,
            measureIndex,
            voice,
          });
        } else if (oldEvent && !newEvent) {
          diffs.push({
            type: 'removed',
            oldEvent,
            measureIndex,
            voice,
          });
        } else if (oldEvent && newEvent) {
          const changes = compareEvents(oldEvent, newEvent);
          if (changes.length > 0) {
            diffs.push({
              type: 'modified',
              oldEvent,
              newEvent,
              measureIndex,
              voice,
              description: changes.join(', '),
            });
          } else {
            diffs.push({
              type: 'unchanged',
              oldEvent,
              newEvent,
              measureIndex,
              voice,
            });
          }
        }
      }
    }
  }
  
  return diffs;
}

/**
 * Compares two notation events and returns list of changes.
 */
function compareEvents(oldEvent: NotationEvent, newEvent: NotationEvent): string[] {
  const changes: string[] = [];
  
  // Compare durations
  if (oldEvent.duration.base !== newEvent.duration.base) {
    changes.push(`duration: ${oldEvent.duration.base} → ${newEvent.duration.base}`);
  }
  
  if (oldEvent.duration.dots !== newEvent.duration.dots) {
    changes.push(`dots: ${oldEvent.duration.dots} → ${newEvent.duration.dots}`);
  }
  
  // Compare notes (pitches)
  if (oldEvent.notes.length !== newEvent.notes.length) {
    changes.push(`notes: ${oldEvent.notes.length} → ${newEvent.notes.length}`);
  } else {
    for (let i = 0; i < oldEvent.notes.length; i++) {
      const oldNote = oldEvent.notes[i];
      const newNote = newEvent.notes[i];
      if (oldNote && newNote && oldNote.pitch !== newNote.pitch) {
        changes.push(`pitch[${i}]: ${oldNote.pitch} → ${newNote.pitch}`);
      }
    }
  }
  
  // Compare rest status
  if (oldEvent.isRest !== newEvent.isRest) {
    changes.push(`rest: ${oldEvent.isRest} → ${newEvent.isRest}`);
  }
  
  // Compare articulations
  const oldArtics = oldEvent.articulations ?? [];
  const newArtics = newEvent.articulations ?? [];
  if (oldArtics.length !== newArtics.length ||
      oldArtics.some((a, i) => a !== newArtics[i])) {
    changes.push('articulations changed');
  }
  
  return changes;
}

/**
 * Generates summary statistics from notation diffs.
 */
export function generateComparisonSummary(
  diffs: readonly NotationDiff[]
): ComparisonSummary {
  const summary = {
    added: 0,
    removed: 0,
    modified: 0,
    unchanged: 0,
  };
  
  for (const diff of diffs) {
    switch (diff.type) {
      case 'added':
        summary.added++;
        break;
      case 'removed':
        summary.removed++;
        break;
      case 'modified':
        summary.modified++;
        break;
      case 'unchanged':
        summary.unchanged++;
        break;
    }
  }
  
  return {
    ...summary,
    totalChanges: summary.added + summary.removed + summary.modified,
  };
}

/**
 * Renders comparison highlighting for SVG.
 * Returns CSS class names for different diff types.
 */
export function getComparisonHighlightClass(diff: NotationDiff): string {
  switch (diff.type) {
    case 'added':
      return 'notation-diff-added';
    case 'removed':
      return 'notation-diff-removed';
    case 'modified':
      return 'notation-diff-modified';
    case 'unchanged':
    default:
      return '';
  }
}

/**
 * Generates CSS for comparison view highlighting.
 */
export function generateComparisonCSS(config: ComparisonViewConfig = DEFAULT_COMPARISON_CONFIG): string {
  const opacity = config.highlightOpacity;
  
  return `
    .notation-diff-added {
      fill: rgba(0, 255, 0, ${opacity});
      stroke: rgba(0, 200, 0, 0.8);
      stroke-width: 2;
    }
    
    .notation-diff-removed {
      fill: rgba(255, 0, 0, ${opacity});
      stroke: rgba(200, 0, 0, 0.8);
      stroke-width: 2;
      opacity: 0.6;
    }
    
    .notation-diff-modified {
      fill: rgba(255, 255, 0, ${opacity});
      stroke: rgba(200, 200, 0, 0.8);
      stroke-width: 2;
    }
    
    .notation-diff-summary {
      font-family: sans-serif;
      font-size: 14px;
      fill: #333;
    }
    
    .notation-diff-summary-added {
      fill: #00cc00;
    }
    
    .notation-diff-summary-removed {
      fill: #cc0000;
    }
    
    .notation-diff-summary-modified {
      fill: #cc cc00;
    }
  `;
}

// ============================================================================
// AUDIO SYNC VISUALIZATION (Task 2689)
// ============================================================================

/**
 * Waveform data for audio sync visualization.
 */
export interface WaveformData {
  /** Audio samples (normalized -1 to 1) */
  readonly samples: Float32Array;
  /** Sample rate */
  readonly sampleRate: number;
  /** Duration in seconds */
  readonly durationSeconds: number;
  /** Number of channels */
  readonly channels: number;
}

/**
 * Configuration for audio sync visualization.
 */
export interface AudioSyncConfig {
  /** Height of waveform display in pixels */
  readonly waveformHeight: number;
  /** Color of waveform */
  readonly waveformColor: string;
  /** Show playhead sync line */
  readonly showPlayhead: boolean;
  /** Playhead color */
  readonly playheadColor: string;
  /** Show beat markers */
  readonly showBeatMarkers: boolean;
  /** Beat marker color */
  readonly beatMarkerColor: string;
  /** Waveform display mode */
  readonly displayMode: 'peaks' | 'rms' | 'full';
}

/**
 * Default audio sync configuration.
 */
export const DEFAULT_AUDIO_SYNC_CONFIG: AudioSyncConfig = {
  waveformHeight: 80,
  waveformColor: '#4488ff',
  showPlayhead: true,
  playheadColor: '#ff0000',
  showBeatMarkers: true,
  beatMarkerColor: '#888888',
  displayMode: 'peaks',
};

/**
 * Maps tick position to audio time.
 */
export interface TickToTimeMapping {
  /** Tempo in BPM */
  readonly tempo: number;
  /** Ticks per quarter note */
  readonly ticksPerQuarter: number;
  /** Audio offset in seconds */
  readonly audioOffsetSeconds: number;
}

/**
 * Converts tick to audio time in seconds.
 */
export function tickToAudioTime(
  tick: Tick,
  mapping: TickToTimeMapping
): number {
  const beatsFromStart = tick / mapping.ticksPerQuarter;
  const secondsFromStart = (beatsFromStart / mapping.tempo) * 60;
  return secondsFromStart + mapping.audioOffsetSeconds;
}

/**
 * Converts audio time to tick.
 */
export function audioTimeToTick(
  timeSeconds: number,
  mapping: TickToTimeMapping
): Tick {
  const adjustedTime = timeSeconds - mapping.audioOffsetSeconds;
  const beatsFromStart = (adjustedTime * mapping.tempo) / 60;
  return beatsFromStart * mapping.ticksPerQuarter as Tick;
}

/**
 * Generates waveform peak data for visualization.
 * Downsamples audio to specified number of points.
 */
export function generateWaveformPeaks(
  audioData: WaveformData,
  numPoints: number
): { min: number; max: number }[] {
  const samplesPerPoint = Math.floor(audioData.samples.length / numPoints);
  const peaks: { min: number; max: number }[] = [];
  
  for (let i = 0; i < numPoints; i++) {
    const start = i * samplesPerPoint;
    const end = Math.min(start + samplesPerPoint, audioData.samples.length);
    
    let min = 1;
    let max = -1;
    
    for (let j = start; j < end; j++) {
      const sample = audioData.samples[j];
      if (sample !== undefined) {
        if (sample < min) min = sample;
        if (sample > max) max = sample;
      }
    }
    
    peaks.push({ min, max });
  }
  
  return peaks;
}

/**
 * Generates RMS (root-mean-square) envelope for waveform.
 */
export function generateWaveformRMS(
  audioData: WaveformData,
  windowSamples: number,
  numPoints: number
): number[] {
  const samplesPerPoint = Math.floor(audioData.samples.length / numPoints);
  const rms: number[] = [];
  
  for (let i = 0; i < numPoints; i++) {
    const centerSample = i * samplesPerPoint + samplesPerPoint / 2;
    const start = Math.max(0, Math.floor(centerSample - windowSamples / 2));
    const end = Math.min(audioData.samples.length, Math.floor(centerSample + windowSamples / 2));
    
    let sumSquares = 0;
    let count = 0;
    
    for (let j = start; j < end; j++) {
      const sample = audioData.samples[j];
      if (sample !== undefined) {
        sumSquares += sample ** 2;
        count++;
      }
    }
    
    rms.push(count > 0 ? Math.sqrt(sumSquares / count) : 0);
  }
  
  return rms;
}

/**
 * Renders waveform SVG path for audio sync visualization.
 */
export function renderWaveformSVG(
  peaks: readonly { min: number; max: number }[],
  width: number,
  height: number,
  config: AudioSyncConfig = DEFAULT_AUDIO_SYNC_CONFIG
): string {
  if (peaks.length === 0) return '';
  
  const pointWidth = width / peaks.length;
  const centerY = height / 2;
  const scale = (height / 2) * 0.9; // 90% to leave margin
  
  const pathParts: string[] = [];
  
  // Draw top envelope
  const firstPeak = peaks[0];
  if (firstPeak) {
    pathParts.push(`M 0,${centerY - firstPeak.max * scale}`);
    for (let i = 1; i < peaks.length; i++) {
      const peak = peaks[i];
      if (peak) {
        const x = i * pointWidth;
        const y = centerY - peak.max * scale;
        pathParts.push(`L ${x},${y}`);
      }
    }
    
    // Draw bottom envelope (reverse)
    for (let i = peaks.length - 1; i >= 0; i--) {
      const peak = peaks[i];
      if (peak) {
        const x = i * pointWidth;
        const y = centerY - peak.min * scale;
        pathParts.push(`L ${x},${y}`);
      }
    }
  }
  
  pathParts.push('Z'); // Close path
  
  return `<path d="${pathParts.join(' ')}" fill="${config.waveformColor}" opacity="0.6" />`;
}

/**
 * Renders beat markers aligned with notation measures.
 */
export function renderBeatMarkers(
  measures: readonly NotationMeasure[],
  width: number,
  height: number,
  mapping: TickToTimeMapping,
  audioDuration: number,
  config: AudioSyncConfig = DEFAULT_AUDIO_SYNC_CONFIG
): string[] {
  const markers: string[] = [];
  let currentTick = 0 as Tick;
  
  for (const measure of measures) {
    const audioTime = tickToAudioTime(currentTick, mapping);
    
    if (audioTime >= 0 && audioTime <= audioDuration) {
      const x = (audioTime / audioDuration) * width;
      markers.push(
        `<line x1="${x}" y1="0" x2="${x}" y2="${height}" ` +
        `stroke="${config.beatMarkerColor}" stroke-width="1" opacity="0.5" />`
      );
    }
    
    // Advance to next measure
    const ts = measure.timeSignature;
    if (ts) {
      const ticksPerMeasure = (ts.numerator * mapping.ticksPerQuarter * 4) / ts.denominator;
      currentTick = (currentTick + ticksPerMeasure) as Tick;
    } else {
      // Default to 4/4 if no time signature
      currentTick = (currentTick + mapping.ticksPerQuarter * 4) as Tick;
    }
  }
  
  return markers;
}

/**
 * Renders playhead sync line.
 */
export function renderPlayheadSync(
  currentTick: Tick,
  width: number,
  height: number,
  mapping: TickToTimeMapping,
  audioDuration: number,
  config: AudioSyncConfig = DEFAULT_AUDIO_SYNC_CONFIG
): string {
  const audioTime = tickToAudioTime(currentTick, mapping);
  
  if (audioTime < 0 || audioTime > audioDuration) {
    return '';
  }
  
  const x = (audioTime / audioDuration) * width;
  
  return `<line x1="${x}" y1="0" x2="${x}" y2="${height}" ` +
         `stroke="${config.playheadColor}" stroke-width="2" />`;
}
