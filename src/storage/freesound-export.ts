/**
 * @fileoverview Freesound Project Export/Import
 * 
 * Export and import Cardplay projects with Freesound URLs instead of
 * embedded audio data, reducing file size and enabling cloud-based
 * sample sharing.
 * 
 * Features:
 * - Export project with Freesound URLs for all Freesound-sourced samples
 * - Import project and re-download samples from Freesound
 * - Attribution tracking in exported projects
 * - Progress reporting for batch downloads
 * - Fallback to embedded audio for non-Freesound samples
 * 
 * @module @cardplay/core/storage/freesound-export
 */

import {
  getSound,
  downloadSound,
} from '../audio/freesound-api';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Sample source reference
 */
export type SampleSource =
  | { type: 'freesound'; soundId: number; attribution: string }
  | { type: 'embedded'; data: ArrayBuffer }
  | { type: 'url'; url: string };

/**
 * Sample reference in project
 */
export interface ProjectSampleRef {
  /** Unique ID for this sample in the project */
  readonly id: string;
  /** Sample name */
  readonly name: string;
  /** Sample source */
  readonly source: SampleSource;
  /** Sample duration in seconds */
  readonly duration: number;
  /** Sample rate */
  readonly sampleRate: number;
  /** Number of channels */
  readonly channels: number;
}

/**
 * Project metadata
 */
export interface ProjectMetadata {
  /** Project name */
  readonly name: string;
  /** Project version */
  readonly version: string;
  /** Creation timestamp */
  readonly created: number;
  /** Last modified timestamp */
  readonly modified: number;
  /** Author */
  readonly author?: string;
  /** Description */
  readonly description?: string;
  /** Tags */
  readonly tags: readonly string[];
}

/**
 * Exported project structure
 */
export interface ExportedProject {
  /** Project metadata */
  readonly metadata: ProjectMetadata;
  /** Sample references */
  readonly samples: readonly ProjectSampleRef[];
  /** Project data (serialized cards, decks, etc.) */
  readonly projectData: unknown;
  /** Format version */
  readonly formatVersion: string;
}

/**
 * Import options
 */
export interface ImportOptions {
  /** Audio context for decoding */
  readonly audioContext: BaseAudioContext;
  /** Progress callback */
  readonly onProgress?: (loaded: number, total: number, sampleName: string) => void;
  /** Whether to skip missing samples (continue import) */
  readonly skipMissing?: boolean;
}

/**
 * Import result
 */
export interface ImportResult {
  /** Project metadata */
  readonly metadata: ProjectMetadata;
  /** Loaded samples (sample ID → audio buffer) */
  readonly samples: ReadonlyMap<string, AudioBuffer>;
  /** Failed samples (sample ID → error) */
  readonly failed: ReadonlyMap<string, string>;
  /** Project data (needs deserialization) */
  readonly projectData: unknown;
}

/**
 * Export options
 */
export interface ExportOptions {
  /** Whether to embed all audio (ignore Freesound URLs) */
  readonly embedAll?: boolean;
  /** Whether to include attributions in metadata */
  readonly includeAttributions?: boolean;
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

/**
 * Create sample reference from Freesound sound
 */
export function createFreesoundSampleRef(
  sampleId: string,
  soundId: number,
  attribution: string,
  audioBuffer: AudioBuffer
): ProjectSampleRef {
  return {
    id: sampleId,
    name: `Freesound ${soundId}`,
    source: {
      type: 'freesound',
      soundId,
      attribution,
    },
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
    channels: audioBuffer.numberOfChannels,
  };
}

/**
 * Create sample reference from embedded audio buffer
 */
export function createEmbeddedSampleRef(
  sampleId: string,
  name: string,
  audioBuffer: AudioBuffer
): ProjectSampleRef {
  // Convert AudioBuffer to ArrayBuffer (for serialization)
  const length = audioBuffer.length * audioBuffer.numberOfChannels * 4; // Float32
  const data = new ArrayBuffer(length);
  const view = new Float32Array(data);

  let offset = 0;
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    view.set(channelData, offset);
    offset += channelData.length;
  }

  return {
    id: sampleId,
    name,
    source: {
      type: 'embedded',
      data,
    },
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
    channels: audioBuffer.numberOfChannels,
  };
}

/**
 * Create sample reference from URL
 */
export function createURLSampleRef(
  sampleId: string,
  name: string,
  url: string,
  audioBuffer: AudioBuffer
): ProjectSampleRef {
  return {
    id: sampleId,
    name,
    source: {
      type: 'url',
      url,
    },
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
    channels: audioBuffer.numberOfChannels,
  };
}

/**
 * Export project to JSON string
 */
export function exportProjectToJSON(
  project: ExportedProject,
  pretty: boolean = false
): string {
  return JSON.stringify(project, null, pretty ? 2 : 0);
}

/**
 * Export project to Blob for download
 */
export function exportProjectToBlob(project: ExportedProject): Blob {
  const json = exportProjectToJSON(project, true);
  return new Blob([json], { type: 'application/json' });
}

/**
 * Get all Freesound attributions from project
 */
export function getProjectAttributions(
  project: ExportedProject
): readonly string[] {
  const attributions: string[] = [];

  for (const sample of project.samples) {
    if (sample.source.type === 'freesound') {
      attributions.push(sample.source.attribution);
    }
  }

  return attributions;
}

/**
 * Get project file size estimate
 */
export function getProjectSizeEstimate(project: ExportedProject): number {
  const json = exportProjectToJSON(project);
  return new Blob([json]).size;
}

/**
 * Calculate storage savings by using Freesound URLs
 */
