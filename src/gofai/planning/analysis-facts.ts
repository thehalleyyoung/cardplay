/**
 * @fileoverview Analysis Facts Interface for GOFAI Planning
 * 
 * Step 269 [Type] — Define an interface for "analysis facts" computed from
 * project state (key estimate, chord map, density metrics).
 * 
 * This module defines the interface and implementation for extracting and
 * maintaining analysis facts from CardPlay project state. These facts are used
 * by theory-driven levers and other planning components to make informed decisions.
 * 
 * Analysis facts include:
 * - Key and mode estimation
 * - Chord progression analysis
 * - Density and texture metrics
 * - Rhythmic characteristics
 * - Timbral profiles
 * - Structural segmentation
 * - Voice leading patterns
 * - Harmonic rhythm
 * - Melodic contours
 * - Orchestration balance
 * 
 * @module @cardplay/gofai/planning/analysis-facts
 */

import type { ChordSymbol, ScaleDegree, KeySignature } from '../../ai/theory/music-spec';
import type { Event, EventKind } from '../../cardplay/event';
import type { ProjectState } from '../../cardplay/state/project-state';
import type { SectionMarker } from '../../cardplay/state/markers';

// ============================================================================
// CORE ANALYSIS FACT TYPES
// ============================================================================

/**
 * Complete set of analysis facts for a project scope
 */
export interface AnalysisFacts {
  readonly version: string;
  readonly scope: AnalysisScope;
  readonly timestamp: number;
  readonly tonal: TonalAnalysisFacts;
  readonly rhythmic: RhythmicAnalysisFacts;
  readonly textural: TexturalAnalysisFacts;
  readonly structural: StructuralAnalysisFacts;
  readonly timbral: TimbralAnalysisFacts;
  readonly melodic: MelodicAnalysisFacts;
  readonly harmonic: HarmonicAnalysisFacts;
  readonly orchestration: OrchestrationAnalysisFacts;
  readonly metadata: AnalysisMetadata;
}

/**
 * Scope of analysis
 */
export interface AnalysisScope {
  readonly type: 'project' | 'section' | 'range' | 'selection';
  readonly startTick?: number;
  readonly endTick?: number;
  readonly sectionIds?: readonly string[];
  readonly trackIds?: readonly string[];
  readonly layerRoles?: readonly string[];
}

/**
 * Metadata about analysis computation
 */
export interface AnalysisMetadata {
  readonly computationTimeMs: number;
  readonly confidence: number;
  readonly sources: readonly string[];
  readonly assumptions: readonly string[];
  readonly warnings: readonly string[];
}

// ============================================================================
// TONAL ANALYSIS FACTS
// ============================================================================

/**
 * Facts about tonality and harmony
 */
export interface TonalAnalysisFacts {
  readonly keyEstimate: KeyEstimate;
  readonly chordProgression: ChordProgression;
  readonly modalCharacter: ModalCharacter;
  readonly modulations: readonly ModulationFact[];
  readonly cadences: readonly CadenceFact[];
  readonly tonicStrength: number;
  readonly chromaticismLevel: number;
}

/**
 * Estimated key with confidence
 */
export interface KeyEstimate {
  readonly key: KeySignature;
  readonly confidence: number;
  readonly alternativeKeys: readonly { key: KeySignature; confidence: number }[];
  readonly method: 'krumhansl_schmuckler' | 'profile_correlation' | 'prolog_inference' | 'user_specified';
  readonly evidence: readonly string[];
}

/**
 * Analyzed chord progression
 */
export interface ChordProgression {
  readonly chords: readonly AnalyzedChordFact[];
  readonly functionalSequence: readonly FunctionalSegmentFact[];
  readonly unusualProgressions: readonly ProgressionAnomaly[];
  readonly averageHarmonicRhythm: number;
}

/**
 * Analyzed chord with rich context
 */
