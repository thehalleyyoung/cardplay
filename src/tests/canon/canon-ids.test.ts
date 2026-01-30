/**
 * @fileoverview Canon ID Tests
 * 
 * Asserts runtime constants align with docs (ControlLevel, DeckType, PPQ).
 * 
 * @module @cardplay/tests/canon/canon-ids
 * @see to_fix_repo_plan_500.md Change 017
 */

import { describe, it, expect } from 'vitest';
import {
  PPQ,
  DECK_TYPES,
  isDeckType,
  PORT_TYPES,
  PORT_TYPE_LIST,
  isPortType,
  isBuiltinConstraintType,
  BUILTIN_CONSTRAINT_TYPES,
} from '../../canon/ids';
import type {
  DeckType,
  ControlLevel,
  PortType,
  CultureTag,
  StyleTag,
  TonalityModel,
  ModeName,
  CadenceType,
} from '../../canon/ids';

describe('Canon IDs', () => {
  describe('PPQ', () => {
    it('should be 960', () => {
      expect(PPQ).toBe(960);
    });

    it('should allow clean division for common note values', () => {
      // Quarter note = PPQ
      expect(PPQ).toBe(960);
      // Half note = PPQ * 2
      expect(PPQ * 2).toBe(1920);
      // Eighth note = PPQ / 2
      expect(PPQ / 2).toBe(480);
      // Sixteenth note = PPQ / 4
      expect(PPQ / 4).toBe(240);
      // Triplet eighth = PPQ / 3
      expect(PPQ / 3).toBe(320);
    });

    it('should provide whole number divisions for triplets', () => {
      expect(PPQ % 3).toBe(0); // Triplets
      expect(PPQ % 5).toBe(0); // Quintuplets
      expect(PPQ % 6).toBe(0); // Sextuplets
    });
  });

  describe('DeckType', () => {
    it('should have all canonical deck types', () => {
      const expectedDeckTypes: DeckType[] = [
        'pattern-deck',
        'notation-deck',
        'piano-roll-deck',
        'session-deck',
        'arrangement-deck',
        'instruments-deck',
        'dsp-chain',
        'effects-deck',
        'samples-deck',
        'sample-manager-deck',
        'phrases-deck',
        'harmony-deck',
        'generators-deck',
        'mixer-deck',
        'mix-bus-deck',
        'routing-deck',
        'automation-deck',
        'properties-deck',
        'transport-deck',
        'arranger-deck',
        'ai-advisor-deck',
        'modulation-matrix-deck',
        'track-groups-deck',
        'reference-track-deck',
        'spectrum-analyzer-deck',
        'waveform-editor-deck',
      ];

      expect(DECK_TYPES).toEqual(expect.arrayContaining(expectedDeckTypes));
      expect(DECK_TYPES.length).toBe(expectedDeckTypes.length);
    });

    it('should validate canonical deck types', () => {
      expect(isDeckType('pattern-deck')).toBe(true);
      expect(isDeckType('notation-deck')).toBe(true);
      expect(isDeckType('piano-roll-deck')).toBe(true);
    });

    it('should reject legacy deck types', () => {
      expect(isDeckType('pattern-editor')).toBe(false);
      expect(isDeckType('notation-score')).toBe(false);
      expect(isDeckType('piano-roll')).toBe(false);
    });

    it('should reject invalid deck types', () => {
      expect(isDeckType('invalid-deck')).toBe(false);
      expect(isDeckType('')).toBe(false);
    });
  });

  describe('PortType', () => {
    it('should have all canonical port types', () => {
      const expectedPortTypes: PortType[] = [
        'audio', 'midi', 'notes', 'control', 'trigger', 'gate', 'clock', 'transport',
      ];

      expect(PORT_TYPE_LIST).toEqual(expectedPortTypes);
    });

    it('should have object accessor', () => {
      expect(PORT_TYPES.audio).toBe('audio');
      expect(PORT_TYPES.midi).toBe('midi');
      expect(PORT_TYPES.notes).toBe('notes');
      expect(PORT_TYPES.control).toBe('control');
      expect(PORT_TYPES.trigger).toBe('trigger');
      expect(PORT_TYPES.gate).toBe('gate');
      expect(PORT_TYPES.clock).toBe('clock');
      expect(PORT_TYPES.transport).toBe('transport');
    });

    it('should validate canonical port types', () => {
      expect(isPortType('audio')).toBe(true);
      expect(isPortType('midi')).toBe(true);
      expect(isPortType('notes')).toBe(true);
    });

    it('should reject legacy port types', () => {
      expect(isPortType('number')).toBe(false);
      expect(isPortType('string')).toBe(false);
      expect(isPortType('any')).toBe(false);
    });

    it('should reject direction-encoded port types', () => {
      expect(isPortType('audio_in')).toBe(false);
      expect(isPortType('midi_out')).toBe(false);
    });
  });

  describe('ControlLevel', () => {
    it('should accept valid control levels', () => {
      const levels: ControlLevel[] = [
        'full-manual',
        'manual-with-hints',
        'assisted',
        'collaborative',
        'directed',
        'generative',
      ];

      // Type check - if this compiles, the types are correct
      expect(levels.length).toBe(6);
    });
  });

  describe('MusicSpec IDs', () => {
    it('should accept valid culture tags', () => {
      const tags: CultureTag[] = ['western', 'carnatic', 'celtic', 'chinese', 'hybrid'];
      expect(tags.length).toBe(5);
    });

    it('should accept valid style tags', () => {
      const tags: StyleTag[] = [
        'galant', 'baroque', 'classical', 'romantic', 'cinematic',
        'trailer', 'underscore', 'edm', 'pop', 'jazz', 'lofi', 'custom',
      ];
      expect(tags.length).toBe(12);
    });

    it('should accept valid tonality models', () => {
      const models: TonalityModel[] = ['ks_profile', 'dft_phase', 'spiral_array'];
      expect(models.length).toBe(3);
    });

    it('should accept valid mode names', () => {
      const modes: ModeName[] = [
        'ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian',
        'harmonic_minor', 'melodic_minor', 'pentatonic_major', 'pentatonic_minor',
        'blues', 'whole_tone', 'diminished',
      ];
      expect(modes.length).toBe(14);
    });

    it('should accept valid cadence types', () => {
      const types: CadenceType[] = [
        'perfect_authentic', 'imperfect_authentic', 'half',
        'plagal', 'deceptive', 'phrygian_half', 'evaded',
      ];
      expect(types.length).toBe(7);
    });
  });

  describe('Constraint Types', () => {
    it('should recognize builtin constraint types', () => {
      expect(isBuiltinConstraintType('key')).toBe(true);
      expect(isBuiltinConstraintType('tempo')).toBe(true);
      expect(isBuiltinConstraintType('cadence')).toBe(true);
      expect(isBuiltinConstraintType('raga')).toBe(true);
    });

    it('should reject namespaced constraint types as non-builtin', () => {
      expect(isBuiltinConstraintType('custom:my_constraint')).toBe(false);
      expect(isBuiltinConstraintType('vendor:special_rule')).toBe(false);
    });

    it('should have expected number of builtin constraints', () => {
      // Update this if new builtin constraints are added
      expect(BUILTIN_CONSTRAINT_TYPES.size).toBeGreaterThanOrEqual(20);
    });
  });
});
