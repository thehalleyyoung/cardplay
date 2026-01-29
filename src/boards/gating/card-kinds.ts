/**
 * @fileoverview Card Kind Classification
 * 
 * Classifies cards into kinds based on their metadata (category, tags).
 * This classification drives runtime gating logic.
 * 
 * @module @cardplay/boards/gating/card-kinds
 */

import type { CardMeta } from '../../cards/card';
import type { ControlLevel } from '../types';

// ============================================================================
// CARD KIND TAXONOMY
// ============================================================================

/**
 * Card kind determines availability based on board control level.
 */
export type BoardCardKind =
  | 'manual'        // User-controlled instruments/effects
  | 'hint'          // Visual hints (harmony, scale overlays)
  | 'assisted'      // Phrase libraries, templates
  | 'collaborative' // Interactive co-creation tools
  | 'generative';   // AI generators, arrangers

// ============================================================================
// CLASSIFICATION LOGIC
// ============================================================================

/**
 * Classifies a card into one or more kinds based on its metadata.
 * A card can belong to multiple kinds.
 */
export function classifyCard(meta: CardMeta): readonly BoardCardKind[] {
  const kinds: BoardCardKind[] = [];
  
  // Core editors are always manual
  if (isEditorCard(meta)) {
    kinds.push('manual');
    return kinds;
  }
  
  // Classify by category
  switch (meta.category) {
    case 'generators':
      // Playable instruments are manual
      if (hasTags(meta, ['playable', 'instrument', 'sampler', 'wavetable'])) {
        kinds.push('manual');
      }
      // Generators are generative unless tagged otherwise
      else if (hasTags(meta, ['phrase', 'template'])) {
        kinds.push('assisted');
      } else {
        kinds.push('generative');
      }
      break;
      
    case 'effects':
    case 'filters':
      // Effects are manual
      kinds.push('manual');
      break;
      
    case 'transforms':
      // Transforms can be manual or assisted
      if (hasTags(meta, ['quantize', 'humanize'])) {
        kinds.push('manual');
      } else if (hasTags(meta, ['phrase', 'adaptation'])) {
        kinds.push('assisted');
      } else {
        kinds.push('manual');
      }
      break;
      
    case 'analysis':
      // Analysis cards provide hints
      if (hasTags(meta, ['harmony', 'scale', 'chord'])) {
        kinds.push('hint');
      } else {
        kinds.push('manual');
      }
      break;
      
    case 'utilities':
      kinds.push('manual');
      break;
      
    case 'routing':
      kinds.push('manual');
      break;
      
    case 'custom':
      // Custom cards default to manual unless tagged
      if (hasTags(meta, ['ai', 'generator'])) {
        kinds.push('generative');
      } else if (hasTags(meta, ['phrase', 'library'])) {
        kinds.push('assisted');
      } else {
        kinds.push('manual');
      }
      break;
  }
  
  // Explicit tag overrides
  if (hasTags(meta, ['hint', 'overlay', 'guide'])) {
    if (!kinds.includes('hint')) {
      kinds.push('hint');
    }
  }
  
  if (hasTags(meta, ['collaborative', 'copilot'])) {
    if (!kinds.includes('collaborative')) {
      kinds.push('collaborative');
    }
  }
  
  // Default to manual if no classification
  if (kinds.length === 0) {
    kinds.push('manual');
  }
  
  return Object.freeze(kinds);
}

/**
 * Checks if a card is a core editor (tracker, notation, piano roll).
 */
function isEditorCard(meta: CardMeta): boolean {
  const editorIds = [
    'tracker',
    'notation',
    'piano-roll',
    'session-view',
    'arrangement',
  ];
  
  return editorIds.includes(meta.id) || 
         hasTags(meta, ['editor', 'view']);
}

/**
 * Checks if a card has any of the specified tags.
 */
function hasTags(meta: CardMeta, targetTags: string[]): boolean {
  if (!meta.tags) return false;
  return targetTags.some(tag => meta.tags?.includes(tag));
}

// ============================================================================
// CONTROL LEVEL → ALLOWED KINDS MAPPING
// ============================================================================

/**
 * Maps control level to allowed card kinds.
 */
export function getAllowedKindsForControlLevel(
  controlLevel: ControlLevel
): readonly BoardCardKind[] {
  switch (controlLevel) {
    case 'full-manual':
      return ['manual'];
      
    case 'manual-with-hints':
      return ['manual', 'hint'];
      
    case 'assisted':
      return ['manual', 'hint', 'assisted'];
      
    case 'collaborative':
      return ['manual', 'hint', 'assisted', 'collaborative'];
      
    case 'directed':
      return ['manual', 'hint', 'assisted', 'collaborative', 'generative'];
      
    case 'generative':
      return ['manual', 'hint', 'assisted', 'collaborative', 'generative'];
  }
}

/**
 * Checks if a card kind is allowed at a control level.
 */
export function isKindAllowed(
  kind: BoardCardKind,
  controlLevel: ControlLevel
): boolean {
  const allowed = getAllowedKindsForControlLevel(controlLevel);
  return allowed.includes(kind);
}

/**
 * Checks if any of a card's kinds are allowed at a control level.
 */
export function isCardKindAllowed(
  meta: CardMeta,
  controlLevel: ControlLevel
): boolean {
  const cardKinds = classifyCard(meta);
  const allowedKinds = getAllowedKindsForControlLevel(controlLevel);
  
  return cardKinds.some(kind => allowedKinds.includes(kind));
}
