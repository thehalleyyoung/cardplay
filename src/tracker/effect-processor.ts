/**
 * @fileoverview Tracker Effect Processor
 * 
 * Processes effect commands during playback, handling both
 * classic tracker effects and CardPlay-specific commands.
 * 
 * @module @cardplay/tracker/effect-processor
 */

import { FX } from './effects';
import { 
  SpecialNote, 
  type EffectCommand, 
  type TrackerRow,
} from './types';

// ============================================================================
// EFFECT STATE
// ============================================================================

/**
 * Per-channel effect state (persistent across rows).
 */
export interface ChannelEffectState {
  // Pitch state
  currentPitch: number;           // Current pitch in cents
  targetPitch: number;            // Target pitch for portamento
  portaSpeed: number;             // Portamento speed
  vibratoPhase: number;           // Vibrato LFO phase
  vibratoSpeed: number;           // Vibrato speed
  vibratoDepth: number;           // Vibrato depth
  vibratoWaveform: number;        // Vibrato waveform (0=sine, 1=ramp, 2=square)
  arpeggioIndex: number;          // Current arpeggio index
  arpeggioNotes: number[];        // Arpeggio semitones [0, x, y]
  
  // Volume state
  currentVolume: number;          // Current volume (0-128)
  volumeSlideSpeed: number;       // Volume slide speed
  tremoloPhase: number;           // Tremolo LFO phase
  tremoloSpeed: number;           // Tremolo speed
  tremoloDepth: number;           // Tremolo depth
  tremoloWaveform: number;        // Tremolo waveform
  
  // Pan state
  currentPan: number;             // Current pan (0-255, 128=center)
  panSlideSpeed: number;          // Pan slide speed
  panbrelloPhase: number;         // Panbrello LFO phase
  panbrelloSpeed: number;         // Panbrello speed
  panbrelloDepth: number;         // Panbrello depth
  
  // Sample state
  sampleOffset: number;           // Sample start offset
  sampleReverse: boolean;         // Play sample in reverse
  retriggerInterval: number;      // Retrigger interval in ticks
  retriggerVolChange: number;     // Volume change per retrigger
  
  // Note state
  noteDelay: number;              // Note delay in ticks
  noteCut: number;                // Note cut tick (-1 = no cut)
  noteActive: boolean;            // Is note currently playing
  lastNote: number;               // Last triggered note (for tone porta)
  lastInstrument: number;         // Last used instrument
  
  // Pattern state
  patternLoopStart: number;       // Pattern loop start row
  patternLoopCount: number;       // Pattern loop remaining count
  
  // Generator/Card state
  generatorPreset: number;        // Active generator preset
  generatorSeed: number;          // Generator random seed
  cardBypass: boolean;            // Card bypass state
  cardMix: number;                // Card wet/dry mix
  
  // Phrase state
  phraseIndex: number;            // Active phrase
  phrasePosition: number;         // Current position in phrase
  phraseTranspose: number;        // Phrase transpose amount
  
  // Event state
  pendingEvents: PendingEvent[];  // Events to emit
}

/**
 * Pending event to emit.
 */
export interface PendingEvent {
  type: number;
  value: number;
  target?: string;
  delay: number;
}

/**
 * Creates initial channel effect state.
 */
export function createChannelState(): ChannelEffectState {
  return {
    currentPitch: 0,
    targetPitch: 0,
    portaSpeed: 0,
    vibratoPhase: 0,
    vibratoSpeed: 0,
    vibratoDepth: 0,
    vibratoWaveform: 0,
    arpeggioIndex: 0,
    arpeggioNotes: [0, 0, 0],
    
    currentVolume: 128,
    volumeSlideSpeed: 0,
    tremoloPhase: 0,
    tremoloSpeed: 0,
    tremoloDepth: 0,
    tremoloWaveform: 0,
    
    currentPan: 128,
    panSlideSpeed: 0,
    panbrelloPhase: 0,
    panbrelloSpeed: 0,
    panbrelloDepth: 0,
    
    sampleOffset: 0,
    sampleReverse: false,
    retriggerInterval: 0,
    retriggerVolChange: 0,
    
    noteDelay: 0,
    noteCut: -1,
    noteActive: false,
    lastNote: 60,
    lastInstrument: 0,
    
    patternLoopStart: 0,
    patternLoopCount: 0,
    
    generatorPreset: 0,
    generatorSeed: 0,
    cardBypass: false,
    cardMix: 128,
    
    phraseIndex: -1,
    phrasePosition: 0,
    phraseTranspose: 0,
    
    pendingEvents: [],
  };
}

