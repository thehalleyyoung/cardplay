/**
 * @fileoverview Enhanced Drag/Drop Payload Types (E063-E070)
 * 
 * Extends the base drag-drop system with board-specific payloads:
 * - card-template: For dragging cards from browsers to decks
 * - phrase: For dragging musical phrases into editors
 * - clip: For dragging clips between session and timeline
 * - events: For dragging event selections
 * - sample: For dragging audio samples into samplers
 * - host-action: For arrangeable cross-card parameter/method actions
 * 
 * @module @cardplay/ui/drag-drop-payloads
 */

import type { Event } from '../types/event';
import type { ClipId } from '../state/types';

// ============================================================================
// PAYLOAD TYPES
// ============================================================================

/**
 * Card template payload - for instantiating cards
 * E064: Card template drag from instrument browser
 */
export interface CardTemplatePayload {
  type: 'card-template';
  cardType: string;
  cardCategory: string;
  defaultParams?: Record<string, unknown>;
  presetId?: string;
}

/**
 * Phrase payload - for musical phrases
 * E065: Phrase drag from library to pattern editor
 */
export interface PhrasePayload {
  type: 'phrase';
  phraseId: string;
  phraseName: string;
  notes: Event<unknown>[];
  duration: number; // in ticks
  tags?: string[];
  key?: string;
  chordContext?: string;
  /** Phrase metadata including source chord and category (G045) */
  metadata?: {
    category?: string;
    sourceChord?: import('../cards/score-notation').ChordSymbolInput;
    durationTicks?: number;
    [key: string]: unknown;
  };
}

/**
 * Clip payload - for clip drag/drop
 * E066: Clip drag from session to timeline
 */
export interface ClipPayload {
  type: 'clip';
  clipId: ClipId;
  streamId: string;
  clipName?: string;
  clipColor?: string;
  duration: number;
  loop: boolean;
}

/**
 * Events payload - for event selection drag
 * E065: Event drag between views (tracker -> piano roll)
 */
export interface EventsPayload {
  type: 'events';
  events: Event<unknown>[];
  sourceStreamId: string;
  timeRange: { start: number; end: number };
  selectionMode: 'copy' | 'move';
}

/**
 * Sample payload - for audio sample drag
 * E068: Sample drag from browser to sampler
 */
export interface SamplePayload {
  type: 'sample';
  sampleId: string;
  sampleName: string;
  sampleUrl: string;
  duration?: number; // in seconds
  waveformData?: number[];
  tags?: string[];
}

/**
 * Host action payload - for cross-card control
 * E064: Arrangeable cross-card param/method actions
 */
export interface HostActionPayload {
  type: 'host-action';
  actionType: 'set-parameter' | 'invoke-method' | 'patch-state';
  targetCardId?: string; // If null, applies to all compatible cards
  actionData: {
    // For set-parameter
    parameter?: string;
    value?: unknown;
    
    // For invoke-method
    method?: string;
    args?: unknown[];
    
    // For patch-state
    patch?: Record<string, unknown>;
  };
  scheduling?: {
    time?: number; // When to apply (in ticks)
    quantize?: 'bar' | 'beat' | 'none';
  };
}

/**
 * Union of all payload types
 */
export type DragPayload =
  | CardTemplatePayload
  | PhrasePayload
  | ClipPayload
  | EventsPayload
  | SamplePayload
  | HostActionPayload;

// ============================================================================
// DROP HANDLERS
// ============================================================================

/**
 * Drop handler result
 */
export interface DropHandlerResult {
  accepted: boolean;
  reason?: string;
  undoable?: boolean;
}

/**
 * Drop handler function type
 */
export type DropHandler<T extends DragPayload = DragPayload> = (
  payload: T,
  targetContext: DropTargetContext
) => Promise<DropHandlerResult> | DropHandlerResult;

/**
 * Drop target context
 */
export interface DropTargetContext {
  targetType: string;
  targetId: string;
  position: { x: number; y: number };
  
  // Context-specific data
  streamId?: string;
  clipId?: string;
  trackIndex?: number;
  time?: number; // For timeline drops
  note?: number; // For piano roll drops
  boardId?: string; // For adaptation settings (G045)
  
  // Harmony context for phrase adaptation (G045)
  harmonyContext?: {
    currentKey?: string;
    currentChord: import('../cards/score-notation').ChordSymbolInput;
  };
}

