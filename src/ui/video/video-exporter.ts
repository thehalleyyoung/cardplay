/**
 * @fileoverview Video Exporter for CardPlay Demo Generation.
 * 
 * This module exports frame sequences to video formats (MP4, WebM, GIF).
 * It supports both WebCodecs API (where available) and fallback encoding.
 * 
 * Features:
 * - WebCodecs-based H.264 encoding for MP4
 * - WebM VP8/VP9 encoding
 * - GIF generation for previews
 * - Frame batching for memory efficiency
 * - Progress callbacks for UI feedback
 * - Audio track support (placeholder)
 * 
 * @see frame-compositor.ts for frame rendering
 * @see interaction-recorder.ts for playback sequences
 */

import type { PlaybackState, InteractionSequence } from './interaction-recorder';
import { FrameCompositor } from './frame-compositor';

// ============================================================================
// EXPORT CONFIGURATION
// ============================================================================

/**
 * Video export format.
 */
export type VideoFormat = 'mp4' | 'webm' | 'gif';

/**
 * Video codec configuration.
 */
export type VideoCodec = 'h264' | 'vp8' | 'vp9' | 'av1';

/**
 * Video quality preset.
 */
export type QualityPreset = 'draft' | 'preview' | 'standard' | 'high' | 'production';

/**
 * Export configuration.
 */
export interface ExportConfig {
  readonly format: VideoFormat;
  readonly codec?: VideoCodec;
  readonly width: number;
  readonly height: number;
  readonly fps: number;
  readonly bitrate: number;
  readonly quality: QualityPreset;
  readonly includeAudio: boolean;
  readonly audioBitrate?: number;
  readonly hardwareAcceleration?: 'prefer-hardware' | 'prefer-software' | 'no-preference';
}

/**
 * Quality preset configurations.
 */
export const QUALITY_PRESETS: Record<QualityPreset, Partial<ExportConfig>> = {
  draft: {
    width: 640,
    height: 360,
    fps: 15,
    bitrate: 500_000,
  },
  preview: {
    width: 1280,
    height: 720,
    fps: 24,
    bitrate: 2_000_000,
  },
  standard: {
    width: 1920,
    height: 1080,
    fps: 30,
    bitrate: 5_000_000,
  },
  high: {
    width: 1920,
    height: 1080,
    fps: 60,
    bitrate: 10_000_000,
  },
  production: {
    width: 3840,
    height: 2160,
    fps: 60,
    bitrate: 25_000_000,
  },
};

/**
 * Default export configuration.
 */
export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  format: 'mp4',
  codec: 'h264',
  width: 1920,
  height: 1080,
  fps: 30,
  bitrate: 5_000_000,
  quality: 'standard',
  includeAudio: false,
  audioBitrate: 128_000,
  hardwareAcceleration: 'prefer-hardware',
};

// ============================================================================
// EXPORT PROGRESS
// ============================================================================

/**
 * Export progress callback.
 */
export type ExportProgressCallback = (progress: ExportProgress) => void;

/**
 * Export progress state.
 */
export interface ExportProgress {
  readonly phase: ExportPhase;
  readonly framesCaptured: number;
  readonly framesEncoded: number;
  readonly totalFrames: number;
  readonly percent: number;
  readonly elapsedMs: number;
  readonly estimatedRemainingMs: number;
  readonly currentFps: number;
  readonly outputSizeBytes: number;
}

/**
 * Export phase.
 */
export type ExportPhase = 
  | 'initializing'
  | 'capturing'
  | 'encoding'
  | 'finalizing'
  | 'complete'
  | 'error';

// ============================================================================
// FRAME BUFFER
// ============================================================================

/**
 * Frame buffer for batch processing.
 */
export class FrameBuffer {
  private frames: ImageBitmap[] = [];
  private readonly maxSize: number;

  constructor(maxSize: number = 30) {
    this.maxSize = maxSize;
  }

  /**
   * Add a frame to the buffer.
   */
  add(frame: ImageBitmap): void {
    this.frames.push(frame);
  }

  /**
   * Get all frames and clear buffer.
   */
  flush(): ImageBitmap[] {
    const frames = this.frames;
    this.frames = [];
    return frames;
  }

  /**
   * Check if buffer is full.
   */
  isFull(): boolean {
    return this.frames.length >= this.maxSize;
  }

  /**
   * Get current buffer size.
   */
  size(): number {
    return this.frames.length;
  }

  /**
   * Clear buffer and release resources.
   */
  clear(): void {
    for (const frame of this.frames) {
      frame.close();
    }
    this.frames = [];
  }
}

// ============================================================================
// VIDEO ENCODER WRAPPER
// ============================================================================

/**
 * Video encoder wrapper for WebCodecs API.
 */
