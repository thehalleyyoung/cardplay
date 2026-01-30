/**
 * GOFAI Pipeline — Binding Inspector UI Panel
 *
 * Designs a UI panel that shows resolved referents and explains why
 * each binding was chosen. This supports the "no magic" principle by
 * making all implicit resolution decisions visible and inspectable.
 *
 * ## What is a Binding?
 *
 * A "binding" connects a natural language expression to a concrete
 * musical entity or value. For example:
 *
 * - "the chorus" → Section(id=chorus_1)
 * - "it" → Track(id=bass_track) [resolved from focus stack]
 * - "brighter" → Axis(brightness, direction=increase)
 * - "louder" → Axis(energy, direction=increase, degree=moderate)
 * - "a little" → Degree(0.25)
 * - "the last four bars" → TimeRange(bar=29, bar=32)
 *
 * ## Why Inspect Bindings?
 *
 * 1. **Debugging**: When the system does something unexpected, the user
 *    can see exactly what each word resolved to.
 * 2. **Trust**: Users trust the system more when they can see the reasoning.
 * 3. **Correction**: If a binding is wrong, the user can click to correct it.
 * 4. **Learning**: Users learn the system's vocabulary by seeing how it
 *    interprets their words.
 *
 * ## Panel Layout
 *
 * ```
 * ┌─────────────────────────────────────────────┐
 * │ Binding Inspector                     [×]   │
 * ├─────────────────────────────────────────────┤
 * │ Input: "Make the chorus brighter"           │
 * │                                             │
 * │ ┌─ Bindings ─────────────────────────────┐  │
 * │ │ "the chorus" → Section(chorus_1)       │  │
 * │ │   Reason: Explicit name match          │  │
 * │ │   Confidence: 0.98 ████████████░░      │  │
 * │ │   Alt: Section(chorus_2) — 0.45        │  │
 * │ │                                        │  │
 * │ │ "brighter" → Axis(brightness, +)       │  │
 * │ │   Reason: Canon lexeme match           │  │
 * │ │   Confidence: 0.95 ███████████░░░      │  │
 * │ │   Alt: Axis(energy, +) — 0.30          │  │
 * │ │                                        │  │
 * │ │ [implicit] → Scope(all layers)         │  │
 * │ │   Reason: No layer specified; default  │  │
 * │ │   Confidence: 0.80 ██████████░░░░      │  │
 * │ └────────────────────────────────────────┘  │
 * │                                             │
 * │ ┌─ Resolution Chain ─────────────────────┐  │
 * │ │ 1. Tokenize → 5 tokens                │  │
 * │ │ 2. Parse → EditCommand(target, action) │  │
 * │ │ 3. Resolve "the chorus" → chorus_1     │  │
 * │ │ 4. Resolve "brighter" → brightness(+)  │  │
 * │ │ 5. Infer scope → all layers            │  │
 * │ └────────────────────────────────────────┘  │
 * └─────────────────────────────────────────────┘
 * ```
 *
 * @module gofai/pipeline/binding-inspector
 * @see gofai_goalA.md Step 096
 */

// =============================================================================
// BINDING — a resolved name-to-entity connection
// =============================================================================

/**
 * A single binding: a surface expression resolved to a concrete entity.
 */
export interface Binding {
  /** Unique ID for this binding */
  readonly id: string;

  /** The surface expression that was resolved */
  readonly surfaceExpression: string;

  /** The start position in the source text */
  readonly startOffset: number;

  /** The end position in the source text */
  readonly endOffset: number;

  /** What it resolved to */
  readonly resolved: ResolvedEntity;

  /** Why this resolution was chosen */
  readonly reason: BindingReason;

  /** Confidence score (0–1) */
  readonly confidence: number;

  /** Alternative resolutions that were considered but not chosen */
  readonly alternatives: readonly AlternativeBinding[];

  /** Whether this binding was explicit or inferred */
  readonly source: BindingSource;

  /** Whether the user has confirmed or corrected this binding */
  readonly userConfirmed: boolean;

  /** Display color category for the UI */
  readonly colorCategory: BindingColorCategory;
}

/**
 * The source of a binding: how was it triggered?
 */
