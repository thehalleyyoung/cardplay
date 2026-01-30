/**
 * Card Filtering by Control Level
 * 
 * Provides utilities to filter cards based on ControlLevel,
 * enabling deck factories and boards to show appropriate cards.
 * 
 * @module cards/card-filtering
 */

import type { CardCategory, CardMeta } from './card';
import type { CardKind, ControlLevel } from '../canon/card-kind';
import { isCardKindAllowed } from '../canon/card-kind';

/**
 * Maps CardCategory to CardKind for control level filtering.
 * 
 * Note: This is a best-effort mapping since categories and kinds
 * don't align perfectly. Cards can specify a `kind` tag to override.
 */
export function categoryToKind(category: CardCategory): CardKind {
  switch (category) {
    case 'generators':
      return 'generator';
    case 'effects':
      return 'effect';
    case 'transforms':
      return 'processor';
    case 'filters':
      return 'processor';
    case 'routing':
      return 'utility';
    case 'analysis':
      return 'utility';
    case 'utilities':
      return 'utility';
    case 'custom':
      return 'utility'; // Safe default for custom
    default:
      return 'utility'; // Safe default
  }
}

/**
 * Extracts CardKind from card metadata.
 * 
 * Checks for explicit 'kind:X' tag first, otherwise maps from category.
 */
export function getCardKind(meta: CardMeta): CardKind {
  // Check for explicit kind tag
  const kindTag = meta.tags?.find(tag => tag.startsWith('kind:'));
  if (kindTag) {
    const kind = kindTag.slice(5) as CardKind;
    return kind;
  }
  
  // Map from category
  return categoryToKind(meta.category);
}

/**
 * Checks if a card is allowed at a given control level.
 */
export function isCardAllowed(meta: CardMeta, level: ControlLevel): boolean {
  const kind = getCardKind(meta);
  return isCardKindAllowed(kind, level);
}

/**
 * Filters an array of cards by control level.
 * 
 * @param cards - Array of card metadata
 * @param level - Control level to filter by
 * @returns Filtered array containing only allowed cards
 */
export function filterCardsByLevel<T extends { meta: CardMeta }>(
  cards: readonly T[],
  level: ControlLevel
): T[] {
  return cards.filter(card => isCardAllowed(card.meta, level));
}

/**
 * Filters an array of card metadata by control level.
 */
export function filterCardMetaByLevel(
  cards: readonly CardMeta[],
  level: ControlLevel
): CardMeta[] {
  return cards.filter(meta => isCardAllowed(meta, level));
}

/**
 * Gets the cards visible in a card browser/palette for a given control level.
 * 
 * This can be used by deck factories to populate available cards.
 * 
 * @param allCards - All registered cards
 * @param level - Current control level
 * @param additionalFilter - Optional additional filter function
 * @returns Cards visible at this control level
 */
export function getVisibleCards<T extends { meta: CardMeta }>(
  allCards: readonly T[],
  level: ControlLevel,
  additionalFilter?: (card: T) => boolean
): T[] {
  let visible = filterCardsByLevel(allCards, level);
  
  if (additionalFilter) {
    visible = visible.filter(additionalFilter);
  }
  
  return visible;
}