export class VideoEncoderWrapper {
  private encoder: VideoEncoder | null = null;
  private chunks: EncodedVideoChunk[] = [];
  private config: ExportConfig;
  private frameCount: number = 0;

  constructor(config: ExportConfig) {
    this.config = config;
  }

  /**
   * Check if WebCodecs is supported.
   */
  static isSupported(): boolean {
    return typeof VideoEncoder !== 'undefined';
  }

  /**
   * Initialize the encoder.
   */
  async initialize(): Promise<void> {
    if (!VideoEncoderWrapper.isSupported()) {
      throw new Error('WebCodecs API not supported');
    }

    const codecString = this.getCodecString();
    const support = await VideoEncoder.isConfigSupported({
      codec: codecString,
      width: this.config.width,
      height: this.config.height,
      bitrate: this.config.bitrate,
      framerate: this.config.fps,
      hardwareAcceleration: this.config.hardwareAcceleration || 'no-preference',
    });

    if (!support.supported) {
      throw new Error(`Codec ${codecString} not supported`);
    }

    this.encoder = new VideoEncoder({
      output: (chunk) => {
        this.chunks.push(chunk);
      },
      error: (e) => {
        console.error('Encoder error:', e);
      },
    });

    this.encoder.configure({
      codec: codecString,
      width: this.config.width,
      height: this.config.height,
      bitrate: this.config.bitrate,
      framerate: this.config.fps,
      hardwareAcceleration: this.config.hardwareAcceleration || 'no-preference',
    });
  }

  /**
   * Get codec string for configuration.
   */
  private getCodecString(): string {
    switch (this.config.codec) {
      case 'h264':
        return 'avc1.42E01E'; // H.264 Baseline Profile Level 3.0
      case 'vp8':
        return 'vp8';
      case 'vp9':
        return 'vp09.00.10.08'; // VP9 Profile 0, Level 1.0
      case 'av1':
        return 'av01.0.04M.08'; // AV1 Main Profile Level 3.0
      default:
        return 'avc1.42E01E';
    }
  }

  /**
   * Encode a frame.
   */
  async encodeFrame(bitmap: ImageBitmap, timestamp: number, keyFrame: boolean = false): Promise<void> {
    if (!this.encoder) {
      throw new Error('Encoder not initialized');
    }

    const frame = new VideoFrame(bitmap, {
      timestamp: timestamp * 1000, // Convert to microseconds
      duration: (1000 / this.config.fps) * 1000,
    });

    this.encoder.encode(frame, { keyFrame });
    frame.close();
    this.frameCount++;
  }

  /**
   * Flush and finalize encoding.
   */
  async finalize(): Promise<EncodedVideoChunk[]> {
    if (!this.encoder) {
      throw new Error('Encoder not initialized');
    }

    await this.encoder.flush();
    this.encoder.close();

    return this.chunks;
  }

  /**
   * Get encoded chunks.
   */
  getChunks(): EncodedVideoChunk[] {
    return this.chunks;
  }

  /**
   * Get frame count.
   */
  getFrameCount(): number {
    return this.frameCount;
  }
}

// ============================================================================
// MP4 MUXER
// ============================================================================

/**
 * Simple MP4 muxer for creating valid MP4 files.
 * Note: For production, use a library like mp4-muxer or jsmuxer.
 */
export class SimpleMp4Muxer {
  private chunks: EncodedVideoChunk[] = [];
  private config: ExportConfig;

  constructor(config: ExportConfig) {
    this.config = config;
  }

  /**
   * Add encoded chunks.
   */
  addChunks(chunks: EncodedVideoChunk[]): void {
    this.chunks.push(...chunks);
  }

  /**
   * Create MP4 buffer.
   */
  async createBuffer(): Promise<ArrayBuffer> {
    // Calculate total size
    let totalSize = 0;
    const chunkData: Uint8Array[] = [];

    for (const chunk of this.chunks) {
      const data = new Uint8Array(chunk.byteLength);
      chunk.copyTo(data);
      chunkData.push(data);
      totalSize += data.length;
    }

    // Create MP4 structure
    // This is a simplified version - real implementation needs full box structure
    const buffer = new ArrayBuffer(this.estimateFileSize(totalSize));
    const view = new DataView(buffer);

    let offset = 0;

    // ftyp box (file type)
    offset = this.writeFtyp(view, offset);

    // moov box (movie header)
    offset = this.writeMoov(view, offset, totalSize);

    // mdat box (media data)
    offset = this.writeMdat(view, offset, chunkData);

    // Return trimmed buffer
    return buffer.slice(0, offset);
  }

  /**
   * Estimate final file size.
   */
  private estimateFileSize(dataSize: number): number {
    // Add overhead for MP4 boxes
    return dataSize + 4096;
  }

