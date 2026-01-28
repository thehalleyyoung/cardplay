/**
 * @fileoverview Surge Wavetable Import
 * 
 * Import wavetables from various formats:
 * - Surge .wt format (native)
 * - WAV files (multi-cycle detection)
 * - Serum .wav (2048 samples/frame)
 * - Single-cycle waveforms
 * - Additive/harmonic specification
 * 
 * @module @cardplay/core/audio/wavetable-import
 */

import {
  type Wavetable,
  type WavetableFrame,
  DEFAULT_FRAME_SIZE,
  MAX_FRAMES,
  generateFromHarmonics,
  normalizeWavetable,
} from './wavetable-core';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Surge wavetable magic number */
export const SURGE_WT_MAGIC = 0x77617673; // 'vaws' in little-endian

/** Serum standard frame size */
export const SERUM_FRAME_SIZE = 2048;

/** Common single-cycle sizes */
export const COMMON_CYCLE_SIZES = [256, 512, 1024, 2048, 4096, 8192];

/** Maximum file size for import (100MB) */
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

// ============================================================================
// TYPES
// ============================================================================

/**
 * Import result with metadata.
 */
export interface WavetableImportResult {
  /** Whether import was successful */
  success: boolean;
  /** Imported wavetable (if successful) */
  wavetable?: Wavetable;
  /** Error message (if failed) */
  error?: string;
  /** Warnings during import */
  warnings: string[];
  /** Source format detected */
  sourceFormat: string;
  /** Import statistics */
  stats: {
    originalFrameCount: number;
    importedFrameCount: number;
    originalFrameSize: number;
    importedFrameSize: number;
    processingTimeMs: number;
  };
}

/**
 * WAV file header structure.
 */
export interface WAVHeader {
  sampleRate: number;
  bitsPerSample: number;
  numChannels: number;
  dataLength: number;
  dataOffset: number;
  format: number; // 1 = PCM, 3 = IEEE float
}

/**
 * Surge .wt header structure.
 */
export interface SurgeWTHeader {
  magic: number;
  version: number;
  frameSize: number;
  frameCount: number;
  flags: number;
}

/**
 * Import options.
 */
export interface WavetableImportOptions {
  /** Target frame size (will resample if different) */
  targetFrameSize?: number;
  /** Maximum frames to import */
  maxFrames?: number;
  /** Normalize after import */
  normalize?: boolean;
  /** Name to assign to wavetable */
  name?: string;
  /** Category to assign */
  category?: string;
  /** Tags to assign */
  tags?: string[];
  /** Assume Serum format (2048 samples/frame) */
  assumeSerum?: boolean;
  /** Force specific frame count (for WAV) */
  forceFrameCount?: number;
}

// ============================================================================
// WAV PARSING
// ============================================================================

/**
 * Parse WAV file header from ArrayBuffer.
 */
export function parseWAVHeader(buffer: ArrayBuffer): WAVHeader | null {
  if (buffer.byteLength < 44) return null;
  
  const view = new DataView(buffer);
  
  // Check RIFF header
  const riff = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3)
  );
  if (riff !== 'RIFF') return null;
  
  // Check WAVE format
  const wave = String.fromCharCode(
    view.getUint8(8),
    view.getUint8(9),
    view.getUint8(10),
    view.getUint8(11)
  );
  if (wave !== 'WAVE') return null;
  
  // Find fmt chunk
  let offset = 12;
  let fmtOffset = -1;
  let dataOffset = -1;
  let dataLength = 0;
  
  while (offset < buffer.byteLength - 8) {
    const chunkId = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3)
    );
    const chunkSize = view.getUint32(offset + 4, true);
    
    if (chunkId === 'fmt ') {
      fmtOffset = offset + 8;
    } else if (chunkId === 'data') {
      dataOffset = offset + 8;
      dataLength = chunkSize;
    }
    
    offset += 8 + chunkSize;
    // Align to even boundary
    if (chunkSize % 2 !== 0) offset++;
  }
  
  if (fmtOffset === -1 || dataOffset === -1) return null;
  
  return {
    format: view.getUint16(fmtOffset, true),
    numChannels: view.getUint16(fmtOffset + 2, true),
    sampleRate: view.getUint32(fmtOffset + 4, true),
    bitsPerSample: view.getUint16(fmtOffset + 14, true),
    dataOffset,
    dataLength,
  };
}

