/**
 * @fileoverview GTTM Integration Types for Branch C
 * 
 * Provides types for integrating GTTM (Generative Theory of Tonal Music)
 * with tracker, phrase generator, and arranger components:
 * - GTTM segmentation boundaries (C194)
 * - GTTM skeleton for motif creation (C195)
 * - GTTM heads for harmonic rhythm (C196)
 * - Phrase boundary markers (C197)
 * - Accent heatmap (C198)
 * 
 * @module @cardplay/ai/theory/gttm-integration
 */

import type { MusicSpec } from './music-spec';

// ============================================================================
// GTTM GROUPING STRUCTURE
// ============================================================================

/**
 * A grouping boundary in the music.
 */
export interface GroupingBoundary {
  /** Position in ticks */
  readonly tickPosition: number;
  
  /** Strength of the boundary (1 = strongest, 4 = weakest) */
  readonly strength: 1 | 2 | 3 | 4;
  
  /** Type of boundary */
  readonly type: 'phrase' | 'subphrase' | 'section' | 'movement';
  
  /** Whether this boundary is at a cadence */
  readonly atCadence: boolean;
}

/**
 * A grouping span in the music.
 */
export interface GroupingSpan {
  /** Start position in ticks */
  readonly startTicks: number;
  
  /** End position in ticks */
  readonly endTicks: number;
  
  /** Hierarchical level (0 = lowest, e.g., motif) */
  readonly level: number;
  
  /** Label for this grouping */
  readonly label?: string;
  
  /** Child groupings */
  readonly children: readonly GroupingSpan[];
}

// ============================================================================
// GTTM METRICAL STRUCTURE
// ============================================================================

/**
 * A metrical position with accent strength.
 */
export interface MetricalAccent {
  /** Position in ticks */
  readonly tickPosition: number;
  
  /** Accent strength (0-1, 1 = strongest) */
  readonly strength: number;
  
  /** Whether this is a metric head */
  readonly isHead: boolean;
  
  /** Level in metrical hierarchy (0 = lowest) */
  readonly level: number;
}

/**
 * Metrical grid for a span of music.
 */
export interface MetricalGrid {
  /** Start position in ticks */
  readonly startTicks: number;
  
  /** End position in ticks */
  readonly endTicks: number;
  
  /** Grid resolution in ticks */
  readonly resolutionTicks: number;
  
  /** Accents at each grid point */
  readonly accents: readonly MetricalAccent[];
}

// ============================================================================
// C194: TRACKER PHRASE SELECT INTEGRATION
// ============================================================================

/**
 * Phrase selection suggestion based on GTTM boundaries.
 */
export interface PhraseSelectSuggestion {
  /** Suggested selection start (ticks) */
  readonly startTicks: number;
  
  /** Suggested selection end (ticks) */
  readonly endTicks: number;
  
  /** Grouping level this represents */
  readonly groupingLevel: number;
  
  /** Confidence in this suggestion (0-100) */
  readonly confidence: number;
  
  /** Explanation */
  readonly reason: string;
}

/**
 * Get phrase selection suggestions from GTTM boundaries.
 * 
 * @param boundaries - GTTM grouping boundaries
 * @param cursorTicks - Current cursor position
 * @returns Sorted suggestions (best first)
 */
export function getPhraseSelectSuggestions(
  boundaries: readonly GroupingBoundary[],
  cursorTicks: number
): readonly PhraseSelectSuggestion[] {
  // Find the two boundaries that surround the cursor
  const before = boundaries
    .filter(b => b.tickPosition <= cursorTicks)
    .sort((a, b) => b.tickPosition - a.tickPosition);
  
  const after = boundaries
    .filter(b => b.tickPosition > cursorTicks)
    .sort((a, b) => a.tickPosition - b.tickPosition);
  
  const suggestions: PhraseSelectSuggestion[] = [];
  
  // Closest phrase boundary pair
  if (before.length > 0 && after.length > 0) {
    const start = before[0].tickPosition;
    const end = after[0].tickPosition;
    const strength = Math.min(before[0].strength, after[0].strength);
    
    suggestions.push({
      startTicks: start,
      endTicks: end,
      groupingLevel: strength,
      confidence: 100 - (strength - 1) * 20,
      reason: `Phrase from ${before[0].type} to ${after[0].type} boundary`,
    });
  }
  
  // Wider groupings
  for (let i = 1; i < Math.min(before.length, after.length); i++) {
    const startEvent = before[i];
    const endEvent = after[i];
    if (!startEvent || !endEvent) continue;
    
    suggestions.push({
      startTicks: startEvent.tickPosition,
      endTicks: endEvent.tickPosition,
      groupingLevel: i + 1,
      confidence: 80 - i * 15,
      reason: `Larger grouping at level ${i + 1}`,
    });
  }
  
  return suggestions;
}

