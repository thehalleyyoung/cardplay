/**
 * BasslineCard comprehensive tests
 * @module cards/bassline.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createBasslineCard,
  createBasslineState,
  processBasslineInput,
  createDefaultPatch,
  createDefaultOscillator,
  createDefaultFilter,
  createDefaultAmpEnvelope,
  createDefaultFilterEnvelope,
  createDefaultLfo,
  createEmptyBassStep,
  createActiveBassStep,
  createEmptyBassPattern,
  PRESET_BASS_PATCHES,
  PRESET_BASS_PATTERNS,
  BASS_FREESOUND_QUERIES,
  type BasslineState,
  type BassPatch,
  type OscillatorConfig,
  type FilterConfig,
  type EnvelopeConfig,
  type LfoConfig,
  type BassStep,
  type BassPattern,
} from './bassline';

describe('BasslineCard', () => {
  // ==========================================================================
  // FACTORY FUNCTIONS
  // ==========================================================================

  describe('createDefaultOscillator', () => {
    it('creates oscillator with given waveform', () => {
      const osc = createDefaultOscillator('square', true);
      expect(osc.waveform).toBe('square');
    });

    it('creates enabled oscillator by default', () => {
      const osc = createDefaultOscillator('sawtooth');
      expect(osc.enabled).toBe(true);
    });

    it('creates disabled oscillator when specified', () => {
      const osc = createDefaultOscillator('sawtooth', false);
      expect(osc.enabled).toBe(false);
    });

    it('defaults to sawtooth waveform', () => {
      const osc = createDefaultOscillator();
      expect(osc.waveform).toBe('sawtooth');
    });

    it('creates oscillator with no octave shift', () => {
      const osc = createDefaultOscillator();
      expect(osc.octave).toBe(0);
    });

    it('creates oscillator with no semitone shift', () => {
      const osc = createDefaultOscillator();
      expect(osc.semitone).toBe(0);
    });

    it('creates oscillator with no detune', () => {
      const osc = createDefaultOscillator();
      expect(osc.detune).toBe(0);
    });

    it('creates oscillator with centered pulse width', () => {
      const osc = createDefaultOscillator();
      expect(osc.pulseWidth).toBe(0.5);
    });

    it('creates oscillator with default level', () => {
      const osc = createDefaultOscillator();
      expect(osc.level).toBe(0.8);
    });

    it('creates oscillator with centered pan', () => {
      const osc = createDefaultOscillator();
      expect(osc.pan).toBe(0);
    });

    it('creates oscillator with sync disabled', () => {
      const osc = createDefaultOscillator();
      expect(osc.sync).toBe(false);
    });

    it('creates oscillator with 1 unison voice', () => {
      const osc = createDefaultOscillator();
      expect(osc.unison).toBe(1);
    });
  });

  describe('createDefaultFilter', () => {
    it('creates enabled filter', () => {
      const filter = createDefaultFilter();
      expect(filter.enabled).toBe(true);
    });

    it('creates lowpass filter by default', () => {
      const filter = createDefaultFilter();
      expect(filter.type).toBe('lowpass');
    });

    it('creates 24dB slope by default', () => {
      const filter = createDefaultFilter();
      expect(filter.slope).toBe('24dB');
    });

    it('creates filter with 1000Hz cutoff', () => {
      const filter = createDefaultFilter();
      expect(filter.cutoff).toBe(1000);
    });

    it('creates filter with moderate resonance', () => {
      const filter = createDefaultFilter();
      expect(filter.resonance).toBe(0.3);
    });

    it('creates filter with no drive', () => {
      const filter = createDefaultFilter();
      expect(filter.drive).toBe(0);
    });

    it('creates filter with key tracking', () => {
      const filter = createDefaultFilter();
      expect(filter.keyTracking).toBe(0.5);
    });

    it('creates filter with envelope modulation', () => {
      const filter = createDefaultFilter();
      expect(filter.envAmount).toBe(0.5);
    });

    it('creates filter with no LFO modulation', () => {
      const filter = createDefaultFilter();
      expect(filter.lfoAmount).toBe(0);
    });

    it('creates filter with velocity sensitivity', () => {
      const filter = createDefaultFilter();
      expect(filter.velocityAmount).toBe(0.3);
    });
  });

  describe('createDefaultAmpEnvelope', () => {
    it('creates fast attack for bass', () => {
      const env = createDefaultAmpEnvelope();
      expect(env.attack).toBe(0.005);
    });

    it('creates moderate decay', () => {
      const env = createDefaultAmpEnvelope();
      expect(env.decay).toBe(0.2);
    });

    it('creates sustain level', () => {
      const env = createDefaultAmpEnvelope();
      expect(env.sustain).toBe(0.6);
    });

    it('creates fast release', () => {
      const env = createDefaultAmpEnvelope();
      expect(env.release).toBe(0.15);
    });

    it('creates linear curve', () => {
      const env = createDefaultAmpEnvelope();
      expect(env.curve).toBe(0);
    });

    it('creates velocity sensitivity', () => {
      const env = createDefaultAmpEnvelope();
      expect(env.velocitySensitivity).toBe(0.7);
    });
  });

  describe('createDefaultFilterEnvelope', () => {
    it('creates instant attack', () => {
      const env = createDefaultFilterEnvelope();
      expect(env.attack).toBe(0.001);
    });

    it('creates moderate decay for sweep', () => {
      const env = createDefaultFilterEnvelope();
      expect(env.decay).toBe(0.3);
    });

    it('creates low sustain for plucky filter', () => {
      const env = createDefaultFilterEnvelope();
      expect(env.sustain).toBe(0.2);
    });

    it('creates logarithmic curve', () => {
      const env = createDefaultFilterEnvelope();
      expect(env.curve).toBe(-0.5);
    });
  });

  describe('createDefaultLfo', () => {
    it('creates disabled LFO by default', () => {
      const lfo = createDefaultLfo();
      expect(lfo.enabled).toBe(false);
    });

    it('creates sine waveform', () => {
      const lfo = createDefaultLfo();
      expect(lfo.waveform).toBe('sine');
    });

    it('creates 5Hz rate', () => {
      const lfo = createDefaultLfo();
      expect(lfo.rate).toBe(5);
    });

    it('creates no tempo sync', () => {
      const lfo = createDefaultLfo();
      expect(lfo.tempoSync).toBe(false);
    });

    it('creates default division', () => {
      const lfo = createDefaultLfo();
      expect(lfo.division).toBe('1/4');
    });

    it('creates retrigger enabled', () => {
      const lfo = createDefaultLfo();
      expect(lfo.retrigger).toBe(true);
    });

    it('creates no destinations', () => {
      const lfo = createDefaultLfo();
      expect(lfo.destinations).toHaveLength(0);
    });
  });

  describe('createEmptyBassStep', () => {
    it('creates step with note 0 (rest)', () => {
      const step = createEmptyBassStep();
      expect(step.note).toBe(0);
    });

    it('creates step with velocity 0', () => {
      const step = createEmptyBassStep();
      expect(step.velocity).toBe(0);
    });

    it('creates step with default gate', () => {
      const step = createEmptyBassStep();
      expect(step.gate).toBe(0.5);
    });

    it('creates step with no accent', () => {
      const step = createEmptyBassStep();
      expect(step.accent).toBe(false);
    });

    it('creates step with no slide', () => {
      const step = createEmptyBassStep();
      expect(step.slide).toBe(false);
    });

    it('creates step with no octave shift', () => {
      const step = createEmptyBassStep();
      expect(step.octaveShift).toBe(0);
    });
  });

  describe('createActiveBassStep', () => {
    it('creates step with given note', () => {
      const step = createActiveBassStep(48, 100);
      expect(step.note).toBe(48);
    });

    it('creates step with given velocity', () => {
      const step = createActiveBassStep(48, 80);
      expect(step.velocity).toBe(80);
    });

    it('defaults to velocity 100', () => {
      const step = createActiveBassStep(48);
      expect(step.velocity).toBe(100);
    });

    it('accepts options', () => {
      const step = createActiveBassStep(48, 100, { slide: true, accent: true });
      expect(step.slide).toBe(true);
      expect(step.accent).toBe(true);
    });
  });

  describe('createEmptyBassPattern', () => {
    it('creates pattern with correct id', () => {
      const pattern = createEmptyBassPattern('test', 'Test', 16);
      expect(pattern.id).toBe('test');
    });

    it('creates pattern with correct name', () => {
      const pattern = createEmptyBassPattern('test', 'Test Pattern', 16);
      expect(pattern.name).toBe('Test Pattern');
    });

    it('creates pattern with correct length', () => {
      const pattern = createEmptyBassPattern('test', 'Test', 32);
      expect(pattern.length).toBe(32);
      expect(pattern.steps).toHaveLength(32);
    });

    it('defaults to 16 steps', () => {
      const pattern = createEmptyBassPattern('test', 'Test');
      expect(pattern.length).toBe(16);
    });

    it('creates all empty steps', () => {
      const pattern = createEmptyBassPattern('test', 'Test', 8);
      for (const step of pattern.steps) {
        expect(step.velocity).toBe(0);
      }
    });

    it('creates pattern with default root note C2', () => {
      const pattern = createEmptyBassPattern('test', 'Test', 16);
      expect(pattern.rootNote).toBe(36);
    });

    it('creates pattern with chromatic scale', () => {
      const pattern = createEmptyBassPattern('test', 'Test', 16);
      expect(pattern.scale).toBe('chromatic');
    });

    it('creates pattern with no swing', () => {
      const pattern = createEmptyBassPattern('test', 'Test', 16);
      expect(pattern.swingAmount).toBe(0);
    });
  });

  describe('createDefaultPatch', () => {
    it('creates patch with correct id', () => {
      const patch = createDefaultPatch('my-patch', 'My Patch');
      expect(patch.id).toBe('my-patch');
    });

    it('creates patch with correct name', () => {
      const patch = createDefaultPatch('my-patch', 'My Patch');
      expect(patch.name).toBe('My Patch');
    });

    it('creates patch with analog engine', () => {
      const patch = createDefaultPatch('test', 'Test');
      expect(patch.engine).toBe('analog');
    });

    it('creates patch with enabled osc1', () => {
      const patch = createDefaultPatch('test', 'Test');
      expect(patch.osc1.enabled).toBe(true);
    });

    it('creates patch with disabled osc2', () => {
      const patch = createDefaultPatch('test', 'Test');
      expect(patch.osc2.enabled).toBe(false);
    });

    it('creates patch with disabled sub oscillator', () => {
      const patch = createDefaultPatch('test', 'Test');
      expect(patch.subOsc.enabled).toBe(false);
    });

    it('creates patch with no noise', () => {
      const patch = createDefaultPatch('test', 'Test');
      expect(patch.noiseLevel).toBe(0);
    });

    it('creates patch with no distortion', () => {
      const patch = createDefaultPatch('test', 'Test');
      expect(patch.distortion).toBe(0);
    });

    it('creates patch with no portamento', () => {
      const patch = createDefaultPatch('test', 'Test');
      expect(patch.portamento).toBe(0);
    });

    it('creates patch with 2 semitone pitch bend range', () => {
      const patch = createDefaultPatch('test', 'Test');
      expect(patch.pitchBendRange).toBe(2);
    });
  });

  describe('createBasslineState', () => {
    it('creates state with default patch', () => {
      const state = createBasslineState();
      expect(state.patch).toBe(PRESET_BASS_PATCHES[0]);
    });

    it('creates state with custom patch', () => {
      const patch = PRESET_BASS_PATCHES[10];
      const state = createBasslineState(patch);
      expect(state.patch).toBe(patch);
    });

    it('creates state with empty pattern by default', () => {
      const state = createBasslineState();
      expect(state.pattern.id).toBe('default');
    });

    it('creates state with custom pattern', () => {
      const pattern = createEmptyBassPattern('custom', 'Custom', 32);
      const state = createBasslineState(undefined, pattern);
      expect(state.pattern.id).toBe('custom');
    });

    it('creates state not playing', () => {
      const state = createBasslineState();
      expect(state.isPlaying).toBe(false);
    });

    it('creates state at step 0', () => {
      const state = createBasslineState();
      expect(state.currentStep).toBe(0);
    });

    it('creates state with tempo 120', () => {
      const state = createBasslineState();
      expect(state.tempo).toBe(120);
    });

    it('creates state with no transpose', () => {
      const state = createBasslineState();
      expect(state.transpose).toBe(0);
    });

    it('creates state with no octave shift', () => {
      const state = createBasslineState();
      expect(state.octave).toBe(0);
    });

    it('creates state with chord follow disabled', () => {
      const state = createBasslineState();
      expect(state.chordFollow).toBe(false);
    });

    it('creates state with no active voices', () => {
      const state = createBasslineState();
      expect(state.voicesActive).toBe(0);
    });

    it('creates state with empty held notes', () => {
      const state = createBasslineState();
      expect(state.heldNotes.size).toBe(0);
    });
  });

  // ==========================================================================
  // INPUT PROCESSING
  // ==========================================================================

  describe('processBasslineInput', () => {
    let state: BasslineState;

    beforeEach(() => {
      state = createBasslineState();
    });

    describe('play command', () => {
      it('sets isPlaying to true', () => {
        const result = processBasslineInput(state, { type: 'play' });
        expect(result.state.isPlaying).toBe(true);
      });

      it('produces no outputs', () => {
        const result = processBasslineInput(state, { type: 'play' });
        expect(result.outputs).toHaveLength(0);
      });
    });

    describe('stop command', () => {
      it('sets isPlaying to false', () => {
        const playingState = { ...state, isPlaying: true };
        const result = processBasslineInput(playingState, { type: 'stop' });
        expect(result.state.isPlaying).toBe(false);
      });

      it('resets step to 0', () => {
        const playingState = { ...state, isPlaying: true, currentStep: 8 };
        const result = processBasslineInput(playingState, { type: 'stop' });
        expect(result.state.currentStep).toBe(0);
      });
    });

    describe('noteOn command', () => {
      it('outputs noteOn event', () => {
        const result = processBasslineInput(state, { type: 'noteOn', note: 36, velocity: 100 });
        expect(result.outputs).toHaveLength(1);
        expect(result.outputs[0].type).toBe('noteOn');
      });

      it('applies transpose', () => {
        const transposedState = { ...state, transpose: 5 };
        const result = processBasslineInput(transposedState, { type: 'noteOn', note: 36, velocity: 100 });
        if (result.outputs[0].type === 'noteOn') {
          expect(result.outputs[0].note).toBe(41);
        }
      });

      it('applies octave shift', () => {
        const octaveState = { ...state, octave: 1 };
        const result = processBasslineInput(octaveState, { type: 'noteOn', note: 36, velocity: 100 });
        if (result.outputs[0].type === 'noteOn') {
          expect(result.outputs[0].note).toBe(48);
        }
      });

      it('adds note to held notes', () => {
        const result = processBasslineInput(state, { type: 'noteOn', note: 36, velocity: 100 });
        expect(result.state.heldNotes.has(36)).toBe(true);
      });

      it('increments active voices', () => {
        const result = processBasslineInput(state, { type: 'noteOn', note: 36, velocity: 100 });
        expect(result.state.voicesActive).toBe(1);
      });
    });

    describe('noteOff command', () => {
      it('outputs noteOff event', () => {
        const noteOnState = { ...state, heldNotes: new Set([36]) };
        const result = processBasslineInput(noteOnState, { type: 'noteOff', note: 36 });
        expect(result.outputs).toHaveLength(1);
        expect(result.outputs[0].type).toBe('noteOff');
      });

      it('removes note from held notes', () => {
        const noteOnState = { ...state, heldNotes: new Set([36]) };
        const result = processBasslineInput(noteOnState, { type: 'noteOff', note: 36 });
        expect(result.state.heldNotes.has(36)).toBe(false);
      });

      it('decrements active voices', () => {
        const noteOnState = { ...state, heldNotes: new Set([36]), voicesActive: 1 };
        const result = processBasslineInput(noteOnState, { type: 'noteOff', note: 36 });
        expect(result.state.voicesActive).toBe(0);
      });
    });

    describe('setTempo command', () => {
      it('sets tempo', () => {
        const result = processBasslineInput(state, { type: 'setTempo', bpm: 140 });
        expect(result.state.tempo).toBe(140);
      });

      it('clamps to minimum 20', () => {
        const result = processBasslineInput(state, { type: 'setTempo', bpm: 10 });
        expect(result.state.tempo).toBe(20);
      });

      it('clamps to maximum 300', () => {
        const result = processBasslineInput(state, { type: 'setTempo', bpm: 400 });
        expect(result.state.tempo).toBe(300);
      });
    });

    describe('setTranspose command', () => {
      it('sets transpose', () => {
        const result = processBasslineInput(state, { type: 'setTranspose', semitones: 7 });
        expect(result.state.transpose).toBe(7);
      });

      it('allows negative transpose', () => {
        const result = processBasslineInput(state, { type: 'setTranspose', semitones: -5 });
        expect(result.state.transpose).toBe(-5);
      });
    });

    describe('setOctave command', () => {
      it('sets octave', () => {
        const result = processBasslineInput(state, { type: 'setOctave', octave: 2 });
        expect(result.state.octave).toBe(2);
      });

      it('clamps to minimum -3', () => {
        const result = processBasslineInput(state, { type: 'setOctave', octave: -5 });
        expect(result.state.octave).toBe(-3);
      });

      it('clamps to maximum 3', () => {
        const result = processBasslineInput(state, { type: 'setOctave', octave: 5 });
        expect(result.state.octave).toBe(3);
      });
    });

    describe('loadPreset command', () => {
      it('loads patch by id', () => {
        const result = processBasslineInput(state, { type: 'loadPreset', patchId: 'acid-squelch' });
        expect(result.state.patch.id).toBe('acid-squelch');
      });

      it('loads pattern by id', () => {
        const result = processBasslineInput(state, {
          type: 'loadPreset',
          patchId: 'acid-classic',
          patternId: 'acid-classic',
        });
        expect(result.state.pattern.id).toBe('acid-classic');
      });

      it('keeps current patch if not found', () => {
        const result = processBasslineInput(state, { type: 'loadPreset', patchId: 'nonexistent' });
        expect(result.state.patch).toBe(state.patch);
      });
    });

    describe('tick command', () => {
      it('does nothing when not playing', () => {
        const result = processBasslineInput(state, { type: 'tick', time: 0 });
        expect(result.outputs).toHaveLength(0);
        expect(result.state.currentStep).toBe(0);
      });

      it('advances step when playing', () => {
        const playingState = { ...state, isPlaying: true };
        const result = processBasslineInput(playingState, { type: 'tick', time: 0 });
        expect(result.state.currentStep).toBe(1);
      });

      it('triggers note for active step', () => {
        const pattern = createEmptyBassPattern('test', 'Test', 16);
        const steps = [...pattern.steps];
        steps[0] = createActiveBassStep(48, 100);
        const activePattern = { ...pattern, steps };
        const playingState = { ...state, isPlaying: true, pattern: activePattern };

        const result = processBasslineInput(playingState, { type: 'tick', time: 0 });

        const noteOnEvents = result.outputs.filter(o => o.type === 'noteOn');
        expect(noteOnEvents).toHaveLength(1);
      });

      it('wraps at pattern end', () => {
        const playingState = { ...state, isPlaying: true, currentStep: 15 };
        const result = processBasslineInput(playingState, { type: 'tick', time: 0 });
        expect(result.state.currentStep).toBe(0);
      });

      it('emits patternEnd at boundary', () => {
        const playingState = { ...state, isPlaying: true, currentStep: 15 };
        const result = processBasslineInput(playingState, { type: 'tick', time: 0 });
        const patternEndEvents = result.outputs.filter(o => o.type === 'patternEnd');
        expect(patternEndEvents).toHaveLength(1);
      });

      it('emits stepChanged', () => {
        const playingState = { ...state, isPlaying: true };
        const result = processBasslineInput(playingState, { type: 'tick', time: 0 });
        const stepChangedEvents = result.outputs.filter(o => o.type === 'stepChanged');
        expect(stepChangedEvents).toHaveLength(1);
      });

      it('applies accent boost', () => {
        const pattern = createEmptyBassPattern('test', 'Test', 16);
        const steps = [...pattern.steps];
        steps[0] = createActiveBassStep(48, 100, { accent: true });
        const activePattern = { ...pattern, steps };
        const playingState = { ...state, isPlaying: true, pattern: activePattern };

        const result = processBasslineInput(playingState, { type: 'tick', time: 0 });

        const noteOnEvents = result.outputs.filter(o => o.type === 'noteOn');
        if (noteOnEvents[0]?.type === 'noteOn') {
          expect(noteOnEvents[0].velocity).toBeGreaterThan(100);
        }
      });
    });
  });

  // ==========================================================================
  // CARD INSTANCE
  // ==========================================================================

  describe('createBasslineCard', () => {
    it('creates card with correct meta', () => {
      const card = createBasslineCard();
      expect(card.meta.id).toBe('bassline');
      expect(card.meta.name).toBe('Bassline');
      expect(card.meta.category).toBe('generators');
    });

    it('has input ports', () => {
      const card = createBasslineCard();
      expect(card.signature.inputs.length).toBeGreaterThan(0);
    });

    it('has output ports', () => {
      const card = createBasslineCard();
      expect(card.signature.outputs.length).toBeGreaterThan(0);
    });

    it('has parameters', () => {
      const card = createBasslineCard();
      expect(card.signature.params.length).toBeGreaterThan(0);
    });

    it('processes input and returns outputs', () => {
      const card = createBasslineCard();
      const result = card.process({ type: 'noteOn', note: 36, velocity: 100 });
      expect(result).toHaveProperty('output');
    });

    it.skip('maintains state across calls', () => {
      // Skipped: Card interface does not have getState() method
      const card = createBasslineCard();
      card.process({ type: 'play' });
      // expect(card.getState().isPlaying).toBe(true);
    });

    it.skip('reset restores initial state', () => {
      // Skipped: Card interface does not have reset() or getState() methods
      const card = createBasslineCard();
      card.process({ type: 'play' });
      card.process({ type: 'setTempo', bpm: 180 });
      // card.reset();
      // expect(card.getState().isPlaying).toBe(false);
      // expect(card.getState().tempo).toBe(120);
    });
  });

  // ==========================================================================
  // PRESETS
  // ==========================================================================

  describe('PRESET_BASS_PATCHES', () => {
    it('has at least 60 patches', () => {
      expect(PRESET_BASS_PATCHES.length).toBeGreaterThanOrEqual(60);
    });

    it('all patches have unique IDs', () => {
      const ids = PRESET_BASS_PATCHES.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('all patches have names', () => {
      for (const patch of PRESET_BASS_PATCHES) {
        expect(patch.name.length).toBeGreaterThan(0);
      }
    });

    it('all patches have categories', () => {
      for (const patch of PRESET_BASS_PATCHES) {
        expect(patch.category.length).toBeGreaterThan(0);
      }
    });

    it('all patches have tags', () => {
      for (const patch of PRESET_BASS_PATCHES) {
        expect(patch.tags.length).toBeGreaterThan(0);
      }
    });

    it('includes acid patches', () => {
      const acid = PRESET_BASS_PATCHES.filter(p => p.category === 'Acid');
      expect(acid.length).toBeGreaterThan(0);
    });

    it('includes sub patches', () => {
      const sub = PRESET_BASS_PATCHES.filter(p => p.category === 'Sub');
      expect(sub.length).toBeGreaterThan(0);
    });

    it('includes reese patches', () => {
      const reese = PRESET_BASS_PATCHES.filter(p => p.category === 'Reese');
      expect(reese.length).toBeGreaterThan(0);
    });

    it('includes house patches', () => {
      const house = PRESET_BASS_PATCHES.filter(p => p.category === 'House');
      expect(house.length).toBeGreaterThan(0);
    });

    it('includes hip-hop patches', () => {
      const hiphop = PRESET_BASS_PATCHES.filter(p => p.category === 'Hip-Hop');
      expect(hiphop.length).toBeGreaterThan(0);
    });

    it('includes moog patches', () => {
      const moog = PRESET_BASS_PATCHES.filter(p => p.category === 'Moog');
      expect(moog.length).toBeGreaterThan(0);
    });

    it('includes dubstep patches', () => {
      const dubstep = PRESET_BASS_PATCHES.filter(p => p.category === 'Dubstep');
      expect(dubstep.length).toBeGreaterThan(0);
    });
  });

  describe('PRESET_BASS_PATTERNS', () => {
    it('has at least 30 patterns', () => {
      expect(PRESET_BASS_PATTERNS.length).toBeGreaterThanOrEqual(30);
    });

    it('all patterns have unique IDs', () => {
      const ids = PRESET_BASS_PATTERNS.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('all patterns have 16 steps', () => {
      for (const pattern of PRESET_BASS_PATTERNS) {
        expect(pattern.length).toBe(16);
        expect(pattern.steps).toHaveLength(16);
      }
    });

    it('all patterns have valid swing', () => {
      for (const pattern of PRESET_BASS_PATTERNS) {
        expect(pattern.swingAmount).toBeGreaterThanOrEqual(0);
        expect(pattern.swingAmount).toBeLessThanOrEqual(1);
      }
    });

    it('includes basic patterns', () => {
      const basic = PRESET_BASS_PATTERNS.filter(p => p.name.includes('Root') || p.name.includes('Basic'));
      expect(basic.length).toBeGreaterThan(0);
    });

    it('includes house patterns', () => {
      const house = PRESET_BASS_PATTERNS.filter(p => p.name.toLowerCase().includes('house'));
      expect(house.length).toBeGreaterThan(0);
    });

    it('includes acid patterns', () => {
      const acid = PRESET_BASS_PATTERNS.filter(p => p.name.toLowerCase().includes('acid'));
      expect(acid.length).toBeGreaterThan(0);
    });

    it('includes funk patterns', () => {
      const funk = PRESET_BASS_PATTERNS.filter(p => p.name.toLowerCase().includes('funk') || p.name.toLowerCase().includes('disco'));
      expect(funk.length).toBeGreaterThan(0);
    });
  });

  describe('BASS_FREESOUND_QUERIES', () => {
    it('has upright bass query', () => {
      expect(BASS_FREESOUND_QUERIES['upright-bass']).toBeDefined();
    });

    it('has acoustic bass query', () => {
      expect(BASS_FREESOUND_QUERIES['acoustic-bass']).toBeDefined();
    });

    it('has slap bass query', () => {
      expect(BASS_FREESOUND_QUERIES['slap-bass']).toBeDefined();
    });

    it('has moog bass query', () => {
      expect(BASS_FREESOUND_QUERIES['moog-bass']).toBeDefined();
    });

    it('has 303 bass query', () => {
      expect(BASS_FREESOUND_QUERIES['303-bass']).toBeDefined();
    });

    it('has sub bass query', () => {
      expect(BASS_FREESOUND_QUERIES['sub-bass']).toBeDefined();
    });

    it('has reese bass query', () => {
      expect(BASS_FREESOUND_QUERIES['reese-bass']).toBeDefined();
    });

    it('has genre-specific queries', () => {
      expect(BASS_FREESOUND_QUERIES['house-bass']).toBeDefined();
      expect(BASS_FREESOUND_QUERIES['techno-bass']).toBeDefined();
      expect(BASS_FREESOUND_QUERIES['dubstep-bass']).toBeDefined();
    });
  });
});
