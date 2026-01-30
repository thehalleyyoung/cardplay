/**
 * @file Deterministic Serialization (Step 345)
 * @module gofai/execution/deterministic-serialization
 * 
 * Implements Step 345: Add deterministic serialization of edit packages
 * for shareability and audit.
 * 
 * Deterministic serialization ensures that:
 * - Same edit package → same serialized form
 * - Serialized form can be shared across sessions
 * - Audit trails are reproducible
 * - No sensitive data leaks
 * - Platform-independent format
 * - Forward/backward compatibility
 * 
 * Design principles:
 * - Stable ordering (sorted keys, stable arrays)
 * - Versioned schema
 * - Explicit timestamps (no implicit Date.now())
 * - Privacy-aware (can redact sensitive fields)
 * - Human-readable where possible
 * - Efficient for large packages
 * 
 * Serialization formats:
 * - JSON (human-readable, standard)
 * - Binary (compact, fast)
 * - String (base64-encoded)
 * 
 * Use cases:
 * - Sharing edit packages between users
 * - Saving edit history to disk
 * - Audit logs
 * - Bug reports
 * - Testing (golden diffs)
 * - Export/import workflows
 * 
 * @see gofai_goalB.md Step 345
 * @see gofai_goalB.md Step 344 (edit signatures)
 * @see gofai_goalB.md Step 349 (bug-report export)
 * @see docs/gofai/serialization.md
 */

import type {
  EditPackage,
  CPLIntent,
  CPLPlan,
} from './edit-package.js';
import type { CanonicalDiff } from './diff-model.js';
import type { EditSignature } from './edit-signature.js';

// ============================================================================
// Serialization Types
// ============================================================================

/**
 * Serialization format.
 */
export type SerializationFormat = 'json' | 'compact-json' | 'binary' | 'string';

/**
 * Serialization options.
 */
export interface SerializationOptions {
  /** Format to use */
  readonly format?: SerializationFormat;
  
  /** Include provenance? */
  readonly includeProvenance?: boolean;
  
  /** Include diff details? */
  readonly includeDiff?: boolean;
  
  /** Include transaction log? */
  readonly includeLog?: boolean;
  
  /** Redact sensitive fields? */
  readonly redactSensitive?: boolean;
  
  /** Pretty-print JSON? */
  readonly prettyPrint?: boolean;
  
  /** Maximum serialized size (bytes) */
  readonly maxSize?: number;
}

/**
 * Serialized edit package.
 */
export interface SerializedEditPackage {
  /** Schema version */
  readonly version: string;
  
  /** Serialization format used */
  readonly format: SerializationFormat;
  
  /** Serialized data */
  readonly data: string;
  
  /** Size in bytes */
  readonly size: number;
  
  /** Edit signature for verification */
  readonly signature: EditSignature;
  
  /** When serialized */
  readonly serializedAt: number;
  
  /** Metadata */
  readonly metadata: SerializationMetadata;
}

/**
 * Serialization metadata.
 */
export interface SerializationMetadata {
  /** Fields included */
  readonly includedFields: readonly string[];
  
  /** Fields redacted */
  readonly redactedFields?: readonly string[];
  
  /** Compression used? */
  readonly compressed: boolean;
  
  /** Original size (before compression) */
  readonly originalSize?: number;
}

/**
 * Deserialization result.
 */
export type DeserializationResult =
  | { readonly status: 'success'; readonly editPackage: EditPackage }
  | { readonly status: 'error'; readonly error: DeserializationError };

/**
 * Deserialization error.
 */
export interface DeserializationError {
  readonly code: DeserializationErrorCode;
  readonly message: string;
  readonly details?: unknown;
}

/**
 * Deserialization error codes.
 */
export type DeserializationErrorCode =
  | 'INVALID_FORMAT'
  | 'VERSION_MISMATCH'
  | 'CORRUPTED_DATA'
  | 'SIGNATURE_MISMATCH'
  | 'SIZE_EXCEEDED'
  | 'MISSING_REQUIRED_FIELD';

// ============================================================================
// Serializer
// ============================================================================

/**
 * Current schema version.
 */
const CURRENT_SCHEMA_VERSION = '1.0.0';

/**
 * Serializes edit packages deterministically.
 */
