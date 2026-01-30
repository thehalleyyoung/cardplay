/**
 * GOFAI NL Grammar — Extension Grammar Rule Registration
 *
 * Provides a runtime mechanism for extensions to register new grammar
 * rules with rule IDs, priorities, and required tests.
 *
 * ## Design
 *
 * Extensions can register grammar rules that:
 * 1. Have namespaced rule IDs (namespace:rule:category:name)
 * 2. Specify priority relative to core rules
 * 3. Declare required golden tests
 * 4. Define pattern templates and semantic actions
 * 5. Can be enabled/disabled per-extension
 * 6. Are validated before activation
 *
 * ## Rule Anatomy
 *
 * Each grammar rule has:
 * - **Pattern**: What token sequences to match (template-based)
 * - **Semantic action**: What CPL structure to produce
 * - **Priority**: Relative to core rules (higher = prefer)
 * - **Guards**: Conditions that must hold for the rule to fire
 * - **Tests**: Required golden test cases
 *
 * ## Safety
 *
 * - Extension rules cannot override core rule IDs
 * - Ambiguity between extension rules and core rules is logged
 * - Rules without required tests are flagged as incomplete
 * - Rule conflicts between extensions are detected
 *
 * @module gofai/nl/grammar/extension-rules
 * @see gofai_goalA.md Step 128
 */

// =============================================================================
// EXTENSION RULE TYPES
// =============================================================================

/**
 * A grammar rule registered by an extension.
 */
export interface ExtensionGrammarRule {
  /** Namespaced rule ID: namespace:rule:category:name */
  readonly id: string;

  /** The extension namespace */
  readonly namespace: string;

  /** Human-readable name */
  readonly name: string;

  /** Description of what this rule matches and produces */
  readonly description: string;

  /** The pattern to match */
  readonly pattern: RulePattern;

  /** The semantic action to execute when the rule matches */
  readonly action: RuleAction;

  /** Priority relative to core rules (default: 0, negative = lower, positive = higher) */
  readonly priority: number;

  /** Guards (conditions that must hold) */
  readonly guards: readonly RuleGuard[];

  /** Required golden test cases */
  readonly requiredTests: readonly RuleTestCase[];

  /** Whether this rule is enabled by default */
  readonly enabledByDefault: boolean;

  /** Tags for categorization */
  readonly tags: readonly string[];

  /** Minimum parser version required */
  readonly minParserVersion?: string;
}

/**
 * A pattern that specifies what token sequences a rule matches.
 *
 * Patterns are templates with typed slots that match token categories
 * or specific lexemes.
 */
export interface RulePattern {
  /** Pattern type */
  readonly type: PatternType;

  /** The template elements */
  readonly elements: readonly PatternElement[];

  /** Whether the pattern can match partially */
  readonly allowPartial: boolean;

  /** Minimum number of tokens to match */
  readonly minTokens: number;

  /** Maximum number of tokens to match (-1 = unlimited) */
  readonly maxTokens: number;
}

/**
 * Types of patterns.
 */
export type PatternType =
  | 'sequence'     // Ordered sequence of elements
  | 'template'     // Template with typed slots
  | 'regex_like'   // Regex-like pattern over token types
  | 'custom';      // Custom matcher function name

/**
 * An element in a rule pattern.
 */
export interface PatternElement {
  /** What this element matches */
  readonly match: PatternMatch;

  /** Variable name to bind the match to */
  readonly bindAs?: string;

  /** Whether this element is optional */
  readonly optional: boolean;

  /** Whether this element can repeat */
  readonly repeatable: boolean;
}

/**
 * What a pattern element matches.
 */
export type PatternMatch =
  | { type: 'literal'; text: string }             // Exact token
  | { type: 'category'; category: string }          // Any token of category
  | { type: 'lexeme'; lexemeId: string }            // Specific lexeme
  | { type: 'entity_ref' }                          // Any entity reference
  | { type: 'number' }                              // Numeric token
  | { type: 'wildcard' }                            // Any single token
  | { type: 'choice'; alternatives: readonly PatternMatch[] } // Any of these
  | { type: 'custom_predicate'; name: string };      // Named predicate function

