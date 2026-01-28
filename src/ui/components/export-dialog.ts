/**
 * @fileoverview Export Dialog UI Component.
 * 
 * Provides a comprehensive export dialog with:
 * - Format selection (WAV, MP3, FLAC, OGG)
 * - Bit depth selection (16, 24, 32)
 * - Sample rate selection (44.1, 48, 96, 192 kHz)
 * - Dither options (none, triangular, shaped)
 * - Normalization toggle and target level
 * - Tail length configuration
 * - Start/end marker selection
 * - Loop export option
 * - Real-time vs offline toggle
 * - Progress display with cancel button
 * - Export queue management
 * - Export history
 * - Preset system
 * 
 * @module @cardplay/core/ui/components/export-dialog
 */

import type {
  ExportConfig,
  ExportFormat,
  BitDepth,
  SampleRate,
  DitherType,
  ExportPreset,
  ExportQueueEntry,
  ExportProgress,
} from '../../audio/export';
import {
  DEFAULT_EXPORT_CONFIG,
  FACTORY_EXPORT_PRESETS,
  getExportEngine,
} from '../../audio/export';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Export dialog state.
 */
export interface ExportDialogState {
  /** Whether dialog is open */
  readonly isOpen: boolean;
  /** Current configuration */
  readonly config: ExportConfig;
  /** Available presets (factory + user) */
  readonly presets: readonly ExportPreset[];
  /** Selected preset ID (null = custom) */
  readonly selectedPresetId: string | null;
  /** Export queue */
  readonly queue: readonly ExportQueueEntry[];
  /** Export history (completed) */
  readonly history: readonly ExportQueueEntry[];
  /** Show advanced options */
  readonly showAdvanced: boolean;
  /** Show export queue panel */
  readonly showQueue: boolean;
  /** Current validation errors */
  readonly validationErrors: readonly string[];
}

/**
 * Export dialog actions.
 */
export interface ExportDialogActions {
  /** Open dialog */
  open(): void;
  /** Close dialog */
  close(): void;
  /** Update configuration field */
  updateConfig(field: keyof ExportConfig, value: unknown): void;
  /** Load preset */
  loadPreset(presetId: string): void;
  /** Save current config as preset */
  savePreset(name: string, description: string): void;
  /** Delete user preset */
  deletePreset(presetId: string): void;
  /** Toggle advanced options */
  toggleAdvanced(): void;
  /** Toggle queue panel */
  toggleQueue(): void;
  /** Start export */
  startExport(): void;
  /** Cancel queued export */
  cancelExport(id: string): void;
  /** Clear completed exports */
  clearHistory(): void;
  /** Download completed export */
  downloadExport(id: string): void;
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * Create initial export dialog state.
 */
export function createExportDialogState(): ExportDialogState {
  return {
    isOpen: false,
    config: { ...DEFAULT_EXPORT_CONFIG },
    presets: [...FACTORY_EXPORT_PRESETS],
    selectedPresetId: null,
    queue: [],
    history: [],
    showAdvanced: false,
    showQueue: false,
    validationErrors: [],
  };
}

/**
 * Export dialog state manager.
 */
export class ExportDialogManager {
  private state: ExportDialogState;
  private listeners: Set<(state: ExportDialogState) => void> = new Set();
  private userPresets: ExportPreset[] = [];
  private pollInterval: number | null = null;

  constructor(initialState?: Partial<ExportDialogState>) {
    this.state = {
      ...createExportDialogState(),
      ...initialState,
    };
    this.loadUserPresets();
    this.startPolling();
  }

  /**
   * Get current state.
   */
  getState(): ExportDialogState {
    return this.state;
  }

