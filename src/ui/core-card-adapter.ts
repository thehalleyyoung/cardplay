/**
 * @fileoverview Core Card to UI Card Adapter (Change 295)
 * 
 * Provides a single adapter module that creates UI card instances from core cards.
 * Avoids parallel "UI card" systems by establishing core cards as the source of truth
 * and deriving UI representations from them.
 * 
 * This adapter:
 * - Takes a CoreCard<A, B> and generates a CardSurfaceConfig
 * - Maps core card ports to UI port representations
 * - Handles parameter display and interaction
 * - Bridges card state updates to UI state
 * 
 * @module @cardplay/ui/core-card-adapter
 * @see Change 295
 */

import type { Card as CoreCard, Port } from '../cards/card';
import type { CardSurfaceConfig, UISurfacePortType, PortDirection } from './cards';
import type { CanonicalPortType } from '../canon/port-types';

// ============================================================================
// PORT MAPPING
// ============================================================================

/**
 * Map canonical PortType to UI surface port type.
 * UI layer uses a simplified type system for visual representation.
 */
export function mapPortTypeToUI(portType: CanonicalPortType | string): UISurfacePortType {
  // Direct mappings
  switch (portType) {
    case 'audio':
    case 'midi':
    case 'control':
    case 'trigger':
      return portType;
    
    // Specialized types map to base types
    case 'notes':
      return 'midi'; // Notes rendered as MIDI in UI
    case 'gate':
    case 'clock':
    case 'transport':
      return 'trigger'; // Time-based signals rendered as triggers
    
    // Default for extensions
    default:
      // Namespaced extensions default to 'data' in UI
      if (typeof portType === 'string' && portType.includes(':')) {
        return 'data';
      }
      // Unknown types
      console.warn(`Unknown port type '${portType}', defaulting to 'data' in UI`);
      return 'data';
  }
}

/**
 * Map a core card port to UI port representation.
 */
export function mapCardPortToUI(port: Port, direction: PortDirection): {
  id: string;
  name: string;
  type: UISurfacePortType;
  direction: PortDirection;
} {
  // Use id if available (for compatibility), otherwise use name
  const portId = (port as any).id || port.name;
  // Use name if available, otherwise fall back to id
  const portName = port.name || (port as any).id || portId;
  return {
    id: portId,
    name: portName,
    type: mapPortTypeToUI(port.type as CanonicalPortType),
    direction,
  };
}

// ============================================================================
// CARD ADAPTER
// ============================================================================

/**
 * Extended UI card config with port information.
 * Extends CardSurfaceConfig with input/output port mappings.
 */
export interface UICardWithPorts extends CardSurfaceConfig {
  /** Input ports */
  inputs: Array<{
    id: string;
    name: string;
    type: UISurfacePortType;
    direction: 'input';
  }>;
  /** Output ports */
  outputs: Array<{
    id: string;
    name: string;
    type: UISurfacePortType;
    direction: 'output';
  }>;
  /** Card color (CSS color value) */
  color?: string;
  /** Card description */
  description?: string;
}

/**
 * Adapt a core card to UI card surface configuration.
 * 
 * @param card - Core card instance
 * @param options - Adapter options
 * @returns UI card surface configuration with ports
 */
export function coreCardToUI<A = unknown, B = unknown>(
  card: CoreCard<A, B>,
  options: {
    /** Initial position */
    x?: number;
    y?: number;
    /** Size preset */
    size?: 'small' | 'medium' | 'large';
    /** Visual style */
    style?: 'default' | 'minimal' | 'rounded';
  } = {}
): UICardWithPorts {
  // Map card metadata to UI config
  const config: UICardWithPorts = {
    id: card.meta.id,
    type: card.meta.category,
    title: card.meta.name,
    description: card.meta.description,
    
    // Map ports
    inputs: (card.inputs || []).map(port => mapCardPortToUI(port, 'input')),
    outputs: (card.outputs || []).map(port => mapCardPortToUI(port, 'output')),
    
    // Visual properties
    size: options.size || 'medium',
    width: 0, // Will be set by createCardSurfaceState
    height: 0,
    minWidth: 100,
    minHeight: 100,
    maxWidth: 800,
    maxHeight: 600,
    style: options.style || 'default',
    
    // Capabilities
    draggable: true,
    resizable: true,
    minimizable: true,
    maximizable: true,
    closable: true,
    
    // Color from metadata or default
    color: (card.meta as any).color || '#4a90e2',
    
    // Color (hue/saturation for legacy systems)
    hue: 210,
    saturation: 60,
    zIndex: 0,
  };
  
  return config;
}

