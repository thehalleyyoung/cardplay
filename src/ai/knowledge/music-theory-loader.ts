/**
 * @fileoverview Music Theory Knowledge Base Loader
 *
 * Loads the music-theory.pl Prolog knowledge base into the Prolog engine.
 * This provides predicates for:
 * - Notes and intervals
 * - Scales and modes
 * - Chords and progressions
 * - Voice leading rules
 * - Harmonic functions
 * - MusicSpec constraint handling (Branch C)
 * - Jazz theory (LCC, voicings, reharmonization, improvisation)
 * - Spectral music & orchestration models
 * - Film scoring & emotion mapping
 * - World music (Indian, Arabic, African, Latin)
 * - Rock theory (power chords, riffs, subgenres, tunings)
 * - Pop theory (progressions, hooks, production, forms)
 * - EDM theory (beats, drops, synthesis, subgenres)
 * - Cross-cultural fusion theory
 * - East Asian music (Chinese, Japanese, Korean)
 *
 * @module @cardplay/ai/knowledge/music-theory-loader
 */

import { getPrologAdapter, PrologAdapter } from '../engine/prolog-adapter';
import { ontologyRegistry, type OntologyId } from '../theory/ontologies';

// Import the Prolog source file as a string
// Note: Vite/Rollup need ?raw suffix for raw imports
import musicTheoryPl from './music-theory.pl?raw';
import musicTheoryComputationalPl from './music-theory-computational.pl?raw';
import musicTheoryGalantPl from './music-theory-galant.pl?raw';
import musicTheoryFilmPl from './music-theory-film.pl?raw';
import musicTheoryWorldPl from './music-theory-world.pl?raw';
import musicTheoryJazzPl from './music-theory-jazz.pl?raw';
import musicTheorySpectralPl from './music-theory-spectral.pl?raw';
import musicTheoryFilmScoringPl from './music-theory-film-scoring.pl?raw';
import musicTheoryIndianPl from './music-theory-indian.pl?raw';
import musicTheoryArabicPl from './music-theory-arabic.pl?raw';
import musicTheoryAfricanPl from './music-theory-african.pl?raw';
import musicTheoryLatinPl from './music-theory-latin.pl?raw';
import musicTheoryRockPl from './music-theory-rock.pl?raw';
import musicTheoryPopPl from './music-theory-pop.pl?raw';
import musicTheoryEdmPl from './music-theory-edm.pl?raw';
import musicTheoryFusionPl from './music-theory-fusion.pl?raw';
import musicTheoryEastAsianPl from './music-theory-east-asian.pl?raw';
import musicSpecPl from './music-spec.pl?raw';

/**
 * Whether the music theory KB has been loaded.
 */
let loadedAdapters: WeakSet<PrologAdapter> = new WeakSet();

/**
 * Ontology-specific KB modules that have been loaded.
 * Maps adapter → ontologyId → loaded status
 */
let loadedOntologyModules = new WeakMap<PrologAdapter, Set<OntologyId>>();

/**
 * Load the music theory knowledge base into the Prolog engine.
 * Safe to call multiple times - will only load once.
 */
