/**
 * @fileoverview Sampler Zone Routing - Output Routing and Bus System
 * 
 * Implements comprehensive zone routing including:
 * - Direct output routing
 * - Effects bus routing
 * - Submix groups
 * - Per-zone solo/mute
 * - Output metering
 * - Aux sends
 * 
 * @module @cardplay/core/audio/sampler-routing
 */

// ============================================================================
// ROUTING TYPES
// ============================================================================

/** Output destination type */
export type OutputDestination = 
  | 'master'
  | 'direct_1' | 'direct_2' | 'direct_3' | 'direct_4'
  | 'direct_5' | 'direct_6' | 'direct_7' | 'direct_8'
  | 'fx_a' | 'fx_b' | 'fx_c' | 'fx_d'
  | 'submix_1' | 'submix_2' | 'submix_3' | 'submix_4';

/** Bus type */
export type BusType = 'master' | 'direct' | 'fx' | 'submix';

/** Zone routing configuration */
export interface ZoneRouting {
  /** Primary output destination */
  output: OutputDestination;
  /** Output gain in dB */
  gain: number;
  /** Stereo pan (-1 to 1) */
  pan: number;
  /** Solo state */
  solo: boolean;
  /** Mute state */
  mute: boolean;
  /** Aux sends */
  auxSends: AuxSend[];
}

/** Aux send configuration */
export interface AuxSend {
  destination: OutputDestination;
  amount: number;  // 0-1
  preFader: boolean;
}

/** Bus configuration */
export interface BusConfig {
  id: string;
  type: BusType;
  name: string;
  gain: number;
  pan: number;
  mute: boolean;
  solo: boolean;
  /** Input sources */
  inputs: string[];
  /** Output destination */
  output: OutputDestination;
  /** Effects chain IDs */
  effectsChain: string[];
}

/** Master output configuration */
export interface MasterOutputConfig {
  gain: number;
  pan: number;
  limiterEnabled: boolean;
  limiterThreshold: number;
  meterEnabled: boolean;
}

/** Meter reading */
export interface MeterReading {
  left: number;
  right: number;
  leftPeak: number;
  rightPeak: number;
  leftClip: boolean;
  rightClip: boolean;
  rmsLeft: number;
  rmsRight: number;
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

export const DEFAULT_ZONE_ROUTING: ZoneRouting = {
  output: 'master',
  gain: 0,
  pan: 0,
  solo: false,
  mute: false,
  auxSends: [],
};

export const DEFAULT_BUS_CONFIG: BusConfig = {
  id: '',
  type: 'submix',
  name: 'Bus',
  gain: 0,
  pan: 0,
  mute: false,
  solo: false,
  inputs: [],
  output: 'master',
  effectsChain: [],
};

export const DEFAULT_MASTER_OUTPUT: MasterOutputConfig = {
  gain: 0,
  pan: 0,
  limiterEnabled: true,
  limiterThreshold: -0.3,
  meterEnabled: true,
};

// ============================================================================
// AUDIO BUS CLASS
// ============================================================================

/**
 * Audio bus for mixing
 */
export class AudioBus {
  public readonly id: string;
  public readonly type: BusType;
  
  private config: BusConfig;
  
  // Buffers
  private bufferL: Float32Array;
  private bufferR: Float32Array;
  private bufferSize: number;
  
  // Metering
  private meterState: MeterReading = {
    left: -Infinity,
    right: -Infinity,
    leftPeak: -Infinity,
    rightPeak: -Infinity,
    leftClip: false,
    rightClip: false,
    rmsLeft: -Infinity,
    rmsRight: -Infinity,
  };
  private rmsWindowSize: number;
  private rmsBufferL: Float32Array;
  private rmsBufferR: Float32Array;
  private rmsIndex = 0;
  
  constructor(
    id: string,
    type: BusType,
    sampleRate: number,
    bufferSize: number,
    config?: Partial<BusConfig>
  ) {
    this.id = id;
    this.type = type;
    this.bufferSize = bufferSize;
    
    this.config = {
      ...DEFAULT_BUS_CONFIG,
      id,
      type,
      name: id,
      ...config,
    };
    
    this.bufferL = new Float32Array(bufferSize);
    this.bufferR = new Float32Array(bufferSize);
    
    // RMS window of ~50ms
    this.rmsWindowSize = Math.ceil(sampleRate * 0.05);
    this.rmsBufferL = new Float32Array(this.rmsWindowSize);
    this.rmsBufferR = new Float32Array(this.rmsWindowSize);
  }
  
