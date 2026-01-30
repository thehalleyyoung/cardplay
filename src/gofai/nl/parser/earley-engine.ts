/**
 * GOFAI NL Parser — Earley Parsing Engine with Scoring
 *
 * Implements a deterministic parsing engine based on the Earley algorithm
 * with a scoring extension for parse selection.
 *
 * ## Why Earley?
 *
 * | Engine     | Pros                                        | Cons                              |
 * |------------|---------------------------------------------|-----------------------------------|
 * | **Earley** | Handles all CFGs, O(n³) worst, O(n²) avg    | Slower than PEG for unambiguous   |
 * | PEG        | Linear time, simple implementation           | Loses ambiguity (ordered choice)  |
 * | GLR        | Fast for LR grammars + ambiguity             | Complex implementation            |
 * | CYK        | Simple, handles all CFGs                     | O(n³), large tables               |
 *
 * Earley wins because:
 * 1. **Preserves ambiguity**: We need a parse forest, not a single parse
 * 2. **Handles left recursion**: Important for NL grammars
 * 3. **Incremental**: Can be extended for "parse while typing"
 * 4. **Diagnostic-friendly**: Failed parses show where parsing stalled
 *
 * ## Architecture
 *
 * ```
 * Grammar Rules → Earley Engine → Parse Forest (Chart)
 *                                    ↓
 *                               Scoring → Ranked Parses
 *                                    ↓
 *                               Best Parse → Semantic Actions
 * ```
 *
 * @module gofai/nl/parser/earley-engine
 * @see gofai_goalA.md Step 106
 */

import type { Token, Span } from '../tokenizer/span-tokenizer';

// =============================================================================
// GRAMMAR — rules and symbols
// =============================================================================

/**
 * A grammar symbol: terminal or non-terminal.
 */
export type GrammarSymbol = TerminalSymbol | NonTerminalSymbol;

/**
 * A terminal symbol: matches a token.
 */
export interface TerminalSymbol {
  readonly kind: 'terminal';
  /** The match condition */
  readonly match: TerminalMatcher;
  /** Display name for diagnostics */
  readonly label: string;
}

/**
 * A non-terminal symbol: expands to rules.
 */
export interface NonTerminalSymbol {
  readonly kind: 'nonterminal';
  /** The non-terminal name */
  readonly name: string;
}

/**
 * How a terminal matches tokens.
 */
export type TerminalMatcher =
  | { readonly type: 'exact'; readonly text: string }
  | { readonly type: 'token_type'; readonly tokenType: string }
  | { readonly type: 'tag'; readonly tag: string }
  | { readonly type: 'regex'; readonly pattern: RegExp }
  | { readonly type: 'predicate'; readonly test: (token: Token) => boolean; readonly name: string }
  | { readonly type: 'any' };

/**
 * A grammar rule (production).
 */
export interface GrammarRule {
  /** Unique rule ID */
  readonly id: string;

  /** Left-hand side (the non-terminal being defined) */
  readonly lhs: string;

  /** Right-hand side (the expansion) */
  readonly rhs: readonly GrammarSymbol[];

  /** Rule priority (higher = preferred in ambiguity) */
  readonly priority: number;

  /** Semantic action ID (what meaning this rule builds) */
  readonly semanticAction?: string;

  /** Human-readable description */
  readonly description: string;

  /** Source module that defined this rule */
  readonly source: string;
}

/**
 * A complete grammar: a set of rules with a start symbol.
 */
export interface Grammar {
  /** The grammar name */
  readonly name: string;

  /** The start symbol */
  readonly startSymbol: string;

  /** All rules */
  readonly rules: readonly GrammarRule[];

  /** Rules indexed by LHS */
  readonly rulesByLhs: ReadonlyMap<string, readonly GrammarRule[]>;

  /** Metadata */
  readonly metadata: GrammarMetadata;
}

export interface GrammarMetadata {
  readonly totalRules: number;
  readonly totalNonTerminals: number;
  readonly totalTerminals: number;
  readonly source: string;
  readonly version: string;
}

// =============================================================================
// GRAMMAR BUILDER — fluent API for constructing grammars
// =============================================================================

/**
 * Build a grammar using a fluent API.
 */