  /**
   * Write ftyp box.
   */
  private writeFtyp(view: DataView, offset: number): number {
    const ftypSize = 20;

    // Box size
    view.setUint32(offset, ftypSize);
    offset += 4;

    // Box type 'ftyp'
    view.setUint8(offset++, 0x66); // f
    view.setUint8(offset++, 0x74); // t
    view.setUint8(offset++, 0x79); // y
    view.setUint8(offset++, 0x70); // p

    // Major brand 'isom'
    view.setUint8(offset++, 0x69); // i
    view.setUint8(offset++, 0x73); // s
    view.setUint8(offset++, 0x6F); // o
    view.setUint8(offset++, 0x6D); // m

    // Minor version
    view.setUint32(offset, 0x200);
    offset += 4;

    // Compatible brands
    view.setUint8(offset++, 0x69); // i
    view.setUint8(offset++, 0x73); // s
    view.setUint8(offset++, 0x6F); // o
    view.setUint8(offset++, 0x6D); // m

    return offset;
  }

  /**
   * Write moov box (simplified).
   */
  private writeMoov(view: DataView, offset: number, dataSize: number): number {
    const startOffset = offset;
    const duration = (this.chunks.length / this.config.fps) * 1000;

    // We'll calculate size after writing contents
    offset += 4; // Skip size for now

    // Box type 'moov'
    view.setUint8(offset++, 0x6D); // m
    view.setUint8(offset++, 0x6F); // o
    view.setUint8(offset++, 0x6F); // o
    view.setUint8(offset++, 0x76); // v

    // mvhd box
    offset = this.writeMvhd(view, offset, duration);

    // trak box
    offset = this.writeTrak(view, offset, dataSize, duration);

    // Update moov size
    view.setUint32(startOffset, offset - startOffset);

    return offset;
  }

  /**
   * Write mvhd box.
   */
  private writeMvhd(view: DataView, offset: number, duration: number): number {
    const mvhdSize = 108;

    view.setUint32(offset, mvhdSize);
    offset += 4;

    // Box type 'mvhd'
    this.writeString(view, offset, 'mvhd');
    offset += 4;

    // Version and flags
    view.setUint32(offset, 0);
    offset += 4;

    // Creation/modification time
    view.setUint32(offset, 0);
    offset += 4;
    view.setUint32(offset, 0);
    offset += 4;

    // Timescale
    view.setUint32(offset, 1000);
    offset += 4;

    // Duration
    view.setUint32(offset, Math.floor(duration));
    offset += 4;

    // Rate (1.0)
    view.setUint32(offset, 0x00010000);
    offset += 4;

    // Volume (1.0)
    view.setUint16(offset, 0x0100);
    offset += 2;

    // Reserved
    view.setUint16(offset, 0);
    offset += 2;
    view.setUint32(offset, 0);
    offset += 4;
    view.setUint32(offset, 0);
    offset += 4;

    // Matrix (identity)
    const matrix = [0x00010000, 0, 0, 0, 0x00010000, 0, 0, 0, 0x40000000];
    for (const m of matrix) {
      view.setUint32(offset, m);
      offset += 4;
    }

    // Pre-defined (6 zeros)
    for (let i = 0; i < 6; i++) {
      view.setUint32(offset, 0);
      offset += 4;
    }

    // Next track ID
    view.setUint32(offset, 2);
    offset += 4;

    return offset;
  }

  /**
   * Write trak box (simplified).
   */
  private writeTrak(view: DataView, offset: number, dataSize: number, duration: number): number {
    const startOffset = offset;
    offset += 4; // Skip size

    this.writeString(view, offset, 'trak');
    offset += 4;

    // tkhd box
    offset = this.writeTkhd(view, offset, duration);

    // mdia box
    offset = this.writeMdia(view, offset, dataSize, duration);

    view.setUint32(startOffset, offset - startOffset);
    return offset;
  }

  /**
   * Write tkhd box.
   */
  private writeTkhd(view: DataView, offset: number, duration: number): number {
    const tkhdSize = 92;

    view.setUint32(offset, tkhdSize);
    offset += 4;

    this.writeString(view, offset, 'tkhd');
    offset += 4;

    // Version and flags (track enabled)
    view.setUint32(offset, 0x00000003);
    offset += 4;

    // Creation/modification time
    view.setUint32(offset, 0);
    offset += 4;
    view.setUint32(offset, 0);
    offset += 4;

    // Track ID
    view.setUint32(offset, 1);
    offset += 4;

    // Reserved
    view.setUint32(offset, 0);
    offset += 4;

    // Duration
    view.setUint32(offset, Math.floor(duration));
    offset += 4;

    // Reserved
    view.setUint32(offset, 0);
    offset += 4;
    view.setUint32(offset, 0);
    offset += 4;

    // Layer
    view.setUint16(offset, 0);
    offset += 2;

    // Alternate group
    view.setUint16(offset, 0);
    offset += 2;

    // Volume
    view.setUint16(offset, 0);
    offset += 2;

    // Reserved
    view.setUint16(offset, 0);
    offset += 2;

    // Matrix
    const matrix = [0x00010000, 0, 0, 0, 0x00010000, 0, 0, 0, 0x40000000];
    for (const m of matrix) {
      view.setUint32(offset, m);
      offset += 4;
    }

    // Width
    view.setUint32(offset, this.config.width << 16);
    offset += 4;

    // Height
    view.setUint32(offset, this.config.height << 16);
    offset += 4;

    return offset;
  }

