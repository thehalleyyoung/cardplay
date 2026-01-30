/**
 * @file Extension Namespaces as First-Class Provenance
 * @module gofai/canon/extension-namespace-provenance
 * 
 * Implements Step 064: Define extension namespaces as first-class provenance on
 * lexeme senses, constraints, and opcodes.
 * 
 * Every contribution from an extension (lexemes, constraints, opcodes, axes, etc.)
 * must carry namespace provenance so that:
 * - Conflicts can be detected and resolved
 * - Users know where meanings come from
 * - Extensions can be enabled/disabled without breakage
 * - Plans can be validated against installed extensions
 * - Audit logs are complete
 * 
 * Design principles:
 * - Namespace is immutable once assigned
 * - Namespace validation at registration time
 * - Provenance tracked through entire compilation pipeline
 * - Clear ownership model (one namespace owns one meaning)
 * - Version tracking for migration
 * 
 * @see gofai_goalB.md Step 064
 * @see src/gofai/extensions/registry.ts (extension registration)
 * @see src/gofai/canon/extension-semantics.ts (opaque semantic nodes)
 */

import type {
  GofaiId,
  LexemeId,
  AxisId,
  OpcodeId,
  ConstraintTypeId,
} from './types.js';

// ============================================================================
// Namespace Types
// ============================================================================

/**
 * Extension namespace identifier
 * 
 * Format: lowercase-with-hyphens
 * Examples: 'jazz-theory', 'my-pack', 'experimental-modes'
 * 
 * Reserved namespaces (cannot be used by extensions):
 * - 'core', 'builtin', 'system', 'cardplay', 'gofai'
 */
export type ExtensionNamespace = string & { readonly __extensionNamespace: unique symbol };

/**
 * Create a validated extension namespace
 */
export function createExtensionNamespace(namespace: string): ExtensionNamespace {
  if (!isValidNamespace(namespace)) {
    throw new Error(`Invalid namespace: ${namespace}`);
  }
  return namespace as ExtensionNamespace;
}

/**
 * Check if a string is a valid namespace
 */
export function isValidNamespace(namespace: string): boolean {
  // Must be lowercase, alphanumeric, hyphens, 2-50 chars
  if (!/^[a-z][a-z0-9-]{1,49}$/.test(namespace)) {
    return false;
  }
  
  // Cannot be reserved
  const reserved = ['core', 'builtin', 'system', 'cardplay', 'gofai'];
  if (reserved.includes(namespace)) {
    return false;
  }
  
  // Cannot start or end with hyphen
  if (namespace.startsWith('-') || namespace.endsWith('-')) {
    return false;
  }
  
  // Cannot have consecutive hyphens
  if (namespace.includes('--')) {
    return false;
  }
  
  return true;
}

/**
 * Semantic version for provenance
 */
export type SemanticVersion = string & { readonly __semver: unique symbol };

/**
 * Create a semantic version
 */
export function createSemanticVersion(version: string): SemanticVersion {
  if (!isValidSemanticVersion(version)) {
    throw new Error(`Invalid semantic version: ${version}`);
  }
  return version as SemanticVersion;
}

/**
 * Check if a string is a valid semantic version (simplified)
 */
export function isValidSemanticVersion(version: string): boolean {
  // Simplified semver: major.minor.patch
  return /^\d+\.\d+\.\d+$/.test(version);
}

// ============================================================================
// Provenance on Contributions
// ============================================================================

/**
 * Full provenance for any GOFAI contribution
 * 
 * Attached to lexemes, constraints, opcodes, axes, etc.
 */
export interface ContributionProvenance {
  /** Which extension provided this */
  readonly namespace: ExtensionNamespace;
  
  /** Version of the extension */
  readonly version: SemanticVersion;
  
  /** When it was registered */
  readonly registeredAt: number;
  
  /** Which module within the extension */
  readonly moduleId?: string;
  
  /** Specific file/line for debugging */
  readonly sourceLocation?: SourceLocation;
  
  /** Human-readable attribution */
  readonly attribution?: string;
  
  /** License information */
  readonly license?: string;
}

export interface SourceLocation {
  readonly file: string;
  readonly line?: number;
  readonly column?: number;
}

/**
 * Provenance on a lexeme
 */
export interface LexemeProvenance extends ContributionProvenance {
  /** The lexeme this provenance belongs to */
  readonly lexemeId: LexemeId;
  
  /** Which sense(s) of the lexeme */
  readonly senseIds: readonly string[];
  
  /** Confidence (for auto-generated bindings) */
  readonly confidence?: number;
  
  /** Whether this is a fallback binding */
  readonly isFallback?: boolean;
}