/**
 * Extract audio samples from WAV buffer.
 */
export function extractWAVSamples(
  buffer: ArrayBuffer,
  header: WAVHeader
): Float32Array | null {
  const view = new DataView(buffer);
  const bytesPerSample = header.bitsPerSample / 8;
  const sampleCount = header.dataLength / (bytesPerSample * header.numChannels);
  const samples = new Float32Array(sampleCount);
  
  let readOffset = header.dataOffset;
  
  for (let i = 0; i < sampleCount; i++) {
    let sample: number;
    
    // Read first channel only (mono or left)
    if (header.format === 3) {
      // IEEE float
      if (header.bitsPerSample === 32) {
        sample = view.getFloat32(readOffset, true);
      } else if (header.bitsPerSample === 64) {
        sample = view.getFloat64(readOffset, true);
      } else {
        return null;
      }
    } else if (header.format === 1) {
      // PCM
      if (header.bitsPerSample === 8) {
        sample = (view.getUint8(readOffset) - 128) / 128;
      } else if (header.bitsPerSample === 16) {
        sample = view.getInt16(readOffset, true) / 32768;
      } else if (header.bitsPerSample === 24) {
        const b0 = view.getUint8(readOffset);
        const b1 = view.getUint8(readOffset + 1);
        const b2 = view.getInt8(readOffset + 2);
        const value = b0 | (b1 << 8) | (b2 << 16);
        sample = value / 8388608;
      } else if (header.bitsPerSample === 32) {
        sample = view.getInt32(readOffset, true) / 2147483648;
      } else {
        return null;
      }
    } else {
      return null;
    }
    
    samples[i] = sample;
    readOffset += bytesPerSample * header.numChannels;
  }
  
  return samples;
}

// ============================================================================
// SURGE .WT PARSING
// ============================================================================

/**
 * Parse Surge .wt header.
 */
export function parseSurgeWTHeader(buffer: ArrayBuffer): SurgeWTHeader | null {
  if (buffer.byteLength < 16) return null;
  
  const view = new DataView(buffer);
  const magic = view.getUint32(0, true);
  
  if (magic !== SURGE_WT_MAGIC) return null;
  
  return {
    magic,
    version: view.getUint16(4, true),
    frameSize: view.getUint16(6, true),
    frameCount: view.getUint16(8, true),
    flags: view.getUint16(10, true),
  };
}

/**
 * Import Surge .wt file.
 */
export function importSurgeWT(
  buffer: ArrayBuffer,
  options: WavetableImportOptions = {}
): WavetableImportResult {
  const startTime = performance.now();
  const warnings: string[] = [];
  
  const header = parseSurgeWTHeader(buffer);
  if (!header) {
    return {
      success: false,
      error: 'Invalid Surge .wt file',
      warnings,
      sourceFormat: 'unknown',
      stats: {
        originalFrameCount: 0,
        importedFrameCount: 0,
        originalFrameSize: 0,
        importedFrameSize: 0,
        processingTimeMs: performance.now() - startTime,
      },
    };
  }
  
  const view = new DataView(buffer);
  const frames: WavetableFrame[] = [];
  let offset = 12; // After header
  
  // Read each frame
  for (let f = 0; f < header.frameCount && f < (options.maxFrames ?? MAX_FRAMES); f++) {
    const samples = new Float32Array(header.frameSize);
    
    for (let i = 0; i < header.frameSize; i++) {
      // Surge uses 16-bit signed integers
      if (offset + 2 <= buffer.byteLength) {
        samples[i] = view.getInt16(offset, true) / 32768;
        offset += 2;
      }
    }
    
    frames.push({
      samples,
      index: f,
    });
  }
  
  let wavetable: Wavetable = {
    id: `surge-${Date.now()}`,
    name: options.name ?? 'Surge Import',
    frames,
    frameSize: header.frameSize,
    frameCount: frames.length,
    ...(options.category && { category: options.category }),
    ...(options.tags && { tags: options.tags }),
  };
  
  if (options.normalize) {
    wavetable = normalizeWavetable(wavetable);
  }
  
  return {
    success: true,
    wavetable,
    warnings,
    sourceFormat: 'surge-wt',
    stats: {
      originalFrameCount: header.frameCount,
      importedFrameCount: frames.length,
      originalFrameSize: header.frameSize,
      importedFrameSize: header.frameSize,
      processingTimeMs: performance.now() - startTime,
    },
  };
}

