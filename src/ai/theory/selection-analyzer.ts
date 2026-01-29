/**
 * @fileoverview SelectionAnalyzer — Extract and analyze musical selections (C882-C883)
 *
 * Provides a shared utility for tracker, notation, and session boards to:
 * 1. Extract note events from a selection
 * 2. Build a musical profile (pitch classes, intervals, density, range)
 * 3. Query the Prolog KB for culture/raga/schema/mode matches
 * 4. Return analysis results for display in analysis cards
 *
 * This is the TypeScript counterpart of the Prolog `analyze_selection/2` predicate.
 *
 * Implements: C882 (TS pipeline), C883 (shared SelectionAnalyzer)
 *
 * @module @cardplay/ai/theory/selection-analyzer
 */

import type { MusicSpec, CultureTag, RagaName, ChineseModeName, GalantSchemaName } from './music-spec';

// ============================================================================
// EVENT AND PROFILE TYPES
// ============================================================================

/**
 * A note event from a tracker/notation/session selection.
 */
export interface NoteEvent {
  /** MIDI pitch number (0-127) */
  readonly pitch: number;
  /** Onset time in beats */
  readonly onset: number;
  /** Duration in beats */
  readonly duration: number;
  /** Velocity (0-127) */
  readonly velocity: number;
}

/**
 * Musical profile extracted from a selection.
 */
export interface SelectionProfile {
  /** Unique pitch classes present (0-11) */
  readonly pitchClasses: readonly number[];
  /** Intervals between consecutive notes (in semitones) */
  readonly intervals: readonly number[];
  /** Overall density estimate */
  readonly density: 'sparse' | 'medium' | 'dense';
  /** Pitch range in semitones */
  readonly rangeSpan: number;
  /** Average velocity */
  readonly avgVelocity: number;
  /** Total number of events */
  readonly eventCount: number;
  /** Duration span in beats */
  readonly durationSpan: number;
}

/**
 * A culture match result.
 */
export interface CultureMatch {
  readonly culture: CultureTag;
  readonly confidence: number;
  readonly reasons: readonly string[];
}

/**
 * A raga match result.
 */
export interface RagaMatch {
  readonly raga: RagaName;
  readonly confidence: number;
  readonly matchedPCs: readonly number[];
}

/**
 * A Chinese mode match result.
 */
export interface ChineseModeMatch {
  readonly mode: ChineseModeName;
  readonly confidence: number;
  readonly matchedPCs: readonly number[];
}

/**
 * A galant schema match result.
 */
export interface SchemaMatch {
  readonly schema: GalantSchemaName;
  readonly score: number;
  readonly matchedDegrees: readonly number[];
}

/**
 * Complete analysis result from a selection.
 */
export interface SelectionAnalysis {
  readonly profile: SelectionProfile;
  readonly cultureMatches: readonly CultureMatch[];
  readonly ragaMatches: readonly RagaMatch[];
  readonly chineseModeMatches: readonly ChineseModeMatch[];
  readonly schemaMatches: readonly SchemaMatch[];
  readonly suggestedKey: { root: string; mode: string; confidence: number } | null;
}

// ============================================================================
// PITCH CLASS REFERENCE DATA
// ============================================================================

/**
 * Raga pitch class sets (relative to Sa = 0).
 */
const RAGA_PCS: Readonly<Record<RagaName, readonly number[]>> = {
  mohanam:          [0, 2, 4, 7, 9],
  hamsadhwani:      [0, 2, 4, 7, 11],
  kalyani:          [0, 2, 4, 6, 7, 9, 11],
  keeravani:        [0, 2, 3, 5, 7, 8, 11],
  shankarabharanam: [0, 2, 4, 5, 7, 9, 11],
  hindolam:         [0, 3, 5, 8, 10],
  abhogi:           [0, 2, 3, 5, 9],
  todi:             [0, 1, 3, 6, 7, 8, 11],
  bhairavi:         [0, 1, 3, 5, 7, 8, 10],
  kambhoji:         [0, 2, 4, 5, 7, 9, 10],
};

