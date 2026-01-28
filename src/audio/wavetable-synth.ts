// =============================================================================
// COMPLETE WAVETABLE SYNTHESIZER INSTRUMENT
// =============================================================================

import {
  UnifiedPreset,
  UnifiedOscillator,
  UnifiedFilter,
  UnifiedEnvelope,
  UnifiedLFO,
  InstrumentCategory
} from './unified-preset';
import { InstrumentDatabase, getInstrumentDatabase } from './instrument-database';

// =============================================================================
// CONSTANTS
// =============================================================================

const TWO_PI = Math.PI * 2;

// =============================================================================
// ENVELOPE GENERATOR
// =============================================================================

enum EnvelopeStage {
  Idle = 0,
  Attack = 1,
  Decay = 2,
  Sustain = 3,
  Release = 4
}

class ADSREnvelope {
  private stage = EnvelopeStage.Idle;
  private value = 0;
  private attackTime = 0.01;
  private decayTime = 0.2;
  private sustainLevel = 0.8;
  private releaseTime = 0.3;
  private attackCurve = 0;
  private decayCurve = 0;
  private releaseCurve = 0;
  private sampleRate: number;
  private stageTime = 0;
  
  constructor(sampleRate: number) {
    this.sampleRate = sampleRate;
  }
  
  setParams(env: UnifiedEnvelope): void {
    this.attackTime = Math.max(0.001, env.attack);
    this.decayTime = Math.max(0.001, env.decay);
    this.sustainLevel = Math.max(0, Math.min(1, env.sustain));
    this.releaseTime = Math.max(0.001, env.release);
    this.attackCurve = env.attackCurve;
    this.decayCurve = env.decayCurve;
    this.releaseCurve = env.releaseCurve;
  }
  
  gate(on: boolean): void {
    if (on) {
      this.stage = EnvelopeStage.Attack;
      this.stageTime = 0;
    } else if (this.stage !== EnvelopeStage.Idle) {
      this.stage = EnvelopeStage.Release;
      this.stageTime = 0;
    }
  }
  
  process(): number {
    switch (this.stage) {
      case EnvelopeStage.Idle:
        return 0;
        
      case EnvelopeStage.Attack: {
        const t = this.stageTime / (this.attackTime * this.sampleRate);
        this.value = this.applyCurve(t, this.attackCurve);
        this.stageTime++;
        if (t >= 1) {
          this.stage = EnvelopeStage.Decay;
          this.stageTime = 0;
          this.value = 1;
        }
        return this.value;
      }
      
      case EnvelopeStage.Decay: {
        const t = this.stageTime / (this.decayTime * this.sampleRate);
        this.value = 1 - (1 - this.sustainLevel) * this.applyCurve(t, -this.decayCurve);
        this.stageTime++;
        if (t >= 1) {
          this.stage = EnvelopeStage.Sustain;
          this.value = this.sustainLevel;
        }
        return this.value;
      }
      
      case EnvelopeStage.Sustain:
        return this.sustainLevel;
        
      case EnvelopeStage.Release: {
        const startValue = this.value;
        const t = this.stageTime / (this.releaseTime * this.sampleRate);
        this.value = startValue * (1 - this.applyCurve(t, -this.releaseCurve));
        this.stageTime++;
        if (t >= 1) {
          this.stage = EnvelopeStage.Idle;
          this.value = 0;
        }
        return this.value;
      }
    }
    return 0;
  }
  
  private applyCurve(t: number, curve: number): number {
    t = Math.max(0, Math.min(1, t));
    if (Math.abs(curve) < 0.01) return t;
    return curve > 0
      ? Math.pow(t, 1 + curve * 3)
      : 1 - Math.pow(1 - t, 1 - curve * 3);
  }
  
  isActive(): boolean {
    return this.stage !== EnvelopeStage.Idle;
  }
  
  getValue(): number {
    return this.value;
  }
}

// =============================================================================
// LFO PROCESSOR
// =============================================================================

class LFOProcessor {
  private phase = 0;
  private rate = 1;
  private shape: 'sine' | 'triangle' | 'saw-up' | 'saw-down' | 'square' | 'pulse' | 'random' | 'sample-hold' | 'custom' = 'sine';
  private sampleRate: number;
  private randomValue = 0;
  private lastPhase = 0;
  
  constructor(sampleRate: number) {
    this.sampleRate = sampleRate;
  }
  