// ============================================================================
// WAV WAVETABLE IMPORT
// ============================================================================

/**
 * Detect frame count from WAV sample count.
 */
export function detectFrameCount(
  sampleCount: number,
  options: WavetableImportOptions = {}
): { frameSize: number; frameCount: number } {
  // If Serum format is assumed
  if (options.assumeSerum) {
    return {
      frameSize: SERUM_FRAME_SIZE,
      frameCount: Math.floor(sampleCount / SERUM_FRAME_SIZE),
    };
  }
  
  // If frame count is forced
  if (options.forceFrameCount && options.forceFrameCount > 0) {
    const frameSize = Math.floor(sampleCount / options.forceFrameCount);
    // Round to nearest power of 2
    const log2 = Math.round(Math.log2(frameSize));
    const roundedFrameSize = Math.pow(2, Math.max(6, Math.min(13, log2)));
    return {
      frameSize: roundedFrameSize,
      frameCount: options.forceFrameCount,
    };
  }
  
  // Try to detect based on common cycle sizes
  for (const cycleSize of COMMON_CYCLE_SIZES) {
    if (sampleCount % cycleSize === 0) {
      const frameCount = sampleCount / cycleSize;
      if (frameCount >= 1 && frameCount <= MAX_FRAMES) {
        return { frameSize: cycleSize, frameCount };
      }
    }
  }
  
  // Fall back to trying to find a reasonable split
  // Prefer frame sizes that are powers of 2
  for (const cycleSize of COMMON_CYCLE_SIZES) {
    const frameCount = Math.floor(sampleCount / cycleSize);
    if (frameCount >= 2 && frameCount <= MAX_FRAMES) {
      return { frameSize: cycleSize, frameCount };
    }
  }
  
  // Last resort: treat as single cycle
  // Round to nearest power of 2
  const log2 = Math.round(Math.log2(sampleCount));
  const roundedSize = Math.pow(2, Math.max(6, Math.min(13, log2)));
  return { frameSize: roundedSize, frameCount: 1 };
}

/**
 * Import WAV file as wavetable.
 */
export function importWAV(
  buffer: ArrayBuffer,
  options: WavetableImportOptions = {}
): WavetableImportResult {
  const startTime = performance.now();
  const warnings: string[] = [];
  
  if (buffer.byteLength > MAX_FILE_SIZE) {
    return {
      success: false,
      error: 'File too large',
      warnings,
      sourceFormat: 'wav',
      stats: {
        originalFrameCount: 0,
        importedFrameCount: 0,
        originalFrameSize: 0,
        importedFrameSize: 0,
        processingTimeMs: performance.now() - startTime,
      },
    };
  }
  
  const header = parseWAVHeader(buffer);
  if (!header) {
    return {
      success: false,
      error: 'Invalid WAV file',
      warnings,
      sourceFormat: 'wav',
      stats: {
        originalFrameCount: 0,
        importedFrameCount: 0,
        originalFrameSize: 0,
        importedFrameSize: 0,
        processingTimeMs: performance.now() - startTime,
      },
    };
  }
  
  const samples = extractWAVSamples(buffer, header);
  if (!samples) {
    return {
      success: false,
      error: 'Failed to extract samples',
      warnings,
      sourceFormat: 'wav',
      stats: {
        originalFrameCount: 0,
        importedFrameCount: 0,
        originalFrameSize: 0,
        importedFrameSize: 0,
        processingTimeMs: performance.now() - startTime,
      },
    };
  }
  
  if (header.numChannels > 1) {
    warnings.push(`Multi-channel file (${header.numChannels} channels), using first channel only`);
  }
  
  // Detect frame structure
  const { frameSize, frameCount } = detectFrameCount(samples.length, options);
  
  if (samples.length !== frameSize * frameCount) {
    warnings.push(`Sample count (${samples.length}) doesn't match ${frameCount} × ${frameSize}. Truncating or padding.`);
  }
  
  // Extract frames
  const frames: WavetableFrame[] = [];
  const targetFrameSize = options.targetFrameSize ?? frameSize;
  
  for (let f = 0; f < frameCount && f < (options.maxFrames ?? MAX_FRAMES); f++) {
    const sourceOffset = f * frameSize;
    let frameSamples: Float32Array;
    
    if (targetFrameSize === frameSize) {
      // Direct copy
      frameSamples = new Float32Array(frameSize);
      for (let i = 0; i < frameSize; i++) {
        frameSamples[i] = samples[sourceOffset + i] ?? 0;
      }
    } else {
      // Resample to target size
      frameSamples = new Float32Array(targetFrameSize);
      for (let i = 0; i < targetFrameSize; i++) {
        const sourceIndex = (i / targetFrameSize) * frameSize + sourceOffset;
        const i0 = Math.floor(sourceIndex);
        const frac = sourceIndex - i0;
        const s0 = samples[i0] ?? 0;
        const s1 = samples[i0 + 1] ?? s0;
        frameSamples[i] = s0 * (1 - frac) + s1 * frac;
      }
    }
    
    frames.push({
      samples: frameSamples,
      index: f,
    });
  }
  
  let wavetable: Wavetable = {
    id: `wav-${Date.now()}`,
    name: options.name ?? 'WAV Import',
    frames,
    frameSize: targetFrameSize,
    frameCount: frames.length,
    ...(options.category && { category: options.category }),
    ...(options.tags && { tags: options.tags }),
    sampleRate: header.sampleRate,
  };
  
  if (options.normalize) {
    wavetable = normalizeWavetable(wavetable);
  }
  
  return {
    success: true,
    wavetable,
    warnings,
    sourceFormat: options.assumeSerum ? 'serum-wav' : 'wav',
    stats: {
      originalFrameCount: frameCount,
      importedFrameCount: frames.length,
      originalFrameSize: frameSize,
      importedFrameSize: targetFrameSize,
      processingTimeMs: performance.now() - startTime,
    },
  };
}

