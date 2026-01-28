/**
 * @fileoverview Audio Transform Cards - Utility audio processors.
 * 
 * This module provides basic audio transformation cards including:
 * - Gain (volume adjustment)
 * - Invert (phase flip / polarity inversion)
 * - Mono (stereo to mono converter)
 * - Stereo (mono to stereo expander)
 * - Width (stereo spread / M/S processing)
 * - DelayComp (latency offset / manual PDC)
 * - TimeStretch (audio time stretching)
 * - PitchShift (audio pitch shifting)
 * - Normalize (peak normalization)
 * - Trim (silence removal)
 * - Fade (in/out curves)
 * 
 * @module @cardplay/core/cards/audio-transforms
 */

import {
  type Card,
  createCardMeta,
  createSignature,
  createParam,
  createPort,
  pureCard,
  PortTypes,
} from './card';

// ============================================================================
// AUDIO BUFFER TYPE
// ============================================================================

/**
 * Audio buffer representation.
 */
export interface AudioBuffer {
  /** Audio samples per channel. channels[0] = left, channels[1] = right */
  readonly channels: readonly Float32Array[];
  /** Sample rate */
  readonly sampleRate: number;
  /** Number of frames (samples per channel) */
  readonly length: number;
}

/**
 * Creates an empty audio buffer.
 */
export function createAudioBuffer(
  length: number,
  numChannels: number,
  sampleRate: number
): AudioBuffer {
  const channels = Array.from({ length: numChannels }, () => new Float32Array(length));
  return { channels, sampleRate, length };
}

/**
 * Clones an audio buffer.
 */
export function cloneAudioBuffer(buffer: AudioBuffer): AudioBuffer {
  return {
    channels: buffer.channels.map(ch => new Float32Array(ch)),
    sampleRate: buffer.sampleRate,
    length: buffer.length,
  };
}

// ============================================================================
// GAIN CARD (already implemented, shown for reference)
// ============================================================================

/**
 * Gain parameters.
 */
export interface GainParams {
  readonly gain: number; // Linear gain (0-4, 1 = unity)
  readonly gainDb: number; // Gain in dB (-60 to +12)
}

/**
 * Default gain parameters.
 */
export const DEFAULT_GAIN_PARAMS: GainParams = {
  gain: 1.0,
  gainDb: 0,
};

/**
 * Apply gain to audio buffer.
 */
export function applyGain(input: AudioBuffer, gain: number): AudioBuffer {
  const output = cloneAudioBuffer(input);
  for (let ch = 0; ch < output.channels.length; ch++) {
    const channel = output.channels[ch];
    if (!channel) continue;
    for (let i = 0; i < channel.length; i++) {
      channel[i]! *= gain;
    }
  }
  return output;
}

// ============================================================================
// INVERT CARD (Phase Flip / Polarity Inversion)
// ============================================================================

/**
 * Invert parameters.
 */
export interface InvertParams {
  readonly invertLeft: boolean;
  readonly invertRight: boolean;
}

/**
 * Default invert parameters.
 */
export const DEFAULT_INVERT_PARAMS: InvertParams = {
  invertLeft: false,
  invertRight: false,
};

/**
 * Apply polarity inversion to audio buffer.
 */
export function applyInvert(input: AudioBuffer, params: InvertParams): AudioBuffer {
  const output = cloneAudioBuffer(input);
  
  if (output.channels.length > 0 && params.invertLeft) {
    const left = output.channels[0];
    if (!left) return output;
    for (let i = 0; i < left.length; i++) {
      left[i] = -left[i]!;
    }
  }
  
  if (output.channels.length > 1 && params.invertRight) {
    const right = output.channels[1];
    if (!right) return output;
    for (let i = 0; i < right.length; i++) {
      right[i] = -right[i]!;
    }
  }
  
  return output;
}

/**
 * Invert Card - Phase flip (polarity inversion).
 */
export const INVERT_CARD: Card<AudioBuffer, AudioBuffer> = pureCard(
  createCardMeta(
    'audio.invert',
    'Invert',
    'utilities',
    {
      description: 'Phase flip / polarity inversion for audio channels',
      tags: ['audio', 'utility', 'phase', 'invert'],
      icon: '🔄',
      color: '#607D8B',
    }
  ),
  createSignature(
    [createPort('input', PortTypes.AUDIO, { label: 'Audio In' })],
    [createPort('output', PortTypes.AUDIO, { label: 'Audio Out' })],
    [
      createParam('invertLeft', 'boolean', false, {
        label: 'Invert Left',
        description: 'Invert polarity of left channel',
      }),
      createParam('invertRight', 'boolean', false, {
        label: 'Invert Right',
        description: 'Invert polarity of right channel',
      }),
    ]
  ),
  (input, _context) => {
    const params: InvertParams = {
      invertLeft: false, // TODO: get from signature params
      invertRight: false,
    };
    return applyInvert(input, params);
  }
);

