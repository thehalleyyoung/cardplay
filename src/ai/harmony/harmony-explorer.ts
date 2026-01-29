/**
 * @fileoverview Harmony Explorer
 * 
 * Prolog-powered harmony analysis and suggestion system using the
 * music theory knowledge base.
 * 
 * L251-L260: Harmony explorer using Prolog KB
 * 
 * @module @cardplay/ai/harmony/harmony-explorer
 */

import { getPrologAdapter, PrologAdapter } from '../engine/prolog-adapter';
import { loadMusicTheoryKB } from '../knowledge/music-theory-loader';
import { loadCompositionPatternsKB } from '../knowledge/composition-patterns-loader';

// =============================================================================
// Types
// =============================================================================

/**
 * A chord with its context.
 */
export interface ChordInfo {
  /** Root note name (e.g., 'c', 'fsharp') */
  readonly root: string;
  /** Chord quality (e.g., 'major', 'minor', 'dom7') */
  readonly quality: string;
}

/**
 * Key context.
 */
export interface KeyInfo {
  /** Root note name */
  readonly root: string;
  /** Mode (e.g., 'major', 'minor') */
  readonly mode: string;
}

/**
 * Chord function in harmonic analysis.
 */
export type HarmonicFunction = 'tonic' | 'subdominant' | 'dominant';

/**
 * Harmonic analysis result for a chord.
 */
export interface ChordAnalysis {
  /** Roman numeral (e.g., 'I', 'V7', 'ii') */
  readonly numeral: string;
  /** Scale degree (1-7) */
  readonly degree: number;
  /** Harmonic function */
  readonly function: HarmonicFunction;
  /** Tension level (0 = stable, higher = more tension) */
  readonly tension: number;
  /** Is this a diatonic chord? */
  readonly isDiatonic: boolean;
  /** If borrowed, from which mode */
  readonly borrowedFrom?: string;
}

/**
 * Chord suggestion with reasoning.
 */
export interface ChordSuggestion {
  /** Suggested chord */
  readonly chord: ChordInfo;
  /** Roman numeral */
  readonly numeral: string;
  /** Reasoning for suggestion */
  readonly reason: string;
  /** Confidence score (0-100) */
  readonly confidence: number;
}

/**
 * Full progression analysis.
 */
export interface ProgressionAnalysis {
  /** Detected key */
  readonly key: KeyInfo;
  /** Confidence in key detection (0-100) */
  readonly keyConfidence: number;
  /** Analysis of each chord */
  readonly chordAnalyses: ChordAnalysis[];
  /** Cadence types found */
  readonly cadences: string[];
  /** Voice leading quality (0-100) */
  readonly voiceLeadingQuality: number;
  /** Overall analysis summary */
  readonly summary: string;
}

/**
 * Reharmonization suggestion.
 */
export interface ReharmonizationSuggestion {
  /** Original chord */
  readonly original: ChordInfo;
  /** Suggested replacement */
  readonly replacement: ChordInfo;
  /** Type of substitution */
  readonly substitutionType: string;
  /** Explanation */
  readonly explanation: string;
}

/**
 * Modulation suggestion.
 */
export interface ModulationPath {
  /** Target key */
  readonly targetKey: KeyInfo;
  /** Pivot chords for modulation */
  readonly pivotChords: ChordInfo[];
  /** Steps in modulation */
  readonly steps: string[];
}

// =============================================================================
// Note Mapping
// =============================================================================

const NOTE_TO_SEMITONE: Record<string, number> = {
  'c': 0, 'csharp': 1, 'dflat': 1,
  'd': 2, 'dsharp': 3, 'eflat': 3,
  'e': 4, 'fflat': 4,
  'f': 5, 'esharp': 5, 'fsharp': 6, 'gflat': 6,
  'g': 7, 'gsharp': 8, 'aflat': 8,
  'a': 9, 'asharp': 10, 'bflat': 10,
  'b': 11, 'cflat': 11
};

const SEMITONE_TO_NOTE: Record<number, string> = {
  0: 'c', 1: 'csharp', 2: 'd', 3: 'dsharp',
  4: 'e', 5: 'f', 6: 'fsharp', 7: 'g',
  8: 'gsharp', 9: 'a', 10: 'asharp', 11: 'b'
};

