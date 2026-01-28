/**
 * Organ Card Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  NUM_DRAWBARS,
  DRAWBAR_FOOTAGES,
  DRAWBAR_HARMONICS,
  MAX_POLYPHONY,
  SAMPLE_RATE,
  LESLIE_SLOW_RPM,
  LESLIE_FAST_RPM,
  DEFAULT_DRAWBARS,
  B3_FULL_DRAWBARS,
  DEFAULT_TONEWHEEL,
  DEFAULT_LESLIE,
  DEFAULT_PERCUSSION,
  DEFAULT_VIBRATO,
  DEFAULT_REVERB,
  ORGAN_PRESETS,
  createOrganState,
  noteToFrequency,
  getTonewheelFrequencies,
  getLeslieTargetSpeeds,
  processOrganInput,
  createOrganCard,
  OrganState,
  OrganCategory,
  LeslieState,
} from './organ';

// =============================================================================
// CONSTANTS TESTS
// =============================================================================

describe('Organ Constants', () => {
  it('has 9 drawbars', () => {
    expect(NUM_DRAWBARS).toBe(9);
  });

  it('has correct drawbar footages', () => {
    expect(DRAWBAR_FOOTAGES).toHaveLength(9);
    expect(DRAWBAR_FOOTAGES[0]).toBe('16\'');
    expect(DRAWBAR_FOOTAGES[2]).toBe('8\'');
  });

  it('has correct harmonic ratios', () => {
    expect(DRAWBAR_HARMONICS).toHaveLength(9);
    expect(DRAWBAR_HARMONICS[0]).toBe(0.5); // Sub-octave
    expect(DRAWBAR_HARMONICS[2]).toBe(1); // Fundamental
    expect(DRAWBAR_HARMONICS[5]).toBe(4); // 2nd octave
  });

  it('has correct polyphony for organ', () => {
    expect(MAX_POLYPHONY).toBe(61);
  });

  it('has correct Leslie speeds', () => {
    expect(LESLIE_SLOW_RPM).toBe(40);
    expect(LESLIE_FAST_RPM).toBe(340);
  });
});

// =============================================================================
// DEFAULT VALUES TESTS
// =============================================================================

describe('Default Values', () => {
  describe('DEFAULT_DRAWBARS', () => {
    it('all zeros', () => {
      expect(DEFAULT_DRAWBARS.every(d => d === 0)).toBe(true);
    });
  });

  describe('B3_FULL_DRAWBARS', () => {
    it('all eights', () => {
      expect(B3_FULL_DRAWBARS.every(d => d === 8)).toBe(true);
    });
  });

  describe('DEFAULT_TONEWHEEL', () => {
    it('has leakage', () => {
      expect(DEFAULT_TONEWHEEL.leakage).toBeGreaterThan(0);
    });

    it('has key click', () => {
      expect(DEFAULT_TONEWHEEL.keyClickLevel).toBeGreaterThan(0);
    });

    it('has aging', () => {
      expect(DEFAULT_TONEWHEEL.aging).toBeGreaterThan(0);
    });
  });

  describe('DEFAULT_LESLIE', () => {
    it('is enabled', () => {
      expect(DEFAULT_LESLIE.enabled).toBe(true);
    });

    it('starts slow', () => {
      expect(DEFAULT_LESLIE.state).toBe('slow');
    });

    it('has correct cabinet type', () => {
      expect(DEFAULT_LESLIE.cabinetType).toBe('122');
    });

    it('has drive', () => {
      expect(DEFAULT_LESLIE.drive).toBeGreaterThan(0);
    });
  });

  describe('DEFAULT_PERCUSSION', () => {
    it('is enabled', () => {
      expect(DEFAULT_PERCUSSION.enabled).toBe(true);
    });

    it('has 2nd harmonic by default', () => {
      expect(DEFAULT_PERCUSSION.harmonic).toBe('2nd');
    });

    it('has fast decay', () => {
      expect(DEFAULT_PERCUSSION.decay).toBe('fast');
    });
  });

  describe('DEFAULT_VIBRATO', () => {
    it('upper is C3', () => {
      expect(DEFAULT_VIBRATO.upperMode).toBe('c3');
    });

    it('lower is off', () => {
      expect(DEFAULT_VIBRATO.lowerMode).toBe('off');
    });
  });

  describe('DEFAULT_REVERB', () => {
    it('is enabled', () => {
      expect(DEFAULT_REVERB.enabled).toBe(true);
    });

    it('is spring type', () => {
      expect(DEFAULT_REVERB.type).toBe('spring');
    });
  });
});

// =============================================================================
// FACTORY PRESETS TESTS
// =============================================================================

describe('Factory Presets', () => {
  it('has many presets', () => {
    expect(ORGAN_PRESETS.length).toBeGreaterThan(35);
  });

  it('all presets have required fields', () => {
    for (const preset of ORGAN_PRESETS) {
      expect(preset.id).toBeDefined();
      expect(preset.name).toBeDefined();
      expect(preset.category).toBeDefined();
      expect(preset.upperDrawbars).toHaveLength(9);
      expect(preset.lowerDrawbars).toHaveLength(9);
      expect(preset.pedalDrawbars).toHaveLength(9);
      expect(preset.tonewheel).toBeDefined();
      expect(preset.percussion).toBeDefined();
      expect(preset.vibrato).toBeDefined();
      expect(preset.leslie).toBeDefined();
      expect(preset.reverb).toBeDefined();
    }
  });

  it('all presets are marked as factory', () => {
    for (const preset of ORGAN_PRESETS) {
      expect(preset.isFactory).toBe(true);
    }
  });

  it('has unique preset IDs', () => {
    const ids = ORGAN_PRESETS.map(p => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('drawbar values are 0-8', () => {
    for (const preset of ORGAN_PRESETS) {
      for (const value of preset.upperDrawbars) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(8);
      }
    }
  });

  describe('Categories', () => {
    const categories: OrganCategory[] = [
      'jazz', 'rock', 'gospel', 'blues', 'classical',
      'theatre', 'ballad', 'soul', 'combo', 'full', 'liturgical'
    ];

    it.each(categories)('has presets in %s category', (category) => {
      const categoryPresets = ORGAN_PRESETS.filter(p => p.category === category);
      expect(categoryPresets.length).toBeGreaterThan(0);
    });
  });

  describe('Organ Models', () => {
    it('has Hammond B3 presets', () => {
      const b3 = ORGAN_PRESETS.filter(p => p.model === 'hammondB3');
      expect(b3.length).toBeGreaterThan(10);
    });

    it('has pipe organ presets', () => {
      const pipe = ORGAN_PRESETS.filter(p => p.model.includes('Pipe'));
      expect(pipe.length).toBeGreaterThan(0);
    });

    it('has combo organ presets', () => {
      const vox = ORGAN_PRESETS.filter(p => p.model === 'voxContinental');
      const farfisa = ORGAN_PRESETS.filter(p => p.model === 'farfisaCompact');
      expect(vox.length + farfisa.length).toBeGreaterThan(0);
    });
  });
});

// =============================================================================
// STATE FACTORY TESTS
// =============================================================================

describe('createOrganState', () => {
  it('creates initial state', () => {
    const state = createOrganState();
    expect(state).toBeDefined();
    expect(state.preset).toBeDefined();
    expect(state.notes).toEqual([]);
    expect(state.heldNotes.size).toBe(0);
  });

  it('uses first preset by default', () => {
    const state = createOrganState();
    expect(state.preset.id).toBe(ORGAN_PRESETS[0].id);
  });

  it('accepts custom preset', () => {
    const preset = ORGAN_PRESETS[10];
    const state = createOrganState(preset);
    expect(state.preset.id).toBe(preset.id);
  });

  it('initializes Leslie state', () => {
    const state = createOrganState();
    expect(state.leslieState).toBeDefined();
    expect(state.leslieState.hornAngle).toBe(0);
    expect(state.leslieState.drumAngle).toBe(0);
  });

  it('initializes expression pedal to full', () => {
    const state = createOrganState();
    expect(state.expressionPedal).toBe(1.0);
  });

  it('copies upper drawbars', () => {
    const state = createOrganState();
    expect(state.currentUpperDrawbars).toEqual(state.preset.upperDrawbars);
  });
});

// =============================================================================
// HELPER FUNCTION TESTS
// =============================================================================

describe('noteToFrequency', () => {
  it('returns 440 Hz for A4', () => {
    expect(noteToFrequency(69)).toBeCloseTo(440, 1);
  });

  it('returns 261.63 Hz for middle C', () => {
    expect(noteToFrequency(60)).toBeCloseTo(261.63, 1);
  });
});

describe('getTonewheelFrequencies', () => {
  it('returns 9 frequencies', () => {
    const freqs = getTonewheelFrequencies(60);
    expect(freqs).toHaveLength(9);
  });

  it('includes sub-octave', () => {
    const freqs = getTonewheelFrequencies(60);
    const baseFreq = noteToFrequency(60);
    expect(freqs[0]).toBeCloseTo(baseFreq * 0.5, 1);
  });

  it('includes fundamental', () => {
    const freqs = getTonewheelFrequencies(60);
    const baseFreq = noteToFrequency(60);
    expect(freqs[2]).toBeCloseTo(baseFreq, 1);
  });
});

describe('getLeslieTargetSpeeds', () => {
  it('returns fast speeds for fast state', () => {
    const speeds = getLeslieTargetSpeeds('fast', DEFAULT_LESLIE);
    expect(speeds.hornSpeed).toBe(DEFAULT_LESLIE.hornFastSpeed);
    expect(speeds.drumSpeed).toBe(DEFAULT_LESLIE.drumFastSpeed);
  });

  it('returns slow speeds for slow state', () => {
    const speeds = getLeslieTargetSpeeds('slow', DEFAULT_LESLIE);
    expect(speeds.hornSpeed).toBe(DEFAULT_LESLIE.hornSlowSpeed);
    expect(speeds.drumSpeed).toBe(DEFAULT_LESLIE.drumSlowSpeed);
  });

  it('returns zero for stop', () => {
    const speeds = getLeslieTargetSpeeds('stop', DEFAULT_LESLIE);
    expect(speeds.hornSpeed).toBe(0);
    expect(speeds.drumSpeed).toBe(0);
  });

  it('returns zero for brake', () => {
    const speeds = getLeslieTargetSpeeds('brake', DEFAULT_LESLIE);
    expect(speeds.hornSpeed).toBe(0);
    expect(speeds.drumSpeed).toBe(0);
  });
});

// =============================================================================
// INPUT PROCESSING TESTS
// =============================================================================

describe('processOrganInput', () => {
  let state: OrganState;

  beforeEach(() => {
    state = createOrganState();
  });

  describe('noteOn', () => {
    it('adds a note', () => {
      const result = processOrganInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      expect(result.state.notes).toHaveLength(1);
    });

    it('outputs noteStart event', () => {
      const result = processOrganInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      expect(result.outputs).toContainEqual(expect.objectContaining({ type: 'noteStart', note: 60 }));
    });

    it('adds note to held notes', () => {
      const result = processOrganInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      expect(result.state.heldNotes.has(60)).toBe(true);
    });

    it('velocity 0 triggers noteOff', () => {
      const { state: state1 } = processOrganInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      const result = processOrganInput(state1, { type: 'noteOn', note: 60, velocity: 0 });
      expect(result.state.notes).toHaveLength(0);
    });

    it('does not duplicate notes', () => {
      const { state: state1 } = processOrganInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      const result = processOrganInput(state1, { type: 'noteOn', note: 60, velocity: 100 });
      expect(result.state.notes).toHaveLength(1);
    });

    it('initializes percussion envelope', () => {
      const result = processOrganInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      expect(result.state.notes[0].percEnvValue).toBe(1);
    });

    it('initializes key click', () => {
      const result = processOrganInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      expect(result.state.notes[0].keyClickValue).toBeGreaterThan(0);
    });
  });

  describe('noteOff', () => {
    it('removes note', () => {
      const { state: state1 } = processOrganInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      const result = processOrganInput(state1, { type: 'noteOff', note: 60 });
      expect(result.state.notes).toHaveLength(0);
    });

    it('outputs noteEnd event', () => {
      const { state: state1 } = processOrganInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      const result = processOrganInput(state1, { type: 'noteOff', note: 60 });
      expect(result.outputs).toContainEqual({ type: 'noteEnd', note: 60 });
    });

    it('removes note from held notes', () => {
      const { state: state1 } = processOrganInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      const result = processOrganInput(state1, { type: 'noteOff', note: 60 });
      expect(result.state.heldNotes.has(60)).toBe(false);
    });

    it('sustain pedal keeps notes', () => {
      let { state: s1 } = processOrganInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      ({ state: s1 } = processOrganInput(s1, { type: 'sustainPedal', value: true }));
      const result = processOrganInput(s1, { type: 'noteOff', note: 60 });
      expect(result.state.notes).toHaveLength(1);
    });
  });

  describe('expression', () => {
    it('sets expression pedal', () => {
      const result = processOrganInput(state, { type: 'expression', value: 0.5 });
      expect(result.state.expressionPedal).toBe(0.5);
    });

    it('clamps to valid range', () => {
      const result = processOrganInput(state, { type: 'expression', value: 1.5 });
      expect(result.state.expressionPedal).toBe(1);
    });
  });

  describe('swell', () => {
    it('sets swell pedal', () => {
      const result = processOrganInput(state, { type: 'swell', value: 0.7 });
      expect(result.state.swellPedal).toBe(0.7);
    });
  });

  describe('sustainPedal', () => {
    it('sets sustain', () => {
      const result = processOrganInput(state, { type: 'sustainPedal', value: true });
      expect(result.state.sustainPedal).toBe(true);
    });

    it('releases notes when pedal released', () => {
      let { state: s1 } = processOrganInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      ({ state: s1 } = processOrganInput(s1, { type: 'sustainPedal', value: true }));
      ({ state: s1 } = processOrganInput(s1, { type: 'noteOff', note: 60 }));
      expect(s1.notes).toHaveLength(1); // Still held by sustain
      const result = processOrganInput(s1, { type: 'sustainPedal', value: false });
      expect(result.state.notes).toHaveLength(0);
    });
  });

  describe('leslie', () => {
    it('sets Leslie state', () => {
      const result = processOrganInput(state, { type: 'leslie', state: 'fast' });
      expect(result.state.preset.leslie.state).toBe('fast');
    });

    it('outputs leslieStateChanged', () => {
      const result = processOrganInput(state, { type: 'leslie', state: 'fast' });
      expect(result.outputs).toContainEqual({ type: 'leslieStateChanged', state: 'fast' });
    });

    it('updates target speeds', () => {
      const result = processOrganInput(state, { type: 'leslie', state: 'fast' });
      expect(result.state.leslieState.targetHornSpeed).toBe(state.preset.leslie.hornFastSpeed);
    });
  });

  describe('leslieToggle', () => {
    it('toggles slow to fast', () => {
      const slowState = { ...state, preset: { ...state.preset, leslie: { ...state.preset.leslie, state: 'slow' as LeslieState } } };
      const result = processOrganInput(slowState, { type: 'leslieToggle' });
      expect(result.state.preset.leslie.state).toBe('fast');
    });

    it('toggles fast to slow', () => {
      const fastState = { ...state, preset: { ...state.preset, leslie: { ...state.preset.leslie, state: 'fast' as LeslieState } } };
      const result = processOrganInput(fastState, { type: 'leslieToggle' });
      expect(result.state.preset.leslie.state).toBe('slow');
    });
  });

  describe('drawbar', () => {
    it('sets individual drawbar', () => {
      const result = processOrganInput(state, { type: 'drawbar', drawbarIndex: 0, value: 5 });
      expect(result.state.currentUpperDrawbars[0]).toBe(5);
    });

    it('clamps value to 0-8', () => {
      const result = processOrganInput(state, { type: 'drawbar', drawbarIndex: 0, value: 15 });
      expect(result.state.currentUpperDrawbars[0]).toBe(8);
    });

    it('rounds to integer', () => {
      const result = processOrganInput(state, { type: 'drawbar', drawbarIndex: 0, value: 5.7 });
      expect(result.state.currentUpperDrawbars[0]).toBe(6);
    });
  });

  describe('drawbars', () => {
    it('sets all drawbars', () => {
      const values: [number, number, number, number, number, number, number, number, number] = [8, 8, 8, 4, 4, 4, 2, 2, 2];
      const result = processOrganInput(state, { type: 'drawbars', values });
      expect(result.state.currentUpperDrawbars).toEqual(values);
    });
  });

  describe('percussion', () => {
    it('updates percussion config', () => {
      const result = processOrganInput(state, {
        type: 'percussion',
        config: { enabled: false, harmonic: '3rd' },
      });
      expect(result.state.preset.percussion.enabled).toBe(false);
      expect(result.state.preset.percussion.harmonic).toBe('3rd');
    });
  });

  describe('vibrato', () => {
    it('updates vibrato config', () => {
      const result = processOrganInput(state, {
        type: 'vibrato',
        config: { upperMode: 'v2' },
      });
      expect(result.state.preset.vibrato.upperMode).toBe('v2');
    });
  });

  describe('allNotesOff', () => {
    it('clears all notes', () => {
      let { state: s1 } = processOrganInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      ({ state: s1 } = processOrganInput(s1, { type: 'noteOn', note: 64, velocity: 100 }));
      const result = processOrganInput(s1, { type: 'allNotesOff' });
      expect(result.state.notes).toHaveLength(0);
    });

    it('outputs noteEnd for each note', () => {
      let { state: s1 } = processOrganInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      ({ state: s1 } = processOrganInput(s1, { type: 'noteOn', note: 64, velocity: 100 }));
      const result = processOrganInput(s1, { type: 'allNotesOff' });
      const noteEnds = result.outputs.filter(o => o.type === 'noteEnd');
      expect(noteEnds).toHaveLength(2);
    });
  });

  describe('loadPreset', () => {
    it('loads existing preset', () => {
      const targetPreset = ORGAN_PRESETS[10];
      const result = processOrganInput(state, { type: 'loadPreset', presetId: targetPreset.id });
      expect(result.state.preset.id).toBe(targetPreset.id);
    });

    it('outputs presetLoaded event', () => {
      const targetPreset = ORGAN_PRESETS[5];
      const result = processOrganInput(state, { type: 'loadPreset', presetId: targetPreset.id });
      expect(result.outputs).toContainEqual({ type: 'presetLoaded', presetId: targetPreset.id });
    });

    it('outputs error for unknown preset', () => {
      const result = processOrganInput(state, { type: 'loadPreset', presetId: 'nonexistent' });
      expect(result.outputs).toContainEqual(expect.objectContaining({ type: 'error' }));
    });
  });

  describe('setVolume', () => {
    it('sets master volume', () => {
      const result = processOrganInput(state, { type: 'setVolume', volume: 0.5 });
      expect(result.state.masterVolume).toBe(0.5);
    });
  });

  describe('setLeslie', () => {
    it('updates Leslie config', () => {
      const result = processOrganInput(state, {
        type: 'setLeslie',
        config: { drive: 0.8, hornLevel: 0.9 },
      });
      expect(result.state.preset.leslie.drive).toBe(0.8);
      expect(result.state.preset.leslie.hornLevel).toBe(0.9);
    });
  });

  describe('setReverb', () => {
    it('updates reverb config', () => {
      const result = processOrganInput(state, {
        type: 'setReverb',
        config: { type: 'hall', mix: 0.5 },
      });
      expect(result.state.preset.reverb.type).toBe('hall');
      expect(result.state.preset.reverb.mix).toBe(0.5);
    });
  });

  describe('tick', () => {
    it('updates Leslie rotation', () => {
      const result = processOrganInput(state, { type: 'tick', time: 0, deltaTime: 0.1 });
      // With slow speed, angles should have changed
      if (state.preset.leslie.state === 'slow') {
        expect(result.state.leslieState.hornAngle).toBeGreaterThan(0);
      }
    });

    it('updates percussion decay', () => {
      let { state: s1 } = processOrganInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      const initialPerc = s1.notes[0].percEnvValue;
      const result = processOrganInput(s1, { type: 'tick', time: 0, deltaTime: 0.1 });
      expect(result.state.notes[0].percEnvValue).toBeLessThan(initialPerc);
    });

    it('updates key click decay', () => {
      let { state: s1 } = processOrganInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      const initialClick = s1.notes[0].keyClickValue;
      const result = processOrganInput(s1, { type: 'tick', time: 0, deltaTime: 0.1 });
      expect(result.state.notes[0].keyClickValue).toBeLessThan(initialClick);
    });

    it('updates scanner phase', () => {
      const result = processOrganInput(state, { type: 'tick', time: 0, deltaTime: 0.1 });
      expect(result.state.scannerPhase).toBeGreaterThan(0);
    });

    it('accelerates Leslie towards target', () => {
      let s = processOrganInput(state, { type: 'leslie', state: 'fast' }).state;
      const initialSpeed = s.leslieState.hornSpeed;
      const targetSpeed = s.leslieState.targetHornSpeed;
      
      if (initialSpeed < targetSpeed) {
        s = processOrganInput(s, { type: 'tick', time: 0, deltaTime: 0.1 }).state;
        expect(s.leslieState.hornSpeed).toBeGreaterThan(initialSpeed);
      }
    });
  });

  describe('midiCC', () => {
    it('CC1 controls Leslie fast/slow', () => {
      const result = processOrganInput(state, { type: 'midiCC', controller: 1, value: 127 });
      expect(result.state.preset.leslie.state).toBe('fast');
    });

    it('CC7 controls volume', () => {
      const result = processOrganInput(state, { type: 'midiCC', controller: 7, value: 100 });
      expect(result.state.masterVolume).toBeCloseTo(100 / 127, 2);
    });

    it('CC11 controls expression', () => {
      const result = processOrganInput(state, { type: 'midiCC', controller: 11, value: 80 });
      expect(result.state.expressionPedal).toBeCloseTo(80 / 127, 2);
    });

    it('CC64 controls sustain', () => {
      const result = processOrganInput(state, { type: 'midiCC', controller: 64, value: 127 });
      expect(result.state.sustainPedal).toBe(true);
    });

    it('CC12-20 control drawbars', () => {
      const result = processOrganInput(state, { type: 'midiCC', controller: 12, value: 127 });
      expect(result.state.currentUpperDrawbars[0]).toBe(8);
    });

    it('CC120 is all sound off', () => {
      let { state: s1 } = processOrganInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      const result = processOrganInput(s1, { type: 'midiCC', controller: 120, value: 0 });
      expect(result.state.notes).toHaveLength(0);
    });

    it('CC123 is all notes off', () => {
      let { state: s1 } = processOrganInput(state, { type: 'noteOn', note: 60, velocity: 100 });
      const result = processOrganInput(s1, { type: 'midiCC', controller: 123, value: 0 });
      expect(result.state.notes).toHaveLength(0);
    });
  });
});

// =============================================================================
// CARD TESTS
// =============================================================================

describe('createOrganCard', () => {
  it('creates card with correct meta', () => {
    const card = createOrganCard();
    expect(card.meta.id).toBe('organ');
    expect(card.meta.category).toBe('generator');
  });

  it('has MIDI input port', () => {
    const card = createOrganCard();
    expect(card.meta.inputPorts.some(p => p.type === 'midi')).toBe(true);
  });

  it('has stereo audio outputs', () => {
    const card = createOrganCard();
    const audioOuts = card.meta.outputPorts.filter(p => p.type === 'audio');
    expect(audioOuts.length).toBe(2);
  });

  it('has drawbar parameters', () => {
    const card = createOrganCard();
    const drawbarParams = card.meta.parameters.filter(p => p.id.startsWith('drawbar'));
    expect(drawbarParams.length).toBeGreaterThan(0);
  });

  it('processes input', () => {
    const card = createOrganCard();
    const outputs = card.process({ type: 'noteOn', note: 60, velocity: 100 });
    expect(outputs).toContainEqual(expect.objectContaining({ type: 'noteStart' }));
  });

  it('getState returns current state', () => {
    const card = createOrganCard();
    card.process({ type: 'noteOn', note: 60, velocity: 100 });
    const state = card.getState();
    expect(state.notes.length).toBe(1);
  });

  it('reset clears state', () => {
    const card = createOrganCard();
    card.process({ type: 'noteOn', note: 60, velocity: 100 });
    card.reset();
    const state = card.getState();
    expect(state.notes).toHaveLength(0);
  });

  it('loadPreset loads preset', () => {
    const card = createOrganCard();
    const outputs = card.loadPreset(ORGAN_PRESETS[10].id);
    expect(outputs).toContainEqual(expect.objectContaining({ type: 'presetLoaded' }));
  });

  it('getPresets returns all presets', () => {
    const card = createOrganCard();
    const presets = card.getPresets();
    expect(presets).toEqual(ORGAN_PRESETS);
  });

  it('getPresetsByCategory filters correctly', () => {
    const card = createOrganCard();
    const jazz = card.getPresetsByCategory('jazz');
    expect(jazz.every(p => p.category === 'jazz')).toBe(true);
  });

  it('setDrawbar sets individual drawbar', () => {
    const card = createOrganCard();
    card.setDrawbar(0, 5);
    expect(card.getState().currentUpperDrawbars[0]).toBe(5);
  });

  it('setDrawbars sets all drawbars', () => {
    const card = createOrganCard();
    const values: [number, number, number, number, number, number, number, number, number] = [8, 8, 8, 0, 0, 0, 0, 0, 0];
    card.setDrawbars(values);
    expect(card.getState().currentUpperDrawbars).toEqual(values);
  });

  it('toggleLeslie toggles state', () => {
    const card = createOrganCard();
    const initialState = card.getLeslieState();
    card.toggleLeslie();
    const newState = card.getLeslieState();
    expect(newState).not.toBe(initialState);
  });

  it('getLeslieState returns current Leslie state', () => {
    const card = createOrganCard();
    expect(['stop', 'slow', 'fast', 'brake']).toContain(card.getLeslieState());
  });

  it('getActiveNoteCount is accurate', () => {
    const card = createOrganCard();
    expect(card.getActiveNoteCount()).toBe(0);
    card.process({ type: 'noteOn', note: 60, velocity: 100 });
    card.process({ type: 'noteOn', note: 64, velocity: 100 });
    expect(card.getActiveNoteCount()).toBe(2);
  });
});
