/**
 * GOFAI Semantic Provenance — Tracing CPL Nodes to Source
 *
 * Step 026 [Type]: Every CPL node retains spans + lexeme IDs + rule IDs
 * that created it. This module defines the provenance data structures and
 * utilities for tracing any CPL node back to its source.
 *
 * ## Architecture
 *
 * Provenance flows through the pipeline as follows:
 *
 * ```
 * Source Text → Tokens (with spans)
 *            → Parse Nodes (with rule IDs + child spans)
 *            → Semantic Terms (with lexeme IDs + composition rules)
 *            → CPL Nodes (with full provenance chain)
 *            → Plan Steps (with all contributing provenance)
 * ```
 *
 * Each node in the CPL tree carries a `Provenance` record that includes:
 *
 * 1. **Source Spans**: Exact character offsets in the original input
 * 2. **Lexeme IDs**: Which canonical lexemes were matched
 * 3. **Rule IDs**: Which parse/composition/pragmatic rules fired
 * 4. **Stage Trail**: Which pipeline stages contributed
 * 5. **Decision Trail**: Key decisions and their rationale
 * 6. **Default Trail**: Any defaults that were applied
 *
 * This supports:
 * - "Why" explanations: trace back any node to the user's words
 * - Scope highlighting: show which source words map to which plan elements
 * - Debugging: identify which rule is responsible for unexpected behavior
 * - Determinism verification: full replay from provenance records
 *
 * @module gofai/pipeline/provenance
 */

import type { LexemeId } from '../canon/types';
import type { PipelineStageId } from './types';

// =============================================================================
// Core Provenance Types
// =============================================================================

/**
 * Unique identifier for a provenance record.
 * Every CPL node, plan step, or intermediate representation carries one.
 */
export type ProvenanceId = string & { readonly __brand: 'ProvenanceId' };

/**
 * Create a ProvenanceId.
 */
export function provenanceId(id: string): ProvenanceId {
  return id as ProvenanceId;
}

/**
 * Counter for generating unique provenance IDs within a compilation.
 */
let _provenanceCounter = 0;

/**
 * Generate a new unique provenance ID.
 * Deterministic within a compilation (based on counter).
 */
export function nextProvenanceId(): ProvenanceId {
  return provenanceId(`prov-${++_provenanceCounter}`);
}

/**
 * Reset the provenance counter (for testing or new compilations).
 */
export function resetProvenanceCounter(): void {
  _provenanceCounter = 0;
}

/**
 * Unique identifier for a parse rule.
 */
export type RuleId = string & { readonly __brand: 'RuleId' };

/**
 * Create a RuleId.
 */
export function ruleId(id: string): RuleId {
  return id as RuleId;
}

/**
 * Unique identifier for a semantic composition step.
 */
export type CompositionId = string & { readonly __brand: 'CompositionId' };

/**
 * Create a CompositionId.
 */
export function compositionId(id: string): CompositionId {
  return id as CompositionId;
}

// =============================================================================
// Source Spans
// =============================================================================

/**
 * A span of text in the original user input.
 * Character offsets are 0-based, end is exclusive.
 */
export interface SourceSpan {
  /** Start character offset (0-based, inclusive). */
  readonly start: number;
  /** End character offset (0-based, exclusive). */
  readonly end: number;
  /** The original substring (for display/debugging). */
  readonly text: string;
}

/**
 * Create a SourceSpan.
 */
export function sourceSpan(start: number, end: number, text: string): SourceSpan {
  return { start, end, text };
}

/**
 * Merge multiple spans into a single span covering all of them.
 * Assumes spans are from the same input string.
 */
export function mergeSpans(spans: readonly SourceSpan[]): SourceSpan | undefined {
  if (spans.length === 0) return undefined;
  let minStart = Infinity;
  let maxEnd = -Infinity;
  const texts: string[] = [];
  for (const span of spans) {
    if (span.start < minStart) minStart = span.start;
    if (span.end > maxEnd) maxEnd = span.end;
    texts.push(span.text);
  }
  return {
    start: minStart,
    end: maxEnd,
    text: texts.join(' '),
  };
}

/**
 * Check if two spans overlap.
 */
export function spansOverlap(a: SourceSpan, b: SourceSpan): boolean {
  return a.start < b.end && b.start < a.end;
}

/**
 * Check if span `inner` is fully contained within span `outer`.
 */
export function spanContains(outer: SourceSpan, inner: SourceSpan): boolean {
  return outer.start <= inner.start && inner.end <= outer.end;
}

// =============================================================================
// Lexeme References
// =============================================================================

/**
 * A reference to a canonical lexeme that was matched during parsing.
 */
export interface LexemeReference {
  /** The canonical lexeme ID from the vocabulary. */
  readonly lexemeId: LexemeId;
  /** The surface form found in the input (may differ from canonical). */
  readonly surfaceForm: string;
  /** The span in the source where this lexeme was matched. */
  readonly span: SourceSpan;
  /** Whether this was an exact match or a fuzzy/normalized match. */
  readonly matchType: LexemeMatchType;
  /** Confidence score for fuzzy matches (1.0 for exact). */
  readonly confidence: number;
}

/**
 * How a lexeme was matched to the source text.
 */
export type LexemeMatchType =
  | 'exact'
  | 'synonym'
  | 'morphological'
  | 'fuzzy'
  | 'contextual';

// =============================================================================
// Rule References
// =============================================================================

/**
 * A reference to a parse or composition rule that fired.
 */