export interface AnalyzedChordFact {
  readonly symbol: ChordSymbol;
  readonly onset: number;
  readonly duration: number;
  readonly scaleDegree: ScaleDegree;
  readonly function: 'tonic' | 'subdominant' | 'dominant' | 'pre_dominant' | 'auxiliary' | 'passing' | 'neighbor';
  readonly tension: number;
  readonly dissonance: number;
  readonly stability: number;
  readonly voiceLeadingQuality: number;
  readonly extensionLevel: 'triad' | 'seventh' | 'ninth' | 'eleventh' | 'thirteenth';
  readonly alterations: readonly string[];
  readonly inversion: number;
  readonly bassNote: number;
}

/**
 * Functional harmonic segment
 */
export interface FunctionalSegmentFact {
  readonly function: string;
  readonly startOnset: number;
  readonly endOnset: number;
  readonly chordIndices: readonly number[];
  readonly strength: number;
}

/**
 * Unusual progression
 */
export interface ProgressionAnomaly {
  readonly fromChord: ChordSymbol;
  readonly toChord: ChordSymbol;
  readonly onset: number;
  readonly anomalyType: 'unexpected_resolution' | 'weak_progression' | 'distant_relation' | 'parallel_motion';
  readonly severity: number;
  readonly explanation: string;
}

/**
 * Modal character analysis
 */
export interface ModalCharacter {
  readonly primaryMode: 'major' | 'minor' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'aeolian' | 'locrian' | 'ambiguous';
  readonly modalMixture: readonly { mode: string; strength: number }[];
  readonly characteristicDegrees: readonly ScaleDegree[];
  readonly brightness: number;
}

/**
 * Modulation fact
 */
export interface ModulationFact {
  readonly fromKey: KeySignature;
  readonly toKey: KeySignature;
  readonly onset: number;
  readonly duration: number;
  readonly type: 'direct' | 'pivot' | 'chromatic' | 'sequential' | 'modal';
  readonly pivotChord?: ChordSymbol;
  readonly smoothness: number;
}

/**
 * Cadence fact
 */
export interface CadenceFact {
  readonly type: 'authentic' | 'plagal' | 'deceptive' | 'half' | 'phrygian' | 'imperfect';
  readonly onset: number;
  readonly chords: readonly ChordSymbol[];
  readonly strength: number;
  readonly preparation: number;
  readonly section?: string;
}

// ============================================================================
// RHYTHMIC ANALYSIS FACTS
// ============================================================================

/**
 * Facts about rhythm and meter
 */
export interface RhythmicAnalysisFacts {
  readonly tempo: TempoFact;
  readonly meter: MeterFact;
  readonly groove: GrooveFact;
  readonly syncopation: SyncopationFact;
  readonly subdivision: SubdivisionFact;
  readonly polyrhythm: PolyrhythmFact;
  readonly rhythmicDensity: DensityProfile;
}

/**
 * Tempo information
 */
export interface TempoFact {
  readonly bpm: number;
  readonly stability: number;
  readonly variations: readonly { onset: number; bpm: number }[];
  readonly feelCategory: 'slow' | 'moderate' | 'fast' | 'very_fast';
}

/**
 * Meter information
 */
export interface MeterFact {
  readonly timeSignature: { numerator: number; denominator: number };
  readonly downbeatStrength: number;
  readonly meterChanges: readonly { onset: number; numerator: number; denominator: number }[];
  readonly hyperMeter: readonly number[];
}

/**
 * Groove characteristics
 */
export interface GrooveFact {
  readonly swingAmount: number;
  readonly humanization: number;
  readonly tightness: number;
  readonly pocketFeelStrength: number;
  readonly backbeatEmphasis: number;
  readonly groovePattern: string;
}

/**
 * Syncopation analysis
 */
export interface SyncopationFact {
  readonly level: number;
  readonly locations: readonly { onset: number; strength: number }[];
  readonly consistency: number;
}

/**
 * Subdivision characteristics
 */
export interface SubdivisionFact {
  readonly primary: 'eighth' | 'sixteenth' | 'triplet' | 'quintuplet';
  readonly complexity: number;
  readonly consistency: number;
}

/**
 * Polyrhythmic characteristics
 */
export interface PolyrhythmFact {
  readonly present: boolean;
  readonly ratios: readonly string[];
  readonly complexity: number;
  readonly layers: readonly { trackId: string; ratio: string }[];
}

