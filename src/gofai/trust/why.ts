/**
 * Why (Explanation) Trust Primitive
 *
 * The "why" system provides complete provenance chains from user utterance
 * to final edit. Every decision GOFAI makes can be traced back through
 * a chain of explicit reasoning steps.
 *
 * ## Chain Structure
 *
 * ```
 * User says "make the chorus brighter"
 *   → Token "brighter" matched lexeme lex:adj:bright (comparatives.ts:42)
 *     → Semantic rule sem:comparative produced Goal(axis=brightness, dir=increase)
 *       → Pragmatic rule prag:scope resolved "the chorus" to Chorus 2 (bars 49-65)
 *         → Planner selected lever: shift_register(+7) on harmony layer
 *           → Execution: 12 note events transposed up 7 semitones
 * ```
 *
 * ## Design Principles
 *
 * 1. **Complete chains**: Every CPL node has a provenance path to source text
 * 2. **Rule IDs**: Every semantic/pragmatic decision references a named rule
 * 3. **Alternatives**: Why-chains can show what was NOT chosen and why
 * 4. **Levels**: Chains can be rendered at user-level or developer-level
 *
 * @module gofai/trust/why
 */

// =============================================================================
// Why Node Kinds
// =============================================================================

/**
 * The kind of reasoning step in a why-chain.
 */
export type WhyNodeKind =
  | 'lexeme_match'       // Token matched a lexicon entry
  | 'grammar_rule'       // Grammar rule produced a parse node
  | 'semantic_rule'      // Semantic composition rule produced CPL
  | 'pragmatic_rule'     // Pragmatic resolution bound a reference
  | 'default_applied'    // A default value was used
  | 'clarification'      // User answered a clarification question
  | 'constraint_check'   // Constraint was validated
  | 'lever_selection'    // Planner chose a lever
  | 'cost_comparison'    // Cost model selected among alternatives
  | 'plan_step'          // Plan step was generated
  | 'execution_step'     // Mutation was applied
  | 'user_override';     // User explicitly overrode a default

// =============================================================================
// Provenance Links
// =============================================================================

/**
 * A link in the provenance chain, connecting a reasoning step to its source.
 */
export interface ProvenanceLink {
  /** The source text span this link originates from */
  readonly sourceSpan?: { readonly start: number; readonly end: number; readonly text: string };

  /** The lexeme ID involved (if applicable) */
  readonly lexemeId?: string;

  /** The rule ID that produced this reasoning step */
  readonly ruleId?: string;

  /** The grammar rule file and line (for developer mode) */
  readonly ruleLocation?: string;

  /** The CPL node ID this link produced */
  readonly cplNodeId?: string;

  /** The plan step index this link contributed to */
  readonly planStepIndex?: number;
}

// =============================================================================
// Decision Reasons
// =============================================================================

/**
 * A structured reason for a decision, suitable for both user and developer display.
 */
export interface DecisionReason {
  /** Short reason for user display */
  readonly userReason: string;

  /** Detailed reason for developer display */
  readonly developerReason: string;

  /** What alternatives were considered */
  readonly alternatives?: readonly AlternativeConsidered[];

  /** Confidence level of this decision */
  readonly confidence: 'certain' | 'default' | 'heuristic';
}

/**
 * An alternative that was considered but rejected.
 */
export interface AlternativeConsidered {
  /** What the alternative was */
  readonly description: string;

  /** Why it was rejected */
  readonly rejectionReason: string;

  /** Score comparison (if applicable) */
  readonly score?: number;
}

// =============================================================================
// Why Nodes
// =============================================================================

/**
 * A single node in a why-chain (one reasoning step).
 */
export interface WhyNode {
  /** Unique node ID within the chain */
  readonly id: string;

  /** Kind of reasoning step */
  readonly kind: WhyNodeKind;

  /** Human-readable summary of what happened */
  readonly summary: string;

  /** Provenance link back to source */
  readonly provenance: ProvenanceLink;

  /** Structured decision reason */
  readonly reason: DecisionReason;

  /** Child nodes (reasoning steps that followed from this one) */
  readonly children: readonly WhyNode[];

  /** Depth in the reasoning chain (0 = root) */
  readonly depth: number;
}

// =============================================================================
// Why Chain
// =============================================================================

/**
 * A complete why-chain: a tree of reasoning from utterance to edit.
 *
 * The chain has a tree structure because one utterance can produce
 * multiple parallel reasoning paths (e.g., multiple goals each
 * selecting different levers).
 */
export interface WhyChain {
  /** Root node (the initial utterance) */
  readonly root: WhyNode;

  /** All nodes in breadth-first order (for flat iteration) */
  readonly allNodes: readonly WhyNode[];

  /** Total number of reasoning steps */
  readonly stepCount: number;

  /** Number of defaults applied (useful for trust assessment) */
  readonly defaultCount: number;

  /** Number of user overrides/clarifications */
  readonly userDecisionCount: number;
}

// =============================================================================
// Why Explanation (Top-Level)
// =============================================================================

/**
 * The top-level explanation artifact for a GOFAI operation.
 *
 * This wraps the why-chain with additional context and formatting
 * helpers for the UI.
 */
export interface WhyExplanation {
  /** Unique explanation ID (tied to the edit package) */
  readonly id: string;

  /** The original utterance */
  readonly utterance: string;

  /** The why-chain (full provenance tree) */
  readonly chain: WhyChain;

  /** User-level narrative explanation (paragraph form) */
  readonly narrative: string;

