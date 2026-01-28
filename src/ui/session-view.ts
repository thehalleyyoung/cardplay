/**
 * @fileoverview Session View (Ableton-like clip grid) UI components and state.
 * 
 * Session View provides a clip grid interface for launching and organizing
 * clips in a live performance context. Clips are organized in tracks (columns)
 * and scenes (rows).
 * 
 * @module @cardplay/core/ui/session-view
 * @see cardplay2.md Section 6.4 - Session view (Ableton-like)
 */

import type { ContainerId } from '../containers/container';
import { generateContainerId } from '../containers/container';
import type { Event } from '../types/event';
import { updateEvent, cloneEvent } from '../types/event';
import type { Tick } from '../types/primitives';
import { asTick, asTickDuration, quantizeTick } from '../types/primitives';

// ============================================================================
// TYPES
// ============================================================================

/**
 * State of a clip slot in the session grid.
 */
export type ClipSlotState =
  | 'empty'      // No clip assigned
  | 'filled'     // Clip exists but not playing
  | 'playing'    // Clip is currently playing
  | 'queued'     // Clip is queued to play
  | 'stopping';  // Clip is fading out

/**
 * Position in the session grid.
 */
export interface GridPosition {
  readonly trackIndex: number;
  readonly sceneIndex: number;
}

/**
 * A clip slot in the session grid.
 */
export interface ClipSlot {
  readonly position: GridPosition;
  readonly clipId?: ContainerId;
  readonly state: ClipSlotState;
  readonly color?: string;
  readonly name?: string;
  readonly selected: boolean;
  readonly info?: ClipSlotInfo;
  readonly launchConfig?: ClipLaunchConfig;
}

/**
 * Track (column) header in session view.
 */
/**
 * Track I/O routing configuration.
 */
export interface TrackIO {
  readonly input?: string;      // Input device/bus name
  readonly output?: string;      // Output device/bus name
  readonly inputGain?: number;   // Input gain in dB (-inf to +24)
  readonly monitoring?: 'off' | 'in' | 'auto'; // Monitoring mode
}

/**
 * Track send configuration.
 */
export interface TrackSend {
  readonly sendIndex: number;
  readonly level: number;        // Send level 0.0-1.0
  readonly destination?: string; // Send bus name
  readonly preFader: boolean;    // Pre or post-fader
}

/**
 * Track meter values (peak/RMS/LUFS).
 */
export interface TrackMeter {
  readonly peakL: number;        // Left peak in dB
  readonly peakR: number;        // Right peak in dB
  readonly rmsL: number;         // Left RMS in dB
  readonly rmsR: number;         // Right RMS in dB
  readonly lufs?: number;        // Integrated LUFS (optional)
  readonly timestamp: number;    // When measured (ms)
}

export interface TrackHeader {
  readonly trackIndex: number;
  readonly name: string;
  readonly color?: string;
  readonly muted: boolean;
  readonly soloed: boolean;
  readonly armed: boolean;
  readonly volume?: number;      // Volume fader 0.0-2.0 (1.0 = unity, 2.0 = +6dB)
  readonly pan?: number;         // Pan -1.0 (left) to +1.0 (right)
  readonly io?: TrackIO;         // I/O routing
  readonly sends?: readonly TrackSend[]; // Send levels (up to 8)
  readonly meter?: TrackMeter;   // Current meter values
}

/**
 * Scene marker for timeline navigation.
 */
export interface SceneMarker {
  readonly position: number; // Tick position in timeline
  readonly label?: string;
}

/**
 * Scene snapshot captures the full state of a scene for recall.
 */
export interface SceneSnapshot {
  readonly sceneIndex: number;
  readonly timestamp: number;
  readonly clipStates: ReadonlyMap<number, ClipSlotState>; // trackIndex → state
  readonly sceneHeader: SceneHeader;
}

/**
 * Scene loop mode determines loop behavior.
 */
export type SceneLoopMode =
  | 'off'        // No looping
  | 'loop'       // Loop the scene
  | 'ping-pong'; // Loop forward then backward

/**
 * Scene transition type for scene changes.
 */
export type SceneTransitionType =
  | 'cut'        // Immediate cut
  | 'crossfade'  // Fade between scenes
  | 'ramp';      // Gradual transition

/**
 * Scene cue point marks a specific point in a scene.
 */
export interface SceneCuePoint {
  readonly id: string;
  readonly position: number; // Tick position
  readonly name?: string;
  readonly color?: string;
}

/**
 * Scene (row) header in session view.
 */
export interface SceneHeader {
  readonly sceneIndex: number;
  readonly name: string;
  readonly color?: string;
  readonly tempo?: number;
  readonly timeSignature?: { numerator: number; denominator: number };
  readonly followAction?: FollowAction;
  readonly markers?: readonly SceneMarker[];
  readonly description?: string;
  readonly loopMode?: SceneLoopMode;
  readonly transitionType?: SceneTransitionType;
  readonly cuePoints?: readonly SceneCuePoint[];
}

/**
 * Selection state for clip slots.
 */
export interface ClipSelection {
  readonly selectedSlots: ReadonlySet<string>; // "trackIndex:sceneIndex"
  readonly anchorSlot?: GridPosition;
}

/**
 * Drag-select state.
 */
export interface DragSelectState {
  readonly active: boolean;
  readonly start?: GridPosition;
  readonly current?: GridPosition;
}

/**
 * Complete session grid state.
 */
export interface SessionGridState {
  readonly trackCount: number;
  readonly sceneCount: number;
  readonly slots: ReadonlyMap<string, ClipSlot>; // "trackIndex:sceneIndex" → ClipSlot
  readonly trackHeaders: readonly TrackHeader[];
  readonly sceneHeaders: readonly SceneHeader[];
  readonly selection: ClipSelection;
  readonly dragSelect: DragSelectState;
}

/**
 * Context menu action for clip slots.
 */
export type ClipSlotAction =
  | 'duplicate'
  | 'delete'
  | 'rename'
  | 'change-color'
  | 'export'
  | 'quantize'
  | 'reverse'
  | 'transpose';

/**
 * Extended clip slot information (for previews, loading states, etc.)
 */
export interface ClipSlotInfo {
  /** Length in ticks (for display) */
  readonly length?: number;
  /** Waveform preview data (for audio clips) */
  readonly waveformData?: Float32Array;
  /** MIDI preview data (for MIDI clips) */
  readonly midiPreviewNotes?: Array<{ pitch: number; start: number; duration: number }>;
  /** Loading progress (0-1) */
  readonly loadingProgress?: number;
  /** Error message if clip failed to load */
  readonly error?: string;
  /** Recording state information */
  readonly recording?: {
    active: boolean;
    startTime?: number;
    currentLength?: number;
  };
}

// ============================================================================
// CLIP LAUNCH SYSTEM
// ============================================================================

/**
 * Launch mode determines when a clip starts playing after triggering.
 */
export type LaunchMode =
  | 'immediate'    // Start immediately (no quantization)
  | 'quantized';   // Wait for next quantization boundary

/**
 * Launch quantization determines the boundary for quantized launches.
 */
export type LaunchQuantization =
  | 'none'         // No quantization (immediate)
  | '1/4'          // Quarter note
  | '1/2'          // Half note  
  | '1'            // One bar
  | '2'            // Two bars
  | '4'            // Four bars
  | '8';           // Eight bars

/**
 * Follow action type determines what happens after clip finishes.
 */
export type FollowActionType =
  | 'none'         // Do nothing
  | 'stop'         // Stop playback
  | 'next-clip'    // Launch next clip in track
  | 'prev-clip'    // Launch previous clip in track
  | 'first-clip'   // Launch first clip in track
  | 'any-clip'     // Launch random clip in track
  | 'other-clip'   // Launch random other clip in track
  | 'next-scene'   // Launch next scene
  | 'prev-scene'   // Launch previous scene
  | 'first-scene'  // Launch first scene
  | 'any-scene';   // Launch random scene

/**
 * Follow action configuration.
 */
export interface FollowAction {
  readonly type: FollowActionType;
  /** Time before action triggers (in bars) */
  readonly timeInBars: number;
  /** Probability (0-1) for random actions */
  readonly probability?: number;
  /** Target scene index for scene actions */
  readonly targetSceneIndex?: number;
}

/**
 * Play mode determines how clip playback behaves.
 */
export type ClipPlayMode =
  | 'loop'         // Loop continuously
  | 'one-shot'     // Play once and stop
  | 'legato';      // Continue from last position

/**
 * Warp marker for time-stretching audio clips.
 */
export interface WarpMarker {
  /** Position in ticks in clip timeline */
  readonly tickPosition: number;
  /** Position in seconds in audio file */
  readonly audioPosition: number;
}

/**
 * Clip condition determines when clip can be triggered.
 */
export type ClipCondition =
  | 'always'       // Always playable
  | 'first'        // Only on first trigger
  | 'nth-time'     // Every nth trigger
  | 'nth-bar';     // Every nth bar

/**
 * Clip launch configuration.
 */
export interface ClipLaunchConfig {
  readonly launchMode: LaunchMode;
  readonly quantization: LaunchQuantization;
  readonly playMode: ClipPlayMode;
  readonly followAction?: FollowAction;
  /** Fade in duration in ticks */
  readonly fadeInTicks?: number;
  /** Fade out duration in ticks */
  readonly fadeOutTicks?: number;
  /** Start offset in ticks (skip beginning) */
  readonly startOffsetTicks?: number;
  /** End offset in ticks (skip ending) */
  readonly endOffsetTicks?: number;
  /** Velocity curve for MIDI clips (-1 to 1, 0 = no change) */
  readonly velocityCurve?: number;
  /** Warp markers for time-stretching audio (empty = no warping) */
  readonly warpMarkers?: readonly WarpMarker[];
  /** Lock tempo to project tempo (ignore clip's embedded tempo) */
  readonly tempoSync?: boolean;
  /** Lock pitch (don't adjust with tempo changes) */
  readonly pitchLock?: boolean;
  /** Groove amount (0-1, how much to apply project groove) */
  readonly grooveAmount?: number;
  /** Launch probability (0-1, 1 = always launch) */
  readonly probability?: number;
  /** Trigger condition (when this clip can be launched) */
  readonly condition?: ClipCondition;
  /** For 'nth-time' or 'nth-bar' condition, the interval */
  readonly conditionInterval?: number;
  /** Choke group ID (clips in same group stop each other, like hi-hat) */
  readonly chokeGroup?: number;
  /** Exclusive mode (only one clip in track can play at a time) */
  readonly exclusiveMode?: boolean;
}

/**
 * Context menu state.
 */
export interface ClipSlotContextMenu {
  readonly visible: boolean;
  readonly position: { x: number; y: number };
  readonly slot?: GridPosition;
  readonly actions: readonly ClipSlotAction[];
}

// ============================================================================
// GRID POSITION HELPERS
// ============================================================================

/**
 * Converts a grid position to a unique string key.
 */
export function gridPositionToKey(pos: GridPosition): string {
  return `${pos.trackIndex}:${pos.sceneIndex}`;
}

/**
 * Parses a grid position key back to GridPosition.
 */
export function keyToGridPosition(key: string): GridPosition | null {
  const parts = key.split(':');
  if (parts.length !== 2) return null;
  const trackIndex = parseInt(parts[0]!, 10);
  const sceneIndex = parseInt(parts[1]!, 10);
  if (isNaN(trackIndex) || isNaN(sceneIndex)) return null;
  return { trackIndex, sceneIndex };
}

/**
 * Checks if two grid positions are equal.
 */
export function gridPositionsEqual(a: GridPosition, b: GridPosition): boolean {
  return a.trackIndex === b.trackIndex && a.sceneIndex === b.sceneIndex;
}

// ============================================================================
// SESSION GRID STATE MANAGEMENT
// ============================================================================

/**
 * Creates an empty session grid state.
 */
export function createSessionGrid(
  trackCount: number,
  sceneCount: number
): SessionGridState {
  const slots = new Map<string, ClipSlot>();
  const trackHeaders: TrackHeader[] = [];
  const sceneHeaders: SceneHeader[] = [];

  // Initialize track headers
  for (let i = 0; i < trackCount; i++) {
    trackHeaders.push({
      trackIndex: i,
      name: `Track ${i + 1}`,
      muted: false,
      soloed: false,
      armed: false,
    });
  }

  // Initialize scene headers
  for (let i = 0; i < sceneCount; i++) {
    sceneHeaders.push({
      sceneIndex: i,
      name: `Scene ${i + 1}`,
    });
  }

  // Initialize empty slots
  for (let trackIndex = 0; trackIndex < trackCount; trackIndex++) {
    for (let sceneIndex = 0; sceneIndex < sceneCount; sceneIndex++) {
      const position: GridPosition = { trackIndex, sceneIndex };
      slots.set(gridPositionToKey(position), {
        position,
        state: 'empty',
        selected: false,
      });
    }
  }

  return {
    trackCount,
    sceneCount,
    slots,
    trackHeaders,
    sceneHeaders,
    selection: {
      selectedSlots: new Set(),
    },
    dragSelect: {
      active: false,
    },
  };
}

/**
 * Sets a clip in a slot.
 */
export function setClipInSlot(
  grid: SessionGridState,
  position: GridPosition,
  clipId: ContainerId,
  name?: string,
  color?: string
): SessionGridState {
  const key = gridPositionToKey(position);
  const existingSlot = grid.slots.get(key);
  if (!existingSlot) return grid;

  const updatedSlot: ClipSlot = {
    ...existingSlot,
    clipId,
    ...(name && { name }),
    ...(color && { color }),
    state: 'filled',
  };

  const newSlots = new Map(grid.slots);
  newSlots.set(key, updatedSlot);

  return {
    ...grid,
    slots: newSlots,
  };
}

