/**
 * @fileoverview Wavetable Modulation System - Surge-Inspired Modulation
 * 
 * Implements comprehensive modulation for wavetable synthesis:
 * - Multiple LFOs (voice and global) with tempo sync
 * - MSEG (Multi-Stage Envelope Generator)
 * - Modulation matrix with flexible routing
 * - Macro controls with multiple targets
 * - Step sequencer for rhythmic modulation
 * - Random/S&H modulation sources
 * 
 * @module @cardplay/core/audio/wavetable-modulation
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum number of LFOs */
export const MAX_LFOS = 8;

/** Maximum number of MSEGs */
export const MAX_MSEGS = 2;

/** Maximum MSEG nodes */
export const MAX_MSEG_NODES = 32;

/** Maximum modulation slots */
export const MAX_MOD_SLOTS = 32;

/** Maximum macro controls */
export const MAX_MACROS = 8;

/** Maximum targets per macro */
export const MAX_MACRO_TARGETS = 16;

/** Step sequencer max steps */
export const MAX_SEQ_STEPS = 32;

// ============================================================================
// LFO TYPES
// ============================================================================

/** LFO waveform shapes */
export type LfoWaveform =
  | 'sine'
  | 'triangle'
  | 'sawtooth'
  | 'ramp'
  | 'square'
  | 'pulse'
  | 'sample_hold'
  | 'noise'
  | 'envelope'
  | 'stepseq';

/** LFO trigger mode */
export type LfoTriggerMode = 'free' | 'voice' | 'global' | 'random';

/** Tempo sync division */
export type TempoSyncDivision =
  | '4/1' | '2/1' | '1/1' | '1/2' | '1/4' | '1/8' | '1/16' | '1/32'
  | '1/2d' | '1/4d' | '1/8d' | '1/16d'
  | '1/2t' | '1/4t' | '1/8t' | '1/16t';

/** LFO configuration */
export interface LfoConfig {
  enabled: boolean;
  waveform: LfoWaveform;
  rate: number;           // Hz (when not synced)
  tempoSync: boolean;
  syncDivision: TempoSyncDivision;
  phase: number;          // 0-1 starting phase
  delay: number;          // seconds
  fadeIn: number;         // seconds
  bipolar: boolean;       // true = -1 to 1, false = 0 to 1
  triggerMode: LfoTriggerMode;
  oneshot: boolean;       // stop after one cycle
  smooth: number;         // 0-1 slew rate
}

/** LFO state */
export interface LfoState {
  phase: number;
  value: number;
  delayRemaining: number;
  fadeProgress: number;
  triggered: boolean;
  smoothValue: number;
  lastRandom: number;
  stepIndex: number;
}

// ============================================================================
// MSEG TYPES
// ============================================================================

/** MSEG node curve type */
export type MsegCurveType = 'linear' | 'smooth' | 'stairs' | 'wave' | 'steps';

/** MSEG loop mode */
export type MsegLoopMode = 'off' | 'loop' | 'sustain' | 'loop_release';

/** MSEG node */
export interface MsegNode {
  time: number;       // Relative time (0-1 total duration)
  value: number;      // -1 to 1
  curve: number;      // Curve tension (-1 to 1)
  curveType: MsegCurveType;
}

/** MSEG configuration */
export interface MsegConfig {
  enabled: boolean;
  nodes: MsegNode[];
  totalTime: number;  // Total duration in seconds
  loopMode: MsegLoopMode;
  loopStart: number;  // Node index for loop start
  loopEnd: number;    // Node index for loop end
  tempoSync: boolean;
  syncDivision: TempoSyncDivision;
  bipolar: boolean;
  oneshot: boolean;
}

/** MSEG state */
export interface MsegState {
  position: number;       // Current position (0-totalTime)
  currentNodeIndex: number;
  value: number;
  triggered: boolean;
  looping: boolean;
  finished: boolean;
}

// ============================================================================
// STEP SEQUENCER TYPES
// ============================================================================

/** Step sequencer step */
export interface StepSeqStep {
  value: number;      // -1 to 1
  gate: boolean;      // Is this step active
  glide: boolean;     // Glide to next step
  probability: number; // 0-1 probability of triggering
}

