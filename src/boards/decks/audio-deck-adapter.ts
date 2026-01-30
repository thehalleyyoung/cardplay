/**
 * @fileoverview Audio Deck Adapter
 * 
 * Wraps DeckLayoutAdapter for use within the board system.
 * Provides audio routing endpoints for mixer and routing decks.
 * 
 * E014-E016: Audio/runtime backing for mixer/routing decks.
 * 
 * @module @cardplay/boards/decks/audio-deck-adapter
 */

import { DeckLayoutAdapter, type DeckState, asSlotGridDeckId } from '../../ui/deck-layout';
import type { ActiveContext } from '../context/types';
import type { BoardDeck } from '../types';

// ============================================================================
// AUDIO DECK ADAPTER
// ============================================================================

/**
 * Adapts DeckLayoutAdapter for use in the board system.
 * 
 * This adapter:
 * - Manages the lifecycle of DeckLayoutAdapter instances
 * - Exposes audio routing endpoints (input/output nodes)
 * - Integrates with ActiveContext for stream/clip binding
 * - Provides a consistent interface for board deck factories
 * 
 * E014: DeckLayoutAdapter fits as audio/runtime backing for mixer/routing decks.
 */
export class AudioDeckAdapter {
  private adapter: DeckLayoutAdapter;

  constructor(
    deckDef: BoardDeck,
    _activeContext: ActiveContext,
    options: {
      rows?: number;
      cols?: number;
      audioContext?: AudioContext;
    } = {}
  ) {
    // Convert board deck ID to DeckId
    const deckId = asSlotGridDeckId(deckDef.id);

    // Initialize underlying DeckLayoutAdapter
    const adapterOptions: {
      name?: string;
      rows?: number;
      cols?: number;
      audioContext?: AudioContext;
    } = {
      name: deckDef.id,
      rows: options.rows ?? 4,
      cols: options.cols ?? 4,
    };

    if (options.audioContext) {
      adapterOptions.audioContext = options.audioContext;
    }

    this.adapter = new DeckLayoutAdapter(deckId, adapterOptions);

    // Note: ActiveContext integration happens via the deck factories
    // that use this adapter. The adapter itself doesn't directly bind
    // to activeStreamId/activeClipId to avoid coupling.
  }

  // ==========================================================================
  // STATE ACCESS
  // ==========================================================================

  /**
   * Gets the current deck state.
   */
  getState(): DeckState {
    return this.adapter.getState();
  }

  /**
   * Subscribes to deck state changes.
   */
  subscribe(callback: (state: DeckState) => void): () => void {
    return this.adapter.subscribe(callback);
  }

  // ==========================================================================
  // AUDIO ROUTING (E016)
  // ==========================================================================

  /**
   * Gets the audio input node for this deck.
   * 
   * E016: Expose getInputNode() for routing overlay.
   * 
   * @returns Input gain node, or null if audio is not initialized
   */
  getInputNode(): GainNode | null {
    const chain = this.adapter.getAudioChain();
    return chain.inputGain;
  }

  /**
   * Gets the audio output node for this deck.
   * 
   * E016: Expose getOutputNode() for routing overlay.
   * 
   * @returns Output gain node, or null if audio is not initialized
   */
  getOutputNode(): GainNode | null {
    const chain = this.adapter.getAudioChain();
    return chain.outputGain;
  }

  /**
   * Gets the analyser node for this deck (for meters).
   * 
   * @returns Analyser node, or null if audio is not initialized
   */
  getAnalyserNode(): AnalyserNode | null {
    const chain = this.adapter.getAudioChain();
    return chain.analyzer;
  }

  /**
   * Gets the stereo panner node for this deck.
   * 
   * @returns Panner node, or null if audio is not initialized
   */
  getPannerNode(): StereoPannerNode | null {
    const chain = this.adapter.getAudioChain();
    return chain.panner;
  }

  // ==========================================================================
  // DECK OPERATIONS
  // ==========================================================================

  /**
   * Sets the deck volume.
   */
  setVolume(volume: number): void {
    this.adapter.setVolume(volume);
  }

  /**
   * Sets the deck pan.
   */
  setPan(pan: number): void {
    this.adapter.setPan(pan);
  }

  /**
   * Mutes the deck.
   */
  setMuted(muted: boolean): void {
    this.adapter.setMute(muted);
  }

  /**
   * Solos the deck.
   */
  setSoloed(soloed: boolean): void {
    this.adapter.setSolo(soloed);
  }

  /**
   * Arms the deck for recording.
   */
  setArmed(armed: boolean): void {
    this.adapter.setArmed(armed);
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  /**
   * Disposes the adapter and releases resources.
   */
  dispose(): void {
    this.adapter.dispose();
  }
}

// ============================================================================
// FACTORY HELPER
// ============================================================================

/**
 * Creates an AudioDeckAdapter for use in deck factories.
 * 
 * E015: Wrapping DeckLayoutAdapter for board use.
 * 
 * @example
 * ```ts
 * // In mixer-deck-factory.ts:
 * const adapter = createAudioDeckAdapter(deckDef, activeContext, {
 *   audioContext: getAudioContext(),
 * });
 * 
 * // Access audio nodes for routing:
 * const inputNode = adapter.getInputNode();
 * const outputNode = adapter.getOutputNode();
 * ```
 */
export function createAudioDeckAdapter(
  deckDef: BoardDeck,
  activeContext: ActiveContext,
  options: {
    rows?: number;
    cols?: number;
    audioContext?: AudioContext;
  } = {}
): AudioDeckAdapter {
  return new AudioDeckAdapter(deckDef, activeContext, options);
}
