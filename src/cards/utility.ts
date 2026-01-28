/**
 * @fileoverview Utility Cards - Workflow and routing utilities.
 * 
 * This module provides utility cards for signal routing and workflow:
 * - Splitter (1-to-N routing)
 * - Mixer (N-to-1 routing)
 * - Crossfade (A/B blend)
 * - Switch (A/B toggle)
 * - Bypass (latency-compensated passthrough)
 * - Mute/Solo (output control)
 * - Gain/Pan/Balance (level control)
 * - Width (stereo processing)
 * - Normalize/Trim/Fade (audio utilities)
 * 
 * @module @cardplay/core/cards/utility
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Audio sample pair (stereo).
 */
export interface StereoSample {
  readonly left: number;
  readonly right: number;
}

/**
 * Audio buffer representation.
 */
export interface AudioBufferLike {
  readonly sampleRate: number;
  readonly length: number;
  readonly numberOfChannels: number;
  getChannelData(channel: number): Float32Array;
}

// ============================================================================
// SPLITTER (1-to-N Routing)
// ============================================================================

/**
 * Splitter output configuration.
 */
export interface SplitterOutput {
  readonly id: string;
  readonly name: string;
  readonly gain: number;  // 0-1
  readonly mute: boolean;
}

/**
 * Splitter state.
 */
export interface SplitterState {
  readonly id: string;
  readonly outputs: readonly SplitterOutput[];
  readonly inputGain: number;  // dB
}

/**
 * Default splitter state.
 */
export const DEFAULT_SPLITTER_STATE: SplitterState = {
  id: 'splitter-1',
  outputs: [
    { id: 'out-1', name: 'Output 1', gain: 1, mute: false },
    { id: 'out-2', name: 'Output 2', gain: 1, mute: false },
  ],
  inputGain: 0,
};

/**
 * Create splitter with N outputs.
 */
export function createSplitter(outputCount: number): SplitterState {
  const outputs: SplitterOutput[] = Array.from({ length: outputCount }, (_, i) => ({
    id: `out-${i + 1}`,
    name: `Output ${i + 1}`,
    gain: 1,
    mute: false,
  }));
  
  return {
    ...DEFAULT_SPLITTER_STATE,
    outputs,
  };
}

/**
 * Add output to splitter.
 */
export function addSplitterOutput(state: SplitterState, name?: string): SplitterState {
  const newId = `out-${state.outputs.length + 1}`;
  return {
    ...state,
    outputs: [
      ...state.outputs,
      { id: newId, name: name ?? `Output ${state.outputs.length + 1}`, gain: 1, mute: false },
    ],
  };
}

/**
 * Set splitter output gain.
 */
export function setSplitterOutputGain(
  state: SplitterState,
  outputId: string,
  gain: number
): SplitterState {
  return {
    ...state,
    outputs: state.outputs.map(o =>
      o.id === outputId ? { ...o, gain: Math.max(0, Math.min(1, gain)) } : o
    ),
  };
}

/**
 * Toggle splitter output mute.
 */
export function toggleSplitterOutputMute(state: SplitterState, outputId: string): SplitterState {
  return {
    ...state,
    outputs: state.outputs.map(o =>
      o.id === outputId ? { ...o, mute: !o.mute } : o
    ),
  };
}

/**
 * Process audio through splitter.
 */
export function processSplitter(
  sample: StereoSample,
  state: SplitterState
): readonly StereoSample[] {
  const inputGainLinear = Math.pow(10, state.inputGain / 20);
  const amplifiedSample: StereoSample = {
    left: sample.left * inputGainLinear,
    right: sample.right * inputGainLinear,
  };
  
  return state.outputs.map(output => {
    if (output.mute) {
      return { left: 0, right: 0 };
    }
    return {
      left: amplifiedSample.left * output.gain,
      right: amplifiedSample.right * output.gain,
    };
  });
}

// ============================================================================
// MIXER (N-to-1 Routing)
// ============================================================================

/**
 * Mixer input configuration.
 */
export interface MixerInput {
  readonly id: string;
  readonly name: string;
  readonly gain: number;     // dB
  readonly pan: number;      // -1 to 1
  readonly mute: boolean;
  readonly solo: boolean;
}