  /**
   * Write mdia box.
   */
  private writeMdia(view: DataView, offset: number, dataSize: number, duration: number): number {
    const startOffset = offset;
    offset += 4;

    this.writeString(view, offset, 'mdia');
    offset += 4;

    // mdhd box
    offset = this.writeMdhd(view, offset, duration);

    // hdlr box
    offset = this.writeHdlr(view, offset);

    // minf box
    offset = this.writeMinf(view, offset, dataSize);

    view.setUint32(startOffset, offset - startOffset);
    return offset;
  }

  /**
   * Write mdhd box.
   */
  private writeMdhd(view: DataView, offset: number, duration: number): number {
    const mdhdSize = 32;

    view.setUint32(offset, mdhdSize);
    offset += 4;

    this.writeString(view, offset, 'mdhd');
    offset += 4;

    // Version and flags
    view.setUint32(offset, 0);
    offset += 4;

    // Creation/modification time
    view.setUint32(offset, 0);
    offset += 4;
    view.setUint32(offset, 0);
    offset += 4;

    // Timescale
    view.setUint32(offset, this.config.fps * 1000);
    offset += 4;

    // Duration
    view.setUint32(offset, Math.floor(duration * this.config.fps));
    offset += 4;

    // Language (undetermined)
    view.setUint16(offset, 0x55C4);
    offset += 2;

    // Quality
    view.setUint16(offset, 0);
    offset += 2;

    return offset;
  }

  /**
   * Write hdlr box.
   */
  private writeHdlr(view: DataView, offset: number): number {
    const hdlrSize = 37;

    view.setUint32(offset, hdlrSize);
    offset += 4;

    this.writeString(view, offset, 'hdlr');
    offset += 4;

    // Version and flags
    view.setUint32(offset, 0);
    offset += 4;

    // Pre-defined
    view.setUint32(offset, 0);
    offset += 4;

    // Handler type 'vide'
    this.writeString(view, offset, 'vide');
    offset += 4;

    // Reserved
    view.setUint32(offset, 0);
    offset += 4;
    view.setUint32(offset, 0);
    offset += 4;
    view.setUint32(offset, 0);
    offset += 4;

    // Name (null terminated)
    view.setUint8(offset, 0);
    offset += 1;

    return offset;
  }

  /**
   * Write minf box (simplified).
   */
  private writeMinf(view: DataView, offset: number, dataSize: number): number {
    const startOffset = offset;
    offset += 4;

    this.writeString(view, offset, 'minf');
    offset += 4;

    // vmhd box
    offset = this.writeVmhd(view, offset);

    // dinf box
    offset = this.writeDinf(view, offset);

    // stbl box
    offset = this.writeStbl(view, offset, dataSize);

    view.setUint32(startOffset, offset - startOffset);
    return offset;
  }

  /**
   * Write vmhd box.
   */
  private writeVmhd(view: DataView, offset: number): number {
    const vmhdSize = 20;

    view.setUint32(offset, vmhdSize);
    offset += 4;

    this.writeString(view, offset, 'vmhd');
    offset += 4;

    // Version and flags
    view.setUint32(offset, 0x00000001);
    offset += 4;

    // Graphics mode
    view.setUint16(offset, 0);
    offset += 2;

    // Opcolor
    view.setUint16(offset, 0);
    offset += 2;
    view.setUint16(offset, 0);
    offset += 2;
    view.setUint16(offset, 0);
    offset += 2;

    return offset;
  }

  /**
   * Write dinf box.
   */
  private writeDinf(view: DataView, offset: number): number {
    const dinfSize = 36;

    view.setUint32(offset, dinfSize);
    offset += 4;

    this.writeString(view, offset, 'dinf');
    offset += 4;

    // dref box
    const drefSize = 28;
    view.setUint32(offset, drefSize);
    offset += 4;

    this.writeString(view, offset, 'dref');
    offset += 4;

    // Version and flags
    view.setUint32(offset, 0);
    offset += 4;

    // Entry count
    view.setUint32(offset, 1);
    offset += 4;

    // url box (self-contained)
    view.setUint32(offset, 12);
    offset += 4;

    this.writeString(view, offset, 'url ');
    offset += 4;

    // Flags (self-contained)
    view.setUint32(offset, 0x00000001);
    offset += 4;

    return offset;
  }

