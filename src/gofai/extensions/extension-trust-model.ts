/**
 * @file Extension Trust Model
 * @module gofai/extensions/extension-trust-model
 * 
 * Implements Step 404: Define an extension trust model (trusted/untrusted)
 * affecting whether execution hooks are enabled by default.
 * 
 * The trust model establishes security boundaries for GOFAI extensions:
 * - **Builtin extensions** are fully trusted (shipped with CardPlay)
 * - **Verified extensions** are trusted (signed by verified publishers)
 * - **User-installed extensions** are partially trusted (installed by user)
 * - **Project extensions** are untrusted (loaded from project files)
 * - **Unknown extensions** are untrusted (no signature/verification)
 * 
 * Trust levels affect:
 * - Whether execution hooks are enabled by default
 * - Whether lexicon/grammar contributions are automatically merged
 * - Whether Prolog modules can be loaded
 * - Whether custom opcodes can execute
 * - UI warnings and confirmation prompts
 * 
 * Security principles:
 * - Principle of least privilege: extensions start with minimal permissions
 * - User consent: untrusted extensions require explicit user approval
 * - Isolation: extensions cannot access other extensions' internals
 * - Auditability: all permission grants are logged
 * - Revocability: users can revoke permissions at any time
 * 
 * @see gofai_goalB.md Step 404
 * @see docs/gofai/extension-security.md (to be created)
 */

// ============================================================================
// Trust Levels
// ============================================================================

/**
 * Trust level for an extension.
 */
export enum ExtensionTrustLevel {
  /**
   * Builtin extensions shipped with CardPlay.
   * - Fully trusted
   * - All capabilities enabled by default
   * - No user confirmation required
   * - Cannot be disabled
   */
  BUILTIN = 'builtin',
  
  /**
   * Extensions verified by CardPlay team or trusted publishers.
   * - Trusted
   * - All capabilities enabled by default
   * - No user confirmation required (first time only)
   * - Can be disabled by user
   */
  VERIFIED = 'verified',
  
  /**
   * Extensions installed by the user from their extensions directory.
   * - Partially trusted
   * - Read-only capabilities enabled by default
   * - Execution capabilities require user confirmation
   * - Can be disabled by user
   */
  USER_INSTALLED = 'user-installed',
  
  /**
   * Extensions loaded from project directory.
   * - Untrusted
   * - Only parsing/analysis enabled by default
   * - All execution capabilities require user confirmation
   * - Can be disabled by user
   * - Warning shown in UI
   */
  PROJECT_LOCAL = 'project-local',
  
  /**
   * Extensions with no verification or unknown source.
   * - Untrusted
   * - Minimal capabilities enabled
   * - Strong warnings shown
   * - All execution requires explicit approval
   */
  UNKNOWN = 'unknown',
}

/**
 * Capabilities that can be granted to extensions.
 */
export enum ExtensionCapability {
  /** Add lexemes to the lexicon (read-only) */
  LEXICON_READ = 'lexicon:read',
  
  /** Add/modify lexemes in the lexicon */
  LEXICON_WRITE = 'lexicon:write',
  
  /** Add grammar rules (read-only) */
  GRAMMAR_READ = 'grammar:read',
  
  /** Add/modify grammar rules */
  GRAMMAR_WRITE = 'grammar:write',
  
  /** Register semantic handlers */
  SEMANTICS_REGISTER = 'semantics:register',
  
  /** Register plan opcodes (definitions only) */
  PLANNING_REGISTER = 'planning:register',
  
  /** Execute plan opcodes (actually apply changes) */
  PLANNING_EXECUTE = 'planning:execute',
  
  /** Load Prolog modules */
  PROLOG_LOAD = 'prolog:load',
  
  /** Query Prolog predicates */
  PROLOG_QUERY = 'prolog:query',
  
  /** Assert/retract Prolog facts */
  PROLOG_MODIFY = 'prolog:modify',
  
  /** Read project state */
  PROJECT_READ = 'project:read',
  
  /** Modify project state */
  PROJECT_WRITE = 'project:write',
  
  /** Access file system (read) */
  FILESYSTEM_READ = 'filesystem:read',
  
