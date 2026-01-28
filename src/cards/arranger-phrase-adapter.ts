/**
 * @fileoverview Arranger-Phrase Database Integration.
 * 
 * Wires the ArrangerCard to the phrase database for:
 * - Loading/saving arrangement blocks as phrases
 * - Searching phrases by chord progressions
 * - Suggesting phrase variations based on context
 * - Maintaining phrase usage statistics
 * 
 * @module @cardplay/integration/arranger-phrase-adapter
 * @see INTEGRATION_FIXES_CHECKLIST.md Phase C.8
 */

import type { Event } from '../types/event';
import { asTick } from '../types/primitives';
import type { 
  PhraseDatabase, 
  PhraseMetadata,
  PhraseRecord, 
  DecoupledPhrase,
  ShapeContour,
  RhythmPattern,
  PhraseQueryAdvanced,
  MoodTag,
  GenreTag,
  LineType,
} from './phrase-system';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Arrangement block that can be saved as a phrase.
 */
export interface ArrangementBlock<P = unknown> {
  readonly id: string;
  readonly trackId: string;
  readonly startTick: number;
  readonly duration: number;
  readonly events: readonly Event<P>[];
  readonly name?: string;
  readonly color?: string;
  readonly muted?: boolean;
}

/**
 * Chord context for phrase matching.
 */
export interface ChordContext {
  readonly rootNote: number;    // 0-11 pitch class
  readonly quality: string;     // 'major', 'minor', 'dim', 'aug', etc.
  readonly bassNote?: number;   // For slash chords
  readonly extensions: readonly number[];  // 7, 9, 11, 13
}

/**
 * Scale context for phrase matching.
 */
export interface ScaleContext {
  readonly rootNote: number;    // 0-11 pitch class
  readonly scaleType: string;   // 'major', 'minor', 'dorian', etc.
  readonly key: string;         // 'C', 'D#', etc.
}

/**
 * Arrangement context for intelligent phrase suggestions.
 */
export interface ArrangementContext {
  readonly currentChord?: ChordContext;
  readonly nextChord?: ChordContext;
  readonly scale?: ScaleContext;
  readonly tempo: number;
  readonly timeSignature: { numerator: number; denominator: number };
  readonly position: number;    // Beat position in measure
  readonly sectionType?: string; // 'verse', 'chorus', 'bridge', etc.
}

/**
 * Phrase suggestion with relevance score.
 */
export interface PhraseSuggestion<P = unknown> {
  readonly phrase: PhraseRecord<P>;
  readonly score: number;
  readonly transposition: number;  // Semitones to transpose
  readonly reason: string;
}

/**
 * Options for phrase operations.
 */
export interface PhraseOperationOptions {
  /** Whether to update usage statistics */
  trackUsage?: boolean;
  /** Whether to create a ghost copy or full copy */
  createGhost?: boolean;
  /** Tags to add when saving */
  tags?: readonly string[];
  /** Mood tags for categorization */
  mood?: readonly MoodTag[];
  /** Genre tags for categorization */
  genre?: readonly GenreTag[];
}

// ============================================================================
// ARRANGER-PHRASE ADAPTER
// ============================================================================

/**
 * ArrangerPhraseAdapter - Bridges ArrangerCard with PhraseDatabase.
 */
export class ArrangerPhraseAdapter<P = unknown> {
  private database: PhraseDatabase<P>;
  private cache: Map<string, PhraseRecord<P>> = new Map();
  private suggestionsCache: Map<string, PhraseSuggestion<P>[]> = new Map();
  private subscribers: Set<() => void> = new Set();
  
  constructor(database: PhraseDatabase<P>) {
    this.database = database;
  }
  
  // ========== BLOCK → PHRASE OPERATIONS ==========
  
