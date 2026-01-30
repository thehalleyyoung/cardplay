/**
 * GOFAI Pragmatics — Demonstrative Referent Selection
 *
 * Specifies how demonstratives ("this", "that", "these", "those")
 * choose referents using salience, recency, and UI focus.
 *
 * ## Demonstrative Semantics in Music Editing
 *
 * Demonstratives in natural language carry two dimensions:
 * - **Proximity**: proximal ("this/these") vs. distal ("that/those")
 * - **Number**: singular ("this/that") vs. plural ("these/those")
 *
 * In music editing, proximity maps to:
 * - **Proximal**: Currently focused, selected, or being edited
 * - **Distal**: Previously mentioned, recently edited, or contextually salient
 *
 * ## Resolution Strategy
 *
 * 1. Check for a UI selection (proximal demonstratives)
 * 2. Check for salience-ranked candidates
 * 3. Check for recent discourse referents
 * 4. Apply the demonstrative's proximity bias
 * 5. If ambiguous, ask for clarification
 *
 * @module gofai/pragmatics/demonstrative-resolution
 * @see gofai_goalA.md Step 093
 */

// =============================================================================
// DEMONSTRATIVE TYPES
// =============================================================================

/**
 * A demonstrative expression found in user input.
 */
export interface DemonstrativeExpression {
  /** The demonstrative word */
  readonly word: DemonstrativeWord;

  /** Proximity dimension */
  readonly proximity: Proximity;

  /** Number dimension */
  readonly number: GrammaticalNumber;

  /** The noun phrase it modifies (if any) */
  readonly nounPhrase?: string;

  /** Entity type inferred from the noun phrase */
  readonly entityType?: DemonstrativeEntityType;

  /** Position in the utterance */
  readonly position: number;

  /** The full span text */
  readonly spanText: string;
}

/**
 * The demonstrative words.
 */
export type DemonstrativeWord = 'this' | 'that' | 'these' | 'those';

/**
 * Proximity dimension.
 */
export type Proximity = 'proximal' | 'distal';

/**
 * Grammatical number.
 */
export type GrammaticalNumber = 'singular' | 'plural';

/**
 * Entity types that demonstratives can refer to.
 */
export type DemonstrativeEntityType =
  | 'section'       // "this section", "that chorus"
  | 'layer'         // "this track", "those drums"
  | 'card'          // "this card"
  | 'parameter'     // "this parameter"
  | 'event'         // "this note", "those notes"
  | 'selection'     // "this selection"
  | 'edit'          // "that change", "those edits"
  | 'plan'          // "this plan"
  | 'range'         // "this range", "those bars"
  | 'sound'         // "that sound", "this tone"
  | 'pattern'       // "this pattern", "that groove"
  | 'effect'        // "this reverb", "that delay"
  | 'unspecified';  // Bare demonstrative ("do this", "fix that")

// =============================================================================
// DEMONSTRATIVE VOCABULARY
// =============================================================================

/**
 * Map of noun phrases to entity types.
 */
export interface DemonstrativeNounMapping {
  readonly phrases: readonly string[];
  readonly entityType: DemonstrativeEntityType;
  readonly pluralPhrases: readonly string[];
}

