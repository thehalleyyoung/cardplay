/**
 * @fileoverview Deck Drop Validation.
 * 
 * Validates whether cards can be dropped into specific decks
 * based on deck type constraints and board gating rules.
 * 
 * @module @cardplay/boards/gating/validate-deck-drop
 */

import type { Board, DeckType } from '../types';
import type { CardMeta } from '../../cards/card';
import { isCardAllowed } from './is-card-allowed';
import { whyNotAllowed } from './why-not';
import { classifyCard } from './card-kinds';

/**
 * Result of deck drop validation.
 */
export interface DeckDropValidation {
  /** Whether the drop is allowed */
  allowed: boolean;
  /** Reason if not allowed */
  reason?: string;
}

/**
 * Validates whether a card can be dropped into a deck.
 * 
 * @param board - The active board
 * @param deckType - The target deck type
 * @param cardMeta - The card being dropped
 * @returns Validation result
 * 
 * @example
 * ```ts
 * const board = getBoardRegistry().get('basic-tracker');
 * const validation = validateDeckDrop(board, 'dsp-chain', generatorMeta);
 * 
 * if (!validation.allowed) {
 *   showToast(validation.reason);
 * }
 * ```
 */
export function validateDeckDrop(
  board: Board,
  deckType: DeckType,
  cardMeta: CardMeta
): DeckDropValidation {
  // First check board-level gating
  if (!isCardAllowed(board, cardMeta)) {
    const reason = whyNotAllowed(board, cardMeta);
    return {
      allowed: false,
      reason: reason ?? 'This card is not allowed on this board',
    };
  }
  
  // Then check deck type constraints
  const deckConstraints = getDeckTypeConstraints(deckType);
  
  if (deckConstraints.allowedCategories) {
    if (!deckConstraints.allowedCategories.includes(cardMeta.category)) {
      return {
        allowed: false,
        reason: `${deckType} deck only accepts ${deckConstraints.allowedCategories.join(', ')} cards`,
      };
    }
  }
  
  if (deckConstraints.disallowedKinds) {
    const kinds = classifyCard(cardMeta);
    const hasDisallowed = kinds.some(kind =>
      deckConstraints.disallowedKinds!.includes(kind)
    );
    
    if (hasDisallowed) {
      return {
        allowed: false,
        reason: `${deckType} deck does not accept ${deckConstraints.disallowedKinds.join(', ')} cards`,
      };
    }
  }
  
  // Check for custom validators
  if (deckConstraints.customValidator) {
    const customResult = deckConstraints.customValidator(board, cardMeta);
    if (!customResult.allowed) {
      return customResult;
    }
  }
  
  return { allowed: true };
}

/**
 * Deck type constraints.
 */
interface DeckTypeConstraints {
  /** Allowed card categories (e.g., effects only) */
  allowedCategories?: string[];
  /** Disallowed card kinds (e.g., no generative) */
  disallowedKinds?: string[];
  /** Custom validation function */
  customValidator?: (board: Board, cardMeta: CardMeta) => DeckDropValidation;
}

/**
 * Gets constraints for a deck type.
 */
function getDeckTypeConstraints(deckType: DeckType): DeckTypeConstraints {
  const constraints: Record<string, DeckTypeConstraints> = {
    'effects-deck': {
      allowedCategories: ['effects'],
      disallowedKinds: ['generative'],
    },
    'mixer-deck': {
      // No cards can be dropped into mixer
      customValidator: () => ({
        allowed: false,
        reason: 'Mixer deck does not accept card drops',
      }),
    },
    'properties-deck': {
      // No cards can be dropped into properties inspector
      customValidator: () => ({
        allowed: false,
        reason: 'Properties deck does not accept card drops',
      }),
    },
    'pattern-deck': {
      // Pattern editor accepts manual instruments only
      allowedCategories: ['generators'],
      disallowedKinds: ['generative', 'collaborative'],
    },
    'instruments-deck': {
      // Browser is read-only
      customValidator: () => ({
        allowed: false,
        reason: 'Browser is read-only; drag cards from here, not into it',
      }),
    },
    'phrases-deck': {
      // Phrase library is read-only
      customValidator: () => ({
        allowed: false,
        reason: 'Phrase library is read-only; drag phrases from here, not into it',
      }),
    },
    'samples-deck': {
      // Sample browser is read-only
      customValidator: () => ({
        allowed: false,
        reason: 'Sample browser is read-only; drag samples from here, not into it',
      }),
    },
  };
  
  return constraints[deckType] ?? {};
}

/**
 * Validates multiple drops at once (batch validation).
 * 
 * @param board - The active board
 * @param deckType - The target deck type
 * @param cardMetas - Array of cards being dropped
 * @returns Array of validation results
 * 
 * @example
 * ```ts
 * const results = validateDeckDropBatch(board, 'dsp-chain', [
 *   reverbMeta,
 *   delayMeta,
 *   generatorMeta
 * ]);
 * 
 * const allowed = results.filter(r => r.allowed);
 * const denied = results.filter(r => !r.allowed);
 * ```
 */
export function validateDeckDropBatch(
  board: Board,
  deckType: DeckType,
  cardMetas: CardMeta[]
): DeckDropValidation[] {
  return cardMetas.map(meta => validateDeckDrop(board, deckType, meta));
}

/**
 * Gets a human-readable summary of deck constraints.
 * 
 * @param deckType - The deck type
 * @returns Description of what the deck accepts
 * 
 * @example
 * ```ts
 * const summary = getDeckConstraintsSummary('dsp-chain');
 * // "Accepts: effects cards only"
 * ```
 */
export function getDeckConstraintsSummary(deckType: DeckType): string {
  const constraints = getDeckTypeConstraints(deckType);
  
  if (constraints.customValidator) {
    // Try with a dummy card to get the message
    const dummyMeta: CardMeta = {
      id: 'dummy',
      name: 'Dummy',
      category: 'custom',
    };
    const result = constraints.customValidator(
      { id: 'dummy' } as Board,
      dummyMeta
    );
    return result.reason ?? 'Custom constraints apply';
  }
  
  const parts: string[] = [];
  
  if (constraints.allowedCategories) {
    parts.push(`Accepts: ${constraints.allowedCategories.join(', ')} cards only`);
  }
  
  if (constraints.disallowedKinds) {
    parts.push(`Excludes: ${constraints.disallowedKinds.join(', ')} cards`);
  }
  
  if (parts.length === 0) {
    return 'Accepts: all card types';
  }
  
  return parts.join('; ');
}