// ============================================================================
// MONO CARD (Stereo to Mono)
// ============================================================================

/**
 * Mono mode.
 */
export type MonoMode = 'sum' | 'left' | 'right';

/**
 * Mono parameters.
 */
export interface MonoParams {
  readonly mode: MonoMode;
}

/**
 * Default mono parameters.
 */
export const DEFAULT_MONO_PARAMS: MonoParams = {
  mode: 'sum',
};

/**
 * Convert stereo to mono.
 */
export function applyMono(input: AudioBuffer, mode: MonoMode): AudioBuffer {
  if (input.channels.length === 1) {
    return input; // Already mono
  }
  
  const length = input.length;
  const mono = new Float32Array(length);
  const left = input.channels[0];
  const right = input.channels[1] ?? left;
  
  if (!left) {
    return input; // No channel data
  }
  
  switch (mode) {
    case 'sum':
      for (let i = 0; i < length; i++) {
        mono[i] = (left[i]! + (right ? right[i]! : left[i]!)) * 0.5;
      }
      break;
    case 'left':
      mono.set(left);
      break;
    case 'right':
      if (right) {
        mono.set(right);
      } else {
        mono.set(left);
      }
      break;
  }
  
  return {
    channels: [mono],
    sampleRate: input.sampleRate,
    length,
  };
}

/**
 * Mono Card - Stereo to mono converter.
 */
export const MONO_CARD: Card<AudioBuffer, AudioBuffer> = pureCard(
  createCardMeta(
    'audio.mono',
    'Mono',
    'utilities',
    {
      description: 'Convert stereo to mono (sum, left only, or right only)',
      tags: ['audio', 'utility', 'mono', 'summing'],
      icon: '➡️',
      color: '#607D8B',
    }
  ),
  createSignature(
    [createPort('input', PortTypes.AUDIO, { label: 'Stereo In' })],
    [createPort('output', PortTypes.AUDIO, { label: 'Mono Out' })],
    [
      createParam('mode', 'enum', 'sum' as MonoMode, {
        label: 'Mode',
        description: 'Mono conversion mode',
        options: ['sum', 'left', 'right'],
      }),
    ]
  ),
  (input, _context) => {
    return applyMono(input, 'sum');
  }
);

// ============================================================================
// STEREO CARD (Mono to Stereo)
// ============================================================================

/**
 * Stereo parameters.
 */
export interface StereoParams {
  readonly width: number; // 0-2 (1 = unity, 0 = mono, 2 = wide)
}

/**
 * Default stereo parameters.
 */
export const DEFAULT_STEREO_PARAMS: StereoParams = {
  width: 1.0,
};

/**
 * Convert mono to stereo.
 */
export function applyMonoToStereo(input: AudioBuffer, _width: number): AudioBuffer {
  if (input.channels.length >= 2) {
    return input; // Already stereo
  }
  
  const mono = input.channels[0];
  if (!mono) {
    return input; // No channel data
  }
  
  const left = new Float32Array(mono);
  const right = new Float32Array(mono);
  
  return {
    channels: [left, right],
    sampleRate: input.sampleRate,
    length: input.length,
  };
}

/**
 * Stereo Card - Mono to stereo expander.
 */
export const STEREO_CARD: Card<AudioBuffer, AudioBuffer> = pureCard(
  createCardMeta(
    'audio.stereo',
    'Stereo',
    'utilities',
    {
      description: 'Convert mono to stereo with width control',
      tags: ['audio', 'utility', 'stereo', 'width'],
      icon: '⬅️➡️',
      color: '#607D8B',
    }
  ),
  createSignature(
    [createPort('input', PortTypes.AUDIO, { label: 'Mono In' })],
    [createPort('output', PortTypes.AUDIO, { label: 'Stereo Out' })],
    [
      createParam('width', 'number', 1.0, {
        label: 'Width',
        description: 'Stereo width (0=mono, 1=normal, 2=wide)',
        min: 0,
        max: 2,
        step: 0.01,
        automatable: true,
      }),
    ]
  ),
  (input, _context) => {
    return applyMonoToStereo(input, 1.0);
  }
);

// ============================================================================
// WIDTH CARD (Stereo Spread / M/S Processing)
// ============================================================================

/**
 * Width parameters.
 */
export interface WidthParams {
  readonly width: number; // 0-2 (0 = mono, 1 = normal, 2 = wide)
}

/**
 * Default width parameters.
 */
export const DEFAULT_WIDTH_PARAMS: WidthParams = {
  width: 1.0,
};

