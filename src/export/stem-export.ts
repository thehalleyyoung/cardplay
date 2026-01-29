/**
 * Stem Export System
 * 
 * Implements M299-M306:
 * - M299: Create "Export Stems" workflow
 * - M300: Add stem export configuration
 * - M301: Add export format options
 * - M303: Implement parallel stem rendering
 */

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

/** Audio export format */
export type ExportFormat = 'wav' | 'aiff' | 'flac' | 'mp3' | 'ogg';

/** Bit depth options */
export type BitDepth = 16 | 24 | 32;

/** Sample rate options */
export type SampleRate = 44100 | 48000 | 88200 | 96000 | 192000;

/** Stem definition */
export interface StemDefinition {
  id: string;
  name: string;
  trackIds: string[];
  color: string;
  solo: boolean;
  mute: boolean;
}

/** Export format configuration */
export interface FormatConfig {
  format: ExportFormat;
  bitDepth: BitDepth;
  sampleRate: SampleRate;
  normalize: boolean;
  normalizePeak: number; // dBFS, e.g., -0.3
  dither: boolean;
  ditherType: 'none' | 'triangular' | 'noise-shaped';
}

/** Stem export configuration */
export interface StemExportConfig {
  stems: StemDefinition[];
  outputDir: string;
  fileNamePattern: string; // e.g., "{project}_{stem}_{date}"
  format: FormatConfig;
  exportMaster: boolean;
  masterName: string;
  includeProjectName: boolean;
  createSubfolder: boolean;
  overwriteExisting: boolean;
  parallelRenders: number; // 1-8
  startTime: number; // Samples
  endTime: number; // Samples or -1 for end
  tailLengthMs: number; // For reverb tails
}

/** Export job status */
export type ExportJobStatus = 
  | 'pending'
  | 'rendering'
  | 'encoding'
  | 'writing'
  | 'complete'
  | 'failed'
  | 'cancelled';

/** Individual stem export job */
export interface StemExportJob {
  id: string;
  stemId: string;
  stemName: string;
  status: ExportJobStatus;
  progress: number; // 0-100
  outputPath: string | null;
  startedAt: number | null;
  completedAt: number | null;
  error: string | null;
  fileSizeBytes: number | null;
}

/** Overall export session */
export interface ExportSession {
  id: string;
  projectName: string;
  config: StemExportConfig;
  jobs: StemExportJob[];
  status: 'preparing' | 'running' | 'complete' | 'failed' | 'cancelled';
  overallProgress: number;
  startedAt: number;
  completedAt: number | null;
  totalFileSizeBytes: number;
}

/** Export result */
export interface ExportResult {
  success: boolean;
  session: ExportSession;
  outputFiles: string[];
  totalDuration: number;
  message: string;
}

/** Preset stem configurations */
export interface StemPreset {
  id: string;
  name: string;
  description: string;
  stems: Omit<StemDefinition, 'id'>[];
}

// --------------------------------------------------------------------------
// Default configurations
// --------------------------------------------------------------------------

export const DEFAULT_FORMAT_CONFIG: FormatConfig = {
  format: 'wav',
  bitDepth: 24,
  sampleRate: 48000,
  normalize: false,
  normalizePeak: -0.3,
  dither: true,
  ditherType: 'triangular',
};

export const DEFAULT_EXPORT_CONFIG: Partial<StemExportConfig> = {
  outputDir: './exports',
  fileNamePattern: '{project}_{stem}',
  exportMaster: true,
  masterName: 'Master',
  includeProjectName: true,
  createSubfolder: true,
  overwriteExisting: false,
  parallelRenders: 2,
  startTime: 0,
  endTime: -1,
  tailLengthMs: 500,
};

