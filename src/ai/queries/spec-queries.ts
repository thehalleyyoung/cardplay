/**
 * @fileoverview MusicSpec Query Functions (Branch C)
 * 
 * High-level TypeScript functions for querying the music theory KB
 * using MusicSpec constraints. Provides a bridge between:
 * - MusicSpec TypeScript types
 * - Prolog KB predicates
 * - Explainable AI recommendations
 * 
 * Implements roadmap items C070-C090 (spec queries and recommendations).
 * 
 * @module @cardplay/ai/queries/spec-queries
 */

import { getPrologAdapter, PrologAdapter } from '../engine/prolog-adapter';
import { loadMusicTheoryKB } from '../knowledge/music-theory-loader';
import {
  type MusicSpec,
  type MusicConstraint,
  type RootName,
  type ModeName,
  type TonalityModel,
  type GalantSchemaName,
  type FilmMood,
  type FilmDevice,
  type Explainable,
  explainable,
  // DEFAULT_MUSIC_SPEC,  // Unused - commented out for build
} from '../theory/music-spec';
import {
  specToPrologFacts,
  specToPrologTerm,
  prologValueToMusicConstraints,
} from '../theory/spec-prolog-bridge';
import {
  type HostAction,
  parseHostActionFromPrologTerm,
  prologReasonsToStrings,
} from '../theory/host-actions';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Conflict between two constraints.
 */
export interface SpecConflict {
  readonly constraint1: string;
  readonly constraint2: string;
  readonly reason: string;
}

/**
 * Lint warning for a spec.
 */
export interface SpecLintWarning {
  readonly message: string;
  readonly severity: 'error' | 'warning' | 'info';
}

/**
 * Key detection result.
 */
export interface KeyDetectionResult {
  readonly root: RootName;
  readonly mode: ModeName;
  readonly confidence: number;
  readonly model: TonalityModel;
}

/**
 * Schema match result.
 */
export interface SchemaMatch {
  readonly schema: GalantSchemaName;
  readonly score: number;
  readonly role: 'soprano' | 'bass';
}

/**
 * Mode recommendation result.
 */
export interface ModeRecommendation {
  readonly mode: ModeName;
  readonly confidence: number;
  readonly reasons: readonly string[];
}

/**
 * Film device recommendation result.
 */
export interface FilmDeviceRecommendation {
  readonly device: FilmDevice;
  readonly weight: number;
}

// ============================================================================
// STATELESS QUERY SUPPORT (C068)
// ============================================================================

/**
 * C068: Options for stateless query mode.
 */
export interface StatelessQueryOptions {
  /** If true, use stateless queries that don't mutate the Prolog DB */
  readonly stateless?: boolean;
}

/**
 * C068: Execute a query with spec context, either statefully or statelessly.
 *
 * Stateless mode (preferred): passes the spec as a term directly into
 * the Prolog query, avoiding mutations to the fact database.
 *
 * Stateful mode: asserts spec facts, runs the query, then retracts.
 */
async function withSpecContext<T>(
  spec: MusicSpec,
  adapter: PrologAdapter,
  queryFn: () => Promise<T>,
  options: StatelessQueryOptions = {}
): Promise<T> {
  if (options.stateless) {
    // In stateless mode, we use spec_push/spec_pop to create a scoped context.
    // Important: clear the current spec after pushing the stack snapshot to avoid
    // duplicates during the scoped query.
    const tokenResult = await adapter.querySingle('spec_push(Token).');
    const token = (tokenResult?.['Token'] as string | undefined) ?? undefined;
    const tokenTerm = token ? adapter.jsToTermString(token) : null;

    await clearSpec(adapter);
    await pushSpec(spec, adapter);
    try {
      return await queryFn();
    } finally {
      // Pop restores previous state
      if (tokenTerm) {
        await adapter.query(`spec_pop(${tokenTerm}).`);
      } else {
        // Fallback: ensure we don't leak facts if token capture failed
        await clearSpec(adapter);
      }
    }
  } else {
    // Legacy stateful mode
    await clearSpec(adapter);
    await pushSpec(spec, adapter);
    try {
      return await queryFn();
    } finally {
      await clearSpec(adapter);
    }
  }
}

/**
 * C068: Build a Prolog query that embeds the spec term inline,
 * eliminating the need for assert/retract entirely.
 *
 * This is the purest form of stateless querying.
 */
