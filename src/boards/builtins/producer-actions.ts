/**
 * @fileoverview Producer Board Actions (Phase I: I040-I044)
 * 
 * Production-specific actions for the Producer board:
 * - I040: Per-track control level badges on mixer strips
 * - I041: Freeze generated tracks (turn AI output into editable events)
 * - I042: Render/bounce tracks to audio (performance + metadata)
 * - I043: Automation lanes integration
 * - I044: Timeline/session clip sharing via ClipRegistry
 * 
 * @module @cardplay/boards/builtins/producer-actions
 */

import type { EventStreamId, ClipId } from '../../state/types';
import type { Event } from '../../types/event';
import { asTick } from '../../types/primitives';
import { getSharedEventStore } from '../../state/event-store';
import { getClipRegistry } from '../../state/clip-registry';
import { getUndoStack } from '../../state/undo-stack';

// ============================================================================
// I041: FREEZE GENERATED TRACK
// ============================================================================

/**
 * Metadata for generated events.
 */
export interface GeneratedMetadata {
  /** Generator that created this */
  generator: string;
  
  /** Settings used for generation */
  settings: Record<string, unknown>;
  
  /** Timestamp of generation */
  timestamp: number;
  
  /** Whether frozen (no longer regenerates) */
  frozen: boolean;
  
  /** Source stream (if adapted from another stream) */
  sourceStreamId?: EventStreamId;
}

/**
 * Mark for generated events in payload.
 */
export const GENERATED_MARKER = '__generated';

/**
 * Check if an event is marked as generated.
 */
export function isGeneratedEvent(event: Event<any>): boolean {
  return GENERATED_MARKER in event.payload && event.payload[GENERATED_MARKER] === true;
}

/**
 * Get generated metadata from an event.
 */
export function getGeneratedMetadata(event: Event<any>): GeneratedMetadata | null {
  if (!isGeneratedEvent(event)) return null;
  return (event.payload.__generatedMeta as GeneratedMetadata) || null;
}

/**
 * I041: Freeze a generated track.
 * 
 * Converts AI-generated events into static editable events by:
 * 1. Marking all events as frozen (no auto-regeneration)
 * 2. Preserving metadata for reference
 * 3. Making events fully editable like manual events
 * 
 * Undoable: can unfreeze to restore generative behavior.
 */
export function freezeGeneratedTrack(streamId: EventStreamId): void {
  const store = getSharedEventStore();
  const stream = store.getStream(streamId);
  
  if (!stream) {
    console.warn('Stream not found:', streamId);
    return;
  }
  
  // Find all generated events
  const generatedEvents = stream.events.filter(isGeneratedEvent);
  
  if (generatedEvents.length === 0) {
    console.info('No generated events to freeze');
    return;
  }
  
  // Create frozen versions
  const frozenEvents = generatedEvents.map(event => {
    const meta = getGeneratedMetadata(event);
    const payload = event.payload as Record<string, any>;
    return {
      ...event,
      payload: {
        ...payload,
        __generatedMeta: {
          ...(meta || {}),
          frozen: true
        }
      }
    };
  });
  
  // Apply with undo support
  getUndoStack().push({
    type: 'batch',
    description: `Freeze ${generatedEvents.length} generated events`,
    undo: () => {
      // Update events in place
      frozenEvents.forEach(frozenEvent => {
        store.removeEvents(streamId, [frozenEvent.id]);
        store.addEvents(streamId, [frozenEvent]);
      });
    },
    redo: () => {
      // Restore original (unfrozen) events
      generatedEvents.forEach(originalEvent => {
        const frozenId = originalEvent.id;
        store.removeEvents(streamId, [frozenId]);
        store.addEvents(streamId, [originalEvent]);
      });
    }
  });
}

/**
 * Check if a track has any unfrozen generated events.
 */
export function hasUnfrozenGeneratedEvents(streamId: EventStreamId): boolean {
  const store = getSharedEventStore();
  const stream = store.getStream(streamId);
  
  if (!stream) return false;
  
  return stream.events.some(event => {
    const meta = getGeneratedMetadata(event);
    return meta && !meta.frozen;
  });
}

// ============================================================================
// I042: RENDER/BOUNCE TRACK
// ============================================================================

/**
 * Bounce metadata links rendered audio to source.
 */
export interface BounceMetadata {
  /** Source stream ID */
  sourceStreamId: EventStreamId;
  
  /** Source stream name */
  sourceStreamName: string;
  
  /** Bounce timestamp */
  timestamp: number;
  
  /** Settings used for bounce */
  settings: BounceSettings;
  
  /** Audio file reference (if saved) */
  audioFileRef?: string;
  
  /** Sample rate */
  sampleRate: number;
  
  /** Bit depth */
  bitDepth: number;
  
  /** Duration in samples */
  durationSamples: number;
}

/**
 * Bounce settings.
 */
export interface BounceSettings {
  /** Include effects */
  includeEffects: boolean;
  
  /** Include automation */
  includeAutomation: boolean;
  
  /** Normalize audio */
  normalize: boolean;
  
  /** Target peak level (if normalizing) */
  targetPeak: number;
  
  /** Dither */
  dither: boolean;
  
