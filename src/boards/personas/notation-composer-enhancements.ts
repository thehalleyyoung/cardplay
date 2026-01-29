/**
 * @fileoverview Notation Composer Persona Enhancements
 * 
 * Deep workflow enhancements for traditional notation composers including
 * score preparation, part extraction, and engraving quality checks.
 * 
 * @module @cardplay/boards/personas/notation-composer-enhancements
 */

import type { EventStreamId, EventId } from '../../state/types';
import { getSharedEventStore } from '../../state/event-store';
import { EventKinds } from '../../types/event-kind';
import type { Event } from '../../types/event';

// Define note payload locally since it's not exported from types
interface NotePayload {
  note: number;
  velocity?: number;
  channel?: number;
}

// ============================================================================
// TYPES
// ============================================================================

/**
 * Clef type for staff notation
 */
export type ClefType = 'treble' | 'bass' | 'alto' | 'tenor' | 'percussion';

/**
 * Staff configuration
 */
export interface StaffConfig {
  id: string;
  name: string;
  clef: ClefType;
  lines: number;
  transposition: number; // Semitones
  visible: boolean;
}

/**
 * Measure and beat info
 */
export interface MeasureBeatInfo {
  measure: number;
  beat: number;
  subdivision: number;
  timeSignature: { numerator: number; denominator: number };
}

/**
 * Voice info for polyphonic notation
 */
export interface VoiceInfo {
  voiceId: number;
  stemDirection: 'up' | 'down' | 'auto';
  color: string;
}

/**
 * Engraving quality issue
 */
export interface EngravingIssue {
  type: 'collision' | 'spacing' | 'voice-crossing' | 'range' | 'beam' | 'tie';
  severity: 'warning' | 'error';
  message: string;
  location: { measure: number; beat: number };
  suggestion?: string;
}

/**
 * Notation context menu item
 */
export interface NotationContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  action: () => void;
  enabled: boolean;
  submenu?: NotationContextMenuItem[];
}

/**
 * Transpose options
 */
export interface TransposeOptions {
  interval: number; // Semitones
  chromatically: boolean; // vs diatonically
  preserveDirection: boolean;
}

// ============================================================================
// STAFF MANAGEMENT
// ============================================================================

/**
 * Adds a new staff to the score
 */
export function addStaff(
  _streamId: EventStreamId,
  config: Partial<StaffConfig> = {}
): StaffConfig {
  const defaultConfig: StaffConfig = {
    id: `staff-${Date.now()}`,
    name: 'New Staff',
    clef: 'treble',
    lines: 5,
    transposition: 0,
    visible: true,
    ...config,
  };

  // In a full implementation, this would write staff configuration
  // to a metadata stream or staff configuration store
  console.log('Add staff:', defaultConfig);

  return defaultConfig;
}

/**
 * Changes clef for a staff
 */
export function changeClef(
  _streamId: EventStreamId,
  staffId: string,
  newClef: ClefType
): void {
  // This would update the staff configuration
  console.log('Change clef:', { staffId, newClef });
}

/**
 * Transposes selected notes
 */
export function transposeSelection(
  streamId: EventStreamId,
  eventIds: EventId[],
  options: TransposeOptions
): void {
  const store = getSharedEventStore();
  const stream = store.getStream(streamId);
  if (!stream) return;

  const transposedEvents: Event<NotePayload>[] = [];

  for (const eventId of eventIds) {
    const event = stream.events.find((e) => e.id === eventId);
    if (!event || event.kind !== EventKinds.NOTE) continue;

    // Transpose the pitch
    const payload = event.payload as NotePayload;
    const currentPitch = payload.note ?? 60;
    let newPitch = currentPitch;

    if (options.chromatically) {
      newPitch = currentPitch + options.interval;
    } else {
      // Diatonic transposition would require scale context
      // Simplified: use chromatic for now
      newPitch = currentPitch + options.interval;
    }

    // Clamp to valid MIDI range
    newPitch = Math.max(0, Math.min(127, newPitch));

    transposedEvents.push({
      ...event,
      payload: {
        ...payload,
        note: newPitch,
      },
    } as Event<NotePayload>);
  }

  // Update events in store
  store.removeEvents(streamId, eventIds);
  store.addEvents(streamId, transposedEvents);
}

// ============================================================================
// MEASURE/BEAT UTILITIES
// ============================================================================

/**
 * Gets measure and beat information for a tick position
 */
export function getMeasureBeatInfo(
  tick: number,
  ppq: number = 480,
  timeSignature: { numerator: number; denominator: number } = { numerator: 4, denominator: 4 }
): MeasureBeatInfo {
  const ticksPerBeat = ppq * (4 / timeSignature.denominator);
  const ticksPerMeasure = ticksPerBeat * timeSignature.numerator;

  const measure = Math.floor(tick / ticksPerMeasure) + 1;
  const tickInMeasure = tick % ticksPerMeasure;
  const beat = Math.floor(tickInMeasure / ticksPerBeat) + 1;
  const subdivision = (tickInMeasure % ticksPerBeat) / (ticksPerBeat / 4);

  return {
    measure,
    beat,
    subdivision: Math.floor(subdivision),
    timeSignature,
  };
}

