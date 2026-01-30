/**
 * GOFAI NL Semantics — Meaning Provenance, MRS Underspecification,
 * Scope Resolution, Ellipsis Templates, and Metonymy Handling
 *
 * Steps 176–180:
 *   176: "Meaning provenance graph" — which words mapped to which CPL nodes
 *   177: MRS-like underspecification for scope ambiguities
 *   178: Scope resolution phase — resolve by rules or produce clarification
 *   179: Typed ellipsis templates ("same but bigger", "do that again")
 *   180: Typed metonymy handling ("the chorus" → section/harmony/arrangement)
 *
 * @module gofai/nl/semantics/meaning-provenance
 */

import type {
  CPLGoal,
  CPLHole,
  CPLHoleOption,
  CPLAmount,
} from '../../canon/cpl-types';

// =============================================================================
// § 176 — Meaning Provenance Graph
// =============================================================================

/**
 * A provenance graph node: a single mapping from source text → CPL node.
 */
export interface ProvenanceGraphNode {
  /** Unique ID for this provenance node */
  readonly id: string;
  /** The CPL node that was produced */
  readonly cplNodeId: string;
  /** CPL node type */
  readonly cplNodeType: string;
  /** Source text span [start, end] in the original utterance */
  readonly sourceSpan: readonly [number, number];
  /** The source text (substring of original utterance) */
  readonly sourceText: string;
  /** The pipeline stage that produced this mapping */
  readonly stage: ProvenanceStage;
  /** The rule or mechanism that produced this mapping */
  readonly mechanism: ProvenanceMechanism;
  /** Confidence score (0–1) */
  readonly confidence: number;
  /** Parent provenance nodes (what this was derived from) */
  readonly parents: readonly string[];
  /** Tags for filtering/searching */
  readonly tags: readonly string[];
  /** Human-readable explanation */
  readonly explanation: string;
}

/**
 * Pipeline stage that produced a provenance mapping.
 */
export type ProvenanceStage =
  | 'tokenization'         // Token → lexeme
  | 'morphology'           // Morphological analysis
  | 'parsing'              // Syntactic parse
  | 'lexical-semantics'    // Lexeme → semantic representation
  | 'compositional'        // Compositional combination
  | 'frame-evocation'      // Frame semantics
  | 'discourse'            // Discourse operators
  | 'pragmatic-inference'  // Pragmatic reasoning
  | 'cpl-bridge'           // Semantic → CPL conversion
  | 'scope-resolution'     // Scope disambiguation
  | 'ellipsis-resolution'  // Ellipsis filling
  | 'metonymy-resolution'  // Metonymy resolution
  | 'default-filling'      // Default value insertion
  | 'user-clarification';  // User-provided clarification

/**
 * Mechanism that produced a provenance mapping.
 */
export interface ProvenanceMechanism {
  /** Mechanism type */
  readonly type: ProvenanceMechanismType;
  /** Rule ID (if rule-based) */
  readonly ruleId?: string;
  /** Rule name (human-readable) */
  readonly ruleName?: string;
  /** Additional details */
  readonly details?: string;
}

export type ProvenanceMechanismType =
  | 'lexicon-lookup'       // Looked up in vocabulary
  | 'grammar-rule'         // Applied grammar rule
  | 'composition-rule'     // Applied composition rule
  | 'frame-mapping'        // Frame → CPL mapping
  | 'discourse-cue'        // Discourse cue word
  | 'affective-mapping'    // Affective adjective → axis bundle
  | 'impact-phrase'        // Impact phrase → axis bundle
  | 'emotion-mapping'      // Complex emotion → axis bundle
  | 'scope-default'        // Default scope assignment
  | 'constraint-inference' // Inferred constraint
  | 'preference-inference' // Inferred preference
  | 'ellipsis-template'    // Ellipsis resolution template
  | 'metonymy-resolution'  // Metonymy resolution
  | 'pragmatic-default'    // Pragmatic default
  | 'user-input';          // Direct user clarification

/**
 * An edge in the provenance graph: a relationship between provenance nodes.
 */
export interface ProvenanceEdge {
  /** Source node ID */
  readonly from: string;
  /** Target node ID */
  readonly to: string;
  /** Relationship type */
  readonly relation: ProvenanceRelation;
  /** Optional weight/strength */
  readonly weight?: number;
}

export type ProvenanceRelation =
  | 'derived-from'    // Target was derived from source
  | 'composed-with'   // Source was composed with another to form target
  | 'triggered-by'    // Source triggered the creation of target
  | 'overridden-by'   // Source was overridden by target
  | 'constrained-by'  // Source is constrained by target
  | 'disambiguated'   // Source was disambiguated to target
  | 'expanded-to'     // Source (ellipsis/metonymy) expanded to target
  | 'clarified-as';   // Source was clarified as target by user

/**
 * Complete meaning provenance graph.
 */
export interface MeaningProvenanceGraph {
  /** The original utterance */
  readonly utterance: string;
  /** All provenance nodes */
  readonly nodes: readonly ProvenanceGraphNode[];
  /** All edges between nodes */
  readonly edges: readonly ProvenanceEdge[];
  /** Root nodes (entry points — typically tokenization stage) */
  readonly roots: readonly string[];
  /** Leaf nodes (final CPL nodes) */
  readonly leaves: readonly string[];
  /** Timestamp of graph creation */
  readonly createdAt: number;
}

/**
 * Builder for constructing a provenance graph incrementally.
 */
export class ProvenanceGraphBuilder {
  private readonly _nodes: ProvenanceGraphNode[] = [];
  private readonly _edges: ProvenanceEdge[] = [];
  private readonly _roots: string[] = [];
  private readonly _leaves: Set<string> = new Set();
  private _nodeCounter = 0;

  constructor(private readonly utterance: string) {}

  /**
   * Generate a unique node ID.
   */
  private nextId(): string {
    return `prov-${++this._nodeCounter}`;
  }

  /**
   * Add a provenance node.
   */
  addNode(
    params: Omit<ProvenanceGraphNode, 'id'> & { id?: string },
  ): string {
    const id = params.id ?? this.nextId();
    const node: ProvenanceGraphNode = { ...params, id };
    this._nodes.push(node);
    this._leaves.add(id);

    if (node.parents.length === 0) {
      this._roots.push(id);
    }

    return id;
  }

  /**
   * Add an edge between two provenance nodes.
   */
  addEdge(
    from: string,
    to: string,
    relation: ProvenanceRelation,
    weight?: number,
  ): void {
    this._edges.push(Object.assign(
      { from, to, relation },
      weight !== undefined ? { weight } : {},
    ) as ProvenanceEdge);
    // 'from' is no longer a leaf since it has an outgoing derivation
    // Actually, leaves are nodes with no outgoing 'derived-from' edges targeting them
    // Let's just compute leaves at build time
  }

  /**
   * Add a lexical provenance entry (token → lexeme → semantic).
   */
  addLexicalProvenance(
    sourceText: string,
    span: readonly [number, number],
    cplNodeId: string,
    cplNodeType: string,
    lexemeId: string,
    confidence: number = 1.0,
  ): string {
    return this.addNode({
      cplNodeId,
      cplNodeType,
      sourceSpan: span,
      sourceText,
      stage: 'lexical-semantics',
      mechanism: {
        type: 'lexicon-lookup',
        ruleId: lexemeId,
        ruleName: `Lexeme: ${lexemeId}`,
      },
      confidence,
      parents: [],
      tags: ['lexical', lexemeId],
      explanation: `"${sourceText}" mapped to ${cplNodeType} via lexeme ${lexemeId}`,
    });
  }