// Major scale degree qualities
const MAJOR_DEGREES: readonly { quality: string; numeral: string; func: HarmonicFunction }[] = [
  { quality: 'major', numeral: 'I', func: 'tonic' },
  { quality: 'minor', numeral: 'ii', func: 'subdominant' },
  { quality: 'minor', numeral: 'iii', func: 'tonic' },
  { quality: 'major', numeral: 'IV', func: 'subdominant' },
  { quality: 'major', numeral: 'V', func: 'dominant' },
  { quality: 'minor', numeral: 'vi', func: 'tonic' },
  { quality: 'dim', numeral: 'vii°', func: 'dominant' }
];

// Minor scale degree qualities
const MINOR_DEGREES: readonly { quality: string; numeral: string; func: HarmonicFunction }[] = [
  { quality: 'minor', numeral: 'i', func: 'tonic' },
  { quality: 'dim', numeral: 'ii°', func: 'subdominant' },
  { quality: 'major', numeral: 'III', func: 'tonic' },
  { quality: 'minor', numeral: 'iv', func: 'subdominant' },
  { quality: 'minor', numeral: 'v', func: 'dominant' },
  { quality: 'major', numeral: 'VI', func: 'tonic' },
  { quality: 'major', numeral: 'VII', func: 'dominant' }
];

// Major scale intervals
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];

// =============================================================================
// Harmony Explorer Class
// =============================================================================

/**
 * Harmony explorer using Prolog knowledge bases.
 */
export class HarmonyExplorer {
  private adapter: PrologAdapter;
  private kbLoaded = false;
  
  constructor(adapter: PrologAdapter = getPrologAdapter()) {
    this.adapter = adapter;
  }
  
  /**
   * Ensure knowledge bases are loaded.
   */
  private async ensureKBLoaded(): Promise<void> {
    if (this.kbLoaded) return;
    
    await loadMusicTheoryKB(this.adapter);
    await loadCompositionPatternsKB(this.adapter);
    this.kbLoaded = true;
  }
  
  /**
   * Get tension level from Prolog.
   */
  private async getTension(degree: number): Promise<number> {
    await this.ensureKBLoaded();
    
    const result = await this.adapter.querySingle(`tension(${degree}, Tension)`);
    if (result) {
      return Number(result.Tension) || 0;
    }
    return 0;
  }
  
  /**
   * Suggest next chords based on current chord.
   * 
   * @param currentChord - Current chord
   * @param key - Key context
   * @param options - Additional options
   * @returns Array of chord suggestions
   * 
   * @example
   * const explorer = new HarmonyExplorer();
   * const suggestions = await explorer.suggestNextChords(
   *   { root: 'g', quality: 'major' },
   *   { root: 'c', mode: 'major' }
   * );
   */
  async suggestNextChords(
    currentChord: ChordInfo,
    key: KeyInfo,
    options: { count?: number } = {}
  ): Promise<ChordSuggestion[]> {
    await this.ensureKBLoaded();
    
    const { count = 5 } = options;
    
    // Analyze current chord
    const currentAnalysis = await this.analyzeChord(currentChord, key);
    
    // Query Prolog for valid progressions
    const results = await this.adapter.queryAll(
      `chord_tendency(${currentAnalysis.function}, NextFunction)`
    );
    
    const suggestions: ChordSuggestion[] = [];
    const keyRoot = NOTE_TO_SEMITONE[key.root.toLowerCase()] ?? 0;
    const degrees = key.mode === 'minor' ? MINOR_DEGREES : MAJOR_DEGREES;
    const scale = key.mode === 'minor' ? MINOR_SCALE : MAJOR_SCALE;
    
    for (const result of results) {
      if (!result.NextFunction) continue;
      
      const nextFunc = String(result.NextFunction) as HarmonicFunction;
      
      // Find chords with this function
      for (let i = 0; i < degrees.length; i++) {
        const degreeInfo = degrees[i];
        const scaleOffset = scale[i];
        if (!degreeInfo || scaleOffset === undefined) continue;

        if (degreeInfo.func === nextFunc) {
          const chordRoot = (keyRoot + scaleOffset) % 12;
          const chord: ChordInfo = {
            root: SEMITONE_TO_NOTE[chordRoot] ?? 'c',
            quality: degreeInfo.quality
          };
          
          // Calculate confidence based on voice leading
          let confidence = 80;
          if (nextFunc === 'tonic') confidence = 90;
          if (currentAnalysis.function === 'dominant' && nextFunc === 'tonic') confidence = 95;
          
          suggestions.push({
            chord,
            numeral: degreeInfo.numeral,
            reason: `${currentAnalysis.function} → ${nextFunc}`,
            confidence
          });
        }
      }
    }
    
    // Add common substitutions
    if (currentAnalysis.function === 'dominant') {
      // Deceptive resolution (V → vi)
      const viDegree = 5; // 6th degree (0-indexed)
      const viOffset = scale[viDegree];
      if (viOffset !== undefined) {
        const viRoot = (keyRoot + viOffset) % 12;
        suggestions.push({
          chord: { root: SEMITONE_TO_NOTE[viRoot] ?? 'c', quality: 'minor' },
          numeral: key.mode === 'minor' ? 'VI' : 'vi',
          reason: 'Deceptive resolution',
          confidence: 75
        });
      }
    }
    
    // Sort by confidence and limit
    suggestions.sort((a, b) => b.confidence - a.confidence);
    return suggestions.slice(0, count);
  }
  
