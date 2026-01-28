/**
 * @fileoverview MIDI Input ↔ Score Notation Bridge
 * 
 * Routes live MIDI input to the ScoreNotationCard for real-time display
 * and optional recording to clips.
 * 
 * Features:
 * - Real-time note display (ghost notes while held)
 * - Recording mode (accumulate notes, write to clip on stop)
 * - Step recording mode (advance position per note)
 * - Velocity and quantization processing
 * - MIDI channel filtering
 * 
 * @module @cardplay/audio/midi-notation-bridge
 */

import type { Tick, TickDuration } from '../types/primitives';
import type { ClipId } from '../state/types';
import { getClipRegistry, getSharedEventStore } from '../state';
import type { ScoreNoteInput } from '../cards/score-notation';
import { ScoreNotationCard } from '../cards/score-notation';
import type { 
  NoteEvent, 
  MIDIInputCallbacks,
  VelocityConfig 
} from './midi-input-handler';
import { 
  DEFAULT_VELOCITY_CONFIG,
  applyVelocityCurve 
} from './midi-input-handler';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Recording mode for the MIDI-notation bridge.
 */
export type MIDIRecordingMode = 
  | 'off'           // No recording
  | 'realtime'      // Record with timing
  | 'step'          // Step recording (advance per note)
  | 'overdub';      // Add to existing clip

/**
 * Quantization grid for recording.
 */
export type QuantizeGrid = 
  | 'off'           // No quantization
  | '1/1'           // Whole note
  | '1/2'           // Half note
  | '1/4'           // Quarter note
  | '1/8'           // Eighth note
  | '1/16'          // Sixteenth note
  | '1/32'          // 32nd note
  | '1/4T'          // Quarter triplet
  | '1/8T'          // Eighth triplet
  | '1/16T';        // Sixteenth triplet

/**
 * Configuration for the MIDI-notation bridge.
 */
export interface MIDINotationBridgeConfig {
  /** Ticks per quarter note */
  readonly ticksPerQuarter: number;
  /** Velocity configuration */
  readonly velocityConfig: VelocityConfig;
  /** Quantize grid for recording */
  readonly quantizeGrid: QuantizeGrid;
  /** MIDI channel filter (-1 = all channels) */
  readonly channelFilter: number;
  /** Whether to show preview notes while MIDI is held */
  readonly showPreview: boolean;
  /** Step size in ticks for step recording */
  readonly stepSize: number;
  /** Default note duration in ticks for step recording */
  readonly defaultStepDuration: number;
  /** Voice/channel assignment for new notes */
  readonly defaultVoice: number;
}

/**
 * Default MIDI-notation bridge configuration.
 */
export const DEFAULT_MIDI_NOTATION_CONFIG: MIDINotationBridgeConfig = {
  ticksPerQuarter: 480,
  velocityConfig: DEFAULT_VELOCITY_CONFIG,
  quantizeGrid: '1/16',
  channelFilter: -1, // All channels
  showPreview: true,
  stepSize: 120, // 1/16 note at 480 TPQ
  defaultStepDuration: 240, // 1/8 note at 480 TPQ
  defaultVoice: 0,
};

/**
 * State of the MIDI-notation bridge.
 */
export interface MIDINotationBridgeState {
  /** Current recording mode */
  readonly recordingMode: MIDIRecordingMode;
  /** Target clip for recording */
  readonly targetClipId: ClipId | null;
  /** Whether recording is armed */
  readonly armed: boolean;
  /** Whether currently recording */
  readonly isRecording: boolean;
  /** Current recording position (for step recording) */
  readonly stepPosition: Tick;
  /** Currently held notes (for preview) */
  readonly heldNotes: readonly HeldNote[];
  /** Recorded notes (pending commit) */
  readonly pendingNotes: readonly RecordedNote[];
}

/**
 * A currently held MIDI note.
 */
export interface HeldNote {
  readonly noteNumber: number;
  readonly velocity: number;
  readonly channel: number;
  readonly startTime: number; // Performance timestamp
  readonly startTick: Tick;   // Tick when note started
}