// ============================================================================
// PAYLOAD HELPERS
// ============================================================================

/**
 * Create a card template payload
 */
export function createCardTemplatePayload(
  cardType: string,
  cardCategory: string,
  options?: { defaultParams?: Record<string, unknown>; presetId?: string }
): CardTemplatePayload {
  const payload: CardTemplatePayload = {
    type: 'card-template',
    cardType,
    cardCategory,
  };
  if (options?.defaultParams !== undefined) {
    payload.defaultParams = options.defaultParams;
  }
  if (options?.presetId !== undefined) {
    payload.presetId = options.presetId;
  }
  return payload;
}

/**
 * Create a phrase payload
 */
export function createPhrasePayload(
  phraseId: string,
  phraseName: string,
  notes: Event<unknown>[],
  duration: number,
  options?: { tags?: string[]; key?: string; chordContext?: string }
): PhrasePayload {
  const payload: PhrasePayload = {
    type: 'phrase',
    phraseId,
    phraseName,
    notes,
    duration,
  };
  if (options?.tags !== undefined) {
    payload.tags = options.tags;
  }
  if (options?.key !== undefined) {
    payload.key = options.key;
  }
  if (options?.chordContext !== undefined) {
    payload.chordContext = options.chordContext;
  }
  return payload;
}

/**
 * Create a clip payload
 */
export function createClipPayload(
  clipId: ClipId,
  streamId: string,
  duration: number,
  loop: boolean,
  options?: { clipName?: string; clipColor?: string }
): ClipPayload {
  const payload: ClipPayload = {
    type: 'clip',
    clipId,
    streamId,
    duration,
    loop,
  };
  if (options?.clipName !== undefined) {
    payload.clipName = options.clipName;
  }
  if (options?.clipColor !== undefined) {
    payload.clipColor = options.clipColor;
  }
  return payload;
}

/**
 * Create an events payload
 */
export function createEventsPayload(
  events: Event<unknown>[],
  sourceStreamId: string,
  timeRange: { start: number; end: number },
  selectionMode: 'copy' | 'move'
): EventsPayload {
  return {
    type: 'events',
    events,
    sourceStreamId,
    timeRange,
    selectionMode,
  };
}

/**
 * Create a sample payload
 */
export function createSamplePayload(
  sampleId: string,
  sampleName: string,
  sampleUrl: string,
  options?: { duration?: number; waveformData?: number[]; tags?: string[] }
): SamplePayload {
  const payload: SamplePayload = {
    type: 'sample',
    sampleId,
    sampleName,
    sampleUrl,
  };
  if (options?.duration !== undefined) {
    payload.duration = options.duration;
  }
  if (options?.waveformData !== undefined) {
    payload.waveformData = options.waveformData;
  }
  if (options?.tags !== undefined) {
    payload.tags = options.tags;
  }
  return payload;
}

/**
 * Create a host action payload
 */
export function createHostActionPayload(
  actionType: 'set-parameter' | 'invoke-method' | 'patch-state',
  actionData: HostActionPayload['actionData'],
  options?: { targetCardId?: string; scheduling?: HostActionPayload['scheduling'] }
): HostActionPayload {
  const payload: HostActionPayload = {
    type: 'host-action',
    actionType,
    actionData,
  };
  if (options?.targetCardId !== undefined) {
    payload.targetCardId = options.targetCardId;
  }
  if (options?.scheduling !== undefined) {
    payload.scheduling = options.scheduling;
  }
  return payload;
}

// ============================================================================
// PAYLOAD VALIDATION
// ============================================================================

/**
 * Validate a payload against a type
 */
export function validatePayload(payload: unknown): payload is DragPayload {
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  
  const p = payload as Record<string, unknown>;
  
  const validTypes = [
    'card-template',
    'phrase',
    'clip',
    'events',
    'sample',
    'host-action',
  ];
  
  return typeof p.type === 'string' && validTypes.includes(p.type);
}

/**
 * Check if a payload is of a specific type
 */
export function isPayloadType<T extends DragPayload['type']>(
  payload: DragPayload,
  type: T
): payload is Extract<DragPayload, { type: T }> {
  return payload.type === type;
}

// ============================================================================
// EXPORTS
// ============================================================================
