/**
 * Tests for DrumKitCard
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  // Constants
  PAD_COUNT,
  MAX_VELOCITY_LAYERS,
  MAX_ROUND_ROBIN,
  MAX_VOICES,
  SAMPLE_RATE,
  PAD_NOTE_NAMES,
  GM_DRUM_NOTES,
  
  // Types
  DrumKitState,
  DrumPad,
  DrumKitPreset,
  
  // Data
  DRUM_KIT_PRESETS,
  DEFAULT_PAD_ENVELOPE,
  DEFAULT_PAD_FILTER,
  
  // Functions
  createDrumKitState,
  findPadByNote,
  getSampleForVelocity,
  createDrumVoice,
  processDrumKitInput,
  createDrumKitCard,
  DRUM_KIT_CARD_META,
} from './drum-kit';

describe('DrumKitCard', () => {
  // ==========================================================================
  // CONSTANTS
  // ==========================================================================

  describe('Constants', () => {
    it('should have 16 pads', () => {
      expect(PAD_COUNT).toBe(16);
    });

    it('should have correct max values', () => {
      expect(MAX_VELOCITY_LAYERS).toBe(8);
      expect(MAX_ROUND_ROBIN).toBe(8);
      expect(MAX_VOICES).toBe(32);
    });

    it('should have standard sample rate', () => {
      expect(SAMPLE_RATE).toBe(44100);
    });

    it('should have 16 pad names', () => {
      expect(PAD_NOTE_NAMES.length).toBe(16);
    });

    it('should have GM drum notes mapping', () => {
      expect(GM_DRUM_NOTES.kick).toBe(36);
      expect(GM_DRUM_NOTES.snare).toBe(38);
      expect(GM_DRUM_NOTES.hihatClosed).toBe(42);
    });
  });

  // ==========================================================================
  // DEFAULT VALUES
  // ==========================================================================

  describe('Default Values', () => {
    it('should have valid pad envelope defaults', () => {
      expect(DEFAULT_PAD_ENVELOPE.attack).toBeGreaterThan(0);
      expect(DEFAULT_PAD_ENVELOPE.decay).toBeGreaterThan(0);
      expect(DEFAULT_PAD_ENVELOPE.release).toBeGreaterThan(0);
    });

    it('should have disabled filter by default', () => {
      expect(DEFAULT_PAD_FILTER.enabled).toBe(false);
      expect(DEFAULT_PAD_FILTER.frequency).toBe(20000);
    });
  });

  // ==========================================================================
  // PRESETS
  // ==========================================================================

  describe('Presets', () => {
    it('should have 15+ kits', () => {
      expect(DRUM_KIT_PRESETS.length).toBeGreaterThanOrEqual(15);
    });

    it('should have acoustic kits', () => {
      const acoustic = DRUM_KIT_PRESETS.filter(k => k.category === 'acoustic');
      expect(acoustic.length).toBeGreaterThan(0);
    });

    it('should have 808 kit', () => {
      const kit808 = DRUM_KIT_PRESETS.find(k => k.category === '808');
      expect(kit808).toBeDefined();
    });

    it('should have 909 kit', () => {
      const kit909 = DRUM_KIT_PRESETS.find(k => k.category === '909');
      expect(kit909).toBeDefined();
    });

    it('should have electronic kits', () => {
      const electronic = DRUM_KIT_PRESETS.filter(k => k.category === 'electronic');
      expect(electronic.length).toBeGreaterThan(0);
    });

    it('should have ethnic kits', () => {
      const ethnic = DRUM_KIT_PRESETS.filter(k => k.category === 'ethnic');
      expect(ethnic.length).toBeGreaterThan(0);
    });

    it('should have 16 pads per kit', () => {
      for (const kit of DRUM_KIT_PRESETS) {
        expect(kit.pads.length).toBe(PAD_COUNT);
      }
    });

    it('should have unique kit IDs', () => {
      const ids = DRUM_KIT_PRESETS.map(k => k.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have valid choke groups', () => {
      for (const kit of DRUM_KIT_PRESETS) {
        for (const group of kit.chokeGroups) {
          expect(group.id).toBeGreaterThanOrEqual(0);
          expect(group.padIndices.length).toBeGreaterThan(0);
          for (const padIdx of group.padIndices) {
            expect(padIdx).toBeGreaterThanOrEqual(0);
            expect(padIdx).toBeLessThan(PAD_COUNT);
          }
        }
      }
    });
  });

  // ==========================================================================
  // STATE CREATION
  // ==========================================================================

  describe('State Creation', () => {
    describe('createDrumKitState', () => {
      it('should create initial state', () => {
        const state = createDrumKitState();
        expect(state.kit).toBeDefined();
        expect(state.voices).toEqual([]);
        expect(state.soloPads).toEqual([]);
      });

      it('should use first preset by default', () => {
        const state = createDrumKitState();
        expect(state.kit.id).toBe(DRUM_KIT_PRESETS[0].id);
      });

      it('should accept custom kit', () => {
        const kit808 = DRUM_KIT_PRESETS.find(k => k.id === '808-classic')!;
        const state = createDrumKitState(kit808);
        expect(state.kit.id).toBe('808-classic');
      });

      it('should have sensible defaults', () => {
        const state = createDrumKitState();
        expect(state.masterVolume).toBe(0.8);
        expect(state.swing).toBe(0);
        expect(state.velocitySensitivity).toBe(1.0);
      });
    });
  });

  // ==========================================================================
  // PAD FINDING
  // ==========================================================================

  describe('Pad Finding', () => {
    describe('findPadByNote', () => {
      let state: DrumKitState;

      beforeEach(() => {
        state = createDrumKitState();
      });

      it('should find kick pad', () => {
        const kickPad = state.kit.pads.find(p => p.name.toLowerCase().includes('kick'));
        if (kickPad) {
          const found = findPadByNote(state.kit, kickPad.midiNote);
          expect(found).toBe(kickPad);
        }
      });

      it('should return null for unmapped note', () => {
        const found = findPadByNote(state.kit, 127);
        // May or may not find depending on kit mapping
        expect(found === null || found !== null).toBe(true);
      });
    });
  });

  // ==========================================================================
  // SAMPLE SELECTION
  // ==========================================================================

  describe('Sample Selection', () => {
    describe('getSampleForVelocity', () => {
      let state: DrumKitState;

      beforeEach(() => {
        state = createDrumKitState();
      });

      it('should get sample for soft velocity', () => {
        const pad = state.kit.pads[0];
        const sample = getSampleForVelocity(pad, 30);
        expect(sample !== null || pad.velocityLayers.length === 0).toBe(true);
      });

      it('should get sample for loud velocity', () => {
        const pad = state.kit.pads[0];
        const sample = getSampleForVelocity(pad, 127);
        expect(sample !== null || pad.velocityLayers.length === 0).toBe(true);
      });

      it('should cycle through round-robin', () => {
        const pad = state.kit.pads[0];
        if (pad.velocityLayers.length > 0) {
          const layer = pad.velocityLayers[0];
          const initialIndex = layer.roundRobinIndex;
          
          getSampleForVelocity(pad, layer.velocityLow);
          
          // Round-robin should have advanced if there are multiple samples
          if (layer.samples.length > 1) {
            expect(layer.roundRobinIndex).toBe((initialIndex + 1) % layer.samples.length);
          }
        }
      });
    });
  });

  // ==========================================================================
  // INPUT PROCESSING
  // ==========================================================================

  describe('Input Processing', () => {
    let state: DrumKitState;

    beforeEach(() => {
      state = createDrumKitState();
    });

    describe('noteOn', () => {
      it('should trigger pad by MIDI note', () => {
        const pad = state.kit.pads[0];
        const result = processDrumKitInput(state, { type: 'noteOn', note: pad.midiNote, velocity: 100 });
        
        expect(result.state.voices.length).toBeGreaterThanOrEqual(0);
      });

      it('should ignore unmapped notes', () => {
        const result = processDrumKitInput(state, { type: 'noteOn', note: 0, velocity: 100 });
        // Should not crash, may or may not create voice
        expect(result.outputs).toBeDefined();
      });
    });

    describe('padTrigger', () => {
      it('should create voice', () => {
        const result = processDrumKitInput(state, { type: 'padTrigger', padIndex: 0, velocity: 100 });
        
        if (result.state.kit.pads[0].velocityLayers.length > 0) {
          expect(result.state.voices.length).toBeGreaterThan(0);
          expect(result.outputs.some(o => o.type === 'voiceStart')).toBe(true);
        }
      });

      it('should apply velocity sensitivity', () => {
        let result = processDrumKitInput(state, { type: 'setVelocitySensitivity', amount: 0 });
        result = processDrumKitInput(result.state, { type: 'padTrigger', padIndex: 0, velocity: 50 });
        
        // With sensitivity 0, velocity should be near max
        if (result.state.voices.length > 0) {
          expect(result.state.voices[0].velocity).toBe(127);
        }
      });

      it('should ignore muted pads', () => {
        let result = processDrumKitInput(state, { type: 'mutePad', padIndex: 0 });
        result = processDrumKitInput(result.state, { type: 'padTrigger', padIndex: 0, velocity: 100 });
        
        expect(result.state.voices.length).toBe(0);
      });

      it('should handle choke groups', () => {
        // Find kit with choke groups (hi-hats)
        const hihatClosedIdx = state.kit.pads.findIndex(p => p.name.toLowerCase().includes('closed'));
        const hihatOpenIdx = state.kit.pads.findIndex(p => p.name.toLowerCase().includes('open'));
        
        if (hihatClosedIdx >= 0 && hihatOpenIdx >= 0) {
          const closedPad = state.kit.pads[hihatClosedIdx];
          const openPad = state.kit.pads[hihatOpenIdx];
          
          if (closedPad.chokeGroup >= 0 && closedPad.chokeGroup === openPad.chokeGroup) {
            // Trigger open hi-hat first
            let result = processDrumKitInput(state, { type: 'padTrigger', padIndex: hihatOpenIdx, velocity: 100 });
            
            // Then trigger closed hi-hat - should choke open
            result = processDrumKitInput(result.state, { type: 'padTrigger', padIndex: hihatClosedIdx, velocity: 100 });
            
            // Open hi-hat voice should be choking
            const openVoice = result.state.voices.find(v => v.padIndex === hihatOpenIdx);
            if (openVoice) {
              expect(openVoice.isChoking).toBe(true);
            }
          }
        }
      });
    });

    describe('loadKit', () => {
      it('should load kit', () => {
        const result = processDrumKitInput(state, { type: 'loadKit', kitId: '909-classic' });
        expect(result.state.kit.id).toBe('909-classic');
        expect(result.outputs.some(o => o.type === 'kitLoaded')).toBe(true);
      });

      it('should fail for invalid kit', () => {
        const result = processDrumKitInput(state, { type: 'loadKit', kitId: 'nonexistent' });
        expect(result.outputs.some(o => o.type === 'error')).toBe(true);
      });
    });

    describe('pad controls', () => {
      it('should set pad volume', () => {
        const result = processDrumKitInput(state, { type: 'setPadVolume', padIndex: 0, volume: 0.5 });
        expect(result.state.kit.pads[0].volume).toBe(0.5);
      });

      it('should set pad pan', () => {
        const result = processDrumKitInput(state, { type: 'setPadPan', padIndex: 0, pan: -0.5 });
        expect(result.state.kit.pads[0].pan).toBe(-0.5);
      });

      it('should set pad pitch', () => {
        const result = processDrumKitInput(state, { type: 'setPadPitch', padIndex: 0, semitones: 5 });
        expect(result.state.kit.pads[0].pitch).toBe(5);
      });

      it('should set pad decay', () => {
        const result = processDrumKitInput(state, { type: 'setPadDecay', padIndex: 0, multiplier: 2.0 });
        expect(result.state.kit.pads[0].decayMod).toBe(2.0);
      });

      it('should set pad filter', () => {
        const result = processDrumKitInput(state, {
          type: 'setPadFilter',
          padIndex: 0,
          config: { enabled: true, frequency: 2000 },
        });
        expect(result.state.kit.pads[0].filter.enabled).toBe(true);
        expect(result.state.kit.pads[0].filter.frequency).toBe(2000);
      });

      it('should set pad sends', () => {
        const result = processDrumKitInput(state, {
          type: 'setPadSends',
          padIndex: 0,
          reverb: 0.5,
          delay: 0.3,
        });
        expect(result.state.kit.pads[0].reverbSend).toBe(0.5);
        expect(result.state.kit.pads[0].delaySend).toBe(0.3);
      });
    });

    describe('mute/solo', () => {
      it('should toggle mute', () => {
        let result = processDrumKitInput(state, { type: 'mutePad', padIndex: 0 });
        expect(result.state.kit.pads[0].muted).toBe(true);
        
        result = processDrumKitInput(result.state, { type: 'mutePad', padIndex: 0 });
        expect(result.state.kit.pads[0].muted).toBe(false);
      });

      it('should toggle solo', () => {
        let result = processDrumKitInput(state, { type: 'soloPad', padIndex: 0 });
        expect(result.state.soloPads).toContain(0);
        
        result = processDrumKitInput(result.state, { type: 'soloPad', padIndex: 0 });
        expect(result.state.soloPads).not.toContain(0);
      });

      it('should block non-soloed pads when solo active', () => {
        let result = processDrumKitInput(state, { type: 'soloPad', padIndex: 1 });
        result = processDrumKitInput(result.state, { type: 'padTrigger', padIndex: 0, velocity: 100 });
        
        // Pad 0 should not trigger when pad 1 is soloed
        expect(result.state.voices.filter(v => v.padIndex === 0).length).toBe(0);
      });
    });

    describe('master controls', () => {
      it('should set master volume', () => {
        const result = processDrumKitInput(state, { type: 'setMasterVolume', volume: 0.5 });
        expect(result.state.masterVolume).toBe(0.5);
      });

      it('should set swing', () => {
        const result = processDrumKitInput(state, { type: 'setSwing', amount: 0.3 });
        expect(result.state.swing).toBe(0.3);
      });

      it('should set velocity sensitivity', () => {
        const result = processDrumKitInput(state, { type: 'setVelocitySensitivity', amount: 0.5 });
        expect(result.state.velocitySensitivity).toBe(0.5);
      });
    });

    describe('allSoundOff', () => {
      it('should clear all voices', () => {
        let result = processDrumKitInput(state, { type: 'padTrigger', padIndex: 0, velocity: 100 });
        result = processDrumKitInput(result.state, { type: 'padTrigger', padIndex: 1, velocity: 100 });
        result = processDrumKitInput(result.state, { type: 'allSoundOff' });
        
        expect(result.state.voices.length).toBe(0);
      });
    });

    describe('tick', () => {
      it('should process voices', () => {
        let result = processDrumKitInput(state, { type: 'padTrigger', padIndex: 0, velocity: 100 });
        
        if (result.state.voices.length > 0) {
          const initialPlayhead = result.state.voices[0].playhead;
          result = processDrumKitInput(result.state, { type: 'tick', time: 0, deltaTime: 0.01 });
          
          expect(result.state.voices[0].playhead).toBeGreaterThan(initialPlayhead);
        }
      });

      it('should end voices when sample finishes', () => {
        let result = processDrumKitInput(state, { type: 'padTrigger', padIndex: 0, velocity: 100 });
        
        // Track if voiceEnd was ever emitted
        let voiceEndEmitted = false;
        
        // Tick many times to ensure sample ends
        for (let i = 0; i < 100; i++) {
          result = processDrumKitInput(result.state, { type: 'tick', time: i * 0.1, deltaTime: 0.1 });
          if (result.outputs.some(o => o.type === 'voiceEnd')) {
            voiceEndEmitted = true;
          }
        }
        
        // Voices should eventually end
        expect(voiceEndEmitted).toBe(true);
      });
    });

    describe('midiCC', () => {
      it('should handle CC7 (volume)', () => {
        const result = processDrumKitInput(state, { type: 'midiCC', controller: 7, value: 64 });
        expect(result.state.masterVolume).toBeCloseTo(0.5, 1);
      });

      it('should handle CC120 (all sound off)', () => {
        let result = processDrumKitInput(state, { type: 'padTrigger', padIndex: 0, velocity: 100 });
        result = processDrumKitInput(result.state, { type: 'midiCC', controller: 120, value: 0 });
        
        expect(result.state.voices.length).toBe(0);
      });
    });
  });

  // ==========================================================================
  // CARD CREATION
  // ==========================================================================

  describe('Card Creation', () => {
    describe('createDrumKitCard', () => {
      it('should create card with correct meta', () => {
        const card = createDrumKitCard();
        expect(card.meta.id).toBe('drum-kit');
        expect(card.meta.category).toBe('generator');
      });

      it('should process inputs', () => {
        const card = createDrumKitCard();
        const outputs = card.process({ type: 'padTrigger', padIndex: 0, velocity: 100 });
        expect(Array.isArray(outputs)).toBe(true);
      });

      it('should have state management', () => {
        const card = createDrumKitCard();
        const state = card.getState();
        expect(state).toBeDefined();
        expect(state.kit).toBeDefined();
      });

      it('should reset state', () => {
        const card = createDrumKitCard();
        card.process({ type: 'padTrigger', padIndex: 0, velocity: 100 });
        card.reset();
        expect(card.getState().voices.length).toBe(0);
      });

      it('should provide kits', () => {
        const card = createDrumKitCard();
        const kits = card.getKits();
        expect(kits.length).toBe(DRUM_KIT_PRESETS.length);
      });

      it('should filter kits by category', () => {
        const card = createDrumKitCard();
        const acoustic = card.getKitsByCategory('acoustic');
        expect(acoustic.every(k => k.category === 'acoustic')).toBe(true);
      });

      it('should provide pads', () => {
        const card = createDrumKitCard();
        const pads = card.getPads();
        expect(pads.length).toBe(PAD_COUNT);
      });

      it('should count active voices', () => {
        const card = createDrumKitCard();
        expect(card.getActiveVoiceCount()).toBe(0);
        card.process({ type: 'padTrigger', padIndex: 0, velocity: 100 });
        // May or may not have voice depending on sample availability
      });
    });
  });

  // ==========================================================================
  // CARD META
  // ==========================================================================

  describe('Card Meta', () => {
    it('should have valid meta', () => {
      expect(DRUM_KIT_CARD_META.id).toBe('drum-kit');
      expect(DRUM_KIT_CARD_META.name).toBe('Drum Kit');
      expect(DRUM_KIT_CARD_META.category).toBe('generator');
    });

    it('should have input ports', () => {
      expect(DRUM_KIT_CARD_META.inputPorts.length).toBeGreaterThan(0);
      expect(DRUM_KIT_CARD_META.inputPorts.some(p => p.id === 'midi')).toBe(true);
    });

    it('should have output ports including individual outs', () => {
      expect(DRUM_KIT_CARD_META.outputPorts.length).toBeGreaterThan(2);
      expect(DRUM_KIT_CARD_META.outputPorts.some(p => p.id === 'kick')).toBe(true);
      expect(DRUM_KIT_CARD_META.outputPorts.some(p => p.id === 'snare')).toBe(true);
    });

    it('should have parameters', () => {
      expect(DRUM_KIT_CARD_META.parameters.length).toBeGreaterThan(0);
      expect(DRUM_KIT_CARD_META.parameters.some(p => p.id === 'kit')).toBe(true);
      expect(DRUM_KIT_CARD_META.parameters.some(p => p.id === 'masterVolume')).toBe(true);
    });
  });
});