  /**
   * Clear buffers
   */
  clear(): void {
    this.bufferL.fill(0);
    this.bufferR.fill(0);
  }
  
  /**
   * Add audio to bus
   */
  addAudio(
    left: Float32Array,
    right: Float32Array,
    gain: number,
    pan: number
  ): void {
    const gainLin = Math.pow(10, gain / 20);
    const panL = Math.cos((pan + 1) * Math.PI / 4);
    const panR = Math.sin((pan + 1) * Math.PI / 4);
    
    for (let i = 0; i < Math.min(left.length, this.bufferSize); i++) {
      const leftSample = left[i];
      const rightSample = right[i];
      const bufL = this.bufferL[i];
      const bufR = this.bufferR[i];
      if (leftSample !== undefined && rightSample !== undefined && bufL !== undefined && bufR !== undefined) {
        this.bufferL[i] = bufL + leftSample * gainLin * panL;
        this.bufferR[i] = bufR + rightSample * gainLin * panR;
      }
    }
  }
  
  /**
   * Add mono audio to bus
   */
  addMonoAudio(
    input: Float32Array,
    gain: number,
    pan: number
  ): void {
    const gainLin = Math.pow(10, gain / 20);
    const panL = Math.cos((pan + 1) * Math.PI / 4);
    const panR = Math.sin((pan + 1) * Math.PI / 4);
    
    for (let i = 0; i < Math.min(input.length, this.bufferSize); i++) {
      const inputSample = input[i];
      const bufL = this.bufferL[i];
      const bufR = this.bufferR[i];
      if (inputSample !== undefined && bufL !== undefined && bufR !== undefined) {
        const sample = inputSample * gainLin;
        this.bufferL[i] = bufL + sample * panL;
        this.bufferR[i] = bufR + sample * panR;
      }
    }
  }
  
  /**
   * Get processed output
   */
  getOutput(): { left: Float32Array; right: Float32Array } {
    if (this.config.mute) {
      return {
        left: new Float32Array(this.bufferSize),
        right: new Float32Array(this.bufferSize),
      };
    }
    
    const gainLin = Math.pow(10, this.config.gain / 20);
    const panL = Math.cos((this.config.pan + 1) * Math.PI / 4);
    const panR = Math.sin((this.config.pan + 1) * Math.PI / 4);
    
    const outputL = new Float32Array(this.bufferSize);
    const outputR = new Float32Array(this.bufferSize);
    
    for (let i = 0; i < this.bufferSize; i++) {
      const bufL = this.bufferL[i];
      const bufR = this.bufferR[i];
      outputL[i] = (bufL ?? 0) * gainLin * panL;
      outputR[i] = (bufR ?? 0) * gainLin * panR;
    }
    
    // Update metering
    this.updateMetering(outputL, outputR);
    
    return { left: outputL, right: outputR };
  }
  
  /**
   * Update metering
   */
  private updateMetering(left: Float32Array, right: Float32Array): void {
    let peakL = 0;
    let peakR = 0;
    let sumL = 0;
    let sumR = 0;
    
    for (let i = 0; i < left.length; i++) {
      const leftSample = left[i] ?? 0;
      const rightSample = right[i] ?? 0;
      const absL = Math.abs(leftSample);
      const absR = Math.abs(rightSample);
      
      if (absL > peakL) peakL = absL;
      if (absR > peakR) peakR = absR;
      
      // Update RMS buffer
      this.rmsBufferL[this.rmsIndex] = leftSample * leftSample;
      this.rmsBufferR[this.rmsIndex] = rightSample * rightSample;
      this.rmsIndex = (this.rmsIndex + 1) % this.rmsWindowSize;
    }
    
    // Calculate RMS
    for (let i = 0; i < this.rmsWindowSize; i++) {
      sumL += this.rmsBufferL[i] ?? 0;
      sumR += this.rmsBufferR[i] ?? 0;
    }
    
    const rmsL = Math.sqrt(sumL / this.rmsWindowSize);
    const rmsR = Math.sqrt(sumR / this.rmsWindowSize);
    
    // Convert to dB
    this.meterState.left = peakL > 0 ? 20 * Math.log10(peakL) : -Infinity;
    this.meterState.right = peakR > 0 ? 20 * Math.log10(peakR) : -Infinity;
    this.meterState.rmsLeft = rmsL > 0 ? 20 * Math.log10(rmsL) : -Infinity;
    this.meterState.rmsRight = rmsR > 0 ? 20 * Math.log10(rmsR) : -Infinity;
    
    // Peak hold
    if (this.meterState.left > this.meterState.leftPeak) {
      this.meterState.leftPeak = this.meterState.left;
    }
    if (this.meterState.right > this.meterState.rightPeak) {
      this.meterState.rightPeak = this.meterState.right;
    }
    
    // Clip detection
    this.meterState.leftClip = peakL >= 1.0;
    this.meterState.rightClip = peakR >= 1.0;
  }
  