/**
 * Removes a clip from a slot.
 */
export function removeClipFromSlot(
  grid: SessionGridState,
  position: GridPosition
): SessionGridState {
  const key = gridPositionToKey(position);
  const existingSlot = grid.slots.get(key);
  if (!existingSlot) return grid;

  const updatedSlot: ClipSlot = {
    position,
    state: 'empty',
    selected: existingSlot.selected,
  };

  const newSlots = new Map(grid.slots);
  newSlots.set(key, updatedSlot);

  return {
    ...grid,
    slots: newSlots,
  };
}

/**
 * Updates the state of a clip slot.
 */
export function setClipSlotState(
  grid: SessionGridState,
  position: GridPosition,
  state: ClipSlotState
): SessionGridState {
  const key = gridPositionToKey(position);
  const existingSlot = grid.slots.get(key);
  if (!existingSlot) return grid;

  const updatedSlot: ClipSlot = {
    ...existingSlot,
    state,
  };

  const newSlots = new Map(grid.slots);
  newSlots.set(key, updatedSlot);

  return {
    ...grid,
    slots: newSlots,
  };
}

/**
 * Changes the color of a clip slot.
 */
export function setClipSlotColor(
  grid: SessionGridState,
  position: GridPosition,
  color: string
): SessionGridState {
  const key = gridPositionToKey(position);
  const existingSlot = grid.slots.get(key);
  if (!existingSlot) return grid;

  const updatedSlot: ClipSlot = {
    ...existingSlot,
    color,
  };

  const newSlots = new Map(grid.slots);
  newSlots.set(key, updatedSlot);

  return {
    ...grid,
    slots: newSlots,
  };
}

// ============================================================================
// SELECTION MANAGEMENT
// ============================================================================

/**
 * Selects a single clip slot.
 */
export function selectClipSlot(
  grid: SessionGridState,
  position: GridPosition,
  addToSelection: boolean = false
): SessionGridState {
  const key = gridPositionToKey(position);
  
  let newSelectedSlots: Set<string>;
  if (addToSelection) {
    newSelectedSlots = new Set(grid.selection.selectedSlots);
    if (newSelectedSlots.has(key)) {
      newSelectedSlots.delete(key);
    } else {
      newSelectedSlots.add(key);
    }
  } else {
    newSelectedSlots = new Set([key]);
  }

  // Update slot selected state
  const newSlots = new Map(grid.slots);
  for (const [slotKey, slot] of grid.slots) {
    newSlots.set(slotKey, {
      ...slot,
      selected: newSelectedSlots.has(slotKey),
    });
  }

  return {
    ...grid,
    slots: newSlots,
    selection: {
      selectedSlots: newSelectedSlots,
      anchorSlot: position,
    },
  };
}

/**
 * Clears the clip slot selection.
 */
export function clearSelection(grid: SessionGridState): SessionGridState {
  const newSlots = new Map(grid.slots);
  for (const [key, slot] of grid.slots) {
    if (slot.selected) {
      newSlots.set(key, { ...slot, selected: false });
    }
  }

  return {
    ...grid,
    slots: newSlots,
    selection: {
      selectedSlots: new Set(),
    },
  };
}

/**
 * Selects multiple clip slots in a rectangle.
 */
export function selectRectangle(
  grid: SessionGridState,
  start: GridPosition,
  end: GridPosition,
  addToSelection: boolean = false
): SessionGridState {
  const minTrack = Math.min(start.trackIndex, end.trackIndex);
  const maxTrack = Math.max(start.trackIndex, end.trackIndex);
  const minScene = Math.min(start.sceneIndex, end.sceneIndex);
  const maxScene = Math.max(start.sceneIndex, end.sceneIndex);

  const newSelectedSlots = addToSelection
    ? new Set(grid.selection.selectedSlots)
    : new Set<string>();

  for (let t = minTrack; t <= maxTrack; t++) {
    for (let s = minScene; s <= maxScene; s++) {
      const key = gridPositionToKey({ trackIndex: t, sceneIndex: s });
      newSelectedSlots.add(key);
    }
  }

  // Update slot selected state
  const newSlots = new Map(grid.slots);
  for (const [slotKey, slot] of grid.slots) {
    newSlots.set(slotKey, {
      ...slot,
      selected: newSelectedSlots.has(slotKey),
    });
  }

  return {
    ...grid,
    slots: newSlots,
    selection: {
      selectedSlots: newSelectedSlots,
      anchorSlot: start,
    },
  };
}

// ============================================================================
// DRAG-SELECT
// ============================================================================

/**
 * Starts a drag-select operation.
 */
export function startDragSelect(
  grid: SessionGridState,
  position: GridPosition
): SessionGridState {
  return {
    ...grid,
    dragSelect: {
      active: true,
      start: position,
      current: position,
    },
  };
}

/**
 * Updates the current drag-select position.
 */
export function updateDragSelect(
  grid: SessionGridState,
  position: GridPosition
): SessionGridState {
  if (!grid.dragSelect.active || !grid.dragSelect.start) {
    return grid;
  }

  return {
    ...grid,
    dragSelect: {
      ...grid.dragSelect,
      current: position,
    },
  };
}

/**
 * Ends a drag-select operation and applies the selection.
 */
export function endDragSelect(
  grid: SessionGridState,
  addToSelection: boolean = false
): SessionGridState {
  if (!grid.dragSelect.active || !grid.dragSelect.start || !grid.dragSelect.current) {
    return {
      ...grid,
      dragSelect: { active: false },
    };
  }

  const result = selectRectangle(
    grid,
    grid.dragSelect.start,
    grid.dragSelect.current,
    addToSelection
  );

  return {
    ...result,
    dragSelect: { active: false },
  };
}

/**
 * Cancels an active drag-select operation.
 */
export function cancelDragSelect(grid: SessionGridState): SessionGridState {
  return {
    ...grid,
    dragSelect: { active: false },
  };
}

// ============================================================================
// TRACK HEADER MANAGEMENT
// ============================================================================

/**
 * Renames a track.
 */
export function renameTrack(
  grid: SessionGridState,
  trackIndex: number,
  name: string
): SessionGridState {
  if (trackIndex < 0 || trackIndex >= grid.trackHeaders.length) return grid;

  const newHeaders = grid.trackHeaders.map((header, idx) =>
    idx === trackIndex ? { ...header, name } : header
  );

  return {
    ...grid,
    trackHeaders: newHeaders,
  };
}

/**
 * Sets track color.
 */
export function setTrackColor(
  grid: SessionGridState,
  trackIndex: number,
  color: string
): SessionGridState {
  if (trackIndex < 0 || trackIndex >= grid.trackHeaders.length) return grid;

  const newHeaders = grid.trackHeaders.map((header, idx) =>
    idx === trackIndex ? { ...header, color } : header
  );

  return {
    ...grid,
    trackHeaders: newHeaders,
  };
}

/**
 * Toggles track mute.
 */
export function toggleTrackMute(
  grid: SessionGridState,
  trackIndex: number
): SessionGridState {
  if (trackIndex < 0 || trackIndex >= grid.trackHeaders.length) return grid;

  const newHeaders = grid.trackHeaders.map((header, idx) =>
    idx === trackIndex ? { ...header, muted: !header.muted } : header
  );

  return {
    ...grid,
    trackHeaders: newHeaders,
  };
}

/**
 * Toggles track solo.
 */
export function toggleTrackSolo(
  grid: SessionGridState,
  trackIndex: number
): SessionGridState {
  if (trackIndex < 0 || trackIndex >= grid.trackHeaders.length) return grid;

  const newHeaders = grid.trackHeaders.map((header, idx) =>
    idx === trackIndex ? { ...header, soloed: !header.soloed } : header
  );

  return {
    ...grid,
    trackHeaders: newHeaders,
  };
}

/**
 * Toggles track arm (for recording).
 */
export function toggleTrackArm(
  grid: SessionGridState,
  trackIndex: number
): SessionGridState {
  if (trackIndex < 0 || trackIndex >= grid.trackHeaders.length) return grid;

  const newHeaders = grid.trackHeaders.map((header, idx) =>
    idx === trackIndex ? { ...header, armed: !header.armed } : header
  );

  return {
    ...grid,
    trackHeaders: newHeaders,
  };
}

// ============================================================================
// SCENE HEADER MANAGEMENT
// ============================================================================

/**
 * Renames a scene.
 */
export function renameScene(
  grid: SessionGridState,
  sceneIndex: number,
  name: string
): SessionGridState {
  if (sceneIndex < 0 || sceneIndex >= grid.sceneHeaders.length) return grid;

  const newHeaders = grid.sceneHeaders.map((header, idx) =>
    idx === sceneIndex ? { ...header, name } : header
  );

  return {
    ...grid,
    sceneHeaders: newHeaders,
  };
}

/**
 * Sets scene color.
 */
export function setSceneColor(
  grid: SessionGridState,
  sceneIndex: number,
  color: string
): SessionGridState {
  if (sceneIndex < 0 || sceneIndex >= grid.sceneHeaders.length) return grid;

  const newHeaders = grid.sceneHeaders.map((header, idx) =>
    idx === sceneIndex ? { ...header, color } : header
  );

  return {
    ...grid,
    sceneHeaders: newHeaders,
  };
}

/**
 * Sets scene tempo.
 */
export function setSceneTempo(
  grid: SessionGridState,
  sceneIndex: number,
  tempo: number
): SessionGridState {
  if (sceneIndex < 0 || sceneIndex >= grid.sceneHeaders.length) return grid;

  const newHeaders = grid.sceneHeaders.map((header, idx) =>
    idx === sceneIndex ? { ...header, tempo } : header
  );

  return {
    ...grid,
    sceneHeaders: newHeaders,
  };
}

/**
 * Sets scene time signature.
 */
export function setSceneTimeSignature(
  grid: SessionGridState,
  sceneIndex: number,
  numerator: number,
  denominator: number
): SessionGridState {
  if (sceneIndex < 0 || sceneIndex >= grid.sceneHeaders.length) return grid;

  const newHeaders = grid.sceneHeaders.map((header, idx) =>
    idx === sceneIndex 
      ? { ...header, timeSignature: { numerator, denominator } } 
      : header
  );

  return {
    ...grid,
    sceneHeaders: newHeaders,
  };
}

/**
 * Sets scene follow action.
 */
export function setSceneFollowAction(
  grid: SessionGridState,
  sceneIndex: number,
  followAction: FollowAction
): SessionGridState {
  if (sceneIndex < 0 || sceneIndex >= grid.sceneHeaders.length) return grid;

  const newHeaders = grid.sceneHeaders.map((header, idx) =>
    idx === sceneIndex ? { ...header, followAction } : header
  );

  return {
    ...grid,
    sceneHeaders: newHeaders,
  };
}

/**
 * Launches all clips in a scene.
 * This triggers all non-empty clips in the specified scene row.
 */
export function launchScene(
  grid: SessionGridState,
  sceneIndex: number
): SessionGridState {
  if (sceneIndex < 0 || sceneIndex >= grid.sceneCount) return grid;

  const newSlots = new Map(grid.slots);

  // Queue all clips in this scene
  for (let trackIndex = 0; trackIndex < grid.trackCount; trackIndex++) {
    const position: GridPosition = { trackIndex, sceneIndex };
    const key = gridPositionToKey(position);
    const slot = newSlots.get(key);

    if (slot && slot.clipId && slot.state !== 'playing') {
      // Queue the clip for launch
      newSlots.set(key, {
        ...slot,
        state: 'queued',
      });
    }
  }

  return {
    ...grid,
    slots: newSlots,
  };
}

/**
 * Duplicates a scene (creates a copy of all clips and scene settings).
 */
export function duplicateScene(
  grid: SessionGridState,
  sourceSceneIndex: number,
  targetSceneIndex?: number
): SessionGridState {
  if (sourceSceneIndex < 0 || sourceSceneIndex >= grid.sceneCount) return grid;

  // If no target specified, add after the source
  const targetIdx = targetSceneIndex ?? sourceSceneIndex + 1;
  
  if (targetIdx < 0 || targetIdx > grid.sceneCount) return grid;

  // Create new scene header
  const sourceHeader = grid.sceneHeaders[sourceSceneIndex]!;
  const newHeader: SceneHeader = {
    ...sourceHeader,
    sceneIndex: targetIdx,
    name: `${sourceHeader.name} Copy`,
  };

  // Insert new scene header
  const newSceneHeaders = [
    ...grid.sceneHeaders.slice(0, targetIdx),
    newHeader,
    ...grid.sceneHeaders.slice(targetIdx).map(h => ({ ...h, sceneIndex: h.sceneIndex + 1 })),
  ];

  // Update slots: shift indices and copy source scene clips
  const newSlots = new Map<string, ClipSlot>();
  
  for (const [key, slot] of grid.slots) {
    const pos = slot.position;
    
    if (pos.sceneIndex < targetIdx) {
      // Keep slots before insert point unchanged
      newSlots.set(key, slot);
    } else {
      // Shift slots at and after insert point down by 1
      const newPos: GridPosition = {
        trackIndex: pos.trackIndex,
        sceneIndex: pos.sceneIndex + 1,
      };
      newSlots.set(gridPositionToKey(newPos), {
        ...slot,
        position: newPos,
      });
    }

    // Copy clips from source scene to new scene
    if (pos.sceneIndex === sourceSceneIndex) {
      const newPos: GridPosition = {
        trackIndex: pos.trackIndex,
        sceneIndex: targetIdx,
      };
      newSlots.set(gridPositionToKey(newPos), {
        ...slot,
        position: newPos,
        state: 'filled', // Reset state
        selected: false,
      });
    }
  }

  // Add empty slots for the new scene if needed
  for (let trackIndex = 0; trackIndex < grid.trackCount; trackIndex++) {
    const newPos: GridPosition = { trackIndex, sceneIndex: targetIdx };
    const key = gridPositionToKey(newPos);
    if (!newSlots.has(key)) {
      newSlots.set(key, {
        position: newPos,
        state: 'empty',
        selected: false,
      });
    }
  }

  return {
    ...grid,
    sceneCount: grid.sceneCount + 1,
    sceneHeaders: newSceneHeaders,
    slots: newSlots,
  };
}