  setParams(lfo: UnifiedLFO): void {
    this.rate = lfo.rateHz;
    this.shape = lfo.shape;
  }
  
  trigger(): void {
    this.phase = 0;
    this.randomValue = Math.random() * 2 - 1;
  }
  
  process(): number {
    const phaseInc = this.rate / this.sampleRate;
    this.lastPhase = this.phase;
    this.phase = (this.phase + phaseInc) % 1;
    
    // Detect phase wrap for S&H
    if (this.phase < this.lastPhase) {
      this.randomValue = Math.random() * 2 - 1;
    }
    
    let value: number;
    switch (this.shape) {
      case 'sine':
        value = Math.sin(this.phase * TWO_PI);
        break;
      case 'triangle':
        value = this.phase < 0.5 
          ? 4 * this.phase - 1
          : 3 - 4 * this.phase;
        break;
      case 'saw-up':
        value = 2 * this.phase - 1;
        break;
      case 'saw-down':
        value = 1 - 2 * this.phase;
        break;
      case 'square':
      case 'pulse':
        value = this.phase < 0.5 ? 1 : -1;
        break;
      case 'random':
        value = this.randomValue + (Math.random() - 0.5) * 0.1;
        break;
      case 'sample-hold':
        value = this.randomValue;
        break;
      default:
        value = 0;
    }
    
    return value;
  }
}

// =============================================================================
// STATE VARIABLE FILTER
// =============================================================================

class SVFilter {
  private ic1eq = 0;
  private ic2eq = 0;
  private cutoff = 1000;
  private resonance = 0;
  private sampleRate: number;
  private mode: 'lowpass' | 'highpass' | 'bandpass' | 'notch' = 'lowpass';
  
  constructor(sampleRate: number) {
    this.sampleRate = sampleRate;
  }
  
  setParams(filter: UnifiedFilter): void {
    this.cutoff = Math.max(20, Math.min(20000, filter.cutoff));
    this.resonance = Math.max(0, Math.min(0.99, filter.resonance));
    // Map filter types to basic modes
    const filterType = filter.filterType;
    if (filterType.startsWith('lp')) this.mode = 'lowpass';
    else if (filterType.startsWith('hp')) this.mode = 'highpass';
    else if (filterType.startsWith('bp')) this.mode = 'bandpass';
    else if (filterType === 'notch') this.mode = 'notch';
    else this.mode = 'lowpass';
  }
  
  setCutoff(freq: number): void {
    this.cutoff = Math.max(20, Math.min(20000, freq));
  }
  
  process(input: number): number {
    const g = Math.tan(Math.PI * this.cutoff / this.sampleRate);
    const k = 2 - 2 * this.resonance;
    
    const a1 = 1 / (1 + g * (g + k));
    const a2 = g * a1;
    const a3 = g * a2;
    
    const v3 = input - this.ic2eq;
    const v1 = a1 * this.ic1eq + a2 * v3;
    const v2 = this.ic2eq + a2 * this.ic1eq + a3 * v3;
    
    this.ic1eq = 2 * v1 - this.ic1eq;
    this.ic2eq = 2 * v2 - this.ic2eq;
    
    switch (this.mode) {
      case 'lowpass':
        return v2;
      case 'highpass':
        return input - k * v1 - v2;
      case 'bandpass':
        return v1;
      case 'notch':
        return input - k * v1;
    }
  }
  
  reset(): void {
    this.ic1eq = 0;
    this.ic2eq = 0;
  }
}

// =============================================================================
// WAVETABLE OSCILLATOR
// =============================================================================

class WavetableOscillator {
  private wavetable: Float32Array[] | null = null;
  private frameCount = 0;
  private frameSize = 2048;
  private morphPosition = 0.5;
  private frequency = 440;
  private sampleRate: number;
  
  // Unison
  private unisonVoices = 1;
  private unisonDetune = 0.1; // in cents
  private unisonPhases: number[] = [0];
  
  constructor(sampleRate: number) {
    this.sampleRate = sampleRate;
  }
  
  setWavetable(frames: Float32Array[]): void {
    this.wavetable = frames;
    this.frameCount = frames.length;
    this.frameSize = frames[0]?.length ?? 2048;
  }
  
  setParams(osc: UnifiedOscillator): void {
    this.morphPosition = osc.wavetablePosition;
    this.unisonVoices = Math.max(1, Math.min(16, osc.unison.voices));
    this.unisonDetune = osc.unison.detune; // Already in cents
    
    // Initialize unison phases
    if (this.unisonPhases.length !== this.unisonVoices) {
      this.unisonPhases = new Array(this.unisonVoices).fill(0).map(() => Math.random());
    }
  }
  