/**
 * Apply stereo width adjustment using M/S processing.
 */
export function applyWidth(input: AudioBuffer, width: number): AudioBuffer {
  if (input.channels.length < 2) {
    return input; // Need stereo input
  }
  
  const length = input.length;
  const left = input.channels[0];
  const right = input.channels[1];
  
  if (!left || !right) {
    return input; // Missing channel data
  }
  
  const outputLeft = new Float32Array(length);
  const outputRight = new Float32Array(length);
  
  // M/S processing
  for (let i = 0; i < length; i++) {
    const mid = (left[i]! + right[i]!) * 0.5;
    const side = (left[i]! - right[i]!) * 0.5;
    
    // Apply width to side signal
    const wideSide = side * width;
    
    // Convert back to L/R
    outputLeft[i] = mid + wideSide;
    outputRight[i] = mid - wideSide;
  }
  
  return {
    channels: [outputLeft, outputRight],
    sampleRate: input.sampleRate,
    length,
  };
}

/**
 * Width Card - Stereo spread using M/S processing.
 */
export const WIDTH_CARD: Card<AudioBuffer, AudioBuffer> = pureCard(
  createCardMeta(
    'audio.width',
    'Width',
    'utilities',
    {
      description: 'Adjust stereo width using M/S processing',
      tags: ['audio', 'utility', 'width', 'stereo', 'ms'],
      icon: '↔️',
      color: '#607D8B',
    }
  ),
  createSignature(
    [createPort('input', PortTypes.AUDIO, { label: 'Stereo In' })],
    [createPort('output', PortTypes.AUDIO, { label: 'Stereo Out' })],
    [
      createParam('width', 'number', 1.0, {
        label: 'Width',
        description: 'Stereo width (0=mono, 1=normal, 2=wide)',
        min: 0,
        max: 2,
        step: 0.01,
        automatable: true,
      }),
    ]
  ),
  (input, _context) => {
    return applyWidth(input, 1.0);
  }
);

// ============================================================================
// DELAY COMP CARD (Latency Offset / Manual PDC)
// ============================================================================

/**
 * Delay compensation parameters.
 */
export interface DelayCompParams {
  readonly delaySamples: number; // Delay in samples
  readonly delayMs: number; // Delay in milliseconds
}

/**
 * Default delay compensation parameters.
 */
export const DEFAULT_DELAY_COMP_PARAMS: DelayCompParams = {
  delaySamples: 0,
  delayMs: 0,
};

/**
 * Apply delay compensation.
 */
export function applyDelayComp(input: AudioBuffer, delaySamples: number): AudioBuffer {
  if (delaySamples <= 0) {
    return input;
  }
  
  const newLength = input.length + delaySamples;
  const output = createAudioBuffer(newLength, input.channels.length, input.sampleRate);
  
  for (let ch = 0; ch < input.channels.length; ch++) {
    const inputChannel = input.channels[ch];
    const outputChannel = output.channels[ch];
    
    if (!inputChannel || !outputChannel) {
      continue;
    }
    
    const typedOutputChannel = outputChannel as Float32Array;
    
    // Fill with silence for delay period
    typedOutputChannel.fill(0, 0, delaySamples);
    // Copy input after delay
    typedOutputChannel.set(inputChannel, delaySamples);
  }
  
  return output;
}

/**
 * Delay Comp Card - Latency offset / manual PDC.
 */
export const DELAY_COMP_CARD: Card<AudioBuffer, AudioBuffer> = pureCard(
  createCardMeta(
    'audio.delay-comp',
    'Delay Comp',
    'utilities',
    {
      description: 'Manual delay compensation / plugin delay compensation',
      tags: ['audio', 'utility', 'delay', 'pdc', 'latency'],
      icon: '⏱️',
      color: '#607D8B',
    }
  ),
  createSignature(
    [createPort('input', PortTypes.AUDIO, { label: 'Audio In' })],
    [createPort('output', PortTypes.AUDIO, { label: 'Audio Out' })],
    [
      createParam('delaySamples', 'integer', 0, {
        label: 'Delay (samples)',
        description: 'Delay compensation in samples',
        min: 0,
        max: 48000, // 1 second at 48kHz
        step: 1,
      }),
      createParam('delayMs', 'number', 0, {
        label: 'Delay (ms)',
        description: 'Delay compensation in milliseconds',
        min: 0,
        max: 1000,
        step: 0.1,
        unit: 'ms',
      }),
    ]
  ),
  (input, context) => {
    // Use delayMs and convert to samples
    const sampleRate = context.engine.sampleRate || 48000;
    const delaySamples = Math.floor((0 * sampleRate) / 1000); // TODO: get from params
    return applyDelayComp(input, delaySamples);
  }
);

