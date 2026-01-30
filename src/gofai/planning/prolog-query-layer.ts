/**
 * @fileoverview Prolog Query Layer for GOFAI Planning
 * 
 * Step 266 [Sem][Infra] — Integrate Prolog for symbolic suggestions:
 * query theory KB for chord substitutions, cadence options, mode inference.
 * 
 * This module provides a typed wrapper around PrologAdapter for GOFAI planning needs.
 * It specifically handles:
 * - Chord substitution queries
 * - Cadence analysis and suggestions
 * - Mode and key inference
 * - Voice leading validation
 * - Harmonic tension analysis
 * - Scale degree function queries
 * - Chord progression validation
 * - Reharmonization suggestions
 * 
 * @module @cardplay/gofai/planning/prolog-query-layer
 */

import type { PrologAdapter, QueryResult, PrologTerm } from '../../ai/engine/prolog-adapter';
import type { ChordSymbol, ScaleDegree, KeySignature } from '../../ai/theory/music-spec';
import type { Provenance } from '../pipeline/types';

// ============================================================================
// TYPES - Query Inputs and Results
// ============================================================================

/**
 * Chord substitution query input
 */
export interface ChordSubstitutionQuery {
  readonly chord: ChordSymbol;
  readonly context: {
    readonly key?: KeySignature;
    readonly scaleDegree?: ScaleDegree;
    readonly precedingChord?: ChordSymbol;
    readonly followingChord?: ChordSymbol;
    readonly section?: 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro';
  };
  readonly constraints?: {
    readonly preserveRoot?: boolean;
    readonly preserveQuality?: boolean;
    readonly preserveExtensions?: boolean;
    readonly maxTensionIncrease?: number;
  };
}

/**
 * Chord substitution result
 */
export interface ChordSubstitution {
  readonly original: ChordSymbol;
  readonly substitute: ChordSymbol;
  readonly reason: string;
  readonly tensionDelta: number;
  readonly voiceLeadingCost: number;
  readonly functionalEquivalence: 'exact' | 'similar' | 'contrasting';
  readonly confidence: number;
  readonly provenance: Provenance;
}

/**
 * Cadence analysis query
 */
export interface CadenceQuery {
  readonly chords: readonly ChordSymbol[];
  readonly key?: KeySignature;
  readonly position?: 'phrase_end' | 'section_end' | 'song_end' | 'any';
}

/**
 * Cadence analysis result
 */
export interface CadenceAnalysis {
  readonly type: 'authentic' | 'plagal' | 'deceptive' | 'half' | 'phrygian' | 'imperfect' | 'none';
  readonly strength: number;
  readonly scaleDegrees: readonly ScaleDegree[];
  readonly alternatives: readonly CadenceAlternative[];
  readonly confidence: number;
  readonly explanation: string;
  readonly provenance: Provenance;
}

/**
 * Alternative cadence suggestion
 */
export interface CadenceAlternative {
  readonly type: string;
  readonly chords: readonly ChordSymbol[];
  readonly strength: number;
  readonly explanation: string;
}

/**
 * Mode inference query
 */
export interface ModeInferenceQuery {
  readonly pitches?: readonly number[];
  readonly chords?: readonly ChordSymbol[];
  readonly key?: KeySignature;
  readonly section?: string;
}

/**
 * Mode inference result
 */
export interface ModeInference {
  readonly mode: 'major' | 'minor' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'aeolian' | 'locrian';
  readonly confidence: number;
  readonly characteristicDegrees: readonly ScaleDegree[];
  readonly tension: number;
  readonly alternatives: readonly { mode: string; confidence: number }[];
  readonly explanation: string;
  readonly provenance: Provenance;
}

/**
 * Voice leading validation query
 */
export interface VoiceLeadingQuery {
  readonly fromChord: ChordSymbol;
  readonly toChord: ChordSymbol;
  readonly voicing?: 'close' | 'open' | 'drop2' | 'drop3' | 'spread';
  readonly voiceRanges?: readonly { voice: string; min: number; max: number }[];
}

