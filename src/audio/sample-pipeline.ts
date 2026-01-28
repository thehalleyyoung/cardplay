/**
 * @fileoverview Sample Pipeline - Audio sample loading, stretching, and slicing.
 * 
 * Unified sample management with:
 * - Audio buffer loading and caching
 * - Time-stretching and pitch-shifting
 * - Transient detection and slicing
 * - Event stream integration
 * 
 * @module @cardplay/audio/sample-pipeline
 * @see INTEGRATION_FIXES_CHECKLIST.md Phase H.1
 */

import type { Event } from '../types/event';
import type { Tick, TickDuration, Velocity } from '../types/primitives';
import { asTickDuration } from '../types/primitives';
import { EventKinds } from '../types/event-kind';
import type {
  EventStreamId,
  EventId,
} from '../state/types';
import {
  getSharedEventStore,
  executeWithUndo,
} from '../state';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Sample identifier (branded type).
 */
export type SampleId = string & { readonly __brand: 'SampleId' };

export function asSampleId(id: string): SampleId {
  return id as SampleId;
}

/**
 * Slice identifier.
 */
export type SliceId = string & { readonly __brand: 'SliceId' };

export function asSliceId(id: string): SliceId {
  return id as SliceId;
}

/**
 * Sample metadata.
 */
export interface SampleMetadata {
  readonly id: SampleId;
  readonly name: string;
  readonly path: string;
  readonly sampleRate: number;
  readonly duration: number; // seconds
  readonly channels: number;
  readonly bitDepth?: number;
  readonly loopStart?: number;
  readonly loopEnd?: number;
  readonly rootNote?: number;
  readonly tempo?: number;
  readonly tags?: readonly string[];
}

/**
 * Detected slice/transient.
 */
export interface SampleSlice {
  readonly id: SliceId;
  readonly sampleId: SampleId;
  readonly startSample: number;
  readonly endSample: number;
  readonly startTime: number; // seconds
  readonly endTime: number;   // seconds
  readonly peakLevel: number;
  readonly name?: string;
  readonly midiNote?: number;
}

/**
 * Time-stretch settings.
 */
export interface StretchSettings {
  /** Stretch ratio (1.0 = original, 2.0 = twice as long) */
  readonly ratio: number;
  /** Preserve pitch when stretching */
  readonly preservePitch: boolean;
  /** Stretch algorithm */
  readonly algorithm: 'simple' | 'granular' | 'phase-vocoder';
  /** Grain size for granular (ms) */
  readonly grainSize?: number;
  /** Overlap for granular */
  readonly overlap?: number;
}

/**
 * Pitch-shift settings.
 */
export interface PitchSettings {
  /** Semitones to shift */
  readonly semitones: number;
  /** Fine tune in cents */
  readonly cents: number;
  /** Formant preservation */
  readonly preserveFormants: boolean;
}

/**
 * Transient detection settings.
 */
export interface TransientSettings {
  /** Detection threshold (0-1) */
  readonly threshold: number;
  /** Minimum slice length (samples) */
  readonly minSliceLength: number;
  /** Sensitivity (0-1) */
  readonly sensitivity: number;
  /** Detection algorithm */
  readonly algorithm: 'onset' | 'spectral' | 'amplitude';
}

/**
 * Sample playback settings.
 */
export interface PlaybackSettings {
  /** Start offset (samples) */
  readonly startOffset: number;
  /** End offset (samples, 0 = end of sample) */
  readonly endOffset: number;
  /** Loop enabled */
  readonly loop: boolean;
  /** Loop start (samples) */
  readonly loopStart: number;
  /** Loop end (samples) */
  readonly loopEnd: number;
  /** Crossfade length (samples) */
  readonly crossfade: number;
  /** Reverse playback */
  readonly reverse: boolean;
  /** Playback rate (1.0 = normal) */
  readonly rate: number;
}

/**
 * Loaded sample with buffer.
 */
export interface LoadedSample {
  readonly metadata: SampleMetadata;
  readonly buffer: AudioBuffer;
  readonly slices: readonly SampleSlice[];
  readonly waveformData?: Float32Array;
}

/**
 * Sample event payload.
 */
export interface SampleEventPayload {
  readonly sampleId: SampleId;
  readonly sliceId?: SliceId;
  readonly velocity: Velocity;
  readonly pitch: number; // MIDI note for pitch
  readonly stretch?: StretchSettings;
  readonly playback?: Partial<PlaybackSettings>;
}

// ============================================================================
// SAMPLE CACHE
// ============================================================================

/**
 * Global sample cache.
 */
