/**
 * @fileoverview Recording Manager - Handles capturing card outputs for viewing in editors.
 * 
 * This module ensures that cards work correctly in both:
 * - Real-time playback mode (audio/MIDI output directly)
 * - Recording mode (capturing events for tracker/notation/piano roll editors)
 * 
 * @module @cardplay/cards/recording-manager
 */

import type { Event } from '../types/event';
import type { CardContext, Transport } from './card';
import type { Stream } from '../streams';
import type { Tick } from '../types/primitives';
import { generateEventId } from '../types/event-id';
import { asTickDuration } from '../types/primitives';

// ============================================================================
// RECORDING MODE TYPES
// ============================================================================

/**
 * Recording mode determines how card outputs are handled.
 */
export type RecordingMode = 
  | 'playback'   // Real-time audio/MIDI output only
  | 'recording'  // Capture events for viewing in editors
  | 'both';      // Both real-time and capture (overdubbing)

/**
 * Recorded event with timing information.
 */
export interface RecordedEvent<P = unknown> extends Event<P> {
  /** When this event was recorded (absolute tick) */
  readonly recordedAt: Tick;
  /** Source card ID that generated this event */
  readonly sourceCardId: string;
}

/**
 * Recording buffer accumulates events during recording.
 */
export interface RecordingBuffer<P = unknown> {
  /** Buffer ID */
  readonly id: string;
  /** Start time of recording */
  readonly startTick: Tick;
  /** Accumulated events */
  readonly events: readonly RecordedEvent<P>[];
  /** Whether buffer is actively recording */
  readonly active: boolean;
  /** Recording mode */
  readonly mode: RecordingMode;
}

/**
 * Recording state for a session.
 */
export interface RecordingState {
  /** Active recording buffers */
  readonly buffers: readonly RecordingBuffer[];
  /** Global recording mode (from transport) */
  readonly recording: boolean;
  /** Current tick position */
  readonly currentTick: Tick;
}

// ============================================================================
// RECORDING BUFFER MANAGEMENT
// ============================================================================

/**
 * Creates a new recording buffer.
 */
export function createRecordingBuffer<P = unknown>(
  id: string,
  startTick: Tick,
  mode: RecordingMode = 'recording'
): RecordingBuffer<P> {
  return Object.freeze({
    id,
    startTick,
    events: [],
    active: true,
    mode,
  });
}

/**
 * Adds an event to a recording buffer.
 */
export function addEventToBuffer<P>(
  buffer: RecordingBuffer<P>,
  event: Event<P>,
  currentTick: Tick,
  sourceCardId: string
): RecordingBuffer<P> {
  if (!buffer.active) {
    return buffer;
  }

  const recordedEvent: RecordedEvent<P> = {
    ...event,
    recordedAt: currentTick,
    sourceCardId,
  };

  return Object.freeze({
    ...buffer,
    events: [...buffer.events, recordedEvent],
  });
}

/**
 * Stops recording in a buffer.
 */
export function stopRecording<P>(buffer: RecordingBuffer<P>): RecordingBuffer<P> {
  return Object.freeze({
    ...buffer,
    active: false,
  });
}

/**
 * Converts recording buffer to an event stream.
 */
export function bufferToStream<P>(buffer: RecordingBuffer<P>): Stream<RecordedEvent<P>> {
  // Sort events by start time (should already be sorted, but ensure it)
  const sorted = [...buffer.events].sort((a, b) => a.start - b.start);
  return { events: sorted };
}

// ============================================================================
// RECORDING STATE MANAGEMENT
// ============================================================================

/**
 * Creates initial recording state.
 */
export function createRecordingState(currentTick: Tick = 0 as Tick): RecordingState {
  return Object.freeze({
    buffers: [],
    recording: false,
    currentTick,
  });
}

/**
 * Starts a new recording buffer.
 */