export function buildStatelessSpecGoal(spec: MusicSpec, innerGoal: string): string {
  const specTerm = specToPrologTerm(spec);
  // Replace references to current_spec(Spec) with the inline term
  return innerGoal.replace(
    /current_spec\((\w+)\)/g,
    `$1 = ${specTerm}`
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Ensure the music theory KB is loaded.
 */
async function ensureLoaded(adapter: PrologAdapter): Promise<void> {
  await loadMusicTheoryKB(adapter);
}

/**
 * Push spec facts into Prolog for querying.
 */
async function pushSpec(
  spec: MusicSpec,
  adapter: PrologAdapter
): Promise<void> {
  const facts = specToPrologFacts(spec, 'current');
  for (const fact of facts) {
    // Assert each fact (remove trailing period for assertion)
    const factBody = fact.endsWith('.') ? fact.slice(0, -1) : fact;
    await adapter.query(`assertz(${factBody}).`);
  }
}

/**
 * Clear current spec facts from Prolog.
 */
async function clearSpec(adapter: PrologAdapter): Promise<void> {
  await adapter.query('retractall(spec_key(current, _, _)).');
  await adapter.query('retractall(spec_meter(current, _, _)).');
  await adapter.query('retractall(spec_tempo(current, _)).');
  await adapter.query('retractall(spec_tonality_model(current, _)).');
  await adapter.query('retractall(spec_style(current, _)).');
  await adapter.query('retractall(spec_culture(current, _)).');
  await adapter.query('retractall(spec_constraint(current, _, _, _)).');
}

// ============================================================================
// C204: ANALYSIS CACHE
// ============================================================================

/**
 * C204: Analysis cache keyed by (events hash, spec hash) to avoid recomputation.
 * 
 * The cache stores analysis results with a TTL and maximum size.
 * Cache keys are computed from event content and spec parameters.
 */
export interface AnalysisCacheEntry<T> {
  readonly result: T;
  readonly timestamp: number;
  readonly specHash: string;
  readonly eventsHash: string;
}

export interface AnalysisCacheOptions {
  /** Maximum number of entries to cache (default: 100) */
  readonly maxEntries?: number;
  /** TTL in milliseconds (default: 60000 = 1 minute) */
  readonly ttlMs?: number;
  /** Enable cache (default: true) */
  readonly enabled?: boolean;
}

const DEFAULT_CACHE_OPTIONS: Required<AnalysisCacheOptions> = {
  maxEntries: 100,
  ttlMs: 60000,
  enabled: true,
};

/**
 * Simple hash function for events/specs.
 * Uses a combination of key fields to produce a unique string.
 */
function hashEvents(events: readonly { pitch: number; startTicks?: number; durationTicks?: number }[]): string {
  if (events.length === 0) return 'empty';
  const parts = events.slice(0, 50).map(e => 
    `${e.pitch}:${e.startTicks ?? 0}:${e.durationTicks ?? 1}`
  );
  return `e${events.length}_${simpleHash(parts.join(','))}`;
}

function hashSpec(spec: MusicSpec): string {
  const parts = [
    spec.keyRoot,
    spec.mode,
    spec.tempo,
    spec.culture,
    spec.style,
    spec.constraints.length,
  ];
  return `s_${simpleHash(parts.join(','))}`;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Analysis cache implementation.
 */
class AnalysisCache {
  private cache = new Map<string, AnalysisCacheEntry<unknown>>();
  private options: Required<AnalysisCacheOptions>;
  
  constructor(options: AnalysisCacheOptions = {}) {
    this.options = { ...DEFAULT_CACHE_OPTIONS, ...options };
  }
  
  /**
   * Get a cached result if available and not expired.
   */
  get<T>(key: string): T | undefined {
    if (!this.options.enabled) return undefined;
    
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    // Check TTL
    if (Date.now() - entry.timestamp > this.options.ttlMs) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.result as T;
  }
  
  /**
   * Store a result in the cache.
   */
  set<T>(key: string, result: T, eventsHash: string, specHash: string): void {
    if (!this.options.enabled) return;
    
    // Evict oldest entries if at capacity
    if (this.cache.size >= this.options.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      eventsHash,
      specHash,
    });
  }
  
  /**
   * Build a cache key from events and spec.
   */
  buildKey(
    analysisType: string,
    events: readonly { pitch: number; startTicks?: number; durationTicks?: number }[],
    spec?: MusicSpec
  ): string {
    const eventsHash = hashEvents(events);
    const specHash = spec ? hashSpec(spec) : 'no_spec';
    return `${analysisType}_${eventsHash}_${specHash}`;
  }
  
  /**
   * Clear all cached entries.
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache statistics.
   */
  stats(): { size: number; maxEntries: number; ttlMs: number } {
    return {
      size: this.cache.size,
      maxEntries: this.options.maxEntries,
      ttlMs: this.options.ttlMs,
    };
  }
}

// Global analysis cache instance
const analysisCache = new AnalysisCache();

/**
 * Get the global analysis cache.
 */
export function getAnalysisCache(): AnalysisCache {
  return analysisCache;
}

/**
 * Execute an analysis with caching.
 */
export async function withAnalysisCache<T>(
  analysisType: string,
  events: readonly { pitch: number; startTicks?: number; durationTicks?: number }[],
  spec: MusicSpec | undefined,
  analysisFunc: () => Promise<T>,
  options: AnalysisCacheOptions = {}
): Promise<T> {
  const cache = options.enabled === false ? null : analysisCache;
  
  if (cache) {
    const key = cache.buildKey(analysisType, events, spec);
    const cached = cache.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }
    
    const result = await analysisFunc();
    cache.set(key, result, hashEvents(events), spec ? hashSpec(spec) : '');
    return result;
  }
  
  return analysisFunc();
}

// ============================================================================
// SPEC CONFLICT DETECTION (C049, C071)
// ============================================================================

/**
 * Detect conflicts between constraints in a MusicSpec.
 * Uses Prolog `spec_conflict/3` predicates.
 * 
 * @example
 * const conflicts = await detectSpecConflicts(spec);
 * // [{ constraint1: 'culture(carnatic)', constraint2: 'schema(prinner)', reason: '...' }]
 */
export async function detectSpecConflicts(
  spec: MusicSpec,
  adapter: PrologAdapter = getPrologAdapter(),
  options: StatelessQueryOptions = {}
): Promise<SpecConflict[]> {
  await ensureLoaded(adapter);

  return withSpecContext(spec, adapter, async () => {
    const solutions = await adapter.queryAll(
      'all_spec_conflicts(Conflicts).'
    );

    if (!solutions.length || !solutions[0]?.['Conflicts']) {
      return [];
    }

    const conflictsRaw = solutions[0]['Conflicts'];
    if (!conflictsRaw || !Array.isArray(conflictsRaw)) {
      return [];
    }

    const conflicts = conflictsRaw as Array<{
      constraint1?: string;
      constraint2?: string;
      reason?: string;
      [key: number]: string;  // Allow numeric indexing
    }>;

    return conflicts.map(c => ({
      constraint1: String(c.constraint1 || c[0] || ''),
      constraint2: String(c.constraint2 || c[1] || ''),
      reason: String(c.reason || c[2] || 'Unknown conflict'),
    }));
  }, options);
}

// ============================================================================
// SPEC LINTING (C118-C119)
// ============================================================================

/**
 * Lint a MusicSpec for potential issues.
 * Uses Prolog `spec_lint/2` predicates.
 */
export async function lintSpec(
  spec: MusicSpec,
  adapter: PrologAdapter = getPrologAdapter(),
  options: StatelessQueryOptions = {}
): Promise<SpecLintWarning[]> {
  await ensureLoaded(adapter);

  return withSpecContext(spec, adapter, async () => {
    const solutions = await adapter.queryAll(
      'all_lint_warnings(Warnings).'
    );

    if (!solutions.length || !solutions[0]?.['Warnings']) {
      return [];
    }

    const warningsRaw = solutions[0]['Warnings'];
    if (!warningsRaw || !Array.isArray(warningsRaw)) {
      return [];
    }

    const warnings = warningsRaw as Array<{
      message?: string;
      severity?: string;
      [key: number]: string;  // Allow numeric indexing
    }>;

    return warnings.map(w => ({
      message: String(w.message || w[0] || ''),
      severity: (w.severity || w[1] || 'warning') as 'error' | 'warning' | 'info',
    }));
  }, options);
}

// ============================================================================
// SPEC AUTOFIX SUGGESTIONS (C120-C121)
// ============================================================================

export interface SpecAutofixSuggestion {
  readonly warning: SpecLintWarning;
  readonly actions: readonly HostAction[];
}

function confidenceForLintSeverity(severity: SpecLintWarning['severity']): number {
  switch (severity) {
    case 'error':
      return 90;
    case 'warning':
      return 75;
    case 'info':
    default:
      return 60;
  }
}

/**
 * Suggest HostActions to automatically fix common lint warnings.
 * Uses Prolog `spec_autofix/3` inside the active spec context.
 */
export async function suggestSpecAutofix(
  spec: MusicSpec,
  adapter: PrologAdapter = getPrologAdapter(),
  options: StatelessQueryOptions = {}
): Promise<Explainable<SpecAutofixSuggestion[]>> {
  await ensureLoaded(adapter);

  const warnings = await lintSpec(spec, adapter, options);

  return withSpecContext(spec, adapter, async () => {
    const suggestions: SpecAutofixSuggestion[] = [];

    for (const warning of warnings) {
      const warningTerm = adapter.jsToTermString(warning.message);
      const solutions = await adapter.queryAll(
        `spec_autofix(${warningTerm}, Action, Reasons).`
      );

      const confidence = confidenceForLintSeverity(warning.severity);
      const actions: HostAction[] = solutions
        .map(sol => {
          const actionTerm = sol['Action'];
          const reasons = prologReasonsToStrings(sol['Reasons']);
          return parseHostActionFromPrologTerm(actionTerm, confidence, reasons);
        })
        .filter((a): a is HostAction => a !== null);

      if (actions.length > 0) {
        suggestions.push({ warning, actions });
      }
    }

    const avgConfidence = suggestions.length > 0
      ? Math.round(
          suggestions.reduce(
            (sum, s) => sum + Math.round(s.actions.reduce((aSum, a) => aSum + a.confidence, 0) / Math.max(1, s.actions.length)),
            0
          ) / suggestions.length
        )
      : 0;

    return explainable(
      suggestions,
      suggestions.length > 0
        ? [`Found ${suggestions.length} autofix suggestion(s)`]
        : ['No autofix suggestions available'],
      avgConfidence
    );
  }, options);
}

// ============================================================================
// DEV: SPEC FACT DUMP (C124)
// ============================================================================

/**
 * Dump the current spec facts and constraints as they exist in the Prolog DB
 * during a scoped spec query. Intended for debugging/inspection.
 */
export async function dumpSpecFacts(
  spec: MusicSpec,
  adapter: PrologAdapter = getPrologAdapter(),
  options: StatelessQueryOptions = {}
): Promise<readonly string[]> {
  await ensureLoaded(adapter);

  return withSpecContext(spec, adapter, async () => {
    const facts: string[] = [];

    const key = await adapter.queryAll('spec_key(current, Root, Mode).');
    for (const s of key) {
      facts.push(`spec_key(current, ${s['Root']}, ${s['Mode']}).`);
    }

    const meter = await adapter.queryAll('spec_meter(current, Num, Den).');
    for (const s of meter) {
      facts.push(`spec_meter(current, ${s['Num']}, ${s['Den']}).`);
    }

    const tempo = await adapter.queryAll('spec_tempo(current, T).');
    for (const s of tempo) {
      facts.push(`spec_tempo(current, ${s['T']}).`);
    }

    const model = await adapter.queryAll('spec_tonality_model(current, M).');
    for (const s of model) {
      facts.push(`spec_tonality_model(current, ${s['M']}).`);
    }

    const style = await adapter.queryAll('spec_style(current, S).');
    for (const s of style) {
      facts.push(`spec_style(current, ${s['S']}).`);
    }

    const culture = await adapter.queryAll('spec_culture(current, C).');
    for (const s of culture) {
      facts.push(`spec_culture(current, ${s['C']}).`);
    }

    const constraints = await adapter.queryAll('spec_constraint(current, C, H, W).');
    for (const s of constraints) {
      const cTerm = adapter.jsToTermString(s['C']);
      facts.push(`spec_constraint(current, ${cTerm}, ${s['H']}, ${s['W']}).`);
    }

    return facts;
  }, options);
}

// ============================================================================
// KEY DETECTION (C137-C157)
// ============================================================================

/**
 * Detect the key of a pitch class profile using the Krumhansl-Schmuckler algorithm.
 * 
 * @param profile - 12-element array of pitch class counts/weights
 */
export async function detectKeyKS(
  profile: number[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<KeyDetectionResult> | null> {
  await ensureLoaded(adapter);
  
  if (profile.length !== 12) {
    throw new Error('Profile must have exactly 12 elements');
  }
  
  const profileStr = `[${profile.join(',')}]`;
  const result = await adapter.querySingle(
    `ks_best_key(${profileStr}, KeyRoot, Mode).`
  );
  
  if (!result) {
    return null;
  }
  
  const keyRoot = result['KeyRoot'] as number;
  const mode = result['Mode'] as ModeName;
  
  // Get the root note name from index
  const rootResult = await adapter.querySingle(
    `index_to_note(${keyRoot}, Note).`
  );
  
  const root = rootResult?.['Note'] as RootName || 'c';
  
  // Compute confidence by getting top scores
  const scoreResult = await adapter.querySingle(
    `ks_key_score(${profileStr}, ${keyRoot}, ${mode}, Score).`
  );
  const score = scoreResult?.['Score'] as number ?? 0;
  const confidence = Math.min(100, Math.round(score * 10));
  
  return explainable(
    { root, mode, confidence, model: 'ks_profile' as TonalityModel },
    [`Key detected as ${root} ${mode} using Krumhansl-Schmuckler profiles`],
    confidence
  );
}

/**
 * Detect the key using DFT phase estimation.
 * 
 * @param profile - 12-element array of pitch class counts/weights
 */
export async function detectKeyDFT(
  profile: number[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<KeyDetectionResult> | null> {
  await ensureLoaded(adapter);
  
  if (profile.length !== 12) {
    throw new Error('Profile must have exactly 12 elements');
  }
  
  const profileStr = `[${profile.join(',')}]`;
  const result = await adapter.querySingle(
    `dft_phase_key_note(${profileStr}, Note, Confidence).`
  );
  
  if (!result) {
    return null;
  }
  
  const root = result['Note'] as RootName;
  const confidence = result['Confidence'] as number;
  
  // DFT doesn't distinguish major/minor well, so default to major
  return explainable(
    { root, mode: 'major' as ModeName, confidence, model: 'dft_phase' as TonalityModel },
    [`Tonic detected as ${root} using DFT phase analysis (k=1 component)`],
    confidence
  );
}

/**
 * Compare tonality models and return the best key detection.
 * Implements C213-C214.
 */
export async function detectKeyAdvanced(
  profile: number[],
  preferredModel?: TonalityModel,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<KeyDetectionResult[]>> {
  const results: KeyDetectionResult[] = [];
  const reasons: string[] = [];
  
  const ksResult = await detectKeyKS(profile, adapter);
  if (ksResult) {
    results.push(ksResult.value);
    reasons.push(...ksResult.reasons);
  }
  
  const dftResult = await detectKeyDFT(profile, adapter);
  if (dftResult) {
    results.push(dftResult.value);
    reasons.push(...dftResult.reasons);
  }
  
  // Sort by confidence
  results.sort((a, b) => b.confidence - a.confidence);
  
  // If preferred model specified, promote it
  if (preferredModel) {
    const preferred = results.find(r => r.model === preferredModel);
    if (preferred) {
      results.splice(results.indexOf(preferred), 1);
      results.unshift(preferred);
    }
  }
  
  const avgConfidence = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.confidence, 0) / results.length)
    : 0;
  
  return explainable(results, reasons, avgConfidence);
}

// ============================================================================
// WEIGHTED KEY IDENTIFICATION (C157)
// ============================================================================

/**
 * C157: Identify key using selectable model and configurable hybrid weights.
 *
 * Supports four modes:
 *   - 'ks'     : Krumhansl-Schmuckler profiles only
 *   - 'dft'    : DFT phase estimation only
 *   - 'spiral' : Spiral Array centroid only
 *   - 'hybrid' : Weighted combination via best_key_weighted/5 (default)
 *
 * When using 'hybrid' mode the caller may supply alpha weights for each
 * model.  Defaults are { ks: 0.5, dft: 0.3, spiral: 0.2 }.
 *
 * @param profile  12-element pitch class count/weight array
 * @param opts     Model selection and optional hybrid weights
 * @param adapter  Prolog adapter instance
 * @returns        Explainable key result with root, mode, and reasoning
 */
export async function identifyKeyAdvanced(
  profile: number[],
  opts: {
    model?: 'ks' | 'dft' | 'spiral' | 'hybrid';
    weights?: { ks: number; dft: number; spiral: number };
  },
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ key: RootName; mode: ModeName }>> {
  await ensureLoaded(adapter);

  if (profile.length !== 12) {
    throw new Error('Profile must have exactly 12 elements');
  }

  const model = opts.model ?? 'hybrid';
  const profileStr = `[${profile.join(',')}]`;

  // --- Single-model shortcut paths ---
  if (model === 'ks') {
    const ksResult = await detectKeyKS(profile, adapter);
    if (!ksResult) {
      return explainable(
        { key: 'c' as RootName, mode: 'major' as ModeName },
        ['KS key detection returned no result; defaulting to C major'],
        0
      );
    }
    return explainable(
      { key: ksResult.value.root, mode: ksResult.value.mode },
      ksResult.reasons,
      ksResult.confidence
    );
  }

  if (model === 'dft') {
    const dftResult = await detectKeyDFT(profile, adapter);
    if (!dftResult) {
      return explainable(
        { key: 'c' as RootName, mode: 'major' as ModeName },
        ['DFT key detection returned no result; defaulting to C major'],
        0
      );
    }
    return explainable(
      { key: dftResult.value.root, mode: dftResult.value.mode },
      dftResult.reasons,
      dftResult.confidence
    );
  }

  if (model === 'spiral') {
    const result = await adapter.querySingle(
      `spiral_profile_score(${profileStr}, BestPC, BestMode, Score).`
    );

    if (!result) {
      return explainable(
        { key: 'c' as RootName, mode: 'major' as ModeName },
        ['Spiral key detection returned no result; defaulting to C major'],
        0
      );
    }

    const pc = result['BestPC'] as number;
    const mode = result['BestMode'] as ModeName;
    const score = result['Score'] as number;

    const noteResult = await adapter.querySingle(
      `index_to_note(${pc}, Note).`
    );
    const root = (noteResult?.['Note'] as RootName) ?? ('c' as RootName);
    const confidence = Math.min(100, Math.round(score * 100));

    return explainable(
      { key: root, mode },
      [`Key detected as ${root} ${mode} using Spiral Array centroid`],
      confidence
    );
  }

  // --- Hybrid mode: use best_key_weighted/5 ---
  const w = opts.weights ?? { ks: 0.5, dft: 0.3, spiral: 0.2 };

  const result = await adapter.querySingle(
    `best_key_weighted(${profileStr}, ${w.ks}, ${w.dft}, ${w.spiral}, key(BestPC, BestMode)).`
  );

  if (!result) {
    return explainable(
      { key: 'c' as RootName, mode: 'major' as ModeName },
      ['Hybrid key detection returned no result; defaulting to C major'],
      0
    );
  }

  const bestPC = result['BestPC'] as number;
  const bestMode = result['BestMode'] as ModeName;

  const noteResult = await adapter.querySingle(
    `index_to_note(${bestPC}, Note).`
  );
  const bestRoot = (noteResult?.['Note'] as RootName) ?? ('c' as RootName);

  const reasons = [
    `Key detected as ${bestRoot} ${bestMode} using hybrid model`,
    `Weights: KS=${w.ks}, DFT=${w.dft}, Spiral=${w.spiral}`,
  ];

  // Confidence heuristic: query KS score as a baseline measure
  const scoreResult = await adapter.querySingle(
    `ks_key_score(${profileStr}, ${bestPC}, ${bestMode}, Score).`
  );
  const ksScore = (scoreResult?.['Score'] as number) ?? 0;
  const confidence = Math.min(100, Math.round(ksScore * 10));

  return explainable(
    { key: bestRoot, mode: bestMode },
    reasons,
    confidence
  );
}

// ============================================================================
// SCHEMA MATCHING (C288-C301)
// ============================================================================

/**
 * Match a degree sequence against galant schemata.
 *
 * @param degrees - Array of scale degrees (1-7)
 */
export async function matchGalantSchema(
  degrees: number[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<SchemaMatch[]>> {
  await ensureLoaded(adapter);
  
  const degreesStr = `[${degrees.join(',')}]`;
  const solutions = await adapter.queryAll(
    `match_galant_schema(${degreesStr}, Schema, Score).`
  );
  
  const matches: SchemaMatch[] = solutions
    .filter(s => s?.['Score'] && (s['Score'] as number) > 0)
    .map(s => ({
      schema: s['Schema'] as GalantSchemaName,
      score: s['Score'] as number,
      role: 'soprano' as const, // Default; could be refined
    }))
    .sort((a, b) => b.score - a.score);

  const reasons = matches.length > 0
    ? [`Found ${matches.length} matching schemata, best: ${matches[0]?.schema} (score: ${matches[0]?.score})`]
    : ['No matching schemata found for degree sequence'];

  const confidence = matches.length > 0 ? (matches[0]?.score ?? 0) : 0;
  
  return explainable(matches, reasons, confidence);
}

// ============================================================================
// FILM MUSIC RECOMMENDATIONS (C395-C399)
// ============================================================================

/**
 * Get recommended film devices for a mood.
 */
export async function recommendFilmDevices(
  mood: FilmMood,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<FilmDeviceRecommendation[]>> {
  await ensureLoaded(adapter);
  
  const solutions = await adapter.queryAll(
    `mood_prefers_device(${mood}, Device, Weight).`
  );
  
  const devices: FilmDeviceRecommendation[] = solutions
    .filter(s => s?.['Device'] && s?.['Weight'])
    .map(s => ({
      device: s['Device'] as FilmDevice,
      weight: s['Weight'] as number,
    }))
    .sort((a, b) => b.weight - a.weight);

  const reasons = devices.length > 0
    ? [`Found ${devices.length} devices for ${mood} mood`]
    : [`No device preferences found for ${mood} mood`];

  const confidence = devices.length > 0 ? Math.round((devices[0]?.weight ?? 0) * 100) : 0;
  
  return explainable(devices, reasons, confidence);
}

/**
 * Get recommended modes for a film mood.
 */
export async function recommendFilmMode(
  mood: FilmMood,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<ModeRecommendation[]>> {
  await ensureLoaded(adapter);
  
  const solutions = await adapter.queryAll(
    `mood_prefers_mode(${mood}, Mode, Weight).`
  );
  
  const modes: ModeRecommendation[] = solutions
    .map(s => ({
      mode: s['Mode'] as ModeName,
      confidence: Math.round((s['Weight'] as number) * 100),
      reasons: [`${mood} mood suggests ${s['Mode']} mode`],
    }))
    .sort((a, b) => b.confidence - a.confidence);
  
  const allReasons = modes.flatMap(m => m.reasons);
  const avgConfidence = modes.length > 0
    ? Math.round(modes.reduce((sum, m) => sum + m.confidence, 0) / modes.length)
    : 0;
  
  return explainable(modes, allReasons, avgConfidence);
}

// ============================================================================
// RAGA MATCHING (C488-C489)
// ============================================================================

/**
 * Match pitch classes against Carnatic ragas.
 * 
 * @param pitchClasses - Array of pitch class integers (0-11)
 */
export async function matchRaga(
  pitchClasses: number[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ raga: string; score: number }[]>> {
  await ensureLoaded(adapter);
  
  // Get unique sorted pitch classes
  const pcs = [...new Set(pitchClasses)].sort((a, b) => a - b);
  // const pcsStr = `[${pcs.join(',')}]`;  // Unused - commented out

  // Query all ragas and compute similarity
  const solutions = await adapter.queryAll(
    `raga(Raga), raga_pcs(Raga, RagaPCs).`
  );

  const matches: { raga: string; score: number }[] = [];

  for (const sol of solutions) {
    if (!sol?.['Raga'] || !sol?.['RagaPCs']) continue;

    const raga = sol['Raga'] as string;
    const ragaPCs = sol['RagaPCs'] as number[];

    // Simple Jaccard-like similarity
    const intersection = pcs.filter(pc => ragaPCs.includes(pc)).length;
    const union = new Set([...pcs, ...ragaPCs]).size;
    const score = union > 0 ? Math.round((intersection / union) * 100) : 0;

    if (score > 30) { // Only include reasonable matches
      matches.push({ raga, score });
    }
  }

  matches.sort((a, b) => b.score - a.score);

  const reasons = matches.length > 0
    ? [`Best raga match: ${matches[0]?.raga} (${matches[0]?.score}% similarity)`]
    : ['No raga matches found for the given pitch classes'];

  const confidence = matches.length > 0 ? (matches[0]?.score ?? 0) : 0;
  
  return explainable(matches, reasons, confidence);
}

// ============================================================================
// MODE RECOMMENDATIONS BY CULTURE (C216-C217)
// ============================================================================

/**
 * Recommend a mode based on the current MusicSpec culture.
 */
export async function recommendModeForSpec(
  spec: MusicSpec,
  adapter: PrologAdapter = getPrologAdapter(),
  options: StatelessQueryOptions = {}
): Promise<Explainable<ModeRecommendation[]>> {
  await ensureLoaded(adapter);

  return withSpecContext(spec, adapter, async () => {
    const solutions = await adapter.queryAll(
      'current_spec(Spec), recommend_mode(Spec, Mode, Confidence).'
    );

    const modes: ModeRecommendation[] = solutions
      .filter(s => s?.['Mode'] && s?.['Confidence'])
      .map(s => ({
        mode: s['Mode'] as ModeName,
        confidence: Math.round((s['Confidence'] as number) * 100),
        reasons: [`Recommended for ${spec.culture ?? 'current'} culture`],
      }));

    modes.sort((a, b) => b.confidence - a.confidence);

    const reasons = modes.length > 0
      ? [`Found ${modes.length} mode recommendations for ${spec.culture ?? 'current'} culture`]
      : ['No mode recommendations found'];

    const confidence = modes.length > 0 ? (modes[0]?.confidence ?? 0) : 0;

    return explainable(modes, reasons, confidence);
  }, options);
}

// ============================================================================
// CONSTRAINT PACK QUERIES (C089-C091)
// ============================================================================

/**
 * Get constraints from a predefined constraint pack.
 */
export async function getConstraintPack(
  packId: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<MusicConstraint[]> {
  await ensureLoaded(adapter);
  
  const result = await adapter.querySingle(
    `constraint_pack(${packId}, Constraints).`
  );
  
  if (!result || !result['Constraints']) {
    return [];
  }
  
  return [...prologValueToMusicConstraints(result['Constraints'])];
}

/**
 * List available constraint packs.
 */
export async function listConstraintPacks(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string[]> {
  await ensureLoaded(adapter);
  
  const solutions = await adapter.queryAll(
    'constraint_pack(PackId, _).'
  );
  
  return solutions.map(s => s['PackId'] as string);
}

// ============================================================================
// CARNATIC MUSIC QUERIES (C471-C600)
// ============================================================================

/**
 * Raga information result.
 */
export interface RagaInfo {
  readonly name: string;
  readonly arohana: string[];
  readonly avarohana: string[];
  readonly time?: string;
  readonly rasa?: string;
  readonly parent?: string;
}

/**
 * Get information about a specific raga.
 */
export async function getRagaInfo(
  ragaName: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<RagaInfo | null> {
  await ensureLoaded(adapter);
  
  const aroResult = await adapter.querySingle(
    `raga_arohana(${ragaName}, Aro).`
  );
  const avaResult = await adapter.querySingle(
    `raga_avarohana(${ragaName}, Ava).`
  );
  
  if (!aroResult || !avaResult) {
    return null;
  }
  
  const timeResult = await adapter.querySingle(
    `raga_time(${ragaName}, Time).`
  );
  const rasaResult = await adapter.querySingle(
    `raga_rasa(${ragaName}, Rasa).`
  );
  const parentResult = await adapter.querySingle(
    `raga_janya(${ragaName}, Parent).`
  );
  
  const time = timeResult?.['Time'] as string | undefined;
  const rasa = rasaResult?.['Rasa'] as string | undefined;
  const parent = parentResult?.['Parent'] as string | undefined;
  
  return {
    name: ragaName,
    arohana: aroResult['Aro'] as string[],
    avarohana: avaResult['Ava'] as string[],
    ...(time !== undefined && { time }),
    ...(rasa !== undefined && { rasa }),
    ...(parent !== undefined && { parent }),
  };
}

/**
 * List all available ragas.
 */
export async function listRagas(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string[]> {
  await ensureLoaded(adapter);
  
  const solutions = await adapter.queryAll('raga(Name).');
  return solutions.map(s => s['Name'] as string);
}

/**
 * Tala information result.
 */
export interface TalaInfo {
  readonly name: string;
  readonly cycle: number;
}

/**
 * Get information about a specific tala.
 */
export async function getTalaInfo(
  talaName: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<TalaInfo | null> {
  await ensureLoaded(adapter);
  
  const result = await adapter.querySingle(
    `tala_cycle(${talaName}, Cycle).`
  );
  
  if (!result) {
    return null;
  }
  
  return {
    name: talaName,
    cycle: result['Cycle'] as number,
  };
}

/**
 * List all available talas.
 */
export async function listTalas(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string[]> {
  await ensureLoaded(adapter);
  
  const solutions = await adapter.queryAll('tala(Name).');
  return solutions.map(s => s['Name'] as string);
}

/**
 * Recommend a tala based on tempo category.
 */
export async function recommendTalaForTempo(
  tempoCategory: 'slow' | 'medium' | 'fast',
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<string[]>> {
  await ensureLoaded(adapter);
  
  const solutions = await adapter.queryAll(
    `recommend_tala_for_tempo(${tempoCategory}, Tala, Reasons).`
  );
  
  const talas = solutions.map(s => s['Tala'] as string);
  const reasons = talas.length > 0
    ? [`Recommended talas for ${tempoCategory} tempo`]
    : [`No tala recommendations for ${tempoCategory} tempo`];
  
  return explainable(talas, reasons, talas.length > 0 ? 80 : 0);
}

// ============================================================================
// CELTIC MUSIC QUERIES (C651-C760)
// ============================================================================

/**
 * Celtic tune type information.
 */
export interface CelticTuneInfo {
  readonly type: string;
  readonly meter: { num: number; den: number };
  readonly modes: Array<{ mode: string; weight: number }>;
  readonly drone?: string;
}

/**
 * Get information about a Celtic tune type.
 */
export async function getCelticTuneInfo(
  tuneType: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<CelticTuneInfo | null> {
  await ensureLoaded(adapter);
  
  const meterResult = await adapter.querySingle(
    `celtic_tune_type(${tuneType}, meter(Num, Den)).`
  );
  
  if (!meterResult) {
    return null;
  }
  
  const modeResults = await adapter.queryAll(
    `celtic_prefers_mode(${tuneType}, Mode, Weight).`
  );
  
  const modes = modeResults.map(s => ({
    mode: s['Mode'] as string,
    weight: s['Weight'] as number,
  }));
  
  const droneResult = await adapter.querySingle(
    `tune_drone_pref(${tuneType}, Drone, Weight), Weight > 0.4.`
  );
  
  const drone = droneResult?.['Drone'] as string | undefined;
  
  return {
    type: tuneType,
    meter: {
      num: meterResult['Num'] as number,
      den: meterResult['Den'] as number,
    },
    modes,
    ...(drone !== undefined && { drone }),
  };
}

/**
 * List all Celtic tune types.
 */
export async function listCelticTuneTypes(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string[]> {
  await ensureLoaded(adapter);
  
  const solutions = await adapter.queryAll('celtic_tune_type(Type, _).');
  return [...new Set(solutions.map(s => s['Type'] as string))];
}

/**
 * List Celtic ornaments.
 */
export async function listCelticOrnaments(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string[]> {
  await ensureLoaded(adapter);
  
  const solutions = await adapter.queryAll('celtic_ornament(Name).');
  return solutions.map(s => s['Name'] as string);
}

// ============================================================================
// CHINESE MUSIC QUERIES (C761-C860)
// ============================================================================

/**
 * Chinese mode information.
 */
export interface ChineseModeInfo {
  readonly mode: string;
  readonly pitchClasses: number[];
  readonly character: string;
}

/**
 * Get information about a Chinese pentatonic mode.
 */
export async function getChineseModeInfo(
  modeName: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<ChineseModeInfo | null> {
  await ensureLoaded(adapter);
  
  const pcResult = await adapter.querySingle(
    `chinese_pentatonic_mode(${modeName}, PCs).`
  );
  
  if (!pcResult) {
    return null;
  }
  
  const charResult = await adapter.querySingle(
    `chinese_mode_character(${modeName}, Char).`
  );
  
  return {
    mode: modeName,
    pitchClasses: pcResult['PCs'] as number[],
    character: charResult?.['Char'] as string ?? 'unknown',
  };
}

/**
 * List all Chinese pentatonic modes.
 */
export async function listChineseModes(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string[]> {
  await ensureLoaded(adapter);
  
  const solutions = await adapter.queryAll('chinese_pentatonic_mode(Mode, _).');
  return solutions.map(s => s['Mode'] as string);
}

/**
 * List Chinese musical traditions.
 */
export async function listChineseTraditions(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string[]> {
  await ensureLoaded(adapter);
  
  const solutions = await adapter.queryAll('chinese_tradition(Name).');
  return solutions.map(s => s['Name'] as string);
}

/**
 * Recommend a Chinese mode based on desired character.
 */
export async function recommendChineseModeByCharacter(
  character: 'bright' | 'melancholic' | 'lyrical' | 'heroic' | 'sorrowful',
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<string[]>> {
  await ensureLoaded(adapter);
  
  const solutions = await adapter.queryAll(
    `recommend_chinese_mode(${character}, Mode, Reasons).`
  );
  
  const modes = solutions.map(s => s['Mode'] as string);
  const reasons = modes.length > 0
    ? [`Modes with ${character} character`]
    : [`No modes found with ${character} character`];
  
  return explainable(modes, reasons, modes.length > 0 ? 85 : 0);
}

// ============================================================================
// GALANT SCHEMA EXTENDED QUERIES (C261-C360)
// ============================================================================

/**
 * Schema information result.
 */
export interface SchemaInfo {
  readonly name: string;
  readonly tags: string[];
  readonly cadence?: string;
  readonly era?: string[];
  readonly patterns: Array<{ role: string; degrees: number[] }>;
}

/**
 * Get detailed information about a galant schema.
 */
export async function getSchemaInfo(
  schemaName: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<SchemaInfo | null> {
  await ensureLoaded(adapter);
  
  const exists = await adapter.querySingle(
    `galant_schema(${schemaName}).`
  );
  
  if (!exists) {
    return null;
  }
  
  const tagResults = await adapter.queryAll(
    `schema_tag(${schemaName}, Tag).`
  );
  const tags = tagResults.map(s => s['Tag'] as string);
  
  const cadenceResult = await adapter.querySingle(
    `schema_cadence(${schemaName}, Cadence).`
  );
  
  const eraResults = await adapter.queryAll(
    `schema_era(${schemaName}, Era).`
  );
  const eras = eraResults.map(s => s['Era'] as string);
  
  const patternResults = await adapter.queryAll(
    `schema_pattern(${schemaName}, Role, Degrees).`
  );
  const patterns = patternResults.map(s => ({
    role: s['Role'] as string,
    degrees: s['Degrees'] as number[],
  }));
  
  const cadence = cadenceResult?.['Cadence'] as string | undefined;
  
  return {
    name: schemaName,
    tags,
    ...(cadence !== undefined && { cadence }),
    ...(eras.length > 0 && { era: eras }),
    patterns,
  };
}

/**
 * List all galant schemas.
 */
export async function listGalantSchemas(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string[]> {
  await ensureLoaded(adapter);
  
  const solutions = await adapter.queryAll('galant_schema(Name).');
  return solutions.map(s => s['Name'] as string);
}

/**
 * Recommend schemas that commonly follow a given schema.
 */
export async function recommendNextSchema(
  currentSchema: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<string[]>> {
  await ensureLoaded(adapter);
  
  const solutions = await adapter.queryAll(
    `recommend_schema_sequence(${currentSchema}, NextSchemas, Reasons).`
  );
  
  if (!solutions.length || !solutions[0]?.['NextSchemas']) {
    return explainable([], ['No schema sequence recommendations found'], 0);
  }
  
  const nextSchemas = solutions[0]['NextSchemas'] as string[];
  return explainable(
    nextSchemas,
    [`Schemas that commonly follow ${currentSchema}`],
    80
  );
}

/**
 * Recommend an opening schema.
 */
export async function recommendOpeningSchema(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<string[]>> {
  await ensureLoaded(adapter);
  
  const solutions = await adapter.queryAll(
    'recommend_opening_schema(Schema, Reasons).'
  );
  
  const schemas = solutions.map(s => s['Schema'] as string);
  return explainable(
    schemas,
    ['Schemas suitable for phrase openings'],
    schemas.length > 0 ? 75 : 0
  );
}

/**
 * Recommend a closing/cadential schema.
 */
export async function recommendClosingSchema(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<string[]>> {
  await ensureLoaded(adapter);
  
  const solutions = await adapter.queryAll(
    'recommend_closing_schema(Schema, Reasons).'
  );
  
  const schemas = solutions.map(s => s['Schema'] as string);
  return explainable(
    schemas,
    ['Schemas suitable for phrase closings/cadences'],
    schemas.length > 0 ? 75 : 0
  );
}
// ============================================================================
// EXPLAIN QUERY WRAPPER (C062)
// ============================================================================

/**
 * Result from an explain query.
 */
export interface ExplainedSolution {
  readonly bindings: Record<string, unknown>;
  readonly reasons: string[];
  readonly score?: number;
}

/**
 * Execute a Prolog goal and return solutions with explanations.
 * Looks for explain predicates that match the goal pattern.
 * 
 * @param goal - The Prolog goal to execute
 * @param adapter - Optional Prolog adapter
 * @returns Array of solutions with bindings, reasons, and optional scores
 */
export async function explainQuery(
  goal: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<ExplainedSolution[]>> {
  await ensureLoaded(adapter);
  
  // Execute the main query
  const solutions = await adapter.queryAll(goal);
  
  if (!solutions.length) {
    return explainable([], ['No solutions found for query'], 0);
  }
  
  const explainedSolutions: ExplainedSolution[] = [];
  
  for (const sol of solutions) {
    // Try to find associated explanation predicate
    // Convention: if goal is "recommend_X(A, B, C)", look for "explain_X(A, B, Reasons)"
    const reasons: string[] = [];
    let score: number | undefined;
    
    // Extract score if present in bindings
    if (typeof sol['Score'] === 'number') {
      score = sol['Score'] as number;
    } else if (typeof sol['Confidence'] === 'number') {
      score = sol['Confidence'] as number;
    } else if (typeof sol['Weight'] === 'number') {
      score = Math.round((sol['Weight'] as number) * 100);
    }
    
    // Extract reasons if present
    if (Array.isArray(sol['Reasons'])) {
      reasons.push(...(sol['Reasons'] as string[]).map(r => String(r)));
    }
    
    const result: ExplainedSolution = {
      bindings: sol,
      reasons,
    };
    if (score !== undefined) {
      (result as { score: number }).score = score;
    }
    explainedSolutions.push(result);
  }
  
  // Sort by score if available
  explainedSolutions.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  
  const avgScore = explainedSolutions.length > 0 && explainedSolutions[0]?.score
    ? Math.round(explainedSolutions.reduce((sum, s) => sum + (s.score ?? 0), 0) / explainedSolutions.length)
    : 50;
  
  return explainable(
    explainedSolutions,
    [`Found ${explainedSolutions.length} solution(s) for: ${goal}`],
    avgScore
  );
}

// ============================================================================
// RECOMMENDED ACTIONS (C080-C082)
// ============================================================================

/**
 * A recommended action from the Prolog KB.
 */
export interface RecommendedAction {
  readonly action: string;
  readonly params: Record<string, unknown>;
  readonly confidence: number;
  readonly reasons: string[];
}

/**
 * Get recommended actions based on the current spec.
 */
export async function getRecommendedActions(
  spec: MusicSpec,
  adapter: PrologAdapter = getPrologAdapter(),
  options: StatelessQueryOptions = {}
): Promise<Explainable<RecommendedAction[]>> {
  await ensureLoaded(adapter);

  return withSpecContext(spec, adapter, async () => {
    const solutions = await adapter.queryAll(
      'all_recommended_actions(Actions).'
    );

    if (!solutions.length || !solutions[0]?.['Actions']) {
      return explainable([], ['No recommended actions found'], 0);
    }

    const actionsRaw = solutions[0]['Actions'];
    if (!Array.isArray(actionsRaw)) {
      return explainable([], ['No recommended actions found'], 0);
    }

    const actions: RecommendedAction[] = [];

    for (const item of actionsRaw) {
      if (!item || typeof item !== 'object') continue;

      const wrapper = item as { functor?: unknown; args?: unknown[] };
      if (wrapper.functor !== 'action' || !Array.isArray(wrapper.args) || wrapper.args.length < 3) continue;

      const actionTerm = wrapper.args[0];
      const confidenceRaw = wrapper.args[1];
      const reasonsRaw = wrapper.args[2];

      const confidenceFloat = typeof confidenceRaw === 'number' ? confidenceRaw : Number(confidenceRaw ?? 0);
      const confidence = confidenceFloat <= 1 ? Math.round(confidenceFloat * 100) : Math.round(confidenceFloat);
      const reasons = prologReasonsToStrings(reasonsRaw);

      const parsed = parseHostActionFromPrologTerm(actionTerm, confidence, reasons);
      if (!parsed) continue;

      const params: Record<string, unknown> = {};
      switch (parsed.action) {
        case 'set_param':
          params['cardId'] = parsed.cardId;
          params['paramId'] = parsed.paramId;
          params['value'] = parsed.value;
          break;
        case 'apply_pack':
          params['packId'] = parsed.packId;
          break;
        case 'add_constraint':
          params['constraint'] = parsed.constraint;
          break;
        case 'remove_constraint':
          params['constraintType'] = parsed.constraintType;
          break;
        case 'set_key':
          params['root'] = parsed.root;
          params['mode'] = parsed.mode;
          break;
        case 'set_tempo':
          params['bpm'] = parsed.bpm;
          break;
        case 'set_meter':
          params['numerator'] = parsed.numerator;
          params['denominator'] = parsed.denominator;
          break;
        case 'set_culture':
          params['culture'] = parsed.culture;
          break;
        case 'set_style':
          params['style'] = parsed.style;
          break;
        case 'add_card':
          params['cardType'] = parsed.cardType;
          if ('defaultParams' in parsed && parsed.defaultParams) params['defaultParams'] = parsed.defaultParams;
          break;
        case 'remove_card':
          params['cardId'] = parsed.cardId;
          break;
        case 'switch_board':
          params['boardType'] = parsed.boardType;
          break;
        case 'add_deck':
          params['deckTemplate'] = parsed.deckTemplate;
          break;
        case 'show_warning':
          params['message'] = parsed.message;
          params['severity'] = parsed.severity;
          break;
      }

      actions.push({
        action: parsed.action,
        params,
        confidence: parsed.confidence,
        reasons: [...parsed.reasons],
      });
    }

    actions.sort((a, b) => b.confidence - a.confidence);

    const avgConfidence = actions.length > 0
      ? Math.round(actions.reduce((sum, a) => sum + a.confidence, 0) / actions.length)
      : 0;

    return explainable(actions, [`Found ${actions.length} recommended actions`], avgConfidence);
  }, options);
}

// ============================================================================
// GTTM SEGMENTATION QUERIES (C192-C194)
// ============================================================================

/**
 * Event representation for GTTM queries.
 */
export interface GTTMEvent {
  readonly startTicks: number;
  readonly durationTicks: number;
  readonly pitch: number;
}

/**
 * Segment phrase events using GTTM-inspired heuristics.
 * 
 * @param events - Array of events to segment
 * @param sensitivity - Boundary sensitivity threshold (0-100, default 50)
 */
export async function segmentPhraseGTTM(
  events: GTTMEvent[],
  sensitivity: number = 50,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<GTTMEvent[][]>> {
  await ensureLoaded(adapter);
  
  if (events.length < 2) {
    return explainable([events], ['Too few events to segment'], 100);
  }
  
  // Convert to Prolog format: evt(Start, Dur, Pitch)
  const eventsStr = events
    .map(e => `evt(${e.startTicks}, ${e.durationTicks}, ${e.pitch})`)
    .join(', ');
  
  const result = await adapter.querySingle(
    `gttm_segment([${eventsStr}], ${sensitivity}, Segments).`
  );
  
  if (!result || !result['Segments']) {
    return explainable([events], ['Segmentation failed, returning single segment'], 50);
  }
  
  const segmentsRaw = result['Segments'] as Array<Array<Record<string, number>>>;
  
  const segments: GTTMEvent[][] = segmentsRaw.map(seg =>
    seg.map(evt => ({
      startTicks: evt[0] ?? evt['startTicks'] ?? 0,
      durationTicks: evt[1] ?? evt['durationTicks'] ?? 0,
      pitch: evt[2] ?? evt['pitch'] ?? 60,
    }))
  );
  
  return explainable(
    segments,
    [`Segmented into ${segments.length} phrases using GTTM heuristics (sensitivity: ${sensitivity})`],
    80
  );
}

/**
 * Get boundary score between events.
 */
export async function getGTTMBoundaryScore(
  prev: GTTMEvent,
  curr: GTTMEvent,
  next: GTTMEvent,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<number> {
  await ensureLoaded(adapter);
  
  const query = `gttm_boundary_score(
    evt(${prev.startTicks}, ${prev.durationTicks}, ${prev.pitch}),
    evt(${curr.startTicks}, ${curr.durationTicks}, ${curr.pitch}),
    evt(${next.startTicks}, ${next.durationTicks}, ${next.pitch}),
    Score
  ).`;
  
  const result = await adapter.querySingle(query);
  return (result?.['Score'] as number) ?? 0;
}

// ============================================================================
// TONAL TENSION QUERIES (C218-C219)
// ============================================================================

/**
 * Calculate tonal tension of a chord relative to a key.
 */
export async function calculateTonalTension(
  chordRoot: RootName,
  chordQuality: string,
  keyRoot: RootName,
  keyMode: ModeName,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<number>> {
  await ensureLoaded(adapter);
  
  const result = await adapter.querySingle(
    `tonal_tension(${chordRoot}, ${chordQuality}, ${keyRoot}, ${keyMode}, Tension, Reasons).`
  );
  
  if (!result) {
    return explainable(0.5, ['Unable to calculate tension'], 50);
  }
  
  const tension = result['Tension'] as number;
  const reasons = (result['Reasons'] as string[]) ?? [];
  
  return explainable(
    tension,
    reasons.map(r => String(r)),
    Math.round((1 - tension) * 100) // Confidence inversely related to tension
  );
}

// ============================================================================
// CADENCE DETECTION (C251-C254)
// ============================================================================

/**
 * Chord representation for cadence detection.
 */
export interface ChordInfo {
  readonly root: RootName;
  readonly quality: string;
}

/**
 * Cadence detection result.
 */
export interface CadenceResult {
  readonly type: string;
  readonly confidence: number;
}

/**
 * Detect cadence type from a chord sequence.
 */
export async function detectCadence(
  chords: ChordInfo[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<CadenceResult>> {
  await ensureLoaded(adapter);
  
  if (chords.length < 2) {
    return explainable(
      { type: 'unknown', confidence: 0 },
      ['Need at least 2 chords to detect cadence'],
      0
    );
  }
  
  const chordsStr = chords
    .map(c => `chord(${c.root}, ${c.quality})`)
    .join(', ');
  
  const result = await adapter.querySingle(
    `detect_cadence([${chordsStr}], CadenceType, Confidence).`
  );
  
  if (!result) {
    return explainable(
      { type: 'unknown', confidence: 30 },
      ['No cadence pattern recognized'],
      30
    );
  }
  
  const cadenceType = result['CadenceType'] as string;
  const confidence = Math.round((result['Confidence'] as number) * 100);
  
  return explainable(
    { type: cadenceType, confidence },
    [`Detected ${cadenceType} cadence`],
    confidence
  );
}

// ============================================================================
// MODULATION DETECTION (C245-C246)
// ============================================================================

/**
 * Modulation point in a piece.
 */
export interface ModulationPoint {
  readonly position: number;
  readonly fromKey: number;
  readonly toKey: number;
}

/**
 * Detect modulations across phrase segments.
 * 
 * @param segments - Array of event arrays (one per segment)
 */
export async function detectModulations(
  segments: GTTMEvent[][],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<ModulationPoint[]>> {
  await ensureLoaded(adapter);
  
  if (segments.length < 2) {
    return explainable([], ['Need at least 2 segments to detect modulations'], 100);
  }
  
  // Convert segments to Prolog format
  const segmentsStr = segments.map(seg => {
    const evtsStr = seg
      .map(e => `evt(${e.startTicks}, ${e.durationTicks}, ${e.pitch})`)
      .join(', ');
    return `[${evtsStr}]`;
  }).join(', ');
  
  const result = await adapter.querySingle(
    `detect_modulations([${segmentsStr}], Modulations).`
  );
  
  if (!result || !result['Modulations']) {
    return explainable([], ['No modulations detected'], 80);
  }
  
  const modulationsRaw = result['Modulations'] as Array<Record<string, number>>;
  const modulations: ModulationPoint[] = modulationsRaw.map(m => ({
    position: m['position'] ?? m[0] ?? 0,
    fromKey: m['fromKey'] ?? m[1] ?? 0,
    toKey: m['toKey'] ?? m[2] ?? 0,
  }));
  
  return explainable(
    modulations,
    modulations.length > 0
      ? [`Detected ${modulations.length} modulation(s)`]
      : ['No modulations detected'],
    modulations.length > 0 ? 70 : 90
  );
}

// ============================================================================
// FILM PROGRESSION RECOMMENDATION (C398)
// ============================================================================

/**
 * Film chord progression recommendation.
 */
export interface FilmProgressionResult {
  readonly mood: FilmMood;
  readonly chords: ChordInfo[];
  readonly reasons: readonly string[];
}

/**
 * Recommend a chord progression for a film mood.
 */
export async function recommendFilmProgression(
  mood: FilmMood,
  keyRoot: RootName,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<FilmProgressionResult | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `recommend_film_progression(${mood}, ${keyRoot}, Chords, Reasons).`
  );

  if (!result || !result['Chords']) {
    return explainable(null, [`No progression found for ${mood} mood`], 0);
  }

  const chordsRaw = result['Chords'] as Array<Record<string, string>>;
  const reasons = (result['Reasons'] as string[]) ?? [];

  const chords: ChordInfo[] = chordsRaw.map(c => ({
    root: (c['root'] ?? c[0] ?? 'c') as RootName,
    quality: String(c['quality'] ?? c[1] ?? 'major'),
  }));

  return explainable(
    { mood, chords, reasons: reasons.map(String) },
    reasons.map(String),
    80
  );
}

// ============================================================================
// SCHEMA CHAIN RECOMMENDATION (C336)
// ============================================================================

/**
 * Recommend a chain of galant schemata for a phrase.
 */
export async function recommendSchemaChain(
  spec: MusicSpec,
  length: number = 3,
  adapter: PrologAdapter = getPrologAdapter(),
  options: StatelessQueryOptions = {}
): Promise<Explainable<string[]>> {
  await ensureLoaded(adapter);

  return withSpecContext(spec, adapter, async () => {
    const result = await adapter.querySingle(
      `current_spec(Spec), recommend_schema_chain(Spec, ${length}, Chain, Reasons).`
    );

    if (!result || !result['Chain']) {
      return explainable(
        [],
        ['No schema chain could be generated for this spec'],
        0
      );
    }

    const chain = result['Chain'] as string[];
    const reasons = (result['Reasons'] as string[]) ?? [];

    return explainable(
      chain,
      reasons.map(String),
      75
    );
  }, options);
}

// ============================================================================
// SCHEMA FIT QUERY (C292)
// ============================================================================

/**
 * Schema fit result.
 */
export interface SchemaFitResult {
  readonly schema: string;
  readonly score: number;
}

/**
 * Evaluate how well soprano and bass degree sequences fit galant schemata.
 */
export async function evaluateSchemaFit(
  sopranoDegreees: number[],
  bassDegrees: number[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<SchemaFitResult[]>> {
  await ensureLoaded(adapter);

  const sopStr = `[${sopranoDegreees.join(',')}]`;
  const bassStr = `[${bassDegrees.join(',')}]`;

  const solutions = await adapter.queryAll(
    `schema_fit(${sopStr}, ${bassStr}, Schema, Score).`
  );

  const fits: SchemaFitResult[] = solutions
    .filter(s => s?.['Schema'] && s?.['Score'])
    .map(s => ({
      schema: s['Schema'] as string,
      score: s['Score'] as number,
    }))
    .sort((a, b) => b.score - a.score);

  const reasons = fits.length > 0
    ? [`Best schema fit: ${fits[0]?.schema} (${Math.round(fits[0]?.score ?? 0)}%)`]
    : ['No matching schemata for degree sequences'];

  return explainable(fits, reasons, fits[0]?.score ?? 0);
}

// ============================================================================
// PIVOT CHORD SEARCH (C247-C248)
// ============================================================================

/**
 * Pivot chord for modulation.
 */
export interface PivotChordResult {
  readonly chord: ChordInfo;
  readonly score: number;
  readonly reasons: readonly string[];
}

/**
 * Find pivot chords between two keys for modulation.
 */
export async function findPivotChords(
  fromKey: RootName,
  fromMode: ModeName,
  toKey: RootName,
  toMode: ModeName,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<PivotChordResult[]>> {
  await ensureLoaded(adapter);

  const solutions = await adapter.queryAll(
    `pivot_chord(${fromKey}, ${fromMode}, ${toKey}, ${toMode}, chord(Root, Quality), Score, Reasons).`
  );

  const pivots: PivotChordResult[] = solutions
    .filter(s => s?.['Root'] && s?.['Quality'] && s?.['Score'])
    .map(s => ({
      chord: {
        root: s['Root'] as RootName,
        quality: String(s['Quality']),
      },
      score: s['Score'] as number,
      reasons: ((s['Reasons'] as string[]) ?? []).map(String),
    }))
    .sort((a, b) => b.score - a.score);

  const reasons = pivots.length > 0
    ? [`Found ${pivots.length} pivot chord(s) between ${fromKey} ${fromMode} and ${toKey} ${toMode}`]
    : [`No pivot chords found between ${fromKey} ${fromMode} and ${toKey} ${toMode}`];

  return explainable(pivots, reasons, pivots.length > 0 ? 80 : 0);
}

// ============================================================================
// GTTM BOUNDARY DETAILS (C180)
// ============================================================================

/**
 * Detailed boundary analysis with per-cue breakdown.
 */
export interface BoundaryCue {
  readonly name: string;
  readonly strength: number;
  readonly weight: number;
}

/**
 * Get detailed GTTM boundary analysis between events.
 */
export async function getGTTMBoundaryDetails(
  prev: GTTMEvent,
  curr: GTTMEvent,
  next: GTTMEvent,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ score: number; cues: BoundaryCue[] }>> {
  await ensureLoaded(adapter);

  const query = `gttm_boundary_score_detailed(
    evt(${prev.startTicks}, ${prev.durationTicks}, ${prev.pitch}),
    evt(${curr.startTicks}, ${curr.durationTicks}, ${curr.pitch}),
    evt(${next.startTicks}, ${next.durationTicks}, ${next.pitch}),
    Score, CueBreakdown
  ).`;

  const result = await adapter.querySingle(query);

  if (!result) {
    return explainable(
      { score: 0, cues: [] },
      ['Boundary analysis failed'],
      0
    );
  }

  const score = (result['Score'] as number) ?? 0;
  const cuesRaw = (result['CueBreakdown'] as Array<Record<string, unknown>>) ?? [];

  const cues: BoundaryCue[] = cuesRaw.map(c => ({
    name: String(c['name'] ?? c[0] ?? 'unknown'),
    strength: (c['strength'] ?? c[1] ?? 0) as number,
    weight: (c['weight'] ?? c[2] ?? 0) as number,
  }));

  return explainable(
    { score, cues },
    [`Boundary score: ${Math.round(score)}/100 from ${cues.length} cues`],
    Math.round(score)
  );
}

// ============================================================================
// TONAL DRIFT (C220-C221)
// ============================================================================

/**
 * Measure tonal drift across windowed pitch class profiles.
 */
export async function measureTonalDrift(
  profiles: number[][],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<number>> {
  await ensureLoaded(adapter);

  if (profiles.length < 2) {
    return explainable(0, ['Need at least 2 profiles to measure drift'], 100);
  }

  const profilesStr = profiles
    .map(p => `[${p.join(',')}]`)
    .join(', ');

  const result = await adapter.querySingle(
    `tonal_drift([${profilesStr}], DriftScore, Reasons).`
  );

  if (!result) {
    return explainable(0, ['Tonal drift calculation failed'], 50);
  }

  const drift = result['DriftScore'] as number;
  const reasons = ((result['Reasons'] as string[]) ?? []).map(String);

  return explainable(drift, reasons, 80);
}

// ============================================================================
// KONNAKOL QUERIES (C502-C503)
// ============================================================================

/**
 * Convert a rhythmic pattern to konnakol syllables.
 */
export async function toKonnakol(
  pattern: number[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<string[]>> {
  await ensureLoaded(adapter);

  const patternStr = `[${pattern.join(',')}]`;
  const result = await adapter.querySingle(
    `konnakol_phrase(${patternStr}, Syllables).`
  );

  if (!result || !result['Syllables']) {
    return explainable([], ['Could not generate konnakol for pattern'], 0);
  }

  const syllables = result['Syllables'] as string[];
  return explainable(
    syllables,
    [`Konnakol: ${syllables.join(' ')}`],
    90
  );
}

// ============================================================================
// MELAKARTA LOOKUP (C525-C596)
// ============================================================================

/**
 * Melakarta raga information.
 */
export interface MelakartaInfo {
  readonly number: number;
  readonly name: string;
  readonly swaras: string[];
  readonly pitchClasses: number[];
}

/**
 * Get melakarta raga information by number (1-72).
 */
export async function getMelakartaInfo(
  num: number,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<MelakartaInfo | null> {
  await ensureLoaded(adapter);

  if (num < 1 || num > 72) return null;

  const nameResult = await adapter.querySingle(
    `melakarta_name(${num}, Name).`
  );
  const swarasResult = await adapter.querySingle(
    `melakarta_swaras(${num}, Swaras).`
  );

  if (!nameResult || !swarasResult) return null;

  const name = nameResult['Name'] as string;
  const swaras = swarasResult['Swaras'] as string[];

  const pcsResult = await adapter.querySingle(
    `melakarta_pcs(${name}, PCs).`
  );

  return {
    number: num,
    name,
    swaras,
    pitchClasses: (pcsResult?.['PCs'] as number[]) ?? [],
  };
}

/**
 * List all 72 melakarta ragas.
 */
export async function listMelakartaRagas(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Array<{ number: number; name: string }>> {
  await ensureLoaded(adapter);

  const solutions = await adapter.queryAll(
    'melakarta_name(Num, Name).'
  );

  return solutions
    .map(s => ({
      number: s['Num'] as number,
      name: s['Name'] as string,
    }))
    .sort((a, b) => a.number - b.number);
}

// ============================================================================
// SCENE ARC TEMPLATE (C451-C452)
// ============================================================================

/**
 * Section in a scene arc.
 */
export interface SceneSection {
  readonly name: string;
  readonly energy: string;
}

/**
 * Get a scene arc template for narrative structure.
 */
export async function getSceneArcTemplate(
  arcType: 'rising_action' | 'tension_release' | 'slow_burn' | 'bookend' | 'stinger',
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<SceneSection[]>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `scene_arc_template(${arcType}, Sections, Reasons).`
  );

  if (!result || !result['Sections']) {
    return explainable([], [`No arc template found for ${arcType}`], 0);
  }

  const sectionsRaw = result['Sections'] as Array<Record<string, string>>;
  const reasons = ((result['Reasons'] as string[]) ?? []).map(String);

  const sections: SceneSection[] = sectionsRaw.map(s => ({
    name: String(s['name'] ?? s[0] ?? 'unknown'),
    energy: String(s['energy'] ?? s[1] ?? 'medium'),
  }));

  return explainable(sections, reasons, 85);
}

// ============================================================================
// CADENCE STRENGTH (C256-C257)
// ============================================================================

/**
 * Get the strength of a cadence type in the current musical context.
 */
export async function getCadenceStrength(
  cadenceType: string,
  spec: MusicSpec,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<number>> {
  await ensureLoaded(adapter);
  await clearSpec(adapter);
  await pushSpec(spec, adapter);

  try {
    const result = await adapter.querySingle(
      `current_spec(Spec), cadence_strength_culture(${cadenceType}, Spec, Strength).`
    );

    if (!result) {
      return explainable(50, ['Unable to calculate cadence strength'], 50);
    }

    const strength = result['Strength'] as number;
    return explainable(
      strength,
      [`${cadenceType} cadence has strength ${strength} in ${spec.culture} context`],
      80
    );
  } finally {
    await clearSpec(adapter);
  }
}

// ============================================================================
// WEIGHTED PROFILE QUERIES (C134)
// ============================================================================

/**
 * Weighted note for pitch class profile construction.
 */
export interface WeightedNote {
  readonly pitch: number;
  readonly duration: number;
  readonly velocity: number;
}

/**
 * Detect key using a duration/velocity-weighted pitch class profile.
 */
export async function detectKeyWeighted(
  notes: WeightedNote[],
  weightType: 'duration' | 'velocity' | 'combined' = 'combined',
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<KeyDetectionResult> | null> {
  await ensureLoaded(adapter);

  if (notes.length === 0) return null;

  const notesStr = notes
    .map(n => `wn(${n.pitch}, ${n.duration}, ${n.velocity})`)
    .join(', ');

  const profileResult = await adapter.querySingle(
    `pc_profile_weighted([${notesStr}], ${weightType}, Profile).`
  );

  if (!profileResult || !profileResult['Profile']) return null;

  const profile = profileResult['Profile'] as number[];
  return detectKeyKS(profile, adapter);
}

// ============================================================================
// SCHEMA FINGERPRINT & SIMILARITY (C233-C234)
// ============================================================================

/**
 * Schema fingerprint result.
 */
export interface SchemaFingerprint {
  readonly bassDegrees: number[];
  readonly upperDegrees: number[];
  readonly cadenceType: string;
}

/**
 * Get the fingerprint for a galant schema.
 */
export async function getSchemaFingerprint(
  schema: GalantSchemaName,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<SchemaFingerprint | null> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `schema_fingerprint(${schema}, fp(Bass, Upper, Cadence)).`
  );

  if (!result) return null;

  return {
    bassDegrees: result['Bass'] as number[],
    upperDegrees: result['Upper'] as number[],
    cadenceType: String(result['Cadence']),
  };
}

/**
 * Compare similarity between two schemata.
 */
export async function getSchemaSimilarity(
  schemaA: GalantSchemaName,
  schemaB: GalantSchemaName,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<number>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `schema_similarity(${schemaA}, ${schemaB}, Score).`
  );

  if (!result) {
    return explainable(0, ['Unable to compute schema similarity'], 50);
  }

  const score = result['Score'] as number;
  return explainable(
    score,
    [`Similarity between ${schemaA} and ${schemaB}: ${score}`],
    80
  );
}

// ============================================================================
// RAGA FINGERPRINT & SIMILARITY (C235-C236)
// ============================================================================

/**
 * Compare similarity between two ragas.
 */
export async function getRagaSimilarity(
  ragaA: string,
  ragaB: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<number>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `raga_similarity(${ragaA}, ${ragaB}, Score).`
  );

  if (!result) {
    return explainable(0, ['Unable to compute raga similarity'], 50);
  }

  const score = result['Score'] as number;
  return explainable(
    score,
    [`Similarity between ragas ${ragaA} and ${ragaB}: ${score}`],
    75
  );
}

// ============================================================================
// MODE SIMILARITY (C237-C238)
// ============================================================================

/**
 * Compare similarity between two modes.
 */
export async function getModeSimilarity(
  modeA: string,
  modeB: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<number>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `mode_similarity(${modeA}, ${modeB}, Score).`
  );

  if (!result) {
    return explainable(0, ['Unable to compute mode similarity'], 50);
  }

  const score = result['Score'] as number;
  return explainable(
    score,
    [`Similarity between modes ${modeA} and ${modeB}: ${score}`],
    80
  );
}

// ============================================================================
// TONAL CENTROID (C239-C241)
// ============================================================================

/**
 * 6D tonal centroid from DFT bins K=1,2,3.
 */
export interface TonalCentroid {
  readonly r1: number;
  readonly i1: number;
  readonly r2: number;
  readonly i2: number;
  readonly r3: number;
  readonly i3: number;
}

/**
 * Compute tonal centroid for a pitch class profile.
 */
export async function getTonalCentroid(
  profile: number[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<TonalCentroid | null> {
  await ensureLoaded(adapter);

  const profileStr = `[${profile.join(',')}]`;
  const result = await adapter.querySingle(
    `tonal_centroid(${profileStr}, centroid(R1,I1,R2,I2,R3,I3)).`
  );

  if (!result) return null;

  return {
    r1: result['R1'] as number,
    i1: result['I1'] as number,
    r2: result['R2'] as number,
    i2: result['I2'] as number,
    r3: result['R3'] as number,
    i3: result['I3'] as number,
  };
}

/**
 * Compute distance between two tonal centroids.
 */
export async function getCentroidDistance(
  a: TonalCentroid,
  b: TonalCentroid,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<number> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `centroid_distance(centroid(${a.r1},${a.i1},${a.r2},${a.i2},${a.r3},${a.i3}), centroid(${b.r1},${b.i1},${b.r2},${b.i2},${b.r3},${b.i3}), Distance).`
  );

  if (!result) return Infinity;
  return result['Distance'] as number;
}

// ============================================================================
// COMPARE TONALITY MODELS (C213-C214)
// ============================================================================

/**
 * Result from comparing tonality models.
 */
export interface TonalityModelComparison {
  readonly model: TonalityModel;
  readonly key: string;
  readonly confidence: number;
}

/**
 * Compare KS, DFT, and Spiral Array models on the same profile.
 */
export async function compareTonalityModels(
  profile: number[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<TonalityModelComparison[]>> {
  await ensureLoaded(adapter);

  const profileStr = `[${profile.join(',')}]`;
  const result = await adapter.querySingle(
    `compare_tonality_models(${profileStr}, Results).`
  );

  if (!result || !result['Results']) {
    return explainable([], ['Unable to compare tonality models'], 50);
  }

  const results = (result['Results'] as Array<Record<string, unknown>>).map(r => ({
    model: String(r['Model'] ?? r['arg1'] ?? 'unknown') as TonalityModel,
    key: String(r['Key'] ?? r['arg2'] ?? 'unknown'),
    confidence: (r['Confidence'] ?? r['arg3'] ?? 0) as number,
  }));

  return explainable(
    results,
    ['Tonality models compared on input profile'],
    85
  );
}

// ============================================================================
// SEGMENT KEY DETECTION (C244)
// ============================================================================

/**
 * Detect key for a segment of events using specified model.
 */
export async function detectSegmentKey(
  events: Array<{ start: number; duration: number; pitch: number }>,
  model: TonalityModel = 'ks_profile',
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<KeyDetectionResult> | null> {
  await ensureLoaded(adapter);

  if (events.length === 0) return null;

  const eventsStr = events
    .map(e => `e(${e.start}, ${e.duration}, ${e.pitch})`)
    .join(', ');

  const result = await adapter.querySingle(
    `segment_key([${eventsStr}], ${model}, Key, Confidence).`
  );

  if (!result) return null;

  const key = String(result['Key']);
  const confidence = result['Confidence'] as number;

  return explainable(
    {
      root: key as RootName,
      mode: 'major' as ModeName, // segment_key returns root only
      confidence,
      model,
    },
    [`Segment key: ${key} (${model}, confidence ${confidence})`],
    confidence
  );
}

// ============================================================================
// RECOMMEND GALANT SCHEMA (C300)
// ============================================================================

/**
 * Get ranked schema recommendations for the current spec.
 */
export async function recommendGalantSchema(
  spec: MusicSpec,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<GalantSchemaName[]>> {
  await ensureLoaded(adapter);
  await clearSpec(adapter);
  await pushSpec(spec, adapter);

  try {
    const result = await adapter.querySingle(
      'current_spec(Spec), recommend_galant_schema(Spec, SchemaList, Reasons).'
    );

    if (!result || !result['SchemaList']) {
      return explainable([], ['No schema recommendations available'], 50);
    }

    const schemas = (result['SchemaList'] as string[]).map(s => String(s) as GalantSchemaName);
    const reasons = (result['Reasons'] as string[]) || ['Schema recommendations generated'];

    return explainable(schemas, reasons.map(String), 80);
  } finally {
    await clearSpec(adapter);
  }
}

// ============================================================================
// DECK TEMPLATE RECOMMENDATION (C866-C867)
// ============================================================================

/**
 * Deck template recommendation result.
 */
export interface DeckTemplateRecommendation {
  readonly templateId: string;
  readonly reasons: readonly string[];
}

/**
 * Recommend deck templates for the current spec.
 */
export async function recommendDeckTemplates(
  spec: MusicSpec,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<DeckTemplateRecommendation[]>> {
  await ensureLoaded(adapter);
  await clearSpec(adapter);
  await pushSpec(spec, adapter);

  try {
    const solutions = await adapter.queryAll(
      'current_spec(Spec), recommend_template(Spec, TemplateId, Reasons).'
    );

    const recs: DeckTemplateRecommendation[] = solutions.map(s => ({
      templateId: String(s['TemplateId']),
      reasons: ((s['Reasons'] as string[]) || []).map(String),
    }));

    return explainable(
      recs,
      [`${recs.length} deck template(s) recommended`],
      85
    );
  } finally {
    await clearSpec(adapter);
  }
}

// ============================================================================
// ROLE ALLOCATION (C897-C898)
// ============================================================================

/**
 * Orchestration role allocation result.
 */
export interface RoleAllocation {
  readonly role: string;
  readonly family: string;
}

/**
 * Allocate orchestration roles for a section.
 */
export async function allocateRoles(
  spec: MusicSpec,
  section: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<RoleAllocation[]>> {
  await ensureLoaded(adapter);
  await clearSpec(adapter);
  await pushSpec(spec, adapter);

  try {
    const result = await adapter.querySingle(
      `current_spec(Spec), allocate_roles(Spec, ${section}, Roles, Reasons).`
    );

    if (!result || !result['Roles']) {
      return explainable([], ['Unable to allocate roles'], 50);
    }

    const roles = (result['Roles'] as Array<Record<string, unknown>>).map(r => ({
      role: String(r['arg1'] ?? r['Role'] ?? 'unknown'),
      family: String(r['arg2'] ?? r['Family'] ?? 'unknown'),
    }));

    const reasons = ((result['Reasons'] as string[]) || []).map(String);

    return explainable(roles, reasons, 80);
  } finally {
    await clearSpec(adapter);
  }
}

// ============================================================================
// ARRANGER STYLE RECOMMENDATION (C891-C892)
// ============================================================================

/**
 * Recommend arranger style based on spec.
 */
export async function recommendArrangerStyle(
  spec: MusicSpec,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<string>> {
  await ensureLoaded(adapter);
  await clearSpec(adapter);
  await pushSpec(spec, adapter);

  try {
    const result = await adapter.querySingle(
      'current_spec(Spec), recommend_arranger_style(Spec, Style, Reasons).'
    );

    if (!result) {
      return explainable('standard', ['No specific style recommendation'], 50);
    }

    const style = String(result['Style']);
    const reasons = ((result['Reasons'] as string[]) || []).map(String);

    return explainable(style, reasons, 80);
  } finally {
    await clearSpec(adapter);
  }
}

// ============================================================================
// FILL GENERATION (C936-C937)
// ============================================================================

/**
 * Fill generation result.
 */
export interface GeneratedFill {
  readonly type: string;
  readonly pattern: string[];
}

/**
 * Generate a fill of the specified type.
 */
export async function generateFill(
  fillType: 'drum_fill' | 'melodic_fill' | 'riser_fill',
  spec: MusicSpec,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<GeneratedFill | null>> {
  await ensureLoaded(adapter);
  await clearSpec(adapter);
  await pushSpec(spec, adapter);

  try {
    const result = await adapter.querySingle(
      `current_spec(Spec), generate_fill(${fillType}, Spec, fill(Type, Pattern), Reasons).`
    );

    if (!result) {
      return explainable(null, ['Unable to generate fill'], 50);
    }

    return explainable(
      {
        type: String(result['Type']),
        pattern: (result['Pattern'] as string[]).map(String),
      },
      ((result['Reasons'] as string[]) || []).map(String),
      75
    );
  } finally {
    await clearSpec(adapter);
  }
}

// ============================================================================
// RECOMMEND TONALITY MODEL (C215-C216)
// ============================================================================

/**
 * Recommend tonality model based on spec context.
 */
export async function recommendTonalityModel(
  spec: MusicSpec,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<TonalityModel>> {
  await ensureLoaded(adapter);
  await clearSpec(adapter);
  await pushSpec(spec, adapter);

  try {
    const result = await adapter.querySingle(
      'current_spec(Spec), recommend_tonality_model(Spec, Model, Reasons).'
    );

    if (!result) {
      return explainable('ks_profile' as TonalityModel, ['Default: KS profile'], 50);
    }

    const model = String(result['Model']) as TonalityModel;
    const reasons = ((result['Reasons'] as string[]) || []).map(String);

    return explainable(model, reasons, 85);
  } finally {
    await clearSpec(adapter);
  }
}

// ============================================================================
// HIT POINT PLACEMENT (C418-C419)
// ============================================================================

/**
 * Recommend a chord for a hit point.
 */
export async function getHitPointChord(
  hitType: 'accent' | 'stinger' | 'transition' | 'reveal',
  key: RootName,
  mood: FilmMood,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<string>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `place_hit_chord(${hitType}, ${key}, ${mood}, Chord).`
  );

  if (!result) {
    return explainable('I', ['Default tonic chord for hit point'], 50);
  }

  const chord = String(result['Chord']);
  return explainable(
    chord,
    [`${hitType} hit in ${mood} mood: ${chord}`],
    80
  );
}

// ============================================================================
// ORCHESTRATION BUDGET (C454-C455)
// ============================================================================

/**
 * Get orchestration budget for a complexity level.
 */
export async function getOrchestrationBudget(
  level: 'minimal' | 'standard' | 'full' | 'epic',
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<number>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `orchestration_budget(${level}, MaxVoices, Reasons).`
  );

  if (!result) {
    return explainable(6, ['Default standard budget'], 50);
  }

  const maxVoices = result['MaxVoices'] as number;
  const reasons = ((result['Reasons'] as string[]) || []).map(String);

  return explainable(maxVoices, reasons, 90);
}

// ============================================================================
// CUE ENDING RECOMMENDATION (C462)
// ============================================================================

/**
 * Recommend a cue ending strategy for a film mood.
 */
export async function recommendCueEnding(
  mood: FilmMood,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<string>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `recommend_cue_ending(${mood}, EndingStrategy, Reasons).`
  );

  if (!result) {
    return explainable('fade_out', ['Default ending strategy'], 50);
  }

  const strategy = String(result['EndingStrategy']);
  const reasons = ((result['Reasons'] as string[]) || []).map(String);

  return explainable(strategy, reasons, 85);
}

// ============================================================================
// VOICE LEADING PROFILE (C940-C941)
// ============================================================================

/**
 * Get culture-specific voice leading profile.
 */
export async function getVoiceLeadingProfile(
  culture: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<string>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `voice_leading_profile(${culture}, Rules).`
  );

  if (!result) {
    return explainable('standard', ['Default Western voice leading'], 50);
  }

  return explainable(
    String(result['Rules']),
    [`Voice leading profile for ${culture} culture`],
    85
  );
}

// ============================================================================
// LYDIAN CHROMATIC CONCEPT QUERIES (C1101-C1200)
// ============================================================================

/**
 * Tonal gravity analysis result.
 */
export interface TonalGravityResult {
  readonly note: string;
  readonly level: number;
  readonly direction: 'ingoing' | 'outgoing';
}

/**
 * Analyze a melody's tonal gravity relative to a Lydian tonic.
 */
export async function analyzeLCCGravity(
  notes: string[],
  lydianRoot: RootName,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<TonalGravityResult[]>> {
  await ensureLoaded(adapter);

  const notesStr = notes.map(n => `${n}`).join(', ');
  const result = await adapter.querySingle(
    `analyze_melody_gravity([${notesStr}], ${lydianRoot}, GravityProfile).`
  );

  if (!result || !result['GravityProfile']) {
    return explainable([], ['Unable to analyze LCC gravity'], 50);
  }

  const profile = (result['GravityProfile'] as Array<Record<string, unknown>>).map(g => ({
    note: String(g['arg1'] ?? g['Note'] ?? 'unknown'),
    level: (g['arg2'] ?? g['Level'] ?? 12) as number,
    direction: String(g['arg3'] ?? g['Direction'] ?? 'outgoing') as 'ingoing' | 'outgoing',
  }));

  return explainable(
    profile,
    [`LCC gravity analysis relative to ${lydianRoot} Lydian tonic`],
    80
  );
}

/**
 * LCC scale recommendation result.
 */
export interface LCCScaleRecommendation {
  readonly root: string;
  readonly scaleName: string;
  readonly gravityFit: number;
}

/**
 * Recommend LCC-based scales for a chord.
 */
export async function recommendLCCScale(
  chordRoot: RootName,
  chordType: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<LCCScaleRecommendation[]>> {
  await ensureLoaded(adapter);

  const solutions = await adapter.queryAll(
    `recommend_lcc_scale(chord(${chordRoot}, ${chordType}), scale(Root, ScaleName), GravityFit, Reasons).`
  );

  const recs: LCCScaleRecommendation[] = solutions.map(s => ({
    root: String(s['Root']),
    scaleName: String(s['ScaleName']),
    gravityFit: s['GravityFit'] as number,
  }));

  return explainable(
    recs,
    [`${recs.length} LCC scale(s) recommended for ${chordRoot} ${chordType}`],
    85
  );
}

/**
 * Get the parent scale for a chord using LCC principles.
 */
export async function getChordParentScale(
  chordRoot: RootName,
  chordType: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ root: string; scale: string } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `chord_parent_scale(chord(${chordRoot}, ${chordType}), scale(Root, Scale), Reasons).`
  );

  if (!result) {
    return explainable(null, ['No parent scale found'], 50);
  }

  const reasons = ((result['Reasons'] as string[]) || []).map(String);

  return explainable(
    { root: String(result['Root']), scale: String(result['Scale']) },
    reasons,
    90
  );
}

// ============================================================================
// JAZZ VOICING QUERIES (C1201-C1240)
// ============================================================================

/**
 * Jazz voicing result.
 */
export interface JazzVoicing {
  readonly type: string;
  readonly notes: number[];
}

/**
 * Get shell voicing for a chord type.
 */
export async function getShellVoicing(
  chordType: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<JazzVoicing | null> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `shell_voicing(${chordType}, VoiceSet, Inversion).`
  );

  if (!result) return null;

  return {
    type: `shell_${String(result['Inversion'])}`,
    notes: result['VoiceSet'] as number[],
  };
}

/**
 * Get rootless voicing for a chord type.
 */
export async function getRootlessVoicing(
  chordType: string,
  voicingType: 'a' | 'b' = 'a',
  adapter: PrologAdapter = getPrologAdapter()
): Promise<JazzVoicing | null> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `rootless_voicing(${chordType}, ${voicingType}, Notes, Register).`
  );

  if (!result) return null;

  return {
    type: `rootless_${voicingType}`,
    notes: result['Notes'] as number[],
  };
}

/**
 * Compute voice leading score between two voicings.
 */
export async function getVoiceLeadingScore(
  voicing1: number[],
  voicing2: number[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<number>> {
  await ensureLoaded(adapter);

  const v1 = `[${voicing1.join(',')}]`;
  const v2 = `[${voicing2.join(',')}]`;

  const result = await adapter.querySingle(
    `voice_leading_score(${v1}, ${v2}, Score, Moves).`
  );

  if (!result) {
    return explainable(Infinity, ['Unable to compute voice leading score'], 50);
  }

  const score = result['Score'] as number;
  return explainable(
    score,
    [`Voice leading motion: ${score} semitones total`],
    85
  );
}

/**
 * Get tritone substitution for a dominant chord.
 */
export async function getTritoneSubstitution(
  chordRoot: RootName,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<string | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `tritone_sub(chord(${chordRoot}, dominant7), chord(SubRoot, dominant7), Reasons).`
  );

  if (!result) {
    return explainable(null, ['No tritone sub available'], 50);
  }

  const subRoot = String(result['SubRoot']);
  const reasons = ((result['Reasons'] as string[]) || []).map(String);

  return explainable(subRoot, reasons, 90);
}

// ============================================================================
// REHARMONIZATION STRENGTH & MELODY COMPATIBILITY (C1337-C1339)
// ============================================================================

/**
 * Result of substitution strength analysis.
 */
export interface SubstitutionStrength {
  readonly strength: number;
  readonly compatibility: string;
}

/**
 * Rate how strong a reharmonization substitution is.
 * C1337: sub_strength/4
 */
export async function getSubstitutionStrength(
  originalRoot: RootName,
  originalType: string,
  subRoot: RootName,
  subType: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<SubstitutionStrength | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `sub_strength(chord(${originalRoot}, ${originalType}), chord(${subRoot}, ${subType}), Strength, Compatibility).`
  );

  if (!result) {
    return explainable(null, ['Could not evaluate substitution strength'], 50);
  }

  return explainable(
    { strength: Number(result['Strength']), compatibility: String(result['Compatibility']) },
    [`Strength: ${result['Strength']}, Compatibility: ${result['Compatibility']}`],
    85
  );
}

/**
 * Result of melody compatibility check.
 */
export interface MelodyCompatibility {
  readonly score: number;
  readonly conflicts: Array<{ index: number; note: string; pc: number }>;
}

/**
 * Check whether a melody is compatible with a reharmonization chord.
 * C1338-C1339: melody_compatible/4
 */
export async function checkMelodyCompatibility(
  melodyNotes: RootName[],
  chordRoot: RootName,
  chordType: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<MelodyCompatibility | null>> {
  await ensureLoaded(adapter);

  const noteList = `[${melodyNotes.join(',')}]`;
  const result = await adapter.querySingle(
    `melody_compatible(${noteList}, chord(${chordRoot}, ${chordType}), Score, Conflicts).`
  );

  if (!result) {
    return explainable(null, ['Could not check melody compatibility'], 50);
  }

  const score = Number(result['Score']);
  const conflicts = Array.isArray(result['Conflicts'])
    ? (result['Conflicts'] as unknown[]).map((c) => {
        const cs = String(c);
        return { index: 0, note: cs, pc: 0 };
      })
    : [];

  return explainable(
    { score, conflicts },
    [`Compatibility score: ${score.toFixed(1)}%`],
    80
  );
}

// ============================================================================
// JAZZ IMPROVISATION VOCABULARY (C1351-C1390)
// ============================================================================

/**
 * Get a bebop scale for a given type and root.
 * C1352-C1353: bebop_scale/3
 */
export async function getBebopScale(
  type: 'dominant' | 'major' | 'minor' | 'dorian',
  root: RootName,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<string[]>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `bebop_scale(${type}, ${root}, Notes).`
  );

  if (!result) {
    return explainable([], ['No bebop scale found'], 50);
  }

  const notes = Array.isArray(result['Notes'])
    ? (result['Notes'] as unknown[]).map(String)
    : [];

  return explainable(notes, [`Bebop ${type} scale from ${root}`], 95);
}

/**
 * Enclosure pattern result.
 */
export interface EnclosurePattern {
  readonly notes: string[];
  readonly rhythm: string[];
}

/**
 * Generate an enclosure pattern around a target note.
 * C1354-C1355: enclosure/4
 */
export async function getEnclosure(
  target: RootName,
  type: string = 'chromatic_above_below',
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<EnclosurePattern | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `enclosure(${target}, ${type}, Notes, Rhythm).`
  );

  if (!result) {
    return explainable(null, ['No enclosure pattern found'], 50);
  }

  const notes = Array.isArray(result['Notes'])
    ? (result['Notes'] as unknown[]).map(String) : [];
  const rhythm = Array.isArray(result['Rhythm'])
    ? (result['Rhythm'] as unknown[]).map(String) : [];

  return explainable({ notes, rhythm }, [`Enclosure ${type} → ${target}`], 90);
}

/**
 * Generate a digital pattern over a chord.
 * C1356-C1357: digital_pattern/4
 */
export async function getDigitalPattern(
  chordRoot: RootName,
  chordType: string,
  patternType: string = '1235',
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<string[]>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `digital_pattern(chord(${chordRoot}, ${chordType}), '${patternType}', Notes, Direction).`
  );

  if (!result) {
    return explainable([], ['No digital pattern found'], 50);
  }

  const notes = Array.isArray(result['Notes'])
    ? (result['Notes'] as unknown[]).map(String) : [];

  return explainable(notes, [`Digital pattern ${patternType} on ${chordRoot} ${chordType}`], 90);
}

/**
 * Generate a guide tone line through a chord progression.
 * C1372-C1373: guide_tone_line/3
 */
export async function getGuideToneLine(
  chords: Array<{ root: RootName; type: string }>,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<Array<{ third: string; seventh: string }>>> {
  await ensureLoaded(adapter);

  const chordList = `[${chords.map((c) => `chord(${c.root}, ${c.type})`).join(',')}]`;
  const result = await adapter.querySingle(
    `guide_tone_line(${chordList}, GuideTones, _VL).`
  );

  if (!result) {
    return explainable([], ['Could not generate guide tone line'], 50);
  }

  const guideTones = Array.isArray(result['GuideTones'])
    ? (result['GuideTones'] as unknown[]).map((g) => {
        const gs = String(g);
        return { third: gs, seventh: '' };
      })
    : [];

  return explainable(guideTones, ['Guide tone line through chord changes'], 85);
}

/**
 * Analyze a jazz phrase for vocabulary patterns.
 * C1402: analyze_jazz_phrase/3
 */
export async function analyzeJazzPhrase(
  notes: RootName[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ vocabulary: string; patternCount: number }>> {
  await ensureLoaded(adapter);

  const noteList = `[${notes.join(',')}]`;
  const result = await adapter.querySingle(
    `analyze_jazz_phrase(${noteList}, _Patterns, Vocabulary).`
  );

  if (!result) {
    return explainable(
      { vocabulary: 'unknown', patternCount: 0 },
      ['Could not analyze phrase'],
      50
    );
  }

  return explainable(
    { vocabulary: String(result['Vocabulary']), patternCount: 0 },
    [`Jazz vocabulary level: ${result['Vocabulary']}`],
    80
  );
}

/**
 * Get a jazz practice exercise.
 * C1389: jazz_practice_exercise/4
 */
export async function getJazzPracticeExercise(
  concept: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ exercise: string; instructions: string[] } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `jazz_practice_exercise(${concept}, Exercise, _Chords, Instructions).`
  );

  if (!result) {
    return explainable(null, ['No exercise found for concept'], 50);
  }

  const instructions = Array.isArray(result['Instructions'])
    ? (result['Instructions'] as unknown[]).map(String) : [];

  return explainable(
    { exercise: String(result['Exercise']), instructions },
    [`Practice exercise for ${concept}`],
    85
  );
}

// ============================================================================
// SPECTRAL MUSIC & COMPUTATIONAL ORCHESTRATION (C1451-C1530)
// ============================================================================

/**
 * Spectral analysis result.
 */
export interface SpectralModel {
  readonly partials: Array<{ n: number; freq: number; amp: number }>;
}

/**
 * Calculate the spectral centroid (brightness measure) of a spectrum.
 * C1455: spectral_centroid/2
 */
export async function calculateSpectralCentroid(
  fundamental: number,
  numPartials: number = 16,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<number>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `harmonic_series(${fundamental}, ${numPartials}, Partials), spectral_centroid(Partials, Centroid).`
  );

  if (!result) {
    return explainable(0, ['Could not calculate spectral centroid'], 50);
  }

  const centroid = Number(result['Centroid']);
  return explainable(centroid, [`Spectral centroid: ${centroid.toFixed(1)} Hz`], 90);
}

/**
 * Morph between two spectra at parameter t (0-1).
 * C1462: spectral_morphing/4
 */
export async function morphSpectrum(
  fund1: number,
  fund2: number,
  t: number,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<string>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `harmonic_series(${fund1}, 8, S1), harmonic_series(${fund2}, 8, S2), spectral_morphing(S1, S2, ${t}, Interpolated).`
  );

  if (!result) {
    return explainable('', ['Could not morph spectra'], 50);
  }

  return explainable(
    String(result['Interpolated']),
    [`Morphed spectrum at t=${t} between ${fund1}Hz and ${fund2}Hz`],
    85
  );
}

/**
 * Get the Forte number for a pitch-class set.
 * C1512: forte_number/2
 */
export async function getForteNumber(
  pitchClasses: number[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<string | null>> {
  await ensureLoaded(adapter);

  const pcList = `[${pitchClasses.join(',')}]`;
  const result = await adapter.querySingle(
    `forte_number(${pcList}, ForteNumber).`
  );

  if (!result) {
    return explainable(null, ['Forte number not found for this set'], 50);
  }

  return explainable(String(result['ForteNumber']), ['Forte catalog lookup'], 95);
}

/**
 * Get the interval vector for a pitch-class set.
 * C1513: interval_vector/2
 */
export async function getIntervalVector(
  pitchClasses: number[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<number[]>> {
  await ensureLoaded(adapter);

  const pcList = `[${pitchClasses.join(',')}]`;
  const result = await adapter.querySingle(
    `interval_vector(${pcList}, Vector).`
  );

  if (!result) {
    return explainable([], ['Could not compute interval vector'], 50);
  }

  const vector = Array.isArray(result['Vector'])
    ? (result['Vector'] as unknown[]).map(Number) : [];

  return explainable(vector, ['Interval vector computed'], 95);
}

/**
 * Apply a neo-Riemannian PLR transformation.
 * C1523: neo_riemannian_plr/3
 */
export async function applyNeoRiemannian(
  root: RootName,
  quality: 'major' | 'minor',
  operation: 'p' | 'l' | 'r',
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ root: string; quality: string } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `neo_riemannian_plr(triad(${root}, ${quality}), ${operation}, triad(NewRoot, NewQuality)).`
  );

  if (!result) {
    return explainable(null, ['Could not apply transformation'], 50);
  }

  return explainable(
    { root: String(result['NewRoot']), quality: String(result['NewQuality']) },
    [`${operation.toUpperCase()} transformation: ${root} ${quality} → ${result['NewRoot']} ${result['NewQuality']}`],
    95
  );
}

/**
 * Compute Tonnetz distance between two triads.
 * C1524: tonnetz_distance/3
 */
export async function getTonnetzDistance(
  root1: RootName,
  quality1: 'major' | 'minor',
  root2: RootName,
  quality2: 'major' | 'minor',
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<number>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `tonnetz_distance(triad(${root1}, ${quality1}), triad(${root2}, ${quality2}), Distance).`
  );

  if (!result) {
    return explainable(-1, ['Could not compute Tonnetz distance'], 50);
  }

  return explainable(
    Number(result['Distance']),
    [`Tonnetz distance: ${result['Distance']} PLR operations`],
    90
  );
}

/**
 * Find parsimonious voice leading between two triads.
 * C1525: parsimonious_voice_leading/3
 */
export async function findParsimoniousPath(
  root1: RootName,
  quality1: 'major' | 'minor',
  root2: RootName,
  quality2: 'major' | 'minor',
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ totalMotion: number }>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `parsimonious_voice_leading(triad(${root1}, ${quality1}), triad(${root2}, ${quality2}), vl(_Moves, TotalMotion)).`
  );

  if (!result) {
    return explainable({ totalMotion: -1 }, ['Could not find voice leading'], 50);
  }

  return explainable(
    { totalMotion: Number(result['TotalMotion']) },
    [`Minimal voice leading motion: ${result['TotalMotion']} semitones`],
    90
  );
}

/**
 * Compute orchestral weight for a set of instruments at a dynamic level.
 * C1494: orchestral_weight/3
 */
export async function getOrchestralWeight(
  instruments: string[],
  dynamic: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<number>> {
  await ensureLoaded(adapter);

  const instrList = `[${instruments.join(',')}]`;
  const result = await adapter.querySingle(
    `orchestral_weight(${instrList}, ${dynamic}, Weight).`
  );

  if (!result) {
    return explainable(0, ['Could not compute orchestral weight'], 50);
  }

  return explainable(
    Number(result['Weight']),
    [`Orchestral weight at ${dynamic}: ${result['Weight']}`],
    85
  );
}

// ============================================================================
// FILM SCORING & EMOTION (C1551-C1700)
// ============================================================================

/**
 * Emotion vector from Russell's circumplex model.
 */
export interface EmotionVector {
  readonly label: string;
  readonly valence: string;
  readonly arousal: string;
}

/**
 * Map musical features to an emotion using the Russell circumplex model.
 * C1594: composite_emotion_model/3
 */
export async function mapMusicToEmotion(
  features: Array<{ key: string; value: string | number }>,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<EmotionVector | null>> {
  await ensureLoaded(adapter);

  const featureList = `[${features.map((f) => `${f.key}(${f.value})`).join(',')}]`;
  const result = await adapter.querySingle(
    `composite_emotion_model(${featureList}, russell, emotion(Label, valence(V), arousal(A))).`
  );

  if (!result) {
    return explainable(null, ['Could not map to emotion'], 50);
  }

  return explainable(
    { label: String(result['Label']), valence: String(result['V']), arousal: String(result['A']) },
    [`Emotion: ${result['Label']} (valence=${result['V']}, arousal=${result['A']})`],
    80
  );
}

/**
 * Convert a target emotion into musical constraints.
 * C1595: emotion_to_music_params/3
 */
export async function emotionToMusicParams(
  emotion: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ constraints: string[]; spec: string } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `emotion_to_music_params(${emotion}, Constraints, Spec).`
  );

  if (!result) {
    return explainable(null, ['No music params for this emotion'], 50);
  }

  const constraints = Array.isArray(result['Constraints'])
    ? (result['Constraints'] as unknown[]).map(String) : [];

  return explainable(
    { constraints, spec: String(result['Spec']) },
    [`Musical params for ${emotion}`],
    85
  );
}

/**
 * Calculate a variable click track to hit sync points.
 * C1564: click_track_calculation/4
 */
export async function calculateClickTrack(
  hitPoints: Array<{ timecode: number; event: string }>,
  minTempo: number,
  maxTempo: number,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<string>> {
  await ensureLoaded(adapter);

  const hpList = `[${hitPoints.map((hp) => `hit(${hp.timecode}, ${hp.event})`).join(',')}]`;
  const result = await adapter.querySingle(
    `click_track_calculation(${hpList}, range(${minTempo}, ${maxTempo}), moderate, ClickTrack).`
  );

  if (!result) {
    return explainable('', ['Could not calculate click track'], 50);
  }

  return explainable(
    String(result['ClickTrack']),
    [`Click track spanning ${minTempo}-${maxTempo} BPM`],
    80
  );
}

/**
 * Get horror scoring techniques.
 * C1621: horror_scoring_technique/3
 */
export async function getHorrorScoringTechnique(
  technique: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ implementation: string[]; effect: string } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `horror_scoring_technique(${technique}, Implementation, Effect).`
  );

  if (!result) {
    return explainable(null, ['No horror technique found'], 50);
  }

  const implementation = Array.isArray(result['Implementation'])
    ? (result['Implementation'] as unknown[]).map(String) : [];

  return explainable(
    { implementation, effect: String(result['Effect']) },
    [`Horror technique: ${technique} → ${result['Effect']}`],
    90
  );
}

/**
 * Match a cue to a composer's style.
 * C1687: composer_style_match/3
 */
export async function matchComposerStyle(
  cueFeatures: string[],
  composer: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<number>> {
  await ensureLoaded(adapter);

  const cueList = `[${cueFeatures.join(',')}]`;
  const result = await adapter.querySingle(
    `composer_style_match(${cueList}, ${composer}, Score).`
  );

  if (!result) {
    return explainable(0, ['Could not match composer style'], 50);
  }

  return explainable(
    Number(result['Score']),
    [`Style match with ${composer}: ${result['Score']} features`],
    80
  );
}

/**
 * Predict chill-inducing probability for a musical pattern.
 * C1613: chill_inducing_pattern/2
 */
export async function predictChillResponse(
  pattern: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<number>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `chill_inducing_pattern(${pattern}, Probability).`
  );

  if (!result) {
    return explainable(0, ['Pattern not in chill database'], 50);
  }

  return explainable(
    Number(result['Probability']),
    [`Chill probability: ${(Number(result['Probability']) * 100).toFixed(0)}%`],
    75
  );
}

// ============================================================================
// WORLD MUSIC — INDIAN (C1701-C1750)
// ============================================================================

/**
 * Raga details from the Indian classical music KB.
 */
export interface RagaDetails {
  readonly aroha: string[];
  readonly avaroha: string[];
  readonly vadi: string;
  readonly samvadi: string;
  readonly rasa: string;
  readonly thaat: string;
}

/**
 * Get full details for a raga.
 * C1702, C1706, C1707: raga_database/5, raga_rasa/2, raga_family/2
 */
export async function getRagaDetails(
  ragaName: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<RagaDetails | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `raga_database(${ragaName}, Aroha, Avaroha, Vadi, Samvadi).`
  );

  if (!result) {
    return explainable(null, ['Raga not found in database'], 50);
  }

  const aroha = Array.isArray(result['Aroha'])
    ? (result['Aroha'] as unknown[]).map(String) : [];
  const avaroha = Array.isArray(result['Avaroha'])
    ? (result['Avaroha'] as unknown[]).map(String) : [];

  // Get additional data
  const rasaResult = await adapter.querySingle(`raga_rasa(${ragaName}, Rasa).`);
  const thaatResult = await adapter.querySingle(`raga_family(${ragaName}, Thaat).`);

  return explainable(
    {
      aroha,
      avaroha,
      vadi: String(result['Vadi']),
      samvadi: String(result['Samvadi']),
      rasa: rasaResult ? String(rasaResult['Rasa']) : 'unknown',
      thaat: thaatResult ? String(thaatResult['Thaat']) : 'unknown',
    },
    [`Raga ${ragaName}: vadi=${result['Vadi']}, samvadi=${result['Samvadi']}`],
    90
  );
}

/**
 * Calculate a tihai and check if it lands on sam.
 * C1720: tihai_calculation/4
 */
export async function calculateTihai(
  patternLength: number,
  gap: number,
  cycleLength: number,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ total: number; valid: boolean }>> {
  await ensureLoaded(adapter);

  // Build a dummy pattern of given length for the Prolog query
  const patternList = `[${Array(patternLength).fill('x').join(',')}]`;
  const result = await adapter.querySingle(
    `tihai_calculation(${patternList}, ${gap}, ${cycleLength}, tihai(_, _, Total, Valid)).`
  );

  if (!result) {
    return explainable(
      { total: 0, valid: false },
      ['Could not calculate tihai'],
      50
    );
  }

  const valid = String(result['Valid']) === 'true';
  return explainable(
    { total: Number(result['Total']), valid },
    [valid ? 'Tihai lands on sam!' : 'Tihai does NOT land on sam'],
    95
  );
}

// ============================================================================
// WORLD MUSIC — ARABIC/MIDDLE EASTERN (C1751-C1790)
// ============================================================================

/**
 * Maqam details.
 */
export interface MaqamDetails {
  readonly jins1: string;
  readonly jins2: string;
  readonly ghammaz: string;
  readonly family: string;
  readonly emotions: string[];
}

/**
 * Get maqam details.
 * C1752, C1755, C1784: maqam_definition/4, maqam_family/2, maqam_emotion/2
 */
export async function getMaqamDetails(
  maqamName: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<MaqamDetails | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `maqam_definition(${maqamName}, Jins1, Jins2, Ghammaz).`
  );

  if (!result) {
    return explainable(null, ['Maqam not found'], 50);
  }

  const familyResult = await adapter.querySingle(`maqam_family(${maqamName}, Family).`);
  const emotionResult = await adapter.querySingle(`maqam_emotion(${maqamName}, Emotions).`);

  const emotions = emotionResult && Array.isArray(emotionResult['Emotions'])
    ? (emotionResult['Emotions'] as unknown[]).map(String) : [];

  return explainable(
    {
      jins1: String(result['Jins1']),
      jins2: String(result['Jins2']),
      ghammaz: String(result['Ghammaz']),
      family: familyResult ? String(familyResult['Family']) : 'unknown',
      emotions,
    },
    [`Maqam ${maqamName}: ${result['Jins1']} + ${result['Jins2']}`],
    90
  );
}

/**
 * Get maqam modulation path.
 * C1754: maqam_modulation/3
 */
export async function getMaqamModulation(
  fromMaqam: string,
  toMaqam: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<string | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `maqam_modulation(${fromMaqam}, ${toMaqam}, PivotNote).`
  );

  if (!result) {
    return explainable(null, ['No modulation path found'], 50);
  }

  return explainable(
    String(result['PivotNote']),
    [`Modulate ${fromMaqam} → ${toMaqam} via pivot ${result['PivotNote']}`],
    85
  );
}

// ============================================================================
// WORLD MUSIC — AFRICAN (C1831-C1860)
// ============================================================================

/**
 * Get an African timeline/bell pattern.
 * C1832: african_rhythm_timeline/3
 */
export async function getAfricanTimeline(
  patternName: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ timeline: number[]; tradition: string } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `african_rhythm_timeline(${patternName}, Timeline, Tradition).`
  );

  if (!result) {
    return explainable(null, ['Timeline pattern not found'], 50);
  }

  const timeline = Array.isArray(result['Timeline'])
    ? (result['Timeline'] as unknown[]).map(Number) : [];

  return explainable(
    { timeline, tradition: String(result['Tradition']) },
    [`African timeline: ${patternName} (${result['Tradition']})`],
    90
  );
}

/**
 * Generate a polyrhythm from two layers.
 * C1834: polyrhythm_layer/4
 */
export async function generatePolyrhythm(
  layer1: number,
  layer2: number,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ resultant: number[] | string; relation: string } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `polyrhythm_layer(${layer1}, ${layer2}, Resultant, PhaseRelation).`
  );

  if (!result) {
    return explainable(null, ['Polyrhythm combination not found'], 50);
  }

  const resultant = Array.isArray(result['Resultant'])
    ? (result['Resultant'] as unknown[]).map(Number)
    : String(result['Resultant']);

  return explainable(
    { resultant, relation: String(result['PhaseRelation']) },
    [`${layer1}:${layer2} polyrhythm — ${result['PhaseRelation']}`],
    85
  );
}

// ============================================================================
// WORLD MUSIC — LATIN AMERICAN (C1861-C1900)
// ============================================================================

/**
 * Get a clave pattern.
 * C1862: clave_pattern/3
 */
export async function getClavePattern(
  claveName: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ pattern: number[]; style: string } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `clave_pattern(${claveName}, Pattern, Style).`
  );

  if (!result) {
    return explainable(null, ['Clave pattern not found'], 50);
  }

  const pattern = Array.isArray(result['Pattern'])
    ? (result['Pattern'] as unknown[]).map(Number) : [];

  return explainable(
    { pattern, style: String(result['Style']) },
    [`Clave: ${claveName} (${result['Style']})`],
    95
  );
}

/**
 * Get a samba rhythm pattern by instrument.
 * C1871: samba_pattern/3
 */
export async function getSambaPattern(
  instrument: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ pattern: Array<number | string>; style: string } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `samba_pattern(${instrument}, Pattern, Style).`
  );

  if (!result) {
    return explainable(null, ['Samba pattern not found'], 50);
  }

  const pattern = Array.isArray(result['Pattern'])
    ? (result['Pattern'] as unknown[]).map((v) => {
        const n = Number(v);
        return isNaN(n) ? String(v) : n;
      })
    : [];

  return explainable(
    { pattern, style: String(result['Style']) },
    [`Samba ${instrument}: ${result['Style']}`],
    90
  );
}

/**
 * Get flamenco compás pattern.
 * C1886: flamenco_compas/3
 */
export async function getFlamencoCompas(
  paloName: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ beats: number; accents: number[] } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `flamenco_compas(${paloName}, Beats, Accents).`
  );

  if (!result) {
    return explainable(null, ['Flamenco palo not found'], 50);
  }

  const accents = Array.isArray(result['Accents'])
    ? (result['Accents'] as unknown[]).map(Number) : [];

  return explainable(
    { beats: Number(result['Beats']), accents },
    [`Flamenco ${paloName}: ${result['Beats']} beats`],
    90
  );
}

// ============================================================================
// ROCK MUSIC QUERIES (C1901-C1930)
// ============================================================================

/**
 * Get rock progression by style.
 * C1903: rock_progression/3
 */
export async function getRockProgression(
  styleName: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ chords: string[]; feel: string } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `rock_progression(${styleName}, Chords, Feel).`
  );

  if (!result) {
    return explainable(null, ['Rock progression not found'], 50);
  }

  const chords = Array.isArray(result['Chords'])
    ? (result['Chords'] as unknown[]).map(String) : [];

  return explainable(
    { chords, feel: String(result['Feel']) },
    [`Rock ${styleName}: ${chords.join('-')} (${result['Feel']})`],
    90
  );
}

/**
 * Get rock drum pattern.
 * C1907: rock_drum_pattern/3
 */
export async function getRockDrumPattern(
  patternName: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ pattern: string[]; genre: string } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `rock_drum_pattern(${patternName}, Pattern, Genre).`
  );

  if (!result) {
    return explainable(null, ['Rock drum pattern not found'], 50);
  }

  const pattern = Array.isArray(result['Pattern'])
    ? (result['Pattern'] as unknown[]).map(String) : [];

  return explainable(
    { pattern, genre: String(result['Genre']) },
    [`Rock drum ${patternName}: ${result['Genre']}`],
    90
  );
}

/**
 * Get rock subgenre characteristics.
 * C1912: rock_subgenre/3
 */
export async function getRockSubgenre(
  genreName: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ era: string; characteristics: string[] } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `rock_subgenre(${genreName}, Era, Characteristics).`
  );

  if (!result) {
    return explainable(null, ['Rock subgenre not found'], 50);
  }

  const characteristics = Array.isArray(result['Characteristics'])
    ? (result['Characteristics'] as unknown[]).map(String) : [];

  return explainable(
    { era: String(result['Era']), characteristics },
    [`Rock subgenre ${genreName}: ${result['Era']}`],
    90
  );
}

/**
 * Get guitar tone chain for a style.
 * C1916: guitar_tone_chain/3
 */
export async function getGuitarToneChain(
  styleName: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ chain: string[]; sound: string } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `guitar_tone_chain(${styleName}, Chain, Sound).`
  );

  if (!result) {
    return explainable(null, ['Guitar tone chain not found'], 50);
  }

  const chain = Array.isArray(result['Chain'])
    ? (result['Chain'] as unknown[]).map(String) : [];

  return explainable(
    { chain, sound: String(result['Sound']) },
    [`Guitar tone ${styleName}: ${chain.join(' → ')}`],
    90
  );
}

/**
 * Get drop tuning info.
 * C1914: drop_tuning/3
 */
export async function getDropTuning(
  tuningName: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ strings: string[]; genre: string } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `drop_tuning(${tuningName}, Strings, Genre).`
  );

  if (!result) {
    return explainable(null, ['Drop tuning not found'], 50);
  }

  const strings = Array.isArray(result['Strings'])
    ? (result['Strings'] as unknown[]).map(String) : [];

  return explainable(
    { strings, genre: String(result['Genre']) },
    [`Tuning ${tuningName}: ${strings.join(' ')} (${result['Genre']})`],
    90
  );
}

// ============================================================================
// POP MUSIC QUERIES (C1931-C1970)
// ============================================================================

/**
 * Get pop chord progression.
 * C1931: pop_chord_progression/3
 */
export async function getPopChordProgression(
  progressionName: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ chords: string[]; usage: string } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `pop_chord_progression(${progressionName}, Chords, Usage).`
  );

  if (!result) {
    return explainable(null, ['Pop progression not found'], 50);
  }

  const chords = Array.isArray(result['Chords'])
    ? (result['Chords'] as unknown[]).map(String) : [];

  return explainable(
    { chords, usage: String(result['Usage']) },
    [`Pop progression ${progressionName}: ${chords.join('-')}`],
    90
  );
}

/**
 * Get pop melody contour.
 * C1933: pop_melody_contour/3
 */
export async function getPopMelodyContour(
  contourName: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ shape: string; effect: string } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `pop_melody_contour(${contourName}, Shape, Effect).`
  );

  if (!result) {
    return explainable(null, ['Pop melody contour not found'], 50);
  }

  return explainable(
    { shape: String(result['Shape']), effect: String(result['Effect']) },
    [`Pop melody ${contourName}: ${result['Shape']}`],
    90
  );
}

/**
 * Get pop song form.
 * C1937: pop_song_form/3
 */
export async function getPopSongForm(
  formName: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ sections: string[]; era: string } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `pop_song_form(${formName}, Sections, Era).`
  );

  if (!result) {
    return explainable(null, ['Pop song form not found'], 50);
  }

  const sections = Array.isArray(result['Sections'])
    ? (result['Sections'] as unknown[]).map(String) : [];

  return explainable(
    { sections, era: String(result['Era']) },
    [`Pop form ${formName}: ${sections.join(' → ')}`],
    90
  );
}

/**
 * Get hook placement strategy.
 * C1934: hook_placement/3
 */
export async function getHookPlacement(
  hookType: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ location: string; technique: string } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `hook_placement(${hookType}, Location, Technique).`
  );

  if (!result) {
    return explainable(null, ['Hook placement not found'], 50);
  }

  return explainable(
    { location: String(result['Location']), technique: String(result['Technique']) },
    [`Hook ${hookType}: placed at ${result['Location']}`],
    90
  );
}

/**
 * Get earworm characteristics.
 * C1935: earworm_characteristics/2
 */
export async function getEarwormCharacteristics(
  featureName: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ description: string } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `earworm_characteristics(${featureName}, Description).`
  );

  if (!result) {
    return explainable(null, ['Earworm feature not found'], 50);
  }

  return explainable(
    { description: String(result['Description']) },
    [`Earworm feature ${featureName}: ${result['Description']}`],
    90
  );
}

// ============================================================================
// EDM QUERIES (C2002-C2041)
// ============================================================================

/**
 * Get four-on-the-floor pattern for a tempo.
 * C2002: four_on_floor/3
 */
export async function getFourOnFloor(
  tempo: number,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ subgenre: string; variations: string[] } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `four_on_floor(${tempo}, Subgenre, Variations).`
  );

  if (!result) {
    return explainable(null, ['No four-on-floor pattern at this tempo'], 50);
  }

  const variations = Array.isArray(result['Variations'])
    ? (result['Variations'] as unknown[]).map(String) : [];

  return explainable(
    { subgenre: String(result['Subgenre']), variations },
    [`Four-on-floor at ${tempo} BPM: ${result['Subgenre']}`],
    90
  );
}

/**
 * Get breakbeat pattern.
 * C2003: breakbeat_pattern/3
 */
export async function getBreakbeatPattern(
  patternName: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ pattern: string[]; genre: string } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `breakbeat_pattern(${patternName}, Pattern, Genre).`
  );

  if (!result) {
    return explainable(null, ['Breakbeat pattern not found'], 50);
  }

  const pattern = Array.isArray(result['Pattern'])
    ? (result['Pattern'] as unknown[]).map(String) : [];

  return explainable(
    { pattern, genre: String(result['Genre']) },
    [`Breakbeat ${patternName}: ${result['Genre']}`],
    90
  );
}

