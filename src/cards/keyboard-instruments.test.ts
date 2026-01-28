/**
 * Tests for keyboard instrument cards (Piano, Electric Piano, Mallet)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createPianoCard,
  createElectricPianoCard,
  createMalletCard,
  PIANO_CARD_META,
  ELECTRIC_PIANO_CARD_META,
  MALLET_CARD_META,
  PIANO_PRESETS,
  ELECTRIC_PIANO_PRESETS,
  MALLET_PRESETS,
  PIANO_PARAMETERS,
  ELECTRIC_PIANO_PARAMETERS,
  MALLET_PARAMETERS,
} from './keyboard-instruments';

describe('PianoCard', () => {
  describe('createPianoCard', () => {
    it('creates card with correct meta', () => {
      const card = createPianoCard();
      expect(card.meta).toEqual(PIANO_CARD_META);
      expect(card.meta.id).toBe('piano');
      expect(card.meta.name).toBe('Piano');
      expect(card.meta.category).toBe('generators');
    });

    it('has correct signature', () => {
      const card = createPianoCard();
      expect(card.signature.inputs).toHaveLength(0);
      expect(card.signature.outputs).toHaveLength(1);
      expect(card.signature.outputs[0].name).toBe('midi');
      expect(card.signature.outputs[0].type).toBe('midi');
    });

    it('has all expected parameters', () => {
      const card = createPianoCard();
      expect(card.signature.params.length).toBeGreaterThan(0);
      
      const paramIds = card.signature.params.map(p => p.id);
      expect(paramIds).toContain('type');
      expect(paramIds).toContain('velocityLayers');
      expect(paramIds).toContain('sympatheticResonance');
      expect(paramIds).toContain('sustainPedal');
      expect(paramIds).toContain('tone');
    });

    it('processes with default parameters', () => {
      const card = createPianoCard();
      const result = card.process({}, {}, { time: 0, transport: { playing: false, tick: 0, tempo: 120, timeSignature: [4, 4] } });
      expect(result.output).toHaveProperty('midi');
      expect(Array.isArray(result.output.midi)).toBe(true);
    });

    it('updates state from parameters', () => {
      const card = createPianoCard();
      
      const result = card.process({}, {
        type: 'upright',
        velocityCurve: 0.7,
        sympatheticResonance: 0.5,
        tone: 0.3,
      }, { time: 0, transport: { playing: false, tick: 0, tempo: 120, timeSignature: [4, 4] } });
      
      expect(result.output).toHaveProperty('midi');
    });
  });

  describe('PIANO_PARAMETERS', () => {
    it('has type parameter', () => {
      expect(PIANO_PARAMETERS.type).toBeDefined();
      expect(PIANO_PARAMETERS.type.type).toBe('enum');
      expect(PIANO_PARAMETERS.type.options).toContain('grand');
      expect(PIANO_PARAMETERS.type.options).toContain('upright');
    });

    it('has velocity curve parameter', () => {
      expect(PIANO_PARAMETERS.velocityCurve).toBeDefined();
      expect(PIANO_PARAMETERS.velocityCurve.type).toBe('float');
      expect(PIANO_PARAMETERS.velocityCurve.min).toBe(0);
      expect(PIANO_PARAMETERS.velocityCurve.max).toBe(1);
    });

    it('has sustain pedal with CC mapping', () => {
      expect(PIANO_PARAMETERS.sustainPedal).toBeDefined();
      expect(PIANO_PARAMETERS.sustainPedal.ccNumber).toBe(64);
    });

    it('groups parameters logically', () => {
      expect(PIANO_PARAMETERS.type.group).toBe('instrument');
      expect(PIANO_PARAMETERS.sustainPedal.group).toBe('pedals');
      expect(PIANO_PARAMETERS.tone.group).toBe('eq');
    });
  });

  describe('PIANO_PRESETS', () => {
    it('has factory presets', () => {
      expect(PIANO_PRESETS.length).toBeGreaterThan(0);
      PIANO_PRESETS.forEach(preset => {
        expect(preset.isFactory).toBe(true);
      });
    });

    it('has concert grand preset', () => {
      const concertGrand = PIANO_PRESETS.find(p => p.id === 'piano-concert-grand');
      expect(concertGrand).toBeDefined();
      expect(concertGrand!.params.type).toBe('grand');
      expect(concertGrand!.params.velocityLayers).toBe(8);
    });

    it('has felt piano preset', () => {
      const felt = PIANO_PRESETS.find(p => p.id === 'piano-felt');
      expect(felt).toBeDefined();
      expect(felt!.params.type).toBe('felt');
      expect(felt!.tags).toContain('soft');
    });

    it('has honky-tonk preset with detuning', () => {
      const honkyTonk = PIANO_PRESETS.find(p => p.id === 'piano-honky-tonk');
      expect(honkyTonk).toBeDefined();
      expect(honkyTonk!.params.detune).toBeGreaterThan(0);
    });

    it('all presets have valid parameters', () => {
      PIANO_PRESETS.forEach(preset => {
        expect(preset.params).toHaveProperty('type');
        expect(preset.params).toHaveProperty('velocityLayers');
        expect(preset.params).toHaveProperty('tone');
      });
    });
  });
});

describe('ElectricPianoCard', () => {
  describe('createElectricPianoCard', () => {
    it('creates card with correct meta', () => {
      const card = createElectricPianoCard();
      expect(card.meta).toEqual(ELECTRIC_PIANO_CARD_META);
      expect(card.meta.id).toBe('electric-piano');
      expect(card.meta.name).toBe('Electric Piano');
      expect(card.meta.category).toBe('generators');
    });

    it('has correct signature', () => {
      const card = createElectricPianoCard();
      expect(card.signature.inputs).toHaveLength(0);
      expect(card.signature.outputs).toHaveLength(1);
      expect(card.signature.outputs[0].name).toBe('midi');
    });

    it('has all expected parameters', () => {
      const card = createElectricPianoCard();
      
      const paramIds = card.signature.params.map(p => p.id);
      expect(paramIds).toContain('type');
      expect(paramIds).toContain('bell');
      expect(paramIds).toContain('bark');
      expect(paramIds).toContain('phaser');
      expect(paramIds).toContain('chorus');
    });

    it('processes with default parameters', () => {
      const card = createElectricPianoCard();
      const result = card.process({}, {}, { time: 0, transport: { playing: false, tick: 0, tempo: 120, timeSignature: [4, 4] } });
      expect(result.output).toHaveProperty('midi');
    });

    it('updates state from parameters', () => {
      const card = createElectricPianoCard();
      
      const result = card.process({}, {
        type: 'wurlitzer',
        bell: 0.8,
        bark: 0.4,
        phaser: true,
        phaserRate: 0.5,
      }, { time: 0, transport: { playing: false, tick: 0, tempo: 120, timeSignature: [4, 4] } });
      
      expect(result.output).toHaveProperty('midi');
    });
  });

  describe('ELECTRIC_PIANO_PARAMETERS', () => {
    it('has type parameter with rhodes/wurlitzer options', () => {
      expect(ELECTRIC_PIANO_PARAMETERS.type).toBeDefined();
      expect(ELECTRIC_PIANO_PARAMETERS.type.options).toContain('rhodes-mk1');
      expect(ELECTRIC_PIANO_PARAMETERS.type.options).toContain('wurlitzer');
      expect(ELECTRIC_PIANO_PARAMETERS.type.options).toContain('clavinet');
    });

    it('has bell parameter', () => {
      expect(ELECTRIC_PIANO_PARAMETERS.bell).toBeDefined();
      expect(ELECTRIC_PIANO_PARAMETERS.bell.type).toBe('float');
      expect(ELECTRIC_PIANO_PARAMETERS.bell.modulatable).toBe(true);
    });

    it('has effect parameters', () => {
      expect(ELECTRIC_PIANO_PARAMETERS.phaser).toBeDefined();
      expect(ELECTRIC_PIANO_PARAMETERS.phaser.type).toBe('bool');
      expect(ELECTRIC_PIANO_PARAMETERS.chorus).toBeDefined();
      expect(ELECTRIC_PIANO_PARAMETERS.drive).toBeDefined();
    });

    it('groups parameters logically', () => {
      expect(ELECTRIC_PIANO_PARAMETERS.bell.group).toBe('timbre');
      expect(ELECTRIC_PIANO_PARAMETERS.phaser.group).toBe('effects');
      expect(ELECTRIC_PIANO_PARAMETERS.tremoloDepth.group).toBe('modulation');
    });
  });

  describe('ELECTRIC_PIANO_PRESETS', () => {
    it('has factory presets', () => {
      expect(ELECTRIC_PIANO_PRESETS.length).toBeGreaterThan(0);
      ELECTRIC_PIANO_PRESETS.forEach(preset => {
        expect(preset.isFactory).toBe(true);
      });
    });

    it('has Rhodes classic preset', () => {
      const rhodesClassic = ELECTRIC_PIANO_PRESETS.find(p => p.id === 'epiano-rhodes-classic');
      expect(rhodesClassic).toBeDefined();
      expect(rhodesClassic!.params.type).toBe('rhodes-mk1');
      expect(rhodesClassic!.tags).toContain('rhodes');
    });

    it('has Rhodes with phaser', () => {
      const rhodesPhaser = ELECTRIC_PIANO_PRESETS.find(p => p.id === 'epiano-rhodes-phaser');
      expect(rhodesPhaser).toBeDefined();
      expect(rhodesPhaser!.params.phaser).toBe(true);
    });

    it('has Wurlitzer preset', () => {
      const wurlitzer = ELECTRIC_PIANO_PRESETS.find(p => p.id === 'epiano-wurlitzer');
      expect(wurlitzer).toBeDefined();
      expect(wurlitzer!.params.type).toBe('wurlitzer');
      expect(wurlitzer!.params.bell).toBeGreaterThan(0.5);
    });

    it('has Clavinet preset with phaser', () => {
      const clavinet = ELECTRIC_PIANO_PRESETS.find(p => p.id === 'epiano-clavinet');
      expect(clavinet).toBeDefined();
      expect(clavinet!.params.type).toBe('clavinet');
      expect(clavinet!.params.bark).toBeGreaterThan(0.5);
    });

    it('all presets have valid parameters', () => {
      ELECTRIC_PIANO_PRESETS.forEach(preset => {
        expect(preset.params).toHaveProperty('type');
        expect(preset.params).toHaveProperty('bell');
        expect(preset.params).toHaveProperty('bark');
      });
    });
  });
});

describe('MalletCard', () => {
  describe('createMalletCard', () => {
    it('creates card with correct meta', () => {
      const card = createMalletCard();
      expect(card.meta).toEqual(MALLET_CARD_META);
      expect(card.meta.id).toBe('mallet');
      expect(card.meta.name).toBe('Mallet Instruments');
      expect(card.meta.category).toBe('generators');
    });

    it('has correct signature', () => {
      const card = createMalletCard();
      expect(card.signature.inputs).toHaveLength(0);
      expect(card.signature.outputs).toHaveLength(1);
      expect(card.signature.outputs[0].name).toBe('midi');
    });

    it('has all expected parameters', () => {
      const card = createMalletCard();
      
      const paramIds = card.signature.params.map(p => p.id);
      expect(paramIds).toContain('type');
      expect(paramIds).toContain('malletHardness');
      expect(paramIds).toContain('motorVibrato');
      expect(paramIds).toContain('resonance');
      expect(paramIds).toContain('rollMode');
    });

    it('processes with default parameters', () => {
      const card = createMalletCard();
      const result = card.process({}, {}, { time: 0, transport: { playing: false, tick: 0, tempo: 120, timeSignature: [4, 4] } });
      expect(result.output).toHaveProperty('midi');
    });

    it('updates state from parameters', () => {
      const card = createMalletCard();
      
      const result = card.process({}, {
        type: 'vibraphone',
        malletHardness: 0.6,
        motorVibrato: true,
        motorRate: 6,
        resonance: 0.8,
      }, { time: 0, transport: { playing: false, tick: 0, tempo: 120, timeSignature: [4, 4] } });
      
      expect(result.output).toHaveProperty('midi');
    });
  });

  describe('MALLET_PARAMETERS', () => {
    it('has type parameter with mallet instruments', () => {
      expect(MALLET_PARAMETERS.type).toBeDefined();
      expect(MALLET_PARAMETERS.type.options).toContain('vibraphone');
      expect(MALLET_PARAMETERS.type.options).toContain('marimba');
      expect(MALLET_PARAMETERS.type.options).toContain('xylophone');
      expect(MALLET_PARAMETERS.type.options).toContain('kalimba');
    });

    it('has mallet hardness parameter', () => {
      expect(MALLET_PARAMETERS.malletHardness).toBeDefined();
      expect(MALLET_PARAMETERS.malletHardness.type).toBe('float');
      expect(MALLET_PARAMETERS.malletHardness.modulatable).toBe(true);
    });

    it('has motor vibrato parameters', () => {
      expect(MALLET_PARAMETERS.motorVibrato).toBeDefined();
      expect(MALLET_PARAMETERS.motorRate).toBeDefined();
      expect(MALLET_PARAMETERS.motorDepth).toBeDefined();
    });

    it('has roll mode parameters', () => {
      expect(MALLET_PARAMETERS.rollMode).toBeDefined();
      expect(MALLET_PARAMETERS.rollSpeed).toBeDefined();
    });

    it('groups parameters logically', () => {
      expect(MALLET_PARAMETERS.malletHardness.group).toBe('articulation');
      expect(MALLET_PARAMETERS.motorVibrato.group).toBe('modulation');
      expect(MALLET_PARAMETERS.resonance.group).toBe('timbre');
    });
  });

  describe('MALLET_PRESETS', () => {
    it('has factory presets', () => {
      expect(MALLET_PRESETS.length).toBeGreaterThan(0);
      MALLET_PRESETS.forEach(preset => {
        expect(preset.isFactory).toBe(true);
      });
    });

    it('has vibraphone with motor preset', () => {
      const vibesClassic = MALLET_PRESETS.find(p => p.id === 'mallet-vibes-classic');
      expect(vibesClassic).toBeDefined();
      expect(vibesClassic!.params.type).toBe('vibraphone');
      expect(vibesClassic!.params.motorVibrato).toBe(true);
    });

    it('has vibraphone without motor preset', () => {
      const vibesNoMotor = MALLET_PRESETS.find(p => p.id === 'mallet-vibes-no-motor');
      expect(vibesNoMotor).toBeDefined();
      expect(vibesNoMotor!.params.motorVibrato).toBe(false);
    });

    it('has marimba presets with different hardness', () => {
      const marimbaSoft = MALLET_PRESETS.find(p => p.id === 'mallet-marimba-soft');
      expect(marimbaSoft).toBeDefined();
      expect(marimbaSoft!.params.malletHardness).toBeLessThan(0.5);
    });

    it('has xylophone preset', () => {
      const xylophone = MALLET_PRESETS.find(p => p.id === 'mallet-xylophone');
      expect(xylophone).toBeDefined();
      expect(xylophone!.params.type).toBe('xylophone');
      expect(xylophone!.params.malletHardness).toBeGreaterThan(0.5);
    });

    it('has kalimba preset', () => {
      const kalimba = MALLET_PRESETS.find(p => p.id === 'mallet-kalimba');
      expect(kalimba).toBeDefined();
      expect(kalimba!.params.type).toBe('kalimba');
    });

    it('has glockenspiel preset', () => {
      const glockenspiel = MALLET_PRESETS.find(p => p.id === 'mallet-glockenspiel');
      expect(glockenspiel).toBeDefined();
      expect(glockenspiel!.params.resonance).toBeGreaterThan(0.8);
    });

    it('all presets have valid parameters', () => {
      MALLET_PRESETS.forEach(preset => {
        expect(preset.params).toHaveProperty('type');
        expect(preset.params).toHaveProperty('malletHardness');
        expect(preset.params).toHaveProperty('resonance');
      });
    });
  });
});