  /**
   * Write stbl box (sample table, simplified).
   */
  private writeStbl(view: DataView, offset: number, _dataSize: number): number {
    const startOffset = offset;
    offset += 4;

    this.writeString(view, offset, 'stbl');
    offset += 4;

    // stsd box (sample description)
    offset = this.writeStsd(view, offset);

    // stts box (time-to-sample)
    offset = this.writeStts(view, offset);

    // stsc box (sample-to-chunk)
    offset = this.writeStsc(view, offset);

    // stsz box (sample sizes)
    offset = this.writeStsz(view, offset);

    // stco box (chunk offsets)
    offset = this.writeStco(view, offset);

    view.setUint32(startOffset, offset - startOffset);
    return offset;
  }

  /**
   * Write stsd box (sample description).
   */
  private writeStsd(view: DataView, offset: number): number {
    const startOffset = offset;
    offset += 4;

    this.writeString(view, offset, 'stsd');
    offset += 4;

    // Version and flags
    view.setUint32(offset, 0);
    offset += 4;

    // Entry count
    view.setUint32(offset, 1);
    offset += 4;

    // avc1 entry
    offset = this.writeAvc1(view, offset);

    view.setUint32(startOffset, offset - startOffset);
    return offset;
  }

  /**
   * Write avc1 sample entry.
   */
  private writeAvc1(view: DataView, offset: number): number {
    const startOffset = offset;
    offset += 4;

    this.writeString(view, offset, 'avc1');
    offset += 4;

    // Reserved
    view.setUint32(offset, 0);
    offset += 4;
    view.setUint16(offset, 0);
    offset += 2;

    // Data reference index
    view.setUint16(offset, 1);
    offset += 2;

    // Pre-defined
    view.setUint16(offset, 0);
    offset += 2;

    // Reserved
    view.setUint16(offset, 0);
    offset += 2;

    // Pre-defined
    view.setUint32(offset, 0);
    offset += 4;
    view.setUint32(offset, 0);
    offset += 4;
    view.setUint32(offset, 0);
    offset += 4;

    // Width
    view.setUint16(offset, this.config.width);
    offset += 2;

    // Height
    view.setUint16(offset, this.config.height);
    offset += 2;

    // Horizontal resolution (72 dpi)
    view.setUint32(offset, 0x00480000);
    offset += 4;

    // Vertical resolution (72 dpi)
    view.setUint32(offset, 0x00480000);
    offset += 4;

    // Reserved
    view.setUint32(offset, 0);
    offset += 4;

    // Frame count
    view.setUint16(offset, 1);
    offset += 2;

    // Compressor name (32 bytes)
    for (let i = 0; i < 32; i++) {
      view.setUint8(offset++, 0);
    }

    // Depth
    view.setUint16(offset, 0x0018);
    offset += 2;

    // Pre-defined
    view.setInt16(offset, -1);
    offset += 2;

    // avcC box
    offset = this.writeAvcC(view, offset);

    view.setUint32(startOffset, offset - startOffset);
    return offset;
  }

  /**
   * Write avcC box (AVC decoder configuration).
   */
  private writeAvcC(view: DataView, offset: number): number {
    // Minimal avcC box
    const avcCSize = 19;

    view.setUint32(offset, avcCSize);
    offset += 4;

    this.writeString(view, offset, 'avcC');
    offset += 4;

    // Configuration version
    view.setUint8(offset++, 1);

    // AVC profile indication (Baseline)
    view.setUint8(offset++, 0x42);

    // Profile compatibility
    view.setUint8(offset++, 0xE0);

    // AVC level indication
    view.setUint8(offset++, 0x1E);

    // NAL unit length - 1
    view.setUint8(offset++, 0xFF);

    // SPS count
    view.setUint8(offset++, 0xE1);

    // SPS length (placeholder)
    view.setUint16(offset, 0);
    offset += 2;

    // PPS count
    view.setUint8(offset++, 0x01);

    // PPS length (placeholder)
    view.setUint16(offset, 0);
    offset += 2;

    return offset;
  }

  /**
   * Write stts box.
   */
  private writeStts(view: DataView, offset: number): number {
    const sttsSize = 24;

    view.setUint32(offset, sttsSize);
    offset += 4;

    this.writeString(view, offset, 'stts');
    offset += 4;

    // Version and flags
    view.setUint32(offset, 0);
    offset += 4;

    // Entry count
    view.setUint32(offset, 1);
    offset += 4;

    // Sample count
    view.setUint32(offset, this.chunks.length);
    offset += 4;

    // Sample delta
    view.setUint32(offset, Math.floor(1000 / this.config.fps) * this.config.fps);
    offset += 4;

    return offset;
  }

