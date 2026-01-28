/**
 * @fileoverview Sampler Voice Manager - Voice Allocation and Management
 * 
 * Implements comprehensive voice management including:
 * - Voice pool allocation
 * - Voice stealing algorithms (oldest, quietest, same-note)
 * - Per-zone voice limits
 * - Global voice limits
 * - Mono/legato modes
 * - Note priority (last, highest, lowest)
 * - Voice groups and exclusive groups
 * 
 * @module @cardplay/core/audio/sampler-voice
 */

// ============================================================================
// VOICE TYPES
// ============================================================================

/** Voice state */
export type VoiceState = 
  | 'free'
  | 'starting'
  | 'playing'
  | 'releasing'
  | 'stealing';

/** Voice mode */
export type VoiceMode = 'poly' | 'mono' | 'legato' | 'unison';

/** Note priority for mono modes */
export type NotePriority = 'last' | 'highest' | 'lowest';

/** Voice stealing mode */
export type VoiceStealingMode = 
  | 'oldest'
  | 'quietest'
  | 'same-note'
  | 'furthest'
  | 'none';

/** Voice allocation info */
export interface VoiceAllocationInfo {
  voiceId: number;
  zoneId: string;
  note: number;
  velocity: number;
  startTime: number;
  state: VoiceState;
  amplitude: number;
  output: number;
  group: number;
  exclusiveGroup: number | null;
  stolen: boolean;
  releaseTime: number | null;
}

/** Voice configuration */
export interface VoiceConfig {
  /** Maximum global polyphony */
  maxPolyphony: number;
  /** Per-zone voice limit (0 = unlimited) */
  perZoneLimit: number;
  /** Per-group voice limit (0 = unlimited) */
  perGroupLimit: number;
  /** Voice mode */
  mode: VoiceMode;
  /** Note priority for mono/legato */
  notePriority: NotePriority;
  /** Voice stealing mode */
  stealingMode: VoiceStealingMode;
  /** Unison voice count */
  unisonVoices: number;
  /** Unison detune (semitones) */
  unisonDetune: number;
  /** Unison stereo spread (0-1) */
  unisonSpread: number;
  /** Portamento/glide time (seconds) */
  portamentoTime: number;
  /** Portamento mode */
  portamentoMode: 'always' | 'legato' | 'off';
  /** Release time scale when stealing */
  stealReleaseTime: number;
  /** Retrigger on new notes in legato mode */
  legatoRetrigger: boolean;
}

/** Voice pool statistics */
export interface VoicePoolStats {
  totalVoices: number;
  activeVoices: number;
  releasingVoices: number;
  freeVoices: number;
  peakVoices: number;
  voicesStolenTotal: number;
  voicesByZone: Map<string, number>;
  voicesByGroup: Map<number, number>;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  maxPolyphony: 64,
  perZoneLimit: 0,
  perGroupLimit: 0,
  mode: 'poly',
  notePriority: 'last',
  stealingMode: 'oldest',
  unisonVoices: 1,
  unisonDetune: 0.1,
  unisonSpread: 0.5,
  portamentoTime: 0,
  portamentoMode: 'off',
  stealReleaseTime: 0.01,
  legatoRetrigger: false,
};

// ============================================================================
// VOICE CLASS
// ============================================================================

/**
 * Individual voice instance
 */
export class SamplerVoice {
  public id: number;
  public state: VoiceState = 'free';
  public zoneId: string | null = null;
  public note: number = 0;
  public velocity: number = 0;
  public startTime: number = 0;
  public releaseTime: number | null = null;
  public amplitude: number = 0;
  public output: number = 0;
  public group: number = 0;
  public exclusiveGroup: number | null = null;
  public stolen: boolean = false;
  
  // Pitch handling
  public basePitch: number = 0;
  public targetPitch: number = 0;
  public currentPitch: number = 0;
  public portamentoRate: number = 0;
  
  // Unison
  public unisonIndex: number = 0;
  public unisonDetune: number = 0;
  public unisonPan: number = 0;
  
