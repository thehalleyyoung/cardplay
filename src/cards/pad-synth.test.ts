/**
 * PadSynth Card Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MAX_OSCILLATORS,
  MAX_UNISON,
  MAX_POLYPHONY,
  SAMPLE_RATE,
  NOTE_NAMES,
  DEFAULT_OSCILLATOR,
  DEFAULT_ENVELOPE,
  DEFAULT_FILTER,
  DEFAULT_LFO,
  DEFAULT_EFFECTS,
  PAD_SYNTH_PRESETS,
  createPadSynthState,
  createPadVoice,
  noteToFrequency,
  processPadSynthInput,
  createPadSynthCard,
  PadSynthState,
  PadCategory,
} from './pad-synth';

// =============================================================================
// CONSTANTS TESTS
// =============================================================================

describe('PadSynth Constants', () => {
  it('has correct oscillator limit', () => {
    expect(MAX_OSCILLATORS).toBe(4);
  });

  it('has correct unison limit', () => {
    expect(MAX_UNISON).toBe(8);
  });

  it('has correct polyphony limit', () => {
    expect(MAX_POLYPHONY).toBe(16);
  });

  it('has correct sample rate', () => {
    expect(SAMPLE_RATE).toBe(44100);
  });

  it('has all note names', () => {
    expect(NOTE_NAMES).toHaveLength(12);
    expect(NOTE_NAMES).toContain('C');
    expect(NOTE_NAMES).toContain('F#');
  });
});

// =============================================================================
// DEFAULT VALUES TESTS
// =============================================================================

describe('Default Values', () => {
  describe('DEFAULT_OSCILLATOR', () => {
    it('has correct waveform', () => {
      expect(DEFAULT_OSCILLATOR.waveform).toBe('saw');
    });

    it('has correct level', () => {
      expect(DEFAULT_OSCILLATOR.level).toBe(0.5);
    });

    it('has unison of 1', () => {
      expect(DEFAULT_OSCILLATOR.unison).toBe(1);
    });

    it('has center pan', () => {
      expect(DEFAULT_OSCILLATOR.pan).toBe(0);
    });

    it('has no coarse tuning', () => {
      expect(DEFAULT_OSCILLATOR.coarse).toBe(0);
    });
  });

  describe('DEFAULT_ENVELOPE', () => {
    it('has slow attack for pads', () => {
      expect(DEFAULT_ENVELOPE.attack).toBeGreaterThanOrEqual(0.5);
    });

    it('has high sustain', () => {
      expect(DEFAULT_ENVELOPE.sustain).toBeGreaterThanOrEqual(0.7);
    });

    it('has slow release', () => {
      expect(DEFAULT_ENVELOPE.release).toBeGreaterThanOrEqual(1.0);
    });
  });

  describe('DEFAULT_FILTER', () => {
    it('is enabled', () => {
      expect(DEFAULT_FILTER.enabled).toBe(true);
    });

    it('is lowpass', () => {
      expect(DEFAULT_FILTER.type).toBe('lowpass');
    });

    it('has moderate cutoff', () => {
      expect(DEFAULT_FILTER.cutoff).toBeGreaterThan(1000);
    });
  });

  describe('DEFAULT_LFO', () => {
    it('has sine waveform', () => {
      expect(DEFAULT_LFO.waveform).toBe('sine');
    });

    it('has slow rate for pads', () => {
      expect(DEFAULT_LFO.rate).toBeLessThan(2);
    });
  });

  describe('DEFAULT_EFFECTS', () => {
    it('has chorus enabled', () => {
      expect(DEFAULT_EFFECTS.chorusEnabled).toBe(true);
    });

    it('has reverb enabled', () => {
      expect(DEFAULT_EFFECTS.reverbEnabled).toBe(true);
    });

    it('has significant reverb mix', () => {
      expect(DEFAULT_EFFECTS.reverbMix).toBeGreaterThan(0.2);
    });
  });
});

// =============================================================================
// FACTORY PRESETS TESTS
// =============================================================================

describe('Factory Presets', () => {
  it('has many presets', () => {
    expect(PAD_SYNTH_PRESETS.length).toBeGreaterThan(25);
  });

  it('all presets have required fields', () => {
    for (const preset of PAD_SYNTH_PRESETS) {
      expect(preset.id).toBeDefined();
      expect(preset.name).toBeDefined();
      expect(preset.category).toBeDefined();
      expect(preset.oscillators).toHaveLength(4);
      expect(preset.filter1).toBeDefined();
      expect(preset.filter2).toBeDefined();
      expect(preset.ampEnvelope).toBeDefined();
      expect(preset.filterEnvelope).toBeDefined();
      expect(preset.lfos).toHaveLength(4);
      expect(preset.effects).toBeDefined();
    }
  });

  it('all presets are marked as factory', () => {
    for (const preset of PAD_SYNTH_PRESETS) {
      expect(preset.isFactory).toBe(true);
    }
  });

  it('has unique preset IDs', () => {
    const ids = PAD_SYNTH_PRESETS.map(p => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  describe('Categories', () => {
    const categories: PadCategory[] = [
      'ambient', 'warm', 'dark', 'bright', 'evolving',
      'texture', 'cinematic', 'retro', 'digital', 'ethereal', 'aggressive'
    ];

    it.each(categories)('has presets in %s category', (category) => {
      const categoryPresets = PAD_SYNTH_PRESETS.filter(p => p.category === category);
      expect(categoryPresets.length).toBeGreaterThan(0);
    });

    it('has warm presets', () => {
      const warm = PAD_SYNTH_PRESETS.filter(p => p.category === 'warm');
      expect(warm.length).toBeGreaterThanOrEqual(3);
    });

    it('has ambient presets', () => {
      const ambient = PAD_SYNTH_PRESETS.filter(p => p.category === 'ambient');
      expect(ambient.length).toBeGreaterThanOrEqual(3);
    });

    it('has cinematic presets', () => {
      const cinematic = PAD_SYNTH_PRESETS.filter(p => p.category === 'cinematic');
      expect(cinematic.length).toBeGreaterThanOrEqual(2);
    });
  });
});

// =============================================================================
// STATE FACTORY TESTS
// =============================================================================

describe('createPadSynthState', () => {
  it('creates initial state', () => {
    const state = createPadSynthState();
    expect(state).toBeDefined();
    expect(state.preset).toBeDefined();
    expect(state.voices).toEqual([]);
    expect(state.heldNotes.size).toBe(0);
  });

  it('uses first preset by default', () => {
    const state = createPadSynthState();
    expect(state.preset.id).toBe(PAD_SYNTH_PRESETS[0].id);
  });

  it('accepts custom preset', () => {
    const preset = PAD_SYNTH_PRESETS[5];
    const state = createPadSynthState(preset);
    expect(state.preset.id).toBe(preset.id);
  });

  it('initializes performance controls', () => {
    const state = createPadSynthState();
    expect(state.pitchBend).toBe(0);
    expect(state.modWheel).toBe(0);
    expect(state.expression).toBe(1);
    expect(state.sustainPedal).toBe(false);
  });

  it('has master volume', () => {
    const state = createPadSynthState();
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

  it('handles low notes', () => {
    const freq = noteToFrequency(24);
    expect(freq).toBeGreaterThan(0);
    expect(freq).toBeLessThan(100);
  });

  it('handles high notes', () => {
    const freq = noteToFrequency(108);
    expect(freq).toBeGreaterThan(1000);
  });
});

// =============================================================================
// VOICE CREATION TESTS
// =============================================================================

describe('createPadVoice', () => {
  const preset = PAD_SYNTH_PRESETS[0];

  it('creates voice with correct note', () => {
    const voice = createPadVoice('v1', 60, 100, preset, 0, 0);
    expect(voice.note).toBe(60);
  });

  it('creates voice with correct velocity', () => {
    const voice = createPadVoice('v1', 60, 100, preset, 0, 0);
    expect(voice.velocity).toBe(100);
  });

  it('voice is active and not releasing', () => {
    const voice = createPadVoice('v1', 60, 100, preset, 0, 0);
    expect(voice.isActive).toBe(true);
    expect(voice.isReleasing).toBe(false);
  });

  it('sets correct frequency', () => {
    const voice = createPadVoice('v1', 69, 100, preset, 0, 0);
    expect(voice.frequency).toBeCloseTo(440, 1);
  });

  it('initializes envelopes at zero', () => {
    const voice = createPadVoice('v1', 60, 100, preset, 0, 0);
    expect(voice.ampEnvValue).toBe(0);
    expect(voice.filterEnvValue).toBe(0);
    expect(voice.modEnvValue).toBe(0);
  });

  it('initializes oscillator phases', () => {
    const voice = createPadVoice('v1', 60, 100, preset, 0, 0);
    expect(voice.oscPhases).toHaveLength(preset.oscillators.length);
  });

  describe('glide', () => {
    it('uses last frequency when glide enabled', () => {
      const glidePreset = { ...preset, glideEnabled: true, glideTime: 0.1 };
      const lastFreq = noteToFrequency(48);
      const voice = createPadVoice('v1', 60, 100, glidePreset, lastFreq, 0);
      expect(voice.frequency).toBe(lastFreq);
      expect(voice.targetFrequency).toBeCloseTo(noteToFrequency(60), 1);
    });

    it('uses target frequency when glide disabled', () => {
      const noGlidePreset = { ...preset, glideEnabled: false };
      const lastFreq = noteToFrequency(48);
      const voice = createPadVoice('v1', 60, 100, noGlidePreset, lastFreq, 0);
      expect(voice.frequency).toBe(voice.targetFrequency);
    });
  });
});

// =============================================================================
// INPUT PROCESSING TESTS
// =============================================================================

describe('processPadSynthInput', () => {
  let state: PadSynthState;

  beforeEach(() => {
    state = createPadSynthState();
  });

  describe('noteOn', () => {
    it('creates a voice', () => {
      const result = processPadSynthInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      expect(result.state.voices).toHaveLength(1);
    });

    it('outputs voiceStart event', () => {
      const result = processPadSynthInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      expect(result.outputs).toContainEqual(expect.objectContaining({ type: 'voiceStart', note: 60 }));
    });

    it('adds note to held notes', () => {
      const result = processPadSynthInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      expect(result.state.heldNotes.has(60)).toBe(true);
    });

    it('velocity 0 triggers noteOff', () => {
      const { state: state1 } = processPadSynthInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      const result = processPadSynthInput(state1, { type: 'noteOn', note: 60, velocity: 0 });
      const voice = result.state.voices.find(v => v.note === 60);
      expect(voice?.isReleasing).toBe(true);
    });

    it('respects polyphony limit', () => {
      let currentState = state;
      for (let i = 0; i < MAX_POLYPHONY + 5; i++) {
        const result = processPadSynthInput(currentState, { type: 'noteOn', note: 36 + i, velocity: 100 });
        currentState = result.state;
      }
      const activeVoices = currentState.voices.filter(v => v.isActive);
      expect(activeVoices.length).toBeLessThanOrEqual(MAX_POLYPHONY);
    });

    it('updates lastNote', () => {
      const result = processPadSynthInput(state, { type: 'noteOn', note: 72, velocity: 100 });
      expect(result.state.lastNote).toBe(72);
    });
  });

  describe('noteOff', () => {
    it('sets voice to releasing', () => {
      const { state: state1 } = processPadSynthInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      const result = processPadSynthInput(state1, { type: 'noteOff', note: 60 });
      const voice = result.state.voices.find(v => v.note === 60);
      expect(voice?.isReleasing).toBe(true);
    });

    it('removes note from held notes', () => {
      const { state: state1 } = processPadSynthInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      const result = processPadSynthInput(state1, { type: 'noteOff', note: 60 });
      expect(result.state.heldNotes.has(60)).toBe(false);
    });

    it('sustain pedal prevents release', () => {
      let { state: s1 } = processPadSynthInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      ({ state: s1 } = processPadSynthInput(s1, { type: 'sustainPedal', value: true }));
      const result = processPadSynthInput(s1, { type: 'noteOff', note: 60 });
      const voice = result.state.voices.find(v => v.note === 60);
      expect(voice?.isReleasing).toBe(false);
    });
  });

  describe('pitchBend', () => {
    it('sets pitch bend value', () => {
      const result = processPadSynthInput(state, { type: 'pitchBend', value: 0.5 });
      expect(result.state.pitchBend).toBe(0.5);
    });

    it('clamps to valid range', () => {
      const result = processPadSynthInput(state, { type: 'pitchBend', value: 2 });
      expect(result.state.pitchBend).toBeLessThanOrEqual(1);
    });
  });

  describe('modWheel', () => {
    it('sets mod wheel value', () => {
      const result = processPadSynthInput(state, { type: 'modWheel', value: 0.75 });
      expect(result.state.modWheel).toBe(0.75);
    });
  });

  describe('expression', () => {
    it('sets expression value', () => {
      const result = processPadSynthInput(state, { type: 'expression', value: 0.8 });
      expect(result.state.expression).toBe(0.8);
    });
  });

  describe('sustainPedal', () => {
    it('sets sustain pedal', () => {
      const result = processPadSynthInput(state, { type: 'sustainPedal', value: true });
      expect(result.state.sustainPedal).toBe(true);
    });

    it('releases unheld voices when released', () => {
      let { state: s1 } = processPadSynthInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      ({ state: s1 } = processPadSynthInput(s1, { type: 'sustainPedal', value: true }));
      ({ state: s1 } = processPadSynthInput(s1, { type: 'noteOff', note: 60 }));
      const result = processPadSynthInput(s1, { type: 'sustainPedal', value: false });
      const voice = result.state.voices.find(v => v.note === 60);
      expect(voice?.isReleasing).toBe(true);
    });
  });

  describe('allNotesOff', () => {
    it('sets all voices to releasing', () => {
      let currentState = state;
      for (let i = 0; i < 5; i++) {
        const result = processPadSynthInput(currentState, { type: 'noteOn', note: 60 + i, velocity: 100 });
        currentState = result.state;
      }
      const result = processPadSynthInput(currentState, { type: 'allNotesOff' });
      for (const voice of result.state.voices) {
        expect(voice.isReleasing).toBe(true);
      }
    });
  });

  describe('allSoundOff', () => {
    it('clears all voices immediately', () => {
      let currentState = state;
      for (let i = 0; i < 3; i++) {
        const result = processPadSynthInput(currentState, { type: 'noteOn', note: 60 + i, velocity: 100 });
        currentState = result.state;
      }
      const result = processPadSynthInput(currentState, { type: 'allSoundOff' });
      expect(result.state.voices).toHaveLength(0);
    });

    it('outputs voiceEnd for each voice', () => {
      let currentState = state;
      for (let i = 0; i < 3; i++) {
        const result = processPadSynthInput(currentState, { type: 'noteOn', note: 60 + i, velocity: 100 });
        currentState = result.state;
      }
      const result = processPadSynthInput(currentState, { type: 'allSoundOff' });
      const voiceEnds = result.outputs.filter(o => o.type === 'voiceEnd');
      expect(voiceEnds).toHaveLength(3);
    });
  });

  describe('loadPreset', () => {
    it('loads existing preset', () => {
      const targetPreset = PAD_SYNTH_PRESETS[10];
      const result = processPadSynthInput(state, { type: 'loadPreset', presetId: targetPreset.id });
      expect(result.state.preset.id).toBe(targetPreset.id);
    });

    it('outputs presetLoaded event', () => {
      const targetPreset = PAD_SYNTH_PRESETS[5];
      const result = processPadSynthInput(state, { type: 'loadPreset', presetId: targetPreset.id });
      expect(result.outputs).toContainEqual({ type: 'presetLoaded', presetId: targetPreset.id });
    });

    it('outputs error for unknown preset', () => {
      const result = processPadSynthInput(state, { type: 'loadPreset', presetId: 'nonexistent' });
      expect(result.outputs).toContainEqual(expect.objectContaining({ type: 'error' }));
    });
  });

  describe('setVolume', () => {
    it('sets master volume', () => {
      const result = processPadSynthInput(state, { type: 'setVolume', volume: 0.5 });
      expect(result.state.masterVolume).toBe(0.5);
    });
  });

  describe('setOscillator', () => {
    it('updates oscillator config', () => {
      const result = processPadSynthInput(state, {
        type: 'setOscillator',
        oscIndex: 0,
        config: { waveform: 'triangle', level: 0.7 },
      });
      expect(result.state.preset.oscillators[0].waveform).toBe('triangle');
      expect(result.state.preset.oscillators[0].level).toBe(0.7);
    });

    it('ignores invalid index', () => {
      const result = processPadSynthInput(state, {
        type: 'setOscillator',
        oscIndex: 10,
        config: { level: 1 },
      });
      expect(result.state).toBe(state);
    });
  });

  describe('setFilter', () => {
    it('updates filter 1', () => {
      const result = processPadSynthInput(state, {
        type: 'setFilter',
        filterIndex: 1,
        config: { cutoff: 2000, resonance: 0.8 },
      });
      expect(result.state.preset.filter1.cutoff).toBe(2000);
      expect(result.state.preset.filter1.resonance).toBe(0.8);
    });

    it('updates filter 2', () => {
      const result = processPadSynthInput(state, {
        type: 'setFilter',
        filterIndex: 2,
        config: { type: 'highpass' },
      });
      expect(result.state.preset.filter2.type).toBe('highpass');
    });
  });

  describe('setEnvelope', () => {
    it('updates amp envelope', () => {
      const result = processPadSynthInput(state, {
        type: 'setEnvelope',
        envType: 'amp',
        config: { attack: 2.0, release: 3.0 },
      });
      expect(result.state.preset.ampEnvelope.attack).toBe(2.0);
      expect(result.state.preset.ampEnvelope.release).toBe(3.0);
    });

    it('updates filter envelope', () => {
      const result = processPadSynthInput(state, {
        type: 'setEnvelope',
        envType: 'filter',
        config: { decay: 1.5 },
      });
      expect(result.state.preset.filterEnvelope.decay).toBe(1.5);
    });
  });

  describe('setLFO', () => {
    it('updates LFO config', () => {
      const result = processPadSynthInput(state, {
        type: 'setLFO',
        lfoIndex: 0,
        config: { rate: 2.0, depth: 0.5, destination: 'filter1Cutoff' },
      });
      expect(result.state.preset.lfos[0].rate).toBe(2.0);
      expect(result.state.preset.lfos[0].depth).toBe(0.5);
      expect(result.state.preset.lfos[0].destination).toBe('filter1Cutoff');
    });
  });

  describe('setEffects', () => {
    it('updates effects config', () => {
      const result = processPadSynthInput(state, {
        type: 'setEffects',
        config: { reverbMix: 0.8, chorusMix: 0.5 },
      });
      expect(result.state.preset.effects.reverbMix).toBe(0.8);
      expect(result.state.preset.effects.chorusMix).toBe(0.5);
    });
  });

  describe('setGlide', () => {
    it('enables glide', () => {
      const result = processPadSynthInput(state, {
        type: 'setGlide',
        time: 0.2,
        enabled: true,
      });
      expect(result.state.preset.glideEnabled).toBe(true);
      expect(result.state.preset.glideTime).toBe(0.2);
    });
  });

  describe('tick', () => {
    it('processes envelope', () => {
      const { state: s1 } = processPadSynthInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      const result = processPadSynthInput(s1, { type: 'tick', time: 0, deltaTime: 0.1 });
      const voice = result.state.voices[0];
      expect(voice.ampEnvValue).toBeGreaterThan(0);
    });

    it('removes finished voices', () => {
      let { state: s1 } = processPadSynthInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      ({ state: s1 } = processPadSynthInput(s1, { type: 'tick', time: 0, deltaTime: 5 }));
      ({ state: s1 } = processPadSynthInput(s1, { type: 'noteOff', note: 60 }));
      for (let i = 0; i < 50; i++) {
        ({ state: s1 } = processPadSynthInput(s1, { type: 'tick', time: i * 0.1, deltaTime: 0.1 }));
      }
      expect(s1.voices).toHaveLength(0);
    });

    it('outputs voiceEnd when voice finishes', () => {
      let s = state;
      let result = processPadSynthInput(s, { type: 'noteOn', note: 60, velocity: 100 });
      s = result.state;
      result = processPadSynthInput(s, { type: 'tick', time: 0, deltaTime: 2 });
      s = result.state;
      result = processPadSynthInput(s, { type: 'noteOff', note: 60 });
      s = result.state;

      let foundVoiceEnd = false;
      for (let i = 0; i < 100; i++) {
        result = processPadSynthInput(s, { type: 'tick', time: i * 0.1, deltaTime: 0.1 });
        s = result.state;
        if (result.outputs.some(o => o.type === 'voiceEnd')) {
          foundVoiceEnd = true;
          break;
        }
      }
      expect(foundVoiceEnd).toBe(true);
    });
  });

  describe('midiCC', () => {
    it('CC1 controls mod wheel', () => {
      const result = processPadSynthInput(state, { type: 'midiCC', controller: 1, value: 64 });
      expect(result.state.modWheel).toBeCloseTo(64 / 127, 2);
    });

    it('CC7 controls volume', () => {
      const result = processPadSynthInput(state, { type: 'midiCC', controller: 7, value: 100 });
      expect(result.state.masterVolume).toBeCloseTo(100 / 127, 2);
    });

    it('CC11 controls expression', () => {
      const result = processPadSynthInput(state, { type: 'midiCC', controller: 11, value: 80 });
      expect(result.state.expression).toBeCloseTo(80 / 127, 2);
    });

    it('CC64 controls sustain', () => {
      const result = processPadSynthInput(state, { type: 'midiCC', controller: 64, value: 127 });
      expect(result.state.sustainPedal).toBe(true);
    });

    it('CC120 is all sound off', () => {
      let { state: s1 } = processPadSynthInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      const result = processPadSynthInput(s1, { type: 'midiCC', controller: 120, value: 0 });
      expect(result.state.voices).toHaveLength(0);
    });

    it('CC123 is all notes off', () => {
      let { state: s1 } = processPadSynthInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      const result = processPadSynthInput(s1, { type: 'midiCC', controller: 123, value: 0 });
      for (const voice of result.state.voices) {
        expect(voice.isReleasing).toBe(true);
      }
    });
  });
});

// =============================================================================
// CARD TESTS
// =============================================================================

describe('createPadSynthCard', () => {
  it('creates card with correct meta', () => {
    const card = createPadSynthCard();
    expect(card.meta.id).toBe('pad-synth');
    expect(card.meta.category).toBe('generator');
  });

  it('has MIDI input port', () => {
    const card = createPadSynthCard();
    expect(card.meta.inputPorts.some(p => p.type === 'midi')).toBe(true);
  });

  it('has stereo audio outputs', () => {
    const card = createPadSynthCard();
    const audioOuts = card.meta.outputPorts.filter(p => p.type === 'audio');
    expect(audioOuts.length).toBe(2);
  });

  it('processes input', () => {
    const card = createPadSynthCard();
    const outputs = card.process({ type: 'noteOn', note: 60, velocity: 100 });
    expect(outputs).toContainEqual(expect.objectContaining({ type: 'voiceStart' }));
  });

  it('getState returns current state', () => {
    const card = createPadSynthCard();
    card.process({ type: 'noteOn', note: 60, velocity: 100 });
    const state = card.getState();
    expect(state.voices.length).toBe(1);
  });

  it('reset clears state', () => {
    const card = createPadSynthCard();
    card.process({ type: 'noteOn', note: 60, velocity: 100 });
    card.reset();
    const state = card.getState();
    expect(state.voices).toHaveLength(0);
  });

  it('loadPreset loads preset', () => {
    const card = createPadSynthCard();
    const outputs = card.loadPreset(PAD_SYNTH_PRESETS[10].id);
    expect(outputs).toContainEqual(expect.objectContaining({ type: 'presetLoaded' }));
  });

  it('getPresets returns all presets', () => {
    const card = createPadSynthCard();
    const presets = card.getPresets();
    expect(presets).toEqual(PAD_SYNTH_PRESETS);
  });

  it('getPresetsByCategory filters correctly', () => {
    const card = createPadSynthCard();
    const ambient = card.getPresetsByCategory('ambient');
    expect(ambient.every(p => p.category === 'ambient')).toBe(true);
  });

  it('getActiveVoiceCount is accurate', () => {
    const card = createPadSynthCard();
    expect(card.getActiveVoiceCount()).toBe(0);
    card.process({ type: 'noteOn', note: 60, velocity: 100 });
    card.process({ type: 'noteOn', note: 64, velocity: 100 });
    expect(card.getActiveVoiceCount()).toBe(2);
  });
});