  /**
   * Save an arrangement block as a new phrase in the database.
   */
  async saveBlockAsPhrase(
    block: ArrangementBlock<P>,
    name: string,
    options: PhraseOperationOptions = {}
  ): Promise<string> {
    // Extract decoupled phrase from events
    const phrase = this.extractDecoupledPhrase(block);
    const now = Date.now();
    
    const phraseId = await this.database.add({
      name,
      events: block.events,
      phrase,
      metadata: this.buildPhraseMetadata(block, options),
      ghosts: [],
      variations: [],
      parentId: null,
      tags: options.tags ?? [],
      rating: 0,
      isFavorite: false,
      isGhost: false,
      modifiedAt: now,
      lastUsedAt: now,
    });
    
    // Clear suggestions cache since database changed
    this.suggestionsCache.clear();
    this.notifySubscribers();
    
    return phraseId;
  }
  
  /**
   * Load a phrase from database as an arrangement block.
   */
  async loadPhraseAsBlock(
    phraseId: string,
    trackId: string,
    startTick: number,
    options: PhraseOperationOptions = {}
  ): Promise<ArrangementBlock<P> | null> {
    let phrase = this.cache.get(phraseId);
    
    if (!phrase) {
      phrase = await this.database.get(phraseId) ?? undefined;
      if (phrase) {
        this.cache.set(phraseId, phrase);
      }
    }
    
    if (!phrase) return null;
    
    // Update usage statistics
    if (options.trackUsage !== false) {
      await this.database.update(phraseId, {
        usageCount: phrase.usageCount + 1,
      });
    }
    
    // Offset events to start at the specified tick
    const offsetEvents = this.offsetEvents(phrase.events, startTick);
    const duration = this.calculateDuration(phrase.events);
    
    return {
      id: options.createGhost ? `ghost-${phraseId}-${Date.now()}` : `block-${Date.now()}`,
      trackId,
      startTick,
      duration,
      events: offsetEvents,
      name: phrase.name,
    };
  }
  
  /**
   * Update an existing phrase from a modified block.
   */
  async updatePhraseFromBlock(
    phraseId: string,
    block: ArrangementBlock<P>
  ): Promise<void> {
    const decoupled = this.extractDecoupledPhrase(block);
    
    await this.database.update(phraseId, {
      events: block.events,
      phrase: decoupled,
      modifiedAt: Date.now(),
    });
    
    // Clear cache
    this.cache.delete(phraseId);
    this.suggestionsCache.clear();
    this.notifySubscribers();
  }
  
  // ========== PHRASE SEARCH & SUGGESTIONS ==========
  
  /**
   * Search phrases by text query.
   */
  async searchPhrases(query: string): Promise<readonly PhraseRecord<P>[]> {
    return this.database.search(query);
  }
  
  /**
   * Query phrases with advanced filters.
   */
  async queryPhrases(query: PhraseQueryAdvanced): Promise<readonly PhraseRecord<P>[]> {
    return this.database.query(query);
  }
  
  /**
   * Get phrase suggestions based on current arrangement context.
   */
  async getSuggestions(
    context: ArrangementContext,
    limit: number = 10
  ): Promise<readonly PhraseSuggestion<P>[]> {
    const cacheKey = this.buildContextCacheKey(context);
    
    if (this.suggestionsCache.has(cacheKey)) {
      return this.suggestionsCache.get(cacheKey)!;
    }
    
    // Build query based on context
    const query: PhraseQueryAdvanced = {
      limit: limit * 3, // Get extra for filtering
    };
    
    // Get base phrases
    const phrases = await this.database.query(query);
    
    // Score and rank phrases
    const suggestions: PhraseSuggestion<P>[] = phrases
      .map(phrase => this.scorePhrase(phrase, context))
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    this.suggestionsCache.set(cacheKey, suggestions);
    return suggestions;
  }
  
  /**
   * Find phrases similar to a given phrase.
   */
  async findSimilar(
    phraseId: string,
    limit: number = 10
  ): Promise<readonly PhraseRecord<P>[]> {
    return this.database.findSimilar(phraseId, limit);
  }
  
  /**
   * Get variations of a parent phrase.
   */
  async getVariations(phraseId: string): Promise<readonly PhraseRecord<P>[]> {
    return this.database.getVariationsOf(phraseId);
  }
  
  // ========== TRANSPOSITION ==========
  