  // Internal processing
  public samplePosition: number = 0;
  public sampleIncrement: number = 1;
  public looping: boolean = false;
  public loopStart: number = 0;
  public loopEnd: number = 0;
  
  constructor(id: number) {
    this.id = id;
  }
  
  /**
   * Reset voice to free state
   */
  reset(): void {
    this.state = 'free';
    this.zoneId = null;
    this.note = 0;
    this.velocity = 0;
    this.startTime = 0;
    this.releaseTime = null;
    this.amplitude = 0;
    this.output = 0;
    this.group = 0;
    this.exclusiveGroup = null;
    this.stolen = false;
    this.basePitch = 0;
    this.targetPitch = 0;
    this.currentPitch = 0;
    this.portamentoRate = 0;
    this.unisonIndex = 0;
    this.unisonDetune = 0;
    this.unisonPan = 0;
    this.samplePosition = 0;
    this.sampleIncrement = 1;
    this.looping = false;
    this.loopStart = 0;
    this.loopEnd = 0;
  }
  
  /**
   * Start voice
   */
  start(
    zoneId: string,
    note: number,
    velocity: number,
    output: number,
    group: number,
    exclusiveGroup: number | null,
    time: number
  ): void {
    this.state = 'starting';
    this.zoneId = zoneId;
    this.note = note;
    this.velocity = velocity;
    this.startTime = time;
    this.releaseTime = null;
    this.amplitude = 1;
    this.output = output;
    this.group = group;
    this.exclusiveGroup = exclusiveGroup;
    this.stolen = false;
  }
  
  /**
   * Release voice
   */
  release(time: number): void {
    if (this.state === 'playing' || this.state === 'starting') {
      this.state = 'releasing';
      this.releaseTime = time;
    }
  }
  
  /**
   * Steal voice (fast release)
   */
  steal(time: number): void {
    this.state = 'stealing';
    this.releaseTime = time;
    this.stolen = true;
  }
  
  /**
   * Mark as playing
   */
  play(): void {
    if (this.state === 'starting') {
      this.state = 'playing';
    }
  }
  
  /**
   * Check if voice can be stolen
   */
  canBeStolen(): boolean {
    return this.state === 'playing' || 
           this.state === 'releasing' ||
           this.state === 'starting';
  }
  
  /**
   * Check if voice is active
   */
  isActive(): boolean {
    return this.state !== 'free';
  }
  
  /**
   * Get voice age (for stealing)
   */
  getAge(currentTime: number): number {
    return currentTime - this.startTime;
  }
  
  /**
   * Update portamento pitch
   */
  updatePitch(deltaTime: number): void {
    if (this.portamentoRate > 0 && this.currentPitch !== this.targetPitch) {
      const diff = this.targetPitch - this.currentPitch;
      const step = this.portamentoRate * deltaTime;
      
      if (Math.abs(diff) <= step) {
        this.currentPitch = this.targetPitch;
      } else {
        this.currentPitch += Math.sign(diff) * step;
      }
    }
  }
  
  /**
   * Get allocation info
   */
  getAllocationInfo(): VoiceAllocationInfo {
    return {
      voiceId: this.id,
      zoneId: this.zoneId ?? '',
      note: this.note,
      velocity: this.velocity,
      startTime: this.startTime,
      state: this.state,
      amplitude: this.amplitude,
      output: this.output,
      group: this.group,
      exclusiveGroup: this.exclusiveGroup,
      stolen: this.stolen,
      releaseTime: this.releaseTime,
    };
  }
}

// ============================================================================
// VOICE MANAGER CLASS
// ============================================================================

/**
 * Voice pool manager
 */
export class SamplerVoiceManager {
  private config: VoiceConfig;
  private voices: SamplerVoice[] = [];
  private voicesByNote: Map<number, SamplerVoice[]> = new Map();
  private voicesByZone: Map<string, SamplerVoice[]> = new Map();
  private voicesByGroup: Map<number, SamplerVoice[]> = new Map();
  private exclusiveGroupVoices: Map<number, SamplerVoice[]> = new Map();
  private activeNotes: Map<number, { velocity: number; time: number }> = new Map();
  private lastNote: number = 60;
  private peakVoices: number = 0;
  private totalStolenVoices: number = 0;
  