export function startRecordingBuffer(
  state: RecordingState,
  bufferId: string,
  mode: RecordingMode = 'recording'
): RecordingState {
  const buffer = createRecordingBuffer(bufferId, state.currentTick, mode);
  return Object.freeze({
    ...state,
    buffers: [...state.buffers, buffer],
  });
}

/**
 * Stops a recording buffer.
 */
export function stopRecordingBuffer(
  state: RecordingState,
  bufferId: string
): RecordingState {
  const buffers = state.buffers.map(buffer =>
    buffer.id === bufferId ? stopRecording(buffer) : buffer
  );
  return Object.freeze({
    ...state,
    buffers,
  });
}

/**
 * Adds event to a specific buffer.
 */
export function recordEvent<P>(
  state: RecordingState,
  bufferId: string,
  event: Event<P>,
  sourceCardId: string
): RecordingState {
  const buffers = state.buffers.map(buffer =>
    buffer.id === bufferId
      ? addEventToBuffer(buffer, event, state.currentTick, sourceCardId)
      : buffer
  );
  return Object.freeze({
    ...state,
    buffers: buffers as readonly RecordingBuffer[],
  });
}

/**
 * Updates recording state from transport.
 */
export function updateRecordingState(
  state: RecordingState,
  transport: Transport,
  currentTick: Tick
): RecordingState {
  return Object.freeze({
    ...state,
    recording: transport.recording,
    currentTick,
  });
}

/**
 * Gets a specific buffer by ID.
 */
export function getBuffer<P = unknown>(
  state: RecordingState,
  bufferId: string
): RecordingBuffer<P> | undefined {
  return state.buffers.find(b => b.id === bufferId) as RecordingBuffer<P> | undefined;
}

/**
 * Removes a buffer (e.g., after export).
 */
export function removeBuffer(
  state: RecordingState,
  bufferId: string
): RecordingState {
  const buffers = state.buffers.filter(b => b.id !== bufferId);
  return Object.freeze({
    ...state,
    buffers,
  });
}

// ============================================================================
// RECORDING MODE DETECTION
// ============================================================================

/**
 * Determines if a card should capture events based on context.
 */
export function shouldCaptureEvents(context: CardContext): boolean {
  return context.transport.recording;
}

/**
 * Determines if a card should output real-time audio/MIDI.
 */
export function shouldOutputRealtime(context: CardContext, mode: RecordingMode = 'both'): boolean {
  if (mode === 'recording') {
    // In pure recording mode, skip real-time output for efficiency
    return !context.transport.recording;
  }
  // In playback or both modes, always output real-time
  return true;
}

/**
 * Gets the effective recording mode based on transport state.
 */
export function getEffectiveMode(
  context: CardContext,
  cardMode: RecordingMode = 'both'
): RecordingMode {
  if (!context.transport.recording) {
    return 'playback';
  }
  return cardMode;
}

// ============================================================================
// CARD OUTPUT ROUTING HELPERS
// ============================================================================

/**
 * Routes card output appropriately based on recording mode.
 * 
 * When recording:
 * - Events go to recording buffer
 * - Audio/MIDI may be suppressed (depending on mode)
 * 
 * When playing back:
 * - Events and audio/MIDI go to outputs normally
 */
export interface RoutedOutput<T> {
  /** Output for real-time (audio/MIDI) */
  readonly realtime?: T;
  /** Output for recording (events) */
  readonly recorded?: T;
  /** Whether events were captured */
  readonly eventsCaptured: boolean;
}

/**
 * Routes output based on context and mode.
 */
export function routeOutput<T>(
  output: T,
  context: CardContext,
  mode: RecordingMode = 'both'
): RoutedOutput<T> {
  const effectiveMode = getEffectiveMode(context, mode);

  if (effectiveMode === 'playback') {
    return {
      realtime: output,
      eventsCaptured: false,
    };
  }

  if (effectiveMode === 'recording') {
    return {
      recorded: output,
      eventsCaptured: true,
    };
  }

  // Mode === 'both'
  return {
    realtime: output,
    recorded: output,
    eventsCaptured: true,
  };
}