// ============================================================================
// VOICE MANAGEMENT
// ============================================================================

/**
 * Assigns voice to selected notes
 */
export function assignVoice(
  streamId: EventStreamId,
  eventIds: EventId[],
  voiceId: number
): void {
  const store = getSharedEventStore();
  const stream = store.getStream(streamId);
  if (!stream) return;

  const updatedEvents: Event<unknown>[] = [];

  for (const eventId of eventIds) {
    const event = stream.events.find((e) => e.id === eventId);
    if (!event) continue;

    const payload = event.payload as Record<string, unknown>;
    updatedEvents.push({
      ...event,
      payload: {
        ...payload,
        voice: voiceId,
      },
    } as Event<unknown>);
  }

  store.removeEvents(streamId, eventIds);
  store.addEvents(streamId, updatedEvents);
}

// ============================================================================
// ENGRAVING QUALITY CHECKS
// ============================================================================

/**
 * Checks for note collisions
 */
function checkCollisions(events: Event<unknown>[], ppq: number): EngravingIssue[] {
  const issues: EngravingIssue[] = [];
  
  // Group events by time
  const eventsByTime = new Map<number, Event<unknown>[]>();
  for (const event of events) {
    if (event.kind !== EventKinds.NOTE) continue;
    const time = event.start;
    if (!eventsByTime.has(time)) {
      eventsByTime.set(time, []);
    }
    eventsByTime.get(time)!.push(event);
  }

  // Check for pitch collisions (same pitch at same time)
  for (const [time, eventsAtTime] of eventsByTime) {
    const pitches = new Map<number, number>();
    for (const event of eventsAtTime) {
      const payload = event.payload as NotePayload;
      const pitch = payload.note ?? 60;
      pitches.set(pitch, (pitches.get(pitch) ?? 0) + 1);
    }

    for (const [pitch, count] of pitches) {
      if (count > 1) {
        const info = getMeasureBeatInfo(time, ppq);
        issues.push({
          type: 'collision',
          severity: 'warning',
          message: `${count} notes at same pitch (${pitch})`,
          location: { measure: info.measure, beat: info.beat },
          suggestion: 'Consider using separate voices or adjusting timing',
        });
      }
    }
  }

  return issues;
}

/**
 * Checks for voice crossing issues
 */
function checkVoiceCrossing(events: Event<unknown>[], ppq: number): EngravingIssue[] {
  const issues: EngravingIssue[] = [];

  // Group by voice
  const voices = new Map<number, Event<unknown>[]>();
  for (const event of events) {
    if (event.kind !== EventKinds.NOTE) continue;
    const payload = event.payload as NotePayload;
    const voice = (payload as any).voice ?? 1;
    if (!voices.has(voice)) {
      voices.set(voice, []);
    }
    const voiceEvents = voices.get(voice);
    if (voiceEvents) {
      voiceEvents.push(event);
    }
  }

  // Check if lower voice goes above upper voice
  if (voices.size >= 2) {
    const voiceIds = Array.from(voices.keys()).sort();
    for (let i = 0; i < voiceIds.length - 1; i++) {
      const upperVoiceId = voiceIds[i];
      const lowerVoiceId = voiceIds[i + 1];
      if (upperVoiceId === undefined || lowerVoiceId === undefined) continue;
      const upperVoice = voices.get(upperVoiceId);
      const lowerVoice = voices.get(lowerVoiceId);
      if (!upperVoice || !lowerVoice) continue;

      for (const upperEvent of upperVoice) {
        const upperPayload = upperEvent.payload as NotePayload;
        const upperPitch = upperPayload.note ?? 60;
        const upperTime = upperEvent.start;

        for (const lowerEvent of lowerVoice) {
          const lowerPayload = lowerEvent.payload as NotePayload;
          const lowerPitch = lowerPayload.note ?? 60;
          const lowerTime = lowerEvent.start;

          // Check if they overlap in time and pitch
          if (Math.abs(upperTime - lowerTime) < ppq / 8 && lowerPitch > upperPitch) {
            const info = getMeasureBeatInfo(upperTime, ppq);
            issues.push({
              type: 'voice-crossing',
              severity: 'warning',
              message: `Voice ${voiceIds[i + 1]} crosses above voice ${voiceIds[i]}`,
              location: { measure: info.measure, beat: info.beat },
              suggestion: 'Consider revoicing or using stem direction',
            });
          }
        }
      }
    }
  }

  return issues;
}

/**
 * Checks for range issues (notes too high or too low for typical instruments)
 */
function checkRange(events: Event<unknown>[], ppq: number): EngravingIssue[] {
  const issues: EngravingIssue[] = [];

  // For now, just check general playability range
  const playableRange = { low: 21, high: 108 };

  for (const event of events) {
    if (event.kind !== EventKinds.NOTE) continue;
    const payload = event.payload as NotePayload;
    const pitch = payload.note ?? 60;

    if (pitch < playableRange.low || pitch > playableRange.high) {
      const info = getMeasureBeatInfo(event.start, ppq);
      issues.push({
        type: 'range',
        severity: 'error',
        message: `Note (${pitch}) outside playable range`,
        location: { measure: info.measure, beat: info.beat },
        suggestion: 'Transpose note into playable range',
      });
    }
  }

  return issues;
}