  constructor(config?: Partial<VoiceConfig>) {
    this.config = { ...DEFAULT_VOICE_CONFIG, ...config };
    this.initializePool();
  }
  
  /**
   * Initialize voice pool
   */
  private initializePool(): void {
    this.voices = [];
    for (let i = 0; i < this.config.maxPolyphony; i++) {
      this.voices.push(new SamplerVoice(i));
    }
  }
  
  /**
   * Set configuration
   */
  setConfig(config: Partial<VoiceConfig>): void {
    const oldPolyphony = this.config.maxPolyphony;
    Object.assign(this.config, config);
    
    // Resize pool if needed
    if (config.maxPolyphony !== undefined && config.maxPolyphony !== oldPolyphony) {
      this.resizePool(config.maxPolyphony);
    }
  }
  
  /**
   * Resize voice pool
   */
  private resizePool(newSize: number): void {
    if (newSize > this.voices.length) {
      // Add voices
      for (let i = this.voices.length; i < newSize; i++) {
        this.voices.push(new SamplerVoice(i));
      }
    } else if (newSize < this.voices.length) {
      // Remove voices (release active ones first)
      const currentTime = performance.now() / 1000;
      for (let i = newSize; i < this.voices.length; i++) {
        const voice = this.voices[i];
        if (voice && voice.isActive()) {
          voice.steal(currentTime);
        }
      }
      this.voices.length = newSize;
    }
  }
  
  /**
   * Allocate voice(s) for a note
   */
  allocateVoice(
    zoneId: string,
    note: number,
    velocity: number,
    output: number,
    group: number,
    exclusiveGroup: number | null,
    time: number
  ): SamplerVoice[] {
    // Handle exclusive groups (cut other voices)
    if (exclusiveGroup !== null) {
      this.cutExclusiveGroup(exclusiveGroup, time);
    }
    
    // Handle voice modes
    switch (this.config.mode) {
      case 'mono':
        return this.allocateMonoVoice(zoneId, note, velocity, output, group, exclusiveGroup, time);
        
      case 'legato':
        return this.allocateLegatoVoice(zoneId, note, velocity, output, group, exclusiveGroup, time);
        
      case 'unison':
        return this.allocateUnisonVoices(zoneId, note, velocity, output, group, exclusiveGroup, time);
        
      case 'poly':
      default:
        return this.allocatePolyVoice(zoneId, note, velocity, output, group, exclusiveGroup, time);
    }
  }
  
  /**
   * Allocate polyphonic voice
   */
  private allocatePolyVoice(
    zoneId: string,
    note: number,
    velocity: number,
    output: number,
    group: number,
    exclusiveGroup: number | null,
    time: number
  ): SamplerVoice[] {
    // Check limits
    if (!this.checkLimits(zoneId, group)) {
      const stolen = this.stealVoice(zoneId, group, time);
      if (!stolen) return [];
    }
    
    // Find free voice
    let voice = this.findFreeVoice();
    
    if (!voice) {
      // Steal voice
      voice = this.stealVoice(zoneId, group, time);
      if (!voice) return [];
    }
    
    // Start voice
    voice.start(zoneId, note, velocity, output, group, exclusiveGroup, time);
    
    // Track voice
    this.trackVoice(voice);
    this.updateStats();
    
    return [voice];
  }
  
  /**
   * Allocate mono voice
   */
  private allocateMonoVoice(
    zoneId: string,
    note: number,
    velocity: number,
    output: number,
    group: number,
    exclusiveGroup: number | null,
    time: number
  ): SamplerVoice[] {
    // Release all active voices
    for (const voice of this.voices) {
      if (voice.isActive() && voice.state !== 'releasing') {
        voice.release(time);
      }
    }
    
    // Apply note priority
    const noteToPlay = this.applyNotePriority(note);
    
    // Allocate single voice
    return this.allocatePolyVoice(zoneId, noteToPlay, velocity, output, group, exclusiveGroup, time);
  }
  