/** Step sequencer configuration */
export interface StepSeqConfig {
  enabled: boolean;
  steps: StepSeqStep[];
  stepCount: number;  // Active steps
  tempoSync: boolean;
  rate: number;       // Hz or division
  syncDivision: TempoSyncDivision;
  direction: 'forward' | 'backward' | 'pingpong' | 'random';
  smooth: number;     // 0-1 glide amount
}

/** Step sequencer state */
export interface StepSeqState {
  currentStep: number;
  value: number;
  targetValue: number;
  pingpongDirection: 1 | -1;
}

// ============================================================================
// MODULATION MATRIX TYPES
// ============================================================================

/** Modulation source */
export type ModulationSource =
  // Envelopes
  | 'env_amp'
  | 'env_filter'
  | 'env_pitch'
  | 'env_aux1'
  | 'env_aux2'
  // LFOs
  | 'lfo1' | 'lfo2' | 'lfo3' | 'lfo4'
  | 'lfo5' | 'lfo6' | 'lfo7' | 'lfo8'
  // MSEGs
  | 'mseg1' | 'mseg2'
  // Step sequencers
  | 'seq1' | 'seq2'
  // MIDI
  | 'velocity'
  | 'keytrack'
  | 'aftertouch'
  | 'modwheel'
  | 'pitchbend'
  | 'expression'
  | 'breath'
  // MPE
  | 'mpe_slide'
  | 'mpe_press'
  | 'mpe_glide'
  // Random
  | 'random_uni'     // 0-1
  | 'random_bi'      // -1 to 1
  | 'random_trigger' // New random on note
  // Macros
  | 'macro1' | 'macro2' | 'macro3' | 'macro4'
  | 'macro5' | 'macro6' | 'macro7' | 'macro8'
  // Special
  | 'constant'
  | 'time'           // Time since note on
  | 'voice_index';   // Voice number

/** Modulation destination */
export type ModulationDestination =
  // Oscillator 1
  | 'osc1_pitch'
  | 'osc1_wavepos'
  | 'osc1_level'
  | 'osc1_pan'
  | 'osc1_unison_detune'
  | 'osc1_unison_spread'
  // Oscillator 2
  | 'osc2_pitch'
  | 'osc2_wavepos'
  | 'osc2_level'
  | 'osc2_pan'
  | 'osc2_unison_detune'
  | 'osc2_unison_spread'
  // Oscillator 3
  | 'osc3_pitch'
  | 'osc3_wavepos'
  | 'osc3_level'
  | 'osc3_pan'
  // Sub oscillator
  | 'sub_level'
  // Noise
  | 'noise_level'
  // Filter 1
  | 'filter1_cutoff'
  | 'filter1_resonance'
  | 'filter1_drive'
  | 'filter1_morph'
  // Filter 2
  | 'filter2_cutoff'
  | 'filter2_resonance'
  | 'filter2_drive'
  | 'filter2_morph'
  // Filter routing
  | 'filter_balance'
  // Amplifier
  | 'amp_level'
  | 'amp_pan'
  | 'amp_width'
  // LFO rates
  | 'lfo1_rate' | 'lfo2_rate' | 'lfo3_rate' | 'lfo4_rate'
  // Effects
  | 'fx_param1' | 'fx_param2' | 'fx_param3' | 'fx_param4';

/** Modulation slot */
export interface ModulationSlot {
  id: string;
  enabled: boolean;
  source: ModulationSource;
  destination: ModulationDestination;
  amount: number;       // -1 to 1
  curve: number;        // Curve shape
  bipolar: boolean;
  sourcePolarity: 'unipolar' | 'bipolar';
}

/** Macro target */
export interface MacroTarget {
  destination: ModulationDestination;
  amount: number;
  curve: number;
}