/**
 * Voice leading validation result
 */
export interface VoiceLeadingAnalysis {
  readonly valid: boolean;
  readonly cost: number;
  readonly parallelFifths: boolean;
  readonly parallelOctaves: boolean;
  readonly hiddenFifths: boolean;
  readonly voiceCrossing: boolean;
  readonly largestLeap: number;
  readonly smoothness: number;
  readonly suggestions: readonly VoiceLeadingSuggestion[];
  readonly explanation: string;
  readonly provenance: Provenance;
}

/**
 * Voice leading improvement suggestion
 */
export interface VoiceLeadingSuggestion {
  readonly voicing: string;
  readonly cost: number;
  readonly improvement: string;
}

/**
 * Harmonic tension query
 */
export interface HarmonicTensionQuery {
  readonly chord: ChordSymbol;
  readonly key?: KeySignature;
  readonly scaleDegree?: ScaleDegree;
  readonly context?: readonly ChordSymbol[];
}

/**
 * Harmonic tension analysis
 */
export interface HarmonicTensionAnalysis {
  readonly tension: number;
  readonly dissonance: number;
  readonly stability: number;
  readonly resolution: 'stable' | 'needs_resolution' | 'ambiguous';
  readonly resolutionTargets: readonly ChordSymbol[];
  readonly factors: readonly TensionFactor[];
  readonly explanation: string;
  readonly provenance: Provenance;
}

/**
 * Factor contributing to harmonic tension
 */
export interface TensionFactor {
  readonly factor: string;
  readonly contribution: number;
  readonly description: string;
}

/**
 * Reharmonization query
 */
export interface ReharmonizationQuery {
  readonly melody: readonly { pitch: number; onset: number; duration: number }[];
  readonly originalChords?: readonly ChordSymbol[];
  readonly key?: KeySignature;
  readonly style?: 'jazz' | 'classical' | 'pop' | 'modal' | 'chromatic';
  readonly constraints?: {
    readonly preserveMelody: boolean;
    readonly allowBorrowedChords?: boolean;
    readonly allowSecondaryDominants?: boolean;
    readonly allowSubstitutions?: boolean;
    readonly minChordDuration?: number;
  };
}

/**
 * Reharmonization result
 */
export interface ReharmonizationResult {
  readonly chords: readonly { chord: ChordSymbol; onset: number; duration: number }[];
  readonly tensionProfile: readonly number[];
  readonly functionalAnalysis: readonly string[];
  readonly quality: number;
  readonly explanation: string;
  readonly provenance: Provenance;
}

// ============================================================================
// PROLOG QUERY LAYER CLASS
// ============================================================================

/**
 * Typed wrapper around PrologAdapter for GOFAI planning queries.
 * Provides high-level music theory query functions with result validation.
 */
export class PrologQueryLayer {
  private adapter: PrologAdapter;
  private kbLoaded: boolean = false;

  constructor(adapter: PrologAdapter) {
    this.adapter = adapter;
  }

  /**
   * Initialize the query layer by loading required knowledge bases
   */
  async initialize(): Promise<void> {
    if (this.kbLoaded) {
      return;
    }

    // Load music theory knowledge bases
    // These should be consulted in order of dependency
    const kbFiles = [
      '/ai/knowledge/music-theory-jazz.pl',
      '/ai/knowledge/music-theory-galant.pl',
      '/ai/knowledge/music-theory-film.pl',
      '/ai/knowledge/music-theory-edm.pl',
    ];

    for (const file of kbFiles) {
      try {
        await this.adapter.consult(file);
      } catch (error) {
        console.warn(`Failed to load KB ${file}:`, error);
      }
    }

    this.kbLoaded = true;
  }