  /**
   * Analyze a single chord in a key context.
   */
  async analyzeChord(chord: ChordInfo, key: KeyInfo): Promise<ChordAnalysis> {
    await this.ensureKBLoaded();
    
    const keyRoot = NOTE_TO_SEMITONE[key.root.toLowerCase()] ?? 0;
    const chordRoot = NOTE_TO_SEMITONE[chord.root.toLowerCase()] ?? 0;
    const interval = (chordRoot - keyRoot + 12) % 12;
    
    const scale = key.mode === 'minor' ? MINOR_SCALE : MAJOR_SCALE;
    const degrees = key.mode === 'minor' ? MINOR_DEGREES : MAJOR_DEGREES;
    
    // Find which scale degree this is
    const degreeIndex = scale.indexOf(interval);
    
    if (degreeIndex >= 0) {
      const degreeInfo = degrees[degreeIndex];
      if (!degreeInfo) {
        return {
          numeral: '?',
          degree: 0,
          function: 'subdominant',
          tension: 3,
          isDiatonic: false,
          borrowedFrom: 'chromatic'
        };
      }
      const degree = degreeIndex + 1;
      const tension = await this.getTension(degree);
      
      // Check if quality matches expected diatonic chord
      const isDiatonic = chord.quality === degreeInfo.quality ||
        (chord.quality.includes('7') && degreeInfo.quality !== 'dim');
      
      // Determine if chord is borrowed
      let borrowedFrom: string | null = null;
      if (!isDiatonic) {
        if (key.mode === 'major' && chord.quality === 'minor' && degreeIndex === 0) {
          borrowedFrom = 'parallel minor';
        }
      }
      
      return {
        numeral: degreeInfo.numeral + (chord.quality.includes('7') ? '7' : ''),
        degree,
        function: degreeInfo.func,
        tension,
        isDiatonic,
        ...(borrowedFrom ? { borrowedFrom } : {})
      };
    }
    
    // Non-diatonic chord
    return {
      numeral: '?',
      degree: 0,
      function: 'subdominant', // Default
      tension: 3,
      isDiatonic: false,
      borrowedFrom: 'chromatic'
    };
  }
  
  /**
   * Analyze a chord progression.
   * 
   * @param chords - Array of chords
   * @returns Progression analysis
   */
  async analyzeProgression(chords: ChordInfo[]): Promise<ProgressionAnalysis> {
    await this.ensureKBLoaded();
    
    if (chords.length === 0) {
      return {
        key: { root: 'c', mode: 'major' },
        keyConfidence: 0,
        chordAnalyses: [],
        cadences: [],
        voiceLeadingQuality: 100,
        summary: 'No chords to analyze'
      };
    }
    
    // Detect key
    const key = await this.identifyKey(chords.map(c => 
      NOTE_TO_SEMITONE[c.root.toLowerCase()] ?? 0
    ));
    
    // Analyze each chord
    const chordAnalyses: ChordAnalysis[] = [];
    for (const chord of chords) {
      const analysis = await this.analyzeChord(chord, key);
      chordAnalyses.push(analysis);
    }
    
    // Detect cadences
    const cadences: string[] = [];
    for (let i = 0; i < chordAnalyses.length - 1; i++) {
      const current = chordAnalyses[i];
      const next = chordAnalyses[i + 1];
      if (!current || !next) continue;
      
      if (current.function === 'dominant' && next.function === 'tonic' && next.degree === 1) {
        cadences.push(`Authentic cadence at position ${i + 1}`);
      } else if (current.function === 'subdominant' && next.function === 'tonic' && next.degree === 1) {
        cadences.push(`Plagal cadence at position ${i + 1}`);
      } else if (current.function === 'dominant' && next.degree === 6) {
        cadences.push(`Deceptive cadence at position ${i + 1}`);
      }
    }
    
    // Calculate voice leading quality
    let voiceLeadingQuality = 100;
    const nonDiatonicCount = chordAnalyses.filter(a => !a.isDiatonic).length;
    voiceLeadingQuality -= nonDiatonicCount * 5;
    
    // Generate summary
    const diatonicPercent = Math.round(
      ((chordAnalyses.length - nonDiatonicCount) / chordAnalyses.length) * 100
    );
    
    const summary = `Progression in ${key.root.toUpperCase()} ${key.mode}. ` +
      `${diatonicPercent}% diatonic. ` +
      `${cadences.length} cadence(s) detected.`;
    
    return {
      key,
      keyConfidence: Math.max(50, 100 - nonDiatonicCount * 10),
      chordAnalyses,
      cadences,
      voiceLeadingQuality: Math.max(0, voiceLeadingQuality),
      summary
    };
  }
  