/**
 * Global playback state.
 */
export interface GlobalEffectState {
  tempo: number;                  // BPM
  speed: number;                  // Ticks per row
  globalVolume: number;           // Global volume (0-128)
  currentRow: number;             // Current row in pattern
  currentPattern: number;         // Current pattern index
  patternDelay: number;           // Pattern delay rows remaining
  
  // Pattern jump/break
  jumpToPattern: number;          // -1 = no jump
  breakToRow: number;             // -1 = no break
}

/**
 * Creates initial global state.
 */
export function createGlobalState(): GlobalEffectState {
  return {
    tempo: 120,
    speed: 6,
    globalVolume: 128,
    currentRow: 0,
    currentPattern: 0,
    patternDelay: 0,
    jumpToPattern: -1,
    breakToRow: -1,
  };
}

// ============================================================================
// EFFECT PROCESSOR
// ============================================================================

/**
 * Process result containing playback modifications.
 */
export interface ProcessResult {
  // Note modifications
  triggerNote: boolean;
  noteOff: boolean;
  notePitch: number;              // In cents (100 = 1 semitone)
  noteVolume: number;             // 0-128
  notePan: number;                // 0-255
  noteInstrument: number;
  
  // Sample modifications
  sampleOffset: number;
  sampleReverse: boolean;
  
  // Retrigger
  retrigger: boolean;
  
  // Pattern control
  jumpToPattern: number;          // -1 = no jump
  breakToRow: number;             // -1 = no break
  patternDelay: number;           // Additional delay rows
  
  // Events to emit
  events: PendingEvent[];
  
  // Generator/card triggers
  generatorTrigger: number;       // -1 = no trigger
  generatorStop: boolean;
  cardTrigger: number;            // -1 = no trigger
  cardStop: boolean;
  
  // Phrase triggers
  phraseTrigger: number;          // -1 = no trigger
  phraseStop: boolean;
  
  // Clip/scene triggers
  clipLaunch: number;             // -1 = no launch
  clipStop: number;               // -1 = no stop
  sceneLaunch: number;            // -1 = no launch
}

/**
 * Creates empty process result.
 */
export function createProcessResult(): ProcessResult {
  return {
    triggerNote: false,
    noteOff: false,
    notePitch: 0,
    noteVolume: 128,
    notePan: 128,
    noteInstrument: 0,
    sampleOffset: 0,
    sampleReverse: false,
    retrigger: false,
    jumpToPattern: -1,
    breakToRow: -1,
    patternDelay: 0,
    events: [],
    generatorTrigger: -1,
    generatorStop: false,
    cardTrigger: -1,
    cardStop: false,
    phraseTrigger: -1,
    phraseStop: false,
    clipLaunch: -1,
    clipStop: -1,
    sceneLaunch: -1,
  };
}

/**
 * EffectProcessor handles effect command execution.
 */
export class EffectProcessor {
  private channelStates: Map<string, ChannelEffectState> = new Map();
  private globalState: GlobalEffectState = createGlobalState();
  private randomSeed: number = 12345;
  
  /**
   * Get or create channel state.
   */
  getChannelState(trackId: string): ChannelEffectState {
    let state = this.channelStates.get(trackId);
    if (!state) {
      state = createChannelState();
      this.channelStates.set(trackId, state);
    }
    return state;
  }
  
  /**
   * Get global state.
   */
  getGlobalState(): GlobalEffectState {
    return this.globalState;
  }
  