  /**
   * Query for chord substitution suggestions
   */
  async queryChordSubstitution(query: ChordSubstitutionQuery): Promise<readonly ChordSubstitution[]> {
    await this.initialize();

    const prologQuery = this.buildChordSubstitutionQuery(query);
    const result = await this.adapter.queryAll(prologQuery);

    if (!result.success || !result.solutions) {
      return [];
    }

    return result.solutions.map((solution, index) => this.parseChordSubstitution(solution, query, index));
  }

  /**
   * Analyze a cadence and suggest alternatives
   */
  async analyzeCadence(query: CadenceQuery): Promise<CadenceAnalysis> {
    await this.initialize();

    const prologQuery = this.buildCadenceQuery(query);
    const result = await this.adapter.querySingle(prologQuery);

    if (!result.success || !result.solution) {
      return this.createDefaultCadenceAnalysis(query);
    }

    return this.parseCadenceAnalysis(result.solution, query);
  }

  /**
   * Infer the mode from pitches or chords
   */
  async inferMode(query: ModeInferenceQuery): Promise<ModeInference> {
    await this.initialize();

    const prologQuery = this.buildModeInferenceQuery(query);
    const result = await this.adapter.querySingle(prologQuery);

    if (!result.success || !result.solution) {
      return this.createDefaultModeInference(query);
    }

    return this.parseModeInference(result.solution, query);
  }

  /**
   * Validate voice leading between two chords
   */
  async validateVoiceLeading(query: VoiceLeadingQuery): Promise<VoiceLeadingAnalysis> {
    await this.initialize();

    const prologQuery = this.buildVoiceLeadingQuery(query);
    const result = await this.adapter.querySingle(prologQuery);

    if (!result.success || !result.solution) {
      return this.createDefaultVoiceLeadingAnalysis(query);
    }

    return this.parseVoiceLeadingAnalysis(result.solution, query);
  }

  /**
   * Analyze harmonic tension
   */
  async analyzeHarmonicTension(query: HarmonicTensionQuery): Promise<HarmonicTensionAnalysis> {
    await this.initialize();

    const prologQuery = this.buildHarmonicTensionQuery(query);
    const result = await this.adapter.querySingle(prologQuery);

    if (!result.success || !result.solution) {
      return this.createDefaultTensionAnalysis(query);
    }

    return this.parseHarmonicTensionAnalysis(result.solution, query);
  }

  /**
   * Generate reharmonization suggestions
   */
  async suggestReharmonization(query: ReharmonizationQuery): Promise<readonly ReharmonizationResult[]> {
    await this.initialize();

    const prologQuery = this.buildReharmonizationQuery(query);
    const result = await this.adapter.queryAll(prologQuery);

    if (!result.success || !result.solutions) {
      return [];
    }

    return result.solutions.map((solution, index) => this.parseReharmonizationResult(solution, query, index));
  }

  // ============================================================================
  // QUERY BUILDERS - Convert TypeScript queries to Prolog terms
  // ============================================================================

  private buildChordSubstitutionQuery(query: ChordSubstitutionQuery): string {
    const { chord, context, constraints } = query;
    
    const keyArg = context.key ? `key(${this.encodeKey(context.key)})` : '_';
    const degreeArg = context.scaleDegree ? `degree(${context.scaleDegree})` : '_';
    const preserveRoot = constraints?.preserveRoot ? 'true' : 'false';
    const preserveQuality = constraints?.preserveQuality ? 'true' : 'false';
    
    return `chord_substitution(${this.encodeChord(chord)}, ${keyArg}, ${degreeArg}, Sub, Reason, Tension, ${preserveRoot}, ${preserveQuality})`;
  }

  private buildCadenceQuery(query: CadenceQuery): string {
    const chordsArg = `[${query.chords.map(c => this.encodeChord(c)).join(', ')}]`;
    const keyArg = query.key ? this.encodeKey(query.key) : '_';
    const positionArg = query.position ? `'${query.position}'` : '_';
    
    return `analyze_cadence(${chordsArg}, ${keyArg}, ${positionArg}, Type, Strength, Degrees)`;
  }

