/**
 * @fileoverview Tests for Connection Validation.
 * 
 * @module @cardplay/boards/gating/validate-connection.test
 */

import { describe, it, expect } from 'vitest';
import {
  validateConnection,
  getCompatibleTargetTypes,
  isTargetCompatible,
  getConnectionIncompatibilityReason,
  validateConnectionChain,
} from './validate-connection';
import { PortTypes } from '../../cards/card';

describe('validateConnection', () => {
  it('allows identical port types to connect', () => {
    const result = validateConnection(PortTypes.AUDIO, PortTypes.AUDIO);
    expect(result.allowed).toBe(true);
  });

  it('allows MIDI to NOTES connection', () => {
    const result = validateConnection(PortTypes.MIDI, PortTypes.NOTES);
    expect(result.allowed).toBe(true);
  });

  it('allows NOTES to MIDI connection', () => {
    const result = validateConnection(PortTypes.NOTES, PortTypes.MIDI);
    expect(result.allowed).toBe(true);
  });

  it('allows AUDIO to CONTROL connection', () => {
    const result = validateConnection(PortTypes.AUDIO, PortTypes.CONTROL);
    expect(result.allowed).toBe(true);
  });

  it('allows CONTROL to NUMBER connection', () => {
    const result = validateConnection(PortTypes.CONTROL, PortTypes.NUMBER);
    expect(result.allowed).toBe(true);
  });

  it('denies AUDIO to MIDI connection', () => {
    const result = validateConnection(PortTypes.AUDIO, PortTypes.MIDI);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it('denies MIDI to AUDIO connection', () => {
    const result = validateConnection(PortTypes.MIDI, PortTypes.AUDIO);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it('denies STRING to NUMBER connection', () => {
    const result = validateConnection(PortTypes.STRING, PortTypes.NUMBER);
    expect(result.allowed).toBe(false);
  });

  it('allows ANY type to connect to anything', () => {
    expect(validateConnection(PortTypes.ANY, PortTypes.AUDIO).allowed).toBe(true);
    expect(validateConnection(PortTypes.ANY, PortTypes.MIDI).allowed).toBe(true);
    expect(validateConnection(PortTypes.AUDIO, PortTypes.ANY).allowed).toBe(true);
    expect(validateConnection(PortTypes.MIDI, PortTypes.ANY).allowed).toBe(true);
  });

  it('allows STREAM to NOTES connection', () => {
    const result = validateConnection(PortTypes.STREAM, PortTypes.NOTES);
    expect(result.allowed).toBe(true);
  });

  it('allows PATTERN to STREAM connection', () => {
    const result = validateConnection(PortTypes.PATTERN, PortTypes.STREAM);
    expect(result.allowed).toBe(true);
  });

  it('allows TRIGGER to BOOLEAN connection', () => {
    const result = validateConnection(PortTypes.TRIGGER, PortTypes.BOOLEAN);
    expect(result.allowed).toBe(true);
  });

  it('allows BOOLEAN to TRIGGER connection', () => {
    const result = validateConnection(PortTypes.BOOLEAN, PortTypes.TRIGGER);
    expect(result.allowed).toBe(true);
  });
});

describe('getCompatibleTargetTypes', () => {
  it('returns compatible types for AUDIO', () => {
    const types = getCompatibleTargetTypes(PortTypes.AUDIO);
    expect(types).toContain(PortTypes.AUDIO);
    expect(types).toContain(PortTypes.CONTROL);
  });

  it('returns compatible types for MIDI', () => {
    const types = getCompatibleTargetTypes(PortTypes.MIDI);
    expect(types).toContain(PortTypes.MIDI);
    expect(types).toContain(PortTypes.NOTES);
    expect(types).toContain(PortTypes.TRIGGER);
  });

  it('returns compatible types for CONTROL', () => {
    const types = getCompatibleTargetTypes(PortTypes.CONTROL);
    expect(types).toContain(PortTypes.CONTROL);
    expect(types).toContain(PortTypes.AUDIO);
    expect(types).toContain(PortTypes.NUMBER);
  });

  it('returns only self for STRING', () => {
    const types = getCompatibleTargetTypes(PortTypes.STRING);
    expect(types).toEqual([PortTypes.STRING]);
  });
});

describe('isTargetCompatible', () => {
  it('checks compatibility with shorthand', () => {
    expect(isTargetCompatible(PortTypes.AUDIO, PortTypes.AUDIO)).toBe(true);
    expect(isTargetCompatible(PortTypes.AUDIO, PortTypes.MIDI)).toBe(false);
    expect(isTargetCompatible(PortTypes.MIDI, PortTypes.NOTES)).toBe(true);
  });
});

describe('getConnectionIncompatibilityReason', () => {
  it('returns empty string for compatible types', () => {
    const reason = getConnectionIncompatibilityReason(
      PortTypes.AUDIO,
      PortTypes.AUDIO
    );
    expect(reason).toBe('');
  });

  it('returns reason for incompatible types', () => {
    const reason = getConnectionIncompatibilityReason(
      PortTypes.AUDIO,
      PortTypes.MIDI
    );
    expect(reason).toBeTruthy();
    expect(reason).toContain('incompatible');
  });
});

describe('validateConnectionChain', () => {
  it('validates a valid chain', () => {
    const result = validateConnectionChain([
      PortTypes.MIDI,
      PortTypes.NOTES,
      PortTypes.STREAM,
    ]);
    expect(result.allowed).toBe(true);
  });

  it('rejects an invalid chain', () => {
    const result = validateConnectionChain([
      PortTypes.AUDIO,
      PortTypes.MIDI, // Invalid: audio cannot connect to MIDI
      PortTypes.NOTES,
    ]);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('connection 1');
  });

  it('validates a complex valid chain', () => {
    const result = validateConnectionChain([
      PortTypes.PATTERN,
      PortTypes.STREAM,
      PortTypes.NOTES,
      PortTypes.MIDI,
    ]);
    expect(result.allowed).toBe(true);
  });

  it('validates a control signal chain', () => {
    const result = validateConnectionChain([
      PortTypes.NUMBER,
      PortTypes.CONTROL,
      PortTypes.AUDIO,
    ]);
    expect(result.allowed).toBe(true);
  });

  it('rejects a chain with incompatible middle connection', () => {
    const result = validateConnectionChain([
      PortTypes.MIDI,
      PortTypes.NOTES,
      PortTypes.AUDIO, // Invalid: notes cannot connect to audio
    ]);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('connection 2');
  });

  it('validates single-element chain (no connections)', () => {
    const result = validateConnectionChain([PortTypes.AUDIO]);
    expect(result.allowed).toBe(true);
  });

  it('validates two-element chain', () => {
    const result = validateConnectionChain([
      PortTypes.AUDIO,
      PortTypes.CONTROL,
    ]);
    expect(result.allowed).toBe(true);
  });
});
