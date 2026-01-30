/**
 * @fileoverview Theory Card Registry (Change 281)
 * 
 * Central registry for all theory card definitions. Allows extensions to
 * register additional theory cards with namespaced IDs.
 * 
 * @module @cardplay/ai/theory/theory-card-registry
 */

import type { TheoryCardDef } from './theory-cards';
import {
  CONSTRAINT_PACK_CARD,
  TONALITY_MODEL_CARD,
  METER_ACCENT_CARD,
  GROUPING_CARD,
  SCHEMA_CARD,
  FILM_SCORING_CARD,
  CARNATIC_RAGA_TALA_CARD,
  CELTIC_TUNE_CARD,
  CHINESE_MODE_CARD,
  TRAILER_BUILD_CARD,
  LEITMOTIF_LIBRARY_CARD,
  LEITMOTIF_MATCHER_CARD,
  FILM_LEITMOTIF_INTEGRATION_CARD,
  DRONE_CARD,
  MRIDANGAM_PATTERN_CARD,
  KORVAI_GENERATOR_CARD,
  ORNAMENT_GENERATOR_CARD,
  BODHRAN_CARD,
  HETEROPHONY_CARD,
  GUZHENG_GLISS_CARD,
  ERHU_ORNAMENT_CARD,
  TONALITY_ANALYSIS_CARD,
  GROUPING_ANALYSIS_CARD,
  SCHEMA_ANALYSIS_CARD,
  CULTURE_ANALYSIS_CARD,
  SCHEMA_BROWSER_CARD,
  SCHEMA_TO_CHORDS_CARD,
  SCHEMA_TO_BASS_CARD,
  SCHEMA_TO_MELODY_CARD,
  SCHEMA_VARIATION_CARD,
  SCHEMA_CONSTRAINT_CARD,
  PARENT_SCALE_CARD,
  CHORD_SCALE_UNITY_CARD,
  UPPER_STRUCTURE_CARD,
  TONAL_GRAVITY_VISUALIZER_CARD,
  REHARMONIZATION_CARD,
  TRITONE_SUB_CARD,
  COLTRANE_CHANGES_CARD,
  BEBOP_SCALE_CARD,
  ENCLOSURE_CARD,
  DIGITAL_PATTERN_CARD,
  GUIDE_TONE_CARD,
  LICK_LIBRARY_CARD,
  FILL_BUILDER_CARD,
  MOTIF_DEVELOPER_CARD,
  OUTSIDE_CARD,
  SET_BUILDER_CARD,
  LYDIAN_CHROMATIC_CARD,
} from './theory-cards';

// ============================================================================
// BUILTIN THEORY CARDS
// ============================================================================

/**
 * All builtin theory card definitions.
 * These use the 'theory:' namespace prefix.
 */
export const BUILTIN_THEORY_CARDS: readonly TheoryCardDef[] = [
  CONSTRAINT_PACK_CARD,
  TONALITY_MODEL_CARD,
  METER_ACCENT_CARD,
  GROUPING_CARD,
  SCHEMA_CARD,
  FILM_SCORING_CARD,
  CARNATIC_RAGA_TALA_CARD,
  CELTIC_TUNE_CARD,
  CHINESE_MODE_CARD,
  TRAILER_BUILD_CARD,
  LEITMOTIF_LIBRARY_CARD,
  LEITMOTIF_MATCHER_CARD,
  FILM_LEITMOTIF_INTEGRATION_CARD,
  DRONE_CARD,
  MRIDANGAM_PATTERN_CARD,
  KORVAI_GENERATOR_CARD,
  ORNAMENT_GENERATOR_CARD,
  BODHRAN_CARD,
  HETEROPHONY_CARD,
  GUZHENG_GLISS_CARD,
  ERHU_ORNAMENT_CARD,
  TONALITY_ANALYSIS_CARD,
  GROUPING_ANALYSIS_CARD,
  SCHEMA_ANALYSIS_CARD,
  CULTURE_ANALYSIS_CARD,
  SCHEMA_BROWSER_CARD,
  SCHEMA_TO_CHORDS_CARD,
  SCHEMA_TO_BASS_CARD,
  SCHEMA_TO_MELODY_CARD,
  SCHEMA_VARIATION_CARD,
  SCHEMA_CONSTRAINT_CARD,
  PARENT_SCALE_CARD,
  CHORD_SCALE_UNITY_CARD,
  UPPER_STRUCTURE_CARD,
  TONAL_GRAVITY_VISUALIZER_CARD,
  REHARMONIZATION_CARD,
  TRITONE_SUB_CARD,
  COLTRANE_CHANGES_CARD,
  BEBOP_SCALE_CARD,
  ENCLOSURE_CARD,
  DIGITAL_PATTERN_CARD,
  GUIDE_TONE_CARD,
  LICK_LIBRARY_CARD,
  FILL_BUILDER_CARD,
  MOTIF_DEVELOPER_CARD,
  OUTSIDE_CARD,
  SET_BUILDER_CARD,
  LYDIAN_CHROMATIC_CARD,
];