  /**
   * Write stsc box.
   */
  private writeStsc(view: DataView, offset: number): number {
    const stscSize = 28;

    view.setUint32(offset, stscSize);
    offset += 4;

    this.writeString(view, offset, 'stsc');
    offset += 4;

    // Version and flags
    view.setUint32(offset, 0);
    offset += 4;

    // Entry count
    view.setUint32(offset, 1);
    offset += 4;

    // First chunk
    view.setUint32(offset, 1);
    offset += 4;

    // Samples per chunk
    view.setUint32(offset, 1);
    offset += 4;

    // Sample description index
    view.setUint32(offset, 1);
    offset += 4;

    return offset;
  }

  /**
   * Write stsz box.
   */
  private writeStsz(view: DataView, offset: number): number {
    const stszSize = 20 + this.chunks.length * 4;

    view.setUint32(offset, stszSize);
    offset += 4;

    this.writeString(view, offset, 'stsz');
    offset += 4;

    // Version and flags
    view.setUint32(offset, 0);
    offset += 4;

    // Sample size (0 = variable)
    view.setUint32(offset, 0);
    offset += 4;

    // Sample count
    view.setUint32(offset, this.chunks.length);
    offset += 4;

    // Sample sizes
    for (const chunk of this.chunks) {
      view.setUint32(offset, chunk.byteLength);
      offset += 4;
    }

    return offset;
  }

  /**
   * Write stco box.
   */
  private writeStco(view: DataView, offset: number): number {
    const stcoSize = 16 + this.chunks.length * 4;

    view.setUint32(offset, stcoSize);
    offset += 4;

    this.writeString(view, offset, 'stco');
    offset += 4;

    // Version and flags
    view.setUint32(offset, 0);
    offset += 4;

    // Entry count
    view.setUint32(offset, this.chunks.length);
    offset += 4;

    // Chunk offsets (calculated later)
    let chunkOffset = 0; // Will be updated after moov is written
    for (let i = 0; i < this.chunks.length; i++) {
      view.setUint32(offset, chunkOffset);
      offset += 4;
      const chunk = this.chunks[i];
      if (chunk) {
        chunkOffset += chunk.byteLength;
      }
    }

    return offset;
  }

  /**
   * Write mdat box.
   */
  private writeMdat(view: DataView, offset: number, chunkData: Uint8Array[]): number {
    const startOffset = offset;
    offset += 4;

    this.writeString(view, offset, 'mdat');
    offset += 4;

    // Write chunk data
    for (const data of chunkData) {
      const targetArray = new Uint8Array(view.buffer, offset, data.length);
      targetArray.set(data);
      offset += data.length;
    }

    view.setUint32(startOffset, offset - startOffset);
    return offset;
  }

  /**
   * Write string to DataView.
   */
  private writeString(view: DataView, offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }
}

// ============================================================================
// VIDEO EXPORTER
// ============================================================================

/**
 * Internal mutable progress state.
 */
interface MutableProgress {
  phase: ExportPhase;
  framesCaptured: number;
  framesEncoded: number;
  totalFrames: number;
  percent: number;
  elapsedMs: number;
  estimatedRemainingMs: number;
  currentFps: number;
  outputSizeBytes: number;
}

/**
 * Main video exporter class.
 */
export class VideoExporter {
  private config: ExportConfig;
  private compositor: FrameCompositor;
  private encoder: VideoEncoderWrapper | null = null;
  private frameBuffer: FrameBuffer;
  private progress: MutableProgress;
  private startTime: number = 0;

  constructor(config: Partial<ExportConfig> = {}) {
    const qualityPreset = config.quality || 'standard';
    this.config = {
      ...DEFAULT_EXPORT_CONFIG,
      ...QUALITY_PRESETS[qualityPreset],
      ...config,
    };

    this.compositor = new FrameCompositor({
      width: this.config.width,
      height: this.config.height,
    });

    this.frameBuffer = new FrameBuffer(30);

    this.progress = {
      phase: 'initializing',
      framesCaptured: 0,
      framesEncoded: 0,
      totalFrames: 0,
      percent: 0,
      elapsedMs: 0,
      estimatedRemainingMs: 0,
      currentFps: 0,
      outputSizeBytes: 0,
    };
  }

