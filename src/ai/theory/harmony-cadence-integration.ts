/**
 * @fileoverview Harmony and Cadence Integration Types for Branch C
 * 
 * Provides types for:
 * - Harmony explorer pivot chord integration (C249)
 * - Cadence markers in tracker (C254)
 * - Cadence-triggered fills in arranger (C255)
 * 
 * Uses canonical CadenceType from music-spec.ts to ensure consistency.
 * 
 * @module @cardplay/ai/theory/harmony-cadence-integration
 */

import type { RootName, ChordQuality, CadenceType } from './music-spec';

// Re-export CadenceType for consumers of this module
export type { CadenceType } from './music-spec';

// ============================================================================
// C249: HARMONY EXPLORER PIVOT CHORD INTEGRATION
// ============================================================================

/**
 * A pivot chord for modulation planning.
 */
export interface PivotChord {
  /** Chord root */
  readonly root: RootName;
  
  /** Chord quality */
  readonly quality: ChordQuality;
  
  /** Function in source key (e.g., 'IV', 'ii') */
  readonly functionInSource: string;
  
  /** Function in target key (e.g., 'I', 'vi') */
  readonly functionInTarget: string;
  
  /** Score (0-100) indicating how good this pivot is */
  readonly score: number;
  
  /** Reasons why this is a good pivot */
  readonly reasons: readonly string[];
}

/**
 * Modulation plan with pivot chords.
 */
export interface ModulationPlan {
  /** Source key root */
  readonly sourceKey: RootName;
  
  /** Source key mode */
  readonly sourceMode: 'major' | 'minor';
  
  /** Target key root */
  readonly targetKey: RootName;
  
  /** Target key mode */
  readonly targetMode: 'major' | 'minor';
  
  /** Available pivot chords, ranked by score */
  readonly pivotChords: readonly PivotChord[];
  
  /** Relationship type (e.g., 'relative', 'parallel', 'chromatic') */
  readonly relationship: string;
  
  /** Spiral distance between keys */
  readonly spiralDistance: number;
}

/**
 * Props for the harmony explorer modulation panel.
 */
export interface ModulationPlannerProps {
  /** Current modulation plan */
  readonly plan: ModulationPlan | null;
  
  /** Callback when source key changes */
  readonly onSourceKeyChange: (root: RootName, mode: 'major' | 'minor') => void;
  
  /** Callback when target key changes */
  readonly onTargetKeyChange: (root: RootName, mode: 'major' | 'minor') => void;
  
  /** Callback when a pivot chord is selected */
  readonly onPivotSelect: (pivot: PivotChord) => void;
  
  /** Callback to apply the modulation */
  readonly onApplyModulation: () => void;
  
  /** Whether to show spiral visualization */
  readonly showSpiralViz?: boolean;
}

/**
 * State for the modulation planner.
 */
export interface ModulationPlannerState {
  /** Source key root */
  readonly sourceRoot: RootName;
  
  /** Source key mode */
  readonly sourceMode: 'major' | 'minor';
  
  /** Target key root */
  readonly targetRoot: RootName;
  
  /** Target key mode */
  readonly targetMode: 'major' | 'minor';
  
  /** Selected pivot chord */
  readonly selectedPivot: PivotChord | null;
  
  /** Whether the planner is calculating */
  readonly calculating: boolean;
}

/**
 * Create initial state for modulation planner.
 */
export function createModulationPlannerState(
  sourceRoot: RootName = 'c',
  sourceMode: 'major' | 'minor' = 'major'
): ModulationPlannerState {
  return {
    sourceRoot,
    sourceMode,
    targetRoot: 'g',
    targetMode: 'major',
    selectedPivot: null,
    calculating: false,
  };
}

/**
 * Generate a mock modulation plan (in practice, this would query Prolog).
 */