export type BindingSource =
  | 'explicit_name'      // User wrote the exact name ("the chorus")
  | 'pronoun'            // User used a pronoun ("it", "that")
  | 'demonstrative'      // User used a demonstrative ("this section")
  | 'implicit_scope'     // No mention; inferred from focus stack
  | 'implicit_default'   // No mention; used canonical default
  | 'fuzzy_match'        // User wrote something close ("the choris")
  | 'synonym'            // User used a synonym ("the refrain" → chorus)
  | 'abbreviation'       // User used an abbreviation ("vox" → vocals)
  | 'ordinal'            // User used an ordinal ("the second verse")
  | 'relative'           // User used a relative ref ("the next section")
  | 'temporal'           // User used a temporal ref ("the part before")
  | 'quantified';        // User used a quantifier ("every chorus")

/**
 * Color categories for visual distinction in the UI.
 */
export type BindingColorCategory =
  | 'entity'       // Sections, layers, tracks — blue family
  | 'axis'         // Perceptual axes — orange family
  | 'degree'       // Degree/amount — green family
  | 'scope'        // Scope/target — purple family
  | 'time'         // Time ranges — teal family
  | 'action'       // Edit actions — red family
  | 'constraint'   // Constraints — gray family
  | 'unknown';     // Unresolved — muted

// =============================================================================
// RESOLVED ENTITY — what a binding points to
// =============================================================================

/**
 * A resolved entity: the target of a binding.
 */
export type ResolvedEntity =
  | SectionEntity
  | LayerEntity
  | TrackEntity
  | CardEntity
  | AxisEntity
  | DegreeEntity
  | TimeRangeEntity
  | ActionEntity
  | ConstraintEntity
  | ParameterEntity
  | DomainNounEntity
  | UnresolvedEntity;

export interface SectionEntity {
  readonly type: 'section';
  readonly sectionId: string;
  readonly sectionName: string;
  readonly sectionIndex: number;
}

export interface LayerEntity {
  readonly type: 'layer';
  readonly layerId: string;
  readonly layerName: string;
}

export interface TrackEntity {
  readonly type: 'track';
  readonly trackId: string;
  readonly trackName: string;
}

export interface CardEntity {
  readonly type: 'card';
  readonly cardId: string;
  readonly cardName: string;
  readonly cardType: string;
}

export interface AxisEntity {
  readonly type: 'axis';
  readonly axisId: string;
  readonly axisName: string;
  readonly direction: 'increase' | 'decrease' | 'set' | 'neutral';
}

export interface DegreeEntity {
  readonly type: 'degree';
  readonly value: number;
  readonly label: string;
  readonly isRelative: boolean;
}

export interface TimeRangeEntity {
  readonly type: 'time_range';
  readonly startBar: number;
  readonly endBar: number;
  readonly startBeat?: number;
  readonly endBeat?: number;
  readonly label: string;
}

export interface ActionEntity {
  readonly type: 'action';
  readonly actionId: string;
  readonly actionName: string;
  readonly category: string;
}

export interface ConstraintEntity {
  readonly type: 'constraint';
  readonly constraintId: string;
  readonly constraintName: string;
  readonly constraintType: string;
}

export interface ParameterEntity {
  readonly type: 'parameter';
  readonly paramName: string;
  readonly paramValue: string | number;
  readonly unit?: string;
}

export interface DomainNounEntity {
  readonly type: 'domain_noun';
  readonly nounId: string;
  readonly term: string;
  readonly category: string;
}

export interface UnresolvedEntity {
  readonly type: 'unresolved';
  readonly rawText: string;
  readonly reason: string;
}

// =============================================================================
// BINDING REASON — why was this resolution chosen?
// =============================================================================

/**
 * Explanation for why a particular binding was chosen.
 */
export interface BindingReason {
  /** The resolution method used */
  readonly method: ResolutionMethod;

  /** Human-readable explanation */
  readonly explanation: string;

  /** The rule or heuristic that applied */
  readonly rule: string;

  /** Score components that contributed to the choice */
  readonly scoreBreakdown: readonly ScoreComponent[];

  /** Evidence that supported this choice */
  readonly evidence: readonly BindingEvidence[];
}

/**
 * Resolution methods, ordered by preference.
 */
export type ResolutionMethod =
  | 'exact_match'        // Exact string match against canon
  | 'canonical_synonym'  // Matched a known synonym
  | 'fuzzy_match'        // Fuzzy string matching
  | 'pronoun_resolution' // Resolved pronoun using salience
  | 'demonstrative_resolution' // Resolved demonstrative
  | 'focus_stack'        // Inferred from focus stack
  | 'default_value'      // Used canonical default
  | 'ordinal_reference'  // Resolved ordinal ("the second verse")
  | 'relative_reference' // Resolved relative ("the next one")
  | 'temporal_reference' // Resolved temporal ("the part before")
  | 'context_inference'  // Inferred from surrounding context
  | 'user_correction';   // User manually corrected