/**
 * Get drop type characteristics.
 * C2005: drop_types/3
 */
export async function getDropType(
  dropType: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ characteristics: string[]; genre: string } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `drop_types(${dropType}, Characteristics, Genre).`
  );

  if (!result) {
    return explainable(null, ['Drop type not found'], 50);
  }

  const characteristics = Array.isArray(result['Characteristics'])
    ? (result['Characteristics'] as unknown[]).map(String) : [];

  return explainable(
    { characteristics, genre: String(result['Genre']) },
    [`Drop ${dropType}: ${characteristics.join(', ')} (${result['Genre']})`],
    90
  );
}

/**
 * Get synth bass type.
 * C2009: synth_bass_type/3
 */
export async function getSynthBassType(
  bassType: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ synthesis: string[]; genre: string } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `synth_bass_type(${bassType}, Synthesis, Genre).`
  );

  if (!result) {
    return explainable(null, ['Synth bass type not found'], 50);
  }

  const synthesis = Array.isArray(result['Synthesis'])
    ? (result['Synthesis'] as unknown[]).map(String) : [];

  return explainable(
    { synthesis, genre: String(result['Genre']) },
    [`Synth bass ${bassType}: ${synthesis.join(', ')}`],
    90
  );
}

/**
 * Get EDM subgenre info.
 * C2015: edm_subgenre/3
 */
