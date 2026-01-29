/**
 * @fileoverview UI Actions
 * 
 * User-facing actions for board operations.
 */

export * from './harmony-actions';

// Phase I: Producer Board Actions (I041)
export {
  freezeGeneratedTrack,
  canFreezeTrack,
  isTrackFrozen,
  type FreezeTrackOptions,
  type FreezeTrackResult
} from './freeze-track';

// Phase I: Live Performance Board Actions (I065)
export {
  allNotesOff,
  stopAllClips,
  fullReset,
  executePanic,
  registerActiveNote,
  unregisterActiveNote,
  registerPanicShortcuts,
  PANIC_SHORTCUTS,
  type PanicActionType,
  type PanicActionResult
} from './panic';

// Phase I: Performance Capture Action (I066)
export {
  startPerformanceRecording,
  stopPerformanceRecording,
  recordClipLaunch,
  recordClipStop,
  getActiveRecording,
  isRecording,
  capturePerformanceToTimeline,
  clearRecording,
  type ClipLaunchEvent,
  type PerformanceRecording,
  type CapturePerformanceResult
} from './capture-performance';
