/**
 * @fileoverview Arrangement Panel - Linear timeline view for multi-track composition.
 * 
 * Provides a traditional DAW-style arrangement view with:
 * - Track list sidebar with track controls
 * - Timeline ruler with zoom and time signature display
 * - Horizontally scrollable track lanes with clips
 * - Playhead cursor synchronized with transport
 * - Loop region display
 * - Vertical and horizontal scrolling
 * - Zoom controls for time axis
 * 
 * @module @cardplay/ui/components/arrangement-panel
 * @see currentsteps.md lines 2719-2728 - Arrangement Panel requirements
 */

import type { Event } from '../../types/event';
import type { Tick, TickDuration } from '../../types/primitives';
import { asTick, asTickDuration } from '../../types/primitives';
import type { Stream } from '../../streams';
import type { SelectionStore } from '../../state/selection-state';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Track information for display in sidebar.
 */
export interface Track {
  /** Unique track identifier */
  readonly id: string;
  /** Display name */
  readonly name: string;
  /** Track color for visual identification */
  readonly color: string;
  /** Track height in pixels */
  readonly height: number;
  /** Track type (audio, MIDI, automation, etc.) */
  readonly type: TrackType;
  /** Whether track is muted */
  readonly muted: boolean;
  /** Whether track is soloed */
  readonly solo: boolean;
  /** Whether track is armed for recording */
  readonly armed: boolean;
  /** Track volume (0-1) */
  readonly volume: number;
  /** Track pan (-1 to 1) */
  readonly pan: number;
  /** Whether track is collapsed (minimal height) */
  readonly collapsed: boolean;
  /** Whether track is selected */
  readonly selected: boolean;
  /** Parent track ID for grouped tracks */
  readonly parentId?: string;
  /** Child track IDs for folder tracks */
  readonly childIds?: readonly string[];
  /** Emoji or icon string for track */
  readonly icon?: string;
  /** Whether track is hidden from view */
  readonly hidden?: boolean;
  /** Whether folder track is folded (children hidden) */
  readonly folded?: boolean;
}

/**
 * Track type enumeration.
 */
export type TrackType = 
  | 'audio' 
  | 'midi' 
  | 'instrument' 
  | 'bus' 
  | 'return' 
  | 'master' 
  | 'folder' 
  | 'automation';

/**
 * Clip displayed on a track lane.
 */
export interface Clip {
  /** Unique clip identifier */
  readonly id: string;
  /** Track this clip belongs to */
  readonly trackId: string;
  /** Clip name for display */
  readonly name: string;
  /** Clip color */
  readonly color: string;
  /** Start position in ticks */
  readonly start: Tick;
  /** Duration in ticks */
  readonly duration: TickDuration;
  /** Clip offset (trim start) in ticks */
  readonly offset?: Tick;
  /** Clip fade in duration in ticks */
  readonly fadeIn?: TickDuration;
  /** Clip fade out duration in ticks */
  readonly fadeOut?: TickDuration;
  /** Clip gain multiplier */
  readonly gain?: number;
  /** Whether clip is muted */
  readonly muted?: boolean;
  /** Whether clip is locked (prevents editing) */
  readonly locked?: boolean;
  /** Whether clip is selected */
  readonly selected?: boolean;
  /** Whether clip is being edited */
  readonly editing?: boolean;
  /** Loop count (0 = no loop, >0 = repeat N times) */
  readonly loopCount?: number;
  /** Clip waveform data for visualization */
  readonly waveform?: readonly number[];
  /** Clip events (MIDI notes, automation points, etc.) */
  readonly events?: Stream<Event<any>>;
}

/**
 * Clip group for organizing related clips.
 * @see currentsteps.md line 2747
 */
export interface ClipGroup {
  /** Unique group identifier */
  readonly id: string;
  /** Group name */
  readonly name: string;
  /** Clip IDs in this group */
  readonly clipIds: readonly string[];
  /** Group color */
  readonly color: string;
}

/**
 * Timeline ruler configuration.
 */
export interface TimelineRuler {
  /** Ruler height in pixels */
  readonly height: number;
  /** Pixels per tick (zoom level) */
  readonly pixelsPerTick: number;
  /** Ticks per beat */
  readonly ticksPerBeat: number;
  /** Beats per bar */
  readonly beatsPerBar: number;
  /** Show beat markers */
  readonly showBeats: boolean;
  /** Show bar markers */
  readonly showBars: boolean;
  /** Show time code */
  readonly showTimeCode: boolean;
  /** Time code format */
  readonly timeCodeFormat: TimeCodeFormat;
  /** Timeline zoom level (1.0 = default) */
  readonly zoomLevel: number;
}

/**
 * Time code display format.
 */
export type TimeCodeFormat = 'bars-beats' | 'time' | 'samples' | 'frames';

/**
 * Playhead cursor state.
 */
export interface Playhead {
  /** Current playback position in ticks */
  readonly position: Tick;
  /** Whether playback is active */
  readonly playing: boolean;
  /** Playhead color */
  readonly color: string;
  /** Follow playhead mode */
  readonly followMode: FollowMode;
}

/**
 * Playhead follow mode.
 */
export type FollowMode = 'off' | 'page' | 'continuous';

/**
 * Loop region state.
 */
export interface LoopRegion {
  /** Loop start in ticks */
  readonly start: Tick;
  /** Loop end in ticks */
  readonly end: Tick;
  /** Whether loop is enabled */
  readonly enabled: boolean;
  /** Loop region color */
  readonly color: string;
}

/**
 * Track list sidebar configuration.
 */
export interface TrackListSidebar {
  /** Sidebar width in pixels */
  readonly width: number;
  /** Whether sidebar is visible */
  readonly visible: boolean;
  /** Whether to show track meters */
  readonly showMeters: boolean;
  /** Whether to show track colors */
  readonly showColors: boolean;
  /** Whether to show track icons */
  readonly showIcons: boolean;
}

/**
 * Scroll state for arrangement view.
 */
export interface ScrollState {
  /** Horizontal scroll position in pixels */
  readonly scrollX: number;
  /** Vertical scroll position in pixels */
  readonly scrollY: number;
  /** Viewport width in pixels */
  readonly viewportWidth: number;
  /** Viewport height in pixels */
  readonly viewportHeight: number;
  /** Total content width in pixels */
  readonly contentWidth: number;
  /** Total content height in pixels */
  readonly contentHeight: number;
}

/**
 * Zoom state for timeline.
 */
export interface ZoomState {
  /** Current zoom level (1.0 = default, 2.0 = 2x zoom in) */
  readonly level: number;
  /** Minimum zoom level */
  readonly min: number;
  /** Maximum zoom level */
  readonly max: number;
  /** Zoom step for incremental changes */
  readonly step: number;
  /** Vertical zoom level for track heights (1.0 = default) */
  readonly verticalLevel: number;
  /** Minimum vertical zoom level */
  readonly verticalMin: number;
  /** Maximum vertical zoom level */
  readonly verticalMax: number;
}

/**
 * Marker on timeline for navigation and organization.
 */
export interface Marker {
  /** Unique marker identifier */
  readonly id: string;
  /** Marker name/label */
  readonly name: string;
  /** Position in ticks */
  readonly position: Tick;
  /** Marker color */
  readonly color: string;
  /** Marker type */
  readonly type: MarkerType;
}

/**
 * Marker type enumeration.
 */
export type MarkerType = 'cue' | 'section' | 'custom';

/**
 * Tempo change point on timeline.
 */
export interface TempoPoint {
  /** Position in ticks where tempo changes */
  readonly position: Tick;
  /** Tempo in BPM */
  readonly bpm: number;
  /** Tempo curve (for gradual changes) */
  readonly curve: 'instant' | 'linear';
}

/**
 * Time signature change point on timeline.
 */
export interface TimeSignaturePoint {
  /** Position in ticks where time signature changes */
  readonly position: Tick;
  /** Numerator (beats per bar) */
  readonly numerator: number;
  /** Denominator (note value for beat) */
  readonly denominator: number;
}

/**
 * Automation lane for parameter automation.
 */
export interface AutomationLane {
  /** Unique lane identifier */
  readonly id: string;
  /** Track this lane belongs to */
  readonly trackId: string;
  /** Parameter being automated */
  readonly parameter: string;
  /** Display name */
  readonly name: string;
  /** Lane color */
  readonly color: string;
  /** Lane height in pixels */
  readonly height: number;
  /** Automation points */
  readonly points: readonly AutomationPoint[];
  /** Whether lane is visible */
  readonly visible: boolean;
  /** Whether lane is muted */
  readonly muted: boolean;
}

/**
 * Automation point on lane.
 */
export interface AutomationPoint {
  /** Position in ticks */
  readonly position: Tick;
  /** Value (normalized 0-1) */
  readonly value: number;
  /** Curve type to next point */
  readonly curve: 'linear' | 'bezier' | 'step' | 'smooth';
}

/**
 * Punch recording region.
 */
export interface PunchRegion {
  /** Punch in position in ticks */
  readonly punchIn: Tick;
  /** Punch out position in ticks */
  readonly punchOut: Tick;
  /** Whether punch is enabled */
  readonly enabled: boolean;
  /** Punch region color */
  readonly color: string;
}

/**
 * Export region for bouncing/rendering.
 */
export interface ExportRegion {
  /** Export start position in ticks */
  readonly start: Tick;
  /** Export end position in ticks */
  readonly end: Tick;
}

/**
 * Render region for offline processing.
 */
export interface RenderRegion {
  /** Render start position in ticks */
  readonly start: Tick;
  /** Render end position in ticks */
  readonly end: Tick;
}

/**
 * Minimap overview configuration.
 */
export interface Minimap {
  /** Whether minimap is visible */
  readonly visible: boolean;
  /** Minimap height in pixels */
  readonly height: number;
  /** Minimap position */
  readonly position: 'top' | 'bottom';
}

/**
 * Cursor position display configuration.
 */