export const DEMONSTRATIVE_NOUN_MAPPINGS: readonly DemonstrativeNounMapping[] = [
  {
    phrases: ['section', 'part', 'verse', 'chorus', 'bridge', 'intro', 'outro', 'breakdown', 'drop', 'build', 'hook'],
    entityType: 'section',
    pluralPhrases: ['sections', 'parts', 'verses', 'choruses', 'bridges'],
  },
  {
    phrases: ['track', 'layer', 'instrument', 'channel', 'voice', 'line'],
    entityType: 'layer',
    pluralPhrases: ['tracks', 'layers', 'instruments', 'channels', 'voices', 'lines'],
  },
  {
    phrases: ['note', 'event', 'hit', 'beat'],
    entityType: 'event',
    pluralPhrases: ['notes', 'events', 'hits', 'beats'],
  },
  {
    phrases: ['card', 'module'],
    entityType: 'card',
    pluralPhrases: ['cards', 'modules'],
  },
  {
    phrases: ['parameter', 'param', 'knob', 'slider', 'value', 'setting'],
    entityType: 'parameter',
    pluralPhrases: ['parameters', 'params', 'knobs', 'sliders', 'values', 'settings'],
  },
  {
    phrases: ['selection', 'selected'],
    entityType: 'selection',
    pluralPhrases: ['selections'],
  },
  {
    phrases: ['change', 'edit', 'modification', 'tweak', 'adjustment'],
    entityType: 'edit',
    pluralPhrases: ['changes', 'edits', 'modifications', 'tweaks', 'adjustments'],
  },
  {
    phrases: ['plan', 'step', 'action'],
    entityType: 'plan',
    pluralPhrases: ['plans', 'steps', 'actions'],
  },
  {
    phrases: ['range', 'bar', 'measure', 'region', 'area', 'span'],
    entityType: 'range',
    pluralPhrases: ['ranges', 'bars', 'measures', 'regions', 'areas', 'spans'],
  },
  {
    phrases: ['sound', 'tone', 'timbre', 'patch', 'preset'],
    entityType: 'sound',
    pluralPhrases: ['sounds', 'tones', 'patches', 'presets'],
  },
  {
    phrases: ['pattern', 'groove', 'rhythm', 'riff', 'motif', 'lick', 'loop'],
    entityType: 'pattern',
    pluralPhrases: ['patterns', 'grooves', 'rhythms', 'riffs', 'motifs', 'licks', 'loops'],
  },
  {
    phrases: ['reverb', 'delay', 'echo', 'effect', 'fx', 'plugin', 'compressor', 'eq'],
    entityType: 'effect',
    pluralPhrases: ['reverbs', 'delays', 'effects', 'plugins'],
  },
];

// Build lookup maps
const _nounToEntity = new Map<string, DemonstrativeEntityType>();
for (const mapping of DEMONSTRATIVE_NOUN_MAPPINGS) {
  for (const phrase of mapping.phrases) {
    _nounToEntity.set(phrase.toLowerCase(), mapping.entityType);
  }
  for (const phrase of mapping.pluralPhrases) {
    _nounToEntity.set(phrase.toLowerCase(), mapping.entityType);
  }
}

/**
 * Infer entity type from a noun phrase.
 */
export function inferEntityType(nounPhrase: string): DemonstrativeEntityType {
  const lower = nounPhrase.toLowerCase().trim();
  return _nounToEntity.get(lower) ?? 'unspecified';
}

// =============================================================================
// RESOLUTION CONTEXT
// =============================================================================

/**
 * Context for resolving a demonstrative.
 */
export interface DemonstrativeResolutionContext {
  /** Current UI selection (if any) */
  readonly uiSelection?: UISelectionInfo;

  /** Currently focused entity */
  readonly focusedEntity?: FocusedEntityInfo;

  /** Discourse referents from recent turns */
  readonly discourseReferents: readonly DiscourseReferentInfo[];

  /** Most recently edited entities */
  readonly recentEdits: readonly RecentEditInfo[];

  /** Current turn number */
  readonly turnNumber: number;

  /** Available candidates of each type */
  readonly candidates: readonly CandidateEntity[];
}

export interface UISelectionInfo {
  readonly entityType: DemonstrativeEntityType;
  readonly entityIds: readonly string[];
  readonly displayName: string;
  readonly eventCount?: number;
  readonly isActive: boolean;
}

export interface FocusedEntityInfo {
  readonly entityType: DemonstrativeEntityType;
  readonly entityId: string;
  readonly displayName: string;
  readonly depth: number;
}

export interface DiscourseReferentInfo {
  readonly entityType: DemonstrativeEntityType;
  readonly entityId: string;
  readonly displayName: string;
  readonly mentionTurn: number;
  readonly salience: number;
}

export interface RecentEditInfo {
  readonly entityType: DemonstrativeEntityType;
  readonly entityId: string;
  readonly displayName: string;
  readonly editTurn: number;
  readonly editDescription: string;
}

export interface CandidateEntity {
  readonly entityType: DemonstrativeEntityType;
  readonly entityId: string;
  readonly displayName: string;
  readonly salience: number;
}

// =============================================================================
// RESOLUTION RULES
// =============================================================================

