/**
 * @fileoverview Feature Derivation from Board Definitions (Change 378)
 * 
 * Derives feature availability for personas based on actual board definitions
 * rather than hardcoded tables. Each board declares which decks it includes,
 * and deck types map to features.
 * 
 * This ensures:
 * - Features are derived from implementation
 * - No drift between hardcoded tables and actual boards
 * - Extensible as new boards/decks are added
 * 
 * @module @cardplay/ai/queries/feature-derivation
 * @see Change 378
 */

import { BoardRegistry } from '../../boards/registry';
import type { Board, DeckType } from '../../boards/types';
import type { FeatureId } from '../../canon/feature-ids';

// ============================================================================
// DECK TYPE → FEATURE MAPPING
// ============================================================================

/**
 * Map deck types to the features they provide.
 * This is the canonical mapping from implementation to features.
 */
const DECK_TYPE_TO_FEATURES: ReadonlyMap<DeckType, readonly FeatureId[]> = new Map([
  // Pattern/Tracker decks
  ['pattern-deck', ['feature:pattern:editor', 'feature:pattern:variations']],
  ['phrases-deck', ['feature:pattern:library', 'feature:pattern:templates']],
  
  // Notation decks
  ['notation-deck', ['feature:notation:score-layout', 'feature:notation:engraving']],
  
  // Session/Arrangement
  ['session-deck', ['feature:arrangement:clips', 'feature:arrangement:structure']],
  ['arrangement-deck', ['feature:arrangement:timeline', 'feature:arrangement:sections']],
  ['arranger-deck', ['feature:arrangement:structure']],
  
  // Harmony/Theory
  ['harmony-deck', ['feature:theory:harmony-explorer', 'feature:theory:cadence-suggestions']],
  ['generators-deck', ['feature:theory:generators']],
  
  // Mixing/Production
  ['mixer-deck', ['feature:production:mixing', 'feature:production:bus-routing']],
  ['mix-bus-deck', ['feature:production:bus-routing']],
  ['track-groups-deck', ['feature:production:track-organization']],
  ['automation-deck', ['feature:production:automation']],
  
  // Sound Design
  ['effects-deck', ['feature:sound-design:effect-chains']],
  ['dsp-chain', ['feature:sound-design:effect-chains']],
  ['routing-deck', ['feature:sound-design:modulation-routing']],
  ['modulation-matrix-deck', ['feature:sound-design:modulation-routing']],
  
  // Instruments/Samples
  ['instruments-deck', ['feature:sound-design:instrument-browser']],
  ['samples-deck', ['feature:sound-design:sample-browser']],
  ['sample-manager-deck', ['feature:sound-design:sample-management']],
  
  // Analysis/Visualization
  ['spectrum-analyzer-deck', ['feature:production:frequency-balance']],
  ['waveform-editor-deck', ['feature:production:waveform-editing']],
  ['reference-track-deck', ['feature:production:reference-tracks']],
  
  // AI/Learning
  ['ai-advisor-deck', ['feature:ai:advisor', 'feature:ai:suggestions']],
  
  // Utility
  ['transport-deck', ['feature:workflow:transport-control']],
  ['properties-deck', ['feature:workflow:inspector']],
  ['piano-roll-deck', ['feature:pattern:piano-roll']],
]);

// ============================================================================
// PERSONA → BOARD MAPPING
// ============================================================================

/**
 * Map personas to their typical/recommended boards.
 * This can be derived from board tags or metadata.
 */
export type PersonaId = 
  | 'notation-composer'
  | 'tracker-user'
  | 'sound-designer'
  | 'producer';

/**
 * Get boards that match a persona based on board tags/metadata.
 */
export function getBoardsForPersona(
  personaId: PersonaId,
  registry?: BoardRegistry
): readonly Board[] {
  const boardRegistry = registry || new BoardRegistry();
  const allBoards = boardRegistry.list();
  
  // Map persona to board tags
  const personaTags = getPersonaTags(personaId);
  
  return allBoards.filter(board => {
    if (!board.tags) return false;
    return personaTags.some(tag => board.tags!.includes(tag));
  });
}

/**
 * Get tags associated with a persona.
 */
function getPersonaTags(personaId: PersonaId): readonly string[] {
  switch (personaId) {
    case 'notation-composer':
      return ['notation', 'composition', 'orchestration', 'score'];
    case 'tracker-user':
      return ['tracker', 'pattern', 'lofi', 'chiptune', 'beat'];
    case 'sound-designer':
      return ['synthesis', 'sound-design', 'modular', 'effects'];
    case 'producer':
      return ['production', 'mixing', 'mastering', 'arrangement'];
  }
}

// ============================================================================
// FEATURE DERIVATION
// ============================================================================