/**
 * A component of the resolution score.
 */
export interface ScoreComponent {
  readonly factor: string;
  readonly weight: number;
  readonly score: number;
  readonly description: string;
}

/**
 * Evidence supporting a binding.
 */
export type BindingEvidence =
  | { readonly type: 'canon_entry'; readonly vocabId: string; readonly vocabName: string }
  | { readonly type: 'focus_stack'; readonly level: number; readonly entityId: string }
  | { readonly type: 'recent_mention'; readonly turn: number; readonly expression: string }
  | { readonly type: 'ui_selection'; readonly elementId: string }
  | { readonly type: 'fuzzy_score'; readonly similarity: number; readonly algorithm: string }
  | { readonly type: 'synonym_table'; readonly synonym: string; readonly canonical: string }
  | { readonly type: 'default_rule'; readonly ruleName: string }
  | { readonly type: 'user_history'; readonly pattern: string };

/**
 * An alternative binding that was considered but not chosen.
 */
export interface AlternativeBinding {
  readonly resolved: ResolvedEntity;
  readonly confidence: number;
  readonly reason: string;
  readonly whyNotChosen: string;
}

// =============================================================================
// RESOLUTION CHAIN — the step-by-step resolution process
// =============================================================================

/**
 * A step in the resolution chain showing how the binding was derived.
 */
export interface ResolutionStep {
  /** Step number (1-based) */
  readonly step: number;

  /** The pipeline stage */
  readonly stage: ResolutionStage;

  /** Description of what happened */
  readonly description: string;

  /** Input to this step */
  readonly input: string;

  /** Output from this step */
  readonly output: string;

  /** Duration in ms (for performance inspection) */
  readonly durationMs: number;

  /** Whether this step was deterministic */
  readonly deterministic: boolean;
}

/**
 * Pipeline stages in order.
 */
export type ResolutionStage =
  | 'tokenize'          // Break input into tokens
  | 'normalize'         // Normalize spelling/case
  | 'parse'             // Parse grammatical structure
  | 'lookup'            // Look up in canon vocabulary
  | 'fuzzy_match'       // Fuzzy matching
  | 'resolve_reference' // Resolve pronouns/demonstratives
  | 'infer_scope'       // Infer implicit scope
  | 'apply_defaults'    // Apply canonical defaults
  | 'validate'          // Validate the final binding
  | 'confirm';          // User confirmation

// =============================================================================
// BINDING INSPECTOR PANEL — UI configuration
// =============================================================================

/**
 * Configuration for the binding inspector panel.
 */
export interface BindingInspectorConfig {
  /** Whether the panel is enabled */
  readonly enabled: boolean;

  /** Position in the UI */
  readonly position: PanelPosition;

  /** Whether the panel starts collapsed */
  readonly startCollapsed: boolean;

  /** Whether to show the resolution chain */
  readonly showResolutionChain: boolean;

  /** Whether to show alternatives */
  readonly showAlternatives: boolean;

  /** Whether to show score breakdowns */
  readonly showScoreBreakdown: boolean;

  /** Whether to show timing information */
  readonly showTiming: boolean;

  /** Minimum confidence to show without warning */
  readonly confidenceThreshold: number;

  /** Maximum alternatives to show per binding */
  readonly maxAlternatives: number;

  /** Whether to enable click-to-correct */
  readonly enableCorrection: boolean;

  /** Whether to auto-highlight bindings in the command input */
  readonly autoHighlight: boolean;

  /** Color scheme for binding categories */
  readonly colorScheme: BindingColorScheme;
}

export type PanelPosition =
  | 'right'    // Right sidebar
  | 'bottom'   // Bottom panel
  | 'float'    // Floating popover
  | 'inline';  // Inline under the command

export interface BindingColorScheme {
  readonly entity: string;
  readonly axis: string;
  readonly degree: string;
  readonly scope: string;
  readonly time: string;
  readonly action: string;
  readonly constraint: string;
  readonly unknown: string;
}

/**
 * Default binding inspector configuration.
 */