/**
 * A rule for resolving demonstratives.
 */
export interface DemonstrativeResolutionRule {
  readonly id: string;
  readonly description: string;
  readonly priority: number;
  readonly appliesTo: {
    readonly proximity?: Proximity;
    readonly number?: GrammaticalNumber;
    readonly entityType?: DemonstrativeEntityType;
  };
  readonly condition: RuleCondition;
  readonly action: RuleAction;
  readonly example: string;
}

export type RuleCondition =
  | { readonly kind: 'has_selection' }
  | { readonly kind: 'has_focus' }
  | { readonly kind: 'has_discourse_referent'; readonly maxTurnsAgo: number }
  | { readonly kind: 'has_recent_edit'; readonly maxTurnsAgo: number }
  | { readonly kind: 'has_candidate_of_type' }
  | { readonly kind: 'always' };

export type RuleAction =
  | { readonly kind: 'use_selection' }
  | { readonly kind: 'use_focus' }
  | { readonly kind: 'use_most_salient' }
  | { readonly kind: 'use_most_recent_mention' }
  | { readonly kind: 'use_most_recent_edit' }
  | { readonly kind: 'use_candidate_by_salience' }
  | { readonly kind: 'ask_clarification' };

/**
 * Canonical demonstrative resolution rules.
 */
export const DEMONSTRATIVE_RESOLUTION_RULES: readonly DemonstrativeResolutionRule[] = [
  // ---- Proximal + Selection ----
  {
    id: 'prox-selection',
    description: 'Proximal demonstrative ("this/these") with active UI selection resolves to the selection.',
    priority: 100,
    appliesTo: { proximity: 'proximal' },
    condition: { kind: 'has_selection' },
    action: { kind: 'use_selection' },
    example: '"This note" with a note selected → the selected note.',
  },

  // ---- Proximal + Focus ----
  {
    id: 'prox-focus',
    description: 'Proximal demonstrative with focus but no selection resolves to focused entity.',
    priority: 90,
    appliesTo: { proximity: 'proximal' },
    condition: { kind: 'has_focus' },
    action: { kind: 'use_focus' },
    example: '"This section" with Chorus 2 focused → Chorus 2.',
  },

  // ---- Distal + Recent Edit ----
  {
    id: 'distal-recent-edit',
    description: 'Distal demonstrative ("that/those") referring to edits resolves to the most recent edit.',
    priority: 95,
    appliesTo: { proximity: 'distal', entityType: 'edit' },
    condition: { kind: 'has_recent_edit', maxTurnsAgo: 5 },
    action: { kind: 'use_most_recent_edit' },
    example: '"That change" → the most recently applied edit.',
  },

  // ---- Distal + Discourse Referent ----
  {
    id: 'distal-discourse',
    description: 'Distal demonstrative resolves to the most salient discourse referent.',
    priority: 80,
    appliesTo: { proximity: 'distal' },
    condition: { kind: 'has_discourse_referent', maxTurnsAgo: 10 },
    action: { kind: 'use_most_salient' },
    example: '"Make that brighter" → most salient previously mentioned entity.',
  },

  // ---- Proximal + Discourse (no selection/focus) ----
  {
    id: 'prox-discourse',
    description: 'Proximal demonstrative without selection falls back to most recent discourse mention.',
    priority: 70,
    appliesTo: { proximity: 'proximal' },
    condition: { kind: 'has_discourse_referent', maxTurnsAgo: 3 },
    action: { kind: 'use_most_recent_mention' },
    example: '"This" after mentioning Chorus 2 → Chorus 2.',
  },

  // ---- Type-constrained candidate ----
  {
    id: 'type-candidate',
    description: 'When the demonstrative specifies an entity type, find the most salient candidate of that type.',
    priority: 60,
    appliesTo: {},
    condition: { kind: 'has_candidate_of_type' },
    action: { kind: 'use_candidate_by_salience' },
    example: '"Those drums" when drums track exists → drums track.',
  },

  // ---- Bare distal → most salient ----
  {
    id: 'bare-distal-salient',
    description: 'Bare distal demonstrative ("that") without a noun resolves to the most salient entity.',
    priority: 50,
    appliesTo: { proximity: 'distal', entityType: 'unspecified' },
    condition: { kind: 'has_discourse_referent', maxTurnsAgo: 5 },
    action: { kind: 'use_most_salient' },
    example: '"Fix that" → most salient entity from recent discourse.',
  },

  // ---- Fallback: ask ----
  {
    id: 'fallback-ask',
    description: 'When no resolution strategy succeeds, ask the user to clarify.',
    priority: 0,
    appliesTo: {},
    condition: { kind: 'always' },
    action: { kind: 'ask_clarification' },
    example: '"Change this" with no context → "What do you want to change?"',
  },
];