/**
 * Runs all engraving quality checks
 */
export function checkScore(streamId: EventStreamId, ppq: number = 480): EngravingIssue[] {
  const store = getSharedEventStore();
  const stream = store.getStream(streamId);
  if (!stream) return [];

  const eventsArray = Array.from(stream.events);
  const issues: EngravingIssue[] = [
    ...checkCollisions(eventsArray, ppq),
    ...checkVoiceCrossing(eventsArray, ppq),
    ...checkRange(eventsArray, ppq),
  ];

  // Sort by location
  issues.sort((a, b) => {
    if (a.location.measure !== b.location.measure) {
      return a.location.measure - b.location.measure;
    }
    return a.location.beat - b.location.beat;
  });

  return issues;
}

// ============================================================================
// CONTEXT MENU
// ============================================================================

/**
 * Creates notation-specific context menu items
 */
export function createNotationContextMenu(
  streamId: EventStreamId,
  selectedEventIds: EventId[]
): NotationContextMenuItem[] {
  const hasSelection = selectedEventIds.length > 0;

  return [
    {
      id: 'add-staff',
      label: 'Add Staff',
      icon: '➕',
      shortcut: 'Ctrl+Shift+N',
      enabled: true,
      action: () => addStaff(streamId),
    },
    {
      id: 'change-clef',
      label: 'Change Clef',
      icon: '🎼',
      enabled: true,
      action: () => {}, // Parent item action
      submenu: [
        {
          id: 'clef-treble',
          label: 'Treble',
          enabled: true,
          action: () => changeClef(streamId, 'default', 'treble'),
        },
        {
          id: 'clef-bass',
          label: 'Bass',
          enabled: true,
          action: () => changeClef(streamId, 'default', 'bass'),
        },
        {
          id: 'clef-alto',
          label: 'Alto',
          enabled: true,
          action: () => changeClef(streamId, 'default', 'alto'),
        },
        {
          id: 'clef-tenor',
          label: 'Tenor',
          enabled: true,
          action: () => changeClef(streamId, 'default', 'tenor'),
        },
      ],
    },
    {
      id: 'transpose',
      label: 'Transpose',
      icon: '↕️',
      shortcut: 'Ctrl+T',
      enabled: hasSelection,
      action: () => {}, // No-op parent action
      submenu: [
        {
          id: 'transpose-octave-up',
          label: 'Octave Up',
          shortcut: 'Ctrl+Shift+↑',
          enabled: hasSelection,
          action: () =>
            transposeSelection(streamId, selectedEventIds, {
              interval: 12,
              chromatically: true,
              preserveDirection: true,
            }),
        },
        {
          id: 'transpose-octave-down',
          label: 'Octave Down',
          shortcut: 'Ctrl+Shift+↓',
          enabled: hasSelection,
          action: () =>
            transposeSelection(streamId, selectedEventIds, {
              interval: -12,
              chromatically: true,
              preserveDirection: true,
            }),
        },
        {
          id: 'transpose-custom',
          label: 'Custom...',
          enabled: hasSelection,
          action: () => {
            // Would open transpose dialog
            console.log('Open transpose dialog');
          },
        },
      ],
    },
    {
      id: 'check-score',
      label: 'Check Score',
      icon: '✓',
      shortcut: 'Ctrl+Shift+C',
      enabled: true,
      action: () => {
        const issues = checkScore(streamId);
        console.log('Engraving issues:', issues);
      },
    },
  ];
}

// ============================================================================
// INSPECTOR PANEL
// ============================================================================

/**
 * Creates inspector panel content for notation
 */
export function createNotationInspector(
  streamId: EventStreamId,
  selectedEventIds: string[],
  ppq: number = 480
): {
  measureBeat: MeasureBeatInfo | null;
  voice: VoiceInfo | null;
  engravingIssues: EngravingIssue[];
} {
  const store = getSharedEventStore();
  const stream = store.getStream(streamId);

  if (!stream || selectedEventIds.length === 0) {
    return {
      measureBeat: null,
      voice: null,
      engravingIssues: [],
    };
  }

  // Get first selected event
  const firstEvent = stream.events.find((e) => e.id === selectedEventIds[0]);
  if (!firstEvent) {
    return {
      measureBeat: null,
      voice: null,
      engravingIssues: [],
    };
  }

  const measureBeat = getMeasureBeatInfo(firstEvent.start, ppq);
  const payload = firstEvent.payload as any;
  const voice: VoiceInfo = {
    voiceId: payload.voice ?? 1,
    stemDirection: 'auto',
    color: '#3B82F6',
  };

  // Check for issues at this location
  const allIssues = checkScore(streamId, ppq);
  const localIssues = allIssues.filter(
    (issue) =>
      issue.location.measure === measureBeat.measure &&
      issue.location.beat === measureBeat.beat
  );

  return {
    measureBeat,
    voice,
    engravingIssues: localIssues,
  };
}