  setFrequency(freq: number): void {
    this.frequency = freq;
  }
  
  setMorphPosition(pos: number): void {
    this.morphPosition = Math.max(0, Math.min(1, pos));
  }
  
  trigger(randomPhase: number): void {
    for (let i = 0; i < this.unisonPhases.length; i++) {
      this.unisonPhases[i] = randomPhase + (Math.random() - 0.5) * 0.1;
    }
  }
  
  process(): number {
    if (!this.wavetable || this.wavetable.length === 0) {
      return 0;
    }
    
    // Calculate frame indices for morphing
    const framePos = this.morphPosition * (this.frameCount - 1);
    const frame0 = Math.floor(framePos);
    const frame1 = Math.min(frame0 + 1, this.frameCount - 1);
    const frameMix = framePos - frame0;
    
    const wt0 = this.wavetable[frame0];
    const wt1 = this.wavetable[frame1];
    
    // Check for valid frames
    if (!wt0 || !wt1) {
      return 0;
    }
    
    let output = 0;
    const phaseInc = this.frequency / this.sampleRate;
    
    // Process unison voices
    for (let u = 0; u < this.unisonVoices; u++) {
      const currentPhase = this.unisonPhases[u] ?? 0;
      const detuneAmount = this.unisonVoices > 1
        ? (u / (this.unisonVoices - 1) - 0.5) * 2 * this.unisonDetune
        : 0;
      // Detune is in cents, so divide by 1200 (cents to octave ratio)
      const detunedPhaseInc = phaseInc * Math.pow(2, detuneAmount / 1200);
      
      const newPhase = (currentPhase + detunedPhaseInc) % 1;
      this.unisonPhases[u] = newPhase;
      
      // Linear interpolation within frame
      const samplePos = newPhase * this.frameSize;
      const s0 = Math.floor(samplePos);
      const s1 = (s0 + 1) % this.frameSize;
      const frac = samplePos - s0;
      
      // Interpolate between frames
      const val0 = (wt0[s0] ?? 0) * (1 - frac) + (wt0[s1] ?? 0) * frac;
      const val1 = (wt1[s0] ?? 0) * (1 - frac) + (wt1[s1] ?? 0) * frac;
      
      output += val0 * (1 - frameMix) + val1 * frameMix;
    }
    
    // Pan spread would go here for stereo
    return output / this.unisonVoices;
  }
}

// =============================================================================
// SYNTHESIZER VOICE
// =============================================================================

export class SynthVoice {
  private oscillators: WavetableOscillator[] = [];
  private filters: SVFilter[] = [];
  private ampEnvelope: ADSREnvelope;
  private filterEnvelope: ADSREnvelope;
  private modEnvelopes: ADSREnvelope[] = [];
  private lfos: LFOProcessor[] = [];
  
  private note = 60;
  private velocity = 1;
  private noteOnTime = 0;
  
  private preset: UnifiedPreset | null = null;
  private filterEnvAmount = 0;
  
  constructor(sampleRate: number) {
    // Create 3 oscillators
    for (let i = 0; i < 3; i++) {
      this.oscillators.push(new WavetableOscillator(sampleRate));
    }
    
    // Create 2 filters
    for (let i = 0; i < 2; i++) {
      this.filters.push(new SVFilter(sampleRate));
    }
    
    // Create envelopes
    this.ampEnvelope = new ADSREnvelope(sampleRate);
    this.filterEnvelope = new ADSREnvelope(sampleRate);
    
    // Create 4 additional modulation envelopes
    for (let i = 0; i < 4; i++) {
      this.modEnvelopes.push(new ADSREnvelope(sampleRate));
    }
    
    // Create 8 LFOs
    for (let i = 0; i < 8; i++) {
      this.lfos.push(new LFOProcessor(sampleRate));
    }
  }
  