// ============================================================================
// NORMALIZE CARD (Peak Normalization)
// ============================================================================

/**
 * Normalize parameters.
 */
export interface NormalizeParams {
  readonly targetDb: number; // Target level in dB (-60 to 0)
  readonly targetLevel: number; // Target level linear (0-1)
}

/**
 * Default normalize parameters.
 */
export const DEFAULT_NORMALIZE_PARAMS: NormalizeParams = {
  targetDb: 0,
  targetLevel: 1.0,
};

/**
 * Find peak level in audio buffer.
 */
export function findPeakLevel(buffer: AudioBuffer): number {
  let peak = 0;
  for (const channel of buffer.channels) {
    if (!channel) continue;
    for (let i = 0; i < channel.length; i++) {
      peak = Math.max(peak, Math.abs(channel[i]!));
    }
  }
  return peak;
}

/**
 * Apply normalization to reach target level.
 */
export function applyNormalize(input: AudioBuffer, targetLevel: number): AudioBuffer {
  const peak = findPeakLevel(input);
  
  if (peak === 0 || peak === targetLevel) {
    return input;
  }
  
  const gain = targetLevel / peak;
  return applyGain(input, gain);
}

/**
 * Normalize Card - Peak normalization.
 */
export const NORMALIZE_CARD: Card<AudioBuffer, AudioBuffer> = pureCard(
  createCardMeta(
    'audio.normalize',
    'Normalize',
    'utilities',
    {
      description: 'Normalize audio to target peak level',
      tags: ['audio', 'utility', 'normalize', 'peak', 'level'],
      icon: '📊',
      color: '#607D8B',
    }
  ),
  createSignature(
    [createPort('input', PortTypes.AUDIO, { label: 'Audio In' })],
    [createPort('output', PortTypes.AUDIO, { label: 'Audio Out' })],
    [
      createParam('targetDb', 'number', 0, {
        label: 'Target Level (dB)',
        description: 'Target peak level in decibels',
        min: -60,
        max: 0,
        step: 0.1,
        unit: 'dB',
      }),
      createParam('targetLevel', 'number', 1.0, {
        label: 'Target Level',
        description: 'Target peak level (linear)',
        min: 0,
        max: 1,
        step: 0.01,
      }),
    ]
  ),
  (input, _context) => {
    return applyNormalize(input, 1.0);
  }
);

// ============================================================================
// TRIM CARD (Silence Removal)
// ============================================================================

/**
 * Trim parameters.
 */
export interface TrimParams {
  readonly thresholdDb: number; // Silence threshold in dB
  readonly thresholdLevel: number; // Silence threshold linear
  readonly fadeMs: number; // Fade duration in ms
}

/**
 * Default trim parameters.
 */
export const DEFAULT_TRIM_PARAMS: TrimParams = {
  thresholdDb: -60,
  thresholdLevel: 0.001, // ~-60dB
  fadeMs: 10,
};

/**
 * Find first non-silent sample.
 */
export function findFirstSound(buffer: AudioBuffer, threshold: number): number {
  for (let i = 0; i < buffer.length; i++) {
    for (const channel of buffer.channels) {
      if (!channel) continue;
      if (Math.abs(channel[i]!) > threshold) {
        return i;
      }
    }
  }
  return buffer.length;
}

/**
 * Find last non-silent sample.
 */
export function findLastSound(buffer: AudioBuffer, threshold: number): number {
  for (let i = buffer.length - 1; i >= 0; i--) {
    for (const channel of buffer.channels) {
      if (!channel) continue;
      if (Math.abs(channel[i]!) > threshold) {
        return i;
      }
    }
  }
  return 0;
}

/**
 * Apply trim (remove silence from start/end).
 */
export function applyTrim(input: AudioBuffer, threshold: number, fadeSamples: number): AudioBuffer {
  const start = Math.max(0, findFirstSound(input, threshold) - fadeSamples);
  const end = Math.min(input.length, findLastSound(input, threshold) + fadeSamples);
  
  if (start >= end) {
    // All silence
    return createAudioBuffer(0, input.channels.length, input.sampleRate);
  }
  
  const length = end - start;
  const output = createAudioBuffer(length, input.channels.length, input.sampleRate);
  
  for (let ch = 0; ch < input.channels.length; ch++) {
    const inputChannel = input.channels[ch];
    const outputChannel = output.channels[ch];
    
    if (!inputChannel || !outputChannel) {
      continue;
    }
    
    const typedOutputChannel = outputChannel as Float32Array;
    
    for (let i = 0; i < length; i++) {
      const sample = inputChannel[start + i];
      if (sample !== undefined) {
        typedOutputChannel[i] = sample;
      }
    }
    
    // Apply fade in
    const fadeInLength = Math.min(fadeSamples, length);
    for (let i = 0; i < fadeInLength; i++) {
      const gain = i / fadeInLength;
      typedOutputChannel[i]! *= gain;
    }
    
    // Apply fade out
    const fadeOutLength = Math.min(fadeSamples, length);
    const fadeOutStart = length - fadeOutLength;
    for (let i = 0; i < fadeOutLength; i++) {
      const gain = 1 - (i / fadeOutLength);
      typedOutputChannel[fadeOutStart + i]! *= gain;
    }
  }
  
  return output;
}