export class GrammarBuilder {
  private readonly _rules: GrammarRule[] = [];
  private _startSymbol = 'S';
  private _name = 'unnamed';
  private _source = 'core';
  private _version = '1.0.0';
  private _nextPriority = 0;

  /**
   * Set the grammar name.
   */
  name(n: string): this {
    this._name = n;
    return this;
  }

  /**
   * Set the start symbol.
   */
  start(s: string): this {
    this._startSymbol = s;
    return this;
  }

  /**
   * Set the source module.
   */
  source(s: string): this {
    this._source = s;
    return this;
  }

  /**
   * Set the version.
   */
  version(v: string): this {
    this._version = v;
    return this;
  }

  /**
   * Add a rule.
   */
  rule(
    id: string,
    lhs: string,
    rhs: readonly GrammarSymbol[],
    options?: { priority?: number; semanticAction?: string; description?: string },
  ): this {
    const baseRule = {
      id,
      lhs,
      rhs,
      priority: options?.priority ?? this._nextPriority++,
      description: options?.description ?? `${lhs} → ${rhs.map(s => symbolLabel(s)).join(' ')}`,
      source: this._source,
    };
    const rule: GrammarRule = options?.semanticAction
      ? { ...baseRule, semanticAction: options.semanticAction }
      : baseRule;
    this._rules.push(rule);
    return this;
  }

  /**
   * Build the grammar.
   */
  build(): Grammar {
    const rulesByLhs = new Map<string, GrammarRule[]>();
    const nonTerminals = new Set<string>();
    const terminals = new Set<string>();

    for (const rule of this._rules) {
      nonTerminals.add(rule.lhs);
      const existing = rulesByLhs.get(rule.lhs);
      if (existing) {
        existing.push(rule);
      } else {
        rulesByLhs.set(rule.lhs, [rule]);
      }

      for (const sym of rule.rhs) {
        if (sym.kind === 'terminal') {
          terminals.add(sym.label);
        } else {
          nonTerminals.add(sym.name);
        }
      }
    }

    return {
      name: this._name,
      startSymbol: this._startSymbol,
      rules: this._rules,
      rulesByLhs,
      metadata: {
        totalRules: this._rules.length,
        totalNonTerminals: nonTerminals.size,
        totalTerminals: terminals.size,
        source: this._source,
        version: this._version,
      },
    };
  }
}

// =============================================================================
// SYMBOL CONSTRUCTORS — helpers for building grammar symbols
// =============================================================================

/**
 * Create a terminal that matches exact text.
 */
export function terminal(text: string): TerminalSymbol {
  return { kind: 'terminal', match: { type: 'exact', text: text.toLowerCase() }, label: `"${text}"` };
}

/**
 * Create a terminal that matches a token type.
 */
export function tokenType(type: string): TerminalSymbol {
  return { kind: 'terminal', match: { type: 'token_type', tokenType: type }, label: `<${type}>` };
}

/**
 * Create a terminal that matches a token tag.
 */
export function tokenTag(tag: string): TerminalSymbol {
  return { kind: 'terminal', match: { type: 'tag', tag }, label: `[${tag}]` };
}

/**
 * Create a terminal that matches a regex.
 */
export function regexTerminal(pattern: RegExp, label: string): TerminalSymbol {
  return { kind: 'terminal', match: { type: 'regex', pattern }, label };
}

/**
 * Create a terminal that matches any token.
 */
export function anyToken(): TerminalSymbol {
  return { kind: 'terminal', match: { type: 'any' }, label: '<any>' };
}

/**
 * Create a terminal with a custom predicate.
 */
export function predicateTerminal(
  name: string,
  test: (token: Token) => boolean,
): TerminalSymbol {
  return { kind: 'terminal', match: { type: 'predicate', test, name }, label: `<${name}>` };
}

/**
 * Create a non-terminal reference.
 */
export function nt(name: string): NonTerminalSymbol {
  return { kind: 'nonterminal', name };
}

/**
 * Get the display label for a symbol.
 */
export function symbolLabel(sym: GrammarSymbol): string {
  return sym.kind === 'terminal' ? sym.label : sym.name;
}

// =============================================================================
// EARLEY CHART — the parsing data structure
// =============================================================================

/**
 * An Earley item: a partially recognized rule.
 */