  setPreset(preset: UnifiedPreset): void {
    this.preset = preset;
    
    // Configure oscillators
    for (let i = 0; i < Math.min(preset.oscillators.length, this.oscillators.length); i++) {
      const osc = preset.oscillators[i];
      const oscObj = this.oscillators[i];
      if (osc && oscObj) {
        oscObj.setParams(osc);
      }
    }
    
    // Configure filters
    for (let i = 0; i < Math.min(preset.filters.length, this.filters.length); i++) {
      const flt = preset.filters[i];
      const fltObj = this.filters[i];
      if (flt && fltObj) {
        fltObj.setParams(flt);
      }
    }
    
    // Configure envelopes
    const env0 = preset.envelopes[0];
    if (env0) {
      this.ampEnvelope.setParams(env0);
    }
    const env1 = preset.envelopes[1];
    if (env1) {
      this.filterEnvelope.setParams(env1);
    }
    for (let i = 2; i < preset.envelopes.length && i - 2 < this.modEnvelopes.length; i++) {
      const env = preset.envelopes[i];
      const modEnv = this.modEnvelopes[i - 2];
      if (env && modEnv) {
        modEnv.setParams(env);
      }
    }
    
    // Configure LFOs
    for (let i = 0; i < Math.min(preset.lfos.length, this.lfos.length); i++) {
      const lfo = preset.lfos[i];
      const lfoObj = this.lfos[i];
      if (lfo && lfoObj) {
        lfoObj.setParams(lfo);
      }
    }
    
    // Find filter envelope mod amount
    const filterMod = preset.modulations.find(m => 
      m.source === 'env_filter' && m.destination.includes('cutoff')
    );
    this.filterEnvAmount = filterMod?.amount ?? 0;
  }
  
  setWavetable(oscIndex: number, frames: Float32Array[]): void {
    const osc = this.oscillators[oscIndex];
    if (osc) {
      osc.setWavetable(frames);
    }
  }
  
  noteOn(note: number, velocity: number): void {
    this.note = note;
    this.velocity = velocity / 127;
    this.noteOnTime = Date.now();
    
    // Calculate frequency
    const freq = 440 * Math.pow(2, (note - 69) / 12);
    
    // Update oscillator frequencies with tuning
    if (this.preset) {
      for (let i = 0; i < this.oscillators.length && i < this.preset.oscillators.length; i++) {
        const osc = this.preset.oscillators[i];
        const oscObj = this.oscillators[i];
        if (osc && oscObj) {
          // Use semitone and cents from UnifiedOscillator
          const detunedFreq = freq * Math.pow(2, (osc.semitone + osc.cents / 100) / 12);
          oscObj.setFrequency(detunedFreq);
          
          // Trigger with random phase
          const randomPhase = osc.phaseRandom * Math.random();
          oscObj.trigger(randomPhase);
        }
      }
    } else {
      for (const osc of this.oscillators) {
        osc.setFrequency(freq);
        osc.trigger(Math.random());
      }
    }
    
    // Gate envelopes
    this.ampEnvelope.gate(true);
    this.filterEnvelope.gate(true);
    for (const env of this.modEnvelopes) {
      env.gate(true);
    }
    
    // Trigger LFOs
    for (const lfo of this.lfos) {
      lfo.trigger();
    }
    
    // Reset filters
    for (const flt of this.filters) {
      flt.reset();
    }
  }
  
  noteOff(): void {
    this.ampEnvelope.gate(false);
    this.filterEnvelope.gate(false);
    for (const env of this.modEnvelopes) {
      env.gate(false);
    }
  }
  
  process(): number {
    if (!this.ampEnvelope.isActive()) {
      return 0;
    }
    
    // Get modulation values
    const ampEnv = this.ampEnvelope.process();
    const filterEnv = this.filterEnvelope.process();
    
    // Process LFOs (values available for future modulation use)
    this.lfos.forEach(lfo => lfo.process());
    
    // Mix oscillators
    let oscMix = 0;
    if (this.preset) {
      for (let i = 0; i < this.oscillators.length && i < this.preset.oscillators.length; i++) {
        const oscPreset = this.preset.oscillators[i];
        const oscObj = this.oscillators[i];
        if (oscPreset?.enabled && oscObj) {
          oscMix += oscObj.process() * oscPreset.level;
        }
      }
    } else {
      const osc0 = this.oscillators[0];
      if (osc0) {
        oscMix = osc0.process();
      }
    }
    
    // Apply filter with envelope modulation
    let filtered = oscMix;
    const filter0 = this.preset?.filters[0];
    const flt0 = this.filters[0];
    if (filter0 && flt0) {
      const baseFreq = filter0.cutoff;
      const modAmount = this.filterEnvAmount * filterEnv * 10000;
      flt0.setCutoff(baseFreq + modAmount);
      filtered = flt0.process(oscMix);
    }
    
    // Apply amp envelope and velocity
    return filtered * ampEnv * this.velocity;
  }
  