class SampleCache {
  private static instance: SampleCache;

  private samples = new Map<SampleId, LoadedSample>();
  private loading = new Map<SampleId, Promise<LoadedSample>>();
  private audioContext: AudioContext | null = null;

  private constructor() {}

  static getInstance(): SampleCache {
    if (!SampleCache.instance) {
      SampleCache.instance = new SampleCache();
    }
    return SampleCache.instance;
  }

  setAudioContext(context: AudioContext): void {
    this.audioContext = context;
  }

  /**
   * Loads a sample from URL.
   */
  async loadFromUrl(url: string, id?: SampleId): Promise<LoadedSample> {
    const sampleId = id ?? asSampleId(`sample-${Date.now()}`);

    // Check cache
    const cached = this.samples.get(sampleId);
    if (cached) return cached;

    // Check if already loading
    const loading = this.loading.get(sampleId);
    if (loading) return loading;

    // Start loading
    const loadPromise = this.doLoad(url, sampleId);
    this.loading.set(sampleId, loadPromise);

    try {
      const sample = await loadPromise;
      this.samples.set(sampleId, sample);
      return sample;
    } finally {
      this.loading.delete(sampleId);
    }
  }

  private async doLoad(url: string, id: SampleId): Promise<LoadedSample> {
    if (!this.audioContext) {
      throw new Error('AudioContext not set. Call setAudioContext first.');
    }

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = await this.audioContext.decodeAudioData(arrayBuffer);

    // Extract filename from URL
    const name = url.split('/').pop()?.split('.')[0] ?? 'Unknown';

    const metadata: SampleMetadata = {
      id,
      name,
      path: url,
      sampleRate: buffer.sampleRate,
      duration: buffer.duration,
      channels: buffer.numberOfChannels,
    };

    // Generate waveform data (downsampled for display)
    const waveformData = this.generateWaveformData(buffer, 1000);

    return {
      metadata,
      buffer,
      slices: [],
      waveformData,
    };
  }

  /**
   * Loads a sample from ArrayBuffer.
   */
  async loadFromBuffer(
    arrayBuffer: ArrayBuffer,
    id: SampleId,
    name: string
  ): Promise<LoadedSample> {
    if (!this.audioContext) {
      throw new Error('AudioContext not set. Call setAudioContext first.');
    }

    const buffer = await this.audioContext.decodeAudioData(arrayBuffer);

    const metadata: SampleMetadata = {
      id,
      name,
      path: '',
      sampleRate: buffer.sampleRate,
      duration: buffer.duration,
      channels: buffer.numberOfChannels,
    };

    const waveformData = this.generateWaveformData(buffer, 1000);

    const sample: LoadedSample = {
      metadata,
      buffer,
      slices: [],
      waveformData,
    };

    this.samples.set(id, sample);
    return sample;
  }

  /**
   * Gets a cached sample.
   */
  get(id: SampleId): LoadedSample | undefined {
    return this.samples.get(id);
  }

  /**
   * Checks if sample is loaded.
   */
  has(id: SampleId): boolean {
    return this.samples.has(id);
  }

  /**
   * Removes a sample from cache.
   */
  remove(id: SampleId): void {
    this.samples.delete(id);
  }

  /**
   * Clears all cached samples.
   */
  clear(): void {
    this.samples.clear();
    this.loading.clear();
  }

  /**
   * Generates waveform display data.
   */
  private generateWaveformData(buffer: AudioBuffer, points: number): Float32Array {
    const channelData = buffer.getChannelData(0);
    const samplesPerPoint = Math.floor(channelData.length / points);
    const waveform = new Float32Array(points);

    for (let i = 0; i < points; i++) {
      const start = i * samplesPerPoint;
      const end = Math.min(start + samplesPerPoint, channelData.length);

      // Find peak in this segment
      let peak = 0;
      for (let j = start; j < end; j++) {
        const abs = Math.abs(channelData[j] ?? 0);
        if (abs > peak) peak = abs;
      }

      waveform[i] = peak;
    }

    return waveform;
  }
}

// ============================================================================
// TRANSIENT DETECTOR
// ============================================================================

/**
 * Transient detection algorithms.
 */
export class TransientDetector {
  /**
   * Detects transients using onset detection.
   */
  static detectOnsets(
    buffer: AudioBuffer,
    settings: TransientSettings
  ): readonly SampleSlice[] {
    const channelData = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    const slices: SampleSlice[] = [];

    // Calculate energy in windows
    const windowSize = 512;
    const hopSize = windowSize / 2;
    const energies: number[] = [];

    for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
      let energy = 0;
      for (let j = 0; j < windowSize; j++) {
        const sample = channelData[i + j] ?? 0;
        energy += sample ** 2;
      }
      energies.push(energy / windowSize);
    }

