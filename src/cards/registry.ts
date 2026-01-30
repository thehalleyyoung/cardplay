/**
 * @fileoverview Card Registry & Discovery Implementation.
 * 
 * Provides a global registry for cards with search, categorization,
 * and lifecycle management.
 * 
 * @module @cardplay/core/cards/registry
 */

import type {
  Card,
  CardCategory,
  CardMeta,
  CardSignature,
  Port,
  PortType,
} from './card';
import { PortTypes } from './card';
import { validateId, isBuiltinId } from '../canon/id-validation';

// ============================================================================
// VERSION HANDLING
// ============================================================================

/**
 * Semantic version representation.
 */
export interface CardVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly prerelease?: string;
}

/**
 * Parses a semver string into CardVersion.
 */
export function parseVersion(version: string): CardVersion {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
  if (!match) {
    throw new Error(`Invalid version string: ${version}`);
  }
  
  const result: CardVersion = {
    major: parseInt(match[1]!, 10),
    minor: parseInt(match[2]!, 10),
    patch: parseInt(match[3]!, 10),
  };
  
  if (match[4]) {
    return { ...result, prerelease: match[4] };
  }
  
  return result;
}

/**
 * Formats a CardVersion to string.
 */
export function formatVersion(version: CardVersion): string {
  const base = `${version.major}.${version.minor}.${version.patch}`;
  return version.prerelease ? `${base}-${version.prerelease}` : base;
}

/**
 * Compares two versions. Returns -1, 0, or 1.
 */
export function compareVersions(a: CardVersion, b: CardVersion): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  if (a.patch !== b.patch) return a.patch - b.patch;
  
  // Prerelease versions have lower precedence
  if (a.prerelease && !b.prerelease) return -1;
  if (!a.prerelease && b.prerelease) return 1;
  if (a.prerelease && b.prerelease) {
    return a.prerelease.localeCompare(b.prerelease);
  }
  
  return 0;
}

/**
 * Checks if version a is compatible with b (same major, >= minor).
 */
export function isVersionCompatible(a: CardVersion, b: CardVersion): boolean {
  return a.major === b.major && (a.minor > b.minor || (a.minor === b.minor && a.patch >= b.patch));
}

// ============================================================================
// CARD REGISTRY ENTRY
// ============================================================================

/**
 * Registry entry with card and additional metadata.
 */
export interface CardRegistryEntry<A = unknown, B = unknown> {
  /** The card instance */
  readonly card: Card<A, B>;
  /** Registration timestamp */
  readonly registeredAt: number;
  /** Usage count */
  usageCount: number;
  /** Last used timestamp */
  lastUsedAt: number;
  /** Whether marked as favorite */
  isFavorite: boolean;
  /** Dependencies on other cards */
  readonly dependencies: readonly string[];
  /** Loaded state */
  loaded: boolean;
}

// ============================================================================
// SEARCH QUERY
// ============================================================================

/**
 * Query for finding cards.
 */
export interface CardQuery {
  /** Search text (name, description, tags) */
  readonly text?: string;
  /** Filter by category */
  readonly category?: CardCategory;
  /** Filter by tags (any match) */
  readonly tags?: readonly string[];
  /** Filter by input port type */
  readonly inputType?: PortType;
  /** Filter by output port type */
  readonly outputType?: PortType;
  /** Only show favorites */
  readonly favoritesOnly?: boolean;
  /** Include deprecated cards */
  readonly includeDeprecated?: boolean;
  /** Maximum results */
  readonly limit?: number;
}

// ============================================================================
// CARD REGISTRY
// ============================================================================

/**
 * Card registry interface.
 */
export interface CardRegistry {
  /** Register a card */
  register<A, B>(card: Card<A, B>, dependencies?: readonly string[]): void;
  
  /** Unregister a card */
  unregister(id: string): boolean;
  
  /** Get a card by ID */
  get<A, B>(id: string): Card<A, B> | undefined;
  
  /** Get entry with metadata */
  getEntry<A, B>(id: string): CardRegistryEntry<A, B> | undefined;
  