  /**
   * Get meter reading
   */
  getMeter(): MeterReading {
    return { ...this.meterState };
  }
  
  /**
   * Reset peak hold
   */
  resetPeakHold(): void {
    this.meterState.leftPeak = -Infinity;
    this.meterState.rightPeak = -Infinity;
    this.meterState.leftClip = false;
    this.meterState.rightClip = false;
  }
  
  /**
   * Set configuration
   */
  setConfig(config: Partial<BusConfig>): void {
    Object.assign(this.config, config);
  }
  
  /**
   * Get configuration
   */
  getConfig(): BusConfig {
    return { ...this.config };
  }
  
  /**
   * Get buffers directly (for effects processing)
   */
  getBuffers(): { left: Float32Array; right: Float32Array } {
    return { left: this.bufferL, right: this.bufferR };
  }
}

// ============================================================================
// ROUTING MANAGER CLASS
// ============================================================================

/**
 * Zone routing manager
 */
export class SamplerRoutingManager {
  // Buses
  private masterBus: AudioBus;
  private directBuses: Map<string, AudioBus> = new Map();
  private fxBuses: Map<string, AudioBus> = new Map();
  private submixBuses: Map<string, AudioBus> = new Map();
  
  // Zone routing
  private zoneRouting: Map<string, ZoneRouting> = new Map();
  
  // Solo state
  private anySolo: boolean = false;
  private soloedZones: Set<string> = new Set();
  
  constructor(sampleRate: number, bufferSize: number) {
    // Create master bus
    this.masterBus = new AudioBus('master', 'master', sampleRate, bufferSize);
    
    // Create direct outputs (8)
    for (let i = 1; i <= 8; i++) {
      const id = `direct_${i}` as OutputDestination;
      this.directBuses.set(id, new AudioBus(id, 'direct', sampleRate, bufferSize));
    }
    
    // Create FX buses (4)
    for (const letter of ['a', 'b', 'c', 'd']) {
      const id = `fx_${letter}` as OutputDestination;
      this.fxBuses.set(id, new AudioBus(id, 'fx', sampleRate, bufferSize));
    }
    
    // Create submix buses (4)
    for (let i = 1; i <= 4; i++) {
      const id = `submix_${i}` as OutputDestination;
      this.submixBuses.set(id, new AudioBus(id, 'submix', sampleRate, bufferSize));
    }
  }
  
  /**
   * Set zone routing
   */
  setZoneRouting(zoneId: string, routing: Partial<ZoneRouting>): void {
    const current = this.zoneRouting.get(zoneId) ?? { ...DEFAULT_ZONE_ROUTING };
    Object.assign(current, routing);
    this.zoneRouting.set(zoneId, current);
    
    // Update solo state
    this.updateSoloState();
  }
  
  /**
   * Get zone routing
   */
  getZoneRouting(zoneId: string): ZoneRouting {
    return this.zoneRouting.get(zoneId) ?? { ...DEFAULT_ZONE_ROUTING };
  }
  
  /**
   * Remove zone routing
   */
  removeZoneRouting(zoneId: string): void {
    this.zoneRouting.delete(zoneId);
    this.soloedZones.delete(zoneId);
    this.updateSoloState();
  }
  
  /**
   * Update solo state
   */
  private updateSoloState(): void {
    this.soloedZones.clear();
    
    for (const [zoneId, routing] of this.zoneRouting) {
      if (routing.solo) {
        this.soloedZones.add(zoneId);
      }
    }
    
    this.anySolo = this.soloedZones.size > 0;
  }
  