  /** Access file system (write) */
  FILESYSTEM_WRITE = 'filesystem:write',
  
  /** Make network requests */
  NETWORK = 'network',
  
  /** Execute arbitrary code */
  CODE_EXECUTION = 'code:execution',
}

// ============================================================================
// Trust Policy
// ============================================================================

/**
 * Trust policy that maps trust levels to default capabilities.
 */
export class ExtensionTrustPolicy {
  private readonly defaultCapabilities: Map<ExtensionTrustLevel, Set<ExtensionCapability>>;
  
  constructor() {
    this.defaultCapabilities = new Map();
    this.initializeDefaultPolicies();
  }
  
  /**
   * Initialize default capability grants for each trust level.
   */
  private initializeDefaultPolicies(): void {
    // Builtin: All capabilities
    this.defaultCapabilities.set(
      ExtensionTrustLevel.BUILTIN,
      new Set([
        ExtensionCapability.LEXICON_READ,
        ExtensionCapability.LEXICON_WRITE,
        ExtensionCapability.GRAMMAR_READ,
        ExtensionCapability.GRAMMAR_WRITE,
        ExtensionCapability.SEMANTICS_REGISTER,
        ExtensionCapability.PLANNING_REGISTER,
        ExtensionCapability.PLANNING_EXECUTE,
        ExtensionCapability.PROLOG_LOAD,
        ExtensionCapability.PROLOG_QUERY,
        ExtensionCapability.PROLOG_MODIFY,
        ExtensionCapability.PROJECT_READ,
        ExtensionCapability.PROJECT_WRITE,
        // No filesystem or network access even for builtin
      ])
    );
    
    // Verified: Most capabilities except filesystem/network/code execution
    this.defaultCapabilities.set(
      ExtensionTrustLevel.VERIFIED,
      new Set([
        ExtensionCapability.LEXICON_READ,
        ExtensionCapability.LEXICON_WRITE,
        ExtensionCapability.GRAMMAR_READ,
        ExtensionCapability.GRAMMAR_WRITE,
        ExtensionCapability.SEMANTICS_REGISTER,
        ExtensionCapability.PLANNING_REGISTER,
        ExtensionCapability.PLANNING_EXECUTE,
        ExtensionCapability.PROLOG_LOAD,
        ExtensionCapability.PROLOG_QUERY,
        ExtensionCapability.PROLOG_MODIFY,
        ExtensionCapability.PROJECT_READ,
        ExtensionCapability.PROJECT_WRITE,
      ])
    );
    
    // User-installed: Read + register capabilities, execution requires approval
    this.defaultCapabilities.set(
      ExtensionTrustLevel.USER_INSTALLED,
      new Set([
        ExtensionCapability.LEXICON_READ,
        ExtensionCapability.LEXICON_WRITE,
        ExtensionCapability.GRAMMAR_READ,
        ExtensionCapability.GRAMMAR_WRITE,
        ExtensionCapability.SEMANTICS_REGISTER,
        ExtensionCapability.PLANNING_REGISTER,
        // PLANNING_EXECUTE requires user approval
        ExtensionCapability.PROLOG_LOAD,
        ExtensionCapability.PROLOG_QUERY,
        // PROLOG_MODIFY requires user approval
        ExtensionCapability.PROJECT_READ,
        // PROJECT_WRITE requires user approval
      ])
    );
    
    // Project-local: Very limited by default
    this.defaultCapabilities.set(
      ExtensionTrustLevel.PROJECT_LOCAL,
      new Set([
        ExtensionCapability.LEXICON_READ,
        ExtensionCapability.GRAMMAR_READ,
        ExtensionCapability.SEMANTICS_REGISTER,
        ExtensionCapability.PLANNING_REGISTER,
        // All execution capabilities require approval
        ExtensionCapability.PROLOG_QUERY,
        ExtensionCapability.PROJECT_READ,
      ])
    );
    
    // Unknown: Minimal capabilities
    this.defaultCapabilities.set(
      ExtensionTrustLevel.UNKNOWN,
      new Set([
        ExtensionCapability.LEXICON_READ,
        ExtensionCapability.GRAMMAR_READ,
        // Everything else requires approval
      ])
    );
  }
  