/** Macro configuration */
export interface MacroConfig {
  id: number;
  name: string;
  value: number;        // Current value 0-1
  defaultValue: number;
  targets: MacroTarget[];
  bipolar: boolean;
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

export const DEFAULT_LFO_CONFIG: LfoConfig = {
  enabled: true,
  waveform: 'sine',
  rate: 1,
  tempoSync: false,
  syncDivision: '1/4',
  phase: 0,
  delay: 0,
  fadeIn: 0,
  bipolar: true,
  triggerMode: 'free',
  oneshot: false,
  smooth: 0,
};

export const DEFAULT_MSEG_CONFIG: MsegConfig = {
  enabled: false,
  nodes: [
    { time: 0, value: 0, curve: 0, curveType: 'linear' },
    { time: 0.5, value: 1, curve: 0, curveType: 'linear' },
    { time: 1, value: 0, curve: 0, curveType: 'linear' },
  ],
  totalTime: 1,
  loopMode: 'off',
  loopStart: 0,
  loopEnd: 2,
  tempoSync: false,
  syncDivision: '1/4',
  bipolar: true,
  oneshot: false,
};

export const DEFAULT_STEP_SEQ_CONFIG: StepSeqConfig = {
  enabled: false,
  steps: Array.from({ length: 16 }, () => ({
    value: 0,
    gate: true,
    glide: false,
    probability: 1,
  })),
  stepCount: 16,
  tempoSync: true,
  rate: 1,
  syncDivision: '1/16',
  direction: 'forward',
  smooth: 0,
};

export const DEFAULT_MACRO_CONFIG: MacroConfig = {
  id: 0,
  name: 'Macro',
  value: 0,
  defaultValue: 0,
  targets: [],
  bipolar: false,
};

// ============================================================================
// LFO PROCESSOR
// ============================================================================

/**
 * Tempo sync division to rate multiplier
 */
function syncDivisionToMultiplier(division: TempoSyncDivision): number {
  const map: Record<TempoSyncDivision, number> = {
    '4/1': 0.25,
    '2/1': 0.5,
    '1/1': 1,
    '1/2': 2,
    '1/4': 4,
    '1/8': 8,
    '1/16': 16,
    '1/32': 32,
    '1/2d': 4/3,
    '1/4d': 8/3,
    '1/8d': 16/3,
    '1/16d': 32/3,
    '1/2t': 3,
    '1/4t': 6,
    '1/8t': 12,
    '1/16t': 24,
  };
  return map[division] ?? 4;
}

/**
 * Process LFO waveform
 */
function processLfoWaveform(phase: number, waveform: LfoWaveform, state: LfoState): number {
  const p = phase - Math.floor(phase); // Normalize to 0-1
  
  switch (waveform) {
    case 'sine':
      return Math.sin(p * Math.PI * 2);
      
    case 'triangle':
      return p < 0.5 ? 4 * p - 1 : 3 - 4 * p;
      
    case 'sawtooth':
      return 2 * p - 1;
      
    case 'ramp':
      return 1 - 2 * p;
      
    case 'square':
      return p < 0.5 ? 1 : -1;
      
    case 'pulse':
      return p < 0.25 ? 1 : -1;
      
    case 'sample_hold':
      // Update random value at phase wrap
      if (p < state.phase) {
        state.lastRandom = Math.random() * 2 - 1;
      }
      return state.lastRandom;
      
    case 'noise':
      return Math.random() * 2 - 1;
      
    case 'envelope':
      // Simple attack-decay envelope shape
      if (p < 0.25) {
        return p * 4;
      } else {
        return 1 - (p - 0.25) * (4/3);
      }
      
    case 'stepseq':
      // Step sequencer mode - handled separately
      return 0;
      
    default:
      return 0;
  }
}

/**
 * LFO processor class
 */
export class LfoProcessor {
  private config: LfoConfig;
  private state: LfoState;
  private sampleRate: number;
  
  constructor(sampleRate: number, config?: Partial<LfoConfig>) {
    this.sampleRate = sampleRate;
    this.config = { ...DEFAULT_LFO_CONFIG, ...config };
    this.state = this.createState();
  }
  
  private createState(): LfoState {
    return {
      phase: this.config.phase,
      value: 0,
      delayRemaining: this.config.delay,
      fadeProgress: 0,
      triggered: false,
      smoothValue: 0,
      lastRandom: Math.random() * 2 - 1,
      stepIndex: 0,
    };
  }
  
  setConfig(config: Partial<LfoConfig>): void {
    Object.assign(this.config, config);
  }
  
  trigger(): void {
    if (this.config.triggerMode === 'voice' || this.config.triggerMode === 'random') {
      this.state.phase = this.config.triggerMode === 'random' 
        ? Math.random() 
        : this.config.phase;
      this.state.delayRemaining = this.config.delay;
      this.state.fadeProgress = 0;
      this.state.triggered = true;
    }
  }
  
  reset(): void {
    this.state = this.createState();
  }
  