    // Find onsets (energy increases above threshold)
    const threshold = settings.threshold * Math.max(...energies);
    const onsets: number[] = [];

    for (let i = 1; i < energies.length - 1; i++) {
      const current = energies[i] ?? 0;
      const previous = energies[i - 1] ?? 0;
      const diff = current - previous;
      const normalized = diff / (previous + 0.0001);

      if (normalized > settings.sensitivity && current > threshold) {
        const samplePos = i * hopSize;

        // Enforce minimum slice length
        const lastOnset = onsets[onsets.length - 1];
        if (onsets.length === 0 || (lastOnset !== undefined && samplePos - lastOnset > settings.minSliceLength)) {
          onsets.push(samplePos);
        }
      }
    }

    // Create slices from onsets
    for (let i = 0; i < onsets.length; i++) {
      const startSample = onsets[i];
      if (startSample === undefined) continue;

      const nextOnset = onsets[i + 1];
      const endSample = nextOnset ?? channelData.length;

      // Find peak in slice
      let peakLevel = 0;
      for (let j = startSample; j < endSample; j++) {
        const abs = Math.abs(channelData[j] ?? 0);
        if (abs > peakLevel) peakLevel = abs;
      }

      slices.push({
        id: asSliceId(`slice-${i}`),
        sampleId: asSampleId(''),
        startSample,
        endSample,
        startTime: startSample / sampleRate,
        endTime: endSample / sampleRate,
        peakLevel,
        name: `Slice ${i + 1}`,
        midiNote: 36 + i, // C1 and up
      });
    }

    return slices;
  }

  /**
   * Detects transients using amplitude envelope.
   */
  static detectAmplitude(
    buffer: AudioBuffer,
    settings: TransientSettings
  ): readonly SampleSlice[] {
    const channelData = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    const slices: SampleSlice[] = [];

    // Simple amplitude-based detection
    const windowSize = 256;
    let lastOnset = -settings.minSliceLength;
    let inSlice = false;
    let sliceStart = 0;
    let peakLevel = 0;

    for (let i = 0; i < channelData.length - windowSize; i += windowSize) {
      // Calculate RMS in window
      let sum = 0;
      for (let j = 0; j < windowSize; j++) {
        const sample = channelData[i + j] ?? 0;
        sum += sample ** 2;
      }
      const rms = Math.sqrt(sum / windowSize);

      if (!inSlice && rms > settings.threshold) {
        // Start new slice
        if (i - lastOnset > settings.minSliceLength) {
          inSlice = true;
          sliceStart = i;
          peakLevel = rms;
        }
      } else if (inSlice && rms < settings.threshold * 0.1) {
        // End slice
        const endSample = i;
        slices.push({
          id: asSliceId(`slice-${slices.length}`),
          sampleId: asSampleId(''),
          startSample: sliceStart,
          endSample,
          startTime: sliceStart / sampleRate,
          endTime: endSample / sampleRate,
          peakLevel,
          name: `Slice ${slices.length + 1}`,
          midiNote: 36 + slices.length,
        });
        lastOnset = endSample;
        inSlice = false;
        peakLevel = 0;
      } else if (inSlice && rms > peakLevel) {
        peakLevel = rms;
      }
    }

    // Handle last slice
    if (inSlice) {
      slices.push({
        id: asSliceId(`slice-${slices.length}`),
        sampleId: asSampleId(''),
        startSample: sliceStart,
        endSample: channelData.length,
        startTime: sliceStart / sampleRate,
        endTime: buffer.duration,
        peakLevel,
        name: `Slice ${slices.length + 1}`,
        midiNote: 36 + slices.length,
      });
    }

    return slices;
  }

  /**
   * Auto-slices sample into equal divisions.
   */
  static sliceEvenly(
    buffer: AudioBuffer,
    numSlices: number,
    sampleId: SampleId
  ): readonly SampleSlice[] {
    const samplesPerSlice = Math.floor(buffer.length / numSlices);
    const channelData = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    const slices: SampleSlice[] = [];

    for (let i = 0; i < numSlices; i++) {
      const startSample = i * samplesPerSlice;
      const endSample = i === numSlices - 1 ? buffer.length : (i + 1) * samplesPerSlice;

      // Find peak
      let peakLevel = 0;
      for (let j = startSample; j < endSample; j++) {
        const abs = Math.abs(channelData[j] ?? 0);
        if (abs > peakLevel) peakLevel = abs;
      }

      slices.push({
        id: asSliceId(`${sampleId}-slice-${i}`),
        sampleId,
        startSample,
        endSample,
        startTime: startSample / sampleRate,
        endTime: endSample / sampleRate,
        peakLevel,
        name: `Slice ${i + 1}`,
        midiNote: 36 + i,
      });
    }

    return slices;
  }
}