  /**
   * Add a composition provenance entry.
   */
  addCompositionProvenance(
    parentIds: readonly string[],
    cplNodeId: string,
    cplNodeType: string,
    ruleId: string,
    ruleName: string,
    confidence: number = 1.0,
  ): string {
    // Compute span from parents
    let minStart = Infinity;
    let maxEnd = -Infinity;
    const parentTexts: string[] = [];
    for (const pid of parentIds) {
      const parent = this._nodes.find(n => n.id === pid);
      if (parent) {
        minStart = Math.min(minStart, parent.sourceSpan[0]);
        maxEnd = Math.max(maxEnd, parent.sourceSpan[1]);
        parentTexts.push(parent.sourceText);
      }
    }

    const span: readonly [number, number] = [
      minStart === Infinity ? 0 : minStart,
      maxEnd === -Infinity ? 0 : maxEnd,
    ];

    const nodeId = this.addNode({
      cplNodeId,
      cplNodeType,
      sourceSpan: span,
      sourceText: this.utterance.slice(span[0], span[1]),
      stage: 'compositional',
      mechanism: {
        type: 'composition-rule',
        ruleId,
        ruleName,
      },
      confidence,
      parents: [...parentIds],
      tags: ['compositional', ruleId],
      explanation: `Composed ${parentTexts.join(' + ')} via ${ruleName} → ${cplNodeType}`,
    });

    for (const pid of parentIds) {
      this.addEdge(pid, nodeId, 'derived-from');
    }

    return nodeId;
  }

  /**
   * Add a frame evocation provenance entry.
   */
  addFrameProvenance(
    sourceText: string,
    span: readonly [number, number],
    cplNodeId: string,
    cplNodeType: string,
    frameId: string,
    frameName: string,
    confidence: number = 0.9,
  ): string {
    return this.addNode({
      cplNodeId,
      cplNodeType,
      sourceSpan: span,
      sourceText,
      stage: 'frame-evocation',
      mechanism: {
        type: 'frame-mapping',
        ruleId: frameId,
        ruleName: `Frame: ${frameName}`,
      },
      confidence,
      parents: [],
      tags: ['frame', frameId, frameName],
      explanation: `"${sourceText}" evoked frame "${frameName}" → ${cplNodeType}`,
    });
  }

  /**
   * Add an affective/impact provenance entry.
   */
  addAffectiveProvenance(
    sourceText: string,
    span: readonly [number, number],
    cplNodeId: string,
    cplNodeType: string,
    adjective: string,
    mechanismType: 'affective-mapping' | 'impact-phrase' | 'emotion-mapping',
    confidence: number = 0.85,
  ): string {
    return this.addNode({
      cplNodeId,
      cplNodeType,
      sourceSpan: span,
      sourceText,
      stage: 'pragmatic-inference',
      mechanism: {
        type: mechanismType,
        ruleName: `Affective: ${adjective}`,
        details: `Mapped "${adjective}" to axis bundle`,
      },
      confidence,
      parents: [],
      tags: ['affective', adjective, mechanismType],
      explanation: `"${sourceText}" → affective adjective "${adjective}" → ${cplNodeType}`,
    });
  }

  /**
   * Add a default/inference provenance entry.
   */
  addDefaultProvenance(
    cplNodeId: string,
    cplNodeType: string,
    reason: string,
    parentIds: readonly string[] = [],
  ): string {
    // Default nodes cover the full utterance
    const span: readonly [number, number] = [0, this.utterance.length];

    const nodeId = this.addNode({
      cplNodeId,
      cplNodeType,
      sourceSpan: span,
      sourceText: '(inferred)',
      stage: 'default-filling',
      mechanism: {
        type: 'pragmatic-default',
        details: reason,
      },
      confidence: 0.5,
      parents: [...parentIds],
      tags: ['default', 'inferred'],
      explanation: `Default ${cplNodeType}: ${reason}`,
    });

    for (const pid of parentIds) {
      this.addEdge(pid, nodeId, 'triggered-by');
    }

    return nodeId;
  }

  /**
   * Build the final provenance graph.
   */
  build(): MeaningProvenanceGraph {
    // Compute leaves: nodes that are not the 'from' of any 'derived-from' edge
    const nonLeaves = new Set<string>();
    for (const edge of this._edges) {
      if (edge.relation === 'derived-from') {
        nonLeaves.add(edge.from);
      }
    }
    const leaves = this._nodes
      .filter(n => !nonLeaves.has(n.id))
      .map(n => n.id);

    return {
      utterance: this.utterance,
      nodes: [...this._nodes],
      edges: [...this._edges],
      roots: [...this._roots],
      leaves,
      createdAt: Date.now(),
    };
  }
}

/**
 * Query the provenance graph for a specific CPL node.
 */
export function queryProvenance(
  graph: MeaningProvenanceGraph,
  cplNodeId: string,
): readonly ProvenanceGraphNode[] {
  return graph.nodes.filter(n => n.cplNodeId === cplNodeId);
}

/**
 * Get the ancestry chain for a provenance node.
 */
export function getProvenanceAncestry(
  graph: MeaningProvenanceGraph,
  nodeId: string,
): readonly ProvenanceGraphNode[] {
  const result: ProvenanceGraphNode[] = [];
  const visited = new Set<string>();
  const queue = [nodeId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const node = graph.nodes.find(n => n.id === current);
    if (node) {
      result.push(node);
      for (const parentId of node.parents) {
        queue.push(parentId);
      }
    }
  }

  return result;
}

/**
 * Format provenance graph as human-readable text.
 */
export function formatProvenanceGraph(graph: MeaningProvenanceGraph): string {
  const lines: string[] = [];
  lines.push(`Provenance graph for: "${graph.utterance}"`);
  lines.push(`  Nodes: ${graph.nodes.length}, Edges: ${graph.edges.length}`);
  lines.push('');

  // Group nodes by stage
  const stageGroups = new Map<ProvenanceStage, ProvenanceGraphNode[]>();
  for (const node of graph.nodes) {
    const group = stageGroups.get(node.stage);
    if (group) {
      group.push(node);
    } else {
      stageGroups.set(node.stage, [node]);
    }
  }

  for (const [stage, nodes] of stageGroups) {
    lines.push(`  Stage: ${stage}`);
    for (const node of nodes) {
      const conf = (node.confidence * 100).toFixed(0);
      lines.push(`    [${node.id}] "${node.sourceText}" → ${node.cplNodeType} (${conf}% conf)`);
      lines.push(`      ${node.explanation}`);
      if (node.parents.length > 0) {
        lines.push(`      Parents: ${node.parents.join(', ')}`);
      }
    }
  }

  if (graph.edges.length > 0) {
    lines.push('');
    lines.push('  Edges:');
    for (const edge of graph.edges) {
      lines.push(`    ${edge.from} --[${edge.relation}]--> ${edge.to}`);
    }
  }

  return lines.join('\n');
}

/**
 * Explain a single CPL node's provenance in natural language.
 */
export function explainProvenance(
  graph: MeaningProvenanceGraph,
  cplNodeId: string,
): string {
  const nodes = queryProvenance(graph, cplNodeId);
  if (nodes.length === 0) {
    return `No provenance found for CPL node "${cplNodeId}"`;
  }

  const lines: string[] = [];
  lines.push(`CPL node "${cplNodeId}" was produced by:`);

  for (const node of nodes) {
    const ancestry = getProvenanceAncestry(graph, node.id);
    const chain = ancestry.map(a => `"${a.sourceText}"@${a.stage}`).join(' → ');
    lines.push(`  ${node.explanation}`);
    lines.push(`    Chain: ${chain}`);
    lines.push(`    Confidence: ${(node.confidence * 100).toFixed(0)}%`);
  }

  return lines.join('\n');
}

// =============================================================================
// § 177 — MRS-Like Underspecification for Scope Ambiguities
// =============================================================================

/**
 * An MRS (Minimal Recursion Semantics) handle variable.
 * Handles are used to represent scope without committing to a tree.
 */
export interface MRSHandle {
  /** Handle ID (h1, h2, ...) */
  readonly id: string;
  /** Whether this handle has been resolved */
  readonly resolved: boolean;
  /** If resolved, the EP it points to */
  readonly pointsTo?: string; // EP id
}

/**
 * An Elementary Predication (EP) in MRS.
 */
export interface MRSElementaryPredication {
  /** EP ID */
  readonly id: string;
  /** The label (handle) for this EP */
  readonly label: string; // Handle ID
  /** Predicate name */
  readonly predicate: string;
  /** Arguments: role → value (handle or variable) */
  readonly arguments: ReadonlyMap<string, string>;
  /** CPL node this EP corresponds to */
  readonly cplNodeId?: string;
  /** Source text */
  readonly sourceText?: string;
}

/**
 * A handle constraint in MRS: qeq (equal-or-outscopes).
 *
 * `handleA =q handleB` means handleA's denotation equals handleB
 * or outscopes it (handleB is somewhere in the scope of handleA).
 */
