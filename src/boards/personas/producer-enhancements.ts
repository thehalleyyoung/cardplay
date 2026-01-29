/**
 * @fileoverview Producer/Beatmaker Persona Enhancements
 * 
 * Deep workflow enhancements for producers including
 * clip operations, bus routing, and project export.
 * 
 * @module @cardplay/boards/personas/producer-enhancements
 */

import type { ClipId, UndoActionType, EventId } from '../../state/types';
import { getClipRegistry } from '../../state/clip-registry';
import { getSharedEventStore } from '../../state/event-store';
import { getUndoStack } from '../../state/undo-stack';
import { asTick } from '../../types/primitives';
import { asEventId } from '../../types/event-id';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Bus routing configuration
 */
export interface BusConfiguration {
  id: string;
  name: string;
  type: 'send' | 'return' | 'group' | 'master';
  inputTracks: string[];
  outputBus?: string; // Cascading buses
  level: number; // 0-100
  mute: boolean;
  solo: boolean;
}

/**
 * Freeze options
 */
export interface FreezeOptions {
  includeEffects: boolean;
  includeSends: boolean;
  tailLength: number; // Milliseconds of reverb tail
  format: 'wav' | 'flac' | 'mp3';
  bitDepth: 16 | 24 | 32;
  sampleRate: 44100 | 48000 | 96000;
}

/**
 * Export settings
 */
export interface ExportSettings {
  format: 'wav' | 'flac' | 'mp3' | 'aiff';
  bitDepth: 16 | 24 | 32;
  sampleRate: 44100 | 48000 | 96000;
  normalize: boolean;
  dither: boolean;
  stems: boolean; // Export individual tracks
  loopRegion?: { start: number; end: number };
}

/**
 * Consolidate options
 */
export interface ConsolidateOptions {
  includeEffects: boolean;
  removeOriginalClips: boolean;
  preserveTiming: boolean;
}

// ============================================================================
// CLIP OPERATIONS
// ============================================================================

/**
 * Consolidates multiple clips into a single clip
 */
export function consolidateClips(
  clipIds: ClipId[],
  options: ConsolidateOptions = {
    includeEffects: true,
    removeOriginalClips: false,
    preserveTiming: true,
  }
): ClipId | null {
  if (clipIds.length === 0) return null;

  const registry = getClipRegistry();
  const store = getSharedEventStore();

  // Get all clips
  const clips = clipIds
    .map((id) => registry.getClip(id))
    .filter((clip): clip is NonNullable<typeof clip> => clip !== null);

  if (clips.length === 0) return null;

  // Find time bounds
  let minStart = Infinity;
  let maxEnd = -Infinity;

  for (const clip of clips) {
    const stream = store.getStream(clip.streamId);
    if (!stream) continue;

    for (const event of stream.events) {
      minStart = Math.min(minStart, event.start);
      maxEnd = Math.max(maxEnd, event.start + event.duration);
    }
  }

  // Create new stream with consolidated events
  const newStream = store.createStream({ name: 'Consolidated' });
  const newStreamId = newStream.id;
  const allEvents = [];

  for (const clip of clips) {
    const stream = store.getStream(clip.streamId);
    if (!stream) continue;

    // Copy events, offsetting by clip position if needed
    for (const event of stream.events) {
      const offsetEvent = options.preserveTiming
        ? { ...event, id: asEventId(`${event.id}-consolidated-${Date.now()}`) }
        : {
            ...event,
            id: asEventId(`${event.id}-consolidated-${Date.now()}`),
            start: asTick((event.start as number) - minStart),
          };
      allEvents.push(offsetEvent);
    }
  }

  store.addEvents(newStreamId, allEvents as any);

  // Create new clip
  const newClip = registry.createClip({
    streamId: newStreamId,
    name: 'Consolidated Clip',
    duration: asTick(maxEnd - minStart),
    loop: false,
  });
  const newClipId = newClip.id;

  // Remove original clips if requested
  if (options.removeOriginalClips) {
    for (const clipId of clipIds) {
      registry.deleteClip(clipId);
    }
  }

  // Record undo action
  getUndoStack().push({
    type: 'clip_create' as UndoActionType,
    description: 'Consolidate clips',
    undo: () => {
      registry.deleteClip(newClipId);
      if (options.removeOriginalClips) {
        // Would restore original clips
        console.log('Restore original clips');
      }
    },
    redo: () => {
      // Would recreate consolidated clip
      console.log('Recreate consolidated clip');
    },
  });

  return newClipId;
}

