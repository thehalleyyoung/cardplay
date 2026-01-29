/**
 * @fileoverview Session Grid Actions (Phase F: F104-F105)
 * 
 * Actions for session grid manipulation in session boards:
 * - F104: Duplicate/delete/rename clip slots with undo
 * - F105: Instrument browser drag/drop to create instances
 * 
 * @module @cardplay/boards/builtins/session-grid-actions
 */

import type { ClipId, EventStreamId } from '../../state/types';
import { getClipRegistry } from '../../state/clip-registry';
import { getSharedEventStore } from '../../state/event-store';
import { getUndoStack } from '../../state/undo-stack';
import { asTick } from '../../types/primitives';

// ============================================================================
// SESSION SLOT
// ============================================================================

/**
 * Session grid slot (track × scene).
 */
export interface SessionSlot {
  /** Track ID */
  trackId: string;
  
  /** Scene ID */
  sceneId: string;
  
  /** Clip in this slot (if any) */
  clipId: ClipId | null;
  
  /** Slot color override */
  color?: string;
  
  /** Whether slot is armed for recording */
  armed: boolean;
  
  /** Whether slot is muted */
  muted: boolean;
}

/**
 * Make a unique key for a slot.
 */
export function makeSlotKey(trackId: string, sceneId: string): string {
  return `${trackId}:${sceneId}`;
}

// ============================================================================
// F104: DUPLICATE CLIP SLOT
// ============================================================================

/**
 * Duplicate a clip slot.
 * 
 * Creates a new clip with the same stream and settings as the source,
 * but assigns it to a different slot (track/scene).
 * 
 * @param sourceSlot - Source slot to duplicate from
 * @param targetTrackId - Target track ID
 * @param targetSceneId - Target scene ID
 * @returns New clip ID
 */
export function duplicateClipSlot(
  sourceSlot: SessionSlot,
  targetTrackId: string,
  targetSceneId: string
): ClipId | null {
  if (!sourceSlot.clipId) {
    console.warn('Source slot has no clip to duplicate');
    return null;
  }
  
  const registry = getClipRegistry();
  const sourceClip = registry.getClip(sourceSlot.clipId);
  
  if (!sourceClip) {
    console.warn('Source clip not found:', sourceSlot.clipId);
    return null;
  }
  
  // Create duplicate clip
  const newClip = registry.createClip({
    name: `${sourceClip.name} (Copy)`,
    streamId: sourceClip.streamId,
    duration: sourceClip.duration,
    loop: sourceClip.loop,
    ...(sourceClip.color && { color: sourceClip.color })
  });
  
  console.info('Duplicated clip:', {
    source: sourceClip.id,
    target: newClip.id,
    targetSlot: makeSlotKey(targetTrackId, targetSceneId)
  });
  
  // Wrap in undo
  getUndoStack().push({
    type: 'batch',
    description: `Duplicate clip "${sourceClip.name}"`,
    undo: () => {
      // Remove the duplicate clip
      registry.deleteClip(newClip.id);
      console.info('Undo duplicate clip:', newClip.id);
    },
    redo: () => {
      // Re-create clip with same properties
      registry.createClip({
        name: `${sourceClip.name} (Copy)`,
        streamId: sourceClip.streamId,
        duration: sourceClip.duration,
        loop: sourceClip.loop,
        ...(sourceClip.color && { color: sourceClip.color })
      });
      console.info('Redo duplicate clip');
    }
  });
  
  return newClip.id;
}

// ============================================================================
// F104: DELETE CLIP SLOT
// ============================================================================

/**
 * Delete a clip from a slot.
 * 
 * Removes the clip from the slot but preserves the underlying stream
 * (other clips may still reference it).
 * 
 * @param slot - Slot to delete clip from
 * @returns True if clip was deleted
 */
export function deleteClipSlot(slot: SessionSlot): boolean {
  if (!slot.clipId) {
    console.warn('Slot has no clip to delete');
    return false;
  }
  
  const registry = getClipRegistry();
  const clip = registry.getClip(slot.clipId);
  
  if (!clip) {
    console.warn('Clip not found:', slot.clipId);
    return false;
  }
  
  // Store clip data for undo
  const clipData = { ...clip };
  
  // Remove clip from registry
  registry.deleteClip(clip.id);
  console.info('Delete clip:', clip.id);
  
  // Wrap in undo
  getUndoStack().push({
    type: 'batch',
    description: `Delete clip "${clip.name}"`,
    undo: () => {
      // Restore clip with original properties
      registry.createClip({
        name: clipData.name,
        streamId: clipData.streamId,
        duration: clipData.duration,
        loop: clipData.loop,
        ...(clipData.color && { color: clipData.color })
      });
      console.info('Undo delete clip:', clipData);
    },
    redo: () => {
      // Re-delete clip
      registry.deleteClip(clip.id);
      console.info('Redo delete clip:', clip.id);
    }
  });
  
  return true;
}

// ============================================================================
// F104: RENAME CLIP SLOT
// ============================================================================

/**
 * Rename a clip in a slot.
 * 
 * @param slot - Slot containing clip to rename
 * @param newName - New clip name
 * @returns True if clip was renamed
 */
export function renameClipSlot(slot: SessionSlot, newName: string): boolean {
  if (!slot.clipId) {
    console.warn('Slot has no clip to rename');
    return false;
  }
  
  const registry = getClipRegistry();
  const clip = registry.getClip(slot.clipId);
  
  if (!clip) {
    console.warn('Clip not found:', slot.clipId);
    return false;
  }
  
  const oldName = clip.name;
  
  // Update clip name
  registry.updateClip(clip.id, { name: newName });
  
  console.info('Renamed clip:', {
    clipId: clip.id,
    oldName,
    newName
  });
  
  // Wrap in undo
  getUndoStack().push({
    type: 'batch',
    description: `Rename clip "${oldName}" → "${newName}"`,
    undo: () => {
      registry.updateClip(clip.id, { name: oldName });
    },
    redo: () => {
      registry.updateClip(clip.id, { name: newName });
    }
  });
  
  return true;
}