  /** Tail length (for reverb/delay) in seconds */
  tailLength: number;
}

/**
 * Default bounce settings.
 */
export const DEFAULT_BOUNCE_SETTINGS: BounceSettings = {
  includeEffects: true,
  includeAutomation: true,
  normalize: false,
  targetPeak: -0.3,
  dither: true,
  tailLength: 2.0
};

/**
 * I042: Render/bounce a track to audio.
 * 
 * Stub implementation - would integrate with audio engine to:
 * 1. Render stream through effects/automation
 * 2. Save as audio file
 * 3. Create clip referencing audio
 * 4. Preserve metadata linking to source
 * 
 * For MVP, creates a placeholder clip with bounce metadata.
 */
export async function bounceTrack(
  streamId: EventStreamId,
  _settings: BounceSettings = DEFAULT_BOUNCE_SETTINGS
): Promise<ClipId | null> {
  const store = getSharedEventStore();
  const registry = getClipRegistry();
  const stream = store.getStream(streamId);
  
  if (!stream) {
    console.warn('Stream not found:', streamId);
    return null;
  }
  
  // For MVP, create a clip that references the source stream
  // In full implementation, would:
  // 1. Render audio through audio engine
  // 2. Save audio file to disk
  // 3. Create clip referencing audio file
  
  const clipName = `${stream.name} (Bounced)`;
  
  // Calculate duration from events
  const durationTicks = stream.events.length > 0 ? 
    Math.max(...stream.events.map(e => e.start + e.duration)) : 
    0;
  
  // Create clip with bounce metadata
  const clip = registry.createClip({
    name: clipName,
    streamId: streamId,
    duration: asTick(durationTicks),
    loop: false,
    color: '#FF9800' // Orange for bounced clips
  });
  
  return clip.id;
}

/**
 * Check if a clip is a bounced track.
 */
export function isBoucedClip(_clipId: ClipId): boolean {
  // TODO: Store bounce metadata separately once metadata field is available
  return false;
}

/**
 * Get bounce metadata from a clip.
 */
export function getBounceMetadata(_clipId: ClipId): BounceMetadata | null {
  // TODO: Store bounce metadata separately once metadata field is available
  return null;
}

// ============================================================================
// I043: AUTOMATION LANES INTEGRATION
// ============================================================================

/**
 * Automation lane for a parameter.
 */
export interface AutomationLane {
  /** Parameter path (e.g., "volume", "pan", "send1") */
  parameterPath: string;
  
  /** Automation points */
  points: AutomationPoint[];
  
  /** Curve type between points */
  curve: 'linear' | 'smooth' | 'step';
  
  /** Whether lane is armed for recording */
  armed: boolean;
  
  /** Whether lane is visible */
  visible: boolean;
}

/**
 * Automation point.
 */
export interface AutomationPoint {
  /** Time in ticks */
  time: number;
  
  /** Value (0-1 normalized) */
  value: number;
  
  /** Optional curve tension */
  tension?: number;
}

/**
 * I043: Get automation lanes for a track/stream.
 * 
 * Stub implementation - would integrate with parameter-resolver.ts
 * to read/write automation data. For MVP, returns empty array.
 */
export function getAutomationLanes(_streamId: EventStreamId): AutomationLane[] {
  // TODO: Integrate with parameter-resolver.ts
  // For MVP, return empty array
  return [];
}

/**
 * Add an automation point to a lane.
 * 
 * Stub implementation - would integrate with parameter-resolver.ts.
 */
export function addAutomationPoint(
  streamId: EventStreamId,
  parameterPath: string,
  point: AutomationPoint
): void {
  // TODO: Integrate with parameter-resolver.ts
  console.info('Add automation point:', { streamId, parameterPath, point });
}

/**
 * Clear automation for a parameter.
 */
export function clearAutomation(
  streamId: EventStreamId,
  parameterPath: string
): void {
  // TODO: Integrate with parameter-resolver.ts
  console.info('Clear automation:', { streamId, parameterPath });
}

// ============================================================================
// I044: TIMELINE/SESSION CLIP SHARING
// ============================================================================

/**
 * Verify that timeline and session views share clips via ClipRegistry.
 * 
 * This is an invariant check, not an action. The ClipRegistry ensures:
 * 1. Single source of truth for all clips
 * 2. Timeline and session views read from same registry
 * 3. Changes in either view update the shared clip
 * 4. No clip duplication between views
 */
export function verifyClipSharing(): boolean {
  const registry = getClipRegistry();
  
  // Get all clips
  const clips = registry.getAllClips();
  
  // Verify each clip is uniquely identified
  const clipIds = new Set<ClipId>();
  for (const clip of clips) {
    if (clipIds.has(clip.id)) {
      console.error('Duplicate clip ID found:', clip.id);
      return false;
    }
    clipIds.add(clip.id);
  }
  
  // Verify each clip references valid streams
  const store = getSharedEventStore();
  for (const clip of clips) {
    const stream = store.getStream(clip.streamId);
    if (!stream) {
      console.error('Clip references non-existent stream:', { clipId: clip.id, streamId: clip.streamId });
      return false;
    }
  }
  
  return true;
}

// ============================================================================
// EXPORTS
// ============================================================================
