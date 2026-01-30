/**
 * @fileoverview Extension Permission System
 * 
 * Enforces permission-based access control for extensions, ensuring extensions
 * can only access APIs for which they have been granted permissions.
 * 
 * @module @cardplay/extensions/permissions
 */

import type { ExtensionPermission, ExtensionManifest, CardPlayAPI, ExtensionStoreAPI } from './types';

// ============================================================================
// PERMISSION CHECKING
// ============================================================================

/**
 * Check if an extension has a specific permission.
 */
export function hasPermission(
  manifest: ExtensionManifest,
  permission: ExtensionPermission
): boolean {
  return manifest.permissions.includes(permission);
}

/**
 * Check if an extension has all required permissions.
 */
export function hasAllPermissions(
  manifest: ExtensionManifest,
  requiredPermissions: readonly ExtensionPermission[]
): boolean {
  return requiredPermissions.every(p => hasPermission(manifest, p));
}

/**
 * Check if an extension has any of the given permissions.
 */
export function hasAnyPermission(
  manifest: ExtensionManifest,
  permissions: readonly ExtensionPermission[]
): boolean {
  return permissions.some(p => hasPermission(manifest, p));
}

/**
 * Get missing permissions from a required set.
 */
export function getMissingPermissions(
  manifest: ExtensionManifest,
  requiredPermissions: readonly ExtensionPermission[]
): ExtensionPermission[] {
  return requiredPermissions.filter(p => !hasPermission(manifest, p));
}

// ============================================================================
// PERMISSION ENFORCEMENT
// ============================================================================

/**
 * Error thrown when an extension attempts an action without required permission.
 */
export class PermissionDeniedError extends Error {
  constructor(
    public readonly extensionId: string,
    public readonly requiredPermission: ExtensionPermission,
    public readonly action: string
  ) {
    super(`Extension ${extensionId} missing permission "${requiredPermission}" for action: ${action}`);
    this.name = 'PermissionDeniedError';
  }
}

/**
 * Create a permission-guarded API wrapper.
 * Throws PermissionDeniedError if extension lacks required permission.
 */
export function guardPermission<T>(
  extensionId: string,
  manifest: ExtensionManifest,
  requiredPermission: ExtensionPermission,
  action: string,
  api: T | undefined
): T {
  if (!hasPermission(manifest, requiredPermission)) {
    throw new PermissionDeniedError(extensionId, requiredPermission, action);
  }
  if (api === undefined) {
    throw new Error(`API not available for permission ${requiredPermission}`);
  }
  return api;
}

// ============================================================================
// API CONSTRUCTION WITH PERMISSIONS
// ============================================================================

/**
 * Build CardPlay API object with only permitted APIs exposed.
 */
export function buildPermissionedAPI(
  manifest: ExtensionManifest,
  fullAPI: {
    eventStore?: any;
    clipRegistry?: any;
    routingGraph?: any;
    audioEngine?: any;
    prologKB?: any;
    ui?: any;
  }
): CardPlayAPI {
  // Build stores object if any store permission granted
  const storePermissions: ExtensionPermission[] = ['event-store', 'clip-registry', 'routing-graph'];
  let stores: ExtensionStoreAPI | undefined;
  
  if (hasAnyPermission(manifest, storePermissions)) {
    const storesParts: Record<string, any> = {};

    if (hasPermission(manifest, 'event-store') && fullAPI.eventStore) {
      storesParts.eventStore = fullAPI.eventStore;
    }

    if (hasPermission(manifest, 'clip-registry') && fullAPI.clipRegistry) {
      storesParts.clipRegistry = fullAPI.clipRegistry;
    }

    if (hasPermission(manifest, 'routing-graph') && fullAPI.routingGraph) {
      storesParts.routingGraph = fullAPI.routingGraph;
    }
    
    stores = storesParts as ExtensionStoreAPI;
  }

  // Build complete API object
  const api: CardPlayAPI = {
    version: '1.0.0',
    ...(stores ? { stores } : {}),
    ...(hasPermission(manifest, 'audio-engine') && fullAPI.audioEngine ? { audio: fullAPI.audioEngine } : {}),
    ...(hasPermission(manifest, 'prolog-kb') && fullAPI.prologKB ? { prolog: fullAPI.prologKB } : {}),
    ...(hasPermission(manifest, 'ui-extension') && fullAPI.ui ? { ui: fullAPI.ui } : {})
  };

  return api;
}

// ============================================================================
// PERMISSION METADATA
// ============================================================================

/**
 * Permission descriptions for user-facing displays.
 */
export const PERMISSION_DESCRIPTIONS: Record<ExtensionPermission, string> = {
  'audio-engine': 'Access to audio engine for creating and routing audio nodes',
  'event-store': 'Read and write MIDI events in the event store',
  'clip-registry': 'Create, modify, and delete clips',
  'routing-graph': 'Create and modify audio/MIDI routing connections',
  'prolog-kb': 'Add custom predicates and rules to the AI knowledge base',
  'file-system': 'Read and write files in sandboxed extension directory',
  'network': 'Make HTTP requests to external services',
  'ui-extension': 'Create custom UI components and register boards/decks/cards'
};

/**
 * Permission risk levels for security audit.
 */
export const PERMISSION_RISK_LEVELS: Record<ExtensionPermission, 'low' | 'medium' | 'high'> = {
  'audio-engine': 'low',
  'event-store': 'medium',
  'clip-registry': 'medium',
  'routing-graph': 'medium',
  'prolog-kb': 'medium',
  'file-system': 'high',
  'network': 'high',
  'ui-extension': 'low'
};

/**
 * Get display information for a permission.
 */
export function getPermissionInfo(permission: ExtensionPermission) {
  return {
    permission,
    description: PERMISSION_DESCRIPTIONS[permission],
    riskLevel: PERMISSION_RISK_LEVELS[permission]
  };
}

/**
 * Get all permissions requested by an extension with risk levels.
 */
export function getExtensionPermissionInfo(manifest: ExtensionManifest) {
  return manifest.permissions.map(getPermissionInfo);
}

/**
 * Check if extension has any high-risk permissions.
 */
export function hasHighRiskPermissions(manifest: ExtensionManifest): boolean {
  return manifest.permissions.some(p => PERMISSION_RISK_LEVELS[p] === 'high');
}
