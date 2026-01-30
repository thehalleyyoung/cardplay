/**
 * @file Deck Referents - Making Decks Referable in Natural Language
 * @module gofai/canon/deck-referents
 * 
 * Implements Step 082: Define how deck factories and deck types become referents
 * ("open the waveform editor deck"), including namespaced deck types.
 * 
 * This module provides the infrastructure for referring to CardPlay decks in
 * natural language. Decks can be referred to by:
 * - Type ("the mixer deck", "a piano roll deck")
 * - Instance ("the leftmost deck", "my custom deck")
 * - Name ("the GOFAI deck", "the main editing deck")
 * - Function ("the editor", "the analyzer")
 * 
 * Design principles:
 * - Type-safe: Deck types are typed IDs
 * - Namespace-aware: Extension deck types are namespaced
 * - Fuzzy-matchable: Handles variations and synonyms
 * - UI-integrated: Can resolve to actual deck instances
 * - Persistent: Can refer to saved deck configurations
 * 
 * @see gofai_goalB.md Step 082
 * @see docs/gofai/referents/decks.md
 */

import type { GofaiId, LexemeId } from './types.js';
import { createLexemeId } from './types.js';

// ============================================================================
// Deck Type System
// ============================================================================

/**
 * Identifier for a deck type (factory).
 * 
 * Format: `deck-type:<name>` for core, `namespace:deck-type:<name>` for extensions.
 * 
 * Examples:
 * - `deck-type:piano-roll` — Core piano roll deck
 * - `deck-type:mixer` — Core mixer deck
 * - `my-pack:deck-type:custom-editor` — Extension deck
 */
export type DeckTypeId = string & { readonly __brand: 'DeckTypeId' };

/**
 * Identifier for a deck instance.
 * 
 * Format: Runtime-assigned UUID or persistent user-defined name.
 */
export type DeckInstanceId = string & { readonly __brand: 'DeckInstanceId' };

/**
 * Create a deck type ID.
 */
export function createDeckTypeId(name: string, namespace?: string): DeckTypeId {
  const normalizedName = name.toLowerCase().replace(/\s+/g, '-');
  if (namespace) {
    return `${namespace}:deck-type:${normalizedName}` as DeckTypeId;
  }
  return `deck-type:${normalizedName}` as DeckTypeId;
}

/**
 * Create a deck instance ID.
 */
export function createDeckInstanceId(id: string): DeckInstanceId {
  return id as DeckInstanceId;
}

/**
 * Check if a deck type ID is namespaced (from extension).
 */
export function isDeckTypeNamespaced(id: DeckTypeId): boolean {
  return !id.startsWith('deck-type:');
}

/**
 * Extract namespace from a namespaced deck type ID.
 */
export function getDeckTypeNamespace(id: DeckTypeId): string | undefined {
  if (!isDeckTypeNamespaced(id)) return undefined;
  const colonIdx = id.indexOf(':');
  if (colonIdx === -1) return undefined;
  return id.slice(0, colonIdx);
}

// ============================================================================
// Deck Referent Types
// ============================================================================

/**
 * Ways to refer to a deck.
 */
export type DeckReferenceType =
  | 'type'        // By deck type: "a mixer deck", "the piano roll"
  | 'instance'    // By specific instance: "the leftmost deck", "deck 2"
  | 'name'        // By user-assigned name: "my editor", "the GOFAI deck"
  | 'function'    // By functional role: "the editor", "the analyzer"
  | 'spatial'     // By spatial position: "the top deck", "the right panel"
  | 'contextual'; // By context: "this deck", "the current deck"

/**
 * A reference to a deck (possibly ambiguous).
 */
export interface DeckReferent {
  /** Reference type */
  readonly type: DeckReferenceType;
  
  /** Deck type (if known) */
  readonly deckType?: DeckTypeId;
  
  /** Specific instance (if known) */
  readonly instance?: DeckInstanceId;
  
  /** User-assigned name (if any) */
  readonly name?: string;
  
  /** Functional role (if any) */
  readonly function?: DeckFunctionRole;
  
  /** Spatial descriptor (if any) */
  readonly spatial?: SpatialDescriptor;
  
  /** Whether this is a definite reference ("the" vs "a") */
  readonly definite: boolean;
  