/**
 * A semantic action to execute when a rule matches.
 */
export interface RuleAction {
  /** What CPL node type to produce */
  readonly produces: string;

  /** How to construct the node from bound variables */
  readonly construction: ActionConstruction;

  /** Side-effects (e.g., register a new entity name) */
  readonly sideEffects: readonly ActionSideEffect[];
}

/**
 * How to construct a CPL node from matched elements.
 */
export type ActionConstruction =
  | { type: 'template'; template: Record<string, unknown> }
  | { type: 'function'; handler: string }
  | { type: 'passthrough'; fromBinding: string };

/**
 * A side-effect of a rule action.
 */
export interface ActionSideEffect {
  readonly type: 'register_entity' | 'update_salience' | 'add_constraint' | 'flag_ambiguity';
  readonly params: Record<string, unknown>;
}

/**
 * A guard condition for a rule.
 */
export interface RuleGuard {
  /** Type of guard */
  readonly type: GuardType;

  /** Guard parameters */
  readonly params: Record<string, unknown>;

  /** Human-readable description */
  readonly description: string;
}

/**
 * Types of guards.
 */
export type GuardType =
  | 'requires_capability'   // Extension must have a capability
  | 'requires_context'      // Specific context must be present
  | 'no_ambiguity'          // Rule only fires if unambiguous
  | 'entity_exists'         // A referenced entity must exist
  | 'custom_predicate';     // Custom predicate function

/**
 * A test case required for a grammar rule.
 */
export interface RuleTestCase {
  /** Test input */
  readonly input: string;

  /** Expected behavior */
  readonly expected: TestExpectation;

  /** Description of what this tests */
  readonly description: string;
}

/**
 * Expected test behavior.
 */
export type TestExpectation =
  | { type: 'should_match'; producesType?: string }
  | { type: 'should_not_match' }
  | { type: 'should_produce'; cplFragment: Record<string, unknown> };

// =============================================================================
// RULE PROVENANCE
// =============================================================================

/**
 * Provenance for a registered grammar rule.
 */
export interface RuleProvenance {
  readonly namespace: string;
  readonly extensionVersion: string;
  readonly registeredAt: number;
  active: boolean;
  readonly testsValidated: boolean;
}

/**
 * A registered grammar rule with provenance.
 */
export interface RegisteredRule {
  readonly rule: ExtensionGrammarRule;
  readonly provenance: RuleProvenance;
}

// =============================================================================
// CONFLICT AND VALIDATION
// =============================================================================

/**
 * A conflict between grammar rules.
 */
export interface RuleConflict {
  readonly existingRuleId: string;
  readonly existingNamespace: string;
  readonly newRuleId: string;
  readonly newNamespace: string;
  readonly conflictType: 'id_collision' | 'pattern_overlap' | 'priority_tie';
  readonly description: string;
  readonly severity: 'error' | 'warning';
}

/**
 * Validation error for a grammar rule.
 */
export interface RuleValidationError {
  readonly ruleId: string;
  readonly field: string;
  readonly message: string;
  readonly severity: 'error' | 'warning';
}

/**
 * Result of rule registration.
 */
export interface RuleRegistrationResult {
  readonly success: boolean;
  readonly registered: number;
  readonly skipped: number;
  readonly conflicts: readonly RuleConflict[];
  readonly validationErrors: readonly RuleValidationError[];
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
}

/**
 * Result of rule unregistration.
 */
export interface RuleUnregistrationResult {
  readonly success: boolean;
  readonly removed: number;
  readonly diagnostics: readonly string[];
}

// =============================================================================
// EXTENSION GRAMMAR RULE REGISTRY
// =============================================================================

/**
 * Registry for extension-provided grammar rules.
 */
export class ExtensionGrammarRuleRegistry {
  /** All registered rules by ID */
  private readonly byId: Map<string, RegisteredRule> = new Map();

  /** Rules indexed by namespace */
  private readonly byNamespace: Map<string, Set<string>> = new Map();

  /** Rules indexed by what CPL node they produce */
  private readonly byProduces: Map<string, RegisteredRule[]> = new Map();

  /** Set of core rule IDs that cannot be overridden */
  private readonly coreRuleIds: Set<string>;