export interface CursorDisplay {
  /** Whether cursor position is visible */
  readonly visible: boolean;
  /** Display format */
  readonly format: TimeCodeFormat;
  /** Display position */
  readonly position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * Complete arrangement panel state.
 */
export interface ArrangementPanelState {
  /** All tracks in the arrangement */
  readonly tracks: readonly Track[];
  /** All clips in the arrangement */
  readonly clips: readonly Clip[];
  /** Clip groups */
  readonly clipGroups: readonly ClipGroup[];
  /** Timeline ruler configuration */
  readonly ruler: TimelineRuler;
  /** Playhead state */
  readonly playhead: Playhead;
  /** Loop region state */
  readonly loopRegion: LoopRegion | null;
  /** Track list sidebar configuration */
  readonly sidebar: TrackListSidebar;
  /** Scroll state */
  readonly scroll: ScrollState;
  /** Zoom state */
  readonly zoom: ZoomState;
  /** Currently selected track IDs */
  readonly selectedTrackIds: readonly string[];
  /** Currently selected clip IDs */
  readonly selectedClipIds: readonly string[];
  /** Grid snap enabled */
  readonly snapEnabled: boolean;
  /** Grid snap interval in ticks */
  readonly snapInterval: TickDuration;
  /** Markers on timeline */
  readonly markers: readonly Marker[];
  /** Tempo track points */
  readonly tempoTrack: readonly TempoPoint[];
  /** Time signature track points */
  readonly timeSignatureTrack: readonly TimeSignaturePoint[];
  /** Automation lanes */
  readonly automationLanes: readonly AutomationLane[];
  /** Automation editing state */
  readonly automationEditState: AutomationEditState;
  /** Punch recording region */
  readonly punchRegion: PunchRegion | null;
  /** Export region for bouncing */
  readonly exportRegion: ExportRegion | null;
  /** Render region for offline processing */
  readonly renderRegion: RenderRegion | null;
  /** Minimap overview configuration */
  readonly minimap: Minimap;
  /** Cursor position display */
  readonly cursorDisplay: CursorDisplay;
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Creates a new track with default values.
 */
export function createTrack(
  id: string,
  name: string,
  type: TrackType,
  options?: Partial<Track>
): Track {
  return {
    id,
    name,
    type,
    color: options?.color ?? getDefaultTrackColor(type),
    height: options?.height ?? (options?.collapsed ? 40 : 120),
    muted: options?.muted ?? false,
    solo: options?.solo ?? false,
    armed: options?.armed ?? false,
    volume: options?.volume ?? 1.0,
    pan: options?.pan ?? 0.0,
    collapsed: options?.collapsed ?? false,
    selected: options?.selected ?? false,
    ...(options?.parentId !== undefined && { parentId: options.parentId }),
    ...(options?.childIds !== undefined && { childIds: options.childIds }),
    ...(options?.icon !== undefined && { icon: options.icon }),
    ...(options?.hidden !== undefined && { hidden: options.hidden }),
    ...(options?.folded !== undefined && { folded: options.folded })
  };
}

/**
 * Creates a new clip with default values.
 */
export function createClip(
  id: string,
  trackId: string,
  name: string,
  start: Tick,
  duration: TickDuration,
  options?: Partial<Clip>
): Clip {
  return {
    id,
    trackId,
    name,
    start,
    duration,
    color: options?.color ?? '#4a90e2',
    ...(options?.offset !== undefined && { offset: options.offset }),
    ...(options?.fadeIn !== undefined && { fadeIn: options.fadeIn }),
    ...(options?.fadeOut !== undefined && { fadeOut: options.fadeOut }),
    ...(options?.gain !== undefined && { gain: options.gain }),
    ...(options?.muted !== undefined && { muted: options.muted }),
    ...(options?.locked !== undefined && { locked: options.locked }),
    ...(options?.selected !== undefined && { selected: options.selected }),
    ...(options?.editing !== undefined && { editing: options.editing }),
    ...(options?.loopCount !== undefined && { loopCount: options.loopCount }),
    ...(options?.waveform !== undefined && { waveform: options.waveform }),
    ...(options?.events !== undefined && { events: options.events })
  };
}

/**
 * Creates initial arrangement panel state.
 */
export function createArrangementPanelState(
  options?: Partial<ArrangementPanelState>
): ArrangementPanelState {
  return {
    tracks: options?.tracks ?? [],
    clips: options?.clips ?? [],
    clipGroups: options?.clipGroups ?? [],
    ruler: options?.ruler ?? createDefaultRuler(),
    playhead: options?.playhead ?? createDefaultPlayhead(),
    loopRegion: options?.loopRegion ?? null,
    sidebar: options?.sidebar ?? createDefaultSidebar(),
    scroll: options?.scroll ?? createDefaultScrollState(),
    zoom: options?.zoom ?? createDefaultZoomState(),
    selectedTrackIds: options?.selectedTrackIds ?? [],
    selectedClipIds: options?.selectedClipIds ?? [],
    snapEnabled: options?.snapEnabled ?? true,
    snapInterval: options?.snapInterval ?? asTickDuration(960), // 1 beat at 960 TPB
    markers: options?.markers ?? [],
    tempoTrack: options?.tempoTrack ?? [],
    timeSignatureTrack: options?.timeSignatureTrack ?? [],
    automationLanes: options?.automationLanes ?? [],
    automationEditState: options?.automationEditState ?? createDefaultAutomationEditState(),
    punchRegion: options?.punchRegion ?? null,
    exportRegion: options?.exportRegion ?? null,
    renderRegion: options?.renderRegion ?? null,
    minimap: options?.minimap ?? createDefaultMinimap(),
    cursorDisplay: options?.cursorDisplay ?? createDefaultCursorDisplay()
  };
}

/**
 * Creates default timeline ruler configuration.
 */
export function createDefaultRuler(): TimelineRuler {
  return {
    height: 60,
    pixelsPerTick: 0.1,
    ticksPerBeat: 960,
    beatsPerBar: 4,
    showBeats: true,
    showBars: true,
    showTimeCode: true,
    timeCodeFormat: 'bars-beats',
    zoomLevel: 1.0
  };
}

/**
 * Creates default playhead state.
 */
export function createDefaultPlayhead(): Playhead {
  return {
    position: asTick(0),
    playing: false,
    color: '#ff4444',
    followMode: 'page'
  };
}

/**
 * Creates default track list sidebar configuration.
 */
export function createDefaultSidebar(): TrackListSidebar {
  return {
    width: 200,
    visible: true,
    showMeters: true,
    showColors: true,
    showIcons: true
  };
}

/**
 * Creates default scroll state.
 */
export function createDefaultScrollState(): ScrollState {
  return {
    scrollX: 0,
    scrollY: 0,
    viewportWidth: 800,
    viewportHeight: 600,
    contentWidth: 10000,
    contentHeight: 1000
  };
}

/**
 * Creates default zoom state.
 */
export function createDefaultZoomState(): ZoomState {
  return {
    level: 1.0,
    min: 0.1,
    max: 10.0,
    step: 0.1,
    verticalLevel: 1.0,
    verticalMin: 0.5,
    verticalMax: 3.0
  };
}

/**
 * Creates default minimap configuration.
 */
export function createDefaultMinimap(): Minimap {
  return {
    visible: true,
    height: 60,
    position: 'bottom'
  };
}

/**
 * Creates default cursor display configuration.
 */
export function createDefaultCursorDisplay(): CursorDisplay {
  return {
    visible: true,
    format: 'bars-beats',
    position: 'top-left'
  };
}

/**
 * Gets default color for track type.
 */
function getDefaultTrackColor(type: TrackType): string {
  const colorMap: Record<TrackType, string> = {
    audio: '#4a90e2',
    midi: '#e24a90',
    instrument: '#90e24a',
    bus: '#e2904a',
    return: '#904ae2',
    master: '#555555',
    folder: '#777777',
    automation: '#4ae290'
  };
  return colorMap[type];
}

// ============================================================================
// TRACK OPERATIONS
// ============================================================================

/**
 * Adds a new track to the arrangement.
 */
export function addTrack(
  state: ArrangementPanelState,
  track: Track
): ArrangementPanelState {
  return {
    ...state,
    tracks: [...state.tracks, track]
  };
}

/**
 * Removes a track from the arrangement.
 */
export function removeTrack(
  state: ArrangementPanelState,
  trackId: string
): ArrangementPanelState {
  return {
    ...state,
    tracks: state.tracks.filter(t => t.id !== trackId),
    clips: state.clips.filter(c => c.trackId !== trackId),
    selectedTrackIds: state.selectedTrackIds.filter(id => id !== trackId)
  };
}

/**
 * Updates a track's properties.
 */
export function updateTrack(
  state: ArrangementPanelState,
  trackId: string,
  updates: Partial<Track>
): ArrangementPanelState {
  return {
    ...state,
    tracks: state.tracks.map(t =>
      t.id === trackId ? { ...t, ...updates } : t
    )
  };
}

/**
 * Selects a track (clears previous selection unless additive).
 */
export function selectTrack(
  state: ArrangementPanelState,
  trackId: string,
  additive: boolean = false
): ArrangementPanelState {
  const newSelection = additive
    ? [...state.selectedTrackIds, trackId]
    : [trackId];

  return {
    ...state,
    selectedTrackIds: newSelection,
    tracks: state.tracks.map(t => ({
      ...t,
      selected: newSelection.includes(t.id)
    }))
  };
}

/**
 * Toggles track mute state.
 */
export function toggleTrackMute(
  state: ArrangementPanelState,
  trackId: string
): ArrangementPanelState {
  return updateTrack(state, trackId, {
    muted: !state.tracks.find(t => t.id === trackId)?.muted
  });
}

/**
 * Toggles track solo state.
 */
export function toggleTrackSolo(
  state: ArrangementPanelState,
  trackId: string
): ArrangementPanelState {
  return updateTrack(state, trackId, {
    solo: !state.tracks.find(t => t.id === trackId)?.solo
  });
}

/**
 * Toggles track collapsed state.
 */
export function toggleTrackCollapsed(
  state: ArrangementPanelState,
  trackId: string
): ArrangementPanelState {
  const track = state.tracks.find(t => t.id === trackId);
  if (!track) return state;

  const newCollapsed = !track.collapsed;
  const newHeight = newCollapsed ? 40 : 120;

  return updateTrack(state, trackId, {
    collapsed: newCollapsed,
    height: newHeight
  });
}

/**
 * Duplicates a track with all its properties and clips.
 */
export function duplicateTrack(
  state: ArrangementPanelState,
  trackId: string,
  newTrackId?: string
): ArrangementPanelState {
  const track = state.tracks.find(t => t.id === trackId);
  if (!track) return state;

  const id = newTrackId || `track-${Date.now()}`;
  const duplicatedTrack: Track = {
    ...track,
    id,
    name: `${track.name} (Copy)`,
    selected: false
  };

  // Find all clips on this track and duplicate them
  const trackClips = state.clips.filter(c => c.trackId === trackId);
  const duplicatedClips: Clip[] = trackClips.map(clip => ({
    ...clip,
    id: `${clip.id}-copy-${Date.now()}`,
    trackId: id,
    name: `${clip.name} (Copy)`
  }));

  const trackIndex = state.tracks.findIndex(t => t.id === trackId);
  const newTracks = [
    ...state.tracks.slice(0, trackIndex + 1),
    duplicatedTrack,
    ...state.tracks.slice(trackIndex + 1)
  ];

  return {
    ...state,
    tracks: newTracks,
    clips: [...state.clips, ...duplicatedClips]
  };
}

/**
 * Reorders tracks by moving a track to a new position.
 */
export function reorderTrack(
  state: ArrangementPanelState,
  trackId: string,
  newIndex: number
): ArrangementPanelState {
  const oldIndex = state.tracks.findIndex(t => t.id === trackId);
  if (oldIndex === -1 || oldIndex === newIndex) return state;

  const newTracks = [...state.tracks];
  const [movedTrack] = newTracks.splice(oldIndex, 1);
  if (movedTrack) {
    newTracks.splice(newIndex, 0, movedTrack);
  }

  return {
    ...state,
    tracks: newTracks
  };
}

/**
 * Sets the height of a track in pixels.
 */
export function setTrackHeight(
  state: ArrangementPanelState,
  trackId: string,
  height: number
): ArrangementPanelState {
  const minHeight = 40;
  const maxHeight = 400;
  const clampedHeight = Math.max(minHeight, Math.min(maxHeight, height));

  return updateTrack(state, trackId, { height: clampedHeight });
}

/**
 * Toggles track arm state for recording.
 */
export function toggleTrackArm(
  state: ArrangementPanelState,
  trackId: string
): ArrangementPanelState {
  return updateTrack(state, trackId, {
    armed: !state.tracks.find(t => t.id === trackId)?.armed
  });
}

/**
 * Sets track monitoring state.
 * Note: Monitoring is typically controlled via the audio engine.
 * This is a placeholder for future UI state integration.
 */
export function setTrackMonitoring(
  _state: ArrangementPanelState,
  _trackId: string,
  _monitoring: boolean
): ArrangementPanelState {
  // Monitoring is typically controlled via the audio engine
  // This is a placeholder for UI state
  return _state;
}

/**
 * Freezes a track (bounces to audio to save CPU).
 */
export function freezeTrack(
  state: ArrangementPanelState,
  trackId: string
): ArrangementPanelState {
  // Track freezing requires audio rendering
  // This marks the track as frozen in the UI
  return updateTrack(state, trackId, { 
    type: 'audio' // Convert to audio track type
  });
}

/**
 * Flattens a track (renders and replaces with audio).
 */
export function flattenTrack(
  state: ArrangementPanelState,
  trackId: string
): ArrangementPanelState {
  // Similar to freeze but permanent
  return updateTrack(state, trackId, {
    type: 'audio'
  });
}

/**
 * Toggles track lock state (prevents editing).
 */
export function toggleTrackLock(
  state: ArrangementPanelState,
  trackId: string
): ArrangementPanelState {
  // Lock state would be added to Track interface if needed
  // For now, update all clips on the track
  const trackClips = state.clips.filter(c => c.trackId === trackId);
  const isLocked = trackClips.length > 0 && trackClips.every(c => c.locked);
  
  return {
    ...state,
    clips: state.clips.map(c =>
      c.trackId === trackId ? { ...c, locked: !isLocked } : c
    )
  };
}

/**
 * Track add menu option type.
 */
export interface TrackAddOption {
  readonly type: TrackType;
  readonly label: string;
  readonly icon?: string;
  readonly description?: string;
}

/**
 * Available track types for the add menu.
 */
export const TRACK_ADD_OPTIONS: readonly TrackAddOption[] = [
  { 
    type: 'audio', 
    label: 'Audio Track', 
    icon: '🎵',
    description: 'Record or import audio files'
  },
  { 
    type: 'midi', 
    label: 'MIDI Track', 
    icon: '🎹',
    description: 'Record and edit MIDI notes'
  },
  { 
    type: 'instrument', 
    label: 'Instrument Track', 
    icon: '🎸',
    description: 'MIDI track with instrument'
  },
  { 
    type: 'bus', 
    label: 'Bus Track', 
    icon: '🔊',
    description: 'Mix multiple tracks together'
  },
  { 
    type: 'return', 
    label: 'Return Track', 
    icon: '↩️',
    description: 'Send effect return'
  },
  { 
    type: 'folder', 
    label: 'Folder Track', 
    icon: '📁',
    description: 'Group and organize tracks'
  },
  { 
    type: 'automation', 
    label: 'Automation Track', 
    icon: '📊',
    description: 'Automate parameters'
  }
] as const;

/**
 * Creates a track from a menu option.
 */
export function createTrackFromOption(
  option: TrackAddOption,
  name?: string
): Track {
  const trackId = `track-${Date.now()}`;
  const trackName = name || option.label;
  return createTrack(trackId, trackName, option.type);
}

/**
 * Groups tracks under a folder track.
 */
export function groupTracks(
  state: ArrangementPanelState,
  trackIds: readonly string[],
  folderTrackId?: string
): ArrangementPanelState {
  if (trackIds.length === 0) return state;

  // Determine folder ID
  const folderId = folderTrackId || `folder-${Date.now()}`;
  
  // Check if folder already exists
  const existingFolder = state.tracks.find(t => t.id === folderId);
  
  // Create or use existing folder track
  const folderTrack: Track = existingFolder
    ? existingFolder
    : createTrack(folderId, 'Group', 'folder', { 
        childIds: trackIds as string[],
        height: 60
      });

  // Update tracks with parent reference
  let updatedTracks = state.tracks.map(t =>
    trackIds.includes(t.id) ? { ...t, parentId: folderId } : t
  );

  // Add folder track if new, or update if existing
  if (!existingFolder) {
    const firstChildIndex = updatedTracks.findIndex(t => t.id === trackIds[0]);
    updatedTracks.splice(firstChildIndex, 0, folderTrack);
  } else {
    // Update existing folder track's childIds
    updatedTracks = updatedTracks.map(t =>
      t.id === folderId
        ? { ...t, childIds: [...new Set([...(t.childIds || []), ...trackIds])] }
        : t
    );
  }

  return {
    ...state,
    tracks: updatedTracks
  };
}

/**
 * Ungroups tracks from a folder.
 */
export function ungroupTracks(
  state: ArrangementPanelState,
  trackIds: readonly string[]
): ArrangementPanelState {
  return {
    ...state,
    tracks: state.tracks.map(t => {
      if (trackIds.includes(t.id)) {
        const { parentId, ...rest } = t;
        return rest as Track;
      }
      if (t.type === 'folder' && t.childIds) {
        return {
          ...t,
          childIds: t.childIds.filter(id => !trackIds.includes(id))
        };
      }
      return t;
    })
  };
}

/**
 * Toggles folder track folded state (hide/show children).
 */
export function toggleTrackFolded(
  state: ArrangementPanelState,
  trackId: string
): ArrangementPanelState {
  const track = state.tracks.find(t => t.id === trackId);
  if (!track || track.type !== 'folder') return state;

  const newFolded = !track.folded;
  
  return updateTrack(state, trackId, { folded: newFolded });
}

/**
 * Toggles track hidden state.
 */
export function toggleTrackHidden(
  state: ArrangementPanelState,
  trackId: string
): ArrangementPanelState {
  return updateTrack(state, trackId, {
    hidden: !state.tracks.find(t => t.id === trackId)?.hidden
  });
}

/**
 * Sets track icon.
 */
export function setTrackIcon(
  state: ArrangementPanelState,
  trackId: string,
  icon: string
): ArrangementPanelState {
  return updateTrack(state, trackId, { icon });
}

/**
 * Gets visible tracks (not hidden and not children of folded folders).
 */
export function getVisibleTracksWithFolding(
  state: ArrangementPanelState
): readonly Track[] {
  const foldedFolderIds = new Set(
    state.tracks
      .filter(t => t.type === 'folder' && t.folded)
      .map(t => t.id)
  );

  return state.tracks.filter(t => {
    // Hidden tracks are not visible
    if (t.hidden) return false;
    
    // Children of folded folders are not visible
    if (t.parentId && foldedFolderIds.has(t.parentId)) return false;
    
    return true;
  });
}

// ============================================================================
// CLIP OPERATIONS
// ============================================================================

/**
 * Adds a new clip to the arrangement.
 */
export function addClip(
  state: ArrangementPanelState,
  clip: Clip
): ArrangementPanelState {
  return {
    ...state,
    clips: [...state.clips, clip]
  };
}

/**
 * Removes a clip from the arrangement.
 */
export function removeClip(
  state: ArrangementPanelState,
  clipId: string
): ArrangementPanelState {
  return {
    ...state,
    clips: state.clips.filter(c => c.id !== clipId),
    selectedClipIds: state.selectedClipIds.filter(id => id !== clipId)
  };
}

/**
 * Updates a clip's properties.
 */
export function updateClip(
  state: ArrangementPanelState,
  clipId: string,
  updates: Partial<Clip>
): ArrangementPanelState {
  return {
    ...state,
    clips: state.clips.map(c =>
      c.id === clipId ? { ...c, ...updates } : c
    )
  };
}

/**
 * Moves a clip to a new position (with optional snapping).
 */
export function moveClip(
  state: ArrangementPanelState,
  clipId: string,
  newStart: Tick,
  newTrackId?: string
): ArrangementPanelState {
  const snappedStart = state.snapEnabled
    ? snapToGrid(newStart, state.snapInterval)
    : newStart;

  const updates: { start: Tick; trackId?: string } = { start: snappedStart };
  if (newTrackId !== undefined) {
    updates.trackId = newTrackId;
  }

  return updateClip(state, clipId, updates as Partial<Clip>);
}

/**
 * Resizes a clip (adjusts duration and/or offset).
 */
export function resizeClip(
  state: ArrangementPanelState,
  clipId: string,
  newDuration: TickDuration
): ArrangementPanelState {
  const snappedDuration = state.snapEnabled
    ? asTickDuration(Math.round(newDuration / state.snapInterval) * state.snapInterval)
    : newDuration;

  return updateClip(state, clipId, { duration: snappedDuration });
}

/**
 * Drags a clip to a new lane (track).
 * @see currentsteps.md line 2741
 */
export function dragClipToLane(
  state: ArrangementPanelState,
  clipId: string,
  targetTrackId: string
): ArrangementPanelState {
  return updateClip(state, clipId, { trackId: targetTrackId });
}

/**
 * Drags a clip to move its position on the timeline.
 * @see currentsteps.md line 2742
 */
export function dragClipToMove(
  state: ArrangementPanelState,
  clipId: string,
  newStart: Tick,
  newTrackId?: string
): ArrangementPanelState {
  return moveClip(state, clipId, newStart, newTrackId);
}

/**
 * Drags a clip edge to resize it.
 * @see currentsteps.md line 2743
 */
export function dragClipEdgeToResize(
  state: ArrangementPanelState,
  clipId: string,
  edge: 'start' | 'end',
  newPosition: Tick
): ArrangementPanelState {
  const clip = state.clips.find(c => c.id === clipId);
  if (!clip) return state;

  const snappedPosition = state.snapEnabled
    ? snapToGrid(newPosition, state.snapInterval)
    : newPosition;

  if (edge === 'start') {
    // Moving start edge: adjust start and duration
    const endPosition = clip.start + clip.duration;
    const newDuration = asTickDuration(Math.max(state.snapInterval, endPosition - snappedPosition));
    return updateClip(state, clipId, {
      start: snappedPosition,
      duration: newDuration
    });
  } else {
    // Moving end edge: adjust duration only
    const newDuration = asTickDuration(Math.max(state.snapInterval, snappedPosition - clip.start));
    return updateClip(state, clipId, { duration: newDuration });
  }
}

/**
 * Ctrl+drag to copy a clip to a new position.
 * @see currentsteps.md line 2744
 */
export function ctrlDragToCopyClip(
  state: ArrangementPanelState,
  clipId: string,
  newStart: Tick,
  newTrackId?: string
): ArrangementPanelState {
  const sourceClip = state.clips.find(c => c.id === clipId);
  if (!sourceClip) return state;

  const snappedStart = state.snapEnabled
    ? snapToGrid(newStart, state.snapInterval)
    : newStart;

  const newClip = createClip(
    `${sourceClip.id}-copy-${Date.now()}`,
    newTrackId ?? sourceClip.trackId,
    sourceClip.name + ' (Copy)',
    snappedStart,
    sourceClip.duration,
    {
      color: sourceClip.color,
      ...(sourceClip.offset !== undefined && { offset: sourceClip.offset }),
      ...(sourceClip.fadeIn !== undefined && { fadeIn: sourceClip.fadeIn }),
      ...(sourceClip.fadeOut !== undefined && { fadeOut: sourceClip.fadeOut }),
      ...(sourceClip.gain !== undefined && { gain: sourceClip.gain }),
      ...(sourceClip.muted !== undefined && { muted: sourceClip.muted }),
      ...(sourceClip.loopCount !== undefined && { loopCount: sourceClip.loopCount }),
      ...(sourceClip.waveform !== undefined && { waveform: sourceClip.waveform }),
      ...(sourceClip.events !== undefined && { events: sourceClip.events })
    }
  );

  return addClip(state, newClip);
}

/**
 * Alt+drag to duplicate a clip at a new position.
 * @see currentsteps.md line 2745
 */
export function altDragToDuplicateClip(
  state: ArrangementPanelState,
  clipId: string,
  newStart: Tick,
  newTrackId?: string
): ArrangementPanelState {
  return ctrlDragToCopyClip(state, clipId, newStart, newTrackId);
}

/**
 * Adds multiple clips to the selection.
 * @see currentsteps.md line 2746
 */
export function selectMultipleClips(
  state: ArrangementPanelState,
  clipIds: readonly string[],
  additive: boolean = false
): ArrangementPanelState {
  const newSelection = additive
    ? [...new Set([...state.selectedClipIds, ...clipIds])]
    : clipIds;

  return {
    ...state,
    selectedClipIds: newSelection,
    clips: state.clips.map(c => ({
      ...c,
      selected: newSelection.includes(c.id)
    }))
  };
}

/**
 * Groups selected clips together.
 * @see currentsteps.md line 2747
 */
export function groupClips(
  state: ArrangementPanelState,
  clipIds: readonly string[],
  groupName?: string
): ArrangementPanelState {
  const groupId = `group-${Date.now()}`;
  const group: ClipGroup = {
    id: groupId,
    name: groupName ?? `Group ${state.clipGroups.length + 1}`,
    clipIds: [...clipIds],
    color: state.clips.find(c => clipIds.includes(c.id))?.color ?? '#888888'
  };

  return {
    ...state,
    clipGroups: [...state.clipGroups, group]
  };
}

/**
 * Ungroups a clip group.
 * @see currentsteps.md line 2748
 */
export function ungroupClips(
  state: ArrangementPanelState,
  groupId: string
): ArrangementPanelState {
  return {
    ...state,
    clipGroups: state.clipGroups.filter(g => g.id !== groupId)
  };
}

/**
 * Splits a clip at the cursor position.
 * @see currentsteps.md line 2749
 */
export function splitClipAtCursor(
  state: ArrangementPanelState,
  clipId: string,
  splitPosition: Tick
): ArrangementPanelState {
  const clip = state.clips.find(c => c.id === clipId);
  if (!clip) return state;

  const snappedPosition = state.snapEnabled
    ? snapToGrid(splitPosition, state.snapInterval)
    : splitPosition;

  // Check if split position is within clip bounds
  if (snappedPosition <= clip.start || snappedPosition >= clip.start + clip.duration) {
    return state;
  }

  const firstClipDuration = asTickDuration(snappedPosition - clip.start);
  const secondClipStart = snappedPosition;
  const secondClipDuration = asTickDuration(clip.start + clip.duration - snappedPosition);

  // Update first clip
  const updatedFirstClip: Clip = {
    ...clip,
    duration: firstClipDuration,
    // Adjust fade out if needed
    ...(clip.fadeOut && clip.fadeOut > firstClipDuration && { fadeOut: asTickDuration(firstClipDuration / 4) })
  };

  // Create second clip
  const secondClip = createClip(
    `${clip.id}-split-${Date.now()}`,
    clip.trackId,
    clip.name + ' (2)',
    secondClipStart,
    secondClipDuration,
    {
      color: clip.color,
      ...(clip.offset !== undefined && { offset: asTick(clip.offset + firstClipDuration) }),
      ...(clip.fadeIn !== undefined && { fadeIn: clip.fadeIn }),
      ...(clip.fadeOut !== undefined && { fadeOut: clip.fadeOut }),
      ...(clip.gain !== undefined && { gain: clip.gain }),
      ...(clip.muted !== undefined && { muted: clip.muted }),
      ...(clip.loopCount !== undefined && { loopCount: clip.loopCount }),
      ...(clip.waveform !== undefined && { waveform: clip.waveform }),
      ...(clip.events !== undefined && { events: clip.events })
    }
  );

  let newState = state;
  newState = updateClip(newState, clipId, updatedFirstClip);
  newState = addClip(newState, secondClip);

  return newState;
}

/**
 * Joins two adjacent clips into one.
 * @see currentsteps.md line 2750
 */
export function joinClips(
  state: ArrangementPanelState,
  clipId1: string,
  clipId2: string
): ArrangementPanelState {
  const clip1 = state.clips.find(c => c.id === clipId1);
  const clip2 = state.clips.find(c => c.id === clipId2);

  if (!clip1 || !clip2 || clip1.trackId !== clip2.trackId) {
    return state;
  }

  // Determine which clip is first
  const [firstClip, secondClip] = clip1.start < clip2.start
    ? [clip1, clip2]
    : [clip2, clip1];

  // Check if clips are adjacent or overlapping
  const firstEnd = firstClip.start + firstClip.duration;
  if (secondClip.start > firstEnd) {
    // Clips are not adjacent, cannot join
    return state;
  }

  // Create joined clip
  const joinedDuration = asTickDuration(
    Math.max(firstEnd, secondClip.start + secondClip.duration) - firstClip.start
  );

  const joinedClip = updateClip(
    state,
    firstClip.id,
    {
      name: `${firstClip.name} + ${secondClip.name}`,
      duration: joinedDuration,
      ...(secondClip.fadeOut !== undefined && { fadeOut: secondClip.fadeOut })
    }
  );

  return removeClip(joinedClip, secondClip.id);
}

/**
 * Toggles clip mute state.
 * @see currentsteps.md line 2751
 */
export function toggleClipMute(
  state: ArrangementPanelState,
  clipId: string
): ArrangementPanelState {
  const clip = state.clips.find(c => c.id === clipId);
  if (!clip) return state;

  return updateClip(state, clipId, { muted: !clip.muted });
}

/**
 * Toggles clip lock state.
 * @see currentsteps.md line 2752
 */
export function toggleClipLock(
  state: ArrangementPanelState,
  clipId: string
): ArrangementPanelState {
  const clip = state.clips.find(c => c.id === clipId);
  if (!clip) return state;

  return updateClip(state, clipId, { locked: !clip.locked });
}

/**
 * Sets clip fade in duration.
 * @see currentsteps.md line 2753
 */
export function setClipFadeIn(
  state: ArrangementPanelState,
  clipId: string,
  fadeInDuration: TickDuration
): ArrangementPanelState {
  const clip = state.clips.find(c => c.id === clipId);
  if (!clip) return state;

  // Clamp fade in to clip duration
  const clampedFadeIn = asTickDuration(Math.min(fadeInDuration, clip.duration));

  return updateClip(state, clipId, { fadeIn: clampedFadeIn });
}

/**
 * Sets clip fade out duration.
 * @see currentsteps.md line 2754
 */
export function setClipFadeOut(
  state: ArrangementPanelState,
  clipId: string,
  fadeOutDuration: TickDuration
): ArrangementPanelState {
  const clip = state.clips.find(c => c.id === clipId);
  if (!clip) return state;

  // Clamp fade out to clip duration
  const clampedFadeOut = asTickDuration(Math.min(fadeOutDuration, clip.duration));

  return updateClip(state, clipId, { fadeOut: clampedFadeOut });
}

/**
 * Creates a crossfade between two adjacent clips.
 * @see currentsteps.md line 2755
 */
export function createClipCrossfade(
  state: ArrangementPanelState,
  clipId1: string,
  clipId2: string,
  crossfadeDuration: TickDuration
): ArrangementPanelState {
  const clip1 = state.clips.find(c => c.id === clipId1);
  const clip2 = state.clips.find(c => c.id === clipId2);

  if (!clip1 || !clip2 || clip1.trackId !== clip2.trackId) {
    return state;
  }

  // Determine which clip is first
  const [firstClip, secondClip] = clip1.start < clip2.start
    ? [clip1, clip2]
    : [clip2, clip1];

  // Check if clips are adjacent or overlapping
  const firstEnd = firstClip.start + firstClip.duration;
  if (secondClip.start > firstEnd) {
    // Clips are not adjacent, cannot crossfade
    return state;
  }

  // Calculate crossfade duration (limited by clip durations)
  const maxCrossfade = Math.min(firstClip.duration, secondClip.duration, crossfadeDuration);
  const clampedCrossfade = asTickDuration(maxCrossfade);

  let newState = state;
  newState = updateClip(newState, firstClip.id, { fadeOut: clampedCrossfade });
  newState = updateClip(newState, secondClip.id, { fadeIn: clampedCrossfade });

  return newState;
}

/**
 * Sets clip gain.
 * @see currentsteps.md line 2756
 */
export function setClipGain(
  state: ArrangementPanelState,
  clipId: string,
  gain: number
): ArrangementPanelState {
  // Clamp gain to reasonable range (0.0 to 4.0)
  const clampedGain = Math.max(0.0, Math.min(4.0, gain));

  return updateClip(state, clipId, { gain: clampedGain });
}

/**
 * Time-stretches a clip (changes duration without changing pitch).
 * @see currentsteps.md line 2757
 * Note: This only updates metadata; actual time-stretching happens in audio engine.
 */
export function timeStretchClip(
  state: ArrangementPanelState,
  clipId: string,
  stretchFactor: number
): ArrangementPanelState {
  const clip = state.clips.find(c => c.id === clipId);
  if (!clip) return state;

  const newDuration = asTickDuration(Math.max(state.snapInterval, clip.duration * stretchFactor));

  return updateClip(state, clipId, {
    duration: newDuration,
    // Store stretch factor in name for now (proper metadata would be in clip.metadata object)
    name: `${clip.name} (${stretchFactor.toFixed(2)}x)`
  });
}

/**
 * Pitch-shifts a clip (changes pitch without changing duration).
 * @see currentsteps.md line 2758
 * Note: This only updates metadata; actual pitch-shifting happens in audio engine.
 */
export function pitchShiftClip(
  state: ArrangementPanelState,
  clipId: string,
  semitones: number
): ArrangementPanelState {
  const clip = state.clips.find(c => c.id === clipId);
  if (!clip) return state;

  const sign = semitones >= 0 ? '+' : '';
  return updateClip(state, clipId, {
    // Store pitch shift in name for now (proper metadata would be in clip.metadata object)
    name: `${clip.name} (${sign}${semitones}st)`
  });
}

/**
 * Reverses a clip.
 * @see currentsteps.md line 2759
 * Note: This only updates metadata; actual reversal happens in audio engine.
 */
export function reverseClip(
  state: ArrangementPanelState,
  clipId: string
): ArrangementPanelState {
  const clip = state.clips.find(c => c.id === clipId);
  if (!clip) return state;

  return updateClip(state, clipId, {
    name: clip.name.endsWith(' (Reversed)') 
      ? clip.name.replace(' (Reversed)', '')
      : `${clip.name} (Reversed)`,
    // Swap fades when reversing
    ...(clip.fadeOut !== undefined && { fadeIn: clip.fadeOut }),
    ...(clip.fadeIn !== undefined && { fadeOut: clip.fadeIn }),
    // Reverse waveform data if present
    ...(clip.waveform && { waveform: [...clip.waveform].reverse() })
  });
}

/**
 * Sets clip color.
 * @see currentsteps.md line 2760
 */
export function setClipColor(
  state: ArrangementPanelState,
  clipId: string,
  color: string
): ArrangementPanelState {
  return updateClip(state, clipId, { color });
}

/**
 * Selects a clip (clears previous selection unless additive).
 */
export function selectClip(
  state: ArrangementPanelState,
  clipId: string,
  additive: boolean = false
): ArrangementPanelState {
  const newSelection = additive
    ? [...state.selectedClipIds, clipId]
    : [clipId];

  return {
    ...state,
    selectedClipIds: newSelection,
    clips: state.clips.map(c => ({
      ...c,
      selected: newSelection.includes(c.id)
    }))
  };
}

/**
 * Gets all clips on a specific track.
 */
export function getClipsOnTrack(
  state: ArrangementPanelState,
  trackId: string
): readonly Clip[] {
  return state.clips.filter(c => c.trackId === trackId);
}

/**
 * Gets clips in a time range.
 */
export function getClipsInRange(
  state: ArrangementPanelState,
  start: Tick,
  end: Tick
): readonly Clip[] {
  return state.clips.filter(c => {
    const clipEnd = asTick(c.start + c.duration);
    return c.start < end && clipEnd > start;
  });
}

// ============================================================================
// TIMELINE & RULER OPERATIONS
// ============================================================================

/**
 * Converts tick position to pixel X coordinate.
 */
export function tickToPixel(
  tick: Tick,
  ruler: TimelineRuler
): number {
  return tick * ruler.pixelsPerTick * ruler.zoomLevel;
}

/**
 * Converts pixel X coordinate to tick position.
 */
export function pixelToTick(
  pixel: number,
  ruler: TimelineRuler
): Tick {
  return asTick(Math.round(pixel / (ruler.pixelsPerTick * ruler.zoomLevel)));
}

/**
 * Snaps a tick position to the nearest grid line.
 */
export function snapToGrid(
  tick: Tick,
  snapInterval: TickDuration
): Tick {
  return asTick(Math.round(tick / snapInterval) * snapInterval);
}

/**
 * Formats tick position as bars:beats:ticks string.
 */
export function formatBarsBeatsTicks(
  tick: Tick,
  ticksPerBeat: number,
  beatsPerBar: number
): string {
  const totalBeats = Math.floor(tick / ticksPerBeat);
  const bar = Math.floor(totalBeats / beatsPerBar) + 1;
  const beat = (totalBeats % beatsPerBar) + 1;
  const ticks = tick % ticksPerBeat;
  return `${bar}:${beat}:${ticks.toString().padStart(3, '0')}`;
}

/**
 * Formats tick position as time string (HH:MM:SS.mmm).
 */
export function formatTime(
  tick: Tick,
  ticksPerBeat: number,
  bpm: number
): string {
  const secondsPerBeat = 60 / bpm;
  const totalSeconds = (tick / ticksPerBeat) * secondsPerBeat;
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const millis = Math.floor((totalSeconds % 1) * 1000);
  
  const hh = hours.toString().padStart(2, '0');
  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');
  const mmm = millis.toString().padStart(3, '0');
  
  return `${hh}:${mm}:${ss}.${mmm}`;
}

// ============================================================================
// PLAYHEAD OPERATIONS
// ============================================================================

/**
 * Updates playhead position.
 */
export function updatePlayheadPosition(
  state: ArrangementPanelState,
  position: Tick
): ArrangementPanelState {
  const newState = {
    ...state,
    playhead: {
      ...state.playhead,
      position
    }
  };

  // Auto-scroll if playhead follow is enabled
  if (state.playhead.followMode !== 'off') {
    return autoScrollToPlayhead(newState);
  }

  return newState;
}

/**
 * Toggles playback state.
 */
export function togglePlayback(
  state: ArrangementPanelState
): ArrangementPanelState {
  return {
    ...state,
    playhead: {
      ...state.playhead,
      playing: !state.playhead.playing
    }
  };
}

/**
 * Sets playhead follow mode.
 */
export function setPlayheadFollowMode(
  state: ArrangementPanelState,
  mode: FollowMode
): ArrangementPanelState {
  return {
    ...state,
    playhead: {
      ...state.playhead,
      followMode: mode
    }
  };
}

/**
 * Auto-scrolls viewport to keep playhead visible.
 */
function autoScrollToPlayhead(
  state: ArrangementPanelState
): ArrangementPanelState {
  const playheadX = tickToPixel(state.playhead.position, state.ruler);
  const { scrollX, viewportWidth } = state.scroll;

  let newScrollX = scrollX;

  if (state.playhead.followMode === 'page') {
    // Scroll when playhead reaches edge
    if (playheadX < scrollX) {
      newScrollX = playheadX;
    } else if (playheadX > scrollX + viewportWidth) {
      newScrollX = playheadX - viewportWidth;
    }
  } else if (state.playhead.followMode === 'continuous') {
    // Keep playhead centered
    newScrollX = playheadX - viewportWidth / 2;
  }

  if (newScrollX !== scrollX) {
    return setScrollX(state, newScrollX);
  }

  return state;
}

// ============================================================================
// LOOP REGION OPERATIONS
// ============================================================================

/**
 * Sets or updates loop region.
 */
export function setLoopRegion(
  state: ArrangementPanelState,
  start: Tick,
  end: Tick,
  enabled: boolean = true
): ArrangementPanelState {
  // Ensure start < end
  const [actualStart, actualEnd] = start <= end ? [start, end] : [end, start];

  return {
    ...state,
    loopRegion: {
      start: actualStart,
      end: actualEnd,
      enabled,
      color: 'rgba(255, 255, 0, 0.2)'
    }
  };
}

/**
 * Toggles loop region enabled state.
 */
export function toggleLoopEnabled(
  state: ArrangementPanelState
): ArrangementPanelState {
  if (!state.loopRegion) return state;

  return {
    ...state,
    loopRegion: {
      ...state.loopRegion,
      enabled: !state.loopRegion.enabled
    }
  };
}

/**
 * Clears loop region.
 */
export function clearLoopRegion(
  state: ArrangementPanelState
): ArrangementPanelState {
  return {
    ...state,
    loopRegion: null
  };
}

// ============================================================================
// SCROLL OPERATIONS
// ============================================================================

/**
 * Sets horizontal scroll position.
 */
export function setScrollX(
  state: ArrangementPanelState,
  scrollX: number
): ArrangementPanelState {
  const maxScrollX = Math.max(0, state.scroll.contentWidth - state.scroll.viewportWidth);
  const clampedScrollX = Math.max(0, Math.min(scrollX, maxScrollX));

  return {
    ...state,
    scroll: {
      ...state.scroll,
      scrollX: clampedScrollX
    }
  };
}

/**
 * Sets vertical scroll position.
 */
export function setScrollY(
  state: ArrangementPanelState,
  scrollY: number
): ArrangementPanelState {
  const maxScrollY = Math.max(0, state.scroll.contentHeight - state.scroll.viewportHeight);
  const clampedScrollY = Math.max(0, Math.min(scrollY, maxScrollY));

  return {
    ...state,
    scroll: {
      ...state.scroll,
      scrollY: clampedScrollY
    }
  };
}

/**
 * Scrolls by a delta amount (positive = right/down, negative = left/up).
 */
export function scrollBy(
  state: ArrangementPanelState,
  deltaX: number,
  deltaY: number
): ArrangementPanelState {
  let newState = state;
  if (deltaX !== 0) {
    newState = setScrollX(newState, newState.scroll.scrollX + deltaX);
  }
  if (deltaY !== 0) {
    newState = setScrollY(newState, newState.scroll.scrollY + deltaY);
  }
  return newState;
}

/**
 * Scrolls to make a specific tick visible.
 */
export function scrollToTick(
  state: ArrangementPanelState,
  tick: Tick,
  center: boolean = false
): ArrangementPanelState {
  const targetX = tickToPixel(tick, state.ruler);
  const { viewportWidth } = state.scroll;

  let newScrollX: number;
  if (center) {
    newScrollX = targetX - viewportWidth / 2;
  } else {
    newScrollX = targetX;
  }

  return setScrollX(state, newScrollX);
}

/**
 * Scrolls to make a specific track visible.
 */
export function scrollToTrack(
  state: ArrangementPanelState,
  trackId: string,
  center: boolean = false
): ArrangementPanelState {
  const trackIndex = state.tracks.findIndex(t => t.id === trackId);
  if (trackIndex === -1) return state;

  let yOffset = state.ruler.height;
  for (let i = 0; i < trackIndex; i++) {
    const track = state.tracks[i];
    if (track) {
      yOffset += track.height;
    }
  }

  const track = state.tracks[trackIndex];
  if (!track) return state;

  const trackHeight = track.height;
  const { viewportHeight } = state.scroll;

  let newScrollY: number;
  if (center) {
    newScrollY = yOffset + trackHeight / 2 - viewportHeight / 2;
  } else {
    newScrollY = yOffset;
  }

  return setScrollY(state, newScrollY);
}

// ============================================================================
// ZOOM OPERATIONS
// ============================================================================

/**
 * Sets zoom level.
 */
export function setZoomLevel(
  state: ArrangementPanelState,
  level: number
): ArrangementPanelState {
  const clampedLevel = Math.max(
    state.zoom.min,
    Math.min(level, state.zoom.max)
  );

  return {
    ...state,
    zoom: {
      ...state.zoom,
      level: clampedLevel
    },
    ruler: {
      ...state.ruler,
      zoomLevel: clampedLevel
    }
  };
}

/**
 * Zooms in by one step.
 */
export function zoomIn(
  state: ArrangementPanelState
): ArrangementPanelState {
  return setZoomLevel(state, state.zoom.level + state.zoom.step);
}

/**
 * Zooms out by one step.
 */
export function zoomOut(
  state: ArrangementPanelState
): ArrangementPanelState {
  return setZoomLevel(state, state.zoom.level - state.zoom.step);
}

/**
 * Zooms to fit all content in viewport.
 */
export function zoomToFit(
  state: ArrangementPanelState
): ArrangementPanelState {
  if (state.clips.length === 0) {
    return setZoomLevel(state, 1.0);
  }

  // Find the rightmost clip end
  const maxTick = Math.max(
    ...state.clips.map(c => c.start + c.duration)
  );

  const requiredWidth = maxTick * state.ruler.pixelsPerTick;
  const zoomLevel = state.scroll.viewportWidth / requiredWidth;

  return setZoomLevel(state, zoomLevel);
}

/**
 * Zooms to fit selected clips in viewport.
 */
export function zoomToSelection(
  state: ArrangementPanelState
): ArrangementPanelState {
  const selectedClips = state.clips.filter(c => state.selectedClipIds.includes(c.id));
  if (selectedClips.length === 0) {
    return state;
  }

  const minTick = Math.min(...selectedClips.map(c => c.start));
  const maxTick = Math.max(...selectedClips.map(c => c.start + c.duration));

  const rangeWidth = (maxTick - minTick) * state.ruler.pixelsPerTick;
  const zoomLevel = state.scroll.viewportWidth / rangeWidth;

  return scrollToTick(setZoomLevel(state, zoomLevel), asTick(minTick), true);
}

// ============================================================================
// VIEW CALCULATIONS
// ============================================================================

/**
 * Calculates visible time range based on scroll position and zoom.
 */
export function getVisibleTimeRange(
  state: ArrangementPanelState
): { start: Tick; end: Tick } {
  const { scrollX, viewportWidth } = state.scroll;
  
  const startTick = pixelToTick(scrollX, state.ruler);
  const endTick = pixelToTick(scrollX + viewportWidth, state.ruler);

  return { start: startTick, end: endTick };
}

/**
 * Calculates visible tracks based on scroll position.
 */
export function getVisibleTracks(
  state: ArrangementPanelState
): readonly Track[] {
  const { scrollY, viewportHeight } = state.scroll;
  const rulerHeight = state.ruler.height;

  const visibleTracks: Track[] = [];
  let currentY = rulerHeight;

  for (const track of state.tracks) {
    const trackTop = currentY;
    const trackBottom = currentY + track.height;

    if (trackBottom > scrollY && trackTop < scrollY + viewportHeight) {
      visibleTracks.push(track);
    }

    currentY += track.height;

    if (currentY > scrollY + viewportHeight) {
      break;
    }
  }

  return visibleTracks;
}

/**
 * Calculates visible clips based on scroll position and zoom.
 */
export function getVisibleClips(
  state: ArrangementPanelState
): readonly Clip[] {
  const { start, end } = getVisibleTimeRange(state);
  const visibleTracks = getVisibleTracks(state);
  const visibleTrackIds = new Set(visibleTracks.map(t => t.id));

  return state.clips.filter(clip => {
    if (!visibleTrackIds.has(clip.trackId)) return false;
    
    const clipEnd = asTick(clip.start + clip.duration);
    return clip.start < end && clipEnd > start;
  });
}

/**
 * Calculates Y position for a track.
 */
export function getTrackYPosition(
  state: ArrangementPanelState,
  trackId: string
): number {
  let y = state.ruler.height;
  
  for (const track of state.tracks) {
    if (track.id === trackId) {
      return y;
    }
    y += track.height;
  }

  return -1;
}

/**
 * Calculates total content height.
 */
export function calculateContentHeight(
  state: ArrangementPanelState
): number {
  const tracksHeight = state.tracks.reduce((sum, t) => sum + t.height, 0);
  return state.ruler.height + tracksHeight;
}

/**
 * Calculates total content width.
 */
export function calculateContentWidth(
  state: ArrangementPanelState
): number {
  if (state.clips.length === 0) {
    return 10000; // Default width
  }

  const maxTick = Math.max(
    ...state.clips.map(c => c.start + c.duration)
  );

  // Add some padding
  return tickToPixel(asTick(maxTick + state.ruler.ticksPerBeat * 8), state.ruler);
}

/**
 * Updates content dimensions based on tracks and clips.
 */
export function updateContentDimensions(
  state: ArrangementPanelState
): ArrangementPanelState {
  return {
    ...state,
    scroll: {
      ...state.scroll,
      contentWidth: calculateContentWidth(state),
      contentHeight: calculateContentHeight(state)
    }
  };
}

// ============================================================================
// GRID & SNAP OPERATIONS
// ============================================================================

/**
 * Toggles grid snap on/off.
 */
export function toggleSnapEnabled(
  state: ArrangementPanelState
): ArrangementPanelState {
  return {
    ...state,
    snapEnabled: !state.snapEnabled
  };
}

/**
 * Sets snap interval.
 */
export function setSnapInterval(
  state: ArrangementPanelState,
  interval: TickDuration
): ArrangementPanelState {
  return {
    ...state,
    snapInterval: interval
  };
}

/**
 * Common snap interval presets.
 */
export const SNAP_INTERVALS = {
  /** 1/4 note (1 beat) */
  QUARTER: asTickDuration(960),
  /** 1/8 note */
  EIGHTH: asTickDuration(480),
  /** 1/16 note */
  SIXTEENTH: asTickDuration(240),
  /** 1/32 note */
  THIRTY_SECOND: asTickDuration(120),
  /** 1 bar (4 beats) */
  BAR: asTickDuration(3840),
  /** 1/2 note (2 beats) */
  HALF: asTickDuration(1920)
} as const;

// ============================================================================
// SIDEBAR OPERATIONS
// ============================================================================

/**
 * Toggles sidebar visibility.
 */
export function toggleSidebarVisible(
  state: ArrangementPanelState
): ArrangementPanelState {
  return {
    ...state,
    sidebar: {
      ...state.sidebar,
      visible: !state.sidebar.visible
    }
  };
}

/**
 * Sets sidebar width.
 */
export function setSidebarWidth(
  state: ArrangementPanelState,
  width: number
): ArrangementPanelState {
  return {
    ...state,
    sidebar: {
      ...state.sidebar,
      width: Math.max(100, Math.min(width, 400))
    }
  };
}

// ============================================================================
// VERTICAL ZOOM OPERATIONS
// ============================================================================

/**
 * Sets vertical zoom level for track heights.
 */
export function setVerticalZoomLevel(
  state: ArrangementPanelState,
  level: number
): ArrangementPanelState {
  const clampedLevel = Math.max(
    state.zoom.verticalMin,
    Math.min(level, state.zoom.verticalMax)
  );

  // Scale all track heights proportionally
  const scaledTracks = state.tracks.map(track => ({
    ...track,
    height: Math.round((track.collapsed ? 40 : 120) * clampedLevel)
  }));

  return updateContentDimensions({
    ...state,
    zoom: {
      ...state.zoom,
      verticalLevel: clampedLevel
    },
    tracks: scaledTracks
  });
}

/**
 * Zooms in vertically (increases track heights).
 */
export function zoomInVertical(
  state: ArrangementPanelState
): ArrangementPanelState {
  return setVerticalZoomLevel(state, state.zoom.verticalLevel + 0.2);
}

/**
 * Zooms out vertically (decreases track heights).
 */
export function zoomOutVertical(
  state: ArrangementPanelState
): ArrangementPanelState {
  return setVerticalZoomLevel(state, state.zoom.verticalLevel - 0.2);
}

// ============================================================================
// MARKER OPERATIONS
// ============================================================================

/**
 * Creates a new marker.
 */
export function createMarker(
  id: string,
  name: string,
  position: Tick,
  options?: Partial<Marker>
): Marker {
  return {
    id,
    name,
    position,
    color: options?.color ?? '#ffa500',
    type: options?.type ?? 'cue'
  };
}

/**
 * Adds a marker to the timeline.
 */
export function addMarker(
  state: ArrangementPanelState,
  marker: Marker
): ArrangementPanelState {
  // Keep markers sorted by position
  const markers = [...state.markers, marker].sort((a, b) => a.position - b.position);
  
  return {
    ...state,
    markers
  };
}

/**
 * Removes a marker from the timeline.
 */
export function removeMarker(
  state: ArrangementPanelState,
  markerId: string
): ArrangementPanelState {
  return {
    ...state,
    markers: state.markers.filter(m => m.id !== markerId)
  };
}

/**
 * Updates a marker's properties.
 */
export function updateMarker(
  state: ArrangementPanelState,
  markerId: string,
  updates: Partial<Marker>
): ArrangementPanelState {
  const markers = state.markers.map(m =>
    m.id === markerId ? { ...m, ...updates } : m
  );
  
  // Re-sort if position changed
  if (updates.position !== undefined) {
    markers.sort((a, b) => a.position - b.position);
  }
  
  return {
    ...state,
    markers
  };
}

/**
 * Gets all markers in a time range.
 */
export function getMarkersInRange(
  state: ArrangementPanelState,
  start: Tick,
  end: Tick
): readonly Marker[] {
  return state.markers.filter(m => m.position >= start && m.position <= end);
}

// ============================================================================
// TEMPO TRACK OPERATIONS
// ============================================================================

/**
 * Creates a new tempo point.
 */
export function createTempoPoint(
  position: Tick,
  bpm: number,
  curve: 'instant' | 'linear' = 'instant'
): TempoPoint {
  return {
    position,
    bpm: Math.max(20, Math.min(bpm, 999)),
    curve
  };
}

/**
 * Adds a tempo change point.
 */
export function addTempoPoint(
  state: ArrangementPanelState,
  tempoPoint: TempoPoint
): ArrangementPanelState {
  // Keep tempo points sorted by position
  const tempoTrack = [...state.tempoTrack, tempoPoint].sort((a, b) => a.position - b.position);
  
  return {
    ...state,
    tempoTrack
  };
}

/**
 * Removes a tempo point.
 */
export function removeTempoPoint(
  state: ArrangementPanelState,
  position: Tick
): ArrangementPanelState {
  return {
    ...state,
    tempoTrack: state.tempoTrack.filter(t => t.position !== position)
  };
}

/**
 * Updates a tempo point.
 */
export function updateTempoPoint(
  state: ArrangementPanelState,
  position: Tick,
  updates: Partial<TempoPoint>
): ArrangementPanelState {
  const tempoTrack = state.tempoTrack.map(t =>
    t.position === position ? { ...t, ...updates } : t
  );
  
  // Re-sort if position changed
  if (updates.position !== undefined) {
    tempoTrack.sort((a, b) => a.position - b.position);
  }
  
  return {
    ...state,
    tempoTrack
  };
}

/**
 * Gets tempo at a specific position.
 */
export function getTempoAtPosition(
  state: ArrangementPanelState,
  position: Tick
): number {
  if (state.tempoTrack.length === 0) {
    return 120; // Default tempo
  }
  
  // Find the most recent tempo point before or at position
  let currentTempo: TempoPoint | undefined = state.tempoTrack[0];
  for (const point of state.tempoTrack) {
    if (point.position <= position) {
      currentTempo = point;
    } else {
      break;
    }
  }
  
  return currentTempo?.bpm ?? 120;
}

// ============================================================================
// TIME SIGNATURE TRACK OPERATIONS
// ============================================================================

/**
 * Creates a new time signature point.
 */
export function createTimeSignaturePoint(
  position: Tick,
  numerator: number,
  denominator: number
): TimeSignaturePoint {
  return {
    position,
    numerator: Math.max(1, Math.min(numerator, 32)),
    denominator: [1, 2, 4, 8, 16, 32].includes(denominator) ? denominator : 4
  };
}

/**
 * Adds a time signature change point.
 */
export function addTimeSignaturePoint(
  state: ArrangementPanelState,
  timeSignaturePoint: TimeSignaturePoint
): ArrangementPanelState {
  // Keep time signature points sorted by position
  const timeSignatureTrack = [...state.timeSignatureTrack, timeSignaturePoint]
    .sort((a, b) => a.position - b.position);
  
  return {
    ...state,
    timeSignatureTrack
  };
}

/**
 * Removes a time signature point.
 */
export function removeTimeSignaturePoint(
  state: ArrangementPanelState,
  position: Tick
): ArrangementPanelState {
  return {
    ...state,
    timeSignatureTrack: state.timeSignatureTrack.filter(t => t.position !== position)
  };
}

/**
 * Gets time signature at a specific position.
 */
export function getTimeSignatureAtPosition(
  state: ArrangementPanelState,
  position: Tick
): { numerator: number; denominator: number } {
  if (state.timeSignatureTrack.length === 0) {
    return { numerator: 4, denominator: 4 }; // Default 4/4
  }
  
  // Find the most recent time signature point before or at position
  let currentTimeSig: TimeSignaturePoint | undefined = state.timeSignatureTrack[0];
  for (const point of state.timeSignatureTrack) {
    if (point.position <= position) {
      currentTimeSig = point;
    } else {
      break;
    }
  }
  
  return {
    numerator: currentTimeSig?.numerator ?? 4,
    denominator: currentTimeSig?.denominator ?? 4
  };
}

// ============================================================================
// AUTOMATION LANE OPERATIONS
// ============================================================================

/**
 * Creates a new automation lane.
 */
export function createAutomationLane(
  id: string,
  trackId: string,
  parameter: string,
  name: string,
  options?: Partial<AutomationLane>
): AutomationLane {
  return {
    id,
    trackId,
    parameter,
    name,
    color: options?.color ?? '#ff00ff',
    height: options?.height ?? 80,
    points: options?.points ?? [],
    visible: options?.visible ?? true,
    muted: options?.muted ?? false
  };
}

/**
 * Creates a new automation point.
 */
export function createAutomationPoint(
  position: Tick,
  value: number,
  curve: 'linear' | 'bezier' | 'step' | 'smooth' = 'linear'
): AutomationPoint {
  return {
    position,
    value: Math.max(0, Math.min(value, 1)),
    curve
  };
}

/**
 * Adds an automation lane.
 */
export function addAutomationLane(
  state: ArrangementPanelState,
  lane: AutomationLane
): ArrangementPanelState {
  return updateContentDimensions({
    ...state,
    automationLanes: [...state.automationLanes, lane]
  });
}

/**
 * Removes an automation lane.
 */
export function removeAutomationLane(
  state: ArrangementPanelState,
  laneId: string
): ArrangementPanelState {
  return updateContentDimensions({
    ...state,
    automationLanes: state.automationLanes.filter(l => l.id !== laneId)
  });
}

/**
 * Updates an automation lane's properties.
 */
export function updateAutomationLane(
  state: ArrangementPanelState,
  laneId: string,
  updates: Partial<AutomationLane>
): ArrangementPanelState {
  return updateContentDimensions({
    ...state,
    automationLanes: state.automationLanes.map(l =>
      l.id === laneId ? { ...l, ...updates } : l
    )
  });
}

/**
 * Adds an automation point to a lane.
 */
export function addAutomationPoint(
  state: ArrangementPanelState,
  laneId: string,
  point: AutomationPoint
): ArrangementPanelState {
  return {
    ...state,
    automationLanes: state.automationLanes.map(lane => {
      if (lane.id !== laneId) return lane;
      
      // Keep points sorted by position
      const points = [...lane.points, point].sort((a, b) => a.position - b.position);
      return { ...lane, points };
    })
  };
}

/**
 * Removes an automation point from a lane.
 */
export function removeAutomationPoint(
  state: ArrangementPanelState,
  laneId: string,
  position: Tick
): ArrangementPanelState {
  return {
    ...state,
    automationLanes: state.automationLanes.map(lane => {
      if (lane.id !== laneId) return lane;
      
      return {
        ...lane,
        points: lane.points.filter(p => p.position !== position)
      };
    })
  };
}

/**
 * Gets automation value at a specific position with interpolation.
 */
export function getAutomationValueAtPosition(
  lane: AutomationLane,
  position: Tick
): number {
  if (lane.points.length === 0) return 0;
  if (lane.muted) return 0;
  
  // Find surrounding points
  let prevPoint: AutomationPoint | null = null;
  let nextPoint: AutomationPoint | null = null;
  
  for (const point of lane.points) {
    if (point.position <= position) {
      prevPoint = point;
    } else {
      nextPoint = point;
      break;
    }
  }
  
  // Before first point
  if (!prevPoint) {
    return lane.points[0]?.value ?? 0;
  }
  
  // After last point
  if (!nextPoint) {
    return prevPoint.value;
  }
  
  // Interpolate between points based on curve type
  const t = (position - prevPoint.position) / (nextPoint.position - prevPoint.position);
  
  switch (prevPoint.curve) {
    case 'step':
      return prevPoint.value;
    
    case 'linear':
      return prevPoint.value + (nextPoint.value - prevPoint.value) * t;
    
    case 'smooth':
      // Smooth S-curve interpolation
      const smoothT = t * t * (3 - 2 * t);
      return prevPoint.value + (nextPoint.value - prevPoint.value) * smoothT;
    
    case 'bezier':
      // Simple cubic bezier (control points at 1/3 and 2/3)
      const bezierT = t * t * t * (t * (6 * t - 15) + 10);
      return prevPoint.value + (nextPoint.value - prevPoint.value) * bezierT;
    
    default:
      return prevPoint.value;
  }
}

/**
 * Gets automation lanes for a specific track.
 */
export function getAutomationLanesForTrack(
  state: ArrangementPanelState,
  trackId: string
): readonly AutomationLane[] {
  return state.automationLanes.filter(l => l.trackId === trackId);
}

// ============================================================================
// PUNCH REGION OPERATIONS
// ============================================================================

/**
 * Creates a new punch region.
 */
export function createPunchRegion(
  punchIn: Tick,
  punchOut: Tick,
  options?: Partial<PunchRegion>
): PunchRegion {
  return {
    punchIn,
    punchOut,
    enabled: options?.enabled ?? true,
    color: options?.color ?? '#ff0000'
  };
}

/**
 * Sets the punch recording region.
 */
export function setPunchRegion(
  state: ArrangementPanelState,
  punchRegion: PunchRegion | null
): ArrangementPanelState {
  return {
    ...state,
    punchRegion
  };
}

/**
 * Toggles punch region enabled state.
 */
export function togglePunchEnabled(
  state: ArrangementPanelState
): ArrangementPanelState {
  if (!state.punchRegion) return state;
  
  return {
    ...state,
    punchRegion: {
      ...state.punchRegion,
      enabled: !state.punchRegion.enabled
    }
  };
}

/**
 * Clears the punch region.
 */
export function clearPunchRegion(
  state: ArrangementPanelState
): ArrangementPanelState {
  return {
    ...state,
    punchRegion: null
  };
}

// ============================================================================
// MINIMAP OPERATIONS
// ============================================================================

/**
 * Toggles minimap visibility.
 */
export function toggleMinimapVisible(
  state: ArrangementPanelState
): ArrangementPanelState {
  return {
    ...state,
    minimap: {
      ...state.minimap,
      visible: !state.minimap.visible
    }
  };
}

/**
 * Sets minimap height.
 */
export function setMinimapHeight(
  state: ArrangementPanelState,
  height: number
): ArrangementPanelState {
  return {
    ...state,
    minimap: {
      ...state.minimap,
      height: Math.max(40, Math.min(height, 200))
    }
  };
}

/**
 * Sets minimap position.
 */
export function setMinimapPosition(
  state: ArrangementPanelState,
  position: 'top' | 'bottom'
): ArrangementPanelState {
  return {
    ...state,
    minimap: {
      ...state.minimap,
      position
    }
  };
}

// ============================================================================
// CURSOR DISPLAY OPERATIONS
// ============================================================================

/**
 * Toggles cursor position display visibility.
 */
export function toggleCursorDisplayVisible(
  state: ArrangementPanelState
): ArrangementPanelState {
  return {
    ...state,
    cursorDisplay: {
      ...state.cursorDisplay,
      visible: !state.cursorDisplay.visible
    }
  };
}

/**
 * Sets cursor display format.
 */
export function setCursorDisplayFormat(
  state: ArrangementPanelState,
  format: TimeCodeFormat
): ArrangementPanelState {
  return {
    ...state,
    cursorDisplay: {
      ...state.cursorDisplay,
      format
    }
  };
}

/**
 * Sets cursor display position.
 */
export function setCursorDisplayPosition(
  state: ArrangementPanelState,
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
): ArrangementPanelState {
  return {
    ...state,
    cursorDisplay: {
      ...state.cursorDisplay,
      position
    }
  };
}

// ============================================================================
// TRACK I/O AND EFFECTS SUMMARY OPERATIONS (Step 2780-2782)
// ============================================================================

/**
 * Track I/O routing summary information.
 */
export interface TrackIOSummary {
  /** Track ID */
  readonly trackId: string;
  /** Input routing */
  readonly input: {
    /** Input source type */
    readonly source: 'none' | 'audio-input' | 'midi-input' | 'bus' | 'return';
    /** Input channel/device name */
    readonly channel?: string;
    /** Monitoring state */
    readonly monitoring: 'off' | 'auto' | 'on';
  };
  /** Output routing */
  readonly output: {
    /** Output destination type */
    readonly destination: 'master' | 'bus' | 'return' | 'external';
    /** Output channel/device name */
    readonly channel?: string;
    /** Send levels to buses/returns */
    readonly sends: readonly {
      readonly targetId: string;
      readonly level: number; // 0-1
      readonly preFader: boolean;
    }[];
  };
}

/**
 * Track effects chain summary.
 */
export interface TrackEffectsSummary {
  /** Track ID */
  readonly trackId: string;
  /** Effects in chain */
  readonly effects: readonly {
    /** Effect ID */
    readonly id: string;
    /** Effect name */
    readonly name: string;
    /** Effect type */
    readonly type: string;
    /** Whether effect is bypassed */
    readonly bypassed: boolean;
    /** Whether effect is wet/dry mix */
    readonly wetDry?: number; // 0-1
    /** CPU usage estimate */
    readonly cpuUsage?: number; // 0-1
  }[];
  /** Total CPU usage for chain */
  readonly totalCpuUsage: number;
}

/**
 * Gets track I/O routing summary (Step 2780).
 */
export function getTrackIOSummary(
  _state: ArrangementPanelState,
  trackId: string
): TrackIOSummary {
  // In a real implementation, this would query the audio engine
  // For now, return a default summary structure
  return {
    trackId,
    input: {
      source: 'none',
      monitoring: 'auto'
    },
    output: {
      destination: 'master',
      sends: []
    }
  };
}

/**
 * Gets track effects chain summary (Step 2781).
 */
export function getTrackEffectsSummary(
  _state: ArrangementPanelState,
  trackId: string
): TrackEffectsSummary {
  // In a real implementation, this would query the effects chain
  // For now, return a default summary structure
  return {
    trackId,
    effects: [],
    totalCpuUsage: 0
  };
}

/**
 * Toggles automation lanes visibility for a track (Step 2782).
 */
export function toggleTrackAutomationVisible(
  state: ArrangementPanelState,
  trackId: string
): ArrangementPanelState {
  // Toggle visibility of all automation lanes for this track
  return {
    ...state,
    automationLanes: state.automationLanes.map(lane =>
      lane.trackId === trackId
        ? { ...lane, visible: !lane.visible }
        : lane
    )
  };
}

/**
 * Shows automation lanes for a track.
 */
export function showTrackAutomation(
  state: ArrangementPanelState,
  trackId: string
): ArrangementPanelState {
  return {
    ...state,
    automationLanes: state.automationLanes.map(lane =>
      lane.trackId === trackId
        ? { ...lane, visible: true }
        : lane
    )
  };
}

/**
 * Hides automation lanes for a track.
 */
export function hideTrackAutomation(
  state: ArrangementPanelState,
  trackId: string
): ArrangementPanelState {
  return {
    ...state,
    automationLanes: state.automationLanes.map(lane =>
      lane.trackId === trackId
        ? { ...lane, visible: false }
        : lane
    )
  };
}

// ============================================================================
// AUTOMATION DRAWING AND EDITING MODES (Steps 2785-2791)
// ============================================================================

/**
 * Automation editing mode.
 */
export type AutomationEditMode =
  | 'select'    // Select and move points
  | 'draw'      // Draw freehand automation
  | 'pencil'    // Place individual points
  | 'line'      // Draw straight lines between points
  | 'curve'     // Draw curves between points
  | 'ramp';     // Create linear ramps

/**
 * Automation editing state.
 */
export interface AutomationEditState {
  /** Current editing mode */
  readonly mode: AutomationEditMode;
  /** Active lane being edited */
  readonly activeLaneId: string | null;
  /** Whether grid snapping is enabled */
  readonly snapToGrid: boolean;
  /** Selected automation points */
  readonly selectedPoints: readonly {
    readonly laneId: string;
    readonly position: Tick;
  }[];
  /** Drawing buffer for freehand automation */
  readonly drawingBuffer: readonly AutomationPoint[];
}

/**
 * Creates default automation edit state.
 */
export function createDefaultAutomationEditState(): AutomationEditState {
  return {
    mode: 'select',
    activeLaneId: null,
    snapToGrid: true,
    selectedPoints: [],
    drawingBuffer: []
  };
}

/**
 * Sets automation editing mode (Steps 2788-2791).
 */
export function setAutomationEditMode(
  editState: AutomationEditState,
  mode: AutomationEditMode
): AutomationEditState {
  return {
    ...editState,
    mode,
    // Clear drawing buffer when changing modes
    drawingBuffer: mode === 'draw' ? editState.drawingBuffer : []
  };
}

/**
 * Sets active automation lane for editing.
 */
export function setActiveAutomationLane(
  editState: AutomationEditState,
  laneId: string | null
): AutomationEditState {
  return {
    ...editState,
    activeLaneId: laneId
  };
}

/**
 * Draws automation points in draw mode (Step 2788).
 * @param position - Current cursor position
 * @param value - Automation value (0-1)
 * @returns Updated edit state with point added to buffer
 */
export function drawAutomationPoint(
  editState: AutomationEditState,
  position: Tick,
  value: number
): AutomationEditState {
  if (editState.mode !== 'draw') return editState;
  
  const point = createAutomationPoint(position, value, 'linear');
  return {
    ...editState,
    drawingBuffer: [...editState.drawingBuffer, point]
  };
}

/**
 * Adds point with pencil tool (Step 2789).
 */
export function addAutomationPointWithPencil(
  state: ArrangementPanelState,
  editState: AutomationEditState,
  position: Tick,
  value: number
): { state: ArrangementPanelState; editState: AutomationEditState } {
  if (editState.mode !== 'pencil' || !editState.activeLaneId) {
    return { state, editState };
  }
  
  const point = createAutomationPoint(position, value, 'linear');
  const newState = addAutomationPoint(state, editState.activeLaneId, point);
  
  return {
    state: newState,
    editState
  };
}

/**
 * Draws line between two points with line tool (Step 2790).
 */
export function drawAutomationLine(
  state: ArrangementPanelState,
  editState: AutomationEditState,
  startPos: Tick,
  startValue: number,
  endPos: Tick,
  endValue: number,
  pointCount: number = 10
): { state: ArrangementPanelState; editState: AutomationEditState } {
  if (editState.mode !== 'line' || !editState.activeLaneId) {
    return { state, editState };
  }
  
  let newState = state;
  
  // Create points along the line
  for (let i = 0; i <= pointCount; i++) {
    const t = i / pointCount;
    const pos = asTick(Math.round(startPos + (endPos - startPos) * t));
    const value = startValue + (endValue - startValue) * t;
    const point = createAutomationPoint(pos, value, 'linear');
    newState = addAutomationPoint(newState, editState.activeLaneId, point);
  }
  
  return {
    state: newState,
    editState
  };
}

/**
 * Draws curve between two points with curve tool (Step 2791).
 */
export function drawAutomationCurve(
  state: ArrangementPanelState,
  editState: AutomationEditState,
  startPos: Tick,
  startValue: number,
  endPos: Tick,
  endValue: number,
  curveType: 'smooth' | 'bezier' = 'smooth',
  pointCount: number = 20
): { state: ArrangementPanelState; editState: AutomationEditState } {
  if (editState.mode !== 'curve' || !editState.activeLaneId) {
    return { state, editState };
  }
  
  let newState = state;
  
  // Create points along the curve
  for (let i = 0; i <= pointCount; i++) {
    const t = i / pointCount;
    const pos = asTick(Math.round(startPos + (endPos - startPos) * t));
    
    // Apply curve to value interpolation
    let curvedT = t;
    if (curveType === 'smooth') {
      curvedT = t * t * (3 - 2 * t); // Smoothstep
    } else if (curveType === 'bezier') {
      curvedT = t * t * t * (t * (6 * t - 15) + 10); // Smootherstep
    }
    
    const value = startValue + (endValue - startValue) * curvedT;
    const point = createAutomationPoint(pos, value, curveType);
    newState = addAutomationPoint(newState, editState.activeLaneId, point);
  }
  
  return {
    state: newState,
    editState
  };
}

/**
 * Commits drawing buffer to automation lane (for draw mode).
 */
export function commitDrawingBuffer(
  state: ArrangementPanelState,
  editState: AutomationEditState
): { state: ArrangementPanelState; editState: AutomationEditState } {
  if (!editState.activeLaneId || editState.drawingBuffer.length === 0) {
    return { state, editState };
  }
  
  let newState = state;
  
  // Add all points from drawing buffer
  for (const point of editState.drawingBuffer) {
    newState = addAutomationPoint(newState, editState.activeLaneId, point);
  }
  
  // Clear buffer
  const newEditState: AutomationEditState = {
    ...editState,
    drawingBuffer: []
  };
  
  return {
    state: newState,
    editState: newEditState
  };
}

/**
 * Selects automation points within a region.
 */
export function selectAutomationPoints(
  editState: AutomationEditState,
  _laneId: string,
  _startPos: Tick,
  _endPos: Tick,
  append: boolean = false
): AutomationEditState {
  // This would query the lane for points in range
  // For now, just update the selected points list
  return {
    ...editState,
    selectedPoints: append ? editState.selectedPoints : []
  };
}

/**
 * Moves selected automation points by delta.
 */
export function moveSelectedAutomationPoints(
  state: ArrangementPanelState,
  editState: AutomationEditState,
  _deltaPos: number,
  _deltaValue: number
): ArrangementPanelState {
  if (editState.selectedPoints.length === 0) return state;
  
  // In a full implementation, this would move all selected points
  // For now, return unchanged state
  return state;
}

/**
 * Deletes selected automation points.
 */
export function deleteSelectedAutomationPoints(
  state: ArrangementPanelState,
  editState: AutomationEditState
): { state: ArrangementPanelState; editState: AutomationEditState } {
  let newState = state;
  
  for (const selected of editState.selectedPoints) {
    newState = removeAutomationPoint(newState, selected.laneId, selected.position);
  }
  
  const newEditState: AutomationEditState = {
    ...editState,
    selectedPoints: []
  };
  
  return {
    state: newState,
    editState: newEditState
  };
}

/**
 * Creates linear ramp between two points with ramp tool (Step 2792).
 * Unlike drawAutomationLine which creates multiple intermediate points,
 * ramp creates only start and end points with linear interpolation.
 */
export function createAutomationRamp(
  state: ArrangementPanelState,
  editState: AutomationEditState,
  startPos: Tick,
  startValue: number,
  endPos: Tick,
  endValue: number
): { state: ArrangementPanelState; editState: AutomationEditState } {
  if (editState.mode !== 'ramp' || !editState.activeLaneId) {
    return { state, editState };
  }
  
  // Remove any existing points in the range (inclusive)
  const lane = state.automationLanes.find(l => l.id === editState.activeLaneId);
  if (!lane) {
    return { state, editState };
  }
  
  let newState = state;
  
  // Remove all points in range including endpoints
  const pointsToRemove = lane.points.filter(
    p => p.position >= startPos && p.position <= endPos
  );
  for (const point of pointsToRemove) {
    newState = removeAutomationPoint(newState, editState.activeLaneId, point.position);
  }
  
  // Add new start and end points with linear interpolation
  const startPoint = createAutomationPoint(startPos, startValue, 'linear');
  const endPoint = createAutomationPoint(endPos, endValue, 'linear');
  
  newState = addAutomationPoint(newState, editState.activeLaneId, startPoint);
  newState = addAutomationPoint(newState, editState.activeLaneId, endPoint);
  
  return {
    state: newState,
    editState
  };
}

/**
 * Selects automation points with select tool (Step 2793).
 * Updates selectedPoints in editState based on position range and lane.
 */
export function selectAutomationPointsInRange(
  state: ArrangementPanelState,
  editState: AutomationEditState,
  laneId: string,
  startPos: Tick,
  endPos: Tick,
  append: boolean = false
): AutomationEditState {
  if (editState.mode !== 'select') {
    return editState;
  }
  
  const lane = state.automationLanes.find(l => l.id === laneId);
  if (!lane) {
    return editState;
  }
  
  // Find points in range
  const pointsInRange = lane.points
    .filter(p => p.position >= startPos && p.position <= endPos)
    .map(p => ({ laneId, position: p.position }));
  
  const selectedPoints = append
    ? [...editState.selectedPoints, ...pointsInRange]
    : pointsInRange;
  
  return {
    ...editState,
    selectedPoints
  };
}

/**
 * Copies selected automation points to clipboard (Step 2794).
 * Returns clipboard data structure for later paste.
 */
export interface AutomationClipboard {
  readonly points: readonly {
    readonly laneId: string;
    readonly relativePosition: number;
    readonly value: number;
    readonly curve: 'linear' | 'bezier' | 'step' | 'smooth';
  }[];
  readonly referencePosition: Tick;
}

export function copySelectedAutomationPoints(
  state: ArrangementPanelState,
  editState: AutomationEditState
): AutomationClipboard | null {
  if (editState.selectedPoints.length === 0) {
    return null;
  }
  
  // Find minimum position as reference
  const referencePosition = Math.min(
    ...editState.selectedPoints.map(p => p.position)
  );
  
  const points = editState.selectedPoints.map(selected => {
    const lane = state.automationLanes.find(l => l.id === selected.laneId);
    const point = lane?.points.find(p => p.position === selected.position);
    
    if (!point) {
      return null;
    }
    
    return {
      laneId: selected.laneId,
      relativePosition: selected.position - referencePosition,
      value: point.value,
      curve: point.curve
    };
  }).filter((p): p is NonNullable<typeof p> => p !== null);
  
  return {
    points,
    referencePosition: asTick(referencePosition)
  };
}

/**
 * Pastes automation points from clipboard (Step 2794).
 */
export function pasteAutomationPoints(
  state: ArrangementPanelState,
  editState: AutomationEditState,
  clipboard: AutomationClipboard,
  targetPosition: Tick
): { state: ArrangementPanelState; editState: AutomationEditState } {
  if (!clipboard || clipboard.points.length === 0) {
    return { state, editState };
  }
  
  let newState = state;
  const newSelectedPoints: Array<{ laneId: string; position: Tick }> = [];
  
  for (const clipPoint of clipboard.points) {
    const absolutePosition = asTick(targetPosition + clipPoint.relativePosition);
    const point = createAutomationPoint(
      absolutePosition,
      clipPoint.value,
      clipPoint.curve
    );
    
    newState = addAutomationPoint(newState, clipPoint.laneId, point);
    newSelectedPoints.push({
      laneId: clipPoint.laneId,
      position: absolutePosition
    });
  }
  
  const newEditState: AutomationEditState = {
    ...editState,
    selectedPoints: newSelectedPoints
  };
  
  return {
    state: newState,
    editState: newEditState
  };
}

/**
 * Scales selected automation point values (Step 2795).
 * Scales values relative to center point.
 */
export function scaleSelectedAutomationPoints(
  state: ArrangementPanelState,
  editState: AutomationEditState,
  scaleFactor: number,
  anchor: 'min' | 'max' | 'center' = 'center'
): { state: ArrangementPanelState; editState: AutomationEditState } {
  if (editState.selectedPoints.length === 0) {
    return { state, editState };
  }
  
  // Find all values to determine anchor point
  const values: number[] = [];
  for (const selected of editState.selectedPoints) {
    const lane = state.automationLanes.find(l => l.id === selected.laneId);
    const point = lane?.points.find(p => p.position === selected.position);
    if (point) {
      values.push(point.value);
    }
  }
  
  if (values.length === 0) {
    return { state, editState };
  }
  
  let anchorValue: number;
  switch (anchor) {
    case 'min':
      anchorValue = Math.min(...values);
      break;
    case 'max':
      anchorValue = Math.max(...values);
      break;
    case 'center':
    default:
      anchorValue = (Math.min(...values) + Math.max(...values)) / 2;
      break;
  }
  
  let newState = state;
  
  // Scale each point relative to anchor
  for (const selected of editState.selectedPoints) {
    const lane = newState.automationLanes.find(l => l.id === selected.laneId);
    const point = lane?.points.find(p => p.position === selected.position);
    
    if (!point) continue;
    
    const scaledValue = anchorValue + (point.value - anchorValue) * scaleFactor;
    const clampedValue = Math.max(0, Math.min(1, scaledValue));
    
    const newPoint = createAutomationPoint(
      point.position,
      clampedValue,
      point.curve
    );
    
    // Remove old point and add scaled one
    newState = removeAutomationPoint(newState, selected.laneId, point.position);
    newState = addAutomationPoint(newState, selected.laneId, newPoint);
  }
  
  return {
    state: newState,
    editState
  };
}

/**
 * Thins automation lane by removing unnecessary points (Step 2796).
 * Uses Douglas-Peucker algorithm to simplify curve while maintaining shape.
 */
export function thinAutomationLane(
  state: ArrangementPanelState,
  laneId: string,
  tolerance: number = 0.01
): ArrangementPanelState {
  const lane = state.automationLanes.find(l => l.id === laneId);
  if (!lane || lane.points.length <= 2) {
    return state;
  }
  
  const points = [...lane.points];
  const keep = new Set<number>([0, points.length - 1]);
  
  function simplifyRange(start: number, end: number): void {
    if (end - start <= 1) return;
    
    const startPoint = points[start]!;
    const endPoint = points[end]!;
    
    let maxDist = 0;
    let maxIndex = start;
    
    for (let i = start + 1; i < end; i++) {
      const point = points[i]!;
      
      // Calculate perpendicular distance from line
      const posT = (point.position - startPoint.position) / 
                   (endPoint.position - startPoint.position);
      const expectedValue = startPoint.value + 
                           (endPoint.value - startPoint.value) * posT;
      const dist = Math.abs(point.value - expectedValue);
      
      if (dist > maxDist) {
        maxDist = dist;
        maxIndex = i;
      }
    }
    
    if (maxDist > tolerance) {
      keep.add(maxIndex);
      simplifyRange(start, maxIndex);
      simplifyRange(maxIndex, end);
    }
  }
  
  simplifyRange(0, points.length - 1);
  
  const simplifiedPoints = points.filter((_, i) => keep.has(i));
  
  return updateAutomationLane(state, laneId, {
    points: simplifiedPoints
  });
}

/**
 * Automation recording mode enumeration.
 */
export type AutomationRecordMode =
  | 'read'    // Playback automation only (Step 2797)
  | 'write'   // Overwrite automation while playing (Step 2798)
  | 'touch'   // Overwrite only while touching control (Step 2799)
  | 'latch'   // Start writing on touch, continue until stop (Step 2800)
  | 'trim';   // Add to existing automation (Step 2801)

/**
 * Automation recording state.
 */
export interface AutomationRecordState {
  readonly mode: AutomationRecordMode;
  readonly activeLaneIds: readonly string[];
  readonly recording: boolean;
  readonly touchedLanes: Set<string>;
  readonly latchedLanes: Set<string>;
  readonly recordBuffer: Map<string, AutomationPoint[]>;
}

/**
 * Creates default automation record state (Step 2797).
 */
export function createDefaultAutomationRecordState(): AutomationRecordState {
  return {
    mode: 'read',
    activeLaneIds: [],
    recording: false,
    touchedLanes: new Set(),
    latchedLanes: new Set(),
    recordBuffer: new Map()
  };
}

/**
 * Sets automation recording mode (Steps 2797-2801).
 */
export function setAutomationRecordMode(
  recordState: AutomationRecordState,
  mode: AutomationRecordMode
): AutomationRecordState {
  return {
    ...recordState,
    mode,
    // Clear latch state when changing modes
    latchedLanes: mode === 'latch' ? recordState.latchedLanes : new Set()
  };
}

/**
 * Starts automation recording for specified lanes.
 */
export function startAutomationRecording(
  recordState: AutomationRecordState,
  laneIds: readonly string[]
): AutomationRecordState {
  return {
    ...recordState,
    activeLaneIds: laneIds,
    recording: true,
    recordBuffer: new Map()
  };
}

/**
 * Stops automation recording and commits buffer to lanes.
 */
export function stopAutomationRecording(
  state: ArrangementPanelState,
  recordState: AutomationRecordState
): { state: ArrangementPanelState; recordState: AutomationRecordState } {
  if (!recordState.recording) {
    return { state, recordState };
  }
  
  let newState = state;
  
  // Commit recorded points to lanes based on mode
  for (const [laneId, points] of recordState.recordBuffer.entries()) {
    const lane = state.automationLanes.find(l => l.id === laneId);
    if (!lane) continue;
    
    switch (recordState.mode) {
      case 'write':
        // Replace all points in recorded range
        for (const point of points) {
          newState = addAutomationPoint(newState, laneId, point);
        }
        break;
        
      case 'touch':
      case 'latch':
        // Only write points that were touched
        if (recordState.touchedLanes.has(laneId) || 
            recordState.latchedLanes.has(laneId)) {
          for (const point of points) {
            newState = addAutomationPoint(newState, laneId, point);
          }
        }
        break;
        
      case 'trim':
        // Add to existing automation (offset values)
        for (const point of points) {
          // Get the current lane state (may have been updated)
          const currentLane = newState.automationLanes.find(l => l.id === laneId);
          const existing = currentLane?.points.find(p => p.position === point.position);
          const trimValue = existing 
            ? Math.max(0, Math.min(1, existing.value + (point.value - 0.5)))
            : point.value;
          
          // Remove existing point if present
          if (existing) {
            newState = removeAutomationPoint(newState, laneId, point.position);
          }
          
          const trimmedPoint = createAutomationPoint(
            point.position,
            trimValue,
            point.curve
          );
          newState = addAutomationPoint(newState, laneId, trimmedPoint);
        }
        break;
      
      case 'read':
      default:
        // Read mode: don't commit anything
        break;
    }
  }
  
  const newRecordState: AutomationRecordState = {
    ...recordState,
    recording: false,
    touchedLanes: new Set(),
    latchedLanes: new Set(),
    recordBuffer: new Map()
  };
  
  return {
    state: newState,
    recordState: newRecordState
  };
}

/**
 * Records automation point during playback (touch mode).
 */
export function recordAutomationPoint(
  recordState: AutomationRecordState,
  laneId: string,
  position: Tick,
  value: number,
  touched: boolean = false
): AutomationRecordState {
  if (!recordState.recording || !recordState.activeLaneIds.includes(laneId)) {
    return recordState;
  }
  
  const point = createAutomationPoint(position, value, 'linear');
  
  const buffer = new Map(recordState.recordBuffer);
  const points = buffer.get(laneId) || [];
  buffer.set(laneId, [...points, point]);
  
  let touchedLanes = recordState.touchedLanes;
  let latchedLanes = recordState.latchedLanes;
  
  // Handle touch/latch mode logic
  if (recordState.mode === 'touch' && touched) {
    touchedLanes = new Set(touchedLanes);
    touchedLanes.add(laneId);
  } else if (recordState.mode === 'latch') {
    if (touched) {
      latchedLanes = new Set(latchedLanes);
      latchedLanes.add(laneId);
    }
  }
  
  return {
    ...recordState,
    recordBuffer: buffer,
    touchedLanes,
    latchedLanes
  };
}

/**
 * Releases touch on automation lane (touch mode).
 */
export function releaseAutomationTouch(
  recordState: AutomationRecordState,
  laneId: string
): AutomationRecordState {
  if (recordState.mode !== 'touch') {
    return recordState;
  }
  
  const touchedLanes = new Set(recordState.touchedLanes);
  touchedLanes.delete(laneId);
  
  return {
    ...recordState,
    touchedLanes
  };
}

// ============================================================================
// AUTOMATION SEARCH & MANAGEMENT (Steps 2802-2804)
// ============================================================================

/**
 * Searches for automation lanes by parameter name (Step 2802).
 * Returns all automation lanes that match the search query.
 */
export function searchAutomationLanes(
  state: ArrangementPanelState,
  query: string
): readonly AutomationLane[] {
  const lowerQuery = query.toLowerCase();
  return state.automationLanes.filter(lane =>
    lane.parameter.toLowerCase().includes(lowerQuery) ||
    lane.name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Quick-adds automation lane for a parameter (Step 2803).
 * Creates and adds a new automation lane for the specified track and parameter.
 */
export function quickAddAutomationLane(
  state: ArrangementPanelState,
  trackId: string,
  parameter: string,
  name?: string
): ArrangementPanelState {
  const track = state.tracks.find(t => t.id === trackId);
  if (!track) return state;
  
  const laneId = `${trackId}-${parameter}-${Date.now()}`;
  const lane = createAutomationLane(
    laneId,
    trackId,
    parameter,
    name ?? parameter,
    { visible: true, height: 60 }
  );
  
  return addAutomationLane(state, lane);
}

/**
 * Collapses or expands all automation lanes (Step 2804).
 * Useful for reducing visual clutter.
 */
export function collapseAutomationLanes(
  state: ArrangementPanelState,
  collapsed: boolean
): ArrangementPanelState {
  const collapsedHeight = 30;
  const expandedHeight = 60;
  
  return {
    ...state,
    automationLanes: state.automationLanes.map(lane => ({
      ...lane,
      height: collapsed ? collapsedHeight : expandedHeight
    }))
  };
}

// ============================================================================
// MARKERS & LOCATORS (Steps 2807-2822)
// ============================================================================

/**
 * Locator pair for loop region or selection.
 */
export interface Locators {
  /** Left locator position in ticks */
  readonly left: Tick;
  /** Right locator position in ticks */
  readonly right: Tick;
  /** Locator color */
  readonly color: string;
}

/**
 * Enhanced MarkerType with section markers (Step 2813).
 */
export type EnhancedMarkerType = MarkerType | 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'break';

/**
 * Creates and adds a new marker at position (Step 2807).
 * Convenience wrapper around createMarker + addMarker.
 */
export function addMarkerAtPosition(
  state: ArrangementPanelState,
  position: Tick,
  name: string,
  type: EnhancedMarkerType = 'cue',
  color?: string
): ArrangementPanelState {
  const markerType: MarkerType = 
    type === 'verse' || type === 'chorus' || type === 'bridge' || 
    type === 'intro' || type === 'outro' || type === 'break' 
      ? 'section' : type;
  
  // Generate unique ID using timestamp + counter
  const id = `marker-${Date.now()}-${state.markers.length}`;
  
  const marker = createMarker(
    id,
    name,
    position,
    { 
      type: markerType,
      color: color ?? getDefaultMarkerColor(type)
    }
  );
  
  return addMarker(state, marker);
}

/**
 * Renames a marker (Step 2809).
 * Convenience wrapper around updateMarker.
 */
export function renameMarker(
  state: ArrangementPanelState,
  markerId: string,
  newName: string
): ArrangementPanelState {
  return updateMarker(state, markerId, { name: newName });
}

/**
 * Changes marker color (Step 2810).
 * Convenience wrapper around updateMarker.
 */
export function setMarkerColor(
  state: ArrangementPanelState,
  markerId: string,
  color: string
): ArrangementPanelState {
  return updateMarker(state, markerId, { color });
}

/**
 * Moves a marker to a new position (Step 2811).
 * Convenience wrapper around updateMarker.
 */
export function moveMarker(
  state: ArrangementPanelState,
  markerId: string,
  newPosition: Tick
): ArrangementPanelState {
  return updateMarker(state, markerId, { position: newPosition });
}

/**
 * Snaps marker position to grid (Step 2812).
 */
export function snapMarkerToGrid(
  state: ArrangementPanelState,
  markerId: string
): ArrangementPanelState {
  const marker = state.markers.find(m => m.id === markerId);
  if (!marker || !state.snapEnabled) return state;
  
  const snapInterval = state.snapInterval;
  const snappedPosition = asTick(
    Math.round(marker.position / snapInterval) * snapInterval
  );
  
  return moveMarker(state, markerId, snappedPosition);
}

/**
 * Gets default marker color based on type.
 */
function getDefaultMarkerColor(type: string): string {
  const colors: Record<string, string> = {
    'cue': '#3b82f6',
    'section': '#8b5cf6',
    'custom': '#6b7280',
    'verse': '#10b981',
    'chorus': '#f59e0b',
    'bridge': '#ec4899',
    'intro': '#06b6d4',
    'outro': '#6366f1',
    'break': '#ef4444'
  };
  return colors[type] ?? colors['custom']!;
}

/**
 * Jumps to next marker from current position (Step 2814).
 */
export function jumpToNextMarker(
  state: ArrangementPanelState,
  currentPosition: Tick
): Tick | null {
  const nextMarker = state.markers.find(m => m.position > currentPosition);
  return nextMarker ? nextMarker.position : null;
}

/**
 * Jumps to previous marker from current position (Step 2814).
 */
export function jumpToPrevMarker(
  state: ArrangementPanelState,
  currentPosition: Tick
): Tick | null {
  const prevMarkers = state.markers.filter(m => m.position < currentPosition);
  if (prevMarkers.length === 0) return null;
  return prevMarkers[prevMarkers.length - 1]!.position;
}

/**
 * Sets left and right locators (Step 2816).
 * Creates locator pair, typically used for loop regions or selections.
 */
export function setLocators(
  left: Tick,
  right: Tick,
  color: string = '#fbbf24'
): Locators {
  return {
    left: asTick(Math.min(left, right)),
    right: asTick(Math.max(left, right)),
    color
  };
}

/**
 * Jumps playhead to left locator (Step 2817).
 */
export function jumpToLeftLocator(locators: Locators): Tick {
  return locators.left;
}

/**
 * Jumps playhead to right locator (Step 2817).
 */
export function jumpToRightLocator(locators: Locators): Tick {
  return locators.right;
}

/**
 * Selects region between locators (Step 2818).
 * Returns selection start and duration.
 */
export function selectLocatorRegion(locators: Locators): {
  start: Tick;
  duration: TickDuration;
} {
  return {
    start: locators.left,
    duration: asTickDuration(locators.right - locators.left)
  };
}

/**
 * Creates loop region from locators (Step 2819).
 */
export function createLoopRegionFromLocators(
  state: ArrangementPanelState,
  locators: Locators
): ArrangementPanelState {
  return {
    ...state,
    loopRegion: {
      start: locators.left,
      end: locators.right,
      enabled: true,
      color: locators.color
    }
  };
}

/**
 * Zooms timeline to locator region (Step 2820).
 * Adjusts zoom and scroll to fit region between locators.
 */
export function zoomToLocators(
  state: ArrangementPanelState,
  locators: Locators
): ArrangementPanelState {
  const regionDuration = locators.right - locators.left;
  if (regionDuration <= 0) return state;
  
  // Calculate zoom to fit region with 10% padding on each side
  const targetZoom = state.scroll.viewportWidth / (regionDuration * 1.2);
  
  // Center the region in viewport
  const centerTick = (locators.left + locators.right) / 2;
  const newScrollX = centerTick - (state.scroll.viewportWidth / targetZoom / 2);
  
  return {
    ...state,
    zoom: {
      ...state.zoom,
      level: Math.max(state.zoom.min, Math.min(state.zoom.max, targetZoom))
    },
    scroll: {
      ...state.scroll,
      scrollX: Math.max(0, newScrollX)
    }
  };
}

/**
 * Sets punch recording region from locators (Step 2821).
 * Creates a punch-in/out region for recording.
 */
export function setPunchRegionFromLocators(
  state: ArrangementPanelState,
  locators: Locators
): ArrangementPanelState {
  return {
    ...state,
    punchRegion: {
      punchIn: locators.left,
      punchOut: locators.right,
      enabled: true,
      color: '#ef4444' // Red color for punch region
    }
  };
}

/**
 * Creates export region from locators (Step 2822).
 * Sets the region to be exported.
 */
export function setExportRegionFromLocators(
  state: ArrangementPanelState,
  locators: Locators
): ArrangementPanelState {
  return {
    ...state,
    exportRegion: {
      start: locators.left,
      end: locators.right
    }
  };
}

/**
 * Sets render region from locators (Step 2823).
 * Defines region for offline rendering.
 */
export function setRenderRegionFromLocators(
  state: ArrangementPanelState,
  locators: Locators
): ArrangementPanelState {
  return {
    ...state,
    renderRegion: {
      start: locators.left,
      end: locators.right
    }
  };
}

/**
 * Creates marker from transient detection (Step 2824).
 * Analyzes audio and places markers at detected transients.
 */
export async function addMarkersFromTransients(
  state: ArrangementPanelState,
  audioBuffer: Float32Array,
  audioDuration: Tick, // Duration of the audio buffer in ticks
  threshold: number = 0.3,
  minDistance: Tick = asTick(480) // Minimum 480 ticks between markers
): Promise<ArrangementPanelState> {
  const transientPositions: Tick[] = [];
  
  // Simple transient detection: look for significant amplitude increases
  for (let i = 1; i < audioBuffer.length; i++) {
    const diff = Math.abs(audioBuffer[i]!) - Math.abs(audioBuffer[i - 1]!);
    if (diff > threshold) {
      const tick = asTick((i / audioBuffer.length) * audioDuration);
      
      // Check minimum distance from last marker
      if (transientPositions.length === 0 || 
          tick - transientPositions[transientPositions.length - 1]! >= minDistance) {
        transientPositions.push(tick);
      }
    }
  }
  
  // Add markers at detected positions
  let newState = state;
  for (let i = 0; i < transientPositions.length; i++) {
    const position = transientPositions[i]!;
    newState = addMarkerAtPosition(newState, position, `Transient ${i + 1}`, 'cue', '#06b6d4');
  }
  
  return newState;
}

/**
 * Creates markers from beat detection (Step 2825).
 * Places markers at regular bar intervals based on tempo and time signature.
 */
export async function addMarkersFromBeats(
  state: ArrangementPanelState,
  endTick: Tick, // Duration to add markers for
  timeSignature: { numerator: number; denominator: number } = { numerator: 4, denominator: 4 },
  startTick: Tick = asTick(0)
): Promise<ArrangementPanelState> {
  const ticksPerBeat = 480; // Standard MIDI resolution
  const beatsPerBar = timeSignature.numerator;
  const ticksPerBar = ticksPerBeat * beatsPerBar;
  
  let newState = state;
  
  for (let tick = startTick; tick < endTick; tick = asTick(tick + ticksPerBar)) {
    const barNumber = Math.floor((tick - startTick) / ticksPerBar) + 1;
    newState = addMarkerAtPosition(
      newState,
      tick,
      `Bar ${barNumber}`,
      'cue',
      '#10b981'
    );
  }
  
  return newState;
}

/**
 * Imports markers from file (Step 2826).
 * Loads markers from JSON format.
 */
export function importMarkersFromFile(
  state: ArrangementPanelState,
  markersData: Array<{ position: number; name: string; type?: EnhancedMarkerType; color?: string }>
): ArrangementPanelState {
  let newState = state;
  
  for (const markerData of markersData) {
    newState = addMarkerAtPosition(
      newState,
      asTick(markerData.position),
      markerData.name,
      markerData.type ?? 'custom',
      markerData.color
    );
  }
  
  return newState;
}

// ============================================================================
// SELECTION STORE INTEGRATION (E033)
// ============================================================================

/**
 * Syncs clip selection to SelectionStore.
 * 
 * When clips are selected in timeline, this updates the shared SelectionStore
 * so other views (piano roll, notation) can reflect the same selection.
 * 
 * E033: Timeline selection integration with SelectionStore.
 */
export function syncClipSelectionToStore(
  state: ArrangementPanelState,
  selectionStore: SelectionStore
): void {
  // Get clip IDs that map to event stream IDs
  // Note: Clips reference streams, so we select by clip ID which can be
  // mapped to event IDs by the consuming code
  const selectedClipIds = state.selectedClipIds;
  
  if (selectedClipIds.length === 0) {
    selectionStore.clearSelection();
  } else {
    // Set selection using clip IDs as branded ClipId type
    // The SelectionStore treats these as event-like selections
    selectionStore.setSelection(selectedClipIds as readonly string[]);
  }
}

/**
 * Updates arrangement panel selection from SelectionStore.
 * 
 * When selection changes in other views, this updates the timeline
 * to reflect the shared selection state.
 * 
 * E033: Timeline selection integration with SelectionStore.
 */
export function syncSelectionFromStore(
  state: ArrangementPanelState,
  selectionStore: SelectionStore
): ArrangementPanelState {
  const selectionState = selectionStore.getState();
  const selectedIds = Array.from(selectionState.selected);
  
  // Map selected IDs to clip IDs
  // Filter to only include IDs that correspond to clips in this arrangement
  const clipIds = selectedIds.filter(id => 
    state.clips.some(clip => clip.id === id)
  );
  
  return selectMultipleClips(state, clipIds, false);
}

/**
 * Subscribes to SelectionStore changes and updates arrangement panel.
 * 
 * E033: Timeline selection integration with SelectionStore.
 * 
 * @returns Unsubscribe function
 */
export function subscribeToSelectionStore(
  selectionStore: SelectionStore,
  onSelectionChange: (selectedClipIds: readonly string[]) => void
): () => void {
  const subscriptionId = selectionStore.subscribe((newState, _prevState) => {
    const selectedIds = Array.from(newState.selected);
    onSelectionChange(selectedIds);
  });
  
  return () => {
    selectionStore.unsubscribe(subscriptionId);
  };
}