export async function getEdmSubgenre(
  genreName: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ bpmRange: { min: number; max: number }; characteristics: string[] } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `edm_subgenre(${genreName}, BPM, Characteristics).`
  );

  if (!result) {
    return explainable(null, ['EDM subgenre not found'], 50);
  }

  const characteristics = Array.isArray(result['Characteristics'])
    ? (result['Characteristics'] as unknown[]).map(String) : [];

  // BPM comes as range(min, max) compound term
  const bpmStr = String(result['BPM']);
  const rangeMatch = bpmStr.match(/range\((\d+),\s*(\d+)\)/);
  const bpmRange = rangeMatch
    ? { min: Number(rangeMatch[1]), max: Number(rangeMatch[2]) }
    : { min: 0, max: 0 };

  return explainable(
    { bpmRange, characteristics },
    [`EDM ${genreName}: ${bpmRange.min}-${bpmRange.max} BPM`],
    90
  );
}

/**
 * Get house music substyle.
 * C2016: house_style/3
 */
export async function getHouseStyle(
  substyle: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ features: string[]; artists: string[] } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `house_style(${substyle}, Features, Artists).`
  );

  if (!result) {
    return explainable(null, ['House substyle not found'], 50);
  }

  const features = Array.isArray(result['Features'])
    ? (result['Features'] as unknown[]).map(String) : [];
  const artists = Array.isArray(result['Artists'])
    ? (result['Artists'] as unknown[]).map(String) : [];

  return explainable(
    { features, artists },
    [`House ${substyle}: ${features.join(', ')}`],
    90
  );
}

