/**
 * @fileoverview Deck Layout - Unified deck/slot visual and audio integration.
 * 
 * Decks are containers for cards. Each deck has:
 * - A slot grid for placing cards
 * - Routing to audio destinations
 * - Parameter lanes for automation
 * - Visual representation in both Session and Arrangement views
 * 
 * @module @cardplay/ui/deck-layout
 * @see INTEGRATION_FIXES_CHECKLIST.md Phase E.4, E.5
 */

import type {
  EventStreamId,
  RoutingNodeId,
} from '../state/types';
import {
  getSharedEventStore,
} from '../state';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Slot-grid deck identifier (branded type).
 * 
 * NOTE: This is distinct from BoardDeck.id (which is boards/types.ts:DeckId).
 * This identifier is used for the slot-grid runtime system (DeckLayoutAdapter).
 * 
 * Change 065: Renamed from DeckId to SlotGridDeckId to avoid confusion with BoardDeck.id
 */
export type SlotGridDeckId = string & { readonly __brand: 'SlotGridDeckId' };

export function asSlotGridDeckId(id: string): SlotGridDeckId {
  return id as SlotGridDeckId;
}

/**
 * Slot identifier within a deck.
 */
export type SlotId = string & { readonly __brand: 'SlotId' };

export function asSlotId(id: string): SlotId {
  return id as SlotId;
}

/**
 * Card instance in a slot.
 */
export interface CardSlot {
  readonly slotId: SlotId;
  readonly row: number;
  readonly col: number;
  readonly cardType: string; // Type of card
  readonly cardInstanceId: string; // Unique instance ID
  readonly parameters: Map<string, number>; // Current parameter values
  readonly inputConnections: readonly string[]; // Connections from other slots
  readonly outputConnections: readonly string[]; // Connections to other slots
  readonly muted: boolean;
  readonly bypassed: boolean;
}

/**
 * Deck state.
 */
export interface DeckState {
  readonly id: SlotGridDeckId;
  readonly name: string;
  readonly color?: string;
  /** Grid dimensions */
  readonly rows: number;
  readonly cols: number;
  /** Card slots */
  readonly slots: readonly CardSlot[];
  /** Output stream ID */
  readonly outputStreamId: EventStreamId;
  /** Audio output node ID */
  readonly audioOutputId: RoutingNodeId;
  /** Global parameters */
  readonly parameters: Map<string, number>;
  /** Whether deck is armed for recording */
  readonly armed: boolean;
  /** Whether deck is muted */
  readonly muted: boolean;
  /** Whether deck is soloed */
  readonly soloed: boolean;
  /** Deck volume (0-1) */
  readonly volume: number;
  /** Deck pan (-1 to 1) */
  readonly pan: number;
}

/**
 * Audio output chain for deck.
 */
export interface DeckAudioChain {
  readonly deckId: SlotGridDeckId;
  readonly inputGain: GainNode | null;
  readonly panner: StereoPannerNode | null;
  readonly outputGain: GainNode | null;
  readonly analyzer: AnalyserNode | null;
}

/**
 * Deck callback.
 */
export type DeckStateCallback = (state: DeckState) => void;

// ============================================================================
// DECK LAYOUT ADAPTER
// ============================================================================

/**
 * DeckLayoutAdapter manages a single deck's visual and audio state.
 */
export class DeckLayoutAdapter {
  private state: DeckState;
  private stateSubscriptions = new Set<DeckStateCallback>();
  private audioChain: DeckAudioChain;
  private audioContext: AudioContext | null = null;
  private disposed = false;

  constructor(
    id: SlotGridDeckId,
    options: {
      name?: string;
      color?: string;
      rows?: number;
      cols?: number;
      audioContext?: AudioContext;
    } = {}
  ) {
    const streamId = `deck-${id}` as EventStreamId;
    const audioOutputId = `deck-${id}-audio` as RoutingNodeId;

    const initialState: DeckState = {
      id,
      name: options.name ?? `Deck ${id}`,
      ...(options.color !== undefined && { color: options.color }),
      rows: options.rows ?? 4,
      cols: options.cols ?? 4,
      slots: [],
      outputStreamId: streamId,
      audioOutputId,
      parameters: new Map<string, number>(),
      armed: false,
      muted: false,
      soloed: false,
      volume: 1.0,
      pan: 0.0,
    };

    this.state = Object.freeze(initialState);

    // Initialize audio chain
    this.audioContext = options.audioContext ?? null;
    this.audioChain = {
      deckId: id,
      inputGain: null,
      panner: null,
      outputGain: null,
      analyzer: null,
    };

    if (this.audioContext) {
      this.initializeAudioChain();
    }

    // Create stream in store
    const store = getSharedEventStore();
    if (!store.getStream(streamId)) {
      store.createStream({
        id: streamId,
        name: this.state.name,
        events: [],
      });
    }

    // Routing graph integration is handled elsewhere; DeckLayoutAdapter currently
    // maintains connections locally via `inputConnections`/`outputConnections`.
  }