export const DEFAULT_BINDING_INSPECTOR_CONFIG: BindingInspectorConfig = {
  enabled: true,
  position: 'right',
  startCollapsed: false,
  showResolutionChain: true,
  showAlternatives: true,
  showScoreBreakdown: false,
  showTiming: false,
  confidenceThreshold: 0.7,
  maxAlternatives: 3,
  enableCorrection: true,
  autoHighlight: true,
  colorScheme: {
    entity: '#4A90D9',     // Blue
    axis: '#E8833A',       // Orange
    degree: '#4CAF50',     // Green
    scope: '#9C27B0',      // Purple
    time: '#00897B',       // Teal
    action: '#E53935',     // Red
    constraint: '#757575', // Gray
    unknown: '#BDBDBD',    // Light gray
  },
};

// =============================================================================
// BINDING INSPECTOR STATE — runtime state of the panel
// =============================================================================

/**
 * Runtime state of the binding inspector panel.
 */
export interface BindingInspectorState {
  /** The current input text being inspected */
  readonly inputText: string;

  /** All bindings for the current input */
  readonly bindings: readonly Binding[];

  /** The resolution chain */
  readonly resolutionChain: readonly ResolutionStep[];

  /** Whether the panel is expanded or collapsed */
  readonly expanded: boolean;

  /** Which binding is currently selected/highlighted */
  readonly selectedBindingId: string | null;

  /** Whether a correction is in progress */
  readonly correctionInProgress: boolean;

  /** The binding being corrected, if any */
  readonly correctionTargetId: string | null;

  /** Warnings about low-confidence bindings */
  readonly warnings: readonly BindingWarning[];

  /** Summary statistics */
  readonly stats: BindingStats;
}

/**
 * A warning about a binding.
 */
export interface BindingWarning {
  readonly bindingId: string;
  readonly severity: 'info' | 'warning' | 'error';
  readonly message: string;
  readonly suggestion?: string;
}

/**
 * Summary statistics for the current bindings.
 */
export interface BindingStats {
  readonly totalBindings: number;
  readonly explicitBindings: number;
  readonly inferredBindings: number;
  readonly highConfidence: number;
  readonly lowConfidence: number;
  readonly unresolved: number;
  readonly averageConfidence: number;
}

// =============================================================================
// BINDING INSPECTOR ACTIONS — user interactions
// =============================================================================

/**
 * Actions the user can take in the binding inspector.
 */
export type BindingInspectorAction =
  | SelectBindingAction
  | CorrectBindingAction
  | AcceptBindingAction
  | RejectBindingAction
  | ChooseAlternativeAction
  | ExpandBindingAction
  | CollapseBindingAction
  | TogglePanelAction
  | ShowResolutionChainAction
  | CopyBindingAction
  | PinBindingAction
  | RefreshBindingsAction;

export interface SelectBindingAction {
  readonly type: 'select_binding';
  readonly bindingId: string;
}

export interface CorrectBindingAction {
  readonly type: 'correct_binding';
  readonly bindingId: string;
  readonly newEntity: ResolvedEntity;
}

export interface AcceptBindingAction {
  readonly type: 'accept_binding';
  readonly bindingId: string;
}

export interface RejectBindingAction {
  readonly type: 'reject_binding';
  readonly bindingId: string;
  readonly reason: string;
}

export interface ChooseAlternativeAction {
  readonly type: 'choose_alternative';
  readonly bindingId: string;
  readonly alternativeIndex: number;
}

export interface ExpandBindingAction {
  readonly type: 'expand_binding';
  readonly bindingId: string;
}

export interface CollapseBindingAction {
  readonly type: 'collapse_binding';
  readonly bindingId: string;
}

export interface TogglePanelAction {
  readonly type: 'toggle_panel';
}

export interface ShowResolutionChainAction {
  readonly type: 'show_resolution_chain';
}

export interface CopyBindingAction {
  readonly type: 'copy_binding';
  readonly bindingId: string;
  readonly format: 'text' | 'json';
}

export interface PinBindingAction {
  readonly type: 'pin_binding';
  readonly bindingId: string;
}

export interface RefreshBindingsAction {
  readonly type: 'refresh_bindings';
}

/**
 * Result of applying a binding inspector action.
 */
export interface BindingInspectorActionResult {
  readonly action: BindingInspectorAction;
  readonly success: boolean;
  readonly newState: BindingInspectorState;
  readonly message?: string;
}

// =============================================================================
// BINDING CREATION AND FORMATTING
// =============================================================================

/**
 * Create a new binding.
 */