  /** Lexemes that produced this referent */
  readonly source: readonly LexemeId[];
}

/**
 * Functional roles for decks.
 */
export type DeckFunctionRole =
  | 'editor'      // Primary editing interface
  | 'analyzer'    // Analysis/visualization
  | 'mixer'       // Mixing interface
  | 'transport'   // Playback control
  | 'navigator'   // Project navigation
  | 'inspector'   // Detail view/inspector
  | 'custom';     // Extension-defined role

/**
 * Spatial descriptors for deck position.
 */
export interface SpatialDescriptor {
  /** Horizontal position */
  readonly horizontal?: 'left' | 'center' | 'right' | 'leftmost' | 'rightmost';
  
  /** Vertical position */
  readonly vertical?: 'top' | 'middle' | 'bottom' | 'topmost' | 'bottommost';
  
  /** Ordinal position (1st, 2nd, etc.) */
  readonly ordinal?: number;
  
  /** Relative position ("next to", "above", etc.) */
  readonly relative?: {
    readonly anchor: DeckReferent;
    readonly relation: 'next-to' | 'above' | 'below' | 'left-of' | 'right-of';
  };
}

// ============================================================================
// Deck Type Registry
// ============================================================================

/**
 * Metadata about a deck type for GOFAI.
 */
export interface DeckTypeMetadata {
  /** Deck type ID */
  readonly id: DeckTypeId;
  
  /** Display name */
  readonly displayName: string;
  
  /** Description */
  readonly description: string;
  
  /** Primary function */
  readonly function: DeckFunctionRole;
  
  /** Alternative names and synonyms */
  readonly synonyms: readonly string[];
  
  /** Common abbreviations */
  readonly abbreviations: readonly string[];
  
  /** Typical use cases */
  readonly useCases: readonly string[];
  
  /** Whether this deck type is always singleton */
  readonly singleton: boolean;
  
  /** Namespace (if extension) */
  readonly namespace?: string;
  
  /** Version (if extension) */
  readonly version?: string;
}

/**
 * Core deck types.
 */
export const CORE_DECK_TYPES: readonly DeckTypeMetadata[] = [
  {
    id: createDeckTypeId('piano-roll'),
    displayName: 'Piano Roll',
    description: 'Note-based music editor with piano keyboard',
    function: 'editor',
    synonyms: ['piano roll', 'piano editor', 'note editor', 'roll'],
    abbreviations: ['pr', 'roll'],
    useCases: ['editing melodies', 'editing harmonies', 'note entry'],
    singleton: false,
  },
  {
    id: createDeckTypeId('tracker'),
    displayName: 'Tracker',
    description: 'Pattern-based music editor',
    function: 'editor',
    synonyms: ['tracker', 'pattern editor', 'step sequencer'],
    abbreviations: ['trk'],
    useCases: ['step sequencing', 'pattern editing', 'drum programming'],
    singleton: false,
  },
  {
    id: createDeckTypeId('mixer'),
    displayName: 'Mixer',
    description: 'Mixing console with faders and routing',
    function: 'mixer',
    synonyms: ['mixer', 'mixing console', 'console', 'faders'],
    abbreviations: ['mx', 'mix'],
    useCases: ['mixing', 'adjusting levels', 'routing'],
    singleton: true,
  },
  {
    id: createDeckTypeId('stack-builder'),
    displayName: 'Stack Builder',
    description: 'Card chain editor',
    function: 'editor',
    synonyms: ['stack builder', 'chain editor', 'card editor', 'dsp chain'],
    abbreviations: ['sb', 'stack'],
    useCases: ['building effect chains', 'arranging cards', 'routing'],
    singleton: false,
  },
  {
    id: createDeckTypeId('activity-deck'),
    displayName: 'Activity Deck',
    description: 'AI-assisted composition deck',
    function: 'analyzer',
    synonyms: ['activity deck', 'activity', 'ai deck', 'assistant'],
    abbreviations: ['ad', 'activity'],
    useCases: ['ai suggestions', 'guided composition', 'learning'],
    singleton: false,
  },
  {
    id: createDeckTypeId('gofai-deck'),
    displayName: 'GOFAI Deck',
    description: 'Natural language music editing interface',
    function: 'editor',
    synonyms: ['gofai deck', 'gofai', 'language editor', 'nl editor', 'chat'],
    abbreviations: ['gf', 'gofai'],
    useCases: ['natural language editing', 'conversational music editing', 'intent-based editing'],
    singleton: false,
  },
  {
    id: createDeckTypeId('waveform-editor'),
    displayName: 'Waveform Editor',
    description: 'Audio waveform editor',
    function: 'editor',
    synonyms: ['waveform editor', 'audio editor', 'sample editor', 'waveform'],
    abbreviations: ['wave', 'wav'],
    useCases: ['editing audio', 'sample editing', 'waveform manipulation'],
    singleton: false,
  },
  {
    id: createDeckTypeId('graph-report'),
    displayName: 'Graph Report',
    description: 'Project structure visualizer',
    function: 'analyzer',
    synonyms: ['graph report', 'graph viewer', 'structure view', 'inspector'],
    abbreviations: ['graph', 'report'],
    useCases: ['viewing structure', 'debugging routing', 'understanding connections'],
    singleton: true,
  },
];