export interface MRSHandleConstraint {
  /** The higher handle */
  readonly hi: string; // Handle ID
  /** The lower handle */
  readonly lo: string; // Handle ID
  /** Constraint type */
  readonly type: 'qeq' | 'geq' | 'leq';
}

/**
 * MRS variable.
 */
export interface MRSVariable {
  /** Variable ID (x1, e2, ...) */
  readonly id: string;
  /** Variable type */
  readonly varType: MRSVariableType;
  /** Features */
  readonly features: ReadonlyMap<string, string>;
}

export type MRSVariableType =
  | 'x'  // Entity
  | 'e'  // Event
  | 'h'  // Handle
  | 'i'  // Individual (underspecified)
  | 'u'  // Unbound
  | 'p'; // Property

/**
 * A complete MRS representation.
 */
export interface MRS {
  /** Top handle (the root of the scope tree) */
  readonly topHandle: string;
  /** Index variable (usually the main event) */
  readonly index: string;
  /** Elementary predications */
  readonly eps: readonly MRSElementaryPredication[];
  /** Handle constraints */
  readonly handleConstraints: readonly MRSHandleConstraint[];
  /** Variables */
  readonly variables: readonly MRSVariable[];
  /** Whether this MRS is fully resolved (no scope ambiguity) */
  readonly fullyResolved: boolean;
  /** Number of possible scopings */
  readonly scopingCount: number;
}

/**
 * Builder for MRS structures.
 */
export class MRSBuilder {
  private readonly _eps: MRSElementaryPredication[] = [];
  private readonly _constraints: MRSHandleConstraint[] = [];
  private readonly _variables: MRSVariable[] = [];
  private readonly _handles = new Map<string, MRSHandle>();
  private _handleCounter = 0;
  private _varCounter = 0;
  private _topHandle = '';
  private _index = '';

  /**
   * Create a new handle.
   */
  newHandle(): string {
    const id = `h${++this._handleCounter}`;
    this._handles.set(id, { id, resolved: false });
    return id;
  }

  /**
   * Create a new variable.
   */
  newVariable(varType: MRSVariableType, features?: ReadonlyMap<string, string>): string {
    const id = `${varType}${++this._varCounter}`;
    this._variables.push({
      id,
      varType,
      features: features ?? new Map(),
    });
    return id;
  }

  /**
   * Set the top handle.
   */
  setTopHandle(handle: string): void {
    this._topHandle = handle;
  }

  /**
   * Set the index variable.
   */
  setIndex(variable: string): void {
    this._index = variable;
  }

  /**
   * Add an elementary predication.
   */
  addEP(
    label: string,
    predicate: string,
    args: ReadonlyMap<string, string>,
    options?: { cplNodeId?: string; sourceText?: string },
  ): string {
    const id = `ep-${this._eps.length + 1}`;
    this._eps.push(Object.assign(
      { id, label, predicate, arguments: args },
      options?.cplNodeId ? { cplNodeId: options.cplNodeId } : {},
      options?.sourceText ? { sourceText: options.sourceText } : {},
    ) as MRSElementaryPredication);
    return id;
  }

  /**
   * Add a qeq handle constraint.
   */
  addQeq(hi: string, lo: string): void {
    this._constraints.push({ hi, lo, type: 'qeq' });
  }

  /**
   * Build the MRS.
   */
  build(): MRS {
    const scopingCount = this.estimateScopingCount();
    return {
      topHandle: this._topHandle,
      index: this._index,
      eps: [...this._eps],
      handleConstraints: [...this._constraints],
      variables: [...this._variables],
      fullyResolved: scopingCount <= 1,
      scopingCount,
    };
  }

  /**
   * Estimate the number of possible scopings.
   * This is a simplified heuristic — full MRS enumeration is NP-hard.
   */
  private estimateScopingCount(): number {
    // Count quantifier EPs (those that scope)
    const quantEps = this._eps.filter(ep =>
      ep.predicate.startsWith('every') ||
      ep.predicate.startsWith('some') ||
      ep.predicate.startsWith('no') ||
      ep.predicate.startsWith('most') ||
      ep.predicate.startsWith('all') ||
      ep.predicate.startsWith('each') ||
      ep.predicate.includes('_q_'),
    );

    if (quantEps.length <= 1) return 1;

    // n! possible orderings for n quantifiers (Catalan number approximation)
    let factorial = 1;
    for (let i = 2; i <= quantEps.length; i++) {
      factorial *= i;
    }
    return factorial;
  }
}

/**
 * Format an MRS structure as human-readable text.
 */
export function formatMRS(mrs: MRS): string {
  const lines: string[] = [];
  lines.push(`MRS (${mrs.fullyResolved ? 'RESOLVED' : `UNDERSPECIFIED: ${mrs.scopingCount} scoping(s)`})`);
  lines.push(`  TOP: ${mrs.topHandle}`);
  lines.push(`  INDEX: ${mrs.index}`);
  lines.push('');

  lines.push('  EPs:');
  for (const ep of mrs.eps) {
    const args = [...ep.arguments.entries()].map(([k, v]) => `${k}:${v}`).join(', ');
    const src = ep.sourceText ? ` ("${ep.sourceText}")` : '';
    lines.push(`    ${ep.label}: ${ep.predicate}(${args})${src}`);
  }

  if (mrs.handleConstraints.length > 0) {
    lines.push('');
    lines.push('  Handle constraints:');
    for (const c of mrs.handleConstraints) {
      lines.push(`    ${c.hi} ${c.type} ${c.lo}`);
    }
  }

  return lines.join('\n');
}

// =============================================================================
// § 178 — Scope Resolution Phase
// =============================================================================

/**
 * A scope resolution strategy.
 */
export type ScopeResolutionStrategy =
  | 'default-wide'    // Give widest scope to first quantifier
  | 'default-narrow'  // Give narrowest scope (left-to-right surface)
  | 'syntactic'       // Follow syntactic structure
  | 'pragmatic-bias'  // Use pragmatic biases
  | 'ask-user';       // Produce clarification question

/**
 * Result of scope resolution.
 */
export interface ScopeResolutionResult {
  /** Whether resolution succeeded */
  readonly resolved: boolean;
  /** The chosen scoping (if resolved) */
  readonly chosenScoping?: ScopeAssignment;
  /** All candidate scopings considered */
  readonly candidates: readonly ScopeAssignment[];
  /** Clarification question (if not resolved) */
  readonly clarificationQuestion?: ClarificationQuestion;
  /** Strategy used */
  readonly strategy: ScopeResolutionStrategy;
  /** Confidence in the resolution */
  readonly confidence: number;
  /** Explanation */
  readonly explanation: string;
}

/**
 * A specific scope assignment: which quantifier outscopes which.
 */
export interface ScopeAssignment {
  /** Assignment ID */
  readonly id: string;
  /** Handle → EP label assignments */
  readonly assignments: ReadonlyMap<string, string>;
  /** Pragmatic plausibility score (0–1) */
  readonly plausibility: number;
  /** Natural language reading of this scoping */
  readonly reading: string;
}

/**
 * A clarification question for unresolvable scope ambiguity.
 */