export interface RuleReference {
  /** The rule's unique ID. */
  readonly ruleId: RuleId;
  /** Human-readable name/description of the rule. */
  readonly ruleName: string;
  /** Which pipeline stage this rule belongs to. */
  readonly stage: PipelineStageId;
  /** The category of rule. */
  readonly ruleCategory: RuleCategory;
  /** Input spans that triggered this rule. */
  readonly inputSpans: readonly SourceSpan[];
  /** Priority of this rule (for disambiguation). */
  readonly priority: number;
}

/**
 * Categories of rules in the pipeline.
 */
export type RuleCategory =
  | 'normalization'
  | 'tokenization'
  | 'morphological'
  | 'lexical_lookup'
  | 'parse_grammar'
  | 'semantic_composition'
  | 'semantic_action'
  | 'pragmatic_resolution'
  | 'discourse_update'
  | 'type_checking'
  | 'plan_construction'
  | 'default_application'
  | 'constraint_generation'
  | 'scope_resolution'
  | 'reference_resolution'
  | 'ambiguity_resolution';

// =============================================================================
// Default Application Records
// =============================================================================

/**
 * Record of a default interpretation being applied.
 * This connects to the default-interpretations registry (Step 019).
 */
export interface DefaultApplication {
  /** The default interpretation ID from the registry. */
  readonly defaultId: string;
  /** What category of default this is. */
  readonly category: DefaultApplicationCategory;
  /** The default value that was applied. */
  readonly appliedValue: string;
  /** Whether the user had overridden this default. */
  readonly isUserOverride: boolean;
  /** The source span that triggered the default. */
  readonly triggerSpan: SourceSpan;
  /** Human-readable explanation of why this default was needed. */
  readonly rationale: string;
}

/**
 * Categories of defaults that can be applied.
 */
export type DefaultApplicationCategory =
  | 'sense_disambiguation'
  | 'amount_inference'
  | 'scope_inference'
  | 'constraint_inference'
  | 'priority_assignment'
  | 'reference_resolution'
  | 'safety_threshold'
  | 'planning_strategy';

// =============================================================================
// Stage Contributions
// =============================================================================

/**
 * Record of a pipeline stage's contribution to a provenance chain.
 */
export interface StageContribution {
  /** Which stage contributed. */
  readonly stage: PipelineStageId;
  /** What the stage did (human-readable). */
  readonly action: string;
  /** Rules that fired in this stage for this node. */
  readonly rules: readonly RuleReference[];
  /** Defaults applied in this stage for this node. */
  readonly defaults: readonly DefaultApplication[];
  /** Decisions made in this stage for this node. */
  readonly decisions: readonly ProvenanceDecision[];
  /** Timestamp (ms since pipeline start). */
  readonly timestampMs: number;
}

/**
 * A decision recorded during provenance tracking.
 * More specific than StageDecision — tied to a particular CPL node.
 */
export interface ProvenanceDecision {
  /** What was decided. */
  readonly description: string;
  /** The rule or heuristic that made the decision. */
  readonly rule: RuleId | undefined;
  /** What alternatives were considered. */
  readonly alternatives: readonly ProvenanceAlternative[];
  /** Why this alternative was chosen. */
  readonly reason: string;
  /** Severity of the decision (info < significant < critical). */
  readonly significance: DecisionSignificance;
}

/**
 * An alternative that was considered but not chosen.
 */
export interface ProvenanceAlternative {
  /** Description of the alternative. */
  readonly description: string;
  /** Why it was rejected. */
  readonly rejectionReason: string;
  /** Score (if applicable). */
  readonly score: number | undefined;
}

/**
 * How significant a provenance decision is.
 */
export type DecisionSignificance =
  | 'info'
  | 'significant'
  | 'critical';

// =============================================================================
// Full Provenance Record
// =============================================================================

/**
 * Complete provenance record for a CPL node, plan step, or intermediate
 * representation. This is the core data structure for tracing any output
 * back to its source.
 */
export interface Provenance {
  /** Unique ID for this provenance record. */
  readonly id: ProvenanceId;

  /** Source spans in the original user input. */
  readonly sourceSpans: readonly SourceSpan[];

  /** Canonical lexemes that were matched. */
  readonly lexemes: readonly LexemeReference[];

  /** Parse/composition rules that fired. */
  readonly rules: readonly RuleReference[];

  /** Defaults that were applied. */
  readonly defaults: readonly DefaultApplication[];

  /** Pipeline stage contributions (ordered by stage). */
  readonly stageTrail: readonly StageContribution[];

  /** Parent provenance records (if this was composed from children). */
  readonly parents: readonly ProvenanceId[];

  /** Child provenance records (sub-nodes that contributed). */
  readonly children: readonly ProvenanceId[];

  /** Creation timestamp (ms since pipeline start). */
  readonly createdAtMs: number;

  /** Version tag for the provenance format. */
  readonly version: 1;
}

// =============================================================================
// Provenance Builder
// =============================================================================

/**
 * Mutable builder for constructing provenance records incrementally
 * as a CPL node moves through the pipeline.
 */
export interface ProvenanceBuilder {
  /** The provenance ID being built. */
  readonly id: ProvenanceId;

  /** Add a source span. */
  addSourceSpan(span: SourceSpan): void;

  /** Add multiple source spans. */
  addSourceSpans(spans: readonly SourceSpan[]): void;

  /** Add a lexeme reference. */
  addLexeme(ref: LexemeReference): void;

  /** Add a rule reference. */
  addRule(ref: RuleReference): void;

  /** Add a default application. */
  addDefault(app: DefaultApplication): void;

  /** Add a stage contribution. */
  addStageContribution(contrib: StageContribution): void;

  /** Add a parent provenance ID (this node was composed from another). */
  addParent(parentId: ProvenanceId): void;

  /** Add a child provenance ID (sub-node contributed to this). */
  addChild(childId: ProvenanceId): void;