  /**
   * Get default capabilities for a trust level.
   */
  getDefaultCapabilities(trustLevel: ExtensionTrustLevel): readonly ExtensionCapability[] {
    const caps = this.defaultCapabilities.get(trustLevel);
    return caps ? Array.from(caps) : [];
  }
  
  /**
   * Check if a capability is granted by default for a trust level.
   */
  isDefaultGranted(
    trustLevel: ExtensionTrustLevel,
    capability: ExtensionCapability
  ): boolean {
    const caps = this.defaultCapabilities.get(trustLevel);
    return caps ? caps.has(capability) : false;
  }
  
  /**
   * Check if a capability requires user confirmation for a trust level.
   */
  requiresConfirmation(
    trustLevel: ExtensionTrustLevel,
    capability: ExtensionCapability
  ): boolean {
    return !this.isDefaultGranted(trustLevel, capability);
  }
  
  /**
   * Get capabilities that require user confirmation for a trust level.
   */
  getConfirmationRequired(
    trustLevel: ExtensionTrustLevel
  ): readonly ExtensionCapability[] {
    const allCapabilities = Object.values(ExtensionCapability);
    const defaultGranted = new Set(this.getDefaultCapabilities(trustLevel));
    
    return allCapabilities.filter(cap => !defaultGranted.has(cap));
  }
  
  /**
   * Determine trust level from extension source.
   */
  determineTrustLevel(source: ExtensionSource): ExtensionTrustLevel {
    switch (source.type) {
      case 'builtin':
        return ExtensionTrustLevel.BUILTIN;
      
      case 'verified':
        return ExtensionTrustLevel.VERIFIED;
      
      case 'user-directory':
        return ExtensionTrustLevel.USER_INSTALLED;
      
      case 'project-directory':
        return ExtensionTrustLevel.PROJECT_LOCAL;
      
      case 'unknown':
      default:
        return ExtensionTrustLevel.UNKNOWN;
    }
  }
}

// ============================================================================
// Extension Source
// ============================================================================

/**
 * Source of an extension (determines initial trust level).
 */
export type ExtensionSource =
  | BuiltinExtensionSource
  | VerifiedExtensionSource
  | UserDirectoryExtensionSource
  | ProjectDirectoryExtensionSource
  | UnknownExtensionSource;

export interface BuiltinExtensionSource {
  readonly type: 'builtin';
  readonly builtinId: string;
}

export interface VerifiedExtensionSource {
  readonly type: 'verified';
  readonly publisherId: string;
  readonly signature: string;
  readonly signatureAlgorithm: string;
  readonly verifiedAt: number;
}

export interface UserDirectoryExtensionSource {
  readonly type: 'user-directory';
  readonly path: string;
  readonly installedAt: number;
  readonly installedBy?: string;
}

export interface ProjectDirectoryExtensionSource {
  readonly type: 'project-directory';
  readonly projectPath: string;
  readonly relativePath: string;
}

export interface UnknownExtensionSource {
  readonly type: 'unknown';
  readonly reason: string;
}

// ============================================================================
// Permission Grant
// ============================================================================

/**
 * A granted permission for an extension.
 */
export interface ExtensionPermissionGrant {
  /** Extension namespace */
  readonly namespace: string;
  /** Capability being granted */
  readonly capability: ExtensionCapability;
  /** Trust level at time of grant */
  readonly trustLevel: ExtensionTrustLevel;
  /** Whether this was granted by default or explicitly by user */
  readonly grantedBy: 'default' | 'user' | 'admin';
  /** Timestamp of grant */
  readonly grantedAt: number;
  /** Optional expiration timestamp */
  readonly expiresAt?: number;
  /** Optional reason/context for grant */
  readonly reason?: string;
}

/**
 * Permission grant result.
 */
export interface PermissionGrantResult {
  /** Whether the permission was granted */
  readonly granted: boolean;
  /** Reason if not granted */
  readonly reason?: string;
  /** Whether user confirmation is required */
  readonly requiresConfirmation: boolean;
  /** Grant record if successful */
  readonly grant?: ExtensionPermissionGrant;
}

// ============================================================================
// Permission Manager
// ============================================================================

/**
 * Manages permission grants for extensions.
 */