/**
 * Mixer state.
 */
export interface MixerState {
  readonly id: string;
  readonly inputs: readonly MixerInput[];
  readonly masterGain: number;  // dB
  readonly soloMode: boolean;   // Whether any input is soloed
}

/**
 * Default mixer state.
 */
export const DEFAULT_MIXER_STATE: MixerState = {
  id: 'mixer-1',
  inputs: [
    { id: 'in-1', name: 'Input 1', gain: 0, pan: 0, mute: false, solo: false },
    { id: 'in-2', name: 'Input 2', gain: 0, pan: 0, mute: false, solo: false },
  ],
  masterGain: 0,
  soloMode: false,
};

/**
 * Create mixer with N inputs.
 */
export function createMixer(inputCount: number): MixerState {
  const inputs: MixerInput[] = Array.from({ length: inputCount }, (_, i) => ({
    id: `in-${i + 1}`,
    name: `Input ${i + 1}`,
    gain: 0,
    pan: 0,
    mute: false,
    solo: false,
  }));
  
  return {
    ...DEFAULT_MIXER_STATE,
    inputs,
  };
}

/**
 * Add input to mixer.
 */
export function addMixerInput(state: MixerState, name?: string): MixerState {
  const newId = `in-${state.inputs.length + 1}`;
  return {
    ...state,
    inputs: [
      ...state.inputs,
      { id: newId, name: name ?? `Input ${state.inputs.length + 1}`, gain: 0, pan: 0, mute: false, solo: false },
    ],
  };
}

/**
 * Set mixer input gain.
 */
export function setMixerInputGain(state: MixerState, inputId: string, gain: number): MixerState {
  return {
    ...state,
    inputs: state.inputs.map(i =>
      i.id === inputId ? { ...i, gain: Math.max(-60, Math.min(12, gain)) } : i
    ),
  };
}

/**
 * Set mixer input pan.
 */
export function setMixerInputPan(state: MixerState, inputId: string, pan: number): MixerState {
  return {
    ...state,
    inputs: state.inputs.map(i =>
      i.id === inputId ? { ...i, pan: Math.max(-1, Math.min(1, pan)) } : i
    ),
  };
}

/**
 * Toggle mixer input mute.
 */
export function toggleMixerInputMute(state: MixerState, inputId: string): MixerState {
  return {
    ...state,
    inputs: state.inputs.map(i =>
      i.id === inputId ? { ...i, mute: !i.mute } : i
    ),
  };
}

/**
 * Toggle mixer input solo.
 */
export function toggleMixerInputSolo(state: MixerState, inputId: string): MixerState {
  const newInputs = state.inputs.map(i =>
    i.id === inputId ? { ...i, solo: !i.solo } : i
  );
  const soloMode = newInputs.some(i => i.solo);
  
  return {
    ...state,
    inputs: newInputs,
    soloMode,
  };
}

/**
 * Calculate pan gains (constant power).
 */
export function calculatePanGainsConstantPower(pan: number): { leftGain: number; rightGain: number } {
  const p = (pan + 1) * 0.5; // Normalize to 0-1
  return {
    leftGain: Math.cos(p * Math.PI * 0.5),
    rightGain: Math.sin(p * Math.PI * 0.5),
  };
}

/**
 * Process audio through mixer.
 */
export function processMixer(
  samples: readonly StereoSample[],
  state: MixerState
): StereoSample {
  let left = 0;
  let right = 0;
  
  for (let i = 0; i < Math.min(samples.length, state.inputs.length); i++) {
    const input = state.inputs[i]!;
    const sample = samples[i]!;
    
    // Check mute/solo
    if (input.mute) continue;
    if (state.soloMode && !input.solo) continue;
    
    // Apply gain
    const gainLinear = Math.pow(10, input.gain / 20);
    const amplified = {
      left: sample.left * gainLinear,
      right: sample.right * gainLinear,
    };
    
    // Apply pan
    const { leftGain, rightGain } = calculatePanGainsConstantPower(input.pan);
    
    // Mix mono to stereo with pan, or stereo with pan crossfade
    const mono = (amplified.left + amplified.right) * 0.5;
    left += mono * leftGain;
    right += mono * rightGain;
  }
  
  // Apply master gain
  const masterGainLinear = Math.pow(10, state.masterGain / 20);
  
  return {
    left: left * masterGainLinear,
    right: right * masterGainLinear,
  };
}

