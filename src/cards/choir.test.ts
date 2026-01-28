import { describe, it, expect } from 'vitest';
import {
  CHOIR_PRESETS,
  VOWEL_FORMANTS,
  CHARACTER_SHIFTS,
  getVoiceCount,
  interpolateFormant,
  interpolateVowelFormants,
  applyCharacterShift,
  createInitialChoirState,
  calculateVibratoDepth,
  CHOIR_CARD,
  type Vowel,
  type VoiceCharacter,
  type ChoirSize
} from './choir';

describe('ChoirCard', () => {
  describe('getVoiceCount', () => {
    it('returns correct voice counts for each size', () => {
      expect(getVoiceCount('solo')).toBe(1);
      expect(getVoiceCount('duet')).toBe(2);
      expect(getVoiceCount('trio')).toBe(3);
      expect(getVoiceCount('quartet')).toBe(4);
      expect(getVoiceCount('chamber')).toBe(12);
      expect(getVoiceCount('small')).toBe(24);
      expect(getVoiceCount('large')).toBe(48);
      expect(getVoiceCount('cathedral')).toBe(64);
    });
  });

  describe('interpolateFormant', () => {
    it('interpolates formant parameters correctly', () => {
      const f1 = { frequency: 500, amplitude: 0, bandwidth: 80 };
      const f2 = { frequency: 1000, amplitude: -10, bandwidth: 100 };
      
      const result = interpolateFormant(f1, f2, 0.5);
      
      expect(result.frequency).toBe(750);
      expect(result.amplitude).toBe(-5);
      expect(result.bandwidth).toBe(90);
    });

    it('returns f1 when t=0', () => {
      const f1 = { frequency: 500, amplitude: 0, bandwidth: 80 };
      const f2 = { frequency: 1000, amplitude: -10, bandwidth: 100 };
      
      const result = interpolateFormant(f1, f2, 0);
      
      expect(result).toEqual(f1);
    });

    it('returns f2 when t=1', () => {
      const f1 = { frequency: 500, amplitude: 0, bandwidth: 80 };
      const f2 = { frequency: 1000, amplitude: -10, bandwidth: 100 };
      
      const result = interpolateFormant(f1, f2, 1);
      
      expect(result).toEqual(f2);
    });
  });

  describe('interpolateVowelFormants', () => {
    it('interpolates all 5 formants', () => {
      const v1 = VOWEL_FORMANTS['a'];
      const v2 = VOWEL_FORMANTS['i'];
      
      const result = interpolateVowelFormants(v1, v2, 0.5);
      
      expect(result.f1.frequency).toBe((v1.f1.frequency + v2.f1.frequency) / 2);
      expect(result.f2.frequency).toBe((v1.f2.frequency + v2.f2.frequency) / 2);
      expect(result.f3.frequency).toBe((v1.f3.frequency + v2.f3.frequency) / 2);
      expect(result.f4.frequency).toBe((v1.f4.frequency + v2.f4.frequency) / 2);
      expect(result.f5.frequency).toBe((v1.f5.frequency + v2.f5.frequency) / 2);
    });
  });

  describe('applyCharacterShift', () => {
    it('shifts formant frequencies by character multiplier', () => {
      const formants = VOWEL_FORMANTS['a'];
      
      const male = applyCharacterShift(formants, 'male');
      expect(male.f1.frequency).toBe(formants.f1.frequency * CHARACTER_SHIFTS.male);
      
      const female = applyCharacterShift(formants, 'female');
      expect(female.f1.frequency).toBe(formants.f1.frequency * CHARACTER_SHIFTS.female);
      expect(female.f1.frequency).toBeGreaterThan(male.f1.frequency);
      
      const child = applyCharacterShift(formants, 'child');
      expect(child.f1.frequency).toBeGreaterThan(female.f1.frequency);
    });

    it('preserves amplitude and bandwidth', () => {
      const formants = VOWEL_FORMANTS['a'];
      const shifted = applyCharacterShift(formants, 'female');
      
      expect(shifted.f1.amplitude).toBe(formants.f1.amplitude);
      expect(shifted.f1.bandwidth).toBe(formants.f1.bandwidth);
    });
  });

  describe('createInitialChoirState', () => {
    it('creates valid initial state', () => {
      const state = createInitialChoirState();
      
      expect(state.voices).toEqual([]);
      expect(state.preset).toBeDefined();
      expect(state.preset.id).toBe('choir-init');
      expect(state.expression).toBe(1.0);
      expect(state.modulation).toBe(0.5);
      expect(state.breathController).toBe(0.5);
    });
  });

  describe('calculateVibratoDepth', () => {
    const config = {
      enabled: true,
      rate: 5.5,
      depth: 15,
      delay: 200,
      attack: 400
    };

    it('returns 0 when disabled', () => {
      const disabledConfig = { ...config, enabled: false };
      expect(calculateVibratoDepth(15, 1.0, 1000, disabledConfig)).toBe(0);
    });

    it('returns 0 during delay period', () => {
      expect(calculateVibratoDepth(15, 1.0, 100, config)).toBe(0);
      expect(calculateVibratoDepth(15, 1.0, 199, config)).toBe(0);
    });

    it('ramps up during attack phase', () => {
      const halfway = 200 + 200; // delay + half attack
      const depth = calculateVibratoDepth(15, 1.0, halfway, config);
      expect(depth).toBeGreaterThan(0);
      expect(depth).toBeLessThan(15);
    });

    it('reaches full depth after attack', () => {
      const fullTime = 200 + 400; // delay + attack
      const depth = calculateVibratoDepth(15, 1.0, fullTime, config);
      expect(depth).toBe(15);
    });

    it('scales with modulation', () => {
      const fullTime = 1000;
      const half = calculateVibratoDepth(15, 0.5, fullTime, config);
      const full = calculateVibratoDepth(15, 1.0, fullTime, config);
      expect(half).toBe(full / 2);
    });
  });

  describe('VOWEL_FORMANTS', () => {
    it('has formants for all vowels', () => {
      const vowels: Vowel[] = ['a', 'e', 'i', 'o', 'u', 'ae', 'uh', 'aa'];
      
      vowels.forEach(vowel => {
        expect(VOWEL_FORMANTS[vowel]).toBeDefined();
        expect(VOWEL_FORMANTS[vowel].f1).toBeDefined();
        expect(VOWEL_FORMANTS[vowel].f2).toBeDefined();
        expect(VOWEL_FORMANTS[vowel].f3).toBeDefined();
        expect(VOWEL_FORMANTS[vowel].f4).toBeDefined();
        expect(VOWEL_FORMANTS[vowel].f5).toBeDefined();
      });
    });

    it('has valid frequency ranges', () => {
      Object.values(VOWEL_FORMANTS).forEach(vowel => {
        expect(vowel.f1.frequency).toBeGreaterThan(100);
        expect(vowel.f1.frequency).toBeLessThan(1000);
        
        expect(vowel.f2.frequency).toBeGreaterThan(vowel.f1.frequency);
        expect(vowel.f3.frequency).toBeGreaterThan(vowel.f2.frequency);
        expect(vowel.f4.frequency).toBeGreaterThan(vowel.f3.frequency);
        expect(vowel.f5.frequency).toBeGreaterThan(vowel.f4.frequency);
      });
    });

    it('has negative or zero amplitudes', () => {
      Object.values(VOWEL_FORMANTS).forEach(vowel => {
        expect(vowel.f1.amplitude).toBeLessThanOrEqual(0);
        expect(vowel.f2.amplitude).toBeLessThanOrEqual(0);
        expect(vowel.f3.amplitude).toBeLessThanOrEqual(0);
        expect(vowel.f4.amplitude).toBeLessThanOrEqual(0);
        expect(vowel.f5.amplitude).toBeLessThanOrEqual(0);
      });
    });
  });

  describe('CHARACTER_SHIFTS', () => {
    it('has shifts for all characters', () => {
      const characters: VoiceCharacter[] = ['male', 'female', 'child', 'neutral'];
      
      characters.forEach(char => {
        expect(CHARACTER_SHIFTS[char]).toBeDefined();
        expect(CHARACTER_SHIFTS[char]).toBeGreaterThan(0);
      });
    });

    it('has increasing shifts from male to child', () => {
      expect(CHARACTER_SHIFTS.male).toBeLessThan(CHARACTER_SHIFTS.neutral);
      expect(CHARACTER_SHIFTS.neutral).toBeLessThan(CHARACTER_SHIFTS.female);
      expect(CHARACTER_SHIFTS.female).toBeLessThan(CHARACTER_SHIFTS.child);
    });
  });

  describe('CHOIR_PRESETS', () => {
    it('has at least 10 presets', () => {
      expect(CHOIR_PRESETS.length).toBeGreaterThanOrEqual(10);
    });

    it('has init preset as first', () => {
      expect(CHOIR_PRESETS[0].id).toBe('choir-init');
    });

    it('all presets have required fields', () => {
      CHOIR_PRESETS.forEach(preset => {
        expect(preset.id).toBeDefined();
        expect(preset.name).toBeDefined();
        expect(preset.category).toBeDefined();
        expect(preset.tags).toBeDefined();
        expect(Array.isArray(preset.tags)).toBe(true);
        expect(preset.size).toBeDefined();
        expect(preset.vowel).toBeDefined();
        expect(preset.character).toBeDefined();
        expect(preset.vibrato).toBeDefined();
        expect(preset.breath).toBeDefined();
        expect(preset.envelope).toBeDefined();
        expect(preset.humanization).toBeDefined();
        expect(preset.stereoWidth).toBeDefined();
        expect(preset.reverbMix).toBeDefined();
        expect(preset.brightness).toBeDefined();
        expect(preset.richness).toBeDefined();
        expect(preset.volume).toBeDefined();
      });
    });

    it('all presets have valid parameter ranges', () => {
      CHOIR_PRESETS.forEach(preset => {
        expect(preset.stereoWidth).toBeGreaterThanOrEqual(0);
        expect(preset.stereoWidth).toBeLessThanOrEqual(1);
        
        expect(preset.reverbMix).toBeGreaterThanOrEqual(0);
        expect(preset.reverbMix).toBeLessThanOrEqual(1);
        
        expect(preset.brightness).toBeGreaterThanOrEqual(-1);
        expect(preset.brightness).toBeLessThanOrEqual(1);
        
        expect(preset.richness).toBeGreaterThanOrEqual(0);
        expect(preset.richness).toBeLessThanOrEqual(1);
        
        expect(preset.vibrato.rate).toBeGreaterThan(0);
        expect(preset.vibrato.depth).toBeGreaterThanOrEqual(0);
        
        expect(preset.envelope.attack).toBeGreaterThanOrEqual(0);
        expect(preset.envelope.release).toBeGreaterThanOrEqual(0);
      });
    });

    it('covers multiple categories', () => {
      const categories = new Set(CHOIR_PRESETS.map(p => p.category));
      expect(categories.size).toBeGreaterThan(3);
      expect(categories.has('classical')).toBe(true);
    });
  });

  describe('CHOIR_CARD', () => {
    it('has correct basic properties', () => {
      expect(CHOIR_CARD.meta.id).toBe('choir');
      expect(CHOIR_CARD.meta.name).toBe('Choir');
      expect(CHOIR_CARD.meta.category).toBe('generator');
      expect(CHOIR_CARD.meta.version).toBe('1.0.0');
    });

    it('has required ports', () => {
      expect(CHOIR_CARD.ports.inputs.length).toBeGreaterThan(0);
      expect(CHOIR_CARD.ports.outputs.length).toBeGreaterThan(0);
      
      const midiIn = CHOIR_CARD.ports.inputs.find(p => p.name === 'midi-in');
      expect(midiIn).toBeDefined();
      expect(midiIn?.type).toBe('midi');
      
      const audioOut = CHOIR_CARD.ports.outputs.find(p => p.name === 'audio-out');
      expect(audioOut).toBeDefined();
      expect(audioOut?.type).toBe('audio');
    });

    it('has parameters', () => {
      expect(CHOIR_CARD.parameters.length).toBeGreaterThan(0);
      
      // Check for key parameters
      const vowelParam = CHOIR_CARD.parameters.find(p => p.id === 'vowel');
      expect(vowelParam).toBeDefined();
      expect(vowelParam?.type).toBe('enum');
      
      const sizeParam = CHOIR_CARD.parameters.find(p => p.id === 'size');
      expect(sizeParam).toBeDefined();
      
      const vibratoRateParam = CHOIR_CARD.parameters.find(p => p.id === 'vibratoRate');
      expect(vibratoRateParam).toBeDefined();
      expect(vibratoRateParam?.type).toBe('float');
    });

    it('has valid visuals', () => {
      expect(CHOIR_CARD.visuals.emoji).toBeDefined();
      expect(CHOIR_CARD.visuals.color).toBeDefined();
      expect(CHOIR_CARD.visuals.gradient).toBeDefined();
    });

    it('has valid behavior config', () => {
      expect(CHOIR_CARD.behavior.mode).toBe('audio');
      expect(CHOIR_CARD.behavior.cpuIntensity).toBe('heavy');
      expect(CHOIR_CARD.behavior.threadSafety).toBe('audio-safe');
    });

    it('has valid UI config', () => {
      expect(CHOIR_CARD.ui.panels).toBeDefined();
      expect(CHOIR_CARD.ui.defaultView).toBe('standard');
      expect(CHOIR_CARD.ui.minWidth).toBeDefined();
      expect(CHOIR_CARD.ui.resizable).toBe(true);
    });
  });
});