  /**
   * Process a row at the start of the row (tick 0).
   */
  processRowStart(
    trackId: string,
    row: TrackerRow,
    rowIndex: number
  ): ProcessResult {
    const result = createProcessResult();
    const state = this.getChannelState(trackId);
    this.globalState.currentRow = rowIndex;
    
    // Process note
    const note = row.note;
    if (note.note >= 0 && note.note <= 127) {
      state.lastNote = note.note;
      state.targetPitch = note.note * 100;  // Convert to cents
      
      if (state.noteDelay === 0) {
        result.triggerNote = true;
        result.notePitch = state.targetPitch;
        state.noteActive = true;
      }
      
      if (note.instrument !== undefined) {
        state.lastInstrument = note.instrument;
        result.noteInstrument = note.instrument;
      }
      
      if (note.volume !== undefined) {
        state.currentVolume = note.volume;
      }
      result.noteVolume = state.currentVolume;
      
      if (note.pan !== undefined) {
        state.currentPan = note.pan;
      }
      result.notePan = state.currentPan;
      
      if (note.delay !== undefined && note.delay > 0) {
        state.noteDelay = note.delay;
        result.triggerNote = false;  // Will trigger later
      }
    } else if (note.note === SpecialNote.NoteOff) {
      result.noteOff = true;
      state.noteActive = false;
    } else if (note.note === SpecialNote.NoteCut) {
      state.noteCut = 0;  // Immediate cut
      result.noteOff = true;
      state.noteActive = false;
    }
    
    // Reset per-row state
    state.arpeggioIndex = 0;
    state.noteDelay = note.delay ?? 0;
    state.noteCut = -1;
    
    // Process effects
    for (const effectCell of row.effects) {
      for (const effect of effectCell.effects) {
        this.processEffectRowStart(trackId, effect, result, state);
      }
    }
    
    return result;
  }
  