  process(tempo: number): number {
    if (!this.config.enabled) return 0;
    
    // Handle delay
    if (this.state.delayRemaining > 0) {
      this.state.delayRemaining -= 1 / this.sampleRate;
      return 0;
    }
    
    // Calculate rate
    let rate = this.config.rate;
    if (this.config.tempoSync) {
      rate = (tempo / 60) * syncDivisionToMultiplier(this.config.syncDivision);
    }
    
    // Advance phase
    const phaseInc = rate / this.sampleRate;
    this.state.phase += phaseInc;
    
    // Handle oneshot
    if (this.config.oneshot && this.state.phase >= 1) {
      this.state.phase = 1;
      return this.config.bipolar ? 0 : 0;
    }
    
    // Wrap phase
    if (this.state.phase >= 1) {
      this.state.phase -= Math.floor(this.state.phase);
    }
    
    // Get waveform value
    let value = processLfoWaveform(this.state.phase, this.config.waveform, this.state);
    
    // Apply fade-in
    if (this.config.fadeIn > 0 && this.state.fadeProgress < 1) {
      this.state.fadeProgress += 1 / (this.config.fadeIn * this.sampleRate);
      this.state.fadeProgress = Math.min(1, this.state.fadeProgress);
      value *= this.state.fadeProgress;
    }
    
    // Apply smoothing
    if (this.config.smooth > 0) {
      const smoothCoeff = Math.exp(-1 / (this.config.smooth * this.sampleRate * 0.01));
      this.state.smoothValue = smoothCoeff * this.state.smoothValue + (1 - smoothCoeff) * value;
      value = this.state.smoothValue;
    }
    
    // Convert to unipolar if needed
    if (!this.config.bipolar) {
      value = (value + 1) * 0.5;
    }
    
    this.state.value = value;
    return value;
  }
  
  getValue(): number {
    return this.state.value;
  }
  
  getPhase(): number {
    return this.state.phase;
  }
  
  getConfig(): LfoConfig {
    return { ...this.config };
  }
}

// ============================================================================
// MSEG PROCESSOR
// ============================================================================

/**
 * Apply curve to linear interpolation
 */
function applyCurve(t: number, curve: number, curveType: MsegCurveType): number {
  switch (curveType) {
    case 'linear':
      if (curve === 0) return t;
      if (curve > 0) {
        return 1 - Math.pow(1 - t, 1 + curve * 2);
      } else {
        return Math.pow(t, 1 - curve * 2);
      }
      
    case 'smooth':
      return t * t * (3 - 2 * t);
      
    case 'stairs':
      const steps = Math.max(2, Math.round(4 + curve * 12));
      return Math.floor(t * steps) / (steps - 1);
      
    case 'wave':
      return t + Math.sin(t * Math.PI * 2 * (1 + curve * 3)) * 0.1;
      
    case 'steps':
      return Math.round(t * 2) / 2;
      
    default:
      return t;
  }
}

/**
 * MSEG processor class
 */
export class MsegProcessor {
  private config: MsegConfig;
  private state: MsegState;
  private sampleRate: number;
  
  constructor(sampleRate: number, config?: Partial<MsegConfig>) {
    this.sampleRate = sampleRate;
    this.config = { ...DEFAULT_MSEG_CONFIG, ...config };
    this.state = this.createState();
  }
  
  private createState(): MsegState {
    return {
      position: 0,
      currentNodeIndex: 0,
      value: 0,
      triggered: false,
      looping: false,
      finished: false,
    };
  }
  
  setConfig(config: Partial<MsegConfig>): void {
    Object.assign(this.config, config);
  }
  
  setNodes(nodes: MsegNode[]): void {
    this.config.nodes = nodes;
  }
  
  trigger(): void {
    this.state.position = 0;
    this.state.currentNodeIndex = 0;
    this.state.triggered = true;
    this.state.finished = false;
    this.state.looping = false;
  }
  
  release(): void {
    if (this.config.loopMode === 'sustain') {
      this.state.looping = false;
    }
  }
  
  reset(): void {
    this.state = this.createState();
  }
  