  /** Check if card exists */
  has(id: string): boolean;
  
  /** Find cards matching query */
  find(query: CardQuery): readonly CardRegistryEntry[];
  
  /** List cards by category */
  listByCategory(): Map<CardCategory, readonly CardRegistryEntry[]>;
  
  /** Get dependencies for a card */
  getDependencies(id: string): readonly string[];
  
  /** Get all cards that depend on a given card */
  getDependents(id: string): readonly string[];
  
  /** Mark card as used (updates usage tracking) */
  markUsed(id: string): void;
  
  /** Toggle favorite status */
  toggleFavorite(id: string): boolean;
  
  /** Get recently used cards */
  getRecentlyUsed(limit?: number): readonly CardRegistryEntry[];
  
  /** Get favorite cards */
  getFavorites(): readonly CardRegistryEntry[];
  
  /** Clear all cards */
  clear(): void;
  
  /** Get all card IDs */
  getAllIds(): readonly string[];
  
  /** Get card count */
  readonly size: number;
}

// ============================================================================
// SINGLETON REGISTRY IMPLEMENTATION
// ============================================================================

class CardRegistryImpl implements CardRegistry {
  private readonly entries = new Map<string, CardRegistryEntry>();
  private readonly searchIndex = new Map<string, Set<string>>(); // term -> card IDs
  
  get size(): number {
    return this.entries.size;
  }
  
  register<A, B>(card: Card<A, B>, dependencies: readonly string[] = []): void {
    const cardId = card.meta.id;
    
    // Validate card ID format
    const validation = validateId(cardId);
    if (validation.valid === false) {
      throw new Error(`Invalid card ID '${cardId}': ${validation.error}`);
    }
    
    // Warn if custom card doesn't use namespaced ID
    // (builtin cards are allowed to use non-namespaced IDs)
    if (isBuiltinId(cardId) && card.meta.category === 'custom') {
      console.warn(
        `[CardRegistry] Custom card '${cardId}' should use a namespaced ID (e.g., 'my-pack:${cardId}')`
      );
    }
    
    const entry: CardRegistryEntry<A, B> = {
      card,
      registeredAt: Date.now(),
      usageCount: 0,
      lastUsedAt: 0,
      isFavorite: false,
      dependencies,
      loaded: true,
    };
    
    this.entries.set(card.meta.id, entry as CardRegistryEntry);
    this.indexCard(card as unknown as Card<unknown, unknown>);
  }
  
  unregister(id: string): boolean {
    const entry = this.entries.get(id);
    if (!entry) return false;
    
    this.removeFromIndex(entry.card as Card<unknown, unknown>);
    this.entries.delete(id);
    return true;
  }
  
  get<A, B>(id: string): Card<A, B> | undefined {
    const entry = this.entries.get(id);
    return entry?.card as Card<A, B> | undefined;
  }
  
  getEntry<A, B>(id: string): CardRegistryEntry<A, B> | undefined {
    return this.entries.get(id) as CardRegistryEntry<A, B> | undefined;
  }
  
  has(id: string): boolean {
    return this.entries.has(id);
  }
  