export interface ClarificationQuestion {
  /** Question text */
  readonly question: string;
  /** Options */
  readonly options: readonly ClarificationOption[];
  /** Context for the clarification */
  readonly context: string;
  /** Priority */
  readonly priority: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * An option for a clarification question.
 */
export interface ClarificationOption {
  /** Option ID */
  readonly id: string;
  /** Display text */
  readonly text: string;
  /** The scope assignment this option corresponds to */
  readonly assignment: ScopeAssignment;
}

/**
 * Scope resolution rules database.
 */
export interface ScopeResolutionRule {
  /** Rule ID */
  readonly id: string;
  /** Rule name */
  readonly name: string;
  /** Rule description */
  readonly description: string;
  /** Priority (higher = applied first) */
  readonly priority: number;
  /** Applicable when... */
  readonly condition: ScopeRuleCondition;
  /** Preferred scoping */
  readonly preference: 'wide' | 'narrow' | 'surface-order';
  /** Confidence boost for this preference */
  readonly confidenceBoost: number;
}

/**
 * Condition for when a scope rule applies.
 */
export interface ScopeRuleCondition {
  /** Quantifier types involved */
  readonly quantifiers?: readonly string[];
  /** Syntactic position relationship */
  readonly syntacticRelation?: string;
  /** Discourse context */
  readonly discourseContext?: string;
}

/**
 * Built-in scope resolution rules.
 */
export const SCOPE_RESOLUTION_RULES: readonly ScopeResolutionRule[] = [
  {
    id: 'sr-surface-default',
    name: 'Surface Order Default',
    description: 'By default, quantifiers scope in left-to-right (surface) order',
    priority: 10,
    condition: {},
    preference: 'surface-order',
    confidenceBoost: 0.3,
  },
  {
    id: 'sr-universal-wide',
    name: 'Universal Wide Scope',
    description: 'Universal quantifiers ("every", "all", "each") tend to take wide scope',
    priority: 20,
    condition: { quantifiers: ['every', 'all', 'each'] },
    preference: 'wide',
    confidenceBoost: 0.4,
  },
  {
    id: 'sr-existential-narrow',
    name: 'Existential Narrow Scope',
    description: 'Existential quantifiers ("a", "some") tend to take narrow scope under universals',
    priority: 15,
    condition: { quantifiers: ['a', 'some', 'any'] },
    preference: 'narrow',
    confidenceBoost: 0.3,
  },
  {
    id: 'sr-definite-widest',
    name: 'Definite Description Widest',
    description: 'Definite descriptions ("the X") take widest scope (presuppositional)',
    priority: 30,
    condition: { quantifiers: ['the', 'this', 'that'] },
    preference: 'wide',
    confidenceBoost: 0.5,
  },
  {
    id: 'sr-negation-scope',
    name: 'Negation Scope',
    description: 'Negation ("don\'t", "not") scopes over its clause',
    priority: 25,
    condition: { quantifiers: ['not', 'no', 'never'] },
    preference: 'surface-order',
    confidenceBoost: 0.4,
  },
  {
    id: 'sr-music-section-scope',
    name: 'Musical Section Scope',
    description: 'Section references ("in the chorus") scope over the entire instruction',
    priority: 35,
    condition: {
      discourseContext: 'musical-section-reference',
    },
    preference: 'wide',
    confidenceBoost: 0.6,
  },
  {
    id: 'sr-only-scope',
    name: 'Only Scope',
    description: '"Only" scopes over its focus constituent',
    priority: 28,
    condition: { quantifiers: ['only', 'just'] },
    preference: 'narrow',
    confidenceBoost: 0.5,
  },
  {
    id: 'sr-music-preserve-scope',
    name: 'Preserve Wide Scope',
    description: '"Keep/preserve" constraints take wide scope over changes',
    priority: 32,
    condition: {
      discourseContext: 'preservation-context',
    },
    preference: 'wide',
    confidenceBoost: 0.5,
  },
];

/**
 * Attempt to resolve scope ambiguity in an MRS.
 */
export function resolveScopes(
  mrs: MRS,
  strategy: ScopeResolutionStrategy = 'pragmatic-bias',
): ScopeResolutionResult {
  // If already resolved, return immediately
  if (mrs.fullyResolved) {
    return {
      resolved: true,
      candidates: [],
      strategy,
      confidence: 1.0,
      explanation: 'MRS is already fully resolved (no scope ambiguity)',
    };
  }

  // For the 'ask-user' strategy, always produce a clarification
  if (strategy === 'ask-user') {
    return produceScopeClarification(mrs);
  }

  // Try rule-based resolution
  const candidates = enumerateScopings(mrs);
  if (candidates.length === 0) {
    return {
      resolved: false,
      candidates: [],
      strategy,
      confidence: 0,
      explanation: 'No valid scopings found',
    };
  }

  if (candidates.length === 1) {
    const first = candidates[0] as ScopeAssignment;
    return {
      resolved: true,
      chosenScoping: first,
      candidates,
      strategy,
      confidence: 1.0,
      explanation: 'Only one valid scoping exists',
    };
  }

  // Apply rules to rank candidates
  const rankedCandidates = rankScopings(candidates, strategy);
  const best = rankedCandidates[0] as ScopeAssignment | undefined;
  const secondBest = rankedCandidates[1] as ScopeAssignment | undefined;

  if (!best) {
    return {
      resolved: false,
      candidates: rankedCandidates,
      strategy,
      confidence: 0,
      explanation: 'No valid scopings after ranking',
    };
  }

  // If the best is significantly better than second-best, choose it
  const gap = secondBest ? best.plausibility - secondBest.plausibility : 1.0;

  if (gap >= 0.2) {
    return {
      resolved: true,
      chosenScoping: best,
      candidates: rankedCandidates,
      strategy,
      confidence: Math.min(best.plausibility, 0.95),
      explanation: `Chose scoping "${best.reading}" with confidence ${(best.plausibility * 100).toFixed(0)}%`,
    };
  }

  // Too close — ask for clarification
  return produceScopeClarification(mrs, rankedCandidates);
}

/**
 * Enumerate possible scopings for an MRS.
 * Simplified: generates permutations of quantifier scope ordering.
 */
function enumerateScopings(mrs: MRS): ScopeAssignment[] {
  // Find quantifier EPs
  const quantEps = mrs.eps.filter(ep =>
    ep.predicate.includes('_q_') ||
    ep.predicate.startsWith('every') ||
    ep.predicate.startsWith('some') ||
    ep.predicate.startsWith('all') ||
    ep.predicate.startsWith('the') ||
    ep.predicate.startsWith('no'),
  );

  if (quantEps.length <= 1) {
    return [{
      id: 'scoping-1',
      assignments: new Map(),
      plausibility: 1.0,
      reading: 'Default (single or no quantifier)',
    }];
  }

  // Generate permutations (up to 6 quantifiers → 720 permutations max)
  const perms = permutations(quantEps.map(ep => ep.id));
  const scopings: ScopeAssignment[] = [];

  for (let i = 0; i < perms.length; i++) {
    const perm = perms[i];
    if (!perm) continue;
    const assignments = new Map<string, string>();
    for (let j = 0; j < perm.length; j++) {
      const epId = perm[j];
      if (!epId) continue;
      assignments.set(epId, `scope-${j}`);
    }

    const reading = perm.map(epId => {
      const ep = quantEps.find(e => e.id === epId);
      return ep ? ep.predicate : epId;
    }).join(' > ');

    scopings.push({
      id: `scoping-${i + 1}`,
      assignments,
      plausibility: 0.5, // Will be adjusted by ranking
      reading,
    });
  }

  return scopings;
}

/**
 * Generate permutations of an array (up to reasonable size).
 */
function permutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  if (arr.length > 6) {
    // Limit to avoid combinatorial explosion
    return [arr, [...arr].reverse()];
  }

  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i] as T;
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    const restPerms = permutations(rest);
    for (const perm of restPerms) {
      result.push([item, ...perm]);
    }
  }
  return result;
}

/**
 * Rank scopings using resolution rules.
 */
function rankScopings(
  candidates: readonly ScopeAssignment[],
  strategy: ScopeResolutionStrategy,
): ScopeAssignment[] {
  const ranked = candidates.map(c => ({
    ...c,
    plausibility: computePlausibility(c, strategy),
  }));

  ranked.sort((a, b) => b.plausibility - a.plausibility);
  return ranked;
}

/**
 * Compute plausibility score for a scoping.
 */
function computePlausibility(
  _candidate: ScopeAssignment,
  strategy: ScopeResolutionStrategy,
): number {
  let score = 0.5;

  switch (strategy) {
    case 'default-wide':
      // Prefer the first assignment (wide scope to first quantifier)
      score += 0.3;
      break;
    case 'default-narrow':
      // Prefer surface order
      score += 0.2;
      break;
    case 'syntactic':
      score += 0.25;
      break;
    case 'pragmatic-bias':
      // Apply each applicable rule
      for (const rule of SCOPE_RESOLUTION_RULES) {
        score += rule.confidenceBoost * 0.1; // Small boost per rule
      }
      break;
    default:
      break;
  }

  return Math.min(score, 1.0);
}

/**
 * Produce a clarification question for scope ambiguity.
 */
