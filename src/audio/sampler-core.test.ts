/**
 * @fileoverview Tests for Sampler Core Module
 */

import { describe, it, expect } from 'vitest';
import {
  // Layer selection
  selectRandomLayer,
  selectSequenceLayer,
  selectRoundRobinLayer,
  RandomLayerConfig,
  SequenceLayerConfig,
  RoundRobinLayerConfig,
  
  // Crossfades
  calculateCrossfadeGain,
  getVelocityCrossfadePosition,
  getKeyCrossfadePosition,
  
  // Tempo detection
  detectTempo,
  
  // Drum kit
  detectDrumType,
  autoMapDrumKit,
  createDrumKitZones,
  
  // Voice management
  createVoice,
  createUnisonVoices,
  findVoicesToSteal,
  calculateGlidePitch,
  
  // Factory functions
  createDefaultLayerConfig,
  createDefaultUnisonConfig,
  createDefaultGlideConfig,
  
  // Constants
  GM_DRUM_MAP,
  EXTENDED_PERCUSSION_MAP,
  FULL_DRUM_MAP,
  DRUM_PATTERNS,
} from './sampler-core';

// ============================================================================
// LAYER SELECTION TESTS
// ============================================================================

describe('Layer Selection', () => {
  describe('selectRandomLayer', () => {
    it('should select a valid layer index', () => {
      const config: RandomLayerConfig = {
        mode: 'random',
        seed: null,
        weights: [0.25, 0.25, 0.25, 0.25],
        noRepeatCount: 0,
        history: [],
      };
      
      const { index } = selectRandomLayer(config, 4);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(4);
    });
    
    it('should respect weights', () => {
      const config: RandomLayerConfig = {
        mode: 'random',
        seed: 12345, // Fixed seed for reproducibility
        weights: [0.9, 0.05, 0.05, 0],
        noRepeatCount: 0,
        history: [],
      };
      
      // With high weight on first layer, most selections should be 0
      let count0 = 0;
      let testConfig = config;
      for (let i = 0; i < 100; i++) {
        const result = selectRandomLayer(testConfig, 4, i * 1000);
        if (result.index === 0) count0++;
        testConfig = result.config;
      }
      
      expect(count0).toBeGreaterThan(70); // Should be mostly 0s
    });
    
    it('should avoid repeating when noRepeatCount > 0', () => {
      const config: RandomLayerConfig = {
        mode: 'random',
        seed: null,
        weights: [0.25, 0.25, 0.25, 0.25],
        noRepeatCount: 2,
        history: [0, 1],
      };
      
      // Should not select 0 or 1
      for (let i = 0; i < 10; i++) {
        const { index } = selectRandomLayer(config, 4, i * 1000);
        expect([2, 3]).toContain(index);
      }
    });
    
    it('should update history', () => {
      const config: RandomLayerConfig = {
        mode: 'random',
        seed: 42,
        weights: [0.25, 0.25, 0.25, 0.25],
        noRepeatCount: 2,
        history: [],
      };
      
      const result = selectRandomLayer(config, 4);
      expect(result.config.history).toContain(result.index);
    });
  });
  
  describe('selectSequenceLayer', () => {
    it('should follow sequence order', () => {
      const config: SequenceLayerConfig = {
        mode: 'sequence',
        sequence: [2, 0, 3, 1],
        position: 0,
        loop: true,
        resetOnRelease: false,
        resetOnKeySwitch: false,
      };
      
      let testConfig = config;
      const selections: number[] = [];
      
      for (let i = 0; i < 4; i++) {
        const result = selectSequenceLayer(testConfig, 4);
        selections.push(result.index);
        testConfig = result.config;
      }
      
      expect(selections).toEqual([2, 0, 3, 1]);
    });
    
    it('should loop when enabled', () => {
      const config: SequenceLayerConfig = {
        mode: 'sequence',
        sequence: [0, 1],
        position: 0,
        loop: true,
        resetOnRelease: false,
        resetOnKeySwitch: false,
      };
      
      let testConfig = config;
      const selections: number[] = [];
      
      for (let i = 0; i < 6; i++) {
        const result = selectSequenceLayer(testConfig, 2);
        selections.push(result.index);
        testConfig = result.config;
      }
      
      expect(selections).toEqual([0, 1, 0, 1, 0, 1]);
    });
    
    it('should stop at end when not looping', () => {
      const config: SequenceLayerConfig = {
        mode: 'sequence',
        sequence: [0, 1, 2],
        position: 2,
        loop: false,
        resetOnRelease: false,
        resetOnKeySwitch: false,
      };
      
      const result1 = selectSequenceLayer(config, 3);
      expect(result1.index).toBe(2);
      
      const result2 = selectSequenceLayer(result1.config, 3);
      expect(result2.index).toBe(2); // Stays on last
    });
  });
  
  describe('selectRoundRobinLayer', () => {
    it('should cycle through layers', () => {
      const config: RoundRobinLayerConfig = {
        mode: 'roundRobin',
        currentIndex: 0,
        resetInterval: 0,
        lastTriggerTime: 0,
      };
      
      let testConfig = config;
      const selections: number[] = [];
      
      for (let i = 0; i < 6; i++) {
        const result = selectRoundRobinLayer(testConfig, 3);
        selections.push(result.index);
        testConfig = result.config;
      }
      
      expect(selections).toEqual([0, 1, 2, 0, 1, 2]);
    });
    
    it('should reset after interval', () => {
      const config: RoundRobinLayerConfig = {
        mode: 'roundRobin',
        currentIndex: 2,
        resetInterval: 1000,
        lastTriggerTime: 0,
      };
      
      // Trigger after reset interval
      const result = selectRoundRobinLayer(config, 4, 2000);
      expect(result.index).toBe(0); // Reset to 0
    });
  });
});

