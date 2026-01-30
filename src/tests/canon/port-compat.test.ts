/**
 * @fileoverview Port Compatibility Tests
 * 
 * Asserts the port compatibility matrix matches documented pairs.
 * 
 * @module @cardplay/tests/canon/port-compat
 * @see to_fix_repo_plan_500.md Change 018
 */

import { describe, it, expect } from 'vitest';
import {
  CANONICAL_PORT_TYPES,
  CANONICAL_PORT_TYPE_LIST,
  isCanonicalPortType,
  isNamespacedPortType,
  PORT_COMPATIBILITY_PAIRS,
  getPortCompatibility,
  canConnect,
  getPortTypeMetadata,
  PORT_TYPE_METADATA,
} from '../../canon/port-types';

describe('Port Compatibility', () => {
  describe('Canonical Port Types', () => {
    it('should have 8 canonical port types', () => {
      expect(CANONICAL_PORT_TYPE_LIST).toHaveLength(8);
    });

    it('should include all expected types', () => {
      expect(CANONICAL_PORT_TYPE_LIST).toContain('audio');
      expect(CANONICAL_PORT_TYPE_LIST).toContain('midi');
      expect(CANONICAL_PORT_TYPE_LIST).toContain('notes');
      expect(CANONICAL_PORT_TYPE_LIST).toContain('control');
      expect(CANONICAL_PORT_TYPE_LIST).toContain('trigger');
      expect(CANONICAL_PORT_TYPE_LIST).toContain('gate');
      expect(CANONICAL_PORT_TYPE_LIST).toContain('clock');
      expect(CANONICAL_PORT_TYPE_LIST).toContain('transport');
    });

    it('should have object accessor', () => {
      expect(CANONICAL_PORT_TYPES.audio).toBe('audio');
      expect(CANONICAL_PORT_TYPES.midi).toBe('midi');
    });

    it('should validate canonical types', () => {
      expect(isCanonicalPortType('audio')).toBe(true);
      expect(isCanonicalPortType('midi')).toBe(true);
    });

    it('should reject non-canonical types', () => {
      expect(isCanonicalPortType('number')).toBe(false);
      expect(isCanonicalPortType('audio_in')).toBe(false);
      expect(isCanonicalPortType('vendor:custom')).toBe(false);
    });
  });

  describe('Namespaced Port Types', () => {
    it('should detect namespaced types', () => {
      expect(isNamespacedPortType('vendor:custom')).toBe(true);
      expect(isNamespacedPortType('data:number')).toBe(true);
    });

    it('should reject non-namespaced types', () => {
      expect(isNamespacedPortType('audio')).toBe(false);
      expect(isNamespacedPortType('midi')).toBe(false);
    });
  });

  describe('Port Compatibility Pairs', () => {
    it('should have same-type compatibility for all canonical types', () => {
      for (const type of CANONICAL_PORT_TYPE_LIST) {
        const compat = getPortCompatibility(type, type);
        expect(compat).not.toBeNull();
        expect(compat?.requiresAdapter).toBe(false);
      }
    });

    it('should allow notes → midi with adapter', () => {
      const compat = getPortCompatibility('notes', 'midi');
      expect(compat).not.toBeNull();
      expect(compat?.requiresAdapter).toBe(true);
      expect(compat?.adapterName).toBe('notes-to-midi');
    });

    it('should allow trigger ↔ gate', () => {
      expect(getPortCompatibility('trigger', 'gate')).not.toBeNull();
      expect(getPortCompatibility('gate', 'trigger')).not.toBeNull();
    });

    it('should allow clock ↔ transport', () => {
      expect(getPortCompatibility('clock', 'transport')).not.toBeNull();
      expect(getPortCompatibility('transport', 'clock')).not.toBeNull();
    });

    it('should reject incompatible types', () => {
      expect(getPortCompatibility('audio', 'midi')).toBeNull();
      expect(getPortCompatibility('control', 'audio')).toBeNull();
      expect(getPortCompatibility('notes', 'control')).toBeNull();
    });

    it('should allow same namespaced type', () => {
      const compat = getPortCompatibility('vendor:custom', 'vendor:custom');
      expect(compat).not.toBeNull();
    });
  });

  describe('canConnect', () => {
    it('should allow out → in connections', () => {
      expect(canConnect('audio', 'out', 'audio', 'in')).toBe(true);
      expect(canConnect('midi', 'out', 'midi', 'in')).toBe(true);
    });

    it('should reject in → out connections', () => {
      expect(canConnect('audio', 'in', 'audio', 'out')).toBe(false);
    });

    it('should reject in → in connections', () => {
      expect(canConnect('audio', 'in', 'audio', 'in')).toBe(false);
    });

    it('should reject out → out connections', () => {
      expect(canConnect('audio', 'out', 'audio', 'out')).toBe(false);
    });

    it('should allow compatible cross-type connections', () => {
      expect(canConnect('notes', 'out', 'midi', 'in')).toBe(true);
      expect(canConnect('trigger', 'out', 'gate', 'in')).toBe(true);
    });
  });

  describe('Port Type Metadata', () => {
    it('should have metadata for all canonical types', () => {
      for (const type of CANONICAL_PORT_TYPE_LIST) {
        const meta = getPortTypeMetadata(type);
        expect(meta).toBeDefined();
        expect(meta?.type).toBe(type);
        expect(meta?.name).toBeTruthy();
        expect(meta?.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });

    it('should return undefined for unknown types', () => {
      expect(getPortTypeMetadata('vendor:custom')).toBeUndefined();
      expect(getPortTypeMetadata('unknown')).toBeUndefined();
    });

    it('should have consistent metadata count', () => {
      expect(PORT_TYPE_METADATA).toHaveLength(CANONICAL_PORT_TYPE_LIST.length);
    });
  });

  describe('Documentation Alignment', () => {
    it('should match documented compatibility pairs', () => {
      // From docs/canon/port-vocabulary.md:
      // - audio ↔ audio
      // - midi ↔ midi
      // - notes → midi (with adapter)
      // - control ↔ control
      // - trigger ↔ gate (compatible)
      // - clock ↔ transport (compatible)

      // These should all be valid
      const documentedPairs = [
        ['audio', 'audio'],
        ['midi', 'midi'],
        ['notes', 'midi'],
        ['control', 'control'],
        ['trigger', 'gate'],
        ['gate', 'trigger'],
        ['clock', 'transport'],
        ['transport', 'clock'],
      ];

      for (const [from, to] of documentedPairs) {
        const compat = getPortCompatibility(from, to);
        expect(compat, `${from} → ${to} should be compatible`).not.toBeNull();
      }
    });
  });
});
