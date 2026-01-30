/**
 * @fileoverview Extension Capabilities
 * 
 * Defines capability strings and risk levels for extension packs.
 * This replaces phantom references to `registry/v2/policy.ts`.
 * 
 * ## Capability Levels
 * 
 * - **safe** - No risk, purely visual/data processing
 * - **elevated** - Accesses external resources (audio, files)
 * - **dangerous** - Can modify system state or access network
 * 
 * @module @cardplay/extensions/capabilities
 * @see to_fix_repo_plan_500.md Change 406
 */

// ============================================================================
// CAPABILITY DEFINITIONS
// ============================================================================

/**
 * Capability risk level.
 */
export type CapabilityRiskLevel = 'safe' | 'elevated' | 'dangerous';

/**
 * All defined capabilities with their metadata.
 */
export const CAPABILITIES = {
  // -------------------------------------------------------------------------
  // SAFE CAPABILITIES
  // -------------------------------------------------------------------------
  
  'cards:create': {
    description: 'Create new card types',
    riskLevel: 'safe' as CapabilityRiskLevel,
  },
  'cards:visuals': {
    description: 'Custom card visual rendering',
    riskLevel: 'safe' as CapabilityRiskLevel,
  },
  'presets:create': {
    description: 'Create card presets',
    riskLevel: 'safe' as CapabilityRiskLevel,
  },
  'themes:create': {
    description: 'Create UI themes',
    riskLevel: 'safe' as CapabilityRiskLevel,
  },
  'decks:templates': {
    description: 'Provide deck templates',
    riskLevel: 'safe' as CapabilityRiskLevel,
  },
  'constraints:create': {
    description: 'Define custom music constraints',
    riskLevel: 'safe' as CapabilityRiskLevel,
  },
  'ontology:extend': {
    description: 'Extend music ontology',
    riskLevel: 'safe' as CapabilityRiskLevel,
  },
  'write:spec': {
    description: 'Modify music specification',
    riskLevel: 'safe' as CapabilityRiskLevel,
  },
  
  // -------------------------------------------------------------------------
  // ELEVATED CAPABILITIES
  // -------------------------------------------------------------------------
  
  'audio:process': {
    description: 'Process audio signals',
    riskLevel: 'elevated' as CapabilityRiskLevel,
  },
  'audio:worklet': {
    description: 'Use AudioWorklet processing',
    riskLevel: 'elevated' as CapabilityRiskLevel,
  },
  'midi:access': {
    description: 'Access MIDI devices',
    riskLevel: 'elevated' as CapabilityRiskLevel,
  },
  'files:read': {
    description: 'Read files from disk',
    riskLevel: 'elevated' as CapabilityRiskLevel,
  },
  'files:write': {
    description: 'Write files to disk',
    riskLevel: 'elevated' as CapabilityRiskLevel,
  },
  'samples:load': {
    description: 'Load audio samples',
    riskLevel: 'elevated' as CapabilityRiskLevel,
  },
  'wasm:execute': {
    description: 'Execute WebAssembly modules',
    riskLevel: 'elevated' as CapabilityRiskLevel,
  },
  'storage:local': {
    description: 'Access local storage',
    riskLevel: 'elevated' as CapabilityRiskLevel,
  },
  
  // -------------------------------------------------------------------------
  // DANGEROUS CAPABILITIES
  // -------------------------------------------------------------------------
  
  'network:fetch': {
    description: 'Make network requests',
    riskLevel: 'dangerous' as CapabilityRiskLevel,
  },
  'network:websocket': {
    description: 'Open WebSocket connections',
    riskLevel: 'dangerous' as CapabilityRiskLevel,
  },
  'eval:code': {
    description: 'Dynamically evaluate code',
    riskLevel: 'dangerous' as CapabilityRiskLevel,
  },
  'system:spawn': {
    description: 'Spawn child processes',
    riskLevel: 'dangerous' as CapabilityRiskLevel,
  },
  'prolog:execute': {
    description: 'Execute Prolog queries',
    riskLevel: 'dangerous' as CapabilityRiskLevel,
  },
  'registry:modify': {
    description: 'Modify global registries',
    riskLevel: 'dangerous' as CapabilityRiskLevel,
  },
} as const;

/**
 * Type of capability strings.
 */
export type Capability = keyof typeof CAPABILITIES;

/**
 * List of all capability strings.
 */
export const CAPABILITY_LIST = Object.keys(CAPABILITIES) as Capability[];

// ============================================================================
// CAPABILITY VALIDATION
// ============================================================================

/**
 * Checks if a string is a valid capability.
 */
