/**
 * @fileoverview Score Notation ↔ Session View Bridge
 * 
 * Connects the ScoreNotationCard to the ClipRegistry and Session View system.
 * This bridge enables:
 * - Displaying clip contents as notation when a clip is selected
 * - Syncing notation edits back to the clip's event stream
 * - Multi-clip viewing for arrangement ranges
 * - Real-time updates when clips change
 * 
 * @module @cardplay/ui/score-notation-session-bridge
 */

import type { ClipId, ClipRecord, SubscriptionId } from '../state/types';
import type { Event } from '../types/event';
import type { Tick, TickDuration } from '../types/primitives';
import { getClipRegistry, getSharedEventStore } from '../state';
import type { ScoreNoteInput, ChordSymbolInput } from '../cards/score-notation';
import { ScoreNotationCard } from '../cards/score-notation';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Edit operations that can be applied to notation.
 */
export type NotationEditType = 
  | 'add-note'
  | 'delete-note'
  | 'move-note'
  | 'resize-note'
  | 'change-pitch'
  | 'change-velocity'
  | 'add-tie'
  | 'remove-tie'
  | 'add-articulation'
  | 'remove-articulation';

/**
 * A notation edit operation.
 */
export interface NotationEdit {
  readonly type: NotationEditType;
  readonly noteId: string;
  readonly changes: Partial<{
    startTick: Tick;
    durationTick: TickDuration;
    pitch: number;
    velocity: number;
    tiedTo: string;
    tiedFrom: string;
    articulation: string;
  }>;
}

/**
 * Callback for clip selection changes.
 */
export type ClipSelectionCallback = (clipId: ClipId | null) => void;

/**
 * Callback for notation edit events.
 */
export type NotationEditCallback = (edits: NotationEdit[]) => void;

/**
 * Configuration for the bridge.
 */
export interface ScoreNotationSessionBridgeConfig {
  /** Ticks per quarter note for conversion */
  readonly ticksPerQuarter: number;
  /** Whether to auto-scroll notation when playback position changes */
  readonly followPlayback: boolean;
  /** Whether to show chord symbols from clips */
  readonly showChords: boolean;
  /** Whether to show section markers */
  readonly showSections: boolean;
}

/**
 * Default bridge configuration.
 */
export const DEFAULT_BRIDGE_CONFIG: ScoreNotationSessionBridgeConfig = {
  ticksPerQuarter: 480,
  followPlayback: true,
  showChords: true,
  showSections: true,
};

/**
 * State of the bridge.
 */
export interface ScoreNotationSessionBridgeState {
  /** Currently selected clip ID */
  readonly selectedClipId: ClipId | null;
  /** Currently viewed bar range */
  readonly viewRange: { start: number; end: number } | null;
  /** Currently displayed track ID (filter) */
  readonly trackFilter: string | null;
  /** Whether the bridge is active */
  readonly active: boolean;
}

// ============================================================================
// BRIDGE IMPLEMENTATION
// ============================================================================

/**
 * Bridge connecting ScoreNotationCard to the Session View and ClipRegistry.
 * 
 * @example
 * ```typescript
 * const card = new ScoreNotationCard('notation-1');
 * const bridge = createScoreNotationSessionBridge(card);
 * 
 * // When user selects a clip in Session View
 * bridge.selectClip('clip_123');
 * 
 * // When user edits in notation
 * card.onEdit((edit) => {
 *   bridge.applyNotationEdit(edit);
 * });
 * ```
 */
export interface ScoreNotationSessionBridge {
  // --- Lifecycle ---
  
  /** Start the bridge (subscribe to events) */
  start(): void;
  
  /** Stop the bridge (unsubscribe from events) */
  stop(): void;
  
  /** Dispose of the bridge and clean up resources */
  dispose(): void;
  
  // --- Clip Selection ---
  
  /** Select a clip to display in notation */
  selectClip(clipId: ClipId | null): void;
  