function produceScopeClarification(
  mrs: MRS,
  rankedCandidates?: readonly ScopeAssignment[],
): ScopeResolutionResult {
  const candidates = rankedCandidates ?? enumerateScopings(mrs);
  const topCandidates = candidates.slice(0, 3); // At most 3 options

  const options: ClarificationOption[] = topCandidates.map((c, i) => ({
    id: `opt-${i + 1}`,
    text: c.reading,
    assignment: c,
  }));

  return {
    resolved: false,
    candidates: [...candidates],
    clarificationQuestion: {
      question: 'This instruction is ambiguous. Which reading did you mean?',
      options,
      context: `The MRS has ${mrs.scopingCount} possible interpretations`,
      priority: 'medium',
    },
    strategy: 'ask-user',
    confidence: 0,
    explanation: `Scope ambiguity with ${mrs.scopingCount} possible readings; asking user to clarify`,
  };
}

// =============================================================================
// § 179 — Typed Ellipsis Templates
// =============================================================================

/**
 * An ellipsis template: a pattern for resolving elliptical expressions.
 */
export interface EllipsisTemplate {
  /** Template ID */
  readonly id: string;
  /** Template name */
  readonly name: string;
  /** Category */
  readonly category: EllipsisCategory;
  /** Trigger phrases */
  readonly triggers: readonly string[];
  /** What the ellipsis refers back to */
  readonly antecedentType: EllipsisAntecedentType;
  /** How to transform the antecedent */
  readonly transformation: EllipsisTransformation;
  /** Example */
  readonly example: string;
  /** Explanation */
  readonly explanation: string;
}

export type EllipsisCategory =
  | 'same-action'        // "do that again"
  | 'modified-repeat'    // "same but bigger"
  | 'parallel-action'    // "same thing for the bass"
  | 'continuation'       // "and also the reverb"
  | 'correction'         // "actually, make it louder"
  | 'comparison'         // "like the chorus but different"
  | 'negation-ellipsis'; // "not that much"

export type EllipsisAntecedentType =
  | 'last-action'    // The most recent action/edit
  | 'last-goal'      // The most recent goal
  | 'last-scope'     // The most recent scope
  | 'last-amount'    // The most recent amount
  | 'last-entity'    // The most recent entity reference
  | 'last-plan'      // The most recent plan
  | 'full-context';  // The full prior context

/**
 * How to transform an ellipsis antecedent.
 */
export interface EllipsisTransformation {
  /** Transformation type */
  readonly type: EllipsisTransformationType;
  /** Parameters for the transformation */
  readonly params: ReadonlyMap<string, string>;
}

export type EllipsisTransformationType =
  | 'identity'            // Repeat exactly
  | 'scale-amount'        // Scale the amount (bigger/smaller)
  | 'change-scope'        // Apply to different scope
  | 'change-direction'    // Reverse direction
  | 'add-modifier'        // Add an extra modifier
  | 'remove-modifier'     // Remove a modifier
  | 'combine-with-prior'  // Combine with prior action
  | 'negate';             // Negate the action

/**
 * Database of ellipsis templates.
 */
export const ELLIPSIS_TEMPLATES: readonly EllipsisTemplate[] = [
  // ── Same Action ──
  {
    id: 'ell-do-again',
    name: 'Do That Again',
    category: 'same-action',
    triggers: ['do that again', 'again', 'same thing', 'repeat', 'one more time', 'do it again', 'same again'],
    antecedentType: 'last-action',
    transformation: { type: 'identity', params: new Map() },
    example: '"Make the bass louder" → "Do that again" = "Make the bass louder (again)"',
    explanation: 'Repeats the most recent action exactly',
  },
  {
    id: 'ell-more-of-same',
    name: 'More of the Same',
    category: 'same-action',
    triggers: ['more of that', 'keep going', 'more', 'even more', 'continue'],
    antecedentType: 'last-goal',
    transformation: {
      type: 'scale-amount',
      params: new Map([['factor', '1.5']]),
    },
    example: '"Make it brighter" → "More" = "Make it even brighter (1.5x)"',
    explanation: 'Applies the same goal with increased intensity',
  },
  // ── Modified Repeat ──
  {
    id: 'ell-same-but-bigger',
    name: 'Same But Bigger',
    category: 'modified-repeat',
    triggers: ['same but bigger', 'same but more', 'same but louder', 'same but stronger'],
    antecedentType: 'last-goal',
    transformation: {
      type: 'scale-amount',
      params: new Map([['factor', '2.0']]),
    },
    example: '"Add reverb" → "Same but bigger" = "Add more reverb (2x)"',
    explanation: 'Repeats with doubled intensity',
  },
  {
    id: 'ell-same-but-smaller',
    name: 'Same But Smaller',
    category: 'modified-repeat',
    triggers: ['same but smaller', 'same but less', 'same but quieter', 'same but subtler', 'just a touch'],
    antecedentType: 'last-goal',
    transformation: {
      type: 'scale-amount',
      params: new Map([['factor', '0.5']]),
    },
    example: '"Make it warmer" → "Same but subtler" = "Make it a little warmer (0.5x)"',
    explanation: 'Repeats with halved intensity',
  },
  {
    id: 'ell-same-but-opposite',
    name: 'Same But Opposite',
    category: 'modified-repeat',
    triggers: ['opposite', 'the opposite', 'reverse that', 'undo direction', 'other way'],
    antecedentType: 'last-goal',
    transformation: {
      type: 'change-direction',
      params: new Map(),
    },
    example: '"Make it brighter" → "Opposite" = "Make it darker"',
    explanation: 'Applies the same goal in the opposite direction',
  },
  // ── Parallel Action ──
  {
    id: 'ell-same-for',
    name: 'Same For Other Entity',
    category: 'parallel-action',
    triggers: ['same thing for', 'do the same for', 'same for', 'also for', 'and for'],
    antecedentType: 'last-action',
    transformation: {
      type: 'change-scope',
      params: new Map([['scopeSource', 'following-text']]),
    },
    example: '"Make the bass louder" → "Same for the guitar" = "Make the guitar louder"',
    explanation: 'Applies the same action to a different entity/scope',
  },
  {
    id: 'ell-everywhere',
    name: 'Apply Everywhere',
    category: 'parallel-action',
    triggers: ['everywhere', 'all of them', 'across the board', 'globally', 'to everything'],
    antecedentType: 'last-action',
    transformation: {
      type: 'change-scope',
      params: new Map([['scopeTarget', 'whole-project']]),
    },
    example: '"Boost the chorus brightness" → "Everywhere" = "Boost brightness everywhere"',
    explanation: 'Extends the scope of the last action to the entire project',
  },
  // ── Continuation ──
  {
    id: 'ell-and-also',
    name: 'And Also',
    category: 'continuation',
    triggers: ['and also', 'also', 'plus', 'and', 'as well as', 'on top of that', 'additionally'],
    antecedentType: 'last-action',
    transformation: {
      type: 'combine-with-prior',
      params: new Map(),
    },
    example: '"Make it louder" → "And also warmer" = "Make it louder and warmer"',
    explanation: 'Adds a new goal alongside the previous one',
  },
  // ── Correction ──
  {
    id: 'ell-actually',
    name: 'Correction',
    category: 'correction',
    triggers: ['actually', 'wait', 'no', 'scratch that', 'instead', 'I meant', 'rather'],
    antecedentType: 'last-action',
    transformation: {
      type: 'identity', // The transformation depends on what follows
      params: new Map([['mode', 'replace']]),
    },
    example: '"Make it brighter" → "Actually, make it darker" = replaces brightness→darker',
    explanation: 'Replaces the most recent action with a new one',
  },
  // ── Comparison ──
  {
    id: 'ell-like-but',
    name: 'Like X But Different',
    category: 'comparison',
    triggers: ['like the', 'similar to', 'same as', 'match the', 'copy the'],
    antecedentType: 'last-entity',
    transformation: {
      type: 'add-modifier',
      params: new Map([['mode', 'clone-and-modify']]),
    },
    example: '"Like the chorus but quieter" = clone chorus settings, reduce volume',
    explanation: 'Clones the properties of a referenced section/entity with modifications',
  },
  // ── Negation Ellipsis ──
  {
    id: 'ell-not-that-much',
    name: 'Not That Much',
    category: 'negation-ellipsis',
    triggers: ['not that much', 'too much', 'back off', 'ease up', 'less than that', 'pull back', 'dial it back'],
    antecedentType: 'last-amount',
    transformation: {
      type: 'scale-amount',
      params: new Map([['factor', '0.5']]),
    },
    example: '"Make it much brighter" → "Not that much" = reduce amount by half',
    explanation: 'Reduces the amount of the last change',
  },
  {
    id: 'ell-way-more',
    name: 'Way More',
    category: 'negation-ellipsis',
    triggers: ['way more', 'much more', 'a lot more', 'way too little', 'not enough', 'crank it'],
    antecedentType: 'last-amount',
    transformation: {
      type: 'scale-amount',
      params: new Map([['factor', '3.0']]),
    },
    example: '"Add a little reverb" → "Way more" = triple the amount',
    explanation: 'Increases the amount dramatically',
  },
];