// =============================================================================
// RESOLUTION FUNCTION
// =============================================================================

/**
 * Result of demonstrative resolution.
 */
export interface DemonstrativeResolutionResult {
  /** Whether a referent was found */
  readonly resolved: boolean;

  /** The resolved entity (if found) */
  readonly referent?: ResolvedReferent;

  /** Which rule was applied */
  readonly ruleId: string;

  /** Confidence (0–1) */
  readonly confidence: number;

  /** Alternative candidates (for disambiguation) */
  readonly alternatives: readonly ResolvedReferent[];

  /** Human-readable explanation */
  readonly explanation: string;

  /** Whether clarification is needed */
  readonly needsClarification: boolean;

  /** Clarification prompt (if needed) */
  readonly clarificationPrompt?: string;
}

export interface ResolvedReferent {
  readonly entityType: DemonstrativeEntityType;
  readonly entityId: string;
  readonly displayName: string;
  readonly salience: number;
  readonly source: ReferentSource;
}

export type ReferentSource =
  | 'ui_selection'
  | 'ui_focus'
  | 'discourse_salience'
  | 'discourse_recency'
  | 'recent_edit'
  | 'type_match'
  | 'fallback';

/**
 * Resolve a demonstrative expression to its referent.
 */
export function resolveDemonstrative(
  expr: DemonstrativeExpression,
  context: DemonstrativeResolutionContext
): DemonstrativeResolutionResult {
  // Sort rules by priority (highest first)
  const sortedRules = [...DEMONSTRATIVE_RESOLUTION_RULES].sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    // Check if rule applies to this demonstrative
    if (!ruleApplies(rule, expr)) continue;

    // Check if rule condition is met
    if (!ruleConditionMet(rule.condition, expr, context)) continue;

    // Apply the rule
    const result = applyRule(rule, expr, context);
    if (result) return result;
  }

  // Fallback: ask clarification
  return {
    resolved: false,
    ruleId: 'fallback-ask',
    confidence: 0,
    alternatives: [],
    explanation: `Cannot resolve "${expr.spanText}" — no matching context found.`,
    needsClarification: true,
    clarificationPrompt: buildClarificationPrompt(expr, context),
  };
}

function ruleApplies(rule: DemonstrativeResolutionRule, expr: DemonstrativeExpression): boolean {
  if (rule.appliesTo.proximity && rule.appliesTo.proximity !== expr.proximity) return false;
  if (rule.appliesTo.number && rule.appliesTo.number !== expr.number) return false;
  if (rule.appliesTo.entityType && rule.appliesTo.entityType !== expr.entityType) return false;
  return true;
}

function ruleConditionMet(
  condition: RuleCondition,
  expr: DemonstrativeExpression,
  context: DemonstrativeResolutionContext
): boolean {
  switch (condition.kind) {
    case 'has_selection':
      return context.uiSelection !== undefined && context.uiSelection.isActive;
    case 'has_focus':
      return context.focusedEntity !== undefined;
    case 'has_discourse_referent': {
      const matching = context.discourseReferents.filter(r =>
        context.turnNumber - r.mentionTurn <= condition.maxTurnsAgo &&
        (expr.entityType === 'unspecified' || r.entityType === expr.entityType)
      );
      return matching.length > 0;
    }
    case 'has_recent_edit': {
      const matching = context.recentEdits.filter(e =>
        context.turnNumber - e.editTurn <= condition.maxTurnsAgo &&
        (expr.entityType === 'unspecified' || e.entityType === expr.entityType || expr.entityType === 'edit')
      );
      return matching.length > 0;
    }
    case 'has_candidate_of_type':
      return expr.entityType !== 'unspecified' &&
        context.candidates.some(c => c.entityType === expr.entityType);
    case 'always':
      return true;
  }
}

