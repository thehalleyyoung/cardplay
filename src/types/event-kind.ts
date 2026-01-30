/**
 * @fileoverview EventKind type with runtime registry for extensibility.
 * 
 * @module @cardplay/core/types/event-kind
 * @see cardplay2.md Section 1.1 - EventKind
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Event kind identifier.
 * 
 * Open string union with runtime registry for extensibility.
 * Built-in kinds include: note, automation, trigger, marker, tempo, signature.
 */
export type EventKind = string;

/**
 * Metadata about an event kind.
 */
export interface EventKindEntry {
  /** Kind identifier */
  readonly kind: EventKind;
  /** Human-readable name */
  readonly name: string;
  /** Description */
  readonly description?: string;
  /** Category for grouping */
  readonly category?: string;
  /** Icon identifier */
  readonly icon?: string;
  /** Default color */
  readonly color?: string;
}

// ============================================================================
// REGISTRY
// ============================================================================

const kindRegistry = new Map<string, EventKindEntry>();

/**
 * Built-in event kinds.
 */
export const EventKinds = {
  /** Musical note event */
  NOTE: 'note' as EventKind,
  /** Automation point event */
  AUTOMATION: 'automation' as EventKind,
  /** Trigger/action event */
  TRIGGER: 'trigger' as EventKind,
  /** Marker/label event */
  MARKER: 'marker' as EventKind,
  /** Tempo change event */
  TEMPO: 'tempo' as EventKind,
  /** Time signature change event */
  SIGNATURE: 'signature' as EventKind,
  /** Control change event */
  CONTROL: 'control' as EventKind,
  /** Program change event */
  PROGRAM: 'program' as EventKind,
  /** Pitch bend event */
  PITCH_BEND: 'pitchBend' as EventKind,
  /** Audio region event */
  AUDIO: 'audio' as EventKind,
  /** MIDI clip event */
  MIDI_CLIP: 'midiClip' as EventKind,
  /** Pattern reference event */
  PATTERN_REF: 'patternRef' as EventKind,
} as const;

// Register built-in kinds
const builtInKinds: EventKindEntry[] = [
  { kind: EventKinds.NOTE, name: 'Note', category: 'music', color: '#4CAF50' },
  { kind: EventKinds.AUTOMATION, name: 'Automation', category: 'control', color: '#2196F3' },
  { kind: EventKinds.TRIGGER, name: 'Trigger', category: 'action', color: '#FF9800' },
  { kind: EventKinds.MARKER, name: 'Marker', category: 'structure', color: '#9C27B0' },
  { kind: EventKinds.TEMPO, name: 'Tempo', category: 'timing', color: '#F44336' },
  { kind: EventKinds.SIGNATURE, name: 'Time Signature', category: 'timing', color: '#E91E63' },
  { kind: EventKinds.CONTROL, name: 'Control Change', category: 'control', color: '#00BCD4' },
  { kind: EventKinds.PROGRAM, name: 'Program Change', category: 'control', color: '#009688' },
  { kind: EventKinds.PITCH_BEND, name: 'Pitch Bend', category: 'control', color: '#CDDC39' },
  { kind: EventKinds.AUDIO, name: 'Audio', category: 'media', color: '#795548' },
  { kind: EventKinds.MIDI_CLIP, name: 'MIDI Clip', category: 'media', color: '#607D8B' },
  { kind: EventKinds.PATTERN_REF, name: 'Pattern Reference', category: 'structure', color: '#FF5722' },
];

for (const entry of builtInKinds) {
  kindRegistry.set(entry.kind, entry);
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Creates an EventKind from a string.
 */
export function asEventKind(value: string): EventKind {
  if (!value || typeof value !== 'string') {
    throw new TypeError('EventKind must be a non-empty string');
  }
  return value as EventKind;
}

/**
 * Registers a custom event kind.
 * Custom event kinds must use namespaced IDs (e.g., 'my-pack:custom-event').
 */
export function registerEventKind(entry: EventKindEntry): void {
  // Check if this is a builtin event kind
  const isBuiltin = Object.values(EventKinds).includes(entry.kind);
  
  // If not builtin, enforce namespacing
  if (!isBuiltin && !entry.kind.includes(':')) {
    throw new Error(
      `Custom event kind '${entry.kind}' must use a namespaced ID (e.g., 'my-pack:${entry.kind}')`
    );
  }
  
  kindRegistry.set(entry.kind, entry);
}

/**
 * Gets metadata for an event kind.
 */
export function getEventKindEntry(kind: EventKind): EventKindEntry | undefined {
  return kindRegistry.get(kind);
}

/**
 * Lists all registered event kinds.
 */
export function listEventKinds(): readonly EventKindEntry[] {
  return Array.from(kindRegistry.values());
}

/**
 * Checks if an event kind is registered.
 */
export function isRegisteredKind(kind: EventKind): boolean {
  return kindRegistry.has(kind);
}