  /**
   * Process effects at row start.
   */
  private processEffectRowStart(
    _trackId: string,
    effect: EffectCommand,
    result: ProcessResult,
    state: ChannelEffectState
  ): void {
    const code = effect.code as number;
    const param = effect.param as number;
    const x = (param >> 4) & 0x0F;
    const y = param & 0x0F;
    
    switch (code) {
      case FX.ARPEGGIO:
        if (param !== 0) {
          state.arpeggioNotes = [0, x, y];
        }
        break;
        
      case FX.PORTA_UP:
        state.portaSpeed = param;
        break;
        
      case FX.PORTA_DOWN:
        state.portaSpeed = -param;
        break;
        
      case FX.TONE_PORTA:
        if (param > 0) {
          state.portaSpeed = param;
        }
        // Don't trigger note immediately for tone portamento
        result.triggerNote = false;
        break;
        
      case FX.VIBRATO:
        if (x > 0) state.vibratoSpeed = x;
        if (y > 0) state.vibratoDepth = y;
        break;
        
      case FX.TREMOLO:
        if (x > 0) state.tremoloSpeed = x;
        if (y > 0) state.tremoloDepth = y;
        break;
        
      case FX.SET_PAN:
        state.currentPan = param;
        result.notePan = param;
        break;
        
      case FX.SAMPLE_OFFSET:
        state.sampleOffset = param << 8;
        result.sampleOffset = state.sampleOffset;
        break;
        
      case FX.VOL_SLIDE:
        state.volumeSlideSpeed = x > 0 ? x : -y;
        break;
        
      case FX.SET_VOLUME:
        state.currentVolume = Math.min(128, param);
        result.noteVolume = state.currentVolume;
        break;
        
      case FX.PATTERN_BREAK:
        result.breakToRow = ((param >> 4) * 10) + (param & 0x0F);  // BCD
        this.globalState.breakToRow = result.breakToRow;
        break;
        
      case FX.PATTERN_JUMP:
        result.jumpToPattern = param;
        this.globalState.jumpToPattern = param;
        break;
        
      case FX.SET_TEMPO:
        if (param < 0x20) {
          this.globalState.speed = param;
        } else {
          this.globalState.tempo = param;
        }
        break;
        
      case FX.NOTE_DELAY:
        state.noteDelay = param;
        result.triggerNote = false;  // Will trigger later
        break;
        
      case FX.NOTE_CUT:
        state.noteCut = param;
        break;
        
      case FX.RETRIGGER:
        state.retriggerVolChange = x;
        state.retriggerInterval = y;
        break;
        
      case FX.NOTE_PROB:
        // Check probability
        if (this.random() > param / 100) {
          result.triggerNote = false;
        }
        break;
        
      case FX.VIBRATO_WAVE:
        state.vibratoWaveform = param & 0x03;
        break;
        
      case FX.TREMOLO_WAVE:
        state.tremoloWaveform = param & 0x03;
        break;
        
      case FX.SAMPLE_REVERSE:
        state.sampleReverse = param > 0;
        result.sampleReverse = state.sampleReverse;
        break;
        
      case FX.SAMPLE_SLICE:
        // Trigger sample slice
        result.sampleOffset = param;  // Slice index as offset marker
        break;
        
      // Generator commands
      case FX.GEN_TRIGGER:
        result.generatorTrigger = param;
        state.generatorPreset = param;
        break;
        
      case FX.GEN_STOP:
        result.generatorStop = true;
        break;
        
      case FX.GEN_SEED:
        state.generatorSeed = param;
        this.randomSeed = param;
        break;
        
      // Card commands
      case FX.CARD_TRIGGER:
        result.cardTrigger = param;
        break;
        
      case FX.CARD_STOP:
        result.cardStop = true;
        break;
        
      case FX.CARD_BYPASS:
        state.cardBypass = param > 0;
        break;
        
      case FX.CARD_MIX:
        state.cardMix = param;
        break;
        
      // Phrase commands
      case FX.PHRASE_TRIGGER:
        result.phraseTrigger = param;
        state.phraseIndex = param;
        state.phrasePosition = 0;
        break;
        
      case FX.PHRASE_STOP:
        result.phraseStop = true;
        state.phraseIndex = -1;
        break;
        
      case FX.PHRASE_TRANSPOSE:
        state.phraseTranspose = param - 0x80;  // Signed
        break;
        
      // Session commands
      case FX.CLIP_LAUNCH:
        result.clipLaunch = param;
        break;
        
      case FX.CLIP_STOP:
        result.clipStop = param;
        break;
        
      case FX.SCENE_LAUNCH:
        result.sceneLaunch = param;
        break;
        
      // Event commands
      case FX.EVENT_EMIT:
        state.pendingEvents.push({
          type: param,
          value: 0,
          delay: 0,
        });
        break;
        
      case FX.EVENT_VALUE:
        if (state.pendingEvents.length > 0) {
          const last = state.pendingEvents[state.pendingEvents.length - 1];
          if (last) {
            last.value = param;
          }
        }
        break;
        
      // Extended E commands
      case FX.EXTENDED:
        this.processExtendedCommand(x, y, result, state);
        break;
        
      // Pattern loop
      case FX.E_PATTERN_LOOP:
        if (y === 0) {
          state.patternLoopStart = this.globalState.currentRow;
        } else {
          if (state.patternLoopCount === 0) {
            state.patternLoopCount = y;
          } else {
            state.patternLoopCount--;
          }
          if (state.patternLoopCount > 0) {
            result.breakToRow = state.patternLoopStart;
          }
        }
        break;
        
      // Pattern delay
      case FX.E_PATTERN_DELAY:
        result.patternDelay = y;
        this.globalState.patternDelay = y;
        break;
    }
    
    // Copy pending events to result
    result.events = [...state.pendingEvents];
    state.pendingEvents = [];
  }
  