// ============================================================================
// CROSSFADE (A/B Blend)
// ============================================================================

/**
 * Crossfade curve type.
 */
export type CrossfadeCurve = 'linear' | 'equal-power' | 'exponential' | 's-curve';

/**
 * Crossfade state.
 */
export interface CrossfadeState {
  readonly id: string;
  readonly blend: number;         // 0 = A, 1 = B
  readonly curve: CrossfadeCurve;
  readonly autoFade: boolean;
  readonly fadeDuration: number;  // ms
  readonly currentTarget: 'A' | 'B' | null;
  readonly fadeProgress: number;  // 0-1
}

/**
 * Default crossfade state.
 */
export const DEFAULT_CROSSFADE_STATE: CrossfadeState = {
  id: 'crossfade-1',
  blend: 0,
  curve: 'equal-power',
  autoFade: false,
  fadeDuration: 500,
  currentTarget: null,
  fadeProgress: 0,
};

/**
 * Calculate crossfade gains.
 */
export function calculateCrossfadeGains(
  blend: number,
  curve: CrossfadeCurve
): { gainA: number; gainB: number } {
  const t = Math.max(0, Math.min(1, blend));
  
  switch (curve) {
    case 'linear':
      return { gainA: 1 - t, gainB: t };
      
    case 'equal-power':
      return {
        gainA: Math.cos(t * Math.PI * 0.5),
        gainB: Math.sin(t * Math.PI * 0.5),
      };
      
    case 'exponential':
      return {
        gainA: Math.pow(1 - t, 2),
        gainB: Math.pow(t, 2),
      };
      
    case 's-curve': {
      // Smoothstep function
      const s = t * t * (3 - 2 * t);
      return { gainA: 1 - s, gainB: s };
    }
      
    default:
      return { gainA: 1 - t, gainB: t };
  }
}

/**
 * Process crossfade.
 */
export function processCrossfade(
  sampleA: StereoSample,
  sampleB: StereoSample,
  state: CrossfadeState
): StereoSample {
  const { gainA, gainB } = calculateCrossfadeGains(state.blend, state.curve);
  
  return {
    left: sampleA.left * gainA + sampleB.left * gainB,
    right: sampleA.right * gainA + sampleB.right * gainB,
  };
}

/**
 * Set crossfade blend.
 */
export function setCrossfadeBlend(state: CrossfadeState, blend: number): CrossfadeState {
  return {
    ...state,
    blend: Math.max(0, Math.min(1, blend)),
    currentTarget: null,
    fadeProgress: 0,
  };
}

/**
 * Start auto-fade to target.
 */
export function startAutoFade(state: CrossfadeState, target: 'A' | 'B'): CrossfadeState {
  return {
    ...state,
    currentTarget: target,
    fadeProgress: 0,
    autoFade: true,
  };
}

/**
 * Update auto-fade progress.
 */
export function updateAutoFade(state: CrossfadeState, deltaMs: number): CrossfadeState {
  if (!state.autoFade || !state.currentTarget) return state;
  
  const progressIncrement = deltaMs / state.fadeDuration;
  const newProgress = Math.min(1, state.fadeProgress + progressIncrement);
  
  const targetBlend = state.currentTarget === 'B' ? 1 : 0;
  const startBlend = state.currentTarget === 'B' ? 0 : 1;
  const newBlend = startBlend + (targetBlend - startBlend) * newProgress;
  
  const completed = newProgress >= 1;
  
  return {
    ...state,
    blend: newBlend,
    fadeProgress: newProgress,
    autoFade: !completed,
    currentTarget: completed ? null : state.currentTarget,
  };
}

// ============================================================================
// SWITCH (A/B Toggle)
// ============================================================================

/**
 * Switch transition type.
 */
export type SwitchTransition = 'hard' | 'crossfade' | 'fade-out-in';

/**
 * Switch state.
 */