export function createBinding(params: {
  surfaceExpression: string;
  startOffset: number;
  endOffset: number;
  resolved: ResolvedEntity;
  reason: BindingReason;
  confidence: number;
  source: BindingSource;
  alternatives?: readonly AlternativeBinding[];
}): Binding {
  return {
    id: `binding_${params.startOffset}_${params.endOffset}`,
    surfaceExpression: params.surfaceExpression,
    startOffset: params.startOffset,
    endOffset: params.endOffset,
    resolved: params.resolved,
    reason: params.reason,
    confidence: params.confidence,
    alternatives: params.alternatives ?? [],
    source: params.source,
    userConfirmed: false,
    colorCategory: resolvedEntityToColorCategory(params.resolved),
  };
}

/**
 * Map a resolved entity to its color category.
 */
export function resolvedEntityToColorCategory(entity: ResolvedEntity): BindingColorCategory {
  switch (entity.type) {
    case 'section':
    case 'layer':
    case 'track':
    case 'card':
      return 'entity';
    case 'axis':
      return 'axis';
    case 'degree':
      return 'degree';
    case 'time_range':
      return 'time';
    case 'action':
      return 'action';
    case 'constraint':
      return 'constraint';
    case 'parameter':
    case 'domain_noun':
      return 'scope';
    case 'unresolved':
      return 'unknown';
  }
}

/**
 * Compute binding statistics from a list of bindings.
 */
export function computeBindingStats(bindings: readonly Binding[]): BindingStats {
  let explicit = 0;
  let inferred = 0;
  let highConf = 0;
  let lowConf = 0;
  let unresolved = 0;
  let totalConf = 0;

  for (const b of bindings) {
    if (b.source === 'explicit_name' || b.source === 'synonym' || b.source === 'abbreviation') {
      explicit++;
    } else {
      inferred++;
    }

    if (b.confidence >= 0.7) {
      highConf++;
    } else {
      lowConf++;
    }

    if (b.resolved.type === 'unresolved') {
      unresolved++;
    }

    totalConf += b.confidence;
  }

  return {
    totalBindings: bindings.length,
    explicitBindings: explicit,
    inferredBindings: inferred,
    highConfidence: highConf,
    lowConfidence: lowConf,
    unresolved,
    averageConfidence: bindings.length > 0 ? totalConf / bindings.length : 0,
  };
}

/**
 * Generate warnings for low-confidence or ambiguous bindings.
 */
export function generateBindingWarnings(
  bindings: readonly Binding[],
  confidenceThreshold: number,
): readonly BindingWarning[] {
  const warnings: BindingWarning[] = [];

  for (const binding of bindings) {
    // Unresolved
    if (binding.resolved.type === 'unresolved') {
      warnings.push({
        bindingId: binding.id,
        severity: 'error',
        message: `"${binding.surfaceExpression}" could not be resolved.`,
        suggestion: 'Try using a different term or check the vocabulary browser.',
      });
      continue;
    }

    // Low confidence
    if (binding.confidence < confidenceThreshold) {
      const altText = binding.alternatives.length > 0
        ? ` Did you mean "${formatEntityShort(binding.alternatives[0]!.resolved)}"?`
        : '';
      warnings.push({
        bindingId: binding.id,
        severity: 'warning',
        message: `"${binding.surfaceExpression}" → "${formatEntityShort(binding.resolved)}" (confidence: ${(binding.confidence * 100).toFixed(0)}%).${altText}`,
        suggestion: 'Click to choose a different resolution.',
      });
    }

    // Close alternatives (ambiguity)
    if (binding.alternatives.length > 0) {
      const topAlt = binding.alternatives[0]!;
      if (topAlt.confidence > binding.confidence * 0.8) {
        warnings.push({
          bindingId: binding.id,
          severity: 'info',
          message: `"${binding.surfaceExpression}" is ambiguous: "${formatEntityShort(binding.resolved)}" vs "${formatEntityShort(topAlt.resolved)}".`,
          suggestion: 'Consider being more specific.',
        });
      }
    }
  }

  return warnings;
}

// =============================================================================
// FORMATTING — display helpers
// =============================================================================

/**
 * Format a resolved entity as a short string.
 */