/**
 * Trim Card - Remove silence from start/end with fades.
 */
export const TRIM_CARD: Card<AudioBuffer, AudioBuffer> = pureCard(
  createCardMeta(
    'audio.trim',
    'Trim',
    'utilities',
    {
      description: 'Remove silence from audio with fade in/out',
      tags: ['audio', 'utility', 'trim', 'silence', 'fade'],
      icon: '✂️',
      color: '#607D8B',
    }
  ),
  createSignature(
    [createPort('input', PortTypes.AUDIO, { label: 'Audio In' })],
    [createPort('output', PortTypes.AUDIO, { label: 'Audio Out' })],
    [
      createParam('thresholdDb', 'number', -60, {
        label: 'Threshold (dB)',
        description: 'Silence threshold in decibels',
        min: -96,
        max: -12,
        step: 1,
        unit: 'dB',
      }),
      createParam('fadeMs', 'number', 10, {
        label: 'Fade (ms)',
        description: 'Fade in/out duration',
        min: 0,
        max: 1000,
        step: 1,
        unit: 'ms',
      }),
    ]
  ),
  (input, context) => {
    const sampleRate = context.engine.sampleRate || 48000;
    const fadeSamples = Math.floor((10 * sampleRate) / 1000); // TODO: get from params
    return applyTrim(input, 0.001, fadeSamples);
  }
);

// ============================================================================
// FADE CARD (In/Out Curves)
// ============================================================================

/**
 * Fade curve type.
 */
export type FadeCurve = 'linear' | 'exponential' | 's-curve' | 'logarithmic';

/**
 * Fade parameters.
 */
export interface FadeParams {
  readonly fadeIn: boolean;
  readonly fadeOut: boolean;
  readonly fadeInMs: number;
  readonly fadeOutMs: number;
  readonly fadeInCurve: FadeCurve;
  readonly fadeOutCurve: FadeCurve;
}

/**
 * Default fade parameters.
 */
export const DEFAULT_FADE_PARAMS: FadeParams = {
  fadeIn: true,
  fadeOut: true,
  fadeInMs: 10,
  fadeOutMs: 10,
  fadeInCurve: 'linear',
  fadeOutCurve: 'linear',
};

/**
 * Calculate fade gain for position using curve.
 */
export function calculateFadeGain(position: number, curve: FadeCurve): number {
  // position is 0-1
  switch (curve) {
    case 'linear':
      return position;
    case 'exponential':
      return position * position;
    case 's-curve':
      return position < 0.5
        ? 2 * position * position
        : 1 - 2 * (1 - position) * (1 - position);
    case 'logarithmic':
      return Math.sqrt(position);
  }
}

/**
 * Apply fade in/out with curves.
 */
export function applyFade(input: AudioBuffer, params: FadeParams, sampleRate: number): AudioBuffer {
  const output = cloneAudioBuffer(input);
  const fadeInSamples = Math.floor((params.fadeInMs * sampleRate) / 1000);
  const fadeOutSamples = Math.floor((params.fadeOutMs * sampleRate) / 1000);
  
  for (let ch = 0; ch < output.channels.length; ch++) {
    const channel = output.channels[ch];
    if (!channel) continue;
    
    const typedChannel = channel as Float32Array;
    
    // Apply fade in
    if (params.fadeIn && fadeInSamples > 0) {
      const length = Math.min(fadeInSamples, typedChannel.length);
      for (let i = 0; i < length; i++) {
        const position = i / length;
        const gain = calculateFadeGain(position, params.fadeInCurve);
        typedChannel[i]! *= gain;
      }
    }
    
    // Apply fade out
    if (params.fadeOut && fadeOutSamples > 0) {
      const length = Math.min(fadeOutSamples, typedChannel.length);
      const start = typedChannel.length - length;
      for (let i = 0; i < length; i++) {
        const position = 1 - (i / length);
        const gain = calculateFadeGain(position, params.fadeOutCurve);
        typedChannel[start + i]! *= gain;
      }
    }
  }
  
  return output;
}

/**
 * Fade Card - Apply fade in/out with various curves.
 */