export function generateModulationPlan(
  sourceRoot: RootName,
  sourceMode: 'major' | 'minor',
  targetRoot: RootName,
  targetMode: 'major' | 'minor'
): ModulationPlan {
  // Common pivot chords for major to relative major modulations
  const pivotChords: PivotChord[] = [
    {
      root: 'g',
      quality: 'major',
      functionInSource: 'V',
      functionInTarget: 'I',
      score: 95,
      reasons: ['Dominant in source becomes tonic in target', 'Very smooth resolution'],
    },
    {
      root: 'd',
      quality: 'minor',
      functionInSource: 'ii',
      functionInTarget: 'vi',
      score: 85,
      reasons: ['Common chord', 'Smooth voice leading'],
    },
    {
      root: 'a',
      quality: 'minor',
      functionInSource: 'vi',
      functionInTarget: 'ii',
      score: 80,
      reasons: ['Common chord', 'Prepares new dominant'],
    },
  ];
  
  return {
    sourceKey: sourceRoot,
    sourceMode,
    targetKey: targetRoot,
    targetMode,
    pivotChords,
    relationship: sourceRoot === targetRoot ? 'parallel' : 'related',
    spiralDistance: 1.5, // Placeholder
  };
}

// ============================================================================
// C254: TRACKER CADENCE MARKERS
// ============================================================================

// CadenceType is imported from music-spec.ts for consistency.
// This module uses the canonical cadence type vocabulary:
//   'perfect_authentic' | 'imperfect_authentic' | 'half'
//   | 'plagal' | 'deceptive' | 'authentic'
// Note: 'phrygian_half' and 'evaded' from music-spec are also valid.

/**
 * A cadence detected in the music.
 */
export interface DetectedCadence {
  /** Position in ticks where cadence occurs */
  readonly tickPosition: number;
  
  /** Type of cadence */
  readonly type: CadenceType;
  
  /** Confidence (0-100) */
  readonly confidence: number;
  
  /** Chord progression leading to cadence */
  readonly chords: readonly string[];
  
  /** Whether this is at a phrase boundary */
  readonly atPhraseBoundary: boolean;
  
  /** Cadence strength (for ranking) */
  readonly strength: number;
}

/**
 * Visual marker for a cadence in the tracker.
 */
export interface CadenceMarker {
  /** Position in ticks */
  readonly tickPosition: number;
  
  /** Row in tracker */
  readonly row: number;
  
  /** Cadence type for display */
  readonly type: CadenceType;
  
  /** Display label (e.g., 'PAC', 'HC') */
  readonly label: string;
  
  /** Color (CSS) */
  readonly color: string;
  
  /** Icon or symbol */
  readonly icon: string;
  
  /** Tooltip text */
  readonly tooltip: string;
}

/**
 * Convert detected cadence to a visual marker.
 */
export function cadenceToMarker(
  cadence: DetectedCadence,
  ticksPerRow: number
): CadenceMarker {
  // Use Partial since not all CadenceType values may be used in UI
  const labels: Partial<Record<CadenceType, string>> = {
    'authentic': 'AC',
    'perfect_authentic': 'PAC',
    'imperfect_authentic': 'IAC',
    'half': 'HC',
    'plagal': 'PC',
    'deceptive': 'DC',
  };
  
  const colors: Partial<Record<CadenceType, string>> = {
    'authentic': '#10B981',
    'perfect_authentic': '#10B981', // Green - strong
    'imperfect_authentic': '#3B82F6', // Blue
    'half': '#F59E0B', // Yellow - tension
    'plagal': '#8B5CF6', // Purple
    'deceptive': '#EF4444', // Red - surprise
  };
  
  const icons: Partial<Record<CadenceType, string>> = {
    'authentic': '🎵',
    'perfect_authentic': '🎵',
    'imperfect_authentic': '🎶',
    'half': '⏸️',
    'plagal': '✨',
    'deceptive': '❗',
  };
  
  return {
    tickPosition: cadence.tickPosition,
    row: Math.floor(cadence.tickPosition / ticksPerRow),
    type: cadence.type,
    label: labels[cadence.type] ?? cadence.type.toUpperCase(),
    color: colors[cadence.type] ?? '#9CA3AF',
    icon: icons[cadence.type] ?? '🎼',
    tooltip: `${labels[cadence.type] ?? cadence.type}: ${cadence.chords.join(' → ')} (${cadence.confidence}% confidence)`,
  };
}

/**
 * Props for the cadence marker overlay in tracker.
 */
export interface CadenceMarkerOverlayProps {
  /** Detected cadences */
  readonly cadences: readonly DetectedCadence[];
  
  /** Ticks per row for positioning */
  readonly ticksPerRow: number;
  
  /** Whether to show labels */
  readonly showLabels?: boolean;
  
  /** Whether to show icons */
  readonly showIcons?: boolean;
  
  /** Callback when a cadence marker is clicked */
  readonly onCadenceClick?: (cadence: DetectedCadence) => void;
  
