/**
 * GOFAI NL Grammar — Extension Lexeme Registration
 *
 * Provides a runtime mechanism for extensions (packs, plugins) to
 * register additional lexemes and lexical variants into the parser.
 *
 * ## Design
 *
 * Extensions register lexemes through a typed API that:
 * 1. Validates namespace isolation (extensions can't override core lexemes)
 * 2. Indexes all variants for fast lookup
 * 3. Tracks provenance (which extension registered what)
 * 4. Supports hot-registration and hot-unregistration
 * 5. Maintains version compatibility metadata
 * 6. Detects conflicts between extensions
 *
 * ## Namespace Discipline
 *
 * Extension lexemes must use namespaced IDs:
 * - Core:      `lex:verb:make`
 * - Extension: `my-pack:lex:verb:amplify`
 *
 * Extensions cannot register lexemes with core (un-namespaced) IDs.
 *
 * ## Safety Guarantees
 *
 * - Core vocabulary cannot be overridden by extensions
 * - Conflicting variants are detected and reported (not silently overwritten)
 * - All registered lexemes retain provenance for debugging and auditing
 * - Registration can be rolled back per-extension
 *
 * @module gofai/nl/grammar/extension-lexemes
 * @see gofai_goalA.md Step 127
 */

// Note: Span type available from '../tokenizer/span-tokenizer' if needed for future span-aware APIs

// =============================================================================
// EXTENSION LEXEME TYPES
// =============================================================================

/**
 * A lexeme registered by an extension.
 */
export interface ExtensionLexeme {
  /** Namespaced identifier (must follow namespace:lex:category:lemma format) */
  readonly id: string;

  /** The namespace of the registering extension */
  readonly namespace: string;

  /** Base form (lemma) */
  readonly lemma: string;

  /** Variant surface forms */
  readonly variants: readonly string[];

  /** Grammatical category */
  readonly category: ExtensionLexemeCategory;

  /** Semantic binding — what this lexeme means in CPL terms */
  readonly semantics: ExtensionLexemeSemantics;

  /** Selectional restrictions */
  readonly restrictions?: ExtensionLexemeRestrictions;

  /** Human-readable description */
  readonly description: string;

  /** Usage examples */
  readonly examples: readonly string[];

  /** Minimum parser version required */
  readonly minParserVersion?: string;
}

/**
 * Categories for extension lexemes.
 */
export type ExtensionLexemeCategory =
  | 'verb'
  | 'adj'
  | 'noun'
  | 'prep'
  | 'adv'
  | 'construction'
  | 'custom';

/**
 * Semantic binding for an extension lexeme.
 */
export type ExtensionLexemeSemantics =
  | { type: 'axis_modifier'; axis: string; direction: 'increase' | 'decrease' }
  | { type: 'action'; opcode: string; role: 'main' | 'modifier' }
  | { type: 'constraint'; constraintType: string }
  | { type: 'entity'; entityType: string; properties?: Record<string, unknown> }
  | { type: 'concept'; domain: string; aspect: string; properties?: Record<string, unknown> }
  | { type: 'modifier'; modifierType: string; properties?: Record<string, unknown> }
  | { type: 'custom'; handler: string; data?: Record<string, unknown> };

/**
 * Selectional restrictions for extension lexemes.
 */
export interface ExtensionLexemeRestrictions {
  /** What entity types this can apply to */
  readonly applicableTo?: readonly string[];

  /** Related axes */
  readonly relatedAxes?: readonly string[];

  /** Required capabilities */
  readonly requiresCapabilities?: readonly string[];

  /** Conflicts with other lexeme IDs */
  readonly conflictsWith?: readonly string[];
}

// =============================================================================
// REGISTRATION PROVENANCE
// =============================================================================

/**
 * Provenance information for a registered lexeme.
 */
export interface LexemeProvenance {
  /** Namespace of the registering extension */
  readonly namespace: string;

  /** Extension version at time of registration */
  readonly extensionVersion: string;

  /** When the lexeme was registered */
  readonly registeredAt: number;

  /** Whether this registration is currently active */
  active: boolean;
}

/**
 * A registered lexeme with its provenance.
 */
export interface RegisteredLexeme {
  /** The lexeme definition */
  readonly lexeme: ExtensionLexeme;

  /** Registration provenance */
  readonly provenance: LexemeProvenance;
}

// =============================================================================
// CONFLICT DETECTION
// =============================================================================

/**
 * A conflict between lexeme registrations.
 */
export interface LexemeConflict {
  /** The conflicting variant form */
  readonly variant: string;

  /** The existing registration that conflicts */
  readonly existingId: string;