// ============================================================================
// CROSSFADE TESTS
// ============================================================================

describe('Crossfade Calculations', () => {
  describe('calculateCrossfadeGain', () => {
    it('should return correct gains for linear crossfade', () => {
      const start = calculateCrossfadeGain(0, 'linear');
      expect(start.gain1).toBeCloseTo(1, 5);
      expect(start.gain2).toBeCloseTo(0, 5);
      
      const mid = calculateCrossfadeGain(0.5, 'linear');
      expect(mid.gain1).toBeCloseTo(0.5, 5);
      expect(mid.gain2).toBeCloseTo(0.5, 5);
      
      const end = calculateCrossfadeGain(1, 'linear');
      expect(end.gain1).toBeCloseTo(0, 5);
      expect(end.gain2).toBeCloseTo(1, 5);
    });
    
    it('should maintain equal power for equalPower curve', () => {
      // At midpoint, both gains should be ~0.707 (1/sqrt(2))
      const mid = calculateCrossfadeGain(0.5, 'equalPower');
      expect(mid.gain1).toBeCloseTo(0.707, 2);
      expect(mid.gain2).toBeCloseTo(0.707, 2);
      
      // Power sum should be ~1
      const powerSum = mid.gain1 * mid.gain1 + mid.gain2 * mid.gain2;
      expect(powerSum).toBeCloseTo(1, 2);
    });
    
    it('should have smooth S-curve transition', () => {
      const mid = calculateCrossfadeGain(0.5, 'sCurve');
      expect(mid.gain1).toBeCloseTo(0.5, 2);
      expect(mid.gain2).toBeCloseTo(0.5, 2);
      
      // S-curve should be slower at ends
      const early = calculateCrossfadeGain(0.1, 'sCurve');
      expect(early.gain2).toBeLessThan(0.1); // Slower than linear
    });
  });
  
  describe('getVelocityCrossfadePosition', () => {
    it('should return 0 for velocity below crossfade region', () => {
      const pos = getVelocityCrossfadePosition(50, 70, 80, 20);
      expect(pos).toBe(0);
    });
    
    it('should return 1 for velocity above crossfade region', () => {
      const pos = getVelocityCrossfadePosition(100, 70, 80, 20);
      expect(pos).toBe(1);
    });
    
    it('should return 0.5 at boundary', () => {
      const pos = getVelocityCrossfadePosition(75, 70, 80, 20);
      expect(pos).toBeCloseTo(0.5, 2);
    });
  });
  
  describe('getKeyCrossfadePosition', () => {
    it('should calculate key crossfade correctly', () => {
      const pos = getKeyCrossfadePosition(60, 60, 61, 2);
      expect(pos).toBeCloseTo(0.25, 2);
    });
  });
});