/**
 * Rhythmic density over time
 */
export interface DensityProfile {
  readonly overall: number;
  readonly bySection: readonly { onset: number; density: number }[];
  readonly byLayer: readonly { role: string; density: number }[];
  readonly peaks: readonly { onset: number; density: number }[];
  readonly valleys: readonly { onset: number; density: number }[];
}

// ============================================================================
// TEXTURAL ANALYSIS FACTS
// ============================================================================

/**
 * Facts about texture and layering
 */
export interface TexturalAnalysisFacts {
  readonly layerCount: number;
  readonly texture: TextureFact;
  readonly density: DensityFact;
  readonly homophony: HomophonyFact;
  readonly polyphony: PolyphonyFact;
  readonly registerDistribution: RegisterDistributionFact;
  readonly spatialDistribution: SpatialDistributionFact;
}

/**
 * Texture classification
 */
export interface TextureFact {
  readonly type: 'monophonic' | 'homophonic' | 'polyphonic' | 'heterophonic' | 'mixed';
  readonly complexity: number;
  readonly clarity: number;
}

/**
 * Density analysis
 */
export interface DensityFact {
  readonly overall: number;
  readonly melodic: number;
  readonly harmonic: number;
  readonly rhythmic: number;
  readonly evolution: readonly { onset: number; density: number }[];
}

/**
 * Homophonic characteristics
 */
export interface HomophonyFact {
  readonly level: number;
  readonly chordal: boolean;
  readonly melodicRhythmAlignment: number;
}

/**
 * Polyphonic characteristics
 */
export interface PolyphonyFact {
  readonly level: number;
  readonly voiceCount: number;
  readonly independence: number;
  readonly imitativeTexture: boolean;
}

/**
 * Register distribution
 */
export interface RegisterDistributionFact {
  readonly lowestPitch: number;
  readonly highestPitch: number;
  readonly meanPitch: number;
  readonly range: number;
  readonly coverage: readonly { register: string; percentage: number }[];
  readonly gaps: readonly { low: number; high: number }[];
}

/**
 * Spatial distribution (stereo field)
 */
export interface SpatialDistributionFact {
  readonly balance: number;
  readonly width: number;
  readonly depth: number;
  readonly distribution: readonly { position: number; density: number }[];
}

// ============================================================================
// STRUCTURAL ANALYSIS FACTS
// ============================================================================

/**
 * Facts about musical structure
 */
export interface StructuralAnalysisFacts {
  readonly form: FormFact;
  readonly sections: readonly SectionFact[];
  readonly phrases: readonly PhraseFact[];
  readonly repetition: RepetitionFact;
  readonly development: DevelopmentFact;
  readonly climax: ClimaxFact;
}

/**
 * Overall form
 */
export interface FormFact {
  readonly type: 'verse_chorus' | 'aaba' | 'abac' | 'through_composed' | 'rondo' | 'other';
  readonly scheme: string;
  readonly symmetry: number;
}

/**
 * Section analysis
 */
export interface SectionFact {
  readonly id: string;
  readonly label: string;
  readonly type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' | 'breakdown' | 'buildup' | 'drop';
  readonly startTick: number;
  readonly endTick: number;
  readonly duration: number;
  readonly barCount: number;
  readonly function: string;
  readonly energy: number;
}

/**
 * Phrase analysis
 */
export interface PhraseFact {
  readonly startTick: number;
  readonly endTick: number;
  readonly duration: number;
  readonly antecedent: boolean;
  readonly consequent: boolean;
  readonly periodType?: 'parallel' | 'contrasting' | 'asymmetrical';
}

/**
 * Repetition patterns
 */
export interface RepetitionFact {
  readonly level: number;
  readonly motivicRepetition: number;
  readonly sequencing: boolean;
  readonly ostinati: readonly { pattern: string; occurrences: number }[];
}

/**
 * Development characteristics
 */
export interface DevelopmentFact {
  readonly variation: number;
  readonly expansion: number;
  readonly fragmentation: number;
  readonly transformation: number;
}

/**
 * Climax location and characteristics
 */