/**
 * Deletes a scene (removes all clips and the scene row).
 */
export function deleteScene(
  grid: SessionGridState,
  sceneIndex: number
): SessionGridState {
  if (sceneIndex < 0 || sceneIndex >= grid.sceneCount) return grid;
  if (grid.sceneCount <= 1) return grid; // Keep at least one scene

  // Remove scene header
  const newSceneHeaders = grid.sceneHeaders
    .filter((_, idx) => idx !== sceneIndex)
    .map((h, idx) => ({ ...h, sceneIndex: idx }));

  // Update slots: remove deleted scene and shift indices
  const newSlots = new Map<string, ClipSlot>();
  
  for (const [, slot] of grid.slots) {
    const pos = slot.position;
    
    if (pos.sceneIndex < sceneIndex) {
      // Keep slots before deleted scene unchanged
      newSlots.set(gridPositionToKey(pos), slot);
    } else if (pos.sceneIndex > sceneIndex) {
      // Shift slots after deleted scene up by 1
      const newPos: GridPosition = {
        trackIndex: pos.trackIndex,
        sceneIndex: pos.sceneIndex - 1,
      };
      newSlots.set(gridPositionToKey(newPos), {
        ...slot,
        position: newPos,
      });
    }
    // Skip slots in the deleted scene (pos.sceneIndex === sceneIndex)
  }

  return {
    ...grid,
    sceneCount: grid.sceneCount - 1,
    sceneHeaders: newSceneHeaders,
    slots: newSlots,
  };
}

/**
 * Reorders scenes by moving a scene to a new position.
 */
export function reorderScene(
  grid: SessionGridState,
  fromIndex: number,
  toIndex: number
): SessionGridState {
  if (fromIndex < 0 || fromIndex >= grid.sceneCount) return grid;
  if (toIndex < 0 || toIndex >= grid.sceneCount) return grid;
  if (fromIndex === toIndex) return grid;

  // Reorder scene headers
  const headers = [...grid.sceneHeaders];
  const [movedHeader] = headers.splice(fromIndex, 1);
  headers.splice(toIndex, 0, movedHeader!);
  
  // Update scene indices
  const newSceneHeaders = headers.map((h, idx) => ({ ...h, sceneIndex: idx }));

  // Build scene index mapping
  const indexMap = new Map<number, number>();
  headers.forEach((h, newIdx) => {
    indexMap.set(h.sceneIndex, newIdx);
  });

  // Update slots with new scene indices
  const newSlots = new Map<string, ClipSlot>();
  
  for (const [, slot] of grid.slots) {
    const newSceneIndex = indexMap.get(slot.position.sceneIndex) ?? slot.position.sceneIndex;
    const newPos: GridPosition = {
      trackIndex: slot.position.trackIndex,
      sceneIndex: newSceneIndex,
    };
    newSlots.set(gridPositionToKey(newPos), {
      ...slot,
      position: newPos,
    });
  }

  return {
    ...grid,
    sceneHeaders: newSceneHeaders,
    slots: newSlots,
  };
}

/**
 * Inserts a new empty scene at the specified position.
 */
export function insertScene(
  grid: SessionGridState,
  atIndex: number,
  name?: string
): SessionGridState {
  if (atIndex < 0 || atIndex > grid.sceneCount) return grid;

  // Create new scene header
  const newHeader: SceneHeader = {
    sceneIndex: atIndex,
    name: name ?? `Scene ${atIndex + 1}`,
  };

  // Insert new scene header
  const newSceneHeaders = [
    ...grid.sceneHeaders.slice(0, atIndex),
    newHeader,
    ...grid.sceneHeaders.slice(atIndex).map(h => ({ ...h, sceneIndex: h.sceneIndex + 1 })),
  ];

  // Update slots: shift indices and add empty slots for new scene
  const newSlots = new Map<string, ClipSlot>();
  
  for (const [, slot] of grid.slots) {
    const pos = slot.position;
    
    if (pos.sceneIndex < atIndex) {
      // Keep slots before insert point unchanged
      newSlots.set(gridPositionToKey(pos), slot);
    } else {
      // Shift slots at and after insert point down by 1
      const newPos: GridPosition = {
        trackIndex: pos.trackIndex,
        sceneIndex: pos.sceneIndex + 1,
      };
      newSlots.set(gridPositionToKey(newPos), {
        ...slot,
        position: newPos,
      });
    }
  }

  // Add empty slots for the new scene
  for (let trackIndex = 0; trackIndex < grid.trackCount; trackIndex++) {
    const newPos: GridPosition = { trackIndex, sceneIndex: atIndex };
    const key = gridPositionToKey(newPos);
    newSlots.set(key, {
      position: newPos,
      state: 'empty',
      selected: false,
    });
  }

  return {
    ...grid,
    sceneCount: grid.sceneCount + 1,
    sceneHeaders: newSceneHeaders,
    slots: newSlots,
  };
}

/**
 * Adds markers to a scene for timeline navigation.
 */
export function addSceneMarkers(
  grid: SessionGridState,
  sceneIndex: number,
  markers: readonly SceneMarker[]
): SessionGridState {
  if (sceneIndex < 0 || sceneIndex >= grid.sceneHeaders.length) return grid;

  const newHeaders = grid.sceneHeaders.map((header, idx) =>
    idx === sceneIndex ? { ...header, markers } : header
  );

  return {
    ...grid,
    sceneHeaders: newHeaders,
  };
}

/**
 * Sets a description for a scene.
 */
export function setSceneDescription(
  grid: SessionGridState,
  sceneIndex: number,
  description: string
): SessionGridState {
  if (sceneIndex < 0 || sceneIndex >= grid.sceneHeaders.length) return grid;

  const newHeaders = grid.sceneHeaders.map((header, idx) =>
    idx === sceneIndex ? { ...header, description } : header
  );

  return {
    ...grid,
    sceneHeaders: newHeaders,
  };
}

/**
 * Creates a snapshot of a scene's current state.
 */
export function snapshotScene(
  grid: SessionGridState,
  sceneIndex: number
): SceneSnapshot | null {
  if (sceneIndex < 0 || sceneIndex >= grid.sceneCount) return null;

  const sceneHeader = grid.sceneHeaders[sceneIndex];
  if (!sceneHeader) return null;

  // Capture clip states for this scene
  const clipStates = new Map<number, ClipSlotState>();
  for (let trackIndex = 0; trackIndex < grid.trackCount; trackIndex++) {
    const position: GridPosition = { trackIndex, sceneIndex };
    const key = gridPositionToKey(position);
    const slot = grid.slots.get(key);
    if (slot) {
      clipStates.set(trackIndex, slot.state);
    }
  }

  return {
    sceneIndex,
    timestamp: Date.now(),
    clipStates,
    sceneHeader,
  };
}

/**
 * Recalls a scene from a snapshot, restoring its state.
 */
export function recallSceneSnapshot(
  grid: SessionGridState,
  snapshot: SceneSnapshot
): SessionGridState {
  const sceneIndex = snapshot.sceneIndex;
  if (sceneIndex < 0 || sceneIndex >= grid.sceneCount) return grid;

  // Restore scene header
  const newSceneHeaders = grid.sceneHeaders.map((header, idx) =>
    idx === sceneIndex ? { ...snapshot.sceneHeader, sceneIndex } : header
  );

  // Restore clip states
  const newSlots = new Map(grid.slots);
  for (const [trackIndex, state] of snapshot.clipStates) {
    const position: GridPosition = { trackIndex, sceneIndex };
    const key = gridPositionToKey(position);
    const slot = newSlots.get(key);
    if (slot) {
      newSlots.set(key, {
        ...slot,
        state,
      });
    }
  }

  return {
    ...grid,
    sceneHeaders: newSceneHeaders,
    slots: newSlots,
  };
}

/**
 * Sets the loop mode for a scene.
 */
export function setSceneLoopMode(
  grid: SessionGridState,
  sceneIndex: number,
  loopMode: SceneLoopMode
): SessionGridState {
  if (sceneIndex < 0 || sceneIndex >= grid.sceneHeaders.length) return grid;

  const newHeaders = grid.sceneHeaders.map((header, idx) =>
    idx === sceneIndex ? { ...header, loopMode } : header
  );

  return {
    ...grid,
    sceneHeaders: newHeaders,
  };
}

/**
 * Sets the transition type for a scene.
 */
export function setSceneTransition(
  grid: SessionGridState,
  sceneIndex: number,
  transitionType: SceneTransitionType
): SessionGridState {
  if (sceneIndex < 0 || sceneIndex >= grid.sceneHeaders.length) return grid;

  const newHeaders = grid.sceneHeaders.map((header, idx) =>
    idx === sceneIndex ? { ...header, transitionType } : header
  );

  return {
    ...grid,
    sceneHeaders: newHeaders,
  };
}

/**
 * Adds a cue point to a scene.
 */
export function addSceneCuePoint(
  grid: SessionGridState,
  sceneIndex: number,
  cuePoint: SceneCuePoint
): SessionGridState {
  if (sceneIndex < 0 || sceneIndex >= grid.sceneHeaders.length) return grid;

  const newHeaders = grid.sceneHeaders.map((header, idx) => {
    if (idx === sceneIndex) {
      const existingCuePoints = header.cuePoints ?? [];
      return {
        ...header,
        cuePoints: [...existingCuePoints, cuePoint],
      };
    }
    return header;
  });

  return {
    ...grid,
    sceneHeaders: newHeaders,
  };
}

/**
 * Captures the arrangement from all scenes.
 * This exports the scene structure for use in arrangement view.
 */
export function captureSceneArrangement(
  grid: SessionGridState
): Array<{ sceneIndex: number; clips: Array<{ trackIndex: number; clipId?: ContainerId }> }> {
  const arrangement: Array<{ sceneIndex: number; clips: Array<{ trackIndex: number; clipId?: ContainerId }> }> = [];

  for (let sceneIndex = 0; sceneIndex < grid.sceneCount; sceneIndex++) {
    const clips: Array<{ trackIndex: number; clipId?: ContainerId }> = [];
    
    for (let trackIndex = 0; trackIndex < grid.trackCount; trackIndex++) {
      const position: GridPosition = { trackIndex, sceneIndex };
      const key = gridPositionToKey(position);
      const slot = grid.slots.get(key);
      
      if (slot && slot.clipId) {
        clips.push({ trackIndex, clipId: slot.clipId });
      }
    }
    
    arrangement.push({ sceneIndex, clips });
  }

  return arrangement;
}

/**
 * Converts scene arrangement to timeline arrangement.
 * This places scenes sequentially in the arrangement timeline.
 */
export function sceneToArrangement(
  grid: SessionGridState,
  sceneIndices: readonly number[],
  barsPerScene: number = 4
): Array<{ trackIndex: number; clipId: ContainerId; startBar: number; lengthBars: number }> {
  const arrangement: Array<{ trackIndex: number; clipId: ContainerId; startBar: number; lengthBars: number }> = [];
  
  let currentBar = 0;
  
  for (const sceneIndex of sceneIndices) {
    if (sceneIndex < 0 || sceneIndex >= grid.sceneCount) continue;
    
    for (let trackIndex = 0; trackIndex < grid.trackCount; trackIndex++) {
      const position: GridPosition = { trackIndex, sceneIndex };
      const key = gridPositionToKey(position);
      const slot = grid.slots.get(key);
      
      if (slot && slot.clipId) {
        arrangement.push({
          trackIndex,
          clipId: slot.clipId,
          startBar: currentBar,
          lengthBars: barsPerScene,
        });
      }
    }
    
    currentBar += barsPerScene;
  }

  return arrangement;
}

// ============================================================================
// CLIP OPERATIONS
// ============================================================================

/**
 * Duplicates a clip from one slot to another.
 * If target is not provided, places duplicate in next empty slot in same track.
 */
export function duplicateClip(
  grid: SessionGridState,
  source: GridPosition,
  target?: GridPosition
): SessionGridState {
  const sourceKey = gridPositionToKey(source);
  const sourceSlot = grid.slots.get(sourceKey);
  
  if (!sourceSlot || !sourceSlot.clipId) return grid;

  // Find target position if not specified
  let targetPos = target;
  if (!targetPos) {
    // Find next empty slot in same track
    for (let i = 0; i < grid.sceneCount; i++) {
      const pos: GridPosition = { trackIndex: source.trackIndex, sceneIndex: i };
      const key = gridPositionToKey(pos);
      const slot = grid.slots.get(key);
      if (slot && slot.state === 'empty') {
        targetPos = pos;
        break;
      }
    }
    if (!targetPos) return grid; // No empty slot found
  }

  // Create duplicate in target slot (with new ID)
  const targetKey = gridPositionToKey(targetPos);
  const targetSlot = grid.slots.get(targetKey);
  if (!targetSlot) return grid;

  const duplicatedSlot: ClipSlot = {
    position: targetSlot.position,
    selected: targetSlot.selected,
    clipId: generateContainerId(), // New clip ID for duplicate
    state: 'filled',
    ...(sourceSlot.name && { name: `${sourceSlot.name} (copy)` }),
    ...(sourceSlot.color && { color: sourceSlot.color }),
    ...(sourceSlot.info && { info: sourceSlot.info }),
  };

  const newSlots = new Map(grid.slots);
  newSlots.set(targetKey, duplicatedSlot);

  return {
    ...grid,
    slots: newSlots,
  };
}