/**
 * Ellipsis template index by trigger phrase.
 */
export const ELLIPSIS_TRIGGER_INDEX: ReadonlyMap<string, EllipsisTemplate> = (() => {
  const index = new Map<string, EllipsisTemplate>();
  for (const template of ELLIPSIS_TEMPLATES) {
    for (const trigger of template.triggers) {
      if (!index.has(trigger)) {
        index.set(trigger, template);
      }
    }
  }
  return index;
})();

/**
 * Detect ellipsis patterns in text.
 */
export function detectEllipsis(text: string): readonly EllipsisTemplate[] {
  const lower = text.toLowerCase().trim();
  const matches: EllipsisTemplate[] = [];
  const seen = new Set<string>();

  for (const template of ELLIPSIS_TEMPLATES) {
    if (seen.has(template.id)) continue;
    for (const trigger of template.triggers) {
      if (lower.includes(trigger)) {
        matches.push(template);
        seen.add(template.id);
        break;
      }
    }
  }

  return matches;
}

/**
 * Result of resolving an ellipsis.
 */
export interface EllipsisResolutionResult {
  /** Whether the ellipsis was successfully resolved */
  readonly resolved: boolean;
  /** The template that matched */
  readonly template: EllipsisTemplate;
  /** The antecedent that was found */
  readonly antecedent?: EllipsisAntecedent;
  /** The resolved CPL goals (after transformation) */
  readonly resolvedGoals?: readonly CPLGoal[];
  /** Explanation of the resolution */
  readonly explanation: string;
  /** Provenance for the resolution */
  readonly provenanceNote: string;
}

/**
 * An ellipsis antecedent: what the ellipsis refers back to.
 */
export interface EllipsisAntecedent {
  /** Antecedent type */
  readonly type: EllipsisAntecedentType;
  /** CPL node IDs of the antecedent */
  readonly cplNodeIds: readonly string[];
  /** Human-readable description */
  readonly description: string;
}

/**
 * Resolve an ellipsis given context.
 */
export function resolveEllipsis(
  template: EllipsisTemplate,
  antecedent: EllipsisAntecedent | undefined,
  priorGoals: readonly CPLGoal[],
): EllipsisResolutionResult {
  if (!antecedent || priorGoals.length === 0) {
    return {
      resolved: false,
      template,
      explanation: `Cannot resolve "${template.name}": no prior context available`,
      provenanceNote: `Ellipsis "${template.name}" unresolved — no antecedent`,
    };
  }

  // Apply transformation based on type
  switch (template.transformation.type) {
    case 'identity': {
      return {
        resolved: true,
        template,
        antecedent,
        resolvedGoals: [...priorGoals],
        explanation: `Resolved "${template.name}": repeating prior goals exactly`,
        provenanceNote: `Ellipsis "${template.name}" resolved via identity transform`,
      };
    }
    case 'scale-amount': {
      const factorStr = template.transformation.params.get('factor') ?? '1.0';
      const factor = parseFloat(factorStr);
      const scaled = priorGoals.map(goal => {
        if (!goal.targetValue) return goal;
        const newValue = (goal.targetValue.value ?? 1) * factor;
        const newAmount: CPLAmount = {
          ...goal.targetValue,
          value: newValue,
        };
        return Object.assign({}, goal, { targetValue: newAmount });
      });
      return {
        resolved: true,
        template,
        antecedent,
        resolvedGoals: scaled,
        explanation: `Resolved "${template.name}": scaled amount by ${factor}x`,
        provenanceNote: `Ellipsis "${template.name}" resolved via scale-amount(${factor})`,
      };
    }
    case 'change-direction': {
      const reversed = priorGoals.map(goal => {
        const newDir = goal.direction === 'increase' ? 'decrease'
          : goal.direction === 'decrease' ? 'increase'
          : goal.direction;
        return Object.assign({}, goal, {
          direction: newDir,
          id: `${goal.id}-reversed`,
        });
      });
      return {
        resolved: true,
        template,
        antecedent,
        resolvedGoals: reversed,
        explanation: `Resolved "${template.name}": reversed direction of prior goals`,
        provenanceNote: `Ellipsis "${template.name}" resolved via change-direction`,
      };
    }
    case 'change-scope':
    case 'add-modifier':
    case 'remove-modifier':
    case 'combine-with-prior':
    case 'negate': {
      // These require additional context (the new scope, modifier, etc.)
      // Return partial resolution — the caller must supply the missing pieces
      return {
        resolved: true,
        template,
        antecedent,
        resolvedGoals: [...priorGoals],
        explanation: `Resolved "${template.name}": ${template.transformation.type} applied (may need additional context)`,
        provenanceNote: `Ellipsis "${template.name}" partially resolved via ${template.transformation.type}`,
      };
    }
  }
}

// =============================================================================
// § 180 — Typed Metonymy Handling for Music Talk
// =============================================================================

/**
 * A metonymy pattern: when a musical term can refer to multiple things.
 */
export interface MetonymyPattern {
  /** Pattern ID */
  readonly id: string;
  /** The surface expression (e.g., "the chorus") */
  readonly expression: string;
  /** Trigger words/phrases */
  readonly triggers: readonly string[];
  /** Possible referents */
  readonly candidates: readonly MetonymyCandidate[];
  /** Default referent (if context doesn't disambiguate) */
  readonly defaultCandidate: string;
  /** Whether this metonymy is common (high frequency) */
  readonly frequency: 'high' | 'medium' | 'low';
}

/**
 * A candidate referent for a metonymy.
 */
export interface MetonymyCandidate {
  /** Candidate ID */
  readonly id: string;
  /** What this candidate refers to */
  readonly referentType: MetonymyReferentType;
  /** Human-readable description */
  readonly description: string;
  /** CPL node type this would produce */
  readonly cplNodeType: string;
  /** Contextual cues that favor this reading */
  readonly contextualCues: readonly string[];
  /** Prior probability (0–1) */
  readonly priorProbability: number;
}

export type MetonymyReferentType =
  | 'section-time'        // The time span of the section
  | 'section-events'      // The notes/events in the section
  | 'section-harmony'     // The chord progression in the section
  | 'section-melody'      // The melody in the section
  | 'section-rhythm'      // The rhythmic pattern
  | 'section-arrangement' // The instrumentation/arrangement
  | 'section-mix'         // The mix settings (levels, panning, effects)
  | 'section-dynamics'    // The dynamic contour
  | 'track-content'       // The content of a track
  | 'track-settings'      // The settings (volume, pan, effects)
  | 'track-instrument'    // The instrument on a track
  | 'card-settings'       // The card parameters
  | 'card-effect'         // The effect a card produces
  | 'layer-events'        // The events in a layer
  | 'layer-settings';     // The layer settings

/**
 * Database of musical metonymy patterns.
 */