// ============================================================================
// SAMPLE PROCESSOR
// ============================================================================

/**
 * Audio sample processing utilities.
 */
export class SampleProcessor {
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  /**
   * Time-stretches a sample.
   */
  async stretch(
    buffer: AudioBuffer,
    settings: StretchSettings
  ): Promise<AudioBuffer> {
    if (settings.algorithm === 'simple') {
      return this.simpleStretch(buffer, settings.ratio);
    } else if (settings.algorithm === 'granular') {
      return this.granularStretch(buffer, settings);
    }
    // phase-vocoder would require more complex implementation
    return this.simpleStretch(buffer, settings.ratio);
  }

  private simpleStretch(buffer: AudioBuffer, ratio: number): AudioBuffer {
    const newLength = Math.floor(buffer.length * ratio);
    const newBuffer = this.audioContext.createBuffer(
      buffer.numberOfChannels,
      newLength,
      buffer.sampleRate
    );

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const oldData = buffer.getChannelData(channel);
      const newData = newBuffer.getChannelData(channel);

      for (let i = 0; i < newLength; i++) {
        const srcPos = i / ratio;
        const srcIndex = Math.floor(srcPos);
        const frac = srcPos - srcIndex;

        if (srcIndex + 1 < oldData.length) {
          // Linear interpolation
          const a = oldData[srcIndex] ?? 0;
          const b = oldData[srcIndex + 1] ?? a;
          newData[i] = a * (1 - frac) + b * frac;
        } else if (srcIndex < oldData.length) {
          newData[i] = oldData[srcIndex] ?? 0;
        }
      }
    }

    return newBuffer;
  }

  private granularStretch(
    buffer: AudioBuffer,
    settings: StretchSettings
  ): AudioBuffer {
    const grainSize = Math.floor(
      (settings.grainSize ?? 50) * buffer.sampleRate / 1000
    );
    const overlap = settings.overlap ?? 0.5;
    const hopSize = Math.floor(grainSize * (1 - overlap));
    const ratio = settings.ratio;

    const newLength = Math.floor(buffer.length * ratio);
    const newBuffer = this.audioContext.createBuffer(
      buffer.numberOfChannels,
      newLength,
      buffer.sampleRate
    );

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const oldData = buffer.getChannelData(channel);
      const newData = newBuffer.getChannelData(channel);

      // Create Hann window
      const window = new Float32Array(grainSize);
      for (let i = 0; i < grainSize; i++) {
        window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / grainSize));
      }

      // Process grains
      let writePos = 0;
      let readPos = 0;
      const readIncrement = 1 / ratio;

      while (writePos < newLength - grainSize) {
        const srcStart = Math.floor(readPos);

        for (let i = 0; i < grainSize; i++) {
          const srcIndex = srcStart + i;
          if (srcIndex < oldData.length) {
            const idx = writePos + i;
            newData[idx] = (newData[idx] ?? 0) + (oldData[srcIndex] ?? 0) * (window[i] ?? 0);
          }
        }

        writePos += hopSize;
        readPos += hopSize * readIncrement;
      }
    }

    return newBuffer;
  }

  /**
   * Pitch-shifts a sample.
   */
  pitchShift(buffer: AudioBuffer, settings: PitchSettings): AudioBuffer {
    // Simple pitch shift by resampling
    const ratio = Math.pow(2, (settings.semitones + settings.cents / 100) / 12);
    return this.simpleStretch(buffer, 1 / ratio);
  }

  /**
   * Reverses a sample.
   */
  reverse(buffer: AudioBuffer): AudioBuffer {
    const newBuffer = this.audioContext.createBuffer(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const oldData = buffer.getChannelData(channel);
      const newData = newBuffer.getChannelData(channel);

      for (let i = 0; i < buffer.length; i++) {
        newData[i] = oldData[buffer.length - 1 - i] ?? 0;
      }
    }

    return newBuffer;
  }

  /**
   * Normalizes sample to peak level.
   */
  normalize(buffer: AudioBuffer, targetPeak: number = 1.0): AudioBuffer {
    const newBuffer = this.audioContext.createBuffer(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );

    // Find current peak
    let peak = 0;
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < data.length; i++) {
        const abs = Math.abs(data[i] ?? 0);
        if (abs > peak) peak = abs;
      }
    }

    // Normalize
    const gain = peak > 0 ? targetPeak / peak : 1;

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const oldData = buffer.getChannelData(channel);
      const newData = newBuffer.getChannelData(channel);

      for (let i = 0; i < buffer.length; i++) {
        newData[i] = (oldData[i] ?? 0) * gain;
      }
    }

    return newBuffer;
  }

  /**
   * Extracts a slice from buffer.
   */
  extractSlice(buffer: AudioBuffer, slice: SampleSlice): AudioBuffer {
    const length = slice.endSample - slice.startSample;
    const newBuffer = this.audioContext.createBuffer(
      buffer.numberOfChannels,
      length,
      buffer.sampleRate
    );

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const oldData = buffer.getChannelData(channel);
      const newData = newBuffer.getChannelData(channel);

      for (let i = 0; i < length; i++) {
        newData[i] = oldData[slice.startSample + i] ?? 0;
      }
    }

    return newBuffer;
  }

  /**
   * Applies fade in/out.
   */
  applyFades(
    buffer: AudioBuffer,
    fadeInSamples: number,
    fadeOutSamples: number
  ): AudioBuffer {
    const newBuffer = this.audioContext.createBuffer(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const oldData = buffer.getChannelData(channel);
      const newData = newBuffer.getChannelData(channel);

      for (let i = 0; i < buffer.length; i++) {
        let gain = 1;

        // Fade in
        if (i < fadeInSamples) {
          gain *= i / fadeInSamples;
        }

        // Fade out
        const fromEnd = buffer.length - 1 - i;
        if (fromEnd < fadeOutSamples) {
          gain *= fromEnd / fadeOutSamples;
        }

        newData[i] = (oldData[i] ?? 0) * gain;
      }
    }

    return newBuffer;
  }
}

