/**
 * Card ID Rules and Validation
 * 
 * This module defines the canonical rules for card IDs in the cardplay system.
 * 
 * ## ID Namespacing Rules
 * 
 * Card IDs follow a tiered namespacing scheme:
 * 
 * 1. **Builtin cards** - Core cards shipped with cardplay use short, stable IDs:
 *    - `gain`, `filter`, `delay`, `reverb`, etc.
 *    - These are reserved and cannot be used by extensions
 * 
 * 2. **Namespaced cards** - Extension/user cards MUST use namespaced IDs:
 *    - Format: `<namespace>:<card-name>`
 *    - Example: `my-pack:super-filter`, `theory:chord-builder`
 * 
 * 3. **Legacy cards** - Cards from before namespacing may use bare IDs
 *    but emit deprecation warnings
 * 
 * @module canon/card-id
 */

/**
 * Branded type for card identifiers.
 */
export type CardId = string & { readonly __brand: 'CardId' };

/**
 * List of reserved builtin card IDs.
 * Extensions cannot use these IDs.
 */
export const BUILTIN_CARD_IDS = [
  // Audio processing
  'gain',
  'filter',
  'eq',
  'compressor',
  'limiter',
  'delay',
  'reverb',
  'chorus',
  'flanger',
  'phaser',
  'distortion',
  'saturation',
  'bitcrusher',
  
  // MIDI/Note processing
  'midi-filter',
  'note-filter',
  'transpose',
  'velocity',
  'arpeggiator',
  'chord',
  'scale',
  
  // Generators
  'oscillator',
  'noise',
  'sampler',
  'wavetable',
  
  // Utilities
  'split',
  'merge',
  'mix',
  'mute',
  'bypass',
  'meter',
  'analyzer',
  
  // Control
  'lfo',
  'envelope',
  'adsr',
  'sequencer',
  'trigger',
] as const;

export type BuiltinCardId = typeof BUILTIN_CARD_IDS[number];

/**
 * Checks if a card ID is a reserved builtin.
 */
export function isBuiltinCardId(id: string): id is BuiltinCardId {
  return BUILTIN_CARD_IDS.includes(id as BuiltinCardId);
}

/**
 * Checks if a card ID is properly namespaced.
 * Namespaced IDs must contain a colon separating namespace from name.
 */
export function isNamespacedCardId(id: string): boolean {
  return id.includes(':') && !id.startsWith(':') && !id.endsWith(':');
}

/**
 * Extracts the namespace from a namespaced card ID.
 * Returns undefined for non-namespaced IDs.
 */
export function getCardIdNamespace(id: string): string | undefined {
  if (!isNamespacedCardId(id)) return undefined;
  return id.split(':')[0];
}

/**
 * Extracts the local name from a namespaced card ID.
 * For non-namespaced IDs, returns the full ID.
 */
export function getCardIdLocalName(id: string): string {
  if (!isNamespacedCardId(id)) return id;
  return id.split(':').slice(1).join(':');
}

/**
 * Creates a properly namespaced card ID.
 */
export function createNamespacedCardId(namespace: string, name: string): CardId {
  if (!namespace || namespace.includes(':')) {
    throw new Error(`Invalid namespace: ${namespace}`);
  }
  if (!name || name.includes(':')) {
    throw new Error(`Invalid card name: ${name}`);
  }
  return `${namespace}:${name}` as CardId;
}

/**
 * Validates a card ID.
 * Returns validation result with any issues found.
 */
export interface CardIdValidationResult {
  valid: boolean;
  isBuiltin: boolean;
  isNamespaced: boolean;
  namespace?: string;
  localName: string;
  warnings: string[];
  errors: string[];
}

export function validateCardId(id: string): CardIdValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  if (!id || typeof id !== 'string') {
    return {
      valid: false,
      isBuiltin: false,
      isNamespaced: false,
      localName: '',
      warnings,
      errors: ['Card ID must be a non-empty string'],
    };
  }
  
  const isBuiltin = isBuiltinCardId(id);
  const isNamespaced = isNamespacedCardId(id);
  
  // Non-builtin, non-namespaced IDs are deprecated
  if (!isBuiltin && !isNamespaced) {
    warnings.push(
      `Card ID "${id}" is not namespaced. Use format "namespace:${id}" for extension cards.`
    );
  }
  
  // Check for reserved namespace collision
  if (isNamespaced) {
    const namespace = getCardIdNamespace(id);
    if (namespace === 'core' || namespace === 'cardplay') {
      errors.push(`Namespace "${namespace}" is reserved for core cards.`);
    }
  }
  
  const namespace = getCardIdNamespace(id);
  const result: CardIdValidationResult = {
    valid: errors.length === 0,
    isBuiltin,
    isNamespaced,
    localName: getCardIdLocalName(id),
    warnings,
    errors,
  };
  
  if (namespace) {
    return { ...result, namespace };
  }
  
  return result;
}

/**
 * Creates a branded CardId from a string, with validation.
 * Throws if the ID is invalid.
 */
export function createCardId(id: string): CardId {
  const result = validateCardId(id);
  if (!result.valid) {
    throw new Error(`Invalid card ID "${id}": ${result.errors.join(', ')}`);
  }
  return id as CardId;
}
