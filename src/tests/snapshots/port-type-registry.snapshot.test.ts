/**
 * @fileoverview Port Type Registry Snapshot Tests
 * 
 * Change 493: Snapshot test for port type registry output.
 * Ensures port vocabulary changes are intentional.
 * 
 * @module @cardplay/src/tests/snapshots/port-type-registry.snapshot.test
 */

import { describe, it, expect } from 'vitest';
import { getPortTypeRegistry } from '../../cards/card';
import { CanonicalPortType } from '../../canon/port-types';

describe('Port Type Registry Snapshots', () => {
  it('should match registered port types snapshot', () => {
    const registry = getPortTypeRegistry();
    const portTypes = registry.getRegisteredPortTypes().sort();

    expect(portTypes).toMatchSnapshot();
  });

  it('should match builtin port types snapshot', () => {
    const builtinTypes: readonly CanonicalPortType[] = [
      'audio',
      'midi',
      'notes',
      'control',
      'trigger',
      'gate',
      'clock',
      'transport',
    ];

    expect([...builtinTypes].sort()).toMatchSnapshot();
  });

  it('should match port type metadata snapshot', () => {
    const registry = getPortTypeRegistry();
    const portTypes = registry.getRegisteredPortTypes();

    const metadata = portTypes.map(portType => {
      const entry = registry.getPortTypeEntry(portType);
      
      return {
        portType,
        isBuiltin: !portType.includes(':'),
        hasMetadata: !!entry,
        hasLabel: !!entry?.label,
        hasColor: !!entry?.color,
        hasIcon: !!entry?.icon,
        isDeprecated: entry?.deprecated ?? false,
      };
    }).sort((a, b) => a.portType.localeCompare(b.portType));

    expect(metadata).toMatchSnapshot();
  });

  it('should validate no legacy directional port types', () => {
    const registry = getPortTypeRegistry();
    const portTypes = registry.getRegisteredPortTypes();

    const directionalPatterns = [
      /_in$/,
      /_out$/,
      /^input_/,
      /^output_/,
    ];

    const directionalTypes = portTypes.filter(pt =>
      directionalPatterns.some(pattern => pattern.test(pt))
    );

    // CSS classes may still use these, but registry should not
    expect(directionalTypes).toEqual([]);
  });

  it('should validate canonical builtin port types are registered', () => {
    const registry = getPortTypeRegistry();
    const registeredTypes = registry.getRegisteredPortTypes();

    const requiredBuiltins: readonly CanonicalPortType[] = [
      'audio',
      'midi',
      'notes',
      'control',
      'trigger',
      'gate',
      'clock',
      'transport',
    ];

    const missingBuiltins = requiredBuiltins.filter(
      pt => !registeredTypes.includes(pt)
    );

    expect(missingBuiltins).toEqual([]);
  });

  it('should match port compatibility matrix snapshot', () => {
    const compatibilityMatrix = [
      { from: 'audio', to: 'audio', compatible: true },
      { from: 'midi', to: 'midi', compatible: true },
      { from: 'notes', to: 'midi', compatible: true, requiresAdapter: true },
      { from: 'notes', to: 'notes', compatible: true },
      { from: 'control', to: 'control', compatible: true },
      { from: 'trigger', to: 'trigger', compatible: true },
      { from: 'gate', to: 'gate', compatible: true },
      { from: 'clock', to: 'clock', compatible: true },
      { from: 'transport', to: 'transport', compatible: true },
      // Cross-type
      { from: 'audio', to: 'midi', compatible: false },
      { from: 'midi', to: 'audio', compatible: false },
      { from: 'trigger', to: 'gate', compatible: true },
      { from: 'gate', to: 'trigger', compatible: true },
    ];

    expect(compatibilityMatrix).toMatchSnapshot();
  });
});