export function isValidCapability(cap: string): cap is Capability {
  return cap in CAPABILITIES;
}

/**
 * Gets the risk level for a capability.
 */
export function getCapabilityRiskLevel(cap: Capability): CapabilityRiskLevel {
  return CAPABILITIES[cap].riskLevel;
}

/**
 * Gets the description for a capability.
 */
export function getCapabilityDescription(cap: Capability): string {
  return CAPABILITIES[cap].description;
}

/**
 * Gets the highest risk level from a list of capabilities.
 */
export function getHighestRiskLevel(capabilities: readonly Capability[]): CapabilityRiskLevel {
  const riskOrder: CapabilityRiskLevel[] = ['safe', 'elevated', 'dangerous'];
  
  let maxRisk: CapabilityRiskLevel = 'safe';
  for (const cap of capabilities) {
    const risk = getCapabilityRiskLevel(cap);
    if (riskOrder.indexOf(risk) > riskOrder.indexOf(maxRisk)) {
      maxRisk = risk;
    }
  }
  
  return maxRisk;
}

/**
 * Filters capabilities by risk level.
 */
export function getCapabilitiesByRisk(level: CapabilityRiskLevel): Capability[] {
  return CAPABILITY_LIST.filter(cap => CAPABILITIES[cap].riskLevel === level);
}

// ============================================================================
// CAPABILITY REQUIREMENTS
// ============================================================================

/**
 * Capabilities required for certain features.
 */
export const FEATURE_CAPABILITIES: Record<string, readonly Capability[]> = {
  'audio-processing': ['audio:process'],
  'audio-worklet': ['audio:process', 'audio:worklet'],
  'midi-control': ['midi:access'],
  'file-export': ['files:write'],
  'file-import': ['files:read'],
  'sample-playback': ['samples:load', 'audio:process'],
  'network-sync': ['network:fetch', 'network:websocket'],
  'ai-theory': ['prolog:execute'],
  'custom-wasm-dsp': ['wasm:execute', 'audio:worklet'],
};

/**
 * Gets the capabilities required for a feature.
 */
export function getRequiredCapabilities(feature: string): readonly Capability[] {
  return FEATURE_CAPABILITIES[feature] || [];
}

/**
 * Checks if a set of capabilities covers a feature.
 */
export function hasCapabilitiesForFeature(
  capabilities: readonly Capability[],
  feature: string
): boolean {
  const required = getRequiredCapabilities(feature);
  return required.every(cap => capabilities.includes(cap));
}

// ============================================================================
// POLICY TYPES
// ============================================================================

/**
 * Trust level for an extension pack.
 */
export type TrustLevel = 'untrusted' | 'user' | 'verified' | 'builtin';

/**
 * Capability policy for an extension.
 */
export interface CapabilityPolicy {
  /** Allowed capabilities */
  readonly allowed: readonly Capability[];
  /** Denied capabilities (overrides allowed) */
  readonly denied: readonly Capability[];
  /** Maximum risk level allowed */
  readonly maxRiskLevel: CapabilityRiskLevel;
  /** Trust level of the extension */
  readonly trustLevel: TrustLevel;
}

/**
 * Default policies by trust level.
 */
export const DEFAULT_POLICIES: Record<TrustLevel, Omit<CapabilityPolicy, 'trustLevel'>> = {
  untrusted: {
    allowed: [],
    denied: CAPABILITY_LIST,
    maxRiskLevel: 'safe',
  },
  user: {
    allowed: getCapabilitiesByRisk('safe'),
    denied: getCapabilitiesByRisk('dangerous'),
    maxRiskLevel: 'elevated',
  },
  verified: {
    allowed: [...getCapabilitiesByRisk('safe'), ...getCapabilitiesByRisk('elevated')],
    denied: [],
    maxRiskLevel: 'elevated',
  },
  builtin: {
    allowed: CAPABILITY_LIST,
    denied: [],
    maxRiskLevel: 'dangerous',
  },
};

/**
 * Checks if a capability is allowed by a policy.
 */
export function isCapabilityAllowed(cap: Capability, policy: CapabilityPolicy): boolean {
  if (policy.denied.includes(cap)) {
    return false;
  }
  
  const riskLevel = getCapabilityRiskLevel(cap);
  const riskOrder: CapabilityRiskLevel[] = ['safe', 'elevated', 'dangerous'];
  
  if (riskOrder.indexOf(riskLevel) > riskOrder.indexOf(policy.maxRiskLevel)) {
    return false;
  }
  
  return policy.allowed.includes(cap);
}