  /** Minimum confidence to show (0-100) */
  readonly minConfidence?: number;
}

// ============================================================================
// C255: ARRANGER CADENCE-TRIGGERED FILLS
// ============================================================================

/**
 * Fill pattern types.
 */
export type FillPatternType =
  | 'drum_fill'
  | 'bass_fill'
  | 'lead_fill'
  | 'transition'
  | 'sustain'
  | 'silence';

/**
 * A fill triggered by a cadence.
 */
export interface CadenceTriggeredFill {
  /** Cadence that triggered this fill */
  readonly cadence: DetectedCadence;
  
  /** Type of fill to apply */
  readonly fillType: FillPatternType;
  
  /** Duration of fill in ticks */
  readonly durationTicks: number;
  
  /** Intensity (0-1) */
  readonly intensity: number;
  
  /** Whether fill is before or after cadence */
  readonly position: 'before' | 'after';
  
  /** Pattern ID to use (from pattern library) */
  readonly patternId?: string;
}

/**
 * Rules for triggering fills from cadences.
 */
export interface FillTriggerRules {
  /** Fill before perfect authentic cadences */
  readonly perfectAuthentic: {
    readonly enabled: boolean;
    readonly fillType: FillPatternType;
    readonly intensity: number;
  };
  
  /** Fill at half cadences (tension point) */
  readonly halfCadence: {
    readonly enabled: boolean;
    readonly fillType: FillPatternType;
    readonly intensity: number;
  };
  
  /** Fill at deceptive cadences (surprise) */
  readonly deceptive: {
    readonly enabled: boolean;
    readonly fillType: FillPatternType;
    readonly intensity: number;
  };
  
  /** Minimum cadence confidence to trigger fill */
  readonly minConfidence: number;
  
  /** Only trigger at phrase boundaries */
  readonly onlyAtPhraseBoundaries: boolean;
}

/**
 * Default fill trigger rules.
 */
export const DEFAULT_FILL_TRIGGER_RULES: FillTriggerRules = {
  perfectAuthentic: {
    enabled: true,
    fillType: 'drum_fill',
    intensity: 0.8,
  },
  halfCadence: {
    enabled: true,
    fillType: 'sustain',
    intensity: 0.5,
  },
  deceptive: {
    enabled: true,
    fillType: 'transition',
    intensity: 0.7,
  },
  minConfidence: 70,
  onlyAtPhraseBoundaries: true,
};

/**
 * Generate fills from detected cadences using rules.
 */
export function generateCadenceFills(
  cadences: readonly DetectedCadence[],
  rules: FillTriggerRules,
  ticksPerBeat: number
): readonly CadenceTriggeredFill[] {
  const fills: CadenceTriggeredFill[] = [];
  
  for (const cadence of cadences) {
    // Skip if below confidence threshold
    if (cadence.confidence < rules.minConfidence) continue;
    
    // Skip if not at phrase boundary (if required)
    if (rules.onlyAtPhraseBoundaries && !cadence.atPhraseBoundary) continue;
    
    // Determine fill based on cadence type
    let rule: { enabled: boolean; fillType: FillPatternType; intensity: number } | null = null;
    
    switch (cadence.type) {
      case 'perfect_authentic':
      case 'imperfect_authentic':
        rule = rules.perfectAuthentic;
        break;
      case 'half':
        rule = rules.halfCadence;
        break;
      case 'deceptive':
        rule = rules.deceptive;
        break;
    }
    
    if (rule && rule.enabled) {
      fills.push({
        cadence,
        fillType: rule.fillType,
        durationTicks: ticksPerBeat * 2, // Half bar fill
        intensity: rule.intensity,
        position: 'before',
      });
    }
  }
  
  return fills;
}

/**
 * Props for the fill generator panel in arranger.
 */
export interface FillGeneratorProps {
  /** Current fill trigger rules */
  readonly rules: FillTriggerRules;
  
  /** Callback when rules change */
  readonly onRulesChange: (rules: FillTriggerRules) => void;
  
  /** Generated fills */
  readonly fills: readonly CadenceTriggeredFill[];
  
  /** Callback to apply fills to arrangement */
  readonly onApplyFills: (fills: readonly CadenceTriggeredFill[]) => void;
  
  /** Callback to preview a fill */
  readonly onPreviewFill?: (fill: CadenceTriggeredFill) => void;
}