  /** Build the immutable provenance record. */
  build(): Provenance;
}

/**
 * Create a new ProvenanceBuilder.
 *
 * @param startMs - Pipeline start time for relative timestamps
 */
export function createProvenanceBuilder(startMs: number): ProvenanceBuilder {
  const id = nextProvenanceId();
  const sourceSpans: SourceSpan[] = [];
  const lexemes: LexemeReference[] = [];
  const rules: RuleReference[] = [];
  const defaults: DefaultApplication[] = [];
  const stageTrail: StageContribution[] = [];
  const parents: ProvenanceId[] = [];
  const children: ProvenanceId[] = [];

  return {
    id,

    addSourceSpan(span: SourceSpan): void {
      sourceSpans.push(span);
    },

    addSourceSpans(spans: readonly SourceSpan[]): void {
      sourceSpans.push(...spans);
    },

    addLexeme(ref: LexemeReference): void {
      lexemes.push(ref);
    },

    addRule(ref: RuleReference): void {
      rules.push(ref);
    },

    addDefault(app: DefaultApplication): void {
      defaults.push(app);
    },

    addStageContribution(contrib: StageContribution): void {
      stageTrail.push(contrib);
    },

    addParent(parentId: ProvenanceId): void {
      parents.push(parentId);
    },

    addChild(childId: ProvenanceId): void {
      children.push(childId);
    },

    build(): Provenance {
      return {
        id,
        sourceSpans: [...sourceSpans],
        lexemes: [...lexemes],
        rules: [...rules],
        defaults: [...defaults],
        stageTrail: [...stageTrail],
        parents: [...parents],
        children: [...children],
        createdAtMs: Date.now() - startMs,
        version: 1,
      };
    },
  };
}

// =============================================================================
// Provenance Store
// =============================================================================

/**
 * A store that holds all provenance records for a single compilation.
 * Allows lookup by ID and traversal of the provenance DAG.
 */
export interface ProvenanceStore {
  /** Get a provenance record by ID. */
  get(id: ProvenanceId): Provenance | undefined;

  /** Store a provenance record. */
  store(provenance: Provenance): void;

  /** Get all provenance records. */
  getAll(): readonly Provenance[];

  /** Get all root provenance records (no parents). */
  getRoots(): readonly Provenance[];

  /** Get all leaf provenance records (no children). */
  getLeaves(): readonly Provenance[];

  /** Get the full ancestor chain for a provenance ID. */
  getAncestors(id: ProvenanceId): readonly Provenance[];

  /** Get the full descendant tree for a provenance ID. */
  getDescendants(id: ProvenanceId): readonly Provenance[];

  /** Get all provenance records that reference a given source span. */
  getBySpan(span: SourceSpan): readonly Provenance[];

  /** Get all provenance records that reference a given lexeme. */
  getByLexeme(lexemeId: LexemeId): readonly Provenance[];

  /** Get all provenance records that used a given rule. */
  getByRule(ruleId: RuleId): readonly Provenance[];

  /** Get all provenance records from a given pipeline stage. */
  getByStage(stage: PipelineStageId): readonly Provenance[];

  /** Get all provenance records that applied a given default. */
  getByDefault(defaultId: string): readonly Provenance[];

  /** Get the total number of stored records. */
  size(): number;

  /** Clear all records (for reuse). */
  clear(): void;
}

/**
 * Create a new in-memory ProvenanceStore.
 */
export function createProvenanceStore(): ProvenanceStore {
  const records = new Map<string, Provenance>();

  return {
    get(id: ProvenanceId): Provenance | undefined {
      return records.get(id);
    },

    store(provenance: Provenance): void {
      records.set(provenance.id, provenance);
    },

    getAll(): readonly Provenance[] {
      return [...records.values()];
    },

    getRoots(): readonly Provenance[] {
      return [...records.values()].filter(p => p.parents.length === 0);
    },

    getLeaves(): readonly Provenance[] {
      return [...records.values()].filter(p => p.children.length === 0);
    },

    getAncestors(id: ProvenanceId): readonly Provenance[] {
      const result: Provenance[] = [];
      const visited = new Set<string>();
      const queue: ProvenanceId[] = [id];

      while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (visited.has(currentId)) continue;
        visited.add(currentId);

        const record = records.get(currentId);
        if (record && currentId !== id) {
          result.push(record);
        }
        if (record) {
          for (const parentId of record.parents) {
            if (!visited.has(parentId)) {
              queue.push(parentId);
            }
          }
        }
      }

      return result;
    },

    getDescendants(id: ProvenanceId): readonly Provenance[] {
      const result: Provenance[] = [];
      const visited = new Set<string>();
      const queue: ProvenanceId[] = [id];

      while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (visited.has(currentId)) continue;
        visited.add(currentId);

        const record = records.get(currentId);
        if (record && currentId !== id) {
          result.push(record);
        }
        if (record) {
          for (const childId of record.children) {
            if (!visited.has(childId)) {
              queue.push(childId);
            }
          }
        }
      }

      return result;
    },

    getBySpan(span: SourceSpan): readonly Provenance[] {
      return [...records.values()].filter(p =>
        p.sourceSpans.some(s => spansOverlap(s, span))
      );
    },

    getByLexeme(lexemeId: LexemeId): readonly Provenance[] {
      return [...records.values()].filter(p =>
        p.lexemes.some(l => l.lexemeId === lexemeId)
      );
    },

    getByRule(targetRuleId: RuleId): readonly Provenance[] {
      return [...records.values()].filter(p =>
        p.rules.some(r => r.ruleId === targetRuleId)
      );
    },

    getByStage(stage: PipelineStageId): readonly Provenance[] {
      return [...records.values()].filter(p =>
        p.stageTrail.some(s => s.stage === stage)
      );
    },

    getByDefault(defaultId: string): readonly Provenance[] {
      return [...records.values()].filter(p =>
        p.defaults.some(d => d.defaultId === defaultId)
      );
    },

    size(): number {
      return records.size;
    },

    clear(): void {
      records.clear();
    },
  };
}

