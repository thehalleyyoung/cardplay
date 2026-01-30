/**
 * @fileoverview Port Mapping Utilities
 * 
 * Change 204: Convert UI port definitions (UIPortType + direction) into canonical PortType.
 * 
 * @module @cardplay/ui/ports/port-mapping
 */

import type { PortType } from '../../canon/port-types';
import type { UIPortType, UIPortDirection, UICanonicalPortType, PortSpec } from '../components/card-component';

// ============================================================================
// UI TO CANONICAL PORT TYPE MAPPING
// ============================================================================

/**
 * Maps UI port types (with direction) to canonical PortType.
 * 
 * Change 204: The canonical PortType does not encode direction;
 * direction is stored separately in PortSpec.
 */
export function uiPortTypeToCanonical(uiType: UIPortType): PortType {
  // Extract the base type from legacy format like 'audio_in'
  const baseType = uiType.split('_')[0] || uiType;
  
  const mapping: Record<string, PortType> = {
    'audio': 'audio',
    'midi': 'midi',
    'mod': 'control',
    'trigger': 'trigger',
  };
  
  return mapping[baseType] ?? 'control';
}

/**
 * Maps UI canonical port type to canonical PortType.
 */
export function uiCanonicalToPortType(uiCanonical: UICanonicalPortType): PortType {
  const mapping: Record<UICanonicalPortType, PortType> = {
    'audio': 'audio',
    'midi': 'midi',
    'notes': 'notes',
    'control': 'control',
    'trigger': 'trigger',
    'gate': 'gate',
    'clock': 'clock',
    'transport': 'transport',
    'modulation': 'control', // modulation maps to control
  };
  
  return mapping[uiCanonical] ?? 'control';
}

/**
 * Maps PortSpec (direction + type) to canonical PortType.
 * 
 * Change 204: Direction is ignored for canonical type; only the type matters.
 */
export function portSpecToCanonical(spec: PortSpec): PortType {
  return uiCanonicalToPortType(spec.type);
}

// ============================================================================
// CANONICAL TO UI PORT TYPE MAPPING
// ============================================================================

/**
 * Maps canonical PortType to UI canonical port type.
 */
export function canonicalToUICanonical(portType: PortType): UICanonicalPortType {
  const mapping: Record<PortType, UICanonicalPortType> = {
    'audio': 'audio',
    'midi': 'midi',
    'notes': 'notes',
    'control': 'control',
    'trigger': 'trigger',
    'gate': 'gate',
    'clock': 'clock',
    'transport': 'transport',
  };
  
  return mapping[portType] ?? 'control';
}

/**
 * Creates a PortSpec from canonical PortType and direction.
 */
export function createPortSpec(portType: PortType, direction: UIPortDirection): PortSpec {
  return {
    direction,
    type: canonicalToUICanonical(portType),
  };
}

/**
 * Creates a legacy UIPortType from canonical PortType and direction.
 * Used for backward compatibility with CSS classes and legacy code.
 */
export function canonicalToLegacyUIPortType(portType: PortType, direction: UIPortDirection): UIPortType {
  const typeMap: Record<PortType, string> = {
    'audio': 'audio',
    'midi': 'midi',
    'notes': 'midi',
    'control': 'mod',
    'trigger': 'trigger',
    'gate': 'trigger',
    'clock': 'trigger',
    'transport': 'trigger',
  };
  
  const prefix = typeMap[portType] ?? 'mod';
  return `${prefix}_${direction}` as UIPortType;
}

// ============================================================================
// PORT TYPE VALIDATION
// ============================================================================

/**
 * Checks if a string is a valid canonical PortType.
 */
export function isValidCanonicalPortType(type: string): type is PortType {
  const validTypes = ['audio', 'midi', 'notes', 'control', 'trigger', 'gate', 'clock', 'transport'];
  return validTypes.includes(type);
}

/**
 * Normalizes any port type string to canonical PortType.
 * Handles legacy formats like 'audio_in', 'midi_out', etc.
 */
export function normalizeToCanonicalPortType(type: string): PortType {
  // Already canonical
  if (isValidCanonicalPortType(type)) {
    return type;
  }
  
  // Legacy format with direction suffix
  if (type.includes('_')) {
    const [base] = type.split('_');
    if (base) {
      const mapped = uiPortTypeToCanonical(type as UIPortType);
      return mapped;
    }
  }
  
  // Legacy type mappings
  const legacyMappings: Record<string, PortType> = {
    'modulation': 'control',
    'mod': 'control',
    'cv': 'control',
    'number': 'control',
    'boolean': 'trigger',
    'stream': 'audio',
    'any': 'control',
  };
  
  return legacyMappings[type.toLowerCase()] ?? 'control';
}
