/**
 * @fileoverview Registry V2 Validation
 * 
 * Validation rules for registry entries and snapshots.
 * 
 * References:
 * - docs/validator-rules.md
 * - docs/registry-api.md
 * 
 * @module registry/v2/validate
 */

import type { RegistryEntry, RegistryEntryType, TypedRegistryEntry } from './types';
import { evaluateEntryPolicy } from './policy';

/**
 * Validation error severity.
 */
export enum ValidationSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

/**
 * Validation message.
 */
export interface ValidationMessage {
  severity: ValidationSeverity;
  code: string;
  message: string;
  field?: string;
}

/**
 * Validation result.
 */
export interface ValidationResult {
  valid: boolean;
  messages: ValidationMessage[];
}

/**
 * Validator function signature.
 */
export type ValidatorFunction<T = unknown> = (entry: RegistryEntry<T>) => ValidationMessage[];

/**
 * Registry of validators by entry type.
 */
const validators = new Map<RegistryEntryType, ValidatorFunction[]>();

/**
 * Registers a validator for an entry type.
 */
export function registerValidator(entryType: RegistryEntryType, validator: ValidatorFunction): void {
  if (!validators.has(entryType)) {
    validators.set(entryType, []);
  }
  validators.get(entryType)!.push(validator);
}

/**
 * Validates a registry entry.
 */
export function validateEntry(entry: TypedRegistryEntry): ValidationResult {
  const messages: ValidationMessage[] = [];
  
  // Basic provenance validation
  messages.push(...validateProvenance(entry));
  
  // Policy validation
  const policy = evaluateEntryPolicy(entry);
  if (!policy.allowed) {
    messages.push({
      severity: ValidationSeverity.ERROR,
      code: 'POLICY_VIOLATION',
      message: policy.errors.join('; '),
    });
  }
  for (const warning of policy.warnings) {
    messages.push({
      severity: ValidationSeverity.WARNING,
      code: 'POLICY_WARNING',
      message: warning,
    });
  }
  
  // Type-specific validation
  const typeValidators = validators.get(entry.type) ?? [];
  for (const validator of typeValidators) {
    messages.push(...validator(entry));
  }
  
  return {
    valid: !messages.some(m => m.severity === ValidationSeverity.ERROR),
    messages,
  };
}

/**
 * Validates provenance metadata.
 */
function validateProvenance(entry: RegistryEntry): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  const prov = entry.provenance;
  
  // ID validation
  if (!prov.id || typeof prov.id !== 'string') {
    messages.push({
      severity: ValidationSeverity.ERROR,
      code: 'INVALID_ID',
      message: 'Entry ID must be a non-empty string',
      field: 'id',
    });
  }
  
  // Source validation
  if (!prov.source?.packId) {
    messages.push({
      severity: ValidationSeverity.ERROR,
      code: 'MISSING_PACK_ID',
      message: 'Entry source must include packId',
      field: 'source.packId',
    });
  }
  
  if (!prov.source?.version) {
    messages.push({
      severity: ValidationSeverity.WARNING,
      code: 'MISSING_VERSION',
      message: 'Entry source should include version',
      field: 'source.version',
    });
  }
  
  // Namespacing validation for non-builtin entries
  if (!prov.builtin) {
    const hasNamespace = prov.id.includes(':');
    if (!hasNamespace) {
      messages.push({
        severity: ValidationSeverity.WARNING,
        code: 'MISSING_NAMESPACE',
        message: `Non-builtin entry ID should be namespaced: ${prov.id}`,
        field: 'id',
      });
    }
  }
  
  // Trust validation for high-risk entries
  if (prov.requiredCapabilities && prov.requiredCapabilities.length > 0) {
    if (!prov.builtin && !prov.trust) {
      messages.push({
        severity: ValidationSeverity.INFO,
        code: 'NO_TRUST_INFO',
        message: 'Entry requires capabilities but has no trust information',
        field: 'trust',
      });
    }
  }
  
  return messages;
}

// ============================================================================
// BUILTIN VALIDATORS
// ============================================================================

/**
 * Validator for card entries.
 */
function validateCardEntry(entry: RegistryEntry): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  const card = entry.entity as any;
  
  if (!card?.id) {
    messages.push({
      severity: ValidationSeverity.ERROR,
      code: 'MISSING_CARD_ID',
      message: 'Card must have an id',
      field: 'entity.id',
    });
  }
  
  if (!card?.name) {
    messages.push({
      severity: ValidationSeverity.WARNING,
      code: 'MISSING_CARD_NAME',
      message: 'Card should have a name',
      field: 'entity.name',
    });
  }
  
  return messages;
}

/**
 * Validator for port type entries.
 */
function validatePortTypeEntry(entry: RegistryEntry): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  const portType = entry.entity as any;
  
  if (!portType?.id) {
    messages.push({
      severity: ValidationSeverity.ERROR,
      code: 'MISSING_PORT_TYPE_ID',
      message: 'Port type must have an id',
      field: 'entity.id',
    });
  }
  
  if (!portType?.name) {
    messages.push({
      severity: ValidationSeverity.WARNING,
      code: 'MISSING_PORT_TYPE_NAME',
      message: 'Port type should have a name',
      field: 'entity.name',
    });
  }
  
  // Check for directional suffix (legacy pattern)
  if (portType?.id?.match(/_(in|out)$/)) {
    messages.push({
      severity: ValidationSeverity.WARNING,
      code: 'LEGACY_PORT_TYPE_ID',
      message: 'Port type ID should not include direction suffix (_in/_out)',
      field: 'entity.id',
    });
  }
  
  return messages;
}

/**
 * Validator for event kind entries.
 */
function validateEventKindEntry(entry: RegistryEntry): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  const eventKind = entry.entity as any;
  
  if (!eventKind?.id) {
    messages.push({
      severity: ValidationSeverity.ERROR,
      code: 'MISSING_EVENT_KIND_ID',
      message: 'Event kind must have an id',
      field: 'entity.id',
    });
  }
  
  if (!eventKind?.schema) {
    messages.push({
      severity: ValidationSeverity.WARNING,
      code: 'MISSING_EVENT_SCHEMA',
      message: 'Event kind should define a payload schema',
      field: 'entity.schema',
    });
  }
  
  return messages;
}

// Register builtin validators
registerValidator('card', validateCardEntry);
registerValidator('port-type', validatePortTypeEntry);
registerValidator('event-kind', validateEventKindEntry);

/**
 * Validates all entries in a registry snapshot.
 */
export function validateSnapshot(snapshot: { entries: Record<string, TypedRegistryEntry[]> }): ValidationResult {
  const messages: ValidationMessage[] = [];
  
  for (const [entryType, entries] of Object.entries(snapshot.entries)) {
    for (const entry of entries) {
      const result = validateEntry(entry);
      messages.push(...result.messages);
    }
  }
  
  return {
    valid: !messages.some(m => m.severity === ValidationSeverity.ERROR),
    messages,
  };
}