  /**
   * Toggle zone solo
   */
  toggleZoneSolo(zoneId: string): boolean {
    const routing = this.getZoneRouting(zoneId);
    routing.solo = !routing.solo;
    this.zoneRouting.set(zoneId, routing);
    this.updateSoloState();
    return routing.solo;
  }
  
  /**
   * Toggle zone mute
   */
  toggleZoneMute(zoneId: string): boolean {
    const routing = this.getZoneRouting(zoneId);
    routing.mute = !routing.mute;
    this.zoneRouting.set(zoneId, routing);
    return routing.mute;
  }
  
  /**
   * Set exclusive solo (solo this zone, unsolo others)
   */
  setExclusiveSolo(zoneId: string): void {
    for (const [id, routing] of this.zoneRouting) {
      routing.solo = id === zoneId;
    }
    this.updateSoloState();
  }
  
  /**
   * Clear all solos
   */
  clearAllSolos(): void {
    for (const routing of this.zoneRouting.values()) {
      routing.solo = false;
    }
    this.updateSoloState();
  }
  
  /**
   * Clear all mutes
   */
  clearAllMutes(): void {
    for (const routing of this.zoneRouting.values()) {
      routing.mute = false;
    }
  }
  
  /**
   * Check if zone should be audible
   */
  isZoneAudible(zoneId: string): boolean {
    const routing = this.getZoneRouting(zoneId);
    
    // Muted zones are never audible
    if (routing.mute) return false;
    
    // If any zone is soloed, only soloed zones are audible
    if (this.anySolo) {
      return routing.solo;
    }
    
    return true;
  }
  
  /**
   * Clear all buses
   */
  clearBuses(): void {
    this.masterBus.clear();
    
    for (const bus of this.directBuses.values()) {
      bus.clear();
    }
    
    for (const bus of this.fxBuses.values()) {
      bus.clear();
    }
    
    for (const bus of this.submixBuses.values()) {
      bus.clear();
    }
  }
  
  /**
   * Route zone audio to appropriate bus
   */
  routeZoneAudio(
    zoneId: string,
    left: Float32Array,
    right: Float32Array
  ): void {
    if (!this.isZoneAudible(zoneId)) return;
    
    const routing = this.getZoneRouting(zoneId);
    
    // Get primary output bus
    const primaryBus = this.getBus(routing.output);
    if (primaryBus) {
      primaryBus.addAudio(left, right, routing.gain, routing.pan);
    }
    
    // Handle aux sends
    for (const send of routing.auxSends) {
      const auxBus = this.getBus(send.destination);
      if (auxBus) {
        const sendGain = send.preFader 
          ? 20 * Math.log10(send.amount)
          : routing.gain + 20 * Math.log10(send.amount);
        auxBus.addAudio(left, right, sendGain, routing.pan);
      }
    }
  }
  
  /**
   * Route mono zone audio
   */
  routeZoneMonoAudio(
    zoneId: string,
    input: Float32Array
  ): void {
    if (!this.isZoneAudible(zoneId)) return;
    
    const routing = this.getZoneRouting(zoneId);
    
    const primaryBus = this.getBus(routing.output);
    if (primaryBus) {
      primaryBus.addMonoAudio(input, routing.gain, routing.pan);
    }
    
    for (const send of routing.auxSends) {
      const auxBus = this.getBus(send.destination);
      if (auxBus) {
        const sendGain = send.preFader 
          ? 20 * Math.log10(send.amount)
          : routing.gain + 20 * Math.log10(send.amount);
        auxBus.addMonoAudio(input, sendGain, routing.pan);
      }
    }
  }
  
  /**
   * Get bus by destination
   */
  private getBus(destination: OutputDestination): AudioBus | null {
    if (destination === 'master') {
      return this.masterBus;
    }
    
    if (destination.startsWith('direct_')) {
      return this.directBuses.get(destination) ?? null;
    }
    
    if (destination.startsWith('fx_')) {
      return this.fxBuses.get(destination) ?? null;
    }
    
    if (destination.startsWith('submix_')) {
      return this.submixBuses.get(destination) ?? null;
    }
    
    return null;
  }
  