// ============================================================================
// C195: PHRASE GENERATOR GTTM SKELETON
// ============================================================================

/**
 * GTTM skeleton for guiding motif creation.
 */
export interface GTTMSkeleton {
  /** Structural notes (time-span heads) */
  readonly heads: readonly SkeletonNote[];
  
  /** Metric pattern for filling in */
  readonly metricPattern: readonly number[];
  
  /** Preferred phrase length in beats */
  readonly phraseLengthBeats: number;
  
  /** Grouping structure */
  readonly grouping: GroupingSpan;
}

/**
 * A structural note in the GTTM skeleton.
 */
export interface SkeletonNote {
  /** Position in ticks */
  readonly tickPosition: number;
  
  /** Pitch (MIDI number) */
  readonly pitch: number;
  
  /** Structural importance (1 = highest) */
  readonly importance: number;
  
  /** Whether this is a harmonic tone */
  readonly harmonic: boolean;
}

/**
 * Parameters for phrase generation guided by GTTM.
 */
export interface GTTMGuidedPhraseParams {
  /** Skeleton to elaborate */
  readonly skeleton: GTTMSkeleton;
  
  /** Key root as pitch class */
  readonly keyRoot: number;
  
  /** Scale intervals */
  readonly scaleIntervals: readonly number[];
  
  /** Target density (notes per beat) */
  readonly density: number;
  
  /** Allow non-chord tones */
  readonly allowNonChordTones: boolean;
  
  /** Preferred ornaments */
  readonly ornaments: readonly string[];
}

/**
 * Create a simple GTTM skeleton from head pitches.
 */
export function createSimpleSkeleton(
  headPitches: readonly number[],
  ticksPerBeat: number,
  beatsPerHead: number = 2
): GTTMSkeleton {
  const heads: SkeletonNote[] = headPitches.map((pitch, i) => ({
    tickPosition: i * beatsPerHead * ticksPerBeat,
    pitch,
    importance: i === 0 ? 1 : 2,
    harmonic: true,
  }));
  
  return {
    heads,
    metricPattern: [1, 0.5, 0.75, 0.5], // Standard 4/4 pattern
    phraseLengthBeats: headPitches.length * beatsPerHead,
    grouping: {
      startTicks: 0,
      endTicks: headPitches.length * beatsPerHead * ticksPerBeat,
      level: 0,
      children: [],
    },
  };
}

// ============================================================================
// C196: ARRANGER GTTM HEADS
// ============================================================================

/**
 * Harmonic rhythm suggestion based on GTTM heads.
 */
export interface HarmonicRhythmSuggestion {
  /** Position in ticks */
  readonly tickPosition: number;
  
  /** Whether a chord change is recommended here */
  readonly chordChange: boolean;
  
  /** Strength of recommendation (0-1) */
  readonly strength: number;
  
  /** Reason for this suggestion */
  readonly reason: string;
}

/**
 * Get harmonic rhythm suggestions from GTTM metrical structure.
 * 
 * @param grid - Metrical grid
 * @param harmonicRhythmPerBar - Desired chord changes per bar
 * @returns Harmonic rhythm suggestions
 */
export function getHarmonicRhythmSuggestions(
  grid: MetricalGrid,
  harmonicRhythmPerBar: number
): readonly HarmonicRhythmSuggestion[] {
  // Find the heads (strongest accents)
  const heads = grid.accents.filter(a => a.isHead);
  
  // Space chord changes based on harmonic rhythm
  const suggestions: HarmonicRhythmSuggestion[] = [];
  
  for (let i = 0; i < heads.length; i += Math.ceil(heads.length / harmonicRhythmPerBar)) {
    const head = heads[i];
    if (!head) continue;
    suggestions.push({
      tickPosition: head.tickPosition,
      chordChange: true,
      strength: head.strength,
      reason: `Metrical head at level ${head.level}`,
    });
  }
  
  return suggestions;
}