/**
 * Provenance on a constraint type
 */
export interface ConstraintProvenance extends ContributionProvenance {
  /** The constraint this provenance belongs to */
  readonly constraintId: ConstraintTypeId;
  
  /** Schema ID for validation */
  readonly schemaId: string;
  
  /** Checker function ID */
  readonly checkerId: string;
}

/**
 * Provenance on an opcode
 */
export interface OpcodeProvenance extends ContributionProvenance {
  /** The opcode this provenance belongs to */
  readonly opcodeId: OpcodeId;
  
  /** Schema ID for parameters */
  readonly schemaId: string;
  
  /** Handler function ID */
  readonly handlerId: string;
  
  /** Effect type */
  readonly effectType: 'inspect' | 'propose' | 'mutate';
}

/**
 * Provenance on an axis
 */
export interface AxisProvenance extends ContributionProvenance {
  /** The axis this provenance belongs to */
  readonly axisId: AxisId;
  
  /** How many levers map to this axis */
  readonly leverCount: number;
  
  /** Whether this axis has card parameter bindings */
  readonly hasParameterBindings: boolean;
}

// ============================================================================
// Provenance Chain (for compilation pipeline)
// ============================================================================

/**
 * Provenance chain: track a contribution through the compilation pipeline
 * 
 * Example: Lexeme → Parse → Semantics → Planning → Execution
 */
export interface ProvenanceChain {
  /** Original contribution */
  readonly source: ContributionProvenance;
  
  /** Pipeline stages this went through */
  readonly stages: readonly PipelineStage[];
  
  /** Any transformations applied */
  readonly transformations: readonly Transformation[];
  
  /** Final output (if applicable) */
  readonly output?: OutputProvenance;
}

export interface PipelineStage {
  readonly stage: 'parse' | 'semantics' | 'pragmatics' | 'planning' | 'execution';
  readonly timestamp: number;
  readonly durationMs: number;
  readonly metadata?: Record<string, unknown>;
}

export interface Transformation {
  readonly type: string;
  readonly description: string;
  readonly before: unknown;
  readonly after: unknown;
}

export interface OutputProvenance {
  readonly outputType: 'cpl-intent' | 'cpl-plan' | 'edit-package' | 'diff';
  readonly outputId: string;
  readonly timestamp: number;
}

/**
 * Create a provenance chain
 */
export function createProvenanceChain(source: ContributionProvenance): ProvenanceChain {
  return {
    source,
    stages: [],
    transformations: []
  };
}

/**
 * Add a stage to a provenance chain
 */
export function addStageToChain(
  chain: ProvenanceChain,
  stage: PipelineStage
): ProvenanceChain {
  return {
    ...chain,
    stages: [...chain.stages, stage]
  };
}

/**
 * Add a transformation to a provenance chain
 */
export function addTransformationToChain(
  chain: ProvenanceChain,
  transformation: Transformation
): ProvenanceChain {
  return {
    ...chain,
    transformations: [...chain.transformations, transformation]
  };
}

/**
 * Complete a provenance chain with output
 */
export function completeProvenanceChain(
  chain: ProvenanceChain,
  output: OutputProvenance
): ProvenanceChain {
  return {
    ...chain,
    output
  };
}

// ============================================================================
// Provenance Registry
// ============================================================================

/**
 * Central registry of all provenance information
 * 
 * Used for:
 * - Querying "where did this come from?"
 * - Dependency tracking
 * - Audit logs
 * - Debugging
 */
export class ProvenanceRegistry {
  private lexemes = new Map<LexemeId, LexemeProvenance>();
  private constraints = new Map<ConstraintTypeId, ConstraintProvenance>();
  private opcodes = new Map<OpcodeId, OpcodeProvenance>();
  private axes = new Map<AxisId, AxisProvenance>();
  private chains = new Map<string, ProvenanceChain>();
  
  /**
   * Register lexeme provenance
   */
  registerLexeme(provenance: LexemeProvenance): void {
    if (this.lexemes.has(provenance.lexemeId)) {
      throw new Error(`Lexeme provenance already registered: ${provenance.lexemeId}`);
    }
    this.lexemes.set(provenance.lexemeId, provenance);
  }
  
  /**
   * Register constraint provenance
   */
  registerConstraint(provenance: ConstraintProvenance): void {
    if (this.constraints.has(provenance.constraintId)) {
      throw new Error(`Constraint provenance already registered: ${provenance.constraintId}`);
    }
    this.constraints.set(provenance.constraintId, provenance);
  }
  
