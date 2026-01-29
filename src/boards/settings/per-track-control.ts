/**
 * @fileoverview Per-Track Control Levels (Phase I: I021-I022)
 * 
 * Implements per-track control level management for hybrid boards.
 * Allows mixing manual, assisted, and directed tracks in the same project.
 * 
 * Implements:
 * - I021: Per-track control level indicators and management
 * - I022: Persistence of per-track control levels in board state
 * 
 * @module @cardplay/boards/settings/per-track-control
 */

import type { ControlLevel } from '../types';
import type { EventStreamId } from '../../state/types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Track identifier (can be stream ID or track name).
 */
export type TrackId = EventStreamId | string;

/**
 * Per-track control level setting.
 */
export interface TrackControlLevel {
  /** Track identifier */
  readonly trackId: TrackId;
  
  /** Control level for this track */
  readonly controlLevel: ControlLevel;
  
  /** When this was last set */
  readonly lastModified: number;
  
  /** User note about why this level was chosen */
  readonly note?: string;
}

/**
 * Per-track control levels map.
 */
export type PerTrackControlLevels = Map<TrackId, TrackControlLevel>;

/**
 * Per-track control levels configuration for a board.
 */
export interface TrackControlConfig {
  /** Board ID this config applies to */
  readonly boardId: string;
  
  /** Default control level for new tracks */
  readonly defaultLevel: ControlLevel;
  
  /** Per-track overrides */
  readonly trackLevels: PerTrackControlLevels;
  
  /** Whether to show indicators in UI */
  readonly showIndicators: boolean;
  
  /** Last updated timestamp */
  readonly lastUpdated: number;
}

// ============================================================================
// SERIALIZATION
// ============================================================================

/**
 * Serializable representation of track control config.
 */
export interface SerializedTrackControlConfig {
  boardId: string;
  defaultLevel: ControlLevel;
  trackLevels: Array<{
    trackId: string;
    controlLevel: ControlLevel;
    lastModified: number;
    note?: string;
  }>;
  showIndicators: boolean;
  lastUpdated: number;
}

/**
 * Serialize track control config for persistence.
 */
export function serializeTrackControlConfig(
  config: TrackControlConfig
): SerializedTrackControlConfig {
  return {
    boardId: config.boardId,
    defaultLevel: config.defaultLevel,
    trackLevels: Array.from(config.trackLevels.values()).map(tcl => ({
      trackId: tcl.trackId,
      controlLevel: tcl.controlLevel,
      lastModified: tcl.lastModified,
      ...(tcl.note !== undefined && { note: tcl.note })
    })),
    showIndicators: config.showIndicators,
    lastUpdated: config.lastUpdated
  };
}

/**
 * Deserialize track control config from storage.
 */
export function deserializeTrackControlConfig(
  data: SerializedTrackControlConfig
): TrackControlConfig {
  const trackLevels: PerTrackControlLevels = new Map();
  
  for (const tcl of data.trackLevels) {
    const trackLevel: TrackControlLevel = {
      trackId: tcl.trackId,
      controlLevel: tcl.controlLevel,
      lastModified: tcl.lastModified,
      ...(tcl.note !== undefined && { note: tcl.note })
    };
    trackLevels.set(tcl.trackId, trackLevel);
  }
  
  return {
    boardId: data.boardId,
    defaultLevel: data.defaultLevel,
    trackLevels,
    showIndicators: data.showIndicators,
    lastUpdated: data.lastUpdated
  };
}

// ============================================================================
// I021: PER-TRACK CONTROL LEVEL MANAGEMENT
// ============================================================================

/**
 * Get control level for a specific track.
 */
export function getTrackControlLevel(
  config: TrackControlConfig,
  trackId: TrackId
): ControlLevel {
  const trackLevel = config.trackLevels.get(trackId);
  return trackLevel ? trackLevel.controlLevel : config.defaultLevel;
}

/**
 * Set control level for a specific track.
 */
export function setTrackControlLevel(
  config: TrackControlConfig,
  trackId: TrackId,
  controlLevel: ControlLevel,
  note?: string
): TrackControlConfig {
  const newTrackLevels = new Map(config.trackLevels);
  
  const trackLevel: TrackControlLevel = {
    trackId,
    controlLevel,
    lastModified: Date.now(),
    ...(note !== undefined && { note })
  };
  
  newTrackLevels.set(trackId, trackLevel);
  
  return {
    ...config,
    trackLevels: newTrackLevels,
    lastUpdated: Date.now()
  };
}

/**
 * Remove control level override for a track (revert to default).
 */