export interface ClimaxFact {
  readonly onset: number;
  readonly duration: number;
  readonly intensity: number;
  readonly type: 'dynamic' | 'harmonic' | 'registral' | 'textural' | 'combined';
  readonly preparation: number;
  readonly resolution: number;
}

// ============================================================================
// TIMBRAL ANALYSIS FACTS
// ============================================================================

/**
 * Facts about timbre and instrumentation
 */
export interface TimbralAnalysisFacts {
  readonly brightness: BrightnessFact;
  readonly warmth: WarmthFact;
  readonly roughness: RoughnessFact;
  readonly spectralCentroid: SpectralFact;
  readonly instrumentalBalance: InstrumentalBalanceFact;
  readonly effectiveTimbre: EffectiveTimbreFact;
}

/**
 * Brightness analysis
 */
export interface BrightnessFact {
  readonly level: number;
  readonly evolution: readonly { onset: number; brightness: number }[];
  readonly distribution: readonly { frequency: number; amplitude: number }[];
}

/**
 * Warmth analysis
 */
export interface WarmthFact {
  readonly level: number;
  readonly lowEndPresence: number;
  readonly midRichness: number;
}

/**
 * Roughness/harshness analysis
 */
export interface RoughnessFact {
  readonly level: number;
  readonly sources: readonly string[];
  readonly desirability: number;
}

/**
 * Spectral characteristics
 */
export interface SpectralFact {
  readonly centroid: number;
  readonly spread: number;
  readonly rolloff: number;
  readonly flux: number;
}

/**
 * Balance between instruments
 */
export interface InstrumentalBalanceFact {
  readonly byRole: readonly { role: string; prominence: number }[];
  readonly dominant: string;
  readonly balance: number;
}

/**
 * Overall effective timbre
 */
export interface EffectiveTimbreFact {
  readonly character: string;
  readonly clarity: number;
  readonly richness: number;
  readonly coherence: number;
}

// ============================================================================
// MELODIC ANALYSIS FACTS
// ============================================================================

/**
 * Facts about melody
 */
export interface MelodicAnalysisFacts {
  readonly contour: ContourFact;
  readonly range: RangeFact;
  readonly intervalContent: IntervalContentFact;
  readonly motives: readonly MotiveFact[];
  readonly chromaticism: ChromaticismFact;
  readonly direction: DirectionFact;
}

/**
 * Melodic contour
 */
export interface ContourFact {
  readonly shape: 'ascending' | 'descending' | 'arch' | 'inverted_arch' | 'wave' | 'static';
  readonly complexity: number;
  readonly smoothness: number;
  readonly leaps: readonly { onset: number; interval: number }[];
}

/**
 * Melodic range
 */
export interface RangeFact {
  readonly lowest: number;
  readonly highest: number;
  readonly comfortable: boolean;
  readonly tessitura: 'low' | 'mid' | 'high';
}

/**
 * Interval content
 */
export interface IntervalContentFact {
  readonly mostCommon: readonly { interval: number; frequency: number }[];
  readonly diversity: number;
  readonly conjunctMotion: number;
  readonly disjunctMotion: number;
}

/**
 * Melodic motive
 */
export interface MotiveFact {
  readonly pattern: readonly number[];
  readonly occurrences: readonly { onset: number; transposition: number }[];
  readonly importance: number;
}

/**
 * Chromaticism in melody
 */
export interface ChromaticismFact {
  readonly level: number;
  readonly locations: readonly { onset: number; pitch: number }[];
  readonly function: readonly string[];
}

/**
 * Directional tendency
 */
export interface DirectionFact {
  readonly predominantDirection: 'ascending' | 'descending' | 'balanced';
  readonly momentum: number;
  readonly predictability: number;
}

// ============================================================================
// HARMONIC ANALYSIS FACTS (Extended)
// ============================================================================

/**
 * Extended harmonic analysis
 */
export interface HarmonicAnalysisFacts {
  readonly tensionProfile: TensionProfileFact;
  readonly voiceLeading: VoiceLeadingFact;
  readonly harmonicRhythm: HarmonicRhythmFact;
  readonly colorHarmonies: ColorHarmoniesFact;
  readonly dissonanceTreatment: DissonanceTreatmentFact;
}

