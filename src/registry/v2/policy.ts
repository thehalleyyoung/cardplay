/**
 * @fileoverview Registry V2 Policy and Risk Classification
 * 
 * Manages capability-based security policies and risk classification
 * for registry entries.
 * 
 * References:
 * - docs/capabilities-reference.md
 * - docs/capability-prompts.md
 * - docs/pack-signing-trust-model.md
 * 
 * @module registry/v2/policy
 */

import type { RegistryEntry } from './types';

/**
 * Risk levels for capabilities and registry entries.
 */
export enum RiskLevel {
  /** Safe operations with no side effects */
  SAFE = 'safe',
  
  /** Low-risk operations (UI changes, preferences) */
  LOW = 'low',
  
  /** Medium-risk operations (file I/O, network with user consent) */
  MEDIUM = 'medium',
  
  /** High-risk operations (audio/MIDI I/O, clipboard, system state) */
  HIGH = 'high',
  
  /** Critical operations (code execution, native modules) */
  CRITICAL = 'critical',
}

/**
 * Capability metadata with risk classification.
 */
export interface CapabilityMetadata {
  /** Capability identifier */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Description of what this capability allows */
  description: string;
  
  /** Risk level */
  risk: RiskLevel;
  
  /** Whether this requires user consent at install time */
  requiresConsent: boolean;
  
  /** Whether this requires user consent each time it's used */
  requiresRuntimeConsent: boolean;
  
  /** Related capabilities (dependencies) */
  requires?: readonly string[];
  
  /** Capabilities that conflict with this one */
  conflicts?: readonly string[];
}

/**
 * Builtin capability definitions.
 * These match the capabilities defined in src/extensions/capabilities.ts
 */
export const CAPABILITY_METADATA: Record<string, CapabilityMetadata> = {
  'core:read-state': {
    id: 'core:read-state',
    name: 'Read Project State',
    description: 'Read current project state (MusicSpec, events, routing)',
    risk: RiskLevel.SAFE,
    requiresConsent: false,
    requiresRuntimeConsent: false,
  },
  
  'core:write-state': {
    id: 'core:write-state',
    name: 'Modify Project State',
    description: 'Modify project state via HostActions',
    risk: RiskLevel.MEDIUM,
    requiresConsent: true,
    requiresRuntimeConsent: false,
    requires: ['core:read-state'],
  },
  
  'audio:output': {
    id: 'audio:output',
    name: 'Audio Output',
    description: 'Generate and output audio',
    risk: RiskLevel.HIGH,
    requiresConsent: true,
    requiresRuntimeConsent: false,
  },
  
  'midi:input': {
    id: 'midi:input',
    name: 'MIDI Input',
    description: 'Receive MIDI input from hardware devices',
    risk: RiskLevel.HIGH,
    requiresConsent: true,
    requiresRuntimeConsent: false,
  },
  
  'midi:output': {
    id: 'midi:output',
    name: 'MIDI Output',
    description: 'Send MIDI to hardware devices',
    risk: RiskLevel.HIGH,
    requiresConsent: true,
    requiresRuntimeConsent: false,
  },
  
  'file:read': {
    id: 'file:read',
    name: 'Read Files',
    description: 'Read files from disk',
    risk: RiskLevel.MEDIUM,
    requiresConsent: true,
    requiresRuntimeConsent: false,
  },
  
  'file:write': {
    id: 'file:write',
    name: 'Write Files',
    description: 'Write files to disk',
    risk: RiskLevel.MEDIUM,
    requiresConsent: true,
    requiresRuntimeConsent: true,
  },
  
  'network:fetch': {
    id: 'network:fetch',
    name: 'Network Access',
    description: 'Make HTTP requests to external services',
    risk: RiskLevel.MEDIUM,
    requiresConsent: true,
    requiresRuntimeConsent: false,
  },
  
  'prolog:query': {
    id: 'prolog:query',
    name: 'Prolog Queries',
    description: 'Execute Prolog queries against knowledge base',
    risk: RiskLevel.LOW,
    requiresConsent: false,
    requiresRuntimeConsent: false,
  },
  
  'prolog:assert': {
    id: 'prolog:assert',
    name: 'Modify Knowledge Base',
    description: 'Add/remove facts from Prolog knowledge base',
    risk: RiskLevel.HIGH,
    requiresConsent: true,
    requiresRuntimeConsent: false,
    requires: ['prolog:query'],
  },
  
  'ui:theme': {
    id: 'ui:theme',
    name: 'Theme Customization',
    description: 'Customize UI appearance',
    risk: RiskLevel.SAFE,
    requiresConsent: false,
    requiresRuntimeConsent: false,
  },
  
  'ui:overlay': {
    id: 'ui:overlay',
    name: 'UI Overlays',
    description: 'Show modal dialogs and overlays',
    risk: RiskLevel.LOW,
    requiresConsent: false,
    requiresRuntimeConsent: false,
  },
  
  'native:exec': {
    id: 'native:exec',
    name: 'Execute Native Code',
    description: 'Load and execute native modules',
    risk: RiskLevel.CRITICAL,
    requiresConsent: true,
    requiresRuntimeConsent: true,
  },
};