  private buildModeInferenceQuery(query: ModeInferenceQuery): string {
    if (query.pitches) {
      const pitchesArg = `[${query.pitches.join(', ')}]`;
      const keyArg = query.key ? this.encodeKey(query.key) : '_';
      return `infer_mode_from_pitches(${pitchesArg}, ${keyArg}, Mode, Confidence, CharDegrees)`;
    } else if (query.chords) {
      const chordsArg = `[${query.chords.map(c => this.encodeChord(c)).join(', ')}]`;
      const keyArg = query.key ? this.encodeKey(query.key) : '_';
      return `infer_mode_from_chords(${chordsArg}, ${keyArg}, Mode, Confidence, CharDegrees)`;
    }
    return 'fail';
  }

  private buildVoiceLeadingQuery(query: VoiceLeadingQuery): string {
    const fromArg = this.encodeChord(query.fromChord);
    const toArg = this.encodeChord(query.toChord);
    const voicingArg = query.voicing ? `'${query.voicing}'` : '_';
    
    return `validate_voice_leading(${fromArg}, ${toArg}, ${voicingArg}, Valid, Cost, Issues)`;
  }

  private buildHarmonicTensionQuery(query: HarmonicTensionQuery): string {
    const chordArg = this.encodeChord(query.chord);
    const keyArg = query.key ? this.encodeKey(query.key) : '_';
    const degreeArg = query.scaleDegree ? `degree(${query.scaleDegree})` : '_';
    
    return `harmonic_tension(${chordArg}, ${keyArg}, ${degreeArg}, Tension, Dissonance, Resolution)`;
  }

  private buildReharmonizationQuery(query: ReharmonizationQuery): string {
    const melodyArg = `[${query.melody.map(n => `note(${n.pitch}, ${n.onset}, ${n.duration})`).join(', ')}]`;
    const keyArg = query.key ? this.encodeKey(query.key) : '_';
    const styleArg = query.style ? `'${query.style}'` : 'jazz';
    
    return `reharmonize(${melodyArg}, ${keyArg}, ${styleArg}, Chords, Quality)`;
  }

  // ============================================================================
  // ENCODERS - Convert TypeScript types to Prolog terms
  // ============================================================================

  private encodeChord(chord: ChordSymbol): string {
    // Parse chord symbol and encode as Prolog term
    // Format: chord(root, quality, extensions)
    const parts = this.parseChordSymbol(chord);
    const extensionsArg = parts.extensions.length > 0 
      ? `[${parts.extensions.join(', ')}]`
      : '[]';
    return `chord('${parts.root}', '${parts.quality}', ${extensionsArg})`;
  }

  private encodeKey(key: KeySignature): string {
    // Format: key(tonic, mode)
    return `key('${key.tonic}', '${key.mode || 'major'}')`;
  }

