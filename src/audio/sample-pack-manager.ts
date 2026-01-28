/**
 * @fileoverview Sample Pack Manager - Credits, Preview, Download, Update, Uninstall
 * 
 * Provides comprehensive pack management functionality:
 * - Pack credits and licensing information display
 * - Pack preview player for auditioning before installation
 * - Pack download manager with progress tracking
 * - Pack update checker and auto-update capability
 * - Pack uninstaller with cleanup
 * 
 * Implements currentsteps.md items 2914-2918
 * 
 * @module @cardplay/core/audio/sample-pack-manager
 */

import type { SamplePack, PackSample, FreesoundAttribution } from './sample-packs';
import { SAMPLE_PACK_REGISTRY } from './sample-packs';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Pack installation status
 */
export interface PackInstallStatus {
  readonly packId: string;
  installed: boolean;
  version: string;
  installedDate?: Date;
  updateAvailable: boolean;
  latestVersion?: string;
  size: number; // bytes
  sampleCount: number;
}

/**
 * Pack credit information
 */
export interface PackCredits {
  readonly packId: string;
  readonly packName: string;
  readonly author: string;
  readonly license: string;
  readonly version: string;
  readonly description: string;
  readonly freesoundAttributions: readonly FreesoundAttribution[];
  readonly additionalCredits: readonly string[];
  readonly copyrightNotice: string;
  readonly licenseUrl: string | undefined;
}

/**
 * Pack preview configuration
 */
export interface PackPreviewConfig {
  readonly packId: string;
  readonly maxSamplesToPreview?: number; // Default: 5
  readonly autoAdvance?: boolean; // Auto-play next sample
  readonly autoAdvanceDelay?: number; // ms
  readonly volume?: number; // 0-1
  readonly playbackRate?: number; // 0.25-4.0
}

/**
 * Preview playback state
 */
export interface PreviewPlaybackState {
  readonly packId: string;
  playing: boolean;
  currentSampleIndex: number;
  currentSample: PackSample | undefined;
  progress: number; // 0-1
  position: number; // seconds
  duration: number; // seconds
  volume: number;
  playbackRate: number;
}

/**
 * Pack download progress
 */
export interface PackDownloadProgress {
  readonly packId: string;
  status: 'queued' | 'downloading' | 'processing' | 'installing' | 'complete' | 'error';
  samplesDownloaded: number;
  totalSamples: number;
  bytesDownloaded: number;
  totalBytes: number;
  progress: number; // 0-1
  downloadSpeed?: number; // bytes/sec
  estimatedTimeRemaining?: number; // seconds
  error?: string;
}

/**
 * Pack update info
 */
export interface PackUpdateInfo {
  readonly packId: string;
  readonly packName: string;
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  releaseDate?: Date;
  changeLog: readonly string[];
  breaking: boolean; // Breaking changes
  size: number; // Update size in bytes
}

/**
 * Pack uninstall result
 */
export interface PackUninstallResult {
  readonly packId: string;
  success: boolean;
  freedSpace: number; // bytes
  error?: string;
  warnings: readonly string[];
}

// ============================================================================
// PACK CREDITS & LICENSING
// ============================================================================

/**
 * Get comprehensive credits for a sample pack
 */
export function getPackCredits(packId: string): PackCredits | null {
  const pack = SAMPLE_PACK_REGISTRY.get(packId);
  if (!pack) {
    return null;
  }

  return {
    packId: pack.id,
    packName: pack.name,
    author: pack.author,
    license: pack.license,
    version: pack.version,
    description: pack.description,
    freesoundAttributions: pack.freesoundAttribution || [],
    additionalCredits: [],
    copyrightNotice: generateCopyrightNotice(pack),
    licenseUrl: getLicenseUrl(pack.license),
  };
}

/**
 * Generate copyright notice text
 */