  /**
   * Get phrase transposed to match current chord.
   */
  async getTransposedPhrase(
    phraseId: string,
    targetChord: ChordContext
  ): Promise<PhraseRecord<P> | null> {
    const phrase = await this.database.get(phraseId);
    if (!phrase) return null;
    
    // Calculate transposition from original key to target
    const originalRoot = phrase.metadata?.originalKey 
      ? this.keyToMidi(phrase.metadata.originalKey)
      : 0;
    const semitones = targetChord.rootNote - originalRoot;
    
    return this.database.transpose(phrase, semitones);
  }
  
  /**
   * Get phrases that work over a specific chord progression.
   */
  async getPhrasesForProgression(
    chords: readonly ChordContext[]
  ): Promise<readonly PhraseSuggestion<P>[]> {
    const suggestions: PhraseSuggestion<P>[] = [];
    
    for (const chord of chords) {
      const context: ArrangementContext = {
        currentChord: chord,
        tempo: 120,
        timeSignature: { numerator: 4, denominator: 4 },
        position: 0,
      };
      
      const chordSuggestions = await this.getSuggestions(context, 3);
      suggestions.push(...chordSuggestions);
    }
    
    // Deduplicate by phrase ID
    const seen = new Set<string>();
    return suggestions.filter(s => {
      if (seen.has(s.phrase.id)) return false;
      seen.add(s.phrase.id);
      return true;
    });
  }
  
  // ========== FAVORITES & RATING ==========
  
  /**
   * Toggle phrase favorite status.
   */
  async toggleFavorite(phraseId: string): Promise<boolean> {
    const phrase = await this.database.get(phraseId);
    if (!phrase) return false;
    
    const newFavorite = !phrase.isFavorite;
    await this.database.update(phraseId, { isFavorite: newFavorite });
    
    this.cache.delete(phraseId);
    this.notifySubscribers();
    
    return newFavorite;
  }
  
  /**
   * Rate a phrase.
   */
  async ratePhrase(phraseId: string, rating: number): Promise<void> {
    const clampedRating = Math.max(0, Math.min(5, rating));
    await this.database.update(phraseId, { rating: clampedRating });
    
    this.cache.delete(phraseId);
    this.notifySubscribers();
  }
  
  /**
   * Get favorite phrases.
   */
  async getFavorites(): Promise<readonly PhraseRecord<P>[]> {
    const all = await this.database.export();
    return all.filter(p => p.isFavorite === true);
  }
  
  /**
   * Get top-rated phrases.
   */
  async getTopRated(limit: number = 20): Promise<readonly PhraseRecord<P>[]> {
    return this.database.query({ 
      minRating: 4,
      sortBy: 'rating',
      sortOrder: 'desc',
      limit,
    });
  }
  
  /**
   * Get most used phrases.
   */
  async getMostUsed(limit: number = 20): Promise<readonly PhraseRecord<P>[]> {
    return this.database.query({
      sortBy: 'usageCount',
      sortOrder: 'desc',
      limit,
    });
  }
  
  // ========== DATABASE MANAGEMENT ==========
  
  /**
   * Get database statistics.
   */
  async getStats(): Promise<{
    totalPhrases: number;
    byLineType: Record<string, number>;
    byMood: Record<MoodTag, number>;
    byGenre: Record<GenreTag, number>;
    averageRating: number;
  }> {
    return this.database.getStats();
  }
  
  /**
   * Export all phrases.
   */
  async exportPhrases(): Promise<readonly PhraseRecord<P>[]> {
    return this.database.export();
  }
  
  /**
   * Import phrases.
   */
  async importPhrases(phrases: readonly PhraseRecord<P>[]): Promise<void> {
    await this.database.import(phrases);
    this.cache.clear();
    this.suggestionsCache.clear();
    this.notifySubscribers();
  }
  
  /**
   * Delete a phrase.
   */
  async deletePhrase(phraseId: string): Promise<void> {
    await this.database.delete(phraseId);
    this.cache.delete(phraseId);
    this.suggestionsCache.clear();
    this.notifySubscribers();
  }
  
