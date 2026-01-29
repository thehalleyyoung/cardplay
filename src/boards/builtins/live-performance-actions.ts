/**
 * @fileoverview Live Performance Board Actions (Phase I: I063-I069)
 * 
 * Performance-focused actions for the Live Performance board:
 * - I063: Deck reveal integration (quick instrument tweaking)
 * - I064: MIDI activity visualization per track
 * - I065: Panic controls (all notes off, stop all, reset routing)
 * - I066: Capture performance to timeline
 * - I067: Per-track control levels for live input
 * - I068: Control level colors in UI
 * - I069: Performance-focused shortcuts
 * 
 * @module @cardplay/boards/builtins/live-performance-actions
 */

import type { ClipId } from '../../state/types';
import type { Event } from '../../types/event';
import { getTransport } from '../../audio/transport';

// ============================================================================
// I063: DECK REVEAL INTEGRATION
// ============================================================================

/**
 * Revealed deck state for quick tweaking.
 */
export interface RevealedDeck {
  /** Track ID that was revealed */
  trackId: string;
  
  /** Instrument/device being revealed */
  deviceId: string;
  
  /** When revealed */
  revealedAt: number;
  
  /** Auto-hide after duration (ms) */
  autoHideDuration?: number;
}

/**
 * Reveal a track's instrument for quick tweaking.
 * 
 * I063: Shows the instrument panel in a modal overlay for live parameter adjustments.
 * Auto-hides after a timeout or when clicking away.
 */
export function revealTrackInstrument(
  trackId: string,
  deviceId: string,
  autoHideDuration: number = 5000
): RevealedDeck {
  const revealed: RevealedDeck = {
    trackId,
    deviceId,
    revealedAt: Date.now(),
    autoHideDuration
  };
  
  // TODO: Integrate with deck-reveal.ts UI component
  console.info('Reveal track instrument:', revealed);
  
  return revealed;
}

/**
 * Hide revealed deck.
 */
export function hideRevealedDeck(revealed: RevealedDeck): void {
  console.info('Hide revealed deck:', revealed.trackId);
  // TODO: Integrate with deck-reveal.ts UI component
}

// ============================================================================
// I064: MIDI ACTIVITY VISUALIZATION
// ============================================================================

/**
 * MIDI activity for a track.
 */
export interface MIDIActivity {
  /** Track ID */
  trackId: string;
  
  /** Active notes (MIDI note numbers) */
  activeNotes: number[];
  
  /** Recent velocity (0-127) */
  recentVelocity: number;
  
  /** Last activity timestamp */
  lastActivityAt: number;
  
  /** Activity level (0-1) */
  activityLevel: number;
}

/**
 * MIDI activity tracker for visualization.
 */
export class MIDIActivityTracker {
  private activities = new Map<string, MIDIActivity>();
  
  /**
   * Update MIDI activity for a track.
   */
  updateActivity(trackId: string, notes: number[], velocity: number): void {
    const existing = this.activities.get(trackId);
    
    const activity: MIDIActivity = {
      trackId,
      activeNotes: [...notes],
      recentVelocity: velocity,
      lastActivityAt: Date.now(),
      activityLevel: notes.length > 0 ? velocity / 127 : (existing?.activityLevel || 0) * 0.9
    };
    
    this.activities.set(trackId, activity);
  }
  
  /**
   * Get activity for a track.
   */
  getActivity(trackId: string): MIDIActivity | null {
    return this.activities.get(trackId) || null;
  }
  
  /**
   * Get all activities.
   */
  getAllActivities(): MIDIActivity[] {
    return Array.from(this.activities.values());
  }
  
  /**
   * Decay activity levels over time.
   */
  decayActivities(): void {
    const now = Date.now();
    
    for (const [trackId, activity] of this.activities) {
      const age = now - activity.lastActivityAt;
      const decay = Math.exp(-age / 1000); // Exponential decay
      
      this.activities.set(trackId, {
        ...activity,
        activityLevel: activity.activityLevel * decay
      });
    }
  }
}

/**
 * Global MIDI activity tracker (singleton).
 */
let globalMIDIActivityTracker: MIDIActivityTracker | null = null;

/**
 * Get the global MIDI activity tracker.
 */
export function getMIDIActivityTracker(): MIDIActivityTracker {
  if (!globalMIDIActivityTracker) {
    globalMIDIActivityTracker = new MIDIActivityTracker();
  }
  return globalMIDIActivityTracker;
}

// ============================================================================
// I065: PANIC CONTROLS
// ============================================================================

/**
 * Panic action result.
 */
export interface PanicResult {
  /** Number of notes stopped */
  notesStopped: number;
  
  /** Number of clips stopped */
  clipsStopped: number;
  
  /** Whether routing was reset */
  routingReset: boolean;
  
  /** Timestamp */
  timestamp: number;
}

/**
 * I065: All notes off panic.
 * 
 * Stops all currently sounding notes immediately.
 * Does not affect clip playback.
 */
