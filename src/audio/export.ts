/**
 * @fileoverview Audio Export & Offline Rendering System.
 * 
 * Provides offline rendering and export capabilities with:
 * - Multiple format support (WAV, MP3, FLAC, OGG)
 * - Configurable bit depth and sample rate
 * - Dithering options
 * - Normalization
 * - Tail length handling
 * - Start/end marker support
 * - Loop export
 * - Real-time vs offline rendering
 * - Progress tracking
 * - Export queue management
 * - Event flattening integration for card-based audio
 * 
 * @module @cardplay/core/audio/export
 */

import type {
  FlattenConfig,
  FlattenResult,
  FlattenedEvent,
  SessionDefinition,
} from './event-flattener';
import { prepareForExport } from './event-flattener';
import { asTick, PPQ } from '../types/primitives';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Supported export formats.
 */
export type ExportFormat = 'wav' | 'mp3' | 'flac' | 'ogg';

/**
 * Supported bit depths for WAV/FLAC.
 */
export type BitDepth = 16 | 24 | 32;

/**
 * Supported sample rates.
 */
export type SampleRate = 44100 | 48000 | 96000 | 192000;

/**
 * Dithering algorithms.
 */
export type DitherType = 'none' | 'triangular' | 'shaped';

/**
 * Export configuration.
 */
export interface ExportConfig {
  /** Output format */
  readonly format: ExportFormat;
  /** Bit depth (for WAV/FLAC) */
  readonly bitDepth: BitDepth;
  /** Sample rate */
  readonly sampleRate: SampleRate;
  /** Dithering algorithm */
  readonly dither: DitherType;
  /** Normalize to target level (dBFS, null = no normalization) */
  readonly normalizeDb: number | null;
  /** Extra tail length after last event (ms) */
  readonly tailLengthMs: number;
  /** Start time (ticks, null = beginning) */
  readonly startTick: number | null;
  /** End time (ticks, null = end of content) */
  readonly endTick: number | null;
  /** Export loop region only */
  readonly loopOnly: boolean;
  /** Use real-time rendering (false = faster offline) */
  readonly realtime: boolean;
  /** Output filename (without extension) */
  readonly filename: string;
}

/**
 * Default export configuration.
 */
export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  format: 'wav',
  bitDepth: 24,
  sampleRate: 48000,
  dither: 'triangular',
  normalizeDb: -0.3,
  tailLengthMs: 1000,
  startTick: null,
  endTick: null,
  loopOnly: false,
  realtime: false,
  filename: 'export',
};

/**
 * Export progress information.
 */
export interface ExportProgress {
  /** Current phase of export */
  readonly phase: 'preparing' | 'rendering' | 'encoding' | 'writing' | 'complete' | 'error';
  /** Progress within current phase (0-1) */
  readonly progress: number;
  /** Overall progress (0-1) */
  readonly overallProgress: number;
  /** Current sample being processed */
  readonly currentSample: number;
  /** Total samples to process */
  readonly totalSamples: number;
  /** Estimated time remaining (ms, null = unknown) */
  readonly estimatedTimeRemainingMs: number | null;
  /** Error message (only if phase === 'error') */
  readonly error: string | null;
}

/**
 * Export result.
 */
export interface ExportResult {
  /** Success flag */
  readonly success: boolean;
  /** Output blob (if successful) */
  readonly blob: Blob | null;
  /** Suggested filename with extension */
  readonly filename: string;
  /** Duration in seconds */
  readonly durationSeconds: number;
  /** File size in bytes */
  readonly fileSizeBytes: number;
  /** Error message (if failed) */
  readonly error: string | null;
  /** Peak level (dBFS) */
  readonly peakLevelDb: number;
  /** RMS level (dBFS) */
  readonly rmsLevelDb: number;
}

/**
 * Export queue entry.
 */
export interface ExportQueueEntry {
  readonly id: string;
  readonly config: ExportConfig;
  status: 'queued' | 'processing' | 'complete' | 'error';
  progress: ExportProgress | null;
  result: ExportResult | null;
  readonly queuedAt: number;
  startedAt: number | null;
  completedAt: number | null;
}

/**
 * Export preset for quick recall.
 */
export interface ExportPreset {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly config: Partial<ExportConfig>;
  readonly isFactory: boolean;
}

// ============================================================================
// FACTORY PRESETS
// ============================================================================