// ============================================================================
// Deck Referent Resolution
// ============================================================================

/**
 * Result of resolving a deck referent.
 */
export interface DeckReferentResolution {
  /** Was the reference resolved? */
  readonly resolved: boolean;
  
  /** Resolved deck instance(s) (may be multiple if ambiguous) */
  readonly instances: readonly DeckInstanceId[];
  
  /** Confidence score (0-1) */
  readonly confidence: number;
  
  /** Why this resolution (for explanation) */
  readonly reason: string;
  
  /** If ambiguous, clarification question */
  readonly clarification?: string;
  
  /** Alternative interpretations */
  readonly alternatives: readonly DeckReferentResolution[];
}

/**
 * Context for deck referent resolution.
 */
export interface DeckResolutionContext {
  /** Current deck instances in the UI */
  readonly activeDeck instances: readonly {
    readonly id: DeckInstanceId;
    readonly type: DeckTypeId;
    readonly name?: string;
    readonly position: {
      readonly x: number;
      readonly y: number;
      readonly width: number;
      readonly height: number;
    };
  }[];
  
  /** Currently focused/selected deck */
  readonly focusedDeck?: DeckInstanceId;
  
  /** Recently used decks (for recency bias) */
  readonly recentDecks: readonly DeckInstanceId[];
  
  /** User preferences */
  readonly preferences?: {
    readonly defaultEditor?: DeckTypeId;
    readonly deckNaming?: Map<DeckInstanceId, string>;
  };
}

/**
 * Resolve a deck referent to specific instance(s).
 */
export function resolveDeckReferent(
  referent: DeckReferent,
  context: DeckResolutionContext
): DeckReferentResolution {
  // Implementation depends on referent type
  switch (referent.type) {
    case 'type':
      return resolveDeckByType(referent, context);
    
    case 'instance':
      return resolveDeckByInstance(referent, context);
    
    case 'name':
      return resolveDeckByName(referent, context);
    
    case 'function':
      return resolveDeckByFunction(referent, context);
    
    case 'spatial':
      return resolveDeckBySpatial(referent, context);
    
    case 'contextual':
      return resolveDeckByContext(referent, context);
  }
}

function resolveDeckByType(
  referent: DeckReferent,
  context: DeckResolutionContext
): DeckReferentResolution {
  if (!referent.deckType) {
    return {
      resolved: false,
      instances: [],
      confidence: 0,
      reason: 'No deck type specified',
      alternatives: [],
    };
  }
  
  const matching = context.activeDeckInstances.filter(
    deck => deck.type === referent.deckType
  );
  
  if (matching.length === 0) {
    return {
      resolved: false,
      instances: [],
      confidence: 0,
      reason: `No ${referent.deckType} decks are open`,
      clarification: `Would you like to open a ${referent.deckType} deck?`,
      alternatives: [],
    };
  }
  
  if (matching.length === 1 || referent.definite === false) {
    return {
      resolved: true,
      instances: matching.map(d => d.id),
      confidence: 1.0,
      reason: `Found ${matching.length} ${referent.deckType} deck(s)`,
      alternatives: [],
    };
  }
  
  // Multiple matches and definite reference - ambiguous
  return {
    resolved: false,
    instances: matching.map(d => d.id),
    confidence: 0.5,
    reason: `Multiple ${referent.deckType} decks are open`,
    clarification: `Which ${referent.deckType} deck? (${matching.map((d, i) => `${i + 1}: ${d.name || 'unnamed'}`).join(', ')})`,
    alternatives: matching.map((deck, i) => ({
      resolved: true,
      instances: [deck.id],
      confidence: 1.0,
      reason: `Deck ${i + 1}: ${deck.name || deck.id}`,
      alternatives: [],
    })),
  };
}