/**
 * A recorded note (before commit).
 */
export interface RecordedNote {
  readonly id: string;
  readonly noteNumber: number;
  readonly velocity: number;
  readonly startTick: Tick;
  readonly durationTick: TickDuration;
  readonly voice: number;
}

/**
 * Callbacks for MIDI-notation bridge events.
 */
export interface MIDINotationBridgeCallbacks {
  /** Called when recording starts */
  onRecordingStart?: (mode: MIDIRecordingMode, targetClipId: ClipId | null) => void;
  /** Called when recording stops */
  onRecordingStop?: (notes: readonly RecordedNote[]) => void;
  /** Called when a note is recorded */
  onNoteRecorded?: (note: RecordedNote) => void;
  /** Called when preview notes change */
  onPreviewChange?: (held: readonly HeldNote[]) => void;
  /** Called when step position changes (step recording) */
  onStepPositionChange?: (position: Tick) => void;
}

// ============================================================================
// QUANTIZATION HELPERS
// ============================================================================

/**
 * Get quantization grid size in ticks.
 */
export function getQuantizeGridTicks(
  grid: QuantizeGrid, 
  ticksPerQuarter: number
): number {
  switch (grid) {
    case 'off': return 1;
    case '1/1': return ticksPerQuarter * 4;
    case '1/2': return ticksPerQuarter * 2;
    case '1/4': return ticksPerQuarter;
    case '1/8': return ticksPerQuarter / 2;
    case '1/16': return ticksPerQuarter / 4;
    case '1/32': return ticksPerQuarter / 8;
    case '1/4T': return Math.round(ticksPerQuarter * 2 / 3);
    case '1/8T': return Math.round(ticksPerQuarter / 3);
    case '1/16T': return Math.round(ticksPerQuarter / 6);
    default: return 1;
  }
}

/**
 * Quantize a tick value to the grid.
 */
export function quantizeTick(
  tick: number, 
  grid: QuantizeGrid, 
  ticksPerQuarter: number
): number {
  if (grid === 'off') return tick;
  
  const gridSize = getQuantizeGridTicks(grid, ticksPerQuarter);
  return Math.round(tick / gridSize) * gridSize;
}

// ============================================================================
// BRIDGE INTERFACE
// ============================================================================

/**
 * Bridge connecting MIDI input to ScoreNotationCard.
 */
export interface MIDINotationBridge {
  // --- Lifecycle ---
  
  /** Start the bridge (enable MIDI processing) */
  start(): void;
  
  /** Stop the bridge (disable MIDI processing) */
  stop(): void;
  
  /** Dispose of the bridge */
  dispose(): void;
  
  // --- MIDI Input ---
  
  /** Get callbacks to register with MIDIInputHandler */
  getMIDICallbacks(): Partial<MIDIInputCallbacks>;
  
  /** Process a note on event */
  onNoteOn(event: NoteEvent): void;
  
  /** Process a note off event */
  onNoteOff(event: NoteEvent): void;
  
  // --- Recording Control ---
  
  /** Arm recording (wait for first note or transport start) */
  arm(targetClipId?: ClipId): void;
  
  /** Disarm recording */
  disarm(): void;
  
  /** Start recording immediately */
  startRecording(mode: MIDIRecordingMode, targetClipId?: ClipId): void;
  
  /** Stop recording and commit notes */
  stopRecording(): readonly RecordedNote[];
  
  /** Cancel recording and discard notes */
  cancelRecording(): void;
  
  // --- Step Recording ---
  
  /** Advance step position forward */
  advanceStep(): void;
  
  /** Move step position backward */
  backStep(): void;
  
  /** Set step position directly */
  setStepPosition(tick: Tick): void;
  
  /** Insert a rest at current position (advance without note) */
  insertRest(): void;
  
  // --- Preview ---
  
  /** Get currently held notes for preview display */
  getHeldNotes(): readonly HeldNote[];
  
  /** Clear all held notes (e.g., on panic) */
  clearHeldNotes(): void;
  
  // --- State & Config ---
  