export interface EarleyItem {
  /** The grammar rule */
  readonly rule: GrammarRule;

  /** The dot position (how far we've matched) */
  readonly dot: number;

  /** The start position in the token stream */
  readonly start: number;

  /** Pointers to child items (for tree reconstruction) */
  readonly children: readonly EarleyItemChild[];

  /** Unique item key for deduplication */
  readonly key: string;
}

/**
 * A child of an Earley item (for parse tree reconstruction).
 */
export type EarleyItemChild =
  | { readonly type: 'terminal'; readonly token: Token }
  | { readonly type: 'nonterminal'; readonly item: EarleyItem };

/**
 * An Earley chart: one set per token position.
 */
export interface EarleyChart {
  /** The chart sets (one per token position + 1 for the end) */
  readonly sets: readonly EarleySet[];

  /** The tokens that were parsed */
  readonly tokens: readonly Token[];

  /** Whether the parse succeeded */
  readonly success: boolean;

  /** Completed items at the end (successful parses) */
  readonly completedParses: readonly EarleyItem[];

  /** Diagnostic: where parsing stalled (if it failed) */
  readonly stallPosition: number;

  /** Diagnostic: what was expected at the stall position */
  readonly expectedAtStall: readonly string[];
}

/**
 * One set in the Earley chart.
 */
export interface EarleySet {
  /** The position in the token stream */
  readonly position: number;

  /** The items in this set */
  readonly items: readonly EarleyItem[];
}

// =============================================================================
// EARLEY PARSER — the parsing algorithm
// =============================================================================

/**
 * Parse configuration.
 */
export interface ParseConfig {
  /** Maximum number of items per chart set (safety limit) */
  readonly maxItemsPerSet: number;

  /** Maximum total items (safety limit) */
  readonly maxTotalItems: number;

  /** Whether to record children for tree reconstruction */
  readonly buildTrees: boolean;

  /** Whether to collect diagnostics */
  readonly collectDiagnostics: boolean;
}

/**
 * Default parse configuration.
 */
export const DEFAULT_PARSE_CONFIG: ParseConfig = {
  maxItemsPerSet: 10000,
  maxTotalItems: 100000,
  buildTrees: true,
  collectDiagnostics: true,
};

/**
 * Parse a token stream using the Earley algorithm.
 */