/**
 * Get buildup technique info.
 * C2006: buildup_techniques/3
 */
export async function getBuildupTechnique(
  technique: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ duration: string; intensity: string } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `buildup_techniques(${technique}, Duration, Intensity).`
  );

  if (!result) {
    return explainable(null, ['Buildup technique not found'], 50);
  }

  return explainable(
    { duration: String(result['Duration']), intensity: String(result['Intensity']) },
    [`Buildup ${technique}: ${result['Duration']} (${result['Intensity']})`],
    90
  );
}

/**
 * Get sidechain compression settings.
 * C2008: sidechain_compression/3
 */
export async function getSidechainCompression(
  source: string,
  target: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ settings: string[] } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `sidechain_compression(${source}, ${target}, Settings).`
  );

  if (!result) {
    return explainable(null, ['Sidechain settings not found'], 50);
  }

  const settings = Array.isArray(result['Settings'])
    ? (result['Settings'] as unknown[]).map(String) : [];

  return explainable(
    { settings },
    [`Sidechain ${source}→${target}: ${settings.join(', ')}`],
    90
  );
}

// ============================================================================
// CROSS-CULTURAL FUSION QUERIES (C2051-C2100)
// ============================================================================

/** Fusion analysis result. */
export interface FusionAnalysis {
  sources: string[];
  balance: string;
  elements: string[];
}

