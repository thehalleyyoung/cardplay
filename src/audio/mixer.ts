/**
 * @fileoverview Mixer & Routing System.
 * 
 * Provides a complete mixing infrastructure with:
 * - Track channel strips
 * - Gain staging and pan
 * - Mute/solo routing
 * - Send/return buses
 * - Master bus chain
 * - Sidechain routing
 * - Submix groups
 * - Metering (peak, RMS, LUFS)
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Channel types.
 */
export type ChannelType = 
  | 'audio'       // Audio track
  | 'midi'        // MIDI track (routed to instrument)
  | 'bus'         // Submix bus
  | 'aux'         // Aux/return bus
  | 'master';     // Master output

/**
 * Pan law.
 */
export type PanLaw = 
  | '0db'         // No compensation (linear)
  | '-3db'        // -3dB center
  | '-4.5db'      // -4.5dB center
  | '-6db';       // -6dB center (equal power)

/**
 * Send type.
 */
export type SendType = 'pre-fader' | 'post-fader';

/**
 * Meter type.
 */
export type MeterType = 'peak' | 'rms' | 'lufs' | 'true-peak';

/**
 * Solo mode.
 */
export type SoloMode = 'solo' | 'solo-in-place' | 'solo-safe';

// ============================================================================
// CHANNEL STRIP
// ============================================================================

/**
 * Channel strip parameters.
 */
export interface ChannelParams {
  readonly id: string;
  readonly name: string;
  readonly type: ChannelType;
  readonly gain: number;           // Pre-fader gain (dB)
  readonly fader: number;          // Fader level (dB)
  readonly pan: number;            // -1 (L) to 1 (R)
  readonly width: number;          // Stereo width (0-2)
  readonly mute: boolean;
  readonly solo: boolean;
  readonly soloMode: SoloMode;
  readonly phase: boolean;         // Phase invert
  readonly input?: string;         // Input source id
  readonly output: string;         // Output bus id (default: 'master')
  readonly color?: string;
}

/**
 * Default channel parameters.
 */
export const DEFAULT_CHANNEL: ChannelParams = {
  id: '',
  name: 'Channel',
  type: 'audio',
  gain: 0,
  fader: 0,
  pan: 0,
  width: 1,
  mute: false,
  solo: false,
  soloMode: 'solo',
  phase: false,
  output: 'master',
};

/**
 * Channel send configuration.
 */
export interface ChannelSend {
  readonly id: string;
  readonly targetBus: string;
  readonly level: number;          // Send level (dB)
  readonly type: SendType;
  readonly enabled: boolean;
  readonly pan?: number;           // Send pan (-1 to 1)
}

/**
 * Channel meter readings.
 */
export interface MeterReading {
  readonly peak: number;           // Peak level (0-1)
  readonly peakDb: number;         // Peak level (dB)
  readonly rms: number;            // RMS level (0-1)
  readonly rmsDb: number;          // RMS level (dB)
  readonly lufs?: number;          // LUFS (integrated)
  readonly clip: boolean;          // True if clipping
}

/**
 * Stereo meter readings.
 */
export interface StereoMeter {
  readonly left: MeterReading;
  readonly right: MeterReading;
  readonly correlation: number;    // Phase correlation (-1 to 1)
}

// ============================================================================
// MIXER STATE
// ============================================================================

/**
 * Mixer configuration.
 */
export interface MixerConfig {
  readonly sampleRate: number;
  readonly panLaw: PanLaw;
  readonly soloDefeat: boolean;    // Solo defeats all solos
  readonly dimLevel: number;       // Dim level (dB)
  readonly monoSum: boolean;       // Mono sum for monitoring
}

/**
 * Default mixer configuration.
 */
export const DEFAULT_MIXER_CONFIG: MixerConfig = {
  sampleRate: 48000,
  panLaw: '-3db',
  soloDefeat: false,
  dimLevel: -20,
  monoSum: false,
};

/**
 * Mixer state.
 */