export class ExtensionPermissionManager {
  private readonly policy: ExtensionTrustPolicy;
  private readonly grants: Map<string, Map<ExtensionCapability, ExtensionPermissionGrant>>;
  private readonly revocations: Map<string, Set<ExtensionCapability>>;
  private readonly auditLog: PermissionAuditEntry[];
  
  constructor(policy?: ExtensionTrustPolicy) {
    this.policy = policy || new ExtensionTrustPolicy();
    this.grants = new Map();
    this.revocations = new Map();
    this.auditLog = [];
  }
  
  /**
   * Request a capability for an extension.
   */
  requestCapability(
    namespace: string,
    capability: ExtensionCapability,
    trustLevel: ExtensionTrustLevel,
    context?: PermissionRequestContext
  ): PermissionGrantResult {
    // Check if already revoked
    const revoked = this.revocations.get(namespace);
    if (revoked?.has(capability)) {
      return {
        granted: false,
        reason: 'Permission was previously revoked',
        requiresConfirmation: false,
      };
    }
    
    // Check if already granted
    const existingGrant = this.getGrant(namespace, capability);
    if (existingGrant) {
      // Check if expired
      if (existingGrant.expiresAt && Date.now() > existingGrant.expiresAt) {
        this.revokeCapability(namespace, capability, 'expired');
        // Continue to re-evaluation
      } else {
        return {
          granted: true,
          requiresConfirmation: false,
          grant: existingGrant,
        };
      }
    }
    
    // Check if granted by default for this trust level
    const isDefault = this.policy.isDefaultGranted(trustLevel, capability);
    
    if (isDefault) {
      // Grant automatically
      const grant: ExtensionPermissionGrant = {
        namespace,
        capability,
        trustLevel,
        grantedBy: 'default',
        grantedAt: Date.now(),
        reason: context?.reason,
      };
      
      this.storeGrant(grant);
      this.auditLog.push({
        type: 'grant',
        namespace,
        capability,
        trustLevel,
        grantedBy: 'default',
        timestamp: Date.now(),
        context,
      });
      
      return {
        granted: true,
        requiresConfirmation: false,
        grant,
      };
    }
    
    // Requires user confirmation
    return {
      granted: false,
      reason: `Capability ${capability} requires user confirmation for ${trustLevel} extensions`,
      requiresConfirmation: true,
    };
  }
  
  /**
   * Grant a capability after user confirmation.
   */
  grantCapability(
    namespace: string,
    capability: ExtensionCapability,
    trustLevel: ExtensionTrustLevel,
    grantedBy: 'user' | 'admin',
    context?: PermissionRequestContext
  ): ExtensionPermissionGrant {
    const grant: ExtensionPermissionGrant = {
      namespace,
      capability,
      trustLevel,
      grantedBy,
      grantedAt: Date.now(),
      reason: context?.reason,
    };
    
    this.storeGrant(grant);
    
    // Remove from revocations if present
    const revoked = this.revocations.get(namespace);
    if (revoked) {
      revoked.delete(capability);
    }
    
    this.auditLog.push({
      type: 'grant',
      namespace,
      capability,
      trustLevel,
      grantedBy,
      timestamp: Date.now(),
      context,
    });
    
    return grant;
  }
  
  /**
   * Revoke a capability.
   */
  revokeCapability(
    namespace: string,
    capability: ExtensionCapability,
    reason: string
  ): boolean {
    const namespaceGrants = this.grants.get(namespace);
    const revoked = namespaceGrants?.delete(capability) ?? false;
    
    if (revoked) {
      // Track revocation
      const revocations = this.revocations.get(namespace) || new Set();
      revocations.add(capability);
      this.revocations.set(namespace, revocations);
      
      this.auditLog.push({
        type: 'revoke',
        namespace,
        capability,
        timestamp: Date.now(),
        reason,
      });
    }
    
    return revoked;
  }
  
  /**
   * Revoke all capabilities for an extension.
   */
  revokeAll(namespace: string, reason: string): number {
    const namespaceGrants = this.grants.get(namespace);
    if (!namespaceGrants) return 0;
    
    const capabilities = Array.from(namespaceGrants.keys());
    for (const capability of capabilities) {
      this.revokeCapability(namespace, capability, reason);
    }
    
    return capabilities.length;
  }
  
