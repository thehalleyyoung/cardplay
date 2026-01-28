/**
 * LeadSynth Card Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MAX_OSCILLATORS,
  MAX_POLYPHONY,
  SAMPLE_RATE,
  PITCH_BEND_RANGES,
  DEFAULT_LEAD_OSCILLATOR,
  DEFAULT_LEAD_ENVELOPE,
  DEFAULT_LEAD_FILTER,
  DEFAULT_LEAD_LFO,
  DEFAULT_LEAD_EFFECTS,
  LEAD_SYNTH_PRESETS,
  createLeadSynthState,
  createLeadVoice,
  noteToFrequency,
  processLeadSynthInput,
  createLeadSynthCard,
  LeadSynthState,
  LeadCategory,
} from './lead-synth';

// =============================================================================
// CONSTANTS TESTS
// =============================================================================

describe('LeadSynth Constants', () => {
  it('has correct oscillator limit', () => {
    expect(MAX_OSCILLATORS).toBe(3);
  });

  it('has correct polyphony limit', () => {
    expect(MAX_POLYPHONY).toBe(8);
  });

  it('has correct sample rate', () => {
    expect(SAMPLE_RATE).toBe(44100);
  });

  it('has valid pitch bend ranges', () => {
    expect(PITCH_BEND_RANGES).toContain(2);
    expect(PITCH_BEND_RANGES).toContain(12);
    expect(PITCH_BEND_RANGES).toContain(24);
  });
});

// =============================================================================
// DEFAULT VALUES TESTS
// =============================================================================

describe('Default Values', () => {
  describe('DEFAULT_LEAD_OSCILLATOR', () => {
    it('is enabled', () => {
      expect(DEFAULT_LEAD_OSCILLATOR.enabled).toBe(true);
    });

    it('has saw waveform', () => {
      expect(DEFAULT_LEAD_OSCILLATOR.waveform).toBe('saw');
    });

    it('has no coarse tuning', () => {
      expect(DEFAULT_LEAD_OSCILLATOR.coarse).toBe(0);
    });

    it('has full key tracking', () => {
      expect(DEFAULT_LEAD_OSCILLATOR.keyTracking).toBe(1);
    });
  });

  describe('DEFAULT_LEAD_ENVELOPE', () => {
    it('has fast attack for leads', () => {
      expect(DEFAULT_LEAD_ENVELOPE.attack).toBeLessThan(0.05);
    });

    it('has moderate decay', () => {
      expect(DEFAULT_LEAD_ENVELOPE.decay).toBeGreaterThan(0.1);
    });

    it('has velocity sensitivity', () => {
      expect(DEFAULT_LEAD_ENVELOPE.velocityAmount).toBeGreaterThan(0);
    });
  });

  describe('DEFAULT_LEAD_FILTER', () => {
    it('is enabled', () => {
      expect(DEFAULT_LEAD_FILTER.enabled).toBe(true);
    });

    it('is 24dB lowpass', () => {
      expect(DEFAULT_LEAD_FILTER.type).toBe('lowpass24');
    });

    it('has key tracking', () => {
      expect(DEFAULT_LEAD_FILTER.keyTracking).toBeGreaterThan(0);
    });
  });

  describe('DEFAULT_LEAD_LFO', () => {
    it('has triangle waveform', () => {
      expect(DEFAULT_LEAD_LFO.waveform).toBe('triangle');
    });

    it('has vibrato-appropriate rate', () => {
      expect(DEFAULT_LEAD_LFO.rate).toBeGreaterThanOrEqual(4);
      expect(DEFAULT_LEAD_LFO.rate).toBeLessThanOrEqual(8);
    });

    it('retriggers by default', () => {
      expect(DEFAULT_LEAD_LFO.retrigger).toBe(true);
    });
  });

  describe('DEFAULT_LEAD_EFFECTS', () => {
    it('has effects disabled by default', () => {
      expect(DEFAULT_LEAD_EFFECTS.distEnabled).toBe(false);
      expect(DEFAULT_LEAD_EFFECTS.chorusEnabled).toBe(false);
      expect(DEFAULT_LEAD_EFFECTS.delayEnabled).toBe(false);
      expect(DEFAULT_LEAD_EFFECTS.reverbEnabled).toBe(false);
    });
  });
});

// =============================================================================
// FACTORY PRESETS TESTS
// =============================================================================

describe('Factory Presets', () => {
  it('has many presets', () => {
    expect(LEAD_SYNTH_PRESETS.length).toBeGreaterThan(25);
  });

  it('all presets have required fields', () => {
    for (const preset of LEAD_SYNTH_PRESETS) {
      expect(preset.id).toBeDefined();
      expect(preset.name).toBeDefined();
      expect(preset.category).toBeDefined();
      expect(preset.oscillators).toHaveLength(3);
      expect(preset.filter1).toBeDefined();
      expect(preset.filter2).toBeDefined();
      expect(preset.ampEnvelope).toBeDefined();
      expect(preset.filterEnvelope).toBeDefined();
      expect(preset.lfo1).toBeDefined();
      expect(preset.lfo2).toBeDefined();
      expect(preset.modMatrix).toBeDefined();
      expect(preset.effects).toBeDefined();
    }
  });

  it('all presets are marked as factory', () => {
    for (const preset of LEAD_SYNTH_PRESETS) {
      expect(preset.isFactory).toBe(true);
    }
  });

  it('has unique preset IDs', () => {
    const ids = LEAD_SYNTH_PRESETS.map(p => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  describe('Categories', () => {
    // Categories that have presets defined
    const categories: LeadCategory[] = [
      'analog', 'fm', 'sync', 'supersaw',
      'classic', 'modern', 'aggressive', 'smooth', 'experimental'
    ];

    it.each(categories)('has presets in %s category', (category) => {
      const categoryPresets = LEAD_SYNTH_PRESETS.filter(p => p.category === category);
      expect(categoryPresets.length).toBeGreaterThan(0);
    });
  });

  describe('Mono/Poly Presets', () => {
    it('has mono presets', () => {
      const mono = LEAD_SYNTH_PRESETS.filter(p => p.monoMode);
      expect(mono.length).toBeGreaterThan(5);
    });

    it('has poly presets', () => {
      const poly = LEAD_SYNTH_PRESETS.filter(p => !p.monoMode);
      expect(poly.length).toBeGreaterThan(0);
    });
  });
});

// =============================================================================
// STATE FACTORY TESTS
// =============================================================================

describe('createLeadSynthState', () => {
  it('creates initial state', () => {
    const state = createLeadSynthState();
    expect(state).toBeDefined();
    expect(state.preset).toBeDefined();
    expect(state.voices).toEqual([]);
    expect(state.heldNotes).toEqual([]);
  });

  it('uses first preset by default', () => {
    const state = createLeadSynthState();
    expect(state.preset.id).toBe(LEAD_SYNTH_PRESETS[0].id);
  });

  it('accepts custom preset', () => {
    const preset = LEAD_SYNTH_PRESETS[10];
    const state = createLeadSynthState(preset);
    expect(state.preset.id).toBe(preset.id);
  });

  it('initializes performance controls', () => {
    const state = createLeadSynthState();
    expect(state.pitchBend).toBe(0);
    expect(state.modWheel).toBe(0);
    expect(state.channelAftertouch).toBe(0);
    expect(state.expression).toBe(1);
    expect(state.breathController).toBe(0);
    expect(state.sustainPedal).toBe(false);
  });

  it('has master volume', () => {
    const state = createLeadSynthState();
    expect(state.masterVolume).toBeGreaterThan(0);
    expect(state.masterVolume).toBeLessThanOrEqual(1);
  });
});

// =============================================================================
// NOTE TO FREQUENCY TESTS
// =============================================================================

describe('noteToFrequency', () => {
  it('returns 440 Hz for A4', () => {
    expect(noteToFrequency(69)).toBeCloseTo(440, 1);
  });

  it('returns 261.63 Hz for middle C', () => {
    expect(noteToFrequency(60)).toBeCloseTo(261.63, 1);
  });

  it('octave doubles frequency', () => {
    const freq60 = noteToFrequency(60);
    const freq72 = noteToFrequency(72);
    expect(freq72).toBeCloseTo(freq60 * 2, 1);
  });
});

// =============================================================================
// VOICE CREATION TESTS
// =============================================================================

describe('createLeadVoice', () => {
  const preset = LEAD_SYNTH_PRESETS[0];

  it('creates voice with correct note', () => {
    const voice = createLeadVoice('v1', 60, 100, preset, 0, 0);
    expect(voice.note).toBe(60);
  });

  it('creates voice with correct velocity', () => {
    const voice = createLeadVoice('v1', 60, 100, preset, 0, 0);
    expect(voice.velocity).toBe(100);
  });

  it('voice is active and not releasing', () => {
    const voice = createLeadVoice('v1', 60, 100, preset, 0, 0);
    expect(voice.isActive).toBe(true);
    expect(voice.isReleasing).toBe(false);
  });

  it('sets correct frequency', () => {
    const voice = createLeadVoice('v1', 69, 100, preset, 0, 0);
    expect(voice.frequency).toBeCloseTo(440, 1);
  });

  it('initializes envelopes at zero', () => {
    const voice = createLeadVoice('v1', 60, 100, preset, 0, 0);
    expect(voice.ampEnvValue).toBe(0);
    expect(voice.filterEnvValue).toBe(0);
    expect(voice.modEnvValue).toBe(0);
  });

  it('initializes oscillator phases', () => {
    const voice = createLeadVoice('v1', 60, 100, preset, 0, 0);
    expect(voice.oscPhases).toHaveLength(3);
  });

  describe('portamento', () => {
    it('uses last frequency for glide', () => {
      const glidePreset = { ...preset, portamentoMode: 'always' as const, portamentoTime: 0.1 };
      const lastFreq = noteToFrequency(48);
      const voice = createLeadVoice('v1', 60, 100, glidePreset, lastFreq, 0);
      expect(voice.frequency).toBe(lastFreq);
      expect(voice.targetFrequency).toBeCloseTo(noteToFrequency(60), 1);
    });

    it('uses target frequency when portamento off', () => {
      const noGlidePreset = { ...preset, portamentoMode: 'off' as const };
      const lastFreq = noteToFrequency(48);
      const voice = createLeadVoice('v1', 60, 100, noGlidePreset, lastFreq, 0);
      expect(voice.frequency).toBe(voice.targetFrequency);
    });
  });
});

// =============================================================================
// INPUT PROCESSING TESTS
// =============================================================================

describe('processLeadSynthInput', () => {
  let state: LeadSynthState;

  beforeEach(() => {
    state = createLeadSynthState();
  });

  describe('noteOn', () => {
    it('creates a voice', () => {
      const result = processLeadSynthInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      expect(result.state.voices).toHaveLength(1);
    });

    it('outputs voiceStart event', () => {
      const result = processLeadSynthInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      expect(result.outputs).toContainEqual(expect.objectContaining({ type: 'voiceStart', note: 60 }));
    });

    it('adds note to held notes', () => {
      const result = processLeadSynthInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      expect(result.state.heldNotes).toContain(60);
    });

    it('velocity 0 triggers noteOff', () => {
      const { state: state1 } = processLeadSynthInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      const result = processLeadSynthInput(state1, { type: 'noteOn', note: 60, velocity: 0 });
      const voice = result.state.voices.find(v => v.note === 60);
      expect(voice?.isReleasing).toBe(true);
    });

    it('mono mode releases previous voice', () => {
      // Ensure mono mode
      const monoPreset = { ...LEAD_SYNTH_PRESETS[0], monoMode: true, legato: false };
      let s = createLeadSynthState(monoPreset);
      let result = processLeadSynthInput(s, { type: 'noteOn', note: 60, velocity: 100 });
      s = result.state;
      result = processLeadSynthInput(s, { type: 'noteOn', note: 64, velocity: 100 });
      const releasingVoices = result.state.voices.filter(v => v.isReleasing);
      expect(releasingVoices.length).toBeGreaterThan(0);
    });

    it('legato mode updates pitch without retriggering', () => {
      const legatoPreset = { ...LEAD_SYNTH_PRESETS[0], monoMode: true, legato: true };
      let s = createLeadSynthState(legatoPreset);
      let result = processLeadSynthInput(s, { type: 'noteOn', note: 60, velocity: 100 });
      s = result.state;
      const voiceCountBefore = s.voices.length;
      result = processLeadSynthInput(s, { type: 'noteOn', note: 64, velocity: 100 });
      // In legato, we don't add a new voice, just update existing
      const newVoices = result.state.voices.filter(v => !v.isReleasing);
      expect(newVoices.some(v => v.targetFrequency === noteToFrequency(64))).toBe(true);
    });

    it('updates lastNote', () => {
      const result = processLeadSynthInput(state, { type: 'noteOn', note: 72, velocity: 100 });
      expect(result.state.lastNote).toBe(72);
    });
  });

  describe('noteOff', () => {
    it('sets voice to releasing', () => {
      const { state: state1 } = processLeadSynthInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      const result = processLeadSynthInput(state1, { type: 'noteOff', note: 60 });
      const voice = result.state.voices.find(v => v.note === 60);
      expect(voice?.isReleasing).toBe(true);
    });

    it('removes note from held notes', () => {
      const { state: state1 } = processLeadSynthInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      const result = processLeadSynthInput(state1, { type: 'noteOff', note: 60 });
      expect(result.state.heldNotes).not.toContain(60);
    });

    it('mono mode returns to previous note', () => {
      const monoPreset = { ...LEAD_SYNTH_PRESETS[0], monoMode: true, legato: true };
      let s = createLeadSynthState(monoPreset);
      let result = processLeadSynthInput(s, { type: 'noteOn', note: 60, velocity: 100 });
      s = result.state;
      result = processLeadSynthInput(s, { type: 'noteOn', note: 64, velocity: 100 });
      s = result.state;
      result = processLeadSynthInput(s, { type: 'noteOff', note: 64 });
      // Should return to note 60
      const activeVoice = result.state.voices.find(v => !v.isReleasing);
      expect(activeVoice?.targetFrequency).toBeCloseTo(noteToFrequency(60), 1);
    });

    it('sustain pedal prevents release', () => {
      let { state: s1 } = processLeadSynthInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      ({ state: s1 } = processLeadSynthInput(s1, { type: 'sustainPedal', value: true }));
      const result = processLeadSynthInput(s1, { type: 'noteOff', note: 60 });
      const voice = result.state.voices.find(v => v.note === 60);
      expect(voice?.isReleasing).toBe(false);
    });
  });

  describe('pitchBend', () => {
    it('sets pitch bend value', () => {
      const result = processLeadSynthInput(state, { type: 'pitchBend', value: 0.5 });
      expect(result.state.pitchBend).toBe(0.5);
    });

    it('clamps to valid range', () => {
      const result = processLeadSynthInput(state, { type: 'pitchBend', value: 2 });
      expect(result.state.pitchBend).toBeLessThanOrEqual(1);
    });

    it('allows negative values', () => {
      const result = processLeadSynthInput(state, { type: 'pitchBend', value: -0.5 });
      expect(result.state.pitchBend).toBe(-0.5);
    });
  });

  describe('modWheel', () => {
    it('sets mod wheel value', () => {
      const result = processLeadSynthInput(state, { type: 'modWheel', value: 0.75 });
      expect(result.state.modWheel).toBe(0.75);
    });
  });

  describe('aftertouch', () => {
    it('sets channel aftertouch', () => {
      const result = processLeadSynthInput(state, { type: 'aftertouch', value: 0.6 });
      expect(result.state.channelAftertouch).toBe(0.6);
    });
  });

  describe('polyAftertouch', () => {
    it('sets per-voice aftertouch', () => {
      const { state: s1 } = processLeadSynthInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      const result = processLeadSynthInput(s1, { type: 'polyAftertouch', note: 60, value: 0.8 });
      const voice = result.state.voices.find(v => v.note === 60);
      expect(voice?.aftertouch).toBe(0.8);
    });
  });

  describe('expression', () => {
    it('sets expression value', () => {
      const result = processLeadSynthInput(state, { type: 'expression', value: 0.8 });
      expect(result.state.expression).toBe(0.8);
    });
  });

  describe('breathController', () => {
    it('sets breath controller value', () => {
      const result = processLeadSynthInput(state, { type: 'breathController', value: 0.7 });
      expect(result.state.breathController).toBe(0.7);
    });
  });

  describe('sustainPedal', () => {
    it('sets sustain pedal', () => {
      const result = processLeadSynthInput(state, { type: 'sustainPedal', value: true });
      expect(result.state.sustainPedal).toBe(true);
    });

    it('releases unheld voices when released', () => {
      let { state: s1 } = processLeadSynthInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      ({ state: s1 } = processLeadSynthInput(s1, { type: 'sustainPedal', value: true }));
      ({ state: s1 } = processLeadSynthInput(s1, { type: 'noteOff', note: 60 }));
      const result = processLeadSynthInput(s1, { type: 'sustainPedal', value: false });
      const voice = result.state.voices.find(v => v.note === 60);
      expect(voice?.isReleasing).toBe(true);
    });
  });

  describe('allNotesOff', () => {
    it('sets all voices to releasing', () => {
      // Use poly mode for this test
      const polyPreset = { ...LEAD_SYNTH_PRESETS[0], monoMode: false, polyphony: 8 };
      let s = createLeadSynthState(polyPreset);
      for (let i = 0; i < 3; i++) {
        const result = processLeadSynthInput(s, { type: 'noteOn', note: 60 + i, velocity: 100 });
        s = result.state;
      }
      const result = processLeadSynthInput(s, { type: 'allNotesOff' });
      for (const voice of result.state.voices) {
        expect(voice.isReleasing).toBe(true);
      }
    });
  });

  describe('allSoundOff', () => {
    it('clears all voices immediately', () => {
      const polyPreset = { ...LEAD_SYNTH_PRESETS[0], monoMode: false, polyphony: 8 };
      let s = createLeadSynthState(polyPreset);
      for (let i = 0; i < 3; i++) {
        const result = processLeadSynthInput(s, { type: 'noteOn', note: 60 + i, velocity: 100 });
        s = result.state;
      }
      const result = processLeadSynthInput(s, { type: 'allSoundOff' });
      expect(result.state.voices).toHaveLength(0);
    });
  });

  describe('loadPreset', () => {
    it('loads existing preset', () => {
      const targetPreset = LEAD_SYNTH_PRESETS[10];
      const result = processLeadSynthInput(state, { type: 'loadPreset', presetId: targetPreset.id });
      expect(result.state.preset.id).toBe(targetPreset.id);
    });

    it('outputs presetLoaded event', () => {
      const targetPreset = LEAD_SYNTH_PRESETS[5];
      const result = processLeadSynthInput(state, { type: 'loadPreset', presetId: targetPreset.id });
      expect(result.outputs).toContainEqual({ type: 'presetLoaded', presetId: targetPreset.id });
    });

    it('outputs error for unknown preset', () => {
      const result = processLeadSynthInput(state, { type: 'loadPreset', presetId: 'nonexistent' });
      expect(result.outputs).toContainEqual(expect.objectContaining({ type: 'error' }));
    });
  });

  describe('setVolume', () => {
    it('sets master volume', () => {
      const result = processLeadSynthInput(state, { type: 'setVolume', volume: 0.5 });
      expect(result.state.masterVolume).toBe(0.5);
    });
  });

  describe('setOscillator', () => {
    it('updates oscillator config', () => {
      const result = processLeadSynthInput(state, {
        type: 'setOscillator',
        oscIndex: 0,
        config: { waveform: 'triangle', level: 0.8 },
      });
      expect(result.state.preset.oscillators[0].waveform).toBe('triangle');
      expect(result.state.preset.oscillators[0].level).toBe(0.8);
    });
  });

  describe('setFilter', () => {
    it('updates filter 1', () => {
      const result = processLeadSynthInput(state, {
        type: 'setFilter',
        filterIndex: 1,
        config: { cutoff: 2000, resonance: 0.8 },
      });
      expect(result.state.preset.filter1.cutoff).toBe(2000);
      expect(result.state.preset.filter1.resonance).toBe(0.8);
    });
  });

  describe('setEnvelope', () => {
    it('updates amp envelope', () => {
      const result = processLeadSynthInput(state, {
        type: 'setEnvelope',
        envType: 'amp',
        config: { attack: 0.1, release: 0.5 },
      });
      expect(result.state.preset.ampEnvelope.attack).toBe(0.1);
      expect(result.state.preset.ampEnvelope.release).toBe(0.5);
    });
  });

  describe('setLFO', () => {
    it('updates LFO 1', () => {
      const result = processLeadSynthInput(state, {
        type: 'setLFO',
        lfoIndex: 1,
        config: { rate: 6, depth: 0.2 },
      });
      expect(result.state.preset.lfo1.rate).toBe(6);
      expect(result.state.preset.lfo1.depth).toBe(0.2);
    });
  });

  describe('setEffects', () => {
    it('updates effects config', () => {
      const result = processLeadSynthInput(state, {
        type: 'setEffects',
        config: { distEnabled: true, distAmount: 0.5 },
      });
      expect(result.state.preset.effects.distEnabled).toBe(true);
      expect(result.state.preset.effects.distAmount).toBe(0.5);
    });
  });

  describe('setPortamento', () => {
    it('sets portamento mode and time', () => {
      const result = processLeadSynthInput(state, {
        type: 'setPortamento',
        mode: 'always',
        time: 0.15,
      });
      expect(result.state.preset.portamentoMode).toBe('always');
      expect(result.state.preset.portamentoTime).toBe(0.15);
    });
  });

  describe('setMonoMode', () => {
    it('sets mono mode', () => {
      const result = processLeadSynthInput(state, {
        type: 'setMonoMode',
        mono: true,
        legato: false,
      });
      expect(result.state.preset.monoMode).toBe(true);
      expect(result.state.preset.legato).toBe(false);
    });
  });

  describe('tick', () => {
    it('processes envelope', () => {
      const { state: s1 } = processLeadSynthInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      const result = processLeadSynthInput(s1, { type: 'tick', time: 0, deltaTime: 0.01 });
      const voice = result.state.voices[0];
      expect(voice.ampEnvValue).toBeGreaterThan(0);
    });

    it('removes finished voices', () => {
      let { state: s1 } = processLeadSynthInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      ({ state: s1 } = processLeadSynthInput(s1, { type: 'tick', time: 0, deltaTime: 1 }));
      ({ state: s1 } = processLeadSynthInput(s1, { type: 'noteOff', note: 60 }));
      for (let i = 0; i < 20; i++) {
        ({ state: s1 } = processLeadSynthInput(s1, { type: 'tick', time: i * 0.1, deltaTime: 0.1 }));
      }
      expect(s1.voices).toHaveLength(0);
    });

    it('processes portamento', () => {
      const glidePreset = { ...LEAD_SYNTH_PRESETS[0], portamentoMode: 'always' as const, portamentoTime: 0.5 };
      let s = createLeadSynthState(glidePreset);
      let result = processLeadSynthInput(s, { type: 'noteOn', note: 60, velocity: 100 });
      s = result.state;
      result = processLeadSynthInput(s, { type: 'noteOn', note: 72, velocity: 100 }); // Octave up
      s = result.state;
      const initialFreq = s.voices[0].frequency;
      result = processLeadSynthInput(s, { type: 'tick', time: 0, deltaTime: 0.1 });
      // Frequency should have moved toward target
      expect(result.state.voices[0].frequency).not.toBe(initialFreq);
    });
  });

  describe('midiCC', () => {
    it('CC1 controls mod wheel', () => {
      const result = processLeadSynthInput(state, { type: 'midiCC', controller: 1, value: 64 });
      expect(result.state.modWheel).toBeCloseTo(64 / 127, 2);
    });

    it('CC2 controls breath controller', () => {
      const result = processLeadSynthInput(state, { type: 'midiCC', controller: 2, value: 100 });
      expect(result.state.breathController).toBeCloseTo(100 / 127, 2);
    });

    it('CC7 controls volume', () => {
      const result = processLeadSynthInput(state, { type: 'midiCC', controller: 7, value: 100 });
      expect(result.state.masterVolume).toBeCloseTo(100 / 127, 2);
    });

    it('CC11 controls expression', () => {
      const result = processLeadSynthInput(state, { type: 'midiCC', controller: 11, value: 80 });
      expect(result.state.expression).toBeCloseTo(80 / 127, 2);
    });

    it('CC64 controls sustain', () => {
      const result = processLeadSynthInput(state, { type: 'midiCC', controller: 64, value: 127 });
      expect(result.state.sustainPedal).toBe(true);
    });

    it('CC65 controls portamento on/off', () => {
      const result = processLeadSynthInput(state, { type: 'midiCC', controller: 65, value: 127 });
      expect(result.state.preset.portamentoMode).toBe('always');
    });

    it('CC120 is all sound off', () => {
      let { state: s1 } = processLeadSynthInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      const result = processLeadSynthInput(s1, { type: 'midiCC', controller: 120, value: 0 });
      expect(result.state.voices).toHaveLength(0);
    });

    it('CC123 is all notes off', () => {
      let { state: s1 } = processLeadSynthInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      const result = processLeadSynthInput(s1, { type: 'midiCC', controller: 123, value: 0 });
      for (const voice of result.state.voices) {
        expect(voice.isReleasing).toBe(true);
      }
    });
  });
});

// =============================================================================
// CARD TESTS
// =============================================================================

describe('createLeadSynthCard', () => {
  it('creates card with correct meta', () => {
    const card = createLeadSynthCard();
    expect(card.meta.id).toBe('lead-synth');
    expect(card.meta.category).toBe('generator');
  });

  it('has MIDI input port', () => {
    const card = createLeadSynthCard();
    expect(card.meta.inputPorts.some(p => p.type === 'midi')).toBe(true);
  });

  it('has stereo audio outputs', () => {
    const card = createLeadSynthCard();
    const audioOuts = card.meta.outputPorts.filter(p => p.type === 'audio');
    expect(audioOuts.length).toBe(2);
  });

  it('processes input', () => {
    const card = createLeadSynthCard();
    const outputs = card.process({ type: 'noteOn', note: 60, velocity: 100 });
    expect(outputs).toContainEqual(expect.objectContaining({ type: 'voiceStart' }));
  });

  it('getState returns current state', () => {
    const card = createLeadSynthCard();
    card.process({ type: 'noteOn', note: 60, velocity: 100 });
    const state = card.getState();
    expect(state.voices.length).toBe(1);
  });

  it('reset clears state', () => {
    const card = createLeadSynthCard();
    card.process({ type: 'noteOn', note: 60, velocity: 100 });
    card.reset();
    const state = card.getState();
    expect(state.voices).toHaveLength(0);
  });

  it('loadPreset loads preset', () => {
    const card = createLeadSynthCard();
    const outputs = card.loadPreset(LEAD_SYNTH_PRESETS[10].id);
    expect(outputs).toContainEqual(expect.objectContaining({ type: 'presetLoaded' }));
  });

  it('getPresets returns all presets', () => {
    const card = createLeadSynthCard();
    const presets = card.getPresets();
    expect(presets).toEqual(LEAD_SYNTH_PRESETS);
  });

  it('getPresetsByCategory filters correctly', () => {
    const card = createLeadSynthCard();
    const sync = card.getPresetsByCategory('sync');
    expect(sync.every(p => p.category === 'sync')).toBe(true);
  });

  it('getActiveVoiceCount is accurate', () => {
    const polyPreset = { ...LEAD_SYNTH_PRESETS[0], monoMode: false, polyphony: 8 };
    const card = createLeadSynthCard();
    card.process({ type: 'loadPreset', presetId: 'juno-poly' });
    expect(card.getActiveVoiceCount()).toBe(0);
    card.process({ type: 'noteOn', note: 60, velocity: 100 });
    card.process({ type: 'noteOn', note: 64, velocity: 100 });
    expect(card.getActiveVoiceCount()).toBe(2);
  });

  it('isMonoMode returns correct value', () => {
    const card = createLeadSynthCard();
    expect(card.isMonoMode()).toBe(true); // Default preset is mono
    card.loadPreset('juno-poly');
    expect(card.isMonoMode()).toBe(false);
  });
});