/**
 * Tension over time
 */
export interface TensionProfileFact {
  readonly overall: number;
  readonly bySection: readonly { onset: number; tension: number }[];
  readonly peaks: readonly { onset: number; tension: number; type: string }[];
  readonly resolution: readonly { onset: number; strength: number }[];
}

/**
 * Voice leading characteristics
 */
export interface VoiceLeadingFact {
  readonly quality: number;
  readonly smoothness: number;
  readonly contraryMotion: number;
  readonly parallelMotion: number;
  readonly obliqueMotion: number;
  readonly voiceCrossing: number;
  readonly issues: readonly { onset: number; issue: string; severity: number }[];
}

/**
 * Harmonic rhythm
 */
export interface HarmonicRhythmFact {
  readonly average: number;
  readonly consistency: number;
  readonly acceleration: readonly { onset: number; rate: number }[];
  readonly deceleration: readonly { onset: number; rate: number }[];
}

/**
 * Color harmonies (non-functional)
 */
export interface ColorHarmoniesFact {
  readonly usage: number;
  readonly types: readonly string[];
  readonly effectiveness: number;
}

/**
 * Dissonance treatment
 */
export interface DissonanceTreatmentFact {
  readonly preparation: number;
  readonly resolution: number;
  readonly suspensions: readonly { onset: number; type: string }[];
  readonly appoggiaturas: readonly { onset: number }[];
}

// ============================================================================
// ORCHESTRATION ANALYSIS FACTS
// ============================================================================

/**
 * Facts about orchestration and arrangement
 */
export interface OrchestrationAnalysisFacts {
  readonly doubling: DoublingFact;
  readonly roleDistribution: RoleDistributionFact;
  readonly timbralCombinations: TimbralCombinationFact;
  readonly layering: LayeringFact;
  readonly balanceIssues: readonly BalanceIssueFact[];
}

/**
 * Doubling analysis
 */
export interface DoublingFact {
  readonly level: number;
  readonly unison: number;
  readonly octaves: number;
  readonly effectiveness: number;
}

/**
 * Role distribution
 */
export interface RoleDistributionFact {
  readonly roles: readonly { role: string; coverage: number; tracks: readonly string[] }[];
  readonly clarity: number;
  readonly redundancy: number;
}

/**
 * Timbral combination analysis
 */
export interface TimbralCombinationFact {
  readonly blending: number;
  readonly contrast: number;
  readonly compatibility: number;
  readonly clashes: readonly { tracks: readonly string[]; severity: number }[];
}

/**
 * Layering strategy
 */
export interface LayeringFact {
  readonly complexity: number;
  readonly separation: number;
  readonly byRegister: readonly { register: string; tracks: readonly string[] }[];
  readonly byRole: readonly { role: string; tracks: readonly string[] }[];
}

/**
 * Balance issue
 */
export interface BalanceIssueFact {
  readonly type: 'masking' | 'overload' | 'empty_range' | 'mono_collapse';
  readonly severity: number;
  readonly location: { startTick: number; endTick: number };
  readonly affectedTracks: readonly string[];
  readonly suggestion: string;
}

// ============================================================================
// ANALYSIS FACT EXTRACTOR INTERFACE
// ============================================================================

/**
 * Interface for extracting analysis facts from project state
 */
export interface AnalysisFactExtractor {
  /**
   * Extract complete analysis facts for a scope
   */
  extract(project: ProjectState, scope: AnalysisScope): Promise<AnalysisFacts>;

  /**
   * Extract only tonal facts
   */
  extractTonal(project: ProjectState, scope: AnalysisScope): Promise<TonalAnalysisFacts>;

  /**
   * Extract only rhythmic facts
   */
  extractRhythmic(project: ProjectState, scope: AnalysisScope): Promise<RhythmicAnalysisFacts>;

  /**
   * Extract only textural facts
   */
  extractTextural(project: ProjectState, scope: AnalysisScope): Promise<TexturalAnalysisFacts>;

  /**
   * Extract only structural facts
   */
  extractStructural(project: ProjectState, scope: AnalysisScope): Promise<StructuralAnalysisFacts>;