/**
 * Create a UI card instance from a core card with default state.
 * 
 * @param card - Core card instance
 * @param options - Adapter options including initial position
 * @returns Complete UI card configuration with state
 */
export function createUICardFromCore<A = unknown, B = unknown>(
  card: CoreCard<A, B>,
  options: {
    x?: number;
    y?: number;
    size?: 'small' | 'medium' | 'large';
    style?: 'default' | 'minimal' | 'rounded';
  } = {}
): UICardWithPorts & { x: number; y: number } {
  const config = coreCardToUI(card, options);
  
  return {
    ...config,
    x: options.x || 0,
    y: options.y || 0,
  };
}

// ============================================================================
// PARAMETER MAPPING
// ============================================================================

/**
 * UI parameter representation.
 */
export interface UIParameter {
  readonly id: string;
  readonly name: string;
  readonly type: 'number' | 'boolean' | 'string' | 'enum' | 'color';
  readonly value: unknown;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly options?: readonly string[];
  readonly unit?: string;
}

/**
 * Extract UI parameters from a core card.
 * Maps card action schema to UI-friendly parameter definitions.
 * 
 * @param card - Core card instance
 * @returns Array of UI parameters
 */
export function extractUIParameters<A = unknown, B = unknown>(
  card: CoreCard<A, B>
): readonly UIParameter[] {
  // If card has a parameter schema, extract from there
  // This is a placeholder - actual implementation would inspect card.meta or card.schema
  const parameters: UIParameter[] = [];
  
  // Example: If card has a 'parameters' field in meta
  if (card.meta && typeof card.meta === 'object' && 'parameters' in card.meta) {
    const cardParams = (card.meta as { parameters?: unknown }).parameters;
    if (Array.isArray(cardParams)) {
      // Map card parameters to UI parameters
      // Implementation would depend on actual parameter schema
    }
  }
  
  return parameters;
}

/**
 * Apply UI parameter changes back to core card.
 * 
 * @param card - Core card instance
 * @param parameterId - Parameter ID
 * @param value - New parameter value
 */
export function applyUIParameterChange<A = unknown, B = unknown>(
  card: CoreCard<A, B>,
  parameterId: string,
  value: unknown
): void {
  // Create an action that updates the parameter
  // This is a placeholder - actual implementation would:
  // 1. Find the parameter in card schema
  // 2. Validate the value
  // 3. Create appropriate action
  // 4. Apply via card.apply()
  
  console.log(`Applying parameter change: ${parameterId} = ${value} to card ${card.meta.id}`);
  
  // Actual implementation would do something like:
  // const action = createParameterAction(parameterId, value);
  // card.apply(action);
}

// ============================================================================
// STATE SYNCHRONIZATION
// ============================================================================

/**
 * Subscribe to core card state changes and update UI.
 * 
 * @param _card - Core card instance (unused in placeholder)
 * @param _onUpdate - Callback when card state changes (unused in placeholder)
 * @returns Unsubscribe function
 */
export function subscribeToCardState<A = unknown, B = unknown>(
  _card: CoreCard<A, B>,
  _onUpdate: (state: B) => void
): () => void {
  // Implementation would depend on how core cards expose state changes
  // This is a placeholder for the pattern
  
  // If cards support listeners:
  // const listener = (newState: B) => onUpdate(newState);
  // card.addListener(listener);
  // return () => card.removeListener(listener);
  
  // For now, return a no-op unsubscribe
  return () => {
    // Cleanup
  };
}

/**
 * Adapter options for bidirectional sync.
 */
export interface CardSyncOptions {
  /** Sync parameter changes from UI to core */
  readonly syncParameters?: boolean;
  /** Sync state changes from core to UI */
  readonly syncState?: boolean;
  /** Debounce delay for parameter changes (ms) */
  readonly debounceMs?: number;
}

/**
 * Create a bidirectional sync between core card and UI.
 * 
 * @param card - Core card instance
 * @param onUIUpdate - Callback to update UI when card state changes
 * @param options - Sync options
 * @returns Cleanup function
 */
export function createCardUISync<A = unknown, B = unknown>(
  card: CoreCard<A, B>,
  onUIUpdate: (state: B) => void,
  options: CardSyncOptions = {}
): () => void {
  const cleanups: Array<() => void> = [];
  
  // Subscribe to state changes if enabled
  if (options.syncState !== false) {
    const unsubscribe = subscribeToCardState(card, onUIUpdate);
    cleanups.push(unsubscribe);
  }
  
  // Return combined cleanup
  return () => {
    cleanups.forEach(cleanup => cleanup());
  };
}