/** Built-in stem presets */
export const STEM_PRESETS: StemPreset[] = [
  {
    id: 'basic-4',
    name: 'Basic 4 Stems',
    description: 'Drums, Bass, Music, Vocals',
    stems: [
      { name: 'Drums', trackIds: [], color: '#ff4444', solo: false, mute: false },
      { name: 'Bass', trackIds: [], color: '#44ff44', solo: false, mute: false },
      { name: 'Music', trackIds: [], color: '#4444ff', solo: false, mute: false },
      { name: 'Vocals', trackIds: [], color: '#ff44ff', solo: false, mute: false },
    ],
  },
  {
    id: 'dolby-atmos',
    name: 'Dolby Atmos (7 Stems)',
    description: 'Standard Atmos stem layout for immersive mixing',
    stems: [
      { name: 'Drums', trackIds: [], color: '#ff4444', solo: false, mute: false },
      { name: 'Bass', trackIds: [], color: '#44ff44', solo: false, mute: false },
      { name: 'Keyboards', trackIds: [], color: '#4444ff', solo: false, mute: false },
      { name: 'Guitars', trackIds: [], color: '#ffff44', solo: false, mute: false },
      { name: 'Strings', trackIds: [], color: '#44ffff', solo: false, mute: false },
      { name: 'Lead Vocals', trackIds: [], color: '#ff44ff', solo: false, mute: false },
      { name: 'Background Vocals', trackIds: [], color: '#ff8844', solo: false, mute: false },
    ],
  },
  {
    id: 'film-score',
    name: 'Film Score (8 Stems)',
    description: 'Standard film scoring stem layout',
    stems: [
      { name: 'Strings', trackIds: [], color: '#8844ff', solo: false, mute: false },
      { name: 'Brass', trackIds: [], color: '#ff8844', solo: false, mute: false },
      { name: 'Woodwinds', trackIds: [], color: '#44ff88', solo: false, mute: false },
      { name: 'Percussion', trackIds: [], color: '#ff4444', solo: false, mute: false },
      { name: 'Choir', trackIds: [], color: '#ff44ff', solo: false, mute: false },
      { name: 'Keys/Harp', trackIds: [], color: '#44ffff', solo: false, mute: false },
      { name: 'Synths/Electronics', trackIds: [], color: '#4444ff', solo: false, mute: false },
      { name: 'FX/Ambience', trackIds: [], color: '#888888', solo: false, mute: false },
    ],
  },
  {
    id: 'dj-remix',
    name: 'DJ/Remix (6 Stems)',
    description: 'Stems for DJ use and remixing',
    stems: [
      { name: 'Kick', trackIds: [], color: '#ff4444', solo: false, mute: false },
      { name: 'Percussion', trackIds: [], color: '#ff8844', solo: false, mute: false },
      { name: 'Bass', trackIds: [], color: '#44ff44', solo: false, mute: false },
      { name: 'Synths', trackIds: [], color: '#4444ff', solo: false, mute: false },
      { name: 'FX', trackIds: [], color: '#44ffff', solo: false, mute: false },
      { name: 'Vocals', trackIds: [], color: '#ff44ff', solo: false, mute: false },
    ],
  },
  {
    id: 'individual-tracks',
    name: 'Individual Tracks',
    description: 'Export each track as a separate stem',
    stems: [], // Will be auto-populated from project tracks
  },
];

// --------------------------------------------------------------------------
// Utility functions
// --------------------------------------------------------------------------

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get file extension for format
 */
export function getFormatExtension(format: ExportFormat): string {
  switch (format) {
    case 'wav': return '.wav';
    case 'aiff': return '.aiff';
    case 'flac': return '.flac';
    case 'mp3': return '.mp3';
    case 'ogg': return '.ogg';
  }
}

/**
 * Estimate file size for a stem
 */