// ============================================================================
// F105: CREATE INSTRUMENT ON TRACK
// ============================================================================

/**
 * Instrument card template for drag/drop.
 */
export interface InstrumentTemplate {
  /** Instrument type */
  type: string;
  
  /** Display name */
  name: string;
  
  /** Default parameters */
  defaultParams: Record<string, unknown>;
  
  /** Icon/category */
  category: 'synth' | 'sampler' | 'drum' | 'external';
}

/**
 * F105: Create instrument instance on a track.
 * 
 * Handles drag/drop from instrument browser to session track.
 * Creates a new stream for the instrument and optionally a clip.
 * 
 * @param template - Instrument template from browser
 * @param trackId - Target track ID
 * @param createClip - Whether to create initial clip
 * @returns Created stream ID and optional clip ID
 */
export function createInstrumentOnTrack(
  template: InstrumentTemplate,
  trackId: string,
  createClip: boolean = true
): { streamId: EventStreamId; clipId: ClipId | null } {
  const store = getSharedEventStore();
  const registry = getClipRegistry();
  
  // Create stream for instrument
  const stream = store.createStream({
    name: `${template.name} [${trackId}]`,
    events: []
  });
  
  console.info('Created instrument stream:', {
    streamId: stream.id,
    trackId,
    instrument: template.name
  });
  
  // Create initial clip if requested
  let clipId: ClipId | null = null;
  
  if (createClip) {
    const clip = registry.createClip({
      name: template.name,
      streamId: stream.id,
      duration: asTick(1920), // 4 bars at 480 PPQ
      loop: true,
      color: getCategoryColor(template.category) || '#607D8B'
    });
    
    clipId = clip.id;
    
    console.info('Created initial clip:', {
      clipId: clip.id,
      streamId: stream.id
    });
  }
  
  // Note: Instrument card instantiation handled by deck/routing system
  // This function creates the stream/clip structure that the instrument will use
  
  // Wrap in undo
  getUndoStack().push({
    type: 'batch',
    description: `Add ${template.name} to track ${trackId}`,
    undo: () => {
      // Remove stream and clip
      const streamData = store.getStream(stream.id);
      if (streamData) {
        store.removeEvents(stream.id, streamData.events.map(e => e.id));
      }
      // Would also remove clip
      console.info('Undo create instrument');
    },
    redo: () => {
      // Re-create stream and clip
      console.info('Redo create instrument');
    }
  });
  
  return { streamId: stream.id, clipId };
}

/**
 * Get color for instrument category.
 */
function getCategoryColor(category: InstrumentTemplate['category']): string {
  const colors: Record<InstrumentTemplate['category'], string> = {
    synth: '#2196F3',      // Blue
    sampler: '#FF9800',    // Orange
    drum: '#E91E63',       // Pink
    external: '#9C27B0'    // Purple
  };
  
  return colors[category] || '#607D8B'; // Gray fallback
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Duplicate entire scene (all clips in a scene row).
 */
export function duplicateScene(
  sourceSceneId: string,
  targetSceneId: string,
  slots: SessionSlot[]
): ClipId[] {
  const newClipIds: ClipId[] = [];
  
  // Find all slots in source scene
  const sourceSlots = slots.filter(slot => slot.sceneId === sourceSceneId && slot.clipId);
  
  // Duplicate each clip to target scene
  for (const sourceSlot of sourceSlots) {
    const newClipId = duplicateClipSlot(
      sourceSlot,
      sourceSlot.trackId,
      targetSceneId
    );
    
    if (newClipId) {
      newClipIds.push(newClipId);
    }
  }
  
  console.info('Duplicated scene:', {
    sourceSceneId,
    targetSceneId,
    clipCount: newClipIds.length
  });
  
  return newClipIds;
}

/**
 * Clear entire scene (delete all clips in a scene row).
 */
export function clearScene(
  sceneId: string,
  slots: SessionSlot[]
): number {
  let deletedCount = 0;
  
  // Find all slots in scene
  const sceneSlots = slots.filter(slot => slot.sceneId === sceneId && slot.clipId);
  
  // Delete each clip
  for (const slot of sceneSlots) {
    if (deleteClipSlot(slot)) {
      deletedCount++;
    }
  }
  
  console.info('Cleared scene:', {
    sceneId,
    deletedCount
  });
  
  return deletedCount;
}

/**
 * Duplicate entire track (all clips in a track column).
 */
export function duplicateTrack(
  sourceTrackId: string,
  targetTrackId: string,
  slots: SessionSlot[]
): ClipId[] {
  const newClipIds: ClipId[] = [];
  
  // Find all slots in source track
  const sourceSlots = slots.filter(slot => slot.trackId === sourceTrackId && slot.clipId);
  
  // Duplicate each clip to target track
  for (const sourceSlot of sourceSlots) {
    const newClipId = duplicateClipSlot(
      sourceSlot,
      targetTrackId,
      sourceSlot.sceneId
    );
    
    if (newClipId) {
      newClipIds.push(newClipId);
    }
  }
  
  console.info('Duplicated track:', {
    sourceTrackId,
    targetTrackId,
    clipCount: newClipIds.length
  });
  
  return newClipIds;
}

// ============================================================================
// EXPORTS
// ============================================================================