export function earleyParse(
  grammar: Grammar,
  tokens: readonly Token[],
  config: ParseConfig = DEFAULT_PARSE_CONFIG,
): EarleyChart {
  const n = tokens.length;
  const sets: EarleyItem[][] = [];
  for (let i = 0; i <= n; i++) sets.push([]);

  const setKeys: Set<string>[] = [];
  for (let i = 0; i <= n; i++) setKeys.push(new Set());

  let totalItems = 0;
  let stallPosition = n;
  const expectedAtStall: string[] = [];

  // Helper: add item to set (with dedup)
  function addItem(setIndex: number, item: EarleyItem): boolean {
    const keys = setKeys[setIndex]!;
    if (keys.has(item.key)) return false;
    if (totalItems >= config.maxTotalItems) return false;
    const set = sets[setIndex]!;
    if (set.length >= config.maxItemsPerSet) return false;

    keys.add(item.key);
    set.push(item);
    totalItems++;
    return true;
  }

  // Helper: create item key
  function makeKey(ruleId: string, dot: number, start: number): string {
    return `${ruleId}:${dot}:${start}`;
  }

  // Seed: predict from start symbol
  const startRules = grammar.rulesByLhs.get(grammar.startSymbol) ?? [];
  for (const rule of startRules) {
    addItem(0, {
      rule,
      dot: 0,
      start: 0,
      children: [],
      key: makeKey(rule.id, 0, 0),
    });
  }

  // Process each set
  for (let i = 0; i <= n; i++) {
    const currentSet = sets[i]!;
    let j = 0;

    while (j < currentSet.length) {
      const item = currentSet[j]!;
      j++;

      if (item.dot < item.rule.rhs.length) {
        const nextSym = item.rule.rhs[item.dot]!;

        if (nextSym.kind === 'nonterminal') {
          // PREDICT: add all rules for this non-terminal
          const rules = grammar.rulesByLhs.get(nextSym.name) ?? [];
          for (const rule of rules) {
            addItem(i, {
              rule,
              dot: 0,
              start: i,
              children: [],
              key: makeKey(rule.id, 0, i),
            });
          }
        } else if (i < n) {
          // SCAN: try to match the terminal against the current token
          const token = tokens[i]!;
          if (matchesTerminal(nextSym, token)) {
            const newChildren = config.buildTrees
              ? [...item.children, { type: 'terminal' as const, token }]
              : [];
            addItem(i + 1, {
              rule: item.rule,
              dot: item.dot + 1,
              start: item.start,
              children: newChildren,
              key: makeKey(item.rule.id, item.dot + 1, item.start),
            });
          }
        }
      } else {
        // COMPLETE: this rule is fully matched
        const startSet = sets[item.start]!;
        for (const parent of startSet) {
          if (parent.dot < parent.rule.rhs.length) {
            const nextSym = parent.rule.rhs[parent.dot]!;
            if (nextSym.kind === 'nonterminal' && nextSym.name === item.rule.lhs) {
              const newChildren = config.buildTrees
                ? [...parent.children, { type: 'nonterminal' as const, item }]
                : [];
              addItem(i, {
                rule: parent.rule,
                dot: parent.dot + 1,
                start: parent.start,
                children: newChildren,
                key: makeKey(parent.rule.id, parent.dot + 1, parent.start),
              });
            }
          }
        }
      }
    }

    // Check for stall (no items in next set after scanning)
    if (i < n && sets[i + 1]!.length === 0) {
      stallPosition = i;
      // Collect expected terminals
      for (const item of currentSet) {
        if (item.dot < item.rule.rhs.length) {
          const nextSym = item.rule.rhs[item.dot]!;
          const label = symbolLabel(nextSym);
          if (!expectedAtStall.includes(label)) {
            expectedAtStall.push(label);
          }
        }
      }
      break;
    }
  }

  // Find completed parses
  const finalSet = sets[n] ?? [];
  const completed = finalSet.filter(
    item => item.dot === item.rule.rhs.length &&
            item.start === 0 &&
            item.rule.lhs === grammar.startSymbol,
  );

  return {
    sets: sets.map((items, pos) => ({ position: pos, items })),
    tokens,
    success: completed.length > 0,
    completedParses: completed,
    stallPosition,
    expectedAtStall,
  };
}

/**
 * Check if a terminal symbol matches a token.
 */
function matchesTerminal(sym: TerminalSymbol, token: Token): boolean {
  const m = sym.match;
  switch (m.type) {
    case 'exact':
      return token.text === m.text;
    case 'token_type':
      return token.type === m.tokenType;
    case 'tag':
      return token.tags.includes(m.tag as never);
    case 'regex':
      return m.pattern.test(token.text);
    case 'predicate':
      return m.test(token);
    case 'any':
      return true;
  }
}

// =============================================================================
// PARSE RESULT — extracted from the chart
// =============================================================================

/**
 * A parse tree node.
 */
export type ParseNode = TerminalNode | NonTerminalNode;

export interface TerminalNode {
  readonly type: 'terminal';
  readonly token: Token;
  readonly span: Span;
}

export interface NonTerminalNode {
  readonly type: 'nonterminal';
  readonly symbol: string;
  readonly ruleId: string;
  readonly children: readonly ParseNode[];
  readonly span: Span;
  readonly priority: number;
  readonly semanticAction?: string;
}

/**
 * Extract parse trees from the chart.
 */
export function extractParseTrees(chart: EarleyChart): readonly ParseNode[] {
  return chart.completedParses.map(item => itemToParseNode(item, chart.tokens));
}

/**
 * Convert an Earley item to a parse tree node.
 */