// =============================================================================
// Provenance Explanation Generator
// =============================================================================

/**
 * A human-readable explanation generated from provenance records.
 * Used for the "why" command and decision tracing.
 */
export interface ProvenanceExplanation {
  /** The provenance ID being explained. */
  readonly provenanceId: ProvenanceId;
  /** One-line summary. */
  readonly summary: string;
  /** Detailed explanation sections. */
  readonly sections: readonly ExplanationSection[];
  /** Source text highlights for UI. */
  readonly highlights: readonly SourceHighlight[];
}

/**
 * A section of a provenance explanation.
 */
export interface ExplanationSection {
  /** Section title. */
  readonly title: string;
  /** Section content (human-readable). */
  readonly content: string;
  /** Nested sub-sections. */
  readonly subsections: readonly ExplanationSection[];
}

/**
 * A source text highlight for UI display.
 */
export interface SourceHighlight {
  /** The source span to highlight. */
  readonly span: SourceSpan;
  /** What this span contributed to. */
  readonly label: string;
  /** Color category for UI rendering. */
  readonly category: HighlightCategory;
}

/**
 * Categories for source highlight coloring.
 */
export type HighlightCategory =
  | 'scope'
  | 'target'
  | 'action'
  | 'modifier'
  | 'constraint'
  | 'reference'
  | 'degree'
  | 'temporal'
  | 'unknown';

/**
 * Generate a provenance explanation for a given provenance record.
 *
 * @param provenance - The provenance record to explain
 * @param store - The provenance store for looking up related records
 * @returns A human-readable explanation
 */
export function generateExplanation(
  provenance: Provenance,
  store: ProvenanceStore,
): ProvenanceExplanation {
  const sections: ExplanationSection[] = [];
  const highlights: SourceHighlight[] = [];

  // Section 1: Source text mapping
  if (provenance.sourceSpans.length > 0) {
    const sourceLines = provenance.sourceSpans
      .map(s => `"${s.text}" (characters ${s.start}–${s.end})`)
      .join(', ');
    sections.push({
      title: 'Source Text',
      content: `This node was derived from: ${sourceLines}`,
      subsections: [],
    });

    for (const span of provenance.sourceSpans) {
      highlights.push({
        span,
        label: 'source',
        category: 'action',
      });
    }
  }

  // Section 2: Lexeme matches
  if (provenance.lexemes.length > 0) {
    const lexemeLines = provenance.lexemes.map(l => {
      const matchInfo = l.matchType === 'exact'
        ? 'exact match'
        : `${l.matchType} match (${(l.confidence * 100).toFixed(0)}% confidence)`;
      return `"${l.surfaceForm}" → lexeme ${l.lexemeId} (${matchInfo})`;
    });
    sections.push({
      title: 'Matched Lexemes',
      content: lexemeLines.join('\n'),
      subsections: [],
    });

    for (const lex of provenance.lexemes) {
      highlights.push({
        span: lex.span,
        label: `lexeme: ${lex.lexemeId}`,
        category: 'action',
      });
    }
  }

  // Section 3: Rules that fired
  if (provenance.rules.length > 0) {
    const rulesByStage = new Map<PipelineStageId, RuleReference[]>();
    for (const rule of provenance.rules) {
      const existing = rulesByStage.get(rule.stage);
      if (existing) {
        existing.push(rule);
      } else {
        rulesByStage.set(rule.stage, [rule]);
      }
    }

    const ruleSubsections: ExplanationSection[] = [];
    for (const [stage, rules] of rulesByStage) {
      const ruleLines = rules.map(r =>
        `${r.ruleName} (${r.ruleCategory}, priority ${r.priority})`
      );
      ruleSubsections.push({
        title: `${stage} stage`,
        content: ruleLines.join('\n'),
        subsections: [],
      });
    }

    sections.push({
      title: 'Rules Applied',
      content: `${provenance.rules.length} rule(s) fired across ${rulesByStage.size} stage(s)`,
      subsections: ruleSubsections,
    });
  }

  // Section 4: Defaults applied
  if (provenance.defaults.length > 0) {
    const defaultLines = provenance.defaults.map(d => {
      const overrideNote = d.isUserOverride ? ' (user override)' : ' (system default)';
      return `${d.category}: "${d.triggerSpan.text}" → ${d.appliedValue}${overrideNote}\n  Rationale: ${d.rationale}`;
    });
    sections.push({
      title: 'Defaults Applied',
      content: defaultLines.join('\n\n'),
      subsections: [],
    });

    for (const def of provenance.defaults) {
      highlights.push({
        span: def.triggerSpan,
        label: `default: ${def.appliedValue}`,
        category: 'modifier',
      });
    }
  }

  // Section 5: Decision trail
  const allDecisions = provenance.stageTrail.flatMap(s => s.decisions);
  if (allDecisions.length > 0) {
    const criticalDecisions = allDecisions.filter(d => d.significance === 'critical');
    const significantDecisions = allDecisions.filter(d => d.significance === 'significant');

    const decisionSubsections: ExplanationSection[] = [];

    if (criticalDecisions.length > 0) {
      decisionSubsections.push({
        title: 'Critical Decisions',
        content: criticalDecisions.map(d => {
          const alts = d.alternatives.length > 0
            ? `\n  Alternatives considered: ${d.alternatives.map(a => a.description).join(', ')}`
            : '';
          return `${d.description}\n  Reason: ${d.reason}${alts}`;
        }).join('\n\n'),
        subsections: [],
      });
    }

    if (significantDecisions.length > 0) {
      decisionSubsections.push({
        title: 'Significant Decisions',
        content: significantDecisions.map(d =>
          `${d.description}: ${d.reason}`
        ).join('\n'),
        subsections: [],
      });
    }

    sections.push({
      title: 'Decisions',
      content: `${allDecisions.length} decision(s) made (${criticalDecisions.length} critical, ${significantDecisions.length} significant)`,
      subsections: decisionSubsections,
    });
  }

  // Section 6: Composition (parents/children)
  if (provenance.parents.length > 0 || provenance.children.length > 0) {
    const parentInfo = provenance.parents
      .map(pid => {
        const parent = store.get(pid);
        if (!parent) return `${pid} (not found)`;
        const spans = parent.sourceSpans.map(s => `"${s.text}"`).join(', ');
        return `${pid}: ${spans}`;
      })
      .join('\n');

    const childInfo = provenance.children
      .map(cid => {
        const child = store.get(cid);
        if (!child) return `${cid} (not found)`;
        const spans = child.sourceSpans.map(s => `"${s.text}"`).join(', ');
        return `${cid}: ${spans}`;
      })
      .join('\n');

    const compositionContent: string[] = [];
    if (provenance.parents.length > 0) {
      compositionContent.push(`Composed from:\n${parentInfo}`);
    }
    if (provenance.children.length > 0) {
      compositionContent.push(`Contributes to:\n${childInfo}`);
    }

    sections.push({
      title: 'Composition',
      content: compositionContent.join('\n\n'),
      subsections: [],
    });
  }

  // Generate summary
  const summary = generateSummary(provenance);

  return {
    provenanceId: provenance.id,
    summary,
    sections,
    highlights,
  };
}