  /**
   * Register opcode provenance
   */
  registerOpcode(provenance: OpcodeProvenance): void {
    if (this.opcodes.has(provenance.opcodeId)) {
      throw new Error(`Opcode provenance already registered: ${provenance.opcodeId}`);
    }
    this.opcodes.set(provenance.opcodeId, provenance);
  }
  
  /**
   * Register axis provenance
   */
  registerAxis(provenance: AxisProvenance): void {
    if (this.axes.has(provenance.axisId)) {
      throw new Error(`Axis provenance already registered: ${provenance.axisId}`);
    }
    this.axes.set(provenance.axisId, provenance);
  }
  
  /**
   * Get lexeme provenance
   */
  getLexemeProvenance(id: LexemeId): LexemeProvenance | undefined {
    return this.lexemes.get(id);
  }
  
  /**
   * Get constraint provenance
   */
  getConstraintProvenance(id: ConstraintTypeId): ConstraintProvenance | undefined {
    return this.constraints.get(id);
  }
  
  /**
   * Get opcode provenance
   */
  getOpcodeProvenance(id: OpcodeId): OpcodeProvenance | undefined {
    return this.opcodes.get(id);
  }
  
  /**
   * Get axis provenance
   */
  getAxisProvenance(id: AxisId): AxisProvenance | undefined {
    return this.axes.get(id);
  }
  
  /**
   * Store a provenance chain
   */
  storeChain(id: string, chain: ProvenanceChain): void {
    this.chains.set(id, chain);
  }
  
  /**
   * Get a provenance chain
   */
  getChain(id: string): ProvenanceChain | undefined {
    return this.chains.get(id);
  }
  
  /**
   * Get all contributions from a namespace
   */
  getContributionsByNamespace(namespace: ExtensionNamespace): {
    lexemes: readonly LexemeProvenance[];
    constraints: readonly ConstraintProvenance[];
    opcodes: readonly OpcodeProvenance[];
    axes: readonly AxisProvenance[];
  } {
    const lexemes = Array.from(this.lexemes.values())
      .filter(p => p.namespace === namespace);
    const constraints = Array.from(this.constraints.values())
      .filter(p => p.namespace === namespace);
    const opcodes = Array.from(this.opcodes.values())
      .filter(p => p.namespace === namespace);
    const axes = Array.from(this.axes.values())
      .filter(p => p.namespace === namespace);
    
    return { lexemes, constraints, opcodes, axes };
  }
  
  /**
   * Get all namespaces
   */
  getAllNamespaces(): readonly ExtensionNamespace[] {
    const namespaces = new Set<ExtensionNamespace>();
    
    Array.from(this.lexemes.values()).forEach(p => namespaces.add(p.namespace));
    Array.from(this.constraints.values()).forEach(p => namespaces.add(p.namespace));
    Array.from(this.opcodes.values()).forEach(p => namespaces.add(p.namespace));
    Array.from(this.axes.values()).forEach(p => namespaces.add(p.namespace));
    
    return Array.from(namespaces);
  }
  
  /**
   * Clear all provenance from a namespace (when unregistering)
   */
  clearNamespace(namespace: ExtensionNamespace): void {
    // Remove lexemes
    const lexemesToRemove: LexemeId[] = [];
    Array.from(this.lexemes.entries()).forEach(([id, p]) => {
      if (p.namespace === namespace) {
        lexemesToRemove.push(id);
      }
    });
    lexemesToRemove.forEach(id => this.lexemes.delete(id));
    
    // Remove constraints
    const constraintsToRemove: ConstraintTypeId[] = [];
    Array.from(this.constraints.entries()).forEach(([id, p]) => {
      if (p.namespace === namespace) {
        constraintsToRemove.push(id);
      }
    });
    constraintsToRemove.forEach(id => this.constraints.delete(id));
    
    // Remove opcodes
    const opcodesToRemove: OpcodeId[] = [];
    Array.from(this.opcodes.entries()).forEach(([id, p]) => {
      if (p.namespace === namespace) {
        opcodesToRemove.push(id);
      }
    });
    opcodesToRemove.forEach(id => this.opcodes.delete(id));
    
    // Remove axes
    const axesToRemove: AxisId[] = [];
    Array.from(this.axes.entries()).forEach(([id, p]) => {
      if (p.namespace === namespace) {
        axesToRemove.push(id);
      }
    });
    axesToRemove.forEach(id => this.axes.delete(id));
    
    // Remove chains
    const chainsToRemove: string[] = [];
    Array.from(this.chains.entries()).forEach(([id, chain]) => {
      if (chain.source.namespace === namespace) {
        chainsToRemove.push(id);
      }
    });
    chainsToRemove.forEach(id => this.chains.delete(id));
  }
  