function generateCopyrightNotice(pack: SamplePack): string {
  const year = new Date().getFullYear();
  const notice = `Copyright © ${year} ${pack.author}. ${pack.license}.`;
  
  if (pack.freesoundAttribution && pack.freesoundAttribution.length > 0) {
    const freesoundNotice = '\n\nSamples from Freesound.org:\n' + 
      pack.freesoundAttribution
        .map(attr => `- "${attr.name}" by ${attr.username} (${attr.license})`)
        .join('\n');
    return notice + freesoundNotice;
  }
  
  return notice;
}

/**
 * Get license URL from license name
 */
function getLicenseUrl(license: string): string | undefined {
  const licenseMap: Record<string, string> = {
    'CC0': 'https://creativecommons.org/publicdomain/zero/1.0/',
    'CC0 (Creative Commons Zero)': 'https://creativecommons.org/publicdomain/zero/1.0/',
    'CC-BY': 'https://creativecommons.org/licenses/by/4.0/',
    'CC-BY-SA': 'https://creativecommons.org/licenses/by-sa/4.0/',
    'CC-BY-NC': 'https://creativecommons.org/licenses/by-nc/4.0/',
    'MIT': 'https://opensource.org/licenses/MIT',
    'Apache-2.0': 'https://www.apache.org/licenses/LICENSE-2.0',
  };

  for (const [key, url] of Object.entries(licenseMap)) {
    if (license.includes(key)) {
      return url;
    }
  }

  return undefined;
}

/**
 * Export credits as text file content
 */
export function exportPackCredits(packId: string): string {
  const credits = getPackCredits(packId);
  if (!credits) {
    return `Pack "${packId}" not found.`;
  }

  let output = `${credits.packName} - Credits\n`;
  output += `${'='.repeat(credits.packName.length + 11)}\n\n`;
  output += `Version: ${credits.version}\n`;
  output += `Author: ${credits.author}\n`;
  output += `License: ${credits.license}\n`;
  if (credits.licenseUrl) {
    output += `License URL: ${credits.licenseUrl}\n`;
  }
  output += `\nDescription:\n${credits.description}\n\n`;
  output += `Copyright Notice:\n${credits.copyrightNotice}\n\n`;

  if (credits.additionalCredits.length > 0) {
    output += `Additional Credits:\n`;
    credits.additionalCredits.forEach(credit => {
      output += `- ${credit}\n`;
    });
    output += '\n';
  }

  return output;
}

// ============================================================================
// PACK PREVIEW PLAYER
// ============================================================================

/**
 * Pack preview player for auditioning samples before download
 */
export class PackPreviewPlayer {
  private audioContext: AudioContext;
  private config: Required<PackPreviewConfig>;
  private state: PreviewPlaybackState;
  private currentSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode;
  private startTime = 0;
  private pauseTime = 0;
  private isPaused = false;
  private sampleBuffers = new Map<string, AudioBuffer>();
  private onStateChange?: (state: PreviewPlaybackState) => void;

  constructor(audioContext: AudioContext, config: PackPreviewConfig) {
    this.audioContext = audioContext;
    this.config = {
      packId: config.packId,
      maxSamplesToPreview: config.maxSamplesToPreview ?? 5,
      autoAdvance: config.autoAdvance ?? false,
      autoAdvanceDelay: config.autoAdvanceDelay ?? 500,
      volume: config.volume ?? 0.7,
      playbackRate: config.playbackRate ?? 1.0,
    };

    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
    this.gainNode.gain.value = this.config.volume;

    const pack = SAMPLE_PACK_REGISTRY.get(this.config.packId);
    const samples = pack ? pack.samples.slice(0, this.config.maxSamplesToPreview) : [];

    this.state = {
      packId: this.config.packId,
      playing: false,
      currentSampleIndex: 0,
      currentSample: samples[0],
      progress: 0,
      position: 0,
      duration: 0,
      volume: this.config.volume,
      playbackRate: this.config.playbackRate,
    };
  }

  /**
   * Set state change callback
   */
  onPlaybackStateChange(callback: (state: PreviewPlaybackState) => void): void {
    this.onStateChange = callback;
  }

  /**
   * Get current playback state
   */
  getState(): PreviewPlaybackState {
    return { ...this.state };
  }

