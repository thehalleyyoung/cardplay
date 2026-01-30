/**
 * @fileoverview Pack Security Boundaries (Change 441)
 * 
 * Defines security boundaries between project-local and global user packs.
 * Project-local packs have restricted access to prevent malicious code from
 * accessing user data or system resources outside the project.
 * 
 * Security Model:
 * - Global user packs: Installed in user folder, trusted by user, full capabilities
 * - Project-local packs: Bundled with project, untrusted, sandboxed capabilities
 * 
 * @module @cardplay/user-cards/pack-security
 * @see Change 441
 */

import type { Capability } from '../extensions/capabilities';

// ============================================================================
// PACK LOCATION
// ============================================================================

/**
 * Pack installation location.
 */
export type PackLocation = 'global-user' | 'project-local' | 'builtin';

/**
 * Pack trust level based on location.
 */
export type PackTrustLevel = 'trusted' | 'sandboxed' | 'builtin';

/**
 * Get trust level for a pack location.
 */
export function getTrustLevel(location: PackLocation): PackTrustLevel {
  switch (location) {
    case 'builtin':
      return 'builtin';
    case 'global-user':
      return 'trusted';
    case 'project-local':
      return 'sandboxed';
  }
}

// ============================================================================
// CAPABILITY RESTRICTIONS
// ============================================================================

/**
 * Capabilities allowed for project-local (sandboxed) packs.
 * 
 * Project-local packs can only:
 * - Register cards/decks with namespaced IDs
 * - Read project data (events, clips, tracks)
 * - Write to project data within constraints
 * - Use local storage scoped to pack namespace
 * 
 * Project-local packs CANNOT:
 * - Access filesystem outside project directory
 * - Access network
 * - Execute arbitrary code
 * - Access user settings/credentials
 * - Modify global CardPlay configuration
 */
export const PROJECT_LOCAL_ALLOWED_CAPABILITIES: readonly Capability[] = [
  'read-project',
  'write-project',
  'register-cards',
  'register-deck-templates',
  'register-event-kinds',
  'local-storage',
];

/**
 * All capabilities available to global user packs.
 * 
 * Global user packs are trusted and can:
 * - Everything project-local packs can do
 * - Access filesystem (with user permission)
 * - Access network (for sample downloads, etc)
 * - Register system-wide extensions
 * - Modify user preferences
 */
export const GLOBAL_USER_ALLOWED_CAPABILITIES: readonly Capability[] = [
  ...PROJECT_LOCAL_ALLOWED_CAPABILITIES,
  'filesystem-read',
  'filesystem-write',
  'network-access',
  'register-themes',
  'register-ontologies',
  'modify-user-settings',
  'execute-scripts',
];

/**
 * Check if a capability is allowed for a pack at the given location.
 * 
 * @param location - Pack installation location
 * @param capability - Capability to check
 * @returns Whether capability is allowed
 */
export function isCapabilityAllowed(
  location: PackLocation,
  capability: Capability
): boolean {
  if (location === 'builtin') {
    // Builtins can do anything
    return true;
  }
  
  if (location === 'global-user') {
    return GLOBAL_USER_ALLOWED_CAPABILITIES.includes(capability);
  }
  
  // project-local
  return PROJECT_LOCAL_ALLOWED_CAPABILITIES.includes(capability);
}

/**
 * Filter capabilities to only those allowed for the pack location.
 * 
 * @param location - Pack installation location
 * @param requestedCapabilities - Capabilities requested by pack
 * @returns Filtered capabilities that are allowed
 */
export function filterAllowedCapabilities(
  location: PackLocation,
  requestedCapabilities: readonly Capability[]
): readonly Capability[] {
  return requestedCapabilities.filter(cap => isCapabilityAllowed(location, cap));
}

// ============================================================================
// SECURITY VALIDATION
// ============================================================================

/**
 * Security validation error.
 */
export interface SecurityError {
  readonly code: string;
  readonly message: string;
  readonly capability?: Capability;
  readonly severity: 'error' | 'warning';
}

/**
 * Validate pack capabilities against location security policy.
 * 
 * @param location - Pack installation location
 * @param requestedCapabilities - Capabilities requested by pack
 * @returns Array of security errors (empty if valid)
 */
export function validatePackSecurity(
  location: PackLocation,
  requestedCapabilities: readonly Capability[]
): readonly SecurityError[] {
  const errors: SecurityError[] = [];
  
  for (const capability of requestedCapabilities) {
    if (!isCapabilityAllowed(location, capability)) {
      errors.push({
        code: 'CAPABILITY_NOT_ALLOWED',
        message: `Pack at location '${location}' cannot request capability '${capability}'`,
        capability,
        severity: 'error',
      });
    }
  }
  
  return errors;
}