  /**
   * Extract only timbral facts
   */
  extractTimbral(project: ProjectState, scope: AnalysisScope): Promise<TimbralAnalysisFacts>;

  /**
   * Extract only melodic facts
   */
  extractMelodic(project: ProjectState, scope: AnalysisScope): Promise<MelodicAnalysisFacts>;

  /**
   * Extract only harmonic facts
   */
  extractHarmonic(project: ProjectState, scope: AnalysisScope): Promise<HarmonicAnalysisFacts>;

  /**
   * Extract only orchestration facts
   */
  extractOrchestration(project: ProjectState, scope: AnalysisScope): Promise<OrchestrationAnalysisFacts>;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Fact confidence level
 */
export type FactConfidence = 'high' | 'medium' | 'low' | 'uncertain';

/**
 * Fact provenance
 */
export interface FactProvenance {
  readonly method: string;
  readonly confidence: number;
  readonly timestamp: number;
  readonly assumptions: readonly string[];
}

/**
 * Fact comparison result
 */
export interface FactComparison {
  readonly before: AnalysisFacts;
  readonly after: AnalysisFacts;
  readonly differences: readonly FactDifference[];
}

/**
 * Individual fact difference
 */
export interface FactDifference {
  readonly category: keyof AnalysisFacts;
  readonly field: string;
  readonly beforeValue: unknown;
  readonly afterValue: unknown;
  readonly delta: number;
  readonly significance: number;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Create an empty analysis scope
 */
export function createProjectScope(): AnalysisScope {
  return { type: 'project' };
}

/**
 * Create a section scope
 */
export function createSectionScope(sectionIds: readonly string[]): AnalysisScope {
  return { type: 'section', sectionIds };
}

/**
 * Create a range scope
 */
export function createRangeScope(startTick: number, endTick: number): AnalysisScope {
  return { type: 'range', startTick, endTick };
}

/**
 * Check if two scopes overlap
 */
export function scopesOverlap(a: AnalysisScope, b: AnalysisScope): boolean {
  if (a.type === 'project' || b.type === 'project') {
    return true;
  }

  if (a.type === 'range' && b.type === 'range') {
    if (a.startTick === undefined || a.endTick === undefined ||
        b.startTick === undefined || b.endTick === undefined) {
      return false;
    }
    return !(a.endTick <= b.startTick || b.endTick <= a.startTick);
  }

  if (a.type === 'section' && b.type === 'section') {
    if (!a.sectionIds || !b.sectionIds) {
      return false;
    }
    return a.sectionIds.some(id => b.sectionIds!.includes(id));
  }

  return false;
}

/**
 * Merge analysis facts (averaging where appropriate)
 */
export function mergeAnalysisFacts(facts: readonly AnalysisFacts[]): AnalysisFacts {
  if (facts.length === 0) {
    throw new Error('Cannot merge empty facts array');
  }
  if (facts.length === 1) {
    return facts[0];
  }

  // For now, return the first (would implement proper merging)
  return facts[0];
}

/**
 * Compute delta between two analysis fact sets
 */
export function computeFactDelta(before: AnalysisFacts, after: AnalysisFacts): readonly FactDifference[] {
  const differences: FactDifference[] = [];

  // Compare tonal facts
  if (before.tonal.keyEstimate.key !== after.tonal.keyEstimate.key) {
    differences.push({
      category: 'tonal',
      field: 'keyEstimate.key',
      beforeValue: before.tonal.keyEstimate.key,
      afterValue: after.tonal.keyEstimate.key,
      delta: 1,
      significance: 0.9
    });
  }

  // Compare tension
  const tensionDelta = after.harmonic.tensionProfile.overall - before.harmonic.tensionProfile.overall;
  if (Math.abs(tensionDelta) > 0.05) {
    differences.push({
      category: 'harmonic',
      field: 'tensionProfile.overall',
      beforeValue: before.harmonic.tensionProfile.overall,
      afterValue: after.harmonic.tensionProfile.overall,
      delta: tensionDelta,
      significance: Math.abs(tensionDelta)
    });
  }

  // More comparisons would be implemented here

  return differences;
}