function applyRule(
  rule: DemonstrativeResolutionRule,
  expr: DemonstrativeExpression,
  context: DemonstrativeResolutionContext
): DemonstrativeResolutionResult | undefined {
  switch (rule.action.kind) {
    case 'use_selection': {
      if (!context.uiSelection) return undefined;
      const sel = context.uiSelection;
      return {
        resolved: true,
        referent: {
          entityType: sel.entityType,
          entityId: sel.entityIds[0] ?? '',
          displayName: sel.displayName,
          salience: 1.0,
          source: 'ui_selection',
        },
        ruleId: rule.id,
        confidence: 0.95,
        alternatives: [],
        explanation: `"${expr.spanText}" → ${sel.displayName} (from UI selection)`,
        needsClarification: false,
      };
    }

    case 'use_focus': {
      if (!context.focusedEntity) return undefined;
      const focus = context.focusedEntity;
      return {
        resolved: true,
        referent: {
          entityType: focus.entityType,
          entityId: focus.entityId,
          displayName: focus.displayName,
          salience: 0.9,
          source: 'ui_focus',
        },
        ruleId: rule.id,
        confidence: 0.85,
        alternatives: [],
        explanation: `"${expr.spanText}" → ${focus.displayName} (currently focused)`,
        needsClarification: false,
      };
    }

    case 'use_most_salient': {
      const matching = context.discourseReferents
        .filter(r => expr.entityType === 'unspecified' || r.entityType === expr.entityType)
        .sort((a, b) => b.salience - a.salience);

      if (matching.length === 0) return undefined;

      const best = matching[0];
      if (!best) return undefined;
      const secondBest = matching[1];
      const gap = secondBest ? best.salience - secondBest.salience : 1.0;
      const confident = gap > 0.15;

      const baseResult: DemonstrativeResolutionResult = {
        resolved: confident,
        referent: {
          entityType: best.entityType,
          entityId: best.entityId,
          displayName: best.displayName,
          salience: best.salience,
          source: 'discourse_salience',
        },
        ruleId: rule.id,
        confidence: confident ? 0.8 : 0.5,
        alternatives: matching.slice(1, 4).map(r => ({
          entityType: r.entityType,
          entityId: r.entityId,
          displayName: r.displayName,
          salience: r.salience,
          source: 'discourse_salience' as const,
        })),
        explanation: confident
          ? `"${expr.spanText}" → ${best.displayName} (most salient, gap ${(gap * 100).toFixed(0)}%)`
          : `"${expr.spanText}" is ambiguous between ${best.displayName} and ${secondBest?.displayName}`,
        needsClarification: !confident,
      };
      if (!confident) {
        return { ...baseResult, clarificationPrompt: buildClarificationPrompt(expr, context) };
      }
      return baseResult;
    }

    case 'use_most_recent_mention': {
      const matching = context.discourseReferents
        .filter(r => expr.entityType === 'unspecified' || r.entityType === expr.entityType)
        .sort((a, b) => b.mentionTurn - a.mentionTurn);

      if (matching.length === 0) return undefined;
      const best = matching[0];
      if (!best) return undefined;

      return {
        resolved: true,
        referent: {
          entityType: best.entityType,
          entityId: best.entityId,
          displayName: best.displayName,
          salience: best.salience,
          source: 'discourse_recency',
        },
        ruleId: rule.id,
        confidence: 0.75,
        alternatives: matching.slice(1, 3).map(r => ({
          entityType: r.entityType,
          entityId: r.entityId,
          displayName: r.displayName,
          salience: r.salience,
          source: 'discourse_recency' as const,
        })),
        explanation: `"${expr.spanText}" → ${best.displayName} (most recently mentioned, turn ${best.mentionTurn})`,
        needsClarification: false,
      };
    }

    case 'use_most_recent_edit': {
      const matching = context.recentEdits
        .filter(e => expr.entityType === 'unspecified' || e.entityType === expr.entityType || expr.entityType === 'edit')
        .sort((a, b) => b.editTurn - a.editTurn);

      if (matching.length === 0) return undefined;
      const best = matching[0];
      if (!best) return undefined;

      return {
        resolved: true,
        referent: {
          entityType: best.entityType,
          entityId: best.entityId,
          displayName: `${best.displayName} (${best.editDescription})`,
          salience: 0.9,
          source: 'recent_edit',
        },
        ruleId: rule.id,
        confidence: 0.85,
        alternatives: [],
        explanation: `"${expr.spanText}" → ${best.editDescription} (most recent edit, turn ${best.editTurn})`,
        needsClarification: false,
      };
    }

    case 'use_candidate_by_salience': {
      const matching = context.candidates
        .filter(c => c.entityType === expr.entityType)
        .sort((a, b) => b.salience - a.salience);

      if (matching.length === 0) return undefined;
      const best = matching[0];
      if (!best) return undefined;

      const candidateResult: DemonstrativeResolutionResult = {
        resolved: matching.length === 1,
        referent: {
          entityType: best.entityType,
          entityId: best.entityId,
          displayName: best.displayName,
          salience: best.salience,
          source: 'type_match',
        },
        ruleId: rule.id,
        confidence: matching.length === 1 ? 0.9 : 0.5,
        alternatives: matching.slice(1, 4).map(c => ({
          entityType: c.entityType,
          entityId: c.entityId,
          displayName: c.displayName,
          salience: c.salience,
          source: 'type_match' as const,
        })),
        explanation: matching.length === 1
          ? `"${expr.spanText}" → ${best.displayName} (only ${expr.entityType})`
          : `"${expr.spanText}" matches ${matching.length} ${expr.entityType}s`,
        needsClarification: matching.length > 1,
      };
      if (matching.length > 1) {
        return { ...candidateResult, clarificationPrompt: buildClarificationPrompt(expr, context) };
      }
      return candidateResult;
    }

    case 'ask_clarification':
      return {
        resolved: false,
        ruleId: rule.id,
        confidence: 0,
        alternatives: [],
        explanation: `Cannot resolve "${expr.spanText}" — asking for clarification.`,
        needsClarification: true,
        clarificationPrompt: buildClarificationPrompt(expr, context),
      };
  }
}