  /**
   * Allocate legato voice
   */
  private allocateLegatoVoice(
    zoneId: string,
    note: number,
    velocity: number,
    output: number,
    group: number,
    exclusiveGroup: number | null,
    time: number
  ): SamplerVoice[] {
    // Track note
    this.activeNotes.set(note, { velocity, time });
    
    // Apply note priority
    const noteToPlay = this.applyNotePriority(note);
    
    // Check if we have active voices
    const activeVoices = this.voices.filter(v => 
      v.state === 'playing' || v.state === 'starting'
    );
    
    if (activeVoices.length > 0 && !this.config.legatoRetrigger) {
      // Glide existing voices to new pitch
      for (const voice of activeVoices) {
        const semitones = noteToPlay - voice.note;
        voice.targetPitch = voice.basePitch + semitones;
        
        if (this.config.portamentoMode !== 'off' && this.config.portamentoTime > 0) {
          voice.portamentoRate = Math.abs(semitones) / this.config.portamentoTime;
        } else {
          voice.currentPitch = voice.targetPitch;
        }
      }
      return activeVoices;
    }
    
    // Allocate new voice
    return this.allocatePolyVoice(zoneId, noteToPlay, velocity, output, group, exclusiveGroup, time);
  }
  
  /**
   * Allocate unison voices
   */
  private allocateUnisonVoices(
    zoneId: string,
    note: number,
    velocity: number,
    output: number,
    group: number,
    exclusiveGroup: number | null,
    time: number
  ): SamplerVoice[] {
    const voices: SamplerVoice[] = [];
    const numVoices = Math.max(1, this.config.unisonVoices);
    
    for (let i = 0; i < numVoices; i++) {
      // Check limits
      if (!this.checkLimits(zoneId, group)) {
        const stolen = this.stealVoice(zoneId, group, time);
        if (!stolen) break;
      }
      
      let voice = this.findFreeVoice();
      if (!voice) {
        voice = this.stealVoice(zoneId, group, time);
        if (!voice) break;
      }
      
      // Start voice with unison parameters
      voice.start(zoneId, note, velocity, output, group, exclusiveGroup, time);
      voice.unisonIndex = i;
      
      // Calculate unison detune and pan
      if (numVoices > 1) {
        const position = (i / (numVoices - 1)) * 2 - 1; // -1 to 1
        voice.unisonDetune = position * this.config.unisonDetune;
        voice.unisonPan = position * this.config.unisonSpread;
      }
      
      this.trackVoice(voice);
      voices.push(voice);
    }
    
    this.updateStats();
    return voices;
  }
  
  /**
   * Release voice(s) for a note
   */
  releaseNote(note: number, time: number): void {
    // Remove from active notes
    this.activeNotes.delete(note);
    
    // Handle legato mode
    if (this.config.mode === 'legato' && this.activeNotes.size > 0) {
      // Find new target note
      const newNote = this.findPriorityNote();
      if (newNote !== null) {
        for (const voice of this.voices) {
          if (voice.state === 'playing' || voice.state === 'starting') {
            const semitones = newNote - voice.note;
            voice.targetPitch = voice.basePitch + semitones;
            
            if (this.config.portamentoMode !== 'off' && this.config.portamentoTime > 0) {
              voice.portamentoRate = Math.abs(semitones) / this.config.portamentoTime;
            } else {
              voice.currentPitch = voice.targetPitch;
            }
          }
        }
        return;
      }
    }
    
    // Release all voices with this note
    const noteVoices = this.voicesByNote.get(note) ?? [];
    for (const voice of noteVoices) {
      if (voice.state === 'playing' || voice.state === 'starting') {
        voice.release(time);
      }
    }
  }
  