  // ========== SUBSCRIPTION ==========
  
  /**
   * Subscribe to database changes.
   */
  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
  
  // ========== PRIVATE METHODS ==========
  
  private extractDecoupledPhrase(block: ArrangementBlock<P>): DecoupledPhrase {
    // Extract shape contour from note pitches
    const shape = this.extractShapeContour(block.events);
    
    // Extract rhythm pattern from note timings
    const rhythm = this.extractRhythmPattern(block.events, block.duration);
    
    return {
      shape,
      rhythm,
      chords: null, // Would need chord analysis
      scale: null,  // Would need scale analysis
      dynamics: null,
    };
  }
  
  private extractShapeContour(events: readonly Event<P>[]): ShapeContour | null {
    if (events.length === 0) return null;
    
    // Get note events with pitch
    const noteEvents = events.filter(e => 
      (e.payload as any)?.pitch !== undefined
    );
    
    if (noteEvents.length === 0) return null;
    
    // Find pitch range
    const pitches = noteEvents.map(e => (e.payload as any).pitch as number);
    const minPitch = Math.min(...pitches);
    const maxPitch = Math.max(...pitches);
    const range = maxPitch - minPitch || 1;
    
    // Find time range
    const times = noteEvents.map(e => e.start as number);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const timeRange = maxTime - minTime || 1;
    
    // Create contour points
    const points = noteEvents.map(e => ({
      position: ((e.start as number) - minTime) / timeRange,
      value: ((e.payload as any).pitch - minPitch) / range,
    }));
    
    return {
      id: `contour-${Date.now()}`,
      name: 'Extracted',
      interpolation: 'smooth',
      points,
    };
  }
  
  private extractRhythmPattern(
    events: readonly Event<P>[],
    totalDuration: number
  ): RhythmPattern | null {
    if (events.length === 0 || totalDuration === 0) return null;
    
    // Get note events
    const noteEvents = events.filter(e => 
      (e.payload as any)?.pitch !== undefined
    );
    
    if (noteEvents.length === 0) return null;
    
    // Create rhythm steps
    const steps = noteEvents.map(e => {
      const velocity = (e.payload as any)?.velocity ?? 100;
      const duration = e.duration;
      
      return {
        position: e.start,
        duration,
        accent: velocity / 127,
      };
    });
    
    return {
      id: `rhythm-${Date.now()}`,
      name: 'Extracted',
      steps,
      length: totalDuration,
    };
  }
  
  private inferLineType(block: ArrangementBlock<P>): LineType {
    // Analyze events to guess line type
    const events = block.events;
    if (events.length === 0) return 'melody';
    
    const pitches = events
      .filter(e => (e.payload as any)?.pitch !== undefined)
      .map(e => (e.payload as any).pitch as number);
    
    if (pitches.length === 0) return 'drums';
    
    const avgPitch = pitches.reduce((a, b) => a + b, 0) / pitches.length;
    
    // Simple heuristics
    if (avgPitch < 48) return 'bass';
    if (avgPitch > 72) return 'melody';
    if (events.length > 20 && avgPitch >= 48 && avgPitch <= 72) return 'chords';
    
    return 'melody';
  }
  
  private inferKey(block: ArrangementBlock<P>): string {
    // Simple key detection based on pitch classes
    const events = block.events;
    const pitchClasses = new Map<number, number>();
    
    for (const event of events) {
      const pitch = (event.payload as any)?.pitch;
      if (pitch !== undefined) {
        const pc = pitch % 12;
        pitchClasses.set(pc, (pitchClasses.get(pc) ?? 0) + 1);
      }
    }
    
    // Find most common pitch class
    let maxCount = 0;
    let rootPc = 0;
    for (const [pc, count] of pitchClasses) {
      if (count > maxCount) {
        maxCount = count;
        rootPc = pc;
      }
    }
    
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return noteNames[rootPc] ?? 'C';
  }
  
  private offsetEvents(events: readonly Event<P>[], offset: number): Event<P>[] {
    return events.map(e => {
      const start = asTick((e.start as number) + offset);
      return {
        ...e,
        start,
        tick: start,
        startTick: start,
      };
    });
  }
  