  find(query: CardQuery): readonly CardRegistryEntry[] {
    let results: CardRegistryEntry[] = Array.from(this.entries.values());
    
    // Text search
    if (query.text) {
      const terms = this.tokenize(query.text.toLowerCase());
      const matchingIds = new Set<string>();
      
      for (const term of terms) {
        // Prefix search
        for (const [indexTerm, ids] of this.searchIndex) {
          if (indexTerm.startsWith(term)) {
            for (const id of ids) {
              matchingIds.add(id);
            }
          }
        }
      }
      
      results = results.filter(e => matchingIds.has(e.card.meta.id));
    }
    
    // Category filter
    if (query.category) {
      results = results.filter(e => e.card.meta.category === query.category);
    }
    
    // Tags filter
    if (query.tags && query.tags.length > 0) {
      const tagSet = new Set(query.tags);
      results = results.filter(e => 
        e.card.meta.tags?.some(t => tagSet.has(t)) ?? false
      );
    }
    
    // Input type filter
    if (query.inputType) {
      results = results.filter(e =>
        e.card.signature.inputs.some(p => p.type === query.inputType)
      );
    }
    
    // Output type filter
    if (query.outputType) {
      results = results.filter(e =>
        e.card.signature.outputs.some(p => p.type === query.outputType)
      );
    }
    
    // Favorites only
    if (query.favoritesOnly) {
      results = results.filter(e => e.isFavorite);
    }
    
    // Exclude deprecated
    if (!query.includeDeprecated) {
      results = results.filter(e => !e.card.meta.deprecated);
    }
    
    // Sort by relevance (usage count) and recency
    results.sort((a, b) => {
      // Favorites first
      if (a.isFavorite !== b.isFavorite) {
        return a.isFavorite ? -1 : 1;
      }
      // Then by usage
      if (a.usageCount !== b.usageCount) {
        return b.usageCount - a.usageCount;
      }
      // Then by recency
      return b.lastUsedAt - a.lastUsedAt;
    });
    
    // Limit results
    if (query.limit && query.limit > 0) {
      results = results.slice(0, query.limit);
    }
    
    return results;
  }
  
  listByCategory(): Map<CardCategory, readonly CardRegistryEntry[]> {
    const byCategory = new Map<CardCategory, CardRegistryEntry[]>();
    
    for (const entry of this.entries.values()) {
      const category = entry.card.meta.category;
      if (!byCategory.has(category)) {
        byCategory.set(category, []);
      }
      byCategory.get(category)!.push(entry);
    }
    
    return byCategory;
  }
  
  getDependencies(id: string): readonly string[] {
    const entry = this.entries.get(id);
    return entry?.dependencies ?? [];
  }
  
  getDependents(id: string): readonly string[] {
    const dependents: string[] = [];
    for (const [cardId, entry] of this.entries) {
      if (entry.dependencies.includes(id)) {
        dependents.push(cardId);
      }
    }
    return dependents;
  }
  
  markUsed(id: string): void {
    const entry = this.entries.get(id);
    if (entry) {
      entry.usageCount++;
      entry.lastUsedAt = Date.now();
    }
  }
  
  toggleFavorite(id: string): boolean {
    const entry = this.entries.get(id);
    if (entry) {
      entry.isFavorite = !entry.isFavorite;
      return entry.isFavorite;
    }
    return false;
  }
  
  getRecentlyUsed(limit: number = 10): readonly CardRegistryEntry[] {
    return Array.from(this.entries.values())
      .filter(e => e.lastUsedAt > 0)
      .sort((a, b) => b.lastUsedAt - a.lastUsedAt)
      .slice(0, limit);
  }
  
  getFavorites(): readonly CardRegistryEntry[] {
    return Array.from(this.entries.values())
      .filter(e => e.isFavorite)
      .sort((a, b) => a.card.meta.name.localeCompare(b.card.meta.name));
  }
  
  clear(): void {
    this.entries.clear();
    this.searchIndex.clear();
  }
  
  getAllIds(): readonly string[] {
    return Array.from(this.entries.keys());
  }
  
  // ============================================================================
  // INDEXING
  // ============================================================================
  
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/[\s\-_.,;:!?]+/)
      .filter(t => t.length > 1);
  }
  
  private indexCard(card: Card<unknown, unknown>): void {
    const id = card.meta.id;
    const terms = new Set<string>();
    
    // Index name
    for (const term of this.tokenize(card.meta.name)) {
      terms.add(term);
    }
    
    // Index ID
    for (const term of this.tokenize(card.meta.id)) {
      terms.add(term);
    }
    
    // Index description
    if (card.meta.description) {
      for (const term of this.tokenize(card.meta.description)) {
        terms.add(term);
      }
    }
    
    // Index tags
    if (card.meta.tags) {
      for (const tag of card.meta.tags) {
        for (const term of this.tokenize(tag)) {
          terms.add(term);
        }
      }
    }
    
    // Index category
    terms.add(card.meta.category);
    
    // Add to index
    for (const term of terms) {
      if (!this.searchIndex.has(term)) {
        this.searchIndex.set(term, new Set());
      }
      this.searchIndex.get(term)!.add(id);
    }
  }
  
  private removeFromIndex(card: Card<unknown, unknown>): void {
    const id = card.meta.id;
    for (const ids of this.searchIndex.values()) {
      ids.delete(id);
    }
  }
}