/**
 * Generate a one-line summary of a provenance record.
 */
function generateSummary(provenance: Provenance): string {
  const parts: string[] = [];

  // Source text
  if (provenance.sourceSpans.length > 0) {
    const firstSpan = provenance.sourceSpans[0]!;
    parts.push(`from "${firstSpan.text}"`);
  }

  // Key rules
  if (provenance.rules.length > 0) {
    const stages = new Set(provenance.rules.map(r => r.stage));
    parts.push(`via ${stages.size} stage(s)`);
  }

  // Defaults
  if (provenance.defaults.length > 0) {
    const userOverrides = provenance.defaults.filter(d => d.isUserOverride).length;
    if (userOverrides > 0) {
      parts.push(`with ${userOverrides} user override(s)`);
    } else {
      parts.push(`with ${provenance.defaults.length} default(s)`);
    }
  }

  // Decisions
  const criticalCount = provenance.stageTrail
    .flatMap(s => s.decisions)
    .filter(d => d.significance === 'critical').length;
  if (criticalCount > 0) {
    parts.push(`${criticalCount} critical decision(s)`);
  }

  return parts.join(', ') || 'no provenance information';
}

// =============================================================================
// Provenance Diff
// =============================================================================

/**
 * A diff between two provenance records, showing what changed.
 * Used for comparing alternative interpretations.
 */
export interface ProvenanceDiff {
  /** Provenance IDs being compared. */
  readonly left: ProvenanceId;
  readonly right: ProvenanceId;

  /** Lexemes present in left but not right. */
  readonly removedLexemes: readonly LexemeReference[];
  /** Lexemes present in right but not left. */
  readonly addedLexemes: readonly LexemeReference[];

  /** Rules present in left but not right. */
  readonly removedRules: readonly RuleReference[];
  /** Rules present in right but not left. */
  readonly addedRules: readonly RuleReference[];

  /** Defaults that changed between left and right. */
  readonly changedDefaults: readonly DefaultDiff[];

  /** Decisions that differ between left and right. */
  readonly changedDecisions: readonly DecisionDiff[];
}

/**
 * A difference in default application between two provenance records.
 */
export interface DefaultDiff {
  readonly defaultId: string;
  readonly leftValue: string | undefined;
  readonly rightValue: string | undefined;
}

/**
 * A difference in decisions between two provenance records.
 */
export interface DecisionDiff {
  readonly description: string;
  readonly leftReason: string | undefined;
  readonly rightReason: string | undefined;
}

/**
 * Compute the diff between two provenance records.
 */
export function diffProvenance(
  left: Provenance,
  right: Provenance,
): ProvenanceDiff {
  // Lexeme diff
  const leftLexemeIds = new Set(left.lexemes.map(l => l.lexemeId));
  const rightLexemeIds = new Set(right.lexemes.map(l => l.lexemeId));
  const removedLexemes = left.lexemes.filter(l => !rightLexemeIds.has(l.lexemeId));
  const addedLexemes = right.lexemes.filter(l => !leftLexemeIds.has(l.lexemeId));

  // Rule diff
  const leftRuleIds = new Set(left.rules.map(r => r.ruleId));
  const rightRuleIds = new Set(right.rules.map(r => r.ruleId));
  const removedRules = left.rules.filter(r => !rightRuleIds.has(r.ruleId));
  const addedRules = right.rules.filter(r => !leftRuleIds.has(r.ruleId));

  // Default diff
  const changedDefaults: DefaultDiff[] = [];
  const allDefaultIds = new Set([
    ...left.defaults.map(d => d.defaultId),
    ...right.defaults.map(d => d.defaultId),
  ]);
  for (const defaultId of allDefaultIds) {
    const leftDef = left.defaults.find(d => d.defaultId === defaultId);
    const rightDef = right.defaults.find(d => d.defaultId === defaultId);
    if (leftDef?.appliedValue !== rightDef?.appliedValue) {
      changedDefaults.push({
        defaultId,
        leftValue: leftDef?.appliedValue,
        rightValue: rightDef?.appliedValue,
      });
    }
  }

  // Decision diff
  const changedDecisions: DecisionDiff[] = [];
  const leftDecisions = left.stageTrail.flatMap(s => s.decisions);
  const rightDecisions = right.stageTrail.flatMap(s => s.decisions);
  const allDescriptions = new Set([
    ...leftDecisions.map(d => d.description),
    ...rightDecisions.map(d => d.description),
  ]);
  for (const desc of allDescriptions) {
    const leftDec = leftDecisions.find(d => d.description === desc);
    const rightDec = rightDecisions.find(d => d.description === desc);
    if (leftDec?.reason !== rightDec?.reason) {
      changedDecisions.push({
        description: desc,
        leftReason: leftDec?.reason,
        rightReason: rightDec?.reason,
      });
    }
  }

  return {
    left: left.id,
    right: right.id,
    removedLexemes,
    addedLexemes,
    removedRules,
    addedRules,
    changedDefaults,
    changedDecisions,
  };
}

