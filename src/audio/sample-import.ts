/**
 * @fileoverview Sample Import Module - File Upload and Format Handling
 * 
 * Implements file upload handling for multiple audio formats,
 * drag-and-drop import, sample library scanning, and format importers
 * for SFZ, SF2, EXS24, and other common sampler formats.
 * 
 * @module @cardplay/core/audio/sample-import
 */

// ============================================================================
// FILE FORMAT TYPES
// ============================================================================

/** Supported audio file formats */
export type AudioFileFormat = 
  | 'wav' | 'aiff' | 'aif' | 'flac' | 'mp3' | 'ogg' | 'opus' 
  | 'webm' | 'mp4' | 'm4a' | 'caf' | 'wv' | 'ape';

/** Supported sampler instrument formats */
export type InstrumentFileFormat = 
  | 'sfz' | 'sf2' | 'sf3' | 'exs24' | 'exs' | 'nki' | 'nkm'
  | 'xi' | 'its' | 'dls' | 'gig' | 'dss' | 'ot' | 'syx';

/** File extension to format mapping */
export const AUDIO_FORMAT_MAP: Record<string, AudioFileFormat> = {
  '.wav': 'wav',
  '.wave': 'wav',
  '.aiff': 'aiff',
  '.aif': 'aif',
  '.flac': 'flac',
  '.mp3': 'mp3',
  '.ogg': 'ogg',
  '.opus': 'opus',
  '.webm': 'webm',
  '.mp4': 'mp4',
  '.m4a': 'm4a',
  '.caf': 'caf',
  '.wv': 'wv',
  '.ape': 'ape',
};

export const INSTRUMENT_FORMAT_MAP: Record<string, InstrumentFileFormat> = {
  '.sfz': 'sfz',
  '.sf2': 'sf2',
  '.sf3': 'sf3',
  '.exs24': 'exs24',
  '.exs': 'exs',
  '.nki': 'nki',
  '.nkm': 'nkm',
  '.xi': 'xi',
  '.its': 'its',
  '.dls': 'dls',
  '.gig': 'gig',
  '.dss': 'dss',
  '.ot': 'ot',
  '.syx': 'syx',
};

// ============================================================================
// IMPORT RESULT TYPES
// ============================================================================

/** Result of importing a single sample */
export interface SampleImportResult {
  success: boolean;
  filename: string;
  path?: string;
  format: AudioFileFormat | InstrumentFileFormat | 'unknown';
  sampleRate?: number;
  channels?: number;
  duration?: number;
  bitDepth?: number;
  audioBuffer?: AudioBuffer;
  error?: string;
  warnings: string[];
  metadata: SampleMetadata;
}

/** Metadata extracted from sample file */
export interface SampleMetadata {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  comment?: string;
  copyright?: string;
  date?: string;
  loopStart?: number;
  loopEnd?: number;
  loopType?: 'forward' | 'pingpong' | 'reverse' | 'off';
  rootKey?: number;
  fineTune?: number;
  keyLow?: number;
  keyHigh?: number;
  velocityLow?: number;
  velocityHigh?: number;
  gain?: number;
  pan?: number;
  bpm?: number;
  beats?: number;
  timeSignature?: [number, number];
}

/** Result of importing an instrument (multi-sample) */
export interface InstrumentImportResult {
  success: boolean;
  filename: string;
  format: InstrumentFileFormat;
  name?: string;
  zones: ZoneImportData[];
  globalSettings: GlobalInstrumentSettings;
  error?: string;
  warnings: string[];
}

/** Zone data from instrument import */
export interface ZoneImportData {
  samplePath: string;
  sampleBuffer?: AudioBuffer;
  keyLow: number;
  keyHigh: number;
  velocityLow: number;
  velocityHigh: number;
  rootKey: number;
  fineTune: number;
  gain: number;
  pan: number;
  loopMode: 'off' | 'forward' | 'pingpong' | 'reverse';
  loopStart?: number;
  loopEnd?: number;
  loopCrossfade?: number;
  group?: number;
  trigger?: 'attack' | 'release' | 'first' | 'legato';
  rtDecay?: number;
  pitchKeytrack?: number;
  output?: string;
  offset?: number;
}

/** Global instrument settings */
export interface GlobalInstrumentSettings {
  volume?: number;
  pan?: number;
  polyphony?: number;
  pitchBendRange?: number;
  transpose?: number;
  fineTune?: number;
  ampEnvelope?: EnvelopeSettings;
  filterEnvelope?: EnvelopeSettings;
  pitchEnvelope?: EnvelopeSettings;
  filter?: FilterSettings;
}

/** Envelope settings from instrument */
export interface EnvelopeSettings {
  delay?: number;
  attack: number;
  hold?: number;
  decay: number;
  sustain: number;
  release: number;
  depth?: number;
}

/** Filter settings from instrument */
export interface FilterSettings {
  type: 'lowpass' | 'highpass' | 'bandpass' | 'notch' | 'off';
  cutoff: number;
  resonance: number;
  keytrack?: number;
}

// ============================================================================
// FILE UPLOAD HANDLER
// ============================================================================

/** Options for file upload handler */
export interface FileUploadOptions {
  acceptedFormats?: (AudioFileFormat | InstrumentFileFormat)[];
  maxFileSize?: number;
  maxFiles?: number;
  sampleRate?: number;
  normalize?: boolean;
  detectPitch?: boolean;
  detectTempo?: boolean;
  extractMetadata?: boolean;
}

const DEFAULT_UPLOAD_OPTIONS: Required<FileUploadOptions> = {
  acceptedFormats: ['wav', 'aiff', 'aif', 'flac', 'mp3', 'ogg'],
  maxFileSize: 100 * 1024 * 1024, // 100MB
  maxFiles: 100,
  sampleRate: 44100,
  normalize: false,
  detectPitch: true,
  detectTempo: true,
  extractMetadata: true,
};

/**
 * Handle file upload for audio samples
 */
export class FileUploadHandler {
  private options: Required<FileUploadOptions>;
  private audioContext: AudioContext | null = null;
  
  constructor(options: FileUploadOptions = {}) {
    this.options = { ...DEFAULT_UPLOAD_OPTIONS, ...options };
  }
  
  /**
   * Set or update audio context for decoding
   */
  setAudioContext(ctx: AudioContext): void {
    this.audioContext = ctx;
  }
  
  /**
   * Process file input from file picker or drop
   */
  async processFiles(files: FileList | File[]): Promise<SampleImportResult[]> {
    const fileArray = Array.from(files);
    
    if (fileArray.length > this.options.maxFiles) {
      throw new Error(`Too many files. Maximum is ${this.options.maxFiles}`);
    }
    
    const results: SampleImportResult[] = [];
    
    for (const file of fileArray) {
      const result = await this.processFile(file);
      results.push(result);
    }
    
    return results;
  }
  
