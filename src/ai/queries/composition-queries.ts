/**
 * @fileoverview Composition Pattern Query Functions
 * 
 * TypeScript wrappers around Prolog queries for compositional patterns,
 * genre characteristics, arrangement suggestions, and pattern generation.
 * 
 * These functions provide a type-safe interface to the composition-patterns.pl
 * knowledge base, enabling AI-assisted composition features.
 * 
 * @module @cardplay/ai/queries/composition-queries
 */

import { getPrologAdapter, PrologAdapter } from '../engine/prolog-adapter';
import { loadCompositionPatternsKB } from '../knowledge/composition-patterns-loader';

// =============================================================================
// Types
// =============================================================================

/**
 * Music genre identifier.
 */
export type Genre = string;

/**
 * Section type in an arrangement.
 */
export type SectionType = 
  | 'intro' | 'verse' | 'pre_chorus' | 'chorus' | 'post_chorus'
  | 'bridge' | 'outro' | 'drop' | 'buildup' | 'breakdown'
  | 'solo' | 'interlude' | 'hook' | 'refrain' | 'coda'
  | 'development' | 'recapitulation' | 'exposition' | 'transition' | 'fill';

/**
 * Genre information.
 */
export interface GenreInfo {
  readonly id: Genre;
  readonly tempoRange: { min: number; max: number };
  readonly characteristics: string[];
  readonly harmonicLanguage: string[];
  readonly rhythmicFeel: string[];
  readonly typicalInstruments: string[];
  readonly phraseLengths: number[];
}

/**
 * Arrangement section.
 */
export interface Section {
  readonly type: SectionType;
  readonly energy: number;
  readonly lengthBars?: number;
}

/**
 * Arrangement template.
 */
export interface ArrangementTemplate {
  readonly genre: Genre;
  readonly durationBars: number;
  readonly sections: SectionType[];
  readonly energyCurve: number[];
}

/**
 * Bass pattern definition.
 */
export interface BassPattern {
  readonly id: string;
  readonly genre: Genre;
  readonly steps: (number | string)[];
}

/**
 * Drum pattern definition.
 */
export interface DrumPattern {
  readonly id: string;
  readonly genre: Genre;
  readonly kicks: number[];
  readonly snares: number[];
  readonly hihats: number[];
}

/**
 * Variation technique.
 */
export interface VariationTechnique {
  readonly id: string;
  readonly description: string;
  readonly applicableGenres: Genre[];
}

/**
 * Arrangement validation result.
 */
export interface ArrangementValidation {
  readonly valid: boolean;
  readonly reason?: string;
  readonly invalidTransition?: { from: SectionType; to: SectionType };
}

/**
 * Density suggestion.
 */
export interface DensitySuggestion {
  readonly section: SectionType;
  readonly level: 'sparse' | 'medium' | 'dense';
  readonly instrumentCount: number;
}

/**
 * Transition technique suggestion.
 */
export interface TransitionSuggestion {
  readonly id: string;
  readonly description: string;
}

/**
 * Melodic range for an instrument.
 */