/**
 * Chinese pentatonic mode pitch class sets (relative to gong = 0).
 */
const CHINESE_MODE_PCS: Readonly<Record<ChineseModeName, readonly number[]>> = {
  gong:  [0, 2, 4, 7, 9],
  shang: [0, 2, 5, 7, 10],
  jiao:  [0, 3, 5, 8, 10],
  zhi:   [0, 2, 5, 7, 9],
  yu:    [0, 3, 5, 7, 10],
};

/**
 * Major scale pitch classes for schema matching (relative to tonic = 0).
 */
const MAJOR_SCALE_PCS = [0, 2, 4, 5, 7, 9, 11];

// ============================================================================
// PROFILE EXTRACTION
// ============================================================================

/**
 * Extract a musical profile from a list of note events.
 */
export function extractProfile(events: readonly NoteEvent[]): SelectionProfile {
  if (events.length === 0) {
    return {
      pitchClasses: [],
      intervals: [],
      density: 'sparse',
      rangeSpan: 0,
      avgVelocity: 0,
      eventCount: 0,
      durationSpan: 0,
    };
  }

  // Pitch classes
  const pcs = new Set<number>();
  for (const e of events) pcs.add(e.pitch % 12);
  const pitchClasses = [...pcs].sort((a, b) => a - b);

  // Intervals between consecutive events (sorted by onset)
  const sorted = [...events].sort((a, b) => a.onset - b.onset);
  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const curr = sorted[i];
    const prev = sorted[i - 1];
    if (curr && prev) {
      intervals.push(curr.pitch - prev.pitch);
    }
  }

  // Density
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const firstOnset = first?.onset ?? 0;
  const lastOnset = last?.onset ?? 0;
  const durationSpan = lastOnset - firstOnset + (last?.duration ?? 0);
  const eventsPerBeat = durationSpan > 0 ? events.length / durationSpan : 0;
  const density: SelectionProfile['density'] =
    eventsPerBeat <= 1 ? 'sparse' : eventsPerBeat <= 3 ? 'medium' : 'dense';

  // Range
  const pitches = events.map(e => e.pitch);
  const rangeSpan = Math.max(...pitches) - Math.min(...pitches);

  // Average velocity
  const avgVelocity = events.reduce((sum, e) => sum + e.velocity, 0) / events.length;

  return {
    pitchClasses,
    intervals,
    density,
    rangeSpan,
    avgVelocity: Math.round(avgVelocity),
    eventCount: events.length,
    durationSpan,
  };
}

// ============================================================================
// CULTURE MATCHING
// ============================================================================

/**
 * Match a profile against culture systems.
 */
export function matchCultures(profile: SelectionProfile): CultureMatch[] {
  const matches: CultureMatch[] = [];
  const pcCount = profile.pitchClasses.length;

  // Pentatonic (5 PCs) suggests Carnatic or Chinese
  if (pcCount === 5) {
    // Check if it matches any raga with 5 notes
    const ragaMatches = matchRagas(profile);
    if (ragaMatches.length > 0) {
      matches.push({
        culture: 'carnatic',
        confidence: Math.max(...ragaMatches.map(r => r.confidence)),
        reasons: [`Matches raga(s): ${ragaMatches.map(r => r.raga).join(', ')}`],
      });
    }
    // Check Chinese modes
    const chineseMatches = matchChineseModes(profile);
    if (chineseMatches.length > 0) {
      matches.push({
        culture: 'chinese',
        confidence: Math.max(...chineseMatches.map(m => m.confidence)),
        reasons: [`Matches mode(s): ${chineseMatches.map(m => m.mode).join(', ')}`],
      });
    }
  }

  // Heptatonic (7 PCs) suggests Western or Carnatic
  if (pcCount >= 6 && pcCount <= 8) {
    // Check if it matches major/minor scales
    const isMajor = MAJOR_SCALE_PCS.every(pc => profile.pitchClasses.includes(pc));
    if (isMajor) {
      matches.push({
        culture: 'western',
        confidence: 0.8,
        reasons: ['Matches major scale pitch class set'],
      });
    }
    // Also check Carnatic ragas with 7 swaras
    const ragaMatches = matchRagas(profile);
    if (ragaMatches.length > 0) {
      matches.push({
        culture: 'carnatic',
        confidence: Math.max(...ragaMatches.map(r => r.confidence)),
        reasons: [`Matches raga(s): ${ragaMatches.map(r => r.raga).join(', ')}`],
      });
    }
  }

  // Fallback: Western
  if (matches.length === 0) {
    matches.push({
      culture: 'western',
      confidence: 0.4,
      reasons: ['Default Western classification'],
    });
  }

  return matches.sort((a, b) => b.confidence - a.confidence);
}