/**
 * Check scale compatibility between two cultures.
 * C2052: scale_compatibility/5
 */
export async function getScaleCompatibility(
  scale1: string,
  culture1: string,
  scale2: string,
  culture2: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ compatibility: string } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `scale_compatibility(${scale1}, ${culture1}, ${scale2}, ${culture2}, Compatibility).`
  );

  if (!result) {
    return explainable(null, ['Scale compatibility not found'], 50);
  }

  return explainable(
    { compatibility: String(result['Compatibility']) },
    [`${scale1} (${culture1}) + ${scale2} (${culture2}): ${result['Compatibility']}`],
    90
  );
}

/**
 * Get rhythm fusion rule.
 * C2053: rhythm_fusion_rule/4
 */
export async function getRhythmFusionRule(
  rhythm1: string,
  rhythm2: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ fusionType: string; result: string } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `rhythm_fusion_rule(${rhythm1}, ${rhythm2}, FusionType, Result).`
  );

  if (!result) {
    return explainable(null, ['Rhythm fusion rule not found'], 50);
  }

  return explainable(
    { fusionType: String(result['FusionType']), result: String(result['Result']) },
    [`${rhythm1} + ${rhythm2}: ${result['FusionType']} → ${result['Result']}`],
    90
  );
}

/**
 * Get cultural element weight/authenticity.
 * C2054: cultural_element_weight/3
 */
export async function getCulturalElementWeight(
  element: string,
  culture: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ authenticity: string } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `cultural_element_weight(${element}, ${culture}, Authenticity).`
  );

  if (!result) {
    return explainable(null, ['Cultural element weight not found'], 50);
  }

  return explainable(
    { authenticity: String(result['Authenticity']) },
    [`${element} in ${culture}: ${result['Authenticity']} importance`],
    90
  );
}

/**
 * Get fusion genre definition.
 * C2056: fusion_genre/4
 */
export async function getFusionGenre(
  genreName: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ culture1: string; culture2: string; characteristics: string[] } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `fusion_genre(${genreName}, Culture1, Culture2, Characteristics).`
  );

  if (!result) {
    return explainable(null, ['Fusion genre not found'], 50);
  }

  const characteristics = Array.isArray(result['Characteristics'])
    ? (result['Characteristics'] as unknown[]).map(String) : [];

  return explainable(
    {
      culture1: String(result['Culture1']),
      culture2: String(result['Culture2']),
      characteristics,
    },
    [`Fusion ${genreName}: ${result['Culture1']} + ${result['Culture2']}`],
    90
  );
}