export interface SwitchState {
  readonly id: string;
  readonly selected: 'A' | 'B';
  readonly transition: SwitchTransition;
  readonly transitionDuration: number;  // ms
  readonly isTransitioning: boolean;
  readonly transitionProgress: number;  // 0-1
  readonly previousSelected: 'A' | 'B';
}

/**
 * Default switch state.
 */
export const DEFAULT_SWITCH_STATE: SwitchState = {
  id: 'switch-1',
  selected: 'A',
  transition: 'crossfade',
  transitionDuration: 50,
  isTransitioning: false,
  transitionProgress: 0,
  previousSelected: 'A',
};

/**
 * Toggle switch.
 */
export function toggleSwitch(state: SwitchState): SwitchState {
  const newSelected = state.selected === 'A' ? 'B' : 'A';
  
  if (state.transition === 'hard') {
    return {
      ...state,
      selected: newSelected,
      previousSelected: state.selected,
    };
  }
  
  return {
    ...state,
    selected: newSelected,
    previousSelected: state.selected,
    isTransitioning: true,
    transitionProgress: 0,
  };
}

/**
 * Set switch to specific input.
 */
export function setSwitch(state: SwitchState, target: 'A' | 'B'): SwitchState {
  if (state.selected === target) return state;
  return toggleSwitch({ ...state, selected: target === 'A' ? 'B' : 'A' });
}

/**
 * Update switch transition.
 */
export function updateSwitchTransition(state: SwitchState, deltaMs: number): SwitchState {
  if (!state.isTransitioning) return state;
  
  const progressIncrement = deltaMs / state.transitionDuration;
  const newProgress = Math.min(1, state.transitionProgress + progressIncrement);
  const completed = newProgress >= 1;
  
  return {
    ...state,
    transitionProgress: newProgress,
    isTransitioning: !completed,
  };
}

/**
 * Process switch.
 */
export function processSwitch(
  sampleA: StereoSample,
  sampleB: StereoSample,
  state: SwitchState
): StereoSample {
  if (!state.isTransitioning) {
    return state.selected === 'A' ? sampleA : sampleB;
  }
  
  const t = state.transitionProgress;
  const from = state.previousSelected === 'A' ? sampleA : sampleB;
  const to = state.selected === 'A' ? sampleA : sampleB;
  
  switch (state.transition) {
    case 'crossfade':
      return {
        left: from.left * (1 - t) + to.left * t,
        right: from.right * (1 - t) + to.right * t,
      };
      
    case 'fade-out-in': {
      // Fade out then fade in
      const midpoint = 0.5;
      if (t < midpoint) {
        const fadeOut = 1 - (t / midpoint);
        return {
          left: from.left * fadeOut,
          right: from.right * fadeOut,
        };
      } else {
        const fadeIn = (t - midpoint) / (1 - midpoint);
        return {
          left: to.left * fadeIn,
          right: to.right * fadeIn,
        };
      }
    }
      
    case 'hard':
    default:
      return to;
  }
}

// ============================================================================
// BYPASS (Latency-Compensated Passthrough)
// ============================================================================

/**
 * Bypass state.
 */
export interface BypassState {
  readonly id: string;
  readonly bypassed: boolean;
  readonly latency: number;        // samples
  readonly compensated: boolean;   // whether to compensate for latency
  readonly fadeOnToggle: boolean;  // fade when toggling
  readonly fadeLength: number;     // samples
  readonly fadeProgress: number;   // 0-1
  readonly fadeDirection: 'in' | 'out' | null;
}

/**
 * Default bypass state.
 */
export const DEFAULT_BYPASS_STATE: BypassState = {
  id: 'bypass-1',
  bypassed: false,
  latency: 0,
  compensated: true,
  fadeOnToggle: true,
  fadeLength: 64,
  fadeProgress: 0,
  fadeDirection: null,
};

/**
 * Toggle bypass.
 */
export function toggleBypass(state: BypassState): BypassState {
  if (state.fadeOnToggle) {
    return {
      ...state,
      bypassed: !state.bypassed,
      fadeDirection: state.bypassed ? 'in' : 'out',
      fadeProgress: 0,
    };
  }
  
  return {
    ...state,
    bypassed: !state.bypassed,
  };
}