function resolveDeckByInstance(
  referent: DeckReferent,
  context: DeckResolutionContext
): DeckReferentResolution {
  if (!referent.instance) {
    return {
      resolved: false,
      instances: [],
      confidence: 0,
      reason: 'No instance specified',
      alternatives: [],
    };
  }
  
  const exists = context.activeDeckInstances.some(d => d.id === referent.instance);
  
  if (!exists) {
    return {
      resolved: false,
      instances: [],
      confidence: 0,
      reason: `Deck ${referent.instance} is not open`,
      alternatives: [],
    };
  }
  
  return {
    resolved: true,
    instances: [referent.instance],
    confidence: 1.0,
    reason: `Direct instance reference`,
    alternatives: [],
  };
}

function resolveDeckByName(
  referent: DeckReferent,
  context: DeckResolutionContext
): DeckReferentResolution {
  if (!referent.name) {
    return {
      resolved: false,
      instances: [],
      confidence: 0,
      reason: 'No name specified',
      alternatives: [],
    };
  }
  
  const matching = context.activeDeckInstances.filter(deck => {
    const userAssignedName = context.preferences?.deckNaming?.get(deck.id);
    return userAssignedName?.toLowerCase() === referent.name?.toLowerCase();
  });
  
  if (matching.length === 0) {
    return {
      resolved: false,
      instances: [],
      confidence: 0,
      reason: `No deck named "${referent.name}"`,
      clarification: `Did you mean one of these decks? ${context.activeDeckInstances.map(d => context.preferences?.deckNaming?.get(d.id) || 'unnamed').join(', ')}`,
      alternatives: [],
    };
  }
  
  return {
    resolved: true,
    instances: matching.map(d => d.id),
    confidence: 1.0,
    reason: `Matched by user-assigned name`,
    alternatives: [],
  };
}

function resolveDeckByFunction(
  referent: DeckReferent,
  context: DeckResolutionContext
): DeckReferentResolution {
  if (!referent.function) {
    return {
      resolved: false,
      instances: [],
      confidence: 0,
      reason: 'No function specified',
      alternatives: [],
    };
  }
  
  // Map function to deck types
  const deckTypesForFunction = CORE_DECK_TYPES
    .filter(dt => dt.function === referent.function)
    .map(dt => dt.id);
  
  const matching = context.activeDeckInstances.filter(deck =>
    deckTypesForFunction.includes(deck.type)
  );
  
  if (matching.length === 0) {
    return {
      resolved: false,
      instances: [],
      confidence: 0,
      reason: `No ${referent.function} decks are open`,
      alternatives: [],
    };
  }
  
  // Prefer focused deck if it matches
  if (context.focusedDeck) {
    const focused = matching.find(d => d.id === context.focusedDeck);
    if (focused) {
      return {
        resolved: true,
        instances: [focused.id],
        confidence: 0.9,
        reason: `Focused ${referent.function} deck`,
        alternatives: [],
      };
    }
  }
  
  // Otherwise return all matching
  return {
    resolved: matching.length === 1,
    instances: matching.map(d => d.id),
    confidence: matching.length === 1 ? 1.0 : 0.6,
    reason: `Found ${matching.length} ${referent.function} deck(s)`,
    clarification: matching.length > 1 ? 'Which one?' : undefined,
    alternatives: [],
  };
}