  /**
   * Subscribe to state changes.
   */
  subscribe(listener: (state: ExportDialogState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Update state and notify listeners.
   */
  private setState(updates: Partial<ExportDialogState>): void {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(listener => listener(this.state));
  }

  /**
   * Open dialog.
   */
  open(): void {
    this.setState({ isOpen: true });
    this.updateQueue();
  }

  /**
   * Close dialog.
   */
  close(): void {
    this.setState({ isOpen: false });
  }

  /**
   * Update configuration field.
   */
  updateConfig(field: keyof ExportConfig, value: unknown): void {
    const config = { ...this.state.config, [field]: value };
    const validationErrors = this.validateConfig(config);
    this.setState({ 
      config, 
      selectedPresetId: null, // Custom config
      validationErrors 
    });
  }

  /**
   * Validate configuration.
   */
  private validateConfig(config: ExportConfig): string[] {
    const errors: string[] = [];

    if (!config.filename || config.filename.trim() === '') {
      errors.push('Filename is required');
    }

    if (config.normalizeDb !== null) {
      if (config.normalizeDb > 0) {
        errors.push('Normalization level must be ≤ 0 dBFS');
      }
      if (config.normalizeDb < -60) {
        errors.push('Normalization level too low (< -60 dBFS)');
      }
    }

    if (config.tailLengthMs < 0) {
      errors.push('Tail length cannot be negative');
    }

    if (config.startTick !== null && config.endTick !== null) {
      if (config.startTick >= config.endTick) {
        errors.push('Start marker must be before end marker');
      }
    }

    return errors;
  }

  /**
   * Load preset.
   */
  loadPreset(presetId: string): void {
    const preset = this.state.presets.find(p => p.id === presetId);
    if (!preset) return;

    const config = {
      ...this.state.config,
      ...preset.config,
    };
    const validationErrors = this.validateConfig(config);

    this.setState({ 
      config, 
      selectedPresetId: presetId,
      validationErrors 
    });
  }

  /**
   * Save current config as user preset.
   */
  savePreset(name: string, description: string): void {
    const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const preset: ExportPreset = {
      id,
      name,
      description,
      config: { ...this.state.config },
      isFactory: false,
    };

    this.userPresets.push(preset);
    this.saveUserPresets();

    this.setState({
      presets: [...FACTORY_EXPORT_PRESETS, ...this.userPresets],
      selectedPresetId: id,
    });
  }

  /**
   * Delete user preset.
   */
  deletePreset(presetId: string): void {
    const index = this.userPresets.findIndex(p => p.id === presetId);
    if (index === -1) return;

    this.userPresets.splice(index, 1);
    this.saveUserPresets();

    this.setState({
      presets: [...FACTORY_EXPORT_PRESETS, ...this.userPresets],
      selectedPresetId: this.state.selectedPresetId === presetId ? null : this.state.selectedPresetId,
    });
  }

  /**
   * Toggle advanced options panel.
   */
  toggleAdvanced(): void {
    this.setState({ showAdvanced: !this.state.showAdvanced });
  }

  /**
   * Toggle export queue panel.
   */
  toggleQueue(): void {
    this.setState({ showQueue: !this.state.showQueue });
  }

  /**
   * Start export with current configuration.
   */
  startExport(): void {
    const errors = this.validateConfig(this.state.config);
    if (errors.length > 0) {
      this.setState({ validationErrors: errors });
      return;
    }

    const engine = getExportEngine();
    engine.addToQueue(this.state.config);
    
    this.updateQueue();
    this.setState({ showQueue: true });
  }

  /**
   * Cancel queued export.
   */
  cancelExport(id: string): void {
    const engine = getExportEngine();
    engine.cancel(id);
    this.updateQueue();
  }

  /**
   * Clear completed exports from history.
   */
  clearHistory(): void {
    const engine = getExportEngine();
    engine.clearCompleted();
    this.updateQueue();
  }

  /**
   * Download completed export.
   */
  downloadExport(id: string): void {
    const entry = this.state.queue.find(e => e.id === id) 
      ?? this.state.history.find(e => e.id === id);
    
    if (!entry || !entry.result?.blob) return;

    const url = URL.createObjectURL(entry.result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = entry.result.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Update queue and history from engine.
   */
  private updateQueue(): void {
    const engine = getExportEngine();
    const queue = engine.getQueue();
    const activeQueue = queue.filter(e => 
      e.status === 'queued' || e.status === 'processing'
    );
    const history = queue.filter(e => 
      e.status === 'complete' || e.status === 'error'
    );

    this.setState({ queue: activeQueue, history });
  }

  /**
   * Start polling for queue updates.
   */
  private startPolling(): void {
    this.pollInterval = window.setInterval(() => {
      if (this.state.isOpen) {
        this.updateQueue();
      }
    }, 100);
  }

  /**
   * Stop polling.
   */
  destroy(): void {
    if (this.pollInterval !== null) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * Load user presets from localStorage.
   */
  private loadUserPresets(): void {
    try {
      const json = localStorage.getItem('cardplay:export-presets');
      if (json) {
        this.userPresets = JSON.parse(json);
        this.setState({
          presets: [...FACTORY_EXPORT_PRESETS, ...this.userPresets],
        });
      }
    } catch (error) {
      console.error('Failed to load export presets:', error);
    }
  }

  /**
   * Save user presets to localStorage.
   */
  private saveUserPresets(): void {
    try {
      localStorage.setItem('cardplay:export-presets', JSON.stringify(this.userPresets));
    } catch (error) {
      console.error('Failed to save export presets:', error);
    }
  }
}

// ============================================================================
// UI RENDERING HELPERS
// ============================================================================

/**
 * Format file size for display.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Format duration for display.
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format dB level for display.
 */
export function formatDb(db: number): string {
  if (db === -Infinity) return '-∞ dB';
  return `${db.toFixed(1)} dB`;
}

/**
 * Get progress percentage string.
 */
export function formatProgress(progress: number): string {
  return `${Math.round(progress * 100)}%`;
}

/**
 * Get estimated time remaining string.
 */
export function formatTimeRemaining(ms: number | null): string {
  if (ms === null) return 'Calculating...';
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Get phase display name.
 */
export function getPhaseDisplayName(phase: ExportProgress['phase']): string {
  switch (phase) {
    case 'preparing': return 'Preparing...';
    case 'rendering': return 'Rendering audio...';
    case 'encoding': return 'Encoding...';
    case 'writing': return 'Writing file...';
    case 'complete': return 'Complete';
    case 'error': return 'Error';
  }
}

/**
 * Get format display name with icon.
 */
export function getFormatDisplay(format: ExportFormat): string {
  switch (format) {
    case 'wav': return '🔊 WAV (Uncompressed)';
    case 'mp3': return '🎵 MP3 (Lossy)';
    case 'flac': return '💎 FLAC (Lossless)';
    case 'ogg': return '🎶 OGG Vorbis (Lossy)';
  }
}

/**
 * Get bit depth options for current format.
 */
export function getAvailableBitDepths(format: ExportFormat): BitDepth[] {
  switch (format) {
    case 'wav':
    case 'flac':
      return [16, 24, 32];
    case 'mp3':
    case 'ogg':
      return [16]; // These formats have fixed internal precision
  }
}

/**
 * Get sample rate display name.
 */
export function getSampleRateDisplay(sampleRate: SampleRate): string {
  if (sampleRate >= 1000) {
    return `${(sampleRate / 1000).toFixed(1)} kHz`;
  }
  return `${sampleRate} Hz`;
}

/**
 * Get dither display name.
 */
export function getDitherDisplay(dither: DitherType): string {
  switch (dither) {
    case 'none': return 'None';
    case 'triangular': return 'Triangular (TPDF)';
    case 'shaped': return 'Noise Shaped';
  }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if format supports given bit depth.
 */
export function formatSupportsBitDepth(format: ExportFormat, bitDepth: BitDepth): boolean {
  const available = getAvailableBitDepths(format);
  return available.includes(bitDepth);
}

/**
 * Check if dithering is recommended for config.
 */
export function isDitherRecommended(bitDepth: BitDepth): boolean {
  return bitDepth < 32;
}

/**
 * Get recommended export settings warning.
 */
export function getExportWarnings(config: ExportConfig): string[] {
  const warnings: string[] = [];

  if (config.bitDepth < 24 && config.dither === 'none') {
    warnings.push('Dithering is recommended when exporting at 16-bit');
  }

  if (config.format === 'mp3' && config.sampleRate > 48000) {
    warnings.push('MP3 typically uses sample rates ≤ 48 kHz');
  }

  if (config.normalizeDb !== null && config.normalizeDb > -0.1) {
    warnings.push('Normalizing close to 0 dBFS may cause clipping in some players');
  }

  if (config.realtime) {
    warnings.push('Real-time export is slower but allows live monitoring');
  }

  return warnings;
}