export const FACTORY_EXPORT_PRESETS: readonly ExportPreset[] = [
  {
    id: 'wav-24bit-48k',
    name: 'WAV 24-bit 48kHz (Studio Quality)',
    description: 'Uncompressed, professional quality',
    config: {
      format: 'wav',
      bitDepth: 24,
      sampleRate: 48000,
      dither: 'triangular',
      normalizeDb: -0.3,
    },
    isFactory: true,
  },
  {
    id: 'wav-16bit-44.1k',
    name: 'WAV 16-bit 44.1kHz (CD Quality)',
    description: 'CD-ready master',
    config: {
      format: 'wav',
      bitDepth: 16,
      sampleRate: 44100,
      dither: 'shaped',
      normalizeDb: -0.1,
    },
    isFactory: true,
  },
  {
    id: 'mp3-320k',
    name: 'MP3 320kbps (High Quality)',
    description: 'Compressed, high quality for sharing',
    config: {
      format: 'mp3',
      bitDepth: 16,
      sampleRate: 44100,
      normalizeDb: -0.3,
    },
    isFactory: true,
  },
  {
    id: 'flac-24bit-96k',
    name: 'FLAC 24-bit 96kHz (Hi-Res)',
    description: 'Lossless compression, audiophile quality',
    config: {
      format: 'flac',
      bitDepth: 24,
      sampleRate: 96000,
      dither: 'none',
      normalizeDb: null,
    },
    isFactory: true,
  },
];

// ============================================================================
// AUDIO EXPORT ENGINE
// ============================================================================

/**
 * Audio Export Engine - handles offline rendering and export.
 * Integrates with the event flattening system for card-based audio export.
 */
export class AudioExportEngine {
  private queue: ExportQueueEntry[] = [];
  private processing = false;
  private currentSession: SessionDefinition | null = null;
  private flattenedEvents: readonly FlattenedEvent[] = [];

  /**
   * Sets the session to export.
   */
  setSession(session: SessionDefinition): void {
    this.currentSession = session;
    this.flattenedEvents = [];
  }

  /**
   * Gets the current session.
   */
  getSession(): SessionDefinition | null {
    return this.currentSession;
  }

  /**
   * Pre-flattens the session for preview or analysis.
   * Returns flattened events that will be used for rendering.
   */
  flattenSession(config?: Partial<FlattenConfig>): FlattenResult {
    if (!this.currentSession) {
      return {
        events: [],
        stats: {
          totalEvents: 0,
          eventsByType: {},
          ticksProcessed: 0,
          processingTimeMs: 0,
          cardsProcessed: 0,
          peakConcurrentNotes: 0,
        },
        warnings: [{ type: 'state', message: 'No session set' }],
        success: false,
        error: 'No session set',
      };
    }

    const result = prepareForExport(this.currentSession, config);
    if (result.success) {
      this.flattenedEvents = result.events;
    }
    return result;
  }

  /**
   * Gets the currently flattened events.
   */
  getFlattenedEvents(): readonly FlattenedEvent[] {
    return this.flattenedEvents;
  }