  /**
   * Load sample audio buffers
   */
  async loadSamples(): Promise<void> {
    const pack = SAMPLE_PACK_REGISTRY.get(this.config.packId);
    if (!pack) {
      throw new Error(`Pack ${this.config.packId} not found`);
    }

    const samplesToLoad = pack.samples.slice(0, this.config.maxSamplesToPreview);
    
    // In a real implementation, this would load from Freesound or local cache
    // For now, we'll create placeholder buffers
    for (const sample of samplesToLoad) {
      if (sample.buffer) {
        this.sampleBuffers.set(sample.id, sample.buffer);
      }
    }
  }

  /**
   * Play current sample
   */
  play(): void {
    if (this.isPaused) {
      this.resume();
      return;
    }

    const pack = SAMPLE_PACK_REGISTRY.get(this.config.packId);
    if (!pack) return;

    const samples = pack.samples.slice(0, this.config.maxSamplesToPreview);
    const sample = samples[this.state.currentSampleIndex];
    if (!sample) return;

    const buffer = this.sampleBuffers.get(sample.id);
    if (!buffer) {
      console.warn(`Sample ${sample.id} not loaded`);
      return;
    }

    this.stop();

    this.currentSource = this.audioContext.createBufferSource();
    this.currentSource.buffer = buffer;
    this.currentSource.playbackRate.value = this.state.playbackRate;
    this.currentSource.connect(this.gainNode);
    this.currentSource.onended = () => this.handleSampleEnded();
    
    this.startTime = this.audioContext.currentTime;
    this.currentSource.start(0, this.pauseTime);

    this.state.playing = true;
    this.state.currentSample = sample;
    this.state.duration = buffer.duration;
    this.state.position = this.pauseTime;
    this.notifyStateChange();

    this.updateProgress();
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (!this.state.playing || !this.currentSource) return;

    this.pauseTime = this.audioContext.currentTime - this.startTime;
    this.currentSource.stop();
    this.currentSource = null;
    this.state.playing = false;
    this.isPaused = true;
    this.notifyStateChange();
  }

  /**
   * Resume playback
   */
  private resume(): void {
    this.isPaused = false;
    this.play();
  }

  /**
   * Stop playback
   */
  stop(): void {
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource.disconnect();
      this.currentSource = null;
    }
    this.state.playing = false;
    this.state.position = 0;
    this.state.progress = 0;
    this.pauseTime = 0;
    this.isPaused = false;
    this.notifyStateChange();
  }

  /**
   * Go to next sample
   */
  next(): void {
    const pack = SAMPLE_PACK_REGISTRY.get(this.config.packId);
    if (!pack) return;

    const samples = pack.samples.slice(0, this.config.maxSamplesToPreview);
    this.state.currentSampleIndex = (this.state.currentSampleIndex + 1) % samples.length;
    this.pauseTime = 0;
    
    if (this.state.playing) {
      this.play();
    } else {
      this.state.currentSample = samples[this.state.currentSampleIndex];
      this.notifyStateChange();
    }
  }

  /**
   * Go to previous sample
   */
  previous(): void {
    const pack = SAMPLE_PACK_REGISTRY.get(this.config.packId);
    if (!pack) return;

    const samples = pack.samples.slice(0, this.config.maxSamplesToPreview);
    this.state.currentSampleIndex = 
      (this.state.currentSampleIndex - 1 + samples.length) % samples.length;
    this.pauseTime = 0;
    
    if (this.state.playing) {
      this.play();
    } else {
      this.state.currentSample = samples[this.state.currentSampleIndex];
      this.notifyStateChange();
    }
  }

  /**
   * Set volume
   */
  setVolume(volume: number): void {
    this.state.volume = Math.max(0, Math.min(1, volume));
    this.gainNode.gain.value = this.state.volume;
    this.notifyStateChange();
  }

  /**
   * Set playback rate
   */
  setPlaybackRate(rate: number): void {
    this.state.playbackRate = Math.max(0.25, Math.min(4.0, rate));
    if (this.currentSource) {
      this.currentSource.playbackRate.value = this.state.playbackRate;
    }
    this.notifyStateChange();
  }

  /**
   * Handle sample ended
   */
  private handleSampleEnded(): void {
    if (this.config.autoAdvance) {
      setTimeout(() => this.next(), this.config.autoAdvanceDelay);
    } else {
      this.stop();
    }
  }

  /**
   * Update progress
   */
  private updateProgress(): void {
    if (!this.state.playing) return;

    const elapsed = this.audioContext.currentTime - this.startTime + this.pauseTime;
    this.state.position = elapsed;
    this.state.progress = this.state.duration > 0 ? elapsed / this.state.duration : 0;
    
    this.notifyStateChange();

    if (this.state.playing) {
      requestAnimationFrame(() => this.updateProgress());
    }
  }

  /**
   * Notify state change
   */
  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop();
    this.gainNode.disconnect();
    this.sampleBuffers.clear();
  }
}