// ============================================================================
// RAGA MATCHING
// ============================================================================

/**
 * Match a profile against known ragas.
 */
export function matchRagas(profile: SelectionProfile): RagaMatch[] {
  const matches: RagaMatch[] = [];
  const pcs = profile.pitchClasses;

  for (const [raga, ragaPcs] of Object.entries(RAGA_PCS) as [RagaName, readonly number[]][]) {
    // Try all possible transpositions (Sa could be any pitch class)
    for (let transpose = 0; transpose < 12; transpose++) {
      const transposedPcs = pcs.map(pc => (pc - transpose + 12) % 12);
      const matched = transposedPcs.filter(pc => ragaPcs.includes(pc));
      const confidence = transposedPcs.length > 0 ? matched.length / transposedPcs.length : 0;
      if (confidence > 0.6) {
        matches.push({ raga, confidence, matchedPCs: matched });
      }
    }
  }

  // Keep only the best match per raga
  const bestPerRaga = new Map<RagaName, RagaMatch>();
  for (const m of matches) {
    const existing = bestPerRaga.get(m.raga);
    if (!existing || m.confidence > existing.confidence) {
      bestPerRaga.set(m.raga, m);
    }
  }

  return [...bestPerRaga.values()].sort((a, b) => b.confidence - a.confidence);
}

// ============================================================================
// CHINESE MODE MATCHING
// ============================================================================

/**
 * Match a profile against Chinese pentatonic modes.
 */
export function matchChineseModes(profile: SelectionProfile): ChineseModeMatch[] {
  const matches: ChineseModeMatch[] = [];
  const pcs = profile.pitchClasses;

  for (const [mode, modePcs] of Object.entries(CHINESE_MODE_PCS) as [ChineseModeName, readonly number[]][]) {
    for (let transpose = 0; transpose < 12; transpose++) {
      const transposedPcs = pcs.map(pc => (pc - transpose + 12) % 12);
      const matched = transposedPcs.filter(pc => modePcs.includes(pc));
      const confidence = transposedPcs.length > 0 ? matched.length / transposedPcs.length : 0;
      if (confidence > 0.6) {
        matches.push({ mode, confidence, matchedPCs: matched });
      }
    }
  }

  const bestPerMode = new Map<ChineseModeName, ChineseModeMatch>();
  for (const m of matches) {
    const existing = bestPerMode.get(m.mode);
    if (!existing || m.confidence > existing.confidence) {
      bestPerMode.set(m.mode, m);
    }
  }

  return [...bestPerMode.values()].sort((a, b) => b.confidence - a.confidence);
}

// ============================================================================
// FULL ANALYSIS PIPELINE
// ============================================================================

/**
 * C882: Complete analysis pipeline.
 * selection → extract events/chords → build profile → query KB → return results.
 */
export function analyzeSelection(
  events: readonly NoteEvent[],
  _currentSpec?: MusicSpec  // Available for future context-aware analysis
): SelectionAnalysis {
  const profile = extractProfile(events);

  return {
    profile,
    cultureMatches: matchCultures(profile),
    ragaMatches: matchRagas(profile),
    chineseModeMatches: matchChineseModes(profile),
    schemaMatches: [], // Schema matching requires chord/degree sequences, not raw notes
    suggestedKey: null, // Key detection requires the Prolog tonality models
  };
}