  /**
   * Process submixes and sum to master
   */
  processSubmixes(): void {
    // Sum submixes to their outputs (typically master)
    for (const submix of this.submixBuses.values()) {
      const config = submix.getConfig();
      const output = this.getBus(config.output);
      
      if (output) {
        const { left, right } = submix.getOutput();
        output.addAudio(left, right, 0, 0);
      }
    }
    
    // Sum FX buses to their outputs
    for (const fxBus of this.fxBuses.values()) {
      const config = fxBus.getConfig();
      const output = this.getBus(config.output);
      
      if (output) {
        const { left, right } = fxBus.getOutput();
        output.addAudio(left, right, 0, 0);
      }
    }
  }
  
  /**
   * Get master output
   */
  getMasterOutput(): { left: Float32Array; right: Float32Array } {
    return this.masterBus.getOutput();
  }
  
  /**
   * Get direct output
   */
  getDirectOutput(index: number): { left: Float32Array; right: Float32Array } | null {
    const bus = this.directBuses.get(`direct_${index}` as OutputDestination);
    return bus ? bus.getOutput() : null;
  }
  
  /**
   * Get FX bus output
   */
  getFxBusOutput(letter: 'a' | 'b' | 'c' | 'd'): { left: Float32Array; right: Float32Array } | null {
    const bus = this.fxBuses.get(`fx_${letter}` as OutputDestination);
    return bus ? bus.getOutput() : null;
  }
  
  /**
   * Get all meters
   */
  getAllMeters(): Map<string, MeterReading> {
    const meters = new Map<string, MeterReading>();
    
    meters.set('master', this.masterBus.getMeter());
    
    for (const [id, bus] of this.directBuses) {
      meters.set(id, bus.getMeter());
    }
    
    for (const [id, bus] of this.fxBuses) {
      meters.set(id, bus.getMeter());
    }
    
    for (const [id, bus] of this.submixBuses) {
      meters.set(id, bus.getMeter());
    }
    
    return meters;
  }
  
  /**
   * Get master meter
   */
  getMasterMeter(): MeterReading {
    return this.masterBus.getMeter();
  }
  
  /**
   * Reset all peak holds
   */
  resetAllPeakHolds(): void {
    this.masterBus.resetPeakHold();
    
    for (const bus of this.directBuses.values()) {
      bus.resetPeakHold();
    }
    
    for (const bus of this.fxBuses.values()) {
      bus.resetPeakHold();
    }
    
    for (const bus of this.submixBuses.values()) {
      bus.resetPeakHold();
    }
  }
  
  /**
   * Set bus configuration
   */
  setBusConfig(destination: OutputDestination, config: Partial<BusConfig>): void {
    const bus = this.getBus(destination);
    if (bus) {
      bus.setConfig(config);
    }
  }
  
  /**
   * Get bus configuration
   */
  getBusConfig(destination: OutputDestination): BusConfig | null {
    const bus = this.getBus(destination);
    return bus ? bus.getConfig() : null;
  }
  
  /**
   * Get all zone routings
   */
  getAllZoneRoutings(): Map<string, ZoneRouting> {
    return new Map(this.zoneRouting);
  }
  
  /**
   * Get output destinations
   */
  static getOutputDestinations(): OutputDestination[] {
    return [
      'master',
      'direct_1', 'direct_2', 'direct_3', 'direct_4',
      'direct_5', 'direct_6', 'direct_7', 'direct_8',
      'fx_a', 'fx_b', 'fx_c', 'fx_d',
      'submix_1', 'submix_2', 'submix_3', 'submix_4',
    ];
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create routing manager
 */
export function createRoutingManager(
  sampleRate: number,
  bufferSize: number
): SamplerRoutingManager {
  return new SamplerRoutingManager(sampleRate, bufferSize);
}

/**
 * Create audio bus
 */
export function createAudioBus(
  id: string,
  type: BusType,
  sampleRate: number,
  bufferSize: number,
  config?: Partial<BusConfig>
): AudioBus {
  return new AudioBus(id, type, sampleRate, bufferSize, config);
}

/**
 * Create zone routing
 */
export function createZoneRouting(overrides?: Partial<ZoneRouting>): ZoneRouting {
  return { ...DEFAULT_ZONE_ROUTING, ...overrides };
}

/**
 * Create aux send
 */
export function createAuxSend(
  destination: OutputDestination,
  amount: number,
  preFader = false
): AuxSend {
  return { destination, amount, preFader };
}