/**
 * Suggest fusion approach between two cultures.
 * C2071: Uses fusion_genre/4 and rhythm_fusion_rule/4
 */
export async function suggestFusionApproach(
  culture1: string,
  culture2: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ genre: string; characteristics: string[] } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `fusion_genre(Genre, ${culture1}, ${culture2}, Characteristics).`
  );

  if (!result) {
    // Try reverse order
    const reversed = await adapter.querySingle(
      `fusion_genre(Genre, ${culture2}, ${culture1}, Characteristics).`
    );
    if (!reversed) {
      return explainable(null, ['No known fusion genre for these cultures'], 50);
    }
    const chars = Array.isArray(reversed['Characteristics'])
      ? (reversed['Characteristics'] as unknown[]).map(String) : [];
    return explainable(
      { genre: String(reversed['Genre']), characteristics: chars },
      [`Suggested fusion: ${reversed['Genre']}`],
      80
    );
  }

  const characteristics = Array.isArray(result['Characteristics'])
    ? (result['Characteristics'] as unknown[]).map(String) : [];

  return explainable(
    { genre: String(result['Genre']), characteristics },
    [`Suggested fusion: ${result['Genre']}`],
    80
  );
}

/**
 * Analyze cultural elements — get timbre, melodic, and harmonic markers.
 * C2070: Uses timbre_cultural_marker/3, melodic_cultural_marker/3, harmonic_cultural_marker/3
 */
export async function analyzeCulturalElements(
  culture: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ timbres: string[]; melodies: string[]; harmonies: string[] }>> {
  await ensureLoaded(adapter);

  const timbres: string[] = [];
  const melodies: string[] = [];
  const harmonies: string[] = [];

  const timbreResults = await adapter.queryAll(
    `timbre_cultural_marker(Timbre, ${culture}, _).`
  );
  for (const r of timbreResults) {
    timbres.push(String(r['Timbre']));
  }

  const melodicResults = await adapter.queryAll(
    `melodic_cultural_marker(Feature, ${culture}, _).`
  );
  for (const r of melodicResults) {
    melodies.push(String(r['Feature']));
  }

  const harmonicResults = await adapter.queryAll(
    `harmonic_cultural_marker(Feature, ${culture}, _).`
  );
  for (const r of harmonicResults) {
    harmonies.push(String(r['Feature']));
  }

  return explainable(
    { timbres, melodies, harmonies },
    [`Cultural markers for ${culture}: ${timbres.length + melodies.length + harmonies.length} elements`],
    85
  );
}

/**
 * Translate a musical concept between cultures.
 * C2085: Uses all_cultures_scale_mapping/2, cross_cultural_cadence/3
 */
export async function translateMusicalConcept(
  concept: string,
  fromCulture: string,
  toCulture: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ translation: string } | null>> {
  await ensureLoaded(adapter);

  // Try scale mapping
  const scaleResult = await adapter.querySingle(
    `all_cultures_scale_mapping(${concept}, Mappings).`
  );

  if (scaleResult) {
    return explainable(
      { translation: String(scaleResult['Mappings']) },
      [`${concept}: mapped from ${fromCulture} to ${toCulture}`],
      80
    );
  }

  // Try form mapping
  const formResult = await adapter.querySingle(
    `form_cross_cultural(${concept}, WesternVersion, Others).`
  );

  if (formResult) {
    return explainable(
      { translation: String(formResult['Others']) },
      [`Form concept ${concept}: ${fromCulture} → ${toCulture} equivalents found`],
      80
    );
  }

  return explainable(null, [`No cross-cultural mapping found for ${concept} (${fromCulture} → ${toCulture})`], 40);
}

/**
 * Get microtonality fusion compromise.
 * C2061: microtonality_in_fusion/3
 */
export async function getMicronalityFusion(
  source: string,
  approximation: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ compromise: string } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `microtonality_in_fusion(${source}, ${approximation}, Compromise).`
  );

  if (!result) {
    return explainable(null, ['Microtonality compromise not found'], 50);
  }

  return explainable(
    { compromise: String(result['Compromise']) },
    [`${source} via ${approximation}: ${result['Compromise']}`],
    85
  );
}

/**
 * Get instrumentation fusion blend info.
 * C2063: instrumentation_fusion/3
 */
export async function getInstrumentationFusion(
  traditionalInstr: string,
  westernInstr: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ blend: string } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `instrumentation_fusion(${traditionalInstr}, ${westernInstr}, Blend).`
  );

  if (!result) {
    return explainable(null, ['Instrumentation fusion not found'], 50);
  }

  return explainable(
    { blend: String(result['Blend']) },
    [`${traditionalInstr} + ${westernInstr}: ${result['Blend']}`],
    90
  );
}

/**
 * Get cross-cultural emotion realization.
 * C2081: emotion_cross_cultural/3
 */
export async function getEmotionCrossCultural(
  emotion: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ westernRealization: string; otherRealizations: string[] } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `emotion_cross_cultural(${emotion}, WesternRealization, OtherRealizations).`
  );

  if (!result) {
    return explainable(null, ['Cross-cultural emotion mapping not found'], 50);
  }

  const others = Array.isArray(result['OtherRealizations'])
    ? (result['OtherRealizations'] as unknown[]).map(String) : [];

  return explainable(
    { westernRealization: String(result['WesternRealization']), otherRealizations: others },
    [`Emotion ${emotion}: ${others.length + 1} cultural realizations`],
    85
  );
}

// ============================================================================
// LCC & JAZZ VOICING QUERIES (C1132-C1305)
// ============================================================================

/**
 * Get LCC chord-scale recommendation.
 * C1137: lcc_chord_scale/3
 */
export async function getLccChordScale(
  chordType: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ scale: string; gravityFit: string }[]>> {
  await ensureLoaded(adapter);

  const results = await adapter.queryAll(
    `lcc_chord_scale(${chordType}, ScaleChoice, GravityFit).`
  );

  const scales = results.map((r) => ({
    scale: String(r['ScaleChoice']),
    gravityFit: String(r['GravityFit']),
  }));

  return explainable(
    scales,
    [`LCC scales for ${chordType}: ${scales.map((s) => s.scale).join(', ')}`],
    90
  );
}

/**
 * Get LCC avoid notes for a chord-scale combination.
 * C1139: lcc_avoid_note/3
 */
export async function getLccAvoidNotes(
  chord: string,
  scale: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<string[]>> {
  await ensureLoaded(adapter);

  const results = await adapter.queryAll(
    `lcc_avoid_note(${chord}, ${scale}, AvoidNote).`
  );

  const avoidNotes = results.map((r) => String(r['AvoidNote']));

  return explainable(
    avoidNotes,
    [`Avoid notes for ${chord}/${scale}: ${avoidNotes.join(', ')}`],
    90
  );
}

/**
 * Get upper structure triads over a chord.
 * C1143: upper_structure_triad/4
 */
export async function getUpperStructureTriads(
  baseChord: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ root: string; quality: string; tensions: string[] }[]>> {
  await ensureLoaded(adapter);

  const results = await adapter.queryAll(
    `upper_structure_triad(${baseChord}, TriadRoot, TriadQuality, Tensions).`
  );

  const triads = results.map((r) => ({
    root: String(r['TriadRoot']),
    quality: String(r['TriadQuality']),
    tensions: Array.isArray(r['Tensions'])
      ? (r['Tensions'] as unknown[]).map(String)
      : [],
  }));

  return explainable(
    triads,
    [`Upper structures for ${baseChord}: ${triads.length} options`],
    90
  );
}

/**
 * Get LCC ii-V-I scale choices for a key.
 * C1155: lcc_ii_v_i/4
 */
export async function getLccIIVI(
  key: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ ii: string; v: string; i: string } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `lcc_ii_v_i(${key}, II, V, I).`
  );

  if (!result) {
    return explainable(null, ['LCC ii-V-I not found for this key'], 50);
  }

  return explainable(
    { ii: String(result['II']), v: String(result['V']), i: String(result['I']) },
    [`LCC ii-V-I in ${key}: ${result['II']} → ${result['V']} → ${result['I']}`],
    95
  );
}

/**
 * Get Coltrane changes for a progression.
 * C1327: coltrane_changes/4
 */
export async function getColtraneChanges(
  originalProgression: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ coltraneVersion: string[]; cycleType: string; reasons: string[] } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `coltrane_changes(${originalProgression}, ColtraneVersion, CycleType, Reasons).`
  );

  if (!result) {
    return explainable(null, ['Coltrane changes not available for this progression'], 50);
  }

  const coltraneVersion = Array.isArray(result['ColtraneVersion'])
    ? (result['ColtraneVersion'] as unknown[]).map(String) : [];
  const reasons = Array.isArray(result['Reasons'])
    ? (result['Reasons'] as unknown[]).map(String) : [];

  return explainable(
    { coltraneVersion, cycleType: String(result['CycleType']), reasons },
    [`Coltrane changes: ${result['CycleType']}`],
    90
  );
}

/**
 * Get LCC tritone substitution analysis.
 * C1153: lcc_tritone_sub/3
 */
export async function getLccTritoneSub(
  dominant: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ sub: string; gravityPath: string[] } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `lcc_tritone_sub(${dominant}, Sub, GravityPath).`
  );

  if (!result) {
    return explainable(null, ['Tritone sub not found'], 50);
  }

  const gravityPath = Array.isArray(result['GravityPath'])
    ? (result['GravityPath'] as unknown[]).map(String) : [];

  return explainable(
    { sub: String(result['Sub']), gravityPath },
    [`Tritone sub: ${dominant} → ${result['Sub']}`],
    90
  );
}

/**
 * Get Evans voicing for a chord.
 * C1219: evans_voicing/4
 */
export async function getEvansVoicing(
  chord: string,
  voicingType: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ notes: string[]; reasons: string[] } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `evans_voicing(${chord}, ${voicingType}, Notes, Reasons).`
  );

  if (!result) {
    return explainable(null, ['Evans voicing not found'], 50);
  }

  const notes = Array.isArray(result['Notes'])
    ? (result['Notes'] as unknown[]).map(String) : [];
  const reasons = Array.isArray(result['Reasons'])
    ? (result['Reasons'] as unknown[]).map(String) : [];

  return explainable(
    { notes, reasons },
    [`Evans ${voicingType} for ${chord}: ${notes.join(', ')}`],
    90
  );
}

/**
 * Get walking bass line for a progression.
 * C1291: walking_bass/4
 */
export async function getWalkingBass(
  progression: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ line: string; style: string; reasons: string[] } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `walking_bass(${progression}, WalkingLine, Style, Reasons).`
  );

  if (!result) {
    return explainable(null, ['Walking bass pattern not found'], 50);
  }

  const reasons = Array.isArray(result['Reasons'])
    ? (result['Reasons'] as unknown[]).map(String) : [];

  return explainable(
    { line: String(result['WalkingLine']), style: String(result['Style']), reasons },
    [`Walking bass: ${result['WalkingLine']} (${result['Style']})`],
    90
  );
}

/**
 * Get jazz drum pattern.
 * C1293: jazz_drum_pattern/4
 */
export async function getJazzDrumPattern(
  style: string,
  tempo: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ pattern: string; variations: string[] } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `jazz_drum_pattern(${style}, ${tempo}, Pattern, Variations).`
  );

  if (!result) {
    return explainable(null, ['Jazz drum pattern not found'], 50);
  }

  const variations = Array.isArray(result['Variations'])
    ? (result['Variations'] as unknown[]).map(String) : [];

  return explainable(
    { pattern: String(result['Pattern']), variations },
    [`Jazz drums ${style}/${tempo}: ${result['Pattern']}`],
    90
  );
}

/**
 * Get jazz combo instrumentation.
 * C1283: jazz_combo/2
 */
export async function getJazzCombo(
  size: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ instruments: string[] } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `jazz_combo(${size}, Instruments).`
  );

  if (!result) {
    return explainable(null, ['Jazz combo size not found'], 50);
  }

  const instruments = Array.isArray(result['Instruments'])
    ? (result['Instruments'] as unknown[]).map(String) : [];

  return explainable(
    { instruments },
    [`Jazz ${size}: ${instruments.join(', ')}`],
    90
  );
}

/**
 * Get shruti offset for a raga/swara combination.
 * C627: shruti_offset/3
 */
export async function getShrutiOffset(
  raga: string,
  swara: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ cents: number } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `shruti_offset(${raga}, ${swara}, Cents).`
  );

  if (!result) {
    return explainable(null, ['Shruti offset not found'], 50);
  }

  return explainable(
    { cents: Number(result['Cents']) },
    [`Shruti offset for ${raga}/${swara}: ${result['Cents']} cents`],
    90
  );
}

/**
 * Convert gamaka ornament to MIDI bend events.
 * C637: gamaka_to_midi/3
 */
export async function getGamakaToMidi(
  gamakaType: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ bendEvents: string[] } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `gamaka_to_midi(${gamakaType}, _, BendEvents).`
  );

  if (!result) {
    return explainable(null, ['Gamaka MIDI conversion not found'], 50);
  }

  const bendEvents = Array.isArray(result['BendEvents'])
    ? (result['BendEvents'] as unknown[]).map(String) : [];

  return explainable(
    { bendEvents },
    [`Gamaka ${gamakaType}: ${bendEvents.length} MIDI events`],
    85
  );
}

// ============================================================================
// EAST ASIAN MUSIC QUERIES (C1792-C1826)
// ============================================================================

/**
 * Get Chinese pentatonic mode.
 * C1792: chinese_mode/3
 */
export async function getChineseMode(
  modeName: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ gong: string; pitchSet: string[] } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `chinese_mode(${modeName}, Gong, PitchSet).`
  );

  if (!result) {
    return explainable(null, ['Chinese mode not found'], 50);
  }

  const pitchSet = Array.isArray(result['PitchSet'])
    ? (result['PitchSet'] as unknown[]).map(String) : [];

  return explainable(
    { gong: String(result['Gong']), pitchSet },
    [`Chinese mode ${modeName}: gong on ${result['Gong']}`],
    90
  );
}

/**
 * Get Japanese scale.
 * C1801: japanese_scale/3
 */
export async function getJapaneseScale(
  scaleName: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ intervals: number[]; context: string } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `japanese_scale(${scaleName}, Intervals, Context).`
  );

  if (!result) {
    return explainable(null, ['Japanese scale not found'], 50);
  }

  const intervals = Array.isArray(result['Intervals'])
    ? (result['Intervals'] as unknown[]).map(Number) : [];

  return explainable(
    { intervals, context: String(result['Context']) },
    [`Japanese scale ${scaleName}: ${intervals.join(', ')} (${result['Context']})`],
    90
  );
}

/**
 * Get Korean jangdan pattern.
 * C1808: jangdan_pattern/3
 */
export async function getJangdanPattern(
  jangdanName: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ pattern: string[]; instrument: string } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `jangdan_pattern(${jangdanName}, Pattern, Instrument).`
  );

  if (!result) {
    return explainable(null, ['Jangdan pattern not found'], 50);
  }

  const pattern = Array.isArray(result['Pattern'])
    ? (result['Pattern'] as unknown[]).map(String) : [];

  return explainable(
    { pattern, instrument: String(result['Instrument']) },
    [`Jangdan ${jangdanName}: ${pattern.length} beats`],
    90
  );
}

/**
 * Get East Asian form structure.
 * C1813: east_asian_form/3
 */
export async function getEastAsianForm(
  formName: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ sections: string[]; development: string } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `east_asian_form(${formName}, Sections, Development).`
  );

  if (!result) {
    return explainable(null, ['East Asian form not found'], 50);
  }

  const sections = Array.isArray(result['Sections'])
    ? (result['Sections'] as unknown[]).map(String) : [];

  return explainable(
    { sections, development: String(result['Development']) },
    [`Form ${formName}: ${sections.length} sections (${result['Development']})`],
    90
  );
}

/**
 * Get reggaeton/dembow pattern.
 * C1878: reggaeton_pattern/3
 */
export async function getReggaetonPattern(
  element: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ pattern: string[]; variation: string } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `reggaeton_pattern(${element}, Pattern, Variation).`
  );

  if (!result) {
    return explainable(null, ['Reggaeton pattern not found'], 50);
  }

  const pattern = Array.isArray(result['Pattern'])
    ? (result['Pattern'] as unknown[]).map(String) : [];

  return explainable(
    { pattern, variation: String(result['Variation']) },
    [`Reggaeton ${element}: ${result['Variation']}`],
    90
  );
}

/**
 * Get horror scoring cluster technique.
 * C1622: horror_cluster/3
 */
export async function getHorrorCluster(
  clusterType: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ instruments: string; voicing: string[] } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `horror_cluster(${clusterType}, Instruments, Voicing).`
  );

  if (!result) {
    return explainable(null, ['Horror cluster not found'], 50);
  }

  const voicing = Array.isArray(result['Voicing'])
    ? (result['Voicing'] as unknown[]).map(String) : [];

  return explainable(
    { instruments: String(result['Instruments']), voicing },
    [`Horror cluster ${clusterType}: ${result['Instruments']}`],
    90
  );
}

/**
 * Get emotional contrast transition.
 * C1597: emotional_contrast/4
 */
export async function getEmotionalContrast(
  emotion1: string,
  emotion2: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ transitionType: string; music: string[] } | null>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `emotional_contrast(${emotion1}, ${emotion2}, TransitionType, Music).`
  );

  if (!result) {
    return explainable(null, ['Emotional contrast not found'], 50);
  }

  const music = Array.isArray(result['Music'])
    ? (result['Music'] as unknown[]).map(String) : [];

  return explainable(
    { transitionType: String(result['TransitionType']), music },
    [`${emotion1} → ${emotion2}: ${result['TransitionType']} transition`],
    90
  );
}

// ============================================================================
// DECK RECOMMENDATION FOR SPEC (C107, C110)
// ============================================================================

/**
 * A ranked deck template recommendation.
 */
export interface DeckRecommendation {
  readonly templateId: string;
  readonly score: number;
}

/**
 * C110: Recommend deck templates for a MusicSpec on a given board type.
 * Uses Prolog `recommend_deck_for_spec_on_board/4` (C107) to score templates
 * by culture, style, and board-type affinity.
 *
 * @param spec - The MusicSpec to recommend for
 * @param boardType - The board type to filter/boost recommendations
 * @param adapter - Optional Prolog adapter
 * @param options - Stateless query options (C068)
 * @returns Ranked list of deck template IDs with scores
 */
export async function recommendDeckForSpec(
  spec: MusicSpec,
  boardType: 'arranger' | 'tracker' | 'notation' | 'phrase' | 'harmony',
  adapter: PrologAdapter = getPrologAdapter(),
  options: StatelessQueryOptions = {}
): Promise<Explainable<DeckRecommendation[]>> {
  await ensureLoaded(adapter);

  return withSpecContext(spec, adapter, async () => {
    const solutions = await adapter.queryAll(
      `current_spec(Spec), recommend_deck_for_spec_on_board(Spec, ${boardType}, TemplateId, Score).`
    );

    const recommendations: DeckRecommendation[] = solutions
      .filter(s => s?.['TemplateId'] && s?.['Score'] != null)
      .map(s => ({
        templateId: String(s['TemplateId']),
        score: s['Score'] as number,
      }))
      .sort((a, b) => b.score - a.score);

    // Deduplicate by templateId (keep highest score)
    const seen = new Set<string>();
    const unique = recommendations.filter(r => {
      if (seen.has(r.templateId)) return false;
      seen.add(r.templateId);
      return true;
    });

    const reasons = unique.length > 0
      ? [`Found ${unique.length} deck template recommendations for ${boardType} board`]
      : ['No deck template recommendations found'];

    const confidence = unique.length > 0 ? Math.min(100, unique[0]?.score ?? 0) : 0;

    return explainable(unique, reasons, confidence);
  }, options);
}

// ============================================================================
// BOARD RECOMMENDATION FOR SPEC (C108, C110)
// ============================================================================

/**
 * A ranked board type recommendation.
 */
export interface BoardRecommendation {
  readonly boardType: 'arranger' | 'tracker' | 'notation' | 'phrase' | 'harmony';
  readonly reasons: readonly string[];
}

/**
 * C110: Recommend board types for a MusicSpec.
 * Uses Prolog `recommend_board_for_spec/3` (C108) to suggest board types
 * based on style and culture affinities.
 *
 * @param spec - The MusicSpec to recommend for
 * @param adapter - Optional Prolog adapter
 * @param options - Stateless query options (C068)
 * @returns Ranked list of board types with reasons
 */