  /**
   * Check if a capability is granted.
   */
  hasCapability(namespace: string, capability: ExtensionCapability): boolean {
    const grant = this.getGrant(namespace, capability);
    
    if (!grant) return false;
    
    // Check if expired
    if (grant.expiresAt && Date.now() > grant.expiresAt) {
      this.revokeCapability(namespace, capability, 'expired');
      return false;
    }
    
    return true;
  }
  
  /**
   * Get a specific grant.
   */
  getGrant(
    namespace: string,
    capability: ExtensionCapability
  ): ExtensionPermissionGrant | undefined {
    return this.grants.get(namespace)?.get(capability);
  }
  
  /**
   * Get all grants for an extension.
   */
  getGrantsForExtension(namespace: string): readonly ExtensionPermissionGrant[] {
    const namespaceGrants = this.grants.get(namespace);
    return namespaceGrants ? Array.from(namespaceGrants.values()) : [];
  }
  
  /**
   * Get audit log.
   */
  getAuditLog(): readonly PermissionAuditEntry[] {
    return this.auditLog;
  }
  
  /**
   * Get audit log for an extension.
   */
  getAuditLogForExtension(namespace: string): readonly PermissionAuditEntry[] {
    return this.auditLog.filter(entry => entry.namespace === namespace);
  }
  
  /**
   * Clear audit log.
   */
  clearAuditLog(): void {
    this.auditLog.length = 0;
  }
  
  /**
   * Export grants for persistence.
   */
  exportGrants(): ExtensionPermissionGrant[] {
    const allGrants: ExtensionPermissionGrant[] = [];
    
    for (const namespaceGrants of this.grants.values()) {
      for (const grant of namespaceGrants.values()) {
        allGrants.push(grant);
      }
    }
    
    return allGrants;
  }
  
  /**
   * Import grants from persistence.
   */
  importGrants(grants: readonly ExtensionPermissionGrant[]): void {
    for (const grant of grants) {
      // Skip expired grants
      if (grant.expiresAt && Date.now() > grant.expiresAt) {
        continue;
      }
      
      this.storeGrant(grant);
    }
  }
  
  private storeGrant(grant: ExtensionPermissionGrant): void {
    let namespaceGrants = this.grants.get(grant.namespace);
    
    if (!namespaceGrants) {
      namespaceGrants = new Map();
      this.grants.set(grant.namespace, namespaceGrants);
    }
    
    namespaceGrants.set(grant.capability, grant);
  }
}

// ============================================================================
// Permission Request Context
// ============================================================================

export interface PermissionRequestContext {
  /** Reason for requesting permission */
  readonly reason?: string;
  /** User-facing description of what the permission enables */
  readonly description?: string;
  /** Related operation or feature */
  readonly operation?: string;
  /** Timestamp of request */
  readonly requestedAt?: number;
}

// ============================================================================
// Audit Log
// ============================================================================

export type PermissionAuditEntry =
  | PermissionGrantAudit
  | PermissionRevokeAudit;

export interface PermissionGrantAudit {
  readonly type: 'grant';
  readonly namespace: string;
  readonly capability: ExtensionCapability;
  readonly trustLevel: ExtensionTrustLevel;
  readonly grantedBy: 'default' | 'user' | 'admin';
  readonly timestamp: number;
  readonly context?: PermissionRequestContext;
}

export interface PermissionRevokeAudit {
  readonly type: 'revoke';
  readonly namespace: string;
  readonly capability: ExtensionCapability;
  readonly timestamp: number;
  readonly reason: string;
}

// ============================================================================
// Trust Level Promotion/Demotion
// ============================================================================

/**
 * Manages trust level changes for extensions.
 */
export class ExtensionTrustManager {
  private readonly trustLevels: Map<string, ExtensionTrustLevel>;
  private readonly sources: Map<string, ExtensionSource>;
  private readonly policy: ExtensionTrustPolicy;
  private readonly permissionManager: ExtensionPermissionManager;
  