  private calculateDuration(events: readonly Event<P>[]): number {
    if (events.length === 0) return 0;
    
    let maxEnd = 0;
    for (const event of events) {
      const end = (event.start as number) + (event.duration as number);
      if (end > maxEnd) maxEnd = end;
    }
    
    return maxEnd;
  }
  
  private scorePhrase(
    phrase: PhraseRecord<P>,
    context: ArrangementContext
  ): PhraseSuggestion<P> {
    let score = 0;
    let transposition = 0;
    const reasons: string[] = [];
    
    // Base score from rating and usage
    score += (phrase.rating / 5) * 20;
    score += Math.min(phrase.usageCount, 100) / 10;
    
    // Boost favorites
    if (phrase.isFavorite) {
      score += 15;
      reasons.push('Favorite');
    }
    
    // Match by line type for section context
    if (context.sectionType && phrase.metadata?.lineType) {
      const typeMatch = this.matchLineTypeToSection(
        phrase.metadata.lineType,
        context.sectionType
      );
      if (typeMatch) {
        score += 10;
        reasons.push(`Good for ${context.sectionType}`);
      }
    }
    
    // Match tempo (within 20% is acceptable)
    if (phrase.metadata?.originalTempo && context.tempo) {
      const tempoRatio = context.tempo / phrase.metadata.originalTempo;
      if (tempoRatio >= 0.8 && tempoRatio <= 1.2) {
        score += 10;
      } else if (tempoRatio >= 0.5 && tempoRatio <= 2) {
        score += 5;
      }
    }
    
    // Calculate transposition needed
    if (context.currentChord && phrase.metadata?.originalKey) {
      const originalRoot = this.keyToMidi(phrase.metadata.originalKey);
      transposition = context.currentChord.rootNote - originalRoot;
      
      // Normalize to -6 to +6 semitones
      while (transposition > 6) transposition -= 12;
      while (transposition < -6) transposition += 12;
      
      // Small transposition is preferred
      const transpositionPenalty = Math.abs(transposition) * 2;
      score -= transpositionPenalty;
      
      if (transposition !== 0) {
        reasons.push(`Transpose ${transposition > 0 ? '+' : ''}${transposition}`);
      }
    }
    
    // Match mood tags
    if (phrase.metadata?.mood && context.sectionType) {
      const expectedMoods = this.getMoodsForSection(context.sectionType);
      const moodMatch = phrase.metadata.mood.some(m => 
        expectedMoods.includes(m)
      );
      if (moodMatch) {
        score += 8;
        reasons.push('Mood match');
      }
    }
    
    const reason = reasons.length > 0 
      ? reasons.join(', ')
      : 'General match';
    
    return {
      phrase,
      score: Math.max(0, score),
      transposition,
      reason,
    };
  }
  
  private matchLineTypeToSection(lineType: string, section: string): boolean {
    const sectionLineTypes: Record<string, LineType[]> = {
      'verse': ['melody', 'chords', 'bass'],
      'chorus': ['melody', 'harmony', 'bass'],
      'bridge': ['melody', 'countermelody'],
      'intro': ['melody', 'pad', 'chords'],
      'outro': ['melody', 'pad'],
      'drop': ['bass', 'melody', 'drums'],
      'breakdown': ['pad', 'chords'],
    };
    
    const types = sectionLineTypes[section.toLowerCase()];
    return types?.includes(lineType as LineType) ?? true;
  }
  
  private getMoodsForSection(section: string): MoodTag[] {
    const sectionMoods: Record<string, MoodTag[]> = {
      'verse': ['calm', 'relaxed', 'melancholic'],
      'chorus': ['happy', 'energetic', 'triumphant'],
      'bridge': ['tense', 'mysterious'],
      'intro': ['mysterious', 'calm'],
      'outro': ['peaceful', 'melancholic'],
      'drop': ['energetic', 'aggressive'],
    };
    
    return sectionMoods[section.toLowerCase()] ?? [];
  }