export interface MixerState {
  readonly config: MixerConfig;
  readonly channels: readonly ChannelParams[];
  readonly sends: ReadonlyMap<string, readonly ChannelSend[]>;
  readonly solo: readonly string[];  // List of soloed channel ids
  readonly masterMute: boolean;
  readonly masterDim: boolean;
}

/**
 * Creates initial mixer state.
 */
export function createMixerState(config: Partial<MixerConfig> = {}): MixerState {
  const masterChannel: ChannelParams = {
    ...DEFAULT_CHANNEL,
    id: 'master',
    name: 'Master',
    type: 'master',
    output: '', // Master has no output
  };

  return {
    config: { ...DEFAULT_MIXER_CONFIG, ...config },
    channels: [masterChannel],
    sends: new Map(),
    solo: [],
    masterMute: false,
    masterDim: false,
  };
}

// ============================================================================
// PAN CALCULATION
// ============================================================================

/**
 * Calculates pan gains for left and right channels.
 */
export function calculatePanGains(
  pan: number,
  panLaw: PanLaw
): { left: number; right: number } {
  // Clamp pan to -1..1
  const p = Math.max(-1, Math.min(1, pan));
  
  // Convert to 0..1 range
  const position = (p + 1) / 2;
  
  switch (panLaw) {
    case '0db': {
      // Linear pan (no compensation)
      return {
        left: 1 - position,
        right: position,
      };
    }
    
    case '-3db': {
      // -3dB center (constant power)
      const angle = position * Math.PI / 2;
      return {
        left: Math.cos(angle),
        right: Math.sin(angle),
      };
    }
    
    case '-4.5db': {
      // -4.5dB center (compromise)
      const linear = { left: 1 - position, right: position };
      const angle = position * Math.PI / 2;
      const power = { left: Math.cos(angle), right: Math.sin(angle) };
      return {
        left: (linear.left + power.left) / 2,
        right: (linear.right + power.right) / 2,
      };
    }
    
    case '-6db': {
      // -6dB center (both sides equal)
      return {
        left: Math.sqrt(1 - position),
        right: Math.sqrt(position),
      };
    }
  }
}

/**
 * Applies stereo width adjustment.
 */
export function applyStereoWidth(
  left: number,
  right: number,
  width: number
): { left: number; right: number } {
  const w = Math.max(0, Math.min(2, width));
  const mid = (left + right) / 2;
  const side = (left - right) / 2;
  
  // Width 1 = original, 0 = mono, 2 = double width
  const adjustedSide = side * w;
  
  return {
    left: mid + adjustedSide,
    right: mid - adjustedSide,
  };
}

// ============================================================================
// GAIN CALCULATIONS
// ============================================================================

/**
 * Converts dB to linear gain.
 */
export function dbToLinear(db: number): number {
  return Math.pow(10, db / 20);
}

/**
 * Converts linear gain to dB.
 */
export function linearToDb(linear: number): number {
  if (linear <= 0) return -Infinity;
  return 20 * Math.log10(linear);
}

/**
 * Calculates total channel gain.
 */
export function calculateChannelGain(channel: ChannelParams): number {
  if (channel.mute) return 0;
  
  const preGain = dbToLinear(channel.gain);
  const faderGain = dbToLinear(channel.fader);
  
  return preGain * faderGain;
}

/**
 * Calculates send level in linear gain.
 */
export function calculateSendLevel(
  send: ChannelSend,
  channelFaderDb: number
): number {
  if (!send.enabled) return 0;
  
  const sendLevel = dbToLinear(send.level);
  
  if (send.type === 'pre-fader') {
    return sendLevel;
  } else {
    const faderLevel = dbToLinear(channelFaderDb);
    return sendLevel * faderLevel;
  }
}

// ============================================================================
// METERING
// ============================================================================

/**
 * Peak detector with hold and release.
 */
export class PeakDetector {
  private peak = 0;
  private holdCounter = 0;
  private readonly holdSamples: number;
  private readonly releaseCoef: number;

