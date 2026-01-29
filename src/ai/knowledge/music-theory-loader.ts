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
 *
 * @module @cardplay/ai/knowledge/music-theory-loader
 */

import { getPrologAdapter, PrologAdapter } from '../engine/prolog-adapter';

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
import musicSpecPl from './music-spec.pl?raw';

/**
 * Whether the music theory KB has been loaded.
 */
let musicTheoryLoaded = false;

/**
 * Load the music theory knowledge base into the Prolog engine.
 * Safe to call multiple times - will only load once.
 */
export async function loadMusicTheoryKB(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<void> {
  if (musicTheoryLoaded) {
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
  await adapter.loadProgram(musicSpecPl, 'music-theory-kb/spec');
  musicTheoryLoaded = true;
}

/**
 * Check if the music theory KB is loaded.
 */
export function isMusicTheoryLoaded(): boolean {
  return musicTheoryLoaded;
}

/**
 * Reset the loaded state (for testing).
 */
export function resetMusicTheoryLoader(): void {
  musicTheoryLoaded = false;
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
    musicSpecPl,
  ].join('\n\n');
}