export function formatEntityShort(entity: ResolvedEntity): string {
  switch (entity.type) {
    case 'section':
      return `Section(${entity.sectionName})`;
    case 'layer':
      return `Layer(${entity.layerName})`;
    case 'track':
      return `Track(${entity.trackName})`;
    case 'card':
      return `Card(${entity.cardName})`;
    case 'axis': {
      const dir = entity.direction === 'increase' ? '+'
        : entity.direction === 'decrease' ? '-'
        : entity.direction === 'set' ? '='
        : '~';
      return `Axis(${entity.axisName}, ${dir})`;
    }
    case 'degree':
      return `Degree(${entity.value}${entity.isRelative ? ' rel' : ''})`;
    case 'time_range':
      return `Time(bar ${entity.startBar}–${entity.endBar})`;
    case 'action':
      return `Action(${entity.actionName})`;
    case 'constraint':
      return `Constraint(${entity.constraintName})`;
    case 'parameter':
      return `Param(${entity.paramName}=${entity.paramValue})`;
    case 'domain_noun':
      return `Noun(${entity.term})`;
    case 'unresolved':
      return `Unresolved("${entity.rawText}")`;
  }
}

/**
 * Format a binding as a full display string.
 */
export function formatBinding(binding: Binding): string {
  const entity = formatEntityShort(binding.resolved);
  const confPct = (binding.confidence * 100).toFixed(0);
  const source = formatBindingSource(binding.source);

  return `"${binding.surfaceExpression}" → ${entity} [${confPct}%, ${source}]`;
}

/**
 * Format a binding source for display.
 */
export function formatBindingSource(source: BindingSource): string {
  switch (source) {
    case 'explicit_name': return 'explicit name';
    case 'pronoun': return 'pronoun resolution';
    case 'demonstrative': return 'demonstrative resolution';
    case 'implicit_scope': return 'inferred from scope';
    case 'implicit_default': return 'canonical default';
    case 'fuzzy_match': return 'fuzzy match';
    case 'synonym': return 'synonym lookup';
    case 'abbreviation': return 'abbreviation';
    case 'ordinal': return 'ordinal reference';
    case 'relative': return 'relative reference';
    case 'temporal': return 'temporal reference';
    case 'quantified': return 'quantified reference';
  }
}

/**
 * Format a resolution method for display.
 */
export function formatResolutionMethod(method: ResolutionMethod): string {
  switch (method) {
    case 'exact_match': return 'Exact match in canon vocabulary';
    case 'canonical_synonym': return 'Matched via known synonym';
    case 'fuzzy_match': return 'Fuzzy string match';
    case 'pronoun_resolution': return 'Pronoun resolved using salience';
    case 'demonstrative_resolution': return 'Demonstrative resolved using context';
    case 'focus_stack': return 'Inferred from focus stack';
    case 'default_value': return 'Used canonical default value';
    case 'ordinal_reference': return 'Resolved ordinal reference';
    case 'relative_reference': return 'Resolved relative reference';
    case 'temporal_reference': return 'Resolved temporal reference';
    case 'context_inference': return 'Inferred from surrounding context';
    case 'user_correction': return 'User manually corrected';
  }
}

/**
 * Format a confidence score as a visual bar.
 */