/**
 * Update bypass fade.
 */
export function updateBypassFade(state: BypassState): BypassState {
  if (!state.fadeDirection) return state;
  
  const newProgress = Math.min(1, state.fadeProgress + 1 / state.fadeLength);
  const completed = newProgress >= 1;
  
  return {
    ...state,
    fadeProgress: newProgress,
    fadeDirection: completed ? null : state.fadeDirection,
  };
}

/**
 * Get bypass gain (for fading).
 */
export function getBypassGain(state: BypassState): number {
  if (!state.fadeDirection) {
    return state.bypassed ? 0 : 1;
  }
  
  if (state.fadeDirection === 'out') {
    return 1 - state.fadeProgress;
  } else {
    return state.fadeProgress;
  }
}

// ============================================================================
// MUTE (Silence Output)
// ============================================================================

/**
 * Mute state.
 */
export interface MuteState {
  readonly id: string;
  readonly muted: boolean;
  readonly fadeToSilence: boolean;
  readonly fadeDuration: number;  // ms
  readonly fadeProgress: number;  // 0-1 (0 = full volume, 1 = silent)
  readonly fadeDirection: 'muting' | 'unmuting' | null;
}

/**
 * Default mute state.
 */
export const DEFAULT_MUTE_STATE: MuteState = {
  id: 'mute-1',
  muted: false,
  fadeToSilence: true,
  fadeDuration: 10,
  fadeProgress: 0,
  fadeDirection: null,
};

/**
 * Toggle mute.
 */
export function toggleMute(state: MuteState): MuteState {
  if (state.fadeToSilence) {
    return {
      ...state,
      muted: !state.muted,
      fadeDirection: state.muted ? 'unmuting' : 'muting',
    };
  }
  
  return {
    ...state,
    muted: !state.muted,
    fadeProgress: state.muted ? 0 : 1,
  };
}

/**
 * Update mute fade.
 */
export function updateMuteFade(state: MuteState, deltaMs: number): MuteState {
  if (!state.fadeDirection) return state;
  
  const progressIncrement = deltaMs / state.fadeDuration;
  let newProgress: number;
  
  if (state.fadeDirection === 'muting') {
    newProgress = Math.min(1, state.fadeProgress + progressIncrement);
  } else {
    newProgress = Math.max(0, state.fadeProgress - progressIncrement);
  }
  
  const completed = state.fadeDirection === 'muting' 
    ? newProgress >= 1 
    : newProgress <= 0;
  
  return {
    ...state,
    fadeProgress: newProgress,
    fadeDirection: completed ? null : state.fadeDirection,
  };
}

/**
 * Get mute gain.
 */
export function getMuteGain(state: MuteState): number {
  return 1 - state.fadeProgress;
}

// ============================================================================
// SOLO (Exclusive Listen)
// ============================================================================

/**
 * Solo mode.
 */
export type SoloMode = 'exclusive' | 'additive';

/**
 * Solo group state.
 */
export interface SoloGroupState {
  readonly id: string;
  readonly channels: readonly SoloChannelState[];
  readonly mode: SoloMode;
  readonly muteNonSolo: boolean;  // -inf or just reduced
  readonly muteReduction: number; // dB reduction for non-soloed when muteNonSolo is false
}

/**
 * Solo channel state.
 */
export interface SoloChannelState {
  readonly id: string;
  readonly name: string;
  readonly solo: boolean;
  readonly soloSafe: boolean;  // always audible even when others solo'd
}

/**
 * Default solo group state.
 */
export const DEFAULT_SOLO_GROUP_STATE: SoloGroupState = {
  id: 'solo-group-1',
  channels: [],
  mode: 'exclusive',
  muteNonSolo: true,
  muteReduction: -20,
};

/**
 * Add channel to solo group.
 */
export function addSoloChannel(state: SoloGroupState, id: string, name: string): SoloGroupState {
  return {
    ...state,
    channels: [...state.channels, { id, name, solo: false, soloSafe: false }],
  };
}

/**
 * Toggle channel solo.
 */