// ============================================================================
// C197: PHRASE BOUNDARY MARKERS UX
// ============================================================================

/**
 * Visual marker for a phrase boundary in the tracker.
 */
export interface PhraseBoundaryMarker {
  /** Position in ticks */
  readonly tickPosition: number;
  
  /** Display row in tracker */
  readonly row: number;
  
  /** Visual style */
  readonly style: 'solid' | 'dashed' | 'dotted';
  
  /** Color (CSS) */
  readonly color: string;
  
  /** Opacity (0-1) */
  readonly opacity: number;
  
  /** Label to show on hover */
  readonly label: string;
  
  /** Grouping level (for nesting) */
  readonly level: number;
}

/**
 * Convert GTTM boundaries to visual markers.
 * 
 * @param boundaries - GTTM boundaries
 * @param ticksPerRow - Ticks per tracker row
 * @returns Visual markers
 */
export function boundariesToMarkers(
  boundaries: readonly GroupingBoundary[],
  ticksPerRow: number
): readonly PhraseBoundaryMarker[] {
  const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'];
  const styles: Array<'solid' | 'dashed' | 'dotted'> = ['solid', 'dashed', 'dotted', 'dotted'];
  
  return boundaries.map(b => ({
    tickPosition: b.tickPosition,
    row: Math.floor(b.tickPosition / ticksPerRow),
    style: styles[b.strength - 1] ?? 'dotted',
    color: colors[b.strength - 1] ?? '#6B7280',
    opacity: 1 - (b.strength - 1) * 0.2,
    label: `${b.type} boundary (strength ${b.strength})`,
    level: b.strength,
  }));
}

// ============================================================================
// C198: ACCENT HEATMAP OVERLAY
// ============================================================================

/**
 * A cell in the accent heatmap.
 */
export interface AccentHeatmapCell {
  /** Row in tracker */
  readonly row: number;
  
  /** Column in tracker (if applicable) */
  readonly column?: number;
  
  /** Accent strength (0-1) */
  readonly strength: number;
  
  /** Color (CSS) */
  readonly color: string;
}

/**
 * Accent heatmap overlay for tracker.
 */
export interface AccentHeatmap {
  /** All cells in the heatmap */
  readonly cells: readonly AccentHeatmapCell[];
  
  /** Color scale (low to high strength) */
  readonly colorScale: readonly string[];
  
  /** Legend labels */
  readonly legend: readonly { strength: number; label: string }[];
}

/**
 * Generate accent heatmap from metrical grid.
 * 
 * @param grid - Metrical grid
 * @param ticksPerRow - Ticks per tracker row
 * @returns Accent heatmap
 */
export function generateAccentHeatmap(
  grid: MetricalGrid,
  ticksPerRow: number
): AccentHeatmap {
  const colorScale = [
    'rgba(139, 92, 246, 0.1)',  // Level 0 (weak)
    'rgba(139, 92, 246, 0.3)',  // Level 1
    'rgba(139, 92, 246, 0.5)',  // Level 2
    'rgba(139, 92, 246, 0.7)',  // Level 3
    'rgba(139, 92, 246, 0.9)',  // Level 4 (strong)
  ];
  
  const cells: AccentHeatmapCell[] = grid.accents.map(accent => {
    const colorIndex = Math.min(Math.floor(accent.strength * (colorScale.length - 1)), colorScale.length - 1);
    return {
      row: Math.floor(accent.tickPosition / ticksPerRow),
      strength: accent.strength,
      color: colorScale[colorIndex] ?? 'rgba(99, 102, 241, 0.3)',
    };
  });
  
  return {
    cells,
    colorScale,
    legend: [
      { strength: 0, label: 'Weak' },
      { strength: 0.5, label: 'Medium' },
      { strength: 1, label: 'Strong' },
    ],
  };
}

// ============================================================================
// C199: SPIRAL TENSION OVERLAY
// ============================================================================

/**
 * Spiral tension value for a chord.
 */
export interface SpiralTensionValue {
  /** Position in ticks */
  readonly tickPosition: number;
  
  /** Chord pitch classes */
  readonly chordPitchClasses: readonly number[];
  
  /** Distance from key center in spiral space */
  readonly tension: number;
  
  /** Normalized tension (0-1) */
  readonly normalizedTension: number;
  
  /** Direction of tension (towards/away from tonic) */
  readonly direction: 'towards' | 'away' | 'stable';
}

