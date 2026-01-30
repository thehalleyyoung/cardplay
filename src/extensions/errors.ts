/**
 * @fileoverview Extension Error Taxonomy
 * 
 * Change 442: Typed error taxonomy for pack/registry failures.
 * 
 * @module @cardplay/extensions/errors
 */

// ============================================================================
// ERROR CODES
// ============================================================================

/**
 * Extension error codes for categorization.
 */
export enum ExtensionErrorCode {
  // Registration errors
  INVALID_ID = 'EXTENSION_INVALID_ID',
  DUPLICATE_ID = 'EXTENSION_DUPLICATE_ID',
  MISSING_NAMESPACE = 'EXTENSION_MISSING_NAMESPACE',
  NAMESPACE_COLLISION = 'EXTENSION_NAMESPACE_COLLISION',
  
  // Load errors
  LOAD_FAILED = 'EXTENSION_LOAD_FAILED',
  MANIFEST_INVALID = 'EXTENSION_MANIFEST_INVALID',
  MANIFEST_MISSING = 'EXTENSION_MANIFEST_MISSING',
  VERSION_MISMATCH = 'EXTENSION_VERSION_MISMATCH',
  
  // Dependency errors
  DEPENDENCY_MISSING = 'EXTENSION_DEPENDENCY_MISSING',
  DEPENDENCY_CYCLE = 'EXTENSION_DEPENDENCY_CYCLE',
  CAPABILITY_MISSING = 'EXTENSION_CAPABILITY_MISSING',
  
  // Runtime errors
  INITIALIZATION_FAILED = 'EXTENSION_INITIALIZATION_FAILED',
  FACTORY_ERROR = 'EXTENSION_FACTORY_ERROR',
  HANDLER_ERROR = 'EXTENSION_HANDLER_ERROR',
  
  // Registry errors
  REGISTRY_LOCKED = 'EXTENSION_REGISTRY_LOCKED',
  REGISTRY_CORRUPTED = 'EXTENSION_REGISTRY_CORRUPTED',
  
  // Pack errors
  PACK_NOT_FOUND = 'EXTENSION_PACK_NOT_FOUND',
  PACK_INVALID = 'EXTENSION_PACK_INVALID',
  PACK_CONFLICT = 'EXTENSION_PACK_CONFLICT',
}

// ============================================================================
// BASE ERROR CLASS
// ============================================================================

/**
 * Base error class for extension system errors.
 */
export class ExtensionError extends Error {
  /** Error code */
  readonly code: ExtensionErrorCode;
  /** Extension ID if applicable */
  readonly extensionId?: string;
  /** Pack ID if applicable */
  readonly packId?: string;
  /** Underlying cause if any */
  readonly cause?: Error;
  /** Additional metadata */
  readonly metadata?: Record<string, unknown>;

  override readonly name = 'ExtensionError';

  constructor(options: {
    code: ExtensionErrorCode;
    message: string;
    extensionId?: string;
    packId?: string;
    cause?: Error;
    metadata?: Record<string, unknown>;
  }) {
    super(options.message);
    this.name = 'ExtensionError';
    this.code = options.code;
    if (options.extensionId) this.extensionId = options.extensionId;
    if (options.packId) this.packId = options.packId;
    if (options.cause) this.cause = options.cause;
    if (options.metadata) this.metadata = options.metadata;
  }

  /**
   * Creates a user-friendly error message.
   */
  toUserMessage(): string {
    const parts = [this.message];
    
    if (this.extensionId) {
      parts.push(`Extension: ${this.extensionId}`);
    }
    if (this.packId) {
      parts.push(`Pack: ${this.packId}`);
    }
    
    return parts.join(' | ');
  }

  /**
   * Serializes for logging/reporting.
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      extensionId: this.extensionId,
      packId: this.packId,
      metadata: this.metadata,
      stack: this.stack,
    };
  }
}

// ============================================================================
// SPECIFIC ERROR TYPES
// ============================================================================

/**
 * Error for invalid extension IDs.
 */
export class InvalidIdError extends ExtensionError {
  constructor(id: string, reason: string) {
    super({
      code: ExtensionErrorCode.INVALID_ID,
      message: `Invalid extension ID "${id}": ${reason}`,
      extensionId: id,
    });
    this.name = 'InvalidIdError';
  }
}

/**
 * Error for duplicate registrations.
 */
export class DuplicateIdError extends ExtensionError {
  constructor(id: string, type: 'extension' | 'card' | 'deck' | 'port') {
    super({
      code: ExtensionErrorCode.DUPLICATE_ID,
      message: `${type} with ID "${id}" is already registered`,
      extensionId: id,
      metadata: { type },
    });
    this.name = 'DuplicateIdError';
  }
}

/**
 * Error for missing pack.
 */
export class PackNotFoundError extends ExtensionError {
  constructor(packId: string) {
    super({
      code: ExtensionErrorCode.PACK_NOT_FOUND,
      message: `Pack "${packId}" not found`,
      packId,
    });
    this.name = 'PackNotFoundError';
  }
}

/**
 * Error for manifest issues.
 */
export class ManifestError extends ExtensionError {
  constructor(packId: string, issue: string) {
    super({
      code: ExtensionErrorCode.MANIFEST_INVALID,
      message: `Invalid manifest for pack "${packId}": ${issue}`,
      packId,
    });
    this.name = 'ManifestError';
  }
}

/**
 * Error for missing capabilities.
 */
export class CapabilityError extends ExtensionError {
  constructor(extensionId: string, capability: string) {
    super({
      code: ExtensionErrorCode.CAPABILITY_MISSING,
      message: `Extension "${extensionId}" requires capability "${capability}" which is not available`,
      extensionId,
      metadata: { capability },
    });
    this.name = 'CapabilityError';
  }
}

// ============================================================================
// ERROR HELPERS
// ============================================================================

/**
 * Checks if an error is an ExtensionError.
 */
export function isExtensionError(error: unknown): error is ExtensionError {
  return error instanceof ExtensionError;
}

/**
 * Wraps an unknown error in an ExtensionError.
 */
export function wrapError(
  error: unknown,
  code: ExtensionErrorCode,
  context?: { extensionId?: string; packId?: string }
): ExtensionError {
  if (isExtensionError(error)) {
    return error;
  }
  
  const message = error instanceof Error ? error.message : String(error);
  
  const errorOptions: {
    code: ExtensionErrorCode;
    message: string;
    extensionId?: string;
    packId?: string;
    cause?: Error;
    metadata?: Record<string, unknown>;
  } = {
    code,
    message,
    ...context,
  };
  
  if (error instanceof Error) {
    errorOptions.cause = error;
  }
  
  return new ExtensionError(errorOptions);
}