export function formatConfidenceBar(confidence: number, width: number = 14): string {
  const filled = Math.round(confidence * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * Format all bindings as a summary string.
 */
export function formatBindingSummary(bindings: readonly Binding[]): string {
  if (bindings.length === 0) {
    return 'No bindings resolved.';
  }

  const lines: string[] = [];
  for (const b of bindings) {
    const entity = formatEntityShort(b.resolved);
    const confBar = formatConfidenceBar(b.confidence);
    const confPct = (b.confidence * 100).toFixed(0);
    lines.push(`  "${b.surfaceExpression}" → ${entity}`);
    lines.push(`    Reason: ${b.reason.explanation}`);
    lines.push(`    Confidence: ${confPct}% ${confBar}`);

    for (const alt of b.alternatives.slice(0, 3)) {
      lines.push(`    Alt: ${formatEntityShort(alt.resolved)} — ${(alt.confidence * 100).toFixed(0)}%`);
    }

    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format the resolution chain as a step-by-step display.
 */
export function formatResolutionChain(steps: readonly ResolutionStep[]): string {
  return steps.map(s => {
    const det = s.deterministic ? '' : ' [non-deterministic]';
    return `${s.step}. ${formatStage(s.stage)} → ${s.output}${det}`;
  }).join('\n');
}

/**
 * Format a resolution stage for display.
 */
function formatStage(stage: ResolutionStage): string {
  switch (stage) {
    case 'tokenize': return 'Tokenize';
    case 'normalize': return 'Normalize';
    case 'parse': return 'Parse';
    case 'lookup': return 'Lookup';
    case 'fuzzy_match': return 'Fuzzy Match';
    case 'resolve_reference': return 'Resolve Reference';
    case 'infer_scope': return 'Infer Scope';
    case 'apply_defaults': return 'Apply Defaults';
    case 'validate': return 'Validate';
    case 'confirm': return 'Confirm';
  }
}

// =============================================================================
// INITIAL STATE FACTORY
// =============================================================================

/**
 * Create the initial state for the binding inspector.
 */
export function createInitialBindingInspectorState(): BindingInspectorState {
  return {
    inputText: '',
    bindings: [],
    resolutionChain: [],
    expanded: true,
    selectedBindingId: null,
    correctionInProgress: false,
    correctionTargetId: null,
    warnings: [],
    stats: {
      totalBindings: 0,
      explicitBindings: 0,
      inferredBindings: 0,
      highConfidence: 0,
      lowConfidence: 0,
      unresolved: 0,
      averageConfidence: 0,
    },
  };
}

/**
 * Update the binding inspector state with new bindings.
 */
export function updateBindingInspectorState(
  config: BindingInspectorConfig,
  inputText: string,
  bindings: readonly Binding[],
  resolutionChain: readonly ResolutionStep[],
): BindingInspectorState {
  const stats = computeBindingStats(bindings);
  const warnings = generateBindingWarnings(bindings, config.confidenceThreshold);

  return {
    inputText,
    bindings,
    resolutionChain,
    expanded: !config.startCollapsed,
    selectedBindingId: null,
    correctionInProgress: false,
    correctionTargetId: null,
    warnings,
    stats,
  };
}

// =============================================================================
// ACTION HANDLER
// =============================================================================

/**
 * Apply an action to the binding inspector state.
 */
export function applyBindingInspectorAction(
  state: BindingInspectorState,
  action: BindingInspectorAction,
): BindingInspectorActionResult {
  switch (action.type) {
    case 'select_binding':
      return {
        action,
        success: true,
        newState: {
          ...state,
          selectedBindingId: action.bindingId,
        },
      };

    case 'toggle_panel':
      return {
        action,
        success: true,
        newState: {
          ...state,
          expanded: !state.expanded,
        },
      };

    case 'expand_binding':
      return {
        action,
        success: true,
        newState: {
          ...state,
          selectedBindingId: action.bindingId,
        },
      };

    case 'collapse_binding':
      return {
        action,
        success: true,
        newState: {
          ...state,
          selectedBindingId: state.selectedBindingId === action.bindingId
            ? null
            : state.selectedBindingId,
        },
      };

    case 'correct_binding': {
      const idx = state.bindings.findIndex(b => b.id === action.bindingId);
      if (idx < 0) {
        return { action, success: false, newState: state, message: 'Binding not found.' };
      }
      const existing = state.bindings[idx]!;
      const corrected: Binding = {
        ...existing,
        resolved: action.newEntity,
        confidence: 1.0,
        userConfirmed: true,
        colorCategory: resolvedEntityToColorCategory(action.newEntity),
        reason: {
          ...existing.reason,
          method: 'user_correction',
          explanation: 'User manually corrected this binding.',
        },
      };
      const newBindings = [...state.bindings];
      newBindings[idx] = corrected;
      return {
        action,
        success: true,
        newState: {
          ...state,
          bindings: newBindings,
          correctionInProgress: false,
          correctionTargetId: null,
          stats: computeBindingStats(newBindings),
          warnings: generateBindingWarnings(newBindings, 0.7),
        },
        message: `Corrected "${existing.surfaceExpression}" → ${formatEntityShort(action.newEntity)}.`,
      };
    }

    case 'accept_binding': {
      const idx = state.bindings.findIndex(b => b.id === action.bindingId);
      if (idx < 0) {
        return { action, success: false, newState: state, message: 'Binding not found.' };
      }
      const existing = state.bindings[idx]!;
      const accepted: Binding = { ...existing, userConfirmed: true };
      const newBindings = [...state.bindings];
      newBindings[idx] = accepted;
      return {
        action,
        success: true,
        newState: { ...state, bindings: newBindings },
        message: `Accepted "${existing.surfaceExpression}" → ${formatEntityShort(existing.resolved)}.`,
      };
    }

    case 'reject_binding': {
      const idx = state.bindings.findIndex(b => b.id === action.bindingId);
      if (idx < 0) {
        return { action, success: false, newState: state, message: 'Binding not found.' };
      }
      const existing = state.bindings[idx]!;
      const rejected: Binding = {
        ...existing,
        resolved: { type: 'unresolved', rawText: existing.surfaceExpression, reason: action.reason },
        confidence: 0,
        colorCategory: 'unknown',
      };
      const newBindings = [...state.bindings];
      newBindings[idx] = rejected;
      return {
        action,
        success: true,
        newState: {
          ...state,
          bindings: newBindings,
          stats: computeBindingStats(newBindings),
          warnings: generateBindingWarnings(newBindings, 0.7),
        },
        message: `Rejected binding for "${existing.surfaceExpression}".`,
      };
    }

    case 'choose_alternative': {
      const idx = state.bindings.findIndex(b => b.id === action.bindingId);
      if (idx < 0) {
        return { action, success: false, newState: state, message: 'Binding not found.' };
      }
      const existing = state.bindings[idx]!;
      const alt = existing.alternatives[action.alternativeIndex];
      if (!alt) {
        return { action, success: false, newState: state, message: 'Alternative not found.' };
      }
      const updated: Binding = {
        ...existing,
        resolved: alt.resolved,
        confidence: alt.confidence,
        userConfirmed: true,
        colorCategory: resolvedEntityToColorCategory(alt.resolved),
        reason: {
          ...existing.reason,
          method: 'user_correction',
          explanation: `User chose alternative: ${alt.reason}`,
        },
      };
      const newBindings = [...state.bindings];
      newBindings[idx] = updated;
      return {
        action,
        success: true,
        newState: {
          ...state,
          bindings: newBindings,
          stats: computeBindingStats(newBindings),
          warnings: generateBindingWarnings(newBindings, 0.7),
        },
        message: `Changed "${existing.surfaceExpression}" → ${formatEntityShort(alt.resolved)}.`,
      };
    }

    case 'show_resolution_chain':
      return {
        action,
        success: true,
        newState: state,
        message: formatResolutionChain(state.resolutionChain),
      };

    case 'copy_binding': {
      const binding = state.bindings.find(b => b.id === action.bindingId);
      if (!binding) {
        return { action, success: false, newState: state, message: 'Binding not found.' };
      }
      const text = action.format === 'json'
        ? JSON.stringify(binding, null, 2)
        : formatBinding(binding);
      return {
        action,
        success: true,
        newState: state,
        message: text,
      };
    }

    case 'pin_binding':
      return {
        action,
        success: true,
        newState: state,
        message: `Pinned binding ${action.bindingId} for future reference.`,
      };

    case 'refresh_bindings':
      return {
        action,
        success: true,
        newState: state,
        message: 'Bindings refreshed.',
      };
  }
}

// =============================================================================
// DECLARATIVE RULES
// =============================================================================

export const BINDING_INSPECTOR_RULES = [
  'Rule BIND-001: Every binding in the inspector shows the surface expression, ' +
  'the resolved entity, the confidence score, and the reason for choosing it.',

  'Rule BIND-002: Low-confidence bindings (below threshold) are highlighted ' +
  'with a warning. The user can click to correct or choose an alternative.',

  'Rule BIND-003: The resolution chain shows every pipeline step that contributed ' +
  'to the final binding, in order, with inputs and outputs.',

  'Rule BIND-004: When the user corrects a binding, the correction is recorded ' +
  'as "user_correction" and the confidence is set to 1.0.',

  'Rule BIND-005: Alternative bindings are shown in order of confidence score. ' +
  'Each shows why it was not chosen (e.g., "lower fuzzy match score").',

  'Rule BIND-006: Implicit bindings (from focus stack or defaults) are visually ' +
  'distinct from explicit bindings. They show "[implicit]" as the expression.',

  'Rule BIND-007: The binding inspector updates in real-time as the user types, ' +
  'showing how each word is being resolved. Highlighting matches token boundaries.',

  'Rule BIND-008: Binding categories (entity, axis, degree, etc.) use distinct ' +
  'colors for quick visual scanning.',

  'Rule BIND-009: The inspector is always accessible but can be collapsed. ' +
  'When collapsed, a badge shows the number of warnings.',

  'Rule BIND-010: Evidence items link to their sources: canon entries link to ' +
  'the vocabulary browser, focus stack links to the focus panel.',

  'Rule BIND-011: Score breakdowns show each factor (string similarity, ' +
  'salience, recency, etc.) with its weight and contribution.',

  'Rule BIND-012: Pinned bindings persist across commands, allowing the user ' +
  'to establish persistent referent mappings for a session.',
] as const;