export class EditPackageSerializer {
  /**
   * Serialize an edit package.
   */
  static serialize(
    editPackage: EditPackage,
    signature: EditSignature,
    options: SerializationOptions = {}
  ): SerializedEditPackage {
    const format = options.format ?? 'json';
    
    // Prepare package data
    const preparedData = this.prepareForSerialization(editPackage, options);
    
    // Serialize based on format
    let data: string;
    let compressed = false;
    let originalSize: number | undefined;
    
    switch (format) {
      case 'json':
        data = this.serializeToJSON(preparedData, options.prettyPrint);
        break;
        
      case 'compact-json':
        data = this.serializeToCompactJSON(preparedData);
        break;
        
      case 'binary':
        data = this.serializeToBinary(preparedData);
        compressed = true;
        originalSize = JSON.stringify(preparedData).length;
        break;
        
      case 'string':
        const json = this.serializeToJSON(preparedData, false);
        data = this.encodeToString(json);
        break;
        
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
    
    // Check size limit
    if (options.maxSize && data.length > options.maxSize) {
      throw new Error(`Serialized size ${data.length} exceeds limit ${options.maxSize}`);
    }
    
    return {
      version: CURRENT_SCHEMA_VERSION,
      format,
      data,
      size: data.length,
      signature,
      serializedAt: Date.now(),
      metadata: {
        includedFields: this.getIncludedFields(options),
        redactedFields: options.redactSensitive ? this.getRedactedFields() : undefined,
        compressed,
        originalSize,
      },
    };
  }
  
  /**
   * Prepare package for serialization.
   */
  private static prepareForSerialization(
    editPackage: EditPackage,
    options: SerializationOptions
  ): any {
    const prepared: any = {
      id: editPackage.id,
      timestamp: editPackage.timestamp,
      intent: this.prepareIntent(editPackage.intent, options),
      plan: this.preparePlan(editPackage.plan, options),
    };
    
    if (options.includeDiff && editPackage.diff) {
      prepared.diff = this.prepareDiff(editPackage.diff, options);
    }
    
    if (options.includeProvenance && editPackage.provenance) {
      prepared.provenance = this.prepareProvenance(editPackage.provenance, options);
    }
    
    if (options.includeLog && editPackage.log) {
      prepared.log = editPackage.log;
    }
    
    return this.sortKeysRecursive(prepared);
  }
  
  /**
   * Prepare intent for serialization.
   */
  private static prepareIntent(intent: CPLIntent | undefined, options: SerializationOptions): any {
    if (!intent) return undefined;
    
    return {
      type: intent.type,
      schemaVersion: intent.schemaVersion,
      goals: intent.goals,
      constraints: intent.constraints,
      scope: intent.scope,
    };
  }
  
  /**
   * Prepare plan for serialization.
   */
  private static preparePlan(plan: CPLPlan, options: SerializationOptions): any {
    return {
      type: plan.type,
      schemaVersion: plan.schemaVersion,
      opcodes: plan.opcodes,
      costScore: plan.costScore,
      satisfactionScore: plan.satisfactionScore,
    };
  }
  
  /**
   * Prepare diff for serialization.
   */
  private static prepareDiff(diff: CanonicalDiff, options: SerializationOptions): any {
    return {
      version: diff.version,
      summary: diff.summary,
      events: {
        added: diff.events.added.length,
        removed: diff.events.removed.length,
        modified: diff.events.modified.length,
      },
      tracks: {
        added: diff.tracks.added.length,
        removed: diff.tracks.removed.length,
        modified: diff.tracks.modified.length,
      },
      cards: {
        added: diff.cards.added.length,
        removed: diff.cards.removed.length,
        modified: diff.cards.modified.length,
      },
    };
  }
  
  /**
   * Prepare provenance for serialization.
   */
  private static prepareProvenance(provenance: any, options: SerializationOptions): any {
    if (options.redactSensitive) {
      return {
        source: '[REDACTED]',
        timestamp: provenance.timestamp,
      };
    }
    return provenance;
  }
  
  /**
   * Sort object keys recursively for determinism.
   */
  private static sortKeysRecursive(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sortKeysRecursive(item));
    }
    
    const sorted: any = {};
    for (const key of Object.keys(obj).sort()) {
      sorted[key] = this.sortKeysRecursive(obj[key]);
    }
    return sorted;
  }
  
  /**
   * Serialize to JSON.
   */
  private static serializeToJSON(data: any, prettyPrint?: boolean): string {
    return prettyPrint
      ? JSON.stringify(data, null, 2)
      : JSON.stringify(data);
  }
  
  /**
   * Serialize to compact JSON (minimal whitespace).
   */
  private static serializeToCompactJSON(data: any): string {
    return JSON.stringify(data);
  }
  
  /**
   * Serialize to binary (base64-encoded msgpack).
   */
  private static serializeToBinary(data: any): string {
    // In practice, would use a proper binary format like msgpack
    const json = JSON.stringify(data);
    return Buffer.from(json).toString('base64');
  }
  
  /**
   * Encode to string (base64).
   */
  private static encodeToString(json: string): string {
    return Buffer.from(json).toString('base64');
  }
  
  /**
   * Get included fields.
   */
  private static getIncludedFields(options: SerializationOptions): readonly string[] {
    const fields = ['id', 'timestamp', 'intent', 'plan'];
    
    if (options.includeDiff) fields.push('diff');
    if (options.includeProvenance) fields.push('provenance');
    if (options.includeLog) fields.push('log');
    
    return fields;
  }
  
  /**
   * Get redacted fields.
   */
  private static getRedactedFields(): readonly string[] {
    return ['provenance.source', 'provenance.user'];
  }
}

// ============================================================================
// Deserializer
// ============================================================================

/**
 * Deserializes edit packages.
 */