  constructor(sampleRate: number, holdMs: number = 2000, releaseMs: number = 500) {
    this.holdSamples = Math.floor(holdMs * sampleRate / 1000);
    this.releaseCoef = Math.exp(-1 / (releaseMs * sampleRate / 1000));
  }

  /**
   * Processes a sample.
   */
  process(sample: number): number {
    const abs = Math.abs(sample);
    
    if (abs >= this.peak) {
      this.peak = abs;
      this.holdCounter = this.holdSamples;
    } else if (this.holdCounter > 0) {
      this.holdCounter--;
    } else {
      this.peak *= this.releaseCoef;
    }
    
    return this.peak;
  }

  /**
   * Gets current peak.
   */
  getPeak(): number {
    return this.peak;
  }

  /**
   * Resets the detector.
   */
  reset(): void {
    this.peak = 0;
    this.holdCounter = 0;
  }
}

/**
 * RMS calculator with windowing.
 */
export class RMSCalculator {
  private readonly buffer: Float32Array;
  private index = 0;
  private sum = 0;

  constructor(windowSamples: number = 4096) {
    this.buffer = new Float32Array(windowSamples);
  }

  /**
   * Processes a sample.
   */
  process(sample: number): number {
    const squared = sample * sample;
    
    // Remove old value from sum
    this.sum -= this.buffer[this.index]!;
    
    // Add new value
    this.buffer[this.index] = squared;
    this.sum += squared;
    
    this.index = (this.index + 1) % this.buffer.length;
    
    return Math.sqrt(this.sum / this.buffer.length);
  }

  /**
   * Gets current RMS.
   */
  getRMS(): number {
    return Math.sqrt(this.sum / this.buffer.length);
  }

  /**
   * Resets the calculator.
   */
  reset(): void {
    this.buffer.fill(0);
    this.sum = 0;
    this.index = 0;
  }
}

/**
 * Phase correlation meter.
 */
export class CorrelationMeter {
  private sumLL = 0;
  private sumRR = 0;
  private sumLR = 0;
  private readonly decay: number;

  constructor(sampleRate: number, windowMs: number = 300) {
    this.decay = Math.exp(-1 / (windowMs * sampleRate / 1000));
  }

  /**
   * Processes a stereo sample pair.
   */
  process(left: number, right: number): number {
    this.sumLL = this.sumLL * this.decay + left * left;
    this.sumRR = this.sumRR * this.decay + right * right;
    this.sumLR = this.sumLR * this.decay + left * right;
    
    const denominator = Math.sqrt(this.sumLL * this.sumRR);
    if (denominator < 1e-10) return 0;
    
    return this.sumLR / denominator;
  }

  /**
   * Gets current correlation.
   */
  getCorrelation(): number {
    const denominator = Math.sqrt(this.sumLL * this.sumRR);
    if (denominator < 1e-10) return 0;
    return this.sumLR / denominator;
  }

  /**
   * Resets the meter.
   */
  reset(): void {
    this.sumLL = 0;
    this.sumRR = 0;
    this.sumLR = 0;
  }
}

/**
 * Complete stereo meter.
 */
export class StereoMeterProcessor {
  private readonly leftPeak: PeakDetector;
  private readonly rightPeak: PeakDetector;
  private readonly leftRMS: RMSCalculator;
  private readonly rightRMS: RMSCalculator;
  private readonly correlation: CorrelationMeter;
  private leftClip = false;
  private rightClip = false;

  constructor(sampleRate: number) {
    this.leftPeak = new PeakDetector(sampleRate);
    this.rightPeak = new PeakDetector(sampleRate);
    this.leftRMS = new RMSCalculator();
    this.rightRMS = new RMSCalculator();
    this.correlation = new CorrelationMeter(sampleRate);
  }

