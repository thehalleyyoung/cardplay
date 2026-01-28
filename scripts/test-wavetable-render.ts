/**
 * Test script: Render MIDI notes through wavetable synth to WAV
 * 
 * This script:
 * 1. Opens the synth-assets.db database
 * 2. Lists available presets and wavetables
 * 3. Loads a preset into WavetableInstrument
 * 4. Plays a MIDI sequence
 * 5. Renders to WAV file
 * 
 * Run with: npx tsx scripts/test-wavetable-render.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { SynthAssetDatabase, decodeWavetableData, parsePresetRecord } from '../src/audio/synth-asset-db';
import { WavetableInstrument } from '../src/audio/wavetable-synth';
import { UnifiedPreset, UnifiedOscillator, UnifiedFilter, UnifiedEnvelope, UnifiedLFO, createInitPreset } from '../src/audio/unified-preset';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SAMPLE_RATE = 44100;
const BIT_DEPTH = 16;
const CHANNELS = 2; // Stereo
const OUTPUT_DIR = './test-output';

// ============================================================================
// WAV FILE WRITER
// ============================================================================

function writeWavFile(
  filePath: string,
  leftChannel: Float32Array,
  rightChannel: Float32Array,
  sampleRate: number
): void {
  const numSamples = leftChannel.length;
  const numChannels = 2;
  const bytesPerSample = 2; // 16-bit
  const dataSize = numSamples * numChannels * bytesPerSample;
  const fileSize = 44 + dataSize;

  const buffer = Buffer.alloc(fileSize);
  let offset = 0;

  // RIFF header
  buffer.write('RIFF', offset); offset += 4;
  buffer.writeUInt32LE(fileSize - 8, offset); offset += 4;
  buffer.write('WAVE', offset); offset += 4;

  // fmt chunk
  buffer.write('fmt ', offset); offset += 4;
  buffer.writeUInt32LE(16, offset); offset += 4; // chunk size
  buffer.writeUInt16LE(1, offset); offset += 2; // audio format (PCM)
  buffer.writeUInt16LE(numChannels, offset); offset += 2;
  buffer.writeUInt32LE(sampleRate, offset); offset += 4;
  buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, offset); offset += 4; // byte rate
  buffer.writeUInt16LE(numChannels * bytesPerSample, offset); offset += 2; // block align
  buffer.writeUInt16LE(16, offset); offset += 2; // bits per sample

  // data chunk
  buffer.write('data', offset); offset += 4;
  buffer.writeUInt32LE(dataSize, offset); offset += 4;

  // Write interleaved samples
  for (let i = 0; i < numSamples; i++) {
    // Clamp and convert to 16-bit
    const sampleL = Math.max(-1, Math.min(1, leftChannel[i]));
    const sampleR = Math.max(-1, Math.min(1, rightChannel[i]));
    
    buffer.writeInt16LE(Math.floor(sampleL * 32767), offset); offset += 2;
    buffer.writeInt16LE(Math.floor(sampleR * 32767), offset); offset += 2;
  }

  fs.writeFileSync(filePath, buffer);
  console.log(`  Written: ${filePath} (${(fileSize / 1024).toFixed(1)} KB)`);
}

// ============================================================================
// MIDI NOTE SEQUENCE
// ============================================================================

interface MidiNote {
  note: number;
  velocity: number;
  startTime: number; // in seconds
  duration: number;  // in seconds
}

function createTestSequence(): MidiNote[] {
  // Simple chord progression: C major -> F major -> G major -> C major
  const bpm = 120;
  const beatDuration = 60 / bpm;
  
  const notes: MidiNote[] = [];
  
  // C major chord (C3, E3, G3)
  notes.push({ note: 48, velocity: 100, startTime: 0, duration: beatDuration * 2 });
  notes.push({ note: 52, velocity: 90, startTime: 0, duration: beatDuration * 2 });
  notes.push({ note: 55, velocity: 85, startTime: 0, duration: beatDuration * 2 });
  
  // F major chord (F3, A3, C4)
  notes.push({ note: 53, velocity: 100, startTime: beatDuration * 2, duration: beatDuration * 2 });
  notes.push({ note: 57, velocity: 90, startTime: beatDuration * 2, duration: beatDuration * 2 });
  notes.push({ note: 60, velocity: 85, startTime: beatDuration * 2, duration: beatDuration * 2 });
  
  // G major chord (G3, B3, D4)
  notes.push({ note: 55, velocity: 100, startTime: beatDuration * 4, duration: beatDuration * 2 });
  notes.push({ note: 59, velocity: 90, startTime: beatDuration * 4, duration: beatDuration * 2 });
  notes.push({ note: 62, velocity: 85, startTime: beatDuration * 4, duration: beatDuration * 2 });
  
  // C major chord again (C4, E4, G4)
  notes.push({ note: 60, velocity: 100, startTime: beatDuration * 6, duration: beatDuration * 3 });
  notes.push({ note: 64, velocity: 90, startTime: beatDuration * 6, duration: beatDuration * 3 });
  notes.push({ note: 67, velocity: 85, startTime: beatDuration * 6, duration: beatDuration * 3 });
  
  return notes;
}

function createArpeggioSequence(): MidiNote[] {
  // Ascending arpeggio pattern
  const bpm = 140;
  const noteLength = 60 / bpm / 4; // 16th notes
  
  const notes: MidiNote[] = [];
  const pattern = [48, 52, 55, 60, 64, 67, 72, 67, 64, 60, 55, 52];
  
  for (let i = 0; i < pattern.length * 2; i++) {
    const noteNum = pattern[i % pattern.length];
    notes.push({
      note: noteNum,
      velocity: 80 + Math.floor(Math.random() * 40),
      startTime: i * noteLength,
      duration: noteLength * 1.5,
    });
  }
  
  return notes;
}

// ============================================================================
// RENDER FUNCTION
// ============================================================================

function renderSequence(
  synth: WavetableInstrument,
  sequence: MidiNote[],
  durationSeconds: number
): { left: Float32Array; right: Float32Array } {
  const totalSamples = Math.ceil(durationSeconds * SAMPLE_RATE);
  const leftChannel = new Float32Array(totalSamples);
  const rightChannel = new Float32Array(totalSamples);
  
  // Sort events by time
  const noteOns = sequence.map(n => ({ time: n.startTime, type: 'on' as const, ...n }));
  const noteOffs = sequence.map(n => ({ time: n.startTime + n.duration, type: 'off' as const, ...n }));
  const events = [...noteOns, ...noteOffs].sort((a, b) => a.time - b.time);
  
  let eventIndex = 0;
  
  // Process sample by sample
  for (let i = 0; i < totalSamples; i++) {
    const currentTime = i / SAMPLE_RATE;
    
    // Process any events at this time
    while (eventIndex < events.length && events[eventIndex].time <= currentTime) {
      const event = events[eventIndex];
      if (event.type === 'on') {
        synth.noteOn(event.note, event.velocity);
      } else {
        synth.noteOff(event.note);
      }
      eventIndex++;
    }
    
    // Get audio sample
    const sample = synth.process();
    leftChannel[i] = sample;
    rightChannel[i] = sample;
  }
  
  return { left: leftChannel, right: rightChannel };
}

// ============================================================================
// PRESET CONVERSION (from ParsedPreset to UnifiedPreset)
// ============================================================================

function convertToUnifiedPreset(
  parsedPreset: ReturnType<typeof parsePresetRecord>
): UnifiedPreset {
  const preset = createInitPreset();
  
  preset.id = parsedPreset.id;
  preset.name = parsedPreset.name;
  preset.author = parsedPreset.author ?? 'Unknown';
  preset.masterVolume = parsedPreset.masterVolume ?? 0.7;
  
  // Convert oscillators
  preset.oscillators = parsedPreset.oscillators.map((osc, i): UnifiedOscillator => ({
    enabled: true,
    oscType: 'wavetable',
    wavetableId: osc.wavetable_name ?? '',
    wavetableName: osc.wavetable_name ?? '',
    wavetablePosition: osc.wavetable_position ?? 0.5,
    semitone: osc.tune_semitones ?? 0,
    cents: osc.tune_cents ?? 0,
    level: osc.level ?? 0.8,
    pan: osc.pan ?? 0,
    phaseRandom: osc.phase_randomize ?? 0,
    unison: {
      voices: osc.unison_voices ?? 1,
      detune: osc.unison_detune ?? 0,
      blend: osc.unison_blend ?? 0.5,
      stereoSpread: 0.5,
    },
  }));
  
  // Ensure at least one oscillator
  while (preset.oscillators.length < 1) {
    preset.oscillators.push({
      enabled: true,
      oscType: 'wavetable',
      wavetableId: '',
      wavetableName: '',
      wavetablePosition: 0.5,
      semitone: 0,
      cents: 0,
      level: 0.8,
      pan: 0,
      phaseRandom: 0,
      unison: { voices: 1, detune: 0, blend: 0.5, stereoSpread: 0.5 },
    });
  }
  
  // Convert filters
  preset.filters = parsedPreset.filters.map((flt): UnifiedFilter => ({
    enabled: true,
    filterType: flt.filter_type_name?.toLowerCase().replace(/\s+/g, '-') as UnifiedFilter['filterType'] ?? 'lp-12',
    cutoff: flt.cutoff ?? 1000,
    resonance: flt.resonance ?? 0,
    drive: flt.drive ?? 0,
    mix: flt.mix ?? 1,
    keytrack: flt.keytrack ?? 0,
    envAmount: flt.env_depth ?? 0,
  }));
  
  // Ensure at least one filter
  while (preset.filters.length < 1) {
    preset.filters.push({
      enabled: true,
      filterType: 'lp-12',
      cutoff: 8000,
      resonance: 0,
      drive: 0,
      mix: 1,
      keytrack: 0,
      envAmount: 0,
    });
  }
  
  // Convert envelopes
  preset.envelopes = parsedPreset.envelopes.map((env): UnifiedEnvelope => ({
    attack: env.attack ?? 0.01,
    decay: env.decay ?? 0.2,
    sustain: env.sustain ?? 0.8,
    release: env.release ?? 0.3,
    attackCurve: env.attack_curve ?? 0,
    decayCurve: env.decay_curve ?? 0,
    releaseCurve: env.release_curve ?? 0,
  }));
  
  // Ensure amp and filter envelopes exist
  while (preset.envelopes.length < 2) {
    preset.envelopes.push({
      attack: 0.01,
      decay: 0.2,
      sustain: 0.8,
      release: 0.3,
      attackCurve: 0,
      decayCurve: 0,
      releaseCurve: 0,
    });
  }
  
  // Convert LFOs
  preset.lfos = parsedPreset.lfos.map((lfo): UnifiedLFO => ({
    shape: lfo.waveform_name?.toLowerCase() as UnifiedLFO['shape'] ?? 'sine',
    rateHz: lfo.rate ?? 1,
    tempoSync: lfo.sync ?? false,
    tempoSyncRate: lfo.sync_rate ?? '1/4',
    amount: lfo.depth ?? 0.5,
    phase: lfo.phase ?? 0,
    delay: lfo.delay ?? 0,
    fadeIn: lfo.fade_in ?? 0,
  }));
  
  // Convert modulations
  preset.modulations = parsedPreset.modulations.map(mod => ({
    source: mod.source,
    destination: mod.destination,
    amount: mod.amount,
    bipolar: mod.bipolar,
  }));
  
  return preset;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('='.repeat(60));
  console.log('Wavetable Synthesizer Render Test');
  console.log('='.repeat(60));
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Check for database
  const dbPath = './synth-assets.db';
  if (!fs.existsSync(dbPath)) {
    console.error(`\nDatabase not found: ${dbPath}`);
    console.log('Please run the synth asset downloader first.');
    console.log('\nCreating test with generated wavetable instead...\n');
    
    // Create synth with generated wavetable
    await renderWithGeneratedWavetable();
    return;
  }
  
  // Open database
  console.log(`\nOpening database: ${dbPath}`);
  const db = new SynthAssetDatabase(dbPath);
  
  try {
    // Get stats
    const stats = db.getStats();
    console.log(`\nDatabase Statistics:`);
    console.log(`  Wavetables: ${stats.totalWavetables} (Surge: ${stats.surgeWavetables}, Vital: ${stats.vitalWavetables})`);
    console.log(`  Presets: ${stats.totalPresets} (Surge: ${stats.surgePresets}, Vital: ${stats.vitalPresets})`);
    console.log(`  Wavetable Categories: ${stats.wavetableCategories}`);
    console.log(`  Preset Categories: ${stats.presetCategories}`);
    
    // List some wavetables
    const wavetables = db.getAllWavetables();
    console.log(`\nFirst 10 wavetables:`);
    for (let i = 0; i < Math.min(10, wavetables.length); i++) {
      const wt = wavetables[i];
      console.log(`  ${i + 1}. ${wt.name} (${wt.category}, ${wt.frame_count} frames)`);
    }
    
    // List some presets
    const presets = db.getAllPresets();
    console.log(`\nFirst 10 presets:`);
    for (let i = 0; i < Math.min(10, presets.length); i++) {
      const p = presets[i];
      console.log(`  ${i + 1}. ${p.name} (${p.category})`);
    }
    
    // Render tests with different wavetables
    console.log(`\n${'='.repeat(60)}`);
    console.log('Rendering Test Audio Files');
    console.log('='.repeat(60));
    
    // Test 1: First available preset with its wavetable
    if (presets.length > 0 && wavetables.length > 0) {
      await renderPresetWithWavetable(db, presets[0], wavetables[0], 'test1_first_preset');
    }
    
    // Test 2: Search for a pad preset
    const padPresets = db.searchPresets('pad');
    if (padPresets.length > 0 && wavetables.length > 0) {
      console.log(`\nFound ${padPresets.length} pad presets`);
      await renderPresetWithWavetable(db, padPresets[0], wavetables[0], 'test2_pad');
    }
    
    // Test 3: Search for bass preset
    const bassPresets = db.searchPresets('bass');
    if (bassPresets.length > 0 && wavetables.length > 0) {
      console.log(`\nFound ${bassPresets.length} bass presets`);
      await renderPresetWithWavetable(db, bassPresets[0], wavetables[0], 'test3_bass');
    }
    
    // Test 4: Use a specific wavetable category
    const digitalWts = db.searchWavetables('digital');
    if (digitalWts.length > 0 && presets.length > 0) {
      console.log(`\nFound ${digitalWts.length} digital wavetables`);
      await renderPresetWithWavetable(db, presets[0], digitalWts[0], 'test4_digital_wt');
    }
    
    // Test 5: Arpeggio sequence
    console.log('\n\nRendering arpeggio sequence...');
    await renderArpeggio(db, wavetables, presets);
    
  } finally {
    db.close();
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('All renders complete!');
  console.log(`Output files in: ${path.resolve(OUTPUT_DIR)}`);
  console.log('='.repeat(60));
}

async function renderPresetWithWavetable(
  db: SynthAssetDatabase,
  presetRecord: ReturnType<typeof db.getPresetById>,
  wavetableRecord: ReturnType<typeof db.getWavetableById>,
  outputName: string
): Promise<void> {
  if (!presetRecord || !wavetableRecord) return;
  
  console.log(`\nRendering: ${outputName}`);
  console.log(`  Preset: ${presetRecord.name}`);
  console.log(`  Wavetable: ${wavetableRecord.name}`);
  
  // Create synth
  const synth = new WavetableInstrument(SAMPLE_RATE);
  
  // Parse and convert preset
  const parsedPreset = parsePresetRecord(presetRecord);
  const unifiedPreset = convertToUnifiedPreset(parsedPreset);
  synth.loadPreset(unifiedPreset);
  
  // Load wavetable
  const wtData = db.getWavetableData(wavetableRecord.id);
  if (wtData) {
    // Convert flat data to frames
    const frames: Float32Array[] = [];
    const frameSize = wavetableRecord.frame_size;
    const frameCount = wavetableRecord.frame_count;
    
    for (let i = 0; i < frameCount; i++) {
      const start = i * frameSize;
      frames.push(wtData.slice(start, start + frameSize));
    }
    
    synth.setWavetable(0, frames);
    console.log(`  Loaded ${frameCount} frames (${frameSize} samples each)`);
  }
  
  // Render
  const sequence = createTestSequence();
  const durationSeconds = 5;
  const { left, right } = renderSequence(synth, sequence, durationSeconds);
  
  // Normalize output
  let maxAmp = 0;
  for (let i = 0; i < left.length; i++) {
    maxAmp = Math.max(maxAmp, Math.abs(left[i]), Math.abs(right[i]));
  }
  if (maxAmp > 0) {
    const normalizeGain = 0.9 / maxAmp;
    for (let i = 0; i < left.length; i++) {
      left[i] *= normalizeGain;
      right[i] *= normalizeGain;
    }
    console.log(`  Peak amplitude: ${maxAmp.toFixed(4)}, normalized to 0.9`);
  }
  
  // Write file
  const outputPath = path.join(OUTPUT_DIR, `${outputName}.wav`);
  writeWavFile(outputPath, left, right, SAMPLE_RATE);
}

async function renderArpeggio(
  db: SynthAssetDatabase,
  wavetables: ReturnType<typeof db.getAllWavetables>,
  presets: ReturnType<typeof db.getAllPresets>
): Promise<void> {
  if (wavetables.length === 0 || presets.length === 0) return;
  
  // Pick a preset and wavetable
  const leadPresets = db.searchPresets('lead');
  const presetRecord = leadPresets.length > 0 ? leadPresets[0] : presets[0];
  const wavetableRecord = wavetables[Math.floor(wavetables.length / 2)]; // Pick middle one
  
  console.log(`  Preset: ${presetRecord.name}`);
  console.log(`  Wavetable: ${wavetableRecord.name}`);
  
  // Create synth
  const synth = new WavetableInstrument(SAMPLE_RATE);
  
  // Parse and convert preset
  const parsedPreset = parsePresetRecord(presetRecord);
  const unifiedPreset = convertToUnifiedPreset(parsedPreset);
  
  // Modify for arpeggio (shorter release)
  if (unifiedPreset.envelopes[0]) {
    unifiedPreset.envelopes[0].attack = 0.005;
    unifiedPreset.envelopes[0].decay = 0.1;
    unifiedPreset.envelopes[0].sustain = 0.6;
    unifiedPreset.envelopes[0].release = 0.15;
  }
  
  synth.loadPreset(unifiedPreset);
  
  // Load wavetable
  const wtData = db.getWavetableData(wavetableRecord.id);
  if (wtData) {
    const frames: Float32Array[] = [];
    const frameSize = wavetableRecord.frame_size;
    const frameCount = wavetableRecord.frame_count;
    
    for (let i = 0; i < frameCount; i++) {
      const start = i * frameSize;
      frames.push(wtData.slice(start, start + frameSize));
    }
    
    synth.setWavetable(0, frames);
  }
  
  // Render arpeggio
  const sequence = createArpeggioSequence();
  const durationSeconds = 6;
  const { left, right } = renderSequence(synth, sequence, durationSeconds);
  
  // Normalize
  let maxAmp = 0;
  for (let i = 0; i < left.length; i++) {
    maxAmp = Math.max(maxAmp, Math.abs(left[i]), Math.abs(right[i]));
  }
  if (maxAmp > 0) {
    const normalizeGain = 0.9 / maxAmp;
    for (let i = 0; i < left.length; i++) {
      left[i] *= normalizeGain;
      right[i] *= normalizeGain;
    }
  }
  
  // Write file
  const outputPath = path.join(OUTPUT_DIR, 'test5_arpeggio.wav');
  writeWavFile(outputPath, left, right, SAMPLE_RATE);
}

async function renderWithGeneratedWavetable(): Promise<void> {
  console.log('Creating synth with generated wavetable...');
  
  const synth = new WavetableInstrument(SAMPLE_RATE);
  
  // Create a simple preset
  const preset = createInitPreset();
  preset.name = 'Generated Test';
  preset.oscillators[0] = {
    enabled: true,
    oscType: 'wavetable',
    wavetableId: 'generated',
    wavetableName: 'Generated Saw-Square Morph',
    wavetablePosition: 0.5,
    semitone: 0,
    cents: 0,
    level: 0.8,
    pan: 0,
    phaseRandom: 0.1,
    unison: { voices: 3, detune: 15, blend: 0.5, stereoSpread: 0.7 },
  };
  preset.filters[0] = {
    enabled: true,
    filterType: 'lp-12',
    cutoff: 2000,
    resonance: 0.3,
    drive: 0,
    mix: 1,
    keytrack: 0.5,
    envAmount: 0.5,
  };
  preset.envelopes[0] = { // Amp
    attack: 0.01,
    decay: 0.3,
    sustain: 0.7,
    release: 0.5,
    attackCurve: 0,
    decayCurve: 0,
    releaseCurve: 0,
  };
  preset.envelopes[1] = { // Filter
    attack: 0.05,
    decay: 0.4,
    sustain: 0.3,
    release: 0.3,
    attackCurve: 0,
    decayCurve: 0,
    releaseCurve: 0,
  };
  
  synth.loadPreset(preset);
  
  // Generate a morphing wavetable (saw to square)
  const frameCount = 64;
  const frameSize = 2048;
  const frames: Float32Array[] = [];
  
  for (let f = 0; f < frameCount; f++) {
    const frame = new Float32Array(frameSize);
    const morphAmount = f / (frameCount - 1);
    
    for (let s = 0; s < frameSize; s++) {
      const phase = s / frameSize;
      
      // Generate saw wave
      const saw = 2 * phase - 1;
      
      // Generate square wave
      const square = phase < 0.5 ? 1 : -1;
      
      // Morph between them
      frame[s] = saw * (1 - morphAmount) + square * morphAmount;
    }
    
    frames.push(frame);
  }
  
  synth.setWavetable(0, frames);
  console.log(`Generated ${frameCount} frames (${frameSize} samples each)`);
  
  // Ensure output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Render chord sequence
  console.log('\nRendering chord sequence...');
  const sequence = createTestSequence();
  const durationSeconds = 5;
  const { left, right } = renderSequence(synth, sequence, durationSeconds);
  
  // Normalize
  let maxAmp = 0;
  for (let i = 0; i < left.length; i++) {
    maxAmp = Math.max(maxAmp, Math.abs(left[i]), Math.abs(right[i]));
  }
  if (maxAmp > 0) {
    const normalizeGain = 0.9 / maxAmp;
    for (let i = 0; i < left.length; i++) {
      left[i] *= normalizeGain;
      right[i] *= normalizeGain;
    }
    console.log(`Peak amplitude: ${maxAmp.toFixed(4)}, normalized to 0.9`);
  }
  
  // Write WAV
  const outputPath = path.join(OUTPUT_DIR, 'generated_wavetable_test.wav');
  writeWavFile(outputPath, left, right, SAMPLE_RATE);
  
  // Also render arpeggio
  console.log('\nRendering arpeggio...');
  
  // Modify envelope for arpeggio
  preset.envelopes[0].attack = 0.005;
  preset.envelopes[0].decay = 0.1;
  preset.envelopes[0].sustain = 0.5;
  preset.envelopes[0].release = 0.15;
  synth.loadPreset(preset);
  synth.setWavetable(0, frames);
  
  const arpSequence = createArpeggioSequence();
  const { left: arpL, right: arpR } = renderSequence(synth, arpSequence, 6);
  
  // Normalize
  maxAmp = 0;
  for (let i = 0; i < arpL.length; i++) {
    maxAmp = Math.max(maxAmp, Math.abs(arpL[i]), Math.abs(arpR[i]));
  }
  if (maxAmp > 0) {
    const normalizeGain = 0.9 / maxAmp;
    for (let i = 0; i < arpL.length; i++) {
      arpL[i] *= normalizeGain;
      arpR[i] *= normalizeGain;
    }
  }
  
  const arpOutputPath = path.join(OUTPUT_DIR, 'generated_wavetable_arpeggio.wav');
  writeWavFile(arpOutputPath, arpL, arpR, SAMPLE_RATE);
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('Render complete!');
  console.log(`Output files in: ${path.resolve(OUTPUT_DIR)}`);
  console.log('='.repeat(60));
}

// Run
main().catch(console.error);