  /** The existing registration's namespace */
  readonly existingNamespace: string;

  /** The new registration that caused the conflict */
  readonly newId: string;

  /** The new registration's namespace */
  readonly newNamespace: string;

  /** Whether this is a core vocabulary conflict (cannot override) */
  readonly isCoreConflict: boolean;

  /** Severity */
  readonly severity: 'error' | 'warning';
}

// =============================================================================
// REGISTRATION RESULT
// =============================================================================

/**
 * Result of a lexeme registration attempt.
 */
export interface RegistrationResult {
  /** Whether the registration succeeded */
  readonly success: boolean;

  /** Number of lexemes registered */
  readonly registered: number;

  /** Number of lexemes skipped (due to conflicts) */
  readonly skipped: number;

  /** Conflicts found during registration */
  readonly conflicts: readonly LexemeConflict[];

  /** Warnings (non-fatal issues) */
  readonly warnings: readonly string[];

  /** Errors (fatal issues) */
  readonly errors: readonly string[];
}

/**
 * Result of unregistering an extension's lexemes.
 */
export interface UnregistrationResult {
  /** Whether the unregistration succeeded */
  readonly success: boolean;

  /** Number of lexemes removed */
  readonly removed: number;

  /** Diagnostics */
  readonly diagnostics: readonly string[];
}

// =============================================================================
// EXTENSION LEXEME REGISTRY — the main registry
// =============================================================================

/**
 * Registry for extension-provided lexemes.
 *
 * Maintains a mutable index of lexemes registered by extensions,
 * separate from the core vocabulary to preserve SSOT discipline.
 */
export class ExtensionLexemeRegistry {
  /** All registered lexemes by ID */
  private readonly byId: Map<string, RegisteredLexeme> = new Map();

  /** Index from variant form (lowercase) to registered lexeme */
  private readonly byVariant: Map<string, RegisteredLexeme> = new Map();

  /** Index from namespace to set of lexeme IDs */
  private readonly byNamespace: Map<string, Set<string>> = new Map();

  /** Set of core (non-overridable) variant forms */
  private readonly coreVariants: Set<string>;

  /** Conflict log */
  private readonly conflictLog: LexemeConflict[] = [];

  /** Registration listeners */
  private readonly listeners: RegistrationListener[] = [];

  constructor(coreVariants?: ReadonlySet<string>) {
    this.coreVariants = new Set(coreVariants ?? []);
  }

  // ── Registration ─────────────────────────────────────────────────────