  /** Get currently selected clip ID */
  getSelectedClipId(): ClipId | null;
  
  /** Get the currently selected clip record */
  getSelectedClip(): ClipRecord | null;
  
  // --- View Control ---
  
  /** Set the bar range to view */
  setViewRange(startBar: number, endBar: number): void;
  
  /** Get the current view range */
  getViewRange(): { start: number; end: number } | null;
  
  /** Set track filter (show only notes from specific track) */
  setTrackFilter(trackId: string | null): void;
  
  // --- Sync Operations ---
  
  /** Apply a notation edit to the underlying clip */
  applyNotationEdit(edit: NotationEdit): boolean;
  
  /** Apply multiple notation edits as a batch */
  applyNotationEdits(edits: NotationEdit[]): boolean;
  
  /** Refresh notation from current clip data */
  refresh(): void;
  
  // --- Event Subscriptions ---
  
  /** Subscribe to clip selection changes */
  onClipSelectionChange(callback: ClipSelectionCallback): SubscriptionId;
  
  /** Subscribe to notation edit events */
  onNotationEdit(callback: NotationEditCallback): SubscriptionId;
  
  /** Unsubscribe from events */
  unsubscribe(subscriptionId: SubscriptionId): boolean;
  
  // --- State ---
  
  /** Get current bridge state */
  getState(): ScoreNotationSessionBridgeState;
  
  /** Get the configuration */
  getConfig(): ScoreNotationSessionBridgeConfig;
  
  /** Update configuration */
  updateConfig(changes: Partial<ScoreNotationSessionBridgeConfig>): void;
}

// ============================================================================
// CONVERSION FUNCTIONS
// ============================================================================

/**
 * Convert clip events to ScoreNoteInput format.
 */
function eventsToScoreNotes(
  events: readonly Event<unknown>[],
  ticksPerQuarter: number
): ScoreNoteInput[] {
  const notes: ScoreNoteInput[] = [];
  
  for (const event of events) {
    // Filter to note events only
    if (event.kind !== 'note' && event.kind !== 'Note') {
      continue;
    }
    
    const payload = event.payload as {
      pitch?: number;
      note?: number;
      velocity?: number;
      duration?: number;
      durationTick?: number;
      voice?: number;
      channel?: number;
      articulation?: string;
      tiedFrom?: string;
      tiedTo?: string;
    };
    
    const pitch = payload.pitch ?? payload.note ?? 60;
    const velocity = payload.velocity ?? 100;
    const durationTick = payload.durationTick ?? payload.duration ?? ticksPerQuarter;
    const voice = payload.voice ?? payload.channel ?? 0;
    
    // Build note object without optional undefined values
    const note: ScoreNoteInput = {
      id: event.id,
      startTick: event.start as Tick,
      durationTick: durationTick as TickDuration,
      pitch,
      velocity,
      voice,
      sourceEventId: event.id,
    };
    
    // Only add optional fields if they have values
    if (payload.articulation) {
      (note as { articulation?: string }).articulation = payload.articulation;
    }
    if (payload.tiedFrom) {
      (note as { tiedFrom?: string }).tiedFrom = payload.tiedFrom;
    }
    if (payload.tiedTo) {
      (note as { tiedTo?: string }).tiedTo = payload.tiedTo;
    }
    
    notes.push(note);
  }
  
  return notes;
}

/**
 * Extract chord symbols from clip events.
 */
function eventsToChordSymbols(events: readonly Event<unknown>[]): ChordSymbolInput[] {
  const chords: ChordSymbolInput[] = [];
  
  for (const event of events) {
    if (event.kind !== 'chord' && event.kind !== 'Chord') {
      continue;
    }
    
    const payload = event.payload as {
      root?: string;
      type?: string;
      bass?: string;
      symbol?: string;
    };
    
    chords.push({
      startTick: event.start as Tick,
      root: payload.root ?? 'C',
      type: payload.type ?? 'major',
      ...(payload.bass ? { bass: payload.bass } : {}),
      symbol: payload.symbol ?? `${payload.root ?? 'C'}${payload.type ?? ''}`,
    });
  }
  
  return chords;
}