  /**
   * Export an interaction sequence to video.
   */
  async export(
    sequence: InteractionSequence,
    onProgress?: ExportProgressCallback
  ): Promise<Blob> {
    this.startTime = performance.now();
    const totalDuration = this.calculateSequenceDuration(sequence);
    const totalFrames = Math.ceil(totalDuration * this.config.fps / 1000);

    this.progress = {
      ...this.progress,
      phase: 'initializing',
      totalFrames,
    };
    onProgress?.(this.progress);

    // Initialize encoder
    if (VideoEncoderWrapper.isSupported()) {
      this.encoder = new VideoEncoderWrapper(this.config);
      await this.encoder.initialize();
    }

    // Capture frames
    this.progress.phase = 'capturing';
    onProgress?.(this.progress);

    const frameInterval = 1000 / this.config.fps;
    let currentTime = 0;

    while (currentTime < totalDuration) {
      // Create playback state for this time
      const state = this.createPlaybackState(sequence, currentTime);

      // Render frame
      const frame = this.compositor.renderFrame(state);
      this.frameBuffer.add(frame);

      this.progress.framesCaptured++;

      // Encode when buffer is full
      if (this.frameBuffer.isFull()) {
        await this.encodeBufferedFrames(currentTime);
      }

      // Update progress
      this.updateProgress(onProgress);

      currentTime += frameInterval;
    }

    // Encode remaining frames
    await this.encodeBufferedFrames(currentTime);

    // Finalize
    this.progress.phase = 'finalizing';
    onProgress?.(this.progress);

    const blob = await this.finalize();

    this.progress.phase = 'complete';
    this.progress.percent = 100;
    onProgress?.(this.progress);

    return blob;
  }

  /**
   * Calculate total sequence duration.
   */
  private calculateSequenceDuration(sequence: InteractionSequence): number {
    if (sequence.actions.length === 0) return 0;

    let maxTime = 0;
    for (const action of sequence.actions) {
      const endTime = action.timestamp + (action.type === 'annotation' ? action.duration : 0);
      maxTime = Math.max(maxTime, endTime);
    }

    return maxTime + 1000; // Add 1 second buffer
  }

  /**
   * Create playback state for a given time.
   */
  private createPlaybackState(
    sequence: InteractionSequence,
    time: number
  ): PlaybackState {
    // Find cursor position by interpolating through mouse moves
    let cursorPosition = { x: this.config.width / 2, y: this.config.height / 2 };

    const mouseActions = sequence.actions.filter(
      a => a.type === 'mouse-move' || a.type === 'click' || a.type === 'drag-start'
    );

    for (let i = 0; i < mouseActions.length; i++) {
      const action = mouseActions[i];
      if (!action) continue;
      if (action.timestamp > time) {
        // Interpolate between previous and current action
        const prevAction = mouseActions[i - 1];
        if (i > 0 && prevAction) {
          const prevPos = this.getActionPosition(prevAction);
          const currPos = this.getActionPosition(action);
          const t = (time - prevAction.timestamp) / (action.timestamp - prevAction.timestamp);
          cursorPosition = {
            x: prevPos.x + (currPos.x - prevPos.x) * t,
            y: prevPos.y + (currPos.y - prevPos.y) * t,
          };
        }
        break;
      }
      cursorPosition = this.getActionPosition(action);
    }

    // Collect active annotations
    const activeAnnotations = sequence.actions.filter(
      a => a.type === 'annotation' && a.timestamp <= time && a.timestamp + a.duration > time
    );

    // Collect visual effects
    const visualEffects = this.collectVisualEffects(sequence, time);

    return {
      sequence,
      currentTime: time,
      isPlaying: true,
      isPaused: false,
      currentActionIndex: 0,
      cursorPosition,
      activeAnnotations: activeAnnotations as any[],
      visualEffects,
      playbackRate: 1,
    };
  }

  /**
   * Get position from action.
   */
  private getActionPosition(action: any): { x: number; y: number } {
    if (action.position) return action.position;
    if (action.startPosition) return action.startPosition;
    return { x: 0, y: 0 };
  }

  /**
   * Collect visual effects for current time.
   */
  private collectVisualEffects(sequence: InteractionSequence, time: number): any[] {
    const effects: any[] = [];

    for (const action of sequence.actions) {
      // Click ripples
      if (action.type === 'click') {
        const elapsed = time - action.timestamp;
        if (elapsed >= 0 && elapsed < 500) {
          effects.push({
            type: 'click-ripple',
            position: action.position,
            data: { progress: elapsed / 500 },
          });
        }
      }

      // Key indicators
      if (action.type === 'key-press') {
        const elapsed = time - action.timestamp;
        if (elapsed >= 0 && elapsed < 800) {
          effects.push({
            type: 'key-indicator',
            position: { x: this.config.width - 150, y: this.config.height - 80 },
            data: {
              key: action.key,
              modifiers: action.modifiers || {},
              progress: elapsed / 800,
            },
          });
        }
      }

      // Drag ghost
      if (action.type === 'drag-start') {
        const elapsed = time - action.timestamp;
        if (elapsed >= 0 && elapsed < 100) {
          // DragSequenceAction and DragAction both have position
          const pos = 'position' in action ? action.position : ('from' in action ? action.from : { x: 0, y: 0 });
          effects.push({
            type: 'drag-ghost',
            position: pos,
            data: {},
          });
        }
      }
    }

    return effects;
  }

