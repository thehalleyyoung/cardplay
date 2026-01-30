/**
 * @fileoverview Extension Logging
 * 
 * Change 443: Logging registry actions with provenance.
 * 
 * @module @cardplay/extensions/logging
 */

// ============================================================================
// LOG LEVELS
// ============================================================================

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// ============================================================================
// LOG ENTRY TYPES
// ============================================================================

/**
 * Registry action types for logging.
 */
export type RegistryAction =
  | 'register'
  | 'unregister'
  | 'update'
  | 'load'
  | 'unload'
  | 'validate'
  | 'resolve'
  | 'conflict';

/**
 * Entity types in the registry.
 */
export type EntityType =
  | 'extension'
  | 'pack'
  | 'card'
  | 'deck'
  | 'deck-template'
  | 'port-type'
  | 'event-kind'
  | 'host-action'
  | 'ontology';

/**
 * Provenance information for logged actions.
 */
export interface Provenance {
  /** Source of the action (builtin, user, pack) */
  readonly source: 'builtin' | 'user' | 'pack';
  /** Pack ID if from a pack */
  readonly packId?: string;
  /** Extension ID */
  readonly extensionId?: string;
  /** Timestamp */
  readonly timestamp: number;
  /** User/session ID if available */
  readonly userId?: string;
}

/**
 * Log entry for registry actions.
 */
export interface RegistryLogEntry {
  /** Log level */
  readonly level: LogLevel;
  /** Action performed */
  readonly action: RegistryAction;
  /** Entity type affected */
  readonly entityType: EntityType;
  /** Entity ID */
  readonly entityId: string;
  /** Provenance */
  readonly provenance: Provenance;
  /** Human-readable message */
  readonly message: string;
  /** Additional metadata */
  readonly metadata?: Record<string, unknown>;
  /** Error if action failed */
  readonly error?: {
    code: string;
    message: string;
    stack?: string;
  };
}

// ============================================================================
// LOGGER
// ============================================================================

/**
 * Registry logger interface.
 */
export interface RegistryLogger {
  /**
   * Logs a registry action.
   */
  log(entry: RegistryLogEntry): void;

  /**
   * Gets recent log entries.
   */
  getEntries(options?: {
    limit?: number;
    level?: LogLevel;
    action?: RegistryAction;
    entityType?: EntityType;
  }): readonly RegistryLogEntry[];

  /**
   * Clears log entries.
   */
  clear(): void;
}

// ============================================================================
// DEFAULT LOGGER IMPLEMENTATION
// ============================================================================

/**
 * Default in-memory registry logger.
 */
class DefaultRegistryLogger implements RegistryLogger {
  private entries: RegistryLogEntry[] = [];
  private maxEntries = 1000;
  private minLevel: LogLevel = LogLevel.INFO;

  log(entry: RegistryLogEntry): void {
    if (entry.level < this.minLevel) {
      return;
    }

    this.entries.push(entry);

    // Trim old entries
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }

    // Also log to console
    this.logToConsole(entry);
  }

  getEntries(options?: {
    limit?: number;
    level?: LogLevel;
    action?: RegistryAction;
    entityType?: EntityType;
  }): readonly RegistryLogEntry[] {
    let result = [...this.entries];

    if (options?.level !== undefined) {
      result = result.filter(e => e.level >= options.level!);
    }
    if (options?.action) {
      result = result.filter(e => e.action === options.action);
    }
    if (options?.entityType) {
      result = result.filter(e => e.entityType === options.entityType);
    }
    if (options?.limit) {
      result = result.slice(-options.limit);
    }

    return result;
  }

  clear(): void {
    this.entries = [];
  }

  private logToConsole(entry: RegistryLogEntry): void {
    const prefix = `[Registry] [${entry.action}] ${entry.entityType}:${entry.entityId}`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.metadata);
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message);
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.metadata);
        break;
      case LogLevel.ERROR:
        console.error(prefix, entry.message, entry.error);
        break;
    }
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let loggerInstance: RegistryLogger | null = null;

/**
 * Gets the registry logger instance.
 */
export function getRegistryLogger(): RegistryLogger {
  if (!loggerInstance) {
    loggerInstance = new DefaultRegistryLogger();
  }
  return loggerInstance;
}

/**
 * Sets a custom registry logger.
 */
export function setRegistryLogger(logger: RegistryLogger): void {
  loggerInstance = logger;
}

/**
 * Resets to the default logger.
 */
export function resetRegistryLogger(): void {
  loggerInstance = null;
}

// ============================================================================
// LOGGING HELPERS
// ============================================================================

/**
 * Creates a provenance object for builtin registrations.
 */
export function builtinProvenance(): Provenance {
  return {
    source: 'builtin',
    timestamp: Date.now(),
  };
}

/**
 * Creates a provenance object for pack registrations.
 */
export function packProvenance(packId: string, extensionId?: string): Provenance {
  const prov: Provenance = {
    source: 'pack',
    packId,
    timestamp: Date.now(),
  };
  if (extensionId) {
    return { ...prov, extensionId };
  }
  return prov;
}

/**
 * Creates a provenance object for user registrations.
 */
export function userProvenance(userId?: string): Provenance {
  const prov: Provenance = {
    source: 'user',
    timestamp: Date.now(),
  };
  if (userId) {
    return { ...prov, userId };
  }
  return prov;
}

/**
 * Logs a successful registration.
 */
export function logRegistration(
  entityType: EntityType,
  entityId: string,
  provenance: Provenance,
  metadata?: Record<string, unknown>
): void {
  const entry: RegistryLogEntry = {
    level: LogLevel.INFO,
    action: 'register',
    entityType,
    entityId,
    provenance,
    message: `Registered ${entityType} "${entityId}"`,
  };
  if (metadata) {
    getRegistryLogger().log({ ...entry, metadata });
  } else {
    getRegistryLogger().log(entry);
  }
}

/**
 * Logs a registration error.
 */
export function logRegistrationError(
  entityType: EntityType,
  entityId: string,
  provenance: Provenance,
  error: Error
): void {
  getRegistryLogger().log({
    level: LogLevel.ERROR,
    action: 'register',
    entityType,
    entityId,
    provenance,
    message: `Failed to register ${entityType} "${entityId}": ${error.message}`,
    error: error.stack ? {
      code: (error as any).code ?? 'UNKNOWN',
      message: error.message,
      stack: error.stack,
    } : {
      code: (error as any).code ?? 'UNKNOWN',
      message: error.message,
    },
  });
}

/**
 * Logs a conflict detection.
 */
export function logConflict(
  entityType: EntityType,
  entityId: string,
  provenance: Provenance,
  conflictWith: string
): void {
  getRegistryLogger().log({
    level: LogLevel.WARN,
    action: 'conflict',
    entityType,
    entityId,
    provenance,
    message: `${entityType} "${entityId}" conflicts with "${conflictWith}"`,
    metadata: { conflictWith },
  });
}