function buildClarificationPrompt(
  expr: DemonstrativeExpression,
  context: DemonstrativeResolutionContext
): string {
  const typeLabel = expr.entityType !== 'unspecified' ? ` (${expr.entityType})` : '';
  const candidates = context.candidates
    .filter(c => expr.entityType === 'unspecified' || c.entityType === expr.entityType)
    .slice(0, 5);

  if (candidates.length === 0) {
    return `What does "${expr.spanText}" refer to?`;
  }

  const options = candidates.map(c => c.displayName).join(', ');
  return `Which${typeLabel} does "${expr.spanText}" refer to? Options: ${options}`;
}

// =============================================================================
// PARSING DEMONSTRATIVES FROM TEXT
// =============================================================================

/**
 * Extract demonstrative expressions from user input.
 */
export function parseDemonstratives(text: string): readonly DemonstrativeExpression[] {
  const results: DemonstrativeExpression[] = [];
  const lower = text.toLowerCase();

  const patterns: Array<{
    word: DemonstrativeWord;
    proximity: Proximity;
    number: GrammaticalNumber;
  }> = [
    { word: 'these', proximity: 'proximal', number: 'plural' },
    { word: 'those', proximity: 'distal', number: 'plural' },
    { word: 'this', proximity: 'proximal', number: 'singular' },
    { word: 'that', proximity: 'distal', number: 'singular' },
  ];

  for (const pattern of patterns) {
    let searchFrom = 0;
    while (searchFrom < lower.length) {
      const idx = lower.indexOf(pattern.word, searchFrom);
      if (idx === -1) break;

      // Check word boundaries
      const before = idx > 0 ? lower[idx - 1] : ' ';
      const afterIdx = idx + pattern.word.length;
      const after = afterIdx < lower.length ? lower[afterIdx] : ' ';

      if ((before === ' ' || before === ',' || before === '"' || before === "'") &&
          (after === ' ' || after === ',' || after === '.' || after === '!' || after === '?' || after === '"' || after === "'" || afterIdx >= lower.length)) {

        // Try to extract the following noun phrase
        const restOfText = text.slice(afterIdx).trim();
        const nounMatch = restOfText.match(/^(\w+(?:\s+\w+)?)/);
        const nounPhrase = nounMatch ? nounMatch[1] : undefined;
        const entityType = nounPhrase ? inferEntityType(nounPhrase) : 'unspecified';

        const spanEnd = nounPhrase
          ? afterIdx + restOfText.indexOf(nounPhrase) + nounPhrase.length
          : afterIdx;

        const baseExpr = {
          word: pattern.word,
          proximity: pattern.proximity,
          number: pattern.number,
          entityType,
          position: idx,
          spanText: text.slice(idx, spanEnd).trim(),
        };
        if (nounPhrase) {
          results.push({ ...baseExpr, nounPhrase });
        } else {
          results.push(baseExpr);
        }
      }

      searchFrom = idx + pattern.word.length;
    }
  }

  return results.sort((a, b) => a.position - b.position);
}