  private buildPhraseMetadata(
    block: ArrangementBlock<P>,
    options: PhraseOperationOptions
  ): PhraseMetadata {
    const noteEvents = block.events.filter(e => (e.payload as any)?.pitch !== undefined);
    const duration = this.calculateDuration(block.events);
    const lineType = this.inferLineType(block);
    const pitches = noteEvents
      .map(e => (e.payload as any)?.pitch as number | undefined)
      .filter((p): p is number => typeof p === 'number');

    const noteCount = pitches.length;
    const low = noteCount > 0 ? Math.min(...pitches) : 0;
    const high = noteCount > 0 ? Math.max(...pitches) : 0;
    const ambitus = high - low;

    const beats = duration > 0 ? duration / 480 : 0;
    const density = beats > 0 ? noteCount / beats : 0;

    const orderedPitches = noteEvents
      .slice()
      .sort((a, b) => (a.start as number) - (b.start as number))
      .map(e => (e.payload as any)?.pitch as number | undefined)
      .filter((p): p is number => typeof p === 'number');

    let averageInterval = 0;
    if (orderedPitches.length > 1) {
      let sum = 0;
      for (let i = 1; i < orderedPitches.length; i++) {
        const current = orderedPitches[i];
        const previous = orderedPitches[i - 1];
        if (current === undefined || previous === undefined) continue;
        sum += Math.abs(current - previous);
      }
      averageInterval = sum / (orderedPitches.length - 1);
    }

    const contourType =
      orderedPitches.length < 2
        ? 'flat'
        : orderedPitches[orderedPitches.length - 1]! > orderedPitches[0]!
          ? 'ascending'
          : orderedPitches[orderedPitches.length - 1]! < orderedPitches[0]!
            ? 'descending'
            : 'flat';

    return {
      lineType,
      duration,
      noteCount,
      range: [low, high],
      ambitus,
      density,
      averageInterval,
      contourType,
      rhythmComplexity: 0,
      harmonicContent: [],
      mood: options.mood ?? [],
      genre: options.genre ?? [],
      instrument: null,
      originalKey: this.inferKey(block),
      originalTempo: 120,
      originalTimeSignature: { numerator: 4, denominator: 4 },
    };
  }
  
  private keyToMidi(key: string): number {
    const noteMap: Record<string, number> = {
      'C': 0, 'C#': 1, 'Db': 1,
      'D': 2, 'D#': 3, 'Eb': 3,
      'E': 4, 'Fb': 4,
      'F': 5, 'F#': 6, 'Gb': 6,
      'G': 7, 'G#': 8, 'Ab': 8,
      'A': 9, 'A#': 10, 'Bb': 10,
      'B': 11, 'Cb': 11,
    };
    return noteMap[key] ?? 0;
  }
  
  private buildContextCacheKey(context: ArrangementContext): string {
    const parts = [
      context.currentChord?.rootNote ?? 'none',
      context.currentChord?.quality ?? 'none',
      context.tempo,
      context.position,
      context.sectionType ?? 'none',
    ];
    return parts.join('-');
  }
  
  private notifySubscribers(): void {
    for (const callback of this.subscribers) {
      callback();
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Creates an ArrangerPhraseAdapter instance.
 */
export function createArrangerPhraseAdapter<P>(
  database: PhraseDatabase<P>
): ArrangerPhraseAdapter<P> {
  return new ArrangerPhraseAdapter(database);
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let adapterInstance: ArrangerPhraseAdapter<unknown> | null = null;

/**
 * Get or create the singleton adapter instance.
 * Requires database to be provided on first call.
 */
export function getArrangerPhraseAdapter<P>(
  database?: PhraseDatabase<P>
): ArrangerPhraseAdapter<P> {
  if (!adapterInstance && database) {
    adapterInstance = new ArrangerPhraseAdapter(database);
  }
  if (!adapterInstance) {
    throw new Error('ArrangerPhraseAdapter not initialized. Provide database on first call.');
  }
  return adapterInstance as ArrangerPhraseAdapter<P>;
}