  /** Conflict log */
  private readonly conflictLog: RuleConflict[] = [];

  /** Listeners */
  private readonly listeners: RuleRegistrationListener[] = [];

  constructor(coreRuleIds?: ReadonlySet<string>) {
    this.coreRuleIds = new Set(coreRuleIds ?? []);
  }

  // ── Registration ─────────────────────────────────────────────────────

  /**
   * Register a batch of grammar rules from an extension.
   */
  registerRules(
    namespace: string,
    rules: readonly ExtensionGrammarRule[],
    extensionVersion: string = '0.0.0'
  ): RuleRegistrationResult {
    const conflicts: RuleConflict[] = [];
    const validationErrors: RuleValidationError[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    let registered = 0;
    let skipped = 0;

    if (!namespace) {
      return {
        success: false,
        registered: 0,
        skipped: rules.length,
        conflicts: [],
        validationErrors: [],
        warnings: [],
        errors: ['Namespace is required'],
      };
    }

    for (const rule of rules) {
      // Validate
      const ruleErrors = validateGrammarRule(rule);
      if (ruleErrors.some(e => e.severity === 'error')) {
        validationErrors.push(...ruleErrors);
        skipped++;
        continue;
      }
      if (ruleErrors.length > 0) {
        validationErrors.push(...ruleErrors);
      }

      // Check namespace match
      if (rule.namespace !== namespace) {
        errors.push(`Rule "${rule.id}" has namespace "${rule.namespace}" but registered under "${namespace}"`);
        skipped++;
        continue;
      }

      // Check for core conflict
      if (this.coreRuleIds.has(rule.id)) {
        conflicts.push({
          existingRuleId: rule.id,
          existingNamespace: 'core',
          newRuleId: rule.id,
          newNamespace: namespace,
          conflictType: 'id_collision',
          description: `Rule "${rule.id}" conflicts with core grammar rule`,
          severity: 'error',
        });
        skipped++;
        continue;
      }

      // Check for extension-extension conflict
      const existing = this.byId.get(rule.id);
      if (existing && existing.rule.namespace !== namespace) {
        conflicts.push({
          existingRuleId: existing.rule.id,
          existingNamespace: existing.rule.namespace,
          newRuleId: rule.id,
          newNamespace: namespace,
          conflictType: 'id_collision',
          description: `Rule "${rule.id}" already registered by "${existing.rule.namespace}"`,
          severity: 'error',
        });
        skipped++;
        continue;
      }

      // Warn about missing tests
      if (rule.requiredTests.length === 0) {
        warnings.push(`Rule "${rule.id}" has no required tests — considered incomplete`);
      }

      // Register
      const provenance: RuleProvenance = {
        namespace,
        extensionVersion,
        registeredAt: Date.now(),
        active: rule.enabledByDefault,
        testsValidated: false,
      };

      const registeredRule: RegisteredRule = { rule, provenance };

      this.byId.set(rule.id, registeredRule);

      // Index by namespace
      let nsSet = this.byNamespace.get(namespace);
      if (!nsSet) {
        nsSet = new Set();
        this.byNamespace.set(namespace, nsSet);
      }
      nsSet.add(rule.id);

      // Index by produces
      const produces = rule.action.produces;
      let producesList = this.byProduces.get(produces);
      if (!producesList) {
        producesList = [];
        this.byProduces.set(produces, producesList);
      }
      producesList.push(registeredRule);

      registered++;
    }

    this.conflictLog.push(...conflicts);

    if (registered > 0) {
      for (const listener of this.listeners) {
        listener.onRulesRegistered(namespace, registered);
      }
    }

    return {
      success: errors.length === 0,
      registered,
      skipped,
      conflicts,
      validationErrors,
      warnings,
      errors,
    };
  }

  /**
   * Unregister all rules from an extension.
   */
  unregisterNamespace(namespace: string): RuleUnregistrationResult {
    const nsSet = this.byNamespace.get(namespace);
    if (!nsSet || nsSet.size === 0) {
      return {
        success: true,
        removed: 0,
        diagnostics: [`No rules registered under "${namespace}"`],
      };
    }

    let removed = 0;

    for (const id of nsSet) {
      const registered = this.byId.get(id);
      if (registered) {
        // Remove from produces index
        const produces = registered.rule.action.produces;
        const list = this.byProduces.get(produces);
        if (list) {
          const idx = list.indexOf(registered);
          if (idx >= 0) list.splice(idx, 1);
          if (list.length === 0) this.byProduces.delete(produces);
        }
      }

      this.byId.delete(id);
      removed++;
    }

    this.byNamespace.delete(namespace);

    for (const listener of this.listeners) {
      listener.onRulesUnregistered(namespace, removed);
    }

    return {
      success: true,
      removed,
      diagnostics: [`Removed ${removed} rule(s) from "${namespace}"`],
    };
  }

  // ── Lookup ───────────────────────────────────────────────────────────

  /**
   * Get a rule by ID.
   */
  getById(id: string): RegisteredRule | undefined {
    return this.byId.get(id);
  }

  /**
   * Get all active rules, sorted by priority descending.
   */
  getActiveRules(): readonly RegisteredRule[] {
    const active: RegisteredRule[] = [];
    for (const registered of this.byId.values()) {
      if (registered.provenance.active) {
        active.push(registered);
      }
    }
    active.sort((a, b) => b.rule.priority - a.rule.priority);
    return active;
  }

  /**
   * Get rules by namespace.
   */
  getByNamespace(namespace: string): readonly RegisteredRule[] {
    const nsSet = this.byNamespace.get(namespace);
    if (!nsSet) return [];

    const result: RegisteredRule[] = [];
    for (const id of nsSet) {
      const registered = this.byId.get(id);
      if (registered) result.push(registered);
    }
    return result;
  }

  /**
   * Get rules that produce a specific CPL node type.
   */
  getByProduces(produces: string): readonly RegisteredRule[] {
    return this.byProduces.get(produces) ?? [];
  }

  /**
   * Enable or disable a specific rule.
   */
  setRuleActive(ruleId: string, active: boolean): boolean {
    const registered = this.byId.get(ruleId);
    if (!registered) return false;
    registered.provenance.active = active;
    return true;
  }

  /**
   * Mark a rule's tests as validated.
   */
  markTestsValidated(ruleId: string, validated: boolean): boolean {
    const registered = this.byId.get(ruleId);
    if (!registered) return false;
    registered.provenance.testsValidated = validated;
    return true;
  }

  // ── Listeners ────────────────────────────────────────────────────────

  addListener(listener: RuleRegistrationListener): void {
    this.listeners.push(listener);
  }

  removeListener(listener: RuleRegistrationListener): void {
    const idx = this.listeners.indexOf(listener);
    if (idx >= 0) this.listeners.splice(idx, 1);
  }

  // ── Core rule management ─────────────────────────────────────────────

  addCoreRuleId(id: string): void {
    this.coreRuleIds.add(id);
  }

  addCoreRuleIds(ids: Iterable<string>): void {
    for (const id of ids) {
      this.coreRuleIds.add(id);
    }
  }

  // ── Statistics ───────────────────────────────────────────────────────

  getStats(): ExtensionRuleStats {
    const byNamespace: Record<string, number> = {};
    for (const [ns, ids] of this.byNamespace) {
      byNamespace[ns] = ids.size;
    }

    let activeCount = 0;
    let testedCount = 0;
    let totalTests = 0;

    for (const registered of this.byId.values()) {
      if (registered.provenance.active) activeCount++;
      if (registered.provenance.testsValidated) testedCount++;
      totalTests += registered.rule.requiredTests.length;
    }

    return {
      totalRules: this.byId.size,
      activeRules: activeCount,
      testedRules: testedCount,
      totalTests,
      totalNamespaces: this.byNamespace.size,
      byNamespace,
      totalConflicts: this.conflictLog.length,
      coreRuleCount: this.coreRuleIds.size,
    };
  }

  // ── Reset ────────────────────────────────────────────────────────────

  clear(): void {
    this.byId.clear();
    this.byNamespace.clear();
    this.byProduces.clear();
    this.conflictLog.length = 0;
  }
}

// =============================================================================
// LISTENER INTERFACE
// =============================================================================

export interface RuleRegistrationListener {
  onRulesRegistered(namespace: string, count: number): void;
  onRulesUnregistered(namespace: string, count: number): void;
}

// =============================================================================
// STATISTICS TYPE
// =============================================================================

export interface ExtensionRuleStats {
  readonly totalRules: number;
  readonly activeRules: number;
  readonly testedRules: number;
  readonly totalTests: number;
  readonly totalNamespaces: number;
  readonly byNamespace: Record<string, number>;
  readonly totalConflicts: number;
  readonly coreRuleCount: number;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate a grammar rule before registration.
 */
export function validateGrammarRule(
  rule: ExtensionGrammarRule
): readonly RuleValidationError[] {
  const errors: RuleValidationError[] = [];

  if (!rule.id || rule.id.length === 0) {
    errors.push({
      ruleId: rule.id ?? '(empty)',
      field: 'id',
      message: 'Rule ID is required',
      severity: 'error',
    });
  }

  if (!rule.namespace || rule.namespace.length === 0) {
    errors.push({
      ruleId: rule.id,
      field: 'namespace',
      message: 'Namespace is required',
      severity: 'error',
    });
  }

  if (rule.namespace && !rule.id.startsWith(rule.namespace + ':')) {
    errors.push({
      ruleId: rule.id,
      field: 'id',
      message: `Rule ID must start with namespace "${rule.namespace}:"`,
      severity: 'error',
    });
  }

  if (!rule.name || rule.name.trim().length === 0) {
    errors.push({
      ruleId: rule.id,
      field: 'name',
      message: 'Rule name is required',
      severity: 'error',
    });
  }

  if (!rule.pattern || !rule.pattern.elements || rule.pattern.elements.length === 0) {
    errors.push({
      ruleId: rule.id,
      field: 'pattern',
      message: 'Pattern must have at least one element',
      severity: 'error',
    });
  }

  if (!rule.action || !rule.action.produces) {
    errors.push({
      ruleId: rule.id,
      field: 'action',
      message: 'Action must specify what it produces',
      severity: 'error',
    });
  }

  if (rule.requiredTests.length === 0) {
    errors.push({
      ruleId: rule.id,
      field: 'requiredTests',
      message: 'Rules should have at least one required test case',
      severity: 'warning',
    });
  }

  if (!rule.description || rule.description.trim().length === 0) {
    errors.push({
      ruleId: rule.id,
      field: 'description',
      message: 'Description is recommended',
      severity: 'warning',
    });
  }

  return errors;
}

// =============================================================================
// SINGLETON
// =============================================================================

let globalRuleRegistry: ExtensionGrammarRuleRegistry | null = null;

/**
 * Get the global extension grammar rule registry.
 */
export function getExtensionGrammarRuleRegistry(): ExtensionGrammarRuleRegistry {
  if (!globalRuleRegistry) {
    globalRuleRegistry = new ExtensionGrammarRuleRegistry();
  }
  return globalRuleRegistry;
}

/**
 * Reset the global rule registry (for testing).
 */
export function resetExtensionGrammarRuleRegistry(): void {
  if (globalRuleRegistry) {
    globalRuleRegistry.clear();
  }
  globalRuleRegistry = null;
}

// =============================================================================
// FORMATTING
// =============================================================================

/**
 * Format a rule registration result for display.
 */
export function formatRuleRegistrationResult(result: RuleRegistrationResult): string {
  const lines: string[] = [];

  lines.push(result.success ? 'Rule registration succeeded' : 'Rule registration failed');
  lines.push(`  Registered: ${result.registered}`);
  lines.push(`  Skipped: ${result.skipped}`);

  if (result.conflicts.length > 0) {
    lines.push(`  Conflicts: ${result.conflicts.length}`);
    for (const conflict of result.conflicts.slice(0, 5)) {
      lines.push(`    - ${conflict.description}`);
    }
  }

  if (result.validationErrors.length > 0) {
    lines.push(`  Validation issues: ${result.validationErrors.length}`);
    for (const err of result.validationErrors.slice(0, 5)) {
      lines.push(`    - [${err.severity}] ${err.ruleId}: ${err.message}`);
    }
  }

  return lines.join('\n');
}