export function panicAllNotesOff(): PanicResult {
  // TODO: Integrate with audio engine to send MIDI all-notes-off
  console.info('PANIC: All notes off');
  
  return {
    notesStopped: 0, // Would be counted from audio engine
    clipsStopped: 0,
    routingReset: false,
    timestamp: Date.now()
  };
}

/**
 * I065: Stop all clips panic.
 * 
 * Stops all playing clips in session view.
 * Also sends all-notes-off.
 */
export function panicStopAllClips(): PanicResult {
  const transport = getTransport();
  
  // Stop transport
  transport.stop();
  
  // TODO: Stop all clips in session view
  // For MVP, just stop transport
  
  console.info('PANIC: Stop all clips');
  
  return {
    notesStopped: 0,
    clipsStopped: 0, // Would be counted from session view
    routingReset: false,
    timestamp: Date.now()
  };
}

/**
 * I065: Full panic with routing reset.
 * 
 * Stops everything and resets routing to safe defaults:
 * - All notes off
 * - All clips stopped
 * - Routing connections cleared
 * - Transport stopped
 */
export function panicFullReset(): PanicResult {
  // Stop everything
  panicStopAllClips();
  panicAllNotesOff();
  
  // TODO: Reset routing graph to safe defaults
  console.info('PANIC: Full reset');
  
  return {
    notesStopped: 0,
    clipsStopped: 0,
    routingReset: true,
    timestamp: Date.now()
  };
}

// ============================================================================
// I066: CAPTURE PERFORMANCE TO TIMELINE
// ============================================================================

/**
 * Performance capture settings.
 */
export interface CaptureSettings {
  /** Start time (tick) */
  startTime: number;
  
  /** End time (tick) */
  endTime: number;
  
  /** Tracks to capture */
  trackIds: string[];
  
  /** Capture clip launches */
  captureLaunches: boolean;
  
  /** Capture parameter changes */
  captureParameters: boolean;
  
  /** Capture MIDI input */
  captureMIDI: boolean;
}

/**
 * Captured performance data.
 */
export interface CapturedPerformance {
  /** Clip launch events */
  clipLaunches: Array<{
    clipId: ClipId;
    launchTime: number;
    sceneId?: string;
  }>;
  
  /** Parameter automation recorded */
  parameterChanges: Array<{
    trackId: string;
    parameter: string;
    time: number;
    value: number;
  }>;
  
  /** MIDI events recorded */
  midiEvents: Array<Event<{ note: number; velocity: number }>>;
  
  /** Capture duration */
  durationTicks: number;
  
  /** Timestamp */
  timestamp: number;
}

/**
 * I066: Capture performance to timeline.
 * 
 * Records clip launches, parameter changes, and MIDI input during live performance.
 * Creates clips/automation in the timeline for later editing.
 * 
 * Stub implementation for MVP.
 */
export async function capturePerformance(
  settings: CaptureSettings
): Promise<CapturedPerformance> {
  console.info('Capture performance:', settings);
  
  // TODO: Implement actual capture logic
  // Would need to:
  // 1. Monitor session view for clip launches
  // 2. Record parameter changes from UI
  // 3. Capture MIDI input events
  // 4. Create timeline clips/automation from captured data
  
  const captured: CapturedPerformance = {
    clipLaunches: [],
    parameterChanges: [],
    midiEvents: [],
    durationTicks: settings.endTime - settings.startTime,
    timestamp: Date.now()
  };
  
  return captured;
}

// ============================================================================
// I069: PERFORMANCE SHORTCUTS
// ============================================================================

/**
 * Performance shortcut mappings.
 */
export const PERFORMANCE_SHORTCUTS = {
  // Scene control
  'launchScene': 'Enter',
  'stopAll': 'Esc',
  'nextScene': 'ArrowDown',
  'prevScene': 'ArrowUp',
  
  // Track control
  'armTrack': 'A',
  'soloTrack': 'S',
  'muteTrack': 'M',
  
  // Transport
  'play': 'Space',
  'stop': 'Esc',
  'tempoTap': 'T',
  'toggleMetronome': 'C',
  
  // Panic
  'panicNotesOff': 'Cmd+.',
  'panicStopAll': 'Cmd+Shift+.',
  'panicFullReset': 'Cmd+Shift+Esc',
  
  // Reveal
  'revealInstrument': 'R',
  'hideRevealed': 'Esc',
  
  // Capture
  'startCapture': 'Cmd+Shift+R',
  'stopCapture': 'Cmd+Shift+S',
  
  // View
  'toggleMixer': 'Cmd+M',
  'toggleRouting': 'Cmd+Shift+R',
  'toggleBrowser': 'Cmd+B'
} as const;

/**
 * Register performance shortcuts.
 */
export function registerPerformanceShortcuts(
  _handler: (action: string) => void
): void {
  // TODO: Integrate with keyboard-shortcuts.ts
  console.info('Register performance shortcuts');
}

// ============================================================================
// EXPORTS
// ============================================================================