// ============================================================================
// AUDIO BUFFER IMPORT
// ============================================================================

/**
 * Import wavetable from AudioBuffer (Web Audio API).
 */
export function importFromAudioBuffer(
  audioBuffer: AudioBuffer,
  options: WavetableImportOptions = {}
): WavetableImportResult {
  const startTime = performance.now();
  const warnings: string[] = [];
  
  // Get first channel
  const samples = audioBuffer.getChannelData(0);
  
  if (audioBuffer.numberOfChannels > 1) {
    warnings.push(`Multi-channel audio (${audioBuffer.numberOfChannels} channels), using first channel only`);
  }
  
  // Detect frame structure
  const { frameSize, frameCount } = detectFrameCount(samples.length, options);
  const targetFrameSize = options.targetFrameSize ?? frameSize;
  
  // Extract frames
  const frames: WavetableFrame[] = [];
  
  for (let f = 0; f < frameCount && f < (options.maxFrames ?? MAX_FRAMES); f++) {
    const sourceOffset = f * frameSize;
    let frameSamples: Float32Array;
    
    if (targetFrameSize === frameSize) {
      frameSamples = samples.slice(sourceOffset, sourceOffset + frameSize);
    } else {
      frameSamples = new Float32Array(targetFrameSize);
      for (let i = 0; i < targetFrameSize; i++) {
        const sourceIndex = (i / targetFrameSize) * frameSize + sourceOffset;
        const i0 = Math.floor(sourceIndex);
        const frac = sourceIndex - i0;
        const s0 = samples[i0] ?? 0;
        const s1 = samples[i0 + 1] ?? s0;
        frameSamples[i] = s0 * (1 - frac) + s1 * frac;
      }
    }
    
    frames.push({
      samples: frameSamples,
      index: f,
    });
  }
  
  let wavetable: Wavetable = {
    id: `buffer-${Date.now()}`,
    name: options.name ?? 'Audio Import',
    frames,
    frameSize: targetFrameSize,
    frameCount: frames.length,
    ...(options.category && { category: options.category }),
    ...(options.tags && { tags: options.tags }),
    sampleRate: audioBuffer.sampleRate,
  };
  
  if (options.normalize) {
    wavetable = normalizeWavetable(wavetable);
  }
  
  return {
    success: true,
    wavetable,
    warnings,
    sourceFormat: 'audiobuffer',
    stats: {
      originalFrameCount: frameCount,
      importedFrameCount: frames.length,
      originalFrameSize: frameSize,
      importedFrameSize: targetFrameSize,
      processingTimeMs: performance.now() - startTime,
    },
  };
}

// ============================================================================
// SINGLE-CYCLE IMPORT
// ============================================================================

/**
 * Import a single waveform cycle as a 1-frame wavetable.
 */
