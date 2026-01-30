/**
 * @fileoverview Instrument Card Adapter for Board Gating.
 * 
 * Maps instrument cards from audio/instrument-cards.ts to CardMeta-like
 * records for consistent gating behavior.
 * 
 * @module @cardplay/boards/gating/instrument-card-adapter
 */

import type { CardMeta } from '../../cards/card';
import type { AudioModuleCategory } from '../../audio/instrument-cards';
import { type BoardCardKind } from './card-kinds';

/**
 * Maps instrument card category to CardMeta category.
 */
function mapInstrumentCategory(category: AudioModuleCategory): CardMeta['category'] {
  switch (category) {
    case 'sampler':
    case 'wavetable':
    case 'hybrid':
      return 'generators';
    case 'effect':
      return 'effects';
    case 'midi':
    case 'utility':
      return 'utilities';
    default:
      return 'custom';
  }
}

/**
 * Determines board card kind for an instrument card.
 * 
 * Instrument cards are always manual (user plays them).
 * Effect cards are also manual (user applies them).
 * MIDI/utility cards are manual helpers.
 */
export function getInstrumentCardKind(_category: AudioModuleCategory): BoardCardKind {
  // All instrument cards are manual control
  return 'manual';
}

/**
 * Converts an instrument card to CardMeta-like record.
 * 
 * @param id - Instrument card ID
 * @param name - Instrument card name
 * @param category - Instrument card category
 * @returns CardMeta-compatible record
 * 
 * @example
 * ```ts
 * const meta = instrumentToCardMeta(
 *   'sampler-1',
 *   'Sample Player',
 *   'sampler'
 * );
 * 
 * // Use with gating
 * const allowed = isCardAllowed(board, meta);
 * ```
 */
export function instrumentToCardMeta(
  id: string,
  name: string,
  category: AudioModuleCategory,
  description?: string,
  tags?: readonly string[]
): CardMeta {
  const meta: CardMeta = {
    id,
    name,
    category: mapInstrumentCategory(category),
    tags: tags ?? [category, 'instrument', 'manual'],
  };
  
  if (description !== undefined) {
    (meta as { description: string }).description = description;
  }
  
  return meta;
}

/**
 * Determines if an instrument card is allowed on a board.
 * 
 * Since all instruments are manual, this checks if manual cards
 * are allowed by the board's control level.
 * 
 * @param board - The board to check
 * @param category - Instrument card category
 * @returns True if instruments are allowed
 * 
 * @example
 * ```ts
 * const board = getBoardRegistry().get('basic-tracker');
 * const allowed = isInstrumentAllowed(board, 'sampler');
 * // true (manual instruments allowed)
 * 
 * const genBoard = getBoardRegistry().get('generative-ambient');
 * const stillAllowed = isInstrumentAllowed(genBoard, 'wavetable');
 * // true (manual instruments always allowed)
 * ```
 */
export function isInstrumentAllowed(
  _board: { controlLevel: string },
  _category: AudioModuleCategory
): boolean {
  // All instruments are manual, which is always allowed
  return true;
}

/**
 * Gets tags for an instrument card for search/filtering.
 * 
 * @param category - Instrument card category
 * @returns Array of tags
 * 
 * @example
 * ```ts
 * const tags = getInstrumentTags('sampler');
 * // ['sampler', 'instrument', 'manual', 'playable']
 * ```
 */
export function getInstrumentTags(category: AudioModuleCategory): string[] {
  const baseTags = [category, 'instrument', 'manual'];
  
  switch (category) {
    case 'sampler':
      return [...baseTags, 'playable', 'audio'];
    case 'wavetable':
      return [...baseTags, 'playable', 'synthesis'];
    case 'hybrid':
      return [...baseTags, 'playable', 'audio', 'synthesis'];
    case 'effect':
      return [category, 'effect', 'manual', 'processing'];
    case 'midi':
      return [category, 'midi', 'manual', 'utility'];
    case 'utility':
      return [category, 'utility', 'manual', 'helper'];
    default:
      return baseTags;
  }
}

/**
 * Creates CardMeta for a sampler instrument.
 */
export function createSamplerCardMeta(id: string, name: string): CardMeta {
  return instrumentToCardMeta(
    id,
    name,
    'sampler',
    'Sample-based instrument',
    getInstrumentTags('sampler')
  );
}

/**
 * Creates CardMeta for a wavetable instrument.
 */
export function createWavetableCardMeta(id: string, name: string): CardMeta {
  return instrumentToCardMeta(
    id,
    name,
    'wavetable',
    'Wavetable synthesis instrument',
    getInstrumentTags('wavetable')
  );
}

/**
 * Creates CardMeta for a hybrid instrument.
 */
export function createHybridCardMeta(id: string, name: string): CardMeta {
  return instrumentToCardMeta(
    id,
    name,
    'hybrid',
    'Hybrid sampler/synthesis instrument',
    getInstrumentTags('hybrid')
  );
}

/**
 * Creates CardMeta for an effect card.
 */
export function createEffectCardMeta(id: string, name: string): CardMeta {
  return instrumentToCardMeta(
    id,
    name,
    'effect',
    'Audio effect processor',
    getInstrumentTags('effect')
  );
}

/**
 * Creates CardMeta for a MIDI utility card.
 */
export function createMIDICardMeta(id: string, name: string): CardMeta {
  return instrumentToCardMeta(
    id,
    name,
    'midi',
    'MIDI processing utility',
    getInstrumentTags('midi')
  );
}

/**
 * Creates CardMeta for a utility card.
 */
export function createUtilityCardMeta(id: string, name: string): CardMeta {
  return instrumentToCardMeta(
    id,
    name,
    'utility',
    'General utility card',
    getInstrumentTags('utility')
  );
}