/**
 * Deletes a clip from a slot.
 */
export function deleteClip(
  grid: SessionGridState,
  position: GridPosition
): SessionGridState {
  return removeClipFromSlot(grid, position);
}

/**
 * Renames a clip in a slot.
 */
export function renameClip(
  grid: SessionGridState,
  position: GridPosition,
  name: string
): SessionGridState {
  const key = gridPositionToKey(position);
  const existingSlot = grid.slots.get(key);
  if (!existingSlot || !existingSlot.clipId) return grid;

  const updatedSlot: ClipSlot = {
    ...existingSlot,
    name,
  };

  const newSlots = new Map(grid.slots);
  newSlots.set(key, updatedSlot);

  return {
    ...grid,
    slots: newSlots,
  };
}

/**
 * Changes the color of a clip in a slot.
 */
export function changeClipColor(
  grid: SessionGridState,
  position: GridPosition,
  color: string
): SessionGridState {
  return setClipSlotColor(grid, position, color);
}

/**
 * Sets the length display for a clip.
 */
export function setClipLength(
  grid: SessionGridState,
  position: GridPosition,
  length: number
): SessionGridState {
  const key = gridPositionToKey(position);
  const existingSlot = grid.slots.get(key);
  if (!existingSlot || !existingSlot.clipId) return grid;

  const updatedSlot: ClipSlot = {
    ...existingSlot,
    info: {
      ...existingSlot.info,
      length,
    },
  };

  const newSlots = new Map(grid.slots);
  newSlots.set(key, updatedSlot);

  return {
    ...grid,
    slots: newSlots,
  };
}

/**
 * Sets the waveform preview data for an audio clip.
 */
export function setClipWaveformPreview(
  grid: SessionGridState,
  position: GridPosition,
  waveformData: Float32Array
): SessionGridState {
  const key = gridPositionToKey(position);
  const existingSlot = grid.slots.get(key);
  if (!existingSlot || !existingSlot.clipId) return grid;

  const updatedSlot: ClipSlot = {
    ...existingSlot,
    info: {
      ...existingSlot.info,
      waveformData,
    },
  };

  const newSlots = new Map(grid.slots);
  newSlots.set(key, updatedSlot);

  return {
    ...grid,
    slots: newSlots,
  };
}

/**
 * Sets the MIDI preview data for a MIDI clip.
 */
export function setClipMidiPreview(
  grid: SessionGridState,
  position: GridPosition,
  notes: Array<{ pitch: number; start: number; duration: number }>
): SessionGridState {
  const key = gridPositionToKey(position);
  const existingSlot = grid.slots.get(key);
  if (!existingSlot || !existingSlot.clipId) return grid;

  const updatedSlot: ClipSlot = {
    ...existingSlot,
    info: {
      ...existingSlot.info,
      midiPreviewNotes: notes,
    },
  };

  const newSlots = new Map(grid.slots);
  newSlots.set(key, updatedSlot);

  return {
    ...grid,
    slots: newSlots,
  };
}

/**
 * Sets the loading progress for a clip (0-1).
 */
export function setClipLoadingProgress(
  grid: SessionGridState,
  position: GridPosition,
  progress: number
): SessionGridState {
  const key = gridPositionToKey(position);
  const existingSlot = grid.slots.get(key);
  if (!existingSlot) return grid;

  const updatedSlot: ClipSlot = {
    ...existingSlot,
    info: {
      ...existingSlot.info,
      loadingProgress: Math.max(0, Math.min(1, progress)),
    },
  };

  const newSlots = new Map(grid.slots);
  newSlots.set(key, updatedSlot);

  return {
    ...grid,
    slots: newSlots,
  };
}

/**
 * Sets an error state for a clip.
 */
export function setClipError(
  grid: SessionGridState,
  position: GridPosition,
  error: string
): SessionGridState {
  const key = gridPositionToKey(position);
  const existingSlot = grid.slots.get(key);
  if (!existingSlot) return grid;

  const updatedSlot: ClipSlot = {
    ...existingSlot,
    info: {
      ...existingSlot.info,
      error,
    },
  };

  const newSlots = new Map(grid.slots);
  newSlots.set(key, updatedSlot);

  return {
    ...grid,
    slots: newSlots,
  };
}

/**
 * Sets the recording state for a clip.
 */
export function setClipRecordingState(
  grid: SessionGridState,
  position: GridPosition,
  recording: { active: boolean; startTime?: number; currentLength?: number }
): SessionGridState {
  const key = gridPositionToKey(position);
  const existingSlot = grid.slots.get(key);
  if (!existingSlot) return grid;

  const updatedSlot: ClipSlot = {
    ...existingSlot,
    state: recording.active ? 'filled' : existingSlot.state,
    info: {
      ...existingSlot.info,
      recording,
    },
  };

  const newSlots = new Map(grid.slots);
  newSlots.set(key, updatedSlot);

  return {
    ...grid,
    slots: newSlots,
  };
}

// ============================================================================
// CONTEXT MENU
// ============================================================================

/**
 * Shows the context menu for a clip slot.
 */
export function showContextMenu(
  position: GridPosition,
  x: number,
  y: number
): ClipSlotContextMenu {
  return {
    visible: true,
    position: { x, y },
    slot: position,
    actions: [
      'duplicate',
      'delete',
      'rename',
      'change-color',
      'export',
      'quantize',
      'reverse',
      'transpose',
    ],
  };
}

/**
 * Hides the context menu.
 */
export function hideContextMenu(): ClipSlotContextMenu {
  return {
    visible: false,
    position: { x: 0, y: 0 },
    actions: [],
  };
}

// ============================================================================
// SESSION PANEL LAYOUT
// ============================================================================

/**
 * Configuration for session panel layout.
 */
export interface SessionPanelLayout {
  readonly slotWidth: number;
  readonly slotHeight: number;
  readonly headerHeight: number;
  readonly sidebarWidth: number;
  readonly gap: number;
}

/**
 * Default session panel layout.
 */
export const DEFAULT_SESSION_LAYOUT: SessionPanelLayout = {
  slotWidth: 80,
  slotHeight: 60,
  headerHeight: 40,
  sidebarWidth: 120,
  gap: 2,
};

/**
 * Calculates the pixel position for a clip slot.
 */
export function calculateSlotPosition(
  position: GridPosition,
  layout: SessionPanelLayout = DEFAULT_SESSION_LAYOUT
): { x: number; y: number; width: number; height: number } {
  return {
    x: layout.sidebarWidth + position.trackIndex * (layout.slotWidth + layout.gap),
    y: layout.headerHeight + position.sceneIndex * (layout.slotHeight + layout.gap),
    width: layout.slotWidth,
    height: layout.slotHeight,
  };
}

/**
 * Calculates which grid position corresponds to pixel coordinates.
 */
export function pixelToGridPosition(
  x: number,
  y: number,
  layout: SessionPanelLayout = DEFAULT_SESSION_LAYOUT
): GridPosition | null {
  // Check if within the grid area
  if (x < layout.sidebarWidth || y < layout.headerHeight) {
    return null;
  }

  const gridX = x - layout.sidebarWidth;
  const gridY = y - layout.headerHeight;

  const trackIndex = Math.floor(gridX / (layout.slotWidth + layout.gap));
  const sceneIndex = Math.floor(gridY / (layout.slotHeight + layout.gap));

  // Check if within actual slot (not in gap)
  const slotX = gridX % (layout.slotWidth + layout.gap);
  const slotY = gridY % (layout.slotHeight + layout.gap);

  if (slotX > layout.slotWidth || slotY > layout.slotHeight) {
    return null; // Clicked in gap
  }

  return { trackIndex, sceneIndex };
}

// ============================================================================
// CLIP LAUNCH FUNCTIONS
// ============================================================================

/**
 * Creates a default launch configuration.
 */
export function createDefaultLaunchConfig(): ClipLaunchConfig {
  return {
    launchMode: 'quantized',
    quantization: '1',
    playMode: 'loop',
  };
}

/**
 * Sets the launch configuration for a clip slot.
 */
export function setClipLaunchConfig(
  grid: SessionGridState,
  position: GridPosition,
  config: Partial<ClipLaunchConfig>
): SessionGridState {
  const key = gridPositionToKey(position);
  const existingSlot = grid.slots.get(key);
  if (!existingSlot) return grid;

  const currentConfig = existingSlot.launchConfig ?? createDefaultLaunchConfig();
  const updatedSlot: ClipSlot = {
    ...existingSlot,
    launchConfig: {
      ...currentConfig,
      ...config,
    },
  };

  const newSlots = new Map(grid.slots);
  newSlots.set(key, updatedSlot);

  return {
    ...grid,
    slots: newSlots,
  };
}

/**
 * Sets the launch mode for a clip.
 */
export function setClipLaunchMode(
  grid: SessionGridState,
  position: GridPosition,
  launchMode: LaunchMode
): SessionGridState {
  return setClipLaunchConfig(grid, position, { launchMode });
}

/**
 * Sets the launch quantization for a clip.
 */
export function setClipLaunchQuantization(
  grid: SessionGridState,
  position: GridPosition,
  quantization: LaunchQuantization
): SessionGridState {
  return setClipLaunchConfig(grid, position, { quantization });
}

/**
 * Sets the play mode for a clip.
 */
export function setClipPlayMode(
  grid: SessionGridState,
  position: GridPosition,
  playMode: ClipPlayMode
): SessionGridState {
  return setClipLaunchConfig(grid, position, { playMode });
}

/**
 * Sets the follow action for a clip.
 */
export function setClipFollowAction(
  grid: SessionGridState,
  position: GridPosition,
  followAction: FollowAction | undefined
): SessionGridState {
  if (followAction === undefined) {
    const key = gridPositionToKey(position);
    const existingSlot = grid.slots.get(key);
    if (!existingSlot || !existingSlot.launchConfig) return grid;

    const { followAction: _, ...restConfig } = existingSlot.launchConfig;
    const updatedSlot: ClipSlot = {
      ...existingSlot,
      launchConfig: restConfig,
    };

    const newSlots = new Map(grid.slots);
    newSlots.set(key, updatedSlot);

    return {
      ...grid,
      slots: newSlots,
    };
  }
  return setClipLaunchConfig(grid, position, { followAction });
}

/**
 * Sets the fade in duration for a clip.
 */
export function setClipFadeIn(
  grid: SessionGridState,
  position: GridPosition,
  fadeInTicks: number
): SessionGridState {
  return setClipLaunchConfig(grid, position, { fadeInTicks });
}

/**
 * Sets the fade out duration for a clip.
 */
export function setClipFadeOut(
  grid: SessionGridState,
  position: GridPosition,
  fadeOutTicks: number
): SessionGridState {
  return setClipLaunchConfig(grid, position, { fadeOutTicks });
}

/**
 * Sets the start offset for a clip.
 */
export function setClipStartOffset(
  grid: SessionGridState,
  position: GridPosition,
  startOffsetTicks: number
): SessionGridState {
  return setClipLaunchConfig(grid, position, { startOffsetTicks });
}

/**
 * Converts quantization enum to tick value.
 * @param quantization - The quantization type
 * @param ticksPerBeat - Ticks per beat (typically 960 from PPQN)
 * @param beatsPerBar - Beats per bar (from time signature)
 */
export function quantizationToTicks(
  quantization: LaunchQuantization,
  ticksPerBeat: number = 960,
  beatsPerBar: number = 4
): number {
  const ticksPerBar = ticksPerBeat * beatsPerBar;
  
  switch (quantization) {
    case 'none':
      return 0;
    case '1/4':
      return ticksPerBeat;
    case '1/2':
      return ticksPerBeat * 2;
    case '1':
      return ticksPerBar;
    case '2':
      return ticksPerBar * 2;
    case '4':
      return ticksPerBar * 4;
    case '8':
      return ticksPerBar * 8;
  }
}

/**
 * Calculates the next quantized launch time.
 * @param currentTick - Current playback position in ticks
 * @param quantization - The quantization type
 * @param ticksPerBeat - Ticks per beat (typically 960)
 * @param beatsPerBar - Beats per bar (from time signature)
 * @returns The tick at which the clip should start
 */
export function calculateNextLaunchTime(
  currentTick: number,
  quantization: LaunchQuantization,
  ticksPerBeat: number = 960,
  beatsPerBar: number = 4
): number {
  if (quantization === 'none') {
    return currentTick; // Immediate
  }

  const quantTicks = quantizationToTicks(quantization, ticksPerBeat, beatsPerBar);
  
  // Round up to next quantization boundary
  return Math.ceil(currentTick / quantTicks) * quantTicks;
}

/**
 * Checks if a follow action should trigger.
 * @param clipStartTick - When the clip started playing
 * @param currentTick - Current playback position
 * @param _clipLengthTicks - Length of the clip (reserved for future loop-based actions)
 * @param followAction - The follow action configuration
 * @param ticksPerBeat - Ticks per beat
 * @param beatsPerBar - Beats per bar
 * @returns true if follow action should trigger now
 */