  process(tempo: number): number {
    if (!this.config.enabled || this.state.finished) {
      return this.config.bipolar ? 0 : 0.5;
    }
    
    const nodes = this.config.nodes;
    if (nodes.length < 2) {
      return this.config.bipolar ? 0 : 0.5;
    }
    
    // Calculate time increment
    let timeInc: number;
    if (this.config.tempoSync) {
      const bps = tempo / 60;
      const mult = syncDivisionToMultiplier(this.config.syncDivision);
      timeInc = (bps * mult) / (this.sampleRate * this.config.totalTime);
    } else {
      timeInc = 1 / (this.sampleRate * this.config.totalTime);
    }
    
    this.state.position += timeInc;
    
    // Handle looping
    if (this.state.position >= 1) {
      switch (this.config.loopMode) {
        case 'off':
          this.state.position = 1;
          this.state.finished = this.config.oneshot;
          break;
          
        case 'loop':
          const loopEndNode = this.config.nodes[this.config.loopEnd];
          const loopStartNode = this.config.nodes[this.config.loopStart];
          if (loopEndNode && loopStartNode) {
            const loopLength = loopEndNode.time - loopStartNode.time;
            this.state.position = loopStartNode.time +
                                 ((this.state.position - loopStartNode.time) % loopLength);
          }
          this.state.looping = true;
          break;
          
        case 'sustain':
          if (!this.state.looping) {
            const sustainNode = this.config.nodes[this.config.loopEnd];
            this.state.position = sustainNode?.time ?? 1;
            this.state.looping = true;
          } else {
            this.state.position = 1;
            this.state.finished = true;
          }
          break;
          
        case 'loop_release':
          if (this.state.triggered) {
            // Loop while triggered
            const lrEndNode = this.config.nodes[this.config.loopEnd];
            const lrStartNode = this.config.nodes[this.config.loopStart];
            if (lrEndNode && lrStartNode) {
              const lr = lrEndNode.time - lrStartNode.time;
              this.state.position = lrStartNode.time +
                                   ((this.state.position - lrStartNode.time) % lr);
            }
          } else {
            // Continue to end after release
            if (this.state.position >= 1) {
              this.state.finished = true;
            }
          }
          break;
      }
    }
    
    // Find current segment
    let nodeIndex = 0;
    for (let i = 0; i < nodes.length - 1; i++) {
      const currNode = nodes[i];
      const nextNode = nodes[i + 1];
      if (currNode && nextNode && this.state.position >= currNode.time && this.state.position < nextNode.time) {
        nodeIndex = i;
        break;
      }
    }
    this.state.currentNodeIndex = nodeIndex;
    
    // Interpolate between nodes
    const n1 = nodes[nodeIndex];
    const n2 = nodes[Math.min(nodeIndex + 1, nodes.length - 1)];
    
    if (!n1 || !n2) {
      return this.config.bipolar ? 0 : 0.5;
    }
    
    const segmentLength = n2.time - n1.time;
    const segmentPos = segmentLength > 0 
      ? (this.state.position - n1.time) / segmentLength 
      : 0;
    
    const curvedPos = applyCurve(segmentPos, n1.curve, n1.curveType);
    this.state.value = n1.value + (n2.value - n1.value) * curvedPos;
    
    // Convert to unipolar if needed
    if (!this.config.bipolar) {
      return (this.state.value + 1) * 0.5;
    }
    
    return this.state.value;
  }
  
  getValue(): number {
    return this.state.value;
  }
  
  isActive(): boolean {
    return !this.state.finished;
  }
  
  getConfig(): MsegConfig {
    return { ...this.config };
  }
}

// ============================================================================
// STEP SEQUENCER PROCESSOR
// ============================================================================

/**
 * Step sequencer processor
 */
export class StepSeqProcessor {
  private config: StepSeqConfig;
  private state: StepSeqState;
  private sampleRate: number;
  private phaseClock = 0;
  
  constructor(sampleRate: number, config?: Partial<StepSeqConfig>) {
    this.sampleRate = sampleRate;
    this.config = { ...DEFAULT_STEP_SEQ_CONFIG, ...config };
    this.state = this.createState();
  }
  
  private createState(): StepSeqState {
    return {
      currentStep: 0,
      value: 0,
      targetValue: 0,
      pingpongDirection: 1,
    };
  }
  
  setConfig(config: Partial<StepSeqConfig>): void {
    Object.assign(this.config, config);
  }
  
  setSteps(steps: StepSeqStep[]): void {
    this.config.steps = steps;
  }
  
  reset(): void {
    this.state = this.createState();
    this.phaseClock = 0;
  }
  