export const METONYMY_PATTERNS: readonly MetonymyPattern[] = [
  {
    id: 'met-chorus',
    expression: 'the chorus',
    triggers: ['chorus', 'the chorus', 'chorus section'],
    candidates: [
      {
        id: 'chorus-time',
        referentType: 'section-time',
        description: 'The time span of the chorus',
        cplNodeType: 'scope',
        contextualCues: ['in', 'during', 'at', 'before', 'after', 'from', 'to'],
        priorProbability: 0.35,
      },
      {
        id: 'chorus-events',
        referentType: 'section-events',
        description: 'The notes and events in the chorus',
        cplNodeType: 'selector',
        contextualCues: ['change', 'edit', 'modify', 'add', 'remove', 'move'],
        priorProbability: 0.25,
      },
      {
        id: 'chorus-harmony',
        referentType: 'section-harmony',
        description: 'The chord progression in the chorus',
        cplNodeType: 'selector',
        contextualCues: ['chords', 'harmony', 'progression', 'key', 'harmonic'],
        priorProbability: 0.15,
      },
      {
        id: 'chorus-melody',
        referentType: 'section-melody',
        description: 'The melody in the chorus',
        cplNodeType: 'selector',
        contextualCues: ['melody', 'tune', 'melodic', 'notes', 'pitch'],
        priorProbability: 0.1,
      },
      {
        id: 'chorus-arrangement',
        referentType: 'section-arrangement',
        description: 'The instrumentation/arrangement of the chorus',
        cplNodeType: 'selector',
        contextualCues: ['instruments', 'arrangement', 'orchestration', 'parts', 'layers'],
        priorProbability: 0.1,
      },
      {
        id: 'chorus-mix',
        referentType: 'section-mix',
        description: 'The mix settings during the chorus',
        cplNodeType: 'selector',
        contextualCues: ['mix', 'levels', 'volume', 'pan', 'effects', 'eq', 'reverb'],
        priorProbability: 0.05,
      },
    ],
    defaultCandidate: 'chorus-time',
    frequency: 'high',
  },
  {
    id: 'met-verse',
    expression: 'the verse',
    triggers: ['verse', 'the verse', 'verse section'],
    candidates: [
      {
        id: 'verse-time',
        referentType: 'section-time',
        description: 'The time span of the verse',
        cplNodeType: 'scope',
        contextualCues: ['in', 'during', 'at', 'before', 'after'],
        priorProbability: 0.35,
      },
      {
        id: 'verse-events',
        referentType: 'section-events',
        description: 'The notes and events in the verse',
        cplNodeType: 'selector',
        contextualCues: ['change', 'edit', 'modify', 'add', 'remove'],
        priorProbability: 0.25,
      },
      {
        id: 'verse-harmony',
        referentType: 'section-harmony',
        description: 'The chord progression in the verse',
        cplNodeType: 'selector',
        contextualCues: ['chords', 'harmony', 'progression'],
        priorProbability: 0.15,
      },
      {
        id: 'verse-melody',
        referentType: 'section-melody',
        description: 'The melody in the verse',
        cplNodeType: 'selector',
        contextualCues: ['melody', 'tune', 'melodic'],
        priorProbability: 0.1,
      },
      {
        id: 'verse-arrangement',
        referentType: 'section-arrangement',
        description: 'The arrangement in the verse',
        cplNodeType: 'selector',
        contextualCues: ['instruments', 'arrangement', 'parts'],
        priorProbability: 0.1,
      },
      {
        id: 'verse-mix',
        referentType: 'section-mix',
        description: 'The mix during the verse',
        cplNodeType: 'selector',
        contextualCues: ['mix', 'levels', 'volume', 'effects'],
        priorProbability: 0.05,
      },
    ],
    defaultCandidate: 'verse-time',
    frequency: 'high',
  },
  {
    id: 'met-bridge',
    expression: 'the bridge',
    triggers: ['bridge', 'the bridge', 'bridge section', 'middle eight'],
    candidates: [
      {
        id: 'bridge-time',
        referentType: 'section-time',
        description: 'The time span of the bridge',
        cplNodeType: 'scope',
        contextualCues: ['in', 'during', 'at'],
        priorProbability: 0.35,
      },
      {
        id: 'bridge-events',
        referentType: 'section-events',
        description: 'The notes in the bridge',
        cplNodeType: 'selector',
        contextualCues: ['change', 'edit', 'modify'],
        priorProbability: 0.25,
      },
      {
        id: 'bridge-harmony',
        referentType: 'section-harmony',
        description: 'The harmony in the bridge',
        cplNodeType: 'selector',
        contextualCues: ['chords', 'harmony', 'progression'],
        priorProbability: 0.2,
      },
      {
        id: 'bridge-arrangement',
        referentType: 'section-arrangement',
        description: 'The arrangement of the bridge',
        cplNodeType: 'selector',
        contextualCues: ['instruments', 'arrangement', 'parts'],
        priorProbability: 0.1,
      },
      {
        id: 'bridge-dynamics',
        referentType: 'section-dynamics',
        description: 'The dynamic contour of the bridge',
        cplNodeType: 'selector',
        contextualCues: ['dynamics', 'louder', 'softer', 'build'],
        priorProbability: 0.1,
      },
    ],
    defaultCandidate: 'bridge-time',
    frequency: 'medium',
  },
  {
    id: 'met-drop',
    expression: 'the drop',
    triggers: ['drop', 'the drop'],
    candidates: [
      {
        id: 'drop-time',
        referentType: 'section-time',
        description: 'The time span of the drop',
        cplNodeType: 'scope',
        contextualCues: ['in', 'during', 'at', 'before', 'after'],
        priorProbability: 0.3,
      },
      {
        id: 'drop-events',
        referentType: 'section-events',
        description: 'The events in the drop',
        cplNodeType: 'selector',
        contextualCues: ['change', 'edit', 'modify'],
        priorProbability: 0.2,
      },
      {
        id: 'drop-arrangement',
        referentType: 'section-arrangement',
        description: 'The arrangement at the drop',
        cplNodeType: 'selector',
        contextualCues: ['instruments', 'arrangement', 'layers', 'parts'],
        priorProbability: 0.2,
      },
      {
        id: 'drop-dynamics',
        referentType: 'section-dynamics',
        description: 'The dynamic impact of the drop',
        cplNodeType: 'selector',
        contextualCues: ['impact', 'hit', 'punch', 'energy', 'loud'],
        priorProbability: 0.2,
      },
      {
        id: 'drop-mix',
        referentType: 'section-mix',
        description: 'The mix at the drop',
        cplNodeType: 'selector',
        contextualCues: ['mix', 'levels', 'effects'],
        priorProbability: 0.1,
      },
    ],
    defaultCandidate: 'drop-time',
    frequency: 'high',
  },
  {
    id: 'met-bass',
    expression: 'the bass',
    triggers: ['the bass', 'bass'],
    candidates: [
      {
        id: 'bass-track',
        referentType: 'track-content',
        description: 'The bass track content (notes/events)',
        cplNodeType: 'selector',
        contextualCues: ['notes', 'pattern', 'line', 'riff', 'groove', 'play', 'change'],
        priorProbability: 0.35,
      },
      {
        id: 'bass-settings',
        referentType: 'track-settings',
        description: 'The bass track settings (volume, pan, effects)',
        cplNodeType: 'selector',
        contextualCues: ['volume', 'level', 'pan', 'eq', 'compress', 'mix', 'louder', 'quieter'],
        priorProbability: 0.3,
      },
      {
        id: 'bass-instrument',
        referentType: 'track-instrument',
        description: 'The bass instrument/sound',
        cplNodeType: 'selector',
        contextualCues: ['sound', 'tone', 'timbre', 'synth', 'patch', 'preset', 'instrument'],
        priorProbability: 0.2,
      },
      {
        id: 'bass-frequency',
        referentType: 'section-mix',
        description: 'The bass frequency range in the mix',
        cplNodeType: 'selector',
        contextualCues: ['frequency', 'low end', 'sub', 'rumble', 'boom', 'muddy'],
        priorProbability: 0.15,
      },
    ],
    defaultCandidate: 'bass-settings',
    frequency: 'high',
  },
  {
    id: 'met-drums',
    expression: 'the drums',
    triggers: ['the drums', 'drums', 'drum track', 'beat'],
    candidates: [
      {
        id: 'drums-pattern',
        referentType: 'track-content',
        description: 'The drum pattern (hits, fills)',
        cplNodeType: 'selector',
        contextualCues: ['pattern', 'beat', 'fill', 'groove', 'rhythm', 'play', 'change', 'add'],
        priorProbability: 0.35,
      },
      {
        id: 'drums-settings',
        referentType: 'track-settings',
        description: 'The drum track settings',
        cplNodeType: 'selector',
        contextualCues: ['volume', 'level', 'pan', 'eq', 'compress', 'mix', 'louder'],
        priorProbability: 0.3,
      },
      {
        id: 'drums-instrument',
        referentType: 'track-instrument',
        description: 'The drum kit/sounds',
        cplNodeType: 'selector',
        contextualCues: ['sound', 'kit', 'sample', 'tone', 'snare', 'kick', 'hat'],
        priorProbability: 0.2,
      },
      {
        id: 'drums-dynamics',
        referentType: 'section-dynamics',
        description: 'The drum dynamics',
        cplNodeType: 'selector',
        contextualCues: ['dynamics', 'velocity', 'accent', 'ghost', 'harder', 'softer'],
        priorProbability: 0.15,
      },
    ],
    defaultCandidate: 'drums-pattern',
    frequency: 'high',
  },
  {
    id: 'met-vocal',
    expression: 'the vocals',
    triggers: ['the vocals', 'vocals', 'the voice', 'voice', 'singing', 'vocal track'],
    candidates: [
      {
        id: 'vocal-performance',
        referentType: 'track-content',
        description: 'The vocal performance/recording',
        cplNodeType: 'selector',
        contextualCues: ['take', 'performance', 'recording', 'melody', 'lyrics'],
        priorProbability: 0.25,
      },
      {
        id: 'vocal-settings',
        referentType: 'track-settings',
        description: 'The vocal track settings (level, effects)',
        cplNodeType: 'selector',
        contextualCues: ['volume', 'level', 'effects', 'reverb', 'delay', 'eq', 'compress'],
        priorProbability: 0.35,
      },
      {
        id: 'vocal-sound',
        referentType: 'track-instrument',
        description: 'The vocal sound/character',
        cplNodeType: 'selector',
        contextualCues: ['sound', 'tone', 'timbre', 'character', 'bright', 'warm', 'airy'],
        priorProbability: 0.25,
      },
      {
        id: 'vocal-mix-presence',
        referentType: 'section-mix',
        description: 'The vocal presence in the mix',
        cplNodeType: 'selector',
        contextualCues: ['presence', 'upfront', 'buried', 'sit', 'blend', 'cut through'],
        priorProbability: 0.15,
      },
    ],
    defaultCandidate: 'vocal-settings',
    frequency: 'high',
  },
  {
    id: 'met-mix',
    expression: 'the mix',
    triggers: ['the mix', 'mix', 'the overall mix', 'overall'],
    candidates: [
      {
        id: 'mix-balance',
        referentType: 'section-mix',
        description: 'The overall balance (levels, panning)',
        cplNodeType: 'selector',
        contextualCues: ['balance', 'levels', 'louder', 'quieter', 'pan', 'center'],
        priorProbability: 0.35,
      },
      {
        id: 'mix-tonality',
        referentType: 'section-mix',
        description: 'The overall tonal balance',
        cplNodeType: 'selector',
        contextualCues: ['bright', 'dark', 'warm', 'cold', 'muddy', 'harsh', 'eq'],
        priorProbability: 0.25,
      },
      {
        id: 'mix-dynamics',
        referentType: 'section-dynamics',
        description: 'The overall dynamics/loudness',
        cplNodeType: 'selector',
        contextualCues: ['dynamics', 'loud', 'quiet', 'compression', 'limiter', 'punch'],
        priorProbability: 0.2,
      },
      {
        id: 'mix-space',
        referentType: 'section-mix',
        description: 'The overall spatial image',
        cplNodeType: 'selector',
        contextualCues: ['wide', 'narrow', 'depth', 'space', 'stereo', '3D'],
        priorProbability: 0.2,
      },
    ],
    defaultCandidate: 'mix-balance',
    frequency: 'high',
  },
];