export function shouldTriggerFollowAction(
  clipStartTick: number,
  currentTick: number,
  _clipLengthTicks: number,
  followAction: FollowAction,
  ticksPerBeat: number = 960,
  beatsPerBar: number = 4
): boolean {
  const ticksPerBar = ticksPerBeat * beatsPerBar;
  const triggerTicks = followAction.timeInBars * ticksPerBar;
  const elapsedTicks = currentTick - clipStartTick;
  
  // Check if we've reached the trigger time
  return elapsedTicks >= triggerTicks;
}

/**
 * Sets the end offset for a clip.
 */
export function setClipEndOffset(
  grid: SessionGridState,
  position: GridPosition,
  endOffsetTicks: number
): SessionGridState {
  return setClipLaunchConfig(grid, position, { endOffsetTicks });
}

/**
 * Sets warp markers for a clip.
 */
export function setClipWarpMarkers(
  grid: SessionGridState,
  position: GridPosition,
  warpMarkers: readonly WarpMarker[]
): SessionGridState {
  return setClipLaunchConfig(grid, position, { warpMarkers });
}

/**
 * Sets tempo sync for a clip.
 */
export function setClipTempoSync(
  grid: SessionGridState,
  position: GridPosition,
  tempoSync: boolean
): SessionGridState {
  return setClipLaunchConfig(grid, position, { tempoSync });
}

/**
 * Sets pitch lock for a clip.
 */
export function setClipPitchLock(
  grid: SessionGridState,
  position: GridPosition,
  pitchLock: boolean
): SessionGridState {
  return setClipLaunchConfig(grid, position, { pitchLock });
}

/**
 * Sets velocity curve for a clip.
 */
export function setClipVelocityCurve(
  grid: SessionGridState,
  position: GridPosition,
  velocityCurve: number
): SessionGridState {
  return setClipLaunchConfig(grid, position, { velocityCurve });
}

/**
 * Sets groove amount for a clip.
 */
export function setClipGrooveAmount(
  grid: SessionGridState,
  position: GridPosition,
  grooveAmount: number
): SessionGridState {
  // Clamp between 0 and 1
  const clamped = Math.max(0, Math.min(1, grooveAmount));
  return setClipLaunchConfig(grid, position, { grooveAmount: clamped });
}

/**
 * Sets launch probability for a clip.
 */
export function setClipProbability(
  grid: SessionGridState,
  position: GridPosition,
  probability: number
): SessionGridState {
  // Clamp between 0 and 1
  const clamped = Math.max(0, Math.min(1, probability));
  return setClipLaunchConfig(grid, position, { probability: clamped });
}

/**
 * Sets launch condition for a clip.
 */
export function setClipCondition(
  grid: SessionGridState,
  position: GridPosition,
  condition: ClipCondition,
  conditionInterval?: number
): SessionGridState {
  const config = { condition } as Partial<ClipLaunchConfig>;
  if (conditionInterval !== undefined) {
    (config as { conditionInterval?: number }).conditionInterval = conditionInterval;
  }
  return setClipLaunchConfig(grid, position, config);
}

/**
 * Sets choke group for a clip.
 */
export function setClipChokeGroup(
  grid: SessionGridState,
  position: GridPosition,
  chokeGroup?: number
): SessionGridState {
  if (chokeGroup === undefined) {
    return grid;
  }
  return setClipLaunchConfig(grid, position, { chokeGroup });
}

/**
 * Sets exclusive mode for a clip.
 */
export function setClipExclusiveMode(
  grid: SessionGridState,
  position: GridPosition,
  exclusiveMode: boolean
): SessionGridState {
  return setClipLaunchConfig(grid, position, { exclusiveMode });
}

/**
 * Checks if a clip should be triggered based on its condition.
 * @param condition - The clip condition
 * @param conditionInterval - The interval for nth-time or nth-bar conditions
 * @param triggerCount - How many times the clip has been triggered
 * @param currentBar - Current bar number (for nth-bar condition)
 * @returns true if the clip should be triggered
 */
export function shouldTriggerClipByCondition(
  condition: ClipCondition = 'always',
  conditionInterval: number = 1,
  triggerCount: number,
  currentBar: number = 0
): boolean {
  switch (condition) {
    case 'always':
      return true;
    case 'first':
      return triggerCount === 0;
    case 'nth-time':
      return triggerCount % conditionInterval === 0;
    case 'nth-bar':
      return currentBar % conditionInterval === 0;
  }
}

/**
 * Checks if a clip should be triggered based on its probability.
 * @param probability - Launch probability (0-1, default 1)
 * @returns true if the clip passes the probability check
 */
export function shouldTriggerClipByProbability(probability: number = 1): boolean {
  return Math.random() < probability;
}

// ============================================================================
// TRACK MANAGEMENT
// ============================================================================

/**
 * Track type determines what kind of content a track can contain.
 */
export type TrackType = 'audio' | 'midi' | 'aux';

/**
 * Adds a new track to the session grid.
 * @param grid - Current session grid state
 * @param trackType - Type of track to add ('audio', 'midi', or 'aux')
 * @param name - Optional track name (defaults to "Track N")
 * @param color - Optional track color
 * @returns Updated session grid state with the new track
 */
export function addTrack(
  grid: SessionGridState,
  _trackType: TrackType = 'midi',
  name?: string,
  color?: string
): SessionGridState {
  const newTrackIndex = grid.trackCount;
  const trackName = name ?? `Track ${newTrackIndex + 1}`;

  // Create new track header
  const newTrackHeader: TrackHeader = {
    trackIndex: newTrackIndex,
    name: trackName,
    ...(color && { color }),
    muted: false,
    soloed: false,
    armed: false,
    volume: 1.0,  // Unity gain
    pan: 0.0,     // Center
    io: {
      monitoring: 'auto',
      inputGain: 0.0,
    },
    sends: [],    // No sends by default
  };

  // Create slots for the new track
  const newSlots = new Map(grid.slots);
  for (let sceneIndex = 0; sceneIndex < grid.sceneCount; sceneIndex++) {
    const position: GridPosition = { trackIndex: newTrackIndex, sceneIndex };
    newSlots.set(gridPositionToKey(position), {
      position,
      state: 'empty',
      selected: false,
    });
  }

  return {
    ...grid,
    trackCount: grid.trackCount + 1,
    trackHeaders: [...grid.trackHeaders, newTrackHeader],
    slots: newSlots,
  };
}

/**
 * Deletes a track from the session grid.
 * @param grid - Current session grid state
 * @param trackIndex - Index of the track to delete
 * @returns Updated session grid state with the track removed
 */
export function deleteTrack(
  grid: SessionGridState,
  trackIndex: number
): SessionGridState {
  if (trackIndex < 0 || trackIndex >= grid.trackCount) {
    return grid;
  }

  // Remove track header
  const newTrackHeaders = grid.trackHeaders
    .filter((_, idx) => idx !== trackIndex)
    .map((header, idx) => ({ ...header, trackIndex: idx }));

  // Remove slots for deleted track and reindex remaining tracks
  const newSlots = new Map<string, ClipSlot>();
  grid.slots.forEach((slot) => {
    if (slot.position.trackIndex === trackIndex) {
      // Skip slots from deleted track
      return;
    }
    // Reindex tracks after the deleted one
    const newTrackIdx = slot.position.trackIndex > trackIndex 
      ? slot.position.trackIndex - 1 
      : slot.position.trackIndex;
    const newPosition: GridPosition = {
      trackIndex: newTrackIdx,
      sceneIndex: slot.position.sceneIndex,
    };
    newSlots.set(gridPositionToKey(newPosition), {
      ...slot,
      position: newPosition,
    });
  });

  return {
    ...grid,
    trackCount: grid.trackCount - 1,
    trackHeaders: newTrackHeaders,
    slots: newSlots,
  };
}

/**
 * Duplicates a track in the session grid.
 * @param grid - Current session grid state
 * @param trackIndex - Index of the track to duplicate
 * @returns Updated session grid state with the duplicated track
 */
export function duplicateTrack(
  grid: SessionGridState,
  trackIndex: number
): SessionGridState {
  if (trackIndex < 0 || trackIndex >= grid.trackCount) {
    return grid;
  }

  const sourceHeader = grid.trackHeaders[trackIndex];
  if (!sourceHeader) return grid;

  const newTrackIndex = grid.trackCount;
  
  // Create new track header
  const newTrackHeader: TrackHeader = {
    ...sourceHeader,
    trackIndex: newTrackIndex,
    name: `${sourceHeader.name} (Copy)`,
  };

  // Copy slots from source track to new track
  const newSlots = new Map(grid.slots);
  for (let sceneIndex = 0; sceneIndex < grid.sceneCount; sceneIndex++) {
    const sourcePosition: GridPosition = { trackIndex, sceneIndex };
    const sourceSlot = grid.slots.get(gridPositionToKey(sourcePosition));
    if (sourceSlot) {
      const newPosition: GridPosition = { trackIndex: newTrackIndex, sceneIndex };
      // Generate new clip ID if there is one
      const newClipId = sourceSlot.clipId ? generateContainerId() : undefined;
      const newSlot: ClipSlot = {
        ...sourceSlot,
        position: newPosition,
        ...(newClipId && { clipId: newClipId }),
        selected: false,
      };
      newSlots.set(gridPositionToKey(newPosition), newSlot);
    }
  }

  return {
    ...grid,
    trackCount: grid.trackCount + 1,
    trackHeaders: [...grid.trackHeaders, newTrackHeader],
    slots: newSlots,
  };
}

/**
 * Reorders tracks in the session grid.
 * @param grid - Current session grid state
 * @param fromIndex - Source track index
 * @param toIndex - Destination track index
 * @returns Updated session grid state with reordered tracks
 */
export function reorderTrack(
  grid: SessionGridState,
  fromIndex: number,
  toIndex: number
): SessionGridState {
  if (
    fromIndex < 0 || fromIndex >= grid.trackCount ||
    toIndex < 0 || toIndex >= grid.trackCount ||
    fromIndex === toIndex
  ) {
    return grid;
  }

  // Reorder track headers
  const newTrackHeaders = [...grid.trackHeaders];
  const [movedHeader] = newTrackHeaders.splice(fromIndex, 1);
  newTrackHeaders.splice(toIndex, 0, movedHeader!);
  
  // Update track indices
  const reindexedHeaders = newTrackHeaders.map((header, idx) => ({
    ...header,
    trackIndex: idx,
  }));

  // Reindex all slots
  const newSlots = new Map<string, ClipSlot>();
  grid.slots.forEach((slot) => {
    let newTrackIdx = slot.position.trackIndex;
    
    if (slot.position.trackIndex === fromIndex) {
      newTrackIdx = toIndex;
    } else if (fromIndex < toIndex) {
      if (slot.position.trackIndex > fromIndex && slot.position.trackIndex <= toIndex) {
        newTrackIdx = slot.position.trackIndex - 1;
      }
    } else {
      if (slot.position.trackIndex >= toIndex && slot.position.trackIndex < fromIndex) {
        newTrackIdx = slot.position.trackIndex + 1;
      }
    }
    
    const newPosition: GridPosition = {
      trackIndex: newTrackIdx,
      sceneIndex: slot.position.sceneIndex,
    };
    newSlots.set(gridPositionToKey(newPosition), {
      ...slot,
      position: newPosition,
    });
  });

  return {
    ...grid,
    trackHeaders: reindexedHeaders,
    slots: newSlots,
  };
}

/**
 * Track group for organizing related tracks.
 */
export interface TrackGroup {
  readonly id: string;
  readonly name: string;
  readonly color?: string;
  readonly trackIndices: readonly number[];
  readonly collapsed: boolean;
}

/**
 * Creates a track group from selected tracks.
 * @param tracks - Array of track indices to group
 * @param name - Name for the group
 * @param color - Optional color for the group
 * @returns New track group
 */
export function createTrackGroup(
  tracks: readonly number[],
  name: string,
  color?: string
): TrackGroup {
  return {
    id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    ...(color && { color }),
    trackIndices: [...tracks].sort((a, b) => a - b),
    collapsed: false,
  };
}

/**
 * Toggles the collapsed state of a track group.
 * @param group - Track group to toggle
 * @returns Updated track group
 */
export function toggleTrackGroupCollapsed(group: TrackGroup): TrackGroup {
  return {
    ...group,
    collapsed: !group.collapsed,
  };
}

/**
 * Extended track header with additional properties.
 */
export interface ExtendedTrackHeader extends TrackHeader {
  readonly icon?: string;
  readonly width?: number;
  readonly frozen?: boolean;
  readonly monitorMode?: 'off' | 'in' | 'auto';
}

/**
 * Sets the icon for a track.
 * @param header - Track header
 * @param icon - Icon string (emoji or icon identifier)
 * @returns Updated track header
 */
export function setTrackIcon(
  header: ExtendedTrackHeader,
  icon: string
): ExtendedTrackHeader {
  return {
    ...header,
    icon,
  };
}

/**
 * Sets the width of a track column.
 * @param header - Track header
 * @param width - Width in pixels
 * @returns Updated track header
 */
export function setTrackWidth(
  header: ExtendedTrackHeader,
  width: number
): ExtendedTrackHeader {
  return {
    ...header,
    width: Math.max(50, width),
  };
}

/**
 * Freezes a track (renders it to audio for performance).
 * @param header - Track header
 * @returns Updated track header with frozen state
 */
export function freezeTrack(
  header: ExtendedTrackHeader
): ExtendedTrackHeader {
  return {
    ...header,
    frozen: true,
  };
}

/**
 * Unfreezes a track (restores live processing).
 * @param header - Track header
 * @returns Updated track header with unfrozen state
 */
export function unfreezeTrack(
  header: ExtendedTrackHeader
): ExtendedTrackHeader {
  return {
    ...header,
    frozen: false,
  };
}