/**
 * Spiral tension overlay for harmony explorer.
 */
export interface SpiralTensionOverlay {
  /** Tension values for each chord */
  readonly values: readonly SpiralTensionValue[];
  
  /** Max tension in the sequence */
  readonly maxTension: number;
  
  /** Average tension */
  readonly avgTension: number;
  
  /** Tension arc description */
  readonly arc: string;
}

// ============================================================================
// C200: DFT PHASE COMPASS UI
// ============================================================================

/**
 * DFT phase compass state.
 */
export interface DFTPhaseCompass {
  /** Phase angle (radians, -π to π) */
  readonly phase: number;
  
  /** Magnitude (strength of tonality) */
  readonly magnitude: number;
  
  /** Estimated pitch class (0-11) */
  readonly estimatedPC: number;
  
  /** Estimated mode (if detectable) */
  readonly estimatedMode?: 'major' | 'minor' | 'modal' | 'ambiguous';
  
  /** Ambiguity level (0 = clear, 1 = ambiguous) */
  readonly ambiguity: number;
  
  /** Secondary pitch class (if ambiguous) */
  readonly secondaryPC?: number;
}

/**
 * Props for the DFTPhaseCompass UI component.
 */
export interface DFTPhaseCompassProps {
  /** Current compass state */
  readonly compass: DFTPhaseCompass;
  
  /** Show raw phase/magnitude values */
  readonly showRaw?: boolean;
  
  /** Size in pixels */
  readonly size?: number;
  
  /** Callback when user adjusts target */
  readonly onTargetChange?: (pc: number) => void;
}

/**
 * Compute DFT phase compass from a pitch-class profile.
 * 
 * @param profile - 12-element pitch-class profile
 * @returns DFT phase compass state
 */
export function computeDFTPhaseCompass(profile: readonly number[]): DFTPhaseCompass {
  if (profile.length !== 12) {
    throw new Error('Profile must have 12 elements');
  }
  
  // Compute DFT at k=1 (circle of fifths)
  let real = 0;
  let imag = 0;
  const factor = (2 * Math.PI) / 12;
  
  for (let i = 0; i < 12; i++) {
    const value = profile[i];
    if (value === undefined) continue;
    real += value * Math.cos(factor * i);
    imag -= value * Math.sin(factor * i);
  }
  
  const phase = Math.atan2(imag, real);
  const magnitude = Math.sqrt(real * real + imag * imag);
  
  // Normalize magnitude (max possible is sum of profile)
  const maxMag = profile.reduce((a, b) => a + b, 0);
  const normalizedMag = maxMag > 0 ? magnitude / maxMag : 0;
  
  // Estimate pitch class from phase
  const estimatedPC = Math.round(((phase * 12) / (2 * Math.PI) + 12) % 12);
  
  // Ambiguity based on magnitude (low magnitude = ambiguous)
  const ambiguity = 1 - normalizedMag;
  
  // Estimate mode (simplified)
  let estimatedMode: 'major' | 'minor' | 'modal' | 'ambiguous' | undefined;
  if (ambiguity > 0.5) {
    estimatedMode = 'ambiguous';
  } else {
    // Would need k=2 for major/minor detection
    estimatedMode = 'ambiguous';
  }
  
  return {
    phase,
    magnitude,
    estimatedPC,
    estimatedMode,
    ambiguity,
  };
}

// ============================================================================
// INTEGRATION WITH MUSICSPEC
// ============================================================================

/**
 * Get GTTM parameters from MusicSpec.
 */
export interface GTTMIntegrationParams {
  /** Grouping constraint level */
  readonly groupingLevel: 'phrase' | 'subphrase' | 'motif';
  
  /** Metrical accent model */
  readonly accentModel: string;
  
  /** Whether to show GTTM overlays */
  readonly showOverlays: boolean;
  
  /** Overlay types to show */
  readonly overlayTypes: readonly ('boundaries' | 'accents' | 'heads')[];
}

/**
 * Extract GTTM integration params from MusicSpec.
 */
export function gttmIntegrationParamsFromSpec(_spec: MusicSpec): GTTMIntegrationParams {
  // Default settings
  return {
    groupingLevel: 'phrase',
    accentModel: 'standard',
    showOverlays: true,
    overlayTypes: ['boundaries', 'accents'],
  };
}