export interface MelodicRange {
  readonly instrument: string;
  readonly lowNote: number;  // MIDI note number
  readonly highNote: number;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Ensure the composition patterns KB is loaded.
 */
async function ensureKBLoaded(adapter: PrologAdapter): Promise<void> {
  await loadCompositionPatternsKB(adapter);
}

// =============================================================================
// Genre Queries
// =============================================================================

/**
 * Get all available genres.
 * 
 * @returns Array of genre identifiers
 * 
 * @example
 * const genres = await getAllGenres();
 * // ['lofi', 'house', 'techno', 'ambient', 'jazz', ...]
 */
export async function getAllGenres(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<Genre[]> {
  await ensureKBLoaded(adapter);
  
  const results = await adapter.queryAll('genre(G)');
  
  return results
    .map(r => String(r.G));
}

/**
 * Get comprehensive information about a genre.
 * 
 * @param genre - The genre identifier
 * @returns Genre information or null if not found
 * 
 * @example
 * const info = await getGenreInfo('lofi');
 * // { id: 'lofi', tempoRange: { min: 60, max: 90 }, characteristics: ['relaxed', 'nostalgic', ...], ... }
 */
export async function getGenreInfo(
  genre: Genre,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<GenreInfo | null> {
  await ensureKBLoaded(adapter);
  
  // Check if genre exists
  const genreExists = await adapter.querySingle(`genre(${genre})`);
  if (genreExists === null) {
    return null;
  }
  
  // Get tempo range
  const tempoResult = await adapter.querySingle(`genre_tempo_range(${genre}, Min, Max)`);
  const tempoRange = tempoResult !== null
    ? { min: Number(tempoResult.Min), max: Number(tempoResult.Max) }
    : { min: 100, max: 140 };
  
  // Get characteristics
  const charResults = await adapter.queryAll(`genre_characteristic(${genre}, C)`);
  const characteristics = charResults
    .map(r => String(r.C));
  
  // Get harmonic language
  const harmResults = await adapter.queryAll(`genre_harmonic_language(${genre}, H)`);
  const harmonicLanguage = harmResults
    .map(r => String(r.H));
  
  // Get rhythmic feel
  const rhythmResults = await adapter.queryAll(`genre_rhythmic_feel(${genre}, R)`);
  const rhythmicFeel = rhythmResults
    .map(r => String(r.R));
  
  // Get typical instruments
  const instrResult = await adapter.querySingle(`genre_typical_instruments(${genre}, I)`);
  const typicalInstruments = instrResult !== null && Array.isArray(instrResult.I)
    ? instrResult.I.map(String)
    : [];
  
  // Get phrase lengths
  const phraseResults = await adapter.queryAll(`phrase_length(${genre}, L)`);
  const phraseLengths = phraseResults
    .map(r => Number(r.L));
  
  return {
    id: genre,
    tempoRange,
    characteristics,
    harmonicLanguage,
    rhythmicFeel,
    typicalInstruments,
    phraseLengths
  };
}

/**
 * Get the suggested tempo for a genre.
 * 
 * @param genre - The genre identifier
 * @returns Suggested tempo in BPM
 * 
 * @example
 * const tempo = await suggestTempo('house');
 * // 124
 */
export async function suggestTempo(
  genre: Genre,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<number> {
  await ensureKBLoaded(adapter);
  
  const result = await adapter.querySingle(`suggest_tempo(${genre}, T)`);
  
  if (result !== null) {
    return Number(result.T);
  }
  
  return 120; // Default tempo
}

/**
 * Get the tempo range for a genre.
 * 
 * @param genre - The genre identifier
 * @returns Object with min and max BPM
 * 
 * @example
 * const range = await getTempoRange('techno');
 * // { min: 125, max: 150 }
 */
export async function getTempoRange(
  genre: Genre,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<{ min: number; max: number }> {
  await ensureKBLoaded(adapter);
  
  const result = await adapter.querySingle(`genre_tempo_range(${genre}, Min, Max)`);
  
  if (result !== null) {
    return { min: Number(result.Min), max: Number(result.Max) };
  }
  
  return { min: 100, max: 140 };
}

// =============================================================================
// Arrangement Queries (L155, L159, L161)
// =============================================================================

/**
 * Suggest an arrangement for a genre and target length.
 * (L155: suggestArrangement)
 * 
 * @param genre - The genre identifier
 * @param targetLengthBars - Target length in bars
 * @returns Array of section types forming the arrangement
 * 
 * @example
 * const arrangement = await suggestArrangement('house', 128);
 * // ['intro', 'buildup', 'drop', 'breakdown', 'buildup', 'drop', 'outro']
 */
export async function suggestArrangement(
  genre: Genre,
  targetLengthBars: number = 64,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<SectionType[]> {
  await ensureKBLoaded(adapter);
  
  const result = await adapter.querySingle(
    `suggest_arrangement(${genre}, ${targetLengthBars}, Sections)`
  );
  
  if (result !== null && Array.isArray(result.Sections)) {
    return result.Sections.map(String) as SectionType[];
  }
  
  // Fallback to section_order
  const orderResult = await adapter.querySingle(`section_order(${genre}, Order)`);
  if (orderResult !== null && Array.isArray(orderResult.Order)) {
    return orderResult.Order.map(String) as SectionType[];
  }
  
  // Default arrangement
  return ['intro', 'verse', 'chorus', 'verse', 'chorus', 'outro'];
}

/**
 * Get all arrangement templates for a genre.
 * 
 * @param genre - The genre identifier
 * @returns Array of arrangement templates
 */
export async function getArrangementTemplates(
  genre: Genre,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<ArrangementTemplate[]> {
  await ensureKBLoaded(adapter);
  
  const results = await adapter.queryAll(
    `arrangement_template(${genre}, Duration, Sections)`
  );
  
  const templates: ArrangementTemplate[] = [];
  
  for (const r of results) {
    const sections = Array.isArray(r.Sections)
      ? r.Sections.map(String) as SectionType[]
        : [];
      
      // Get energy curve
      const energyResult = await adapter.querySingle(`energy_curve(${genre}, Curve)`);
      const energyCurve = energyResult !== null && Array.isArray(energyResult.Curve)
        ? energyResult.Curve.map(Number)
        : [];
      
      templates.push({
        genre,
        durationBars: Number(r.Duration),
        sections,
        energyCurve
      });
  }
  
  return templates;
}

/**
 * Validate an arrangement section sequence.
 * (L159: validateArrangement)
 * 
 * @param sections - Array of section types
 * @returns Validation result
 * 
 * @example
 * const result = await validateArrangement(['intro', 'verse', 'chorus', 'outro']);
 * // { valid: true }
 */
export async function validateArrangement(
  sections: SectionType[],
  adapter: PrologAdapter = getPrologAdapter()
): Promise<ArrangementValidation> {
  await ensureKBLoaded(adapter);
  
  if (sections.length < 2) {
    return { valid: true };
  }
  
  const sectionList = `[${sections.join(', ')}]`;
  const result = await adapter.querySingle(`validate_section_sequence(${sectionList}, Result)`);
  
  if (result !== null) {
    const resultStr = String(result.Result);
    if (resultStr === 'valid') {
      return { valid: true };
    }
    // Parse invalid(S1, S2)
    const from = sections[0];
    const to = sections[1];
    if (!from || !to) return { valid: false, reason: 'invalid_transition' };
    return { 
      valid: false, 
      reason: 'invalid_transition',
      invalidTransition: { from, to } // Simplified
    };
  }
  
  return { valid: true };
}

/**
 * Suggest the next section to add to an arrangement.
 * (L161: suggestNextSection)
 * 
 * @param currentSections - Current section sequence
 * @param genre - The genre identifier
 * @returns Array of suggested next sections
 * 
 * @example
 * const suggestions = await suggestNextSection(['intro', 'verse'], 'pop');
 * // ['chorus', 'pre_chorus']
 */
export async function suggestNextSection(
  currentSections: SectionType[],
  genre: Genre,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<SectionType[]> {
  await ensureKBLoaded(adapter);
  
  if (currentSections.length === 0) {
    return ['intro'];
  }
  
  const lastSection = currentSections.at(-1);
  if (!lastSection) return [];
  const results = await adapter.queryAll(
    `suggest_next_section(${lastSection}, ${genre}, Next)`
  );
  
  return results
    .map(r => String(r.Next) as SectionType);
}

/**
 * Get section energy level.
 * 
 * @param section - The section type
 * @returns Energy level (1-10)
 */
export async function getSectionEnergy(
  section: SectionType,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<number> {
  await ensureKBLoaded(adapter);
  
  const result = await adapter.querySingle(`section_energy(${section}, E)`);
  
  if (result !== null) {
    return Number(result.E);
  }
  
  return 5; // Default medium energy
}

// =============================================================================
// Pattern Queries (L156, L157)
// =============================================================================

/**
 * Suggest a bass pattern for a genre.
 * (L156: suggestBassLine - simplified to pattern suggestion)
 * 
 * @param genre - The genre identifier
 * @returns Array of bass pattern suggestions
 * 
 * @example
 * const patterns = await suggestBassPattern('house');
 * // [{ id: 'root_octave', genre: 'house', steps: [1, 1, 1, 8] }, ...]
 */
export async function suggestBassPattern(
  genre: Genre,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<BassPattern[]> {
  await ensureKBLoaded(adapter);
  
  const patternResults = await adapter.queryAll(`bass_pattern(${genre}, Pattern)`);
  const patterns: BassPattern[] = [];
  
  for (const r of patternResults) {
    const patternId = String(r.Pattern);
    const stepsResult = await adapter.querySingle(`bass_pattern_steps(${patternId}, Steps)`);
    
    if (stepsResult !== null && Array.isArray(stepsResult.Steps)) {
      patterns.push({
        id: patternId,
        genre,
        steps: stepsResult.Steps
      });
    }
  }
  
  return patterns;
}

/**
 * Suggest a drum pattern for a genre.
 * (L157: suggestDrumPattern)
 * 
 * @param genre - The genre identifier
 * @param _energy - Energy level (0-1) - for future use
 * @returns Array of drum pattern suggestions
 * 
 * @example
 * const patterns = await suggestDrumPattern('techno');
 * // [{ id: 'driving_four', genre: 'techno', kicks: [1,5,9,13], snares: [5,13], hihats: [...] }]
 */
export async function suggestDrumPattern(
  genre: Genre,
  _energy: number = 0.5,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<DrumPattern[]> {
  await ensureKBLoaded(adapter);
  
  const patternResults = await adapter.queryAll(`drum_pattern(${genre}, Pattern)`);
  const patterns: DrumPattern[] = [];
  
  for (const r of patternResults) {
    const patternId = String(r.Pattern);
    const hitsResult = await adapter.querySingle(`drum_pattern_hits(${patternId}, Hits)`);
    
    if (hitsResult !== null && Array.isArray(hitsResult.Hits)) {
      const hits = hitsResult.Hits as number[][];
      patterns.push({
        id: patternId,
        genre,
        kicks: Array.isArray(hits[0]) ? hits[0] : [],
        snares: Array.isArray(hits[1]) ? hits[1] : [],
        hihats: Array.isArray(hits[2]) ? hits[2] : []
      });
    }
  }
  
  return patterns;
}

/**
 * Get the chord rhythm (harmonic rhythm rate) for a genre.
 * 
 * @param genre - The genre identifier
 * @returns Chord changes per bar
 */
export async function getChordRhythm(
  genre: Genre,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<number> {
  await ensureKBLoaded(adapter);
  
  const result = await adapter.querySingle(`chord_rhythm(${genre}, Rate)`);
  
  if (result !== null) {
    return Number(result.Rate);
  }
  
  return 1; // Default: 1 chord per bar
}

// =============================================================================
// Variation Queries (L160)
// =============================================================================

/**
 * Get variation techniques applicable to a genre.
 * (L160: suggestVariation - returns applicable techniques)
 * 
 * @param genre - The genre identifier
 * @returns Array of variation techniques
 * 
 * @example
 * const variations = await getVariationTechniques('jazz');
 * // [{ id: 'harmonic_variation', description: '...', applicableGenres: ['jazz'] }, ...]
 */
export async function getVariationTechniques(
  genre: Genre,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<VariationTechnique[]> {
  await ensureKBLoaded(adapter);
  
  const results = await adapter.queryAll(`applicable_variation(${genre}, Technique)`);
  const techniques: VariationTechnique[] = [];
  
  for (const r of results) {
    const techniqueId = String(r.Technique);
    const descResult = await adapter.querySingle(`variation_technique(${techniqueId}, Desc)`);
    
    techniques.push({
      id: techniqueId,
      description: descResult !== null ? String(descResult.Desc) : techniqueId,
      applicableGenres: [genre]
    });
  }
  
  return techniques;
}

/**
 * Get all variation techniques.
 * 
 * @returns Array of all variation techniques
 */
export async function getAllVariationTechniques(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<VariationTechnique[]> {
  await ensureKBLoaded(adapter);
  
  const results = await adapter.queryAll('variation_technique(Id, Desc)');
  const techniques: VariationTechnique[] = [];
  
  for (const r of results) {
    const techniqueId = String(r.Id);
    
    // Find applicable genres
    const genreResults = await adapter.queryAll(`applicable_variation(G, ${techniqueId})`);
    const genres = genreResults.map(gr => String(gr.G));
    
    techniques.push({
      id: techniqueId,
      description: String(r.Desc),
      applicableGenres: genres
    });
  }
  
  return techniques;
}

// =============================================================================
// Density and Layering Queries
// =============================================================================

/**
 * Get density suggestions for a section type.
 * 
 * @param section - The section type
 * @returns Array of density suggestions
 */
export async function getDensitySuggestions(
  section: SectionType,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<DensitySuggestion[]> {
  await ensureKBLoaded(adapter);
  
  const results = await adapter.queryAll(`density_rule(${section}, Level, Count)`);
  
  return results
    .map(r => ({
      section,
      level: String(r.Level) as 'sparse' | 'medium' | 'dense',
      instrumentCount: Number(r.Count)
    }));
}

/**
 * Get transition technique suggestions.
 * 
 * @returns Array of transition techniques
 */
export async function getTransitionTechniques(
  adapter: PrologAdapter = getPrologAdapter()
): Promise<TransitionSuggestion[]> {
  await ensureKBLoaded(adapter);
  
  const results = await adapter.queryAll('transition_technique(Id, Desc)');
  
  return results
    .map(r => ({
      id: String(r.Id),
      description: String(r.Desc)
    }));
}

// =============================================================================
// Melodic Range Queries
// =============================================================================

/**
 * Get melodic range for an instrument.
 * (L158: for melody generation constraints)
 * 
 * @param instrument - The instrument type
 * @returns Melodic range or null if not found
 */
export async function getMelodicRange(
  instrument: string,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<MelodicRange | null> {
  await ensureKBLoaded(adapter);
  
  const result = await adapter.querySingle(`melodic_range(${instrument}, Low, High)`);
  
  if (result !== null) {
    return {
      instrument,
      lowNote: Number(result.Low),
      highNote: Number(result.High)
    };
  }
  
  return null;
}

/**
 * Check if a note is in range for an instrument.
 * 
 * @param instrument - The instrument type
 * @param note - MIDI note number
 * @returns True if in range
 */
export async function isNoteInRange(
  instrument: string,
  note: number,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<boolean> {
  await ensureKBLoaded(adapter);
  
  const result = await adapter.querySingle(`in_melodic_range(${instrument}, ${note}, Result)`);
  
  if (result !== null) {
    return String(result.Result) === 'true';
  }
  
  return false;
}

// =============================================================================
// Humanization and Feel Queries
// =============================================================================

/**
 * Get the swing feel amount for a genre.
 * 
 * @param genre - The genre identifier
 * @returns Swing amount (0.0 = straight, 0.67 = triplet swing)
 */
export async function getSwingFeel(
  genre: Genre,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<number> {
  await ensureKBLoaded(adapter);
  
  const result = await adapter.querySingle(`swing_feel(${genre}, Amount)`);
  
  if (result !== null) {
    return Number(result.Amount);
  }
  
  return 0.0; // Default straight
}

/**
 * Get humanization parameters for a genre.
 * 
 * @param genre - The genre identifier
 * @returns Object with timing and velocity variation amounts
 */
export async function getHumanizationParams(
  genre: Genre,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<{ timing: number; velocity: number }> {
  await ensureKBLoaded(adapter);
  
  const timingResult = await adapter.querySingle(`humanization_rule(timing, ${genre}, T)`);
  const velocityResult = await adapter.querySingle(`humanization_rule(velocity, ${genre}, V)`);
  
  return {
    timing: timingResult !== null ? Number(timingResult.T) : 0,
    velocity: velocityResult !== null ? Number(velocityResult.V) : 0
  };
}

// =============================================================================
// Compatibility Queries
// =============================================================================

/**
 * Check if two genres are compatible for fusion.
 * 
 * @param genre1 - First genre
 * @param genre2 - Second genre
 * @returns True if compatible
 */
export async function areGenresCompatible(
  genre1: Genre,
  genre2: Genre,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<boolean> {
  await ensureKBLoaded(adapter);
  
  const result = await adapter.querySingle(`genre_compatible(${genre1}, ${genre2})`);
  
  return result !== null;
}

/**
 * Get the repetition tolerance for a genre.
 * 
 * @param genre - The genre identifier
 * @returns Repetition tolerance level
 */
export async function getRepetitionTolerance(
  genre: Genre,
  adapter: PrologAdapter = getPrologAdapter()
): Promise<'low' | 'medium' | 'high'> {
  await ensureKBLoaded(adapter);
  
  const result = await adapter.querySingle(`genre_repetition_tolerance(${genre}, Level)`);
  
  if (result !== null) {
    return String(result.Level) as 'low' | 'medium' | 'high';
  }
  
  return 'medium';
}