// =============================================================================
// DISPLAY AND FORMATTING
// =============================================================================

/**
 * Format a demonstrative expression.
 */
export function formatDemonstrativeExpression(expr: DemonstrativeExpression): string {
  return `[${expr.proximity} ${expr.number}] "${expr.spanText}" → ${expr.entityType}`;
}

/**
 * Format a resolution result.
 */
export function formatDemonstrativeResolution(result: DemonstrativeResolutionResult): string {
  if (result.resolved && result.referent) {
    return `Resolved: ${result.referent.displayName} (${result.referent.source}, ${(result.confidence * 100).toFixed(0)}%)`;
  }
  if (result.needsClarification) {
    return `Needs clarification: ${result.clarificationPrompt}`;
  }
  return `Unresolved: ${result.explanation}`;
}

// =============================================================================
// STATISTICS
// =============================================================================

export interface DemonstrativeStats {
  readonly totalRules: number;
  readonly totalNounMappings: number;
  readonly totalPhrases: number;
}

export function getDemonstrativeStats(): DemonstrativeStats {
  let totalPhrases = 0;
  for (const m of DEMONSTRATIVE_NOUN_MAPPINGS) {
    totalPhrases += m.phrases.length + m.pluralPhrases.length;
  }

  return {
    totalRules: DEMONSTRATIVE_RESOLUTION_RULES.length,
    totalNounMappings: DEMONSTRATIVE_NOUN_MAPPINGS.length,
    totalPhrases,
  };
}

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

export const DEMONSTRATIVE_RULES = [
  'Rule DEM-001: Proximal demonstratives ("this", "these") prefer the current ' +
  'UI selection. If no selection, they fall back to the focused entity.',

  'Rule DEM-002: Distal demonstratives ("that", "those") prefer discourse ' +
  'referents ranked by salience. They refer to something previously mentioned ' +
  'or recently edited, not currently selected.',

  'Rule DEM-003: When a demonstrative modifies a noun ("this chorus", "those drums"), ' +
  'the noun constrains the entity type. Only candidates of the matching type are considered.',

  'Rule DEM-004: Bare demonstratives ("do this", "fix that") without a noun are ' +
  'resolved by salience alone. If ambiguous, the system asks for clarification.',

  'Rule DEM-005: "That change" and "those edits" always refer to the plan history ' +
  '(dialogue time), never to musical entities.',

  'Rule DEM-006: Plural demonstratives ("these notes", "those sections") require ' +
  'multiple referents. The system selects all matching entities, not just the most salient.',

  'Rule DEM-007: The salience gap threshold for confident resolution is 0.15. ' +
  'If the gap between the top two candidates is smaller, the system asks for clarification.',

  'Rule DEM-008: Resolution results include alternatives, so the UI can present ' +
  'a disambiguation menu rather than a free-text prompt.',

  'Rule DEM-009: Demonstrative resolution is recorded in the provenance trace ' +
  'with the rule ID, confidence, and alternatives.',

  'Rule DEM-010: When the demonstrative\'s entity type matches exactly one candidate ' +
  'in the project (e.g., "those drums" with only one drum track), resolution is ' +
  'automatic with high confidence.',
] as const;
