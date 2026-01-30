/**
 * @fileoverview Connection Validation.
 * 
 * Validates routing connections between ports based on type compatibility.
 * Uses canonical port compatibility matrix from canon/port-types.ts.
 * 
 * @module @cardplay/boards/gating/validate-connection
 */

import type { PortType } from '../../cards/card';
import { PortTypes } from '../../cards/card';
import { getPortCompatibility, isCanonicalPortType } from '../../canon/port-types';

/**
 * Result of connection validation.
 */
export interface ConnectionValidation {
  /** Whether the connection is allowed */
  allowed: boolean;
  /** Reason if not allowed */
  reason?: string;
}

/**
 * Validates whether two ports can be connected.
 * 
 * @param sourceType - The source port type
 * @param targetType - The target port type
 * @returns Validation result
 * 
 * @example
 * ```ts
 * const validation = validateConnection(PortTypes.AUDIO, PortTypes.AUDIO);
 * // { allowed: true }
 * 
 * const invalid = validateConnection(PortTypes.AUDIO, PortTypes.MIDI);
 * // { allowed: false, reason: "..." }
 * ```
 */
export function validateConnection(
  sourceType: PortType,
  targetType: PortType
): ConnectionValidation {
  // ANY type is compatible with everything
  if (sourceType === PortTypes.ANY || targetType === PortTypes.ANY) {
    return { allowed: true };
  }
  
  // Exact type match
  if (sourceType === targetType) {
    return { allowed: true };
  }
  
  // Check canonical port compatibility first (for canonical types)
  if (isCanonicalPortType(sourceType) && isCanonicalPortType(targetType)) {
    const compat = getPortCompatibility(sourceType, targetType);
    if (compat) {
      return { allowed: true };
    }
  }
  
  // Fall back to legacy compatibility matrix for non-canonical types
  if (arePortTypesCompatible(sourceType, targetType)) {
    return { allowed: true };
  }
  
  // Incompatible
  return {
    allowed: false,
    reason: `Cannot connect ${sourceType} port to ${targetType} port (incompatible types)`,
  };
}

/**
 * Port type compatibility matrix.
 * Defines which port types can be connected together.
 */
const COMPATIBILITY_MATRIX = new Map<PortType, Set<PortType>>([
  // Audio is compatible with itself and control signals
  [PortTypes.AUDIO, new Set([PortTypes.AUDIO, PortTypes.CONTROL])],
  
  // MIDI is compatible with notes and triggers
  [PortTypes.MIDI, new Set([PortTypes.MIDI, PortTypes.NOTES, PortTypes.TRIGGER])],
  
  // Notes are compatible with MIDI and streams
  [PortTypes.NOTES, new Set([PortTypes.NOTES, PortTypes.MIDI, PortTypes.STREAM])],
  
  // Control signals can drive audio and numbers
  [PortTypes.CONTROL, new Set([PortTypes.CONTROL, PortTypes.AUDIO, PortTypes.NUMBER])],
  
  // Triggers are compatible with MIDI and booleans
  [PortTypes.TRIGGER, new Set([PortTypes.TRIGGER, PortTypes.MIDI, PortTypes.BOOLEAN])],
  
  // Numbers can drive control signals
  [PortTypes.NUMBER, new Set([PortTypes.NUMBER, PortTypes.CONTROL])],
  
  // Strings are only compatible with strings
  [PortTypes.STRING, new Set([PortTypes.STRING])],
  
  // Booleans can trigger gates
  [PortTypes.BOOLEAN, new Set([PortTypes.BOOLEAN, PortTypes.TRIGGER])],
  
  // Streams can carry notes and patterns
  [PortTypes.STREAM, new Set([PortTypes.STREAM, PortTypes.NOTES, PortTypes.PATTERN])],
  
  // Containers can hold anything
  [PortTypes.CONTAINER, new Set([PortTypes.CONTAINER])],
  
  // Patterns can be used as streams
  [PortTypes.PATTERN, new Set([PortTypes.PATTERN, PortTypes.STREAM])],
]);

/**
 * Checks if two port types are compatible.
 */
function arePortTypesCompatible(
  sourceType: PortType,
  targetType: PortType
): boolean {
  const compatibleTargets = COMPATIBILITY_MATRIX.get(sourceType);
  return compatibleTargets?.has(targetType) ?? false;
}

/**
 * Gets a list of compatible target types for a source type.
 * 
 * @param sourceType - The source port type
 * @returns Array of compatible target types
 * 
 * @example
 * ```ts
 * const targets = getCompatibleTargetTypes(PortTypes.AUDIO);
 * // [PortTypes.AUDIO, PortTypes.CONTROL]
 * ```
 */
export function getCompatibleTargetTypes(sourceType: PortType): PortType[] {
  const compatibleTargets = COMPATIBILITY_MATRIX.get(sourceType);
  return compatibleTargets ? Array.from(compatibleTargets) : [sourceType];
}

/**
 * Checks if a target type is compatible with a source type.
 * 
 * @param sourceType - The source port type
 * @param targetType - The target port type
 * @returns True if compatible
 * 
 * @example
 * ```ts
 * const compatible = isTargetCompatible(PortTypes.MIDI, PortTypes.NOTES);
 * // true
 * ```
 */
export function isTargetCompatible(
  sourceType: PortType,
  targetType: PortType
): boolean {
  return validateConnection(sourceType, targetType).allowed;
}

/**
 * Gets a human-readable description of why a connection is invalid.
 * 
 * @param sourceType - The source port type
 * @param targetType - The target port type
 * @returns Description of the incompatibility
 * 
 * @example
 * ```ts
 * const reason = getConnectionIncompatibilityReason(
 *   PortTypes.AUDIO,
 *   PortTypes.MIDI
 * );
 * // "Audio signals cannot be sent to MIDI ports..."
 * ```
 */
export function getConnectionIncompatibilityReason(
  sourceType: PortType,
  targetType: PortType
): string {
  const validation = validateConnection(sourceType, targetType);
  
  if (validation.allowed) {
    return '';
  }
  
  return validation.reason ?? `${sourceType} and ${targetType} are incompatible`;
}

/**
 * Validates a connection chain (multiple connections in sequence).
 * 
 * @param portTypes - Array of port types in connection order
 * @returns Validation result for the entire chain
 * 
 * @example
 * ```ts
 * const chain = validateConnectionChain([
 *   PortTypes.MIDI,
 *   PortTypes.NOTES,
 *   PortTypes.STREAM
 * ]);
 * // { allowed: true } - all transitions are valid
 * ```
 */
export function validateConnectionChain(
  portTypes: PortType[]
): ConnectionValidation {
  for (let i = 0; i < portTypes.length - 1; i++) {
    const source = portTypes[i]!;
    const target = portTypes[i + 1]!;
    
    const validation = validateConnection(source, target);
    if (!validation.allowed) {
      return {
        allowed: false,
        reason: `Chain breaks at connection ${i + 1}: ${validation.reason}`,
      };
    }
  }
  
  return { allowed: true };
}
