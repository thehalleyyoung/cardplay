/**
 * DrumMachineCard comprehensive tests
 * @module cards/drum-machine.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createDrumMachineCard,
  createDrumMachineState,
  processDrumMachineInput,
  createEmptyPattern,
  createEmptyStep,
  createActiveStep,
  createDefaultPad,
  PRESET_DRUM_KITS,
  PRESET_PATTERNS,
  FREESOUND_QUERIES,
  SampleCache,
  type DrumMachineState,
  type DrumMachineInput,
  type DrumPattern,
  type PatternStep,
  type DrumKit,
  type DrumPad,
} from './drum-machine';

describe('DrumMachineCard', () => {
  // ==========================================================================
  // FACTORY FUNCTIONS
  // ==========================================================================

  describe('createDefaultPad', () => {
    it('creates pad with correct id and name', () => {
      const pad = createDefaultPad(5, 'Tom Mid', 41);
      expect(pad.id).toBe(5);
      expect(pad.name).toBe('Tom Mid');
      expect(pad.midiNote).toBe(41);
    });

    it('creates pad with default volume 0.8', () => {
      const pad = createDefaultPad(0, 'Kick', 36);
      expect(pad.volume).toBe(0.8);
    });

    it('creates pad with centered pan', () => {
      const pad = createDefaultPad(0, 'Kick', 36);
      expect(pad.pan).toBe(0);
    });

    it('creates pad with no pitch offset', () => {
      const pad = createDefaultPad(0, 'Kick', 36);
      expect(pad.pitch).toBe(0);
    });

    it('creates pad with full decay', () => {
      const pad = createDefaultPad(0, 'Kick', 36);
      expect(pad.decay).toBe(1);
    });

    it('creates pad with filter fully open', () => {
      const pad = createDefaultPad(0, 'Kick', 36);
      expect(pad.filterCutoff).toBe(20000);
      expect(pad.filterResonance).toBe(0);
    });

    it('creates pad with small reverb send', () => {
      const pad = createDefaultPad(0, 'Kick', 36);
      expect(pad.reverbSend).toBe(0.1);
    });

    it('creates pad with no delay send', () => {
      const pad = createDefaultPad(0, 'Kick', 36);
      expect(pad.delaySend).toBe(0);
    });

    it('creates pad not muted or soloed', () => {
      const pad = createDefaultPad(0, 'Kick', 36);
      expect(pad.mute).toBe(false);
      expect(pad.solo).toBe(false);
    });

    it('creates pad with no choke group', () => {
      const pad = createDefaultPad(0, 'Kick', 36);
      expect(pad.chokeGroup).toBe(null);
    });

    it('creates pad with default color', () => {
      const pad = createDefaultPad(0, 'Kick', 36);
      expect(pad.color).toBe('#666666');
    });
  });

  describe('createEmptyStep', () => {
    it('creates step with zero velocity (off)', () => {
      const step = createEmptyStep();
      expect(step.velocity).toBe(0);
    });

    it('creates step with full probability', () => {
      const step = createEmptyStep();
      expect(step.probability).toBe(1);
    });

    it('creates step with no offset', () => {
      const step = createEmptyStep();
      expect(step.offset).toBe(0);
    });

    it('creates step with no pitch offset', () => {
      const step = createEmptyStep();
      expect(step.pitchOffset).toBe(0);
    });

    it('creates step with default decay', () => {
      const step = createEmptyStep();
      expect(step.decay).toBe(1);
    });

    it('creates step with flam disabled', () => {
      const step = createEmptyStep();
      expect(step.flam).toBe(false);
      expect(step.flamTime).toBe(30);
    });

    it('creates step with accent disabled', () => {
      const step = createEmptyStep();
      expect(step.accent).toBe(false);
    });

    it('creates step with no retrigger', () => {
      const step = createEmptyStep();
      expect(step.retrigger).toBe(0);
      expect(step.retriggerDecay).toBe(0.7);
    });
  });

  describe('createActiveStep', () => {
    it('creates step with given velocity', () => {
      const step = createActiveStep(100);
      expect(step.velocity).toBe(100);
    });

    it('defaults to velocity 100', () => {
      const step = createActiveStep();
      expect(step.velocity).toBe(100);
    });

    it('inherits all other defaults from empty step', () => {
      const step = createActiveStep(80);
      expect(step.probability).toBe(1);
      expect(step.offset).toBe(0);
      expect(step.flam).toBe(false);
    });
  });

  describe('createEmptyPattern', () => {
    it('creates pattern with correct id and name', () => {
      const pattern = createEmptyPattern('test', 'Test Pattern', 16, 16);
      expect(pattern.id).toBe('test');
      expect(pattern.name).toBe('Test Pattern');
    });

    it('creates pattern with default BPM 120', () => {
      const pattern = createEmptyPattern('test', 'Test', 16, 16);
      expect(pattern.bpm).toBe(120);
    });

    it('creates pattern with no swing', () => {
      const pattern = createEmptyPattern('test', 'Test', 16, 16);
      expect(pattern.swing).toBe(0);
      expect(pattern.swingType).toBe('even');
    });

    it('creates pattern with no humanize', () => {
      const pattern = createEmptyPattern('test', 'Test', 16, 16);
      expect(pattern.humanize).toBe(0);
      expect(pattern.velocityHumanize).toBe(0);
    });

    it('creates correct number of tracks', () => {
      const pattern = createEmptyPattern('test', 'Test', 8, 16);
      expect(pattern.tracks.length).toBe(8);
    });

    it('creates correct number of steps per track', () => {
      const pattern = createEmptyPattern('test', 'Test', 16, 32);
      expect(pattern.tracks[0].steps.length).toBe(32);
      expect(pattern.globalLength).toBe(32);
    });

    it('creates tracks with correct pad IDs', () => {
      const pattern = createEmptyPattern('test', 'Test', 16, 16);
      for (let i = 0; i < 16; i++) {
        expect(pattern.tracks[i].padId).toBe(i);
      }
    });

    it('creates tracks with all empty steps', () => {
      const pattern = createEmptyPattern('test', 'Test', 16, 16);
      for (const track of pattern.tracks) {
        for (const step of track.steps) {
          expect(step.velocity).toBe(0);
        }
      }
    });

    it('has no chain next', () => {
      const pattern = createEmptyPattern('test', 'Test', 16, 16);
      expect(pattern.chainNext).toBe(null);
    });
  });

  describe('createDrumMachineState', () => {
    it('creates state with default kit', () => {
      const state = createDrumMachineState();
      expect(state.kit).toBe(PRESET_DRUM_KITS[0]);
    });

    it('creates state with custom kit', () => {
      const kit = PRESET_DRUM_KITS[5];
      const state = createDrumMachineState(kit);
      expect(state.kit).toBe(kit);
    });

    it('creates state with empty pattern by default', () => {
      const state = createDrumMachineState();
      expect(state.pattern.id).toBe('default');
    });

    it('creates state with custom pattern', () => {
      const pattern = createEmptyPattern('custom', 'Custom', 16, 32);
      const state = createDrumMachineState(PRESET_DRUM_KITS[0], pattern);
      expect(state.pattern.id).toBe('custom');
    });

    it('creates state not playing', () => {
      const state = createDrumMachineState();
      expect(state.isPlaying).toBe(false);
    });

    it('creates state at step 0', () => {
      const state = createDrumMachineState();
      expect(state.currentStep).toBe(0);
    });

    it('creates state with default loop points', () => {
      const state = createDrumMachineState();
      expect(state.loopStart).toBe(0);
      expect(state.loopEnd).toBe(16);
    });

    it('creates state with default master volume', () => {
      const state = createDrumMachineState();
      expect(state.masterVolume).toBe(0.8);
    });

    it('creates state with default tempo 120', () => {
      const state = createDrumMachineState();
      expect(state.tempo).toBe(120);
    });

    it('creates state with metronome disabled', () => {
      const state = createDrumMachineState();
      expect(state.metronomeEnabled).toBe(false);
    });

    it('creates state with record disabled', () => {
      const state = createDrumMachineState();
      expect(state.recordEnabled).toBe(false);
    });

    it('creates state with quantize record enabled', () => {
      const state = createDrumMachineState();
      expect(state.quantizeRecord).toBe(true);
    });
  });

  // ==========================================================================
  // INPUT PROCESSING
  // ==========================================================================

  describe('processDrumMachineInput', () => {
    let state: DrumMachineState;

    beforeEach(() => {
      state = createDrumMachineState();
    });

    describe('play command', () => {
      it('sets isPlaying to true', () => {
        const result = processDrumMachineInput(state, { type: 'play' });
        expect(result.state.isPlaying).toBe(true);
      });

      it('produces no outputs', () => {
        const result = processDrumMachineInput(state, { type: 'play' });
        expect(result.outputs).toHaveLength(0);
      });

      it('preserves current step', () => {
        const pausedState = { ...state, currentStep: 8, isPlaying: false };
        const result = processDrumMachineInput(pausedState, { type: 'play' });
        expect(result.state.currentStep).toBe(8);
      });
    });

    describe('stop command', () => {
      it('sets isPlaying to false', () => {
        const playingState = { ...state, isPlaying: true };
        const result = processDrumMachineInput(playingState, { type: 'stop' });
        expect(result.state.isPlaying).toBe(false);
      });

      it('resets currentStep to 0', () => {
        const playingState = { ...state, isPlaying: true, currentStep: 8 };
        const result = processDrumMachineInput(playingState, { type: 'stop' });
        expect(result.state.currentStep).toBe(0);
      });
    });

    describe('pause command', () => {
      it('sets isPlaying to false', () => {
        const playingState = { ...state, isPlaying: true };
        const result = processDrumMachineInput(playingState, { type: 'pause' });
        expect(result.state.isPlaying).toBe(false);
      });

      it('preserves currentStep', () => {
        const playingState = { ...state, isPlaying: true, currentStep: 8 };
        const result = processDrumMachineInput(playingState, { type: 'pause' });
        expect(result.state.currentStep).toBe(8);
      });
    });

    describe('setTempo command', () => {
      it('sets tempo to given value', () => {
        const result = processDrumMachineInput(state, { type: 'setTempo', bpm: 140 });
        expect(result.state.tempo).toBe(140);
      });

      it('clamps tempo to minimum 20', () => {
        const result = processDrumMachineInput(state, { type: 'setTempo', bpm: 5 });
        expect(result.state.tempo).toBe(20);
      });

      it('clamps tempo to maximum 300', () => {
        const result = processDrumMachineInput(state, { type: 'setTempo', bpm: 400 });
        expect(result.state.tempo).toBe(300);
      });
    });

    describe('triggerPad command', () => {
      it('outputs noteOn event', () => {
        const result = processDrumMachineInput(state, {
          type: 'triggerPad',
          padId: 0,
          velocity: 100,
        });
        expect(result.outputs).toHaveLength(1);
        expect(result.outputs[0].type).toBe('noteOn');
      });

      it('includes correct padId and velocity', () => {
        const result = processDrumMachineInput(state, {
          type: 'triggerPad',
          padId: 5,
          velocity: 80,
        });
        const output = result.outputs[0];
        if (output.type === 'noteOn') {
          expect(output.padId).toBe(5);
          expect(output.velocity).toBe(80);
        }
      });

      it('does not trigger muted pad', () => {
        const mutedPads = state.kit.pads.map((pad, i) =>
          i === 0 ? { ...pad, mute: true } : pad
        );
        const mutedState = {
          ...state,
          kit: { ...state.kit, pads: mutedPads },
        };
        const result = processDrumMachineInput(mutedState, {
          type: 'triggerPad',
          padId: 0,
          velocity: 100,
        });
        expect(result.outputs).toHaveLength(0);
      });
    });

    describe('setSwing command', () => {
      it('sets swing amount', () => {
        const result = processDrumMachineInput(state, { type: 'setSwing', amount: 0.5 });
        expect(result.state.swing).toBe(0.5);
      });

      it('clamps swing to 0-1', () => {
        const result1 = processDrumMachineInput(state, { type: 'setSwing', amount: -0.5 });
        expect(result1.state.swing).toBe(0);

        const result2 = processDrumMachineInput(state, { type: 'setSwing', amount: 1.5 });
        expect(result2.state.swing).toBe(1);
      });
    });

    describe('setHumanize command', () => {
      it('sets timing humanize', () => {
        const result = processDrumMachineInput(state, {
          type: 'setHumanize',
          timing: 0.3,
          velocity: 0.2,
        });
        expect(result.state.humanize).toBe(0.3);
      });

      it('sets velocity humanize', () => {
        const result = processDrumMachineInput(state, {
          type: 'setHumanize',
          timing: 0.3,
          velocity: 0.2,
        });
        expect(result.state.velocityHumanize).toBe(0.2);
      });

      it('clamps values to 0-1', () => {
        const result = processDrumMachineInput(state, {
          type: 'setHumanize',
          timing: 2,
          velocity: -1,
        });
        expect(result.state.humanize).toBe(1);
        expect(result.state.velocityHumanize).toBe(0);
      });
    });

    describe('setKit command', () => {
      it('replaces current kit', () => {
        const newKit = PRESET_DRUM_KITS[10];
        const result = processDrumMachineInput(state, { type: 'setKit', kit: newKit });
        expect(result.state.kit).toBe(newKit);
      });
    });

    describe('setPattern command', () => {
      it('replaces current pattern', () => {
        const newPattern = createEmptyPattern('new', 'New Pattern', 16, 32);
        const result = processDrumMachineInput(state, { type: 'setPattern', pattern: newPattern });
        expect(result.state.pattern).toBe(newPattern);
      });
    });

    describe('setStep command', () => {
      it('updates step in pattern', () => {
        const newStep = createActiveStep(127);
        const result = processDrumMachineInput(state, {
          type: 'setStep',
          padId: 0,
          stepIndex: 4,
          step: newStep,
        });
        expect(result.state.pattern.tracks[0].steps[4].velocity).toBe(127);
      });

      it('preserves other steps', () => {
        const newStep = createActiveStep(127);
        const result = processDrumMachineInput(state, {
          type: 'setStep',
          padId: 0,
          stepIndex: 4,
          step: newStep,
        });
        expect(result.state.pattern.tracks[0].steps[0].velocity).toBe(0);
        expect(result.state.pattern.tracks[0].steps[5].velocity).toBe(0);
      });

      it('preserves other tracks', () => {
        const newStep = createActiveStep(127);
        const result = processDrumMachineInput(state, {
          type: 'setStep',
          padId: 0,
          stepIndex: 4,
          step: newStep,
        });
        expect(result.state.pattern.tracks[1].steps[4].velocity).toBe(0);
      });
    });

    describe('midiNote command', () => {
      it('triggers pad matching MIDI note', () => {
        const result = processDrumMachineInput(state, {
          type: 'midiNote',
          note: 36, // Pad 0
          velocity: 100,
        });
        expect(result.outputs).toHaveLength(1);
        if (result.outputs[0].type === 'noteOn') {
          expect(result.outputs[0].padId).toBe(0);
        }
      });

      it('ignores velocity 0 (note off)', () => {
        const result = processDrumMachineInput(state, {
          type: 'midiNote',
          note: 36,
          velocity: 0,
        });
        expect(result.outputs).toHaveLength(0);
      });

      it('ignores unknown MIDI notes', () => {
        const result = processDrumMachineInput(state, {
          type: 'midiNote',
          note: 100, // Not mapped
          velocity: 100,
        });
        expect(result.outputs).toHaveLength(0);
      });
    });

    describe('loadPreset command', () => {
      it('loads kit by ID', () => {
        const result = processDrumMachineInput(state, {
          type: 'loadPreset',
          kitId: '909-classic',
        });
        expect(result.state.kit.id).toBe('909-classic');
      });

      it('loads pattern by ID', () => {
        const result = processDrumMachineInput(state, {
          type: 'loadPreset',
          kitId: '909-classic',
          patternId: 'house-4',
        });
        expect(result.state.pattern.id).toBe('house-4');
      });

      it('sets tempo from pattern', () => {
        const result = processDrumMachineInput(state, {
          type: 'loadPreset',
          kitId: '909-classic',
          patternId: 'house-4',
        });
        expect(result.state.tempo).toBe(124); // House tempo
      });

      it('sets swing from pattern', () => {
        const result = processDrumMachineInput(state, {
          type: 'loadPreset',
          kitId: '808-classic',
          patternId: 'boom-bap-1',
        });
        expect(result.state.swing).toBe(0.15);
      });

      it('outputs error for unknown kit', () => {
        const result = processDrumMachineInput(state, {
          type: 'loadPreset',
          kitId: 'unknown-kit',
        });
        expect(result.outputs).toHaveLength(1);
        expect(result.outputs[0].type).toBe('error');
      });
    });

    describe('tick command (sequencer)', () => {
      it('does nothing when not playing', () => {
        const result = processDrumMachineInput(state, {
          type: 'tick',
          time: performance.now(),
        });
        expect(result.outputs).toHaveLength(0);
        expect(result.state.currentStep).toBe(0);
      });

      it('advances step when playing', () => {
        const playingState = { ...state, isPlaying: true };
        const result = processDrumMachineInput(playingState, {
          type: 'tick',
          time: performance.now(),
        });
        expect(result.state.currentStep).toBe(1);
      });

      it('triggers notes for active steps', () => {
        // Create pattern with kick on step 0
        const pattern = createEmptyPattern('test', 'Test', 16, 16);
        const modifiedTracks = pattern.tracks.map((track, i) => {
          if (i === 0) {
            const steps = [...track.steps];
            steps[0] = createActiveStep(100);
            return { ...track, steps };
          }
          return track;
        });
        const modifiedPattern = { ...pattern, tracks: modifiedTracks };
        const playingState = { ...state, isPlaying: true, pattern: modifiedPattern };

        const result = processDrumMachineInput(playingState, {
          type: 'tick',
          time: performance.now(),
        });

        const noteOnEvents = result.outputs.filter((o) => o.type === 'noteOn');
        expect(noteOnEvents.length).toBeGreaterThan(0);
      });

      it('wraps at loop end', () => {
        const playingState = { ...state, isPlaying: true, currentStep: 15, loopEnd: 16 };
        const result = processDrumMachineInput(playingState, {
          type: 'tick',
          time: performance.now(),
        });
        expect(result.state.currentStep).toBe(0);
      });

      it('emits patternEnd at loop boundary', () => {
        const playingState = { ...state, isPlaying: true, currentStep: 15, loopEnd: 16 };
        const result = processDrumMachineInput(playingState, {
          type: 'tick',
          time: performance.now(),
        });
        const patternEndEvents = result.outputs.filter((o) => o.type === 'patternEnd');
        expect(patternEndEvents).toHaveLength(1);
      });

      it('emits stepChanged event', () => {
        const playingState = { ...state, isPlaying: true };
        const result = processDrumMachineInput(playingState, {
          type: 'tick',
          time: performance.now(),
        });
        const stepChangedEvents = result.outputs.filter((o) => o.type === 'stepChanged');
        expect(stepChangedEvents).toHaveLength(1);
      });

      it('respects probability', () => {
        // Create pattern with low probability step
        const pattern = createEmptyPattern('test', 'Test', 16, 16);
        const modifiedTracks = pattern.tracks.map((track, i) => {
          if (i === 0) {
            const steps = [...track.steps];
            steps[0] = { ...createActiveStep(100), probability: 0 }; // Will never trigger
            return { ...track, steps };
          }
          return track;
        });
        const modifiedPattern = { ...pattern, tracks: modifiedTracks };
        const playingState = { ...state, isPlaying: true, pattern: modifiedPattern };

        const result = processDrumMachineInput(playingState, {
          type: 'tick',
          time: performance.now(),
        });

        const noteOnEvents = result.outputs.filter((o) => o.type === 'noteOn');
        expect(noteOnEvents).toHaveLength(0);
      });

      it('applies accent boost', () => {
        const pattern = createEmptyPattern('test', 'Test', 16, 16);
        const modifiedTracks = pattern.tracks.map((track, i) => {
          if (i === 0) {
            const steps = [...track.steps];
            steps[0] = { ...createActiveStep(100), accent: true };
            return { ...track, steps };
          }
          return track;
        });
        const modifiedPattern = { ...pattern, tracks: modifiedTracks };
        const playingState = { ...state, isPlaying: true, pattern: modifiedPattern };

        const result = processDrumMachineInput(playingState, {
          type: 'tick',
          time: performance.now(),
        });

        const noteOnEvents = result.outputs.filter((o) => o.type === 'noteOn');
        if (noteOnEvents[0]?.type === 'noteOn') {
          expect(noteOnEvents[0].velocity).toBeGreaterThan(100);
        }
      });

      it('handles retrigger', () => {
        const pattern = createEmptyPattern('test', 'Test', 16, 16);
        const modifiedTracks = pattern.tracks.map((track, i) => {
          if (i === 0) {
            const steps = [...track.steps];
            steps[0] = { ...createActiveStep(100), retrigger: 3 };
            return { ...track, steps };
          }
          return track;
        });
        const modifiedPattern = { ...pattern, tracks: modifiedTracks };
        const playingState = { ...state, isPlaying: true, pattern: modifiedPattern };

        const result = processDrumMachineInput(playingState, {
          type: 'tick',
          time: performance.now(),
        });

        const noteOnEvents = result.outputs.filter((o) => o.type === 'noteOn');
        expect(noteOnEvents.length).toBe(4); // Original + 3 retriggers
      });

      it('handles flam', () => {
        const pattern = createEmptyPattern('test', 'Test', 16, 16);
        const modifiedTracks = pattern.tracks.map((track, i) => {
          if (i === 0) {
            const steps = [...track.steps];
            steps[0] = { ...createActiveStep(100), flam: true };
            return { ...track, steps };
          }
          return track;
        });
        const modifiedPattern = { ...pattern, tracks: modifiedTracks };
        const playingState = { ...state, isPlaying: true, pattern: modifiedPattern };

        const result = processDrumMachineInput(playingState, {
          type: 'tick',
          time: performance.now(),
        });

        const noteOnEvents = result.outputs.filter((o) => o.type === 'noteOn');
        expect(noteOnEvents.length).toBe(2); // Main hit + flam
      });
    });
  });

  // ==========================================================================
  // CARD INSTANCE
  // ==========================================================================

  describe('createDrumMachineCard', () => {
    it('creates card with correct meta', () => {
      const card = createDrumMachineCard();
      expect(card.meta.id).toBe('drum-machine');
      expect(card.meta.name).toBe('Drum Machine');
      expect(card.meta.category).toBe('generators');
    });

    it('has input ports', () => {
      const card = createDrumMachineCard();
      expect(card.signature.inputs.length).toBeGreaterThan(0);
    });

    it('has output ports', () => {
      const card = createDrumMachineCard();
      expect(card.signature.outputs.length).toBeGreaterThan(0);
    });

    it('has parameters', () => {
      const card = createDrumMachineCard();
      expect(card.signature.params.length).toBeGreaterThan(0);
    });

    it('processes input and returns outputs', () => {
      const card = createDrumMachineCard();
      const result = card.process({ type: 'triggerPad', padId: 0, velocity: 100 });
      expect(result).toHaveProperty('output');
    });

    // Skipped: Card interface does not have getState() method
    it.skip('maintains state across process calls', () => {
      const card = createDrumMachineCard();
      card.process({ type: 'play' });
      // const state = card.getState();
      // expect(state.isPlaying).toBe(true);
    });

    // Skipped: Card interface does not have getState()/setState() methods
    it.skip('can set state directly', () => {
      const card = createDrumMachineCard();
      // const newState = { ...card.getState(), tempo: 180 };
      // card.setState(newState);
      // expect(card.getState().tempo).toBe(180);
    });

    // Skipped: Card interface does not have reset() method
    it.skip('reset restores initial state', () => {
      const card = createDrumMachineCard();
      // card.process({ type: 'setTempo', bpm: 180 });
      // card.process({ type: 'play' });
      // card.reset();
      // expect(card.getState().tempo).toBe(120);
      // expect(card.getState().isPlaying).toBe(false);
    });
  });

  // ==========================================================================
  // PRESET KITS
  // ==========================================================================

  describe('PRESET_DRUM_KITS', () => {
    it('has at least 40 kits', () => {
      expect(PRESET_DRUM_KITS.length).toBeGreaterThanOrEqual(40);
    });

    it('all kits have unique IDs', () => {
      const ids = PRESET_DRUM_KITS.map((k) => k.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('all kits have 16 pads', () => {
      for (const kit of PRESET_DRUM_KITS) {
        expect(kit.pads.length).toBe(16);
      }
    });

    it('all kits have names and categories', () => {
      for (const kit of PRESET_DRUM_KITS) {
        expect(kit.name.length).toBeGreaterThan(0);
        expect(kit.category.length).toBeGreaterThan(0);
      }
    });

    it('all kits have descriptions', () => {
      for (const kit of PRESET_DRUM_KITS) {
        expect(kit.description.length).toBeGreaterThan(0);
      }
    });

    it('all kits have tags', () => {
      for (const kit of PRESET_DRUM_KITS) {
        expect(kit.tags.length).toBeGreaterThan(0);
      }
    });

    it('includes 808 kits', () => {
      const kit808 = PRESET_DRUM_KITS.filter((k) => k.category === '808');
      expect(kit808.length).toBeGreaterThan(0);
    });

    it('includes 909 kits', () => {
      const kit909 = PRESET_DRUM_KITS.filter((k) => k.category === '909');
      expect(kit909.length).toBeGreaterThan(0);
    });

    it('includes acoustic kits', () => {
      const acoustic = PRESET_DRUM_KITS.filter((k) => k.category === 'Acoustic');
      expect(acoustic.length).toBeGreaterThan(0);
    });

    it('includes hip-hop kits', () => {
      const hiphop = PRESET_DRUM_KITS.filter((k) => k.category === 'Hip-Hop');
      expect(hiphop.length).toBeGreaterThan(0);
    });

    it('includes world percussion kits', () => {
      const world = PRESET_DRUM_KITS.filter((k) => k.category === 'World');
      expect(world.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // PRESET PATTERNS
  // ==========================================================================

  describe('PRESET_PATTERNS', () => {
    it('has at least 30 patterns', () => {
      expect(PRESET_PATTERNS.length).toBeGreaterThanOrEqual(30);
    });

    it('all patterns have unique IDs', () => {
      const ids = PRESET_PATTERNS.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('all patterns have 16 steps', () => {
      for (const pattern of PRESET_PATTERNS) {
        expect(pattern.length).toBe(16);
      }
    });

    it('all patterns have valid BPM', () => {
      for (const pattern of PRESET_PATTERNS) {
        expect(pattern.bpm).toBeGreaterThanOrEqual(20);
        expect(pattern.bpm).toBeLessThanOrEqual(300);
      }
    });

    it('all patterns have valid swing', () => {
      for (const pattern of PRESET_PATTERNS) {
        expect(pattern.swing).toBeGreaterThanOrEqual(0);
        expect(pattern.swing).toBeLessThanOrEqual(1);
      }
    });

    it('all patterns have at least one track', () => {
      for (const pattern of PRESET_PATTERNS) {
        expect(pattern.tracks.length).toBeGreaterThan(0);
      }
    });

    it('includes basic patterns', () => {
      const basic = PRESET_PATTERNS.filter((p) => p.category === 'Basic');
      expect(basic.length).toBeGreaterThan(0);
    });

    it('includes hip-hop patterns', () => {
      const hiphop = PRESET_PATTERNS.filter((p) => p.category === 'Hip-Hop');
      expect(hiphop.length).toBeGreaterThan(0);
    });

    it('includes house patterns', () => {
      const house = PRESET_PATTERNS.filter((p) => p.category === 'House');
      expect(house.length).toBeGreaterThan(0);
    });

    it('includes techno patterns', () => {
      const techno = PRESET_PATTERNS.filter((p) => p.category === 'Techno');
      expect(techno.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // FREESOUND QUERIES
  // ==========================================================================

  describe('FREESOUND_QUERIES', () => {
    it('has queries for kicks', () => {
      expect(FREESOUND_QUERIES['kick']).toBeDefined();
      expect(FREESOUND_QUERIES['kick-808']).toBeDefined();
    });

    it('has queries for snares', () => {
      expect(FREESOUND_QUERIES['snare']).toBeDefined();
      expect(FREESOUND_QUERIES['snare-acoustic']).toBeDefined();
    });

    it('has queries for hi-hats', () => {
      expect(FREESOUND_QUERIES['hihat-closed']).toBeDefined();
      expect(FREESOUND_QUERIES['hihat-open']).toBeDefined();
    });

    it('has queries for cymbals', () => {
      expect(FREESOUND_QUERIES['crash']).toBeDefined();
      expect(FREESOUND_QUERIES['ride']).toBeDefined();
    });

    it('has queries for toms', () => {
      expect(FREESOUND_QUERIES['tom-high']).toBeDefined();
      expect(FREESOUND_QUERIES['tom-low']).toBeDefined();
    });

    it('has queries for percussion', () => {
      expect(FREESOUND_QUERIES['clap']).toBeDefined();
      expect(FREESOUND_QUERIES['cowbell']).toBeDefined();
      expect(FREESOUND_QUERIES['tambourine']).toBeDefined();
    });

    it('has queries for 808 sounds', () => {
      expect(FREESOUND_QUERIES['808-kick']).toBeDefined();
      expect(FREESOUND_QUERIES['808-snare']).toBeDefined();
    });

    it('has queries for 909 sounds', () => {
      expect(FREESOUND_QUERIES['909-kick']).toBeDefined();
      expect(FREESOUND_QUERIES['909-snare']).toBeDefined();
    });

    it('has queries for FX sounds', () => {
      expect(FREESOUND_QUERIES['fx-riser']).toBeDefined();
      expect(FREESOUND_QUERIES['fx-impact']).toBeDefined();
    });
  });

  // ==========================================================================
  // SAMPLE CACHE
  // ==========================================================================

  describe('SampleCache', () => {
    it('stores and retrieves samples', () => {
      const cache = new SampleCache(10);
      const mockBuffer = { length: 44100 } as AudioBuffer;
      cache.set('test', mockBuffer);
      expect(cache.get('test')).toBe(mockBuffer);
    });

    it('returns undefined for missing keys', () => {
      const cache = new SampleCache(10);
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('reports has correctly', () => {
      const cache = new SampleCache(10);
      const mockBuffer = { length: 44100 } as AudioBuffer;
      cache.set('test', mockBuffer);
      expect(cache.has('test')).toBe(true);
      expect(cache.has('other')).toBe(false);
    });

    it('evicts LRU items when full', () => {
      const cache = new SampleCache(2);
      const buffer1 = { length: 1 } as AudioBuffer;
      const buffer2 = { length: 2 } as AudioBuffer;
      const buffer3 = { length: 3 } as AudioBuffer;

      cache.set('a', buffer1);
      cache.set('b', buffer2);
      cache.set('c', buffer3); // Should evict 'a'

      expect(cache.has('a')).toBe(false);
      expect(cache.has('b')).toBe(true);
      expect(cache.has('c')).toBe(true);
    });

    it('updates access order on get', () => {
      const cache = new SampleCache(2);
      const buffer1 = { length: 1 } as AudioBuffer;
      const buffer2 = { length: 2 } as AudioBuffer;
      const buffer3 = { length: 3 } as AudioBuffer;

      cache.set('a', buffer1);
      cache.set('b', buffer2);
      cache.get('a'); // Access 'a' to make it most recent
      cache.set('c', buffer3); // Should evict 'b' (now LRU)

      expect(cache.has('a')).toBe(true);
      expect(cache.has('b')).toBe(false);
      expect(cache.has('c')).toBe(true);
    });

    it('clears all entries', () => {
      const cache = new SampleCache(10);
      cache.set('a', { length: 1 } as AudioBuffer);
      cache.set('b', { length: 2 } as AudioBuffer);
      cache.clear();
      expect(cache.has('a')).toBe(false);
      expect(cache.has('b')).toBe(false);
    });
  });
});
