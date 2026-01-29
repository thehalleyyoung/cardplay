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
  // specToPrologTerm,  // Unused - commented out for build
} from '../theory/spec-prolog-bridge';

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
  adapter: PrologAdapter = getPrologAdapter()
): Promise<SpecConflict[]> {
  await ensureLoaded(adapter);
  await clearSpec(adapter);
  await pushSpec(spec, adapter);
  
  try {
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
  } finally {
    await clearSpec(adapter);
  }
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
  adapter: PrologAdapter = getPrologAdapter()
): Promise<SpecLintWarning[]> {
  await ensureLoaded(adapter);
  await clearSpec(adapter);
  await pushSpec(spec, adapter);
  
  try {
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
  } finally {
    await clearSpec(adapter);
  }
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
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<ModeRecommendation[]>> {
  await ensureLoaded(adapter);
  await clearSpec(adapter);
  await pushSpec(spec, adapter);
  
  try {
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
  } finally {
    await clearSpec(adapter);
  }
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
  
  // TODO: Convert Prolog constraint terms to MusicConstraint objects
  // For now, return empty - this requires a more complex parser
  return [];
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
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Explainable<RecommendedAction[]>> {
  await ensureLoaded(adapter);
  await clearSpec(adapter);
  await pushSpec(spec, adapter);
  
  try {
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
    
    const actions: RecommendedAction[] = actionsRaw
      .filter((a): a is Record<string, unknown> => a != null && typeof a === 'object')
      .map(a => {
        // Parse action term: action(ActionTerm, Confidence, Reasons)
        const actionTerm = a['action'] || a[0];
        const confidence = (a['confidence'] || a[1] || 0.5) as number;
        const reasons = (a['reasons'] || a[2] || []) as string[];
        
        // Parse action type and params from term
        let actionType = 'unknown';
        const params: Record<string, unknown> = {};
        
        if (typeof actionTerm === 'string') {
          actionType = actionTerm;
        } else if (typeof actionTerm === 'object' && actionTerm) {
          // Handle structured action terms
          const term = actionTerm as Record<string, unknown>;
          if (term['set_param']) {
            actionType = 'set_param';
            Object.assign(params, term['set_param']);
          } else if (term['apply_pack']) {
            actionType = 'apply_pack';
            params['packId'] = term['apply_pack'];
          } else if (term['add_constraint']) {
            actionType = 'add_constraint';
            params['constraint'] = term['add_constraint'];
          }
        }
        
        return {
          action: actionType,
          params,
          confidence: Math.round(confidence * 100),
          reasons: reasons.map(r => String(r)),
        };
      })
      .sort((a, b) => b.confidence - a.confidence);
    
    const avgConfidence = actions.length > 0
      ? Math.round(actions.reduce((sum, a) => sum + a.confidence, 0) / actions.length)
      : 0;
    
    return explainable(actions, [`Found ${actions.length} recommended actions`], avgConfidence);
  } finally {
    await clearSpec(adapter);
  }
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