// ============================================================================
// THEORY CARD REGISTRY
// ============================================================================

/**
 * Registry of theory card definitions by card ID.
 */
class TheoryCardRegistry {
  private readonly cards = new Map<string, TheoryCardDef>();
  
  constructor() {
    // Register all builtin cards
    for (const card of BUILTIN_THEORY_CARDS) {
      this.cards.set(card.cardId, card);
    }
  }
  
  /**
   * Register a theory card.
   * Extension cards must use namespaced IDs (e.g., 'mypack:custom_card').
   * 
   * @throws Error if card ID is not namespaced (unless it's a builtin override)
   * @throws Error if card ID is already registered
   */
  register(card: TheoryCardDef): void {
    // Check if ID is already registered
    if (this.cards.has(card.cardId)) {
      throw new Error(
        `Theory card '${card.cardId}' is already registered. ` +
        `Use a unique namespaced ID for custom cards (e.g., 'mypack:${card.cardId}').`
      );
    }
    
    // Check namespacing for non-builtin cards
    const isBuiltin = card.cardId.startsWith('theory:');
    if (!isBuiltin && !card.cardId.includes(':')) {
      throw new Error(
        `Custom theory card '${card.cardId}' must use a namespaced ID ` +
        `(e.g., 'mypack:${card.cardId}'). Only builtin cards may use the 'theory:' prefix.`
      );
    }
    
    this.cards.set(card.cardId, card);
  }
  
  /**
   * Unregister a theory card.
   * Builtin cards cannot be unregistered.
   * 
   * @returns true if card was unregistered, false if not found or is builtin
   */
  unregister(cardId: string): boolean {
    // Prevent unregistering builtin cards
    if (cardId.startsWith('theory:')) {
      console.warn(`Cannot unregister builtin theory card '${cardId}'`);
      return false;
    }
    
    return this.cards.delete(cardId);
  }
  
  /**
   * Get a theory card definition by ID.
   */
  get(cardId: string): TheoryCardDef | undefined {
    return this.cards.get(cardId);
  }
  
  /**
   * Check if a theory card is registered.
   */
  has(cardId: string): boolean {
    return this.cards.has(cardId);
  }
  
  /**
   * Get all registered theory card IDs.
   */
  getAllIds(): readonly string[] {
    return Array.from(this.cards.keys());
  }
  
  /**
   * Get all registered theory card definitions.
   */
  getAll(): readonly TheoryCardDef[] {
    return Array.from(this.cards.values());
  }
  
  /**
   * Get theory cards by category.
   */
  getByCategory(category: TheoryCardDef['category']): readonly TheoryCardDef[] {
    return Array.from(this.cards.values()).filter(card => card.category === category);
  }
  
  /**
   * Get theory cards by culture affinity.
   */
  getByCulture(culture: string): readonly TheoryCardDef[] {
    return Array.from(this.cards.values()).filter(
      card => card.cultures.includes(culture as any)
    );
  }
  
  /**
   * Clear all non-builtin cards from the registry.
   */
  clearExtensions(): void {
    const extensionIds = Array.from(this.cards.keys()).filter(
      id => !id.startsWith('theory:')
    );
    
    for (const id of extensionIds) {
      this.cards.delete(id);
    }
  }
  
  /**
   * Get the number of registered cards.
   */
  get size(): number {
    return this.cards.size;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Singleton theory card registry instance.
 */
const theoryCardRegistry = new TheoryCardRegistry();

/**
 * Get the theory card registry.
 */
export function getTheoryCardRegistry(): TheoryCardRegistry {
  return theoryCardRegistry;
}

/**
 * Register a theory card (convenience function).
 */
export function registerTheoryCard(card: TheoryCardDef): void {
  theoryCardRegistry.register(card);
}

/**
 * Get a theory card definition (convenience function).
 */
export function getTheoryCard(cardId: string): TheoryCardDef | undefined {
  return theoryCardRegistry.get(cardId);
}

/**
 * Get all theory cards (convenience function).
 */
export function getAllTheoryCards(): readonly TheoryCardDef[] {
  return theoryCardRegistry.getAll();
}

/**
 * Validate that all card IDs in a list are registered.
 * 
 * @throws Error if any card ID is not registered
 */
export function validateTheoryCardIds(cardIds: readonly string[]): void {
  const missing = cardIds.filter(id => !theoryCardRegistry.has(id));
  
  if (missing.length > 0) {
    throw new Error(
      `Unknown theory card IDs: ${missing.join(', ')}. ` +
      `All card IDs must be registered in the theory card registry.`
    );
  }
}
