/**
 * @fileoverview Prolog-Based Phrase Adapter
 * 
 * Enhanced phrase adaptation using Prolog knowledge base for voice-leading
 * analysis and intelligent note mapping.
 * 
 * L221-L240: Prolog-enhanced phrase adaptation
 * 
 * @module @cardplay/ai/adaptation/prolog-phrase-adapter
 */

import { getPrologAdapter, PrologAdapter } from '../engine/prolog-adapter';
import { loadMusicTheoryKB } from '../knowledge/music-theory-loader';
import { loadPhraseAdaptationKB } from '../knowledge/phrase-adaptation-loader';

// =============================================================================
// Types
// =============================================================================

/**
 * A note in a phrase.
 */
export interface PhraseNote {
  /** MIDI pitch (0-127) */
  readonly pitch: number;
  /** Start time in ticks */
  readonly start: number;
  /** Duration in ticks */
  readonly duration: number;
  /** Velocity (0-127) */
  readonly velocity: number;
}

/**
 * Chord context for adaptation.
 */
export interface ChordTarget {
  /** Root note name (e.g., 'c', 'fsharp') */
  readonly root: string;
  /** Chord quality (e.g., 'major', 'minor', 'dom7') */
  readonly quality: string;
}

/**
 * Scale context for adaptation.
 */
export interface ScaleTarget {
  /** Root note name */
  readonly root: string;
  /** Scale type (e.g., 'major', 'minor') */
  readonly scale: string;
}

/**
 * Adaptation mode.
 */
export type AdaptMode = 
  | 'transpose'      // Simple transposition
  | 'chord-tone'     // Map to chord tones
  | 'scale-degree'   // Preserve scale degrees
  | 'voice-leading'; // Optimize voice leading

/**
 * Adaptation options.
 */
export interface AdaptOptions {
  /** Adaptation mode */
  readonly mode: AdaptMode;
  /** Preserve original rhythm */
  readonly preserveRhythm?: boolean;
  /** Preserve melodic contour */
  readonly preserveContour?: boolean;
  /** Allow chromatic passing tones */
  readonly allowChromaticism?: boolean;
  /** Pitch range constraint */
  readonly pitchRange?: { min: number; max: number };
  /** Voice leading smoothness weight (0-1) */
  readonly voiceLeadingWeight?: number;
}

/**
 * Adaptation result.
 */
export interface AdaptResult {
  /** Adapted notes */
  readonly notes: PhraseNote[];
  /** Mode used */
  readonly mode: AdaptMode;
  /** Quality score (0-100) */
  readonly quality: number;
  /** Explanation of adaptation */
  readonly explanation: string;
}

/**
 * Similarity result.
 */
export interface SimilarityResult {
  /** Overall similarity (0-100) */
  readonly overall: number;
  /** Rhythm similarity (0-100) */
  readonly rhythm: number;
  /** Contour similarity (0-100) */
  readonly contour: number;
  /** Interval similarity (0-100) */
  readonly intervals: number;
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

const CHORD_INTERVALS: Record<string, number[]> = {
  'major': [0, 4, 7],
  'minor': [0, 3, 7],
  'dim': [0, 3, 6],
  'aug': [0, 4, 8],
  'dom7': [0, 4, 7, 10],
  'maj7': [0, 4, 7, 11],
  'min7': [0, 3, 7, 10],
  'dim7': [0, 3, 6, 9],
  'sus4': [0, 5, 7],
  'sus2': [0, 2, 7]
};

const SCALE_INTERVALS: Record<string, number[]> = {
  'major': [0, 2, 4, 5, 7, 9, 11],
  'minor': [0, 2, 3, 5, 7, 8, 10],
  'dorian': [0, 2, 3, 5, 7, 9, 10],
  'mixolydian': [0, 2, 4, 5, 7, 9, 10]
};

function getChordTones(chord: ChordTarget): number[] {
  const root = NOTE_TO_SEMITONE[chord.root.toLowerCase()] ?? 0;
  const intervals = CHORD_INTERVALS[chord.quality] ?? CHORD_INTERVALS['major'];
  if (!intervals) return [root];
  return intervals.map(i => (root + i) % 12);
}

function getScaleTones(scale: ScaleTarget): number[] {
  const root = NOTE_TO_SEMITONE[scale.root.toLowerCase()] ?? 0;
  const intervals = SCALE_INTERVALS[scale.scale] ?? SCALE_INTERVALS['major'];
  if (!intervals) return [root];
  return intervals.map(i => (root + i) % 12);
}

// =============================================================================
// Prolog Phrase Adapter Class
// =============================================================================

/**
 * Prolog-based phrase adapter for intelligent note adaptation.
 */
export class PrologPhraseAdapter {
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
    await loadPhraseAdaptationKB(this.adapter);
    this.kbLoaded = true;
  }
  