  // ==========================================================================
  // STATE ACCESS
  // ==========================================================================

  getState(): DeckState {
    return this.state;
  }

  getSlot(slotId: SlotId): CardSlot | undefined {
    return this.state.slots.find(s => s.slotId === slotId);
  }

  getSlotAt(row: number, col: number): CardSlot | undefined {
    return this.state.slots.find(s => s.row === row && s.col === col);
  }

  getAudioChain(): DeckAudioChain {
    return this.audioChain;
  }

  // ==========================================================================
  // SUBSCRIPTIONS
  // ==========================================================================

  subscribe(callback: DeckStateCallback): () => void {
    this.stateSubscriptions.add(callback);
    callback(this.state);

    return () => {
      this.stateSubscriptions.delete(callback);
    };
  }

  private notifyStateChange(): void {
    for (const callback of this.stateSubscriptions) {
      try {
        callback(this.state);
      } catch (e) {
        console.error('Deck state callback error:', e);
      }
    }
  }

  // ==========================================================================
  // SLOT OPERATIONS
  // ==========================================================================

  /**
   * Adds a card to a slot.
   */
  addCard(
    row: number,
    col: number,
    cardType: string,
    cardInstanceId: string,
    initialParams: Map<string, number> = new Map<string, number>()
  ): SlotId {
    // Check bounds
    if (row < 0 || row >= this.state.rows || col < 0 || col >= this.state.cols) {
      throw new Error(`Slot (${row}, ${col}) out of bounds`);
    }

    // Check if slot is occupied
    const existing = this.getSlotAt(row, col);
    if (existing) {
      throw new Error(`Slot (${row}, ${col}) already occupied`);
    }

    const slotId = asSlotId(`${this.state.id}-${row}-${col}`);
    const slot: CardSlot = {
      slotId,
      row,
      col,
      cardType,
      cardInstanceId,
      parameters: initialParams,
      inputConnections: [],
      outputConnections: [],
      muted: false,
      bypassed: false,
    };

    this.state = Object.freeze({
      ...this.state,
      slots: [...this.state.slots, slot],
    });

    this.notifyStateChange();
    return slotId;
  }

  /**
   * Removes a card from a slot.
   */
  removeCard(slotId: SlotId): void {
    const slot = this.getSlot(slotId);
    if (!slot) return;

    this.state = Object.freeze({
      ...this.state,
      slots: this.state.slots.filter(s => s.slotId !== slotId),
    });

    this.notifyStateChange();
  }

  /**
   * Moves a card to a new slot.
   */
  moveCard(slotId: SlotId, toRow: number, toCol: number): void {
    const slot = this.getSlot(slotId);
    if (!slot) return;

    // Check bounds
    if (toRow < 0 || toRow >= this.state.rows || toCol < 0 || toCol >= this.state.cols) {
      throw new Error(`Slot (${toRow}, ${toCol}) out of bounds`);
    }

    // Check if destination is occupied
    const existing = this.getSlotAt(toRow, toCol);
    if (existing && existing.slotId !== slotId) {
      throw new Error(`Slot (${toRow}, ${toCol}) already occupied`);
    }

    const newSlotId = asSlotId(`${this.state.id}-${toRow}-${toCol}`);

    this.state = Object.freeze({
      ...this.state,
      slots: this.state.slots.map(s =>
        s.slotId === slotId
          ? { ...s, slotId: newSlotId, row: toRow, col: toCol }
          : s
      ),
    });

    this.notifyStateChange();
  }

  /**
   * Sets a card parameter.
   */
  setCardParameter(slotId: SlotId, paramName: string, value: number): void {
    const slot = this.getSlot(slotId);
    if (!slot) return;

    const newParams = new Map(slot.parameters);
    newParams.set(paramName, value);

    this.state = Object.freeze({
      ...this.state,
      slots: this.state.slots.map(s =>
        s.slotId === slotId
          ? { ...s, parameters: newParams }
          : s
      ),
    });

    this.notifyStateChange();
  }

  /**
   * Mutes/unmutes a card.
   */
  setCardMute(slotId: SlotId, muted: boolean): void {
    this.state = Object.freeze({
      ...this.state,
      slots: this.state.slots.map(s =>
        s.slotId === slotId
          ? { ...s, muted }
          : s
      ),
    });

    this.notifyStateChange();
  }