  /**
   * Release all voices
   */
  releaseAll(time: number): void {
    this.activeNotes.clear();
    
    for (const voice of this.voices) {
      if (voice.state === 'playing' || voice.state === 'starting') {
        voice.release(time);
      }
    }
  }
  
  /**
   * Stop all voices immediately
   */
  stopAll(): void {
    this.activeNotes.clear();
    this.voicesByNote.clear();
    this.voicesByZone.clear();
    this.voicesByGroup.clear();
    this.exclusiveGroupVoices.clear();
    
    for (const voice of this.voices) {
      voice.reset();
    }
  }
  
  /**
   * Cut exclusive group
   */
  private cutExclusiveGroup(group: number, time: number): void {
    const voices = this.exclusiveGroupVoices.get(group) ?? [];
    for (const voice of voices) {
      if (voice.isActive()) {
        voice.steal(time);
      }
    }
  }
  
  /**
   * Check if voice limits allow allocation
   */
  private checkLimits(zoneId: string, group: number): boolean {
    // Global limit
    const activeCount = this.getActiveVoiceCount();
    if (activeCount >= this.config.maxPolyphony) {
      return false;
    }
    
    // Per-zone limit
    if (this.config.perZoneLimit > 0) {
      const zoneVoices = this.voicesByZone.get(zoneId) ?? [];
      const activeZoneVoices = zoneVoices.filter(v => v.isActive()).length;
      if (activeZoneVoices >= this.config.perZoneLimit) {
        return false;
      }
    }
    
    // Per-group limit
    if (this.config.perGroupLimit > 0) {
      const groupVoices = this.voicesByGroup.get(group) ?? [];
      const activeGroupVoices = groupVoices.filter(v => v.isActive()).length;
      if (activeGroupVoices >= this.config.perGroupLimit) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Find a free voice
   */
  private findFreeVoice(): SamplerVoice | null {
    for (const voice of this.voices) {
      if (voice.state === 'free') {
        return voice;
      }
    }
    return null;
  }
  
  /**
   * Steal a voice based on stealing mode
   */
  private stealVoice(zoneId: string, _group: number, time: number): SamplerVoice | null {
    if (this.config.stealingMode === 'none') {
      return null;
    }
    
    const stealCandidates = this.voices.filter(v => v.canBeStolen());
    
    if (stealCandidates.length === 0) {
      return null;
    }
    
    let victim: SamplerVoice | null | undefined = null;
    
    switch (this.config.stealingMode) {
      case 'oldest':
        victim = this.findOldestVoice(stealCandidates, time) ?? null;
        break;
        
      case 'quietest':
        victim = this.findQuietestVoice(stealCandidates) ?? null;
        break;
        
      case 'same-note':
        // Prefer same zone first
        victim = stealCandidates.find(v => v.zoneId === zoneId) ?? 
                 this.findOldestVoice(stealCandidates, time) ?? null;
        break;
        
      case 'furthest':
        // Steal voice furthest from new note (for keyboard splits)
        victim = this.findFurthestVoice(stealCandidates, this.lastNote) ?? null;
        break;
        
      default:
        victim = this.findOldestVoice(stealCandidates, time) ?? null;
    }
    
    if (victim) {
      this.untrackVoice(victim);
      victim.steal(time);
      this.totalStolenVoices++;
      
      // Wait for fast release then reset
      victim.reset();
    }
    
    return victim;
  }
  
  /**
   * Find oldest voice
   */
  private findOldestVoice(voices: SamplerVoice[], time: number): SamplerVoice | undefined {
    if (voices.length === 0) return undefined;
    let oldest = voices[0];
    if (!oldest) return undefined;
    let maxAge = oldest.getAge(time);
    
    for (let i = 1; i < voices.length; i++) {
      const voice = voices[i];
      if (!voice) continue;
      const age = voice.getAge(time);
      if (age > maxAge) {
        maxAge = age;
        oldest = voice;
      }
    }
    
    return oldest;
  }
  
  /**
   * Find quietest voice
   */
  private findQuietestVoice(voices: SamplerVoice[]): SamplerVoice | undefined {
    if (voices.length === 0) return undefined;
    let quietest = voices[0];
    if (!quietest) return undefined;
    let minAmplitude = quietest.amplitude;
    
    for (let i = 1; i < voices.length; i++) {
      const voice = voices[i];
      if (!voice) continue;
      if (voice.amplitude < minAmplitude) {
        minAmplitude = voice.amplitude;
        quietest = voice;
      }
    }
    
    return quietest;
  }
  
  /**
   * Find voice furthest from a note
   */
  private findFurthestVoice(voices: SamplerVoice[], note: number): SamplerVoice | undefined {
    if (voices.length === 0) return undefined;
    let furthest = voices[0];
    if (!furthest) return undefined;
    let maxDistance = Math.abs(furthest.note - note);
    
    for (let i = 1; i < voices.length; i++) {
      const voice = voices[i];
      if (!voice) continue;
      const distance = Math.abs(voice.note - note);
      if (distance > maxDistance) {
        maxDistance = distance;
        furthest = voice;
      }
    }
    
    return furthest;
  }
  
  /**
   * Track voice in lookup tables
   */
  private trackVoice(voice: SamplerVoice): void {
    // By note
    if (!this.voicesByNote.has(voice.note)) {
      this.voicesByNote.set(voice.note, []);
    }
    this.voicesByNote.get(voice.note)!.push(voice);
    
    // By zone
    if (voice.zoneId) {
      if (!this.voicesByZone.has(voice.zoneId)) {
        this.voicesByZone.set(voice.zoneId, []);
      }
      this.voicesByZone.get(voice.zoneId)!.push(voice);
    }
    
    // By group
    if (!this.voicesByGroup.has(voice.group)) {
      this.voicesByGroup.set(voice.group, []);
    }
    this.voicesByGroup.get(voice.group)!.push(voice);
    
    // By exclusive group
    if (voice.exclusiveGroup !== null) {
      if (!this.exclusiveGroupVoices.has(voice.exclusiveGroup)) {
        this.exclusiveGroupVoices.set(voice.exclusiveGroup, []);
      }
      this.exclusiveGroupVoices.get(voice.exclusiveGroup)!.push(voice);
    }
    
    this.lastNote = voice.note;
  }
  
  /**
   * Untrack voice from lookup tables
   */
  private untrackVoice(voice: SamplerVoice): void {
    // Remove from note map
    const noteVoices = this.voicesByNote.get(voice.note);
    if (noteVoices) {
      const idx = noteVoices.indexOf(voice);
      if (idx !== -1) noteVoices.splice(idx, 1);
    }
    
    // Remove from zone map
    if (voice.zoneId) {
      const zoneVoices = this.voicesByZone.get(voice.zoneId);
      if (zoneVoices) {
        const idx = zoneVoices.indexOf(voice);
        if (idx !== -1) zoneVoices.splice(idx, 1);
      }
    }
    
    // Remove from group map
    const groupVoices = this.voicesByGroup.get(voice.group);
    if (groupVoices) {
      const idx = groupVoices.indexOf(voice);
      if (idx !== -1) groupVoices.splice(idx, 1);
    }
    
    // Remove from exclusive group map
    if (voice.exclusiveGroup !== null) {
      const exVoices = this.exclusiveGroupVoices.get(voice.exclusiveGroup);
      if (exVoices) {
        const idx = exVoices.indexOf(voice);
        if (idx !== -1) exVoices.splice(idx, 1);
      }
    }
  }
  
  /**
   * Apply note priority for mono/legato modes
   */
  private applyNotePriority(newNote: number): number {
    if (this.activeNotes.size === 0) {
      return newNote;
    }
    
    const notes = Array.from(this.activeNotes.keys());
    
    switch (this.config.notePriority) {
      case 'highest':
        return Math.max(newNote, ...notes);
        
      case 'lowest':
        return Math.min(newNote, ...notes);
        
      case 'last':
      default:
        return newNote;
    }
  }
  
  /**
   * Find priority note from active notes
   */
  private findPriorityNote(): number | null {
    if (this.activeNotes.size === 0) {
      return null;
    }
    
    const notes = Array.from(this.activeNotes.keys());
    
    switch (this.config.notePriority) {
      case 'highest':
        return Math.max(...notes);
        
      case 'lowest':
        return Math.min(...notes);
        
      case 'last':
      default:
        // Find most recent
        let latestTime = 0;
        let latestNote: number | null = notes[0] ?? null;
        
        for (const [note, info] of this.activeNotes) {
          if (info.time > latestTime) {
            latestTime = info.time;
            latestNote = note;
          }
        }
        
        return latestNote;
    }
  }
  
  /**
   * Update statistics
   */
  private updateStats(): void {
    const activeCount = this.getActiveVoiceCount();
    if (activeCount > this.peakVoices) {
      this.peakVoices = activeCount;
    }
  }
  
  /**
   * Get count of active voices
   */
  getActiveVoiceCount(): number {
    return this.voices.filter(v => v.isActive()).length;
  }
  
  /**
   * Get all active voices
   */
  getActiveVoices(): SamplerVoice[] {
    return this.voices.filter(v => v.isActive());
  }
  
  /**
   * Get voices for a specific note
   */
  getVoicesForNote(note: number): SamplerVoice[] {
    return (this.voicesByNote.get(note) ?? []).filter(v => v.isActive());
  }
  
  /**
   * Get voices for a specific zone
   */
  getVoicesForZone(zoneId: string): SamplerVoice[] {
    return (this.voicesByZone.get(zoneId) ?? []).filter(v => v.isActive());
  }
  
  /**
   * Get pool statistics
   */
  getStats(): VoicePoolStats {
    const activeVoices = this.voices.filter(v => 
      v.state === 'playing' || v.state === 'starting'
    ).length;
    
    const releasingVoices = this.voices.filter(v => 
      v.state === 'releasing' || v.state === 'stealing'
    ).length;
    
    const voicesByZone = new Map<string, number>();
    for (const [zoneId, voices] of this.voicesByZone) {
      voicesByZone.set(zoneId, voices.filter(v => v.isActive()).length);
    }
    
    const voicesByGroup = new Map<number, number>();
    for (const [group, voices] of this.voicesByGroup) {
      voicesByGroup.set(group, voices.filter(v => v.isActive()).length);
    }
    
    return {
      totalVoices: this.config.maxPolyphony,
      activeVoices,
      releasingVoices,
      freeVoices: this.config.maxPolyphony - activeVoices - releasingVoices,
      peakVoices: this.peakVoices,
      voicesStolenTotal: this.totalStolenVoices,
      voicesByZone,
      voicesByGroup,
    };
  }
  
  /**
   * Reset peak statistics
   */
  resetStats(): void {
    this.peakVoices = 0;
    this.totalStolenVoices = 0;
  }
  
  /**
   * Get configuration
   */
  getConfig(): VoiceConfig {
    return { ...this.config };
  }
  
  /**
   * Process finished voices (call each audio frame)
   */
  processFinishedVoices(): void {
    for (const voice of this.voices) {
      if (voice.state === 'releasing' || voice.state === 'stealing') {
        // Check if release is complete (amplitude near zero)
        if (voice.amplitude < 0.001) {
          this.untrackVoice(voice);
          voice.reset();
        }
      }
    }
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create voice manager
 */
export function createVoiceManager(config?: Partial<VoiceConfig>): SamplerVoiceManager {
  return new SamplerVoiceManager(config);
}

/**
 * Create default voice config
 */
export function createVoiceConfig(overrides?: Partial<VoiceConfig>): VoiceConfig {
  return { ...DEFAULT_VOICE_CONFIG, ...overrides };
}

/**
 * Create voice
 */
export function createVoice(id: number): SamplerVoice {
  return new SamplerVoice(id);
}