export function calculateStorageSavings(
  samples: readonly ProjectSampleRef[]
): { freesoundCount: number; embeddedCount: number; estimatedSavingsBytes: number } {
  let freesoundCount = 0;
  let embeddedCount = 0;
  let estimatedSavingsBytes = 0;

  for (const sample of samples) {
    if (sample.source.type === 'freesound') {
      freesoundCount++;
      // Estimate saved space: sample duration * sample rate * channels * 4 bytes (Float32)
      const estimatedSize = sample.duration * sample.sampleRate * sample.channels * 4;
      estimatedSavingsBytes += estimatedSize;
    } else if (sample.source.type === 'embedded') {
      embeddedCount++;
    }
  }

  return {
    freesoundCount,
    embeddedCount,
    estimatedSavingsBytes,
  };
}

// ============================================================================
// IMPORT FUNCTIONS
// ============================================================================

/**
 * Parse exported project from JSON string
 */
export function parseProjectFromJSON(json: string): ExportedProject {
  return JSON.parse(json) as ExportedProject;
}

/**
 * Load exported project from Blob
 */
export async function loadProjectFromBlob(blob: Blob): Promise<ExportedProject> {
  const text = await blob.text();
  return parseProjectFromJSON(text);
}

/**
 * Download Freesound sample from reference
 */
async function downloadFreesoundSample(
  sampleRef: ProjectSampleRef,
  audioContext: BaseAudioContext,
  onProgress?: (loaded: number, total: number) => void
): Promise<AudioBuffer> {
  if (sampleRef.source.type !== 'freesound') {
    throw new Error('Sample is not a Freesound reference');
  }

  // Fetch sound metadata
  const sound = await getSound(sampleRef.source.soundId);

  // Download and decode
  const result = await downloadSound(sound, audioContext, onProgress);

  return result.audioBuffer;
}

/**
 * Decode embedded sample from reference
 */
async function decodeEmbeddedSample(
  sampleRef: ProjectSampleRef,
  audioContext: BaseAudioContext
): Promise<AudioBuffer> {
  if (sampleRef.source.type !== 'embedded') {
    throw new Error('Sample is not embedded');
  }

  return await audioContext.decodeAudioData(sampleRef.source.data.slice(0));
}

/**
 * Download sample from URL
 */
async function downloadURLSample(
  sampleRef: ProjectSampleRef,
  audioContext: BaseAudioContext,
  onProgress?: (loaded: number, total: number) => void
): Promise<AudioBuffer> {
  if (sampleRef.source.type !== 'url') {
    throw new Error('Sample is not a URL reference');
  }

  const response = await fetch(sampleRef.source.url);
  if (!response.ok) {
    throw new Error(`Failed to download sample: ${response.statusText}`);
  }

  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;

  if (!response.body) {
    throw new Error('Response body is null');
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    chunks.push(value);
    loaded += value.length;

    if (onProgress && total > 0) {
      onProgress(loaded, total);
    }
  }

  // Combine chunks
  const audioData = new Uint8Array(loaded);
  let position = 0;
  for (const chunk of chunks) {
    audioData.set(chunk, position);
    position += chunk.length;
  }

  return await audioContext.decodeAudioData(audioData.buffer);
}

/**
 * Load sample from reference
 */
async function loadSample(
  sampleRef: ProjectSampleRef,
  audioContext: BaseAudioContext,
  onProgress?: (loaded: number, total: number) => void
): Promise<AudioBuffer> {
  switch (sampleRef.source.type) {
    case 'freesound':
      return await downloadFreesoundSample(sampleRef, audioContext, onProgress);
    case 'embedded':
      return await decodeEmbeddedSample(sampleRef, audioContext);
    case 'url':
      return await downloadURLSample(sampleRef, audioContext, onProgress);
    default:
      throw new Error(`Unknown sample source type`);
  }
}

/**
 * Import project and load all samples
 */
export async function importProject(
  project: ExportedProject,
  options: ImportOptions
): Promise<ImportResult> {
  const samples = new Map<string, AudioBuffer>();
  const failed = new Map<string, string>();

  const totalSamples = project.samples.length;
  let loadedSamples = 0;

  for (const sampleRef of project.samples) {
    try {
      const audioBuffer = await loadSample(
        sampleRef,
        options.audioContext,
        (loaded, total) => {
          if (options.onProgress) {
            const overallProgress = loadedSamples / totalSamples + (loaded / total) / totalSamples;
            options.onProgress(
              Math.floor(overallProgress * totalSamples),
              totalSamples,
              sampleRef.name
            );
          }
        }
      );

      samples.set(sampleRef.id, audioBuffer);
      loadedSamples++;

      if (options.onProgress) {
        options.onProgress(loadedSamples, totalSamples, sampleRef.name);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      failed.set(sampleRef.id, errorMessage);

      if (!options.skipMissing) {
        throw new Error(`Failed to load sample "${sampleRef.name}": ${errorMessage}`);
      }
    }
  }

  return {
    metadata: project.metadata,
    samples,
    failed,
    projectData: project.projectData,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Check if project has Freesound samples
 */
export function hasFreesoundSamples(project: ExportedProject): boolean {
  return project.samples.some(s => s.source.type === 'freesound');
}

/**
 * Get Freesound sample count
 */
export function getFreesoundSampleCount(project: ExportedProject): number {
  return project.samples.filter(s => s.source.type === 'freesound').length;
}

/**
 * Validate project format version
 */
export function validateProjectVersion(
  project: ExportedProject,
  supportedVersions: readonly string[]
): boolean {
  return supportedVersions.includes(project.formatVersion);
}

/**
 * Migrate project to current format version
 */
export function migrateProject(
  project: ExportedProject,
  currentVersion: string
): ExportedProject {
  // TODO: Implement version migration logic
  // For now, just update the version
  return {
    ...project,
    formatVersion: currentVersion,
  };
}