  /** Bullet-point explanation (for quick display) */
  readonly bullets: readonly ExplanationBullet[];

  /** Technical explanation (for developer mode) */
  readonly technical: readonly TechnicalStep[];
}

/**
 * A bullet point in the user-facing explanation.
 */
export interface ExplanationBullet {
  /** Category icon */
  readonly icon: 'understood' | 'resolved' | 'planned' | 'changed' | 'preserved';

  /** Bullet text */
  readonly text: string;
}

/**
 * A technical step for developer-mode display.
 */
export interface TechnicalStep {
  /** Pipeline stage */
  readonly stage: 'tokenize' | 'parse' | 'semantics' | 'pragmatics' | 'typecheck' | 'plan' | 'execute';

  /** Rule or function name */
  readonly ruleName: string;

  /** Input summary */
  readonly input: string;

  /** Output summary */
  readonly output: string;

  /** Duration in microseconds */
  readonly durationUs: number;
}

// =============================================================================
// Builder Functions
// =============================================================================

/**
 * Build a why-chain from a list of reasoning steps.
 *
 * This constructs the tree structure by nesting nodes according to
 * their parent relationships.
 */
export function buildWhyChain(
  rootSummary: string,
  steps: readonly WhyStep[],
): WhyChain {
  // Build root node
  const root = buildWhyNode('why-root', 'lexeme_match', rootSummary, {}, {
    userReason: rootSummary,
    developerReason: rootSummary,
    confidence: 'certain',
  }, 0);

  // Process steps into tree
  const nodeMap = new Map<string, WhyNode>();
  nodeMap.set('why-root', root);

  let defaultCount = 0;
  let userDecisionCount = 0;

  const allNodes: WhyNode[] = [root];

  for (const step of steps) {
    const node = buildWhyNode(
      step.id,
      step.kind,
      step.summary,
      step.provenance,
      step.reason,
      step.depth,
    );
    allNodes.push(node);

    if (step.kind === 'default_applied') defaultCount++;
    if (step.kind === 'clarification' || step.kind === 'user_override') {
      userDecisionCount++;
    }

    // Attach to parent
    const parent = nodeMap.get(step.parentId ?? 'why-root');
    if (parent) {
      // WhyNode.children is readonly, so we build the tree immutably
      // by reconstructing the parent with the new child
      const updatedParent: WhyNode = {
        ...parent,
        children: [...parent.children, node],
      };
      nodeMap.set(parent.id, updatedParent);

      // Update in allNodes
      const parentIdx = allNodes.findIndex((n) => n.id === parent.id);
      if (parentIdx >= 0) {
        allNodes[parentIdx] = updatedParent;
      }
    }

    nodeMap.set(step.id, node);
  }

  const finalRoot = nodeMap.get('why-root') ?? root;

  return {
    root: finalRoot,
    allNodes,
    stepCount: allNodes.length,
    defaultCount,
    userDecisionCount,
  };
}

/**
 * Input step for building a why-chain.
 */
export interface WhyStep {
  readonly id: string;
  readonly kind: WhyNodeKind;
  readonly summary: string;
  readonly provenance: ProvenanceLink;
  readonly reason: DecisionReason;
  readonly depth: number;
  readonly parentId?: string;
}

/**
 * Build a narrative explanation from a why-chain.
 */
export function buildNarrative(chain: WhyChain): string {
  const parts: string[] = [];

  for (const node of chain.allNodes) {
    switch (node.kind) {
      case 'lexeme_match':
        if (node.depth === 0) {
          parts.push(`Understood: ${node.summary}`);
        }
        break;
      case 'semantic_rule':
        parts.push(`Interpreted as: ${node.summary}`);
        break;
      case 'pragmatic_rule':
        parts.push(`Resolved: ${node.summary}`);
        break;
      case 'default_applied':
        parts.push(`Used default: ${node.summary}`);
        break;
      case 'lever_selection':
        parts.push(`Planned: ${node.summary}`);
        break;
      case 'execution_step':
        parts.push(`Changed: ${node.summary}`);
        break;
    }
  }

  return parts.join('. ') + '.';
}

/**
 * Build bullet-point explanation from a why-chain.
 */
export function buildBullets(chain: WhyChain): ExplanationBullet[] {
  const bullets: ExplanationBullet[] = [];

  for (const node of chain.allNodes) {
    let icon: ExplanationBullet['icon'];
    switch (node.kind) {
      case 'lexeme_match':
      case 'grammar_rule':
        icon = 'understood';
        break;
      case 'pragmatic_rule':
      case 'clarification':
        icon = 'resolved';
        break;
      case 'lever_selection':
      case 'plan_step':
      case 'cost_comparison':
        icon = 'planned';
        break;
      case 'execution_step':
        icon = 'changed';
        break;
      case 'constraint_check':
        icon = 'preserved';
        break;
      default:
        icon = 'understood';
    }

    // Only include user-relevant nodes
    if (node.depth <= 2 || node.kind === 'execution_step') {
      bullets.push({ icon, text: node.summary });
    }
  }

  return bullets;
}

// =============================================================================
// Internal Helpers
// =============================================================================

function buildWhyNode(
  id: string,
  kind: WhyNodeKind,
  summary: string,
  provenance: ProvenanceLink,
  reason: DecisionReason,
  depth: number,
): WhyNode {
  return {
    id,
    kind,
    summary,
    provenance,
    reason,
    children: [],
    depth,
  };
}