/**
 * Convert a ScoreNoteInput edit back to an Event update.
 */
function noteEditToEventUpdate(
  edit: NotationEdit,
  originalEvent: Event<unknown> | undefined
): Partial<Event<unknown>> | null {
  if (!originalEvent) {
    return null;
  }
  
  const updates: Record<string, unknown> = {};
  const payloadUpdates: Record<string, unknown> = {};
  
  if (edit.changes.startTick !== undefined) {
    updates.tick = edit.changes.startTick;
  }
  
  if (edit.changes.durationTick !== undefined) {
    payloadUpdates.duration = edit.changes.durationTick;
    payloadUpdates.durationTick = edit.changes.durationTick;
  }
  
  if (edit.changes.pitch !== undefined) {
    payloadUpdates.pitch = edit.changes.pitch;
    payloadUpdates.note = edit.changes.pitch;
  }
  
  if (edit.changes.velocity !== undefined) {
    payloadUpdates.velocity = edit.changes.velocity;
  }
  
  if (edit.changes.tiedTo !== undefined) {
    payloadUpdates.tiedTo = edit.changes.tiedTo;
  }
  
  if (edit.changes.tiedFrom !== undefined) {
    payloadUpdates.tiedFrom = edit.changes.tiedFrom;
  }
  
  if (edit.changes.articulation !== undefined) {
    payloadUpdates.articulation = edit.changes.articulation;
  }
  
  // Merge payload updates
  if (Object.keys(payloadUpdates).length > 0) {
    updates.payload = {
      ...(originalEvent.payload as object),
      ...payloadUpdates,
    };
  }
  
  return Object.keys(updates).length > 0 ? updates : null;
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a ScoreNotationSessionBridge instance.
 */
export function createScoreNotationSessionBridge(
  notationCard: ScoreNotationCard,
  config: Partial<ScoreNotationSessionBridgeConfig> = {}
): ScoreNotationSessionBridge {
  // Merge config with defaults
  let bridgeConfig: ScoreNotationSessionBridgeConfig = {
    ...DEFAULT_BRIDGE_CONFIG,
    ...config,
  };
  
  // Internal state
  let selectedClipId: ClipId | null = null;
  let viewRange: { start: number; end: number } | null = null;
  let trackFilter: string | null = null;
  let active = false;
  
  // Subscriptions
  const eventStoreSubscriptionIds: SubscriptionId[] = [];
  const selectionCallbacks = new Map<SubscriptionId, ClipSelectionCallback>();
  const editCallbacks = new Map<SubscriptionId, NotationEditCallback>();
  let nextSubscriptionId = 0;
  
  /**
   * Generate a unique subscription ID.
   */
  function generateSubId(): SubscriptionId {
    return `bridge_sub_${++nextSubscriptionId}` as SubscriptionId;
  }
  
  /**
   * Load clip data into the notation card.
   */
  function loadClipIntoNotation(clipId: ClipId): void {
    const registry = getClipRegistry();
    const clip = registry.getClip(clipId);
    
    if (!clip) {
      notationCard.setInputNotes([]);
      notationCard.setChordSymbols([]);
      return;
    }
    
    // Get events from the shared event store
    const eventStore = getSharedEventStore();
    const stream = eventStore.getStream(clip.streamId);
    
    if (!stream) {
      notationCard.setInputNotes([]);
      notationCard.setChordSymbols([]);
      return;
    }
    
    // Convert events to notation format
    const notes = eventsToScoreNotes(stream.events, bridgeConfig.ticksPerQuarter);
    notationCard.setInputNotes(notes);
    
    // Extract and set chord symbols if enabled
    if (bridgeConfig.showChords) {
      const chords = eventsToChordSymbols(stream.events);
      notationCard.setChordSymbols(chords);
    }
  }
  
  /**
   * Notify selection callbacks.
   */
  function notifySelectionChange(clipId: ClipId | null): void {
    for (const callback of selectionCallbacks.values()) {
      try {
        callback(clipId);
      } catch (e) {
        console.error('Score notation session bridge selection callback error:', e);
      }
    }
  }
  
  /**
   * Notify edit callbacks.
   */
  function notifyEdits(edits: NotationEdit[]): void {
    for (const callback of editCallbacks.values()) {
      try {
        callback(edits);
      } catch (e) {
        console.error('Score notation session bridge edit callback error:', e);
      }
    }
  }
  
  // Create the bridge object
  const bridge: ScoreNotationSessionBridge = {
    start(): void {
      if (active) return;
      active = true;
      
      // Subscribe to clip registry changes
      const registry = getClipRegistry();
      registry.subscribeAll((_clip, changeType, clipId) => {
        if (clipId === selectedClipId) {
          if (changeType === 'deleted') {
            bridge.selectClip(null);
          } else if (changeType === 'updated') {
            bridge.refresh();
          }
        }
      });
    },
    
    stop(): void {
      if (!active) return;
      active = false;
      
      // Unsubscribe from event store
      const eventStore = getSharedEventStore();
      for (const subId of eventStoreSubscriptionIds) {
        eventStore.unsubscribe(subId);
      }
      eventStoreSubscriptionIds.length = 0;
    },
    
    dispose(): void {
      bridge.stop();
      selectionCallbacks.clear();
      editCallbacks.clear();
      selectedClipId = null;
      viewRange = null;
      trackFilter = null;
    },
    
    selectClip(clipId: ClipId | null): void {
      if (clipId === selectedClipId) return;
      
      selectedClipId = clipId;
      
      if (clipId) {
        loadClipIntoNotation(clipId);
        
        // Subscribe to the clip's event stream for real-time updates
        const registry = getClipRegistry();
        const clipRecord = registry.getClip(clipId);
        if (clipRecord) {
          const eventStore = getSharedEventStore();
          const subId = eventStore.subscribe(clipRecord.streamId, () => {
            if (selectedClipId === clipId) {
              loadClipIntoNotation(clipId);
            }
          });
          eventStoreSubscriptionIds.push(subId);
        }
      } else {
        notationCard.setInputNotes([]);
        notationCard.setChordSymbols([]);
      }
      
      notifySelectionChange(clipId);
    },
    
    getSelectedClipId(): ClipId | null {
      return selectedClipId;
    },
    
    getSelectedClip(): ClipRecord | null {
      if (!selectedClipId) return null;
      return getClipRegistry().getClip(selectedClipId) ?? null;
    },
    
    setViewRange(startBar: number, endBar: number): void {
      viewRange = { start: startBar, end: endBar };
      // Could update notation card's visible range here
    },
    
    getViewRange(): { start: number; end: number } | null {
      return viewRange;
    },
    
    setTrackFilter(trackId: string | null): void {
      trackFilter = trackId;
      // Could filter displayed notes by track here
      bridge.refresh();
    },
    
    applyNotationEdit(edit: NotationEdit): boolean {
      if (!selectedClipId) return false;
      
      const registry = getClipRegistry();
      const clip = registry.getClip(selectedClipId);
      if (!clip) return false;
      
      const eventStore = getSharedEventStore();
      const stream = eventStore.getStream(clip.streamId);
      if (!stream) return false;

      const noteId = edit.noteId as unknown as import('../types/event-id').EventId;

      // Find the original event
      const originalEvent = stream.events.find(e => e.id === noteId);
      if (!originalEvent && edit.type !== 'add-note') {
        return false;
      }
      
      try {
        switch (edit.type) {
          case 'add-note': {
            // Create a new event - using any cast for store compatibility
            const newEvent = {
              id: noteId,
              kind: 'note' as import('../types/event-kind').EventKind,
              start: edit.changes.startTick ?? 0,
              duration: edit.changes.durationTick ?? bridgeConfig.ticksPerQuarter,
              payload: {
                pitch: edit.changes.pitch ?? 60,
                velocity: edit.changes.velocity ?? 100,
              },
            };
            eventStore.addEvents(clip.streamId, [newEvent] as unknown as Event<unknown>[]);
            break;
          }
          
          case 'delete-note': {
            eventStore.removeEvents(clip.streamId, [noteId]);
            break;
          }
          
          default: {
            // Update existing event
            const updates = noteEditToEventUpdate(edit, originalEvent);
            if (updates) {
              eventStore.updateEvent(clip.streamId, noteId, updates);
            }
            break;
          }
        }
        
        notifyEdits([edit]);
        return true;
      } catch (e) {
        console.error('Failed to apply notation edit:', e);
        return false;
      }
    },
    
    applyNotationEdits(edits: NotationEdit[]): boolean {
      if (!selectedClipId || edits.length === 0) return false;
      
      let allSucceeded = true;
      for (const edit of edits) {
        if (!bridge.applyNotationEdit(edit)) {
          allSucceeded = false;
        }
      }
      
      return allSucceeded;
    },
    
    refresh(): void {
      if (selectedClipId) {
        loadClipIntoNotation(selectedClipId);
      }
    },
    
    onClipSelectionChange(callback: ClipSelectionCallback): SubscriptionId {
      const id = generateSubId();
      selectionCallbacks.set(id, callback);
      return id;
    },
    
    onNotationEdit(callback: NotationEditCallback): SubscriptionId {
      const id = generateSubId();
      editCallbacks.set(id, callback);
      return id;
    },
    
    unsubscribe(subscriptionId: SubscriptionId): boolean {
      return selectionCallbacks.delete(subscriptionId) || editCallbacks.delete(subscriptionId);
    },
    
    getState(): ScoreNotationSessionBridgeState {
      return {
        selectedClipId,
        viewRange,
        trackFilter,
        active,
      };
    },
    
    getConfig(): ScoreNotationSessionBridgeConfig {
      return { ...bridgeConfig };
    },
    
    updateConfig(changes: Partial<ScoreNotationSessionBridgeConfig>): void {
      bridgeConfig = {
        ...bridgeConfig,
        ...changes,
      };
      bridge.refresh();
    },
  };
  
  return bridge;
}

// ============================================================================
// SINGLETON BRIDGE
// ============================================================================

let _globalBridge: ScoreNotationSessionBridge | null = null;
let _globalNotationCard: ScoreNotationCard | null = null;

/**
 * Gets or creates the global ScoreNotationSessionBridge.
 * Creates a shared ScoreNotationCard if one doesn't exist.
 */
export function getScoreNotationSessionBridge(): ScoreNotationSessionBridge {
  if (!_globalBridge) {
    if (!_globalNotationCard) {
      _globalNotationCard = new ScoreNotationCard('global-score-notation');
    }
    _globalBridge = createScoreNotationSessionBridge(_globalNotationCard);
    _globalBridge.start();
  }
  return _globalBridge;
}

/**
 * Gets the global ScoreNotationCard.
 */
export function getGlobalScoreNotationCard(): ScoreNotationCard {
  // Ensure bridge is created (which creates the card)
  getScoreNotationSessionBridge();
  return _globalNotationCard!;
}

/**
 * Resets the global bridge (for testing).
 */
export function resetScoreNotationSessionBridge(): void {
  if (_globalBridge) {
    _globalBridge.dispose();
    _globalBridge = null;
  }
  _globalNotationCard = null;
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export type {
  ScoreNoteInput,
  ChordSymbolInput,
  ArrangerSectionInput,
} from '../cards/score-notation';