  /**
   * Process extended E commands.
   */
  private processExtendedCommand(
    x: number,
    y: number,
    result: ProcessResult,
    state: ChannelEffectState
  ): void {
    switch (x) {
      case 0x0:  // Filter
        // E0x - filter on/off
        break;
        
      case 0x1:  // Fine porta up
        state.currentPitch += y;
        result.notePitch = state.currentPitch;
        break;
        
      case 0x2:  // Fine porta down
        state.currentPitch -= y;
        result.notePitch = state.currentPitch;
        break;
        
      case 0x3:  // Glissando
        // E3x - glissando control
        break;
        
      case 0x4:  // Vibrato waveform
        state.vibratoWaveform = y & 0x03;
        break;
        
      case 0x5:  // Finetune
        // E5x - set finetune
        break;
        
      case 0x6:  // Pattern loop
        // Handled separately
        break;
        
      case 0x7:  // Tremolo waveform
        state.tremoloWaveform = y & 0x03;
        break;
        
      case 0x8:  // Panning
        state.currentPan = y * 17;  // Scale 0-F to 0-255
        result.notePan = state.currentPan;
        break;
        
      case 0x9:  // Retrigger
        state.retriggerInterval = y;
        state.retriggerVolChange = 0;
        break;
        
      case 0xA:  // Fine volume up
        state.currentVolume = Math.min(128, state.currentVolume + y);
        result.noteVolume = state.currentVolume;
        break;
        
      case 0xB:  // Fine volume down
        state.currentVolume = Math.max(0, state.currentVolume - y);
        result.noteVolume = state.currentVolume;
        break;
        
      case 0xC:  // Note cut
        state.noteCut = y;
        break;
        
      case 0xD:  // Note delay
        state.noteDelay = y;
        result.triggerNote = false;
        break;
        
      case 0xE:  // Pattern delay
        this.globalState.patternDelay = y;
        result.patternDelay = y;
        break;
        
      case 0xF:  // Invert loop / set macro
        // EFx
        break;
    }
  }
  