  /**
   * Process a single file
   */
  async processFile(file: File): Promise<SampleImportResult> {
    const warnings: string[] = [];
    const metadata: SampleMetadata = {};
    
    // Check file size
    if (file.size > this.options.maxFileSize) {
      return {
        success: false,
        filename: file.name,
        format: 'unknown',
        error: `File too large. Maximum size is ${this.options.maxFileSize / (1024 * 1024)}MB`,
        warnings: [],
        metadata: {},
      };
    }
    
    // Get file extension
    const ext = this.getExtension(file.name);
    const format = AUDIO_FORMAT_MAP[ext] || INSTRUMENT_FORMAT_MAP[ext];
    
    if (!format) {
      return {
        success: false,
        filename: file.name,
        format: 'unknown',
        error: `Unsupported file format: ${ext}`,
        warnings: [],
        metadata: {},
      };
    }
    
    // Check if format is accepted
    if (!this.options.acceptedFormats.includes(format)) {
      return {
        success: false,
        filename: file.name,
        format,
        error: `Format not accepted: ${format}`,
        warnings: [],
        metadata: {},
      };
    }
    
    // Read file contents
    let arrayBuffer: ArrayBuffer;
    try {
      arrayBuffer = await file.arrayBuffer();
    } catch (err) {
      return {
        success: false,
        filename: file.name,
        format,
        error: `Failed to read file: ${err instanceof Error ? err.message : String(err)}`,
        warnings: [],
        metadata: {},
      };
    }
    
    // Decode audio
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: this.options.sampleRate });
    }
    
    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    } catch (err) {
      return {
        success: false,
        filename: file.name,
        format,
        error: `Failed to decode audio: ${err instanceof Error ? err.message : String(err)}`,
        warnings: [],
        metadata: {},
      };
    }
    
    // Extract metadata if requested
    if (this.options.extractMetadata) {
      const extractedMeta = this.extractMetadataFromBuffer(arrayBuffer, format);
      Object.assign(metadata, extractedMeta);
    }
    
    // Detect pitch if requested
    if (this.options.detectPitch && !metadata.rootKey) {
      const detectedPitch = await this.detectPitch(audioBuffer);
      if (detectedPitch) {
        metadata.rootKey = detectedPitch.midiNote;
        metadata.fineTune = detectedPitch.centsOffset;
      }
    }
    
    // Detect tempo if requested
    if (this.options.detectTempo && !metadata.bpm) {
      const detectedTempo = await this.detectTempo(audioBuffer);
      if (detectedTempo) {
        metadata.bpm = detectedTempo.bpm;
        metadata.beats = detectedTempo.beats;
      }
    }
    
    // Normalize if requested
    if (this.options.normalize) {
      audioBuffer = this.normalizeBuffer(audioBuffer);
    }
    
    const bitDepth = this.detectBitDepth(arrayBuffer, format);
    const result: SampleImportResult = {
      success: true,
      filename: file.name,
      format,
      sampleRate: audioBuffer.sampleRate,
      channels: audioBuffer.numberOfChannels,
      duration: audioBuffer.duration,
      audioBuffer,
      warnings,
      metadata,
    };
    if (bitDepth !== undefined) {
      result.bitDepth = bitDepth;
    }
    return result;
  }
  
  /**
   * Get file extension with dot
   */
  private getExtension(filename: string): string {
    const idx = filename.lastIndexOf('.');
    return idx >= 0 ? filename.slice(idx).toLowerCase() : '';
  }
  
  /**
   * Extract metadata from buffer based on format
   */
  private extractMetadataFromBuffer(buffer: ArrayBuffer, format: AudioFileFormat | InstrumentFileFormat): SampleMetadata {
    const view = new DataView(buffer);
    const metadata: SampleMetadata = {};
    
    if (format === 'wav') {
      // Parse WAV chunks for metadata
      const wavMeta = this.parseWavMetadata(view);
      Object.assign(metadata, wavMeta);
    } else if (format === 'aiff' || format === 'aif') {
      // Parse AIFF chunks
      const aiffMeta = this.parseAiffMetadata(view);
      Object.assign(metadata, aiffMeta);
    }
    
    return metadata;
  }
  
  /**
   * Parse WAV file metadata from RIFF chunks
   */
  private parseWavMetadata(view: DataView): SampleMetadata {
    const metadata: SampleMetadata = {};
    
    try {
      // Check RIFF header
      const riff = this.readFourCC(view, 0);
      if (riff !== 'RIFF') return metadata;
      
      const wave = this.readFourCC(view, 8);
      if (wave !== 'WAVE') return metadata;
      
      let offset = 12;
      const fileSize = view.byteLength;
      
      while (offset < fileSize - 8) {
        const chunkId = this.readFourCC(view, offset);
        const chunkSize = view.getUint32(offset + 4, true);
        offset += 8;
        
        if (chunkId === 'smpl') {
          // Sampler chunk - contains loop points
          if (chunkSize >= 36) {
            metadata.rootKey = view.getUint32(offset + 12, true);
            metadata.fineTune = view.getInt32(offset + 16, true);
            
            const numLoops = view.getUint32(offset + 28, true);
            if (numLoops > 0 && chunkSize >= 60) {
              const loopType = view.getUint32(offset + 36 + 4, true);
              metadata.loopStart = view.getUint32(offset + 36 + 8, true);
              metadata.loopEnd = view.getUint32(offset + 36 + 12, true);
              metadata.loopType = loopType === 0 ? 'forward' : loopType === 1 ? 'pingpong' : loopType === 2 ? 'reverse' : 'forward';
            }
          }
        } else if (chunkId === 'inst') {
          // Instrument chunk
          if (chunkSize >= 7) {
            metadata.rootKey = view.getUint8(offset);
            metadata.fineTune = view.getInt8(offset + 1);
            metadata.gain = view.getInt8(offset + 2);
            metadata.keyLow = view.getUint8(offset + 3);
            metadata.keyHigh = view.getUint8(offset + 4);
            metadata.velocityLow = view.getUint8(offset + 5);
            metadata.velocityHigh = view.getUint8(offset + 6);
          }
        } else if (chunkId === 'acid') {
          // ACID chunk for tempo info
          if (chunkSize >= 24) {
            const type = view.getUint32(offset, true);
            const rootNote = view.getUint16(offset + 4, true);
            const numBeats = view.getUint32(offset + 16, true);
            const bpm = view.getFloat32(offset + 20, true);
            
            if (type & 0x01) { // One-shot flag
              metadata.beats = numBeats;
              metadata.bpm = bpm;
            }
            if (rootNote > 0 && rootNote <= 127) {
              metadata.rootKey = rootNote;
            }
          }
        } else if (chunkId === 'LIST') {
          // LIST chunk may contain INFO
          const listType = this.readFourCC(view, offset);
          if (listType === 'INFO') {
            this.parseInfoChunk(view, offset + 4, chunkSize - 4, metadata);
          }
        }
        
        offset += chunkSize + (chunkSize % 2); // Word-aligned
      }
    } catch {
      // Ignore parsing errors, return partial metadata
    }
    
    return metadata;
  }
  
  /**
   * Parse INFO sub-chunks for text metadata
   */
  private parseInfoChunk(view: DataView, offset: number, size: number, metadata: SampleMetadata): void {
    const endOffset = offset + size;
    
    while (offset < endOffset - 8) {
      const chunkId = this.readFourCC(view, offset);
      const chunkSize = view.getUint32(offset + 4, true);
      offset += 8;
      
      const text = this.readString(view, offset, chunkSize);
      
      switch (chunkId) {
        case 'INAM': metadata.title = text; break;
        case 'IART': metadata.artist = text; break;
        case 'IPRD': metadata.album = text; break;
        case 'IGNR': metadata.genre = text; break;
        case 'ICMT': metadata.comment = text; break;
        case 'ICOP': metadata.copyright = text; break;
        case 'ICRD': metadata.date = text; break;
      }
      
      offset += chunkSize + (chunkSize % 2);
    }
  }
  
  /**
   * Parse AIFF file metadata
   */
  private parseAiffMetadata(view: DataView): SampleMetadata {
    const metadata: SampleMetadata = {};
    
    try {
      const form = this.readFourCC(view, 0);
      if (form !== 'FORM') return metadata;
      
      const aiff = this.readFourCC(view, 8);
      if (aiff !== 'AIFF' && aiff !== 'AIFC') return metadata;
      
      let offset = 12;
      const fileSize = view.byteLength;
      
      while (offset < fileSize - 8) {
        const chunkId = this.readFourCC(view, offset);
        const chunkSize = view.getUint32(offset + 4, false); // Big-endian
        offset += 8;
        
        if (chunkId === 'INST') {
          // Instrument chunk
          if (chunkSize >= 20) {
            metadata.rootKey = view.getUint8(offset);
            metadata.fineTune = view.getInt8(offset + 1);
            metadata.keyLow = view.getUint8(offset + 2);
            metadata.keyHigh = view.getUint8(offset + 3);
            metadata.velocityLow = view.getUint8(offset + 4);
            metadata.velocityHigh = view.getUint8(offset + 5);
            metadata.gain = view.getInt16(offset + 6, false);
            
            // Loop info at offset 8-19
            const sustainLoop = view.getInt16(offset + 8, false);
            if (sustainLoop !== 0) {
              metadata.loopType = sustainLoop === 1 ? 'forward' : sustainLoop === 2 ? 'pingpong' : 'forward';
            }
          }
        } else if (chunkId === 'MARK') {
          // Marker chunk for loop points
          const numMarkers = view.getUint16(offset, false);
          // Parse markers for loop start/end
          let markerOffset = offset + 2;
          for (let i = 0; i < numMarkers && markerOffset < offset + chunkSize; i++) {
            const markerId = view.getUint16(markerOffset, false);
            const position = view.getUint32(markerOffset + 2, false);
            const nameLen = view.getUint8(markerOffset + 6);
            const name = this.readString(view, markerOffset + 7, nameLen);
            
            if (name.toLowerCase().includes('loop start') || markerId === 1) {
              metadata.loopStart = position;
            } else if (name.toLowerCase().includes('loop end') || markerId === 2) {
              metadata.loopEnd = position;
            }
            
            markerOffset += 7 + nameLen + (nameLen % 2 === 0 ? 1 : 0);
          }
        }
        
        offset += chunkSize + (chunkSize % 2);
      }
    } catch {
      // Ignore errors
    }
    
    return metadata;
  }
  
  /**
   * Read 4-character chunk ID
   */
  private readFourCC(view: DataView, offset: number): string {
    return String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3)
    );
  }
  
  /**
   * Read null-terminated or fixed-length string
   */
  private readString(view: DataView, offset: number, maxLen: number): string {
    const chars: number[] = [];
    for (let i = 0; i < maxLen; i++) {
      const c = view.getUint8(offset + i);
      if (c === 0) break;
      chars.push(c);
    }
    return String.fromCharCode(...chars);
  }
  
  /**
   * Detect bit depth from raw buffer
   */
  private detectBitDepth(buffer: ArrayBuffer, format: AudioFileFormat | InstrumentFileFormat): number | undefined {
    const view = new DataView(buffer);
    
    if (format === 'wav') {
      // Find fmt chunk
      try {
        const riff = this.readFourCC(view, 0);
        if (riff !== 'RIFF') return undefined;
        
        let offset = 12;
        while (offset < buffer.byteLength - 8) {
          const chunkId = this.readFourCC(view, offset);
          const chunkSize = view.getUint32(offset + 4, true);
          
          if (chunkId === 'fmt ') {
            return view.getUint16(offset + 8 + 14, true); // bitsPerSample
          }
          
          offset += 8 + chunkSize + (chunkSize % 2);
        }
      } catch {
        return undefined;
      }
    }
    
    return undefined;
  }
  
  /**
   * Simple pitch detection using autocorrelation
   */
  private async detectPitch(buffer: AudioBuffer): Promise<{ midiNote: number; centsOffset: number } | null> {
    // Get mono data
    const data = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    
    // Use a portion of the audio (first 0.5 seconds or entire file if shorter)
    const analyzeLength = Math.min(Math.floor(sampleRate * 0.5), data.length);
    const analysisData = data.slice(0, analyzeLength);
    
    // Simple autocorrelation for pitch detection
    const minPeriod = Math.floor(sampleRate / 2000); // ~2000 Hz max
    const maxPeriod = Math.floor(sampleRate / 20);   // ~20 Hz min
    
    let bestCorrelation = 0;
    let bestPeriod = 0;
    
    for (let period = minPeriod; period <= maxPeriod; period++) {
      let correlation = 0;
      let count = 0;
      
      for (let i = 0; i < analyzeLength - period; i++) {
        correlation += analysisData[i]! * analysisData[i + period]!;
        count++;
      }
      
      correlation /= count;
      
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }
    
    if (bestPeriod === 0 || bestCorrelation < 0.1) {
      return null;
    }
    
    const frequency = sampleRate / bestPeriod;
    const midiNote = Math.round(12 * Math.log2(frequency / 440) + 69);
    const exactMidi = 12 * Math.log2(frequency / 440) + 69;
    const centsOffset = Math.round((exactMidi - midiNote) * 100);
    
    return { midiNote, centsOffset };
  }
  
  /**
   * Simple tempo detection using onset detection
   */
  private async detectTempo(buffer: AudioBuffer): Promise<{ bpm: number; beats: number } | null> {
    const data = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    
    // Get onsets using simple energy difference
    const frameSize = Math.floor(sampleRate * 0.01); // 10ms frames
    const hopSize = Math.floor(frameSize / 2);
    
    const energies: number[] = [];
    for (let i = 0; i < data.length - frameSize; i += hopSize) {
      let energy = 0;
      for (let j = 0; j < frameSize; j++) {
        energy += data[i + j]! * data[i + j]!;
      }
      energies.push(energy);
    }
    
    // Find peaks in energy difference
    const diffs: number[] = [];
    for (let i = 1; i < energies.length; i++) {
      diffs.push(Math.max(0, energies[i]! - energies[i - 1]!));
    }
    
    // Find threshold for onsets
    const meanDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    const threshold = meanDiff * 3;
    
    // Find onset times
    const onsets: number[] = [];
    for (let i = 1; i < diffs.length - 1; i++) {
      if (diffs[i]! > threshold && diffs[i]! > diffs[i - 1]! && diffs[i]! > diffs[i + 1]!) {
        onsets.push((i * hopSize) / sampleRate);
      }
    }
    
    if (onsets.length < 4) {
      return null;
    }
    
    // Calculate inter-onset intervals
    const intervals: number[] = [];
    for (let i = 1; i < onsets.length; i++) {
      intervals.push(onsets[i]! - onsets[i - 1]!);
    }
    
    // Find median interval
    intervals.sort((a, b) => a - b);
    const medianInterval = intervals[Math.floor(intervals.length / 2)];
    
    if (medianInterval === undefined) {
      return null;
    }
    
    // Convert to BPM
    let bpm = 60 / medianInterval;
    
    // Adjust to reasonable range
    while (bpm < 60) bpm *= 2;
    while (bpm > 200) bpm /= 2;
    
    const beats = Math.round(buffer.duration / medianInterval);
    
    return { bpm: Math.round(bpm), beats };
  }
  
  /**
   * Normalize audio buffer to peak level
   */
  private normalizeBuffer(buffer: AudioBuffer): AudioBuffer {
    // Find peak
    let peak = 0;
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < data.length; i++) {
        peak = Math.max(peak, Math.abs(data[i]!));
      }
    }
    
    if (peak < 0.001 || peak >= 1) {
      return buffer;
    }
    
    // Create new buffer with normalized data
    const ctx = this.audioContext || new AudioContext();
    const newBuffer = ctx.createBuffer(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );
    
    const scale = 1 / peak;
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const input = buffer.getChannelData(ch);
      const output = newBuffer.getChannelData(ch);
      for (let i = 0; i < input.length; i++) {
        output[i] = input[i]! * scale;
      }
    }
    
    return newBuffer;
  }
}