function itemToParseNode(item: EarleyItem, tokens: readonly Token[]): NonTerminalNode {
  const children: ParseNode[] = [];

  for (const child of item.children) {
    if (child.type === 'terminal') {
      children.push({
        type: 'terminal',
        token: child.token,
        span: child.token.span,
      });
    } else {
      children.push(itemToParseNode(child.item, tokens));
    }
  }

  // Compute span
  let startPos = Infinity;
  let endPos = -Infinity;
  for (const child of children) {
    if (child.span.start < startPos) startPos = child.span.start;
    if (child.span.end > endPos) endPos = child.span.end;
  }
  if (children.length === 0) {
    // Empty production
    const token = tokens[item.start];
    startPos = token ? token.span.start : 0;
    endPos = startPos;
  }

  const baseNode = {
    type: 'nonterminal' as const,
    symbol: item.rule.lhs,
    ruleId: item.rule.id,
    children,
    span: { start: startPos, end: endPos },
    priority: item.rule.priority,
  };
  const resultNode: NonTerminalNode = item.rule.semanticAction
    ? { ...baseNode, semanticAction: item.rule.semanticAction }
    : baseNode;
  return resultNode;
}

// =============================================================================
// PARSE DIAGNOSTICS — why did parsing fail?
// =============================================================================

/**
 * Diagnostic information about a failed parse.
 */
export interface ParseDiagnostic {
  /** Where parsing stalled (token index) */
  readonly stallPosition: number;

  /** The token at the stall position, if any */
  readonly stallToken: Token | undefined;

  /** What symbols were expected */
  readonly expected: readonly string[];

  /** What was found */
  readonly found: string;

  /** Partial parses (how far each rule got) */
  readonly partialParses: readonly PartialParse[];

  /** Human-readable error message */
  readonly message: string;

  /** Suggestions for fixing the input */
  readonly suggestions: readonly string[];
}

/**
 * A partial parse: how far a rule got before failing.
 */
export interface PartialParse {
  readonly ruleId: string;
  readonly ruleDescription: string;
  readonly matchedSymbols: number;
  readonly totalSymbols: number;
  readonly percentComplete: number;
}

/**
 * Generate diagnostics for a failed parse.
 */
export function generateDiagnostics(chart: EarleyChart): ParseDiagnostic {
  const stallToken = chart.tokens[chart.stallPosition];
  const found = stallToken ? `"${stallToken.original}"` : '<end of input>';

  // Find partial parses (items that made progress)
  const partials: PartialParse[] = [];
  for (const set of chart.sets) {
    for (const item of set.items) {
      if (item.dot > 0 && item.dot < item.rule.rhs.length) {
        partials.push({
          ruleId: item.rule.id,
          ruleDescription: item.rule.description,
          matchedSymbols: item.dot,
          totalSymbols: item.rule.rhs.length,
          percentComplete: Math.round((item.dot / item.rule.rhs.length) * 100),
        });
      }
    }
  }

  // Sort partials by completeness
  partials.sort((a, b) => b.percentComplete - a.percentComplete);

  // Deduplicate
  const seen = new Set<string>();
  const uniquePartials = partials.filter(p => {
    if (seen.has(p.ruleId)) return false;
    seen.add(p.ruleId);
    return true;
  }).slice(0, 10);

  // Generate message
  const expectedList = chart.expectedAtStall.slice(0, 5).join(', ');
  const message = chart.stallPosition < chart.tokens.length
    ? `Unexpected ${found} at position ${chart.stallPosition}. Expected: ${expectedList}`
    : `Unexpected end of input. Expected: ${expectedList}`;

  // Generate suggestions
  const suggestions: string[] = [];
  if (chart.expectedAtStall.length > 0) {
    suggestions.push(`Try using one of: ${chart.expectedAtStall.slice(0, 3).join(', ')}`);
  }
  if (uniquePartials.length > 0) {
    const best = uniquePartials[0]!;
    suggestions.push(`Closest match: ${best.ruleDescription} (${best.percentComplete}% complete)`);
  }

  return {
    stallPosition: chart.stallPosition,
    stallToken,
    expected: chart.expectedAtStall,
    found,
    partialParses: uniquePartials,
    message,
    suggestions,
  };
}

// =============================================================================
// FORMATTING
// =============================================================================

/**
 * Format a parse tree for display.
 */
export function formatParseTree(node: ParseNode, indent: number = 0): string {
  const pad = '  '.repeat(indent);

  if (node.type === 'terminal') {
    return `${pad}"${node.token.original}"`;
  }

  const lines = [`${pad}${node.symbol} [${node.ruleId}]`];
  for (const child of node.children) {
    lines.push(formatParseTree(child, indent + 1));
  }
  return lines.join('\n');
}

/**
 * Format the Earley chart for debugging.
 */