  isActive(): boolean {
    return this.ampEnvelope.isActive();
  }
  
  getNote(): number {
    return this.note;
  }
  
  getAmpLevel(): number {
    return this.ampEnvelope.getValue();
  }
  
  getNoteOnTime(): number {
    return this.noteOnTime;
  }
}

// =============================================================================
// VOICE MANAGER
// =============================================================================

type VoiceStealMode = 'oldest' | 'quietest' | 'lowest' | 'highest';

class VoiceManager {
  private voices: SynthVoice[] = [];
  private activeVoices: SynthVoice[] = [];
  private stealMode: VoiceStealMode = 'oldest';
  
  constructor(sampleRate: number, maxVoices = 32) {
    // Pre-allocate voices
    for (let i = 0; i < maxVoices; i++) {
      this.voices.push(new SynthVoice(sampleRate));
    }
  }
  
  setPreset(preset: UnifiedPreset): void {
    for (const voice of this.voices) {
      voice.setPreset(preset);
    }
  }
  
  setWavetable(oscIndex: number, frames: Float32Array[]): void {
    for (const voice of this.voices) {
      voice.setWavetable(oscIndex, frames);
    }
  }
  
  noteOn(note: number, velocity: number): SynthVoice {
    // Find free voice
    let voice = this.voices.find(v => !v.isActive());
    
    // If no free voice, steal one
    if (!voice) {
      voice = this.stealVoice();
    }
    
    voice.noteOn(note, velocity);
    
    if (!this.activeVoices.includes(voice)) {
      this.activeVoices.push(voice);
    }
    
    return voice;
  }
  
  noteOff(note: number): void {
    for (const voice of this.activeVoices) {
      if (voice.getNote() === note && voice.isActive()) {
        voice.noteOff();
        break;
      }
    }
  }
  
  allNotesOff(): void {
    for (const voice of this.activeVoices) {
      voice.noteOff();
    }
  }
  
  private stealVoice(): SynthVoice {
    switch (this.stealMode) {
      case 'oldest':
        return this.activeVoices.reduce((oldest, v) => 
          v.getNoteOnTime() < oldest.getNoteOnTime() ? v : oldest
        );
      case 'quietest':
        return this.activeVoices.reduce((quietest, v) =>
          v.getAmpLevel() < quietest.getAmpLevel() ? v : quietest
        );
      case 'lowest':
        return this.activeVoices.reduce((lowest, v) =>
          v.getNote() < lowest.getNote() ? v : lowest
        );
      case 'highest':
        return this.activeVoices.reduce((highest, v) =>
          v.getNote() > highest.getNote() ? v : highest
        );
    }
  }
  
  process(): number {
    let output = 0;
    
    // Clean up inactive voices
    this.activeVoices = this.activeVoices.filter(v => v.isActive());
    
    // Process active voices
    for (const voice of this.activeVoices) {
      output += voice.process();
    }
    
    return output;
  }
  
  getActiveVoiceCount(): number {
    return this.activeVoices.filter(v => v.isActive()).length;
  }
}

// =============================================================================
// MAIN WAVETABLE INSTRUMENT
// =============================================================================

export class WavetableInstrument {
  private voiceManager: VoiceManager;
  private currentPreset: UnifiedPreset | null = null;
  private database: InstrumentDatabase | null = null;
  private sampleRate: number;
  private masterVolume = 0.7;
  
  constructor(sampleRate = 44100, maxVoices = 32) {
    this.sampleRate = sampleRate;
    this.voiceManager = new VoiceManager(sampleRate, maxVoices);
  }
  
  // ===========================================================================
  // DATABASE CONNECTION
  // ===========================================================================
  
  connectDatabase(db?: InstrumentDatabase): void {
    this.database = db ?? getInstrumentDatabase();
  }
  
  disconnectDatabase(): void {
    this.database = null;
  }
  
  getDatabase(): InstrumentDatabase | null {
    return this.database;
  }
  
  // ===========================================================================
  // PRESET MANAGEMENT
  // ===========================================================================
  
  loadPreset(preset: UnifiedPreset): void {
    this.currentPreset = preset;
    this.voiceManager.setPreset(preset);
    this.masterVolume = preset.masterVolume;
  }
  