// Singleton instance
let registryInstance: CardRegistry | null = null;

/**
 * Gets the global card registry.
 */
export function getCardRegistry(): CardRegistry {
  if (!registryInstance) {
    registryInstance = new CardRegistryImpl();
  }
  return registryInstance;
}

/**
 * Resets the global registry (for testing).
 */
export function resetCardRegistry(): void {
  registryInstance = null;
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Registers a card in the global registry.
 */
export function registerCard<A, B>(
  card: Card<A, B>,
  dependencies?: readonly string[]
): void {
  getCardRegistry().register(card, dependencies);
}

/**
 * Gets a card from the global registry.
 */
export function getCard<A, B>(id: string): Card<A, B> | undefined {
  return getCardRegistry().get<A, B>(id);
}

/**
 * Finds cards matching a query.
 */
export function findCards(query: CardQuery): readonly CardRegistryEntry[] {
  return getCardRegistry().find(query);
}

/**
 * Lists cards by category.
 */
export function listCardsByCategory(): Map<CardCategory, readonly CardRegistryEntry[]> {
  return getCardRegistry().listByCategory();
}

/**
 * Gets dependencies for a card.
 */
export function getCardDependencies(id: string): readonly string[] {
  return getCardRegistry().getDependencies(id);
}

// ============================================================================
// SIGNATURE VALIDATION
// ============================================================================

/**
 * Validation result for card signature.
 */
export interface SignatureValidation {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Validates a card signature.
 */
export function validateCardSignature(signature: CardSignature): SignatureValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for duplicate port names
  const inputNames = new Set<string>();
  for (const port of signature.inputs) {
    if (inputNames.has(port.name)) {
      errors.push(`Duplicate input port name: ${port.name}`);
    }
    inputNames.add(port.name);
  }
  
  const outputNames = new Set<string>();
  for (const port of signature.outputs) {
    if (outputNames.has(port.name)) {
      errors.push(`Duplicate output port name: ${port.name}`);
    }
    outputNames.add(port.name);
  }
  
  // Check for duplicate param names
  const paramNames = new Set<string>();
  for (const param of signature.params) {
    if (paramNames.has(param.name)) {
      errors.push(`Duplicate parameter name: ${param.name}`);
    }
    paramNames.add(param.name);
  }
  
  // Warn if no inputs or outputs
  if (signature.inputs.length === 0) {
    warnings.push('Card has no input ports');
  }
  if (signature.outputs.length === 0) {
    warnings.push('Card has no output ports');
  }
  
  // Validate port types
  const validTypes = new Set([
    PortTypes.AUDIO, PortTypes.MIDI, PortTypes.NOTES, PortTypes.CONTROL,
    PortTypes.TRIGGER, PortTypes.NUMBER, PortTypes.STRING, PortTypes.BOOLEAN,
    PortTypes.ANY, PortTypes.STREAM, PortTypes.CONTAINER, PortTypes.PATTERN,
  ]);
  
  for (const port of [...signature.inputs, ...signature.outputs]) {
    if (!validTypes.has(port.type) && !port.type.startsWith('custom:')) {
      warnings.push(`Unknown port type: ${port.type} on port ${port.name}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// PARAM MIGRATION
// ============================================================================

/**
 * Migrates card params from one version to another.
 */
export function migrateCardParams(
  params: Record<string, unknown>,
  fromVersion: CardVersion,
  toVersion: CardVersion,
  migrations: readonly ParamMigration[]
): Record<string, unknown> {
  let current = { ...params };
  
  // Sort migrations by version
  const sortedMigrations = [...migrations].sort((a, b) =>
    compareVersions(a.version, b.version)
  );
  
  // Apply migrations in order
  for (const migration of sortedMigrations) {
    if (
      compareVersions(migration.version, fromVersion) > 0 &&
      compareVersions(migration.version, toVersion) <= 0
    ) {
      current = migration.migrate(current);
    }
  }
  
  return current;
}

/**
 * Parameter migration definition.
 */
export interface ParamMigration {
  /** Version this migration applies to */
  readonly version: CardVersion;
  /** Migration function */
  readonly migrate: (params: Record<string, unknown>) => Record<string, unknown>;
  /** Description of changes */
  readonly description?: string;
}

// ============================================================================
// COMPATIBILITY MATRIX
// ============================================================================

/**
 * Checks if two ports are compatible.
 */
export function arePortsCompatible(output: Port, input: Port): boolean {
  // Any type matches everything
  if (output.type === PortTypes.ANY || input.type === PortTypes.ANY) {
    return true;
  }
  
  // Exact match
  if (output.type === input.type) {
    return true;
  }
  
  // Compatible coercions
  const coercions: Record<string, readonly string[]> = {
    [PortTypes.NOTES]: [PortTypes.MIDI, PortTypes.STREAM],
    [PortTypes.MIDI]: [PortTypes.NOTES],
    [PortTypes.NUMBER]: [PortTypes.CONTROL],
    [PortTypes.CONTROL]: [PortTypes.NUMBER],
    [PortTypes.PATTERN]: [PortTypes.CONTAINER, PortTypes.STREAM],
    [PortTypes.CONTAINER]: [PortTypes.STREAM],
  };
  
  return coercions[output.type]?.includes(input.type) ?? false;
}

/**
 * Detects conflicts between cards.
 */
export function detectCardConflicts(
  cardA: Card<unknown, unknown>,
  cardB: Card<unknown, unknown>
): readonly string[] {
  const conflicts: string[] = [];
  
  // Same ID
  if (cardA.meta.id === cardB.meta.id) {
    conflicts.push(`Duplicate card ID: ${cardA.meta.id}`);
  }
  
  // Same name in same category
  if (
    cardA.meta.name === cardB.meta.name &&
    cardA.meta.category === cardB.meta.category
  ) {
    conflicts.push(`Duplicate card name "${cardA.meta.name}" in category ${cardA.meta.category}`);
  }
  
  return conflicts;
}

// ============================================================================
// LAZY LOADING
// ============================================================================

/**
 * Loader function for lazy-loaded cards.
 */
export type CardLoader<A, B> = () => Promise<Card<A, B>>;

/**
 * Lazy card reference for deferred loading.
 */
export interface LazyCard<A, B> {
  readonly id: string;
  readonly meta: CardMeta;
  readonly loader: CardLoader<A, B>;
  loaded?: Card<A, B>;
}

/**
 * Creates a lazy card reference.
 */
export function createLazyCard<A, B>(
  meta: CardMeta,
  loader: CardLoader<A, B>
): LazyCard<A, B> {
  return {
    id: meta.id,
    meta,
    loader,
  };
}

/**
 * Loads a lazy card.
 */
export async function loadLazyCard<A, B>(lazy: LazyCard<A, B>): Promise<Card<A, B>> {
  if (lazy.loaded) {
    return lazy.loaded;
  }
  
  const card = await lazy.loader();
  (lazy as { loaded: Card<A, B> }).loaded = card;
  return card;
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Card usage statistics.
 */
export interface CardUsageStats {
  readonly cardId: string;
  readonly usageCount: number;
  readonly lastUsedAt: number;
  readonly averageProcessingTime?: number;
}

/**
 * Gets usage statistics for all cards.
 */
export function getCardUsageStats(): readonly CardUsageStats[] {
  const registry = getCardRegistry();
  const stats: CardUsageStats[] = [];
  
  for (const id of registry.getAllIds()) {
    const entry = registry.getEntry(id);
    if (entry) {
      stats.push({
        cardId: id,
        usageCount: entry.usageCount,
        lastUsedAt: entry.lastUsedAt,
      });
    }
  }
  
  return stats.sort((a, b) => b.usageCount - a.usageCount);
}