  private parseChordSymbol(chord: ChordSymbol): {
    root: string;
    quality: string;
    extensions: readonly string[];
  } {
    // Simple chord parser - in production this would be more sophisticated
    const match = chord.match(/^([A-G][b#]?)(.*)$/);
    if (!match) {
      return { root: 'C', quality: 'major', extensions: [] };
    }

    const [, root, rest] = match;
    let quality = 'major';
    const extensions: string[] = [];

    if (rest.includes('m') && !rest.includes('maj')) {
      quality = 'minor';
    } else if (rest.includes('dim')) {
      quality = 'diminished';
    } else if (rest.includes('aug')) {
      quality = 'augmented';
    } else if (rest.includes('7') && !rest.includes('maj7')) {
      quality = 'dominant';
    }

    // Parse extensions
    const extMatch = rest.match(/\d+/g);
    if (extMatch) {
      extensions.push(...extMatch);
    }

    return { root, quality, extensions };
  }

  // ============================================================================
  // PARSERS - Convert Prolog solutions to TypeScript types
  // ============================================================================

  private parseChordSubstitution(
    solution: Record<string, unknown>,
    query: ChordSubstitutionQuery,
    index: number
  ): ChordSubstitution {
    const substitute = this.extractChordSymbol(solution.Sub);
    const reason = this.extractString(solution.Reason) || 'Functional substitution';
    const tension = this.extractNumber(solution.Tension) || 0;

    return {
      original: query.chord,
      substitute,
      reason,
      tensionDelta: tension,
      voiceLeadingCost: 0.5, // Would be computed by voice leading analysis
      functionalEquivalence: this.determineFunctionalEquivalence(tension),
      confidence: Math.max(0, Math.min(1, 1.0 - (index * 0.1))),
      provenance: {
        source: 'prolog_kb',
        rule: 'chord_substitution',
        timestamp: Date.now(),
        confidence: 1.0 - (index * 0.1)
      }
    };
  }

  private parseCadenceAnalysis(
    solution: Record<string, unknown>,
    query: CadenceQuery
  ): CadenceAnalysis {
    const type = this.extractString(solution.Type) || 'none';
    const strength = this.extractNumber(solution.Strength) || 0.5;
    const degrees = this.extractList(solution.Degrees) as ScaleDegree[];

    return {
      type: type as CadenceAnalysis['type'],
      strength,
      scaleDegrees: degrees,
      alternatives: [],
      confidence: strength,
      explanation: this.generateCadenceExplanation(type, strength),
      provenance: {
        source: 'prolog_kb',
        rule: 'analyze_cadence',
        timestamp: Date.now(),
        confidence: strength
      }
    };
  }

  private parseModeInference(
    solution: Record<string, unknown>,
    query: ModeInferenceQuery
  ): ModeInference {
    const mode = this.extractString(solution.Mode) || 'major';
    const confidence = this.extractNumber(solution.Confidence) || 0.7;
    const charDegrees = this.extractList(solution.CharDegrees) as ScaleDegree[];

    return {
      mode: mode as ModeInference['mode'],
      confidence,
      characteristicDegrees: charDegrees,
      tension: this.computeModalTension(mode),
      alternatives: [],
      explanation: this.generateModeExplanation(mode, charDegrees),
      provenance: {
        source: 'prolog_kb',
        rule: 'infer_mode',
        timestamp: Date.now(),
        confidence
      }
    };
  }

  private parseVoiceLeadingAnalysis(
    solution: Record<string, unknown>,
    query: VoiceLeadingQuery
  ): VoiceLeadingAnalysis {
    const valid = this.extractBoolean(solution.Valid);
    const cost = this.extractNumber(solution.Cost) || 1.0;
    const issues = this.extractList(solution.Issues) as string[];

    return {
      valid,
      cost,
      parallelFifths: issues.includes('parallel_fifths'),
      parallelOctaves: issues.includes('parallel_octaves'),
      hiddenFifths: issues.includes('hidden_fifths'),
      voiceCrossing: issues.includes('voice_crossing'),
      largestLeap: this.extractLargestLeap(issues),
      smoothness: valid ? 1.0 - cost : 0,
      suggestions: [],
      explanation: this.generateVoiceLeadingExplanation(valid, issues),
      provenance: {
        source: 'prolog_kb',
        rule: 'validate_voice_leading',
        timestamp: Date.now(),
        confidence: valid ? 0.9 : 0.5
      }
    };
  }

  private parseHarmonicTensionAnalysis(
    solution: Record<string, unknown>,
    query: HarmonicTensionQuery
  ): HarmonicTensionAnalysis {
    const tension = this.extractNumber(solution.Tension) || 0.5;
    const dissonance = this.extractNumber(solution.Dissonance) || 0;
    const resolution = this.extractString(solution.Resolution) || 'stable';

    return {
      tension,
      dissonance,
      stability: 1.0 - tension,
      resolution: resolution as HarmonicTensionAnalysis['resolution'],
      resolutionTargets: [],
      factors: this.extractTensionFactors(solution),
      explanation: this.generateTensionExplanation(tension, dissonance),
      provenance: {
        source: 'prolog_kb',
        rule: 'harmonic_tension',
        timestamp: Date.now(),
        confidence: 0.8
      }
    };
  }

  private parseReharmonizationResult(
    solution: Record<string, unknown>,
    query: ReharmonizationQuery,
    index: number
  ): ReharmonizationResult {
    const chords = this.extractChordProgression(solution.Chords);
    const quality = this.extractNumber(solution.Quality) || 0.7;

    return {
      chords,
      tensionProfile: chords.map(() => 0.5), // Would be computed
      functionalAnalysis: chords.map(c => this.analyzeFunctionalRole(c.chord)),
      quality,
      explanation: this.generateReharmonizationExplanation(chords, quality),
      provenance: {
        source: 'prolog_kb',
        rule: 'reharmonize',
        timestamp: Date.now(),
        confidence: quality
      }
    };
  }

  // ============================================================================
  // EXTRACTION UTILITIES
  // ============================================================================

  private extractString(value: unknown): string | undefined {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && 'value' in value) {
      return String((value as { value: unknown }).value);
    }
    return undefined;
  }

  private extractNumber(value: unknown): number | undefined {
    if (typeof value === 'number') return value;
    if (value && typeof value === 'object' && 'value' in value) {
      const num = Number((value as { value: unknown }).value);
      return isNaN(num) ? undefined : num;
    }
    return undefined;
  }

  private extractBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    const str = this.extractString(value);
    return str === 'true' || str === 'yes';
  }

  private extractList(value: unknown): readonly unknown[] {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object' && 'elements' in value) {
      return (value as { elements: unknown[] }).elements;
    }
    return [];
  }