export async function recommendBoardForSpec(
  spec: MusicSpec,
  adapter: PrologAdapter = getPrologAdapter(),
  options: StatelessQueryOptions = {}
): Promise<Explainable<BoardRecommendation[]>> {
  await ensureLoaded(adapter);

  return withSpecContext(spec, adapter, async () => {
    const solutions = await adapter.queryAll(
      'current_spec(Spec), recommend_board_for_spec(Spec, BoardType, Reasons).'
    );

    const validBoardTypes = new Set(['arranger', 'tracker', 'notation', 'phrase', 'harmony']);

    const recommendations: BoardRecommendation[] = solutions
      .filter(s => s?.['BoardType'] && validBoardTypes.has(String(s['BoardType'])))
      .map(s => {
        const rawReasons = s['Reasons'];
        const reasons: string[] = [];
        if (Array.isArray(rawReasons)) {
          for (const r of rawReasons) {
            if (typeof r === 'string') {
              reasons.push(r);
            } else if (typeof r === 'object' && r !== null) {
              // Handle because(Reason) terms
              const term = r as Record<string, unknown>;
              if (term['because']) {
                reasons.push(String(term['because']));
              } else if (term[0]) {
                reasons.push(String(term[0]));
              }
            }
          }
        }

        return {
          boardType: String(s['BoardType']) as BoardRecommendation['boardType'],
          reasons,
        };
      });

    // Deduplicate by boardType (keep first occurrence, which is highest priority)
    const seen = new Set<string>();
    const unique = recommendations.filter(r => {
      if (seen.has(r.boardType)) return false;
      seen.add(r.boardType);
      return true;
    });

    const outerReasons = unique.length > 0
      ? [`Found ${unique.length} board type recommendations for spec (style: ${spec.style ?? 'custom'}, culture: ${spec.culture ?? 'western'})`]
      : ['No board type recommendations found; defaulting to arranger'];

    const confidence = unique.length > 0 ? 80 : 50;

    return explainable(unique, outerReasons, confidence);
  }, options);
}

// ============================================================================
// MOTIF/LEITMOTIF FUNCTIONS (C224, C226, C227)
// ============================================================================

/**
 * Motif fingerprint containing interval and rhythm patterns.
 */
export interface MotifFingerprint {
  /** Unique identifier for this motif */
  readonly id: string;
  /** Interval sequence (semitones between consecutive notes) */
  readonly intervals: readonly number[];
  /** Rhythm ratios (relative durations, normalized) */
  readonly rhythmRatios: readonly number[];
  /** Human-readable label */
  readonly label?: string;
}

/**
 * Result of motif similarity comparison.
 */
export interface MotifSimilarityResult {
  /** Overall similarity score (0-100) */
  readonly score: number;
  /** Interval similarity component (0-100) */
  readonly intervalScore: number;
  /** Rhythm similarity component (0-100) */
  readonly rhythmScore: number;
  /** Interval n-gram matches */
  readonly ngramMatches: readonly NgramMatch[];
}

/**
 * N-gram match details.
 */
export interface NgramMatch {
  readonly ngram: readonly number[];
  readonly position1: number;
  readonly position2: number;
}

/**
 * Motif occurrence in a sequence.
 */
export interface MotifOccurrence {
  /** The motif that was found */
  readonly motifId: string;
  /** The motif's label */
  readonly label: string;
  /** Start position in the event sequence (index) */
  readonly startIndex: number;
  /** End position in the event sequence (index) */
  readonly endIndex: number;
  /** Similarity score (0-100) */
  readonly score: number;
  /** Transformation applied (if any) */
  readonly transform?: 'original' | 'inversion' | 'retrograde' | 'augmentation' | 'diminution';
}

/**
 * Options for motif search.
 */
export interface MotifSearchOptions {
  /** Minimum similarity score to report (default: 70) */
  readonly minScore?: number;
  /** Check for transformed versions of motifs */
  readonly includeTransforms?: boolean;
  /** Maximum occurrences to return per motif */
  readonly maxOccurrences?: number;
  /** Stateless query options */
  readonly queryOptions?: StatelessQueryOptions;
}

/**
 * C224: Calculate theme similarity metric for two motifs.
 * Uses interval n-grams and rhythm similarity.
 * 
 * @param fingerprint1 - First motif fingerprint
 * @param fingerprint2 - Second motif fingerprint
 * @returns Similarity result with score breakdown
 */
export function calculateThemeSimilarity(
  fingerprint1: MotifFingerprint,
  fingerprint2: MotifFingerprint
): MotifSimilarityResult {
  const intervalScore = calculateIntervalSimilarity(
    fingerprint1.intervals,
    fingerprint2.intervals
  );
  
  const rhythmScore = calculateRhythmSimilarity(
    fingerprint1.rhythmRatios,
    fingerprint2.rhythmRatios
  );
  
  const ngramMatches = findNgramMatches(
    fingerprint1.intervals,
    fingerprint2.intervals,
    3 // Trigram matching
  );
  
  // Weighted combination: intervals 60%, rhythm 40%
  const score = Math.round(intervalScore * 0.6 + rhythmScore * 0.4);
  
  return {
    score,
    intervalScore,
    rhythmScore,
    ngramMatches,
  };
}

/**
 * Calculate interval sequence similarity using longest common subsequence.
 */
function calculateIntervalSimilarity(
  intervals1: readonly number[],
  intervals2: readonly number[]
): number {
  if (intervals1.length === 0 && intervals2.length === 0) return 100;
  if (intervals1.length === 0 || intervals2.length === 0) return 0;
  
  // LCS-based similarity
  const lcsLength = longestCommonSubsequence(intervals1, intervals2);
  const maxLen = Math.max(intervals1.length, intervals2.length);
  
  return Math.round((lcsLength / maxLen) * 100);
}

/**
 * Calculate longest common subsequence length.
 */
function longestCommonSubsequence(
  seq1: readonly number[],
  seq2: readonly number[]
): number {
  const m = seq1.length;
  const n = seq2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (seq1[i - 1] === seq2[j - 1]) {
        const prev = dp[i - 1]?.[j - 1];
        dp[i]![j] = (prev ?? 0) + 1;
      } else {
        const up = dp[i - 1]?.[j] ?? 0;
        const left = dp[i]?.[j - 1] ?? 0;
        dp[i]![j] = Math.max(up, left);
      }
    }
  }
  
  return dp[m]?.[n] ?? 0;
}

/**
 * Calculate rhythm similarity using normalized duration ratios.
 */
function calculateRhythmSimilarity(
  ratios1: readonly number[],
  ratios2: readonly number[]
): number {
  if (ratios1.length === 0 && ratios2.length === 0) return 100;
  if (ratios1.length === 0 || ratios2.length === 0) return 0;
  
  // Normalize both ratio sequences
  const norm1 = normalizeRatios(ratios1);
  const norm2 = normalizeRatios(ratios2);
  
  // Compare using cosine-like similarity for overlapping portion
  const minLen = Math.min(norm1.length, norm2.length);
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  
  for (let i = 0; i < minLen; i++) {
    const v1 = norm1[i];
    const v2 = norm2[i];
    if (v1 !== undefined && v2 !== undefined) {
      dotProduct += v1 * v2;
      mag1 += v1 * v1;
      mag2 += v2 * v2;
    }
  }
  
  // Add remaining elements to magnitudes
  for (let i = minLen; i < norm1.length; i++) {
    const v1 = norm1[i];
    if (v1 !== undefined) {
      mag1 += v1 * v1;
    }
  }
  for (let i = minLen; i < norm2.length; i++) {
    const v2 = norm2[i];
    if (v2 !== undefined) {
      mag2 += v2 * v2;
    }
  }
  
  const denom = Math.sqrt(mag1) * Math.sqrt(mag2);
  if (denom === 0) return 100;
  
  const similarity = dotProduct / denom;
  return Math.round(similarity * 100);
}

/**
 * Normalize ratio sequence to sum to 1.
 */
function normalizeRatios(ratios: readonly number[]): number[] {
  const sum = ratios.reduce((a, b) => a + b, 0);
  if (sum === 0) return ratios.map(() => 1 / ratios.length);
  return ratios.map(r => r / sum);
}

/**
 * Find n-gram matches between two interval sequences.
 */
function findNgramMatches(
  intervals1: readonly number[],
  intervals2: readonly number[],
  n: number
): NgramMatch[] {
  const matches: NgramMatch[] = [];
  
  if (intervals1.length < n || intervals2.length < n) return matches;
  
  // Build n-grams from first sequence
  const ngrams1: Map<string, number[]> = new Map();
  for (let i = 0; i <= intervals1.length - n; i++) {
    const ngram = intervals1.slice(i, i + n);
    const key = ngram.join(',');
    if (!ngrams1.has(key)) ngrams1.set(key, []);
    ngrams1.get(key)!.push(i);
  }
  
  // Find matches in second sequence
  for (let j = 0; j <= intervals2.length - n; j++) {
    const ngram = intervals2.slice(j, j + n);
    const key = ngram.join(',');
    const positions1 = ngrams1.get(key);
    if (positions1) {
      for (const pos1 of positions1) {
        matches.push({
          ngram,
          position1: pos1,
          position2: j,
        });
      }
    }
  }
  
  return matches;
}

/**
 * Extract motif fingerprint from a sequence of events.
 */
export function extractMotifFingerprint(
  events: readonly { pitch: number; duration: number }[],
  id: string,
  label?: string
): MotifFingerprint {
  if (events.length === 0) {
    return {
      id,
      intervals: [],
      rhythmRatios: [],
      ...(label !== undefined && { label })
    };
  }
  
  // Extract intervals (differences between consecutive pitches)
  const intervals: number[] = [];
  for (let i = 1; i < events.length; i++) {
    const currentPitch = events[i]?.pitch;
    const prevPitch = events[i - 1]?.pitch;
    if (currentPitch !== undefined && prevPitch !== undefined) {
      intervals.push(currentPitch - prevPitch);
    }
  }
  
  // Extract rhythm ratios (relative durations)
  const totalDuration = events.reduce((sum, e) => sum + e.duration, 0);
  const rhythmRatios = totalDuration > 0
    ? events.map(e => e.duration / totalDuration)
    : events.map(() => 1 / events.length);
  
  return {
    id,
    intervals,
    rhythmRatios,
    ...(label !== undefined && { label })
  };
}

/**
 * Apply a transformation to a motif fingerprint.
 */
export function transformMotif(
  fingerprint: MotifFingerprint,
  transform: 'inversion' | 'retrograde' | 'augmentation' | 'diminution'
): MotifFingerprint {
  let newIntervals: number[];
  
  switch (transform) {
    case 'inversion':
      newIntervals = fingerprint.intervals.map(i => -i);
      break;
    case 'retrograde':
      newIntervals = [...fingerprint.intervals].reverse();
      break;
    case 'augmentation':
      newIntervals = fingerprint.intervals.map(i => i * 2);
      break;
    case 'diminution':
      newIntervals = fingerprint.intervals.map(i => Math.floor(i / 2));
      break;
    default:
      newIntervals = [...fingerprint.intervals];
  }
  
  return {
    ...fingerprint,
    id: `${fingerprint.id}_${transform}`,
    intervals: newIntervals,
    ...(fingerprint.label !== undefined && { label: `${fingerprint.label} (${transform})` }),
  };
}

/**
 * C226/C227: Find occurrences of motifs from a library in an event sequence.
 * 
 * @param events - Sequence of events to search
 * @param library - Library of motif fingerprints to match against
 * @param options - Search options
 * @returns List of motif occurrences found
 */
export async function findMotifOccurrences(
  events: readonly { pitch: number; duration: number }[],
  library: readonly MotifFingerprint[],
  options: MotifSearchOptions = {}
): Promise<Explainable<MotifOccurrence[]>> {
  const minScore = options.minScore ?? 70;
  const includeTransforms = options.includeTransforms ?? true;
  const maxOccurrences = options.maxOccurrences ?? 10;
  
  const occurrences: MotifOccurrence[] = [];
  const transforms: ('original' | 'inversion' | 'retrograde')[] = includeTransforms
    ? ['original', 'inversion', 'retrograde']
    : ['original'];
  
  // Slide a window over the events and check for motif matches
  for (const motif of library) {
    const motifLength = motif.intervals.length + 1; // +1 because intervals = n-1 for n notes
    if (motifLength < 2 || events.length < motifLength) continue;
    
    let motifOccurrenceCount = 0;
    
    for (let startIdx = 0; startIdx <= events.length - motifLength && motifOccurrenceCount < maxOccurrences; startIdx++) {
      const windowEvents = events.slice(startIdx, startIdx + motifLength);
      const windowFingerprint = extractMotifFingerprint(windowEvents, 'window');
      
      for (const transform of transforms) {
        const compareMotif = transform === 'original'
          ? motif
          : transformMotif(motif, transform);
        
        const similarity = calculateThemeSimilarity(windowFingerprint, compareMotif);
        
        if (similarity.score >= minScore) {
          occurrences.push({
            motifId: motif.id,
            label: motif.label ?? motif.id,
            startIndex: startIdx,
            endIndex: startIdx + motifLength - 1,
            score: similarity.score,
            ...(transform !== 'original' && { transform }),
          });
          motifOccurrenceCount++;
          break; // Don't double-count same position with different transforms
        }
      }
    }
  }
  
  // Sort by score descending
  occurrences.sort((a, b) => b.score - a.score);
  
  const reasons = occurrences.length > 0
    ? [`Found ${occurrences.length} motif occurrences in ${events.length} events`]
    : ['No motif matches found above threshold'];
  
  const confidence = occurrences.length > 0 ? 85 : 50;
  
  return explainable(occurrences, reasons, confidence);
}

/**
 * Store a motif in the Prolog knowledge base for persistent matching.
 */
export async function storeMotifInKB(
  fingerprint: MotifFingerprint,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<void> {
  await ensureLoaded(adapter);
  
  const intervalsStr = `[${fingerprint.intervals.join(',')}]`;
  const rhythmStr = `[${fingerprint.rhythmRatios.map(r => r.toFixed(4)).join(',')}]`;
  const label = fingerprint.label ?? fingerprint.id;
  
  await adapter.querySingle(
    `store_motif('${fingerprint.id}', ${intervalsStr}, ${rhythmStr}, '${label}').`
  );
}

/**
 * Query the Prolog KB for motif similarity.
 */
export async function queryMotifSimilarity(
  intervals1: readonly number[],
  intervals2: readonly number[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<number> {
  await ensureLoaded(adapter);
  
  const i1Str = `[${intervals1.join(',')}]`;
  const i2Str = `[${intervals2.join(',')}]`;
  
  const result = await adapter.querySingle(
    `motif_similarity(${i1Str}, ${i2Str}, Score).`
  );
  
  if (result && typeof result['Score'] === 'number') {
    return Math.round(result['Score'] * 100);
  }
  
  return 0;
}

// ============================================================================
// C210: TYPESCRIPT DFT FALLBACK COMPUTATIONS
// ============================================================================

/**
 * TypeScript fallback for DFT computations when Prolog math is unavailable.
 * Computes the kth DFT bin for a 12-element pitch-class profile.
 * 
 * @param profile - 12-element pitch-class profile
 * @param k - DFT bin number (1=fifths, 2=major thirds, 3=minor thirds)
 * @returns Complex number as [real, imaginary]
 */
export function computeDFTBinTS(profile: readonly number[], k: number): [number, number] {
  if (profile.length !== 12) {
    throw new Error('Profile must have exactly 12 elements');
  }
  
  let real = 0;
  let imag = 0;
  const factor = (2 * Math.PI * k) / 12;
  
  for (let i = 0; i < 12; i++) {
    const val = profile[i];
    if (val !== undefined) {
      real += val * Math.cos(factor * i);
      imag -= val * Math.sin(factor * i);
    }
  }
  
  return [real, imag];
}

/**
 * Compute DFT magnitude for a specific bin.
 */
export function computeDFTMagnitudeTS(profile: readonly number[], k: number): number {
  const [real, imag] = computeDFTBinTS(profile, k);
  return Math.sqrt(real * real + imag * imag);
}

/**
 * Compute DFT phase (in radians) for a specific bin.
 */
export function computeDFTPhaseTS(profile: readonly number[], k: number): number {
  const [real, imag] = computeDFTBinTS(profile, k);
  return Math.atan2(imag, real);
}

/**
 * Compute tonal centroid (6D point) using DFT bins k=1, k=2, k=3.
 * Returns [k1_real, k1_imag, k2_real, k2_imag, k3_real, k3_imag].
 */
export function computeTonalCentroidTS(profile: readonly number[]): readonly number[] {
  const [k1r, k1i] = computeDFTBinTS(profile, 1);
  const [k2r, k2i] = computeDFTBinTS(profile, 2);
  const [k3r, k3i] = computeDFTBinTS(profile, 3);
  
  return [k1r, k1i, k2r, k2i, k3r, k3i];
}

/**
 * Compute Euclidean distance between two tonal centroids.
 */
export function centroidDistanceTS(
  centroid1: readonly number[],
  centroid2: readonly number[]
): number {
  if (centroid1.length !== 6 || centroid2.length !== 6) {
    throw new Error('Centroids must have exactly 6 elements');
  }
  
  let sumSq = 0;
  for (let i = 0; i < 6; i++) {
    const c1 = centroid1[i];
    const c2 = centroid2[i];
    if (c1 !== undefined && c2 !== undefined) {
      const diff = c1 - c2;
      sumSq += diff * diff;
    }
  }
  
  return Math.sqrt(sumSq);
}

/**
 * Estimate tonic using DFT phase (k=1 bin).
 * Returns pitch-class 0-11 where 0=C.
 */
export function estimateTonicFromDFTPhaseTS(profile: readonly number[]): number {
  const phase = computeDFTPhaseTS(profile, 1);
  // Convert phase to pitch class: map [-π, π] to [0, 12)
  // Phase of 0 corresponds to C for a C major profile
  const pc = Math.round(((phase * 12) / (2 * Math.PI)) + 12) % 12;
  return pc;
}

/**
 * TypeScript fallback for spiral array pitch embedding.
 * Uses the Chew Spiral Array parameterization.
 */
export function spiralPitchEmbeddingTS(pitchClass: number): readonly [number, number, number] {
  const r = 1.0;  // Radius
  const h = 0.4;  // Height per semitone
  const fifthsAngle = (7 * Math.PI) / 6;  // Angle increment per semitone
  
  const angle = fifthsAngle * pitchClass;
  const x = r * Math.cos(angle);
  const y = r * Math.sin(angle);
  const z = h * pitchClass;
  
  return [x, y, z];
}

/**
 * Compute spiral array chord centroid.
 */
export function spiralChordCentroidTS(pitchClasses: readonly number[]): readonly [number, number, number] {
  if (pitchClasses.length === 0) {
    return [0, 0, 0];
  }
  
  let sumX = 0, sumY = 0, sumZ = 0;
  
  for (const pc of pitchClasses) {
    const [x, y, z] = spiralPitchEmbeddingTS(pc);
    sumX += x;
    sumY += y;
    sumZ += z;
  }
  
  const n = pitchClasses.length;
  return [sumX / n, sumY / n, sumZ / n];
}

/**
 * Compute spiral distance between two chords.
 */
export function spiralDistanceTS(
  chord1: readonly number[],
  chord2: readonly number[]
): number {
  const [x1, y1, z1] = spiralChordCentroidTS(chord1);
  const [x2, y2, z2] = spiralChordCentroidTS(chord2);
  
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dz = z2 - z1;
  
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Check if Prolog engine supports math (async version).
 * Falls back to TS implementations if not.
 */
export async function checkPrologMathSupport(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<{ supportsMath: boolean; supportsAtan2: boolean }> {
  try {
    await ensureLoaded(adapter);
    
    const mathResult = await adapter.querySingle('supports_math.');
    const supportsMath = !!mathResult;
    
    const atan2Result = await adapter.querySingle('supports_atan2.');
    const supportsAtan2 = !!atan2Result;
    
    return { supportsMath, supportsAtan2 };
  } catch {
    return { supportsMath: false, supportsAtan2: false };
  }
}

/**
 * Auto-selecting DFT computation that uses Prolog if available, TS fallback otherwise.
 */
export async function computeDFTBinAuto(
  profile: readonly number[],
  k: number,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<[number, number]> {
  const { supportsMath } = await checkPrologMathSupport(adapter);
  
  if (supportsMath) {
    // Try Prolog
    try {
      const profileStr = `[${profile.join(',')}]`;
      const result = await adapter.querySingle(
        `dft_bin(${profileStr}, ${k}, Real, Imag).`
      );
      if (result && typeof result['Real'] === 'number' && typeof result['Imag'] === 'number') {
        return [result['Real'], result['Imag']];
      }
    } catch {
      // Fall through to TS
    }
  }
  
  // TypeScript fallback
  return computeDFTBinTS(profile, k);
}