/**
 * Metonymy trigger index for fast lookup.
 */
export const METONYMY_TRIGGER_INDEX: ReadonlyMap<string, MetonymyPattern> = (() => {
  const index = new Map<string, MetonymyPattern>();
  for (const pattern of METONYMY_PATTERNS) {
    for (const trigger of pattern.triggers) {
      if (!index.has(trigger)) {
        index.set(trigger, pattern);
      }
    }
  }
  return index;
})();

/**
 * Result of metonymy resolution.
 */
export interface MetonymyResolutionResult {
  /** Whether the metonymy was resolved to a single candidate */
  readonly resolved: boolean;
  /** The pattern that matched */
  readonly pattern: MetonymyPattern;
  /** The chosen candidate (if resolved) */
  readonly chosenCandidate?: MetonymyCandidate;
  /** All candidates with updated probabilities */
  readonly rankedCandidates: readonly MetonymyScoredCandidate[];
  /** CPL hole (if not resolved — for the caller to present to user) */
  readonly hole?: CPLHole;
  /** Explanation */
  readonly explanation: string;
}

/**
 * A candidate with a contextual score.
 */
export interface MetonymyScoredCandidate {
  readonly candidate: MetonymyCandidate;
  readonly score: number;
}

/**
 * Detect metonymy patterns in text.
 */
export function detectMetonymy(text: string): readonly MetonymyPattern[] {
  const lower = text.toLowerCase();
  const matches: MetonymyPattern[] = [];
  const seen = new Set<string>();

  for (const pattern of METONYMY_PATTERNS) {
    if (seen.has(pattern.id)) continue;
    for (const trigger of pattern.triggers) {
      if (lower.includes(trigger)) {
        matches.push(pattern);
        seen.add(pattern.id);
        break;
      }
    }
  }

  return matches;
}

/**
 * Resolve metonymy given contextual text.
 *
 * Uses contextual cues in the surrounding text to disambiguate.
 */
export function resolveMetonymy(
  pattern: MetonymyPattern,
  contextText: string,
): MetonymyResolutionResult {
  const lower = contextText.toLowerCase();

  // Score each candidate by counting contextual cue matches
  const scored: MetonymyScoredCandidate[] = pattern.candidates.map(candidate => {
    let score = candidate.priorProbability;

    for (const cue of candidate.contextualCues) {
      if (lower.includes(cue)) {
        score += 0.15; // Boost for each matching cue
      }
    }

    return { candidate, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  const best = scored[0];
  const secondBest = scored[1];

  if (!best) {
    return {
      resolved: false,
      pattern,
      rankedCandidates: scored,
      explanation: 'No candidates available',
    };
  }

  // If the best is significantly ahead, resolve
  const gap = secondBest ? best.score - secondBest.score : 1.0;

  if (gap >= 0.15 || best.score >= 0.6) {
    return {
      resolved: true,
      pattern,
      chosenCandidate: best.candidate,
      rankedCandidates: scored,
      explanation: `Resolved "${pattern.expression}" to "${best.candidate.description}" (score: ${best.score.toFixed(2)})`,
    };
  }

  // Too close — produce a hole for the user
  const options: CPLHoleOption[] = scored.slice(0, 4).map((s, i) => ({
    id: `metonymy-opt-${i}`,
    description: s.candidate.description,
    resolution: s.candidate.id as string,
    confidence: s.score,
  }));

  const hole: CPLHole = {
    type: 'hole',
    id: `hole-metonymy-${pattern.id}-${Date.now()}`,
    holeKind: 'ambiguous-reference',
    priority: 'medium',
    question: `When you say "${pattern.expression}", do you mean ${scored.slice(0, 3).map(s => s.candidate.description).join(', or ')}?`,
    options,
    defaultOption: 0,
  };

  return {
    resolved: false,
    pattern,
    rankedCandidates: scored,
    hole,
    explanation: `"${pattern.expression}" is ambiguous between ${scored.slice(0, 3).map(s => s.candidate.description).join(' and ')}`,
  };
}

/**
 * Format a metonymy resolution result as human-readable text.
 */
export function formatMetonymyResolution(result: MetonymyResolutionResult): string {
  const lines: string[] = [];
  lines.push(`Metonymy: "${result.pattern.expression}"`);

  if (result.resolved && result.chosenCandidate) {
    lines.push(`  → Resolved to: ${result.chosenCandidate.description}`);
    lines.push(`    Type: ${result.chosenCandidate.referentType}`);
  } else {
    lines.push('  → AMBIGUOUS');
    if (result.hole) {
      lines.push(`  Question: ${result.hole.question}`);
    }
  }

  lines.push('  Candidates:');
  for (const sc of result.rankedCandidates) {
    const marker = result.chosenCandidate?.id === sc.candidate.id ? ' ★' : '';
    lines.push(`    ${sc.candidate.description}: ${sc.score.toFixed(2)}${marker}`);
  }

  return lines.join('\n');
}