/**
 * Security policy for pack operations.
 */
export interface SecurityPolicy {
  /** Whether to allow project-local packs at all */
  readonly allowProjectLocalPacks: boolean;
  /** Whether to require user confirmation for global pack installation */
  readonly requireUserConfirmation: boolean;
  /** Whether to sandbox all non-builtin packs */
  readonly sandboxAll: boolean;
  /** Maximum number of capabilities a project-local pack can request */
  readonly maxProjectLocalCapabilities: number;
}

/**
 * Default security policy.
 */
export const DEFAULT_SECURITY_POLICY: SecurityPolicy = {
  allowProjectLocalPacks: true,
  requireUserConfirmation: true,
  sandboxAll: false,
  maxProjectLocalCapabilities: 5,
};

/**
 * Validate pack against security policy.
 * 
 * @param location - Pack location
 * @param requestedCapabilities - Requested capabilities
 * @param policy - Security policy to enforce
 * @returns Validation errors
 */
export function validateAgainstPolicy(
  location: PackLocation,
  requestedCapabilities: readonly Capability[],
  policy: SecurityPolicy = DEFAULT_SECURITY_POLICY
): readonly SecurityError[] {
  const errors: SecurityError[] = [];
  
  // Check if project-local packs allowed
  if (location === 'project-local' && !policy.allowProjectLocalPacks) {
    errors.push({
      code: 'PROJECT_LOCAL_DISABLED',
      message: 'Project-local packs are disabled by security policy',
      severity: 'error',
    });
  }
  
  // Check capability count for project-local
  if (location === 'project-local') {
    if (requestedCapabilities.length > policy.maxProjectLocalCapabilities) {
      errors.push({
        code: 'TOO_MANY_CAPABILITIES',
        message: `Project-local pack requests ${requestedCapabilities.length} capabilities, maximum is ${policy.maxProjectLocalCapabilities}`,
        severity: 'error',
      });
    }
  }
  
  // Apply sandboxing if policy requires
  if (policy.sandboxAll && location !== 'builtin') {
    // All non-builtin packs treated as project-local
    const sandboxErrors = validatePackSecurity('project-local', requestedCapabilities);
    errors.push(...sandboxErrors);
  } else {
    // Normal security validation
    const securityErrors = validatePackSecurity(location, requestedCapabilities);
    errors.push(...securityErrors);
  }
  
  return errors;
}

// ============================================================================
// PACK LOADING
// ============================================================================

/**
 * Pack load options with security context.
 */
export interface SecurePackLoadOptions {
  /** Pack location */
  readonly location: PackLocation;
  /** Security policy to apply */
  readonly policy?: SecurityPolicy;
  /** Whether to warn on capability restrictions (vs error) */
  readonly warnOnRestrictions?: boolean;
}

/**
 * Result of secure pack loading.
 */
export interface SecurePackLoadResult {
  /** Whether pack loaded successfully */
  readonly success: boolean;
  /** Allowed capabilities after security filtering */
  readonly allowedCapabilities: readonly Capability[];
  /** Security errors/warnings */
  readonly securityIssues: readonly SecurityError[];
  /** Trust level assigned */
  readonly trustLevel: PackTrustLevel;
}

/**
 * Prepare pack for loading with security checks.
 * 
 * @param requestedCapabilities - Capabilities pack requests
 * @param options - Load options with security context
 * @returns Load result with security information
 */
export function prepareSecurePackLoad(
  requestedCapabilities: readonly Capability[],
  options: SecurePackLoadOptions
): SecurePackLoadResult {
  const { location, policy = DEFAULT_SECURITY_POLICY, warnOnRestrictions = false } = options;
  
  // Get trust level
  const trustLevel = getTrustLevel(location);
  
  // Validate security
  const securityIssues = validateAgainstPolicy(location, requestedCapabilities, policy);
  
  // Filter capabilities
  const allowedCapabilities = filterAllowedCapabilities(location, requestedCapabilities);
  
  // Determine success
  const hasErrors = securityIssues.some(issue => issue.severity === 'error');
  const success = !hasErrors || warnOnRestrictions;
  
  return {
    success,
    allowedCapabilities,
    securityIssues: warnOnRestrictions 
      ? securityIssues.map(issue => ({ ...issue, severity: 'warning' as const }))
      : securityIssues,
    trustLevel,
  };
}