  /**
   * Identify key from a set of pitches.
   * 
   * @param pitchClasses - Array of pitch classes (0-11)
   * @returns Detected key
   */
  async identifyKey(pitchClasses: number[]): Promise<KeyInfo> {
    await this.ensureKBLoaded();
    
    // Use Krumhansl-Schmuckler key-finding algorithm (simplified)
    const majorProfile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
    const minorProfile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
    
    // Count pitch class occurrences
    const counts = new Array(12).fill(0);
    for (const pc of pitchClasses) {
      const index = ((pc % 12) + 12) % 12;
      counts[index] = (counts[index] ?? 0) + 1;
    }
    
    // Normalize
    const total = counts.reduce((a, b) => a + b, 0);
    const normalized = counts.map(c => c / Math.max(total, 1));
    
    let bestKey = 0;
    let bestMode: 'major' | 'minor' = 'major';
    let bestScore = -Infinity;
    
    for (let key = 0; key < 12; key++) {
      // Rotate counts to this key
      const rotated = normalized.map((_, i) => normalized[(i + key) % 12] ?? 0);
      
      // Correlate with major profile
      let majorScore = 0;
      let minorScore = 0;
      for (let i = 0; i < 12; i++) {
        majorScore += (rotated[i] ?? 0) * (majorProfile[i] ?? 0);
        minorScore += (rotated[i] ?? 0) * (minorProfile[i] ?? 0);
      }
      
      if (majorScore > bestScore) {
        bestScore = majorScore;
        bestKey = key;
        bestMode = 'major';
      }
      if (minorScore > bestScore) {
        bestScore = minorScore;
        bestKey = key;
        bestMode = 'minor';
      }
    }
    
    return {
      root: SEMITONE_TO_NOTE[bestKey] ?? 'c',
      mode: bestMode
    };
  }
  
  /**
   * Suggest reharmonization options for chords with a melody.
   */
  async suggestReharmonization(
    melody: number[],
    chords: ChordInfo[],
    key: KeyInfo
  ): Promise<ReharmonizationSuggestion[]> {
    await this.ensureKBLoaded();
    void melody;
    
    const suggestions: ReharmonizationSuggestion[] = [];
    
    for (let i = 0; i < chords.length; i++) {
      const chord = chords[i];
      if (!chord) continue;
      const analysis = await this.analyzeChord(chord, key);
      
      // Tritone substitution for dominant chords
      if (chord.quality === 'dom7' || chord.quality === 'major') {
        if (analysis.function === 'dominant') {
          const chordRoot = NOTE_TO_SEMITONE[chord.root.toLowerCase()] ?? 0;
          const tritoneRoot = (chordRoot + 6) % 12;
          suggestions.push({
            original: chord,
            replacement: { root: SEMITONE_TO_NOTE[tritoneRoot] ?? 'c', quality: 'dom7' },
            substitutionType: 'tritone',
            explanation: 'Tritone substitution - shares the same tritone interval'
          });
        }
      }
      
      // Relative major/minor substitution
      if (chord.quality === 'major' && analysis.degree !== 1) {
        const chordRoot = NOTE_TO_SEMITONE[chord.root.toLowerCase()] ?? 0;
        const relMinorRoot = (chordRoot + 9) % 12;
        suggestions.push({
          original: chord,
          replacement: { root: SEMITONE_TO_NOTE[relMinorRoot] ?? 'c', quality: 'minor' },
          substitutionType: 'relative',
          explanation: 'Relative minor - shares same notes'
        });
      }
      
      // ii-V substitution
      if (analysis.function === 'dominant' && i > 0) {
        const chordRoot = NOTE_TO_SEMITONE[chord.root.toLowerCase()] ?? 0;
        const iiRoot = (chordRoot + 5) % 12;
        suggestions.push({
          original: chord,
          replacement: { root: SEMITONE_TO_NOTE[iiRoot] ?? 'c', quality: 'min7' },
          substitutionType: 'ii-V',
          explanation: 'ii-V approach - prepares dominant with supertonic'
        });
      }
    }
    
    return suggestions;
  }
  