  constructor(
    policy?: ExtensionTrustPolicy,
    permissionManager?: ExtensionPermissionManager
  ) {
    this.trustLevels = new Map();
    this.sources = new Map();
    this.policy = policy || new ExtensionTrustPolicy();
    this.permissionManager = permissionManager || new ExtensionPermissionManager(this.policy);
  }
  
  /**
   * Register an extension with its source.
   */
  registerExtension(namespace: string, source: ExtensionSource): ExtensionTrustLevel {
    const trustLevel = this.policy.determineTrustLevel(source);
    this.trustLevels.set(namespace, trustLevel);
    this.sources.set(namespace, source);
    return trustLevel;
  }
  
  /**
   * Get trust level for an extension.
   */
  getTrustLevel(namespace: string): ExtensionTrustLevel | undefined {
    return this.trustLevels.get(namespace);
  }
  
  /**
   * Get source for an extension.
   */
  getSource(namespace: string): ExtensionSource | undefined {
    return this.sources.get(namespace);
  }
  
  /**
   * Promote an extension to a higher trust level.
   * This can happen when an extension is verified after initial installation.
   */
  promoteTrust(
    namespace: string,
    newTrustLevel: ExtensionTrustLevel,
    reason: string
  ): boolean {
    const currentLevel = this.trustLevels.get(namespace);
    if (!currentLevel) return false;
    
    // Can only promote, not demote (use demoteTrust for that)
    if (this.compareTrustLevels(newTrustLevel, currentLevel) <= 0) {
      return false;
    }
    
    this.trustLevels.set(namespace, newTrustLevel);
    
    // Grant new default capabilities
    const newCapabilities = this.policy.getDefaultCapabilities(newTrustLevel);
    for (const capability of newCapabilities) {
      if (!this.permissionManager.hasCapability(namespace, capability)) {
        this.permissionManager.grantCapability(
          namespace,
          capability,
          newTrustLevel,
          'admin',
          { reason }
        );
      }
    }
    
    return true;
  }
  
  /**
   * Demote an extension to a lower trust level.
   * This can happen if security issues are discovered.
   */
  demoteTrust(
    namespace: string,
    newTrustLevel: ExtensionTrustLevel,
    reason: string
  ): boolean {
    const currentLevel = this.trustLevels.get(namespace);
    if (!currentLevel) return false;
    
    // Can only demote, not promote (use promoteTrust for that)
    if (this.compareTrustLevels(newTrustLevel, currentLevel) >= 0) {
      return false;
    }
    
    this.trustLevels.set(namespace, newTrustLevel);
    
    // Revoke capabilities no longer granted by default
    const newDefaultCapabilities = new Set(
      this.policy.getDefaultCapabilities(newTrustLevel)
    );
    const currentGrants = this.permissionManager.getGrantsForExtension(namespace);
    
    for (const grant of currentGrants) {
      if (!newDefaultCapabilities.has(grant.capability)) {
        this.permissionManager.revokeCapability(
          namespace,
          grant.capability,
          `Trust level demoted: ${reason}`
        );
      }
    }
    
    return true;
  }
  
  /**
   * Compare trust levels (higher number = more trusted).
   */
  private compareTrustLevels(
    a: ExtensionTrustLevel,
    b: ExtensionTrustLevel
  ): number {
    const order = {
      [ExtensionTrustLevel.UNKNOWN]: 0,
      [ExtensionTrustLevel.PROJECT_LOCAL]: 1,
      [ExtensionTrustLevel.USER_INSTALLED]: 2,
      [ExtensionTrustLevel.VERIFIED]: 3,
      [ExtensionTrustLevel.BUILTIN]: 4,
    };
    
    return order[a] - order[b];
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a default trust policy.
 */
export function createDefaultTrustPolicy(): ExtensionTrustPolicy {
  return new ExtensionTrustPolicy();
}

/**
 * Create a permission manager.
 */
export function createPermissionManager(
  policy?: ExtensionTrustPolicy
): ExtensionPermissionManager {
  return new ExtensionPermissionManager(policy);
}

/**
 * Create a trust manager.
 */
export function createTrustManager(
  policy?: ExtensionTrustPolicy,
  permissionManager?: ExtensionPermissionManager
): ExtensionTrustManager {
  return new ExtensionTrustManager(policy, permissionManager);
}