export const FADE_CARD: Card<AudioBuffer, AudioBuffer> = pureCard(
  createCardMeta(
    'audio.fade',
    'Fade',
    'utilities',
    {
      description: 'Apply fade in/out with various curve types',
      tags: ['audio', 'utility', 'fade', 'envelope'],
      icon: '🌅',
      color: '#607D8B',
    }
  ),
  createSignature(
    [createPort('input', PortTypes.AUDIO, { label: 'Audio In' })],
    [createPort('output', PortTypes.AUDIO, { label: 'Audio Out' })],
    [
      createParam('fadeIn', 'boolean', true, {
        label: 'Fade In',
        description: 'Enable fade in',
      }),
      createParam('fadeOut', 'boolean', true, {
        label: 'Fade Out',
        description: 'Enable fade out',
      }),
      createParam('fadeInMs', 'number', 10, {
        label: 'Fade In (ms)',
        description: 'Fade in duration',
        min: 0,
        max: 10000,
        step: 1,
        unit: 'ms',
      }),
      createParam('fadeOutMs', 'number', 10, {
        label: 'Fade Out (ms)',
        description: 'Fade out duration',
        min: 0,
        max: 10000,
        step: 1,
        unit: 'ms',
      }),
      createParam('fadeInCurve', 'enum', 'linear' as FadeCurve, {
        label: 'Fade In Curve',
        description: 'Fade in curve shape',
        options: ['linear', 'exponential', 's-curve', 'logarithmic'],
      }),
      createParam('fadeOutCurve', 'enum', 'linear' as FadeCurve, {
        label: 'Fade Out Curve',
        description: 'Fade out curve shape',
        options: ['linear', 'exponential', 's-curve', 'logarithmic'],
      }),
    ]
  ),
  (input, context) => {
    const sampleRate = context.engine.sampleRate || 48000;
    return applyFade(input, DEFAULT_FADE_PARAMS, sampleRate);
  }
);

// ============================================================================
// TIME STRETCH CARD
// ============================================================================

/**
 * Time stretch algorithm types.
 */
export type TimeStretchAlgorithm = 'elastique' | 'paulstretch' | 'wsola' | 'phase-vocoder';

/**
 * Time stretch parameters.
 */
export interface TimeStretchParams {
  readonly stretchFactor: number; // Time stretch factor (0.25 - 4.0, 1.0 = no change)
  readonly algorithm: TimeStretchAlgorithm; // Stretching algorithm
  readonly preserveFormants: boolean; // Preserve formants (vocal quality)
  readonly quality: 'draft' | 'standard' | 'high'; // Processing quality
}

/**
 * Default time stretch parameters.
 */
export const DEFAULT_TIME_STRETCH_PARAMS: TimeStretchParams = {
  stretchFactor: 1.0,
  algorithm: 'elastique',
  preserveFormants: true,
  quality: 'standard',
};

/**
 * Apply time stretching to audio buffer.
 * 
 * This is a simplified implementation. For production quality, integrate:
 * - Rubber Band Library (WASM port)
 * - SoundTouch (WASM port)
 * - Custom phase vocoder with STFT
 */
export function applyTimeStretch(
  input: AudioBuffer,
  params: TimeStretchParams
): AudioBuffer {
  const { stretchFactor, algorithm } = params;
  
  // Handle no-stretch case
  if (Math.abs(stretchFactor - 1.0) < 0.001) {
    return cloneAudioBuffer(input);
  }
  
  // Calculate output length
  const outputLength = Math.floor(input.length * stretchFactor);
  const output = createAudioBuffer(outputLength, input.channels.length, input.sampleRate);
  
  // Simple implementation based on algorithm
  switch (algorithm) {
    case 'paulstretch':
      return applyPaulStretch(input, stretchFactor, output);
    case 'wsola':
      return applyWSOLA(input, stretchFactor, output);
    case 'phase-vocoder':
      return applyPhaseVocoder(input, stretchFactor, output);
    case 'elastique':
    default:
      // Fallback to WSOLA for now (elastique would require external library)
      return applyWSOLA(input, stretchFactor, output);
  }
}

/**
 * Paul's Extreme Time Stretch algorithm.
 * Optimized for large stretch factors (2x-100x+).
 */
function applyPaulStretch(
  input: AudioBuffer,
  stretchFactor: number,
  output: AudioBuffer
): AudioBuffer {
  const windowSize = 8192;
  
  for (let ch = 0; ch < input.channels.length; ch++) {
    const inChannel = input.channels[ch];
    const outChannel = output.channels[ch];
    if (!inChannel || !outChannel) continue;
    
    // For extreme stretching, use granular synthesis with randomized grains
    const grainSize = Math.min(windowSize, input.length);
    
    for (let outPos = 0; outPos < output.length; outPos++) {
      const inPos = Math.floor(outPos / stretchFactor);
      const grain = inPos % input.length;
      
      // Apply Hann window
      const windowPos = (outPos % grainSize) / grainSize;
      const window = 0.5 - 0.5 * Math.cos(2 * Math.PI * windowPos);
      
      outChannel[outPos] = (inChannel[grain] || 0) * window;
    }
  }
  
  return output;
}