export function formatChart(chart: EarleyChart): string {
  const lines: string[] = [];
  lines.push(`Chart: ${chart.success ? 'SUCCESS' : 'FAILED'}`);
  lines.push(`Tokens: ${chart.tokens.map(t => t.original).join(' ')}`);
  lines.push(`Completed parses: ${chart.completedParses.length}`);

  for (const set of chart.sets) {
    lines.push(`\n--- Set ${set.position} ---`);
    for (const item of set.items.slice(0, 20)) {
      const rhs = item.rule.rhs.map((s, i) => {
        const label = symbolLabel(s);
        return i === item.dot ? `• ${label}` : label;
      });
      if (item.dot === item.rule.rhs.length) rhs.push('•');
      lines.push(`  ${item.rule.lhs} → ${rhs.join(' ')} (from ${item.start})`);
    }
    if (set.items.length > 20) {
      lines.push(`  ... and ${set.items.length - 20} more items`);
    }
  }

  return lines.join('\n');
}

/**
 * Format a grammar for display.
 */
export function formatGrammar(grammar: Grammar): string {
  const lines: string[] = [];
  lines.push(`Grammar: ${grammar.name} (start: ${grammar.startSymbol})`);
  lines.push(`${grammar.metadata.totalRules} rules, ${grammar.metadata.totalNonTerminals} non-terminals, ${grammar.metadata.totalTerminals} terminals`);
  lines.push('');

  for (const rule of grammar.rules) {
    const rhs = rule.rhs.map(s => symbolLabel(s)).join(' ');
    const prio = rule.priority > 0 ? ` [priority: ${rule.priority}]` : '';
    lines.push(`  ${rule.id}: ${rule.lhs} → ${rhs}${prio}`);
  }

  return lines.join('\n');
}

// =============================================================================
// STATISTICS
// =============================================================================

export interface ParseStats {
  readonly totalItems: number;
  readonly maxSetSize: number;
  readonly avgSetSize: number;
  readonly completedParses: number;
  readonly success: boolean;
}

export function getParseStats(chart: EarleyChart): ParseStats {
  let total = 0;
  let maxSize = 0;

  for (const set of chart.sets) {
    total += set.items.length;
    if (set.items.length > maxSize) maxSize = set.items.length;
  }

  return {
    totalItems: total,
    maxSetSize: maxSize,
    avgSetSize: chart.sets.length > 0 ? total / chart.sets.length : 0,
    completedParses: chart.completedParses.length,
    success: chart.success,
  };
}

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

export const PARSER_ENGINE_RULES = [
  'Rule PARSE-001: The Earley algorithm is used for parsing. It handles all ' +
  'context-free grammars, preserves ambiguity, and supports left recursion.',

  'Rule PARSE-002: Parse ambiguity is preserved in the chart. All valid ' +
  'parses are available for scoring and selection.',

  'Rule PARSE-003: Terminal symbols match tokens by exact text, token type, ' +
  'token tag, regex, or custom predicate.',

  'Rule PARSE-004: Grammar rules have priorities. Higher-priority rules are ' +
  'preferred when multiple parses exist.',

  'Rule PARSE-005: Each rule optionally has a semantic action ID that links ' +
  'it to a meaning constructor in the semantics module.',

  'Rule PARSE-006: The chart has safety limits (maxItemsPerSet, maxTotalItems) ' +
  'to prevent runaway parsing on pathological inputs.',

  'Rule PARSE-007: Failed parses generate diagnostics: where parsing stalled, ' +
  'what was expected, and partial parse progress.',

  'Rule PARSE-008: Parse trees preserve spans from the tokenizer, enabling ' +
  'provenance tracking from parse node to source text.',

  'Rule PARSE-009: Grammars are built using a fluent GrammarBuilder API. ' +
  'Extensions add rules by extending the builder.',

  'Rule PARSE-010: The parser is deterministic: the same grammar + tokens ' +
  'always produce the same chart.',

  'Rule PARSE-011: Parse diagnostics suggest corrections when possible, ' +
  'referencing known vocabulary terms.',

  'Rule PARSE-012: The Earley algorithm runs in O(n³) worst case, O(n²) for ' +
  'unambiguous grammars, and O(n) for regular grammars.',
] as const;