// ============================================================================
// SAMPLE EVENT STREAM
// ============================================================================

/**
 * Manages sample events in the shared store.
 */
export class SampleEventStream {
  private streamId: EventStreamId;

  constructor(streamId: EventStreamId) {
    this.streamId = streamId;

    // Ensure stream exists
    const store = getSharedEventStore();
    if (!store.getStream(streamId)) {
      store.createStream({
        id: streamId,
        name: `Sample Stream ${streamId}`,
        events: [],
      });
    }
  }

  /**
   * Writes a sample trigger event.
   */
  triggerSample(
    tick: Tick,
    payload: SampleEventPayload,
    duration?: TickDuration
  ): EventId {
    const store = getSharedEventStore();
    const event: Event<SampleEventPayload> = {
      id: `sample-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` as EventId,
      kind: EventKinds.TRIGGER,
      start: tick,
      duration: duration ?? asTickDuration(480), // Default quarter note
      payload,
    };

    let eventId: EventId;

    executeWithUndo({
      type: 'sample:trigger',
      description: 'Trigger sample',
      execute: () => {
        store.addEvent(this.streamId, event);
        eventId = event.id;
        return event;
      },
      undo: (evt) => {
        store.deleteEvent(this.streamId, evt.id);
      },
      redo: (evt) => {
        store.addEvent(this.streamId, evt);
      },
    });

    return eventId!;
  }

  /**
   * Gets all sample events in range.
   */
  getEventsInRange(
    start: Tick,
    end: Tick
  ): readonly Event<SampleEventPayload>[] {
    const store = getSharedEventStore();
    const events = store.getStream(this.streamId)?.events ?? [];

    return events.filter(e =>
      (e.start as number) >= (start as number) &&
      (e.start as number) < (end as number)
    ) as readonly Event<SampleEventPayload>[];
  }

  /**
   * Removes a sample event.
   */
  removeEvent(eventId: EventId): void {
    const store = getSharedEventStore();
    store.deleteEvent(this.streamId, eventId);
  }

  /**
   * Clears all events.
   */
  clear(): void {
    const store = getSharedEventStore();
    store.clearStream(this.streamId);
  }

  getStreamId(): EventStreamId {
    return this.streamId;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Gets the sample cache singleton.
 */
export function getSampleCache(): SampleCache {
  return SampleCache.getInstance();
}

/**
 * Creates a sample processor.
 */
export function createSampleProcessor(audioContext: AudioContext): SampleProcessor {
  return new SampleProcessor(audioContext);
}

/**
 * Creates a sample event stream.
 */
export function createSampleEventStream(streamId: EventStreamId): SampleEventStream {
  return new SampleEventStream(streamId);
}