  /**
   * Process effects on each tick within a row.
   */
  processTickeffects(
    trackId: string,
    tick: number,
    _ticksPerRow: number
  ): ProcessResult {
    const result = createProcessResult();
    const state = this.getChannelState(trackId);
    
    // Note delay
    if (state.noteDelay > 0 && tick === state.noteDelay) {
      result.triggerNote = true;
      result.notePitch = state.targetPitch;
      result.noteVolume = state.currentVolume;
      result.notePan = state.currentPan;
      result.noteInstrument = state.lastInstrument;
      state.noteActive = true;
    }
    
    // Note cut
    if (state.noteCut >= 0 && tick === state.noteCut) {
      result.noteOff = true;
      state.noteActive = false;
    }
    
    // Retrigger
    if (state.retriggerInterval > 0 && tick > 0 && tick % state.retriggerInterval === 0) {
      result.retrigger = true;
      
      // Apply volume change
      switch (state.retriggerVolChange) {
        case 0: break;
        case 1: state.currentVolume -= 1; break;
        case 2: state.currentVolume -= 2; break;
        case 3: state.currentVolume -= 4; break;
        case 4: state.currentVolume -= 8; break;
        case 5: state.currentVolume -= 16; break;
        case 6: state.currentVolume = Math.floor(state.currentVolume * 2 / 3); break;
        case 7: state.currentVolume = Math.floor(state.currentVolume / 2); break;
        case 8: break;
        case 9: state.currentVolume += 1; break;
        case 10: state.currentVolume += 2; break;
        case 11: state.currentVolume += 4; break;
        case 12: state.currentVolume += 8; break;
        case 13: state.currentVolume += 16; break;
        case 14: state.currentVolume = Math.floor(state.currentVolume * 3 / 2); break;
        case 15: state.currentVolume *= 2; break;
      }
      state.currentVolume = Math.max(0, Math.min(128, state.currentVolume));
      result.noteVolume = state.currentVolume;
    }
    
    // Arpeggio
    if (state.arpeggioNotes[1] !== 0 || state.arpeggioNotes[2] !== 0) {
      state.arpeggioIndex = tick % 3;
      const arpOffset = state.arpeggioNotes[state.arpeggioIndex] ?? 0;
      result.notePitch = state.lastNote * 100 + arpOffset * 100;
    }
    
    // Portamento
    if (state.portaSpeed !== 0 && tick > 0) {
      if (state.portaSpeed > 0) {
        // Sliding up or toward target
        state.currentPitch += state.portaSpeed * 4;  // 4 cents per unit
        if (state.currentPitch > state.targetPitch) {
          state.currentPitch = state.targetPitch;
        }
      } else {
        // Sliding down
        state.currentPitch += state.portaSpeed * 4;
        if (state.currentPitch < state.targetPitch) {
          state.currentPitch = state.targetPitch;
        }
      }
      result.notePitch = state.currentPitch;
    }
    
    // Vibrato
    if (state.vibratoDepth > 0 && tick > 0) {
      state.vibratoPhase += state.vibratoSpeed;
      const vibOffset = this.getLFOValue(state.vibratoPhase, state.vibratoWaveform) * state.vibratoDepth;
      result.notePitch = state.currentPitch + vibOffset;
    }
    
    // Volume slide
    if (state.volumeSlideSpeed !== 0 && tick > 0) {
      state.currentVolume += state.volumeSlideSpeed;
      state.currentVolume = Math.max(0, Math.min(128, state.currentVolume));
      result.noteVolume = state.currentVolume;
    }
    
    // Tremolo
    if (state.tremoloDepth > 0 && tick > 0) {
      state.tremoloPhase += state.tremoloSpeed;
      const tremOffset = this.getLFOValue(state.tremoloPhase, state.tremoloWaveform) * state.tremoloDepth;
      result.noteVolume = Math.max(0, Math.min(128, state.currentVolume + tremOffset));
    }
    
    // Pan slide
    if (state.panSlideSpeed !== 0 && tick > 0) {
      state.currentPan += state.panSlideSpeed;
      state.currentPan = Math.max(0, Math.min(255, state.currentPan));
      result.notePan = state.currentPan;
    }
    
    // Panbrello
    if (state.panbrelloDepth > 0 && tick > 0) {
      state.panbrelloPhase += state.panbrelloSpeed;
      const panOffset = this.getLFOValue(state.panbrelloPhase, 0) * state.panbrelloDepth;
      result.notePan = Math.max(0, Math.min(255, state.currentPan + panOffset));
    }
    
    return result;
  }
  
  /**
   * Get LFO value for modulation effects.
   */
  private getLFOValue(phase: number, waveform: number): number {
    const normalizedPhase = (phase & 63) / 64;  // 0-1
    
    switch (waveform) {
      case 0:  // Sine
        return Math.sin(normalizedPhase * Math.PI * 2);
      case 1:  // Ramp down
        return 1 - normalizedPhase * 2;
      case 2:  // Square
        return normalizedPhase < 0.5 ? 1 : -1;
      case 3:  // Random
        return this.random() * 2 - 1;
      default:
        return 0;
    }
  }
  
  /**
   * Simple pseudo-random number generator.
   */
  private random(): number {
    this.randomSeed = (this.randomSeed * 1103515245 + 12345) & 0x7FFFFFFF;
    return this.randomSeed / 0x7FFFFFFF;
  }
  
  /**
   * Reset all state.
   */
  reset(): void {
    this.channelStates.clear();
    this.globalState = createGlobalState();
    this.randomSeed = 12345;
  }
  
  /**
   * Reset channel state.
   */
  resetChannel(trackId: string): void {
    this.channelStates.delete(trackId);
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let processorInstance: EffectProcessor | null = null;

/**
 * Get or create the effect processor singleton.
 */
export function getEffectProcessor(): EffectProcessor {
  if (!processorInstance) {
    processorInstance = new EffectProcessor();
  }
  return processorInstance;
}

/**
 * Reset the effect processor (for testing).
 */
export function resetEffectProcessor(): void {
  if (processorInstance) {
    processorInstance.reset();
  }
  processorInstance = null;
}