// ============================================================================
// MIDI CONTROL RECORDING
// ============================================================================

/**
 * MIDI CC (Control Change) event data.
 */
export interface MIDICCEvent {
  /** CC number (0-127) */
  readonly ccNumber: number;
  /** CC value (0-127) */
  readonly value: number;
  /** MIDI channel (0-15) */
  readonly channel: number;
}

/**
 * Aftertouch event data (channel pressure).
 */
export interface AftertouchEvent {
  /** Pressure value (0-127) */
  readonly pressure: number;
  /** MIDI channel (0-15) */
  readonly channel: number;
}

/**
 * Pitch bend event data.
 */
export interface PitchBendEvent {
  /** Pitch bend value (-8192 to 8191, 0 = center) */
  readonly value: number;
  /** MIDI channel (0-15) */
  readonly channel: number;
}

/**
 * Mod wheel event data (CC#1).
 */
export interface ModWheelEvent {
  /** Mod wheel value (0-127) */
  readonly value: number;
  /** MIDI channel (0-15) */
  readonly channel: number;
}

/**
 * Expression event data (CC#11).
 */
export interface ExpressionEvent {
  /** Expression value (0-127) */
  readonly value: number;
  /** MIDI channel (0-15) */
  readonly channel: number;
}

/**
 * Records a MIDI CC event to a buffer.
 */
export function recordMIDICC(
  state: RecordingState,
  bufferId: string,
  ccEvent: MIDICCEvent,
  sourceCardId: string
): RecordingState {
  const event: Event<MIDICCEvent> = {
    id: generateEventId(),
    kind: 'midi-cc' as any, // Will be registered as EventKind
    start: state.currentTick,
    duration: asTickDuration(0),
    payload: ccEvent,
  };
  return recordEvent(state, bufferId, event, sourceCardId);
}

/**
 * Records an aftertouch event to a buffer.
 */
export function recordAftertouch(
  state: RecordingState,
  bufferId: string,
  aftertouch: AftertouchEvent,
  sourceCardId: string
): RecordingState {
  const event: Event<AftertouchEvent> = {
    id: generateEventId(),
    kind: 'aftertouch' as any,
    start: state.currentTick,
    duration: asTickDuration(0),
    payload: aftertouch,
  };
  return recordEvent(state, bufferId, event, sourceCardId);
}

/**
 * Records a pitch bend event to a buffer.
 */
export function recordPitchBend(
  state: RecordingState,
  bufferId: string,
  pitchBend: PitchBendEvent,
  sourceCardId: string
): RecordingState {
  const event: Event<PitchBendEvent> = {
    id: generateEventId(),
    kind: 'pitch-bend' as any,
    start: state.currentTick,
    duration: asTickDuration(0),
    payload: pitchBend,
  };
  return recordEvent(state, bufferId, event, sourceCardId);
}

/**
 * Records a mod wheel event to a buffer.
 */
export function recordModWheel(
  state: RecordingState,
  bufferId: string,
  modWheel: ModWheelEvent,
  sourceCardId: string
): RecordingState {
  const event: Event<ModWheelEvent> = {
    id: generateEventId(),
    kind: 'mod-wheel' as any,
    start: state.currentTick,
    duration: asTickDuration(0),
    payload: modWheel,
  };
  return recordEvent(state, bufferId, event, sourceCardId);
}

/**
 * Records an expression event to a buffer.
 */
export function recordExpression(
  state: RecordingState,
  bufferId: string,
  expression: ExpressionEvent,
  sourceCardId: string
): RecordingState {
  const event: Event<ExpressionEvent> = {
    id: generateEventId(),
    kind: 'expression' as any,
    start: state.currentTick,
    duration: asTickDuration(0),
    payload: expression,
  };
  return recordEvent(state, bufferId, event, sourceCardId);
}