  loadPresetById(presetId: string): boolean {
    if (!this.database) {
      console.warn('No database connected');
      return false;
    }
    
    const preset = this.database.loadPresetAsUnified(presetId);
    if (!preset) {
      console.warn(`Preset not found: ${presetId}`);
      return false;
    }
    
    this.loadPreset(preset);
    
    // Load wavetables for each oscillator
    const wavetableRefs = this.database.getPresetWavetableNames(presetId);
    for (const ref of wavetableRefs) {
      this.loadWavetableByName(ref.name, ref.oscillatorIndex);
    }
    
    return true;
  }
  
  loadWavetableByName(name: string, oscIndex = 0): boolean {
    if (!this.database) {
      console.warn('No database connected');
      return false;
    }
    
    const wt = this.database.getWavetableByName(name);
    if (!wt) {
      console.warn(`Wavetable not found: ${name}`);
      return false;
    }
    
    const frames = this.database.getWavetableData(wt.id);
    if (!frames) {
      console.warn(`Wavetable data not found: ${name}`);
      return false;
    }
    
    this.voiceManager.setWavetable(oscIndex, frames);
    return true;
  }
  
  loadWavetableById(id: string, oscIndex = 0): boolean {
    if (!this.database) {
      console.warn('No database connected');
      return false;
    }
    
    const frames = this.database.getWavetableData(id);
    if (!frames) {
      console.warn(`Wavetable not found: ${id}`);
      return false;
    }
    
    this.voiceManager.setWavetable(oscIndex, frames);
    return true;
  }
  
  setWavetable(oscIndex: number, frames: Float32Array[]): void {
    this.voiceManager.setWavetable(oscIndex, frames);
  }
  
  getCurrentPreset(): UnifiedPreset | null {
    return this.currentPreset;
  }
  
  // ===========================================================================
  // MIDI INPUT
  // ===========================================================================
  
  noteOn(note: number, velocity = 100): void {
    this.voiceManager.noteOn(note, velocity);
  }
  
  noteOff(note: number): void {
    this.voiceManager.noteOff(note);
  }
  
  allNotesOff(): void {
    this.voiceManager.allNotesOff();
  }
  
  // ===========================================================================
  // AUDIO PROCESSING
  // ===========================================================================
  
  process(): number {
    return this.voiceManager.process() * this.masterVolume;
  }
  
  processBlock(output: Float32Array, offset = 0, length?: number): void {
    const len = length ?? (output.length - offset);
    for (let i = 0; i < len; i++) {
      output[offset + i] = this.process();
    }
  }
  
  processStereoBlock(
    outputL: Float32Array,
    outputR: Float32Array,
    offset = 0,
    length?: number
  ): void {
    const len = length ?? Math.min(outputL.length, outputR.length) - offset;
    for (let i = 0; i < len; i++) {
      const sample = this.process();
      outputL[offset + i] = sample;
      outputR[offset + i] = sample;
    }
  }
  
  // ===========================================================================
  // PARAMETERS
  // ===========================================================================
  
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }
  
  getMasterVolume(): number {
    return this.masterVolume;
  }
  
  getActiveVoiceCount(): number {
    return this.voiceManager.getActiveVoiceCount();
  }
  
  getSampleRate(): number {
    return this.sampleRate;
  }
  
  // ===========================================================================
  // PRESET BROWSING (if database connected)
  // ===========================================================================
  
  getCategories(): { id: InstrumentCategory; name: string; count: number }[] {
    if (!this.database) return [];
    return this.database.getCategories().map(c => ({
      id: c.id,
      name: c.name,
      count: c.presetCount ?? 0
    }));
  }
  
  getPresetsByCategory(category: InstrumentCategory): { id: string; name: string }[] {
    if (!this.database) return [];
    return this.database.getPresetsByCategory(category).map(p => ({
      id: p.id,
      name: p.name
    }));
  }
  
  searchPresets(query: string): { id: string; name: string; category: string }[] {
    if (!this.database) return [];
    return this.database.searchPresets(query).map(p => ({
      id: p.id,
      name: p.name,
      category: p.categoryId
    }));
  }
  
  getWavetables(): { id: string; name: string; category: string }[] {
    if (!this.database) return [];
    return this.database.getAllWavetables().map(wt => ({
      id: wt.id,
      name: wt.name,
      category: wt.soundCategory
    }));
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export { WavetableOscillator, SVFilter, ADSREnvelope, LFOProcessor, VoiceManager };