  /**
   * Calculate voice leading cost using Prolog.
   */
  private async getVoiceLeadingCost(pitch1: number, pitch2: number): Promise<number> {
    await this.ensureKBLoaded();
    
    const result = await this.adapter.querySingle(
      `voice_leading_cost(${pitch1}, ${pitch2}, Cost)`
    );
    
    if (result !== null) {
      return Number(result.Cost) || 10;
    }
    return 10; // Default moderate cost
  }
  
  /**
   * Find nearest chord tone using Prolog.
   */
  private async findNearestChordTone(
    pitchClass: number,
    chordTones: number[]
  ): Promise<number> {
    await this.ensureKBLoaded();
    
    const tonesStr = `[${chordTones.join(',')}]`;
    const result = await this.adapter.querySingle(
      `nearest_chord_tone(${pitchClass}, ${tonesStr}, Nearest)`
    );
    
    if (result !== null) {
      return Number(result.Nearest);
    }
    
    // Fallback: find nearest manually
    let nearest = chordTones[0] ?? 0;
    let minDist = 12;
    for (const ct of chordTones) {
      const dist = Math.min(
        Math.abs(pitchClass - ct),
        12 - Math.abs(pitchClass - ct)
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = ct;
      }
    }
    return nearest;
  }
  
  /**
   * Check if contour matches using Prolog.
   */
  private async checkContourMatch(
    orig1: number, orig2: number,
    new1: number, new2: number
  ): Promise<boolean> {
    await this.ensureKBLoaded();
    
    const result = await this.adapter.querySingle(
      `contour_matches(${orig1}, ${orig2}, ${new1}, ${new2})`
    );
    
    return result !== null;
  }
  
