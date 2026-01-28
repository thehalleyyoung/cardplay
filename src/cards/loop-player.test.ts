/**
 * Tests for LoopPlayerCard
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  // Constants
  MAX_LAYERS,
  MAX_SLICES,
  MIN_TEMPO,
  MAX_TEMPO,
  MIN_PITCH,
  MAX_PITCH,
  SAMPLE_RATE,
  
  // Types
  LoopData,
  LoopLayer,
  LoopPlayerState,
  KeyInfo,
  
  // Data
  FACTORY_LOOPS,
  LOOP_PLAYER_PRESETS,
  
  // Functions
  createLoopLayer,
  createLoopPlayerState,
  calculateStretchRatio,
  calculateKeyShift,
  generateBeatSlices,
  getNextPlayheadPosition,
  processLoopPlayerInput,
  createLoopPlayerCard,
  LOOP_PLAYER_CARD_META,
} from './loop-player';

describe('LoopPlayerCard', () => {
  // ==========================================================================
  // CONSTANTS
  // ==========================================================================

  describe('Constants', () => {
    it('should have correct max values', () => {
      expect(MAX_LAYERS).toBe(8);
      expect(MAX_SLICES).toBe(64);
    });

    it('should have valid tempo range', () => {
      expect(MIN_TEMPO).toBe(20);
      expect(MAX_TEMPO).toBe(300);
    });

    it('should have valid pitch range', () => {
      expect(MIN_PITCH).toBe(-24);
      expect(MAX_PITCH).toBe(24);
    });

    it('should use standard sample rate', () => {
      expect(SAMPLE_RATE).toBe(44100);
    });
  });

  // ==========================================================================
  // FACTORY LOOPS
  // ==========================================================================

  describe('Factory Loops', () => {
    it('should have 80+ factory loops', () => {
      expect(FACTORY_LOOPS.length).toBeGreaterThanOrEqual(80);
    });

    it('should have drum loops', () => {
      const drums = FACTORY_LOOPS.filter(l => l.category === 'drums');
      expect(drums.length).toBeGreaterThan(10);
    });

    it('should have bass loops', () => {
      const bass = FACTORY_LOOPS.filter(l => l.category === 'bass');
      expect(bass.length).toBeGreaterThan(5);
    });

    it('should have synth loops', () => {
      const synth = FACTORY_LOOPS.filter(l => l.category === 'synth');
      expect(synth.length).toBeGreaterThan(5);
    });

    it('should have percussion loops', () => {
      const perc = FACTORY_LOOPS.filter(l => l.category === 'percussion');
      expect(perc.length).toBeGreaterThan(5);
    });

    it('should have valid metadata for all loops', () => {
      for (const loop of FACTORY_LOOPS) {
        expect(loop.id).toBeTruthy();
        expect(loop.name).toBeTruthy();
        expect(loop.category).toBeTruthy();
        expect(loop.tags.length).toBeGreaterThan(0);
        expect(loop.originalTempo).toBeGreaterThan(0);
        expect(loop.lengthBars).toBeGreaterThan(0);
        expect(loop.isFactory).toBe(true);
      }
    });

    it('should have unique IDs', () => {
      const ids = FACTORY_LOOPS.map(l => l.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  // ==========================================================================
  // PRESETS
  // ==========================================================================

  describe('Presets', () => {
    it('should have 10+ presets', () => {
      expect(LOOP_PLAYER_PRESETS.length).toBeGreaterThanOrEqual(10);
    });

    it('should have house presets', () => {
      const house = LOOP_PLAYER_PRESETS.filter(p => p.category === 'House');
      expect(house.length).toBeGreaterThan(0);
    });

    it('should have techno presets', () => {
      const techno = LOOP_PLAYER_PRESETS.filter(p => p.category === 'Techno');
      expect(techno.length).toBeGreaterThan(0);
    });

    it('should have valid layers in all presets', () => {
      for (const preset of LOOP_PLAYER_PRESETS) {
        expect(preset.layers.length).toBeGreaterThan(0);
        expect(preset.layers.length).toBeLessThanOrEqual(MAX_LAYERS);
        for (const layer of preset.layers) {
          expect(layer.loopId).toBeTruthy();
          expect(layer.volume).toBeGreaterThanOrEqual(0);
          expect(layer.volume).toBeLessThanOrEqual(1);
        }
      }
    });

    it('should reference valid loops', () => {
      const loopIds = new Set(FACTORY_LOOPS.map(l => l.id));
      for (const preset of LOOP_PLAYER_PRESETS) {
        for (const layer of preset.layers) {
          expect(loopIds.has(layer.loopId)).toBe(true);
        }
      }
    });
  });

  // ==========================================================================
  // LAYER CREATION
  // ==========================================================================

  describe('Layer Creation', () => {
    describe('createLoopLayer', () => {
      it('should create layer with correct index', () => {
        const layer = createLoopLayer(3);
        expect(layer.index).toBe(3);
        expect(layer.id).toBe('layer-3');
      });

      it('should have no loop loaded', () => {
        const layer = createLoopLayer(0);
        expect(layer.loop).toBeNull();
        expect(layer.enabled).toBe(false);
      });

      it('should have sensible defaults', () => {
        const layer = createLoopLayer(0);
        expect(layer.volume).toBe(0.8);
        expect(layer.pan).toBe(0);
        expect(layer.pitch).toBe(0);
        expect(layer.direction).toBe('forward');
        expect(layer.muted).toBe(false);
        expect(layer.solo).toBe(false);
      });

      it('should have filter defaults', () => {
        const layer = createLoopLayer(0);
        expect(layer.filterEnabled).toBe(false);
        expect(layer.filterType).toBe('lowpass');
        expect(layer.filterFreq).toBe(20000);
      });
    });
  });

  // ==========================================================================
  // STATE CREATION
  // ==========================================================================

  describe('State Creation', () => {
    describe('createLoopPlayerState', () => {
      it('should create initial state', () => {
        const state = createLoopPlayerState();
        expect(state.isPlaying).toBe(false);
        expect(state.tempo).toBe(120);
        expect(state.globalPitch).toBe(0);
      });

      it('should have 8 layers', () => {
        const state = createLoopPlayerState();
        expect(state.layers.length).toBe(MAX_LAYERS);
      });

      it('should have factory loops in library', () => {
        const state = createLoopPlayerState();
        expect(state.library.size).toBe(FACTORY_LOOPS.length);
      });

      it('should have auto-match enabled by default', () => {
        const state = createLoopPlayerState();
        expect(state.autoMatchKey).toBe(true);
        expect(state.autoMatchTempo).toBe(true);
      });
    });
  });

  // ==========================================================================
  // STRETCH RATIO CALCULATION
  // ==========================================================================

  describe('Stretch Ratio Calculation', () => {
    describe('calculateStretchRatio', () => {
      it('should return 1 for same tempo', () => {
        expect(calculateStretchRatio(120, 120)).toBe(1);
      });

      it('should return 2 for half tempo', () => {
        expect(calculateStretchRatio(120, 60)).toBe(2);
      });

      it('should return 0.5 for double tempo', () => {
        expect(calculateStretchRatio(120, 240)).toBe(0.5);
      });

      it('should handle edge cases', () => {
        expect(calculateStretchRatio(0, 120)).toBe(1);
        expect(calculateStretchRatio(120, 0)).toBe(1);
      });
    });
  });

  // ==========================================================================
  // KEY SHIFT CALCULATION
  // ==========================================================================

  describe('Key Shift Calculation', () => {
    describe('calculateKeyShift', () => {
      it('should return 0 for same key', () => {
        expect(calculateKeyShift(0, 0)).toBe(0);
        expect(calculateKeyShift(7, 7)).toBe(0);
      });

      it('should calculate positive shift', () => {
        expect(calculateKeyShift(0, 5)).toBe(5);  // C to F
      });

      it('should calculate negative shift', () => {
        expect(calculateKeyShift(5, 0)).toBe(-5);  // F to C
      });

      it('should keep shift within ±6 semitones', () => {
        const shift = calculateKeyShift(0, 11);  // C to B
        expect(shift).toBe(-1);  // Should be -1, not 11
      });
    });
  });

  // ==========================================================================
  // SLICE GENERATION
  // ==========================================================================

  describe('Slice Generation', () => {
    describe('generateBeatSlices', () => {
      const mockLoop: LoopData = {
        id: 'test-loop',
        name: 'Test Loop',
        category: 'drums',
        tags: ['test'],
        originalTempo: 120,
        lengthBeats: 4,
        lengthBars: 1,
        timeSignatureNumerator: 4,
        timeSignatureDenominator: 4,
        isStereo: true,
        sampleRate: SAMPLE_RATE,
        totalSamples: SAMPLE_RATE * 2,  // 2 seconds at 120 BPM for 4 beats
        slices: [],
        isFactory: false,
      };

      it('should generate one slice per beat', () => {
        const slices = generateBeatSlices(mockLoop, 1);
        expect(slices.length).toBe(4);
      });

      it('should generate four slices per beat', () => {
        const slices = generateBeatSlices(mockLoop, 4);
        expect(slices.length).toBe(16);
      });

      it('should have correct beat markers', () => {
        const slices = generateBeatSlices(mockLoop, 1);
        expect(slices[0].isDownbeat).toBe(true);
        expect(slices[0].isBeat).toBe(true);
      });

      it('should have non-overlapping slice ranges', () => {
        const slices = generateBeatSlices(mockLoop, 2);
        for (let i = 0; i < slices.length - 1; i++) {
          expect(slices[i].endSample).toBe(slices[i + 1].startSample);
        }
      });
    });
  });

  // ==========================================================================
  // PLAYHEAD POSITION
  // ==========================================================================

  describe('Playhead Position', () => {
    describe('getNextPlayheadPosition', () => {
      it('should advance forward', () => {
        const result = getNextPlayheadPosition(0, 100, 'forward');
        expect(result.sample).toBe(1);
        expect(result.looped).toBe(false);
      });

      it('should loop forward', () => {
        const result = getNextPlayheadPosition(99, 100, 'forward');
        expect(result.sample).toBe(0);
        expect(result.looped).toBe(true);
      });

      it('should go backward', () => {
        const result = getNextPlayheadPosition(50, 100, 'reverse');
        expect(result.sample).toBe(49);
        expect(result.looped).toBe(false);
      });

      it('should loop backward', () => {
        const result = getNextPlayheadPosition(0, 100, 'reverse');
        expect(result.sample).toBe(99);
        expect(result.looped).toBe(true);
      });

      it('should handle pingpong ascending', () => {
        const result = getNextPlayheadPosition(98, 100, 'pingpong', { ascending: true });
        expect(result.sample).toBe(99);
        
        const result2 = getNextPlayheadPosition(99, 100, 'pingpong', { ascending: true });
        expect(result2.sample).toBe(98);
        expect(result2.pingpongState?.ascending).toBe(false);
      });

      it('should handle random', () => {
        const result = getNextPlayheadPosition(50, 100, 'random');
        expect(result.sample).toBeGreaterThanOrEqual(0);
        expect(result.sample).toBeLessThan(100);
      });
    });
  });

  // ==========================================================================
  // INPUT PROCESSING
  // ==========================================================================

  describe('Input Processing', () => {
    let state: LoopPlayerState;

    beforeEach(() => {
      state = createLoopPlayerState();
    });

    describe('play/stop/pause', () => {
      it('should start playback', () => {
        const result = processLoopPlayerInput(state, { type: 'play' });
        expect(result.state.isPlaying).toBe(true);
      });

      it('should stop and reset', () => {
        state = { ...state, isPlaying: true, currentBeat: 5 };
        const result = processLoopPlayerInput(state, { type: 'stop' });
        expect(result.state.isPlaying).toBe(false);
        expect(result.state.currentBeat).toBe(0);
      });

      it('should pause without reset', () => {
        state = { ...state, isPlaying: true, currentBeat: 5 };
        const result = processLoopPlayerInput(state, { type: 'pause' });
        expect(result.state.isPlaying).toBe(false);
        expect(result.state.currentBeat).toBe(5);
      });

      it('should reset position', () => {
        state = { ...state, currentBeat: 10 };
        const result = processLoopPlayerInput(state, { type: 'reset' });
        expect(result.state.currentBeat).toBe(0);
      });
    });

    describe('setTempo', () => {
      it('should set tempo', () => {
        const result = processLoopPlayerInput(state, { type: 'setTempo', bpm: 140 });
        expect(result.state.tempo).toBe(140);
      });

      it('should clamp tempo', () => {
        let result = processLoopPlayerInput(state, { type: 'setTempo', bpm: 500 });
        expect(result.state.tempo).toBe(MAX_TEMPO);

        result = processLoopPlayerInput(state, { type: 'setTempo', bpm: 5 });
        expect(result.state.tempo).toBe(MIN_TEMPO);
      });
    });

    describe('setGlobalPitch', () => {
      it('should set pitch', () => {
        const result = processLoopPlayerInput(state, { type: 'setGlobalPitch', semitones: 5 });
        expect(result.state.globalPitch).toBe(5);
      });

      it('should clamp pitch', () => {
        let result = processLoopPlayerInput(state, { type: 'setGlobalPitch', semitones: 50 });
        expect(result.state.globalPitch).toBe(MAX_PITCH);

        result = processLoopPlayerInput(state, { type: 'setGlobalPitch', semitones: -50 });
        expect(result.state.globalPitch).toBe(MIN_PITCH);
      });
    });

    describe('loadLoop', () => {
      it('should load loop into layer', () => {
        const loopId = 'drums-house-1';
        const result = processLoopPlayerInput(state, { type: 'loadLoop', layerIndex: 0, loopId });
        
        expect(result.state.layers[0].loop).not.toBeNull();
        expect(result.state.layers[0].loop?.id).toBe(loopId);
        expect(result.state.layers[0].enabled).toBe(true);
        expect(result.outputs.some(o => o.type === 'loopLoaded')).toBe(true);
      });

      it('should fail for invalid layer', () => {
        const result = processLoopPlayerInput(state, { type: 'loadLoop', layerIndex: 99, loopId: 'drums-house-1' });
        expect(result.outputs.some(o => o.type === 'error')).toBe(true);
      });

      it('should fail for invalid loop', () => {
        const result = processLoopPlayerInput(state, { type: 'loadLoop', layerIndex: 0, loopId: 'nonexistent' });
        expect(result.outputs.some(o => o.type === 'error')).toBe(true);
      });
    });

    describe('unloadLoop', () => {
      it('should unload loop from layer', () => {
        // First load a loop
        let result = processLoopPlayerInput(state, { type: 'loadLoop', layerIndex: 0, loopId: 'drums-house-1' });
        
        // Then unload
        result = processLoopPlayerInput(result.state, { type: 'unloadLoop', layerIndex: 0 });
        
        expect(result.state.layers[0].loop).toBeNull();
        expect(result.state.layers[0].enabled).toBe(false);
        expect(result.outputs.some(o => o.type === 'loopUnloaded')).toBe(true);
      });
    });

    describe('layer controls', () => {
      it('should set layer volume', () => {
        const result = processLoopPlayerInput(state, { type: 'setLayerVolume', layerIndex: 0, volume: 0.5 });
        expect(result.state.layers[0].volume).toBe(0.5);
      });

      it('should set layer pan', () => {
        const result = processLoopPlayerInput(state, { type: 'setLayerPan', layerIndex: 0, pan: -0.5 });
        expect(result.state.layers[0].pan).toBe(-0.5);
      });

      it('should set layer pitch', () => {
        const result = processLoopPlayerInput(state, { type: 'setLayerPitch', layerIndex: 0, semitones: 7 });
        expect(result.state.layers[0].pitch).toBe(7);
      });

      it('should set layer direction', () => {
        const result = processLoopPlayerInput(state, { type: 'setLayerDirection', layerIndex: 0, direction: 'reverse' });
        expect(result.state.layers[0].direction).toBe('reverse');
      });

      it('should toggle mute', () => {
        let result = processLoopPlayerInput(state, { type: 'muteLayer', layerIndex: 0 });
        expect(result.state.layers[0].muted).toBe(true);
        
        result = processLoopPlayerInput(result.state, { type: 'muteLayer', layerIndex: 0 });
        expect(result.state.layers[0].muted).toBe(false);
      });

      it('should toggle solo', () => {
        let result = processLoopPlayerInput(state, { type: 'soloLayer', layerIndex: 0 });
        expect(result.state.soloLayers).toContain('layer-0');
        
        result = processLoopPlayerInput(result.state, { type: 'soloLayer', layerIndex: 0 });
        expect(result.state.soloLayers).not.toContain('layer-0');
      });
    });

    describe('filter controls', () => {
      it('should enable filter', () => {
        const result = processLoopPlayerInput(state, {
          type: 'setLayerFilter',
          layerIndex: 0,
          config: { enabled: true, type: 'highpass', freq: 500 },
        });
        
        expect(result.state.layers[0].filterEnabled).toBe(true);
        expect(result.state.layers[0].filterType).toBe('highpass');
        expect(result.state.layers[0].filterFreq).toBe(500);
      });
    });

    describe('sends', () => {
      it('should set reverb send', () => {
        const result = processLoopPlayerInput(state, {
          type: 'setLayerSends',
          layerIndex: 0,
          reverb: 0.5,
        });
        expect(result.state.layers[0].reverbSend).toBe(0.5);
      });

      it('should set delay send', () => {
        const result = processLoopPlayerInput(state, {
          type: 'setLayerSends',
          layerIndex: 0,
          delay: 0.3,
        });
        expect(result.state.layers[0].delaySend).toBe(0.3);
      });
    });

    describe('loadPreset', () => {
      it('should load preset', () => {
        const result = processLoopPlayerInput(state, { type: 'loadPreset', presetId: 'house-groove-1' });
        
        expect(result.state.currentPreset).toBe('house-groove-1');
        expect(result.state.tempo).toBe(124);
        expect(result.outputs.some(o => o.type === 'presetLoaded')).toBe(true);
      });

      it('should configure layers from preset', () => {
        const result = processLoopPlayerInput(state, { type: 'loadPreset', presetId: 'house-groove-1' });
        
        // House groove has drums, bass, synth stabs
        expect(result.state.layers[0].enabled).toBe(true);
        expect(result.state.layers[0].loop).not.toBeNull();
      });

      it('should fail for invalid preset', () => {
        const result = processLoopPlayerInput(state, { type: 'loadPreset', presetId: 'nonexistent' });
        expect(result.outputs.some(o => o.type === 'error')).toBe(true);
      });
    });

    describe('key settings', () => {
      it('should set key root', () => {
        const result = processLoopPlayerInput(state, { type: 'setKeyRoot', root: 7 });
        expect(result.state.keyRoot).toBe(7);
      });

      it('should wrap key root', () => {
        const result = processLoopPlayerInput(state, { type: 'setKeyRoot', root: 15 });
        expect(result.state.keyRoot).toBe(3);
      });

      it('should set key scale', () => {
        const result = processLoopPlayerInput(state, { type: 'setKeyScale', scale: 'major' });
        expect(result.state.keyScale).toBe('major');
      });
    });

    describe('auto-match settings', () => {
      it('should toggle auto-match key', () => {
        const result = processLoopPlayerInput(state, { type: 'setAutoMatchKey', enabled: false });
        expect(result.state.autoMatchKey).toBe(false);
      });

      it('should toggle auto-match tempo', () => {
        const result = processLoopPlayerInput(state, { type: 'setAutoMatchTempo', enabled: false });
        expect(result.state.autoMatchTempo).toBe(false);
      });
    });

    describe('tick', () => {
      it('should not output when stopped', () => {
        const result = processLoopPlayerInput(state, { type: 'tick', time: 0, beat: 0 });
        expect(result.outputs.length).toBe(0);
      });

      it('should output beat sync', () => {
        state = { ...state, isPlaying: true, currentBeat: 0.9 };
        const result = processLoopPlayerInput(state, { type: 'tick', time: 100, beat: 1.0 });
        expect(result.outputs.some(o => o.type === 'beatSync')).toBe(true);
      });
    });

    describe('MIDI', () => {
      it('should handle MIDI CC 7 (volume)', () => {
        const result = processLoopPlayerInput(state, { type: 'midiCC', controller: 7, value: 64 });
        expect(result.state.masterVolume).toBeCloseTo(0.5, 1);
      });
    });

    describe('slicing', () => {
      it('should slice loop', () => {
        // First load a loop
        let result = processLoopPlayerInput(state, { type: 'loadLoop', layerIndex: 0, loopId: 'drums-house-1' });
        
        // Then slice it
        result = processLoopPlayerInput(result.state, { type: 'sliceLoop', layerIndex: 0, sliceCount: 16 });
        
        expect(result.state.layers[0].loop?.slices.length).toBeGreaterThan(0);
        expect(result.outputs.some(o => o.type === 'slicesGenerated')).toBe(true);
      });
    });
  });

  // ==========================================================================
  // CARD CREATION
  // ==========================================================================

  describe('Card Creation', () => {
    describe('createLoopPlayerCard', () => {
      it('should create card with correct meta', () => {
        const card = createLoopPlayerCard();
        expect(card.meta.id).toBe('loop-player');
        expect(card.meta.category).toBe('generator');
      });

      it('should process inputs', () => {
        const card = createLoopPlayerCard();
        const outputs = card.process({ type: 'play' });
        expect(Array.isArray(outputs)).toBe(true);
      });

      it('should have state management', () => {
        const card = createLoopPlayerCard();
        const state = card.getState();
        expect(state).toBeDefined();
        expect(state.layers.length).toBe(MAX_LAYERS);
      });

      it('should reset state', () => {
        const card = createLoopPlayerCard();
        card.process({ type: 'play' });
        card.reset();
        expect(card.getState().isPlaying).toBe(false);
      });

      it('should provide presets', () => {
        const card = createLoopPlayerCard();
        const presets = card.getPresets();
        expect(presets.length).toBeGreaterThan(0);
      });

      it('should provide factory loops', () => {
        const card = createLoopPlayerCard();
        const loops = card.getFactoryLoops();
        expect(loops.length).toBe(FACTORY_LOOPS.length);
      });

      it('should filter loops by category', () => {
        const card = createLoopPlayerCard();
        const drums = card.getLoopsByCategory('drums');
        expect(drums.every(l => l.category === 'drums')).toBe(true);
      });

      it('should search loops', () => {
        const card = createLoopPlayerCard();
        const results = card.searchLoops('house');
        expect(results.length).toBeGreaterThan(0);
        expect(results.some(l => l.name.toLowerCase().includes('house') || l.tags.includes('house'))).toBe(true);
      });
    });
  });

  // ==========================================================================
  // CARD META
  // ==========================================================================

  describe('Card Meta', () => {
    it('should have valid meta', () => {
      expect(LOOP_PLAYER_CARD_META.id).toBe('loop-player');
      expect(LOOP_PLAYER_CARD_META.name).toBe('Loop Player');
      expect(LOOP_PLAYER_CARD_META.category).toBe('generator');
    });

    it('should have input ports', () => {
      expect(LOOP_PLAYER_CARD_META.inputPorts.length).toBeGreaterThan(0);
      expect(LOOP_PLAYER_CARD_META.inputPorts.some(p => p.id === 'transport')).toBe(true);
      expect(LOOP_PLAYER_CARD_META.inputPorts.some(p => p.id === 'midi')).toBe(true);
    });

    it('should have output ports', () => {
      expect(LOOP_PLAYER_CARD_META.outputPorts.length).toBeGreaterThan(0);
      expect(LOOP_PLAYER_CARD_META.outputPorts.some(p => p.id === 'audio-l')).toBe(true);
      expect(LOOP_PLAYER_CARD_META.outputPorts.some(p => p.id === 'audio-r')).toBe(true);
    });

    it('should have parameters', () => {
      expect(LOOP_PLAYER_CARD_META.parameters.length).toBeGreaterThan(0);
      expect(LOOP_PLAYER_CARD_META.parameters.some(p => p.id === 'tempo')).toBe(true);
      expect(LOOP_PLAYER_CARD_META.parameters.some(p => p.id === 'stretchAlgorithm')).toBe(true);
    });
  });
});