/**
 * Flattens a track by consolidating all clips into a single audio file.
 * This is a destructive operation that replaces MIDI/processed audio with a rendered bounce.
 * @param grid - Current session grid state
 * @param trackIndex - Index of the track to flatten
 * @returns Updated session grid state with flattened track
 */
export function flattenTrack(
  grid: SessionGridState,
  _trackIndex: number
): SessionGridState {
  // For now, this is a placeholder that marks the intention
  // Full implementation would require audio engine integration
  // to render all clips in the track to a single audio file
  return grid;
}

/**
 * Monitor mode for track input monitoring.
 */
export type MonitorMode = 'off' | 'in' | 'auto';

/**
 * Sets the monitor mode for a track.
 * @param header - Track header
 * @param mode - Monitor mode ('off', 'in', or 'auto')
 * @returns Updated track header
 */
export function setTrackMonitorMode(
  header: ExtendedTrackHeader,
  mode: MonitorMode
): ExtendedTrackHeader {
  return {
    ...header,
    monitorMode: mode,
  };
}

// ============================================================================
// TRACK MIXER CONTROLS
// ============================================================================

/**
 * Sets the track volume fader.
 * @param grid - Current session grid state
 * @param trackIndex - Index of the track
 * @param volume - Volume level (0.0 = -inf dB, 1.0 = 0 dB unity, 2.0 = +6 dB)
 * @returns Updated session grid state
 */
export function setTrackVolume(
  grid: SessionGridState,
  trackIndex: number,
  volume: number
): SessionGridState {
  if (trackIndex < 0 || trackIndex >= grid.trackHeaders.length) return grid;
  
  const clampedVolume = Math.max(0, Math.min(2, volume));
  const newHeaders = grid.trackHeaders.map((header, idx) =>
    idx === trackIndex ? { ...header, volume: clampedVolume } : header
  );
  
  return {
    ...grid,
    trackHeaders: newHeaders,
  };
}

/**
 * Sets the track pan control.
 * @param grid - Current session grid state
 * @param trackIndex - Index of the track
 * @param pan - Pan position (-1.0 = full left, 0.0 = center, 1.0 = full right)
 * @returns Updated session grid state
 */
export function setTrackPan(
  grid: SessionGridState,
  trackIndex: number,
  pan: number
): SessionGridState {
  if (trackIndex < 0 || trackIndex >= grid.trackHeaders.length) return grid;
  
  const clampedPan = Math.max(-1, Math.min(1, pan));
  const newHeaders = grid.trackHeaders.map((header, idx) =>
    idx === trackIndex ? { ...header, pan: clampedPan } : header
  );
  
  return {
    ...grid,
    trackHeaders: newHeaders,
  };
}

/**
 * Sets the track I/O routing configuration.
 * @param grid - Current session grid state
 * @param trackIndex - Index of the track
 * @param io - I/O routing configuration
 * @returns Updated session grid state
 */
export function setTrackIO(
  grid: SessionGridState,
  trackIndex: number,
  io: TrackIO
): SessionGridState {
  if (trackIndex < 0 || trackIndex >= grid.trackHeaders.length) return grid;
  
  const newHeaders = grid.trackHeaders.map((header, idx) =>
    idx === trackIndex ? { ...header, io } : header
  );
  
  return {
    ...grid,
    trackHeaders: newHeaders,
  };
}

/**
 * Sets the level for a track send.
 * @param grid - Current session grid state
 * @param trackIndex - Index of the track
 * @param sendIndex - Index of the send (0-7)
 * @param level - Send level (0.0 = -inf dB, 1.0 = unity)
 * @returns Updated session grid state
 */
export function setTrackSendLevel(
  grid: SessionGridState,
  trackIndex: number,
  sendIndex: number,
  level: number
): SessionGridState {
  if (trackIndex < 0 || trackIndex >= grid.trackHeaders.length) return grid;
  if (sendIndex < 0 || sendIndex > 7) return grid;
  
  const clampedLevel = Math.max(0, Math.min(1, level));
  
  const newHeaders = grid.trackHeaders.map((header, idx) => {
    if (idx !== trackIndex) return header;
    
    const sends = header.sends || [];
    const existingSendIdx = sends.findIndex(s => s.sendIndex === sendIndex);
    
    let newSends: readonly TrackSend[];
    if (existingSendIdx >= 0) {
      // Update existing send
      newSends = sends.map((s, i) =>
        i === existingSendIdx ? { ...s, level: clampedLevel } : s
      );
    } else {
      // Add new send
      const newSend: TrackSend = {
        sendIndex,
        level: clampedLevel,
        preFader: false,
      };
      newSends = [...sends, newSend].sort((a, b) => a.sendIndex - b.sendIndex);
    }
    
    return { ...header, sends: newSends };
  });
  
  return {
    ...grid,
    trackHeaders: newHeaders,
  };
}

/**
 * Updates the track meter with new peak/RMS values.
 * @param grid - Current session grid state
 * @param trackIndex - Index of the track
 * @param meter - Meter values
 * @returns Updated session grid state
 */
export function updateTrackMeter(
  grid: SessionGridState,
  trackIndex: number,
  meter: TrackMeter
): SessionGridState {
  if (trackIndex < 0 || trackIndex >= grid.trackHeaders.length) return grid;
  
  const newHeaders = grid.trackHeaders.map((header, idx) =>
    idx === trackIndex ? { ...header, meter } : header
  );
  
  return {
    ...grid,
    trackHeaders: newHeaders,
  };
}

// ============================================================================
// CLIP EDITOR INTEGRATION
// ============================================================================

/**
 * Clip editor mode determines how the editor is displayed.
 */
export type ClipEditorMode = 'inline' | 'panel' | 'split';

/**
 * Clip content selection represents a selected region within a clip.
 */
export interface ClipContentSelection {
  readonly startTick: number;
  readonly endTick: number;
  readonly events?: readonly string[];   // Selected event IDs
}

/**
 * Clip editor snapshot for undo/redo.
 */
export interface ClipEditorSnapshot {
  readonly timestamp: number;
  readonly clipState: unknown;           // Clip state (structure depends on clip type)
  readonly description?: string;         // Description of the change
}

/**
 * Clip editor state tracks the currently edited clip and editor mode.
 */
export interface ClipEditorState {
  readonly clipSlot: GridPosition | null; // Position of the clip being edited (null = none)
  readonly mode: ClipEditorMode;         // How the editor is displayed
  readonly history: readonly ClipEditorSnapshot[]; // Edit history for undo/redo
  readonly historyIndex: number;         // Current position in history
  readonly zoom: number;                 // Zoom level (1.0 = default)
  readonly scrollPosition: number;       // Horizontal scroll position in ticks
  readonly selection?: ClipContentSelection;  // Current selection in the editor
}

/**
 * Opens a clip for editing in inline mode.
 * @param editorState - Current editor state
 * @param position - Position of the clip to edit
 * @returns Updated editor state
 */
export function openClipEditor(
  editorState: ClipEditorState,
  position: GridPosition
): ClipEditorState {
  return {
    ...editorState,
    clipSlot: position,
    mode: 'inline',
  };
}

/**
 * Expands the clip editor to a panel.
 * @param editorState - Current editor state
 * @returns Updated editor state
 */
export function expandClipEditorToPanel(
  editorState: ClipEditorState
): ClipEditorState {
  return {
    ...editorState,
    mode: 'panel',
  };
}

/**
 * Switches to split view with session and editor side-by-side.
 * @param editorState - Current editor state
 * @returns Updated editor state
 */
export function setSplitViewMode(
  editorState: ClipEditorState
): ClipEditorState {
  return {
    ...editorState,
    mode: 'split',
  };
}

/**
 * Closes the clip editor.
 * @param editorState - Current editor state
 * @returns Updated editor state with editor closed
 */
export function closeClipEditor(
  editorState: ClipEditorState
): ClipEditorState {
  return {
    ...editorState,
    clipSlot: null,
  };
}

/**
 * Creates a default clip editor state.
 * @returns New clip editor state
 */
export function createClipEditorState(): ClipEditorState {
  return {
    clipSlot: null,
    mode: 'inline',
    history: [],
    historyIndex: -1,
    zoom: 1.0,
    scrollPosition: 0,
  };
}

/**
 * Opens a clip for editing using the Enter key.
 * @param editorState - Current editor state
 * @param position - Position of the clip to edit
 * @returns Updated editor state
 */
export function openClipEditorWithEnterKey(
  editorState: ClipEditorState,
  position: GridPosition
): ClipEditorState {
  return openClipEditor(editorState, position);
}

/**
 * Closes the clip editor using the Escape key.
 * @param editorState - Current editor state
 * @returns Updated editor state with editor closed
 */
export function closeClipEditorWithEscapeKey(
  editorState: ClipEditorState
): ClipEditorState {
  return closeClipEditor(editorState);
}

/**
 * Records a clip edit in the history for undo/redo.
 * @param editorState - Current editor state
 * @param clipState - Current clip state to record
 * @param description - Description of the change
 * @returns Updated editor state with new history entry
 */
export function recordClipEditInHistory(
  editorState: ClipEditorState,
  clipState: unknown,
  description: string
): ClipEditorState {
  const snapshot: ClipEditorSnapshot = {
    timestamp: Date.now(),
    clipState,
    description,
  };

  // Truncate history if we're not at the end
  const newHistory = editorState.history.slice(0, editorState.historyIndex + 1);
  
  return {
    ...editorState,
    history: [...newHistory, snapshot],
    historyIndex: newHistory.length,
  };
}

/**
 * Previews a clip edit without committing.
 * @param originalState - Original clip state
 * @param previewState - Temporary preview state
 * @returns Preview info object
 */
export interface ClipEditPreview {
  readonly previewState: unknown;
  readonly originalState: unknown;
}

export function createClipEditPreview(
  originalState: unknown,
  previewState: unknown
): ClipEditPreview {
  return {
    previewState,
    originalState,
  };
}

/**
 * Commits a clip edit, finalizing changes.
 * @param editorState - Current editor state
 * @param clipState - Final clip state to commit
 * @param description - Description of the change
 * @returns Updated editor state with committed change
 */
export function commitClipEdit(
  editorState: ClipEditorState,
  clipState: unknown,
  description: string
): ClipEditorState {
  return recordClipEditInHistory(editorState, clipState, description);
}

/**
 * Cancels a clip edit, reverting to previous state.
 * @param editorState - Current editor state
 * @returns Updated editor state with edit cancelled
 */
export function cancelClipEdit(
  editorState: ClipEditorState
): ClipEditorState {
  // If we have a selection, clear it
  if (editorState.selection !== undefined) {
    // Use object destructuring to properly omit the selection property
    const { selection: _, ...rest } = editorState;
    return rest;
  }
  return editorState;
}

/**
 * Sets the zoom level for the clip editor.
 * @param editorState - Current editor state
 * @param zoom - New zoom level (0.1 to 10.0, 1.0 = default)
 * @returns Updated editor state with new zoom level
 */
export function setClipEditorZoom(
  editorState: ClipEditorState,
  zoom: number
): ClipEditorState {
  const clampedZoom = Math.max(0.1, Math.min(10.0, zoom));
  return {
    ...editorState,
    zoom: clampedZoom,
  };
}

/**
 * Sets the scroll position for the clip editor.
 * @param editorState - Current editor state
 * @param scrollPosition - New scroll position in ticks
 * @returns Updated editor state with new scroll position
 */
export function setClipEditorScrollPosition(
  editorState: ClipEditorState,
  scrollPosition: number
): ClipEditorState {
  const clampedScroll = Math.max(0, scrollPosition);
  return {
    ...editorState,
    scrollPosition: clampedScroll,
  };
}

/**
 * Sets the selection range in the clip editor.
 * @param editorState - Current editor state
 * @param selection - New selection range (or undefined to clear)
 * @returns Updated editor state with new selection
 */
export function setClipEditorSelection(
  editorState: ClipEditorState,
  selection: ClipContentSelection | undefined
): ClipEditorState {
  if (selection !== undefined) {
    return {
      ...editorState,
      selection,
    };
  }
  // Clear selection by omitting it
  if (editorState.selection !== undefined) {
    const { selection: _, ...rest } = editorState;
    return rest;
  }
  return editorState;
}

/**
 * Clip edit action types for copy/paste operations.
 */
export interface ClipEditCopyData {
  readonly events: readonly unknown[];
  readonly startTick: number;
  readonly duration: number;
}

/**
 * Copies selected content from the clip editor.
 * @param editorState - Current editor state
 * @param events - Events to copy
 * @returns Copy data structure
 */
export function copyClipEditorContent(
  editorState: ClipEditorState,
  events: readonly unknown[]
): ClipEditCopyData | null {
  if (!editorState.selection || events.length === 0) {
    return null;
  }

  const { startTick, endTick } = editorState.selection;
  return {
    events,
    startTick,
    duration: endTick - startTick,
  };
}

/**
 * Pastes copied content into the clip editor at the specified position.
 * @param copyData - Data to paste
 * @param pastePosition - Tick position to paste at
 * @returns Pasted events (structure depends on clip type)
 */
export function pasteClipEditorContent(
  copyData: ClipEditCopyData,
  pastePosition: number
): readonly unknown[] {
  // Return events (actual implementation depends on clip type)
  // In a real implementation, events would be time-shifted by:
  // offset = pastePosition - copyData.startTick
  void pastePosition; // Silence unused parameter warning
  return copyData.events;
}

// ============================================================================
// CLIP EDITING OPERATIONS
// ============================================================================

