/**
 * @fileoverview Port CSS Class Mapping
 * 
 * Change 205: Map { direction, type } to CSS class names for port styling.
 * 
 * @module @cardplay/ui/ports/port-css-class
 */

import type { UIPortDirection, UICanonicalPortType, PortSpec } from '../components/card-component';

// ============================================================================
// CSS CLASS GENERATION
// ============================================================================

/**
 * Generates CSS class name for a port based on direction and type.
 * 
 * Change 205: Uses the new PortSpec model with separate direction and type.
 */
export function getPortCssClass(spec: PortSpec): string {
  const baseClass = 'card-port';
  const typeClass = `card-port-${spec.type}`;
  const directionClass = `card-port-${spec.direction}`;
  
  return `${baseClass} ${typeClass} ${directionClass}`;
}

/**
 * Generates legacy CSS class name (for backward compatibility).
 * 
 * Produces classes like 'card-port-audio_in', 'card-port-midi_out'.
 */
export function getLegacyPortCssClass(spec: PortSpec): string {
  const typePrefix = getTypePrefix(spec.type);
  const legacyType = `${typePrefix}_${spec.direction}`;
  
  return `card-port card-port-${legacyType}`;
}

/**
 * Gets the type prefix for legacy CSS class generation.
 */
function getTypePrefix(type: UICanonicalPortType): string {
  const prefixMap: Record<UICanonicalPortType, string> = {
    'audio': 'audio',
    'midi': 'midi',
    'notes': 'midi',
    'control': 'mod',
    'trigger': 'trigger',
    'gate': 'trigger',
    'clock': 'trigger',
    'transport': 'trigger',
    'modulation': 'mod',
  };
  
  return prefixMap[type] ?? 'mod';
}

/**
 * Generates CSS classes for connection lines based on port type.
 */
export function getConnectionCssClass(portType: UICanonicalPortType): string {
  return `connection connection-${portType}`;
}

// ============================================================================
// CSS CLASS PARSING
// ============================================================================

/**
 * Parses a legacy CSS class name back to PortSpec.
 * 
 * Input: 'card-port-audio_in' or 'audio_in'
 * Output: { direction: 'in', type: 'audio' }
 */
export function parsePortCssClass(className: string): PortSpec | null {
  // Extract the port type part
  const match = className.match(/card-port-(\w+_(?:in|out))/);
  const portPart = match ? match[1] : className;
  
  if (!portPart) return null;
  
  // Parse 'type_direction' format
  const [typePrefix, direction] = portPart.split('_');
  
  if (!typePrefix || !direction || (direction !== 'in' && direction !== 'out')) {
    return null;
  }
  
  const typeMap: Record<string, UICanonicalPortType> = {
    'audio': 'audio',
    'midi': 'midi',
    'mod': 'modulation',
    'trigger': 'trigger',
  };
  
  return {
    direction: direction as UIPortDirection,
    type: typeMap[typePrefix] ?? 'control',
  };
}

// ============================================================================
// PORT COLORS
// ============================================================================

/**
 * Default port colors by type.
 * Used for CSS custom properties and inline styles.
 */
export const PORT_COLORS: Readonly<Record<UICanonicalPortType, string>> = {
  'audio': '#4CAF50',     // Green
  'midi': '#2196F3',      // Blue
  'notes': '#03A9F4',     // Light Blue
  'control': '#FF9800',   // Orange
  'trigger': '#E91E63',   // Pink
  'gate': '#9C27B0',      // Purple
  'clock': '#673AB7',     // Deep Purple
  'transport': '#00BCD4', // Cyan
  'modulation': '#FF5722', // Deep Orange
};

/**
 * Gets the CSS color for a port type.
 */
export function getPortColor(type: UICanonicalPortType): string {
  return PORT_COLORS[type] ?? '#9E9E9E'; // Default gray
}

/**
 * Generates CSS custom properties for port styling.
 */
export function getPortCssVariables(spec: PortSpec): Record<string, string> {
  const color = getPortColor(spec.type);
  
  return {
    '--port-color': color,
    '--port-color-hover': `${color}cc`,
    '--port-color-active': `${color}ff`,
    '--port-direction': spec.direction,
  };
}

// ============================================================================
// PORT ICONS
// ============================================================================

/**
 * Port icons by type (emoji).
 */
export const PORT_ICONS: Readonly<Record<UICanonicalPortType, string>> = {
  'audio': '🔊',
  'midi': '🎹',
  'notes': '🎵',
  'control': '🎛️',
  'trigger': '⚡',
  'gate': '🚪',
  'clock': '⏱️',
  'transport': '▶️',
  'modulation': '〰️',
};

/**
 * Gets the icon for a port type.
 */
export function getPortIcon(type: UICanonicalPortType): string {
  return PORT_ICONS[type] ?? '●';
}