  /**
   * Get summary statistics
   */
  getSummary(): {
    totalNamespaces: number;
    totalLexemes: number;
    totalConstraints: number;
    totalOpcodes: number;
    totalAxes: number;
    totalChains: number;
  } {
    return {
      totalNamespaces: this.getAllNamespaces().length,
      totalLexemes: this.lexemes.size,
      totalConstraints: this.constraints.size,
      totalOpcodes: this.opcodes.size,
      totalAxes: this.axes.size,
      totalChains: this.chains.size
    };
  }
}

/**
 * Global provenance registry singleton
 */
export const provenanceRegistry = new ProvenanceRegistry();

// ============================================================================
// Conflict Detection
// ============================================================================

/**
 * Detect namespace conflicts
 */
export interface NamespaceConflict {
  readonly type: 'duplicate-lexeme' | 'duplicate-constraint' | 'duplicate-opcode' | 'duplicate-axis';
  readonly id: GofaiId;
  readonly existing: ContributionProvenance;
  readonly new: ContributionProvenance;
  readonly resolution: 'reject' | 'warn' | 'override';
}

/**
 * Check for conflicts when registering new provenance
 */
export function checkNamespaceConflicts(
  registry: ProvenanceRegistry,
  newProvenance: ContributionProvenance,
  id: GofaiId,
  type: 'lexeme' | 'constraint' | 'opcode' | 'axis'
): readonly NamespaceConflict[] {
  const conflicts: NamespaceConflict[] = [];
  
  let existing: ContributionProvenance | undefined;
  
  switch (type) {
    case 'lexeme':
      existing = registry.getLexemeProvenance(id as unknown as LexemeId);
      break;
    case 'constraint':
      existing = registry.getConstraintProvenance(id as unknown as ConstraintTypeId);
      break;
    case 'opcode':
      existing = registry.getOpcodeProvenance(id as unknown as OpcodeId);
      break;
    case 'axis':
      existing = registry.getAxisProvenance(id as unknown as AxisId);
      break;
  }
  
  if (existing) {
    // Same namespace: version conflict
    if (existing.namespace === newProvenance.namespace) {
      conflicts.push({
        type: `duplicate-${type}` as any,
        id,
        existing,
        new: newProvenance,
        resolution: 'override' // Allow same namespace to update
      });
    } else {
      // Different namespace: conflict
      conflicts.push({
        type: `duplicate-${type}` as any,
        id,
        existing,
        new: newProvenance,
        resolution: 'reject' // Different namespaces cannot clash
      });
    }
  }
  
  return conflicts;
}

// ============================================================================
// Provenance Display
// ============================================================================

/**
 * Format provenance for user display
 */
export function formatProvenanceForDisplay(provenance: ContributionProvenance): string {
  const parts: string[] = [];
  
  parts.push(`from ${provenance.namespace}@${provenance.version}`);
  
  if (provenance.attribution) {
    parts.push(`by ${provenance.attribution}`);
  }
  
  if (provenance.moduleId) {
    parts.push(`(${provenance.moduleId})`);
  }
  
  return parts.join(' ');
}

/**
 * Format provenance chain for debugging
 */
export function formatProvenanceChainForDebug(chain: ProvenanceChain): string {
  const lines: string[] = [];
  
  lines.push(`Source: ${formatProvenanceForDisplay(chain.source)}`);
  lines.push('');
  
  if (chain.stages.length > 0) {
    lines.push('Pipeline stages:');
    for (const stage of chain.stages) {
      lines.push(`  ${stage.stage} (${stage.durationMs}ms)`);
    }
    lines.push('');
  }
  
  if (chain.transformations.length > 0) {
    lines.push('Transformations:');
    for (const t of chain.transformations) {
      lines.push(`  ${t.type}: ${t.description}`);
    }
    lines.push('');
  }
  
  if (chain.output) {
    lines.push(`Output: ${chain.output.outputType} (${chain.output.outputId})`);
  }
  
  return lines.join('\n');
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if an ID belongs to a specific namespace
 */
export function idBelongsToNamespace(id: GofaiId, namespace: ExtensionNamespace): boolean {
  // IDs are namespaced: namespace:type:name
  return id.startsWith(`${namespace}:`);
}

/**
 * Extract namespace from an ID
 */
export function extractNamespaceFromId(id: GofaiId): ExtensionNamespace | undefined {
  const parts = id.split(':');
  if (parts.length >= 3 && isValidNamespace(parts[0])) {
    return parts[0] as ExtensionNamespace;
  }
  return undefined;
}

/**
 * Check if an ID is builtin (no namespace)
 */
export function isBuiltinId(id: GofaiId): boolean {
  return extractNamespaceFromId(id) === undefined;
}