  process(tempo: number): number {
    if (!this.config.enabled) return 0;
    
    // Calculate step rate
    let rate = this.config.rate;
    if (this.config.tempoSync) {
      rate = (tempo / 60) * syncDivisionToMultiplier(this.config.syncDivision);
    }
    
    // Advance clock
    this.phaseClock += rate / this.sampleRate;
    
    // Check for step advance
    if (this.phaseClock >= 1) {
      this.phaseClock -= 1;
      this.advanceStep();
    }
    
    // Get current step value
    const step = this.config.steps[this.state.currentStep];
    if (step && step.gate && Math.random() < step.probability) {
      this.state.targetValue = step.value;
    }
    
    // Apply smoothing
    if (this.config.smooth > 0) {
      const smoothCoeff = Math.exp(-1 / (this.config.smooth * this.sampleRate * 0.01));
      this.state.value = smoothCoeff * this.state.value + (1 - smoothCoeff) * this.state.targetValue;
    } else {
      this.state.value = this.state.targetValue;
    }
    
    return this.state.value;
  }
  
  private advanceStep(): void {
    const count = Math.min(this.config.stepCount, this.config.steps.length);
    
    switch (this.config.direction) {
      case 'forward':
        this.state.currentStep = (this.state.currentStep + 1) % count;
        break;
        
      case 'backward':
        this.state.currentStep = (this.state.currentStep - 1 + count) % count;
        break;
        
      case 'pingpong':
        this.state.currentStep += this.state.pingpongDirection;
        if (this.state.currentStep >= count - 1) {
          this.state.pingpongDirection = -1;
        } else if (this.state.currentStep <= 0) {
          this.state.pingpongDirection = 1;
        }
        break;
        
      case 'random':
        this.state.currentStep = Math.floor(Math.random() * count);
        break;
    }
  }
  
  getValue(): number {
    return this.state.value;
  }
  
  getCurrentStep(): number {
    return this.state.currentStep;
  }
  
  getConfig(): StepSeqConfig {
    return { ...this.config };
  }
}

// ============================================================================
// MODULATION MATRIX
// ============================================================================

/**
 * Modulation matrix for routing sources to destinations
 */
export class ModulationMatrix {
  private slots: ModulationSlot[] = [];
  private macros: MacroConfig[] = [];
  
  constructor() {
    // Initialize 8 macros
    for (let i = 0; i < MAX_MACROS; i++) {
      this.macros.push({
        ...DEFAULT_MACRO_CONFIG,
        id: i,
        name: `Macro ${i + 1}`,
      });
    }
  }
  