// ============================================================================
// RETROSPECTIVE RECORDING
// ============================================================================

/**
 * Retrospective recording buffer that stores recent events in a ring buffer.
 */
export interface RetrospectiveBuffer<P = unknown> {
  /** Buffer ID */
  readonly id: string;
  /** Maximum number of events to keep */
  readonly maxEvents: number;
  /** Ring buffer of recent events */
  readonly events: readonly RecordedEvent<P>[];
  /** Whether retrospective recording is enabled */
  readonly enabled: boolean;
}

/**
 * Creates a new retrospective buffer.
 */
export function createRetrospectiveBuffer<P = unknown>(
  id: string,
  maxEvents: number = 1000
): RetrospectiveBuffer<P> {
  return Object.freeze({
    id,
    maxEvents,
    events: [],
    enabled: true,
  });
}

/**
 * Adds event to retrospective buffer (ring buffer, oldest events removed).
 */
export function addToRetrospectiveBuffer<P>(
  buffer: RetrospectiveBuffer<P>,
  event: Event<P>,
  currentTick: Tick,
  sourceCardId: string
): RetrospectiveBuffer<P> {
  if (!buffer.enabled) {
    return buffer;
  }

  const recordedEvent: RecordedEvent<P> = {
    ...event,
    recordedAt: currentTick,
    sourceCardId,
  };

  // Add event and keep only last maxEvents
  const newEvents = [...buffer.events, recordedEvent];
  const trimmedEvents = newEvents.slice(-buffer.maxEvents);

  return Object.freeze({
    ...buffer,
    events: trimmedEvents,
  });
}

/**
 * Captures events from retrospective buffer to a recording buffer.
 * Used when user decides to keep recently played content.
 */
export function captureRetrospective<P>(
  retrospective: RetrospectiveBuffer<P>,
  fromTick: Tick,
  toTick: Tick
): readonly RecordedEvent<P>[] {
  return retrospective.events.filter(
    event => event.recordedAt >= fromTick && event.recordedAt <= toTick
  );
}

/**
 * Clears retrospective buffer.
 */
export function clearRetrospectiveBuffer<P>(
  buffer: RetrospectiveBuffer<P>
): RetrospectiveBuffer<P> {
  return Object.freeze({
    ...buffer,
    events: [],
  });
}

/**
 * Documentation helper: Validates that a card properly supports recording.
 */
export interface RecordingSupport {
  /** Whether card outputs events when recording */
  readonly outputsEvents: boolean;
  /** Whether card outputs audio in real-time */
  readonly outputsAudio: boolean;
  /** Supported recording modes */
  readonly supportedModes: readonly RecordingMode[];
  /** Description of recording behavior */
  readonly description: string;
}

/**
 * Checks if a card signature supports recording properly.
 * A card supports recording if it has at least one event-based output (notes, stream, etc.)
 */
export function checkRecordingSupport(signature: {
  readonly outputs: readonly { readonly name: string; readonly type: string }[];
}): RecordingSupport {
  const hasEventOutputs = signature.outputs.some(
    port => port.type === 'notes' || port.type === 'stream' || port.type === 'pattern'
  );
  const hasAudioOutputs = signature.outputs.some(
    port => port.type === 'audio' || port.type === 'midi'
  );

  if (!hasEventOutputs && !hasAudioOutputs) {
    return {
      outputsEvents: false,
      outputsAudio: false,
      supportedModes: ['playback'],
      description: 'Card has no compatible outputs for recording or playback',
    };
  }

  if (!hasEventOutputs) {
    return {
      outputsEvents: false,
      outputsAudio: true,
      supportedModes: ['playback'],
      description: 'Card outputs audio/MIDI only (real-time playback only, not recordable)',
    };
  }

  return {
    outputsEvents: true,
    outputsAudio: hasAudioOutputs,
    supportedModes: ['playback', 'recording', 'both'],
    description: 'Card supports both real-time playback and event recording for editor viewing',
  };
}