export function estimateFileSize(
  durationSeconds: number,
  sampleRate: SampleRate,
  bitDepth: BitDepth,
  channels: number,
  format: ExportFormat
): number {
  const bytesPerSample = bitDepth / 8;
  const rawSize = durationSeconds * sampleRate * bytesPerSample * channels;
  
  // Compression ratios (approximate)
  switch (format) {
    case 'wav':
    case 'aiff':
      return rawSize;
    case 'flac':
      return rawSize * 0.5; // ~50% compression
    case 'mp3':
      return rawSize * 0.1; // ~90% compression
    case 'ogg':
      return rawSize * 0.08; // ~92% compression
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Parse filename pattern
 */
export function parseFileNamePattern(
  pattern: string,
  variables: Record<string, string>
): string {
  let result = pattern;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  // Sanitize filename
  return result.replace(/[<>:"/\\|?*]/g, '_');
}

/**
 * Validate stem configuration
 */
export function validateStemConfig(config: StemExportConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (config.stems.length === 0) {
    errors.push('At least one stem must be defined');
  }
  
  if (!config.outputDir) {
    errors.push('Output directory must be specified');
  }
  
  if (config.parallelRenders < 1 || config.parallelRenders > 8) {
    errors.push('Parallel renders must be between 1 and 8');
  }
  
  if (config.endTime !== -1 && config.endTime <= config.startTime) {
    errors.push('End time must be after start time');
  }
  
  const stemNames = config.stems.map(s => s.name.toLowerCase());
  const uniqueNames = new Set(stemNames);
  if (uniqueNames.size !== stemNames.length) {
    errors.push('Stem names must be unique');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// --------------------------------------------------------------------------
// Stem Export Store
// --------------------------------------------------------------------------

export class StemExportStore {
  private sessions: Map<string, ExportSession> = new Map();
  private activeSessionId: string | null = null;
  private listeners: Set<(session: ExportSession | null) => void> = new Set();
  
  /**
   * Create a new export session
   */
  createSession(
    projectName: string,
    config: StemExportConfig
  ): { session: ExportSession | null; errors: string[] } {
    const validation = validateStemConfig(config);
    if (!validation.valid) {
      return { session: null, errors: validation.errors };
    }
    
    const sessionId = generateId();
    const jobs: StemExportJob[] = [];
    
    // Create job for each stem
    for (const stem of config.stems) {
      jobs.push({
        id: generateId(),
        stemId: stem.id,
        stemName: stem.name,
        status: 'pending',
        progress: 0,
        outputPath: null,
        startedAt: null,
        completedAt: null,
        error: null,
        fileSizeBytes: null,
      });
    }
    
    // Create master job if requested
    if (config.exportMaster) {
      jobs.push({
        id: generateId(),
        stemId: 'master',
        stemName: config.masterName,
        status: 'pending',
        progress: 0,
        outputPath: null,
        startedAt: null,
        completedAt: null,
        error: null,
        fileSizeBytes: null,
      });
    }
    
    const session: ExportSession = {
      id: sessionId,
      projectName,
      config,
      jobs,
      status: 'preparing',
      overallProgress: 0,
      startedAt: Date.now(),
      completedAt: null,
      totalFileSizeBytes: 0,
    };
    
    this.sessions.set(sessionId, session);
    this.activeSessionId = sessionId;
    this.notifyListeners();
    
    return { session, errors: [] };
  }
  
  /**
   * Start the export session
   */
  async startExport(sessionId: string): Promise<ExportResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        success: false,
        session: null as unknown as ExportSession,
        outputFiles: [],
        totalDuration: 0,
        message: 'Session not found',
      };
    }
    
    session.status = 'running';
    this.notifyListeners();
    
    const parallelLimit = session.config.parallelRenders;
    const outputFiles: string[] = [];
    let completed = 0;
    let failed = 0;
    
    // Process jobs in parallel batches
    for (let i = 0; i < session.jobs.length; i += parallelLimit) {
      const batch = session.jobs.slice(i, i + parallelLimit);
      
      await Promise.all(batch.map(async job => {
        try {
          await this.processJob(session, job);
          if (job.outputPath) {
            outputFiles.push(job.outputPath);
          }
          completed++;
        } catch (e) {
          job.status = 'failed';
          job.error = e instanceof Error ? e.message : 'Unknown error';
          failed++;
        }
        
        // Update overall progress
        session.overallProgress = ((completed + failed) / session.jobs.length) * 100;
        this.notifyListeners();
      }));
    }
    
    // Calculate totals
    session.totalFileSizeBytes = session.jobs.reduce(
      (sum, job) => sum + (job.fileSizeBytes || 0),
      0
    );
    session.completedAt = Date.now();
    session.status = failed > 0 ? 'failed' : 'complete';
    
    this.notifyListeners();
    
    return {
      success: failed === 0,
      session,
      outputFiles,
      totalDuration: session.completedAt - session.startedAt,
      message: failed === 0 
        ? `Successfully exported ${completed} stems` 
        : `Exported ${completed} stems, ${failed} failed`,
    };
  }
  
  /**
   * Process a single export job (simulated)
   */
  private async processJob(session: ExportSession, job: StemExportJob): Promise<void> {
    job.status = 'rendering';
    job.startedAt = Date.now();
    
    // Simulate rendering progress
    for (let progress = 0; progress <= 100; progress += 10) {
      job.progress = progress;
      
      if (progress === 50) {
        job.status = 'encoding';
      }
      if (progress === 80) {
        job.status = 'writing';
      }
      
      this.notifyListeners();
      await new Promise(resolve => setTimeout(resolve, 10)); // Simulate work
    }
    
    // Generate output path
    const variables = {
      project: session.projectName,
      stem: job.stemName,
      date: new Date().toISOString().slice(0, 10),
    };
    
    const fileName = parseFileNamePattern(session.config.fileNamePattern, variables);
    const ext = getFormatExtension(session.config.format.format);
    
    job.outputPath = `${session.config.outputDir}/${fileName}${ext}`;
    job.fileSizeBytes = Math.floor(Math.random() * 50000000) + 1000000; // Simulated size
    job.status = 'complete';
    job.completedAt = Date.now();
  }
  
  /**
   * Cancel an export session
   */
  cancelExport(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'running') {
      return false;
    }
    
    session.status = 'cancelled';
    session.completedAt = Date.now();
    
    // Mark pending jobs as cancelled
    for (const job of session.jobs) {
      if (job.status === 'pending' || job.status === 'rendering') {
        job.status = 'cancelled';
      }
    }
    
    this.notifyListeners();
    return true;
  }
  
  /**
   * Get a session by ID
   */
  getSession(sessionId: string): ExportSession | undefined {
    return this.sessions.get(sessionId);
  }
  
  /**
   * Get the active session
   */
  getActiveSession(): ExportSession | null {
    return this.activeSessionId ? this.sessions.get(this.activeSessionId) || null : null;
  }
  
  /**
   * Get all sessions
   */
  getAllSessions(): ExportSession[] {
    return Array.from(this.sessions.values());
  }
  
  /**
   * Delete a session
   */
  deleteSession(sessionId: string): boolean {
    if (this.activeSessionId === sessionId) {
      this.activeSessionId = null;
    }
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      this.notifyListeners();
    }
    return deleted;
  }
  
  /**
   * Get preset by ID
   */
  getPreset(presetId: string): StemPreset | undefined {
    return STEM_PRESETS.find(p => p.id === presetId);
  }
  
  /**
   * Get all presets
   */
  getPresets(): StemPreset[] {
    return [...STEM_PRESETS];
  }
  
  /**
   * Create stems from preset
   */
  createStemsFromPreset(presetId: string): StemDefinition[] {
    const preset = this.getPreset(presetId);
    if (!preset) return [];
    
    return preset.stems.map(s => ({
      ...s,
      id: generateId(),
    }));
  }
  
  /**
   * Subscribe to session changes
   */
  subscribe(listener: (session: ExportSession | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  private notifyListeners(): void {
    const session = this.getActiveSession();
    this.listeners.forEach(l => l(session));
  }
  
  /**
   * Clear all sessions
   */
  clear(): void {
    this.sessions.clear();
    this.activeSessionId = null;
    this.notifyListeners();
  }
}

// Singleton instance
export const stemExportStore = new StemExportStore();