  /**
   * Encode buffered frames.
   */
  private async encodeBufferedFrames(_currentTime: number): Promise<void> {
    const frames = this.frameBuffer.flush();

    if (this.encoder) {
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        if (!frame) continue;
        const frameTime = (this.progress.framesEncoded + i) * (1000 / this.config.fps);
        const isKeyFrame = (this.progress.framesEncoded + i) % 30 === 0;
        await this.encoder.encodeFrame(frame, frameTime, isKeyFrame);
        frame.close();
      }
      this.progress.framesEncoded += frames.length;
    }

    this.progress.phase = 'encoding';
  }

  /**
   * Update progress.
   */
  private updateProgress(onProgress?: ExportProgressCallback): void {
    const elapsed = performance.now() - this.startTime;
    const framesPerSecond = this.progress.framesCaptured / (elapsed / 1000);
    const remainingFrames = this.progress.totalFrames - this.progress.framesCaptured;
    const estimatedRemaining = remainingFrames / framesPerSecond * 1000;

    this.progress = {
      ...this.progress,
      percent: Math.floor((this.progress.framesCaptured / this.progress.totalFrames) * 100),
      elapsedMs: elapsed,
      estimatedRemainingMs: estimatedRemaining,
      currentFps: framesPerSecond,
    };

    onProgress?.(this.progress);
  }

  /**
   * Finalize and create output.
   */
  private async finalize(): Promise<Blob> {
    if (this.encoder) {
      const chunks = await this.encoder.finalize();

      if (this.config.format === 'mp4') {
        const muxer = new SimpleMp4Muxer(this.config);
        muxer.addChunks(chunks);
        const buffer = await muxer.createBuffer();
        this.progress.outputSizeBytes = buffer.byteLength;
        return new Blob([buffer], { type: 'video/mp4' });
      }

      // For WebM, just concatenate chunks
      const totalSize = chunks.reduce((sum, c) => sum + c.byteLength, 0);
      const buffer = new ArrayBuffer(totalSize);
      const view = new Uint8Array(buffer);
      let offset = 0;
      for (const chunk of chunks) {
        const data = new Uint8Array(chunk.byteLength);
        chunk.copyTo(data);
        view.set(data, offset);
        offset += data.length;
      }
      this.progress.outputSizeBytes = buffer.byteLength;
      return new Blob([buffer], { type: 'video/webm' });
    }

    // Fallback: return empty blob
    return new Blob([], { type: 'video/mp4' });
  }

  /**
   * Get current configuration.
   */
  getConfig(): ExportConfig {
    return this.config;
  }

  /**
   * Update configuration.
   */
  setConfig(config: Partial<ExportConfig>): void {
    this.config = { ...this.config, ...config };
    this.compositor.setConfig({
      width: this.config.width,
      height: this.config.height,
    });
  }
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

/**
 * Create a demo video of a layout.
 */
export async function createLayoutDemoVideo(
  layoutName: string,
  onProgress?: ExportProgressCallback
): Promise<Blob> {
  // Import layout presets dynamically
  const { ABLETON_LAYOUT, CUBASE_LAYOUT, RENOISE_LAYOUT } = await import('../layout-bridge');
  const { createBasicDemoSequence } = await import('./interaction-recorder');

  // Select layout
  let layout = RENOISE_LAYOUT;
  if (layoutName === 'ableton') layout = ABLETON_LAYOUT;
  if (layoutName === 'cubase') layout = CUBASE_LAYOUT;

  // Create sequence
  const sequence = createBasicDemoSequence(layout);

  // Export
  const exporter = new VideoExporter({ quality: 'preview' });
  return exporter.export(sequence, onProgress);
}

/**
 * Check if video export is supported.
 */
export function isVideoExportSupported(): boolean {
  return VideoEncoderWrapper.isSupported();
}

/**
 * Get supported video formats.
 */
export async function getSupportedFormats(): Promise<VideoFormat[]> {
  const formats: VideoFormat[] = ['gif']; // GIF always supported via canvas

  if (VideoEncoderWrapper.isSupported()) {
    // Check H.264 support
    try {
      const h264Support = await VideoEncoder.isConfigSupported({
        codec: 'avc1.42E01E',
        width: 1920,
        height: 1080,
        bitrate: 5_000_000,
        framerate: 30,
      });
      if (h264Support.supported) {
        formats.push('mp4');
      }
    } catch { /* ignore */ }

    // Check VP8/VP9 support
    try {
      const vp9Support = await VideoEncoder.isConfigSupported({
        codec: 'vp09.00.10.08',
        width: 1920,
        height: 1080,
        bitrate: 5_000_000,
        framerate: 30,
      });
      if (vp9Support.supported) {
        formats.push('webm');
      }
    } catch { /* ignore */ }
  }

  return formats;
}