  /**
   * Processes a stereo sample pair.
   */
  process(left: number, right: number): void {
    this.leftPeak.process(left);
    this.rightPeak.process(right);
    this.leftRMS.process(left);
    this.rightRMS.process(right);
    this.correlation.process(left, right);
    
    if (Math.abs(left) >= 1) this.leftClip = true;
    if (Math.abs(right) >= 1) this.rightClip = true;
  }

  /**
   * Gets current meter readings.
   */
  getReadings(): StereoMeter {
    const leftPeakVal = this.leftPeak.getPeak();
    const rightPeakVal = this.rightPeak.getPeak();
    const leftRMSVal = this.leftRMS.getRMS();
    const rightRMSVal = this.rightRMS.getRMS();
    
    return {
      left: {
        peak: leftPeakVal,
        peakDb: linearToDb(leftPeakVal),
        rms: leftRMSVal,
        rmsDb: linearToDb(leftRMSVal),
        clip: this.leftClip,
      },
      right: {
        peak: rightPeakVal,
        peakDb: linearToDb(rightPeakVal),
        rms: rightRMSVal,
        rmsDb: linearToDb(rightRMSVal),
        clip: this.rightClip,
      },
      correlation: this.correlation.getCorrelation(),
    };
  }

  /**
   * Resets clip indicators.
   */
  resetClip(): void {
    this.leftClip = false;
    this.rightClip = false;
  }

  /**
   * Resets all meters.
   */
  reset(): void {
    this.leftPeak.reset();
    this.rightPeak.reset();
    this.leftRMS.reset();
    this.rightRMS.reset();
    this.correlation.reset();
    this.resetClip();
  }
}

// ============================================================================
// CHANNEL STRIP PROCESSOR
// ============================================================================

/**
 * Channel strip processor.
 */
export class ChannelStrip {
  private params: ChannelParams;
  private readonly panLaw: PanLaw;
  private readonly meter: StereoMeterProcessor;
  private soloOverride = false;

  constructor(params: ChannelParams, config: MixerConfig) {
    this.params = params;
    this.panLaw = config.panLaw;
    this.meter = new StereoMeterProcessor(config.sampleRate);
  }

  /**
   * Updates channel parameters.
   */
  setParams(params: Partial<ChannelParams>): void {
    this.params = { ...this.params, ...params };
  }

  /**
   * Gets current parameters.
   */
  getParams(): ChannelParams {
    return this.params;
  }

  /**
   * Sets solo override (when other channels are soloed).
   */
  setSoloOverride(override: boolean): void {
    this.soloOverride = override;
  }

  /**
   * Checks if channel should output audio.
   */
  shouldOutput(): boolean {
    if (this.params.mute) return false;
    if (this.soloOverride && !this.params.solo) return false;
    return true;
  }

  /**
   * Processes a stereo sample pair.
   */
  process(left: number, right: number): { left: number; right: number } {
    if (!this.shouldOutput()) {
      return { left: 0, right: 0 };
    }

    // Apply phase invert
    if (this.params.phase) {
      left = -left;
      right = -right;
    }

    // Apply pre-fader gain
    const preGain = dbToLinear(this.params.gain);
    left *= preGain;
    right *= preGain;

    // Apply stereo width
    const widened = applyStereoWidth(left, right, this.params.width);
    left = widened.left;
    right = widened.right;

    // Apply pan
    const panGains = calculatePanGains(this.params.pan, this.panLaw);
    
    // Apply fader
    const faderGain = dbToLinear(this.params.fader);
    left *= faderGain * panGains.left;
    right *= faderGain * panGains.right;

    // Update meters
    this.meter.process(left, right);

    return { left, right };
  }

  /**
   * Gets meter readings.
   */
  getMeter(): StereoMeter {
    return this.meter.getReadings();
  }

  /**
   * Resets clip indicators.
   */
  resetClip(): void {
    this.meter.resetClip();
  }
}

// ============================================================================
// MIXER GRAPH
// ============================================================================

/**
 * Mixer routing graph node.
 */
export interface MixerNode {
  readonly id: string;
  readonly type: ChannelType;
  readonly inputs: readonly string[];
  readonly output: string;
}