  private extractChordSymbol(value: unknown): ChordSymbol {
    const str = this.extractString(value);
    if (str) return str as ChordSymbol;
    
    // Try to extract from compound term
    if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      if (obj.type === 'compound' && obj.functor === 'chord') {
        const args = obj.args as unknown[];
        const root = this.extractString(args[0]) || 'C';
        const quality = this.extractString(args[1]) || 'major';
        return `${root}${this.qualityToSymbol(quality)}` as ChordSymbol;
      }
    }
    
    return 'C' as ChordSymbol;
  }

  private extractChordProgression(value: unknown): readonly {
    chord: ChordSymbol;
    onset: number;
    duration: number;
  }[] {
    const list = this.extractList(value);
    return list.map((item, index) => ({
      chord: this.extractChordSymbol(item),
      onset: index * 4, // Default to 4-beat spacing
      duration: 4
    }));
  }

  private extractTensionFactors(solution: Record<string, unknown>): readonly TensionFactor[] {
    // In a real implementation, this would extract factors from the solution
    return [
      {
        factor: 'dissonance',
        contribution: 0.3,
        description: 'Dissonant intervals present'
      }
    ];
  }

  private extractLargestLeap(issues: readonly string[]): number {
    for (const issue of issues) {
      const match = issue.match(/leap_(\d+)/);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
    return 0;
  }

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  private determineFunctionalEquivalence(tensionDelta: number): 'exact' | 'similar' | 'contrasting' {
    if (Math.abs(tensionDelta) < 0.1) return 'exact';
    if (Math.abs(tensionDelta) < 0.3) return 'similar';
    return 'contrasting';
  }

  private qualityToSymbol(quality: string): string {
    const map: Record<string, string> = {
      'minor': 'm',
      'major': '',
      'diminished': 'dim',
      'augmented': 'aug',
      'dominant': '7'
    };
    return map[quality] || '';
  }

  private computeModalTension(mode: string): number {
    const tensionMap: Record<string, number> = {
      'major': 0.3,
      'minor': 0.5,
      'dorian': 0.4,
      'phrygian': 0.7,
      'lydian': 0.6,
      'mixolydian': 0.4,
      'aeolian': 0.5,
      'locrian': 0.9
    };
    return tensionMap[mode] || 0.5;
  }

  private analyzeFunctionalRole(chord: ChordSymbol): string {
    // Simplified functional analysis
    if (chord.includes('7') && !chord.includes('maj7')) {
      return 'dominant';
    }
    if (chord.includes('m')) {
      return 'subdominant';
    }
    return 'tonic';
  }

  // ============================================================================
  // EXPLANATION GENERATORS
  // ============================================================================

  private generateCadenceExplanation(type: string, strength: number): string {
    const strengthDesc = strength > 0.8 ? 'strong' : strength > 0.5 ? 'moderate' : 'weak';
    return `${type.charAt(0).toUpperCase() + type.slice(1)} cadence with ${strengthDesc} resolution`;
  }

  private generateModeExplanation(mode: string, charDegrees: readonly ScaleDegree[]): string {
    return `${mode.charAt(0).toUpperCase() + mode.slice(1)} mode suggested by characteristic degrees: ${charDegrees.join(', ')}`;
  }

  private generateVoiceLeadingExplanation(valid: boolean, issues: readonly string[]): string {
    if (valid) {
      return 'Voice leading is smooth and follows standard practices';
    }
    return `Voice leading issues: ${issues.join(', ')}`;
  }

  private generateTensionExplanation(tension: number, dissonance: number): string {
    const tensionDesc = tension > 0.7 ? 'high' : tension > 0.4 ? 'moderate' : 'low';
    const dissonanceDesc = dissonance > 0.5 ? 'dissonant' : 'consonant';
    return `${tensionDesc.charAt(0).toUpperCase() + tensionDesc.slice(1)} harmonic tension with ${dissonanceDesc} character`;
  }

  private generateReharmonizationExplanation(
    chords: readonly { chord: ChordSymbol }[],
    quality: number
  ): string {
    const qualityDesc = quality > 0.8 ? 'excellent' : quality > 0.6 ? 'good' : 'acceptable';
    return `Reharmonization with ${chords.length} chords, ${qualityDesc} quality`;
  }

  // ============================================================================
  // DEFAULT FALLBACKS
  // ============================================================================

  private createDefaultCadenceAnalysis(query: CadenceQuery): CadenceAnalysis {
    return {
      type: 'none',
      strength: 0,
      scaleDegrees: [],
      alternatives: [],
      confidence: 0,
      explanation: 'Unable to analyze cadence',
      provenance: {
        source: 'fallback',
        rule: 'default',
        timestamp: Date.now(),
        confidence: 0
      }
    };
  }

  private createDefaultModeInference(query: ModeInferenceQuery): ModeInference {
    return {
      mode: 'major',
      confidence: 0.5,
      characteristicDegrees: [],
      tension: 0.3,
      alternatives: [],
      explanation: 'Default major mode assumption',
      provenance: {
        source: 'fallback',
        rule: 'default',
        timestamp: Date.now(),
        confidence: 0.5
      }
    };
  }

  private createDefaultVoiceLeadingAnalysis(query: VoiceLeadingQuery): VoiceLeadingAnalysis {
    return {
      valid: true,
      cost: 0.5,
      parallelFifths: false,
      parallelOctaves: false,
      hiddenFifths: false,
      voiceCrossing: false,
      largestLeap: 0,
      smoothness: 0.5,
      suggestions: [],
      explanation: 'Default voice leading analysis',
      provenance: {
        source: 'fallback',
        rule: 'default',
        timestamp: Date.now(),
        confidence: 0.5
      }
    };
  }

  private createDefaultTensionAnalysis(query: HarmonicTensionQuery): HarmonicTensionAnalysis {
    return {
      tension: 0.5,
      dissonance: 0,
      stability: 0.5,
      resolution: 'stable',
      resolutionTargets: [],
      factors: [],
      explanation: 'Default tension analysis',
      provenance: {
        source: 'fallback',
        rule: 'default',
        timestamp: Date.now(),
        confidence: 0.5
      }
    };
  }
}

/**
 * Create a new Prolog query layer instance
 */
export function createPrologQueryLayer(adapter: PrologAdapter): PrologQueryLayer {
  return new PrologQueryLayer(adapter);
}