  /**
   * Add export job to queue.
   */
  addToQueue(config: ExportConfig): string {
    const id = `export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const entry: ExportQueueEntry = {
      id,
      config,
      status: 'queued',
      progress: null,
      result: null,
      queuedAt: Date.now(),
      startedAt: null,
      completedAt: null,
    };
    this.queue.push(entry);
    this.processQueue();
    return id;
  }

  /**
   * Get queue status.
   */
  getQueue(): readonly ExportQueueEntry[] {
    return [...this.queue];
  }

  /**
   * Get specific entry by ID.
   */
  getEntry(id: string): ExportQueueEntry | null {
    return this.queue.find(e => e.id === id) ?? null;
  }

  /**
   * Cancel queued export.
   */
  cancel(id: string): boolean {
    const index = this.queue.findIndex(e => e.id === id);
    if (index === -1) return false;
    const entry = this.queue[index];
    if (!entry || entry.status === 'processing') return false; // Cannot cancel active
    this.queue.splice(index, 1);
    return true;
  }

  /**
   * Clear completed/errored entries.
   */
  clearCompleted(): void {
    this.queue = this.queue.filter(e => 
      e.status === 'queued' || e.status === 'processing'
    );
  }

  /**
   * Process export queue.
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (true) {
      const next = this.queue.find(e => e.status === 'queued');
      if (!next) break;

      next.startedAt = Date.now();
      await this.processExport(next);
      next.completedAt = Date.now();
    }

    this.processing = false;
  }

  /**
   * Process single export job.
   */
  private async processExport(entry: ExportQueueEntry): Promise<void> {
    const updateProgress = (progress: Partial<ExportProgress>) => {
      const current = entry.progress ?? {
        phase: 'preparing' as const,
        progress: 0,
        overallProgress: 0,
        currentSample: 0,
        totalSamples: 0,
        estimatedTimeRemainingMs: null,
        error: null,
      };
      entry.progress = { ...current, ...progress };
    };

    try {
      entry.status = 'processing';
      updateProgress({ phase: 'preparing', progress: 0 });

      // Calculate render bounds
      const bounds = this.calculateRenderBounds(entry.config);
      updateProgress({ totalSamples: bounds.totalSamples });

      // Render audio
      updateProgress({ phase: 'rendering', progress: 0 });
      const audioData = await this.renderAudio(entry.config, bounds, updateProgress);

      // Encode to format
      updateProgress({ phase: 'encoding', progress: 0 });
      const blob = await this.encodeAudio(entry.config, audioData, updateProgress);

      // Calculate audio stats
      const stats = this.calculateAudioStats(audioData);

      // Complete
      entry.status = 'complete';
      entry.result = {
        success: true,
        blob,
        filename: this.generateFilename(entry.config),
        durationSeconds: bounds.durationSeconds,
        fileSizeBytes: blob.size,
        error: null,
        peakLevelDb: stats.peakLevelDb,
        rmsLevelDb: stats.rmsLevelDb,
      };
      updateProgress({ phase: 'complete', progress: 1, overallProgress: 1 });

    } catch (error) {
      entry.status = 'error';
      entry.result = {
        success: false,
        blob: null,
        filename: '',
        durationSeconds: 0,
        fileSizeBytes: 0,
        error: error instanceof Error ? error.message : String(error),
        peakLevelDb: -Infinity,
        rmsLevelDb: -Infinity,
      };
      updateProgress({ 
        phase: 'error', 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Calculate render bounds from config.
   */
  private calculateRenderBounds(config: ExportConfig): {
    startTick: number;
    endTick: number;
    startSample: number;
    endSample: number;
    totalSamples: number;
    durationSeconds: number;
  } {
    // Use session tempo if available, otherwise default
    const tempo = this.currentSession?.tempo ?? 120;
    const ticksPerSecond = (tempo / 60) * PPQ;
    const samplesPerTick = config.sampleRate / ticksPerSecond;

    const startTick = config.startTick ?? 0;
    const endTick = config.endTick ?? (PPQ * 4 * 16); // 16 bars default
    const tailSamples = Math.floor((config.tailLengthMs / 1000) * config.sampleRate);

    const startSample = Math.floor(startTick * samplesPerTick);
    const endSample = Math.floor(endTick * samplesPerTick) + tailSamples;
    const totalSamples = endSample - startSample;
    const durationSeconds = totalSamples / config.sampleRate;

    return {
      startTick,
      endTick,
      startSample,
      endSample,
      totalSamples,
      durationSeconds,
    };
  }

  /**
   * Render audio offline using flattened events.
   * 
   * This method integrates with the event flattening system to convert
   * card-generated events into rendered audio samples.
   */
  private async renderAudio(
    config: ExportConfig,
    bounds: ReturnType<typeof this.calculateRenderBounds>,
    updateProgress: (progress: Partial<ExportProgress>) => void
  ): Promise<Float32Array[]> {
    const left = new Float32Array(bounds.totalSamples);
    const right = new Float32Array(bounds.totalSamples);

    // Flatten session if we have one and haven't already
    if (this.currentSession && this.flattenedEvents.length === 0) {
      const tempo = this.currentSession.tempo;
      const flattenConfig: Partial<FlattenConfig> = {
        startTick: asTick(bounds.startTick),
        endTick: asTick(bounds.endTick),
        tempo,
        sampleRate: config.sampleRate,
        timeSignature: this.currentSession.timeSignature,
      };
      
      const result = prepareForExport(this.currentSession, flattenConfig);
      if (result.success) {
        this.flattenedEvents = result.events;
      }
    }

    // Process events into audio
    // This is where synthesizers/samplers would render the events
    // For now, we generate simple tones for note events as a placeholder
    const sampleRate = config.sampleRate;
    const activeNotes = new Map<string, { frequency: number; startSample: number; velocity: number }>();

    for (const event of this.flattenedEvents) {
      const samplePos = event.sample - bounds.startSample;
      
      if (event.type === 'noteOn' && event.note !== undefined) {
        // Convert MIDI note to frequency
        const frequency = 440 * Math.pow(2, (event.note - 69) / 12);
        const key = `${event.note}-${event.channel ?? 0}`;
        activeNotes.set(key, {
          frequency,
          startSample: Math.max(0, samplePos),
          velocity: (event.velocity ?? 100) / 127,
        });
      } else if (event.type === 'noteOff' && event.note !== undefined) {
        const key = `${event.note}-${event.channel ?? 0}`;
        const noteInfo = activeNotes.get(key);
        
        if (noteInfo) {
          // Render a simple sine wave for this note
          const endSample = Math.min(bounds.totalSamples, Math.max(0, samplePos));
          const startSample = noteInfo.startSample;
          const amplitude = noteInfo.velocity * 0.3; // Scale down
          
          for (let i = startSample; i < endSample; i++) {
            const t = i / sampleRate;
            const phase = 2 * Math.PI * noteInfo.frequency * t;
            
            // Simple ADSR-ish envelope
            const noteDuration = endSample - startSample;
            const relPos = (i - startSample) / noteDuration;
            let envelope = 1.0;
            if (relPos < 0.01) envelope = relPos / 0.01; // Attack
            else if (relPos > 0.9) envelope = (1 - relPos) / 0.1; // Release
            
            const sample = Math.sin(phase) * amplitude * envelope;
            left[i] = (left[i] ?? 0) + sample;
            right[i] = (right[i] ?? 0) + sample;
          }
          
          activeNotes.delete(key);
        }
      }
    }

    // Render any notes still active at the end
    for (const [, noteInfo] of activeNotes) {
      const endSample = bounds.totalSamples;
      const startSample = noteInfo.startSample;
      const amplitude = noteInfo.velocity * 0.3;
      
      for (let i = startSample; i < endSample; i++) {
        const t = i / sampleRate;
        const phase = 2 * Math.PI * noteInfo.frequency * t;
        
        const noteDuration = endSample - startSample;
        const relPos = (i - startSample) / noteDuration;
        let envelope = 1.0;
        if (relPos < 0.01) envelope = relPos / 0.01;
        else if (relPos > 0.9) envelope = (1 - relPos) / 0.1;
        
        const sample = Math.sin(phase) * amplitude * envelope;
        left[i] = (left[i] ?? 0) + sample;
        right[i] = (right[i] ?? 0) + sample;
      }
    }

    // Clamp output
    for (let i = 0; i < bounds.totalSamples; i++) {
      left[i] = Math.max(-1, Math.min(1, left[i] ?? 0));
      right[i] = Math.max(-1, Math.min(1, right[i] ?? 0));
    }

    // Report final progress
    updateProgress({ 
      progress: 1, 
      overallProgress: 0.5,
      currentSample: bounds.totalSamples 
    });

    return [left, right];
  }

  /**
   * Apply normalization to audio data.
   */
  private normalizeAudio(channels: Float32Array[], targetDb: number): void {
    if (channels.length === 0) return;
    
    // Find peak across all channels
    let peak = 0;
    for (const channel of channels) {
      for (let i = 0; i < channel.length; i++) {
        const abs = Math.abs(channel[i] ?? 0);
        if (abs > peak) peak = abs;
      }
    }

    if (peak === 0) return; // Silence

    // Calculate gain
    const targetLinear = Math.pow(10, targetDb / 20);
    const gain = targetLinear / peak;

    // Apply gain
    for (const channel of channels) {
      for (let i = 0; i < channel.length; i++) {
        const sample = channel[i];
        if (sample !== undefined) {
          channel[i] = sample * gain;
        }
      }
    }
  }

  /**
   * Apply dithering.
   */
  private applyDither(
    channels: Float32Array[], 
    bitDepth: BitDepth, 
    ditherType: DitherType
  ): void {
    if (ditherType === 'none' || bitDepth === 32 || channels.length === 0) return;

    const quantizationStep = 1 / Math.pow(2, bitDepth - 1);

    for (const channel of channels) {
      for (let i = 0; i < channel.length; i++) {
        let dither = 0;
        if (ditherType === 'triangular') {
          // TPDF dither
          dither = (Math.random() + Math.random() - 1) * quantizationStep;
        } else if (ditherType === 'shaped') {
          // Simple noise shaping (would need error feedback in real impl)
          dither = (Math.random() - 0.5) * quantizationStep;
        }
        const sample = channel[i];
        if (sample !== undefined) {
          channel[i] = sample + dither;
        }
      }
    }
  }

  /**
   * Encode audio data to target format.
   */
  private async encodeAudio(
    config: ExportConfig,
    audioData: Float32Array[],
    updateProgress: (progress: Partial<ExportProgress>) => void
  ): Promise<Blob> {
    updateProgress({ phase: 'encoding', progress: 0 });

    // Apply normalization if requested
    if (config.normalizeDb !== null) {
      this.normalizeAudio(audioData, config.normalizeDb);
    }

    // Apply dithering
    this.applyDither(audioData, config.bitDepth, config.dither);

    // Encode based on format
    switch (config.format) {
      case 'wav':
        return this.encodeWav(audioData, config);
      case 'mp3':
      case 'flac':
      case 'ogg':
        throw new Error(`Format ${config.format} not yet implemented`);
      default:
        throw new Error(`Unknown format: ${config.format}`);
    }
  }

  /**
   * Encode as WAV file.
   */
  private encodeWav(channels: Float32Array[], config: ExportConfig): Blob {
    const numChannels = channels.length;
    if (numChannels === 0) {
      throw new Error('No audio channels to export');
    }
    
    const firstChannel = channels[0];
    if (!firstChannel) {
      throw new Error('First channel is undefined');
    }
    
    const numSamples = firstChannel.length;
    const bytesPerSample = config.bitDepth / 8;
    const dataSize = numSamples * numChannels * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // WAV header
    let offset = 0;
    const writeString = (str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset++, str.charCodeAt(i));
      }
    };

    writeString('RIFF');
    view.setUint32(offset, 36 + dataSize, true); offset += 4;
    writeString('WAVE');
    writeString('fmt ');
    view.setUint32(offset, 16, true); offset += 4;
    view.setUint16(offset, 3, true); offset += 2; // IEEE float format
    view.setUint16(offset, numChannels, true); offset += 2;
    view.setUint32(offset, config.sampleRate, true); offset += 4;
    view.setUint32(offset, config.sampleRate * numChannels * bytesPerSample, true); offset += 4;
    view.setUint16(offset, numChannels * bytesPerSample, true); offset += 2;
    view.setUint16(offset, config.bitDepth, true); offset += 2;
    writeString('data');
    view.setUint32(offset, dataSize, true); offset += 4;

    // Interleave samples
    for (let i = 0; i < numSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const channel = channels[ch];
        if (!channel) continue;
        
        const rawSample = channel[i];
        const sample = Math.max(-1, Math.min(1, rawSample ?? 0));
        if (config.bitDepth === 32) {
          view.setFloat32(offset, sample, true);
          offset += 4;
        } else {
          const intSample = Math.round(sample * (Math.pow(2, config.bitDepth - 1) - 1));
          if (config.bitDepth === 24) {
            view.setInt16(offset, intSample & 0xFFFF, true); offset += 2;
            view.setInt8(offset, (intSample >> 16) & 0xFF); offset += 1;
          } else {
            view.setInt16(offset, intSample, true);
            offset += 2;
          }
        }
      }
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  /**
   * Calculate audio statistics.
   */
  private calculateAudioStats(channels: Float32Array[]): {
    peakLevelDb: number;
    rmsLevelDb: number;
  } {
    let peak = 0;
    let sumSquares = 0;
    let sampleCount = 0;

    for (const channel of channels) {
      for (let i = 0; i < channel.length; i++) {
        const sample = channel[i] ?? 0;
        const abs = Math.abs(sample);
        if (abs > peak) peak = abs;
        sumSquares += sample * sample;
        sampleCount++;
      }
    }

    const peakLevelDb = peak > 0 ? 20 * Math.log10(peak) : -Infinity;
    const rms = Math.sqrt(sumSquares / (sampleCount || 1));
    const rmsLevelDb = rms > 0 ? 20 * Math.log10(rms) : -Infinity;

    return { peakLevelDb, rmsLevelDb };
  }

  /**
   * Generate output filename with extension.
   */
  private generateFilename(config: ExportConfig): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const base = config.filename || `export-${timestamp}`;
    const ext = config.format;
    return `${base}.${ext}`;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let exportEngine: AudioExportEngine | null = null;

/**
 * Get global export engine instance.
 */
export function getExportEngine(): AudioExportEngine {
  if (!exportEngine) {
    exportEngine = new AudioExportEngine();
  }
  return exportEngine;
}