// =============================================================================
// Provenance Serialization
// =============================================================================

/**
 * Serializable form of a provenance record for export/import.
 */
export interface SerializedProvenance {
  readonly version: 1;
  readonly records: readonly Provenance[];
  readonly metadata: SerializedProvenanceMetadata;
}

/**
 * Metadata for serialized provenance.
 */
export interface SerializedProvenanceMetadata {
  /** The original input text. */
  readonly inputText: string;
  /** When the compilation happened. */
  readonly compiledAt: string;
  /** Pipeline configuration fingerprint. */
  readonly configFingerprint: string;
  /** Number of records. */
  readonly recordCount: number;
}

/**
 * Serialize a provenance store for export.
 */
export function serializeProvenanceStore(
  store: ProvenanceStore,
  inputText: string,
  configFingerprint: string,
): SerializedProvenance {
  const records = store.getAll();
  return {
    version: 1,
    records,
    metadata: {
      inputText,
      compiledAt: new Date().toISOString(),
      configFingerprint,
      recordCount: records.length,
    },
  };
}

/**
 * Deserialize provenance records into a store.
 */
export function deserializeProvenanceStore(
  serialized: SerializedProvenance,
): ProvenanceStore {
  if (serialized.version !== 1) {
    throw new Error(`Unsupported provenance version: ${serialized.version}`);
  }
  const store = createProvenanceStore();
  for (const record of serialized.records) {
    store.store(record);
  }
  return store;
}

// =============================================================================
// Provenance Query Utilities
// =============================================================================

/**
 * Find the "critical path" — the chain of provenance records with
 * the most critical decisions, from source to output.
 */
export function findCriticalPath(
  store: ProvenanceStore,
  targetId: ProvenanceId,
): readonly Provenance[] {
  const target = store.get(targetId);
  if (!target) return [];

  const path: Provenance[] = [target];
  let current = target;

  while (current.parents.length > 0) {
    // Choose parent with most critical decisions
    let bestParent: Provenance | undefined;
    let bestScore = -1;

    for (const parentId of current.parents) {
      const parent = store.get(parentId);
      if (!parent) continue;

      const score = parent.stageTrail
        .flatMap(s => s.decisions)
        .filter(d => d.significance === 'critical').length;

      if (score > bestScore || !bestParent) {
        bestParent = parent;
        bestScore = score;
      }
    }

    if (!bestParent) break;
    path.unshift(bestParent);
    current = bestParent;
  }

  return path;
}

/**
 * Get all source spans that contributed to a provenance record,
 * including those from ancestors.
 */
export function getAllSourceSpans(
  store: ProvenanceStore,
  id: ProvenanceId,
): readonly SourceSpan[] {
  const record = store.get(id);
  if (!record) return [];

  const spans = new Set<string>();
  const result: SourceSpan[] = [];

  const addSpans = (prov: Provenance): void => {
    for (const span of prov.sourceSpans) {
      const key = `${span.start}:${span.end}`;
      if (!spans.has(key)) {
        spans.add(key);
        result.push(span);
      }
    }
  };

  addSpans(record);
  for (const ancestor of store.getAncestors(id)) {
    addSpans(ancestor);
  }

  return result.sort((a, b) => a.start - b.start);
}

/**
 * Get all defaults that were applied in the provenance chain
 * for a given record, including ancestors.
 */
export function getAllAppliedDefaults(
  store: ProvenanceStore,
  id: ProvenanceId,
): readonly DefaultApplication[] {
  const record = store.get(id);
  if (!record) return [];

  const seen = new Set<string>();
  const result: DefaultApplication[] = [];

  const addDefaults = (prov: Provenance): void => {
    for (const def of prov.defaults) {
      if (!seen.has(def.defaultId)) {
        seen.add(def.defaultId);
        result.push(def);
      }
    }
  };

  addDefaults(record);
  for (const ancestor of store.getAncestors(id)) {
    addDefaults(ancestor);
  }

  return result;
}

/**
 * Get a mapping from source character positions to the pipeline stages
 * that processed them. Used for scope highlighting in the UI.
 */
export function getSourceCoverage(
  store: ProvenanceStore,
): readonly SourceCoverageEntry[] {
  const coverage = new Map<string, { span: SourceSpan; stages: Set<PipelineStageId> }>();

  for (const record of store.getAll()) {
    const stages = new Set(record.stageTrail.map(s => s.stage));
    for (const span of record.sourceSpans) {
      const key = `${span.start}:${span.end}`;
      const existing = coverage.get(key);
      if (existing) {
        for (const stage of stages) {
          existing.stages.add(stage);
        }
      } else {
        coverage.set(key, { span, stages });
      }
    }
  }

  return [...coverage.values()].map(entry => ({
    span: entry.span,
    stages: [...entry.stages],
  }));
}