// ============================================================================
// SAMPLE LIBRARY SCANNER
// ============================================================================

/** Directory entry from scanning */
export interface ScanEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  format?: AudioFileFormat | InstrumentFileFormat;
  modified?: Date;
}

/** Scan result with categorized files */
export interface ScanResult {
  audioFiles: ScanEntry[];
  instrumentFiles: ScanEntry[];
  directories: ScanEntry[];
  totalSize: number;
  scanTime: number;
}

/** Sample library structure */
export interface SampleLibrary {
  id: string;
  name: string;
  rootPath: string;
  entries: ScanEntry[];
  categories: Map<string, ScanEntry[]>;
  lastScanned: Date;
  totalFiles: number;
  totalSize: number;
}

/**
 * Scanner for local sample libraries
 * Note: In browser environment, uses File System Access API
 */
export class SampleLibraryScanner {
  private libraries: Map<string, SampleLibrary> = new Map();
  
  /**
   * Request access to a directory and scan it
   * Uses File System Access API (browser only)
   */
  async scanDirectory(directoryHandle?: FileSystemDirectoryHandle): Promise<ScanResult> {
    const startTime = performance.now();
    const result: ScanResult = {
      audioFiles: [],
      instrumentFiles: [],
      directories: [],
      totalSize: 0,
      scanTime: 0,
    };
    
    // If no handle provided, request one
    if (!directoryHandle && typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
      try {
        directoryHandle = await (window as any).showDirectoryPicker();
      } catch {
        throw new Error('Directory access denied or cancelled');
      }
    }
    
    if (!directoryHandle) {
      throw new Error('File System Access API not supported');
    }
    
    await this.scanDirectoryRecursive(directoryHandle, '', result);
    
    result.scanTime = performance.now() - startTime;
    return result;
  }
  