  /**
   * Add modulation slot
   */
  addSlot(slot: Omit<ModulationSlot, 'id'>): string {
    if (this.slots.length >= MAX_MOD_SLOTS) {
      throw new Error(`Maximum modulation slots (${MAX_MOD_SLOTS}) reached`);
    }
    
    const id = `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.slots.push({ ...slot, id });
    return id;
  }
  
  /**
   * Remove modulation slot
   */
  removeSlot(id: string): boolean {
    const index = this.slots.findIndex(s => s.id === id);
    if (index === -1) return false;
    this.slots.splice(index, 1);
    return true;
  }
  
  /**
   * Update modulation slot
   */
  updateSlot(id: string, updates: Partial<ModulationSlot>): boolean {
    const slot = this.slots.find(s => s.id === id);
    if (!slot) return false;
    Object.assign(slot, updates);
    return true;
  }
  
  /**
   * Get all slots for a destination
   */
  getSlotsForDestination(dest: ModulationDestination): ModulationSlot[] {
    return this.slots.filter(s => s.destination === dest && s.enabled);
  }
  
  /**
   * Set macro value
   */
  setMacroValue(macroIndex: number, value: number): void {
    const macro = this.macros[macroIndex];
    if (macroIndex >= 0 && macroIndex < this.macros.length && macro) {
      macro.value = Math.max(0, Math.min(1, value));
    }
  }
  
  /**
   * Get macro value
   */
  getMacroValue(macroIndex: number): number {
    return this.macros[macroIndex]?.value ?? 0;
  }
  
  /**
   * Configure macro
   */
  configureMacro(macroIndex: number, config: Partial<MacroConfig>): void {
    const macro = this.macros[macroIndex];
    if (macroIndex >= 0 && macroIndex < this.macros.length && macro) {
      Object.assign(macro, config);
    }
  }
  
  /**
   * Add macro target
   */
  addMacroTarget(macroIndex: number, target: MacroTarget): void {
    if (macroIndex >= 0 && macroIndex < this.macros.length) {
      const macro = this.macros[macroIndex];
      if (macro && macro.targets.length < MAX_MACRO_TARGETS) {
        macro.targets.push(target);
      }
    }
  }
  
  /**
   * Calculate total modulation for a destination
   */
  calculateModulation(
    dest: ModulationDestination,
    sources: Map<ModulationSource, number>
  ): number {
    let total = 0;
    
    // Add modulation from slots
    for (const slot of this.slots) {
      if (!slot.enabled || slot.destination !== dest) continue;
      
      let sourceValue = sources.get(slot.source) ?? 0;
      
      // Apply curve
      if (slot.curve !== 0) {
        const sign = Math.sign(sourceValue);
        const abs = Math.abs(sourceValue);
        if (slot.curve > 0) {
          sourceValue = sign * (1 - Math.pow(1 - abs, 1 + slot.curve * 2));
        } else {
          sourceValue = sign * Math.pow(abs, 1 - slot.curve * 2);
        }
      }
      
      total += sourceValue * slot.amount;
    }
    
    // Add modulation from macros
    for (const macro of this.macros) {
      for (const target of macro.targets) {
        if (target.destination !== dest) continue;
        
        let value = macro.value;
        if (macro.bipolar) {
          value = value * 2 - 1;
        }
        
        total += value * target.amount;
      }
    }
    
    return total;
  }
  
  /**
   * Get all slots
   */
  getSlots(): ModulationSlot[] {
    return [...this.slots];
  }
  
  /**
   * Get all macros
   */
  getMacros(): MacroConfig[] {
    return [...this.macros];
  }
  
  /**
   * Clear all slots
   */
  clearSlots(): void {
    this.slots = [];
  }
  
  /**
   * Import from configuration
   */
  importConfig(slots: ModulationSlot[], macros: MacroConfig[]): void {
    this.slots = slots.map(s => ({ ...s }));
    this.macros = macros.map(m => ({ ...m }));
  }
  
  /**
   * Export configuration
   */
  exportConfig(): { slots: ModulationSlot[]; macros: MacroConfig[] } {
    return {
      slots: this.slots.map(s => ({ ...s })),
      macros: this.macros.map(m => ({ ...m })),
    };
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create LFO processor
 */
export function createLfoProcessor(
  sampleRate: number,
  config?: Partial<LfoConfig>
): LfoProcessor {
  return new LfoProcessor(sampleRate, config);
}

/**
 * Create MSEG processor
 */
export function createMsegProcessor(
  sampleRate: number,
  config?: Partial<MsegConfig>
): MsegProcessor {
  return new MsegProcessor(sampleRate, config);
}

/**
 * Create step sequencer processor
 */
export function createStepSeqProcessor(
  sampleRate: number,
  config?: Partial<StepSeqConfig>
): StepSeqProcessor {
  return new StepSeqProcessor(sampleRate, config);
}

/**
 * Create modulation matrix
 */
export function createModulationMatrix(): ModulationMatrix {
  return new ModulationMatrix();
}

/**
 * Create default LFO config
 */
export function createLfoConfig(overrides?: Partial<LfoConfig>): LfoConfig {
  return { ...DEFAULT_LFO_CONFIG, ...overrides };
}

/**
 * Create default MSEG config
 */
export function createMsegConfig(overrides?: Partial<MsegConfig>): MsegConfig {
  return { ...DEFAULT_MSEG_CONFIG, ...overrides };
}

/**
 * Create MSEG node
 */
export function createMsegNode(
  time: number,
  value: number,
  curve = 0,
  curveType: MsegCurveType = 'linear'
): MsegNode {
  return { time, value, curve, curveType };
}

/**
 * Create step sequencer step
 */
export function createSeqStep(
  value: number,
  gate = true,
  glide = false,
  probability = 1
): StepSeqStep {
  return { value, gate, glide, probability };
}

/**
 * Create modulation slot
 */
export function createModSlot(
  source: ModulationSource,
  destination: ModulationDestination,
  amount: number,
  options?: Partial<ModulationSlot>
): Omit<ModulationSlot, 'id'> {
  return {
    enabled: true,
    source,
    destination,
    amount,
    curve: 0,
    bipolar: true,
    sourcePolarity: 'bipolar',
    ...options,
  };
}