  /**
   * Register a batch of lexemes from an extension.
   *
   * @param namespace - The extension namespace
   * @param lexemes - The lexemes to register
   * @param extensionVersion - Version of the registering extension
   * @returns Registration result with success status and any conflicts
   */
  registerLexemes(
    namespace: string,
    lexemes: readonly ExtensionLexeme[],
    extensionVersion: string = '0.0.0'
  ): RegistrationResult {
    const conflicts: LexemeConflict[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    let registered = 0;
    let skipped = 0;

    // Validate namespace
    if (!namespace || namespace.length === 0) {
      return {
        success: false,
        registered: 0,
        skipped: lexemes.length,
        conflicts: [],
        warnings: [],
        errors: ['Namespace is required for extension lexemes'],
      };
    }

    for (const lexeme of lexemes) {
      // Validate namespace matches
      if (lexeme.namespace !== namespace) {
        errors.push(
          `Lexeme "${lexeme.id}" has namespace "${lexeme.namespace}" but was registered under "${namespace}"`
        );
        skipped++;
        continue;
      }

      // Validate ID format (must be namespaced)
      if (!lexeme.id.startsWith(namespace + ':')) {
        errors.push(
          `Lexeme "${lexeme.id}" does not start with namespace "${namespace}:"`
        );
        skipped++;
        continue;
      }

      // Check for conflicts
      const lexemeConflicts = this.checkConflicts(lexeme, namespace);
      if (lexemeConflicts.some(c => c.isCoreConflict)) {
        errors.push(
          `Lexeme "${lexeme.id}" conflicts with core vocabulary and cannot be registered`
        );
        conflicts.push(...lexemeConflicts);
        skipped++;
        continue;
      }

      if (lexemeConflicts.length > 0) {
        warnings.push(
          `Lexeme "${lexeme.id}" has variant conflicts: ${lexemeConflicts.map(c => c.variant).join(', ')}`
        );
        conflicts.push(...lexemeConflicts);
      }

      // Register the lexeme
      const provenance: LexemeProvenance = {
        namespace,
        extensionVersion,
        registeredAt: Date.now(),
        active: true,
      };

      const registeredLexeme: RegisteredLexeme = { lexeme, provenance };

      // Add to indexes
      this.byId.set(lexeme.id, registeredLexeme);

      // Index lemma
      this.byVariant.set(lexeme.lemma.toLowerCase(), registeredLexeme);

      // Index all variants (skip conflicting ones)
      for (const variant of lexeme.variants) {
        const lower = variant.toLowerCase();
        if (!this.coreVariants.has(lower)) {
          this.byVariant.set(lower, registeredLexeme);
        }
      }

      // Track by namespace
      let nsSet = this.byNamespace.get(namespace);
      if (!nsSet) {
        nsSet = new Set();
        this.byNamespace.set(namespace, nsSet);
      }
      nsSet.add(lexeme.id);

      registered++;
    }

    // Log conflicts
    this.conflictLog.push(...conflicts);

    // Notify listeners
    if (registered > 0) {
      for (const listener of this.listeners) {
        listener.onLexemesRegistered(namespace, registered);
      }
    }

    return {
      success: errors.length === 0,
      registered,
      skipped,
      conflicts,
      warnings,
      errors,
    };
  }

  /**
   * Unregister all lexemes from an extension.
   */
  unregisterNamespace(namespace: string): UnregistrationResult {
    const nsSet = this.byNamespace.get(namespace);
    if (!nsSet || nsSet.size === 0) {
      return {
        success: true,
        removed: 0,
        diagnostics: [`No lexemes registered under namespace "${namespace}"`],
      };
    }

    let removed = 0;
    const diagnostics: string[] = [];

    for (const id of nsSet) {
      const registered = this.byId.get(id);
      if (!registered) continue;

      // Remove from variant index
      const lemmaLower = registered.lexeme.lemma.toLowerCase();
      if (this.byVariant.get(lemmaLower) === registered) {
        this.byVariant.delete(lemmaLower);
      }
      for (const variant of registered.lexeme.variants) {
        const lower = variant.toLowerCase();
        if (this.byVariant.get(lower) === registered) {
          this.byVariant.delete(lower);
        }
      }

      // Remove from ID index
      this.byId.delete(id);
      removed++;
    }

    // Clear namespace set
    this.byNamespace.delete(namespace);

    diagnostics.push(`Removed ${removed} lexeme(s) from namespace "${namespace}"`);

    // Notify listeners
    for (const listener of this.listeners) {
      listener.onLexemesUnregistered(namespace, removed);
    }

    return { success: true, removed, diagnostics };
  }

  // ── Lookup ───────────────────────────────────────────────────────────

  /**
   * Look up an extension lexeme by ID.
   */
  getById(id: string): RegisteredLexeme | undefined {
    return this.byId.get(id);
  }

  /**
   * Look up an extension lexeme by variant form.
   */
  getByVariant(variant: string): RegisteredLexeme | undefined {
    return this.byVariant.get(variant.toLowerCase());
  }

  /**
   * Get all lexemes registered by a specific namespace.
   */
  getByNamespace(namespace: string): readonly RegisteredLexeme[] {
    const nsSet = this.byNamespace.get(namespace);
    if (!nsSet) return [];

    const result: RegisteredLexeme[] = [];
    for (const id of nsSet) {
      const registered = this.byId.get(id);
      if (registered) result.push(registered);
    }
    return result;
  }

  /**
   * Get all registered lexemes.
   */
  getAll(): readonly RegisteredLexeme[] {
    return Array.from(this.byId.values());
  }

  /**
   * Check if a variant form is registered (by any extension).
   */
  hasVariant(variant: string): boolean {
    return this.byVariant.has(variant.toLowerCase());
  }

  /**
   * Get all registered namespaces.
   */
  getNamespaces(): readonly string[] {
    return Array.from(this.byNamespace.keys());
  }

  // ── Conflict checking ────────────────────────────────────────────────

  /**
   * Check for conflicts before registering a lexeme.
   */
  private checkConflicts(
    lexeme: ExtensionLexeme,
    namespace: string
  ): LexemeConflict[] {
    const conflicts: LexemeConflict[] = [];

    // Check lemma
    const lemmaLower = lexeme.lemma.toLowerCase();
    if (this.coreVariants.has(lemmaLower)) {
      conflicts.push({
        variant: lemmaLower,
        existingId: 'core',
        existingNamespace: 'core',
        newId: lexeme.id,
        newNamespace: namespace,
        isCoreConflict: true,
        severity: 'error',
      });
    }

    const existingByLemma = this.byVariant.get(lemmaLower);
    if (existingByLemma && existingByLemma.lexeme.namespace !== namespace) {
      conflicts.push({
        variant: lemmaLower,
        existingId: existingByLemma.lexeme.id,
        existingNamespace: existingByLemma.lexeme.namespace,
        newId: lexeme.id,
        newNamespace: namespace,
        isCoreConflict: false,
        severity: 'warning',
      });
    }

    // Check each variant
    for (const variant of lexeme.variants) {
      const lower = variant.toLowerCase();

      if (this.coreVariants.has(lower)) {
        conflicts.push({
          variant: lower,
          existingId: 'core',
          existingNamespace: 'core',
          newId: lexeme.id,
          newNamespace: namespace,
          isCoreConflict: true,
          severity: 'error',
        });
      }

      const existing = this.byVariant.get(lower);
      if (existing && existing.lexeme.namespace !== namespace) {
        conflicts.push({
          variant: lower,
          existingId: existing.lexeme.id,
          existingNamespace: existing.lexeme.namespace,
          newId: lexeme.id,
          newNamespace: namespace,
          isCoreConflict: false,
          severity: 'warning',
        });
      }
    }

    return conflicts;
  }

  /**
   * Get all recorded conflicts.
   */
  getConflicts(): readonly LexemeConflict[] {
    return [...this.conflictLog];
  }

  // ── Listeners ────────────────────────────────────────────────────────

  /**
   * Add a registration listener.
   */
  addListener(listener: RegistrationListener): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a registration listener.
   */
  removeListener(listener: RegistrationListener): void {
    const idx = this.listeners.indexOf(listener);
    if (idx >= 0) this.listeners.splice(idx, 1);
  }

  // ── Core vocabulary management ───────────────────────────────────────

  /**
   * Add a core variant that cannot be overridden by extensions.
   */
  addCoreVariant(variant: string): void {
    this.coreVariants.add(variant.toLowerCase());
  }

  /**
   * Add multiple core variants.
   */
  addCoreVariants(variants: Iterable<string>): void {
    for (const variant of variants) {
      this.coreVariants.add(variant.toLowerCase());
    }
  }

  /**
   * Check if a variant is a core (non-overridable) form.
   */
  isCoreVariant(variant: string): boolean {
    return this.coreVariants.has(variant.toLowerCase());
  }

  // ── Statistics ───────────────────────────────────────────────────────

  /**
   * Get registry statistics.
   */
  getStats(): ExtensionLexemeStats {
    const byNamespaceCount: Record<string, number> = {};
    for (const [ns, ids] of this.byNamespace) {
      byNamespaceCount[ns] = ids.size;
    }

    const byCategory: Record<string, number> = {};
    for (const registered of this.byId.values()) {
      const cat = registered.lexeme.category;
      byCategory[cat] = (byCategory[cat] ?? 0) + 1;
    }

    return {
      totalLexemes: this.byId.size,
      totalVariants: this.byVariant.size,
      totalNamespaces: this.byNamespace.size,
      byNamespace: byNamespaceCount,
      byCategory,
      totalConflicts: this.conflictLog.length,
      coreVariantCount: this.coreVariants.size,
    };
  }

  // ── Reset ────────────────────────────────────────────────────────────

  /**
   * Clear all extension registrations (preserves core variants).
   */
  clear(): void {
    this.byId.clear();
    this.byVariant.clear();
    this.byNamespace.clear();
    this.conflictLog.length = 0;
  }
}

// =============================================================================
// LISTENER INTERFACE
// =============================================================================

/**
 * Listener for lexeme registration/unregistration events.
 */
export interface RegistrationListener {
  onLexemesRegistered(namespace: string, count: number): void;
  onLexemesUnregistered(namespace: string, count: number): void;
}

// =============================================================================
// STATISTICS TYPE
// =============================================================================

/**
 * Statistics about the extension lexeme registry.
 */
export interface ExtensionLexemeStats {
  readonly totalLexemes: number;
  readonly totalVariants: number;
  readonly totalNamespaces: number;
  readonly byNamespace: Record<string, number>;
  readonly byCategory: Record<string, number>;
  readonly totalConflicts: number;
  readonly coreVariantCount: number;
}

// =============================================================================
// VALIDATION — validate extension lexeme definitions
// =============================================================================

/**
 * Validation error for an extension lexeme.
 */
export interface LexemeValidationError {
  readonly lexemeId: string;
  readonly field: string;
  readonly message: string;
  readonly severity: 'error' | 'warning';
}

/**
 * Validate an extension lexeme before registration.
 */
export function validateExtensionLexeme(
  lexeme: ExtensionLexeme
): readonly LexemeValidationError[] {
  const errors: LexemeValidationError[] = [];

  // ID format
  if (!lexeme.id || lexeme.id.length === 0) {
    errors.push({
      lexemeId: lexeme.id ?? '(empty)',
      field: 'id',
      message: 'Lexeme ID is required',
      severity: 'error',
    });
  }

  // Namespace must be non-empty
  if (!lexeme.namespace || lexeme.namespace.length === 0) {
    errors.push({
      lexemeId: lexeme.id,
      field: 'namespace',
      message: 'Namespace is required',
      severity: 'error',
    });
  }

  // ID must start with namespace
  if (lexeme.namespace && !lexeme.id.startsWith(lexeme.namespace + ':')) {
    errors.push({
      lexemeId: lexeme.id,
      field: 'id',
      message: `ID must start with namespace "${lexeme.namespace}:"`,
      severity: 'error',
    });
  }

  // Lemma must be non-empty
  if (!lexeme.lemma || lexeme.lemma.trim().length === 0) {
    errors.push({
      lexemeId: lexeme.id,
      field: 'lemma',
      message: 'Lemma is required',
      severity: 'error',
    });
  }

  // Must have at least one variant
  if (!lexeme.variants || lexeme.variants.length === 0) {
    errors.push({
      lexemeId: lexeme.id,
      field: 'variants',
      message: 'At least one variant is required',
      severity: 'warning',
    });
  }

  // Semantics must be defined
  if (!lexeme.semantics) {
    errors.push({
      lexemeId: lexeme.id,
      field: 'semantics',
      message: 'Semantics binding is required',
      severity: 'error',
    });
  }

  // Description should be present
  if (!lexeme.description || lexeme.description.trim().length === 0) {
    errors.push({
      lexemeId: lexeme.id,
      field: 'description',
      message: 'Description is recommended',
      severity: 'warning',
    });
  }

  // Examples should be present
  if (!lexeme.examples || lexeme.examples.length === 0) {
    errors.push({
      lexemeId: lexeme.id,
      field: 'examples',
      message: 'At least one usage example is recommended',
      severity: 'warning',
    });
  }

  return errors;
}

/**
 * Validate a batch of extension lexemes.
 */
export function validateExtensionLexemes(
  lexemes: readonly ExtensionLexeme[]
): {
  valid: readonly ExtensionLexeme[];
  invalid: readonly { lexeme: ExtensionLexeme; errors: readonly LexemeValidationError[] }[];
} {
  const valid: ExtensionLexeme[] = [];
  const invalid: { lexeme: ExtensionLexeme; errors: readonly LexemeValidationError[] }[] = [];

  for (const lexeme of lexemes) {
    const errors = validateExtensionLexeme(lexeme);
    const hasErrors = errors.some(e => e.severity === 'error');

    if (hasErrors) {
      invalid.push({ lexeme, errors });
    } else {
      valid.push(lexeme);
    }
  }

  return { valid, invalid };
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let globalRegistry: ExtensionLexemeRegistry | null = null;

/**
 * Get the global extension lexeme registry.
 */
export function getExtensionLexemeRegistry(): ExtensionLexemeRegistry {
  if (!globalRegistry) {
    globalRegistry = new ExtensionLexemeRegistry();
  }
  return globalRegistry;
}

/**
 * Reset the global extension lexeme registry (for testing).
 */
export function resetExtensionLexemeRegistry(): void {
  if (globalRegistry) {
    globalRegistry.clear();
  }
  globalRegistry = null;
}

// =============================================================================
// FORMATTING
// =============================================================================

/**
 * Format a registration result for display.
 */
export function formatRegistrationResult(result: RegistrationResult): string {
  const lines: string[] = [];

  lines.push(result.success ? 'Registration succeeded' : 'Registration failed');
  lines.push(`  Registered: ${result.registered}`);
  lines.push(`  Skipped: ${result.skipped}`);

  if (result.conflicts.length > 0) {
    lines.push(`  Conflicts: ${result.conflicts.length}`);
    for (const conflict of result.conflicts.slice(0, 5)) {
      lines.push(`    - "${conflict.variant}": ${conflict.existingId} vs ${conflict.newId}`);
    }
    if (result.conflicts.length > 5) {
      lines.push(`    ... and ${result.conflicts.length - 5} more`);
    }
  }

  if (result.warnings.length > 0) {
    lines.push('  Warnings:');
    for (const warning of result.warnings.slice(0, 5)) {
      lines.push(`    - ${warning}`);
    }
  }

  if (result.errors.length > 0) {
    lines.push('  Errors:');
    for (const error of result.errors.slice(0, 5)) {
      lines.push(`    - ${error}`);
    }
  }

  return lines.join('\n');
}