  /**
   * Adapt a phrase to a target chord.
   * 
   * @param phrase - Original phrase notes
   * @param sourceChord - Source chord context
   * @param targetChord - Target chord to adapt to
   * @param options - Adaptation options
   * @returns Adaptation result
   * 
   * @example
   * const adapter = new PrologPhraseAdapter();
   * const result = await adapter.adaptToChord(
   *   phrase,
   *   { root: 'c', quality: 'major' },
   *   { root: 'g', quality: 'major' },
   *   { mode: 'chord-tone', preserveContour: true }
   * );
   */
  async adaptToChord(
    phrase: PhraseNote[],
    sourceChord: ChordTarget,
    targetChord: ChordTarget,
    options: AdaptOptions = { mode: 'chord-tone' }
  ): Promise<AdaptResult> {
    await this.ensureKBLoaded();
    
    const {
      mode = 'chord-tone',
      _preserveRhythm = true,
      preserveContour = true,
      _allowChromaticism = false,
      pitchRange,
      _voiceLeadingWeight = 0.5
    } = options as AdaptOptions & { _preserveRhythm?: boolean; _allowChromaticism?: boolean; _voiceLeadingWeight?: number };
    void _preserveRhythm;
    void _allowChromaticism;
    void _voiceLeadingWeight;
    
    const sourceRoot = NOTE_TO_SEMITONE[sourceChord.root.toLowerCase()] ?? 0;
    const targetRoot = NOTE_TO_SEMITONE[targetChord.root.toLowerCase()] ?? 0;
    const sourceChordTones = getChordTones(sourceChord);
    const targetChordTones = getChordTones(targetChord);
    
    const adaptedNotes: PhraseNote[] = [];
    let totalQuality = 0;
    
    for (let i = 0; i < phrase.length; i++) {
      const note = phrase[i];
      if (!note) continue;
      
      const pitchClass = note.pitch % 12;
      const octave = Math.floor(note.pitch / 12);
      
      let newPitchClass: number;
      let quality = 100;
      
      switch (mode) {
        case 'transpose': {
          // Simple transposition
          const transposition = targetRoot - sourceRoot;
          newPitchClass = (pitchClass + transposition + 12) % 12;
          break;
        }
        
        case 'chord-tone': {
          // Map to chord tones
          if (sourceChordTones.includes(pitchClass)) {
            // It's a chord tone - map to corresponding chord tone
            const chordToneIndex = sourceChordTones.indexOf(pitchClass);
            newPitchClass = targetChordTones[chordToneIndex % targetChordTones.length] ?? 0;
          } else {
            // Non-chord tone - find nearest in target
            newPitchClass = await this.findNearestChordTone(
              (pitchClass - sourceRoot + targetRoot + 12) % 12,
              targetChordTones
            );
            quality = 80; // Slightly lower quality for non-chord tones
          }
          break;
        }
        
        case 'scale-degree': {
          // Preserve scale degree
          const sourceScale = getScaleTones({ root: sourceChord.root, scale: 'major' });
          const targetScale = getScaleTones({ root: targetChord.root, scale: 'major' });
          
          const degreeIndex = sourceScale.indexOf(pitchClass);
          if (degreeIndex >= 0) {
            newPitchClass = targetScale[degreeIndex] ?? 0;
          } else {
            // Find nearest scale degree
            const transposed = (pitchClass - sourceRoot + targetRoot + 12) % 12;
            const nearestIndex = targetScale.reduce((best, tone, idx) => {
              const bestTone = targetScale[best] ?? 0;
              const dist = Math.min(
                Math.abs(transposed - tone),
                12 - Math.abs(transposed - tone)
              );
              const bestDist = Math.min(
                Math.abs(transposed - bestTone),
                12 - Math.abs(transposed - bestTone)
              );
              return dist < bestDist ? idx : best;
            }, 0);
            newPitchClass = targetScale[nearestIndex] ?? 0;
            quality = 75;
          }
          break;
        }
        
        case 'voice-leading': {
          // Optimize for smooth voice leading
          const prevNote = i > 0 ? adaptedNotes[i - 1] : undefined;
          const prevPitch = prevNote ? prevNote.pitch : note.pitch;
          
          // Find chord tone with lowest voice leading cost
          let bestTone = targetChordTones[0] ?? 0;
          let bestCost = Infinity;
          
          for (const tone of targetChordTones) {
            // Try both octave positions
            for (const octaveOffset of [0, 12, -12]) {
              const candidatePitch = octave * 12 + tone + octaveOffset;
              const cost = await this.getVoiceLeadingCost(prevPitch, candidatePitch);
              if (cost < bestCost) {
                bestCost = cost;
                bestTone = tone;
              }
            }
          }
          
          newPitchClass = bestTone;
          quality = Math.max(50, 100 - bestCost * 5);
          break;
        }
        
        default:
          newPitchClass = pitchClass;
      }
      
      // Calculate new pitch maintaining octave
      let newPitch = octave * 12 + newPitchClass;
      
      // Preserve contour if requested
      if (preserveContour && i > 0) {
        const prevOrigNote = phrase[i - 1];
        const prevAdaptedNote = adaptedNotes[i - 1];
        if (prevOrigNote && prevAdaptedNote) {
          const prevOrigPitch = prevOrigNote.pitch;
          const prevNewPitch = prevAdaptedNote.pitch;
          const origInterval = note.pitch - prevOrigPitch;
          
          // Check contour match
          const matches = await this.checkContourMatch(
            prevOrigPitch, note.pitch,
            prevNewPitch, newPitch
          );
          
          if (!matches) {
            // Adjust octave to match contour
            if (origInterval > 0 && newPitch <= prevNewPitch) {
              newPitch += 12;
            } else if (origInterval < 0 && newPitch >= prevNewPitch) {
              newPitch -= 12;
            }
            quality -= 10; // Small penalty for octave adjustment
          }
        }
      }
      
      // Apply pitch range constraint
      if (pitchRange) {
        while (newPitch < pitchRange.min) newPitch += 12;
        while (newPitch > pitchRange.max) newPitch -= 12;
      }
      
      adaptedNotes.push({
        pitch: newPitch,
        start: note.start,
        duration: note.duration,
        velocity: note.velocity
      });
      
      totalQuality += quality;
    }
    
    const avgQuality = phrase.length > 0 ? totalQuality / phrase.length : 100;
    
    return {
      notes: adaptedNotes,
      mode,
      quality: Math.round(avgQuality),
      explanation: this.generateExplanation(mode, sourceChord, targetChord, avgQuality)
    };
  }
  