  /**
   * Recursive directory scanning
   */
  private async scanDirectoryRecursive(
    handle: FileSystemDirectoryHandle,
    currentPath: string,
    result: ScanResult
  ): Promise<void> {
    try {
      for await (const entry of (handle as any).values()) {
        const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
        
        if (entry.kind === 'directory') {
          result.directories.push({
            name: entry.name,
            path: entryPath,
            type: 'directory',
          });
          
          // Recurse into subdirectory
          await this.scanDirectoryRecursive(entry, entryPath, result);
        } else if (entry.kind === 'file') {
          const ext = this.getExtension(entry.name);
          const audioFormat = AUDIO_FORMAT_MAP[ext];
          const instrumentFormat = INSTRUMENT_FORMAT_MAP[ext];
          
          if (audioFormat) {
            const file = await entry.getFile();
            result.audioFiles.push({
              name: entry.name,
              path: entryPath,
              type: 'file',
              size: file.size,
              format: audioFormat,
              modified: new Date(file.lastModified),
            });
            result.totalSize += file.size;
          } else if (instrumentFormat) {
            const file = await entry.getFile();
            result.instrumentFiles.push({
              name: entry.name,
              path: entryPath,
              type: 'file',
              size: file.size,
              format: instrumentFormat,
              modified: new Date(file.lastModified),
            });
            result.totalSize += file.size;
          }
        }
      }
    } catch (err) {
      console.warn(`Error scanning directory: ${err}`);
    }
  }
  
  /**
   * Get file extension
   */
  private getExtension(filename: string): string {
    const idx = filename.lastIndexOf('.');
    return idx >= 0 ? filename.slice(idx).toLowerCase() : '';
  }
  