/**
 * Quantizes events in a clip to the specified grid.
 * @param events - Events to quantize
 * @param gridSize - Grid size in ticks (e.g., 480 for 16th note)
 * @param quantizeStart - Whether to quantize start times (default: true)
 * @param quantizeLength - Whether to quantize durations (default: false)
 * @returns Quantized events
 */
export function quantizeClipEvents<P>(
  events: readonly Event<P>[],
  gridSize: number,
  quantizeStart: boolean = true,
  quantizeLength: boolean = false
): readonly Event<P>[] {
  if (gridSize <= 0) {
    throw new RangeError(`Grid size must be positive, got ${gridSize}`);
  }

  return events.map((event) => {
    const newStart = quantizeStart
      ? quantizeTick(event.start, gridSize, 'nearest')
      : event.start;
    
    const newDuration = quantizeLength
      ? asTickDuration(Math.max(1, Math.round(event.duration / gridSize) * gridSize))
      : event.duration;

    if (newStart === event.start && newDuration === event.duration) {
      return event;
    }

    return updateEvent(event, {
      start: newStart,
      duration: newDuration,
    });
  });
}

/**
 * Transposes pitch events in a clip by semitones.
 * @param events - Events to transpose
 * @param semitones - Number of semitones to transpose (positive or negative)
 * @returns Transposed events
 */
export function transposeClipEvents<P extends { pitch?: number }>(
  events: readonly Event<P>[],
  semitones: number
): readonly Event<P>[] {
  if (semitones === 0) {
    return events;
  }

  return events.map((event) => {
    if (typeof event.payload.pitch !== 'number') {
      return event;
    }

    const newPitch = Math.max(0, Math.min(127, event.payload.pitch + semitones));
    if (newPitch === event.payload.pitch) {
      return event;
    }

    return updateEvent(event, {
      payload: {
        ...event.payload,
        pitch: newPitch,
      } as P,
    });
  });
}

/**
 * Scales velocity values of events in a clip.
 * @param events - Events to modify
 * @param scale - Velocity scale factor (1.0 = no change, 2.0 = double)
 * @param offset - Velocity offset to add after scaling
 * @returns Events with modified velocities
 */
export function scaleClipVelocity<P extends { velocity?: number }>(
  events: readonly Event<P>[],
  scale: number,
  offset: number = 0
): readonly Event<P>[] {
  if (scale === 1.0 && offset === 0) {
    return events;
  }

  return events.map((event) => {
    if (typeof event.payload.velocity !== 'number') {
      return event;
    }

    const newVelocity = Math.max(1, Math.min(127, 
      Math.round(event.payload.velocity * scale + offset)
    ));

    if (newVelocity === event.payload.velocity) {
      return event;
    }

    return updateEvent(event, {
      payload: {
        ...event.payload,
        velocity: newVelocity,
      } as P,
    });
  });
}

/**
 * Changes the length (duration) of events in a clip.
 * @param events - Events to modify
 * @param lengthMode - Mode: 'scale' or 'set'
 * @param lengthValue - Scale factor (for 'scale') or new duration (for 'set')
 * @param preserveGaps - Whether to maintain gaps between events when scaling
 * @returns Events with modified lengths
 */
export function changeClipLength<P>(
  events: readonly Event<P>[],
  lengthMode: 'scale' | 'set',
  lengthValue: number,
  preserveGaps: boolean = false
): readonly Event<P>[] {
  if (lengthMode === 'scale' && lengthValue === 1.0) {
    return events;
  }

  if (lengthMode === 'scale') {
    if (preserveGaps) {
      // Scale both positions and durations
      return events.map((event) => {
        const newStart = asTick(Math.round(event.start * lengthValue));
        const newDuration = asTickDuration(Math.max(1, Math.round(event.duration * lengthValue)));
        return updateEvent(event, {
          start: newStart,
          duration: newDuration,
        });
      });
    } else {
      // Scale only durations
      return events.map((event) => {
        const newDuration = asTickDuration(Math.max(1, Math.round(event.duration * lengthValue)));
        if (newDuration === event.duration) {
          return event;
        }
        return updateEvent(event, { duration: newDuration });
      });
    }
  } else {
    // Set fixed duration
    const fixedDuration = asTickDuration(Math.max(1, lengthValue));
    return events.map((event) => {
      if (event.duration === fixedDuration) {
        return event;
      }
      return updateEvent(event, { duration: fixedDuration });
    });
  }
}

/**
 * Duplicates selected events in a clip.
 * @param events - Events to duplicate
 * @param offsetTicks - Offset for duplicated events (default: place after last event)
 * @param count - Number of duplicates (default: 1)
 * @returns Original events plus duplicates
 */
export function duplicateClipEvents<P>(
  events: readonly Event<P>[],
  offsetTicks?: number,
  count: number = 1
): readonly Event<P>[] {
  if (events.length === 0 || count <= 0) {
    return events;
  }

  const result: Event<P>[] = [...events];
  
  // Calculate default offset if not provided
  let offset = offsetTicks;
  if (offset === undefined) {
    const maxEnd = Math.max(...events.map(e => e.start + e.duration));
    const minStart = Math.min(...events.map(e => e.start));
    offset = maxEnd - minStart;
  }

  for (let i = 0; i < count; i++) {
    const duplicateOffset = offset * (i + 1);
    for (const event of events) {
      const newEvent = cloneEvent(event, {
        start: asTick(event.start + duplicateOffset),
      });
      result.push(newEvent);
    }
  }

  return result;
}

/**
 * Splits events at the specified tick position.
 * @param events - Events to split
 * @param splitTick - Tick position to split at
 * @returns Events with some split into two at the specified position
 */
export function splitClipEvents<P>(
  events: readonly Event<P>[],
  splitTick: Tick
): readonly Event<P>[] {
  const result: Event<P>[] = [];

  for (const event of events) {
    const eventEnd = event.start + event.duration;
    
    if (splitTick <= event.start || splitTick >= eventEnd) {
      // Split position outside event bounds
      result.push(event);
      continue;
    }

    // Split the event
    const firstDuration = asTickDuration(splitTick - event.start);
    const secondDuration = asTickDuration(eventEnd - splitTick);

    const firstEvent = updateEvent(event, {
      duration: firstDuration,
    });

    const secondEvent = cloneEvent(event, {
      start: splitTick,
      duration: secondDuration,
    });

    result.push(firstEvent, secondEvent);
  }

  return result;
}

// ============================================================================
// PERFORMANCE RECORDING
// ============================================================================

/**
 * Recording state for session performance.
 */
export interface SessionRecordingState {
  /** Whether recording is armed */
  readonly armed: boolean;
  /** Tracks that are armed for recording */
  readonly armedTracks: ReadonlySet<number>;
  /** Recording mode */
  readonly mode: RecordingMode;
  /** Whether recording is currently active */
  readonly active: boolean;
  /** Start time of current recording (ticks) */
  readonly startTick?: Tick;
  /** Takes captured in current session */
  readonly takes: readonly RecordedTake[];
  /** Current take being recorded */
  readonly currentTake?: RecordedTake;
  /** Loop recording configuration */
  readonly loopConfig?: LoopRecordingConfig;
  /** Layered take state */
  readonly layeredTakeState?: LayeredTakeState;
}

/**
 * Recording mode options.
 */
export type RecordingMode =
  | 'replace'     // Replace existing content
  | 'overdub'     // Layer over existing content
  | 'punch-in'    // Record within specific region
  | 'loop'        // Loop recording with layering
  | 'take';       // Record takes for comping

/**
 * A recorded take for comping.
 */
export interface RecordedTake {
  readonly id: string;
  readonly trackIndex: number;
  readonly sceneIndex?: number;
  readonly clipId: ContainerId;
  readonly startTick: Tick;
  readonly endTick: Tick;
  readonly events: readonly Event<unknown>[];
  readonly timestamp: number;
  readonly ranking?: number; // User rating 1-5
  readonly selected: boolean; // Selected for comp
}

/**
 * Arms a track for recording.
 * @param state - Current recording state
 * @param trackIndex - Track to arm
 * @returns Updated recording state
 */
export function armTrackForRecording(
  state: SessionRecordingState,
  trackIndex: number
): SessionRecordingState {
  const armedTracks = new Set(state.armedTracks);
  armedTracks.add(trackIndex);
  
  return {
    ...state,
    armed: true,
    armedTracks,
  };
}

/**
 * Disarms a track from recording.
 * @param state - Current recording state
 * @param trackIndex - Track to disarm
 * @returns Updated recording state
 */
export function disarmTrackForRecording(
  state: SessionRecordingState,
  trackIndex: number
): SessionRecordingState {
  const armedTracks = new Set(state.armedTracks);
  armedTracks.delete(trackIndex);
  
  return {
    ...state,
    armed: armedTracks.size > 0,
    armedTracks,
  };
}

/**
 * Starts scene launch recording.
 * @param state - Current recording state
 * @param mode - Recording mode to use
 * @param startTick - Start position in ticks
 * @returns Updated recording state
 */
export function startSceneLaunchRecording(
  state: SessionRecordingState,
  mode: RecordingMode,
  startTick: Tick
): SessionRecordingState {
  if (!state.armed || state.armedTracks.size === 0) {
    throw new Error('Cannot start recording: no tracks armed');
  }

  return {
    ...state,
    active: true,
    mode,
    startTick,
  };
}

/**
 * Stops active recording.
 * @param state - Current recording state
 * @param endTick - End position in ticks
 * @returns Updated recording state with captured take
 */
export function stopRecording(
  state: SessionRecordingState,
  endTick: Tick
): SessionRecordingState {
  if (!state.active || state.currentTake === undefined) {
    const { currentTake, ...rest } = state;
    void currentTake;
    return {
      ...rest,
      active: false,
    };
  }

  const completedTake: RecordedTake = {
    ...state.currentTake,
    endTick,
    timestamp: Date.now(),
  };

  const { currentTake, ...rest } = state;
  void currentTake;
  return {
    ...rest,
    active: false,
    takes: [...state.takes, completedTake],
  };
}

/**
 * Sets recording mode (overdub, replace, punch-in, loop, take).
 * @param state - Current recording state
 * @param mode - New recording mode
 * @returns Updated recording state
 */
export function setRecordingMode(
  state: SessionRecordingState,
  mode: RecordingMode
): SessionRecordingState {
  return {
    ...state,
    mode,
  };
}

/**
 * Records a new take for comping.
 * @param state - Current recording state
 * @param trackIndex - Track index
 * @param events - Recorded events
 * @param startTick - Start position
 * @param endTick - End position
 * @returns Updated recording state with new take
 */
export function recordTake(
  state: SessionRecordingState,
  trackIndex: number,
  events: readonly Event<unknown>[],
  startTick: Tick,
  endTick: Tick
): SessionRecordingState {
  const take: RecordedTake = {
    id: generateContainerId(),
    trackIndex,
    clipId: generateContainerId(),
    startTick,
    endTick,
    events,
    timestamp: Date.now(),
    selected: false,
  };

  return {
    ...state,
    takes: [...state.takes, take],
  };
}

/**
 * Loop recording configuration.
 */
export interface LoopRecordingConfig {
  readonly loopStartTick: Tick;
  readonly loopEndTick: Tick;
  readonly mode: 'overdub' | 'replace-per-loop';
  readonly maxLoops?: number;
  readonly currentLoopIndex: number;
}

/**
 * Starts loop recording mode with specified loop region.
 * @param state - Current recording state
 * @param config - Loop recording configuration
 * @returns Updated recording state with loop config
 */
export function startLoopRecording(
  state: SessionRecordingState,
  config: LoopRecordingConfig
): SessionRecordingState {
  if (!state.armed || state.armedTracks.size === 0) {
    throw new Error('Cannot start loop recording: no tracks armed');
  }

  return {
    ...state,
    active: true,
    mode: 'loop',
    startTick: config.loopStartTick,
    loopConfig: config,
  };
}

/**
 * Handles loop recording iteration (called when loop wraps around).
 * @param state - Current recording state
 * @param loopEndTick - Tick when loop ended
 * @param events - Events recorded in this loop iteration
 * @returns Updated recording state with layered events
 */
export function recordLoopIteration(
  state: SessionRecordingState,
  loopEndTick: Tick,
  events: readonly Event<unknown>[]
): SessionRecordingState {
  if (!state.loopConfig) {
    throw new Error('Cannot record loop iteration: no loop config');
  }

  const config = state.loopConfig;
  const nextLoopIndex = config.currentLoopIndex + 1;
  
  // Check if we've hit max loops
  if (config.maxLoops && nextLoopIndex >= config.maxLoops) {
    return stopRecording(state, loopEndTick);
  }

  // Create or update current take with new events
  const currentTake = state.currentTake || {
    id: generateContainerId(),
    trackIndex: Array.from(state.armedTracks)[0] || 0,
    clipId: generateContainerId(),
    startTick: config.loopStartTick,
    endTick: loopEndTick,
    events: [],
    timestamp: Date.now(),
    selected: false,
  };

  // In overdub mode, layer new events with existing
  const updatedEvents = config.mode === 'overdub'
    ? [...currentTake.events, ...events]
    : events; // replace-per-loop mode uses only new events

  return {
    ...state,
    currentTake: {
      ...currentTake,
      events: updatedEvents,
      endTick: loopEndTick,
    },
    loopConfig: {
      ...config,
      currentLoopIndex: nextLoopIndex,
    },
  };
}

/**
 * Layered take recording state (multiple takes in same region).
 */
export interface LayeredTakeState {
  readonly trackIndex: number;
  readonly startTick: Tick;
  readonly endTick: Tick;
  readonly takes: readonly RecordedTake[];
  readonly activeLayer: number;
}