// ============================================================================
// TEMPO DETECTION TESTS
// ============================================================================

describe('Tempo Detection', () => {
  describe('detectTempo', () => {
    it('should detect tempo from click track', () => {
      // Create a simple click track at 120 BPM
      const sampleRate = 44100;
      const duration = 4; // 4 seconds
      const bpm = 120;
      const clickInterval = (60 / bpm) * sampleRate;
      
      const samples = new Float32Array(sampleRate * duration);
      
      // Add clicks
      for (let beat = 0; beat < 8; beat++) {
        const pos = Math.floor(beat * clickInterval);
        // Short click
        for (let i = 0; i < 100 && pos + i < samples.length; i++) {
          samples[pos + i] = Math.exp(-i / 20) * 0.8;
        }
      }
      
      const result = detectTempo(samples, sampleRate);
      
      // Allow tolerance for tempo detection
      expect(result.bpm).toBeGreaterThan(100);
      expect(result.bpm).toBeLessThan(140);
      expect(result.beats.length).toBeGreaterThan(0);
    });
    
    it('should provide confidence score', () => {
      const samples = new Float32Array(44100);
      // Random noise - low confidence expected
      for (let i = 0; i < samples.length; i++) {
        samples[i] = (Math.random() - 0.5) * 0.1;
      }
      
      const result = detectTempo(samples, 44100);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
    
    it('should return time signature', () => {
      const samples = new Float32Array(44100);
      const result = detectTempo(samples, 44100);
      
      expect(result.timeSignature).toBeDefined();
      expect(result.timeSignature.numerator).toBe(4);
      expect(result.timeSignature.denominator).toBe(4);
    });
  });
});

// ============================================================================
// DRUM KIT TESTS
// ============================================================================

describe('Drum Kit', () => {
  describe('GM_DRUM_MAP', () => {
    it('should have standard GM drum assignments', () => {
      expect(GM_DRUM_MAP[36]).toBe('Bass Drum 1');
      expect(GM_DRUM_MAP[38]).toBe('Acoustic Snare');
      expect(GM_DRUM_MAP[42]).toBe('Closed Hi-Hat');
      expect(GM_DRUM_MAP[49]).toBe('Crash Cymbal 1');
    });
    
    it('should have extended range drums', () => {
      expect(GM_DRUM_MAP[27]).toBe('High Q');
      expect(GM_DRUM_MAP[82]).toBe('Shaker');
      expect(GM_DRUM_MAP[87]).toBe('Open Surdo');
    });
  });
  
  describe('EXTENDED_PERCUSSION_MAP', () => {
    it('should have tabla hits', () => {
      expect(EXTENDED_PERCUSSION_MAP[88]).toBe('Tabla Na');
      expect(EXTENDED_PERCUSSION_MAP[96]).toBe('Tabla Dha');
      expect(EXTENDED_PERCUSSION_MAP[99]).toBe('Tabla Tirakita');
    });
    
    it('should have baya hits', () => {
      expect(EXTENDED_PERCUSSION_MAP[100]).toBe('Baya Ge');
      expect(EXTENDED_PERCUSSION_MAP[103]).toBe('Baya Slide');
    });
    
    it('should have dholak hits', () => {
      expect(EXTENDED_PERCUSSION_MAP[106]).toBe('Dholak Na');
      expect(EXTENDED_PERCUSSION_MAP[109]).toBe('Dholak Dha');
    });
    
    it('should have mridangam hits', () => {
      expect(EXTENDED_PERCUSSION_MAP[112]).toBe('Mridangam Tha');
      expect(EXTENDED_PERCUSSION_MAP[117]).toBe('Mridangam Dheem');
    });
    
    it('should have djembe hits', () => {
      expect(EXTENDED_PERCUSSION_MAP[118]).toBe('Djembe Bass');
      expect(EXTENDED_PERCUSSION_MAP[120]).toBe('Djembe Slap');
    });
    
    it('should have cajon hits', () => {
      expect(EXTENDED_PERCUSSION_MAP[124]).toBe('Cajon Bass');
      expect(EXTENDED_PERCUSSION_MAP[127]).toBe('Cajon Ghost');
    });
  });
  
  describe('FULL_DRUM_MAP', () => {
    it('should combine GM and extended maps', () => {
      expect(FULL_DRUM_MAP[36]).toBe('Bass Drum 1');
      expect(FULL_DRUM_MAP[96]).toBe('Tabla Dha');
      expect(FULL_DRUM_MAP[118]).toBe('Djembe Bass');
    });
  });
  
  describe('detectDrumType', () => {
    it('should detect kick drum', () => {
      expect(detectDrumType('Kick_Hard.wav')).toBe(36);
      expect(detectDrumType('bass_drum_01.wav')).toBe(36);
      expect(detectDrumType('BD_Tight.aif')).toBe(36);
    });
    
    it('should detect snare drum', () => {
      expect(detectDrumType('Snare_Fat.wav')).toBe(38);
      expect(detectDrumType('SNR_Roll.wav')).toBe(38);
      expect(detectDrumType('SD_Crack.aif')).toBe(38);
    });
    
    it('should detect hi-hats', () => {
      expect(detectDrumType('HiHat_Closed.wav')).toBe(42);
      expect(detectDrumType('closed_hat_01.wav')).toBe(42);
      expect(detectDrumType('HH_Closed.wav')).toBe(42);
      expect(detectDrumType('open_hihat.wav')).toBe(46);
      expect(detectDrumType('openhat_01.wav')).toBe(46);
    });
    
    it('should detect cymbals', () => {
      expect(detectDrumType('Crash_Heavy.wav')).toBe(49);
      expect(detectDrumType('Ride_Bell.wav')).toBe(53);
    });
    
    it('should detect tabla hits', () => {
      expect(detectDrumType('Tabla_Na_01.wav')).toBe(88);
      expect(detectDrumType('tabla_dha.wav')).toBe(96);
      expect(detectDrumType('Tabla_Tirakita.aif')).toBe(99);
      expect(detectDrumType('baya_ge_soft.wav')).toBe(100);
      expect(detectDrumType('dayan_tin.wav')).toBe(89);
    });
    
    it('should detect dholak hits', () => {
      expect(detectDrumType('Dholak_Na.wav')).toBe(106);
      expect(detectDrumType('dholak_dha_loud.wav')).toBe(109);
    });
    
    it('should detect mridangam hits', () => {
      expect(detectDrumType('Mridangam_Thom.wav')).toBe(113);
      expect(detectDrumType('mridangam_dheem.wav')).toBe(117);
    });
    
    it('should detect djembe hits', () => {
      expect(detectDrumType('Djembe_Bass.wav')).toBe(118);
      expect(detectDrumType('djembe_slap_hard.wav')).toBe(120);
      expect(detectDrumType('djembe_tone.aif')).toBe(119);
    });
    
    it('should detect cajon hits', () => {
      expect(detectDrumType('Cajon_Bass.wav')).toBe(124);
      expect(detectDrumType('cajon_snare.wav')).toBe(125);
    });
    
    it('should detect world percussion', () => {
      expect(detectDrumType('Doumbek_Dum.wav')).toBe(118);
      expect(detectDrumType('taiko_hit.wav')).toBe(36);
      expect(detectDrumType('pandeiro.wav')).toBe(54);
    });
    
    it('should return null for unknown', () => {
      expect(detectDrumType('unknown_sound.wav')).toBeNull();
      expect(detectDrumType('lead_synth.wav')).toBeNull();
    });
  });
  
  describe('autoMapDrumKit', () => {
    it('should map samples to drum kit positions', () => {
      const samples = [
        { id: '1', filename: 'Kick_01.wav' },
        { id: '2', filename: 'Kick_02.wav' },
        { id: '3', filename: 'Snare_01.wav' },
        { id: '4', filename: 'HiHat_Closed.wav' },
      ];
      
      const mapping = autoMapDrumKit(samples);
      
      expect(mapping.get(36)).toEqual(['1', '2']); // Both kicks
      expect(mapping.get(38)).toEqual(['3']); // Snare
      expect(mapping.get(42)).toEqual(['4']); // Hi-hat
    });
  });
  
  describe('createDrumKitZones', () => {
    it('should create zones from mapping', () => {
      const mapping = new Map<number, string[]>([
        [36, ['kick1', 'kick2']],
        [38, ['snare1']],
      ]);
      
      const zones = createDrumKitZones(mapping);
      
      expect(zones.length).toBe(2);
      
      const kickZone = zones.find(z => z.keyLow === 36);
      expect(kickZone).toBeDefined();
      expect(kickZone!.sampleId).toBe('kick1');
      expect(kickZone!.layerSamples).toEqual(['kick2']);
      expect(kickZone!.pitchTracking).toBe(false);
    });
    
    it('should set hi-hat exclusive group', () => {
      const mapping = new Map<number, string[]>([
        [42, ['closed']],
        [46, ['open']],
      ]);
      
      const zones = createDrumKitZones(mapping);
      
      const closedHat = zones.find(z => z.keyLow === 42);
      const openHat = zones.find(z => z.keyLow === 46);
      
      expect(closedHat!.exclusiveGroup).toBe(1);
      expect(openHat!.exclusiveGroup).toBe(1);
    });
  });
});

// ============================================================================
// VOICE MANAGEMENT TESTS
// ============================================================================

describe('Voice Management', () => {
  describe('createVoice', () => {
    it('should create a voice with correct initial state', () => {
      const voice = createVoice('v1', 60, 100, 'zone1', 'sample1', 1000);
      
      expect(voice.id).toBe('v1');
      expect(voice.state).toBe('attack');
      expect(voice.note).toBe(60);
      expect(voice.velocity).toBe(100);
      expect(voice.playhead).toBe(0);
      expect(voice.currentPitch).toBe(60);
      expect(voice.targetPitch).toBe(60);
      expect(voice.outputGain).toBeCloseTo(100 / 127, 2);
    });
  });
  
  describe('createUnisonVoices', () => {
    it('should return single voice when unison is 1', () => {
      const baseVoice = createVoice('v1', 60, 100, 'zone1', 'sample1', 1000);
      const config = { voices: 1, detuneCents: 0, stereoSpread: 0, phaseRandom: 0 };
      
      const voices = createUnisonVoices(baseVoice, config, () => 'v2');
      
      expect(voices.length).toBe(1);
      expect(voices[0]).toEqual(baseVoice);
    });
    
    it('should create multiple detuned voices', () => {
      const baseVoice = createVoice('v1', 60, 100, 'zone1', 'sample1', 1000);
      const config = { voices: 3, detuneCents: 20, stereoSpread: 0.5, phaseRandom: 0 };
      let idCounter = 2;
      
      const voices = createUnisonVoices(baseVoice, config, () => `v${idCounter++}`);
      
      expect(voices.length).toBe(3);
      
      // First voice should keep original ID
      expect(voices[0].id).toBe('v1');
      expect(voices[0].isUnisonVoice).toBe(false);
      
      // Other voices should be marked as unison
      expect(voices[1].isUnisonVoice).toBe(true);
      expect(voices[1].parentVoiceId).toBe('v1');
      expect(voices[2].isUnisonVoice).toBe(true);
      
      // Voices should have different pitches (detuned)
      const pitches = voices.map(v => v.currentPitch);
      expect(new Set(pitches).size).toBe(3);
    });
  });
  
  describe('findVoicesToSteal', () => {
    it('should find oldest voices when priority is oldest', () => {
      const voices = [
        createVoice('v1', 60, 100, 'z', 's', 1000),
        createVoice('v2', 62, 100, 'z', 's', 2000),
        createVoice('v3', 64, 100, 'z', 's', 3000),
      ];
      
      const toSteal = findVoicesToSteal(voices, 'oldest', 1);
      
      expect(toSteal.length).toBe(1);
      expect(toSteal[0].id).toBe('v1');
    });
    
    it('should find newest voices when priority is newest', () => {
      const voices = [
        createVoice('v1', 60, 100, 'z', 's', 1000),
        createVoice('v2', 62, 100, 'z', 's', 2000),
        createVoice('v3', 64, 100, 'z', 's', 3000),
      ];
      
      const toSteal = findVoicesToSteal(voices, 'newest', 1);
      
      expect(toSteal.length).toBe(1);
      expect(toSteal[0].id).toBe('v3');
    });
    
    it('should find lowest notes when priority is lowest', () => {
      const voices = [
        createVoice('v1', 60, 100, 'z', 's', 1000),
        createVoice('v2', 72, 100, 'z', 's', 2000),
        createVoice('v3', 48, 100, 'z', 's', 3000),
      ];
      
      const toSteal = findVoicesToSteal(voices, 'lowest', 1);
      
      expect(toSteal.length).toBe(1);
      expect(toSteal[0].id).toBe('v3'); // Note 48 is lowest
    });
    
    it('should skip idle voices', () => {
      const voices = [
        createVoice('v1', 60, 100, 'z', 's', 1000),
        { ...createVoice('v2', 62, 100, 'z', 's', 500), state: 'idle' as const },
      ];
      
      const toSteal = findVoicesToSteal(voices, 'oldest', 1);
      
      expect(toSteal.length).toBe(0); // Only one active voice, no need to steal
    });
  });
  
  describe('calculateGlidePitch', () => {
    it('should return start pitch at progress 0', () => {
      const pitch = calculateGlidePitch(60, 72, 0, 'linear');
      expect(pitch).toBe(60);
    });
    
    it('should return end pitch at progress 1', () => {
      const pitch = calculateGlidePitch(60, 72, 1, 'linear');
      expect(pitch).toBe(72);
    });
    
    it('should return midpoint at progress 0.5 for linear', () => {
      const pitch = calculateGlidePitch(60, 72, 0.5, 'linear');
      expect(pitch).toBe(66);
    });
    
    it('should be slower at start for exponential curve', () => {
      const linearMid = calculateGlidePitch(60, 72, 0.5, 'linear');
      const expMid = calculateGlidePitch(60, 72, 0.5, 'exponential');
      
      expect(expMid).toBeLessThan(linearMid);
    });
  });
});

// ============================================================================
// FACTORY FUNCTION TESTS
// ============================================================================

describe('Factory Functions', () => {
  describe('createDefaultLayerConfig', () => {
    it('should create round-robin config', () => {
      const config = createDefaultLayerConfig('roundRobin');
      expect(config).toMatchObject({
        mode: 'roundRobin',
        currentIndex: 0,
      });
    });
    
    it('should create random config', () => {
      const config = createDefaultLayerConfig('random');
      expect(config).toMatchObject({
        mode: 'random',
        noRepeatCount: 1,
      });
    });
    
    it('should create sequence config', () => {
      const config = createDefaultLayerConfig('sequence');
      expect(config).toMatchObject({
        mode: 'sequence',
        loop: true,
      });
    });
    
    it('should return null for velocity mode', () => {
      const config = createDefaultLayerConfig('velocity');
      expect(config).toBeNull();
    });
  });
  
  describe('createDefaultUnisonConfig', () => {
    it('should create disabled unison config', () => {
      const config = createDefaultUnisonConfig();
      expect(config.voices).toBe(1);
      expect(config.detuneCents).toBe(0);
    });
  });
  
  describe('createDefaultGlideConfig', () => {
    it('should create disabled glide config', () => {
      const config = createDefaultGlideConfig();
      expect(config.enabled).toBe(false);
      expect(config.legatoOnly).toBe(true);
    });
  });
});