  /**
   * Create a library from scan result
   */
  createLibrary(name: string, rootPath: string, scanResult: ScanResult): SampleLibrary {
    const id = `lib_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    
    const entries = [
      ...scanResult.audioFiles,
      ...scanResult.instrumentFiles,
      ...scanResult.directories,
    ];
    
    // Categorize by directory structure
    const categories = new Map<string, ScanEntry[]>();
    
    for (const entry of scanResult.audioFiles) {
      const category = this.extractCategory(entry.path);
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(entry);
    }
    
    const library: SampleLibrary = {
      id,
      name,
      rootPath,
      entries,
      categories,
      lastScanned: new Date(),
      totalFiles: scanResult.audioFiles.length + scanResult.instrumentFiles.length,
      totalSize: scanResult.totalSize,
    };
    
    this.libraries.set(id, library);
    return library;
  }
  
  /**
   * Extract category from path
   */
  private extractCategory(path: string): string {
    const parts = path.split('/');
    if (parts.length > 1 && parts[0] !== undefined) {
      return parts[0];
    }
    return 'Uncategorized';
  }
  
  /**
   * Get all libraries
   */
  getLibraries(): SampleLibrary[] {
    return Array.from(this.libraries.values());
  }
  
  /**
   * Get library by ID
   */
  getLibrary(id: string): SampleLibrary | undefined {
    return this.libraries.get(id);
  }
  
  /**
   * Remove library
   */
  removeLibrary(id: string): boolean {
    return this.libraries.delete(id);
  }
}

// ============================================================================
// SFZ FORMAT PARSER
// ============================================================================

/** SFZ opcode value */
type SfzOpcodeValue = string | number;

/** SFZ region (zone) */
interface SfzRegion {
  sample?: string;
  lokey?: number;
  hikey?: number;
  lovel?: number;
  hivel?: number;
  pitch_keycenter?: number;
  tune?: number;
  volume?: number;
  pan?: number;
  loop_mode?: string;
  loop_start?: number;
  loop_end?: number;
  offset?: number;
  group?: number;
  off_by?: number;
  trigger?: string;
  rt_decay?: number;
  pitch_keytrack?: number;
  ampeg_attack?: number;
  ampeg_hold?: number;
  ampeg_decay?: number;
  ampeg_sustain?: number;
  ampeg_release?: number;
  [key: string]: SfzOpcodeValue | undefined;
}

/** SFZ group with shared opcodes */
interface SfzGroup {
  opcodes: Record<string, SfzOpcodeValue>;
  regions: SfzRegion[];
}

/** Parsed SFZ file */
interface ParsedSfz {
  control: Record<string, SfzOpcodeValue>;
  global: Record<string, SfzOpcodeValue>;
  groups: SfzGroup[];
  regions: SfzRegion[];
}

/**
 * Parse SFZ file format
 */
export class SfzParser {
  /**
   * Parse SFZ content string
   */
  parse(content: string): ParsedSfz {
    const result: ParsedSfz = {
      control: {},
      global: {},
      groups: [],
      regions: [],
    };
    
    // Remove comments
    content = content.replace(/\/\/.*$/gm, '');
    
    let currentSection: 'control' | 'global' | 'group' | 'region' | null = null;
    let currentGroup: SfzGroup | null = null;
    let currentRegion: SfzRegion | null = null;
    
    const lines = content.split('\n');
    
    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      
      // Check for section headers
      const headerMatch = line.match(/<(\w+)>/);
      if (headerMatch && headerMatch[1]) {
        const header = headerMatch[1].toLowerCase();
        
        // Save previous region
        if (currentRegion) {
          if (currentGroup) {
            currentGroup.regions.push(currentRegion);
          } else {
            result.regions.push(currentRegion);
          }
          currentRegion = null;
        }
        
        // Handle new section
        if (header === 'control') {
          currentSection = 'control';
        } else if (header === 'global') {
          currentSection = 'global';
        } else if (header === 'group') {
          // Save previous group
          if (currentGroup) {
            result.groups.push(currentGroup);
          }
          currentGroup = { opcodes: {}, regions: [] };
          currentSection = 'group';
        } else if (header === 'region') {
          currentRegion = {};
          currentSection = 'region';
        }
        
        // Parse opcodes on same line as header
        line = line.slice(headerMatch[0].length).trim();
        if (!line) continue;
      }
      
      // Parse opcodes
      const opcodeRegex = /(\w+)=([^\s]+)/g;
      let match;
      
      while ((match = opcodeRegex.exec(line)) !== null) {
        const [, key, value] = match;
        if (key === undefined || value === undefined) continue;
        const numValue = parseFloat(value);
        const parsedValue = isNaN(numValue) ? value : numValue;
        
        switch (currentSection) {
          case 'control':
            result.control[key] = parsedValue;
            break;
          case 'global':
            result.global[key] = parsedValue;
            break;
          case 'group':
            if (currentGroup) {
              currentGroup.opcodes[key] = parsedValue;
            }
            break;
          case 'region':
            if (currentRegion) {
              (currentRegion as Record<string, SfzOpcodeValue>)[key] = parsedValue;
            }
            break;
        }
      }
    }
    
    // Save final region/group
    if (currentRegion) {
      if (currentGroup) {
        currentGroup.regions.push(currentRegion);
      } else {
        result.regions.push(currentRegion);
      }
    }
    if (currentGroup) {
      result.groups.push(currentGroup);
    }
    
    return result;
  }
  
  /**
   * Convert parsed SFZ to ZoneImportData array
   */
  toZones(parsed: ParsedSfz, basePath: string): ZoneImportData[] {
    const zones: ZoneImportData[] = [];
    
    // Process regions within groups
    for (const group of parsed.groups) {
      for (const region of group.regions) {
        const zone = this.regionToZone(region, group.opcodes, parsed.global, basePath);
        if (zone) {
          zones.push(zone);
        }
      }
    }
    
    // Process standalone regions
    for (const region of parsed.regions) {
      const zone = this.regionToZone(region, {}, parsed.global, basePath);
      if (zone) {
        zones.push(zone);
      }
    }
    
    return zones;
  }
  
  /**
   * Convert a single region to ZoneImportData
   */
  private regionToZone(
    region: SfzRegion,
    groupOpcodes: Record<string, SfzOpcodeValue>,
    globalOpcodes: Record<string, SfzOpcodeValue>,
    basePath: string
  ): ZoneImportData | null {
    // Merge opcodes (region > group > global)
    const merged = { ...globalOpcodes, ...groupOpcodes, ...region };
    
    if (!merged.sample) {
      return null;
    }
    
    // Handle path separators
    let samplePath = String(merged.sample).replace(/\\/g, '/');
    if (!samplePath.startsWith('/') && !samplePath.match(/^[A-Z]:/i)) {
      samplePath = `${basePath}/${samplePath}`;
    }
    
    const zone: ZoneImportData = {
      samplePath,
      keyLow: Number(merged.lokey ?? 0),
      keyHigh: Number(merged.hikey ?? 127),
      velocityLow: Number(merged.lovel ?? 0),
      velocityHigh: Number(merged.hivel ?? 127),
      rootKey: Number(merged.pitch_keycenter ?? 60),
      fineTune: Number(merged.tune ?? 0),
      gain: Number(merged.volume ?? 0),
      pan: Number(merged.pan ?? 0),
      loopMode: this.parseLoopMode(String(merged.loop_mode ?? 'no_loop')),
      trigger: this.parseTrigger(String(merged.trigger ?? 'attack')),
      pitchKeytrack: merged.pitch_keytrack !== undefined ? Number(merged.pitch_keytrack) : 100,
    };
    if (merged.loop_start !== undefined) zone.loopStart = Number(merged.loop_start);
    if (merged.loop_end !== undefined) zone.loopEnd = Number(merged.loop_end);
    if (merged.group !== undefined) zone.group = Number(merged.group);
    if (merged.rt_decay !== undefined) zone.rtDecay = Number(merged.rt_decay);
    if (merged.offset !== undefined) zone.offset = Number(merged.offset);
    return zone;
  }
  
  /**
   * Parse SFZ loop mode
   */
  private parseLoopMode(mode: string): 'off' | 'forward' | 'pingpong' | 'reverse' {
    switch (mode.toLowerCase()) {
      case 'loop_continuous':
      case 'loop_sustain':
        return 'forward';
      case 'loop_bidirectional':
        return 'pingpong';
      case 'no_loop':
      case 'one_shot':
      default:
        return 'off';
    }
  }
  
  /**
   * Parse SFZ trigger mode
   */
  private parseTrigger(trigger: string): 'attack' | 'release' | 'first' | 'legato' {
    switch (trigger.toLowerCase()) {
      case 'release':
      case 'release_key':
        return 'release';
      case 'first':
        return 'first';
      case 'legato':
        return 'legato';
      case 'attack':
      default:
        return 'attack';
    }
  }
}

// ============================================================================
// SF2 (SOUNDFONT 2) PARSER
// ============================================================================

/** SF2 preset zone */
interface Sf2PresetZone {
  presetBagIndex: number;
  instrumentIndex: number;
  keyLow: number;
  keyHigh: number;
  velLow: number;
  velHigh: number;
}

/** SF2 instrument zone */
interface Sf2InstrumentZone {
  sampleIndex: number;
  keyLow: number;
  keyHigh: number;
  velLow: number;
  velHigh: number;
  rootKey: number;
  fineTune: number;
  pan: number;
  attenuation: number;
  loopStart: number;
  loopEnd: number;
  loopMode: number;
}

/** SF2 sample header */
interface Sf2Sample {
  name: string;
  start: number;
  end: number;
  loopStart: number;
  loopEnd: number;
  sampleRate: number;
  originalPitch: number;
  pitchCorrection: number;
  sampleLink: number;
  sampleType: number;
}

/** SF2 instrument */
interface Sf2Instrument {
  name: string;
  zones: Sf2InstrumentZone[];
}

/** SF2 preset */
interface Sf2Preset {
  name: string;
  preset: number;
  bank: number;
  zones: Sf2PresetZone[];
}

/** Parsed SF2 file */
interface ParsedSf2 {
  presets: Sf2Preset[];
  instruments: Sf2Instrument[];
  samples: Sf2Sample[];
  sampleData: Int16Array;
}

/**
 * Parse SF2 (SoundFont 2) file format
 */
export class Sf2Parser {
  /**
   * Parse SF2 file from ArrayBuffer
   */
  parse(buffer: ArrayBuffer): ParsedSf2 {
    const view = new DataView(buffer);
    
    // Check RIFF header
    const riff = this.readFourCC(view, 0);
    if (riff !== 'RIFF') {
      throw new Error('Not a valid RIFF file');
    }
    
    const sfbk = this.readFourCC(view, 8);
    if (sfbk !== 'sfbk') {
      throw new Error('Not a valid SoundFont file');
    }
    
    const result: ParsedSf2 = {
      presets: [],
      instruments: [],
      samples: [],
      sampleData: new Int16Array(0),
    };
    
    let offset = 12;
    const fileSize = buffer.byteLength;
    
    while (offset < fileSize - 8) {
      const listType = this.readFourCC(view, offset);
      const listSize = view.getUint32(offset + 4, true);
      
      if (listType === 'LIST') {
        const listId = this.readFourCC(view, offset + 8);
        
        if (listId === 'sdta') {
          // Sample data chunk
          this.parseSdta(view, offset + 12, listSize - 4, result);
        } else if (listId === 'pdta') {
          // Preset data chunk
          this.parsePdta(view, offset + 12, listSize - 4, result);
        }
      }
      
      offset += 8 + listSize + (listSize % 2);
    }
    
    return result;
  }
  
  /**
   * Parse sample data chunk
   */
  private parseSdta(view: DataView, offset: number, size: number, result: ParsedSf2): void {
    const endOffset = offset + size;
    
    while (offset < endOffset - 8) {
      const chunkId = this.readFourCC(view, offset);
      const chunkSize = view.getUint32(offset + 4, true);
      
      if (chunkId === 'smpl') {
        // 16-bit sample data
        const samples = new Int16Array(chunkSize / 2);
        for (let i = 0; i < samples.length; i++) {
          samples[i] = view.getInt16(offset + 8 + i * 2, true);
        }
        result.sampleData = samples;
      }
      
      offset += 8 + chunkSize + (chunkSize % 2);
    }
  }
  
  /**
   * Parse preset data chunk
   */
  private parsePdta(view: DataView, offset: number, size: number, result: ParsedSf2): void {
    const endOffset = offset + size;
    
    const chunks: Record<string, { offset: number; size: number }> = {};
    
    // First pass: collect chunk offsets
    let currentOffset = offset;
    while (currentOffset < endOffset - 8) {
      const chunkId = this.readFourCC(view, currentOffset);
      const chunkSize = view.getUint32(currentOffset + 4, true);
      chunks[chunkId] = { offset: currentOffset + 8, size: chunkSize };
      currentOffset += 8 + chunkSize + (chunkSize % 2);
    }
    
    // Parse sample headers
    if (chunks['shdr']) {
      this.parseSampleHeaders(view, chunks['shdr'].offset, chunks['shdr'].size, result);
    }
    
    // Parse instruments
    if (chunks['inst'] && chunks['ibag'] && chunks['igen']) {
      this.parseInstruments(view, chunks, result);
    }
    
    // Parse presets
    if (chunks['phdr'] && chunks['pbag'] && chunks['pgen']) {
      this.parsePresets(view, chunks, result);
    }
  }
  
  /**
   * Parse sample headers
   */
  private parseSampleHeaders(view: DataView, offset: number, size: number, result: ParsedSf2): void {
    const recordSize = 46;
    const numRecords = Math.floor(size / recordSize);
    
    for (let i = 0; i < numRecords - 1; i++) { // Last record is terminal
      const recordOffset = offset + i * recordSize;
      
      result.samples.push({
        name: this.readFixedString(view, recordOffset, 20),
        start: view.getUint32(recordOffset + 20, true),
        end: view.getUint32(recordOffset + 24, true),
        loopStart: view.getUint32(recordOffset + 28, true),
        loopEnd: view.getUint32(recordOffset + 32, true),
        sampleRate: view.getUint32(recordOffset + 36, true),
        originalPitch: view.getUint8(recordOffset + 40),
        pitchCorrection: view.getInt8(recordOffset + 41),
        sampleLink: view.getUint16(recordOffset + 42, true),
        sampleType: view.getUint16(recordOffset + 44, true),
      });
    }
  }
  
  /**
   * Parse instruments
   */
  private parseInstruments(
    view: DataView,
    chunks: Record<string, { offset: number; size: number }>,
    result: ParsedSf2
  ): void {
    const instChunk = chunks['inst'];
    if (!instChunk) return;
    const recordSize = 22;
    const numInstruments = Math.floor(instChunk.size / recordSize);
    
    for (let i = 0; i < numInstruments - 1; i++) {
      const recordOffset = instChunk.offset + i * recordSize;
      const name = this.readFixedString(view, recordOffset, 20);
      const bagIndex = view.getUint16(recordOffset + 20, true);
      const nextBagIndex = view.getUint16(recordOffset + recordSize + 20, true);
      
      const instrument: Sf2Instrument = { name, zones: [] };
      
      // Parse zones for this instrument
      for (let j = bagIndex; j < nextBagIndex; j++) {
        const zone = this.parseInstrumentZone(view, chunks, j);
        if (zone) {
          instrument.zones.push(zone);
        }
      }
      
      result.instruments.push(instrument);
    }
  }
  
  /**
   * Parse a single instrument zone
   */
  private parseInstrumentZone(
    view: DataView,
    chunks: Record<string, { offset: number; size: number }>,
    bagIndex: number
  ): Sf2InstrumentZone | null {
    const ibagChunk = chunks['ibag'];
    if (!ibagChunk) return null;
    const ibagOffset = ibagChunk.offset + bagIndex * 4;
    const genIndex = view.getUint16(ibagOffset, true);
    const nextGenIndex = view.getUint16(ibagOffset + 4, true);
    
    const zone: Sf2InstrumentZone = {
      sampleIndex: -1,
      keyLow: 0,
      keyHigh: 127,
      velLow: 0,
      velHigh: 127,
      rootKey: -1,
      fineTune: 0,
      pan: 0,
      attenuation: 0,
      loopStart: 0,
      loopEnd: 0,
      loopMode: 0,
    };
    
    // Parse generators
    const igenChunk = chunks['igen'];
    if (!igenChunk) return null;
    for (let i = genIndex; i < nextGenIndex; i++) {
      const genOffset = igenChunk.offset + i * 4;
      const genOper = view.getUint16(genOffset, true);
      const genAmount = view.getInt16(genOffset + 2, true);
      
      switch (genOper) {
        case 43: // keyRange
          zone.keyLow = genAmount & 0xFF;
          zone.keyHigh = (genAmount >> 8) & 0xFF;
          break;
        case 44: // velRange
          zone.velLow = genAmount & 0xFF;
          zone.velHigh = (genAmount >> 8) & 0xFF;
          break;
        case 17: // pan
          zone.pan = genAmount / 500; // Convert to -1 to 1
          break;
        case 48: // attenuation
          zone.attenuation = genAmount / 10; // cB to dB
          break;
        case 51: // coarseTune
          zone.rootKey = genAmount;
          break;
        case 52: // fineTune
          zone.fineTune = genAmount;
          break;
        case 54: // sampleModes
          zone.loopMode = genAmount;
          break;
        case 53: // sampleID
          zone.sampleIndex = genAmount;
          break;
      }
    }
    
    if (zone.sampleIndex < 0) {
      return null;
    }
    
    return zone;
  }
  
  /**
   * Parse presets
   */
  private parsePresets(
    view: DataView,
    chunks: Record<string, { offset: number; size: number }>,
    result: ParsedSf2
  ): void {
    const phdrChunk = chunks['phdr'];
    if (!phdrChunk) return;
    const recordSize = 38;
    const numPresets = Math.floor(phdrChunk.size / recordSize);
    
    for (let i = 0; i < numPresets - 1; i++) {
      const recordOffset = phdrChunk.offset + i * recordSize;
      
      result.presets.push({
        name: this.readFixedString(view, recordOffset, 20),
        preset: view.getUint16(recordOffset + 20, true),
        bank: view.getUint16(recordOffset + 22, true),
        zones: [], // Would need full zone parsing
      });
    }
  }
  
  /**
   * Read 4-character code
   */
  private readFourCC(view: DataView, offset: number): string {
    return String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3)
    );
  }
  
  /**
   * Read fixed-length string (null-terminated)
   */
  private readFixedString(view: DataView, offset: number, length: number): string {
    const chars: number[] = [];
    for (let i = 0; i < length; i++) {
      const c = view.getUint8(offset + i);
      if (c === 0) break;
      chars.push(c);
    }
    return String.fromCharCode(...chars);
  }
  
  /**
   * Convert parsed SF2 to zones
   */
  toZones(parsed: ParsedSf2, instrumentIndex: number): ZoneImportData[] {
    const instrument = parsed.instruments[instrumentIndex];
    if (!instrument) {
      return [];
    }
    
    const zones: ZoneImportData[] = [];
    
    for (const zone of instrument.zones) {
      const sample = parsed.samples[zone.sampleIndex];
      if (!sample) continue;
      
      zones.push({
        samplePath: sample.name,
        keyLow: zone.keyLow,
        keyHigh: zone.keyHigh,
        velocityLow: zone.velLow,
        velocityHigh: zone.velHigh,
        rootKey: zone.rootKey >= 0 ? zone.rootKey : sample.originalPitch,
        fineTune: zone.fineTune + sample.pitchCorrection,
        gain: -zone.attenuation,
        pan: zone.pan,
        loopMode: zone.loopMode === 1 || zone.loopMode === 3 ? 'forward' : 'off',
        loopStart: sample.loopStart - sample.start,
        loopEnd: sample.loopEnd - sample.start,
      });
    }
    
    return zones;
  }
  
  /**
   * Extract sample data as AudioBuffer
   */
  extractSample(
    parsed: ParsedSf2,
    sampleIndex: number,
    audioContext: AudioContext
  ): AudioBuffer | null {
    const sample = parsed.samples[sampleIndex];
    if (!sample || sample.sampleType & 0x8000) { // ROM sample
      return null;
    }
    
    const length = sample.end - sample.start;
    if (length <= 0) {
      return null;
    }
    
    const audioBuffer = audioContext.createBuffer(1, length, sample.sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    
    // Convert Int16 to Float32
    for (let i = 0; i < length; i++) {
      const sampleValue = parsed.sampleData[sample.start + i] ?? 0;
      channelData[i] = sampleValue / 32768;
    }
    
    return audioBuffer;
  }
}

// ============================================================================
// INSTRUMENT IMPORTER
// ============================================================================

/**
 * High-level instrument importer
 */
export class InstrumentImporter {
  private fileUploadHandler: FileUploadHandler;
  private sfzParser: SfzParser;
  private sf2Parser: Sf2Parser;
  
  constructor(audioContext?: AudioContext) {
    this.fileUploadHandler = new FileUploadHandler();
    if (audioContext) {
      this.fileUploadHandler.setAudioContext(audioContext);
    }
    this.sfzParser = new SfzParser();
    this.sf2Parser = new Sf2Parser();
  }
  
  /**
   * Import instrument from file
   */
  async importFile(file: File): Promise<InstrumentImportResult> {
    const ext = this.getExtension(file.name);
    const format = INSTRUMENT_FORMAT_MAP[ext];
    
    if (!format) {
      // Might be a single audio file
      const audioFormat = AUDIO_FORMAT_MAP[ext];
      if (audioFormat) {
        return this.importSingleSample(file);
      }
      
      return {
        success: false,
        filename: file.name,
        format: 'sfz', // placeholder
        error: `Unsupported format: ${ext}`,
        zones: [],
        globalSettings: {},
        warnings: [],
      };
    }
    
    switch (format) {
      case 'sfz':
        return this.importSfz(file);
      case 'sf2':
      case 'sf3':
        return this.importSf2(file);
      default:
        return {
          success: false,
          filename: file.name,
          format,
          error: `Format not yet implemented: ${format}`,
          zones: [],
          globalSettings: {},
          warnings: [],
        };
    }
  }
  
  /**
   * Import SFZ file
   */
  private async importSfz(file: File): Promise<InstrumentImportResult> {
    const warnings: string[] = [];
    
    try {
      const content = await file.text();
      const parsed = this.sfzParser.parse(content);
      
      // Get base path for sample references
      const basePath = file.name.replace(/[^/\\]*$/, '');
      const zones = this.sfzParser.toZones(parsed, basePath);
      
      // Extract global settings
      const globalSettings: GlobalInstrumentSettings = {};
      
      if (parsed.global['volume']) {
        globalSettings.volume = Number(parsed.global['volume']);
      }
      if (parsed.global['pan']) {
        globalSettings.pan = Number(parsed.global['pan']);
      }
      if (parsed.global['polyphony']) {
        globalSettings.polyphony = Number(parsed.global['polyphony']);
      }
      
      return {
        success: true,
        filename: file.name,
        format: 'sfz',
        name: file.name.replace(/\.[^.]*$/, ''),
        zones,
        globalSettings,
        warnings,
      };
    } catch (err) {
      return {
        success: false,
        filename: file.name,
        format: 'sfz',
        error: `Failed to parse SFZ: ${err instanceof Error ? err.message : String(err)}`,
        zones: [],
        globalSettings: {},
        warnings,
      };
    }
  }
  
  /**
   * Import SF2/SF3 file
   */
  private async importSf2(file: File): Promise<InstrumentImportResult> {
    const warnings: string[] = [];
    
    try {
      const buffer = await file.arrayBuffer();
      const parsed = this.sf2Parser.parse(buffer);
      
      // Get zones from first instrument (or could specify)
      let zones: ZoneImportData[] = [];
      if (parsed.instruments.length > 0) {
        zones = this.sf2Parser.toZones(parsed, 0);
      }
      
      const globalSettings: GlobalInstrumentSettings = {};
      
      return {
        success: true,
        filename: file.name,
        format: file.name.endsWith('.sf3') ? 'sf3' : 'sf2',
        name: parsed.presets[0]?.name || file.name.replace(/\.[^.]*$/, ''),
        zones,
        globalSettings,
        warnings,
      };
    } catch (err) {
      return {
        success: false,
        filename: file.name,
        format: 'sf2',
        error: `Failed to parse SF2: ${err instanceof Error ? err.message : String(err)}`,
        zones: [],
        globalSettings: {},
        warnings,
      };
    }
  }
  
  /**
   * Import single audio file as simple instrument
   */
  private async importSingleSample(file: File): Promise<InstrumentImportResult> {
    const result = await this.fileUploadHandler.processFile(file);
    
    if (!result.success) {
      const errorResult: InstrumentImportResult = {
        success: false,
        filename: file.name,
        format: 'sfz',
        zones: [],
        globalSettings: {},
        warnings: result.warnings,
      };
      if (result.error !== undefined) errorResult.error = result.error;
      return errorResult;
    }
    
    const zone: ZoneImportData = {
      samplePath: file.name,
      keyLow: 0,
      keyHigh: 127,
      velocityLow: 0,
      velocityHigh: 127,
      rootKey: result.metadata.rootKey ?? 60,
      fineTune: result.metadata.fineTune ?? 0,
      gain: result.metadata.gain ?? 0,
      pan: result.metadata.pan ?? 0,
      loopMode: result.metadata.loopType ?? 'off',
    };
    if (result.audioBuffer !== undefined) zone.sampleBuffer = result.audioBuffer;
    if (result.metadata.loopStart !== undefined) zone.loopStart = result.metadata.loopStart;
    if (result.metadata.loopEnd !== undefined) zone.loopEnd = result.metadata.loopEnd;
    
    return {
      success: true,
      filename: file.name,
      format: 'sfz',
      name: file.name.replace(/\.[^.]*$/, ''),
      zones: [zone],
      globalSettings: {},
      warnings: result.warnings,
    };
  }
  
  /**
   * Get file extension
   */
  private getExtension(filename: string): string {
    const idx = filename.lastIndexOf('.');
    return idx >= 0 ? filename.slice(idx).toLowerCase() : '';
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a file upload handler
 */
export function createFileUploadHandler(options?: FileUploadOptions): FileUploadHandler {
  return new FileUploadHandler(options);
}

/**
 * Create a sample library scanner
 */
export function createSampleLibraryScanner(): SampleLibraryScanner {
  return new SampleLibraryScanner();
}

/**
 * Create an SFZ parser
 */
export function createSfzParser(): SfzParser {
  return new SfzParser();
}

/**
 * Create an SF2 parser
 */
export function createSf2Parser(): Sf2Parser {
  return new Sf2Parser();
}

/**
 * Create an instrument importer
 */
export function createInstrumentImporter(audioContext?: AudioContext): InstrumentImporter {
  return new InstrumentImporter(audioContext);
}