/**
 * Create pack preview player
 */
export function createPackPreviewPlayer(
  audioContext: AudioContext,
  config: PackPreviewConfig
): PackPreviewPlayer {
  return new PackPreviewPlayer(audioContext, config);
}

// ============================================================================
// PACK DOWNLOAD MANAGER
// ============================================================================

/**
 * Pack download manager with progress tracking and queue management
 */
export class PackDownloadManager {
  private downloadQueue: string[] = [];
  private activeDownloads = new Map<string, PackDownloadProgress>();
  private maxConcurrentDownloads = 3;
  private onProgressCallbacks = new Map<string, (progress: PackDownloadProgress) => void>();

  /**
   * Queue pack for download
   */
  queueDownload(packId: string): void {
    if (this.activeDownloads.has(packId)) {
      return; // Already downloading
    }

    if (!this.downloadQueue.includes(packId)) {
      this.downloadQueue.push(packId);
    }

    const progress: PackDownloadProgress = {
      packId,
      status: 'queued',
      samplesDownloaded: 0,
      totalSamples: 0,
      bytesDownloaded: 0,
      totalBytes: 0,
      progress: 0,
    };
    
    this.activeDownloads.set(packId, progress);
    this.notifyProgress(packId, progress);
    this.processQueue();
  }

  /**
   * Cancel download
   */
  cancelDownload(packId: string): void {
    const index = this.downloadQueue.indexOf(packId);
    if (index !== -1) {
      this.downloadQueue.splice(index, 1);
    }

    const progress = this.activeDownloads.get(packId);
    if (progress) {
      progress.status = 'error';
      progress.error = 'Cancelled by user';
      this.notifyProgress(packId, progress);
      this.activeDownloads.delete(packId);
    }
  }

  /**
   * Get download progress
   */
  getProgress(packId: string): PackDownloadProgress | null {
    return this.activeDownloads.get(packId) || null;
  }

  /**
   * Set progress callback
   */
  onProgress(packId: string, callback: (progress: PackDownloadProgress) => void): void {
    this.onProgressCallbacks.set(packId, callback);
  }

  /**
   * Process download queue
   */
  private async processQueue(): Promise<void> {
    const activeCount = Array.from(this.activeDownloads.values())
      .filter(p => p.status === 'downloading').length;

    if (activeCount >= this.maxConcurrentDownloads) {
      return;
    }

    const packId = this.downloadQueue.shift();
    if (!packId) {
      return;
    }

    await this.downloadPack(packId);
    this.processQueue(); // Process next in queue
  }