export function clearTrackControlLevel(
  config: TrackControlConfig,
  trackId: TrackId
): TrackControlConfig {
  const newTrackLevels = new Map(config.trackLevels);
  newTrackLevels.delete(trackId);
  
  return {
    ...config,
    trackLevels: newTrackLevels,
    lastUpdated: Date.now()
  };
}

/**
 * Get all tracks with a specific control level.
 */
export function getTracksByControlLevel(
  config: TrackControlConfig,
  controlLevel: ControlLevel
): TrackId[] {
  return Array.from(config.trackLevels.entries())
    .filter(([_, tcl]) => tcl.controlLevel === controlLevel)
    .map(([trackId]) => trackId);
}

/**
 * Check if a track has a custom control level (not default).
 */
export function hasCustomControlLevel(
  config: TrackControlConfig,
  trackId: TrackId
): boolean {
  return config.trackLevels.has(trackId);
}

// ============================================================================
// CONTROL LEVEL INDICATORS
// ============================================================================

/**
 * Control level color mapping for UI indicators.
 */
export const CONTROL_LEVEL_COLORS: Record<ControlLevel, string> = {
  'full-manual': '#607D8B',        // Gray - full manual control
  'manual-with-hints': '#2196F3',  // Blue - manual with hints
  'assisted': '#4CAF50',           // Green - assisted with tools
  'directed': '#FF9800',           // Orange - AI-directed
  'generative': '#9C27B0',         // Purple - AI-generative
  'collaborative': '#00BCD4'       // Cyan - hybrid/collaborative
};

/**
 * Control level label mapping.
 */
export const CONTROL_LEVEL_LABELS: Record<ControlLevel, string> = {
  'full-manual': 'Manual',
  'manual-with-hints': 'Hints',
  'assisted': 'Assisted',
  'directed': 'Directed',
  'generative': 'Generative',
  'collaborative': 'Collaborative'
};

/**
 * Control level short label mapping (for compact UI).
 */
export const CONTROL_LEVEL_SHORT_LABELS: Record<ControlLevel, string> = {
  'full-manual': 'M',
  'manual-with-hints': 'H',
  'assisted': 'A',
  'directed': 'D',
  'generative': 'G',
  'collaborative': 'C'
};

/**
 * Get CSS style for a control level indicator.
 */
export function getControlLevelIndicatorStyle(controlLevel: ControlLevel): string {
  const color = CONTROL_LEVEL_COLORS[controlLevel];
  return `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px 8px;
    background: ${color}22;
    color: ${color};
    border: 1px solid ${color};
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `;
}

/**
 * Get control level color bar style (for track headers).
 */
export function getControlLevelColorBarStyle(controlLevel: ControlLevel): string {
  const color = CONTROL_LEVEL_COLORS[controlLevel];
  return `
    width: 4px;
    height: 100%;
    background: ${color};
    border-radius: 2px;
  `;
}

// ============================================================================
// I022: PERSISTENCE INTEGRATION
// ============================================================================

/**
 * Storage key for per-track control levels.
 */
export const TRACK_CONTROL_STORAGE_KEY = 'cardplay.track-control-levels.v1';

/**
 * Load track control config from localStorage.
 */
export function loadTrackControlConfig(boardId: string): TrackControlConfig | null {
  try {
    const stored = localStorage.getItem(`${TRACK_CONTROL_STORAGE_KEY}.${boardId}`);
    if (!stored) return null;
    
    const data = JSON.parse(stored) as SerializedTrackControlConfig;
    return deserializeTrackControlConfig(data);
  } catch (error) {
    console.error('Failed to load track control config:', error);
    return null;
  }
}

/**
 * Save track control config to localStorage.
 */
export function saveTrackControlConfig(config: TrackControlConfig): void {
  try {
    const serialized = serializeTrackControlConfig(config);
    const key = `${TRACK_CONTROL_STORAGE_KEY}.${config.boardId}`;
    localStorage.setItem(key, JSON.stringify(serialized));
  } catch (error) {
    console.error('Failed to save track control config:', error);
  }
}

/**
 * Clear track control config from storage.
 */
export function clearTrackControlConfig(boardId: string): void {
  try {
    const key = `${TRACK_CONTROL_STORAGE_KEY}.${boardId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear track control config:', error);
  }
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

/**
 * Create default track control config for a board.
 */
export function createDefaultTrackControlConfig(
  boardId: string,
  defaultLevel: ControlLevel
): TrackControlConfig {
  return {
    boardId,
    defaultLevel,
    trackLevels: new Map(),
    showIndicators: true,
    lastUpdated: Date.now()
  };
}

// ============================================================================
// EXPORTS
// ============================================================================