/**
 * A source coverage entry mapping a span to the stages that processed it.
 */
export interface SourceCoverageEntry {
  readonly span: SourceSpan;
  readonly stages: readonly PipelineStageId[];
}

// =============================================================================
// Plan-Specific Provenance Extensions (Step 265)
// =============================================================================

/**
 * Provenance specifically for plan opcodes.
 * Links each opcode back through levers, goals, semantics, to original words.
 */
export interface PlanOpcodeProvenance extends Provenance {
  readonly kind: 'plan-opcode';
  
  /** The opcode ID this provenance describes */
  readonly opcodeId: string;
  
  /** Which goal(s) this opcode serves */
  readonly servesGoals: readonly string[];
  
  /** Which lever(s) led to selecting this opcode */
  readonly fromLevers: readonly string[];
  
  /** Which axes are being manipulated */
  readonly manipulatesAxes: readonly string[];
  
  /** Parameters and their inference provenance */
  readonly parameterProvenance: ReadonlyMap<string, ProvenanceId>;
  
  /** Cost/scoring information */
  readonly selectionRationale: {
    readonly cost: number;
    readonly goalSatisfaction: number;
    readonly constraintCompliance: number;
    readonly alternativesConsidered: readonly string[];
    readonly reasonChosen: string;
  };
  
  /** Constraints this opcode preserves */
  readonly preservesConstraints: readonly string[];
  
  /** Potential side effects identified */
  readonly knownSideEffects: readonly string[];
}

/**
 * Create plan opcode provenance.
 */
export function createPlanOpcodeProvenance(
  params: {
    opcodeId: string;
    servesGoals: readonly string[];
    fromLevers: readonly string[];
    manipulatesAxes: readonly string[];
    parameterProvenance: ReadonlyMap<string, ProvenanceId>;
    selectionRationale: {
      cost: number;
      goalSatisfaction: number;
      constraintCompliance: number;
      alternativesConsidered: readonly string[];
      reasonChosen: string;
    };
    preservesConstraints: readonly string[];
    knownSideEffects: readonly string[];
    parents?: readonly ProvenanceId[];
    sourceSpans?: readonly SourceSpan[];
    lexemes?: readonly LexemeId[];
    rules?: readonly RuleId[];
    stages?: readonly PipelineStageId[];
  }
): PlanOpcodeProvenance {
  const baseProvenance = createProvenance({
    sourceSpans: params.sourceSpans ?? [],
    lexemes: params.lexemes ?? [],
    rules: params.rules ?? [],
    compositions: [],
    stages: params.stages ?? ['planning'],
    decisions: [],
    defaults: [],
    parents: params.parents ?? [],
  });

  return {
    ...baseProvenance,
    kind: 'plan-opcode',
    opcodeId: params.opcodeId,
    servesGoals: params.servesGoals,
    fromLevers: params.fromLevers,
    manipulatesAxes: params.manipulatesAxes,
    parameterProvenance: params.parameterProvenance,
    selectionRationale: params.selectionRationale,
    preservesConstraints: params.preservesConstraints,
    knownSideEffects: params.knownSideEffects,
  };
}

/**
 * Provenance for a complete plan.
 */
export interface CompletePlanProvenance {
  /** Provenance ID for the entire plan */
  readonly planId: ProvenanceId;
  
  /** Original utterance that led to this plan */
  readonly utterance: string;
  
  /** Provenance for the intent */
  readonly intentProvenance: ProvenanceId;
  
  /** Provenance for each opcode in order */
  readonly opcodeProvenance: readonly PlanOpcodeProvenance[];
  
  /** How goals map to opcodes */
  readonly goalToOpcodeMapping: ReadonlyMap<string, readonly string[]>;
  
  /** How constraints affected planning */
  readonly constraintInfluence: readonly {
    readonly constraintId: string;
    readonly eliminatedOpcodes: readonly string[];
    readonly modifiedOpcodes: readonly string[];
    readonly reason: string;
  }[];
  
  /** User preferences that influenced planning */
  readonly preferenceInfluence: readonly {
    readonly preference: string;
    readonly affectedDecisions: readonly string[];
    readonly impact: string;
  }[];
  
  /** Full decision tree for planning */
  readonly decisionTree: PlanningDecisionNode;
  
  /** Timestamp of plan generation */
  readonly timestamp: number;
  
  /** Compiler version/fingerprint */
  readonly compilerVersion: string;
}

/**
 * Node in the planning decision tree.
 */
export interface PlanningDecisionNode {
  readonly decision: string;
  readonly rationale: string;
  readonly alternatives: readonly {
    readonly option: string;
    readonly rejectionReason: string;
    readonly score: number;
  }[];
  readonly chosen: string;
  readonly children: readonly PlanningDecisionNode[];
}

/**
 * Create a complete plan provenance record.
 */
export function createCompletePlanProvenance(
  params: {
    utterance: string;
    intentProvenance: ProvenanceId;
    opcodeProvenance: readonly PlanOpcodeProvenance[];
    goalToOpcodeMapping: ReadonlyMap<string, readonly string[]>;
    constraintInfluence: CompletePlanProvenance['constraintInfluence'];
    preferenceInfluence: CompletePlanProvenance['preferenceInfluence'];
    decisionTree: PlanningDecisionNode;
    compilerVersion: string;
  }
): CompletePlanProvenance {
  return {
    planId: nextProvenanceId(),
    utterance: params.utterance,
    intentProvenance: params.intentProvenance,
    opcodeProvenance: params.opcodeProvenance,
    goalToOpcodeMapping: params.goalToOpcodeMapping,
    constraintInfluence: params.constraintInfluence,
    preferenceInfluence: params.preferenceInfluence,
    decisionTree: params.decisionTree,
    timestamp: Date.now(),
    compilerVersion: params.compilerVersion,
  };
}