export function toggleChannelSolo(state: SoloGroupState, channelId: string): SoloGroupState {
  if (state.mode === 'exclusive') {
    // Exclusive: only one channel can be soloed
    return {
      ...state,
      channels: state.channels.map(c => ({
        ...c,
        solo: c.id === channelId ? !c.solo : false,
      })),
    };
  }
  
  // Additive: multiple channels can be soloed
  return {
    ...state,
    channels: state.channels.map(c =>
      c.id === channelId ? { ...c, solo: !c.solo } : c
    ),
  };
}

/**
 * Check if any channel is soloed.
 */
export function isAnySoloed(state: SoloGroupState): boolean {
  return state.channels.some(c => c.solo);
}

/**
 * Get channel gain based on solo state.
 */
export function getSoloGain(state: SoloGroupState, channelId: string): number {
  const channel = state.channels.find(c => c.id === channelId);
  if (!channel) return 1;
  
  // If no one is soloed, everyone plays
  if (!isAnySoloed(state)) return 1;
  
  // Solo-safe channels always play
  if (channel.soloSafe) return 1;
  
  // Soloed channels play
  if (channel.solo) return 1;
  
  // Non-soloed channels are muted or reduced
  if (state.muteNonSolo) return 0;
  return Math.pow(10, state.muteReduction / 20);
}

// ============================================================================
// GAIN (Volume Adjust)
// ============================================================================

/**
 * Gain state.
 */
export interface GainState {
  readonly id: string;
  readonly gain: number;     // dB
  readonly minGain: number;  // dB
  readonly maxGain: number;  // dB
  readonly mute: boolean;
  readonly invert: boolean;  // Phase inversion
}

/**
 * Default gain state.
 */
export const DEFAULT_GAIN_STATE: GainState = {
  id: 'gain-1',
  gain: 0,
  minGain: -60,
  maxGain: 24,
  mute: false,
  invert: false,
};

/**
 * Set gain.
 */
export function setGain(state: GainState, gain: number): GainState {
  return {
    ...state,
    gain: Math.max(state.minGain, Math.min(state.maxGain, gain)),
  };
}

/**
 * Get linear gain.
 */
export function getLinearGain(state: GainState): number {
  if (state.mute) return 0;
  const linear = Math.pow(10, state.gain / 20);
  return state.invert ? -linear : linear;
}

/**
 * Process gain.
 */
export function processGain(sample: StereoSample, state: GainState): StereoSample {
  const g = getLinearGain(state);
  return {
    left: sample.left * g,
    right: sample.right * g,
  };
}

// ============================================================================
// PAN (Stereo Position)
// ============================================================================

/**
 * Pan law type.
 */
export type PanLaw = 'linear' | 'constant-power' | '-3dB' | '-4.5dB' | '-6dB';

/**
 * Pan state.
 */
export interface PanState {
  readonly id: string;
  readonly pan: number;      // -1 (left) to 1 (right)
  readonly law: PanLaw;
}

/**
 * Default pan state.
 */
export const DEFAULT_PAN_STATE: PanState = {
  id: 'pan-1',
  pan: 0,
  law: 'constant-power',
};

/**
 * Set pan.
 */
export function setPan(state: PanState, pan: number): PanState {
  return {
    ...state,
    pan: Math.max(-1, Math.min(1, pan)),
  };
}

/**
 * Calculate pan gains.
 */
export function calculatePanGains(pan: number, law: PanLaw): { leftGain: number; rightGain: number } {
  const p = (pan + 1) * 0.5; // Normalize to 0-1
  
  switch (law) {
    case 'linear':
      return { leftGain: 1 - p, rightGain: p };
      
    case 'constant-power':
      return {
        leftGain: Math.cos(p * Math.PI * 0.5),
        rightGain: Math.sin(p * Math.PI * 0.5),
      };
      
    case '-3dB': {
      const sqrt2inv = 1 / Math.sqrt(2);
      return {
        leftGain: sqrt2inv + (1 - sqrt2inv) * (1 - p),
        rightGain: sqrt2inv + (1 - sqrt2inv) * p,
      };
    }
      
    case '-4.5dB': {
      const center = 0.595; // ~-4.5dB
      return {
        leftGain: center + (1 - center) * (1 - p),
        rightGain: center + (1 - center) * p,
      };
    }
      
    case '-6dB':
      return {
        leftGain: 0.5 + 0.5 * (1 - p),
        rightGain: 0.5 + 0.5 * p,
      };
      
    default:
      return { leftGain: 1, rightGain: 1 };
  }
}