/**
 * Builds a routing graph from channels.
 */
export function buildMixerGraph(channels: readonly ChannelParams[]): readonly MixerNode[] {
  const nodes: MixerNode[] = [];
  const inputsByOutput = new Map<string, string[]>();

  // Group channels by their output
  for (const channel of channels) {
    if (!inputsByOutput.has(channel.output)) {
      inputsByOutput.set(channel.output, []);
    }
    if (channel.output) {
      inputsByOutput.get(channel.output)!.push(channel.id);
    }
  }

  // Create nodes
  for (const channel of channels) {
    nodes.push({
      id: channel.id,
      type: channel.type,
      inputs: inputsByOutput.get(channel.id) ?? [],
      output: channel.output,
    });
  }

  return nodes;
}

/**
 * Sorts channels in processing order (topological sort).
 */
export function sortChannelsForProcessing(
  channels: readonly ChannelParams[]
): readonly ChannelParams[] {
  const graph = buildMixerGraph(channels);
  const visited = new Set<string>();
  const result: ChannelParams[] = [];
  const channelMap = new Map(channels.map(c => [c.id, c]));

  function visit(id: string): void {
    if (visited.has(id)) return;
    visited.add(id);

    const node = graph.find(n => n.id === id);
    if (!node) return;

    // Visit inputs first
    for (const inputId of node.inputs) {
      visit(inputId);
    }

    const channel = channelMap.get(id);
    if (channel) {
      result.push(channel);
    }
  }

  // Start from master and work backwards, but we want sources first
  // So we visit all nodes
  for (const node of graph) {
    visit(node.id);
  }

  return result;
}

/**
 * Validates mixer routing (no cycles, all outputs exist).
 */