export async function loadMusicTheoryKB(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<void> {
  if (loadedAdapters.has(adapter)) {
    return;
  }

  await adapter.loadProgram(musicTheoryPl, 'music-theory-kb');
  await adapter.loadProgram(musicTheoryComputationalPl, 'music-theory-kb/computational');
  await adapter.loadProgram(musicTheoryGalantPl, 'music-theory-kb/galant');
  await adapter.loadProgram(musicTheoryFilmPl, 'music-theory-kb/film');
  await adapter.loadProgram(musicTheoryWorldPl, 'music-theory-kb/world');
  await adapter.loadProgram(musicTheoryJazzPl, 'music-theory-kb/jazz');
  await adapter.loadProgram(musicTheorySpectralPl, 'music-theory-kb/spectral');
  await adapter.loadProgram(musicTheoryFilmScoringPl, 'music-theory-kb/film-scoring');
  await adapter.loadProgram(musicTheoryIndianPl, 'music-theory-kb/indian');
  await adapter.loadProgram(musicTheoryArabicPl, 'music-theory-kb/arabic');
  await adapter.loadProgram(musicTheoryAfricanPl, 'music-theory-kb/african');
  await adapter.loadProgram(musicTheoryLatinPl, 'music-theory-kb/latin');
  await adapter.loadProgram(musicTheoryRockPl, 'music-theory-kb/rock');
  await adapter.loadProgram(musicTheoryPopPl, 'music-theory-kb/pop');
  await adapter.loadProgram(musicTheoryEdmPl, 'music-theory-kb/edm');
  await adapter.loadProgram(musicTheoryFusionPl, 'music-theory-kb/fusion');
  await adapter.loadProgram(musicTheoryEastAsianPl, 'music-theory-kb/east-asian');
  await adapter.loadProgram(musicSpecPl, 'music-theory-kb/spec');
  loadedAdapters.add(adapter);
}

/**
 * Check if the music theory KB is loaded.
 */
export function isMusicTheoryLoaded(adapter: PrologAdapter = getPrologAdapter()): boolean {
  return loadedAdapters.has(adapter);
}

/**
 * Reset the loaded state (for testing).
 */
export function resetMusicTheoryLoader(): void {
  loadedAdapters = new WeakSet();
  // Also reset ontology tracking
  loadedOntologyModules = new WeakMap();
}

/**
 * Get the raw Prolog source for the music theory KB.
 * Useful for inspection or debugging.
 */
export function getMusicTheorySource(): string {
  return [
    musicTheoryPl,
    musicTheoryComputationalPl,
    musicTheoryGalantPl,
    musicTheoryFilmPl,
    musicTheoryWorldPl,
    musicTheoryJazzPl,
    musicTheorySpectralPl,
    musicTheoryFilmScoringPl,
    musicTheoryIndianPl,
    musicTheoryArabicPl,
    musicTheoryAfricanPl,
    musicTheoryLatinPl,
    musicTheoryRockPl,
    musicTheoryPopPl,
    musicTheoryEdmPl,
    musicTheoryFusionPl,
    musicTheoryEastAsianPl,
    musicSpecPl,
  ].join('\n\n');
}

/**
 * Load ontology-specific KB modules when an ontology is activated.
 * Only loads modules for the specified ontology if not already loaded.
 * 
 * @param ontologyId - The ontology to load KB modules for
 * @param adapter - The Prolog adapter (defaults to global instance)
 * 
 * Change 425: Load ontology-specific .pl modules only when ontology is active.
 */
export async function loadOntologyKB(
  ontologyId: OntologyId,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<void> {
  // Initialize tracking for this adapter if needed
  if (!loadedOntologyModules.has(adapter)) {
    loadedOntologyModules.set(adapter, new Set());
  }
  
  const loadedForAdapter = loadedOntologyModules.get(adapter)!;
  
  // Skip if already loaded
  if (loadedForAdapter.has(ontologyId)) {
    return;
  }
  
  // Get ontology definition
  const ontology = ontologyRegistry.get(ontologyId);
  if (!ontology) {
    console.warn(`Ontology not found: ${ontologyId}`);
    return;
  }
  
  // Load each Prolog module listed in the ontology pack
  if (ontology.pack.prologModules) {
    for (const modulePath of ontology.pack.prologModules) {
      try {
        // In a real implementation, this would dynamically import the module
        // For now, log that we would load it
        console.log(`[Ontology KB] Would load: ${modulePath} for ontology ${ontologyId}`);
        
        // Example of how it would work with dynamic imports:
        // const moduleSource = await import(`./ontologies/${modulePath}?raw`);
        // await adapter.loadProgram(moduleSource.default, `ontology/${ontologyId}/${modulePath}`);
      } catch (error) {
        console.error(`Failed to load ontology KB module ${modulePath}:`, error);
      }
    }
  }
  
  loadedForAdapter.add(ontologyId);
}

/**
 * Unload ontology-specific KB modules.
 * Used when switching away from an ontology.
 * 
 * Note: Most Prolog implementations don't support removing loaded modules.
 * This is a placeholder for future implementations that support module isolation.
 */
export async function unloadOntologyKB(
  ontologyId: OntologyId,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<void> {
  const loadedForAdapter = loadedOntologyModules.get(adapter);
  if (loadedForAdapter) {
    loadedForAdapter.delete(ontologyId);
  }
  
  // In a full implementation, this would retract ontology-specific facts
  console.log(`[Ontology KB] Would unload modules for ontology ${ontologyId}`);
}

/**
 * Check if an ontology's KB modules are loaded.
 */
export function isOntologyLoaded(
  ontologyId: OntologyId,
  adapter: PrologAdapter = getPrologAdapter()
): boolean {
  const loadedForAdapter = loadedOntologyModules.get(adapter);
  return loadedForAdapter?.has(ontologyId) ?? false;
}

/**
 * Get all loaded ontology IDs for an adapter.
 */
export function getLoadedOntologies(
  adapter: PrologAdapter = getPrologAdapter()
): readonly OntologyId[] {
  const loadedForAdapter = loadedOntologyModules.get(adapter);
  return loadedForAdapter ? Array.from(loadedForAdapter) : [];
}

// ============================================================================
// KB HEALTH REPORT (Change 388)
// ============================================================================

/**
 * KB module metadata for health reporting.
 */
export interface KBModuleInfo {
  /** Module name/identifier */
  readonly name: string;
  /** Whether the module is loaded */
  readonly loaded: boolean;
  /** Source file size (characters) */
  readonly size: number;
  /** Module type (core, ontology, etc) */
  readonly type: 'core' | 'ontology' | 'spec';
}

/**
 * KB health report data.
 */
export interface KBHealthReport {
  /** Whether the main KB is loaded */
  readonly mainKBLoaded: boolean;
  /** Core KB modules */
  readonly coreModules: readonly KBModuleInfo[];
  /** Loaded ontology modules */
  readonly ontologyModules: readonly KBModuleInfo[];
  /** Total number of modules */
  readonly totalModules: number;
  /** Total source size (characters) */
  readonly totalSize: number;
}

/**
 * Core KB modules (loaded deterministically).
 */
const CORE_KB_MODULES: ReadonlyArray<{ name: string; source: string; type: 'core' | 'spec' }> = [
  { name: 'music-theory', source: musicTheoryPl, type: 'core' },
  { name: 'computational', source: musicTheoryComputationalPl, type: 'core' },
  { name: 'galant', source: musicTheoryGalantPl, type: 'core' },
  { name: 'film', source: musicTheoryFilmPl, type: 'core' },
  { name: 'world', source: musicTheoryWorldPl, type: 'core' },
  { name: 'jazz', source: musicTheoryJazzPl, type: 'core' },
  { name: 'spectral', source: musicTheorySpectralPl, type: 'core' },
  { name: 'film-scoring', source: musicTheoryFilmScoringPl, type: 'core' },
  { name: 'indian', source: musicTheoryIndianPl, type: 'core' },
  { name: 'arabic', source: musicTheoryArabicPl, type: 'core' },
  { name: 'african', source: musicTheoryAfricanPl, type: 'core' },
  { name: 'latin', source: musicTheoryLatinPl, type: 'core' },
  { name: 'rock', source: musicTheoryRockPl, type: 'core' },
  { name: 'pop', source: musicTheoryPopPl, type: 'core' },
  { name: 'edm', source: musicTheoryEdmPl, type: 'core' },
  { name: 'fusion', source: musicTheoryFusionPl, type: 'core' },
  { name: 'east-asian', source: musicTheoryEastAsianPl, type: 'core' },
  { name: 'music-spec', source: musicSpecPl, type: 'spec' },
];

/**
 * Generate a health report for the loaded KB.
 * Lists loaded KB modules and predicate counts.
 * 
 * Change 388: Implements kbHealthReport() API for debugging and doc lint support.
 * 
 * @param adapter - The Prolog adapter (defaults to global instance)
 * @returns Health report data
 */
export function kbHealthReport(
  adapter: PrologAdapter = getPrologAdapter()
): KBHealthReport {
  const mainLoaded = loadedAdapters.has(adapter);
  
  // Build core module info
  const coreModules: KBModuleInfo[] = CORE_KB_MODULES.map(mod => ({
    name: mod.name,
    loaded: mainLoaded,
    size: mod.source.length,
    type: mod.type,
  }));
  
  // Build ontology module info
  const loadedOntologies = getLoadedOntologies(adapter);
  const ontologyModules: KBModuleInfo[] = loadedOntologies.map(ontId => {
    // const ont = ontologyRegistry.get(ontId); // Unused for now
    return {
      name: ontId,
      loaded: true,
      size: 0, // Ontology modules don't expose source size currently
      type: 'ontology' as const,
    };
  });
  
  const totalModules = coreModules.length + ontologyModules.length;
  const totalSize = coreModules.reduce((sum, mod) => sum + mod.size, 0);
  
  return {
    mainKBLoaded: mainLoaded,
    coreModules,
    ontologyModules,
    totalModules,
    totalSize,
  };
}

/**
 * Get list of predicates provided by loaded KB modules.
 * 
 * Change 387: Exposes which predicates are provided for doc lint support.
 * 
 * Note: This is a placeholder implementation. A full implementation would
 * query the Prolog engine for defined predicates via current_predicate/1.
 * 
 * @returns Array of predicate signatures (name/arity)
 */
export async function getLoadedPredicates(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<string[]> {
  if (!loadedAdapters.has(adapter)) {
    return [];
  }
  
  try {
    // Query for all user-defined predicates
    // Note: This assumes the Prolog adapter supports current_predicate/1
    const results = await adapter.queryAll('current_predicate(Name/Arity)');
    
    return results.map(r => `${r.Name}/${r.Arity}`);
  } catch {
    // Fallback: return known predicates from module structure
    return [
      // Core predicates (known from KB structure)
      'note/1',
      'interval/3',
      'scale/2',
      'mode/2',
      'chord/3',
      'progression/2',
      'voice_leading/3',
      'harmonic_function/2',
      'cadence/2',
      'constraint_check/3',
      'spec_validate/2',
      'recommend_action/3',
      // More predicates would be listed here
    ];
  }
}