/**
 * Extract human-readable provenance chain.
 */
export function explainProvenanceChain(
  opcode: PlanOpcodeProvenance,
  store: ProvenanceStore
): string[] {
  const explanation: string[] = [];
  
  explanation.push(`Opcode: ${opcode.opcodeId}`);
  explanation.push('');
  
  explanation.push('Serves goals:');
  for (const goal of opcode.servesGoals) {
    explanation.push(`  • ${goal}`);
  }
  explanation.push('');
  
  explanation.push('Derived from levers:');
  for (const lever of opcode.fromLevers) {
    explanation.push(`  • ${lever}`);
  }
  explanation.push('');
  
  explanation.push('Manipulates axes:');
  for (const axis of opcode.manipulatesAxes) {
    explanation.push(`  • ${axis}`);
  }
  explanation.push('');
  
  explanation.push('Selection rationale:');
  explanation.push(`  Cost: ${opcode.selectionRationale.cost.toFixed(2)}`);
  explanation.push(`  Goal satisfaction: ${opcode.selectionRationale.goalSatisfaction.toFixed(2)}`);
  explanation.push(`  Constraint compliance: ${opcode.selectionRationale.constraintCompliance.toFixed(2)}`);
  explanation.push(`  Reason: ${opcode.selectionRationale.reasonChosen}`);
  explanation.push('');
  
  if (opcode.selectionRationale.alternativesConsidered.length > 0) {
    explanation.push('Alternatives considered:');
    for (const alt of opcode.selectionRationale.alternativesConsidered) {
      explanation.push(`  • ${alt}`);
    }
    explanation.push('');
  }
  
  if (opcode.preservesConstraints.length > 0) {
    explanation.push('Preserves constraints:');
    for (const constraint of opcode.preservesConstraints) {
      explanation.push(`  ✓ ${constraint}`);
    }
    explanation.push('');
  }
  
  if (opcode.knownSideEffects.length > 0) {
    explanation.push('Known side effects:');
    for (const effect of opcode.knownSideEffects) {
      explanation.push(`  ⚠ ${effect}`);
    }
    explanation.push('');
  }
  
  // Trace back to source text
  if (opcode.sourceSpans.length > 0 && opcode.sourceSpans[0].text) {
    explanation.push(`Source text: "${opcode.sourceSpans[0].text}"`);
  }
  
  // Show lexeme trail
  if (opcode.lexemes.length > 0) {
    explanation.push('Lexeme trail:');
    for (const lexeme of opcode.lexemes) {
      explanation.push(`  → ${lexeme}`);
    }
  }
  
  return explanation;
}

/**
 * Visualize complete plan provenance as a tree.
 */
export function visualizePlanProvenanceTree(
  plan: CompletePlanProvenance,
  options?: {
    includeScores?: boolean;
    includeAlternatives?: boolean;
    maxDepth?: number;
  }
): string {
  const lines: string[] = [];
  const opts = {
    includeScores: options?.includeScores ?? true,
    includeAlternatives: options?.includeAlternatives ?? false,
    maxDepth: options?.maxDepth ?? 10,
  };
  
  lines.push(`Plan Provenance Tree: ${plan.planId}`);
  lines.push(`Utterance: "${plan.utterance}"`);
  lines.push(`Generated: ${new Date(plan.timestamp).toISOString()}`);
  lines.push(`Compiler: ${plan.compilerVersion}`);
  lines.push('');
  
  // Show goal → opcode mapping
  lines.push('Goal Coverage:');
  for (const [goal, opcodes] of plan.goalToOpcodeMapping.entries()) {
    lines.push(`  ${goal}`);
    for (const opcode of opcodes) {
      lines.push(`    → ${opcode}`);
    }
  }
  lines.push('');
  
  // Show each opcode
  lines.push('Opcode Sequence:');
  for (let i = 0; i < plan.opcodeProvenance.length; i++) {
    const op = plan.opcodeProvenance[i];
    lines.push(`  ${i + 1}. ${op.opcodeId}`);
    
    if (opts.includeScores) {
      lines.push(`     Cost: ${op.selectionRationale.cost.toFixed(2)} | ` +
                 `Satisfaction: ${op.selectionRationale.goalSatisfaction.toFixed(2)}`);
    }
    
    lines.push(`     Reason: ${op.selectionRationale.reasonChosen}`);
    
    if (opts.includeAlternatives && op.selectionRationale.alternativesConsidered.length > 0) {
      lines.push(`     Alternatives: ${op.selectionRationale.alternativesConsidered.join(', ')}`);
    }
  }
  lines.push('');
  
  // Show constraint influence
  if (plan.constraintInfluence.length > 0) {
    lines.push('Constraint Influence:');
    for (const ci of plan.constraintInfluence) {
      lines.push(`  ${ci.constraintId}: ${ci.reason}`);
      if (ci.eliminatedOpcodes.length > 0) {
        lines.push(`    Eliminated: ${ci.eliminatedOpcodes.join(', ')}`);
      }
      if (ci.modifiedOpcodes.length > 0) {
        lines.push(`    Modified: ${ci.modifiedOpcodes.join(', ')}`);
      }
    }
    lines.push('');
  }
  
  return lines.join('\n');
}