/**
 * Duplicates clip
 */
export function duplicateClip(clipId: ClipId): ClipId | null {
  const registry = getClipRegistry();
  const store = getSharedEventStore();

  const originalClip = registry.getClip(clipId);
  if (!originalClip) return null;

  // Clone stream
  const originalStream = store.getStream(originalClip.streamId);
  if (!originalStream) return null;

  const newStream = store.createStream({ name: `${originalStream.name} (Copy)` });
  const newStreamId = newStream.id;
  const clonedEvents = originalStream.events.map((event) => ({
    ...event,
    id: asEventId(`${event.id}-duplicate-${Date.now()}`),
  }));
  store.addEvents(newStreamId, clonedEvents as any);

  // Create new clip
  const newClip = registry.createClip({
    streamId: newStreamId,
    name: `${originalClip.name} (Copy)`,
    duration: originalClip.duration,
    loop: originalClip.loop,
  });
  const newClipId = newClip.id;

  // Record undo action
  getUndoStack().push({
    type: 'clip_create' as UndoActionType,
    description: 'Duplicate clip',
    undo: () => {
      registry.deleteClip(newClipId);
    },
    redo: () => {
      // Would recreate duplicated clip
      console.log('Recreate duplicated clip');
    },
  });

  return newClipId;
}

/**
 * Splits clip at position
 */
export function splitClip(clipId: ClipId, position: number): [ClipId, ClipId] | null {
  const registry = getClipRegistry();
  const store = getSharedEventStore();

  const originalClip = registry.getClip(clipId);
  if (!originalClip) return null;

  const stream = store.getStream(originalClip.streamId);
  if (!stream) return null;

  // Split events at position
  const beforeEvents = stream.events.filter((e) => e.start < position);
  const afterEvents = stream.events
    .filter((e) => e.start >= position)
    .map((e) => ({
      ...e,
      id: asEventId(`${e.id}-after-${Date.now()}`),
      start: asTick((e.start as number) - position),
    }));

  // Create two new streams
  const beforeStream = store.createStream({ name: `${stream.name} (1)` });
  const afterStream = store.createStream({ name: `${stream.name} (2)` });
  const beforeStreamId = beforeStream.id;
  const afterStreamId = afterStream.id;

  store.addEvents(beforeStreamId, beforeEvents as any);
  store.addEvents(afterStreamId, afterEvents as any);

  // Create two new clips
  const beforeClip = registry.createClip({
    streamId: beforeStreamId,
    name: `${originalClip.name} (1)`,
    duration: asTick(position),
    loop: false,
  });
  const beforeClipId = beforeClip.id;

  const afterClip = registry.createClip({
    streamId: afterStreamId,
    name: `${originalClip.name} (2)`,
    duration: asTick((originalClip.duration as number) - position),
    loop: false,
  });
  const afterClipId = afterClip.id;

  // Delete original clip
  registry.deleteClip(clipId);

  // Record undo action
  getUndoStack().push({
    type: 'clip_split' as UndoActionType,
    description: 'Split clip',
    undo: () => {
      registry.deleteClip(beforeClipId);
      registry.deleteClip(afterClipId);
      // Would restore original clip
      console.log('Restore original clip');
    },
    redo: () => {
      // Would recreate split clips
      console.log('Recreate split clips');
    },
  });

  return [beforeClipId, afterClipId];
}

// ============================================================================
// BUS ROUTING
// ============================================================================