function resolveDeckBySpatial(
  referent: DeckReferent,
  context: DeckResolutionContext
): DeckReferentResolution {
  if (!referent.spatial) {
    return {
      resolved: false,
      instances: [],
      confidence: 0,
      reason: 'No spatial descriptor',
      alternatives: [],
    };
  }
  
  const { horizontal, vertical, ordinal } = referent.spatial;
  let candidates = [...context.activeDeckInstances];
  
  // Filter by horizontal position
  if (horizontal) {
    candidates = filterByHorizontalPosition(candidates, horizontal);
  }
  
  // Filter by vertical position
  if (vertical) {
    candidates = filterByVerticalPosition(candidates, vertical);
  }
  
  // Select by ordinal
  if (ordinal !== undefined && ordinal > 0 && ordinal <= candidates.length) {
    const selected = candidates[ordinal - 1];
    if (selected) {
      return {
        resolved: true,
        instances: [selected.id],
        confidence: 0.9,
        reason: `Spatial position: ${ordinal}${getOrdinalSuffix(ordinal)}`,
        alternatives: [],
      };
    }
  }
  
  return {
    resolved: candidates.length === 1,
    instances: candidates.map(d => d.id),
    confidence: candidates.length === 1 ? 0.9 : 0.5,
    reason: 'Spatial position',
    clarification: candidates.length > 1 ? 'Multiple decks match this position' : undefined,
    alternatives: [],
  };
}

function resolveDeckByContext(
  referent: DeckReferent,
  context: DeckResolutionContext
): DeckReferentResolution {
  // "this deck", "the current deck" → focused deck
  if (context.focusedDeck) {
    return {
      resolved: true,
      instances: [context.focusedDeck],
      confidence: 0.95,
      reason: 'Currently focused deck',
      alternatives: [],
    };
  }
  
  return {
    resolved: false,
    instances: [],
    confidence: 0,
    reason: 'No deck is currently focused',
    clarification: 'Which deck do you mean?',
    alternatives: [],
  };
}

// Helper functions

function filterByHorizontalPosition(
  decks: readonly any[],
  position: string
): readonly any[] {
  const sorted = [...decks].sort((a, b) => a.position.x - b.position.x);
  
  switch (position) {
    case 'left':
      return sorted.slice(0, Math.ceil(sorted.length / 3));
    case 'center':
      const third = Math.floor(sorted.length / 3);
      return sorted.slice(third, 2 * third);
    case 'right':
      return sorted.slice(-Math.ceil(sorted.length / 3));
    case 'leftmost':
      return sorted.slice(0, 1);
    case 'rightmost':
      return sorted.slice(-1);
    default:
      return sorted;
  }
}

function filterByVerticalPosition(
  decks: readonly any[],
  position: string
): readonly any[] {
  const sorted = [...decks].sort((a, b) => a.position.y - b.position.y);
  
  switch (position) {
    case 'top':
      return sorted.slice(0, Math.ceil(sorted.length / 3));
    case 'middle':
      const third = Math.floor(sorted.length / 3);
      return sorted.slice(third, 2 * third);
    case 'bottom':
      return sorted.slice(-Math.ceil(sorted.length / 3));
    case 'topmost':
      return sorted.slice(0, 1);
    case 'bottommost':
      return sorted.slice(-1);
    default:
      return sorted;
  }
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0] || '';
}

// ============================================================================
// Lexeme Bindings for Decks
// ============================================================================

/**
 * Generate lexeme bindings for deck referents.
 * 
 * This creates lexemes like:
 * - "piano roll" → deck-type:piano-roll
 * - "the mixer" → deck-type:mixer (definite)
 * - "open the tracker" → action + deck-type:tracker
 */
export function generateDeckLexemes(): readonly { readonly word: string; readonly deckType: DeckTypeId }[] {
  const lexemes: { readonly word: string; readonly deckType: DeckTypeId }[] = [];
  
  for (const deckType of CORE_DECK_TYPES) {
    // Add display name
    lexemes.push({ word: deckType.displayName.toLowerCase(), deckType: deckType.id });
    
    // Add synonyms
    for (const synonym of deckType.synonyms) {
      lexemes.push({ word: synonym.toLowerCase(), deckType: deckType.id });
    }
    
    // Add abbreviations
    for (const abbr of deckType.abbreviations) {
      lexemes.push({ word: abbr.toLowerCase(), deckType: deckType.id });
    }
  }
  
  return lexemes;
}
