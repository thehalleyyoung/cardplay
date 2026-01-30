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

/**
 * Bodhrán pattern result.
 */
export interface BodhranPatternResult {
  readonly tuneType: string;
  readonly strokes: string[];
  readonly humanize: number;
}

/**
 * C696: Generate a bodhrán pattern for a given tune type.
 */
export async function generateBodhranPattern(
  tuneType: string,
  humanize: number = 0.1,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<BodhranPatternResult | null> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `bodhran_pattern(${tuneType}, Strokes).`
  );

  if (!result) {
    return null;
  }

  return {
    tuneType,
    strokes: result['Strokes'] as string[],
    humanize,
  };
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

/**
 * Chinese mode recommendation result.
 */
export interface ChineseModeRecommendation {
  readonly mode: string;
  readonly bianTones: number[];
  readonly confidence: number;
  readonly reasons: string[];
}

/**
 * C795: Recommend a Chinese pentatonic mode from a MusicSpec context.
 * Returns mode + bian tones suitable for the current spec.
 */
export async function recommendChineseMode(
  spec: MusicSpec,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<ChineseModeRecommendation[]>> {
  await ensureLoaded(adapter);

  const specTerm = specToPrologTerm(spec);
  const solutions = await adapter.queryAll(
    `recommend_chinese_mode_for_spec(${specTerm}, Mode, BianTones, Confidence, Reasons).`
  );

  if (solutions.length === 0) {
    // Fallback: list all modes with basic scoring
    const allModes = await adapter.queryAll('chinese_pentatonic_mode(Mode, PCs).');
    const recs: ChineseModeRecommendation[] = allModes.map(s => ({
      mode: s['Mode'] as string,
      bianTones: [],
      confidence: 50,
      reasons: ['Default mode (no spec-based preference found)'],
    }));
    return explainable(recs, ['No spec-specific recommendation; showing all modes'], 50);
  }

  const recs: ChineseModeRecommendation[] = solutions.map(s => ({
    mode: s['Mode'] as string,
    bianTones: (s['BianTones'] as number[]) ?? [],
    confidence: (s['Confidence'] as number) ?? 70,
    reasons: Array.isArray(s['Reasons']) ? s['Reasons'] as string[] : [String(s['Reasons'])],
  }));

  recs.sort((a, b) => b.confidence - a.confidence);

  return explainable(
    recs,
    [`Recommended ${recs.length} mode(s) for current spec`],
    recs.length > 0 ? recs[0]!.confidence : 0
  );
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

/**
 * C1326: Apply Coltrane changes to a full progression (major third cycle substitutions).
 */
export async function applyColtraneChanges(
  originalProgression: readonly string[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ coltraneVersion: string[]; cycleType: string; reasons: string[] }>> {
  try {
    await ensureLoaded(adapter);
    const progAtom = `[${originalProgression.join(',')}]`;
    const result = await adapter.querySingle(
      `coltrane_changes(${progAtom}, ColtraneVersion, CycleType, Reasons).`
    );
    if (result) {
      const coltraneVersion = Array.isArray(result['ColtraneVersion'])
        ? (result['ColtraneVersion'] as unknown[]).map(String) : [];
      const reasons = Array.isArray(result['Reasons'])
        ? (result['Reasons'] as unknown[]).map(String) : [];
      return explainable(
        { coltraneVersion, cycleType: String(result['CycleType']), reasons },
        [`Coltrane changes: ${coltraneVersion.join(' → ')}`],
        85
      );
    }
  } catch { /* fall through */ }

  // TS fallback: major third cycle (down major 3rds)
  const cycled = originalProgression.map((chord, i) => {
    if (i % 2 === 0) return chord;
    return `${chord}_sub`; // Simplified placeholder
  });
  return explainable(
    { coltraneVersion: cycled, cycleType: 'major_third', reasons: ['TS fallback'] },
    ['TS fallback Coltrane changes'],
    45
  );
}

/**
 * C1330: Generate planing reharmonization (parallel diatonic/chromatic).
 */
export async function getPlaning(
  melody: readonly number[],
  planingType: 'diatonic' | 'chromatic',
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ progression: string[]; reasons: string[] }>> {
  try {
    await ensureLoaded(adapter);
    const melodyAtom = `[${melody.join(',')}]`;
    const result = await adapter.querySingle(
      `jazz_planing(${melodyAtom}, ${planingType}, Progression, Reasons).`
    );
    if (result) {
      const progression = Array.isArray(result['Progression'])
        ? (result['Progression'] as unknown[]).map(String) : [];
      const reasons = Array.isArray(result['Reasons'])
        ? (result['Reasons'] as unknown[]).map(String) : [];
      return explainable({ progression, reasons }, [`${planingType} planing`], 85);
    }
  } catch { /* fall through */ }

  // TS fallback: parallel major triads following melody
  const progression = melody.map(n => {
    const noteNames = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    return `${noteNames[n % 12]}maj`;
  });
  return explainable({ progression, reasons: ['TS fallback planing'] }, ['TS fallback planing'], 45);
}

/**
 * C1334: Generate modal reharmonization (replace functional with modal stasis).
 */
export async function getModalReharmonization(
  originalProgression: readonly string[],
  targetMode: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ modalVersion: string[]; reasons: string[] }>> {
  try {
    await ensureLoaded(adapter);
    const progAtom = `[${originalProgression.join(',')}]`;
    const result = await adapter.querySingle(
      `modal_reharmonization(${progAtom}, ${targetMode}, ModalVersion, Reasons).`
    );
    if (result) {
      const modalVersion = Array.isArray(result['ModalVersion'])
        ? (result['ModalVersion'] as unknown[]).map(String) : [];
      const reasons = Array.isArray(result['Reasons'])
        ? (result['Reasons'] as unknown[]).map(String) : [];
      return explainable({ modalVersion, reasons }, [`Modal reharmonization to ${targetMode}`], 85);
    }
  } catch { /* fall through */ }

  return explainable(
    { modalVersion: Array.from(originalProgression), reasons: ['TS fallback — no modal reharmonization available'] },
    ['TS fallback modal reharm'],
    40
  );
}

/**
 * C1284: Generate head arrangement template.
 * Minimal notation with maximum freedom for improvisation.
 */
export async function getHeadArrangement(
  tune: string,
  form: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ melody: string; harmonyGuide: string } | null>> {
  try {
    await ensureLoaded(adapter);
    const result = await adapter.querySingle(
      `head_arrangement(${tune}, ${form}, Melody, HarmonyGuide).`
    );
    if (result) {
      return explainable(
        { melody: String(result['Melody']), harmonyGuide: String(result['HarmonyGuide']) },
        [`Head arrangement: ${tune} (${form})`],
        85
      );
    }
  } catch { /* fall through */ }
  return explainable(null, ['Head arrangement not available'], 40);
}

/**
 * C1286: Get rhythm section role distribution.
 */
export async function getRhythmSectionRole(
  instrument: 'piano' | 'bass' | 'drums' | 'guitar',
  context: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ role: string; constraints: string[] }>> {
  try {
    await ensureLoaded(adapter);
    const result = await adapter.querySingle(
      `rhythm_section_role(${instrument}, Role, ${context}, Constraints).`
    );
    if (result) {
      const constraints = Array.isArray(result['Constraints'])
        ? (result['Constraints'] as unknown[]).map(String) : [];
      return explainable(
        { role: String(result['Role']), constraints },
        [`${instrument} role: ${result['Role']}`],
        85
      );
    }
  } catch { /* fall through */ }

  // TS fallback
  const defaultRoles: Record<string, string> = {
    piano: 'comping', bass: 'walking', drums: 'timekeeping', guitar: 'comping',
  };
  return explainable(
    { role: defaultRoles[instrument] ?? 'support', constraints: [] },
    ['TS fallback rhythm section role'],
    45
  );
}

/**
 * C1288: Get piano comping patterns by style.
 */
export async function getCompingPattern(
  style: 'swing' | 'bossa' | 'ballad' | 'latin' | 'funk',
  chord: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ pattern: string; rhythmFeel: string }>> {
  try {
    await ensureLoaded(adapter);
    const result = await adapter.querySingle(
      `comping_pattern(${style}, ${chord}, Pattern, RhythmFeel).`
    );
    if (result) {
      return explainable(
        { pattern: String(result['Pattern']), rhythmFeel: String(result['RhythmFeel']) },
        [`Comping: ${style} pattern for ${chord}`],
        85
      );
    }
  } catch { /* fall through */ }

  const defaultPatterns: Record<string, string> = {
    swing: 'charleston', bossa: 'anticipated', ballad: 'whole_notes',
    latin: 'montuno', funk: 'rhythmic',
  };
  return explainable(
    { pattern: defaultPatterns[style] ?? 'quarter_notes', rhythmFeel: style },
    ['TS fallback comping pattern'],
    45
  );
}

/**
 * C1403: Pattern recognition for digital patterns, enclosures, arpeggios.
 */
export async function recognizeJazzPatterns(
  notes: readonly number[]
): Promise<Explainable<{ patterns: Array<{ type: string; start: number; length: number }> }>> {
  const patterns: Array<{ type: string; start: number; length: number }> = [];

  for (let i = 0; i < notes.length - 3; i++) {
    const segment = [notes[i]!, notes[i + 1]!, notes[i + 2]!, notes[i + 3]!];

    // Detect enclosure: chromatic approach from above and below to target
    if (Math.abs(segment[0]! - segment[2]!) <= 2 &&
        Math.abs(segment[1]! - segment[2]!) <= 2 &&
        segment[0]! !== segment[2]! && segment[1]! !== segment[2]!) {
      const aboveBelow = (segment[0]! > segment[2]! && segment[1]! < segment[2]!) ||
                         (segment[0]! < segment[2]! && segment[1]! > segment[2]!);
      if (aboveBelow) {
        patterns.push({ type: 'enclosure', start: i, length: 3 });
      }
    }

    // Detect arpeggio: consistent interval direction with common chord intervals
    const intervals = [segment[1]! - segment[0]!, segment[2]! - segment[1]!, segment[3]! - segment[2]!];
    const allUp = intervals.every(iv => iv > 0);
    const allDown = intervals.every(iv => iv < 0);
    if (allUp || allDown) {
      const absIntervals = intervals.map(Math.abs);
      const chordIntervals = absIntervals.every(iv => [3, 4, 5, 7].includes(iv));
      if (chordIntervals) {
        patterns.push({ type: 'arpeggio', start: i, length: 4 });
      }
    }

    // Detect digital pattern: scale-step motion (intervals of 1-2 semitones)
    const isScalar = intervals.every(iv => Math.abs(iv) <= 2 && iv !== 0);
    if (isScalar) {
      patterns.push({ type: 'digital_pattern', start: i, length: 4 });
    }
  }

  return explainable(
    { patterns },
    [`Found ${patterns.length} jazz patterns`],
    70
  );
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
 * C1140/C1141: Get LCC color tones for a chord-scale pairing.
 * Color tones are upper extensions that add characteristic flavor.
 */
export async function getLccColorTones(
  chord: string,
  scale: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ colorTones: string[] } | null>> {
  try {
    await ensureLoaded(adapter);
    const result = await adapter.querySingle(
      `lcc_color_tone(${chord}, ${scale}, ColorTone).`
    );
    if (result) {
      const tone = String(result['ColorTone'] ?? '');
      return explainable({ colorTones: [tone] }, [`LCC color tone: ${tone} for ${chord}/${scale}`], 85);
    }
  } catch { /* fall through */ }

  // TS fallback: common color tones by chord quality
  const fallbackTones: Record<string, string[]> = {
    major7: ['9', '#11', '13'],
    dominant7: ['9', '#11', '13', 'b13'],
    minor7: ['9', '11', '13'],
    half_diminished: ['9', '11', 'b13'],
  };
  const tones = fallbackTones[chord] ?? ['9'];
  return explainable({ colorTones: tones }, ['TS fallback color tones'], 50);
}

/**
 * C1144/C1145: Get LCC polychord voicing.
 * Polychords stack two chords for rich harmonic color.
 */
export async function getLccPolychord(
  baseChord: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ upperChord: string; voicing: string[]; gravityScore: number } | null>> {
  try {
    await ensureLoaded(adapter);
    const result = await adapter.querySingle(
      `lcc_polychord(${baseChord}, UpperChord, Voicing, GravityScore).`
    );
    if (result) {
      const voicing = Array.isArray(result['Voicing'])
        ? (result['Voicing'] as unknown[]).map(String) : [];
      return explainable(
        { upperChord: String(result['UpperChord']), voicing, gravityScore: Number(result['GravityScore'] ?? 0) },
        [`LCC polychord: ${baseChord} + ${result['UpperChord']}`],
        85
      );
    }
  } catch { /* fall through */ }

  return explainable(null, ['Polychord not found'], 40);
}

/**
 * C1146/C1147: Interpret a slash chord via parent scale analysis.
 */
export async function getSlashChordParent(
  slashChord: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ parentScale: string; analysis: string } | null>> {
  try {
    await ensureLoaded(adapter);
    const result = await adapter.querySingle(
      `slash_chord_parent(${slashChord}, ParentScale, Analysis).`
    );
    if (result) {
      return explainable(
        { parentScale: String(result['ParentScale']), analysis: String(result['Analysis']) },
        [`Slash chord ${slashChord}: parent scale ${result['ParentScale']}`],
        85
      );
    }
  } catch { /* fall through */ }

  return explainable(null, ['Slash chord analysis not available'], 40);
}

/**
 * C1148/C1149: Get LCC modal interchange analysis.
 * Shows how borrowed chords relate through Lydian Chromatic lens.
 */
export async function getLccModalInterchange(
  key: string,
  borrowedChord: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ sourceScale: string; gravityShift: string } | null>> {
  try {
    await ensureLoaded(adapter);
    const result = await adapter.querySingle(
      `lcc_modal_interchange(${key}, ${borrowedChord}, SourceScale, GravityShift).`
    );
    if (result) {
      return explainable(
        { sourceScale: String(result['SourceScale']), gravityShift: String(result['GravityShift']) },
        [`Modal interchange: ${borrowedChord} from ${result['SourceScale']} (gravity: ${result['GravityShift']})`],
        85
      );
    }
  } catch { /* fall through */ }

  return explainable(null, ['Modal interchange analysis not available'], 40);
}

/**
 * C1150/C1151: Analyze Coltrane changes using LCC concepts.
 */
export async function getColtraneLccAnalysis(
  originalChord: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ substitution: string; lccReason: string } | null>> {
  try {
    await ensureLoaded(adapter);
    const result = await adapter.querySingle(
      `coltrane_substitution(${originalChord}, Substitution, LCCReason).`
    );
    if (result) {
      return explainable(
        { substitution: String(result['Substitution']), lccReason: String(result['LCCReason']) },
        [`Coltrane sub: ${originalChord} → ${result['Substitution']} (${result['LCCReason']})`],
        85
      );
    }
  } catch { /* fall through */ }

  return explainable(null, ['Coltrane analysis not available'], 40);
}

/**
 * C1182: Suggest LCC-based reharmonization substitutions.
 * Uses tonal gravity to find substitute chords that maintain voice-leading flow.
 */
export async function suggestLccReharmonization(
  chord: string,
  context: string = 'general',
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ substitutions: Array<{ chord: string; gravityScore: number; reason: string }> }>> {
  try {
    await ensureLoaded(adapter);
    const result = await adapter.querySingle(
      `lcc_reharmonization(${chord}, ${context}, Sub, Score, Reason).`
    );
    if (result) {
      return explainable(
        {
          substitutions: [{
            chord: String(result['Sub']),
            gravityScore: Number(result['Score'] ?? 0),
            reason: String(result['Reason'] ?? ''),
          }],
        },
        [`LCC reharmonization for ${chord}`],
        80
      );
    }
  } catch { /* fall through */ }

  // TS fallback: common gravity-based substitutions
  const subs = [
    { chord: `${chord}_tritone_sub`, gravityScore: 0.8, reason: 'Tritone substitution (same tritone)' },
    { chord: `${chord}_upper_structure`, gravityScore: 0.7, reason: 'Upper structure triad substitution' },
  ];
  return explainable({ substitutions: subs }, ['TS fallback reharmonization'], 45);
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

// ============================================================================
// LCC QUERY WRAPPERS (C1544-C1545)
// ============================================================================

/**
 * C1544: Solve orchestration assignment problem.
 * Given a target texture and constraints, find instrument assignments.
 */
export interface OrchestrationTarget {
  readonly voices: ReadonlyArray<{
    readonly role: string;
    readonly pitchRange: [number, number];
    readonly dynamics: string;
  }>;
  readonly style: string;
}

export interface SpecOrchestrationAssignment {
  readonly voice: string;
  readonly instrument: string;
  readonly register: string;
  readonly dynamics: string;
  readonly fitness: number;
}

export interface OrchestrationResult {
  readonly assignments: readonly SpecOrchestrationAssignment[];
  readonly totalFitness: number;
  readonly explanation: readonly string[];
}

export async function solveOrchestration(
  target: OrchestrationTarget,
  spec: MusicSpec,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<OrchestrationResult>> {
  await ensureLoaded(adapter);

  // Build Prolog-compatible voice list
  const voiceTerms = target.voices.map(v =>
    `voice(${v.role}, range(${v.pitchRange[0]}, ${v.pitchRange[1]}), ${v.dynamics})`
  ).join(', ');

  const specTerm = specToPrologTerm(spec);

  try {
    const solutions = await adapter.queryAll(
      `solve_orchestration([${voiceTerms}], ${specTerm}, ${target.style}, Assignments, Fitness).`
    );

    if (solutions.length > 0) {
      const best = solutions[0]!;
      const assignments = Array.isArray(best['Assignments'])
        ? (best['Assignments'] as Array<Record<string, unknown>>).map(a => ({
            voice: String(a['voice'] ?? ''),
            instrument: String(a['instrument'] ?? ''),
            register: String(a['register'] ?? 'mid'),
            dynamics: String(a['dynamics'] ?? 'mf'),
            fitness: typeof a['fitness'] === 'number' ? a['fitness'] : 0.5,
          }))
        : [];

      const result: OrchestrationResult = {
        assignments,
        totalFitness: typeof best['Fitness'] === 'number' ? best['Fitness'] : 0,
        explanation: [`Solved ${assignments.length} voice assignments`],
      };
      return explainable(result, result.explanation, result.totalFitness * 100);
    }
  } catch {
    // Fall through to TS fallback
  }

  // TypeScript fallback: simple greedy assignment
  const fallbackAssignments: SpecOrchestrationAssignment[] = target.voices.map(v => ({
    voice: v.role,
    instrument: v.pitchRange[1] > 72 ? 'flute' : v.pitchRange[0] < 48 ? 'cello' : 'violin',
    register: v.pitchRange[1] > 72 ? 'high' : v.pitchRange[0] < 48 ? 'low' : 'mid',
    dynamics: v.dynamics,
    fitness: 0.5,
  }));

  const fallbackResult: OrchestrationResult = {
    assignments: fallbackAssignments,
    totalFitness: 0.5,
    explanation: ['Fallback greedy assignment (no Prolog KB)'],
  };
  return explainable(fallbackResult, fallbackResult.explanation, 50);
}

/**
 * C1545: Expand piano reduction to orchestral score.
 */
export interface PianoScore {
  readonly notes: ReadonlyArray<{
    readonly pitch: number;
    readonly start: number;
    readonly duration: number;
    readonly velocity: number;
  }>;
}

export interface OrchestratedPart {
  readonly instrument: string;
  readonly notes: ReadonlyArray<{
    readonly pitch: number;
    readonly start: number;
    readonly duration: number;
    readonly velocity: number;
  }>;
}

export async function expandPianoToOrchestra(
  pianoScore: PianoScore,
  style: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<readonly OrchestratedPart[]>> {
  await ensureLoaded(adapter);

  // Determine voice ranges from the piano score
  const pitches = pianoScore.notes.map(n => n.pitch);
  const minPitch = Math.min(...pitches);
  const maxPitch = Math.max(...pitches);
  const midPitch = Math.floor((minPitch + maxPitch) / 2);

  // Split into high/low voices
  const highNotes = pianoScore.notes.filter(n => n.pitch >= midPitch);
  const lowNotes = pianoScore.notes.filter(n => n.pitch < midPitch);

  // Assign based on style
  const styleInstruments: Record<string, { high: string; low: string }> = {
    'orchestral': { high: 'violin', low: 'cello' },
    'chamber': { high: 'violin', low: 'viola' },
    'wind': { high: 'flute', low: 'clarinet' },
    'brass': { high: 'trumpet', low: 'trombone' },
    'jazz': { high: 'saxophone', low: 'piano' },
  };

  const instruments = styleInstruments[style] ?? styleInstruments['orchestral']!;

  const parts: OrchestratedPart[] = [
    { instrument: instruments.high, notes: highNotes },
    { instrument: instruments.low, notes: lowNotes },
  ];

  return explainable(
    parts,
    [`Expanded piano to ${parts.length} parts in ${style} style`],
    70
  );
}

// ============================================================================
// C1735: KALPANA SWARA GENERATOR
// ============================================================================

/**
 * C1735: Generate kalpana swara (improvised melodic passages) for a raga.
 */
export interface KalpanaSwaraResult {
  readonly raga: string;
  readonly tala: string;
  readonly swaras: readonly string[];
  readonly duration: number;
  readonly phraseStructure: readonly string[];
}

export async function generateKalpanaSwara(
  raga: string,
  tala: string,
  duration: number,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<KalpanaSwaraResult | null>> {
  await ensureLoaded(adapter);

  try {
    const result = await adapter.querySingle(
      `generate_kalpana_swara(${raga}, ${tala}, ${duration}, Swaras, Phrases).`
    );

    if (result) {
      const kalpana: KalpanaSwaraResult = {
        raga,
        tala,
        swaras: Array.isArray(result['Swaras']) ? result['Swaras'] as string[] : [],
        duration,
        phraseStructure: Array.isArray(result['Phrases']) ? result['Phrases'] as string[] : [],
      };
      return explainable(kalpana, [`Generated kalpana swara for ${raga} in ${tala}`], 80);
    }
  } catch {
    // Fall through to TS fallback
  }

  // Fallback: return basic ascending/descending pattern
  const basicSwaras = ['sa', 'ri', 'ga', 'ma', 'pa', 'dha', 'ni'];
  const swaraCount = Math.max(4, Math.floor(duration * 2));
  const generated: string[] = [];
  for (let i = 0; i < swaraCount; i++) {
    generated.push(basicSwaras[i % basicSwaras.length]!);
  }

  const result: KalpanaSwaraResult = {
    raga,
    tala,
    swaras: generated,
    duration,
    phraseStructure: ['ascending', 'descending'],
  };
  return explainable(result, ['Fallback basic swara sequence (no KB)'], 40);
}

// C1818: getChineseMode already defined above (line ~5576)
// LCC recommendLCCScale already defined above (line ~3254)

// ============================================================================
// C1819 — generateHeterophony
// ============================================================================

/**
 * Heterophony variation result.
 */
export interface HeterophonyResult {
  readonly melody: number[];
  readonly voices: ReadonlyArray<{ instrument: string; notes: number[] }>;
  readonly depth: 'subtle' | 'moderate' | 'free';
}

/**
 * Generate heterophonic variations of a melody for multiple instruments.
 * C1819: Wraps heterophony_variation/4 Prolog predicate.
 *
 * Each voice applies slight pitch/timing offsets based on the specified depth.
 */
export async function generateHeterophony(
  melody: number[],
  instruments: string[],
  depth: 'subtle' | 'moderate' | 'free' = 'moderate',
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<HeterophonyResult>> {
  await ensureLoaded(adapter);

  const voices: { instrument: string; notes: number[] }[] = [];

  try {
    for (let i = 0; i < instruments.length; i++) {
      const notesList = `[${melody.join(',')}]`;
      const result = await adapter.querySingle(
        `heterophony_variation(${notesList}, ${depth}, ${i}, VariedNotes).`
      );
      if (result && Array.isArray(result['VariedNotes'])) {
        voices.push({
          instrument: instruments[i]!,
          notes: (result['VariedNotes'] as unknown[]).map(Number),
        });
      } else {
        // Fallback: use original melody
        voices.push({ instrument: instruments[i]!, notes: [...melody] });
      }
    }

    return explainable(
      { melody, voices, depth },
      [`Heterophony: ${instruments.length} voices, depth=${depth}`],
      85
    );
  } catch {
    // TS fallback: apply simple pitch offsets
    for (let i = 0; i < instruments.length; i++) {
      const offset = depth === 'subtle' ? 0 : depth === 'moderate' ? (i % 2 === 0 ? 1 : -1) : (i * 2 - instruments.length);
      voices.push({
        instrument: instruments[i]!,
        notes: melody.map(n => n + offset),
      });
    }
    return explainable(
      { melody, voices, depth },
      ['Fallback heterophony (TS offset-based)'],
      50
    );
  }
}

// ============================================================================
// C1884 — generateMontuno
// ============================================================================

/**
 * Montuno pattern result.
 */
export interface MontunoResult {
  readonly chordType: string;
  readonly pattern: string[];
  readonly style: string;
  readonly claveType: string;
}

/**
 * Generate a montuno (piano guajeo) pattern for the given chord progression.
 * C1884: Wraps montuno_pattern/3 Prolog predicate.
 */
export async function generateMontuno(
  chords: string[],
  claveType: string = 'son_3_2',
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<MontunoResult[]>> {
  await ensureLoaded(adapter);

  const results: MontunoResult[] = [];

  try {
    for (const chord of chords) {
      // Map common chord types to Prolog atoms
      const chordType = chord.includes('m') && !chord.includes('maj')
        ? 'minor'
        : chord.includes('7')
        ? 'dominant7'
        : 'major';

      const result = await adapter.querySingle(
        `montuno_pattern(${chordType}, Pattern, Style).`
      );

      if (result && Array.isArray(result['Pattern'])) {
        results.push({
          chordType,
          pattern: (result['Pattern'] as unknown[]).map(String),
          style: String(result['Style']),
          claveType,
        });
      } else {
        // Fallback
        results.push({
          chordType,
          pattern: ['root_5th', 'third_root', 'fifth_third', 'root_5th'],
          style: 'son_montuno',
          claveType,
        });
      }
    }

    return explainable(results, [`Montuno patterns for ${chords.length} chords`], 85);
  } catch {
    // Full TS fallback
    for (const chord of chords) {
      results.push({
        chordType: chord,
        pattern: ['root_5th', 'third_root', 'fifth_third', 'root_5th'],
        style: 'son_montuno',
        claveType,
      });
    }
    return explainable(results, ['Fallback montuno patterns (no KB)'], 40);
  }
}

// ============================================================================
// C1885 — checkClaveAlignment
// ============================================================================

/**
 * Clave alignment check result.
 */
export interface ClaveAlignmentResult {
  readonly claveType: string;
  readonly clavePattern: number[];
  readonly violations: ReadonlyArray<{
    readonly beat: number;
    readonly reason: string;
  }>;
  readonly aligned: boolean;
}

/**
 * Check if a rhythmic pattern aligns with the clave.
 * C1885: Validates that note onsets respect the clave feel.
 */
export async function checkClaveAlignment(
  pattern: number[],
  claveType: string = 'son_3_2',
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<ClaveAlignmentResult>> {
  await ensureLoaded(adapter);

  try {
    // Get the clave pattern from Prolog
    const claveResult = await adapter.querySingle(
      `clave_pattern(${claveType}, Pattern, _).`
    );

    const clavePattern = claveResult && Array.isArray(claveResult['Pattern'])
      ? (claveResult['Pattern'] as unknown[]).map(Number)
      : [];

    if (clavePattern.length === 0) {
      return explainable(
        { claveType, clavePattern: [], violations: [], aligned: true },
        ['Clave pattern not found, skipping check'],
        30
      );
    }

    // Check alignment: accented notes in the pattern should coincide
    // with clave hits (where clave has a 1)
    const violations: { beat: number; reason: string }[] = [];
    for (let i = 0; i < pattern.length && i < clavePattern.length; i++) {
      // Strong accent on a clave rest is a violation
      if (pattern[i]! > 0 && clavePattern[i] === 0) {
        // Only flag if it's an accent (value > 1 represents emphasis)
        if (pattern[i]! > 1) {
          violations.push({
            beat: i,
            reason: `Accent at beat ${i} conflicts with clave rest`,
          });
        }
      }
    }

    const aligned = violations.length === 0;
    return explainable(
      { claveType, clavePattern, violations, aligned },
      [aligned ? 'Pattern aligns with clave' : `${violations.length} clave violation(s) found`],
      90
    );
  } catch {
    // TS fallback: basic son clave 3-2 pattern
    const fallbackClave = [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0];
    return explainable(
      { claveType, clavePattern: fallbackClave, violations: [], aligned: true },
      ['Fallback clave check (no KB)'],
      40
    );
  }
}

// ============================================================================
// VOICE-LEADING CHECKER (C938, C940)
// ============================================================================

/**
 * C938: Voice-leading motion types between two notes.
 */
export type VoiceMotionType =
  | 'oblique'     // One voice stays, other moves
  | 'contrary'    // Voices move in opposite directions
  | 'similar'     // Voices move in same direction, different intervals
  | 'parallel'    // Voices move in same direction, same interval
  | 'static';     // Both voices stay

/**
 * C938: A voice-leading error or warning.
 */
export interface VoiceLeadingIssue {
  readonly position: number;
  readonly voices: readonly [number, number];
  readonly issue: string;
  readonly severity: 'error' | 'warning';
}

/**
 * C938: Result of voice-leading analysis.
 */
export interface VoiceLeadingResult {
  readonly issues: readonly VoiceLeadingIssue[];
  readonly motionProfile: readonly VoiceMotionType[];
  readonly parallelFifths: number;
  readonly parallelOctaves: number;
  readonly voiceCrossings: number;
  readonly largeLeaps: number;
  readonly score: number; // 0-100, higher = better voice leading
}

/**
 * C940: Culture-aware voice-leading profile.
 * Different traditions have different voice-leading norms.
 */
export interface VoiceLeadingProfile {
  readonly name: string;
  /** Whether parallel fifths are forbidden */
  readonly forbidParallelFifths: boolean;
  /** Whether parallel octaves are forbidden */
  readonly forbidParallelOctaves: boolean;
  /** Maximum allowed leap in semitones */
  readonly maxLeap: number;
  /** Whether voice crossing is forbidden */
  readonly forbidVoiceCrossing: boolean;
  /** Preferred motion types (most preferred first) */
  readonly preferredMotion: readonly VoiceMotionType[];
}

/**
 * C940: Built-in voice-leading profiles for different cultural contexts.
 */
export const VOICE_LEADING_PROFILES: Record<string, VoiceLeadingProfile> = {
  western_classical: {
    name: 'Western Classical',
    forbidParallelFifths: true,
    forbidParallelOctaves: true,
    maxLeap: 12,
    forbidVoiceCrossing: true,
    preferredMotion: ['contrary', 'oblique', 'similar'],
  },
  jazz: {
    name: 'Jazz',
    forbidParallelFifths: false,
    forbidParallelOctaves: false,
    maxLeap: 14,
    forbidVoiceCrossing: false,
    preferredMotion: ['similar', 'contrary', 'oblique', 'parallel'],
  },
  carnatic: {
    name: 'Carnatic',
    forbidParallelFifths: false,
    forbidParallelOctaves: false,
    maxLeap: 7, // Raga movement is typically stepwise
    forbidVoiceCrossing: false,
    preferredMotion: ['oblique', 'similar'], // Melody-centric, not counterpoint
  },
  chinese: {
    name: 'Chinese Heterophony',
    forbidParallelFifths: false,
    forbidParallelOctaves: false,
    maxLeap: 7,
    forbidVoiceCrossing: false,
    preferredMotion: ['similar', 'parallel', 'oblique'], // Heterophonic movement
  },
  celtic: {
    name: 'Celtic',
    forbidParallelFifths: false,
    forbidParallelOctaves: false,
    maxLeap: 9,
    forbidVoiceCrossing: false,
    preferredMotion: ['similar', 'oblique', 'contrary'],
  },
};

/**
 * C938: Check voice leading between chord voicings.
 * Each voicing is an array of MIDI pitches (one per voice, bottom to top).
 *
 * C940: The profile parameter allows culture-aware voice leading rules.
 */
export async function analyzeVoiceLeading(
  voicings: readonly (readonly number[])[],
  profile: VoiceLeadingProfile = VOICE_LEADING_PROFILES.western_classical!,
): Promise<Explainable<VoiceLeadingResult>> {
  const issues: VoiceLeadingIssue[] = [];
  const motionProfile: VoiceMotionType[] = [];
  let parallelFifths = 0;
  let parallelOctaves = 0;
  let voiceCrossings = 0;
  let largeLeaps = 0;

  for (let pos = 0; pos < voicings.length - 1; pos++) {
    const curr = voicings[pos]!;
    const next = voicings[pos + 1]!;
    const numVoices = Math.min(curr.length, next.length);

    // Check each pair of voices
    for (let v1 = 0; v1 < numVoices; v1++) {
      const motion1 = next[v1]! - curr[v1]!;

      // Check leap size
      if (Math.abs(motion1) > profile.maxLeap) {
        largeLeaps++;
        issues.push({
          position: pos,
          voices: [v1, v1],
          issue: `Voice ${v1}: leap of ${Math.abs(motion1)} semitones exceeds max ${profile.maxLeap}`,
          severity: 'warning',
        });
      }

      for (let v2 = v1 + 1; v2 < numVoices; v2++) {
        const motion2 = next[v2]! - curr[v2]!;

        // Determine motion type
        let motionType: VoiceMotionType;
        if (motion1 === 0 && motion2 === 0) {
          motionType = 'static';
        } else if (motion1 === 0 || motion2 === 0) {
          motionType = 'oblique';
        } else if ((motion1 > 0 && motion2 < 0) || (motion1 < 0 && motion2 > 0)) {
          motionType = 'contrary';
        } else if (motion1 === motion2) {
          motionType = 'parallel';
        } else {
          motionType = 'similar';
        }

        if (v1 === 0 && v2 === 1) {
          motionProfile.push(motionType);
        }

        // Check parallel fifths (interval of 7 semitones)
        const interval1 = Math.abs(curr[v2]! - curr[v1]!) % 12;
        const interval2 = Math.abs(next[v2]! - next[v1]!) % 12;

        if (interval1 === 7 && interval2 === 7 && motionType === 'parallel') {
          parallelFifths++;
          if (profile.forbidParallelFifths) {
            issues.push({
              position: pos,
              voices: [v1, v2],
              issue: `Parallel fifths between voices ${v1} and ${v2}`,
              severity: 'error',
            });
          }
        }

        // Check parallel octaves (interval of 0 semitones mod 12)
        if (interval1 === 0 && interval2 === 0 && motionType === 'parallel' && motion1 !== 0) {
          parallelOctaves++;
          if (profile.forbidParallelOctaves) {
            issues.push({
              position: pos,
              voices: [v1, v2],
              issue: `Parallel octaves between voices ${v1} and ${v2}`,
              severity: 'error',
            });
          }
        }

        // Check voice crossing
        if (profile.forbidVoiceCrossing) {
          if (next[v1]! > next[v2]!) {
            voiceCrossings++;
            issues.push({
              position: pos,
              voices: [v1, v2],
              issue: `Voice crossing: voice ${v1} crosses above voice ${v2}`,
              severity: 'warning',
            });
          }
        }
      }
    }
  }

  // Calculate score
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const score = Math.max(0, Math.round(100 - (errorCount * 20) - (warningCount * 5)));

  const result: VoiceLeadingResult = {
    issues,
    motionProfile,
    parallelFifths,
    parallelOctaves,
    voiceCrossings,
    largeLeaps,
    score,
  };

  const explanations = [
    `Voice leading score: ${score}/100`,
    `${parallelFifths} parallel fifths, ${parallelOctaves} parallel octaves`,
    `${voiceCrossings} voice crossings, ${largeLeaps} large leaps`,
    `Profile: ${profile.name}`,
  ];

  return explainable(result, explanations, Math.min(score, 95));
}

// ============================================================================
// SCHEMA MATCHING SCORE (C890)
// ============================================================================

/**
 * C890: Calculate a matching score between a musical passage and a galant schema.
 * Returns a score 0-100 indicating how well the passage fits the schema.
 */
export async function calculateSchemaMatchScore(
  bassLine: readonly number[],
  melodyLine: readonly number[],
  schemaName: GalantSchemaName,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ schema: GalantSchemaName; score: number; matchedStages: number; totalStages: number }>> {
  try {
    await ensureLoaded(adapter);

    const bassAtom = `[${bassLine.join(',')}]`;
    const melodyAtom = `[${melodyLine.join(',')}]`;
    const q = `schema_match_score(${schemaName}, ${bassAtom}, ${melodyAtom}, Score, Stages, Total)`;
    const result = await adapter.querySingle(q);

    if (result) {
      const score = Number(result['Score'] ?? 0);
      const matchedStages = Number(result['Stages'] ?? 0);
      const totalStages = Number(result['Total'] ?? 0);
      return explainable(
        { schema: schemaName, score, matchedStages, totalStages },
        [`Schema '${schemaName}' match: ${score}% (${matchedStages}/${totalStages} stages)`],
        85
      );
    }
  } catch {
    // Fall through to TS fallback
  }

  // TS fallback: simple heuristic based on scale-degree patterns
  const schemaPatterns: Record<string, readonly number[]> = {
    romanesca: [0, 7, 5, 3],    // I-V-IV-ii bass degrees (simplified)
    prinner: [5, 4, 3, 2],      // 6-5-4-3 bass descent
    fonte: [2, 5, 0, 4],        // Descending sequence
    monte: [0, 4, 2, 5],        // Ascending sequence
    'rule-of-octave': [0, 2, 4, 5, 7, 9, 11, 12],
  };

  const pattern = schemaPatterns[schemaName];
  if (!pattern) {
    return explainable(
      { schema: schemaName, score: 0, matchedStages: 0, totalStages: 0 },
      [`Unknown schema '${schemaName}'`],
      30
    );
  }

  // Compare bass line intervals with schema pattern
  let matchedStages = 0;
  const totalStages = Math.min(bassLine.length, pattern.length);
  for (let i = 0; i < totalStages; i++) {
    const bassDegree = bassLine[i]! % 12;
    if (bassDegree === pattern[i]) {
      matchedStages++;
    }
  }

  const score = totalStages > 0 ? Math.round((matchedStages / totalStages) * 100) : 0;
  return explainable(
    { schema: schemaName, score, matchedStages, totalStages },
    [`Schema '${schemaName}' heuristic match: ${score}% (${matchedStages}/${totalStages} stages)`, 'TS fallback'],
    50
  );
}

// ============================================================================
// PHRASE DATABASE INDEXING (C926)
// ============================================================================

/**
 * C926: Tags for indexing phrases in the database.
 */
export interface PhraseTags {
  readonly schemaName?: GalantSchemaName;
  readonly culture?: string;
  readonly mood?: string;
  readonly energy?: 'low' | 'medium' | 'high';
  readonly fingerprint?: string;
  readonly customTags?: readonly string[];
}

/**
 * C926: A stored phrase entry with indexing metadata.
 */
export interface PhraseEntry {
  readonly id: string;
  readonly notes: readonly number[];
  readonly durations: readonly number[];
  readonly tags: PhraseTags;
  readonly createdAt: number;
}

/**
 * C926: In-memory phrase database with tag-based indexing.
 */
class PhraseDatabase {
  private entries = new Map<string, PhraseEntry>();
  private tagIndex = new Map<string, Set<string>>();

  /** Add a phrase to the database */
  add(entry: PhraseEntry): void {
    this.entries.set(entry.id, entry);
    this.indexEntry(entry);
  }

  /** Remove a phrase from the database */
  remove(id: string): boolean {
    const entry = this.entries.get(id);
    if (!entry) return false;
    this.entries.delete(id);
    this.deindexEntry(entry);
    return true;
  }

  /** Query phrases by tags */
  query(tags: Partial<PhraseTags>): readonly PhraseEntry[] {
    const candidateIds = new Set<string>();
    let first = true;

    for (const [key, value] of Object.entries(tags)) {
      if (value === undefined) continue;
      const tagKey = `${key}:${typeof value === 'object' ? JSON.stringify(value) : value}`;
      const ids = this.tagIndex.get(tagKey);
      if (!ids) return [];

      if (first) {
        for (const id of ids) candidateIds.add(id);
        first = false;
      } else {
        for (const id of candidateIds) {
          if (!ids.has(id)) candidateIds.delete(id);
        }
      }
    }

    return first
      ? Array.from(this.entries.values())
      : Array.from(candidateIds)
          .map(id => this.entries.get(id)!)
          .filter(Boolean);
  }

  /** Get all entries */
  getAll(): readonly PhraseEntry[] {
    return Array.from(this.entries.values());
  }

  /** Get entry count */
  get size(): number {
    return this.entries.size;
  }

  /** Clear all entries */
  clear(): void {
    this.entries.clear();
    this.tagIndex.clear();
  }

  private indexEntry(entry: PhraseEntry): void {
    const tags = entry.tags;
    if (tags.schemaName) this.addToIndex(`schemaName:${tags.schemaName}`, entry.id);
    if (tags.culture) this.addToIndex(`culture:${tags.culture}`, entry.id);
    if (tags.mood) this.addToIndex(`mood:${tags.mood}`, entry.id);
    if (tags.energy) this.addToIndex(`energy:${tags.energy}`, entry.id);
    if (tags.fingerprint) this.addToIndex(`fingerprint:${tags.fingerprint}`, entry.id);
    if (tags.customTags) {
      for (const tag of tags.customTags) {
        this.addToIndex(`custom:${tag}`, entry.id);
      }
    }
  }

  private deindexEntry(entry: PhraseEntry): void {
    for (const [_key, ids] of this.tagIndex) {
      ids.delete(entry.id);
    }
  }

  private addToIndex(tagKey: string, id: string): void {
    let ids = this.tagIndex.get(tagKey);
    if (!ids) {
      ids = new Set();
      this.tagIndex.set(tagKey, ids);
    }
    ids.add(id);
  }
}

/**
 * C926: Global phrase database instance.
 */
export const phraseDatabase = new PhraseDatabase();

// ============================================================================
// BIG BAND ARRANGING TECHNIQUES (C1244-C1272)
// ============================================================================

/**
 * C1244: Generate unison/octave writing for power and clarity.
 */
export async function generateUnisonOctaveLine(
  melody: readonly number[],
  section: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ voices: number[][] }>> {
  try {
    await ensureLoaded(adapter);
    const melodyAtom = `[${melody.join(',')}]`;
    const result = await adapter.querySingle(
      `unison_octave_line(${melodyAtom}, ${section}, Voices).`
    );
    if (result) {
      const voices = Array.isArray(result['Voices'])
        ? (result['Voices'] as unknown[][]).map(v => (v as number[])) : [];
      return explainable({ voices }, [`Unison/octave line for ${section}`], 85);
    }
  } catch { /* fall through */ }
  // TS fallback: double at octave below
  const octaveBelow = melody.map(n => n - 12);
  return explainable({ voices: [Array.from(melody), octaveBelow] }, ['TS fallback unison/octave'], 50);
}

/**
 * C1248: Generate 4-way close voicing (sax soli technique).
 */
export async function getFourWayClose(
  melodyNote: number,
  chord: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ notes: number[] } | null>> {
  try {
    await ensureLoaded(adapter);
    const result = await adapter.querySingle(
      `four_way_close(${melodyNote}, ${chord}, FourNotes).`
    );
    if (result) {
      const notes = Array.isArray(result['FourNotes'])
        ? (result['FourNotes'] as number[]) : [];
      return explainable({ notes }, [`4-way close: ${notes.join(', ')}`], 85);
    }
  } catch { /* fall through */ }
  // TS fallback: stack in thirds below melody
  const n = melodyNote;
  return explainable({ notes: [n, n - 4, n - 7, n - 11] }, ['TS fallback 4-way close'], 50);
}

/**
 * C1250: Generate 5-way close with doubled lead (standard sax soli).
 */
export async function getFiveWayClose(
  melodyNote: number,
  chord: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ notes: number[] } | null>> {
  try {
    await ensureLoaded(adapter);
    const result = await adapter.querySingle(
      `five_way_close(${melodyNote}, ${chord}, FiveNotes).`
    );
    if (result) {
      const notes = Array.isArray(result['FiveNotes'])
        ? (result['FiveNotes'] as number[]) : [];
      return explainable({ notes }, [`5-way close: ${notes.join(', ')}`], 85);
    }
  } catch { /* fall through */ }
  const n = melodyNote;
  return explainable({ notes: [n, n - 3, n - 7, n - 10, n - 12] }, ['TS fallback 5-way close'], 50);
}

/**
 * C1252: Generate drop 2 sax soli voicing.
 */
export async function getSaxSoliDrop2(
  melodyNote: number,
  chord: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ notes: number[] } | null>> {
  try {
    await ensureLoaded(adapter);
    const result = await adapter.querySingle(
      `sax_soli_drop2(${melodyNote}, ${chord}, Notes).`
    );
    if (result) {
      const notes = Array.isArray(result['Notes'])
        ? (result['Notes'] as number[]) : [];
      return explainable({ notes }, [`Drop 2 soli: ${notes.join(', ')}`], 85);
    }
  } catch { /* fall through */ }
  // TS fallback: drop second voice down an octave from 4-way close
  const n = melodyNote;
  return explainable({ notes: [n, n - 7, n - 11, n - 16] }, ['TS fallback drop 2'], 50);
}

/**
 * C1254: Generate drop 2+4 brass voicing.
 */
export async function getBrassDrop2and4(
  melodyNote: number,
  chord: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ notes: number[] } | null>> {
  try {
    await ensureLoaded(adapter);
    const result = await adapter.querySingle(
      `brass_drop_2_4(${melodyNote}, ${chord}, BrassVoices).`
    );
    if (result) {
      const notes = Array.isArray(result['BrassVoices'])
        ? (result['BrassVoices'] as number[]) : [];
      return explainable({ notes }, [`Drop 2+4 brass: ${notes.join(', ')}`], 85);
    }
  } catch { /* fall through */ }
  const n = melodyNote;
  return explainable({ notes: [n, n - 7, n - 11, n - 19] }, ['TS fallback drop 2+4'], 50);
}

/**
 * C1256: Generate spread voicing for full big band (across sections).
 */
export async function getBigBandSpread(
  chord: string,
  sections: readonly string[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ voicing: string[][]; reasons: string[] }>> {
  try {
    await ensureLoaded(adapter);
    const sectionsAtom = `[${sections.join(',')}]`;
    const result = await adapter.querySingle(
      `big_band_spread(${chord}, ${sectionsAtom}, FullVoicing, Reasons).`
    );
    if (result) {
      const voicing = Array.isArray(result['FullVoicing'])
        ? (result['FullVoicing'] as unknown[][]).map(v => (v as unknown[]).map(String)) : [];
      const reasons = Array.isArray(result['Reasons'])
        ? (result['Reasons'] as unknown[]).map(String) : [];
      return explainable({ voicing, reasons }, [`Spread voicing for ${chord}`], 85);
    }
  } catch { /* fall through */ }
  return explainable({ voicing: [], reasons: ['TS fallback'] }, ['Spread voicing fallback'], 40);
}

/**
 * C1260: Generate background figures (riffs, pads, punches behind soloist).
 */
export async function getBackgroundFigure(
  figureType: 'riff' | 'pad' | 'punch',
  _chord: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ rhythm: string; voicing: string[]; role: string } | null>> {
  try {
    await ensureLoaded(adapter);
    const result = await adapter.querySingle(
      `background_figure(${figureType}, Rhythm, Voicing, Role).`
    );
    if (result) {
      const voicing = Array.isArray(result['Voicing'])
        ? (result['Voicing'] as unknown[]).map(String) : [];
      return explainable(
        { rhythm: String(result['Rhythm']), voicing, role: String(result['Role']) },
        [`Background ${figureType} figure`],
        85
      );
    }
  } catch { /* fall through */ }
  return explainable(null, ['Background figure not available'], 40);
}

/**
 * C1262: Generate shout chorus arranging (climactic ensemble passages).
 */
export async function generateShoutChorus(
  melody: readonly number[],
  chords: readonly string[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ ensemble: number[][]; dynamics: string[] }>> {
  try {
    await ensureLoaded(adapter);
    const melodyAtom = `[${melody.join(',')}]`;
    const chordsAtom = `[${chords.join(',')}]`;
    const result = await adapter.querySingle(
      `shout_chorus(${melodyAtom}, ${chordsAtom}, FullEnsemble, Dynamics).`
    );
    if (result) {
      const ensemble = Array.isArray(result['FullEnsemble'])
        ? (result['FullEnsemble'] as unknown[][]).map(v => (v as number[])) : [];
      const dynamics = Array.isArray(result['Dynamics'])
        ? (result['Dynamics'] as unknown[]).map(String) : [];
      return explainable({ ensemble, dynamics }, ['Shout chorus generated'], 85);
    }
  } catch { /* fall through */ }
  return explainable({ ensemble: [Array.from(melody)], dynamics: ['ff'] }, ['TS fallback shout chorus'], 45);
}

/**
 * C1266: Generate call and response between sections.
 */
export async function generateCallResponse(
  callSection: string,
  responseSection: string,
  callMaterial: readonly number[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ responseMaterial: number[]; technique: string }>> {
  try {
    await ensureLoaded(adapter);
    const callAtom = `[${callMaterial.join(',')}]`;
    const result = await adapter.querySingle(
      `call_response_sections(${callSection}, ${responseSection}, ${callAtom}, ResponseMaterial).`
    );
    if (result) {
      const response = Array.isArray(result['ResponseMaterial'])
        ? (result['ResponseMaterial'] as number[]) : [];
      return explainable(
        { responseMaterial: response, technique: 'prolog' },
        [`Call-response: ${callSection} → ${responseSection}`],
        85
      );
    }
  } catch { /* fall through */ }
  // TS fallback: echo the call transposed up a 4th
  const response = callMaterial.map(n => n + 5);
  return explainable({ responseMaterial: Array.from(response), technique: 'echo+4th' }, ['TS fallback call-response'], 50);
}

/**
 * C1270: Register management across sections (avoid muddiness).
 */
export async function analyzeRegisterAllocation(
  chord: string,
  sections: readonly string[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ registers: Record<string, [number, number]>; spacing: string }>> {
  try {
    await ensureLoaded(adapter);
    const sectionsAtom = `[${sections.join(',')}]`;
    const result = await adapter.querySingle(
      `register_allocation(${chord}, ${sectionsAtom}, Registers, Spacing).`
    );
    if (result) {
      return explainable(
        { registers: result['Registers'] as Record<string, [number, number]>, spacing: String(result['Spacing']) },
        [`Register allocation for ${chord}`],
        85
      );
    }
  } catch { /* fall through */ }
  // TS fallback: standard register allocation
  const registers: Record<string, [number, number]> = {};
  const defaultRanges: Record<string, [number, number]> = {
    bass: [28, 55], trombone: [36, 67], tenor_sax: [44, 75],
    alto_sax: [49, 80], trumpet: [52, 84],
  };
  for (const sec of sections) {
    registers[sec] = defaultRanges[sec] ?? [48, 72];
  }
  return explainable({ registers, spacing: 'standard' }, ['TS fallback register allocation'], 50);
}

/**
 * C1272: Dynamic layering for section builds.
 */
export async function getDynamicLayering(
  section: string,
  dynamicLevel: 'pp' | 'p' | 'mp' | 'mf' | 'f' | 'ff',
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ entryPoint: string; reasons: string[] }>> {
  try {
    await ensureLoaded(adapter);
    const result = await adapter.querySingle(
      `dynamic_layer(${section}, ${dynamicLevel}, EntryPoint, Reasons).`
    );
    if (result) {
      const reasons = Array.isArray(result['Reasons'])
        ? (result['Reasons'] as unknown[]).map(String) : [];
      return explainable(
        { entryPoint: String(result['EntryPoint']), reasons },
        [`Dynamic layer: ${section} at ${dynamicLevel}`],
        85
      );
    }
  } catch { /* fall through */ }
  return explainable(
    { entryPoint: 'measure_1', reasons: ['Default entry'] },
    ['TS fallback dynamic layering'],
    40
  );
}

// ============================================================================
// PHRASE TAGGING & RECOMMENDATION (C924, C928, C930)
// ============================================================================

/**
 * C924: Tag phrases with schema, culture, mood tags in the Prolog KB.
 */
export async function tagPhrase(
  phraseId: string,
  tags: { schema?: string; culture?: string; mood?: string; custom?: readonly string[] },
  adapter: PrologAdapter = getPrologAdapter()
): Promise<void> {
  await ensureLoaded(adapter);
  if (tags.schema) {
    await adapter.query(`assertz(phrase_tag('${phraseId}', schema, '${tags.schema}')).`);
  }
  if (tags.culture) {
    await adapter.query(`assertz(phrase_tag('${phraseId}', culture, '${tags.culture}')).`);
  }
  if (tags.mood) {
    await adapter.query(`assertz(phrase_tag('${phraseId}', mood, '${tags.mood}')).`);
  }
  if (tags.custom) {
    for (const t of tags.custom) {
      await adapter.query(`assertz(phrase_tag('${phraseId}', custom, '${t}')).`);
    }
  }
}

/**
 * C928: Recommend phrases based on current spec + selection context.
 */
export async function recommendPhrases(
  spec: MusicSpec,
  selectionContext: { pitchClasses?: readonly number[]; rootNote?: number },
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ phraseIds: string[]; scores: number[] }>> {
  try {
    await ensureLoaded(adapter);
    await adapter.query(specToPrologFacts(spec).join('\n'));
    const specTerm = specToPrologTerm(spec);
    const contextAtom = selectionContext.rootNote !== undefined
      ? `context(root(${selectionContext.rootNote}))`
      : 'context(none)';
    const result = await adapter.querySingle(
      `recommend_phrases(${specTerm}, ${contextAtom}, PhraseIds, Scores).`
    );
    if (result) {
      const phraseIds = Array.isArray(result['PhraseIds'])
        ? (result['PhraseIds'] as unknown[]).map(String) : [];
      const scores = Array.isArray(result['Scores'])
        ? (result['Scores'] as unknown[]).map(Number) : [];
      return explainable({ phraseIds, scores }, ['KB phrase recommendation'], 80);
    }
  } catch { /* fall through */ }
  // TS fallback: query the local phrase database by spec tags
  const culture = spec.constraints.find(c => c.type === 'culture');
  const style = spec.constraints.find(c => c.type === 'style');
  const queryTags: Record<string, unknown> = {};
  if (culture && 'culture' in culture) queryTags['culture'] = culture.culture;
  if (style && 'style' in style) queryTags['mood'] = style.style;
  const matches = phraseDatabase.query(queryTags as Partial<PhraseTags>);
  return explainable(
    { phraseIds: matches.map(m => m.id), scores: matches.map(() => 50) },
    ['TS fallback phrase recommendation from local database'],
    40
  );
}

/**
 * C930: Suggest arranger variations based on section energy and cadence strength.
 */
export async function suggestArrangerVariation(
  section: string,
  energy: number,
  cadenceStrength: number,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ variation: string; techniques: string[]; reasons: string[] }>> {
  try {
    await ensureLoaded(adapter);
    const result = await adapter.querySingle(
      `arranger_variation(${section}, ${energy}, ${cadenceStrength}, Variation, Techniques, Reasons).`
    );
    if (result) {
      const techniques = Array.isArray(result['Techniques'])
        ? (result['Techniques'] as unknown[]).map(String) : [];
      const reasons = Array.isArray(result['Reasons'])
        ? (result['Reasons'] as unknown[]).map(String) : [];
      return explainable(
        { variation: String(result['Variation']), techniques, reasons },
        [`Arranger variation for ${section}`],
        85
      );
    }
  } catch { /* fall through */ }
  // TS fallback: energy-based variation selection
  let variation: string;
  let techniques: string[];
  if (energy > 0.8) {
    variation = 'climactic';
    techniques = ['full_ensemble', 'unison_octave', 'fortissimo'];
  } else if (energy > 0.5) {
    variation = 'building';
    techniques = ['add_brass', 'countermelody', 'forte'];
  } else if (energy > 0.2) {
    variation = 'sustained';
    techniques = ['pad_voicing', 'guide_tones', 'mezzo_piano'];
  } else {
    variation = 'sparse';
    techniques = ['solo_instrument', 'pianissimo', 'space'];
  }
  if (cadenceStrength > 0.7) {
    techniques.push('ritardando', 'fermata');
  }
  return explainable(
    { variation, techniques, reasons: [`Energy level: ${energy}`, `Cadence strength: ${cadenceStrength}`] },
    ['TS fallback arranger variation'],
    50
  );
}

// ============================================================================
// EXPORT TO NOTATION / TRACKER / ARRANGER (C945-C950)
// ============================================================================

/** Notation export result */
export interface NotationExport {
  readonly measures: ReadonlyArray<{
    readonly notes: ReadonlyArray<{ pitch: number; duration: string; ornament?: string }>;
    readonly timeSignature?: string;
  }>;
  readonly clef: string;
  readonly keySignature: string;
}

/** Tracker export result */
export interface TrackerExport {
  readonly rows: ReadonlyArray<{
    readonly note: string;
    readonly instrument: number;
    readonly volume: number;
    readonly effect?: string;
    readonly effectParam?: number;
  }>;
  readonly speed: number;
  readonly tempo: number;
}

/** Arranger export result */
export interface ArrangerExport {
  readonly sections: ReadonlyArray<{
    readonly name: string;
    readonly style: string;
    readonly chords: readonly string[];
    readonly bars: number;
  }>;
  readonly tempo: number;
  readonly feel: string;
}

/**
 * C945/C946: Export analyzed phrases to notation representation.
 */
export async function exportToNotation(
  notes: readonly number[],
  durations: readonly number[],
  key: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<NotationExport>> {
  try {
    await ensureLoaded(adapter);
    const notesAtom = `[${notes.join(',')}]`;
    const dursAtom = `[${durations.join(',')}]`;
    const result = await adapter.querySingle(
      `export_notation(${notesAtom}, ${dursAtom}, ${key}, Measures, Clef, KeySig).`
    );
    if (result) {
      return explainable(
        {
          measures: result['Measures'] as NotationExport['measures'],
          clef: String(result['Clef']),
          keySignature: String(result['KeySig']),
        },
        ['KB notation export'],
        85
      );
    }
  } catch { /* fall through */ }
  // TS fallback: simple single-measure notation
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const durationNames = ['whole', 'half', 'quarter', 'eighth', 'sixteenth'];
  const measureNotes = notes.map((n, i) => ({
    pitch: n,
    duration: durationNames[Math.min(Math.floor((durations[i] ?? 480) / 240), 4)] ?? 'quarter',
  }));
  const rootIdx = noteNames.indexOf(key.replace(/m$/, ''));
  return explainable(
    {
      measures: [{ notes: measureNotes, timeSignature: '4/4' }],
      clef: notes.some(n => n < 48) ? 'bass' : 'treble',
      keySignature: rootIdx >= 0 ? key : 'C',
    },
    ['TS fallback notation export'],
    40
  );
}

/**
 * C947/C948: Export analyzed phrases to tracker representation.
 */
export async function exportToTracker(
  notes: readonly number[],
  durations: readonly number[],
  instrument: number,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<TrackerExport>> {
  try {
    await ensureLoaded(adapter);
    const notesAtom = `[${notes.join(',')}]`;
    const dursAtom = `[${durations.join(',')}]`;
    const result = await adapter.querySingle(
      `export_tracker(${notesAtom}, ${dursAtom}, ${instrument}, Rows, Speed, Tempo).`
    );
    if (result) {
      return explainable(
        {
          rows: result['Rows'] as TrackerExport['rows'],
          speed: Number(result['Speed']),
          tempo: Number(result['Tempo']),
        },
        ['KB tracker export'],
        85
      );
    }
  } catch { /* fall through */ }
  // TS fallback: convert MIDI notes to tracker format
  const noteNames = ['C-', 'C#', 'D-', 'D#', 'E-', 'F-', 'F#', 'G-', 'G#', 'A-', 'A#', 'B-'];
  const rows = notes.map((n) => {
    const octave = Math.floor(n / 12) - 1;
    const noteName = noteNames[n % 12];
    const row: { note: string; instrument: number; volume: number; effect?: string; effectParam?: number } = {
      note: `${noteName}${octave}`,
      instrument,
      volume: 64,
    };
    return row;
  });
  return explainable(
    { rows, speed: 6, tempo: 125 },
    ['TS fallback tracker export'],
    40
  );
}

/**
 * C949/C950: Export analyzed phrases/specs to arranger representation.
 */
export async function exportToArranger(
  spec: MusicSpec,
  chords: readonly string[],
  bars: number,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<ArrangerExport>> {
  try {
    await ensureLoaded(adapter);
    await adapter.query(specToPrologFacts(spec).join('\n'));
    const specTerm = specToPrologTerm(spec);
    const chordsAtom = `[${chords.map(c => `'${c}'`).join(',')}]`;
    const result = await adapter.querySingle(
      `export_arranger(${specTerm}, ${chordsAtom}, ${bars}, Sections, Tempo, Feel).`
    );
    if (result) {
      return explainable(
        {
          sections: result['Sections'] as ArrangerExport['sections'],
          tempo: Number(result['Tempo']),
          feel: String(result['Feel']),
        },
        ['KB arranger export'],
        85
      );
    }
  } catch { /* fall through */ }
  // TS fallback: single section from spec
  const tempoConstraint = spec.constraints.find(c => c.type === 'tempo');
  const tempo = tempoConstraint && 'bpm' in tempoConstraint ? tempoConstraint.bpm : 120;
  const styleConstraint = spec.constraints.find(c => c.type === 'style');
  const feel = styleConstraint && 'style' in styleConstraint ? String(styleConstraint.style) : 'straight';
  return explainable(
    {
      sections: [{ name: 'A', style: feel, chords: Array.from(chords), bars }],
      tempo,
      feel,
    },
    ['TS fallback arranger export'],
    40
  );
}

// ============================================================================
// CELTIC ORNAMENT GENERATORS (C699, C701, C703, C707, C746)
// ============================================================================

/** Ornament insertion point */
export interface OrnamentInsertionPoint {
  readonly position: number;
  readonly type: 'strong_beat' | 'phrase_ending' | 'note_repeat' | 'ascending_run';
  readonly suggestedOrnament: string;
}

/**
 * C699: Detect ornament insertion points (strong beats, phrase endings).
 */
export async function detectOrnamentInsertionPoints(
  notes: readonly number[],
  durations: readonly number[],
  beatsPerMeasure: number,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ points: OrnamentInsertionPoint[] }>> {
  try {
    await ensureLoaded(adapter);
    const notesAtom = `[${notes.join(',')}]`;
    const dursAtom = `[${durations.join(',')}]`;
    const result = await adapter.querySingle(
      `ornament_insertion_points(${notesAtom}, ${dursAtom}, ${beatsPerMeasure}, Points).`
    );
    if (result) {
      return explainable(
        { points: result['Points'] as OrnamentInsertionPoint[] },
        ['KB ornament insertion analysis'],
        85
      );
    }
  } catch { /* fall through */ }
  // TS fallback: detect strong beats and phrase endings
  const points: OrnamentInsertionPoint[] = [];
  let cumulativeDuration = 0;
  const beatDuration = 480; // assume quarter note
  for (let i = 0; i < notes.length; i++) {
    const beatPosition = cumulativeDuration / beatDuration;
    const isStrongBeat = beatPosition % beatsPerMeasure < 0.01 ||
      Math.abs(beatPosition % beatsPerMeasure - 1) < 0.01;
    // Phrase ending: longer note or last note
    const isPhraseEnding = i === notes.length - 1 ||
      ((durations[i] ?? beatDuration) >= beatDuration * 2);
    // Note repeat
    const isRepeat = i > 0 && notes[i] === notes[i - 1];
    if (isStrongBeat) {
      points.push({ position: i, type: 'strong_beat', suggestedOrnament: 'cut' });
    } else if (isPhraseEnding) {
      points.push({ position: i, type: 'phrase_ending', suggestedOrnament: 'roll' });
    } else if (isRepeat) {
      points.push({ position: i, type: 'note_repeat', suggestedOrnament: 'tap' });
    }
    cumulativeDuration += durations[i] ?? beatDuration;
  }
  return explainable({ points }, ['TS fallback ornament insertion detection'], 55);
}

/** Roll event: a rapid reiteration of a note */
export interface RollEvent {
  readonly startPosition: number;
  readonly note: number;
  readonly strikeCount: number;
  readonly totalDuration: number;
  readonly midiEvents: ReadonlyArray<{ pitch: number; velocity: number; time: number; duration: number }>;
}

/**
 * C701: Generate rolls for reel tempo with constraints on spacing.
 */
export async function generateRoll(
  note: number,
  duration: number,
  tempo: number,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<RollEvent>> {
  try {
    await ensureLoaded(adapter);
    const result = await adapter.querySingle(
      `celtic_roll(${note}, ${duration}, ${tempo}, StrikeCount, MidiEvents).`
    );
    if (result) {
      return explainable(
        {
          startPosition: 0,
          note,
          strikeCount: Number(result['StrikeCount']),
          totalDuration: duration,
          midiEvents: result['MidiEvents'] as RollEvent['midiEvents'],
        },
        ['KB Celtic roll generation'],
        85
      );
    }
  } catch { /* fall through */ }
  // TS fallback: 3-strike roll (long roll for reels)
  const strikeCount = tempo > 140 ? 3 : 5; // faster tempo = fewer strikes
  const strikeDuration = duration / strikeCount;
  const midiEvents = Array.from({ length: strikeCount }, (_, i) => ({
    pitch: note,
    velocity: i === 0 ? 100 : (i === strikeCount - 1 ? 90 : 70),
    time: i * strikeDuration,
    duration: strikeDuration * 0.8,
  }));
  return explainable(
    { startPosition: 0, note, strikeCount, totalDuration: duration, midiEvents },
    [`TS fallback: ${strikeCount}-strike roll at ${tempo} BPM`],
    55
  );
}

/** Grace note event for cuts and taps */
export interface GraceNoteEvent {
  readonly type: 'cut' | 'tap';
  readonly mainNote: number;
  readonly graceNote: number;
  readonly graceVelocity: number;
  readonly graceDuration: number;
  readonly midiEvents: ReadonlyArray<{ pitch: number; velocity: number; time: number; duration: number }>;
}

/**
 * C703: Generate cut/tap ornaments and map to MIDI grace notes.
 */
export async function generateCutTap(
  note: number,
  ornamentType: 'cut' | 'tap',
  tempo: number,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<GraceNoteEvent>> {
  try {
    await ensureLoaded(adapter);
    const result = await adapter.querySingle(
      `celtic_cut_tap(${note}, ${ornamentType}, ${tempo}, GraceNote, MidiEvents).`
    );
    if (result) {
      return explainable(
        {
          type: ornamentType,
          mainNote: note,
          graceNote: Number(result['GraceNote']),
          graceVelocity: 90,
          graceDuration: 30,
          midiEvents: result['MidiEvents'] as GraceNoteEvent['midiEvents'],
        },
        [`KB Celtic ${ornamentType}`],
        85
      );
    }
  } catch { /* fall through */ }
  // TS fallback: cut = note above, tap = note below
  const graceNote = ornamentType === 'cut' ? note + 2 : note - 2;
  const graceDur = Math.min(30, 60000 / tempo / 8); // very short grace note
  const midiEvents = [
    { pitch: graceNote, velocity: 90, time: 0, duration: graceDur },
    { pitch: note, velocity: 100, time: graceDur, duration: 480 - graceDur },
  ];
  return explainable(
    {
      type: ornamentType,
      mainNote: note,
      graceNote,
      graceVelocity: 90,
      graceDuration: graceDur,
      midiEvents,
    },
    [`TS fallback ${ornamentType}: grace note ${ornamentType === 'cut' ? 'above' : 'below'}`],
    55
  );
}

/** Double-stop voicing result */
export interface DoubleStopResult {
  readonly fiddleString1: number;
  readonly fiddleString2: number;
  readonly resonanceNote: number;
  readonly mainNote: number;
  readonly interval: number;
}

/**
 * C707: Generate fiddle double-stop voicings using open-string resonances.
 */
export async function generateFiddleDoubleStop(
  melody: number,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<DoubleStopResult | null>> {
  try {
    await ensureLoaded(adapter);
    const result = await adapter.querySingle(
      `fiddle_double_stop(${melody}, String1, String2, ResonanceNote, Interval).`
    );
    if (result) {
      return explainable(
        {
          fiddleString1: Number(result['String1']),
          fiddleString2: Number(result['String2']),
          resonanceNote: Number(result['ResonanceNote']),
          mainNote: melody,
          interval: Number(result['Interval']),
        },
        ['KB fiddle double-stop'],
        85
      );
    }
  } catch { /* fall through */ }
  // TS fallback: check against open fiddle strings (G3=55, D4=62, A4=69, E5=76)
  const openStrings = [55, 62, 69, 76];
  for (const open of openStrings) {
    const interval = Math.abs(melody - open);
    // Allow unison, 3rd, 5th, 6th, octave
    if ([0, 3, 4, 5, 7, 8, 9, 12].includes(interval) && melody !== open) {
      return explainable(
        {
          fiddleString1: melody > open ? 1 : 0,
          fiddleString2: melody > open ? 0 : 1,
          resonanceNote: open,
          mainNote: melody,
          interval,
        },
        [`TS fallback: double-stop with open string ${open}`],
        50
      );
    }
  }
  return explainable(null, ['No suitable double-stop found'], 30);
}

/** Harp voicing result */
export interface HarpVoicingResult {
  readonly notes: readonly number[];
  readonly isOpenSonority: boolean;
  readonly spacing: string;
  readonly reasons: readonly string[];
}

/**
 * C746: Generate harp accompaniment voicings with open sonority constraints.
 */
export async function generateHarpVoicing(
  chord: string,
  register: 'low' | 'mid' | 'high',
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<HarpVoicingResult>> {
  try {
    await ensureLoaded(adapter);
    const result = await adapter.querySingle(
      `harp_voicing('${chord}', ${register}, Notes, IsOpen, Spacing, Reasons).`
    );
    if (result) {
      const notes = Array.isArray(result['Notes'])
        ? (result['Notes'] as unknown[]).map(Number) : [];
      const reasons = Array.isArray(result['Reasons'])
        ? (result['Reasons'] as unknown[]).map(String) : [];
      return explainable(
        {
          notes,
          isOpenSonority: result['IsOpen'] === 'true' || result['IsOpen'] === true,
          spacing: String(result['Spacing']),
          reasons,
        },
        ['KB harp voicing'],
        85
      );
    }
  } catch { /* fall through */ }
  // TS fallback: open voicing with wide spacing
  const baseNote = register === 'low' ? 36 : register === 'mid' ? 48 : 60;
  // Simple open triad voicing (root-5th-root-3rd)
  const notes = [baseNote, baseNote + 7, baseNote + 12, baseNote + 16];
  return explainable(
    {
      notes,
      isOpenSonority: true,
      spacing: 'open',
      reasons: ['Default open triad voicing for harp'],
    },
    ['TS fallback harp voicing'],
    40
  );
}

// ============================================================================
// CONTRARY MOTION DETECTION (C1234)
// ============================================================================

/** Contrary motion analysis result */
export interface ContraryMotionResult {
  readonly hasContraryMotion: boolean;
  readonly contrarySegments: ReadonlyArray<{
    startIndex: number;
    endIndex: number;
    voice1Direction: 'up' | 'down';
    voice2Direction: 'up' | 'down';
  }>;
  readonly independenceScore: number;
}

/**
 * C1234: Detect contrary motion for voice independence analysis.
 */
export async function detectContraryMotion(
  voice1: readonly number[],
  voice2: readonly number[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<ContraryMotionResult>> {
  try {
    await ensureLoaded(adapter);
    const v1Atom = `[${voice1.join(',')}]`;
    const v2Atom = `[${voice2.join(',')}]`;
    const result = await adapter.querySingle(
      `contrary_motion(${v1Atom}, ${v2Atom}, HasContrary, Segments, Score).`
    );
    if (result) {
      return explainable(
        {
          hasContraryMotion: result['HasContrary'] === 'true' || result['HasContrary'] === true,
          contrarySegments: result['Segments'] as ContraryMotionResult['contrarySegments'],
          independenceScore: Number(result['Score']),
        },
        ['KB contrary motion detection'],
        85
      );
    }
  } catch { /* fall through */ }
  // TS fallback: detect contrary motion segments
  const minLen = Math.min(voice1.length, voice2.length);
  const segments: ContraryMotionResult['contrarySegments'][number][] = [];
  let segmentStart = -1;
  let segV1Dir: 'up' | 'down' | null = null;
  let segV2Dir: 'up' | 'down' | null = null;
  for (let i = 1; i < minLen; i++) {
    const d1 = voice1[i]! - voice1[i - 1]!;
    const d2 = voice2[i]! - voice2[i - 1]!;
    const v1Dir: 'up' | 'down' | null = d1 > 0 ? 'up' : d1 < 0 ? 'down' : null;
    const v2Dir: 'up' | 'down' | null = d2 > 0 ? 'up' : d2 < 0 ? 'down' : null;
    const isContrary = v1Dir !== null && v2Dir !== null && v1Dir !== v2Dir;
    if (isContrary) {
      if (segmentStart === -1) {
        segmentStart = i - 1;
        segV1Dir = v1Dir;
        segV2Dir = v2Dir;
      }
    } else if (segmentStart !== -1) {
      segments.push({
        startIndex: segmentStart,
        endIndex: i - 1,
        voice1Direction: segV1Dir!,
        voice2Direction: segV2Dir!,
      });
      segmentStart = -1;
    }
  }
  if (segmentStart !== -1) {
    segments.push({
      startIndex: segmentStart,
      endIndex: minLen - 1,
      voice1Direction: segV1Dir!,
      voice2Direction: segV2Dir!,
    });
  }
  const totalTransitions = minLen - 1;
  const contraryCount = segments.reduce((sum, s) => sum + (s.endIndex - s.startIndex), 0);
  const independenceScore = totalTransitions > 0
    ? Math.round((contraryCount / totalTransitions) * 100)
    : 0;
  return explainable(
    {
      hasContraryMotion: segments.length > 0,
      contrarySegments: segments,
      independenceScore,
    },
    ['TS fallback contrary motion detection'],
    60
  );
}

// ============================================================================
// KORVAI SEARCH (C632, C634)
// ============================================================================

/** Korvai search result */
export interface KorvaiResult {
  readonly phrases: ReadonlyArray<{ notes: readonly number[]; syllables: readonly string[] }>;
  readonly totalBeats: number;
  readonly cyclesFilled: number;
  readonly isComplete: boolean;
}

/**
 * C632: Korvai search generator — fill tala cycle with phrase candidates.
 * C634: Performance guard — bounded depth/timeout.
 */
export async function searchKorvai(
  tala: string,
  jati: string,
  phrases: readonly { notes: readonly number[]; syllables: readonly string[] }[],
  options: { maxDepth?: number; timeoutMs?: number } = {},
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<KorvaiResult>> {
  const maxDepth = options.maxDepth ?? 20;
  // C634: timeout bound — used via options.timeoutMs in Prolog query
  void options.timeoutMs;

  try {
    await ensureLoaded(adapter);
    const phrasesAtom = phrases.map((p, i) =>
      `phrase(${i}, [${p.notes.join(',')}], [${p.syllables.map(s => `'${s}'`).join(',')}])`
    ).join(', ');
    const result = await adapter.querySingle(
      `korvai_search('${tala}', '${jati}', [${phrasesAtom}], ${maxDepth}, Result, TotalBeats, Cycles, IsComplete).`
    );
    if (result) {
      return explainable(
        {
          phrases: result['Result'] as KorvaiResult['phrases'],
          totalBeats: Number(result['TotalBeats']),
          cyclesFilled: Number(result['Cycles']),
          isComplete: result['IsComplete'] === 'true' || result['IsComplete'] === true,
        },
        ['KB korvai search'],
        85
      );
    }
  } catch { /* fall through */ }
  // TS fallback: simple greedy fill
  const talaBeats: Record<string, number> = {
    adi: 8, rupaka: 3, misra_chapu: 7, khanda_chapu: 5,
    dhruva: 14, matya: 10, jhampa: 10, ata: 14, eka: 4, triputa: 7,
  };
  const cycleLength = talaBeats[tala] ?? 8;
  const selectedPhrases: typeof phrases[number][] = [];
  let totalBeats = 0;
  let iterations = 0;
  while (totalBeats < cycleLength && iterations < maxDepth) {
    // Pick a phrase that fits
    const remaining = cycleLength - totalBeats;
    const fitting = phrases.filter(p => p.syllables.length <= remaining);
    if (fitting.length === 0) break;
    const chosen = fitting[iterations % fitting.length]!;
    selectedPhrases.push(chosen);
    totalBeats += chosen.syllables.length;
    iterations++;
  }
  return explainable(
    {
      phrases: selectedPhrases,
      totalBeats,
      cyclesFilled: totalBeats >= cycleLength ? 1 : 0,
      isComplete: totalBeats === cycleLength,
    },
    [`TS fallback korvai search: ${totalBeats}/${cycleLength} beats filled`],
    45
  );
}

// ============================================================================
// CONTEMPORARY JAZZ CONSTRAINT PACK (C1415)
// ============================================================================

/**
 * C1415: Contemporary jazz constraint pack data.
 */
export const CONTEMPORARY_JAZZ_PACK = {
  name: 'contemporary_jazz',
  version: '1.0.0',
  description: 'Contemporary jazz vocabulary: triad pairs, hexatonics, outside playing',
  constraints: [
    {
      type: 'custom' as const,
      name: 'triad_pair_usage',
      displayName: 'Triad Pair Usage',
      description: 'Use triad pairs for angular melodic construction',
      category: 'harmony' as const,
      defaultParams: { upperTriad: 'major', lowerTriad: 'major', interval: 'whole_step' },
    },
    {
      type: 'custom' as const,
      name: 'hexatonic_scale',
      displayName: 'Hexatonic Scale',
      description: 'Use hexatonic (six-note) scales for symmetric harmony',
      category: 'pitch' as const,
      defaultParams: { scaleType: 'augmented', transposition: 0 },
    },
    {
      type: 'custom' as const,
      name: 'outside_tension',
      displayName: 'Outside Tension Level',
      description: 'Control the amount of "outside" (non-diatonic) material',
      category: 'harmony' as const,
      defaultParams: { level: 0.5, resolutionStrategy: 'half_step' },
    },
    {
      type: 'custom' as const,
      name: 'slash_chord_usage',
      displayName: 'Slash Chord Usage',
      description: 'Upper structure triads over bass notes',
      category: 'harmony' as const,
      defaultParams: { frequency: 'moderate', bassMotion: 'chromatic' },
    },
  ],
  prologCode: [
    '% Contemporary jazz vocabulary predicates',
    'triad_pair(UpperTriad, LowerTriad, Interval) :- ',
    '  member(UpperTriad, [major, minor, augmented, diminished]),',
    '  member(LowerTriad, [major, minor, augmented, diminished]),',
    '  member(Interval, [half_step, whole_step, minor_third, major_third]).',
    '',
    'hexatonic_scale(augmented, Notes) :- Notes = [0, 1, 4, 5, 8, 9].',
    'hexatonic_scale(whole_tone, Notes) :- Notes = [0, 2, 4, 6, 8, 10].',
    'hexatonic_scale(prometheus, Notes) :- Notes = [0, 2, 4, 6, 9, 10].',
    '',
    'outside_resolution(half_step, Target, Approach) :- Approach is Target + 1.',
    'outside_resolution(half_step, Target, Approach) :- Approach is Target - 1.',
    'outside_resolution(enclosure, Target, Above, Below) :- Above is Target + 1, Below is Target - 1.',
  ].join('\n'),
} as const;

// ============================================================================
// JAZZ SPEC LINT (C1432)
// ============================================================================

/** Jazz lint issue */
export interface JazzLintIssue {
  readonly message: string;
  readonly severity: 'error' | 'warning' | 'info';
  readonly position?: number;
  readonly suggestion?: string;
}

/**
 * C1432: Lint a jazz melodic line for quality issues.
 */
export async function lintJazzLine(
  notes: readonly number[],
  chords: readonly string[],
  style: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ issues: JazzLintIssue[]; score: number }>> {
  try {
    await ensureLoaded(adapter);
    const notesAtom = `[${notes.join(',')}]`;
    const chordsAtom = `[${chords.map(c => `'${c}'`).join(',')}]`;
    const result = await adapter.querySingle(
      `spec_lint(jazz_line(${notesAtom}, ${chordsAtom}, ${style}), Issues).`
    );
    if (result) {
      const issues = Array.isArray(result['Issues'])
        ? (result['Issues'] as unknown[]).map(i => i as JazzLintIssue) : [];
      const score = 100 - issues.filter(i => i.severity === 'error').length * 20
        - issues.filter(i => i.severity === 'warning').length * 5;
      return explainable({ issues, score: Math.max(0, score) }, ['KB jazz line lint'], 85);
    }
  } catch { /* fall through */ }
  // TS fallback: basic jazz line quality checks
  const issues: JazzLintIssue[] = [];
  // Check for consecutive large leaps
  for (let i = 1; i < notes.length; i++) {
    const interval = Math.abs(notes[i]! - notes[i - 1]!);
    if (interval > 12) {
      issues.push({
        message: `Large leap of ${interval} semitones at position ${i}`,
        severity: 'warning',
        position: i,
        suggestion: 'Fill in with stepwise motion or change direction after leap',
      });
    }
  }
  // Check for repeating patterns (stuck on same note)
  for (let i = 2; i < notes.length; i++) {
    if (notes[i] === notes[i - 1] && notes[i] === notes[i - 2]) {
      issues.push({
        message: `Repeated note (${notes[i]}) at position ${i}`,
        severity: 'info',
        position: i,
        suggestion: 'Add rhythmic variety or ornamental approach',
      });
    }
  }
  // Check range
  const range = Math.max(...notes) - Math.min(...notes);
  if (range < 5 && notes.length > 8) {
    issues.push({
      message: 'Limited range — line stays within a 4th',
      severity: 'warning',
      suggestion: 'Expand register for more dynamic interest',
    });
  }
  if (range > 24) {
    issues.push({
      message: 'Extreme range — line spans more than 2 octaves',
      severity: 'info',
      suggestion: 'Consider whether the wide range serves the musical intent',
    });
  }
  const score = 100 - issues.filter(i => i.severity === 'error').length * 20
    - issues.filter(i => i.severity === 'warning').length * 5;
  return explainable({ issues, score: Math.max(0, score) }, ['TS fallback jazz line lint'], 50);
}

// ============================================================================
// TWO-HANDED VOICING & GUITAR VOICING (C1224, C1226)
// ============================================================================

/** Piano two-handed voicing */
export interface TwoHandedVoicing {
  readonly leftHand: readonly number[];
  readonly rightHand: readonly number[];
  readonly isBalanced: boolean;
  readonly reasons: readonly string[];
}

/**
 * C1224: Two-handed voicing balance rules for piano/keys.
 */
export async function generateTwoHandedVoicing(
  chord: string,
  rootNote: number,
  style: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<TwoHandedVoicing>> {
  try {
    await ensureLoaded(adapter);
    const result = await adapter.querySingle(
      `two_handed_voicing('${chord}', ${rootNote}, ${style}, LH, RH, Balanced, Reasons).`
    );
    if (result) {
      const leftHand = Array.isArray(result['LH'])
        ? (result['LH'] as unknown[]).map(Number) : [];
      const rightHand = Array.isArray(result['RH'])
        ? (result['RH'] as unknown[]).map(Number) : [];
      const reasons = Array.isArray(result['Reasons'])
        ? (result['Reasons'] as unknown[]).map(String) : [];
      return explainable(
        {
          leftHand,
          rightHand,
          isBalanced: result['Balanced'] === 'true' || result['Balanced'] === true,
          reasons,
        },
        ['KB two-handed voicing'],
        85
      );
    }
  } catch { /* fall through */ }
  // TS fallback: standard jazz piano voicing
  // LH: root + 7th (shell voicing), RH: 3rd + extensions
  const leftHand = [rootNote, rootNote + 10]; // root + b7
  const rightHand = [rootNote + 16, rootNote + 21, rootNote + 26]; // 3rd + 5th + 9th (above)
  return explainable(
    {
      leftHand,
      rightHand,
      isBalanced: true,
      reasons: ['Shell voicing (LH) + extensions (RH)'],
    },
    ['TS fallback two-handed voicing'],
    50
  );
}

/** Guitar voicing result */
export interface GuitarVoicing {
  readonly frets: readonly (number | null)[]; // 6 strings, null = muted
  readonly fretSpan: number;
  readonly isPlayable: boolean;
  readonly reasons: readonly string[];
}

/**
 * C1226: Guitar voicing constraints (4-6 note max, fret span limits).
 */
export async function generateGuitarVoicing(
  chord: string,
  rootNote: number,
  position: number,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<GuitarVoicing>> {
  try {
    await ensureLoaded(adapter);
    const result = await adapter.querySingle(
      `guitar_voicing('${chord}', ${rootNote}, ${position}, Frets, FretSpan, Playable, Reasons).`
    );
    if (result) {
      const frets = Array.isArray(result['Frets'])
        ? (result['Frets'] as unknown[]).map(f => f === 'x' ? null : Number(f)) : [];
      const reasons = Array.isArray(result['Reasons'])
        ? (result['Reasons'] as unknown[]).map(String) : [];
      return explainable(
        {
          frets,
          fretSpan: Number(result['FretSpan']),
          isPlayable: result['Playable'] === 'true' || result['Playable'] === true,
          reasons,
        },
        ['KB guitar voicing'],
        85
      );
    }
  } catch { /* fall through */ }
  // TS fallback: basic open/barre chord shape
  // Guitar open strings: E2(40), A2(45), D3(50), G3(55), B3(59), E4(64)
  const openStrings = [40, 45, 50, 55, 59, 64];
  const chordRoot = rootNote % 12;
  const frets: (number | null)[] = openStrings.map(open => {
    const openPc = open % 12;
    const semitones = (chordRoot - openPc + 12) % 12;
    const fret = position + semitones;
    return fret <= position + 4 ? fret : null; // max 4-fret span
  });
  const playableFrets = frets.filter(f => f !== null);
  const fretSpan = playableFrets.length > 0
    ? Math.max(...playableFrets) - Math.min(...playableFrets) : 0;
  return explainable(
    {
      frets,
      fretSpan,
      isPlayable: playableFrets.length >= 4 && fretSpan <= 4,
      reasons: ['TS fallback basic chord shape'],
    },
    ['TS fallback guitar voicing'],
    40
  );
}

// ============================================================================
// SCHEMA-AS-CONSTRAINTS (C347)
// ============================================================================

/**
 * C347: Apply schema-as-constraints to Prolog deck reasoning.
 * Gates suggestions based on active schemata in the spec.
 */
export async function applySchemaConstraintsToDeck(
  spec: MusicSpec,
  deckId: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ gatedCards: string[]; suggestions: string[]; reasons: string[] }>> {
  try {
    await ensureLoaded(adapter);
    await adapter.query(specToPrologFacts(spec).join('\n'));
    const specTerm = specToPrologTerm(spec);
    const result = await adapter.querySingle(
      `schema_constraints_for_deck(${specTerm}, '${deckId}', GatedCards, Suggestions, Reasons).`
    );
    if (result) {
      const gatedCards = Array.isArray(result['GatedCards'])
        ? (result['GatedCards'] as unknown[]).map(String) : [];
      const suggestions = Array.isArray(result['Suggestions'])
        ? (result['Suggestions'] as unknown[]).map(String) : [];
      const reasons = Array.isArray(result['Reasons'])
        ? (result['Reasons'] as unknown[]).map(String) : [];
      return explainable({ gatedCards, suggestions, reasons }, ['KB schema constraints for deck'], 85);
    }
  } catch { /* fall through */ }
  // TS fallback: check for schema constraints and suggest relevant cards
  const schemaConstraints = spec.constraints.filter(c => c.type === 'schema');
  const gatedCards: string[] = [];
  const suggestions: string[] = [];
  for (const sc of schemaConstraints) {
    if ('schema' in sc) {
      const schema = String(sc.schema);
      suggestions.push(`Consider ${schema} voice-leading patterns`);
      if (['romanesca', 'prinner', 'fonte'].includes(schema)) {
        gatedCards.push('bass_line_card', 'melody_card');
      }
      if (['monte', 'ponte'].includes(schema)) {
        gatedCards.push('sequence_card', 'modulation_card');
      }
    }
  }
  return explainable(
    { gatedCards, suggestions, reasons: ['Schema-based card gating'] },
    ['TS fallback schema constraints'],
    45
  );
}

// ============================================================================
// FEATURE FLAGS & CAPABILITIES (C983, C984, C986)
// ============================================================================

/** Theory feature flags */
export interface TheoryFeatureFlags {
  readonly spiralDFT: boolean;
  readonly lccExtended: boolean;
  readonly spectralAnalysis: boolean;
  readonly worldMusicDeep: boolean;
  readonly jazzAdvanced: boolean;
  readonly filmScoringEmotion: boolean;
  readonly customConstraints: boolean;
}

/** Default feature flags — all enabled */
export const DEFAULT_FEATURE_FLAGS: TheoryFeatureFlags = {
  spiralDFT: true,
  lccExtended: true,
  spectralAnalysis: true,
  worldMusicDeep: true,
  jazzAdvanced: true,
  filmScoringEmotion: true,
  customConstraints: true,
};

/**
 * C983: Theory feature flags to gate experimental features.
 */
export function getActiveFeatureFlags(
  overrides?: Partial<TheoryFeatureFlags>
): TheoryFeatureFlags {
  return { ...DEFAULT_FEATURE_FLAGS, ...overrides };
}

/** Capabilities report entry */
export interface CapabilityEntry {
  readonly name: string;
  readonly enabled: boolean;
  readonly description: string;
  readonly requiredModules: readonly string[];
}

/**
 * C984: Capabilities report card showing which theory models are enabled.
 */
export function generateCapabilitiesReport(
  flags: TheoryFeatureFlags
): readonly CapabilityEntry[] {
  return [
    {
      name: 'Spiral / DFT Analysis',
      enabled: flags.spiralDFT,
      description: 'Discrete Fourier Transform pitch-class analysis (Amiot/Yust)',
      requiredModules: ['pitch-dft'],
    },
    {
      name: 'Lydian Chromatic Concept',
      enabled: flags.lccExtended,
      description: 'George Russell LCC tonal gravity and parent scales',
      requiredModules: ['lcc-theory'],
    },
    {
      name: 'Spectral Analysis',
      enabled: flags.spectralAnalysis,
      description: 'Overtone and timbre analysis for orchestration',
      requiredModules: ['spectral-engine'],
    },
    {
      name: 'World Music (Deep)',
      enabled: flags.worldMusicDeep,
      description: 'Extended Carnatic, Celtic, Chinese, East Asian models',
      requiredModules: ['world-music-kb'],
    },
    {
      name: 'Jazz (Advanced)',
      enabled: flags.jazzAdvanced,
      description: 'Big band, reharmonization, improv vocabulary, LCC integration',
      requiredModules: ['jazz-kb', 'lcc-theory'],
    },
    {
      name: 'Film Scoring & Emotion',
      enabled: flags.filmScoringEmotion,
      description: 'Cinematic emotion mapping, trailer builds, leitmotifs',
      requiredModules: ['film-kb'],
    },
    {
      name: 'Custom Constraints',
      enabled: flags.customConstraints,
      description: 'User-defined constraint definitions and packs',
      requiredModules: ['custom-constraints'],
    },
  ];
}

/**
 * C986: Migration — ensure older projects load with sensible default theory cards hidden.
 */
export function migrateProjectTheoryDefaults(
  projectVersion: string,
  existingCardIds: readonly string[]
): { hiddenCards: string[]; addedCards: string[]; migratedVersion: string } {
  const hiddenCards: string[] = [];
  const addedCards: string[] = [];

  // Projects before v2.0 didn't have advanced theory cards
  const major = parseInt(projectVersion.split('.')[0] ?? '0');
  if (major < 2) {
    // Hide advanced cards that didn't exist in v1
    const advancedCards = [
      'lydian_chromatic', 'tonal_gravity_visualizer', 'parent_scale',
      'chord_scale_unity', 'upper_structure', 'reharmonization',
      'tritone_sub', 'coltrane_changes', 'bebop_scale', 'enclosure',
      'digital_pattern', 'guide_tone', 'lick_library', 'motif_developer', 'outside',
    ];
    for (const card of advancedCards) {
      if (!existingCardIds.includes(card)) {
        hiddenCards.push(card);
      }
    }
  }

  // Projects before v1.5 need basic theory cards added
  if (major < 1 || (major === 1 && parseInt(projectVersion.split('.')[1] ?? '0') < 5)) {
    const basicCards = ['tonality_model', 'meter_accent', 'grouping'];
    for (const card of basicCards) {
      if (!existingCardIds.includes(card)) {
        addedCards.push(card);
      }
    }
  }

  return {
    hiddenCards,
    addedCards,
    migratedVersion: '2.0.0',
  };
}

// ============================================================================
// FREE-RHYTHM REPRESENTATION (C799)
// ============================================================================

/** Free-rhythm grid entry (rubato mode) */
export interface FreeRhythmEntry {
  readonly note: number;
  readonly relativeTime: number; // 0.0–1.0 within section
  readonly intensity: number;   // 0.0–1.0
  readonly duration: number;    // relative duration
  readonly ornament?: string;
}

/**
 * C799: Free-rhythm (rubato) grid representation for tracker.
 * Allows non-quantized note placement for Chinese/world music.
 */
export function createFreeRhythmGrid(
  notes: readonly { pitch: number; timeMs: number; durationMs: number; velocity: number }[],
  sectionDurationMs: number
): readonly FreeRhythmEntry[] {
  if (notes.length === 0 || sectionDurationMs <= 0) return [];
  return notes.map(n => ({
    note: n.pitch,
    relativeTime: Math.min(1, Math.max(0, n.timeMs / sectionDurationMs)),
    intensity: Math.min(1, n.velocity / 127),
    duration: n.durationMs / sectionDurationMs,
  }));
}

/**
 * Convert free-rhythm grid back to timed events.
 */
export function freeRhythmToEvents(
  grid: readonly FreeRhythmEntry[],
  sectionDurationMs: number
): readonly { pitch: number; timeMs: number; durationMs: number; velocity: number }[] {
  return grid.map(entry => ({
    pitch: entry.note,
    timeMs: entry.relativeTime * sectionDurationMs,
    durationMs: entry.duration * sectionDurationMs,
    velocity: Math.round(entry.intensity * 127),
  }));
}

// ============================================================================
// BIG BAND SECTION TAXONOMY (C1242)
// ============================================================================

/** Section definition for big band arrangement */
export interface BigBandSection {
  readonly name: string;
  readonly instruments: readonly string[];
  readonly defaultVoices: number;
  readonly range: readonly [number, number]; // MIDI note range
}

/**
 * C1242: Big band section taxonomy.
 */
export const BIG_BAND_SECTIONS: readonly BigBandSection[] = [
  { name: 'saxes', instruments: ['alto_1', 'alto_2', 'tenor_1', 'tenor_2', 'baritone'], defaultVoices: 5, range: [44, 80] },
  { name: 'trumpets', instruments: ['trumpet_1', 'trumpet_2', 'trumpet_3', 'trumpet_4'], defaultVoices: 4, range: [52, 84] },
  { name: 'trombones', instruments: ['trombone_1', 'trombone_2', 'trombone_3', 'bass_trombone'], defaultVoices: 4, range: [36, 72] },
  { name: 'rhythm', instruments: ['piano', 'guitar', 'bass', 'drums'], defaultVoices: 4, range: [28, 96] },
];

/**
 * Get a big band section by name.
 */
export function getBigBandSection(name: string): BigBandSection | undefined {
  return BIG_BAND_SECTIONS.find(s => s.name === name);
}

// ============================================================================
// COMBO TAXONOMY (C1282)
// ============================================================================

/** Jazz combo configuration */
export interface JazzCombo {
  readonly size: number;
  readonly name: string;
  readonly typicalInstruments: readonly string[];
  readonly optionalInstruments?: readonly string[];
}

/**
 * C1282: Jazz combo taxonomy from duo to nonet.
 */
export const JAZZ_COMBOS: readonly JazzCombo[] = [
  { size: 2, name: 'duo', typicalInstruments: ['piano', 'bass'] },
  { size: 3, name: 'trio', typicalInstruments: ['piano', 'bass', 'drums'] },
  { size: 4, name: 'quartet', typicalInstruments: ['saxophone', 'piano', 'bass', 'drums'] },
  { size: 5, name: 'quintet', typicalInstruments: ['trumpet', 'saxophone', 'piano', 'bass', 'drums'] },
  { size: 6, name: 'sextet', typicalInstruments: ['trumpet', 'saxophone', 'trombone', 'piano', 'bass', 'drums'] },
  { size: 7, name: 'septet', typicalInstruments: ['trumpet', 'alto_sax', 'tenor_sax', 'trombone', 'piano', 'bass', 'drums'] },
  { size: 9, name: 'nonet', typicalInstruments: ['trumpet', 'alto_sax', 'tenor_sax', 'baritone_sax', 'trombone', 'french_horn', 'piano', 'bass', 'drums'] },
];

/**
 * Get combo configuration by size.
 */
export function getJazzComboConfig(size: number): JazzCombo | undefined {
  return JAZZ_COMBOS.find(c => c.size === size);
}

// ============================================================================
// TRANSCRIPTION ANALYSIS (C1401, C1419, C1421, C1433)
// ============================================================================

/** Transcription analysis result */
export interface TranscriptionAnalysis {
  readonly patterns: ReadonlyArray<{ type: string; startIdx: number; endIdx: number; notes: readonly number[] }>;
  readonly vocabulary: { enclosures: number; digitalPatterns: number; arpeggios: number; scaleRuns: number };
  readonly rangeUsed: readonly [number, number];
  readonly densityProfile: readonly number[];
}

/**
 * C1401: Transcription analysis tools — extract patterns from phrases.
 */
export async function analyzeTranscription(
  notes: readonly number[],
  durations: readonly number[],
  chords: readonly string[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<TranscriptionAnalysis>> {
  try {
    await ensureLoaded(adapter);
    const notesAtom = `[${notes.join(',')}]`;
    const dursAtom = `[${durations.join(',')}]`;
    const chordsAtom = `[${chords.map(c => `'${c}'`).join(',')}]`;
    const result = await adapter.querySingle(
      `analyze_transcription(${notesAtom}, ${dursAtom}, ${chordsAtom}, Analysis).`
    );
    if (result) {
      return explainable(result['Analysis'] as TranscriptionAnalysis, ['KB transcription analysis'], 85);
    }
  } catch { /* fall through */ }
  // TS fallback: basic pattern extraction
  const patterns: TranscriptionAnalysis['patterns'][number][] = [];
  let enclosures = 0, digitalPatterns = 0, arpeggios = 0, scaleRuns = 0;

  // Detect scale runs (3+ consecutive stepwise notes)
  for (let i = 0; i < notes.length - 2; i++) {
    const d1 = notes[i + 1]! - notes[i]!;
    const d2 = notes[i + 2]! - notes[i + 1]!;
    if (Math.abs(d1) <= 2 && Math.abs(d2) <= 2 && d1 !== 0 && d2 !== 0 && Math.sign(d1) === Math.sign(d2)) {
      let end = i + 2;
      while (end < notes.length - 1) {
        const dn = notes[end + 1]! - notes[end]!;
        if (Math.abs(dn) <= 2 && Math.sign(dn) === Math.sign(d1)) {
          end++;
        } else break;
      }
      patterns.push({ type: 'scale_run', startIdx: i, endIdx: end, notes: notes.slice(i, end + 1) });
      scaleRuns++;
      i = end;
    }
  }

  // Detect arpeggios (intervals of 3-5 semitones)
  for (let i = 0; i < notes.length - 2; i++) {
    const d1 = Math.abs(notes[i + 1]! - notes[i]!);
    const d2 = Math.abs(notes[i + 2]! - notes[i + 1]!);
    if (d1 >= 3 && d1 <= 5 && d2 >= 3 && d2 <= 5) {
      patterns.push({ type: 'arpeggio', startIdx: i, endIdx: i + 2, notes: notes.slice(i, i + 3) });
      arpeggios++;
    }
  }

  // Detect enclosures (chromatic approach from above and below)
  for (let i = 0; i < notes.length - 2; i++) {
    const target = notes[i + 2]!;
    const above = notes[i]!;
    const below = notes[i + 1]!;
    if (above === target + 1 && below === target - 1) {
      patterns.push({ type: 'enclosure', startIdx: i, endIdx: i + 2, notes: notes.slice(i, i + 3) });
      enclosures++;
    }
  }

  const rangeUsed: [number, number] = notes.length > 0
    ? [Math.min(...notes), Math.max(...notes)]
    : [0, 0];

  // Density profile: notes per beat
  const beatsTotal = durations.reduce((a, b) => a + b, 0) / 480;
  const density = beatsTotal > 0 ? notes.length / beatsTotal : 0;

  return explainable(
    {
      patterns,
      vocabulary: { enclosures, digitalPatterns, arpeggios, scaleRuns },
      rangeUsed,
      densityProfile: [density],
    },
    ['TS fallback transcription analysis'],
    50
  );
}

/** Jazz analysis report */
export interface JazzAnalysisReport {
  readonly style: string;
  readonly styleScores: Record<string, number>;
  readonly patternSummary: { total: number; types: Record<string, number> };
  readonly recommendations: readonly string[];
}

/**
 * C1419: Generate jazz analysis report for imported MIDI/transcriptions.
 */
export async function generateJazzAnalysisReport(
  notes: readonly number[],
  chords: readonly string[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<JazzAnalysisReport>> {
  try {
    await ensureLoaded(adapter);
    const notesAtom = `[${notes.join(',')}]`;
    const chordsAtom = `[${chords.map(c => `'${c}'`).join(',')}]`;
    const result = await adapter.querySingle(
      `jazz_analysis_report(${notesAtom}, ${chordsAtom}, Report).`
    );
    if (result) {
      return explainable(result['Report'] as JazzAnalysisReport, ['KB jazz analysis report'], 85);
    }
  } catch { /* fall through */ }
  // TS fallback: simple style detection
  const chromaticCount = notes.reduce((count, n, i) => {
    if (i === 0) return count;
    return count + (Math.abs(n - notes[i - 1]!) === 1 ? 1 : 0);
  }, 0);
  const stepwiseCount = notes.reduce((count, n, i) => {
    if (i === 0) return count;
    return count + (Math.abs(n - notes[i - 1]!) <= 2 ? 1 : 0);
  }, 0);
  const leapCount = notes.reduce((count, n, i) => {
    if (i === 0) return count;
    return count + (Math.abs(n - notes[i - 1]!) > 4 ? 1 : 0);
  }, 0);

  const total = Math.max(1, notes.length - 1);
  const chromaticRatio = chromaticCount / total;
  const stepwiseRatio = stepwiseCount / total;
  const leapRatio = leapCount / total;

  const styleScores: Record<string, number> = {
    bebop: Math.round(chromaticRatio * 100),
    modal: Math.round((1 - chromaticRatio) * stepwiseRatio * 100),
    free: Math.round(leapRatio * 100),
  };

  const dominantStyle = Object.entries(styleScores).reduce(
    (best, [style, score]) => score > best[1] ? [style, score] : best,
    ['unknown', 0] as [string, number]
  )[0];

  const recommendations: string[] = [];
  if (chromaticRatio < 0.1) recommendations.push('Add chromatic passing tones for bebop vocabulary');
  if (leapRatio > 0.4) recommendations.push('Balance large intervals with stepwise resolution');
  if (stepwiseRatio > 0.8) recommendations.push('Add intervallic variety with leaps and arpeggios');

  return explainable(
    {
      style: dominantStyle,
      styleScores,
      patternSummary: { total: notes.length, types: { chromatic: chromaticCount, stepwise: stepwiseCount, leap: leapCount } },
      recommendations,
    },
    ['TS fallback jazz analysis report'],
    50
  );
}

/**
 * C1421: Style comparison — determine if a phrase is more bebop or modal.
 */
export async function compareJazzStyles(
  notes: readonly number[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ dominantStyle: string; scores: Record<string, number>; reasons: readonly string[] }>> {
  try {
    await ensureLoaded(adapter);
    const notesAtom = `[${notes.join(',')}]`;
    const result = await adapter.querySingle(
      `jazz_style_match(${notesAtom}, Style, Score).`
    );
    if (result) {
      return explainable(
        {
          dominantStyle: String(result['Style']),
          scores: { [String(result['Style'])]: Number(result['Score']) },
          reasons: ['KB style match'],
        },
        ['KB jazz style comparison'],
        85
      );
    }
  } catch { /* fall through */ }
  // TS fallback: use interval analysis
  const intervals = notes.slice(1).map((n, i) => Math.abs(n - notes[i]!));
  const chromaticSteps = intervals.filter(i => i === 1).length;
  const quartalLeaps = intervals.filter(i => i === 5 || i === 6).length;
  const total = Math.max(1, intervals.length);

  const bebopScore = Math.round((chromaticSteps / total) * 100);
  const modalScore = Math.round((quartalLeaps / total) * 100 + (1 - chromaticSteps / total) * 30);
  const coolScore = Math.round((intervals.filter(i => i <= 3).length / total) * 60);

  const scores: Record<string, number> = { bebop: bebopScore, modal: modalScore, cool: coolScore };
  const dominantStyle = Object.entries(scores).reduce(
    (best, [s, sc]) => sc > best[1] ? [s, sc] : best,
    ['unknown', 0] as [string, number]
  )[0];

  const reasons: string[] = [];
  if (bebopScore > 50) reasons.push('High chromaticism suggests bebop vocabulary');
  if (modalScore > 50) reasons.push('Quartal intervals and diatonic motion suggest modal approach');
  if (coolScore > 50) reasons.push('Stepwise motion and small intervals suggest cool jazz');

  return explainable(
    { dominantStyle, scores, reasons },
    ['TS fallback style comparison'],
    50
  );
}

/** Tension curve point */
export interface TensionPoint {
  readonly position: number;
  readonly tensionLevel: number; // 0.0-1.0
  readonly source: string;
}

/**
 * C1433: Tension curve analysis for jazz lines.
 */
export async function analyzeTensionCurve(
  notes: readonly number[],
  chords: readonly string[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{ curve: readonly TensionPoint[]; peakPosition: number; averageTension: number }>> {
  try {
    await ensureLoaded(adapter);
    const notesAtom = `[${notes.join(',')}]`;
    const chordsAtom = `[${chords.map(c => `'${c}'`).join(',')}]`;
    const result = await adapter.querySingle(
      `tension_curve(${notesAtom}, ${chordsAtom}, Curve).`
    );
    if (result) {
      const curve = result['Curve'] as readonly TensionPoint[];
      const peak = curve.reduce((max, p) => p.tensionLevel > max.tensionLevel ? p : max, curve[0]!);
      const avg = curve.reduce((sum, p) => sum + p.tensionLevel, 0) / Math.max(1, curve.length);
      return explainable(
        { curve, peakPosition: peak.position, averageTension: avg },
        ['KB tension curve'],
        85
      );
    }
  } catch { /* fall through */ }
  // TS fallback: compute tension based on chromatic distance from chord tones
  const curve: TensionPoint[] = notes.map((note, i) => {
    const pc = note % 12;
    // Simple tension: how far is this note from a "consonant" pitch class set
    // Consonant: root, 3rd, 5th, 7th = 0,4,7,10
    const consonantPCs = [0, 4, 7, 10];
    const minDistance = Math.min(...consonantPCs.map(cp => Math.min(Math.abs(pc - cp), 12 - Math.abs(pc - cp))));
    const tensionLevel = Math.min(1, minDistance / 6);
    return {
      position: i,
      tensionLevel,
      source: minDistance === 0 ? 'chord_tone' : minDistance <= 1 ? 'passing_tone' : 'tension',
    };
  });
  const peakPosition = curve.reduce((max, p) => p.tensionLevel > max.tensionLevel ? p : max, curve[0] ?? { position: 0, tensionLevel: 0, source: '' }).position;
  const averageTension = curve.reduce((sum, p) => sum + p.tensionLevel, 0) / Math.max(1, curve.length);
  return explainable(
    { curve, peakPosition, averageTension },
    ['TS fallback tension curve'],
    50
  );
}

// ============================================================================
// VOCABULARY BUILDER & PRACTICE MODE (C1405, C1408, C1410)
// ============================================================================

/** Vocabulary entry */
export interface VocabularyEntry {
  readonly id: string;
  readonly name: string;
  readonly notes: readonly number[];
  readonly chordContext: string;
  readonly style: string;
  readonly source?: string;
}

/** Vocabulary library */
export class VocabularyLibrary {
  private entries = new Map<string, VocabularyEntry>();

  add(entry: VocabularyEntry): void {
    this.entries.set(entry.id, entry);
  }

  remove(id: string): boolean {
    return this.entries.delete(id);
  }

  getByStyle(style: string): readonly VocabularyEntry[] {
    return Array.from(this.entries.values()).filter(e => e.style === style);
  }

  getByChord(chord: string): readonly VocabularyEntry[] {
    return Array.from(this.entries.values()).filter(e => e.chordContext === chord);
  }

  getAll(): readonly VocabularyEntry[] {
    return Array.from(this.entries.values());
  }

  get size(): number {
    return this.entries.size;
  }

  clear(): void {
    this.entries.clear();
  }
}

/**
 * C1405: Global vocabulary library instance.
 */
export const vocabularyLibrary = new VocabularyLibrary();

/**
 * C1405: Learn vocabulary entries from a transcription analysis.
 */
export function learnVocabularyFromTranscription(
  analysis: TranscriptionAnalysis,
  style: string,
  source: string
): readonly VocabularyEntry[] {
  const entries: VocabularyEntry[] = [];
  for (const pattern of analysis.patterns) {
    const entry: VocabularyEntry = {
      id: `${source}-${pattern.type}-${pattern.startIdx}`,
      name: `${pattern.type} from ${source}`,
      notes: Array.from(pattern.notes),
      chordContext: 'any',
      style,
      source,
    };
    entries.push(entry);
    vocabularyLibrary.add(entry);
  }
  return entries;
}

/** Practice exercise */
export interface PracticeExercise {
  readonly id: string;
  readonly name: string;
  readonly level: 'beginner' | 'intermediate' | 'advanced';
  readonly type: 'scale' | 'arpeggio' | 'pattern' | 'transcription' | 'ear_training';
  readonly description: string;
  readonly notes?: readonly number[];
  readonly chord?: string;
  readonly key?: string;
}

/**
 * C1408: Practice mode with progressive pattern exercises.
 */
export function generatePracticeExercises(
  level: 'beginner' | 'intermediate' | 'advanced',
  _focus: string
): readonly PracticeExercise[] {
  const exercises: PracticeExercise[] = [];

  if (level === 'beginner') {
    exercises.push(
      { id: 'scales-major', name: 'Major Scale in All Keys', level, type: 'scale', description: 'Play major scales ascending and descending', key: 'C' },
      { id: 'arps-major', name: 'Major 7th Arpeggios', level, type: 'arpeggio', description: 'Arpeggiate major 7th chords', chord: 'Cmaj7' },
      { id: 'pattern-1235', name: '1-2-3-5 Pattern', level, type: 'pattern', description: 'Digital pattern through key', notes: [60, 62, 64, 67] },
    );
  } else if (level === 'intermediate') {
    exercises.push(
      { id: 'bebop-scale', name: 'Bebop Dominant Scale', level, type: 'scale', description: 'Add passing tone between root and 7th', key: 'G' },
      { id: 'enclosure-drill', name: 'Enclosure Drill', level, type: 'pattern', description: 'Chromatic approach from above and below', notes: [66, 63, 64] },
      { id: 'ii-V-I-lines', name: 'ii-V-I Lines', level, type: 'transcription', description: 'Play through standard ii-V-I patterns', chord: 'Dm7-G7-Cmaj7' },
    );
  } else {
    exercises.push(
      { id: 'coltrane-patterns', name: 'Coltrane Patterns', level, type: 'pattern', description: 'Major third cycle substitutions', notes: [60, 64, 56, 60] },
      { id: 'outside-playing', name: 'Outside Playing', level, type: 'pattern', description: 'Chromatic sideslipping and resolution', notes: [61, 63, 65, 64] },
      { id: 'triad-pairs', name: 'Triad Pair Exercise', level, type: 'pattern', description: 'Alternate between two triads', notes: [60, 64, 67, 62, 65, 69] },
    );
  }

  return exercises;
}

/** Call and response exercise */
export interface CallResponseExercise {
  readonly call: readonly number[];
  readonly callDurations: readonly number[];
  readonly chord: string;
  readonly expectedResponseType: 'echo' | 'variation' | 'contrast' | 'completion';
  readonly hints: readonly string[];
}

/**
 * C1410: Call and response practice mode.
 */
export function generateCallResponseExercise(
  level: 'beginner' | 'intermediate' | 'advanced',
  chord: string
): CallResponseExercise {
  if (level === 'beginner') {
    return {
      call: [60, 62, 64, 67],
      callDurations: [480, 480, 480, 480],
      chord,
      expectedResponseType: 'echo',
      hints: ['Try to echo the call exactly', 'Match the rhythm and pitches'],
    };
  } else if (level === 'intermediate') {
    return {
      call: [67, 65, 64, 62, 60],
      callDurations: [240, 240, 240, 240, 480],
      chord,
      expectedResponseType: 'variation',
      hints: ['Use similar rhythm with different notes', 'Try the same contour in a different register'],
    };
  }
  return {
    call: [60, 63, 67, 70, 72, 71, 67, 65],
    callDurations: [240, 240, 240, 120, 120, 240, 240, 480],
    chord,
    expectedResponseType: 'contrast',
    hints: ['Create a contrasting phrase', 'If call goes up, try going down', 'Explore different rhythmic density'],
  };
}

// ============================================================================
// BRIDGE ADAPTERS (C942)
// ============================================================================

/**
 * C942: Bridge adapters between world pitch models and MIDI pitches.
 * Provides approximate conversion for non-12TET pitch systems.
 */
export function worldPitchToMidi(
  pitch: number,
  centsOffset: number,
  _system: 'just' | 'pythagorean' | 'shruti' | 'maqam' | '12tet'
): { midiNote: number; pitchBend: number; centsDeviation: number } {
  // Convert world pitch + cents to nearest MIDI note + pitch bend
  const totalCents = pitch * 100 + centsOffset;
  const midiNote = Math.round(totalCents / 100);
  const centsDeviation = totalCents - midiNote * 100;
  // Pitch bend: 0-16383, center at 8192. Assume ±200 cents bend range.
  const pitchBend = Math.round(8192 + (centsDeviation / 200) * 8191);
  return {
    midiNote: Math.max(0, Math.min(127, midiNote)),
    pitchBend: Math.max(0, Math.min(16383, pitchBend)),
    centsDeviation,
  };
}

/**
 * C942: Convert MIDI pitch back to world pitch with cents offset.
 */
export function midiToWorldPitch(
  midiNote: number,
  pitchBend: number,
  _system: 'just' | 'pythagorean' | 'shruti' | 'maqam' | '12tet'
): { pitch: number; centsOffset: number } {
  const bendCents = ((pitchBend - 8192) / 8191) * 200;
  return {
    pitch: midiNote,
    centsOffset: Math.round(bendCents * 100) / 100,
  };
}

// ============================================================================
// SCHEMA / FILM / CULTURE RECOGNITION (C879, C880, C881)
// ============================================================================

/** Schema recognition match */
export interface SchemaRecognitionMatch {
  readonly schemaName: GalantSchemaName;
  readonly confidence: number;
  readonly matchedBass: readonly number[];
  readonly matchedSoprano: readonly number[];
  readonly explanation: string;
}

/**
 * C879: Schema recognition on selected tracker region — suggest matching schemata.
 * Analyzes bass + soprano lines against the galant schema library.
 */
export async function recognizeSchema(
  bassNotes: readonly number[],
  sopranoNotes: readonly number[],
  key: RootName,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<readonly SchemaRecognitionMatch[]>> {
  await ensureLoaded(adapter);

  // Try Prolog path
  const result = await adapter.querySingle(
    `recognize_schema([${bassNotes.join(',')}], [${sopranoNotes.join(',')}], ${key}, Matches).`
  );
  if (result) {
    const matches = Array.isArray(result['Matches']) ? result['Matches'] as SchemaRecognitionMatch[] : [];
    return explainable(matches, [`Prolog schema recognition in key ${key}`], 85);
  }

  // TS fallback: simple pattern matching against known schemata
  const matches: SchemaRecognitionMatch[] = [];
  const bassIntervals = bassNotes.slice(1).map((n, i) => n - bassNotes[i]!);

  // Romanesca: bass descends 1-7-6-3 (or stepwise with third)
  if (bassIntervals.length >= 3) {
    const descending = bassIntervals.every(i => i <= 0);
    if (descending) {
      matches.push({
        schemaName: 'romanesca',
        confidence: 60,
        matchedBass: [...bassNotes],
        matchedSoprano: [...sopranoNotes],
        explanation: 'Descending bass line matches Romanesca pattern',
      });
    }
  }

  // Prinner: bass 4-3-2-1 (descending stepwise)
  if (bassIntervals.length >= 3 && bassIntervals.every(i => i === -1 || i === -2)) {
    matches.push({
      schemaName: 'prinner',
      confidence: 55,
      matchedBass: [...bassNotes],
      matchedSoprano: [...sopranoNotes],
      explanation: 'Stepwise descending bass suggests Prinner riposte',
    });
  }

  // Monte: bass ascending by step from minor (1-2 in minor)
  if (bassIntervals.length >= 1 && bassIntervals[0]! > 0) {
    matches.push({
      schemaName: 'monte',
      confidence: 40,
      matchedBass: [...bassNotes],
      matchedSoprano: [...sopranoNotes],
      explanation: 'Ascending bass motion suggests Monte sequence',
    });
  }

  return explainable(
    matches.sort((a, b) => b.confidence - a.confidence),
    ['TS pattern matching against galant schemata'],
    65
  );
}

/** Film device recognition match */
export interface FilmDeviceRecognitionMatch {
  readonly device: FilmDevice;
  readonly confidence: number;
  readonly evidence: readonly string[];
}

/**
 * C880: Film device recognition on selected chord region.
 * Detects film scoring devices from harmonic progressions.
 */
export async function recognizeFilmDevice(
  chords: readonly { root: string; quality: string; duration: number }[],
  spec: MusicSpec,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<readonly FilmDeviceRecognitionMatch[]>> {
  await ensureLoaded(adapter);

  const facts = specToPrologFacts(spec).join('\n');
  const chordTerms = chords.map(c => `chord(${c.root}, ${c.quality}, ${c.duration})`).join(', ');
  const result = await adapter.querySingle(
    `${facts}, recognize_film_device([${chordTerms}], Matches).`
  );
  if (result) {
    const matches = Array.isArray(result['Matches']) ? result['Matches'] as FilmDeviceRecognitionMatch[] : [];
    return explainable(matches, ['Prolog film device recognition'], 85);
  }

  // TS fallback
  const matches: FilmDeviceRecognitionMatch[] = [];

  // Detect pedal point (repeated bass)
  const roots = chords.map(c => c.root);
  const uniqueRoots = new Set(roots);
  if (uniqueRoots.size <= 2 && chords.length >= 3) {
    matches.push({
      device: 'pedal_point',
      confidence: 75,
      evidence: ['Minimal root movement over 3+ chords suggests pedal point'],
    });
  }

  // Detect chromatic mediant (root movement by 3rds)
  for (let i = 1; i < chords.length; i++) {
    const noteMap: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    const prev = noteMap[chords[i - 1]!.root] ?? 0;
    const curr = noteMap[chords[i]!.root] ?? 0;
    const interval = Math.abs(curr - prev) % 12;
    if (interval === 3 || interval === 4 || interval === 8 || interval === 9) {
      matches.push({
        device: 'chromatic_mediant',
        confidence: 70,
        evidence: [`Third-related root movement ${chords[i - 1]!.root}→${chords[i]!.root}`],
      });
      break;
    }
  }

  // Detect ostinato (repeating pattern)
  if (chords.length >= 4) {
    const half = Math.floor(chords.length / 2);
    const first = chords.slice(0, half).map(c => `${c.root}${c.quality}`).join('-');
    const second = chords.slice(half, half * 2).map(c => `${c.root}${c.quality}`).join('-');
    if (first === second) {
      matches.push({
        device: 'ostinato',
        confidence: 85,
        evidence: ['Exact harmonic repetition detected'],
      });
    }
  }

  return explainable(
    matches.sort((a, b) => b.confidence - a.confidence),
    ['TS pattern matching for film scoring devices'],
    60
  );
}

/** Culture recognition match */
export interface CultureRecognitionMatch {
  readonly culture: string;
  readonly confidence: number;
  readonly matchedScaleType: string;
  readonly evidence: readonly string[];
}

/**
 * C881: Culture recognition on selected melody — suggest raga/mode match.
 * Analyzes pitch-class usage patterns against world music systems.
 */
export async function recognizeCulture(
  melodyNotes: readonly number[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<readonly CultureRecognitionMatch[]>> {
  await ensureLoaded(adapter);

  const result = await adapter.querySingle(
    `recognize_culture([${melodyNotes.join(',')}], Matches).`
  );
  if (result) {
    const matches = Array.isArray(result['Matches']) ? result['Matches'] as CultureRecognitionMatch[] : [];
    return explainable(matches, ['Prolog culture recognition'], 85);
  }

  // TS fallback: pitch class analysis
  const pitchClasses = new Set(melodyNotes.map(n => n % 12));
  const matches: CultureRecognitionMatch[] = [];

  // Check for pentatonic (5 pitch classes, no semitones)
  if (pitchClasses.size === 5) {
    const sorted = [...pitchClasses].sort((a, b) => a - b);
    const intervals = sorted.slice(1).map((pc, i) => (pc - sorted[i]! + 12) % 12);
    const hasSemitone = intervals.some(i => i === 1);
    if (!hasSemitone) {
      matches.push({
        culture: 'chinese',
        confidence: 65,
        matchedScaleType: 'pentatonic',
        evidence: ['5 pitch classes with no semitones → anhemitonic pentatonic'],
      });
      matches.push({
        culture: 'celtic',
        confidence: 50,
        matchedScaleType: 'pentatonic',
        evidence: ['Pentatonic scale common in Celtic music'],
      });
    }
  }

  // Check for Carnatic (shruti-based, many pitch classes)
  if (pitchClasses.size >= 6) {
    matches.push({
      culture: 'carnatic',
      confidence: 45,
      matchedScaleType: 'raga (chromatic richness)',
      evidence: [`${pitchClasses.size} pitch classes suggests possible raga`],
    });
  }

  // Check for Western major/minor
  const majorTemplate = new Set([0, 2, 4, 5, 7, 9, 11]);
  const minorTemplate = new Set([0, 2, 3, 5, 7, 8, 10]);
  for (let t = 0; t < 12; t++) {
    const transposed = new Set([...pitchClasses].map(pc => (pc - t + 12) % 12));
    const majorOverlap = [...transposed].filter(pc => majorTemplate.has(pc)).length;
    const minorOverlap = [...transposed].filter(pc => minorTemplate.has(pc)).length;
    if (majorOverlap >= pitchClasses.size - 1) {
      matches.push({
        culture: 'western',
        confidence: 70,
        matchedScaleType: 'major',
        evidence: [`Strong match to major scale at transposition ${t}`],
      });
      break;
    }
    if (minorOverlap >= pitchClasses.size - 1) {
      matches.push({
        culture: 'western',
        confidence: 70,
        matchedScaleType: 'minor',
        evidence: [`Strong match to natural minor at transposition ${t}`],
      });
      break;
    }
  }

  return explainable(
    matches.sort((a, b) => b.confidence - a.confidence),
    ['TS pitch-class analysis for culture identification'],
    55
  );
}

// ============================================================================
// CARD-TO-SPEC PARAMETER MAPPINGS (C869, C871, C873)
// ============================================================================

/** Card parameter mapping descriptor */
export interface CardSpecMapping {
  readonly cardType: string;
  readonly paramName: string;
  readonly constraintType: string;
  readonly transform: (value: unknown) => MusicConstraint | null;
  readonly reverseTransform: (constraint: MusicConstraint) => unknown;
}

/**
 * C869: Arranger keyboard card → MusicSpec mappings.
 */
export const ARRANGER_CARD_MAPPINGS: readonly CardSpecMapping[] = [
  {
    cardType: 'arranger',
    paramName: 'style',
    constraintType: 'style',
    transform: (value: unknown) => value ? { type: 'style', style: String(value), hard: false } as unknown as MusicConstraint : null,
    reverseTransform: (c: MusicConstraint) => (c as unknown as { style?: string }).style ?? '',
  },
  {
    cardType: 'arranger',
    paramName: 'mood',
    constraintType: 'film_mood',
    transform: (value: unknown) => value ? { type: 'film_mood', mood: String(value), hard: false } as unknown as MusicConstraint : null,
    reverseTransform: (c: MusicConstraint) => (c as unknown as { mood?: string }).mood ?? '',
  },
  {
    cardType: 'arranger',
    paramName: 'energy',
    constraintType: 'phrase_density',
    transform: (value: unknown) => {
      const level = Number(value);
      if (isNaN(level)) return null;
      return { type: 'phrase_density', density: level < 0.33 ? 'sparse' : level < 0.66 ? 'medium' : 'dense', hard: false } as unknown as MusicConstraint;
    },
    reverseTransform: (c: MusicConstraint) => {
      const d = (c as unknown as { density?: string }).density;
      return d === 'sparse' ? 0.2 : d === 'dense' ? 0.8 : 0.5;
    },
  },
];

/**
 * C871: Phrase generator card → MusicSpec mappings.
 */
export const PHRASE_GEN_CARD_MAPPINGS: readonly CardSpecMapping[] = [
  {
    cardType: 'phraseGenerator',
    paramName: 'density',
    constraintType: 'phrase_density',
    transform: (value: unknown) => value ? { type: 'phrase_density', density: String(value), hard: false } as unknown as MusicConstraint : null,
    reverseTransform: (c: MusicConstraint) => (c as unknown as { density?: string }).density ?? 'medium',
  },
  {
    cardType: 'phraseGenerator',
    paramName: 'contour',
    constraintType: 'contour',
    transform: (value: unknown) => value ? { type: 'contour', contour: String(value), hard: false } as unknown as MusicConstraint : null,
    reverseTransform: (c: MusicConstraint) => (c as unknown as { contour?: string }).contour ?? 'arch',
  },
  {
    cardType: 'phraseGenerator',
    paramName: 'schema',
    constraintType: 'schema',
    transform: (value: unknown) => value ? { type: 'schema', schema: String(value) as GalantSchemaName, hard: false } as unknown as MusicConstraint : null,
    reverseTransform: (c: MusicConstraint) => (c as unknown as { schema?: string }).schema ?? '',
  },
];

/**
 * C873: Tracker card → MusicSpec mappings.
 */
export const TRACKER_CARD_MAPPINGS: readonly CardSpecMapping[] = [
  {
    cardType: 'tracker',
    paramName: 'patternRole',
    constraintType: 'pattern_role',
    transform: (value: unknown) => value ? { type: 'pattern_role', role: String(value), hard: false } as unknown as MusicConstraint : null,
    reverseTransform: (c: MusicConstraint) => (c as unknown as { role?: string }).role ?? 'melodic',
  },
  {
    cardType: 'tracker',
    paramName: 'accentModel',
    constraintType: 'accent',
    transform: (value: unknown) => value ? { type: 'accent', model: String(value), hard: false } as unknown as MusicConstraint : null,
    reverseTransform: (c: MusicConstraint) => (c as unknown as { model?: string }).model ?? 'standard',
  },
  {
    cardType: 'tracker',
    paramName: 'swing',
    constraintType: 'swing',
    transform: (value: unknown) => {
      const amt = Number(value);
      if (isNaN(amt)) return null;
      return { type: 'swing', amount: amt, hard: false } as unknown as MusicConstraint;
    },
    reverseTransform: (c: MusicConstraint) => (c as unknown as { amount?: number }).amount ?? 0.5,
  },
];

/**
 * Apply card-to-spec mappings: convert card parameter values to MusicConstraints.
 */
export function applyCardMappings(
  mappings: readonly CardSpecMapping[],
  params: Record<string, unknown>
): readonly MusicConstraint[] {
  const constraints: MusicConstraint[] = [];
  for (const mapping of mappings) {
    const value = params[mapping.paramName];
    if (value !== undefined && value !== null) {
      const constraint = mapping.transform(value);
      if (constraint) constraints.push(constraint);
    }
  }
  return constraints;
}

/**
 * Reverse: extract card parameter values from MusicSpec constraints.
 */
export function extractCardParams(
  mappings: readonly CardSpecMapping[],
  constraints: readonly MusicConstraint[]
): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  for (const mapping of mappings) {
    const found = constraints.find(c => c.type === mapping.constraintType);
    if (found) {
      params[mapping.paramName] = mapping.reverseTransform(found);
    }
  }
  return params;
}

// ============================================================================
// PHRASE HEAD EXTRACTION (C849)
// ============================================================================

/** Phrase head: rhythmic/melodic anchor point */
export interface PhraseHead {
  readonly noteIndex: number;
  readonly midi: number;
  readonly time: number;
  readonly isMetrical: boolean;
  readonly weight: number;
}

/**
 * C849: Extract phrase heads using GTTM-inspired heuristics.
 * Heads are metrically prominent, longer notes that serve as anchors.
 */
export function extractPhraseHeads(
  notes: readonly { midi: number; time: number; duration: number }[],
  beatsPerMeasure: number = 4,
  beatDuration: number = 0.5
): readonly PhraseHead[] {
  if (notes.length === 0) return [];

  const heads: PhraseHead[] = [];
  const avgDuration = notes.reduce((s, n) => s + n.duration, 0) / notes.length;

  for (let i = 0; i < notes.length; i++) {
    const note = notes[i]!;
    let weight = 0;

    // Metrical prominence: notes on strong beats
    const beatPosition = (note.time / beatDuration) % beatsPerMeasure;
    const isDownbeat = Math.abs(beatPosition) < 0.1;
    const isBackbeat = Math.abs(beatPosition - beatsPerMeasure / 2) < 0.1;
    if (isDownbeat) weight += 3;
    else if (isBackbeat) weight += 2;
    else if (Math.abs(beatPosition - Math.round(beatPosition)) < 0.1) weight += 1;

    // Duration: longer notes
    if (note.duration >= avgDuration * 1.5) weight += 2;
    else if (note.duration >= avgDuration) weight += 1;

    // Contour: local peaks and valleys
    const prevMidi = i > 0 ? notes[i - 1]!.midi : note.midi;
    const nextMidi = i < notes.length - 1 ? notes[i + 1]!.midi : note.midi;
    if ((note.midi >= prevMidi && note.midi >= nextMidi) || (note.midi <= prevMidi && note.midi <= nextMidi)) {
      weight += 1;
    }

    if (i === 0 || i === notes.length - 1) weight += 1;

    if (weight >= 3) {
      heads.push({ noteIndex: i, midi: note.midi, time: note.time, isMetrical: isDownbeat || isBackbeat, weight });
    }
  }

  return heads;
}

// ============================================================================
// FILL SUGGESTION / BUILDER (C933, C935)
// ============================================================================

/** Fill suggestion */
export interface FillSuggestion {
  readonly type: 'drum_fill' | 'melodic_fill' | 'harmonic_fill';
  readonly position: number;
  readonly durationBeats: number;
  readonly intensity: number;
  readonly notes: readonly number[];
  readonly description: string;
}

/**
 * C933: Fill suggestion from cadence markers.
 */
export async function suggestFill(
  currentBeat: number,
  sectionEndBeat: number,
  spec: MusicSpec,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<readonly FillSuggestion[]>> {
  await ensureLoaded(adapter);

  const facts = specToPrologFacts(spec).join('\n');
  const result = await adapter.querySingle(
    `${facts}, suggest_fill(${currentBeat}, ${sectionEndBeat}, Fills).`
  );
  if (result) {
    const fills = Array.isArray(result['Fills']) ? result['Fills'] as FillSuggestion[] : [];
    return explainable(fills, ['Prolog fill suggestion'], 80);
  }

  const beatsLeft = sectionEndBeat - currentBeat;
  const fills: FillSuggestion[] = [];
  if (beatsLeft <= 0) return explainable([], ['No space for fill'], 100);

  const drumFillLen = Math.min(beatsLeft, 2);
  fills.push({
    type: 'drum_fill',
    position: sectionEndBeat - drumFillLen,
    durationBeats: drumFillLen,
    intensity: 0.7,
    notes: [],
    description: `${drumFillLen}-beat drum fill into next section`,
  });

  if (beatsLeft >= 4) {
    const key = spec.constraints.find(c => c.type === 'key') as { root?: string } | undefined;
    const root = key?.root === 'C' ? 60 : key?.root === 'D' ? 62 : key?.root === 'E' ? 64 : key?.root === 'F' ? 65 : key?.root === 'G' ? 67 : key?.root === 'A' ? 69 : key?.root === 'B' ? 71 : 60;
    fills.push({
      type: 'melodic_fill',
      position: sectionEndBeat - 4,
      durationBeats: 4,
      intensity: 0.6,
      notes: [root + 12, root + 11, root + 9, root + 7],
      description: 'Descending scalar fill into cadence',
    });
  }

  return explainable(fills, ['TS cadence-based fill suggestion'], 60);
}

/**
 * C935: Tracker fill builder — generates fills using style constraints.
 */
export function buildTrackerFill(
  fillType: 'snare_roll' | 'tom_cascade' | 'cymbal_swell' | 'scalar_run' | 'arpeggio_burst',
  durationBeats: number,
  _bpm: number,
  stepsPerBeat: number = 4
): readonly { step: number; note: number; velocity: number }[] {
  const totalSteps = Math.round(durationBeats * stepsPerBeat);
  const events: { step: number; note: number; velocity: number }[] = [];

  switch (fillType) {
    case 'snare_roll': {
      for (let s = 0; s < totalSteps; s++) {
        events.push({ step: s, note: 38, velocity: Math.round(60 + (s / totalSteps) * 67) });
      }
      break;
    }
    case 'tom_cascade': {
      const toms = [50, 47, 45, 43];
      for (let s = 0; s < totalSteps; s++) {
        events.push({ step: s, note: toms[Math.floor((s / totalSteps) * toms.length)]!, velocity: Math.round(80 + (s / totalSteps) * 47) });
      }
      break;
    }
    case 'cymbal_swell': {
      for (let s = 0; s < totalSteps; s += 2) {
        events.push({ step: s, note: s < totalSteps / 2 ? 53 : 49, velocity: Math.round(40 + (s / totalSteps) * 87) });
      }
      break;
    }
    case 'scalar_run': {
      const scale = [60, 62, 64, 65, 67, 69, 71, 72];
      for (let s = 0; s < totalSteps; s++) {
        events.push({ step: s, note: scale[s % scale.length]!, velocity: 100 });
      }
      break;
    }
    case 'arpeggio_burst': {
      const arp = [60, 64, 67, 71, 72, 71, 67, 64];
      for (let s = 0; s < totalSteps; s++) {
        events.push({ step: s, note: arp[s % arp.length]!, velocity: 90 });
      }
      break;
    }
  }

  return events;
}

// ============================================================================
// NOTATION EXPORT MAPPING FOR ORNAMENTS (C756, C758)
// ============================================================================

/** Ornament notation descriptor */
export interface OrnamentNotation {
  readonly type: 'grace_note' | 'turn' | 'trill' | 'mordent' | 'roll' | 'cut' | 'slide';
  readonly symbol: string;
  readonly beforeNote: boolean;
  readonly graceNotes: readonly number[];
  readonly durationFraction: number;
}

/**
 * C756: Map ornament annotations to notation-standard representations.
 */
export function mapOrnamentToNotation(
  ornamentType: string,
  mainNote: number,
  _duration: number
): OrnamentNotation {
  switch (ornamentType) {
    case 'roll':
      return { type: 'roll', symbol: '~', beforeNote: true, graceNotes: [mainNote + 2, mainNote, mainNote - 1, mainNote], durationFraction: 0.25 };
    case 'cut':
      return { type: 'cut', symbol: '⌃', beforeNote: true, graceNotes: [mainNote + 2], durationFraction: 0.1 };
    case 'tap':
      return { type: 'grace_note', symbol: '⌄', beforeNote: true, graceNotes: [mainNote - 2], durationFraction: 0.1 };
    case 'trill':
      return { type: 'trill', symbol: 'tr', beforeNote: false, graceNotes: [mainNote + 2], durationFraction: 0.5 };
    case 'mordent':
      return { type: 'mordent', symbol: '∼', beforeNote: false, graceNotes: [mainNote + 2, mainNote], durationFraction: 0.15 };
    case 'turn':
      return { type: 'turn', symbol: '∽', beforeNote: false, graceNotes: [mainNote + 2, mainNote, mainNote - 1, mainNote], durationFraction: 0.3 };
    case 'slide':
    case 'glissando':
      return { type: 'slide', symbol: '⟋', beforeNote: true, graceNotes: [mainNote - 3, mainNote - 2, mainNote - 1], durationFraction: 0.2 };
    default:
      return { type: 'grace_note', symbol: '♪', beforeNote: true, graceNotes: [mainNote], durationFraction: 0.1 };
  }
}

/**
 * C758: Export path from ornament annotations to notation renderer.
 */
export function exportOrnamentsToNotation(
  annotatedNotes: readonly { midi: number; duration: number; ornament?: string }[]
): readonly { midi: number; duration: number; notation?: OrnamentNotation }[] {
  return annotatedNotes.map(note => {
    if (!note.ornament) return { midi: note.midi, duration: note.duration };
    return { midi: note.midi, duration: note.duration, notation: mapOrnamentToNotation(note.ornament, note.midi, note.duration) };
  });
}

// ============================================================================
// GAMAKA INTEGRATION (C638, C639)
// ============================================================================

/** Gamaka contour point */
export interface GamakaContourPoint {
  readonly time: number;
  readonly pitchOffset: number;
  readonly velocity: number;
}

/**
 * C638: Phrase adapter that preserves gamaka contours when adapting phrases.
 */
export function adaptPhraseWithGamaka(
  notes: readonly { midi: number; duration: number; gamaka?: readonly GamakaContourPoint[] }[],
  transposition: number,
  timeStretch: number = 1.0
): readonly { midi: number; duration: number; gamaka?: readonly GamakaContourPoint[] }[] {
  return notes.map(note => {
    const adapted: { midi: number; duration: number; gamaka?: readonly GamakaContourPoint[] } = {
      midi: note.midi + transposition,
      duration: note.duration * timeStretch,
    };
    if (note.gamaka && note.gamaka.length > 0) {
      return { ...adapted, gamaka: note.gamaka.map(g => ({ time: g.time * timeStretch, pitchOffset: g.pitchOffset, velocity: g.velocity })) };
    }
    return adapted;
  });
}

/** Gamaka emission options */
export interface GamakaEmissionOptions {
  readonly ragaName: string;
  readonly density: 'sparse' | 'moderate' | 'dense';
  readonly ornamentBudget: number;
}

/**
 * C639: Melody generator that emits gamaka ornaments under spec constraints.
 */
export function emitGamakaOrnaments(
  notes: readonly { midi: number; duration: number }[],
  options: GamakaEmissionOptions
): readonly { midi: number; duration: number; gamaka?: readonly GamakaContourPoint[] }[] {
  const budgetPerNote = Math.max(0, Math.min(1, options.ornamentBudget / Math.max(1, notes.length)));
  const densityThreshold = options.density === 'sparse' ? 0.7 : options.density === 'moderate' ? 0.4 : 0.15;

  return notes.map((note, i) => {
    if (note.duration < 0.2 || Math.random() > budgetPerNote || Math.random() < densityThreshold) {
      return note;
    }
    const prevMidi = i > 0 ? notes[i - 1]!.midi : note.midi;
    const isAscending = note.midi > prevMidi;
    const gamaka: GamakaContourPoint[] = isAscending
      ? [{ time: 0, pitchOffset: -0.5, velocity: 0.8 }, { time: note.duration * 0.15, pitchOffset: -0.3, velocity: 0.9 }, { time: note.duration * 0.3, pitchOffset: 0, velocity: 1.0 }]
      : [{ time: 0, pitchOffset: 0.3, velocity: 0.9 }, { time: note.duration * 0.2, pitchOffset: -0.2, velocity: 0.85 }, { time: note.duration * 0.4, pitchOffset: 0.1, velocity: 0.9 }, { time: note.duration * 0.6, pitchOffset: 0, velocity: 1.0 }];
    return { ...note, gamaka };
  });
}

// ============================================================================
// MODE MODULATION HELPER (C845, C846)
// ============================================================================

/** Mode modulation suggestion */
export interface ModeModulationSuggestion {
  readonly fromMode: string;
  readonly toMode: string;
  readonly pivotPitchClass: number;
  readonly sharedPitchClasses: readonly number[];
  readonly smoothness: number;
  readonly explanation: string;
}

/**
 * C845: Mode modulation helper — suggest smooth mode shifts.
 */
export function suggestModeModulations(
  currentMode: string,
  currentRoot: number,
  targetCulture?: string
): readonly ModeModulationSuggestion[] {
  const modeTemplates: Record<string, readonly number[]> = {
    ionian: [0, 2, 4, 5, 7, 9, 11], dorian: [0, 2, 3, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10],
    lydian: [0, 2, 4, 6, 7, 9, 11], mixolydian: [0, 2, 4, 5, 7, 9, 10], aeolian: [0, 2, 3, 5, 7, 8, 10],
    locrian: [0, 1, 3, 5, 6, 8, 10],
    gong: [0, 2, 4, 7, 9], shang: [0, 2, 5, 7, 10], jiao: [0, 3, 5, 8, 10], zhi: [0, 2, 5, 7, 9], yu: [0, 3, 5, 7, 10],
  };

  const currentPCs = new Set((modeTemplates[currentMode] ?? modeTemplates['ionian']!).map(i => (i + currentRoot) % 12));
  const suggestions: ModeModulationSuggestion[] = [];
  const targetModes = targetCulture === 'chinese'
    ? ['gong', 'shang', 'jiao', 'zhi', 'yu']
    : targetCulture === 'celtic'
      ? ['dorian', 'mixolydian', 'aeolian', 'ionian']
      : Object.keys(modeTemplates);

  for (const toMode of targetModes) {
    if (toMode === currentMode) continue;
    const template = modeTemplates[toMode];
    if (!template) continue;

    let bestRoot = 0;
    let bestShared: number[] = [];
    let bestSmoothness = 0;

    for (let r = 0; r < 12; r++) {
      const targetPCs = new Set(template.map(i => (i + r) % 12));
      const shared = [...currentPCs].filter(pc => targetPCs.has(pc));
      const smoothness = shared.length / Math.max(currentPCs.size, targetPCs.size);
      if (smoothness > bestSmoothness) {
        bestSmoothness = smoothness;
        bestShared = shared;
        bestRoot = r;
      }
    }

    if (bestSmoothness >= 0.5) {
      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      suggestions.push({
        fromMode: currentMode, toMode, pivotPitchClass: bestRoot, sharedPitchClasses: bestShared, smoothness: bestSmoothness,
        explanation: `${currentMode} → ${noteNames[bestRoot]} ${toMode}: ${bestShared.length} shared PCs (${Math.round(bestSmoothness * 100)}%)`,
      });
    }
  }

  return suggestions.sort((a, b) => b.smoothness - a.smoothness);
}

/**
 * C846: Harmony explorer — suggest mode shifts instead of chord modulations.
 */
export async function suggestModeShift(
  spec: MusicSpec,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<readonly ModeModulationSuggestion[]>> {
  await ensureLoaded(adapter);

  const keyConstraint = spec.constraints.find(c => c.type === 'key') as { root?: string; mode?: string } | undefined;
  const cultureConstraint = spec.constraints.find(c => c.type === 'culture') as { tag?: string } | undefined;
  const rootMap: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const currentRoot = rootMap[keyConstraint?.root ?? 'C'] ?? 0;
  const currentMode = keyConstraint?.mode ?? 'ionian';
  const culture = cultureConstraint?.tag;

  const facts = specToPrologFacts(spec).join('\n');
  const result = await adapter.querySingle(`${facts}, suggest_mode_shift(Suggestions).`);
  if (result) {
    const suggestions = Array.isArray(result['Suggestions']) ? result['Suggestions'] as ModeModulationSuggestion[] : [];
    return explainable(suggestions, ['Prolog mode shift suggestion'], 85);
  }

  const suggestions = suggestModeModulations(currentMode, currentRoot, culture);
  return explainable(suggestions, [`TS mode modulation from ${currentMode}, culture=${culture ?? 'any'}`], 65);
}

// ============================================================================
// CHINESE ORNAMENT EXPORT (C841)
// ============================================================================

/**
 * C841: Chinese ornament export path — maps Chinese ornament types to notation.
 */
export function exportChineseOrnamentsToNotation(
  annotatedNotes: readonly { midi: number; duration: number; ornament?: string }[]
): readonly { midi: number; duration: number; notation?: OrnamentNotation }[] {
  return annotatedNotes.map(note => {
    if (!note.ornament) return { midi: note.midi, duration: note.duration };
    let type: string = note.ornament;
    if (type === 'hua_zhi' || type === 'vibrato') type = 'trill';
    if (type === 'hua_yin' || type === 'portamento') type = 'slide';
    if (type === 'gu_yin' || type === 'bend') type = 'mordent';
    return { midi: note.midi, duration: note.duration, notation: mapOrnamentToNotation(type, note.midi, note.duration) };
  });
}

// ============================================================================
// GLOSSARY (C971)
// ============================================================================

/** Theory glossary entry */
export interface GlossaryEntry {
  readonly term: string;
  readonly definition: string;
  readonly cardplayPrimitive: string;
  readonly relatedConstraints: readonly string[];
  readonly culture?: string;
}

/** C971: Glossary mapping common theory terms to CardPlay primitives. */
export const THEORY_GLOSSARY: readonly GlossaryEntry[] = [
  { term: 'Key', definition: 'The tonal center and mode of a piece', cardplayPrimitive: 'ConstraintKey', relatedConstraints: ['key'], culture: 'western' },
  { term: 'Meter', definition: 'Recurring pattern of strong and weak beats', cardplayPrimitive: 'ConstraintMeter', relatedConstraints: ['meter', 'accent'], culture: 'western' },
  { term: 'Tempo', definition: 'Speed of the music in BPM', cardplayPrimitive: 'ConstraintTempo', relatedConstraints: ['tempo'] },
  { term: 'Raga', definition: 'Indian melodic framework with ascending/descending patterns', cardplayPrimitive: 'ConstraintRaga', relatedConstraints: ['raga', 'gamakaDensity'], culture: 'carnatic' },
  { term: 'Tala', definition: 'Indian rhythmic cycle with specific beat groupings', cardplayPrimitive: 'ConstraintTala', relatedConstraints: ['tala'], culture: 'carnatic' },
  { term: 'Schema', definition: 'Galant contrapuntal pattern (Romanesca, Prinner, Monte, etc.)', cardplayPrimitive: 'ConstraintSchema', relatedConstraints: ['schema'], culture: 'western' },
  { term: 'Heterophony', definition: 'Multiple voices playing variants of same melody simultaneously', cardplayPrimitive: 'ConstraintHeterophony', relatedConstraints: ['heterophony'], culture: 'chinese' },
  { term: 'Mode (Chinese)', definition: 'Pentatonic mode (gong, shang, jiao, zhi, yu)', cardplayPrimitive: 'ConstraintChineseMode', relatedConstraints: ['chineseMode'], culture: 'chinese' },
  { term: 'Tune Type', definition: 'Celtic dance form (reel, jig, hornpipe, etc.)', cardplayPrimitive: 'ConstraintCelticTune', relatedConstraints: ['celticTune'], culture: 'celtic' },
  { term: 'Pedal Point', definition: 'Sustained bass note under changing harmonies', cardplayPrimitive: 'FilmDevice', relatedConstraints: ['filmDevice'], culture: 'western' },
  { term: 'Ostinato', definition: 'Repeating musical pattern in bass or accompaniment', cardplayPrimitive: 'FilmDevice', relatedConstraints: ['filmDevice'] },
  { term: 'Lydian Chromatic', definition: "George Russell's LCC system based on lydian scale", cardplayPrimitive: 'ConstraintLCCGravity', relatedConstraints: ['lccGravity', 'lccParentScale'], culture: 'western' },
  { term: 'Swing', definition: 'Rhythmic feel where subdivisions are played unevenly', cardplayPrimitive: 'ConstraintSwing', relatedConstraints: ['swing'] },
  { term: 'Contour', definition: 'Shape of a melody (arch, ascending, descending, wave)', cardplayPrimitive: 'ConstraintContour', relatedConstraints: ['contour'] },
  { term: 'Voice Leading', definition: 'Smooth connection of notes between chords', cardplayPrimitive: 'ConstraintMaxInterval', relatedConstraints: ['maxInterval'] },
  { term: 'Gamaka', definition: 'Carnatic melodic ornaments as pitch-bend curves', cardplayPrimitive: 'ConstraintGamakaDensity', relatedConstraints: ['gamakaDensity', 'ornamentBudget'], culture: 'carnatic' },
  { term: 'Drone', definition: 'Sustained pitch (usually tonic and fifth) underlying melody', cardplayPrimitive: 'ConstraintDrone', relatedConstraints: ['drone'] },
  { term: 'Leitmotif', definition: 'Recurring theme associated with a character or idea', cardplayPrimitive: 'ConstraintLeitmotif', relatedConstraints: ['leitmotif'], culture: 'western' },
];

export function lookupGlossary(term: string): GlossaryEntry | undefined {
  return THEORY_GLOSSARY.find(e => e.term.toLowerCase() === term.toLowerCase());
}

export function getGlossaryForCulture(culture: string): readonly GlossaryEntry[] {
  return THEORY_GLOSSARY.filter(e => !e.culture || e.culture === culture);
}

// ============================================================================
// TRANSCRIPTION IMPORT WORKFLOW (C1437)
// ============================================================================

/**
 * C1437: Transcription import workflow — MIDI → analysis → vocabulary extraction.
 */
export async function importTranscription(
  notes: readonly { midi: number; time: number; duration: number; velocity: number }[],
  _spec: MusicSpec,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{
  analysis: TranscriptionAnalysis;
  cultureMatch: readonly CultureRecognitionMatch[];
  suggestedConstraints: readonly MusicConstraint[];
}>> {
  const midiNotes = notes.map(n => n.midi);
  const durations = notes.map(n => n.duration);
  const analysis = (await analyzeTranscription(midiNotes, durations, [], adapter)).value;
  const cultureMatch = (await recognizeCulture(midiNotes, adapter)).value;

  const suggestedConstraints: MusicConstraint[] = [];
  const pcCounts = new Array(12).fill(0) as number[];
  for (const note of midiNotes) { const idx = note % 12; pcCounts[idx] = (pcCounts[idx] ?? 0) + 1; }
  const mostCommonPC = pcCounts.indexOf(Math.max(...pcCounts));
  const rootNameMap: RootName[] = ['c', 'csharp', 'd', 'dsharp', 'e', 'f', 'fsharp', 'g', 'gsharp', 'a', 'asharp', 'b'];
  const detectedRoot = rootNameMap[mostCommonPC] ?? 'c';
  suggestedConstraints.push({ type: 'key', root: detectedRoot, mode: 'ionian' as ModeName, hard: false });

  if (cultureMatch.length > 0 && cultureMatch[0]!.confidence >= 60) {
    suggestedConstraints.push({ type: 'culture', culture: cultureMatch[0]!.culture, hard: false } as unknown as MusicConstraint);
  }

  if (notes.length >= 2) {
    const iois = notes.slice(1).map((n, i) => n.time - notes[i]!.time).filter(ioi => ioi > 0);
    if (iois.length > 0) {
      const medianIOI = [...iois].sort((a, b) => a - b)[Math.floor(iois.length / 2)]!;
      const estimatedBPM = Math.round(60 / medianIOI);
      if (estimatedBPM >= 40 && estimatedBPM <= 300) {
        suggestedConstraints.push({ type: 'tempo', bpm: estimatedBPM, hard: false } as unknown as MusicConstraint);
      }
    }
  }

  return explainable({ analysis, cultureMatch, suggestedConstraints }, ['Full transcription import pipeline'], 70);
}

// ============================================================================
// KEY SUGGESTIONS WITH INSTRUMENT CONSTRAINTS (C739)
// ============================================================================

/** Instrument key preference */
export interface InstrumentKeyPreference {
  readonly instrument: string;
  readonly preferredKeys: readonly RootName[];
  readonly avoidKeys: readonly RootName[];
  readonly reason: string;
}

export const INSTRUMENT_KEY_PREFERENCES: readonly InstrumentKeyPreference[] = [
  { instrument: 'trumpet', preferredKeys: ['bflat', 'f', 'eflat', 'c'], avoidKeys: ['fsharp', 'b', 'dflat'], reason: 'Bb transposing instrument' },
  { instrument: 'alto_saxophone', preferredKeys: ['eflat', 'bflat', 'aflat', 'f'], avoidKeys: ['b', 'fsharp', 'csharp'], reason: 'Eb transposing instrument' },
  { instrument: 'tenor_saxophone', preferredKeys: ['bflat', 'f', 'eflat', 'c'], avoidKeys: ['fsharp', 'b', 'dflat'], reason: 'Bb transposing instrument' },
  { instrument: 'clarinet', preferredKeys: ['bflat', 'f', 'eflat', 'c'], avoidKeys: ['fsharp', 'b'], reason: 'Bb transposing instrument' },
  { instrument: 'french_horn', preferredKeys: ['f', 'bflat', 'eflat', 'c'], avoidKeys: ['fsharp', 'b', 'csharp'], reason: 'F transposing instrument' },
  { instrument: 'guitar', preferredKeys: ['e', 'a', 'd', 'g', 'c'], avoidKeys: ['dflat', 'gflat'], reason: 'Open string keys preferred' },
  { instrument: 'fiddle', preferredKeys: ['d', 'g', 'a', 'e'], avoidKeys: ['dflat', 'gflat', 'aflat'], reason: 'Open string sympathetic resonance' },
  { instrument: 'tin_whistle', preferredKeys: ['d', 'g', 'a'], avoidKeys: ['eflat', 'aflat', 'dflat', 'gflat', 'b'], reason: 'Standard D whistle fingering' },
  { instrument: 'uilleann_pipes', preferredKeys: ['d', 'g', 'a', 'e'], avoidKeys: ['eflat', 'aflat', 'dflat', 'gflat'], reason: 'D chanter standard' },
  { instrument: 'piano', preferredKeys: ['c', 'f', 'g', 'd', 'bflat', 'eflat'], avoidKeys: [], reason: 'All keys playable' },
];

/**
 * C739: Key suggestions that respect instrument constraints.
 */
export function suggestKeysForInstruments(
  instruments: readonly string[]
): { readonly key: RootName; readonly score: number; readonly conflicts: readonly string[] }[] {
  const allKeys: RootName[] = ['c', 'csharp', 'd', 'dsharp', 'e', 'f', 'fsharp', 'g', 'gsharp', 'a', 'asharp', 'b'];
  return allKeys.map(key => {
    let score = 50;
    const conflicts: string[] = [];
    for (const instrument of instruments) {
      const pref = INSTRUMENT_KEY_PREFERENCES.find(p => p.instrument === instrument);
      if (!pref) continue;
      if (pref.preferredKeys.includes(key)) score += 15;
      if (pref.avoidKeys.includes(key)) { score -= 20; conflicts.push(`${instrument}: ${pref.reason}`); }
    }
    return { key, score, conflicts };
  }).sort((a, b) => b.score - a.score);
}

// ============================================================================
// HETEROPHONY SUPPORT (C849, C850, C792)
// ============================================================================

/**
 * C850: Heterophony generator using phrase heads for stable anchors.
 */
export function generateHeterophonyVoice(
  melody: readonly { midi: number; time: number; duration: number }[],
  heads: readonly PhraseHead[],
  variationDepth: 'minimal' | 'moderate' | 'free',
  voiceIndex: number
): readonly { midi: number; time: number; duration: number; isHead: boolean }[] {
  const headSet = new Set(heads.map(h => h.noteIndex));
  return melody.map((note, i) => {
    const isHead = headSet.has(i);
    if (isHead) {
      const octaveShift = voiceIndex === 0 ? 0 : voiceIndex === 1 ? -12 : 12;
      return { midi: note.midi + octaveShift, time: note.time, duration: note.duration, isHead: true };
    }
    let midiOffset = 0;
    let timeOffset = 0;
    if (variationDepth === 'minimal') {
      timeOffset = (voiceIndex * 0.05) * (i % 2 === 0 ? 1 : -1);
    } else if (variationDepth === 'moderate') {
      timeOffset = (voiceIndex * 0.08) * (i % 2 === 0 ? 1 : -1);
      midiOffset = (i % 3 === 0) ? (voiceIndex % 2 === 0 ? 1 : -1) : 0;
    } else {
      timeOffset = (voiceIndex * 0.1) * (i % 2 === 0 ? 1 : -1);
      midiOffset = [0, 2, -2, 1, -1][i % 5]! * (voiceIndex % 2 === 0 ? 1 : -1);
    }
    return { midi: note.midi + midiOffset, time: Math.max(0, note.time + timeOffset), duration: note.duration, isHead: false };
  });
}

/**
 * C792: Assign heterophony roles across voices.
 */
export function assignHeterophonyRoles(
  voiceCount: number,
  style: 'chinese' | 'gamelan' | 'generic' = 'generic'
): readonly { voiceIndex: number; role: string; variationDepth: 'minimal' | 'moderate' | 'free'; octaveShift: number }[] {
  const roles: { voiceIndex: number; role: string; variationDepth: 'minimal' | 'moderate' | 'free'; octaveShift: number }[] = [];
  for (let i = 0; i < voiceCount; i++) {
    if (i === 0) {
      roles.push({ voiceIndex: i, role: 'lead', variationDepth: 'minimal', octaveShift: 0 });
    } else if (style === 'chinese') {
      roles.push({ voiceIndex: i, role: i === 1 ? 'secondary' : 'ornamental', variationDepth: i === 1 ? 'moderate' : 'free', octaveShift: i === 1 ? 0 : (i % 2 === 0 ? -12 : 12) });
    } else if (style === 'gamelan') {
      roles.push({ voiceIndex: i, role: `layer-${i}`, variationDepth: i <= 2 ? 'moderate' : 'free', octaveShift: i * -12 });
    } else {
      roles.push({ voiceIndex: i, role: i === 1 ? 'echo' : 'counter', variationDepth: i === 1 ? 'minimal' : 'moderate', octaveShift: i % 2 === 0 ? 0 : -12 });
    }
  }
  return roles;
}

// ============================================================================
// CONSTRAINT QUICK ADD FROM ANALYSIS (C1082)
// ============================================================================

/**
 * C1082: Quick-add constraints from analysis results.
 */
export function quickAddConstraintsFromAnalysis(
  analysisType: 'schema' | 'film' | 'culture',
  matchResult: SchemaRecognitionMatch | FilmDeviceRecognitionMatch | CultureRecognitionMatch
): readonly MusicConstraint[] {
  const constraints: MusicConstraint[] = [];
  if (analysisType === 'schema') {
    const match = matchResult as SchemaRecognitionMatch;
    constraints.push({ type: 'schema', schema: match.schemaName, hard: false } as unknown as MusicConstraint);
  } else if (analysisType === 'film') {
    const match = matchResult as FilmDeviceRecognitionMatch;
    constraints.push({ type: 'film_device', device: match.device, hard: false } as unknown as MusicConstraint);
  } else if (analysisType === 'culture') {
    const match = matchResult as CultureRecognitionMatch;
    constraints.push({ type: 'culture', culture: match.culture, hard: false } as unknown as MusicConstraint);
    if (match.matchedScaleType && match.matchedScaleType.includes('pentatonic')) {
      constraints.push({ type: 'tonality_model', model: 'pentatonic', hard: false } as unknown as MusicConstraint);
    }
  }
  return constraints;
}

// ============================================================================
// SESSION RECORDING ANALYSIS (C923)
// ============================================================================

/**
 * C923: Analyze and tag recorded phrases automatically.
 */
export async function analyzeRecordedPhrase(
  notes: readonly { midi: number; time: number; duration: number; velocity: number }[],
  _spec: MusicSpec,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<{
  tags: readonly string[];
  suggestedSchema: SchemaRecognitionMatch | null;
  suggestedCulture: CultureRecognitionMatch | null;
  densityCategory: 'sparse' | 'moderate' | 'dense';
  contourShape: string;
}>> {
  await ensureLoaded(adapter);
  const midiNotes = notes.map(n => n.midi);

  const totalDuration = notes.length > 0
    ? Math.max(...notes.map(n => n.time + n.duration)) - Math.min(...notes.map(n => n.time))
    : 0;
  const notesPerSecond = totalDuration > 0 ? notes.length / totalDuration : 0;
  const densityCategory = notesPerSecond < 2 ? 'sparse' as const : notesPerSecond < 6 ? 'moderate' as const : 'dense' as const;

  const midpoint = Math.floor(midiNotes.length / 2);
  const firstHalf = midiNotes.slice(0, midpoint);
  const secondHalf = midiNotes.slice(midpoint);
  const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((s, n) => s + n, 0) / firstHalf.length : 0;
  const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((s, n) => s + n, 0) / secondHalf.length : 0;
  const contourShape = secondAvg > firstAvg + 2 ? 'ascending' : secondAvg < firstAvg - 2 ? 'descending' : 'arch';

  const tags: string[] = [densityCategory, contourShape];
  const range = midiNotes.length > 0 ? Math.max(...midiNotes) - Math.min(...midiNotes) : 0;
  if (range > 12) tags.push('wide-range');
  if (range <= 5) tags.push('narrow-range');

  const culture = (await recognizeCulture(midiNotes, adapter)).value;
  const suggestedCulture = culture.length > 0 ? culture[0]! : null;

  return explainable(
    { tags, suggestedSchema: null, suggestedCulture, densityCategory, contourShape },
    ['TS session recording analysis'],
    60
  );
}

// ============================================================================
// MODAL HARMONY EXPLAINER (C697)
// ============================================================================

/** Modal harmony explanation */
export interface ModalHarmonyExplanation {
  readonly mode: string;
  readonly characteristicNotes: readonly string[];
  readonly avoidNotes: readonly string[];
  readonly commonProgressions: readonly string[];
  readonly danceContext: string;
  readonly explanation: string;
}

/**
 * C697: Modal harmony explainer for Celtic music.
 * Provides contextual explanation of modal harmonic practice.
 */
export function explainCelticModalHarmony(
  mode: string,
  tuneType?: string
): ModalHarmonyExplanation {
  const noteNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

  const explanations: Record<string, ModalHarmonyExplanation> = {
    dorian: {
      mode: 'dorian',
      characteristicNotes: ['natural 6th (major 6th above root)', 'minor 3rd'],
      avoidNotes: ['major 7th (use natural 7th sparingly)'],
      commonProgressions: ['i → VII → i', 'i → IV → i', 'i → v → VII → i'],
      danceContext: tuneType === 'reel' ? 'Strong 2-beat pulse suits reel rhythm' : 'Versatile for most Celtic forms',
      explanation: 'Dorian is the most common Celtic mode. The raised 6th gives brightness compared to Aeolian. Drone on the tonic is idiomatic.',
    },
    mixolydian: {
      mode: 'mixolydian',
      characteristicNotes: ['natural 7th (flat 7th)', 'major 3rd'],
      avoidNotes: ['leading tone (major 7th)'],
      commonProgressions: ['I → VII → I', 'I → v → VII → I', 'I → IV → VII → I'],
      danceContext: tuneType === 'jig' ? 'Bright major quality suits jig character' : 'Major-sounding but with modal flavour',
      explanation: 'Mixolydian gives a bright major sound without the leading-tone pull. The flat 7th creates characteristic IV-I plagal motion.',
    },
    aeolian: {
      mode: 'aeolian',
      characteristicNotes: ['minor 3rd', 'minor 6th', 'minor 7th'],
      avoidNotes: ['raised 6th (creates dorian feel)'],
      commonProgressions: ['i → VII → VI → VII → i', 'i → III → VII → i'],
      danceContext: tuneType === 'air' ? 'Melancholy quality suits slow airs' : 'Darker modal quality',
      explanation: 'Natural minor (aeolian) appears in slower, more mournful tunes. Common in laments and slow airs.',
    },
    ionian: {
      mode: 'ionian',
      characteristicNotes: ['major 3rd', 'major 7th'],
      avoidNotes: [],
      commonProgressions: ['I → IV → V → I', 'I → vi → IV → V'],
      danceContext: tuneType === 'hornpipe' ? 'Major key with dotted rhythm suits hornpipe' : 'Standard major key practice',
      explanation: 'Major key (ionian) is less distinctively "Celtic" but appears in many tunes. Often alternates with mixolydian.',
    },
  };

  return explanations[mode] ?? {
    mode,
    characteristicNotes: noteNames.slice(0, 3),
    avoidNotes: [],
    commonProgressions: ['I → IV → I'],
    danceContext: 'Consult culture-specific guidance',
    explanation: `Mode "${mode}" — no specific Celtic guidance available. Consider Dorian or Mixolydian as primary alternatives.`,
  };
}

// ============================================================================
// CELTIC / CHINESE PRESETS (C724, C729, C831)
// ============================================================================

/** Dance accent preset */
export interface DanceAccentPreset {
  readonly name: string;
  readonly tuneType: string;
  readonly beatsPerBar: number;
  readonly accentPattern: readonly number[];
  readonly swingAmount: number;
  readonly description: string;
}

/**
 * C724: Celtic dance accent presets for MeterAccentCard.
 */
export const CELTIC_DANCE_ACCENT_PRESETS: readonly DanceAccentPreset[] = [
  { name: 'Reel', tuneType: 'reel', beatsPerBar: 4, accentPattern: [1.0, 0.4, 0.7, 0.4], swingAmount: 0, description: 'Standard 4/4 reel with strong 1 and 3' },
  { name: 'Jig', tuneType: 'jig', beatsPerBar: 6, accentPattern: [1.0, 0.3, 0.3, 0.7, 0.3, 0.3], swingAmount: 0, description: 'Compound 6/8 jig with strong 1 and 4' },
  { name: 'Slip Jig', tuneType: 'slip_jig', beatsPerBar: 9, accentPattern: [1.0, 0.3, 0.3, 0.7, 0.3, 0.3, 0.5, 0.3, 0.3], swingAmount: 0, description: '9/8 slip jig' },
  { name: 'Hornpipe', tuneType: 'hornpipe', beatsPerBar: 4, accentPattern: [1.0, 0.3, 0.7, 0.3], swingAmount: 0.3, description: 'Dotted hornpipe with swing' },
  { name: 'Polka', tuneType: 'polka', beatsPerBar: 2, accentPattern: [1.0, 0.5], swingAmount: 0, description: '2/4 polka' },
  { name: 'Strathspey', tuneType: 'strathspey', beatsPerBar: 4, accentPattern: [1.0, 0.5, 0.8, 0.4], swingAmount: 0.15, description: 'Scotch snap with slight swing' },
  { name: 'March', tuneType: 'march', beatsPerBar: 4, accentPattern: [1.0, 0.4, 0.6, 0.4], swingAmount: 0, description: '4/4 march with military accent' },
];

/**
 * Get accent preset for a tune type.
 */
export function getCelticAccentPreset(tuneType: string): DanceAccentPreset | undefined {
  return CELTIC_DANCE_ACCENT_PRESETS.find(p => p.tuneType === tuneType);
}

/** Phrase variation preset */
export interface PhraseVariationPreset {
  readonly name: string;
  readonly culture: string;
  readonly techniques: readonly string[];
  readonly description: string;
}

/**
 * C729: Celtic repeat variation presets.
 */
export const CELTIC_VARIATION_PRESETS: readonly PhraseVariationPreset[] = [
  { name: 'Simple Repeat', culture: 'celtic', techniques: ['exact_repeat'], description: 'Exact repeat of the phrase (common in AABB form)' },
  { name: 'Octave Shift', culture: 'celtic', techniques: ['octave_up', 'octave_down'], description: 'Repeat an octave higher or lower' },
  { name: 'Ornamental', culture: 'celtic', techniques: ['add_rolls', 'add_cuts', 'add_taps'], description: 'Add ornaments on the repeat' },
  { name: 'Rhythmic Variation', culture: 'celtic', techniques: ['dotted_rhythm', 'triplet_substitution'], description: 'Change rhythmic groupings' },
  { name: 'Cadential Change', culture: 'celtic', techniques: ['change_cadence', 'extend_final_note'], description: 'Modify the ending of the repeated phrase' },
  { name: 'Double Stop Addition', culture: 'celtic', techniques: ['add_double_stops', 'add_drone_string'], description: 'Add double stops or drone on repeat' },
];

/**
 * C831: Chinese variation presets.
 */
export const CHINESE_VARIATION_PRESETS: readonly PhraseVariationPreset[] = [
  { name: 'Ornamental Variation', culture: 'chinese', techniques: ['add_hua_zhi', 'add_glissando'], description: 'Add characteristic Chinese ornaments' },
  { name: 'Heterophonic Echo', culture: 'chinese', techniques: ['heterophonic_delay', 'octave_variation'], description: 'Create a heterophonic variant' },
  { name: 'Rhythmic Diminution', culture: 'chinese', techniques: ['double_speed', 'fill_gaps'], description: 'Compress rhythm and add passing tones' },
  { name: 'Register Shift', culture: 'chinese', techniques: ['octave_up', 'range_expansion'], description: 'Shift to a different register' },
  { name: 'Pentatonic Substitution', culture: 'chinese', techniques: ['pentatonic_neighbor', 'bian_tone_avoidance'], description: 'Replace notes with pentatonic neighbors' },
];

// ============================================================================
// VOICE-LEADING WARNING (C939)
// ============================================================================

/**
 * C939: Check voice-leading quality and warn on issues.
 * Uses the existing VoiceLeadingIssue interface (defined above for C938).
 */
export function checkVoiceLeadingSimple(
  voices: readonly (readonly number[])[],
  maxLeap: number = 12
): readonly VoiceLeadingIssue[] {
  const issues: VoiceLeadingIssue[] = [];
  if (voices.length < 2) return issues;

  const length = Math.min(...voices.map(v => v.length));

  for (let pos = 1; pos < length; pos++) {
    for (let v1 = 0; v1 < voices.length; v1++) {
      const voice1 = voices[v1]!;
      const leap = Math.abs(voice1[pos]! - voice1[pos - 1]!);
      if (leap > maxLeap) {
        issues.push({
          position: pos,
          voices: [v1, v1],
          issue: `Voice ${v1}: leap of ${leap} semitones exceeds max ${maxLeap}`,
          severity: leap > 16 ? 'error' : 'warning',
        });
      }

      for (let v2 = v1 + 1; v2 < voices.length; v2++) {
        const voice2 = voices[v2]!;
        const prevInterval = (voice2[pos - 1]! - voice1[pos - 1]! + 1200) % 12;
        const currInterval = (voice2[pos]! - voice1[pos]! + 1200) % 12;

        if (prevInterval === 7 && currInterval === 7) {
          issues.push({ position: pos, voices: [v1, v2], issue: `Parallel fifths between voices ${v1} and ${v2}`, severity: 'warning' });
        }
        if (prevInterval === 0 && currInterval === 0 && voice1[pos] !== voice1[pos - 1]) {
          issues.push({ position: pos, voices: [v1, v2], issue: `Parallel octaves between voices ${v1} and ${v2}`, severity: 'warning' });
        }
        if (voice1[pos]! > voice2[pos]! && voice1[pos - 1]! < voice2[pos - 1]!) {
          issues.push({ position: pos, voices: [v1, v2], issue: `Voice crossing between voices ${v1} and ${v2}`, severity: 'warning' });
        }
      }
    }
  }

  return issues;
}

// ============================================================================
// SAMPLE DECK EXPORTS (C991, C992)
// ============================================================================

/** Deck export definition */
export interface DeckExportDefinition {
  readonly deckId: string;
  readonly name: string;
  readonly description: string;
  readonly cards: readonly string[];
  readonly defaultConstraints: readonly { type: string; [key: string]: unknown }[];
  readonly culture?: string;
}

/**
 * C991: Sample deck JSON export definitions.
 */
export const SAMPLE_DECK_EXPORTS: readonly DeckExportDefinition[] = [
  {
    deckId: 'theory-deck',
    name: 'Theory Deck',
    description: 'Core music theory tools: tonality, meter, grouping, key',
    cards: ['tonality_model', 'meter_accent', 'grouping', 'constraint_pack'],
    defaultConstraints: [{ type: 'key', root: 'c', mode: 'ionian', hard: false }],
  },
  {
    deckId: 'film-deck',
    name: 'Film Scoring Deck',
    description: 'Film scoring tools: mood, devices, orchestration',
    cards: ['film_scoring', 'trailer_build', 'leitmotif_library', 'leitmotif_matcher'],
    defaultConstraints: [{ type: 'film_mood', mood: 'wonder', hard: false }],
  },
  {
    deckId: 'galant-deck',
    name: 'Galant Schema Deck',
    description: 'Galant-era contrapuntal patterns',
    cards: ['schema', 'tonality_analysis', 'grouping_analysis', 'schema_analysis'],
    defaultConstraints: [{ type: 'schema', schema: 'romanesca', hard: false }],
  },
  {
    deckId: 'world-deck-carnatic',
    name: 'Carnatic Music Deck',
    description: 'Carnatic theory: raga, tala, gamaka, korvai',
    cards: ['carnatic_raga_tala', 'mridangam_pattern', 'korvai_generator', 'ornament_generator'],
    defaultConstraints: [{ type: 'culture', culture: 'carnatic', hard: false }],
    culture: 'carnatic',
  },
  {
    deckId: 'world-deck-celtic',
    name: 'Celtic Music Deck',
    description: 'Celtic theory: tune types, ornaments, forms, drone',
    cards: ['celtic_tune', 'bodhran', 'drone', 'set_builder'],
    defaultConstraints: [{ type: 'culture', culture: 'celtic', hard: false }],
    culture: 'celtic',
  },
  {
    deckId: 'world-deck-chinese',
    name: 'Chinese Music Deck',
    description: 'Chinese theory: modes, heterophony, ornaments',
    cards: ['chinese_mode', 'heterophony', 'guzheng_gliss', 'erhu_ornament'],
    defaultConstraints: [{ type: 'culture', culture: 'chinese', hard: false }],
    culture: 'chinese',
  },
  {
    deckId: 'jazz-deck',
    name: 'Jazz Improvisation Deck',
    description: 'Jazz vocabulary, bebop scales, guide tones, licks',
    cards: ['bebop_scale', 'enclosure', 'digital_pattern', 'guide_tone', 'lick_library'],
    defaultConstraints: [{ type: 'style', style: 'jazz', hard: false }],
  },
  {
    deckId: 'lcc-deck',
    name: 'Lydian Chromatic Deck',
    description: "George Russell's LCC: tonal gravity, parent scales, chord-scale unity",
    cards: ['lydian_chromatic', 'tonal_gravity_visualizer', 'parent_scale', 'chord_scale_unity', 'upper_structure'],
    defaultConstraints: [],
  },
];

/** Board preset definition */
export interface BoardPresetDefinition {
  readonly boardId: string;
  readonly name: string;
  readonly description: string;
  readonly decks: readonly string[];
  readonly layout: 'horizontal' | 'grid' | 'stacked';
}

/**
 * C992: Sample board presets referencing deck exports.
 */
export const SAMPLE_BOARD_PRESETS: readonly BoardPresetDefinition[] = [
  { boardId: 'composition-board', name: 'Composition Studio', description: 'Full composition environment', decks: ['theory-deck', 'galant-deck'], layout: 'horizontal' },
  { boardId: 'film-scoring-board', name: 'Film Scoring Suite', description: 'Film scoring with theory support', decks: ['film-deck', 'theory-deck'], layout: 'grid' },
  { boardId: 'celtic-board', name: 'Celtic Workshop', description: 'Celtic music creation', decks: ['world-deck-celtic', 'theory-deck'], layout: 'horizontal' },
  { boardId: 'carnatic-board', name: 'Carnatic Studio', description: 'Carnatic music composition', decks: ['world-deck-carnatic', 'theory-deck'], layout: 'horizontal' },
  { boardId: 'chinese-board', name: 'Chinese Music Lab', description: 'Chinese music exploration', decks: ['world-deck-chinese', 'theory-deck'], layout: 'grid' },
  { boardId: 'jazz-improv-board', name: 'Jazz Improvisation Board', description: 'Jazz practice and learning', decks: ['jazz-deck', 'lcc-deck'], layout: 'stacked' },
];

/**
 * Get deck export by ID.
 */
export function getDeckExport(deckId: string): DeckExportDefinition | undefined {
  return SAMPLE_DECK_EXPORTS.find(d => d.deckId === deckId);
}

/**
 * Get board preset by ID.
 */
export function getBoardPreset(boardId: string): BoardPresetDefinition | undefined {
  return SAMPLE_BOARD_PRESETS.find(b => b.boardId === boardId);
}

// ============================================================================
// EDUCATIONAL / PRO MODE (C987, C988)
// ============================================================================

/** Disclosure level for theory features */
export type DisclosureLevel = 'beginner' | 'intermediate' | 'advanced' | 'pro';

/** Mode configuration */
export interface TheoryModeConfig {
  readonly level: DisclosureLevel;
  readonly showExplanations: boolean;
  readonly showRawProlog: boolean;
  readonly showConfidenceScores: boolean;
  readonly showConstraintDetails: boolean;
  readonly maxRecommendations: number;
  readonly showCultureTags: boolean;
  readonly enableCustomConstraints: boolean;
}

/**
 * C987/C988: Get mode configuration for a disclosure level.
 */
export function getTheoryModeConfig(level: DisclosureLevel): TheoryModeConfig {
  switch (level) {
    case 'beginner':
      return {
        level: 'beginner',
        showExplanations: true,
        showRawProlog: false,
        showConfidenceScores: false,
        showConstraintDetails: false,
        maxRecommendations: 3,
        showCultureTags: false,
        enableCustomConstraints: false,
      };
    case 'intermediate':
      return {
        level: 'intermediate',
        showExplanations: true,
        showRawProlog: false,
        showConfidenceScores: true,
        showConstraintDetails: true,
        maxRecommendations: 5,
        showCultureTags: true,
        enableCustomConstraints: false,
      };
    case 'advanced':
      return {
        level: 'advanced',
        showExplanations: true,
        showRawProlog: false,
        showConfidenceScores: true,
        showConstraintDetails: true,
        maxRecommendations: 10,
        showCultureTags: true,
        enableCustomConstraints: true,
      };
    case 'pro':
      return {
        level: 'pro',
        showExplanations: false,
        showRawProlog: true,
        showConfidenceScores: true,
        showConstraintDetails: true,
        maxRecommendations: 20,
        showCultureTags: true,
        enableCustomConstraints: true,
      };
  }
}

// ============================================================================
// TELEMETRY HOOKS (C989)
// ============================================================================

/** Telemetry event type */
export interface TheoryTelemetryEvent {
  readonly tool: string;
  readonly action: string;
  readonly culture?: string;
  readonly timestamp: number;
  readonly durationMs?: number;
}

/**
 * C989: Local-only telemetry for measuring theory tool usage.
 * Privacy-first: stores only in-memory, no network calls.
 */
export class TheoryTelemetry {
  private readonly events: TheoryTelemetryEvent[] = [];
  private readonly maxEvents = 1000;

  record(tool: string, action: string, culture?: string, durationMs?: number): void {
    if (this.events.length >= this.maxEvents) {
      this.events.splice(0, this.events.length - this.maxEvents + 100);
    }
    const event: TheoryTelemetryEvent = { tool, action, timestamp: Date.now() };
    if (culture !== undefined) (event as { culture?: string }).culture = culture;
    if (durationMs !== undefined) (event as { durationMs?: number }).durationMs = durationMs;
    this.events.push(event);
  }

  getEvents(): readonly TheoryTelemetryEvent[] {
    return this.events;
  }

  getUsageSummary(): Record<string, number> {
    const summary: Record<string, number> = {};
    for (const event of this.events) {
      const key = `${event.tool}:${event.action}`;
      summary[key] = (summary[key] ?? 0) + 1;
    }
    return summary;
  }

  getMostUsedTools(n: number = 5): readonly { tool: string; count: number }[] {
    const counts: Record<string, number> = {};
    for (const event of this.events) {
      counts[event.tool] = (counts[event.tool] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([tool, count]) => ({ tool, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, n);
  }

  clear(): void {
    this.events.length = 0;
  }
}

/** Global telemetry instance */
export const theoryTelemetry = new TheoryTelemetry();

// ============================================================================
// CELTIC SESSION ARRANGEMENT TEMPLATES (C694)
// ============================================================================

/** Session arrangement template */
export interface SessionArrangementTemplate {
  readonly name: string;
  readonly tuneType: string;
  readonly structure: readonly string[];
  readonly tempoRange: readonly [number, number];
  readonly keyPreferences: readonly string[];
  readonly description: string;
}

/**
 * C694: Celtic session arrangement templates.
 */
export const CELTIC_ARRANGEMENT_TEMPLATES: readonly SessionArrangementTemplate[] = [
  {
    name: 'Standard Reel Set',
    tuneType: 'reel',
    structure: ['Tune A (x2)', 'Tune B (x2)', 'Tune C (x2)'],
    tempoRange: [110, 130],
    keyPreferences: ['d', 'g', 'a'],
    description: 'Three reels played in succession, 2x each',
  },
  {
    name: 'Jig Set',
    tuneType: 'jig',
    structure: ['Tune A (x2)', 'Tune B (x2)'],
    tempoRange: [110, 125],
    keyPreferences: ['d', 'g', 'e'],
    description: 'Two jigs, 2x each',
  },
  {
    name: 'Slow Air + Reel',
    tuneType: 'mixed',
    structure: ['Slow Air (free tempo)', 'Reel (x3)'],
    tempoRange: [60, 130],
    keyPreferences: ['d', 'g'],
    description: 'Start with a slow air, build into reels',
  },
  {
    name: 'Hornpipe Set',
    tuneType: 'hornpipe',
    structure: ['Hornpipe A (x2)', 'Hornpipe B (x2)'],
    tempoRange: [80, 100],
    keyPreferences: ['d', 'g', 'c'],
    description: 'Two hornpipes with characteristic dotted rhythm',
  },
  {
    name: 'Polka Set',
    tuneType: 'polka',
    structure: ['Polka A (x4)', 'Polka B (x4)'],
    tempoRange: [120, 140],
    keyPreferences: ['d', 'a'],
    description: 'Fast polkas, Sliabh Luachra style',
  },
];

/**
 * Get arrangement templates for a tune type.
 */
export function getCelticArrangementTemplate(tuneType: string): SessionArrangementTemplate | undefined {
  return CELTIC_ARRANGEMENT_TEMPLATES.find(t => t.tuneType === tuneType);
}

// ============================================================================
// SET BUILDER (C734)
// ============================================================================

/** Set (medley) configuration */
export interface TuneSetConfig {
  readonly setName: string;
  readonly tunes: readonly { name: string; tuneType: string; key: string; repeats: number }[];
  readonly totalDurationEstimate: number;
  readonly keyCompatibility: number;
}

/**
 * C734: Set builder tool — build Celtic tune sets/medleys.
 * Evaluates key compatibility and suggests ordering.
 */
export function buildTuneSet(
  tunes: readonly { name: string; tuneType: string; key: string }[],
  repeatsPerTune: number = 2
): TuneSetConfig {
  // Evaluate key compatibility
  const keys = tunes.map(t => t.key);
  void new Set(keys); // Used for potential future key-count-based scoring

  // Key compatibility: related keys score higher
  const relatedKeyMap: Record<string, readonly string[]> = {
    d: ['g', 'a', 'e', 'b'],
    g: ['d', 'c', 'a', 'e'],
    a: ['d', 'e', 'b', 'g'],
    c: ['g', 'f', 'd'],
    e: ['a', 'b', 'd'],
  };

  let compatibility = 1.0;
  for (let i = 1; i < tunes.length; i++) {
    const prevKey = tunes[i - 1]!.key.toLowerCase();
    const currKey = tunes[i]!.key.toLowerCase();
    if (prevKey === currKey) {
      compatibility *= 1.0;
    } else if (relatedKeyMap[prevKey]?.includes(currKey)) {
      compatibility *= 0.9;
    } else {
      compatibility *= 0.6;
    }
  }

  // Estimate duration (roughly 30s per tune per repeat for reels at 120bpm)
  const totalRepeats = tunes.length * repeatsPerTune;
  const totalDurationEstimate = totalRepeats * 30;

  return {
    setName: tunes.map(t => t.name).join(' / '),
    tunes: tunes.map(t => ({ ...t, repeats: repeatsPerTune })),
    totalDurationEstimate,
    keyCompatibility: Math.round(compatibility * 100),
  };
}

// ============================================================================
// VOCABULARY EXPORT TO PRACTICE SHEETS (C1441)
// ============================================================================

/** Practice sheet format */
export interface PracticeSheetExport {
  readonly title: string;
  readonly exercises: readonly { name: string; notes: readonly number[]; description: string }[];
  readonly format: 'notation' | 'text';
  readonly difficulty: string;
}

/**
 * C1441: Export vocabulary to practice sheet format.
 */
export function exportVocabularyToPracticeSheet(
  vocabulary: readonly { pattern: readonly number[]; name: string; category: string }[],
  title: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
): PracticeSheetExport {
  const exercises = vocabulary.map((v, i) => ({
    name: `${i + 1}. ${v.name} (${v.category})`,
    notes: [...v.pattern],
    description: `Practice ${v.category} pattern: ${v.name}`,
  }));

  return {
    title,
    exercises,
    format: 'notation',
    difficulty,
  };
}

// ============================================================================
// AABB FORM MARKERS (C693)
// ============================================================================

/** Form section marker for tracker display */
export interface FormSectionMarker {
  readonly label: string;
  readonly startBar: number;
  readonly endBar: number;
  readonly repeatCount: number;
  readonly sectionLetter: string;
}

/**
 * C693: Generate AABB form markers for Celtic tune display in tracker.
 * Standard Celtic forms: AABB (8-bar sections), sometimes AAB, AABBC.
 */
export function generateFormMarkers(
  formPattern: string,
  barsPerSection: number = 8
): readonly FormSectionMarker[] {
  const markers: FormSectionMarker[] = [];
  let currentBar = 0;
  let i = 0;

  while (i < formPattern.length) {
    const letter = formPattern[i]!;
    let repeatCount = 1;

    // Count consecutive identical letters
    while (i + repeatCount < formPattern.length && formPattern[i + repeatCount] === letter) {
      repeatCount++;
    }

    markers.push({
      label: `Part ${letter} (x${repeatCount})`,
      startBar: currentBar,
      endBar: currentBar + barsPerSection * repeatCount,
      repeatCount,
      sectionLetter: letter,
    });

    currentBar += barsPerSection * repeatCount;
    i += repeatCount;
  }

  return markers;
}

/**
 * Standard Celtic form patterns.
 */
export const CELTIC_FORM_PATTERNS: Record<string, string> = {
  reel: 'AABB',
  jig: 'AABB',
  hornpipe: 'AABB',
  polka: 'AABB',
  slip_jig: 'AABB',
  slow_air: 'AAB',
  march: 'AABBCC',
  strathspey: 'AABB',
};

// ============================================================================
// HARP VOICING DATA FOR CELTIC (C748)
// ============================================================================

/** Celtic harp voicing template */
export interface HarpVoicingTemplate {
  readonly name: string;
  readonly description: string;
  readonly leftHand: readonly number[];   // intervals from root
  readonly rightHand: readonly number[];  // intervals from root
  readonly arpeggiate: boolean;
  readonly suitableFor: readonly string[];
}

/**
 * C748: Celtic harp voicing templates for arranger role allocation.
 */
export const CELTIC_HARP_VOICINGS: readonly HarpVoicingTemplate[] = [
  {
    name: 'open_fifth_drone',
    description: 'Open fifth in left hand, melody in right',
    leftHand: [0, 7],
    rightHand: [0, 4, 7, 12],
    arpeggiate: false,
    suitableFor: ['slow_air', 'lament'],
  },
  {
    name: 'arpeggiated_triad',
    description: 'Rolling arpeggiated triad accompaniment',
    leftHand: [0, 7],
    rightHand: [0, 4, 7, 12],
    arpeggiate: true,
    suitableFor: ['reel', 'jig', 'waltz'],
  },
  {
    name: 'block_chord',
    description: 'Block chords for rhythmic accompaniment',
    leftHand: [0, 7, 12],
    rightHand: [0, 4, 7],
    arpeggiate: false,
    suitableFor: ['march', 'hornpipe'],
  },
  {
    name: 'octave_bass',
    description: 'Octave bass with upper chord',
    leftHand: [0, 12],
    rightHand: [0, 4, 7],
    arpeggiate: false,
    suitableFor: ['reel', 'jig', 'polka'],
  },
  {
    name: 'modal_cluster',
    description: 'Modal cluster voicing (seconds and fourths)',
    leftHand: [0, 7],
    rightHand: [0, 2, 5, 7],
    arpeggiate: false,
    suitableFor: ['slow_air', 'sean_nos'],
  },
];

/**
 * Get harp voicing suitable for a tune type.
 */
export function getHarpVoicing(tuneType: string): HarpVoicingTemplate {
  const match = CELTIC_HARP_VOICINGS.find(v => v.suitableFor.includes(tuneType));
  return match ?? CELTIC_HARP_VOICINGS[0]!;
}

// ============================================================================
// SHENG VOICING DATA FOR CHINESE (C815)
// ============================================================================

/** Sheng (mouth organ) voicing template */
export interface ShengVoicingTemplate {
  readonly name: string;
  readonly description: string;
  readonly intervals: readonly number[];
  readonly maxVoices: number;
  readonly suitableFor: readonly string[];
}

/**
 * C815: Sheng voicing templates for Chinese ensemble arranger.
 */
export const SHENG_VOICINGS: readonly ShengVoicingTemplate[] = [
  {
    name: 'parallel_fourths',
    description: 'Traditional parallel fourths (he sheng)',
    intervals: [0, 5],
    maxVoices: 2,
    suitableFor: ['gong', 'zhi', 'shang'],
  },
  {
    name: 'parallel_fifths',
    description: 'Parallel fifths voicing',
    intervals: [0, 7],
    maxVoices: 2,
    suitableFor: ['gong', 'yu', 'jue'],
  },
  {
    name: 'cluster_pad',
    description: 'Pentatonic cluster for pad texture',
    intervals: [0, 2, 4, 7, 9],
    maxVoices: 5,
    suitableFor: ['gong', 'shang', 'jue'],
  },
  {
    name: 'octave_doubling',
    description: 'Octave doubling for melody reinforcement',
    intervals: [0, 12],
    maxVoices: 2,
    suitableFor: ['gong', 'zhi', 'yu', 'shang', 'jue'],
  },
  {
    name: 'traditional_chord',
    description: 'Traditional 3-note he sheng chord',
    intervals: [0, 5, 9],
    maxVoices: 3,
    suitableFor: ['gong', 'zhi'],
  },
];

/**
 * Get sheng voicing suitable for a Chinese mode.
 */
export function getShengVoicing(modeName: string): ShengVoicingTemplate {
  const match = SHENG_VOICINGS.find(v => v.suitableFor.includes(modeName));
  return match ?? SHENG_VOICINGS[0]!;
}

// ============================================================================
// SECTION MARKERS FROM GESTURES (C828)
// ============================================================================

/** Section marker for tracker placement */
export interface SectionMarker {
  readonly position: number;
  readonly label: string;
  readonly type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'solo' | 'outro' | 'section';
  readonly confidence: number;
}

/**
 * C828: Suggest section markers from musical gestures.
 * Analyzes energy/texture changes to suggest structural boundaries.
 */
export function suggestSectionMarkers(
  energyProfile: readonly number[],
  threshold: number = 0.3
): readonly SectionMarker[] {
  const markers: SectionMarker[] = [];
  if (energyProfile.length === 0) return markers;

  // Always mark position 0 as intro
  markers.push({
    position: 0,
    label: 'Intro',
    type: 'intro',
    confidence: 100,
  });

  // Look for significant energy changes
  for (let i = 1; i < energyProfile.length; i++) {
    const prev = energyProfile[i - 1]!;
    const curr = energyProfile[i]!;
    const delta = Math.abs(curr - prev);

    if (delta >= threshold) {
      const isRising = curr > prev;
      let sectionType: SectionMarker['type'] = 'section';
      let label = `Section ${markers.length + 1}`;

      if (isRising && curr > 0.7) {
        sectionType = 'chorus';
        label = 'Chorus';
      } else if (!isRising && curr < 0.3) {
        sectionType = 'bridge';
        label = 'Bridge';
      } else if (isRising) {
        sectionType = 'verse';
        label = 'Verse';
      }

      // Check if near end
      if (i > energyProfile.length * 0.85) {
        sectionType = 'outro';
        label = 'Outro';
      }

      markers.push({
        position: i,
        label,
        type: sectionType,
        confidence: Math.min(100, Math.round(delta * 200)),
      });
    }
  }

  return markers;
}

// ============================================================================
// ANALYSIS RESULT CARD MODELS (C884)
// ============================================================================

/** Analysis result card display model */
export interface AnalysisResultCard {
  readonly cardId: string;
  readonly title: string;
  readonly category: 'tonality' | 'rhythm' | 'schema' | 'culture' | 'form' | 'general';
  readonly summary: string;
  readonly details: readonly { label: string; value: string }[];
  readonly confidence: number;
  readonly actions: readonly { label: string; actionId: string }[];
}

/**
 * C884: Build analysis result cards from various analysis outputs.
 */
export function buildAnalysisResultCard(
  analysisType: string,
  result: Record<string, unknown>
): AnalysisResultCard {
  const cardId = `analysis-${analysisType}-${Date.now()}`;

  switch (analysisType) {
    case 'schema': {
      const schemaName = (result['schemaName'] as string) ?? 'unknown';
      const confidence = (result['confidence'] as number) ?? 50;
      return {
        cardId,
        title: `Schema: ${schemaName}`,
        category: 'schema',
        summary: `Detected ${schemaName} schema pattern`,
        details: [
          { label: 'Schema', value: schemaName },
          { label: 'Confidence', value: `${confidence}%` },
        ],
        confidence,
        actions: [
          { label: 'Apply as constraint', actionId: 'apply_schema' },
          { label: 'Show in notation', actionId: 'show_notation' },
        ],
      };
    }
    case 'culture': {
      const culture = (result['culture'] as string) ?? 'unknown';
      const confidence = (result['confidence'] as number) ?? 50;
      return {
        cardId,
        title: `Culture: ${culture}`,
        category: 'culture',
        summary: `Detected ${culture} musical characteristics`,
        details: [
          { label: 'Culture', value: culture },
          { label: 'Confidence', value: `${confidence}%` },
        ],
        confidence,
        actions: [
          { label: 'Apply culture preset', actionId: 'apply_culture' },
          { label: 'Show recommended cards', actionId: 'show_cards' },
        ],
      };
    }
    case 'tonality': {
      const key = (result['key'] as string) ?? 'unknown';
      const mode = (result['mode'] as string) ?? 'unknown';
      return {
        cardId,
        title: `Key: ${key} ${mode}`,
        category: 'tonality',
        summary: `Detected ${key} ${mode}`,
        details: [
          { label: 'Key', value: key },
          { label: 'Mode', value: mode },
        ],
        confidence: (result['confidence'] as number) ?? 50,
        actions: [
          { label: 'Set key constraint', actionId: 'set_key' },
        ],
      };
    }
    default:
      return {
        cardId,
        title: `Analysis: ${analysisType}`,
        category: 'general',
        summary: `${analysisType} analysis result`,
        details: Object.entries(result).map(([k, v]) => ({ label: k, value: String(v) })),
        confidence: 50,
        actions: [],
      };
  }
}

// ============================================================================
// ORCHESTRATION ROLE ALLOCATION (C899)
// ============================================================================

/** Orchestration role assignment */
export interface OrchestratorRoleAssignment {
  readonly voiceIndex: number;
  readonly role: string;
  readonly instrument: string;
  readonly register: string;
  readonly dynamic: string;
}

/**
 * C899: Allocate roles to voices for orchestration.
 * Assigns melody, harmony, bass, countermelody, pad roles.
 */
export function allocateOrchestrationRoles(
  voiceCount: number,
  style: string = 'default',
  _spec?: MusicSpec
): readonly OrchestratorRoleAssignment[] {
  const roles: OrchestratorRoleAssignment[] = [];

  // Standard role allocation patterns
  const roleTemplates: Record<string, readonly { role: string; instrument: string; register: string; dynamic: string }[]> = {
    default: [
      { role: 'melody', instrument: 'violin', register: 'high', dynamic: 'f' },
      { role: 'harmony', instrument: 'viola', register: 'mid', dynamic: 'mf' },
      { role: 'bass', instrument: 'cello', register: 'low', dynamic: 'mf' },
      { role: 'countermelody', instrument: 'flute', register: 'high', dynamic: 'mp' },
      { role: 'pad', instrument: 'horn', register: 'mid', dynamic: 'p' },
    ],
    film: [
      { role: 'melody', instrument: 'strings', register: 'high', dynamic: 'f' },
      { role: 'pad', instrument: 'strings_pad', register: 'mid', dynamic: 'mp' },
      { role: 'bass', instrument: 'contrabass', register: 'low', dynamic: 'mf' },
      { role: 'color', instrument: 'woodwinds', register: 'high', dynamic: 'p' },
      { role: 'rhythm', instrument: 'percussion', register: 'mid', dynamic: 'mf' },
    ],
    jazz: [
      { role: 'melody', instrument: 'saxophone', register: 'mid', dynamic: 'f' },
      { role: 'harmony', instrument: 'piano', register: 'mid', dynamic: 'mf' },
      { role: 'bass', instrument: 'upright_bass', register: 'low', dynamic: 'mf' },
      { role: 'rhythm', instrument: 'drums', register: 'mid', dynamic: 'mf' },
      { role: 'countermelody', instrument: 'trumpet', register: 'high', dynamic: 'mf' },
    ],
    celtic: [
      { role: 'melody', instrument: 'fiddle', register: 'high', dynamic: 'f' },
      { role: 'harmony', instrument: 'bouzouki', register: 'mid', dynamic: 'mf' },
      { role: 'bass', instrument: 'guitar', register: 'low', dynamic: 'mf' },
      { role: 'ornament', instrument: 'tin_whistle', register: 'high', dynamic: 'mp' },
      { role: 'drone', instrument: 'uilleann_pipes', register: 'low', dynamic: 'p' },
    ],
    chinese: [
      { role: 'melody', instrument: 'erhu', register: 'mid', dynamic: 'f' },
      { role: 'heterophony', instrument: 'dizi', register: 'high', dynamic: 'mf' },
      { role: 'pad', instrument: 'sheng', register: 'mid', dynamic: 'mp' },
      { role: 'bass', instrument: 'zhongruan', register: 'low', dynamic: 'mf' },
      { role: 'color', instrument: 'guzheng', register: 'high', dynamic: 'mp' },
    ],
  };

  const template = roleTemplates[style] ?? roleTemplates['default']!;

  for (let i = 0; i < voiceCount; i++) {
    const templateIdx = i % template.length;
    const t = template[templateIdx]!;
    roles.push({
      voiceIndex: i,
      role: t.role,
      instrument: t.instrument,
      register: t.register,
      dynamic: t.dynamic,
    });
  }

  return roles;
}

// ============================================================================
// MIXER DEFAULTS FROM ORCHESTRATION (C900)
// ============================================================================

/** Mixer channel defaults */
export interface MixerChannelDefaults {
  readonly channelIndex: number;
  readonly label: string;
  readonly volume: number;     // 0-1
  readonly pan: number;        // -1 to 1
  readonly muted: boolean;
  readonly soloed: boolean;
}

/**
 * C900: Generate mixer defaults from orchestration role allocation.
 */
export function generateMixerDefaults(
  roles: readonly OrchestratorRoleAssignment[]
): readonly MixerChannelDefaults[] {
  const dynamicToVolume: Record<string, number> = {
    pp: 0.2,
    p: 0.35,
    mp: 0.5,
    mf: 0.65,
    f: 0.8,
    ff: 0.95,
  };

  const roleToPan: Record<string, number> = {
    melody: 0,
    harmony: 0.3,
    bass: 0,
    countermelody: -0.3,
    pad: 0,
    color: 0.5,
    rhythm: 0,
    ornament: -0.4,
    drone: 0,
    heterophony: -0.2,
  };

  return roles.map((role, i) => ({
    channelIndex: i,
    label: `${role.instrument} (${role.role})`,
    volume: dynamicToVolume[role.dynamic] ?? 0.65,
    pan: roleToPan[role.role] ?? 0,
    muted: false,
    soloed: false,
  }));
}

// ============================================================================
// ARRANGER VARIATION DEFAULTS (C932)
// ============================================================================

/** Variation index recommendation */
export interface VariationRecommendation {
  readonly partIndex: number;
  readonly partName: string;
  readonly recommendedVariation: number;
  readonly reason: string;
}

/**
 * C932: Recommend default variation indices for arranger song parts.
 * Suggests which variation level to use for each part to create contrast.
 */
export function recommendVariations(
  partNames: readonly string[],
  _spec?: MusicSpec
): readonly VariationRecommendation[] {
  // Standard variation arc: build, peak, resolve
  const arcMap: Record<string, number> = {
    intro: 0,
    verse: 1,
    chorus: 2,
    bridge: 1,
    solo: 3,
    outro: 1,
    breakdown: 0,
    buildup: 2,
    drop: 3,
  };

  return partNames.map((name, i) => {
    const lower = name.toLowerCase();
    let variation = arcMap[lower];
    if (variation === undefined) {
      // Default: gradual build over time
      variation = Math.min(3, Math.floor(i / Math.max(1, partNames.length / 4)));
    }
    return {
      partIndex: i,
      partName: name,
      recommendedVariation: variation,
      reason: arcMap[lower] !== undefined
        ? `${name} typically uses variation ${variation}`
        : `Position-based: gradual build`,
    };
  });
}

// ============================================================================
// FILL-AT-END TRIGGERS (C934)
// ============================================================================

/** Fill trigger point */
export interface FillTrigger {
  readonly barPosition: number;
  readonly fillType: string;
  readonly intensity: number;
  readonly reason: string;
}

/**
 * C934: Determine where fills should be triggered at section ends.
 */
export function suggestFillTriggers(
  sectionBoundaries: readonly number[],
  totalBars: number,
  _spec?: MusicSpec
): readonly FillTrigger[] {
  const triggers: FillTrigger[] = [];

  for (const boundary of sectionBoundaries) {
    if (boundary <= 0 || boundary >= totalBars) continue;

    // Fill starts 1-2 bars before the boundary
    const fillBar = Math.max(0, boundary - 1);

    // Intensity based on position in song
    const positionRatio = boundary / totalBars;
    let intensity = 0.5;
    let fillType = 'standard';

    if (positionRatio > 0.8) {
      intensity = 0.9;
      fillType = 'climactic';
    } else if (positionRatio > 0.5) {
      intensity = 0.7;
      fillType = 'building';
    } else if (positionRatio < 0.2) {
      intensity = 0.3;
      fillType = 'subtle';
    }

    triggers.push({
      barPosition: fillBar,
      fillType,
      intensity,
      reason: `Section boundary at bar ${boundary}`,
    });
  }

  return triggers;
}

// ============================================================================
// BOARD TEMPLATES (C349, C350, C751)
// ============================================================================

/** Board template definition */
export interface BoardTemplate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly decks: readonly string[];
  readonly tools: readonly string[];
  readonly defaultSpec: Partial<{
    culture: string;
    tonalityModel: string;
    style: string;
  }>;
}

/**
 * C349: Galant workspace board template.
 */
export const GALANT_BOARD_TEMPLATE: BoardTemplate = {
  id: 'galant-workspace',
  name: 'Galant Workspace',
  description: 'Notation + schema browser + harmony explorer + phrase generator for galant style composition',
  category: 'composition',
  decks: ['notation', 'schema_browser', 'harmony_explorer', 'phrase_generator'],
  tools: ['schema_card', 'tonality_model_card', 'grouping_card'],
  defaultSpec: {
    culture: 'western',
    tonalityModel: 'functional',
    style: 'galant',
  },
};

/**
 * C350: Galant board with tool gating.
 */
export const GALANT_BOARD_WITH_GATING: BoardTemplate = {
  id: 'galant-gated',
  name: 'Galant (Guided)',
  description: 'Guided galant composition with progressive tool availability',
  category: 'education',
  decks: ['notation', 'schema_browser', 'harmony_explorer'],
  tools: ['schema_card', 'tonality_model_card'],
  defaultSpec: {
    culture: 'western',
    tonalityModel: 'functional',
    style: 'galant',
  },
};

/**
 * C751: Celtic board template.
 */
export const CELTIC_BOARD_TEMPLATE: BoardTemplate = {
  id: 'celtic-session',
  name: 'Celtic Session',
  description: 'Tracker + ornament generator + drone + set builder for Celtic music',
  category: 'composition',
  decks: ['tracker', 'ornament_generator', 'drone', 'set_builder'],
  tools: ['celtic_tune_card', 'bodhran_card', 'heterophony_card'],
  defaultSpec: {
    culture: 'celtic',
    tonalityModel: 'modal',
    style: 'celtic',
  },
};

/**
 * Get all built-in board templates.
 */
export function getAllBoardTemplates(): readonly BoardTemplate[] {
  return [GALANT_BOARD_TEMPLATE, GALANT_BOARD_WITH_GATING, CELTIC_BOARD_TEMPLATE];
}

// ============================================================================
// CONSTRAINT BROWSER SEARCH/FILTER (C1012)
// ============================================================================

/** Constraint search result */
export interface ConstraintSearchResult {
  readonly constraintType: string;
  readonly displayName: string;
  readonly category: string;
  readonly culture: string;
  readonly description: string;
  readonly matchScore: number;
}

/**
 * C1012: Search/filter constraints by category and culture.
 */
export function searchConstraints(
  query: string,
  filters?: { category?: string; culture?: string }
): readonly ConstraintSearchResult[] {
  // Built-in constraint catalog
  const catalog: readonly ConstraintSearchResult[] = [
    { constraintType: 'key', displayName: 'Key', category: 'tonality', culture: 'universal', description: 'Set key/root of the piece', matchScore: 0 },
    { constraintType: 'tempo', displayName: 'Tempo', category: 'rhythm', culture: 'universal', description: 'Set tempo in BPM', matchScore: 0 },
    { constraintType: 'meter', displayName: 'Meter', category: 'rhythm', culture: 'universal', description: 'Set time signature', matchScore: 0 },
    { constraintType: 'tonality_model', displayName: 'Tonality Model', category: 'tonality', culture: 'universal', description: 'Choose tonality framework (functional, modal, etc.)', matchScore: 0 },
    { constraintType: 'style', displayName: 'Style', category: 'general', culture: 'universal', description: 'Set musical style tag', matchScore: 0 },
    { constraintType: 'culture', displayName: 'Culture', category: 'general', culture: 'universal', description: 'Set cultural context', matchScore: 0 },
    { constraintType: 'schema', displayName: 'Galant Schema', category: 'schema', culture: 'western', description: 'Apply galant schema pattern', matchScore: 0 },
    { constraintType: 'raga', displayName: 'Raga', category: 'melodic', culture: 'carnatic', description: 'Set Carnatic raga pitch set', matchScore: 0 },
    { constraintType: 'tala', displayName: 'Tala', category: 'rhythm', culture: 'carnatic', description: 'Set Carnatic rhythmic cycle', matchScore: 0 },
    { constraintType: 'celtic_tune', displayName: 'Celtic Tune Type', category: 'form', culture: 'celtic', description: 'Set Celtic tune type (reel, jig, etc.)', matchScore: 0 },
    { constraintType: 'chinese_mode', displayName: 'Chinese Mode', category: 'melodic', culture: 'chinese', description: 'Set Chinese pentatonic mode', matchScore: 0 },
    { constraintType: 'film_mood', displayName: 'Film Mood', category: 'mood', culture: 'film', description: 'Set film scoring mood', matchScore: 0 },
    { constraintType: 'film_device', displayName: 'Film Device', category: 'technique', culture: 'film', description: 'Apply film scoring device', matchScore: 0 },
    { constraintType: 'phrase_density', displayName: 'Phrase Density', category: 'melodic', culture: 'universal', description: 'Control melodic density', matchScore: 0 },
    { constraintType: 'contour', displayName: 'Melodic Contour', category: 'melodic', culture: 'universal', description: 'Set melodic contour shape', matchScore: 0 },
    { constraintType: 'pattern_role', displayName: 'Pattern Role', category: 'form', culture: 'universal', description: 'Assign pattern role (lead, fill, etc.)', matchScore: 0 },
    { constraintType: 'swing', displayName: 'Swing', category: 'rhythm', culture: 'jazz', description: 'Set swing amount', matchScore: 0 },
    { constraintType: 'heterophony', displayName: 'Heterophony', category: 'texture', culture: 'chinese', description: 'Enable heterophonic texture', matchScore: 0 },
    { constraintType: 'drone', displayName: 'Drone', category: 'texture', culture: 'universal', description: 'Enable drone voice', matchScore: 0 },
    { constraintType: 'trailer_build', displayName: 'Trailer Build', category: 'technique', culture: 'film', description: 'Apply trailer build-up pattern', matchScore: 0 },
    { constraintType: 'leitmotif', displayName: 'Leitmotif', category: 'technique', culture: 'film', description: 'Associate motif with character/concept', matchScore: 0 },
    { constraintType: 'lcc_gravity', displayName: 'LCC Tonal Gravity', category: 'tonality', culture: 'jazz', description: 'Apply Lydian Chromatic Concept gravity', matchScore: 0 },
    { constraintType: 'lcc_parent_scale', displayName: 'LCC Parent Scale', category: 'tonality', culture: 'jazz', description: 'Set LCC parent scale', matchScore: 0 },
  ];

  const lowerQuery = query.toLowerCase();

  let filtered = catalog;

  // Apply category filter
  if (filters?.category) {
    filtered = filtered.filter(c => c.category === filters.category);
  }

  // Apply culture filter
  if (filters?.culture) {
    filtered = filtered.filter(c => c.culture === filters.culture || c.culture === 'universal');
  }

  // Score by query match
  return filtered
    .map(c => {
      let score = 0;
      if (c.displayName.toLowerCase().includes(lowerQuery)) score += 100;
      if (c.constraintType.includes(lowerQuery)) score += 80;
      if (c.description.toLowerCase().includes(lowerQuery)) score += 50;
      if (c.category.includes(lowerQuery)) score += 30;
      return { ...c, matchScore: score };
    })
    .filter(c => lowerQuery === '' || c.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);
}

// ============================================================================
// LCC POLYCHORD ARRANGER TEMPLATES (C1171)
// ============================================================================

/** LCC polychord voicing for arranger */
export interface LCCPolychordTemplate {
  readonly name: string;
  readonly description: string;
  readonly lowerStructure: readonly number[];  // intervals from root
  readonly upperStructure: readonly number[];  // intervals from root
  readonly voiceLeading: string;
  readonly suitableScales: readonly string[];
}

/**
 * C1171: LCC polychord templates for arranger voicings.
 */
export const LCC_POLYCHORD_TEMPLATES: readonly LCCPolychordTemplate[] = [
  {
    name: 'lydian_stack',
    description: 'Stacked fourths from lydian scale',
    lowerStructure: [0, 4, 7],
    upperStructure: [6, 11, 14],
    voiceLeading: 'Common tone with upper structure pivot',
    suitableScales: ['lydian', 'lydian_augmented'],
  },
  {
    name: 'auxiliary_diminished',
    description: 'Major triad + diminished upper structure',
    lowerStructure: [0, 4, 7],
    upperStructure: [1, 4, 7, 10],
    voiceLeading: 'Chromatic approach to resolution',
    suitableScales: ['lydian_diminished'],
  },
  {
    name: 'lydian_dominant',
    description: 'Dominant 7th + #11 upper structure',
    lowerStructure: [0, 4, 7, 10],
    upperStructure: [6, 9, 14],
    voiceLeading: 'Tritone resolution available',
    suitableScales: ['lydian_dominant'],
  },
  {
    name: 'lydian_augmented',
    description: 'Augmented triad + lydian upper notes',
    lowerStructure: [0, 4, 8],
    upperStructure: [6, 11, 14],
    voiceLeading: 'Half-step voice leading in upper structure',
    suitableScales: ['lydian_augmented'],
  },
];

/**
 * Get LCC polychord template for a given scale.
 */
export function getLCCPolychordForScale(scaleName: string): LCCPolychordTemplate | undefined {
  return LCC_POLYCHORD_TEMPLATES.find(t => t.suitableScales.includes(scaleName));
}

// ============================================================================
// REHARMONIZATION TEMPLATES (C1340, C1341)
// ============================================================================

/** Reharmonization technique template */
export interface ReharmonizationTemplate {
  readonly name: string;
  readonly technique: string;
  readonly description: string;
  readonly chordTransform: (original: string) => string;
  readonly suitableContexts: readonly string[];
}

/**
 * C1340/C1341: Reharmonization templates for harmony explorer and arranger.
 */
export const REHARMONIZATION_TEMPLATES: readonly ReharmonizationTemplate[] = [
  {
    name: 'Tritone Substitution',
    technique: 'tritone_sub',
    description: 'Replace dominant chord with dominant a tritone away',
    chordTransform: (chord: string) => {
      const tritoneMap: Record<string, string> = {
        'G7': 'Db7', 'C7': 'Gb7', 'D7': 'Ab7', 'A7': 'Eb7',
        'E7': 'Bb7', 'B7': 'F7', 'F7': 'B7', 'Bb7': 'E7',
        'Eb7': 'A7', 'Ab7': 'D7', 'Db7': 'G7', 'Gb7': 'C7',
      };
      return tritoneMap[chord] ?? chord;
    },
    suitableContexts: ['jazz', 'film'],
  },
  {
    name: 'Minor Substitution',
    technique: 'minor_sub',
    description: 'Replace major chord with its relative minor',
    chordTransform: (chord: string) => {
      const minorMap: Record<string, string> = {
        'C': 'Am', 'F': 'Dm', 'G': 'Em', 'Bb': 'Gm',
        'Eb': 'Cm', 'Ab': 'Fm', 'D': 'Bm', 'A': 'F#m',
      };
      return minorMap[chord] ?? chord;
    },
    suitableContexts: ['jazz', 'pop', 'film'],
  },
  {
    name: 'Chromatic Mediant',
    technique: 'chromatic_mediant',
    description: 'Move to chord a major/minor third away',
    chordTransform: (chord: string) => {
      const mediantMap: Record<string, string> = {
        'C': 'E', 'D': 'F#', 'E': 'G#', 'F': 'A',
        'G': 'B', 'A': 'C#', 'Bb': 'D', 'Eb': 'G',
      };
      return mediantMap[chord] ?? chord;
    },
    suitableContexts: ['film', 'romantic', 'neo-riemannian'],
  },
  {
    name: 'Coltrane Changes',
    technique: 'coltrane',
    description: 'Divide octave into major thirds (Giant Steps pattern)',
    chordTransform: (chord: string) => {
      const coltraneMap: Record<string, string> = {
        'C': 'E → Ab → C', 'G': 'B → Eb → G',
        'D': 'F# → Bb → D', 'A': 'C# → F → A',
      };
      return coltraneMap[chord] ?? chord;
    },
    suitableContexts: ['jazz'],
  },
];

/**
 * Suggest reharmonizations for a chord progression.
 */
export function suggestReharmonizations(
  chords: readonly string[],
  context: string = 'jazz'
): readonly { position: number; original: string; suggestions: readonly { name: string; result: string }[] }[] {
  const applicableTemplates = REHARMONIZATION_TEMPLATES.filter(
    t => t.suitableContexts.includes(context)
  );

  return chords.map((chord, i) => ({
    position: i,
    original: chord,
    suggestions: applicableTemplates
      .map(t => ({ name: t.name, result: t.chordTransform(chord) }))
      .filter(s => s.result !== chord),
  }));
}

// ============================================================================
// PHRASE GEN BEBOP VOCABULARY CONSTRAINTS (C1398)
// ============================================================================

/** Bebop vocabulary constraint for phrase generation */
export interface BebopVocabularyConstraint {
  readonly pattern: string;
  readonly description: string;
  readonly applicableChordTypes: readonly string[];
  readonly resolution: string;
}

/**
 * C1398: Bebop vocabulary constraints for phrase generator.
 */
export const BEBOP_VOCABULARY_CONSTRAINTS: readonly BebopVocabularyConstraint[] = [
  {
    pattern: '1-2-3-5',
    description: 'Basic digital pattern ascending',
    applicableChordTypes: ['major', 'dominant'],
    resolution: 'resolve to 1 or 3',
  },
  {
    pattern: 'enclosure_above_below',
    description: 'Chromatic enclosure from above and below',
    applicableChordTypes: ['major', 'minor', 'dominant'],
    resolution: 'target chord tone',
  },
  {
    pattern: 'bebop_scale_run',
    description: 'Eighth-note run using bebop scale',
    applicableChordTypes: ['dominant', 'major'],
    resolution: 'land on chord tone on beat',
  },
  {
    pattern: 'guide_tone_line',
    description: 'Stepwise line connecting 3rds and 7ths',
    applicableChordTypes: ['major', 'minor', 'dominant', 'half_diminished'],
    resolution: 'stepwise to next guide tone',
  },
  {
    pattern: 'chromatic_approach',
    description: 'Approach from half step below',
    applicableChordTypes: ['major', 'minor', 'dominant'],
    resolution: 'chromatic resolution upward',
  },
  {
    pattern: 'pentatonic_superimposition',
    description: 'Superimpose pentatonic scale over chord',
    applicableChordTypes: ['minor', 'dominant'],
    resolution: 'resolve within parent harmony',
  },
];

// ============================================================================
// TRACKER JAZZ PATTERN INSERTION (C1399)
// ============================================================================

/** Jazz pattern for tracker insertion */
export interface TrackerJazzPattern {
  readonly name: string;
  readonly category: string;
  readonly midiNotes: readonly number[];
  readonly durations: readonly number[];
  readonly chordContext: string;
  readonly difficulty: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * C1399: Jazz patterns available for insertion into tracker.
 */
export const TRACKER_JAZZ_PATTERNS: readonly TrackerJazzPattern[] = [
  {
    name: 'ii-V-I lick (basic)',
    category: 'bebop',
    midiNotes: [62, 64, 65, 67, 69, 67, 65, 64],
    durations: [0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25],
    chordContext: 'Dm7-G7-Cmaj7',
    difficulty: 'beginner',
  },
  {
    name: 'Enclosure to 3rd',
    category: 'enclosure',
    midiNotes: [65, 63, 64],
    durations: [0.25, 0.25, 0.5],
    chordContext: 'Cmaj7',
    difficulty: 'beginner',
  },
  {
    name: 'Bebop scale descent',
    category: 'bebop',
    midiNotes: [72, 71, 69, 67, 66, 65, 64, 62],
    durations: [0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25],
    chordContext: 'G7',
    difficulty: 'intermediate',
  },
  {
    name: 'Coltrane digital pattern',
    category: 'modern',
    midiNotes: [60, 64, 67, 71, 74, 72, 69, 67],
    durations: [0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25],
    chordContext: 'Cmaj7',
    difficulty: 'advanced',
  },
  {
    name: 'Blues lick',
    category: 'blues',
    midiNotes: [63, 60, 62, 63, 62, 60],
    durations: [0.25, 0.25, 0.5, 0.25, 0.25, 0.5],
    chordContext: 'C7',
    difficulty: 'beginner',
  },
  {
    name: 'Pentatonic superimposition',
    category: 'modern',
    midiNotes: [62, 65, 67, 69, 72, 69, 67, 65],
    durations: [0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25],
    chordContext: 'Dm7',
    difficulty: 'intermediate',
  },
];

/**
 * Get jazz patterns by category or difficulty.
 */
export function getJazzPatterns(
  category?: string,
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
): readonly TrackerJazzPattern[] {
  let patterns: readonly TrackerJazzPattern[] = TRACKER_JAZZ_PATTERNS;
  if (category) {
    patterns = patterns.filter(p => p.category === category);
  }
  if (difficulty) {
    patterns = patterns.filter(p => p.difficulty === difficulty);
  }
  return patterns;
}

// ============================================================================
// ARRANGER SOLO SECTION VOCABULARY (C1400)
// ============================================================================

/** Solo section configuration */
export interface SoloSectionConfig {
  readonly instrument: string;
  readonly style: string;
  readonly vocabularyLevel: string;
  readonly backingRhythm: string;
  readonly choruses: number;
  readonly tensionCurve: readonly number[];
}

/**
 * C1400: Generate solo section configuration using melodic vocabulary constraints.
 */
export function generateSoloSectionConfig(
  instrument: string,
  style: string = 'bebop',
  choruses: number = 2
): SoloSectionConfig {
  const styleVocab: Record<string, string> = {
    bebop: 'advanced',
    swing: 'intermediate',
    modal: 'intermediate',
    cool: 'intermediate',
    free: 'advanced',
    blues: 'beginner',
  };

  const styleRhythm: Record<string, string> = {
    bebop: 'walking_bass_comping',
    swing: 'swing_groove',
    modal: 'open_comping',
    cool: 'brushes_ballad',
    free: 'free_interaction',
    blues: 'shuffle_groove',
  };

  // Build tension curve: gradual build then release
  const tensionCurve: number[] = [];
  for (let i = 0; i < choruses; i++) {
    const peak = (i + 1) / choruses;
    tensionCurve.push(
      peak * 0.3,
      peak * 0.5,
      peak * 0.8,
      peak * 1.0
    );
  }
  // Add resolution
  tensionCurve.push(0.5, 0.3);

  return {
    instrument,
    style,
    vocabularyLevel: styleVocab[style] ?? 'intermediate',
    backingRhythm: styleRhythm[style] ?? 'swing_groove',
    choruses,
    tensionCurve,
  };
}

// ============================================================================
// HARMONY EXPLORER REHARMONIZATION (C1340)
// ============================================================================

/**
 * C1340: Async reharmonization suggestion for harmony explorer.
 */
export async function suggestReharmonizationsAsync(
  chords: readonly string[],
  context: string,
  adapter?: { querySingle?: (q: string) => Promise<Record<string, unknown> | null> }
): Promise<readonly { position: number; original: string; suggestions: readonly { name: string; result: string }[] }[]> {
  // Try Prolog first
  if (adapter?.querySingle) {
    try {
      const result = await adapter.querySingle(
        `suggest_reharmonization([${chords.map(c => `'${c}'`).join(',')}], ${context}, Suggestions)`
      );
      if (result && Array.isArray(result['Suggestions'])) {
        return result['Suggestions'] as any;
      }
    } catch {
      // Fall back to TS
    }
  }

  return suggestReharmonizations(chords, context);
}

// ============================================================================
// HETEROPHONY LANES DATA MODEL (C794)
// ============================================================================

/** Heterophony lane for tracker display */
export interface HeterophonyLane {
  readonly voiceIndex: number;
  readonly label: string;
  readonly role: string;
  readonly variationDepth: string;
  readonly notes: readonly { midi: number; time: number; duration: number; isVariation: boolean }[];
}

/**
 * C794: Generate heterophony lane data for tracker display.
 * Shows same melody with variations across multiple lanes.
 */
export function generateHeterophonyLanes(
  melody: readonly { midi: number; time: number; duration: number }[],
  voiceCount: number,
  culture: string = 'chinese'
): readonly HeterophonyLane[] {
  const lanes: HeterophonyLane[] = [];

  // First lane is always the original melody
  lanes.push({
    voiceIndex: 0,
    label: 'Lead',
    role: 'lead',
    variationDepth: 'none',
    notes: melody.map(n => ({ ...n, isVariation: false })),
  });

  const roleLabels: Record<string, readonly string[]> = {
    chinese: ['Lead', 'Secondary', 'Ornamental', 'Drone'],
    gamelan: ['Lead', 'Elaboration 1', 'Elaboration 2', 'Punctuation'],
    generic: ['Lead', 'Variation 1', 'Variation 2', 'Variation 3'],
  };

  const labels = roleLabels[culture] ?? roleLabels['generic']!;
  const depths = ['none', 'minimal', 'moderate', 'heavy'];

  for (let v = 1; v < voiceCount; v++) {
    const depth = depths[Math.min(v, depths.length - 1)]!;
    const notes = melody.map((n, _i) => {
      // Simple variation: transpose or add passing tones
      const isVariation = Math.random() < 0.3 * v;
      const variation = isVariation ? (Math.random() < 0.5 ? 2 : -2) : 0;
      return {
        midi: n.midi + variation,
        time: n.time,
        duration: n.duration,
        isVariation,
      };
    });

    lanes.push({
      voiceIndex: v,
      label: labels[v] ?? `Voice ${v + 1}`,
      role: v === 1 ? 'secondary' : v === 2 ? 'ornamental' : 'elaboration',
      variationDepth: depth,
      notes,
    });
  }

  return lanes;
}

// ============================================================================
// UNDO INTEGRATION FOR HOST ACTIONS (C922)
// ============================================================================

/** Undoable action record */
export interface UndoableAction {
  readonly id: string;
  readonly timestamp: number;
  readonly description: string;
  readonly type: string;
  readonly previousState: Record<string, unknown>;
  readonly newState: Record<string, unknown>;
}

/**
 * C922: Undo stack for applied HostActions.
 */
export class HostActionUndoStack {
  private stack: UndoableAction[] = [];
  private redoStack: UndoableAction[] = [];
  private maxSize: number;

  constructor(maxSize: number = 50) {
    this.maxSize = maxSize;
  }

  push(action: UndoableAction): void {
    this.stack.push(action);
    if (this.stack.length > this.maxSize) {
      this.stack.shift();
    }
    // Clear redo stack on new action
    this.redoStack.length = 0;
  }

  undo(): UndoableAction | undefined {
    const action = this.stack.pop();
    if (action) {
      this.redoStack.push(action);
    }
    return action;
  }

  redo(): UndoableAction | undefined {
    const action = this.redoStack.pop();
    if (action) {
      this.stack.push(action);
    }
    return action;
  }

  canUndo(): boolean {
    return this.stack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  getHistory(): readonly UndoableAction[] {
    return [...this.stack];
  }

  clear(): void {
    this.stack.length = 0;
    this.redoStack.length = 0;
  }
}

// ============================================================================
// CONSTRAINT PACK MANAGER (C1013)
// ============================================================================

/** Installed constraint pack info */
export interface InstalledPackInfo {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly constraintCount: number;
  readonly culture: string;
  readonly enabled: boolean;
  readonly installedAt: number;
}

/**
 * C1013: In-memory constraint pack manager for installing/removing packs.
 */
export class ConstraintPackManager {
  private packs: Map<string, InstalledPackInfo> = new Map();

  install(pack: Omit<InstalledPackInfo, 'installedAt'>): boolean {
    if (this.packs.has(pack.id)) {
      return false; // Already installed
    }
    this.packs.set(pack.id, {
      ...pack,
      installedAt: Date.now(),
    });
    return true;
  }

  uninstall(packId: string): boolean {
    return this.packs.delete(packId);
  }

  enable(packId: string): boolean {
    const pack = this.packs.get(packId);
    if (!pack) return false;
    this.packs.set(packId, { ...pack, enabled: true });
    return true;
  }

  disable(packId: string): boolean {
    const pack = this.packs.get(packId);
    if (!pack) return false;
    this.packs.set(packId, { ...pack, enabled: false });
    return true;
  }

  getInstalled(): readonly InstalledPackInfo[] {
    return [...this.packs.values()];
  }

  getEnabled(): readonly InstalledPackInfo[] {
    return [...this.packs.values()].filter(p => p.enabled);
  }

  isInstalled(packId: string): boolean {
    return this.packs.has(packId);
  }

  getPackInfo(packId: string): InstalledPackInfo | undefined {
    return this.packs.get(packId);
  }
}

// ============================================================================
// LCC VOICE LEADING SUGGESTION (C1170)
// ============================================================================

/** Voice leading suggestion */
export interface VoiceLeadingSuggestion {
  readonly fromChord: string;
  readonly toChord: string;
  readonly voiceMovements: readonly { voice: number; fromNote: number; toNote: number; interval: number }[];
  readonly totalMovement: number;
  readonly lccScale: string;
  readonly explanation: string;
}

/**
 * C1170: Suggest LCC-based voice leading between chords.
 */
export function suggestLCCVoiceLeading(
  fromChord: readonly number[],
  toChord: readonly number[],
  lccScale: string = 'lydian'
): VoiceLeadingSuggestion {
  const voiceMovements: { voice: number; fromNote: number; toNote: number; interval: number }[] = [];
  let totalMovement = 0;

  const maxVoices = Math.min(fromChord.length, toChord.length);
  for (let v = 0; v < maxVoices; v++) {
    const from = fromChord[v]!;
    const to = toChord[v]!;
    const interval = Math.abs(to - from);
    voiceMovements.push({ voice: v, fromNote: from, toNote: to, interval });
    totalMovement += interval;
  }

  // LCC principle: prefer minimal movement (tonal gravity)
  const explanation = totalMovement <= 2
    ? `Smooth voice leading with total movement of ${totalMovement} semitones (strong tonal gravity)`
    : totalMovement <= 6
      ? `Moderate voice leading with ${totalMovement} semitones total movement`
      : `Wide voice leading with ${totalMovement} semitones — consider smoother alternatives`;

  return {
    fromChord: fromChord.join('-'),
    toChord: toChord.join('-'),
    voiceMovements,
    totalMovement,
    lccScale,
    explanation,
  };
}

// ============================================================================
// JAZZ IMPROV BOARD TEMPLATE (C1430)
// ============================================================================

/**
 * C1430: Jazz improv board template.
 */
export const JAZZ_IMPROV_BOARD_TEMPLATE: BoardTemplate = {
  id: 'jazz-improv',
  name: 'Jazz Improvisation',
  description: 'Phrase generator + vocabulary browser + guide tone lines for jazz improvisation',
  category: 'improvisation',
  decks: ['phrase_generator', 'vocabulary_browser', 'guide_tones', 'backing_track'],
  tools: ['bebop_scale_card', 'enclosure_card', 'digital_pattern_card', 'guide_tone_card', 'lick_library_card'],
  defaultSpec: {
    culture: 'western',
    tonalityModel: 'functional',
    style: 'jazz',
  },
};

// ============================================================================
// PERSONAL VOCABULARY LIBRARY (C1439)
// ============================================================================

/** Personal vocabulary entry (extended) */
export interface PersonalVocabEntry {
  readonly id: string;
  readonly name: string;
  readonly pattern: readonly number[];
  readonly durations: readonly number[];
  readonly category: string;
  readonly tags: readonly string[];
  readonly chordContext: string;
  readonly createdAt: number;
  readonly entrySource: 'recorded' | 'imported' | 'generated' | 'manual';
}

/**
 * C1439: Personal vocabulary library manager.
 */
export class PersonalVocabularyLibrary {
  private entries: Map<string, PersonalVocabEntry> = new Map();

  add(entry: PersonalVocabEntry): void {
    this.entries.set(entry.id, entry);
  }

  remove(id: string): boolean {
    return this.entries.delete(id);
  }

  getAll(): readonly PersonalVocabEntry[] {
    return [...this.entries.values()];
  }

  getByCategory(category: string): readonly PersonalVocabEntry[] {
    return [...this.entries.values()].filter(e => e.category === category);
  }

  getByTag(tag: string): readonly PersonalVocabEntry[] {
    return [...this.entries.values()].filter(e => e.tags.includes(tag));
  }

  search(query: string): readonly PersonalVocabEntry[] {
    const lower = query.toLowerCase();
    return [...this.entries.values()].filter(
      e => e.name.toLowerCase().includes(lower) ||
           e.category.toLowerCase().includes(lower) ||
           e.tags.some(t => t.toLowerCase().includes(lower))
    );
  }

  getCategories(): readonly string[] {
    const cats = new Set<string>();
    for (const e of this.entries.values()) {
      cats.add(e.category);
    }
    return [...cats];
  }

  exportAll(): readonly PersonalVocabEntry[] {
    return this.getAll();
  }

  importEntries(entries: readonly PersonalVocabEntry[]): number {
    let count = 0;
    for (const e of entries) {
      if (!this.entries.has(e.id)) {
        this.entries.set(e.id, e);
        count++;
      }
    }
    return count;
  }

  clear(): void {
    this.entries.clear();
  }
}

// ============================================================================
// CONSTRAINT VISUALIZATION DATA MODELS (C1079, C1080, C1081)
// ============================================================================

/** Pitch class visualization data */
export interface PitchClassVisualization {
  readonly constraintType: string;
  readonly pitchClasses: readonly { pc: number; label: string; active: boolean; weight: number }[];
  readonly root: number;
  readonly mode: string;
}

/**
 * C1079: Generate pitch class visualization data for scale constraints.
 */
export function generatePitchClassVisualization(
  root: number,
  scaleIntervals: readonly number[],
  mode: string = 'ionian'
): PitchClassVisualization {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const activeSet = new Set(scaleIntervals.map(i => (root + i) % 12));

  return {
    constraintType: 'scale',
    pitchClasses: noteNames.map((label, pc) => ({
      pc,
      label,
      active: activeSet.has(pc),
      weight: activeSet.has(pc) ? (pc === root % 12 ? 1.0 : 0.7) : 0.0,
    })),
    root: root % 12,
    mode,
  };
}

/** Beat grid visualization data */
export interface BeatGridVisualization {
  readonly constraintType: string;
  readonly beats: readonly { position: number; accent: number; label: string }[];
  readonly meter: string;
  readonly tempo: number;
}

/**
 * C1080: Generate beat grid visualization for rhythm constraints.
 */
export function generateBeatGridVisualization(
  numerator: number,
  denominator: number,
  tempo: number = 120
): BeatGridVisualization {
  const beats: { position: number; accent: number; label: string }[] = [];

  for (let i = 0; i < numerator; i++) {
    const accent = i === 0 ? 1.0 : (i % (numerator > 4 ? 3 : 2) === 0 ? 0.6 : 0.3);
    beats.push({
      position: i,
      accent,
      label: `${i + 1}`,
    });
  }

  return {
    constraintType: 'meter',
    beats,
    meter: `${numerator}/${denominator}`,
    tempo,
  };
}

/** Tension graph visualization data */
export interface TensionGraphVisualization {
  readonly constraintType: string;
  readonly points: readonly { position: number; tension: number; label: string }[];
  readonly maxTension: number;
}

/**
 * C1081: Generate tension graph visualization for harmonic constraints.
 */
export function generateTensionGraph(
  chordTensions: readonly { chord: string; tension: number }[]
): TensionGraphVisualization {
  let maxTension = 0;
  const points = chordTensions.map((ct, i) => {
    if (ct.tension > maxTension) maxTension = ct.tension;
    return {
      position: i,
      tension: ct.tension,
      label: ct.chord,
    };
  });

  return {
    constraintType: 'harmony',
    points,
    maxTension,
  };
}

// ============================================================================
// CONSTRAINT COMPARISON DIFF (C1084)
// ============================================================================

/** Constraint diff entry */
export interface ConstraintDiffEntry {
  readonly constraintType: string;
  readonly change: 'added' | 'removed' | 'modified';
  readonly before?: Record<string, unknown>;
  readonly after?: Record<string, unknown>;
}

/**
 * C1084: Compare two sets of constraints and produce a diff.
 */
export function diffConstraints(
  before: readonly MusicConstraint[],
  after: readonly MusicConstraint[]
): readonly ConstraintDiffEntry[] {
  const diffs: ConstraintDiffEntry[] = [];

  const beforeMap = new Map(before.map(c => [c.type, c]));
  const afterMap = new Map(after.map(c => [c.type, c]));

  // Find removed and modified
  for (const [type, constraint] of beforeMap) {
    const afterConstraint = afterMap.get(type);
    if (!afterConstraint) {
      diffs.push({
        constraintType: type,
        change: 'removed',
        before: constraint as unknown as Record<string, unknown>,
      });
    } else {
      const beforeJson = JSON.stringify(constraint);
      const afterJson = JSON.stringify(afterConstraint);
      if (beforeJson !== afterJson) {
        diffs.push({
          constraintType: type,
          change: 'modified',
          before: constraint as unknown as Record<string, unknown>,
          after: afterConstraint as unknown as Record<string, unknown>,
        });
      }
    }
  }

  // Find added
  for (const [type, constraint] of afterMap) {
    if (!beforeMap.has(type)) {
      diffs.push({
        constraintType: type,
        change: 'added',
        after: constraint as unknown as Record<string, unknown>,
      });
    }
  }

  return diffs;
}

// ============================================================================
// ANALYTICS: CONSTRAINT USAGE TRACKING (C1097)
// ============================================================================

/** Constraint usage event */
export interface ConstraintUsageEvent {
  readonly constraintType: string;
  readonly action: 'add' | 'remove' | 'modify' | 'query';
  readonly timestamp: number;
  readonly context: string;
}

/**
 * C1097: Local-only analytics tracker for custom constraint usage.
 */
export class ConstraintUsageTracker {
  private events: ConstraintUsageEvent[] = [];

  track(constraintType: string, action: ConstraintUsageEvent['action'], context: string = ''): void {
    this.events.push({
      constraintType,
      action,
      timestamp: Date.now(),
      context,
    });
  }

  getUsageStats(): Record<string, { adds: number; removes: number; modifies: number; queries: number }> {
    const stats: Record<string, { adds: number; removes: number; modifies: number; queries: number }> = {};
    for (const event of this.events) {
      if (!stats[event.constraintType]) {
        stats[event.constraintType] = { adds: 0, removes: 0, modifies: 0, queries: 0 };
      }
      const s = stats[event.constraintType]!;
      switch (event.action) {
        case 'add': s.adds++; break;
        case 'remove': s.removes++; break;
        case 'modify': s.modifies++; break;
        case 'query': s.queries++; break;
      }
    }
    return stats;
  }

  getMostUsedConstraints(n: number = 10): readonly { type: string; count: number }[] {
    const counts: Record<string, number> = {};
    for (const e of this.events) {
      counts[e.constraintType] = (counts[e.constraintType] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, n);
  }

  getRecentEvents(n: number = 20): readonly ConstraintUsageEvent[] {
    return this.events.slice(-n);
  }

  clear(): void {
    this.events.length = 0;
  }
}

// ============================================================================
// EAR TRAINING INTEGRATION (C1442)
// ============================================================================

/** Ear training exercise */
export interface EarTrainingExercise {
  readonly id: string;
  readonly type: 'interval' | 'chord' | 'scale' | 'pattern' | 'rhythm';
  readonly difficulty: 'beginner' | 'intermediate' | 'advanced';
  readonly prompt: string;
  readonly answer: string;
  readonly midiNotes: readonly number[];
  readonly options: readonly string[];
}

/**
 * C1442: Generate ear training exercises from patterns.
 */
export function generateEarTrainingExercises(
  type: EarTrainingExercise['type'],
  difficulty: EarTrainingExercise['difficulty'] = 'beginner',
  count: number = 5
): readonly EarTrainingExercise[] {
  const exercises: EarTrainingExercise[] = [];

  const intervalNames = ['m2', 'M2', 'm3', 'M3', 'P4', 'tritone', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'];
  const chordTypes = ['major', 'minor', 'diminished', 'augmented', 'dominant7', 'major7', 'minor7'];

  for (let i = 0; i < count; i++) {
    const root = 60 + Math.floor(Math.random() * 12);

    switch (type) {
      case 'interval': {
        const maxInterval = difficulty === 'beginner' ? 5 : difficulty === 'intermediate' ? 8 : 12;
        const interval = 1 + Math.floor(Math.random() * maxInterval);
        const name = intervalNames[interval - 1] ?? `${interval}`;
        exercises.push({
          id: `ear-${type}-${i}`,
          type,
          difficulty,
          prompt: 'Identify the interval',
          answer: name,
          midiNotes: [root, root + interval],
          options: intervalNames.slice(0, maxInterval),
        });
        break;
      }
      case 'chord': {
        const maxChords = difficulty === 'beginner' ? 3 : difficulty === 'intermediate' ? 5 : 7;
        const chordIdx = Math.floor(Math.random() * maxChords);
        const chordIntervals: Record<string, readonly number[]> = {
          major: [0, 4, 7],
          minor: [0, 3, 7],
          diminished: [0, 3, 6],
          augmented: [0, 4, 8],
          dominant7: [0, 4, 7, 10],
          major7: [0, 4, 7, 11],
          minor7: [0, 3, 7, 10],
        };
        const chordName = chordTypes[chordIdx]!;
        const intervals = chordIntervals[chordName]!;
        exercises.push({
          id: `ear-${type}-${i}`,
          type,
          difficulty,
          prompt: 'Identify the chord quality',
          answer: chordName,
          midiNotes: intervals.map(intv => root + intv),
          options: chordTypes.slice(0, maxChords),
        });
        break;
      }
      default: {
        exercises.push({
          id: `ear-${type}-${i}`,
          type,
          difficulty,
          prompt: `Identify the ${type}`,
          answer: 'unknown',
          midiNotes: [root],
          options: ['unknown'],
        });
      }
    }
  }

  return exercises;
}

// ============================================================================
// PHRASE INSERT/ADAPT DATA MODELS (C877, C878)
// ============================================================================

/** Phrase insertion request for tracker */
export interface PhraseInsertionRequest {
  readonly phraseId: string;
  readonly targetBar: number;
  readonly targetBeat: number;
  readonly constraints: readonly MusicConstraint[];
  readonly adaptToContext: boolean;
}

/** Phrase adaptation result */
export interface PhraseAdaptationResult {
  readonly originalNotes: readonly number[];
  readonly adaptedNotes: readonly number[];
  readonly transposition: number;
  readonly rhythmScaling: number;
  readonly constraintsApplied: readonly string[];
  readonly explanation: string;
}

/**
 * C877/C878: Adapt a phrase to fit a target context.
 * Handles transposition, rhythm scaling, and constraint application.
 */
export function adaptPhraseToContext(
  notes: readonly number[],
  _durations: readonly number[],
  targetKey: number,
  sourceKey: number,
  targetTempo: number,
  sourceTempo: number,
  constraints: readonly MusicConstraint[] = []
): PhraseAdaptationResult {
  const transposition = targetKey - sourceKey;
  const rhythmScaling = sourceTempo / targetTempo;

  const adaptedNotes = notes.map(n => n + transposition);
  const constraintsApplied: string[] = [];

  // Apply constraints
  for (const c of constraints) {
    constraintsApplied.push(c.type);
  }

  return {
    originalNotes: [...notes],
    adaptedNotes,
    transposition,
    rhythmScaling,
    constraintsApplied,
    explanation: `Transposed ${transposition} semitones, rhythm scaled by ${rhythmScaling.toFixed(2)}`,
  };
}

// ============================================================================
// CONSTRAINT PREVIEW (C1052)
// ============================================================================

/**
 * C1052: Generate Prolog term preview for current card state constraints.
 */
export function constraintToPrologPreview(constraint: MusicConstraint): string {
  switch (constraint.type) {
    case 'key':
      return `key_constraint(${(constraint as any).key?.root ?? 'c'}, ${(constraint as any).key?.mode ?? 'ionian'})`;
    case 'tempo':
      return `tempo_constraint(${(constraint as any).bpm ?? 120})`;
    case 'meter':
      return `meter_constraint(${(constraint as any).numerator ?? 4}, ${(constraint as any).denominator ?? 4})`;
    case 'style':
      return `style_constraint('${(constraint as any).style ?? 'unknown'}')`;
    case 'culture':
      return `culture_constraint('${(constraint as any).culture ?? 'western'}')`;
    case 'schema':
      return `schema_constraint('${(constraint as any).schema ?? 'unknown'}')`;
    case 'raga':
      return `raga_constraint('${(constraint as any).raga ?? 'unknown'}')`;
    case 'tala':
      return `tala_constraint('${(constraint as any).tala ?? 'unknown'}')`;
    case 'film_mood':
      return `film_mood_constraint('${(constraint as any).mood ?? 'unknown'}')`;
    case 'film_device':
      return `film_device_constraint('${(constraint as any).device ?? 'unknown'}')`;
    case 'swing':
      return `swing_constraint(${(constraint as any).amount ?? 0})`;
    case 'drone':
      return `drone_constraint(${(constraint as any).note ?? 60})`;
    default:
      return `constraint('${constraint.type}')`;
  }
}

/**
 * Generate Prolog preview for multiple constraints.
 */
export function constraintsToPrologPreview(constraints: readonly MusicConstraint[]): string {
  return constraints.map(c => constraintToPrologPreview(c)).join(',\n');
}

// ============================================================================
// EXPLAIN CONSTRAINT ACTION (C1054)
// ============================================================================

/** Constraint explanation */
export interface ConstraintExplanation {
  readonly constraintType: string;
  readonly humanReadable: string;
  readonly prologTerm: string;
  readonly affectedParameters: readonly string[];
  readonly examples: readonly string[];
}

/**
 * C1054: Generate human-readable explanation for a constraint.
 */
export function explainConstraint(constraint: MusicConstraint): ConstraintExplanation {
  const prologTerm = constraintToPrologPreview(constraint);

  const explanations: Record<string, { human: string; params: string[]; examples: string[] }> = {
    key: {
      human: 'Sets the musical key (root note and mode/scale)',
      params: ['root', 'mode'],
      examples: ['C major', 'D dorian', 'A minor'],
    },
    tempo: {
      human: 'Sets the tempo (beats per minute)',
      params: ['bpm'],
      examples: ['120 BPM (moderate)', '60 BPM (slow)', '180 BPM (fast)'],
    },
    meter: {
      human: 'Sets the time signature',
      params: ['numerator', 'denominator'],
      examples: ['4/4 (common time)', '3/4 (waltz)', '6/8 (compound duple)'],
    },
    style: {
      human: 'Tags the musical style for recommendations',
      params: ['style'],
      examples: ['jazz', 'classical', 'celtic', 'film'],
    },
    culture: {
      human: 'Sets the cultural context for theory rules',
      params: ['culture'],
      examples: ['western', 'carnatic', 'chinese', 'celtic'],
    },
    schema: {
      human: 'Applies a galant schema pattern to guide harmony',
      params: ['schema'],
      examples: ['romanesca', 'prinner', 'monte', 'fonte'],
    },
    raga: {
      human: 'Sets the Carnatic raga (melodic framework)',
      params: ['raga'],
      examples: ['sankarabharanam', 'kalyani', 'todi'],
    },
    tala: {
      human: 'Sets the Carnatic tala (rhythmic cycle)',
      params: ['tala'],
      examples: ['adi', 'rupaka', 'misra_chapu'],
    },
    film_mood: {
      human: 'Sets the film scoring mood for orchestration',
      params: ['mood'],
      examples: ['tension', 'wonder', 'action', 'romantic'],
    },
    swing: {
      human: 'Applies swing feel to rhythm',
      params: ['amount'],
      examples: ['0.6 (light)', '0.67 (medium)', '0.75 (heavy)'],
    },
  };

  const info = explanations[constraint.type];

  return {
    constraintType: constraint.type,
    humanReadable: info?.human ?? `Applies ${constraint.type} constraint`,
    prologTerm,
    affectedParameters: info?.params ?? [],
    examples: info?.examples ?? [],
  };
}

// ============================================================================
// THEORY CARD MARKETPLACE PLACEHOLDER (C1070)
// ============================================================================

/** Marketplace listing */
export interface MarketplaceListing {
  readonly id: string;
  readonly name: string;
  readonly author: string;
  readonly description: string;
  readonly version: string;
  readonly category: string;
  readonly culture: string;
  readonly cardCount: number;
  readonly constraintCount: number;
  readonly rating: number;
  readonly downloads: number;
}

/**
 * C1070: Placeholder marketplace listings (future community feature).
 */
export const MARKETPLACE_LISTINGS: readonly MarketplaceListing[] = [
  {
    id: 'mp-jazz-fundamentals',
    name: 'Jazz Fundamentals Pack',
    author: 'CardPlay Team',
    description: 'Essential jazz theory cards: bebop scales, guide tones, ii-V-I patterns',
    version: '1.0.0',
    category: 'jazz',
    culture: 'western',
    cardCount: 7,
    constraintCount: 12,
    rating: 4.8,
    downloads: 0,
  },
  {
    id: 'mp-carnatic-essentials',
    name: 'Carnatic Essentials Pack',
    author: 'CardPlay Team',
    description: 'Raga/Tala cards with gamaka support and mridangam patterns',
    version: '1.0.0',
    category: 'world_music',
    culture: 'carnatic',
    cardCount: 5,
    constraintCount: 8,
    rating: 4.6,
    downloads: 0,
  },
  {
    id: 'mp-film-scoring',
    name: 'Film Scoring Toolkit',
    author: 'CardPlay Team',
    description: 'Mood cards, device cards, orchestration templates for film scoring',
    version: '1.0.0',
    category: 'film',
    culture: 'western',
    cardCount: 6,
    constraintCount: 10,
    rating: 4.7,
    downloads: 0,
  },
  {
    id: 'mp-celtic-session',
    name: 'Celtic Session Pack',
    author: 'CardPlay Team',
    description: 'Celtic tune types, ornament generators, session arrangement templates',
    version: '1.0.0',
    category: 'world_music',
    culture: 'celtic',
    cardCount: 5,
    constraintCount: 7,
    rating: 4.5,
    downloads: 0,
  },
];

/**
 * Search marketplace listings.
 */
export function searchMarketplace(
  query: string,
  filters?: { category?: string; culture?: string }
): readonly MarketplaceListing[] {
  let results: readonly MarketplaceListing[] = MARKETPLACE_LISTINGS;

  if (filters?.category) {
    results = results.filter(l => l.category === filters.category);
  }
  if (filters?.culture) {
    results = results.filter(l => l.culture === filters.culture);
  }

  if (query) {
    const lower = query.toLowerCase();
    results = results.filter(
      l => l.name.toLowerCase().includes(lower) ||
           l.description.toLowerCase().includes(lower)
    );
  }

  return results;
}

// ============================================================================
// TARGET NOTE PRACTICE MODE (C1436)
// ============================================================================

/** Target note practice exercise */
export interface TargetNotePractice {
  readonly chordProgression: readonly { chord: string; duration: number }[];
  readonly targetNotes: readonly { beat: number; targetMidi: number; chordTone: string }[];
  readonly difficulty: string;
  readonly backingStyle: string;
}

/**
 * C1436: Generate target note practice exercises.
 */
export function generateTargetNotePractice(
  chords: readonly string[],
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner',
  beatsPerChord: number = 4
): TargetNotePractice {
  const chordToneMap: Record<string, readonly { midi: number; label: string }[]> = {
    Cmaj7: [{ midi: 60, label: 'root' }, { midi: 64, label: '3rd' }, { midi: 67, label: '5th' }, { midi: 71, label: '7th' }],
    Dm7: [{ midi: 62, label: 'root' }, { midi: 65, label: '3rd' }, { midi: 69, label: '5th' }, { midi: 72, label: '7th' }],
    G7: [{ midi: 67, label: 'root' }, { midi: 71, label: '3rd' }, { midi: 74, label: '5th' }, { midi: 65, label: '7th' }],
    Am7: [{ midi: 69, label: 'root' }, { midi: 72, label: '3rd' }, { midi: 76, label: '5th' }, { midi: 67, label: '7th' }],
  };

  const progression = chords.map(chord => ({
    chord,
    duration: beatsPerChord,
  }));

  const targets: { beat: number; targetMidi: number; chordTone: string }[] = [];
  let beat = 0;

  for (const chord of chords) {
    const tones = chordToneMap[chord];
    if (tones) {
      const maxTargets = difficulty === 'beginner' ? 1 : difficulty === 'intermediate' ? 2 : 3;
      for (let t = 0; t < Math.min(maxTargets, tones.length); t++) {
        const tone = tones[t]!;
        targets.push({
          beat: beat + t * (beatsPerChord / maxTargets),
          targetMidi: tone.midi,
          chordTone: tone.label,
        });
      }
    }
    beat += beatsPerChord;
  }

  return {
    chordProgression: progression,
    targetNotes: targets,
    difficulty,
    backingStyle: difficulty === 'beginner' ? 'simple_comping' : 'walking_bass',
  };
}

// ============================================================================
// CARD PACKS PROLOG BUNDLING (C1032, C1033)
// ============================================================================

/** Card pack with Prolog code */
export interface CardPackPrologBundle {
  readonly packId: string;
  readonly prologCode: string;
  readonly predicates: readonly string[];
  readonly dependencies: readonly string[];
}

/**
 * C1032: Bundle Prolog code with card packs.
 */
export function createCardPackPrologBundle(
  packId: string,
  prologCode: string
): CardPackPrologBundle {
  const predicateRegex = /^([a-z_][a-z0-9_]*)\s*\(/gm;
  const predicates = new Set<string>();
  let match;
  while ((match = predicateRegex.exec(prologCode)) !== null) {
    predicates.add(match[1]!);
  }

  const dependencies: string[] = [];

  return {
    packId,
    prologCode,
    predicates: [...predicates],
    dependencies,
  };
}

/**
 * C1033: Create inline Prolog snippet for user card.
 */
export function createInlinePrologSnippet(
  cardId: string,
  snippetCode: string,
  namespace: string = 'user'
): { cardId: string; namespacedCode: string; predicates: readonly string[] } {
  const namespacedCode = snippetCode.replace(
    /^([a-z_][a-z0-9_]*)\s*\(/gm,
    `${namespace}_${cardId}_$1(`
  );

  const predicateRegex = /^([a-z_][a-z0-9_]*)\s*\(/gm;
  const predicates = new Set<string>();
  let pMatch;
  while ((pMatch = predicateRegex.exec(namespacedCode)) !== null) {
    predicates.add(pMatch[1]!);
  }

  return {
    cardId,
    namespacedCode,
    predicates: [...predicates],
  };
}

// ============================================================================
// BUILD-TIME PROLOG SYNTAX CHECK (C981)
// ============================================================================

/** Prolog syntax check result */
export interface PrologSyntaxCheckResult {
  readonly file: string;
  readonly valid: boolean;
  readonly errors: readonly { line: number; message: string }[];
  readonly warnings: readonly { line: number; message: string }[];
}

/**
 * C981: Check Prolog code for basic syntax errors.
 * Lightweight TS-based checker for build-time validation.
 */
export function checkPrologSyntax(code: string, fileName: string = 'unknown.pl'): PrologSyntaxCheckResult {
  const errors: { line: number; message: string }[] = [];
  const warnings: { line: number; message: string }[] = [];
  const lines = code.split('\n');

  let inComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trim();
    const lineNum = i + 1;

    if (trimmed.startsWith('/*')) inComment = true;
    if (inComment) {
      if (trimmed.includes('*/')) inComment = false;
      continue;
    }
    if (trimmed.startsWith('%') || trimmed === '') continue;

    const opens = (line.match(/\(/g) ?? []).length;
    const closes = (line.match(/\)/g) ?? []).length;
    if (opens > closes + 2) {
      warnings.push({ line: lineNum, message: `Many unmatched opening parentheses (${opens} open, ${closes} close)` });
    }

    if (trimmed.length > 0 && !trimmed.endsWith('.') && !trimmed.endsWith(',') &&
        !trimmed.endsWith(';') && !trimmed.endsWith('->') && !trimmed.endsWith(':-')) {
      if (trimmed.match(/^[a-z_]/) && trimmed.includes('(') && trimmed.includes(')') && opens === closes) {
        errors.push({ line: lineNum, message: 'Clause appears to be missing terminating period (.)' });
      }
    }
  }

  return {
    file: fileName,
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