/**
 * Process pan.
 */
export function processPan(sample: StereoSample, state: PanState): StereoSample {
  const { leftGain, rightGain } = calculatePanGains(state.pan, state.law);
  
  // Pan mono sum
  const mono = (sample.left + sample.right) * 0.5;
  return {
    left: mono * leftGain,
    right: mono * rightGain,
  };
}

// ============================================================================
// WIDTH (Stereo Spread)
// ============================================================================

/**
 * Width state (M/S processing).
 */
export interface WidthState {
  readonly id: string;
  readonly width: number;       // 0 = mono, 1 = normal, 2 = extra wide
  readonly midGain: number;     // dB
  readonly sideGain: number;    // dB
  readonly monoBelow: number;   // Hz (make frequencies below this mono)
}

/**
 * Default width state.
 */
export const DEFAULT_WIDTH_STATE: WidthState = {
  id: 'width-1',
  width: 1,
  midGain: 0,
  sideGain: 0,
  monoBelow: 0,
};

/**
 * Convert stereo to mid/side.
 */
export function stereoToMidSide(sample: StereoSample): { mid: number; side: number } {
  return {
    mid: (sample.left + sample.right) * 0.5,
    side: (sample.left - sample.right) * 0.5,
  };
}

/**
 * Convert mid/side to stereo.
 */
export function midSideToStereo(mid: number, side: number): StereoSample {
  return {
    left: mid + side,
    right: mid - side,
  };
}

/**
 * Process width.
 */
export function processWidth(sample: StereoSample, state: WidthState): StereoSample {
  const { mid, side } = stereoToMidSide(sample);
  
  const midGainLinear = Math.pow(10, state.midGain / 20);
  const sideGainLinear = Math.pow(10, state.sideGain / 20);
  
  const processedMid = mid * midGainLinear;
  const processedSide = side * sideGainLinear * state.width;
  
  return midSideToStereo(processedMid, processedSide);
}

// ============================================================================
// NORMALIZE (Peak Normalize)
// ============================================================================

/**
 * Normalize mode.
 */
export type NormalizeMode = 'peak' | 'rms' | 'lufs';

/**
 * Normalize state.
 */
export interface NormalizeState {
  readonly id: string;
  readonly targetLevel: number;  // dB
  readonly mode: NormalizeMode;
  readonly ceiling: number;      // dB (max allowed level)
  readonly enabled: boolean;
}

/**
 * Default normalize state.
 */
export const DEFAULT_NORMALIZE_STATE: NormalizeState = {
  id: 'normalize-1',
  targetLevel: -1,
  mode: 'peak',
  ceiling: -0.1,
  enabled: true,
};

/**
 * Calculate peak level of buffer.
 */
export function calculatePeakLevel(samples: readonly number[]): number {
  let peak = 0;
  for (const sample of samples) {
    const abs = Math.abs(sample);
    if (abs > peak) peak = abs;
  }
  return peak > 0 ? 20 * Math.log10(peak) : -Infinity;
}

/**
 * Calculate RMS level of buffer.
 */
export function calculateRMSLevel(samples: readonly number[]): number {
  if (samples.length === 0) return -Infinity;
  
  let sumSquares = 0;
  for (const sample of samples) {
    sumSquares += sample * sample;
  }
  const rms = Math.sqrt(sumSquares / samples.length);
  return rms > 0 ? 20 * Math.log10(rms) : -Infinity;
}

/**
 * Calculate normalization gain.
 */
export function calculateNormalizationGain(
  currentLevel: number,
  targetLevel: number,
  ceiling: number
): number {
  if (currentLevel === -Infinity) return 0;
  
  const neededGain = targetLevel - currentLevel;
  const maxAllowedGain = ceiling - currentLevel;
  
  return Math.min(neededGain, maxAllowedGain);
}

// ============================================================================
// FADE (In/Out Curves)
// ============================================================================

/**
 * Fade curve type.
 */