  /**
   * Suggest modulation path between keys.
   */
  async suggestModulation(
    currentKey: KeyInfo,
    targetKey: KeyInfo
  ): Promise<ModulationPath> {
    await this.ensureKBLoaded();
    
    const currentRoot = NOTE_TO_SEMITONE[currentKey.root.toLowerCase()] ?? 0;
    const targetRoot = NOTE_TO_SEMITONE[targetKey.root.toLowerCase()] ?? 0;
    const interval = (targetRoot - currentRoot + 12) % 12;
    
    const steps: string[] = [];
    const pivotChords: ChordInfo[] = [];
    
    // Close key modulation (within 1-2 accidentals)
    if (interval === 7 || interval === 5) {
      // Circle of fifths modulation
      const dominantRoot = (currentRoot + 7) % 12;
      pivotChords.push({ root: SEMITONE_TO_NOTE[dominantRoot] ?? 'c', quality: 'dom7' });
      steps.push('Use dominant of target key as pivot');
      steps.push(`V7 of ${targetKey.root} ${targetKey.mode} resolves to target tonic`);
    } else if (interval === 0 && currentKey.mode !== targetKey.mode) {
      // Parallel mode change
      pivotChords.push({ 
        root: currentKey.root, 
        quality: targetKey.mode === 'minor' ? 'minor' : 'major' 
      });
      steps.push('Direct parallel mode change');
      steps.push('Use shared tonic with changed quality');
    } else {
      // Distant modulation via shared chord
      // Use ii of target as pivot
      const iiRoot = (targetRoot + 2) % 12;
      pivotChords.push({ root: SEMITONE_TO_NOTE[iiRoot] ?? 'c', quality: 'minor' });
      
      const V7Root = (targetRoot + 7) % 12;
      pivotChords.push({ root: SEMITONE_TO_NOTE[V7Root] ?? 'c', quality: 'dom7' });
      
      steps.push(`Pivot through ii of ${targetKey.root} ${targetKey.mode}`);
      steps.push('Follow with V7 of target key');
      steps.push('Resolve to target tonic');
    }
    
    return {
      targetKey,
      pivotChords,
      steps
    };
  }
  
  /**
   * Score voice leading quality between two chords.
   */
  async scoreVoiceLeading(chord1: ChordInfo, chord2: ChordInfo): Promise<number> {
    await this.ensureKBLoaded();
    
    const root1 = NOTE_TO_SEMITONE[chord1.root.toLowerCase()] ?? 0;
    const root2 = NOTE_TO_SEMITONE[chord2.root.toLowerCase()] ?? 0;
    const rootMovement = Math.min(
      Math.abs(root1 - root2),
      12 - Math.abs(root1 - root2)
    );
    
    // Score based on root movement
    let score = 100;
    if (rootMovement === 5 || rootMovement === 7) {
      score = 90; // Perfect fourth/fifth - strong
    } else if (rootMovement === 3 || rootMovement === 4) {
      score = 85; // Third - smooth
    } else if (rootMovement === 2) {
      score = 80; // Step - okay
    } else if (rootMovement === 1) {
      score = 75; // Half-step - chromatic
    } else if (rootMovement === 6) {
      score = 70; // Tritone - tense
    }
    
    return score;
  }
}

/**
 * Create a new harmony explorer instance.
 */
export function createHarmonyExplorer(
  adapter: PrologAdapter = getPrologAdapter()
): HarmonyExplorer {
  return new HarmonyExplorer(adapter);
}