  /**
   * Bypasses a card.
   */
  setCardBypass(slotId: SlotId, bypassed: boolean): void {
    this.state = Object.freeze({
      ...this.state,
      slots: this.state.slots.map(s =>
        s.slotId === slotId
          ? { ...s, bypassed }
          : s
      ),
    });

    this.notifyStateChange();
  }

  // ==========================================================================
  // CONNECTION OPERATIONS
  // ==========================================================================

  /**
   * Connects two slots.
   */
  connectSlots(fromSlotId: SlotId, toSlotId: SlotId): void {
    const fromSlot = this.getSlot(fromSlotId);
    const toSlot = this.getSlot(toSlotId);
    if (!fromSlot || !toSlot) return;

    // Update connections in state
    this.state = Object.freeze({
      ...this.state,
      slots: this.state.slots.map(s => {
        if (s.slotId === fromSlotId) {
          return {
            ...s,
            outputConnections: [...s.outputConnections, toSlotId],
          };
        }
        if (s.slotId === toSlotId) {
          return {
            ...s,
            inputConnections: [...s.inputConnections, fromSlotId],
          };
        }
        return s;
      }),
    });

    this.notifyStateChange();
  }

  /**
   * Disconnects two slots.
   */
  disconnectSlots(fromSlotId: SlotId, toSlotId: SlotId): void {
    const fromSlot = this.getSlot(fromSlotId);
    const toSlot = this.getSlot(toSlotId);
    if (!fromSlot || !toSlot) return;

    // Update connections in state
    this.state = Object.freeze({
      ...this.state,
      slots: this.state.slots.map(s => {
        if (s.slotId === fromSlotId) {
          return {
            ...s,
            outputConnections: s.outputConnections.filter(c => c !== toSlotId),
          };
        }
        if (s.slotId === toSlotId) {
          return {
            ...s,
            inputConnections: s.inputConnections.filter(c => c !== fromSlotId),
          };
        }
        return s;
      }),
    });

    this.notifyStateChange();
  }

  /**
   * Connects a slot to the deck output.
   */
  connectToDeckOutput(slotId: SlotId): void {
    this.state = Object.freeze({
      ...this.state,
      slots: this.state.slots.map(s =>
        s.slotId === slotId
          ? { ...s, outputConnections: [...s.outputConnections, this.state.audioOutputId as unknown as string] }
          : s
      ),
    });
    this.notifyStateChange();
  }

  // ==========================================================================
  // DECK OPERATIONS
  // ==========================================================================

  /**
   * Sets deck volume.
   */
  setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));

    this.state = Object.freeze({
      ...this.state,
      volume: clampedVolume,
    });

    if (this.audioChain.outputGain) {
      this.audioChain.outputGain.gain.value = clampedVolume;
    }

    this.notifyStateChange();
  }

  /**
   * Sets deck pan.
   */
  setPan(pan: number): void {
    const clampedPan = Math.max(-1, Math.min(1, pan));

    this.state = Object.freeze({
      ...this.state,
      pan: clampedPan,
    });

    if (this.audioChain.panner) {
      this.audioChain.panner.pan.value = clampedPan;
    }

    this.notifyStateChange();
  }

  /**
   * Sets deck mute.
   */
  setMute(muted: boolean): void {
    this.state = Object.freeze({
      ...this.state,
      muted,
    });

    if (this.audioChain.inputGain) {
      this.audioChain.inputGain.gain.value = muted ? 0 : 1;
    }

    this.notifyStateChange();
  }

  /**
   * Sets deck solo.
   */
  setSolo(soloed: boolean): void {
    this.state = Object.freeze({
      ...this.state,
      soloed,
    });

    this.notifyStateChange();
  }

  /**
   * Sets deck armed.
   */
  setArmed(armed: boolean): void {
    this.state = Object.freeze({
      ...this.state,
      armed,
    });

    this.notifyStateChange();
  }

  // ==========================================================================
  // AUDIO CHAIN
  // ==========================================================================

  private initializeAudioChain(): void {
    if (!this.audioContext) return;

    // Create audio nodes
    const inputGain = this.audioContext.createGain();
    const panner = this.audioContext.createStereoPanner();
    const outputGain = this.audioContext.createGain();
    const analyzer = this.audioContext.createAnalyser();

    // Configure
    inputGain.gain.value = this.state.muted ? 0 : 1;
    panner.pan.value = this.state.pan;
    outputGain.gain.value = this.state.volume;
    analyzer.fftSize = 256;

    // Connect chain
    inputGain.connect(panner);
    panner.connect(outputGain);
    outputGain.connect(analyzer);
    analyzer.connect(this.audioContext.destination);

    this.audioChain = {
      deckId: this.state.id,
      inputGain,
      panner,
      outputGain,
      analyzer,
    };
  }

  /**
   * Sets audio context (for late initialization).
   */
  setAudioContext(audioContext: AudioContext): void {
    this.audioContext = audioContext;
    this.initializeAudioChain();
  }

  /**
   * Gets analyzer data.
   */
  getAnalyzerData(): Float32Array | null {
    if (!this.audioChain.analyzer) return null;

    const data = new Float32Array(this.audioChain.analyzer.frequencyBinCount);
    this.audioChain.analyzer.getFloatFrequencyData(data);
    return data;
  }

  /**
   * Gets input node for connections.
   */
  getInputNode(): AudioNode | null {
    return this.audioChain.inputGain;
  }

  /**
   * Gets output node for connections.
   */
  getOutputNode(): AudioNode | null {
    return this.audioChain.analyzer;
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    // Disconnect audio nodes
    if (this.audioChain.inputGain) {
      this.audioChain.inputGain.disconnect();
    }
    if (this.audioChain.panner) {
      this.audioChain.panner.disconnect();
    }
    if (this.audioChain.outputGain) {
      this.audioChain.outputGain.disconnect();
    }
    if (this.audioChain.analyzer) {
      this.audioChain.analyzer.disconnect();
    }

    this.stateSubscriptions.clear();
  }
}