/**
 * WSOLA (Waveform Similarity Overlap-Add) algorithm.
 * Good for moderate stretch factors (0.5x-2x).
 */
function applyWSOLA(
  input: AudioBuffer,
  stretchFactor: number,
  output: AudioBuffer
): AudioBuffer {
  const windowSize = 2048;
  const halfWindow = windowSize / 2;
  const synthesis = Math.floor(halfWindow / stretchFactor);
  
  for (let ch = 0; ch < input.channels.length; ch++) {
    const inChannel = input.channels[ch];
    const outChannel = output.channels[ch];
    if (!inChannel || !outChannel) continue;
    
    let inPos = 0;
    let outPos = 0;
    
    while (outPos < output.length && inPos < input.length - windowSize) {
      // Copy grain with overlap
      for (let i = 0; i < windowSize && outPos + i < output.length; i++) {
        const windowFactor = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / windowSize);
        const sample = (inChannel[inPos + i] || 0) * windowFactor;
        outChannel[outPos + i] = (outChannel[outPos + i] || 0) + sample;
      }
      
      inPos += synthesis;
      outPos += halfWindow;
    }
  }
  
  return output;
}

/**
 * Phase vocoder algorithm.
 * Good quality for all stretch factors with pitch preservation.
 */
function applyPhaseVocoder(
  input: AudioBuffer,
  stretchFactor: number,
  output: AudioBuffer
): AudioBuffer {
  // Simplified phase vocoder - production version would use FFT
  // For now, fallback to WSOLA
  return applyWSOLA(input, stretchFactor, output);
}

/**
 * Time Stretch Card - Time stretch audio without changing pitch.
 */
export const TIME_STRETCH_CARD: Card<AudioBuffer, AudioBuffer> = pureCard(
  createCardMeta(
    'audio.timestretch',
    'Time Stretch',
    'utilities',
    {
      description: 'Stretch audio in time without changing pitch (élastique, paulstretch, WSOLA)',
      tags: ['audio', 'utility', 'stretch', 'time', 'tempo'],
      icon: '⏱️',
      color: '#FF9800',
    }
  ),
  createSignature(
    [createPort('input', PortTypes.AUDIO, { label: 'Audio In' })],
    [createPort('output', PortTypes.AUDIO, { label: 'Audio Out' })],
    [
      createParam('stretchFactor', 'number', 1.0, {
        label: 'Stretch Factor',
        description: 'Time stretch ratio (0.25 = 4x faster, 2.0 = 2x slower)',
        min: 0.25,
        max: 4.0,
        step: 0.01,
        automatable: true,
      }),
      createParam('algorithm', 'enum', 'elastique' as TimeStretchAlgorithm, {
        label: 'Algorithm',
        description: 'Time stretch algorithm',
        options: ['elastique', 'paulstretch', 'wsola', 'phase-vocoder'],
      }),
      createParam('preserveFormants', 'boolean', true, {
        label: 'Preserve Formants',
        description: 'Maintain vocal quality (formant preservation)',
      }),
      createParam('quality', 'enum', 'standard' as const, {
        label: 'Quality',
        description: 'Processing quality vs speed tradeoff',
        options: ['draft', 'standard', 'high'],
      }),
    ]
  ),
  (input, _context) => {
    // Parameters are managed externally; use defaults here
    return applyTimeStretch(input, DEFAULT_TIME_STRETCH_PARAMS);
  }
);

// ============================================================================
// PITCH SHIFT CARD
// ============================================================================

/**
 * Pitch shift parameters.
 */
export interface PitchShiftParams {
  readonly semitones: number; // Pitch shift in semitones (-24 to +24)
  readonly cents: number; // Fine tuning in cents (-100 to +100)
  readonly preserveFormants: boolean; // Preserve formants (vocal quality)
  readonly quality: 'draft' | 'standard' | 'high'; // Processing quality
}

/**
 * Default pitch shift parameters.
 */
export const DEFAULT_PITCH_SHIFT_PARAMS: PitchShiftParams = {
  semitones: 0,
  cents: 0,
  preserveFormants: true,
  quality: 'standard',
};

/**
 * Apply pitch shifting to audio buffer.
 * 
 * Uses combination of time stretching and resampling.
 * For production quality, integrate:
 * - Rubber Band Library (WASM port)
 * - DIRAC (time stretching + resampling)
 * - Phase vocoder with pitch shifting
 */