export type FadeCurve = 'linear' | 'exponential' | 'logarithmic' | 's-curve' | 'equal-power';

/**
 * Fade type.
 */
export type FadeType = 'in' | 'out';

/**
 * Fade state.
 */
export interface FadeState {
  readonly id: string;
  readonly type: FadeType;
  readonly curve: FadeCurve;
  readonly duration: number;  // samples or ms
  readonly enabled: boolean;
}

/**
 * Default fade state.
 */
export const DEFAULT_FADE_STATE: FadeState = {
  id: 'fade-1',
  type: 'in',
  curve: 'linear',
  duration: 100,
  enabled: true,
};

/**
 * Calculate fade gain at position.
 */
export function calculateFadeGain(
  position: number,
  duration: number,
  type: FadeType,
  curve: FadeCurve
): number {
  if (position <= 0) return type === 'in' ? 0 : 1;
  if (position >= duration) return type === 'in' ? 1 : 0;
  
  let t = position / duration;
  if (type === 'out') t = 1 - t;
  
  let curved: number;
  switch (curve) {
    case 'linear':
      curved = t;
      break;
    case 'exponential':
      curved = t * t;
      break;
    case 'logarithmic':
      curved = Math.sqrt(t);
      break;
    case 's-curve':
      curved = t * t * (3 - 2 * t);
      break;
    case 'equal-power':
      curved = Math.sin(t * Math.PI * 0.5);
      break;
    default:
      curved = t;
  }
  
  return type === 'out' ? 1 - curved : curved;
}

// ============================================================================
// BALANCE (L/R Adjust)
// ============================================================================

/**
 * Balance state (L/R level adjust).
 */
export interface BalanceState {
  readonly id: string;
  readonly balance: number;  // -1 (left) to 1 (right)
  readonly law: PanLaw;      // Balance law (same options as pan)
}

/**
 * Default balance state.
 */
export const DEFAULT_BALANCE_STATE: BalanceState = {
  id: 'balance-1',
  balance: 0,
  law: 'constant-power',
};

/**
 * Set balance.
 */
export function setBalance(state: BalanceState, balance: number): BalanceState {
  return {
    ...state,
    balance: Math.max(-1, Math.min(1, balance)),
  };
}

/**
 * Process balance (adjusts L/R independently).
 */
export function processBalance(sample: StereoSample, state: BalanceState): StereoSample {
  // Balance affects L/R levels independently (not panning)
  const b = state.balance;
  
  if (b === 0) return sample;
  
  // Negative balance reduces right, positive balance reduces left
  const leftGain = b > 0 ? 1 - b : 1;
  const rightGain = b < 0 ? 1 + b : 1;
  
  return {
    left: sample.left * leftGain,
    right: sample.right * rightGain,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const UtilityCards = {
  // Splitter
  createSplitter,
  addSplitterOutput,
  setSplitterOutputGain,
  toggleSplitterOutputMute,
  processSplitter,
  
  // Mixer
  createMixer,
  addMixerInput,
  setMixerInputGain,
  setMixerInputPan,
  toggleMixerInputMute,
  toggleMixerInputSolo,
  processMixer,
  
  // Crossfade
  calculateCrossfadeGains,
  processCrossfade,
  setCrossfadeBlend,
  startAutoFade,
  updateAutoFade,
  
  // Switch
  toggleSwitch,
  setSwitch,
  updateSwitchTransition,
  processSwitch,
  
  // Bypass
  toggleBypass,
  updateBypassFade,
  getBypassGain,
  
  // Mute
  toggleMute,
  updateMuteFade,
  getMuteGain,
  
  // Solo
  addSoloChannel,
  toggleChannelSolo,
  isAnySoloed,
  getSoloGain,
  
  // Gain
  setGain,
  getLinearGain,
  processGain,
  
  // Pan
  setPan,
  calculatePanGains,
  processPan,
  
  // Balance
  setBalance,
  processBalance,
  
  // Width
  stereoToMidSide,
  midSideToStereo,
  processWidth,
  
  // Normalize
  calculatePeakLevel,
  calculateRMSLevel,
  calculateNormalizationGain,
  
  // Fade
  calculateFadeGain,
} as const;