/**
 * Feature availability level.
 */
export type FeatureAvailability = 'available' | 'limited' | 'not-available';

/**
 * Feature availability for a persona.
 */
export interface PersonaFeature {
  readonly featureId: FeatureId;
  readonly availability: FeatureAvailability;
  readonly providedBy: readonly DeckType[]; // Which deck types provide this feature
  readonly boardsWithFeature: readonly string[]; // Which boards include decks with this feature
}

/**
 * Derive features available to a persona based on their typical boards.
 * 
 * This is the canonical implementation of Change 378: feature availability
 * is derived from board definitions rather than hardcoded tables.
 * 
 * @param personaId - The persona to analyze
 * @param registry - Optional board registry (for testing)
 * @returns Features available to this persona
 */
export function deriveFeaturesForPersona(
  personaId: PersonaId,
  registry?: BoardRegistry
): readonly PersonaFeature[] {
  const boards = getBoardsForPersona(personaId, registry);
  
  // Collect all features from all boards
  const featureMap = new Map<FeatureId, {
    deckTypes: Set<DeckType>;
    boards: Set<string>;
  }>();
  
  for (const board of boards) {
    for (const deck of board.decks) {
      const features = DECK_TYPE_TO_FEATURES.get(deck.type);
      if (!features) continue;
      
      for (const featureId of features) {
        let entry = featureMap.get(featureId);
        if (!entry) {
          entry = { deckTypes: new Set(), boards: new Set() };
          featureMap.set(featureId, entry);
        }
        entry.deckTypes.add(deck.type);
        entry.boards.add(board.id);
      }
    }
  }
  
  // Convert to PersonaFeature array
  const features: PersonaFeature[] = [];
  for (const [featureId, { deckTypes, boards: boardIds }] of featureMap) {
    features.push({
      featureId,
      availability: 'available', // If it's in their boards, it's available
      providedBy: Array.from(deckTypes),
      boardsWithFeature: Array.from(boardIds),
    });
  }
  
  return features;
}

/**
 * Derive all features across all personas.
 * 
 * @param registry - Optional board registry (for testing)
 * @returns Map of persona ID to features
 */
export function deriveAllPersonaFeatures(
  registry?: BoardRegistry
): ReadonlyMap<PersonaId, readonly PersonaFeature[]> {
  const personas: PersonaId[] = [
    'notation-composer',
    'tracker-user',
    'sound-designer',
    'producer',
  ];
  
  return new Map(
    personas.map(persona => [persona, deriveFeaturesForPersona(persona, registry)])
  );
}

/**
 * Check if a feature is available to a persona.
 * 
 * @param personaId - The persona
 * @param featureId - The feature to check
 * @param registry - Optional board registry (for testing)
 * @returns Whether the feature is available
 */
export function isFeatureAvailableForPersona(
  personaId: PersonaId,
  featureId: FeatureId,
  registry?: BoardRegistry
): boolean {
  const features = deriveFeaturesForPersona(personaId, registry);
  return features.some(f => f.featureId === featureId && f.availability !== 'not-available');
}

/**
 * Get features by category (derived from feature IDs).
 * 
 * @param category - Feature category prefix (e.g., 'pattern', 'notation')
 * @returns Features in that category across all personas
 */
export function getFeaturesByCategory(category: string): readonly FeatureId[] {
  const allFeatures = new Set<FeatureId>();
  
  for (const features of DECK_TYPE_TO_FEATURES.values()) {
    for (const feature of features) {
      if (feature.startsWith(`feature:${category}:`)) {
        allFeatures.add(feature);
      }
    }
  }
  
  return Array.from(allFeatures);
}

// ============================================================================
// EXTENSION POINTS
// ============================================================================

/**
 * Register additional deck type → feature mappings.
 * Allows extensions to add new deck types with their features.
 * 
 * @param deckType - The deck type
 * @param features - Features provided by this deck type
 */
export function registerDeckFeatures(
  deckType: DeckType,
  features: readonly FeatureId[]
): void {
  // Create mutable map if needed (currently immutable)
  // For now, log that this is aspirational
  console.info(`[Feature Derivation] Would register ${deckType} → [${features.join(', ')}]`);
  console.info('Extension registration not yet implemented; modify DECK_TYPE_TO_FEATURES constant');
}

/**
 * Get all features that any deck provides.
 * Useful for exhaustive feature lists.
 * 
 * @returns Set of all feature IDs
 */
export function getAllKnownFeatures(): ReadonlySet<FeatureId> {
  const features = new Set<FeatureId>();
  for (const featureList of DECK_TYPE_TO_FEATURES.values()) {
    for (const feature of featureList) {
      features.add(feature);
    }
  }
  return features;
}