/**
 * Starts layered take recording (record multiple takes in same region).
 * @param state - Current recording state
 * @param trackIndex - Track to record on
 * @param startTick - Start of recording region
 * @param endTick - End of recording region
 * @returns Updated recording state
 */
export function startLayeredTakeRecording(
  state: SessionRecordingState,
  trackIndex: number,
  startTick: Tick,
  endTick: Tick
): SessionRecordingState {
  return {
    ...state,
    armed: true,
    armedTracks: new Set([trackIndex]),
    active: true,
    mode: 'take',
    startTick,
    layeredTakeState: {
      trackIndex,
      startTick,
      endTick,
      takes: [],
      activeLayer: 0,
    },
  };
}

/**
 * Records a new layer in layered take mode.
 * @param state - Current recording state
 * @param events - Recorded events for this layer
 * @returns Updated recording state with new layer
 */
export function recordTakeLayer(
  state: SessionRecordingState,
  events: readonly Event<unknown>[]
): SessionRecordingState {
  if (!state.layeredTakeState) {
    throw new Error('Cannot record take layer: not in layered take mode');
  }

  const { layeredTakeState } = state;
  const newTake: RecordedTake = {
    id: generateContainerId(),
    trackIndex: layeredTakeState.trackIndex,
    clipId: generateContainerId(),
    startTick: layeredTakeState.startTick,
    endTick: layeredTakeState.endTick,
    events,
    timestamp: Date.now(),
    selected: false,
  };

  return {
    ...state,
    layeredTakeState: {
      ...layeredTakeState,
      takes: [...layeredTakeState.takes, newTake],
      activeLayer: layeredTakeState.activeLayer + 1,
    },
    takes: [...state.takes, newTake],
  };
}

/**
 * Comping interface state for selecting portions of takes.
 */
export interface CompingState {
  readonly trackIndex: number;
  readonly regionStart: Tick;
  readonly regionEnd: Tick;
  readonly takes: readonly RecordedTake[];
  readonly comp: readonly CompSegment[];
}

/**
 * A segment in the compiled comp (selected portion of a take).
 */
export interface CompSegment {
  readonly takeId: string;
  readonly startTick: Tick;
  readonly endTick: Tick;
  readonly events: readonly Event<unknown>[];
}

/**
 * Creates a comping interface for a set of takes.
 * @param takes - Takes to comp from
 * @param trackIndex - Track index
 * @param regionStart - Start of comp region
 * @param regionEnd - End of comp region
 * @returns Comping state
 */
export function createCompingInterface(
  takes: readonly RecordedTake[],
  trackIndex: number,
  regionStart: Tick,
  regionEnd: Tick
): CompingState {
  return {
    trackIndex,
    regionStart,
    regionEnd,
    takes,
    comp: [],
  };
}

/**
 * Adds a segment to the comp from a take.
 * @param state - Current comping state
 * @param takeId - ID of take to use
 * @param startTick - Start of segment
 * @param endTick - End of segment
 * @returns Updated comping state
 */
export function addCompSegment(
  state: CompingState,
  takeId: string,
  startTick: Tick,
  endTick: Tick
): CompingState {
  const take = state.takes.find(t => t.id === takeId);
  if (!take) {
    throw new Error(`Take ${takeId} not found`);
  }

  // Filter events within the segment time range
  const segmentEvents = take.events.filter(event => {
    const eventStart = event.start;
    const eventEnd = asTick(event.start + event.duration);
    return eventStart >= startTick && eventEnd <= endTick;
  });

  const segment: CompSegment = {
    takeId,
    startTick,
    endTick,
    events: segmentEvents,
  };

  return {
    ...state,
    comp: [...state.comp, segment],
  };
}

/**
 * Selects a take for a given time range in comping.
 * @param state - Current recording state
 * @param takeId - ID of take to select
 * @returns Updated recording state
 */
export function selectTakeForComping(
  state: SessionRecordingState,
  takeId: string
): SessionRecordingState {
  const updatedTakes = state.takes.map(take =>
    take.id === takeId
      ? { ...take, selected: true }
      : { ...take, selected: false }
  );

  return {
    ...state,
    takes: updatedTakes,
  };
}

/**
 * Ranks a take (user rating 1-5 stars).
 * @param state - Current recording state
 * @param takeId - ID of take to rank
 * @param ranking - Rating 1-5
 * @returns Updated recording state
 */
export function rankTake(
  state: SessionRecordingState,
  takeId: string,
  ranking: number
): SessionRecordingState {
  if (ranking < 1 || ranking > 5) {
    throw new Error('Ranking must be between 1 and 5');
  }

  const updatedTakes = state.takes.map(take =>
    take.id === takeId
      ? { ...take, ranking }
      : take
  );

  return {
    ...state,
    takes: updatedTakes,
  };
}

/**
 * Merges multiple takes into a single take.
 * @param state - Current recording state
 * @param takeIds - IDs of takes to merge
 * @param mergeStrategy - How to merge overlapping events
 * @returns Updated recording state with merged take
 */
export function mergeTakes(
  state: SessionRecordingState,
  takeIds: readonly string[],
  mergeStrategy: 'layer' | 'priority' = 'layer'
): SessionRecordingState {
  const takesToMerge = state.takes.filter(t => takeIds.includes(t.id));
  
  if (takesToMerge.length === 0) {
    return state;
  }

  // Find overall time bounds
  const startTick = Math.min(...takesToMerge.map(t => t.startTick)) as Tick;
  const endTick = Math.max(...takesToMerge.map(t => t.endTick)) as Tick;
  const trackIndex = takesToMerge[0]!.trackIndex;

  // Merge events based on strategy
  let mergedEvents: Event<unknown>[];
  if (mergeStrategy === 'layer') {
    // Simply concatenate all events
    mergedEvents = takesToMerge.flatMap(t => t.events);
  } else {
    // Priority: later takes override earlier ones for overlapping regions
    mergedEvents = [];
    const sortedTakes = [...takesToMerge].sort((a, b) => a.timestamp - b.timestamp);
    
    for (const take of sortedTakes) {
      for (const event of take.events) {
        // Remove any overlapping events from earlier takes
        mergedEvents = mergedEvents.filter(existing => {
          const existingEnd = asTick(existing.start + existing.duration);
          const eventEnd = asTick(event.start + event.duration);
          return existingEnd <= event.start || existing.start >= eventEnd;
        });
        mergedEvents.push(event);
      }
    }
  }

  const mergedTake: RecordedTake = {
    id: generateContainerId(),
    trackIndex,
    clipId: generateContainerId(),
    startTick,
    endTick,
    events: mergedEvents,
    timestamp: Date.now(),
    selected: true,
  };

  // Remove merged takes and add merged result
  const remainingTakes = state.takes.filter(t => !takeIds.includes(t.id));

  return {
    ...state,
    takes: [...remainingTakes, mergedTake],
  };
}

/**
 * Performance capture state (records entire session performance).
 */
export interface PerformanceCapture {
  readonly id: string;
  readonly startTime: number;
  readonly endTime?: number;
  readonly clipLaunches: readonly ClipLaunchEvent[];
  readonly sceneChanges: readonly SceneChangeEvent[];
  readonly parameterChanges: readonly ParameterChangeEvent[];
}

/**
 * Event when a clip is launched during performance.
 */
export interface ClipLaunchEvent {
  readonly timestamp: number;
  readonly tick: Tick;
  readonly trackIndex: number;
  readonly sceneIndex: number;
  readonly clipId: ContainerId;
}

/**
 * Event when scene changes during performance.
 */
export interface SceneChangeEvent {
  readonly timestamp: number;
  readonly tick: Tick;
  readonly sceneIndex: number;
}

/**
 * Event when a parameter changes during performance.
 */
export interface ParameterChangeEvent {
  readonly timestamp: number;
  readonly tick: Tick;
  readonly targetType: 'track' | 'clip' | 'global';
  readonly targetIndex?: number;
  readonly parameterName: string;
  readonly value: number;
}

/**
 * Starts capturing a performance.
 * @param startTime - Performance start timestamp
 * @returns New performance capture state
 */
export function startPerformanceCapture(startTime: number): PerformanceCapture {
  return {
    id: generateContainerId(),
    startTime,
    clipLaunches: [],
    sceneChanges: [],
    parameterChanges: [],
  };
}

/**
 * Records a clip launch event during performance capture.
 * @param capture - Current performance capture
 * @param event - Clip launch event
 * @returns Updated performance capture
 */
export function recordClipLaunch(
  capture: PerformanceCapture,
  event: ClipLaunchEvent
): PerformanceCapture {
  return {
    ...capture,
    clipLaunches: [...capture.clipLaunches, event],
  };
}

/**
 * Ends performance capture.
 * @param capture - Current performance capture
 * @param endTime - Performance end timestamp
 * @returns Completed performance capture
 */
export function endPerformanceCapture(
  capture: PerformanceCapture,
  endTime: number
): PerformanceCapture {
  return {
    ...capture,
    endTime,
  };
}

/**
 * Converts session performance to arrangement timeline.
 * @param capture - Performance capture to convert
 * @returns Arrangement representation with clips in timeline
 */
export function performanceToArrangement(
  capture: PerformanceCapture
): ArrangementTimeline {
  const tracks: ArrangementTrack[] = [];
  
  // Group clip launches by track
  const trackLaunches = new Map<number, ClipLaunchEvent[]>();
  for (const launch of capture.clipLaunches) {
    const launches = trackLaunches.get(launch.trackIndex) || [];
    launches.push(launch);
    trackLaunches.set(launch.trackIndex, launches);
  }

  // Create arrangement tracks
  for (const [trackIndex, launches] of trackLaunches) {
    const clipSlots: ArrangementClipSlot[] = [];
    
    for (let i = 0; i < launches.length; i++) {
      const launch = launches[i]!;
      const nextLaunch = launches[i + 1];
      
      const startTick = launch.tick;
      const endTick = nextLaunch ? nextLaunch.tick : (capture.endTime ? asTick(capture.endTime) : launch.tick);
      
      clipSlots.push({
        clipId: launch.clipId,
        startTick,
        endTick,
      });
    }

    tracks.push({
      trackIndex,
      clipSlots,
    });
  }

  return {
    id: generateContainerId(),
    tracks,
    duration: capture.endTime ? asTickDuration(capture.endTime - capture.startTime) : asTickDuration(0),
  };
}

/**
 * Arrangement timeline representation.
 */
export interface ArrangementTimeline {
  readonly id: string;
  readonly tracks: readonly ArrangementTrack[];
  readonly duration: number;
}

/**
 * Track in arrangement timeline.
 */
export interface ArrangementTrack {
  readonly trackIndex: number;
  readonly clipSlots: readonly ArrangementClipSlot[];
}

/**
 * Clip slot in arrangement timeline.
 */
export interface ArrangementClipSlot {
  readonly clipId: ContainerId;
  readonly startTick: Tick;
  readonly endTick: Tick;
}

/**
 * Captures a sequence of clip launches in order.
 * @param sessionGrid - Current session grid state
 * @param launchSequence - Ordered list of clip positions
 * @returns Clip sequence capture
 */
export function captureClipSequence(
  sessionGrid: SessionGridState,
  launchSequence: readonly GridPosition[]
): ClipSequence {
  const clips = launchSequence.map(pos => {
    const slotKey = `${pos.trackIndex}:${pos.sceneIndex}`;
    const slot = sessionGrid.slots.get(slotKey);
    if (!slot || !slot.clipId) {
      throw new Error(`No clip at position ${pos.trackIndex},${pos.sceneIndex}`);
    }
    return {
      position: pos,
      clipId: slot.clipId,
    };
  });

  return {
    id: generateContainerId(),
    clips,
    timestamp: Date.now(),
  };
}

/**
 * Captured clip sequence.
 */
export interface ClipSequence {
  readonly id: string;
  readonly clips: readonly ClipReference[];
  readonly timestamp: number;
}

/**
 * Reference to a clip in a sequence.
 */
export interface ClipReference {
  readonly position: GridPosition;
  readonly clipId: ContainerId;
}

/**
 * Automation recording for a parameter.
 */
export interface AutomationRecording {
  readonly id: string;
  readonly targetType: 'track' | 'clip' | 'global';
  readonly targetIndex?: number;
  readonly parameterName: string;
  readonly points: readonly AutomationPoint[];
}

/**
 * Point in automation recording.
 */
export interface AutomationPoint {
  readonly tick: Tick;
  readonly value: number;
  readonly interpolation?: 'linear' | 'step' | 'smooth';
}

/**
 * Starts recording automation for a parameter.
 * @param targetType - Type of target
 * @param parameterName - Name of parameter
 * @param targetIndex - Index of target (for tracks/clips)
 * @returns New automation recording
 */
export function startAutomationRecording(
  targetType: 'track' | 'clip' | 'global',
  parameterName: string,
  targetIndex?: number
): AutomationRecording {
  if (targetIndex !== undefined) {
    return {
      id: generateContainerId(),
      targetType,
      targetIndex,
      parameterName,
      points: [],
    };
  }
  return {
    id: generateContainerId(),
    targetType,
    parameterName,
    points: [],
  };
}

/**
 * Records an automation point.
 * @param recording - Current automation recording
 * @param tick - Position in ticks
 * @param value - Parameter value
 * @param interpolation - Interpolation mode
 * @returns Updated automation recording
 */
export function recordAutomationPoint(
  recording: AutomationRecording,
  tick: Tick,
  value: number,
  interpolation: 'linear' | 'step' | 'smooth' = 'linear'
): AutomationRecording {
  const point: AutomationPoint = {
    tick,
    value,
    interpolation,
  };

  return {
    ...recording,
    points: [...recording.points, point],
  };
}