  /** Get current state */
  getState(): MIDINotationBridgeState;
  
  /** Get configuration */
  getConfig(): MIDINotationBridgeConfig;
  
  /** Update configuration */
  updateConfig(changes: Partial<MIDINotationBridgeConfig>): void;
  
  /** Set callbacks */
  setCallbacks(callbacks: MIDINotationBridgeCallbacks): void;
}

// ============================================================================
// BRIDGE IMPLEMENTATION
// ============================================================================

/**
 * Create a MIDINotationBridge instance.
 */
export function createMIDINotationBridge(
  notationCard: ScoreNotationCard,
  config: Partial<MIDINotationBridgeConfig> = {}
): MIDINotationBridge {
  // Merge config
  let bridgeConfig: MIDINotationBridgeConfig = {
    ...DEFAULT_MIDI_NOTATION_CONFIG,
    ...config,
  };
  
  // Internal state
  let recordingMode: MIDIRecordingMode = 'off';
  let targetClipId: ClipId | null = null;
  let armed = false;
  let isRecording = false;
  let stepPosition: Tick = 0 as Tick;
  let active = false;
  
  // Note tracking
  const heldNotes: HeldNote[] = [];
  const pendingNotes: RecordedNote[] = [];
  let noteIdCounter = 0;
  
  // Callbacks
  let callbacks: MIDINotationBridgeCallbacks = {};
  
  // Preview notes shown in notation card
  let previewNotes: ScoreNoteInput[] = [];
  
  // Recording start time (for realtime mode)
  let recordingStartTime = 0;
  let recordingStartTick: Tick = 0 as Tick;
  
  /**
   * Generate a unique note ID.
   */
  function generateNoteId(): string {
    return `midi_note_${Date.now()}_${++noteIdCounter}`;
  }
  
  /**
   * Convert current tick from realtime timestamp.
   */
  function timestampToTick(timestamp: number, bpm: number = 120): Tick {
    const elapsedMs = timestamp - recordingStartTime;
    const beatsElapsed = (elapsedMs / 1000) * (bpm / 60);
    const ticksElapsed = beatsElapsed * bridgeConfig.ticksPerQuarter;
    return (recordingStartTick + Math.round(ticksElapsed)) as Tick;
  }
  
  /**
   * Update preview notes in notation card.
   */
  function updatePreview(): void {
    if (!bridgeConfig.showPreview || !active) {
      if (previewNotes.length > 0) {
        previewNotes = [];
        // Remove preview notes from notation card
        const currentNotes = notationCard.getInputNotes();
        const nonPreviewNotes = currentNotes.filter(n => !n.id.startsWith('preview_'));
        notationCard.setInputNotes([...nonPreviewNotes]);
      }
      return;
    }
    
    // Convert held notes to preview ScoreNoteInputs
    previewNotes = heldNotes.map(held => ({
      id: `preview_${held.noteNumber}_${held.channel}`,
      startTick: held.startTick,
      durationTick: bridgeConfig.defaultStepDuration as TickDuration,
      pitch: held.noteNumber,
      velocity: held.velocity,
      voice: held.channel,
      // Mark as preview (could add styling hint)
      sourceCardId: 'midi-preview',
    }));
    
    // Add preview notes to notation card
    const currentNotes = notationCard.getInputNotes();
    const nonPreviewNotes = currentNotes.filter(n => !n.id.startsWith('preview_'));
    notationCard.setInputNotes([...nonPreviewNotes, ...previewNotes]);
    
    callbacks.onPreviewChange?.(heldNotes);
  }
  
  /**
   * Record a note.
   */
  function recordNote(
    noteNumber: number,
    velocity: number,
    startTick: Tick,
    durationTick: TickDuration
  ): RecordedNote {
    // Apply quantization
    const quantizedStart = quantizeTick(
      startTick, 
      bridgeConfig.quantizeGrid, 
      bridgeConfig.ticksPerQuarter
    ) as Tick;
    
    const recorded: RecordedNote = {
      id: generateNoteId(),
      noteNumber,
      velocity,
      startTick: quantizedStart,
      durationTick,
      voice: bridgeConfig.defaultVoice,
    };
    
    pendingNotes.push(recorded);
    callbacks.onNoteRecorded?.(recorded);
    
    return recorded;
  }
  
  /**
   * Commit pending notes to the target clip.
   */
  function commitNotesToClip(): boolean {
    if (!targetClipId || pendingNotes.length === 0) {
      return false;
    }
    
    const registry = getClipRegistry();
    const clip = registry.getClip(targetClipId);
    if (!clip) return false;
    
    const eventStore = getSharedEventStore();
    
    // Convert recorded notes to events
    const events = pendingNotes.map(note => ({
      id: note.id as unknown as import('../types/event-id').EventId,
      kind: 'Note' as import('../types/event-kind').EventKind,
      start: note.startTick,
      duration: note.durationTick,
      payload: {
        pitch: note.noteNumber,
        note: note.noteNumber,
        velocity: note.velocity,
        voice: note.voice,
        channel: note.voice,
      },
    }));
    
    eventStore.addEvents(clip.streamId, events);
    return true;
  }
  
  // Create the bridge object
  const bridge: MIDINotationBridge = {
    start(): void {
      if (active) return;
      active = true;
    },
    
    stop(): void {
      if (!active) return;
      active = false;
      bridge.clearHeldNotes();
    },
    
    dispose(): void {
      bridge.stop();
      bridge.cancelRecording();
      heldNotes.length = 0;
      pendingNotes.length = 0;
    },
    
    getMIDICallbacks(): Partial<MIDIInputCallbacks> {
      return {
        onNote: (event: NoteEvent) => {
          if (event.isNoteOn) {
            bridge.onNoteOn(event);
          } else {
            bridge.onNoteOff(event);
          }
        },
      };
    },
    
    onNoteOn(event: NoteEvent): void {
      if (!active) return;
      
      // Filter by channel if configured
      if (bridgeConfig.channelFilter >= 0 && event.channel !== bridgeConfig.channelFilter) {
        return;
      }
      
      // Apply velocity curve
      const velocity = applyVelocityCurve(event.velocity, bridgeConfig.velocityConfig);
      
      // Calculate current tick
      let currentTick: Tick;
      if (recordingMode === 'step') {
        currentTick = stepPosition;
      } else if (isRecording) {
        currentTick = timestampToTick(event.timestamp);
      } else {
        currentTick = 0 as Tick; // Preview at position 0
      }
      
      // Track held note
      const heldNote: HeldNote = {
        noteNumber: event.note,
        velocity,
        channel: event.channel,
        startTime: event.timestamp,
        startTick: currentTick,
      };
      heldNotes.push(heldNote);
      
      // Auto-start recording if armed
      if (armed && !isRecording) {
        isRecording = true;
        recordingStartTime = event.timestamp;
        recordingStartTick = 0 as Tick;
        callbacks.onRecordingStart?.(recordingMode, targetClipId);
      }
      
      // For step recording, record immediately
      if (recordingMode === 'step' && isRecording) {
        recordNote(
          event.note,
          velocity,
          stepPosition,
          bridgeConfig.defaultStepDuration as TickDuration
        );
        bridge.advanceStep();
      }
      
      updatePreview();
    },
    
    onNoteOff(event: NoteEvent): void {
      if (!active) return;
      
      // Filter by channel if configured
      if (bridgeConfig.channelFilter >= 0 && event.channel !== bridgeConfig.channelFilter) {
        return;
      }
      
      // Find the held note
      const heldIndex = heldNotes.findIndex(
        h => h.noteNumber === event.note && h.channel === event.channel
      );
      
      if (heldIndex < 0) return;
      
      const heldNote = heldNotes[heldIndex]!;
      heldNotes.splice(heldIndex, 1);
      
      // For realtime recording, record the note with calculated duration
      if (recordingMode === 'realtime' && isRecording) {
        const endTick = timestampToTick(event.timestamp);
        const durationTick = Math.max(1, endTick - heldNote.startTick) as TickDuration;
        
        recordNote(
          heldNote.noteNumber,
          heldNote.velocity,
          heldNote.startTick,
          durationTick
        );
      }
      
      updatePreview();
    },
    
    arm(clipId?: ClipId): void {
      armed = true;
      if (clipId) {
        targetClipId = clipId;
      }
      recordingMode = recordingMode === 'off' ? 'realtime' : recordingMode;
    },
    
    disarm(): void {
      armed = false;
    },
    
    startRecording(mode: MIDIRecordingMode, clipId?: ClipId): void {
      recordingMode = mode;
      targetClipId = clipId ?? targetClipId;
      isRecording = true;
      armed = false;
      recordingStartTime = performance.now();
      recordingStartTick = 0 as Tick;
      stepPosition = 0 as Tick;
      pendingNotes.length = 0;
      
      callbacks.onRecordingStart?.(mode, targetClipId);
    },
    
    stopRecording(): readonly RecordedNote[] {
      if (!isRecording) return [];
      
      isRecording = false;
      armed = false;
      
      const recorded = [...pendingNotes];
      
      // Commit to clip if we have a target
      if (targetClipId) {
        commitNotesToClip();
      }
      
      callbacks.onRecordingStop?.(recorded);
      
      // Clear pending notes
      pendingNotes.length = 0;
      
      // Clear held notes (release all)
      heldNotes.length = 0;
      updatePreview();
      
      return recorded;
    },
    
    cancelRecording(): void {
      isRecording = false;
      armed = false;
      pendingNotes.length = 0;
      heldNotes.length = 0;
      updatePreview();
    },
    
    advanceStep(): void {
      stepPosition = (stepPosition + bridgeConfig.stepSize) as Tick;
      callbacks.onStepPositionChange?.(stepPosition);
    },
    
    backStep(): void {
      stepPosition = Math.max(0, stepPosition - bridgeConfig.stepSize) as Tick;
      callbacks.onStepPositionChange?.(stepPosition);
    },
    
    setStepPosition(tick: Tick): void {
      stepPosition = tick;
      callbacks.onStepPositionChange?.(stepPosition);
    },
    
    insertRest(): void {
      // Just advance without recording
      bridge.advanceStep();
    },
    
    getHeldNotes(): readonly HeldNote[] {
      return [...heldNotes];
    },
    
    clearHeldNotes(): void {
      heldNotes.length = 0;
      updatePreview();
    },
    
    getState(): MIDINotationBridgeState {
      return {
        recordingMode,
        targetClipId,
        armed,
        isRecording,
        stepPosition,
        heldNotes: [...heldNotes],
        pendingNotes: [...pendingNotes],
      };
    },
    
    getConfig(): MIDINotationBridgeConfig {
      return { ...bridgeConfig };
    },
    
    updateConfig(changes: Partial<MIDINotationBridgeConfig>): void {
      bridgeConfig = {
        ...bridgeConfig,
        ...changes,
      };
    },
    
    setCallbacks(newCallbacks: MIDINotationBridgeCallbacks): void {
      callbacks = newCallbacks;
    },
  };
  
  return bridge;
}

// ============================================================================
// SINGLETON BRIDGE
// ============================================================================

let _globalMIDIBridge: MIDINotationBridge | null = null;

/**
 * Gets or creates the global MIDINotationBridge.
 * Uses the global ScoreNotationCard.
 */
export function getMIDINotationBridge(
  notationCard?: ScoreNotationCard
): MIDINotationBridge {
  if (!_globalMIDIBridge) {
    if (!notationCard) {
      // Create a default card if none provided
      notationCard = new ScoreNotationCard('midi-notation-card');
    }
    _globalMIDIBridge = createMIDINotationBridge(notationCard);
    _globalMIDIBridge.start();
  }
  return _globalMIDIBridge;
}

/**
 * Resets the global MIDI-notation bridge (for testing).
 */
export function resetMIDINotationBridge(): void {
  if (_globalMIDIBridge) {
    _globalMIDIBridge.dispose();
    _globalMIDIBridge = null;
  }
}