export function importSingleCycle(
  samples: Float32Array,
  options: WavetableImportOptions = {}
): WavetableImportResult {
  const startTime = performance.now();
  const warnings: string[] = [];
  
  const targetFrameSize = options.targetFrameSize ?? DEFAULT_FRAME_SIZE;
  let frameSamples: Float32Array;
  
  if (samples.length === targetFrameSize) {
    frameSamples = new Float32Array(samples);
  } else {
    // Resample
    frameSamples = new Float32Array(targetFrameSize);
    for (let i = 0; i < targetFrameSize; i++) {
      const sourceIndex = (i / targetFrameSize) * samples.length;
      const i0 = Math.floor(sourceIndex);
      const frac = sourceIndex - i0;
      const s0 = samples[i0 % samples.length] ?? 0;
      const s1 = samples[(i0 + 1) % samples.length] ?? 0;
      frameSamples[i] = s0 * (1 - frac) + s1 * frac;
    }
    warnings.push(`Resampled from ${samples.length} to ${targetFrameSize} samples`);
  }
  
  let wavetable: Wavetable = {
    id: `single-${Date.now()}`,
    name: options.name ?? 'Single Cycle',
    frames: [{
      samples: frameSamples,
      index: 0,
    }],
    frameSize: targetFrameSize,
    frameCount: 1,
    ...(options.category && { category: options.category }),
    ...(options.tags && { tags: options.tags }),
  };
  
  if (options.normalize) {
    wavetable = normalizeWavetable(wavetable);
  }
  
  return {
    success: true,
    wavetable,
    warnings,
    sourceFormat: 'single-cycle',
    stats: {
      originalFrameCount: 1,
      importedFrameCount: 1,
      originalFrameSize: samples.length,
      importedFrameSize: targetFrameSize,
      processingTimeMs: performance.now() - startTime,
    },
  };
}

// ============================================================================
// ADDITIVE/HARMONIC IMPORT
// ============================================================================

/**
 * Harmonic specification for import.
 */
export interface HarmonicSpec {
  /** Harmonic number (1 = fundamental) */
  harmonic: number;
  /** Amplitude (0-1) */
  amplitude: number;
  /** Phase in radians */
  phase?: number;
}

/**
 * Create wavetable from harmonic specification.
 */
export function importFromHarmonics(
  harmonicsSpec: HarmonicSpec[],
  options: WavetableImportOptions = {}
): WavetableImportResult {
  const startTime = performance.now();
  const warnings: string[] = [];
  
  const frameSize = options.targetFrameSize ?? DEFAULT_FRAME_SIZE;
  
  // Build amplitude and phase arrays
  const maxHarmonic = Math.max(...harmonicsSpec.map(h => h.harmonic));
  const amplitudes = new Array(maxHarmonic).fill(0);
  const phases = new Array(maxHarmonic).fill(0);
  
  for (const spec of harmonicsSpec) {
    if (spec.harmonic > 0 && spec.harmonic <= maxHarmonic) {
      amplitudes[spec.harmonic - 1] = spec.amplitude;
      phases[spec.harmonic - 1] = spec.phase ?? 0;
    }
  }
  
  const samples = generateFromHarmonics(amplitudes, phases, frameSize);
  
  let wavetable: Wavetable = {
    id: `harmonic-${Date.now()}`,
    name: options.name ?? 'Harmonic',
    frames: [{
      samples,
      index: 0,
    }],
    frameSize,
    frameCount: 1,
    category: options.category ?? 'Additive',
    tags: options.tags ?? ['additive', 'harmonic'],
  };
  
  if (options.normalize !== false) {
    wavetable = normalizeWavetable(wavetable);
  }
  
  return {
    success: true,
    wavetable,
    warnings,
    sourceFormat: 'harmonics',
    stats: {
      originalFrameCount: 1,
      importedFrameCount: 1,
      originalFrameSize: frameSize,
      importedFrameSize: frameSize,
      processingTimeMs: performance.now() - startTime,
    },
  };
}

/**
 * Create multi-frame wavetable with evolving harmonics.
 */