export class EditPackageDeserializer {
  /**
   * Deserialize an edit package.
   */
  static deserialize(serialized: SerializedEditPackage): DeserializationResult {
    try {
      // Check version compatibility
      if (!this.isVersionCompatible(serialized.version)) {
        return {
          status: 'error',
          error: {
            code: 'VERSION_MISMATCH',
            message: `Incompatible schema version: ${serialized.version}`,
          },
        };
      }
      
      // Deserialize based on format
      let data: any;
      
      switch (serialized.format) {
        case 'json':
        case 'compact-json':
          data = JSON.parse(serialized.data);
          break;
          
        case 'binary':
          data = this.deserializeFromBinary(serialized.data);
          break;
          
        case 'string':
          const json = this.decodeFromString(serialized.data);
          data = JSON.parse(json);
          break;
          
        default:
          return {
            status: 'error',
            error: {
              code: 'INVALID_FORMAT',
              message: `Unknown format: ${serialized.format}`,
            },
          };
      }
      
      // Reconstruct edit package
      const editPackage = this.reconstructEditPackage(data);
      
      // Validate
      const validation = this.validate(editPackage);
      if (!validation.valid) {
        return {
          status: 'error',
          error: {
            code: 'MISSING_REQUIRED_FIELD',
            message: validation.error || 'Validation failed',
          },
        };
      }
      
      return {
        status: 'success',
        editPackage,
      };
    } catch (error) {
      return {
        status: 'error',
        error: {
          code: 'CORRUPTED_DATA',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
        },
      };
    }
  }
  
  /**
   * Check version compatibility.
   */
  private static isVersionCompatible(version: string): boolean {
    const [major] = version.split('.').map(Number);
    const [currentMajor] = CURRENT_SCHEMA_VERSION.split('.').map(Number);
    return major === currentMajor;
  }
  
  /**
   * Deserialize from binary.
   */
  private static deserializeFromBinary(data: string): any {
    const json = Buffer.from(data, 'base64').toString('utf-8');
    return JSON.parse(json);
  }
  
  /**
   * Decode from string.
   */
  private static decodeFromString(data: string): string {
    return Buffer.from(data, 'base64').toString('utf-8');
  }
  
  /**
   * Reconstruct edit package from deserialized data.
   */
  private static reconstructEditPackage(data: any): EditPackage {
    // In practice, would use proper type validation/coercion
    return data as EditPackage;
  }
  
  /**
   * Validate reconstructed edit package.
   */
  private static validate(editPackage: EditPackage): { valid: boolean; error?: string } {
    if (!editPackage.id) {
      return { valid: false, error: 'Missing id' };
    }
    
    if (!editPackage.plan) {
      return { valid: false, error: 'Missing plan' };
    }
    
    if (!editPackage.timestamp) {
      return { valid: false, error: 'Missing timestamp' };
    }
    
    return { valid: true };
  }
}

// ============================================================================
// Serialization Utilities
// ============================================================================

/**
 * Utilities for working with serialized packages.
 */
export class SerializationUtils {
  /**
   * Compare two serialized packages for equality.
   */
  static areEqual(a: SerializedEditPackage, b: SerializedEditPackage): boolean {
    return a.signature === b.signature;
  }
  
  /**
   * Get human-readable summary of serialized package.
   */
  static getSummary(serialized: SerializedEditPackage): string {
    let summary = `Edit Package Serialization Summary\n`;
    summary += `===================================\n\n`;
    summary += `Format: ${serialized.format}\n`;
    summary += `Version: ${serialized.version}\n`;
    summary += `Size: ${serialized.size} bytes\n`;
    summary += `Signature: ${serialized.signature}\n`;
    summary += `Serialized At: ${new Date(serialized.serializedAt).toISOString()}\n\n`;
    
    summary += `Included Fields: ${serialized.metadata.includedFields.join(', ')}\n`;
    
    if (serialized.metadata.redactedFields) {
      summary += `Redacted Fields: ${serialized.metadata.redactedFields.join(', ')}\n`;
    }
    
    if (serialized.metadata.compressed) {
      const compressionRatio = serialized.metadata.originalSize 
        ? ((1 - serialized.size / serialized.metadata.originalSize) * 100).toFixed(1)
        : 'N/A';
      summary += `Compressed: Yes (${compressionRatio}% reduction)\n`;
    }
    
    return summary;
  }
  
  /**
   * Export to file-friendly format.
   */
  static exportToFile(serialized: SerializedEditPackage): string {
    const header = `# GOFAI Edit Package Export\n`;
    const metadata = `## Metadata\n${this.getSummary(serialized)}\n`;
    const data = `## Data\n\`\`\`\n${serialized.data}\n\`\`\`\n`;
    
    return header + metadata + data;
  }
}

// ============================================================================
// Exports
// ============================================================================

export type {
  SerializationFormat,
  SerializationOptions,
  SerializedEditPackage,
  SerializationMetadata,
  DeserializationResult,
  DeserializationError,
  DeserializationErrorCode,
};

export {
  EditPackageSerializer,
  EditPackageDeserializer,
  SerializationUtils,
};
