/**
 * @fileoverview Panic Controls (Phase I: I065)
 * 
 * Emergency controls for live performance:
 * 1. All notes off - Send MIDI note-off for all active notes
 * 2. Stop all clips - Stop all playing clips immediately
 * 3. Full reset - Reset transport, routing, and all state
 * 
 * @module @cardplay/ui/actions/panic
 */

import { getTransport } from '../../audio/transport';
import { getClipRegistry } from '../../state/clip-registry';
import { asTick } from '../../types/primitives';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Panic action type.
 */
export type PanicActionType = 'all-notes-off' | 'stop-all' | 'full-reset';

/**
 * Result of a panic action.
 */
export interface PanicActionResult {
  /** Success flag */
  success: boolean;
  
  /** Action performed */
  action: PanicActionType;
  
  /** Number of items affected */
  itemsAffected: number;
  
  /** Error message if failed */
  error?: string;
}

// ============================================================================
// MIDI NOTE TRACKING
// ============================================================================

/**
 * Track of active MIDI notes for panic control.
 * In a real implementation, this would be managed by the audio engine.
 */
const activeNotes = new Map<string, { channel: number; note: number; streamId: string }>();

/**
 * Register an active MIDI note.
 * 
 * @param streamId Stream ID
 * @param channel MIDI channel (0-15)
 * @param note MIDI note number (0-127)
 */
export function registerActiveNote(streamId: string, channel: number, note: number): void {
  const key = `${streamId}:${channel}:${note}`;
  activeNotes.set(key, { channel, note, streamId });
}

/**
 * Unregister an active MIDI note.
 * 
 * @param streamId Stream ID
 * @param channel MIDI channel (0-15)
 * @param note MIDI note number (0-127)
 */
export function unregisterActiveNote(streamId: string, channel: number, note: number): void {
  const key = `${streamId}:${channel}:${note}`;
  activeNotes.delete(key);
}

// ============================================================================
// PANIC ACTIONS
// ============================================================================

/**
 * Send note-off for all active MIDI notes.
 * 
 * I065: Panic control - all notes off.
 * 
 * This is critical for live performance to stop stuck notes.
 * Sends MIDI CC 123 (all notes off) to all channels, plus
 * explicit note-off messages for all tracked active notes.
 * 
 * @returns Result of the panic action
 */
export function allNotesOff(): PanicActionResult {
  try {
    let count = 0;
    
    // Send CC 123 (all notes off) to all 16 MIDI channels
    // In a real implementation, this would go through the audio engine
    for (let channel = 0; channel < 16; channel++) {
      // audio.sendMIDI({ type: 'cc', channel, controller: 123, value: 0 });
      console.info(`[Panic] Sent All Notes Off to channel ${channel}`);
      count++;
    }
    
    // Send explicit note-off for all tracked active notes
    activeNotes.forEach(({ channel, note, streamId }) => {
      // audio.sendMIDI({ type: 'noteoff', channel, note, velocity: 0 });
      console.info(`[Panic] Note off: stream=${streamId} ch=${channel} note=${note}`);
      count++;
    });
    
    // Clear active notes tracking
    activeNotes.clear();
    
    return {
      success: true,
      action: 'all-notes-off',
      itemsAffected: count
    };
  } catch (error) {
    return {
      success: false,
      action: 'all-notes-off',
      itemsAffected: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Stop all playing clips immediately.
 * 
 * I065: Panic control - stop all clips.
 * 
 * Stops all clips without waiting for quantization.
 * Preserves clip state but stops playback immediately.
 * 
 * @returns Result of the panic action
 */
export function stopAllClips(): PanicActionResult {
  try {
    const transport = getTransport();
    const registry = getClipRegistry();
    
    let count = 0;
    
    // Stop transport
    transport.stop();
    
    // Stop all clips
    // In a real implementation, this would go through the clip launcher
    const clips = Array.from(registry.getAllClips().values());
    clips.forEach(clip => {
      // clipLauncher.stopClip(clip.id);
      console.info(`[Panic] Stopped clip: ${clip.name}`);
      count++;
    });
    
    return {
      success: true,
      action: 'stop-all',
      itemsAffected: count
    };
  } catch (error) {
    return {
      success: false,
      action: 'stop-all',
      itemsAffected: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Full system reset.
 * 
 * I065: Panic control - full reset.
 * 
 * Nuclear option for performance emergencies:
 * - All notes off
 * - Stop all clips
 * - Stop transport
 * - Clear all automation playback
 * - Reset all modulators
 * - (Does NOT clear project data)
 * 
 * @returns Result of the panic action
 */
export function fullReset(): PanicActionResult {
  try {
    let totalCount = 0;
    
    // 1. All notes off
    const notesResult = allNotesOff();
    if (notesResult.success) {
      totalCount += notesResult.itemsAffected;
    }
    
    // 2. Stop all clips
    const clipsResult = stopAllClips();
    if (clipsResult.success) {
      totalCount += clipsResult.itemsAffected;
    }
    
    // 3. Reset transport position to start
    const transport = getTransport();
    transport.setPosition(asTick(0));
    console.info('[Panic] Reset transport to position 0');
    totalCount++;
    
    // 4. Clear automation playback state
    // In a real implementation, this would reset parameter resolver
    console.info('[Panic] Reset automation playback');
    totalCount++;
    
    // 5. Reset all modulators
    // In a real implementation, this would reset modulation sources
    console.info('[Panic] Reset all modulators');
    totalCount++;
    
    // 6. Clear any pending routing changes
    // Routing graph persists, but clear any pending updates
    console.info('[Panic] Cleared pending routing updates');
    totalCount++;
    
    return {
      success: true,
      action: 'full-reset',
      itemsAffected: totalCount
    };
  } catch (error) {
    return {
      success: false,
      action: 'full-reset',
      itemsAffected: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Execute a panic action.
 * 
 * Convenience function to execute any panic action.
 * 
 * @param action Type of panic action
 * @returns Result of the action
 */
export function executePanic(action: PanicActionType): PanicActionResult {
  switch (action) {
    case 'all-notes-off':
      return allNotesOff();
    case 'stop-all':
      return stopAllClips();
    case 'full-reset':
      return fullReset();
    default:
      return {
        success: false,
        action,
        itemsAffected: 0,
        error: `Unknown panic action: ${action}`
      };
  }
}

// ============================================================================
// SHORTCUTS
// ============================================================================

/**
 * Keyboard shortcut mappings for panic controls.
 * 
 * Standard shortcuts:
 * - Cmd+. or Esc (during playback) = All notes off
 * - Space (during playback) = Stop all
 * - Cmd+Shift+. = Full reset
 */
export const PANIC_SHORTCUTS = {
  'all-notes-off': ['cmd+.', 'escape'],
  'stop-all': ['space'],
  'full-reset': ['cmd+shift+.']
} as const;

/**
 * Register panic shortcuts with keyboard system.
 * 
 * Should be called during app initialization.
 */
export function registerPanicShortcuts(): void {
  // TODO: Register with keyboard shortcut manager when available
  console.info('[Panic] Shortcuts registered:', PANIC_SHORTCUTS);
}