export function importEvolvingHarmonics(
  startHarmonics: HarmonicSpec[],
  endHarmonics: HarmonicSpec[],
  frameCount: number,
  options: WavetableImportOptions = {}
): WavetableImportResult {
  const startTime = performance.now();
  const warnings: string[] = [];
  
  const frameSize = options.targetFrameSize ?? DEFAULT_FRAME_SIZE;
  const frames: WavetableFrame[] = [];
  
  // Get max harmonic from both
  const maxHarmonic = Math.max(
    Math.max(...startHarmonics.map(h => h.harmonic)),
    Math.max(...endHarmonics.map(h => h.harmonic))
  );
  
  // Build start and end arrays
  const startAmps = new Array(maxHarmonic).fill(0);
  const startPhases = new Array(maxHarmonic).fill(0);
  const endAmps = new Array(maxHarmonic).fill(0);
  const endPhases = new Array(maxHarmonic).fill(0);
  
  for (const spec of startHarmonics) {
    if (spec.harmonic > 0 && spec.harmonic <= maxHarmonic) {
      startAmps[spec.harmonic - 1] = spec.amplitude;
      startPhases[spec.harmonic - 1] = spec.phase ?? 0;
    }
  }
  
  for (const spec of endHarmonics) {
    if (spec.harmonic > 0 && spec.harmonic <= maxHarmonic) {
      endAmps[spec.harmonic - 1] = spec.amplitude;
      endPhases[spec.harmonic - 1] = spec.phase ?? 0;
    }
  }
  
  // Generate interpolated frames
  for (let f = 0; f < frameCount; f++) {
    const t = frameCount > 1 ? f / (frameCount - 1) : 0;
    
    const amplitudes = startAmps.map((start, i) => 
      start * (1 - t) + endAmps[i]! * t
    );
    const phases = startPhases.map((start, i) => 
      start * (1 - t) + endPhases[i]! * t
    );
    
    const samples = generateFromHarmonics(amplitudes, phases, frameSize);
    
    frames.push({
      samples,
      index: f,
    });
  }
  
  let wavetable: Wavetable = {
    id: `evolving-${Date.now()}`,
    name: options.name ?? 'Evolving Harmonics',
    frames,
    frameSize,
    frameCount,
    category: options.category ?? 'Additive',
    tags: options.tags ?? ['additive', 'evolving', 'morph'],
  };
  
  if (options.normalize !== false) {
    wavetable = normalizeWavetable(wavetable);
  }
  
  return {
    success: true,
    wavetable,
    warnings,
    sourceFormat: 'evolving-harmonics',
    stats: {
      originalFrameCount: frameCount,
      importedFrameCount: frameCount,
      originalFrameSize: frameSize,
      importedFrameSize: frameSize,
      processingTimeMs: performance.now() - startTime,
    },
  };
}

// ============================================================================
// AUTO-DETECT IMPORT
// ============================================================================

/**
 * Detect file format and import accordingly.
 */
export function autoImport(
  buffer: ArrayBuffer,
  options: WavetableImportOptions = {}
): WavetableImportResult {
  // Check for Surge .wt magic
  if (buffer.byteLength >= 4) {
    const view = new DataView(buffer);
    const magic = view.getUint32(0, true);
    if (magic === SURGE_WT_MAGIC) {
      return importSurgeWT(buffer, options);
    }
  }
  
  // Check for WAV
  if (buffer.byteLength >= 12) {
    const view = new DataView(buffer);
    const riff = String.fromCharCode(
      view.getUint8(0),
      view.getUint8(1),
      view.getUint8(2),
      view.getUint8(3)
    );
    const wave = String.fromCharCode(
      view.getUint8(8),
      view.getUint8(9),
      view.getUint8(10),
      view.getUint8(11)
    );
    if (riff === 'RIFF' && wave === 'WAVE') {
      return importWAV(buffer, options);
    }
  }
  
  // Unknown format
  return {
    success: false,
    error: 'Unknown file format',
    warnings: [],
    sourceFormat: 'unknown',
    stats: {
      originalFrameCount: 0,
      importedFrameCount: 0,
      originalFrameSize: 0,
      importedFrameSize: 0,
      processingTimeMs: 0,
    },
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Constants
  SURGE_WT_MAGIC,
  SERUM_FRAME_SIZE,
  COMMON_CYCLE_SIZES,
  MAX_FILE_SIZE,
  
  // WAV parsing
  parseWAVHeader,
  extractWAVSamples,
  
  // Surge parsing
  parseSurgeWTHeader,
  importSurgeWT,
  
  // WAV import
  detectFrameCount,
  importWAV,
  
  // Other imports
  importFromAudioBuffer,
  importSingleCycle,
  importFromHarmonics,
  importEvolvingHarmonics,
  
  // Auto-detect
  autoImport,
};