// ============================================================================
// DECK REGISTRY
// ============================================================================

/**
 * Global registry of all decks.
 */
class DeckRegistry {
  private static instance: DeckRegistry;

  private decks = new Map<SlotGridDeckId, DeckLayoutAdapter>();
  private idCounter = 0;

  private constructor() {}

  static getInstance(): DeckRegistry {
    if (!DeckRegistry.instance) {
      DeckRegistry.instance = new DeckRegistry();
    }
    return DeckRegistry.instance;
  }

  /**
   * Creates a new deck.
   */
  createDeck(options?: {
    name?: string;
    color?: string;
    rows?: number;
    cols?: number;
    audioContext?: AudioContext;
  }): DeckLayoutAdapter {
    const id = asSlotGridDeckId(`deck-${++this.idCounter}`);
    const adapter = new DeckLayoutAdapter(id, options);
    this.decks.set(id, adapter);
    return adapter;
  }

  /**
   * Gets a deck by ID.
   */
  getDeck(id: SlotGridDeckId): DeckLayoutAdapter | undefined {
    return this.decks.get(id);
  }

  /**
   * Gets all decks.
   */
  getAllDecks(): readonly DeckLayoutAdapter[] {
    return Array.from(this.decks.values());
  }

  /**
   * Removes a deck.
   */
  removeDeck(id: SlotGridDeckId): void {
    const deck = this.decks.get(id);
    if (deck) {
      deck.dispose();
      this.decks.delete(id);
    }
  }

  /**
   * Gets deck containing a slot.
   */
  getDeckForSlot(slotId: SlotId): DeckLayoutAdapter | undefined {
    for (const deck of this.decks.values()) {
      if (deck.getSlot(slotId)) {
        return deck;
      }
    }
    return undefined;
  }

  /**
   * Processes solo across all decks.
   */
  processSolo(): void {
    const anySoloed = Array.from(this.decks.values()).some(d => d.getState().soloed);

    for (const deck of this.decks.values()) {
      const state = deck.getState();
      const audioChain = deck.getAudioChain();

      if (audioChain.inputGain) {
        if (anySoloed && !state.soloed) {
          // Mute non-soloed decks
          audioChain.inputGain.gain.value = 0;
        } else if (!state.muted) {
          // Un-mute if not manually muted
          audioChain.inputGain.gain.value = 1;
        }
      }
    }
  }

  /**
   * Clears all decks.
   */
  clear(): void {
    for (const deck of this.decks.values()) {
      deck.dispose();
    }
    this.decks.clear();
    this.idCounter = 0;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Gets the deck registry singleton.
 */
export function getDeckRegistry(): DeckRegistry {
  return DeckRegistry.getInstance();
}

/**
 * Creates a new deck.
 */
export function createDeck(options?: {
  name?: string;
  color?: string;
  rows?: number;
  cols?: number;
  audioContext?: AudioContext;
}): DeckLayoutAdapter {
  return getDeckRegistry().createDeck(options);
}