/** Bus configurations (in-memory store) */
const busConfigurations = new Map<string, BusConfiguration>();

/**
 * Creates a bus
 */
export function createBus(
  name: string,
  type: BusConfiguration['type']
): BusConfiguration {
  const bus: BusConfiguration = {
    id: `bus-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    type,
    inputTracks: [],
    level: 100,
    mute: false,
    solo: false,
  };

  busConfigurations.set(bus.id, bus);
  return bus;
}

/**
 * Bus routing wizard - creates common routing setups
 */
export function busRoutingWizard(
  preset: 'basic-mix' | 'send-returns' | 'stem-groups' | 'parallel-compression'
): BusConfiguration[] {
  const buses: BusConfiguration[] = [];

  switch (preset) {
    case 'basic-mix':
      buses.push(
        createBus('Master', 'master'),
        createBus('Drums', 'group'),
        createBus('Bass', 'group'),
        createBus('Melodic', 'group'),
        createBus('FX', 'group')
      );
      break;

    case 'send-returns':
      buses.push(
        createBus('Master', 'master'),
        createBus('Reverb Send', 'send'),
        createBus('Reverb Return', 'return'),
        createBus('Delay Send', 'send'),
        createBus('Delay Return', 'return')
      );
      break;

    case 'stem-groups':
      buses.push(
        createBus('Master', 'master'),
        createBus('Kick', 'group'),
        createBus('Drums', 'group'),
        createBus('Bass', 'group'),
        createBus('Synths', 'group'),
        createBus('Vocals', 'group'),
        createBus('FX', 'group')
      );
      break;

    case 'parallel-compression':
      buses.push(
        createBus('Master', 'master'),
        createBus('Parallel Send', 'send'),
        createBus('Parallel Comp', 'return')
      );
      break;
  }

  return buses;
}

/**
 * Routes track to bus
 */
export function routeTrackToBus(trackId: string, busId: string): void {
  const bus = busConfigurations.get(busId);
  if (!bus) return;

  if (!bus.inputTracks.includes(trackId)) {
    bus.inputTracks.push(trackId);
  }
}

/**
 * Removes track from bus
 */
export function removeTrackFromBus(trackId: string, busId: string): void {
  const bus = busConfigurations.get(busId);
  if (!bus) return;

  bus.inputTracks = bus.inputTracks.filter((id) => id !== trackId);
}

/**
 * Gets all buses
 */
export function getAllBuses(): BusConfiguration[] {
  return Array.from(busConfigurations.values());
}

/**
 * Gets buses by type
 */
export function getBusesByType(type: BusConfiguration['type']): BusConfiguration[] {
  return getAllBuses().filter((bus) => bus.type === type);
}

// ============================================================================
// FREEZE & BOUNCE
// ============================================================================

/**
 * Freezes track (renders to audio)
 */
export function freezeTrack(
  clipId: ClipId,
  options: FreezeOptions = {
    includeEffects: true,
    includeSends: false,
    tailLength: 2000,
    format: 'wav',
    bitDepth: 24,
    sampleRate: 48000,
  }
): ClipId | null {
  const registry = getClipRegistry();
  const clip = registry.getClip(clipId);
  if (!clip) return null;

  // In a real implementation, this would:
  // 1. Render audio through the effects chain
  // 2. Create a new audio stream/clip
  // 3. Replace or link to the original
  console.log('Freeze track with options:', options);

  // For now, create a frozen marker
  const frozenClip = registry.createClip({
    streamId: clip.streamId,
    name: `${clip.name} (Frozen)`,
    duration: clip.duration,
    loop: false,
  });
  const frozenClipId = frozenClip.id;

  // Record undo
  getUndoStack().push({
    type: 'clip_create' as UndoActionType,
    description: 'Freeze track',
    undo: () => registry.deleteClip(frozenClipId),
    redo: () => {}, // Would re-create frozen clip
  });

  return frozenClipId;
}

/**
 * Unfreezes track
 */
export function unfreezeTrack(frozenClipId: ClipId): ClipId | null {
  const registry = getClipRegistry();
  const frozenClip = registry.getClip(frozenClipId);
  if (!frozenClip) return null;

  // In a real implementation, this would restore the original clip
  console.log('Unfreeze track');

  return frozenClipId;
}

// ============================================================================
// PROJECT EXPORT
// ============================================================================

/**
 * Exports project
 */
export function exportProject(settings: ExportSettings): void {
  console.log('Export project with settings:', settings);

  // In a real implementation, this would:
  // 1. Gather all clips and streams
  // 2. Render through effects and routing
  // 3. Apply normalization and dither if requested
  // 4. Write audio files in the specified format
  // 5. If stems=true, export each track separately

  // For now, just log the settings
  const summary = {
    format: settings.format,
    quality: `${settings.bitDepth}-bit / ${settings.sampleRate}Hz`,
    normalize: settings.normalize,
    dither: settings.dither,
    stems: settings.stems,
    loopRegion: settings.loopRegion ? 'Yes' : 'Full project',
  };

  console.log('Export summary:', summary);
}

/**
 * Gets export progress (for UI)
 */
export interface ExportProgress {
  phase: 'preparing' | 'rendering' | 'writing' | 'complete';
  percent: number;
  currentTrack?: string;
  estimatedTimeRemaining?: number;
}

/**
 * Simulates export progress (would be real in production)
 */
export function getExportProgress(): ExportProgress {
  return {
    phase: 'preparing',
    percent: 0,
  };
}

// ============================================================================
// CONTEXT MENU
// ============================================================================

/**
 * Producer context menu item
 */
export interface ProducerContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  action: () => void;
  enabled: boolean;
  submenu?: ProducerContextMenuItem[];
}

/**
 * Creates producer-specific context menu
 */
export function createProducerContextMenu(
  selectedClipIds: ClipId[]
): ProducerContextMenuItem[] {
  const hasSelection = selectedClipIds.length > 0;
  const singleSelection = selectedClipIds.length === 1;
  const multipleSelection = selectedClipIds.length > 1;

  return [
    {
      id: 'consolidate',
      label: 'Consolidate',
      icon: '🔗',
      shortcut: 'Ctrl+J',
      enabled: multipleSelection,
      action: () => consolidateClips(selectedClipIds),
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: '📋',
      shortcut: 'Ctrl+D',
      enabled: hasSelection,
      action: () => {
        for (const clipId of selectedClipIds) {
          duplicateClip(clipId);
        }
      },
    },
    {
      id: 'split',
      label: 'Split',
      icon: '✂️',
      shortcut: 'Ctrl+E',
      enabled: singleSelection,
      action: () => {
        // Would open split dialog
        console.log('Open split dialog');
      },
    },
    {
      id: 'freeze',
      label: 'Freeze Track',
      icon: '❄️',
      shortcut: 'Ctrl+Shift+F',
      enabled: hasSelection,
      action: () => {
        for (const clipId of selectedClipIds) {
          freezeTrack(clipId);
        }
      },
    },
    {
      id: 'export',
      label: 'Export',
      icon: '💾',
      enabled: true,
      action: () => {}, // Parent menu item
      submenu: [
        {
          id: 'export-wav',
          label: 'Export as WAV',
          enabled: true,
          action: () => exportProject({ format: 'wav', bitDepth: 24, sampleRate: 48000, normalize: false, dither: false, stems: false }),
        },
        {
          id: 'export-mp3',
          label: 'Export as MP3',
          enabled: true,
          action: () => exportProject({ format: 'mp3', bitDepth: 16, sampleRate: 44100, normalize: true, dither: false, stems: false }),
        },
        {
          id: 'export-stems',
          label: 'Export Stems',
          enabled: true,
          action: () => exportProject({ format: 'wav', bitDepth: 24, sampleRate: 48000, normalize: false, dither: false, stems: true }),
        },
      ],
    },
  ];
}