/**
 * Gets metadata for a capability.
 */
export function getCapabilityMetadata(capabilityId: string): CapabilityMetadata | undefined {
  return CAPABILITY_METADATA[capabilityId];
}

/**
 * Calculates the overall risk level for a set of capabilities.
 * Returns the highest risk level among all capabilities.
 */
export function calculateRiskLevel(capabilities: readonly string[]): RiskLevel {
  let maxRisk = RiskLevel.SAFE;
  
  for (const capId of capabilities) {
    const meta = getCapabilityMetadata(capId);
    if (!meta) continue;
    
    // Compare risk levels (higher enum value = higher risk)
    const riskLevels = [RiskLevel.SAFE, RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL];
    const currentIndex = riskLevels.indexOf(meta.risk);
    const maxIndex = riskLevels.indexOf(maxRisk);
    
    if (currentIndex > maxIndex) {
      maxRisk = meta.risk;
    }
  }
  
  return maxRisk;
}

/**
 * Checks if a set of capabilities requires user consent at install time.
 */
export function requiresInstallConsent(capabilities: readonly string[]): boolean {
  return capabilities.some(capId => {
    const meta = getCapabilityMetadata(capId);
    return meta?.requiresConsent ?? false;
  });
}

/**
 * Checks if a set of capabilities requires runtime consent for each use.
 */
export function requiresRuntimeConsent(capabilities: readonly string[]): boolean {
  return capabilities.some(capId => {
    const meta = getCapabilityMetadata(capId);
    return meta?.requiresRuntimeConsent ?? false;
  });
}

/**
 * Validates that all required dependencies for a capability set are present.
 */
export function validateCapabilityDependencies(
  capabilities: readonly string[]
): { valid: boolean; missing: string[] } {
  const capSet = new Set(capabilities);
  const missing: string[] = [];
  
  for (const capId of capabilities) {
    const meta = getCapabilityMetadata(capId);
    if (!meta?.requires) continue;
    
    for (const required of meta.requires) {
      if (!capSet.has(required)) {
        missing.push(`${capId} requires ${required}`);
      }
    }
  }
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Validates that no conflicting capabilities are requested together.
 */
export function validateCapabilityConflicts(
  capabilities: readonly string[]
): { valid: boolean; conflicts: string[] } {
  const capSet = new Set(capabilities);
  const conflicts: string[] = [];
  
  for (const capId of capabilities) {
    const meta = getCapabilityMetadata(capId);
    if (!meta?.conflicts) continue;
    
    for (const conflicting of meta.conflicts) {
      if (capSet.has(conflicting)) {
        conflicts.push(`${capId} conflicts with ${conflicting}`);
      }
    }
  }
  
  return {
    valid: conflicts.length === 0,
    conflicts,
  };
}

/**
 * Policy decision for a registry entry.
 */
export interface PolicyDecision {
  /** Whether this entry is allowed to be registered */
  allowed: boolean;
  
  /** Risk level of this entry */
  risk: RiskLevel;
  
  /** Whether install-time consent is required */
  requiresInstallConsent: boolean;
  
  /** Whether runtime consent is required for each use */
  requiresRuntimeConsent: boolean;
  
  /** Warnings (non-blocking) */
  warnings: string[];
  
  /** Errors (blocking) */
  errors: string[];
}

/**
 * Evaluates policy for a registry entry based on its provenance.
 */
export function evaluateEntryPolicy(entry: RegistryEntry): PolicyDecision {
  const provenance = entry.provenance;
  const capabilities = provenance.requiredCapabilities ?? [];
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Check capability dependencies
  const depCheck = validateCapabilityDependencies(capabilities);
  if (!depCheck.valid) {
    errors.push(...depCheck.missing);
  }
  
  // Check capability conflicts
  const conflictCheck = validateCapabilityConflicts(capabilities);
  if (!conflictCheck.valid) {
    errors.push(...conflictCheck.conflicts);
  }
  
  // Check trust for high-risk entries
  const risk = calculateRiskLevel(capabilities);
  if (risk === RiskLevel.CRITICAL || risk === RiskLevel.HIGH) {
    if (!provenance.trust?.verified && !provenance.builtin) {
      warnings.push('High-risk entry from unverified source');
    }
  }
  
  return {
    allowed: errors.length === 0,
    risk,
    requiresInstallConsent: requiresInstallConsent(capabilities),
    requiresRuntimeConsent: requiresRuntimeConsent(capabilities),
    warnings,
    errors,
  };
}