export function validateMixerRouting(
  channels: readonly ChannelParams[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const channelIds = new Set(channels.map(c => c.id));

  for (const channel of channels) {
    // Check output exists (except master)
    if (channel.output && !channelIds.has(channel.output)) {
      errors.push(`Channel "${channel.id}" outputs to non-existent channel "${channel.output}"`);
    }

    // Check for self-routing
    if (channel.output === channel.id) {
      errors.push(`Channel "${channel.id}" is routed to itself`);
    }
  }

  // Check for cycles
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function hasCycle(id: string): boolean {
    if (inStack.has(id)) return true;
    if (visited.has(id)) return false;

    visited.add(id);
    inStack.add(id);

    const channel = channels.find(c => c.id === id);
    if (channel?.output) {
      if (hasCycle(channel.output)) {
        errors.push(`Routing cycle detected involving channel "${id}"`);
        return true;
      }
    }

    inStack.delete(id);
    return false;
  }

  for (const channel of channels) {
    hasCycle(channel.id);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// MIXER PROCESSOR
// ============================================================================

/**
 * Complete mixer processor.
 */
export class MixerProcessor {
  private readonly config: MixerConfig;
  private channels: Map<string, ChannelStrip> = new Map();
  private sends: Map<string, ChannelSend[]> = new Map();
  private processingOrder: string[] = [];

  constructor(config: Partial<MixerConfig> = {}) {
    this.config = { ...DEFAULT_MIXER_CONFIG, ...config };
  }

  /**
   * Adds a channel.
   */
  addChannel(params: ChannelParams): void {
    const strip = new ChannelStrip(params, this.config);
    this.channels.set(params.id, strip);
    this.updateProcessingOrder();
  }

  /**
   * Removes a channel.
   */
  removeChannel(id: string): boolean {
    const result = this.channels.delete(id);
    if (result) {
      this.sends.delete(id);
      this.updateProcessingOrder();
    }
    return result;
  }

  /**
   * Updates a channel.
   */
  updateChannel(id: string, params: Partial<ChannelParams>): void {
    const strip = this.channels.get(id);
    if (strip) {
      strip.setParams(params);
      if (params.output !== undefined) {
        this.updateProcessingOrder();
      }
    }
  }

  /**
   * Gets a channel.
   */
  getChannel(id: string): ChannelStrip | undefined {
    return this.channels.get(id);
  }

  /**
   * Adds a send to a channel.
   */
  addSend(channelId: string, send: ChannelSend): void {
    if (!this.sends.has(channelId)) {
      this.sends.set(channelId, []);
    }
    this.sends.get(channelId)!.push(send);
  }

  /**
   * Removes a send from a channel.
   */
  removeSend(channelId: string, sendId: string): boolean {
    const channelSends = this.sends.get(channelId);
    if (!channelSends) return false;

    const index = channelSends.findIndex(s => s.id === sendId);
    if (index !== -1) {
      channelSends.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Updates solo states.
   */
  updateSoloStates(): void {
    // Find all soloed channels
    const soloed: string[] = [];
    for (const [id, strip] of this.channels) {
      if (strip.getParams().solo) {
        soloed.push(id);
      }
    }

    // Apply solo override
    const hasSolo = soloed.length > 0;
    for (const strip of this.channels.values()) {
      strip.setSoloOverride(hasSolo);
    }
  }

  /**
   * Updates processing order.
   */
  private updateProcessingOrder(): void {
    const channels = Array.from(this.channels.values()).map(s => s.getParams());
    const sorted = sortChannelsForProcessing(channels);
    this.processingOrder = sorted.map(c => c.id);
  }

  /**
   * Processes a block of audio through the mixer.
   */
  process(
    inputs: Map<string, { left: Float32Array; right: Float32Array }>,
    outputLength: number
  ): { left: Float32Array; right: Float32Array } {
    const buffers = new Map<string, { left: Float32Array; right: Float32Array }>();
    
    // Initialize buffers
    for (const id of this.processingOrder) {
      buffers.set(id, {
        left: new Float32Array(outputLength),
        right: new Float32Array(outputLength),
      });
    }

    // Process in order
    for (const id of this.processingOrder) {
      const strip = this.channels.get(id);
      if (!strip) continue;

      const params = strip.getParams();
      const buffer = buffers.get(id)!;
      const input = inputs.get(id);

      // Sum input
      if (input) {
        for (let i = 0; i < outputLength; i++) {
          const bufL = buffer.left[i];
          const bufR = buffer.right[i];
          const inL = input.left[i];
          const inR = input.right[i];
          if (bufL !== undefined && inL !== undefined) {
            buffer.left[i] = bufL + inL;
          }
          if (bufR !== undefined && inR !== undefined) {
            buffer.right[i] = bufR + inR;
          }
        }
      }

      // Process through channel strip
      for (let i = 0; i < outputLength; i++) {
        const processed = strip.process(buffer.left[i]!, buffer.right[i]!);
        buffer.left[i] = processed.left;
        buffer.right[i] = processed.right;
      }

      // Route to output
      if (params.output) {
        const outputBuffer = buffers.get(params.output);
        if (outputBuffer) {
          for (let i = 0; i < outputLength; i++) {
            const outL = outputBuffer.left[i];
            const outR = outputBuffer.right[i];
            const srcL = buffer.left[i];
            const srcR = buffer.right[i];
            if (outL !== undefined && srcL !== undefined) {
              outputBuffer.left[i] = outL + srcL;
            }
            if (outR !== undefined && srcR !== undefined) {
              outputBuffer.right[i] = outR + srcR;
            }
          }
        }
      }
    }

    // Return master output
    return buffers.get('master') ?? {
      left: new Float32Array(outputLength),
      right: new Float32Array(outputLength),
    };
  }

  /**
   * Gets all meter readings.
   */
  getAllMeters(): Map<string, StereoMeter> {
    const meters = new Map<string, StereoMeter>();
    for (const [id, strip] of this.channels) {
      meters.set(id, strip.getMeter());
    }
    return meters;
  }

  /**
   * Resets all clip indicators.
   */
  resetAllClips(): void {
    for (const strip of this.channels.values()) {
      strip.resetClip();
    }
  }
}
