/**
 * @fileoverview Port Utilities Index
 * 
 * Central exports for port mapping and styling utilities.
 * 
 * @module @cardplay/ui/ports
 */

export {
  uiPortTypeToCanonical,
  uiCanonicalToPortType,
  portSpecToCanonical,
  canonicalToUICanonical,
  createPortSpec,
  canonicalToLegacyUIPortType,
  isValidCanonicalPortType,
  normalizeToCanonicalPortType,
} from './port-mapping';

export {
  getPortCssClass,
  getLegacyPortCssClass,
  getConnectionCssClass,
  parsePortCssClass,
  PORT_COLORS,
  getPortColor,
  getPortCssVariables,
  PORT_ICONS,
  getPortIcon,
} from './port-css-class';