  /**
   * Generate explanation for the adaptation.
   */
  private generateExplanation(
    mode: AdaptMode,
    source: ChordTarget,
    target: ChordTarget,
    quality: number
  ): string {
    const qualityDesc = quality >= 90 ? 'excellent' : 
                        quality >= 70 ? 'good' :
                        quality >= 50 ? 'acceptable' : 'limited';
    
    switch (mode) {
      case 'transpose':
        return `Transposed from ${source.root} ${source.quality} to ${target.root} ${target.quality} (${qualityDesc} quality)`;
      case 'chord-tone':
        return `Mapped chord tones from ${source.root} to ${target.root} (${qualityDesc} quality)`;
      case 'scale-degree':
        return `Preserved scale degrees while moving from ${source.root} to ${target.root} (${qualityDesc} quality)`;
      case 'voice-leading':
        return `Optimized voice leading from ${source.root} to ${target.root} (${qualityDesc} quality)`;
      default:
        return `Adapted phrase (${qualityDesc} quality)`;
    }
  }
  
  /**
   * Calculate similarity between two phrases.
   * 
   * @param phrase1 - First phrase
   * @param phrase2 - Second phrase
   * @returns Similarity scores
   */
  async calculateSimilarity(
    phrase1: PhraseNote[],
    phrase2: PhraseNote[]
  ): Promise<SimilarityResult> {
    await this.ensureKBLoaded();
    
    // Extract pitch and duration sequences
    const pitches1 = phrase1.map(n => n.pitch);
    const pitches2 = phrase2.map(n => n.pitch);
    const durations1 = phrase1.map(n => n.duration);
    const durations2 = phrase2.map(n => n.duration);
    
    // Calculate rhythm similarity
    let rhythmScore = 100;
    if (durations1.length > 0 && durations2.length > 0) {
      const durStr1 = `[${durations1.join(',')}]`;
      const durStr2 = `[${durations2.join(',')}]`;
      const rhythmResult = await this.adapter.querySingle(
        `rhythm_similarity(${durStr1}, ${durStr2}, Score)`
      );
      if (rhythmResult !== null) {
        rhythmScore = Number(rhythmResult.Score) || 50;
      }
    }
    
    // Calculate contour similarity
    let contourScore = 100;
    if (pitches1.length > 1 && pitches2.length > 1) {
      const pitchStr1 = `[${pitches1.join(',')}]`;
      const pitchStr2 = `[${pitches2.join(',')}]`;
      const contourResult = await this.adapter.querySingle(
        `contour_similarity(${pitchStr1}, ${pitchStr2}, Score)`
      );
      if (contourResult !== null) {
        contourScore = Number(contourResult.Score) || 50;
      }
    }
    
    // Calculate interval similarity
    let intervalScore = 100;
    if (pitches1.length > 1 && pitches2.length > 1) {
      const pitchStr1 = `[${pitches1.join(',')}]`;
      const pitchStr2 = `[${pitches2.join(',')}]`;
      const intervalResult = await this.adapter.querySingle(
        `interval_similarity(${pitchStr1}, ${pitchStr2}, Score)`
      );
      if (intervalResult !== null) {
        intervalScore = Number(intervalResult.Score) || 50;
      }
    }
    
    // Weight the scores
    const overall = Math.round(
      rhythmScore * 0.3 + contourScore * 0.35 + intervalScore * 0.35
    );
    
    return {
      overall,
      rhythm: Math.round(rhythmScore),
      contour: Math.round(contourScore),
      intervals: Math.round(intervalScore)
    };
  }
  
  /**
   * Find similar phrases in a phrase database.
   * 
   * @param targetPhrase - Phrase to match
   * @param phraseDB - Database of phrases to search
   * @param threshold - Minimum similarity threshold (0-100)
   * @returns Matching phrases sorted by similarity
   */
  async findSimilarPhrases(
    targetPhrase: PhraseNote[],
    phraseDB: Array<{ id: string; notes: PhraseNote[] }>,
    threshold: number = 70
  ): Promise<Array<{ id: string; similarity: SimilarityResult }>> {
    const results: Array<{ id: string; similarity: SimilarityResult }> = [];
    
    for (const phrase of phraseDB) {
      const similarity = await this.calculateSimilarity(targetPhrase, phrase.notes);
      
      if (similarity.overall >= threshold) {
        results.push({ id: phrase.id, similarity });
      }
    }
    
    // Sort by overall similarity descending
    results.sort((a, b) => b.similarity.overall - a.similarity.overall);
    
    return results;
  }
}

/**
 * Create a new Prolog phrase adapter instance.
 */
export function createPrologPhraseAdapter(
  adapter: PrologAdapter = getPrologAdapter()
): PrologPhraseAdapter {
  return new PrologPhraseAdapter(adapter);
}