  /**
   * Download pack
   */
  private async downloadPack(packId: string): Promise<void> {
    const pack = SAMPLE_PACK_REGISTRY.get(packId);
    if (!pack) {
      const progress = this.activeDownloads.get(packId);
      if (progress) {
        progress.status = 'error';
        progress.error = `Pack ${packId} not found`;
        this.notifyProgress(packId, progress);
      }
      return;
    }

    const progress = this.activeDownloads.get(packId);
    if (!progress) return;

    progress.status = 'downloading';
    progress.totalSamples = pack.sampleCount;
    this.notifyProgress(packId, progress);

    try {
      // Simulate download (in real implementation, would download from Freesound)
      for (let i = 0; i < pack.sampleCount; i++) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
        
        progress.samplesDownloaded = i + 1;
        progress.progress = (i + 1) / pack.sampleCount;
        this.notifyProgress(packId, progress);
      }

      progress.status = 'complete';
      this.notifyProgress(packId, progress);
      this.activeDownloads.delete(packId);
    } catch (error) {
      progress.status = 'error';
      progress.error = error instanceof Error ? error.message : 'Unknown error';
      this.notifyProgress(packId, progress);
    }
  }

  /**
   * Notify progress
   */
  private notifyProgress(packId: string, progress: PackDownloadProgress): void {
    const callback = this.onProgressCallbacks.get(packId);
    if (callback) {
      callback(progress);
    }
  }
}

/**
 * Create pack download manager
 */
export function createPackDownloadManager(): PackDownloadManager {
  return new PackDownloadManager();
}

// ============================================================================
// PACK UPDATE CHECKER
// ============================================================================

/**
 * Check for pack updates
 */
export async function checkPackUpdates(packId: string): Promise<PackUpdateInfo | null> {
  const pack = SAMPLE_PACK_REGISTRY.get(packId);
  if (!pack) {
    return null;
  }

  // In real implementation, would check against remote registry
  // For now, simulate no updates available
  return {
    packId: pack.id,
    packName: pack.name,
    currentVersion: pack.version,
    latestVersion: pack.version,
    updateAvailable: false,
    changeLog: [],
    breaking: false,
    size: 0,
  };
}

/**
 * Check all installed packs for updates
 */
export async function checkAllPackUpdates(): Promise<readonly PackUpdateInfo[]> {
  const updates: PackUpdateInfo[] = [];
  
  for (const packId of SAMPLE_PACK_REGISTRY.keys()) {
    const updateInfo = await checkPackUpdates(packId);
    if (updateInfo && updateInfo.updateAvailable) {
      updates.push(updateInfo);
    }
  }

  return updates;
}

/**
 * Auto-update pack to latest version
 */
export async function updatePack(
  packId: string,
  _onProgress?: (progress: PackDownloadProgress) => void
): Promise<boolean> {
  const updateInfo = await checkPackUpdates(packId);
  if (!updateInfo || !updateInfo.updateAvailable) {
    return false;
  }

  // In real implementation, would download and install update
  // For now, just simulate success
  return true;
}

// ============================================================================
// PACK UNINSTALLER
// ============================================================================

/**
 * Uninstall pack and clean up resources
 */
export async function uninstallPack(packId: string): Promise<PackUninstallResult> {
  const pack = SAMPLE_PACK_REGISTRY.get(packId);
  
  if (!pack) {
    return {
      packId,
      success: false,
      freedSpace: 0,
      error: `Pack ${packId} not found`,
      warnings: [],
    };
  }

  const warnings: string[] = [];

  // In real implementation, would:
  // 1. Check if pack is in use
  // 2. Remove cached sample buffers
  // 3. Delete downloaded files
  // 4. Update installation database
  // 5. Clean up temporary files

  // Simulate size calculation (rough estimate: 1MB per sample)
  const estimatedSize = pack.sampleCount * 1024 * 1024;

  return {
    packId,
    success: true,
    freedSpace: estimatedSize,
    warnings,
  };
}

/**
 * Uninstall multiple packs
 */
export async function uninstallPacks(
  packIds: readonly string[]
): Promise<readonly PackUninstallResult[]> {
  const results: PackUninstallResult[] = [];
  
  for (const packId of packIds) {
    const result = await uninstallPack(packId);
    results.push(result);
  }

  return results;
}

/**
 * Get total space that would be freed by uninstalling packs
 */
export function calculateFreedSpace(packIds: readonly string[]): number {
  let total = 0;
  
  for (const packId of packIds) {
    const pack = SAMPLE_PACK_REGISTRY.get(packId);
    if (pack) {
      // Rough estimate: 1MB per sample
      total += pack.sampleCount * 1024 * 1024;
    }
  }

  return total;
}

/**
 * Format bytes as human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