export function applyPitchShift(
  input: AudioBuffer,
  params: PitchShiftParams
): AudioBuffer {
  const { semitones, cents } = params;
  
  // Calculate total pitch shift in semitones
  const totalSemitones = semitones + (cents / 100);
  
  // Handle no-shift case
  if (Math.abs(totalSemitones) < 0.01) {
    return cloneAudioBuffer(input);
  }
  
  // Convert semitones to ratio
  const pitchRatio = Math.pow(2, totalSemitones / 12);
  
  // Step 1: Time stretch to maintain duration
  const stretched = applyTimeStretch(input, {
    stretchFactor: 1 / pitchRatio,
    algorithm: 'wsola',
    preserveFormants: params.preserveFormants,
    quality: params.quality,
  });
  
  // Step 2: Resample to change pitch
  const output = resampleAudio(stretched, pitchRatio);
  
  // Step 3: Trim/pad to original length
  return matchLength(output, input.length, input.sampleRate);
}

/**
 * Resample audio buffer.
 */
function resampleAudio(input: AudioBuffer, ratio: number): AudioBuffer {
  const outputLength = Math.floor(input.length / ratio);
  const output = createAudioBuffer(outputLength, input.channels.length, input.sampleRate);
  
  for (let ch = 0; ch < input.channels.length; ch++) {
    const inChannel = input.channels[ch];
    const outChannel = output.channels[ch];
    if (!inChannel || !outChannel) continue;
    
    // Linear interpolation resampling
    for (let i = 0; i < outputLength; i++) {
      const srcPos = i * ratio;
      const srcIndex = Math.floor(srcPos);
      const frac = srcPos - srcIndex;
      
      const sample1 = inChannel[srcIndex] || 0;
      const sample2 = inChannel[srcIndex + 1] || 0;
      
      outChannel[i] = sample1 + frac * (sample2 - sample1);
    }
  }
  
  return output;
}

/**
 * Match audio buffer length (trim or pad).
 */
function matchLength(
  input: AudioBuffer,
  targetLength: number,
  sampleRate: number
): AudioBuffer {
  if (input.length === targetLength) {
    return input;
  }
  
  const output = createAudioBuffer(targetLength, input.channels.length, sampleRate);
  
  for (let ch = 0; ch < input.channels.length; ch++) {
    const inChannel = input.channels[ch];
    const outChannel = output.channels[ch];
    if (!inChannel || !outChannel) continue;
    
    const copyLength = Math.min(input.length, targetLength);
    for (let i = 0; i < copyLength; i++) {
      outChannel[i] = inChannel[i] || 0;
    }
  }
  
  return output;
}

/**
 * Pitch Shift Card - Shift pitch without changing duration.
 */
export const PITCH_SHIFT_CARD: Card<AudioBuffer, AudioBuffer> = pureCard(
  createCardMeta(
    'audio.pitchshift',
    'Pitch Shift',
    'utilities',
    {
      description: 'Shift audio pitch without changing duration (formant preservation option)',
      tags: ['audio', 'utility', 'pitch', 'transpose', 'formants'],
      icon: '🎵',
      color: '#9C27B0',
    }
  ),
  createSignature(
    [createPort('input', PortTypes.AUDIO, { label: 'Audio In' })],
    [createPort('output', PortTypes.AUDIO, { label: 'Audio Out' })],
    [
      createParam('semitones', 'number', 0, {
        label: 'Semitones',
        description: 'Pitch shift in semitones',
        min: -24,
        max: 24,
        step: 1,
        automatable: true,
      }),
      createParam('cents', 'number', 0, {
        label: 'Cents',
        description: 'Fine tuning in cents',
        min: -100,
        max: 100,
        step: 1,
        automatable: true,
      }),
      createParam('preserveFormants', 'boolean', true, {
        label: 'Preserve Formants',
        description: 'Maintain vocal quality (formant preservation)',
      }),
      createParam('quality', 'enum', 'standard' as const, {
        label: 'Quality',
        description: 'Processing quality vs speed tradeoff',
        options: ['draft', 'standard', 'high'],
      }),
    ]
  ),
  (input, _context) => {
    // Parameters are managed externally; use defaults here
    return applyPitchShift(input, DEFAULT_PITCH_SHIFT_PARAMS);
  }
);

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * All audio transform cards.
 */
export const AUDIO_TRANSFORM_CARDS = [
  INVERT_CARD,
  MONO_CARD,
  STEREO_CARD,
  WIDTH_CARD,
  DELAY_COMP_CARD,
  TIME_STRETCH_CARD,
  PITCH_SHIFT_CARD,
  NORMALIZE_CARD,
  TRIM_CARD,
  FADE_CARD,
] as const;
