/**
 * @fileoverview Deck Audio Routing ↔ RoutingGraphStore Bridge.
 * 
 * Connects the deck audio routing system (DJ-style decks) to
 * the unified RoutingGraphStore for audio graph management.
 * 
 * Key responsibilities:
 * - Sync deck audio nodes with routing graph
 * - Manage deck-to-mixer connections
 * - Handle crossfader and cue routing
 * - Support deck effects chains
 * - Integrate with transport for deck sync
 * 
 * @module @cardplay/audio/deck-routing-store-bridge
 */

import type { Tick } from '../types/primitives';
import { asTick } from '../types/primitives';
import type { EventStreamId, ClipId } from '../state/types';
import { getClipRegistry } from '../state';
import { getTransport, type TransportSnapshot } from './transport';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Audio node types for deck routing.
 */
export type DeckNodeType = 
  | 'deck'           // Main deck (audio source)
  | 'eq'             // EQ (3-band or more)
  | 'filter'         // Filter (lowpass/highpass/bandpass)
  | 'effect'         // Generic effect
  | 'gain'           // Volume/gain control
  | 'meter'          // Level meter
  | 'crossfader'     // Crossfader
  | 'mixer'          // Main mixer
  | 'master';        // Master output

/**
 * Audio routing node.
 */
export interface DeckRoutingNode {
  readonly id: string;
  readonly type: DeckNodeType;
  readonly name: string;
  readonly deckId?: string;          // Associated deck
  readonly parameters: Record<string, number>;
  readonly bypassed: boolean;
}

/**
 * Audio routing connection.
 */
export interface DeckRoutingConnection {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly sourceOutput: number;
  readonly targetNodeId: string;
  readonly targetInput: number;
}

/**
 * Deck state.
 */
export interface DeckState {
  readonly id: string;
  readonly name: string;
  readonly clipId: ClipId | null;
  readonly streamId: EventStreamId | null;
  readonly isPlaying: boolean;
  readonly position: Tick;           // Current playhead position
  readonly tempo: number;            // Deck tempo (BPM)
  readonly pitch: number;            // Pitch adjustment (-1 to 1)
  readonly volume: number;           // Volume (0 to 1)
  readonly cued: boolean;            // Is in cue/monitor
  readonly crossfaderSide: 'A' | 'B' | 'none';
  readonly syncEnabled: boolean;     // Tempo sync to master
}

/**
 * Mixer state.
 */
export interface MixerState {
  readonly crossfader: number;       // -1 (A) to 1 (B)
  readonly masterVolume: number;
  readonly cueVolume: number;
  readonly cueMix: number;           // Mix ratio of cue to master in headphones
}

/**
 * Full deck routing state.
 */
export interface DeckRoutingState {
  readonly decks: ReadonlyMap<string, DeckState>;
  readonly nodes: ReadonlyMap<string, DeckRoutingNode>;
  readonly connections: ReadonlyMap<string, DeckRoutingConnection>;
  readonly mixer: MixerState;
  readonly masterTempo: number;
}

/**
 * Bridge configuration.
 */
export interface DeckRoutingBridgeConfig {
  readonly deckCount: number;
  readonly defaultTempo: number;
  readonly crossfaderCurve: 'linear' | 'constant' | 'smooth';
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_CONFIG: DeckRoutingBridgeConfig = {
  deckCount: 2,
  defaultTempo: 120,
  crossfaderCurve: 'smooth',
};

// ============================================================================
// DECK ROUTING STORE BRIDGE
// ============================================================================

/**
 * DeckRoutingStoreBridge - Connects deck audio to RoutingGraphStore.
 */
export class DeckRoutingStoreBridge {
  private config: DeckRoutingBridgeConfig;
  
  // Deck state
  private decks: Map<string, DeckState> = new Map();
  private deckNodes: Map<string, DeckRoutingNode> = new Map();
  private deckConnections: Map<string, DeckRoutingConnection> = new Map();
  
  // Mixer state
  private mixer: MixerState = {
    crossfader: 0,
    masterVolume: 1,
    cueVolume: 1,
    cueMix: 0.5,
  };
  
  private masterTempo = 120;
  
  // Subscriptions
  private transportSubscription: (() => void) | null = null;
  private subscribers: Set<(state: DeckRoutingState) => void> = new Set();
  
  // Playback tracking
  private deckPlaybackIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();
  
  constructor(config: Partial<DeckRoutingBridgeConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.masterTempo = this.config.defaultTempo;
  }
  
  // ========== INITIALIZATION ==========
  
  /**
   * Initialize the bridge.
   */
  initialize(): void {
    // Initialize decks
    for (let i = 0; i < this.config.deckCount; i++) {
      this.initializeDeck(i);
    }
    
    // Initialize mixer nodes
    this.initializeMixerNodes();
    
    // Subscribe to transport changes
    const transport = getTransport();
    this.transportSubscription = transport.subscribe((state) => {
      this.handleTransportChange(state);
    });
  }
  
  /**
   * Dispose the bridge.
   */
  dispose(): void {
    // Stop all deck playback intervals
    for (const interval of this.deckPlaybackIntervals.values()) {
      clearInterval(interval);
    }
    this.deckPlaybackIntervals.clear();
    
    if (this.transportSubscription) {
      this.transportSubscription();
      this.transportSubscription = null;
    }
    
    this.subscribers.clear();
  }
  
  private initializeDeck(index: number): void {
    const deckId = `deck-${index}`;
    const side: 'A' | 'B' = index === 0 ? 'A' : 'B';
    
    // Create deck state
    this.decks.set(deckId, {
      id: deckId,
      name: `Deck ${index + 1}`,
      clipId: null,
      streamId: null,
      isPlaying: false,
      position: asTick(0),
      tempo: this.config.defaultTempo,
      pitch: 0,
      volume: 1,
      cued: false,
      crossfaderSide: side,
      syncEnabled: false,
    });
    
    // Create deck audio nodes
    this.createDeckNodes(deckId);
  }
  
  private createDeckNodes(deckId: string): void {
    // Main deck node
    const deckNodeId = `${deckId}-source`;
    this.deckNodes.set(deckNodeId, {
      id: deckNodeId,
      type: 'deck',
      name: `${deckId} Source`,
      deckId,
      parameters: {},
      bypassed: false,
    });
    
    // EQ node
    const eqNodeId = `${deckId}-eq`;
    this.deckNodes.set(eqNodeId, {
      id: eqNodeId,
      type: 'eq',
      name: `${deckId} EQ`,
      deckId,
      parameters: {
        low: 0,
        mid: 0,
        high: 0,
      },
      bypassed: false,
    });
    
    // Filter node
    const filterNodeId = `${deckId}-filter`;
    this.deckNodes.set(filterNodeId, {
      id: filterNodeId,
      type: 'filter',
      name: `${deckId} Filter`,
      deckId,
      parameters: {
        frequency: 1000,
        resonance: 0.5,
        type: 0,  // 0=off, 1=lowpass, 2=highpass
      },
      bypassed: true,
    });
    
    // Gain node
    const gainNodeId = `${deckId}-gain`;
    this.deckNodes.set(gainNodeId, {
      id: gainNodeId,
      type: 'gain',
      name: `${deckId} Gain`,
      deckId,
      parameters: {
        gain: 1,
      },
      bypassed: false,
    });
    
    // Create connections: deck -> eq -> filter -> gain
    this.deckConnections.set(`${deckId}-conn-1`, {
      id: `${deckId}-conn-1`,
      sourceNodeId: deckNodeId,
      sourceOutput: 0,
      targetNodeId: eqNodeId,
      targetInput: 0,
    });
    
    this.deckConnections.set(`${deckId}-conn-2`, {
      id: `${deckId}-conn-2`,
      sourceNodeId: eqNodeId,
      sourceOutput: 0,
      targetNodeId: filterNodeId,
      targetInput: 0,
    });
    
    this.deckConnections.set(`${deckId}-conn-3`, {
      id: `${deckId}-conn-3`,
      sourceNodeId: filterNodeId,
      sourceOutput: 0,
      targetNodeId: gainNodeId,
      targetInput: 0,
    });
  }
  
  private initializeMixerNodes(): void {
    // Crossfader node
    this.deckNodes.set('crossfader', {
      id: 'crossfader',
      type: 'crossfader',
      name: 'Crossfader',
      parameters: {
        position: 0,  // -1 to 1
        curve: 1,     // Curve type
      },
      bypassed: false,
    });
    
    // Master mixer
    this.deckNodes.set('mixer', {
      id: 'mixer',
      type: 'mixer',
      name: 'Mixer',
      parameters: {
        channels: this.config.deckCount,
      },
      bypassed: false,
    });
    
    // Master output
    this.deckNodes.set('master', {
      id: 'master',
      type: 'master',
      name: 'Master Output',
      parameters: {
        volume: 1,
      },
      bypassed: false,
    });
    
    // Connect decks to crossfader/mixer
    for (let i = 0; i < this.config.deckCount; i++) {
      const deckId = `deck-${i}`;
      const gainNodeId = `${deckId}-gain`;
      
      this.deckConnections.set(`${deckId}-to-mixer`, {
        id: `${deckId}-to-mixer`,
        sourceNodeId: gainNodeId,
        sourceOutput: 0,
        targetNodeId: 'crossfader',
        targetInput: i,
      });
    }
    
    // Crossfader to mixer to master
    this.deckConnections.set('crossfader-to-mixer', {
      id: 'crossfader-to-mixer',
      sourceNodeId: 'crossfader',
      sourceOutput: 0,
      targetNodeId: 'mixer',
      targetInput: 0,
    });
    
    this.deckConnections.set('mixer-to-master', {
      id: 'mixer-to-master',
      sourceNodeId: 'mixer',
      sourceOutput: 0,
      targetNodeId: 'master',
      targetInput: 0,
    });
  }
  
  // ========== DECK OPERATIONS ==========
  
  /**
   * Load a clip into a deck.
   */
  loadClip(deckId: string, clipId: ClipId): void {
    const deck = this.decks.get(deckId);
    if (!deck) return;
    
    const clip = getClipRegistry().getClip(clipId);
    if (!clip) return;
    
    this.decks.set(deckId, {
      ...deck,
      clipId,
      streamId: clip.streamId,
      position: asTick(0),
      isPlaying: false,
    });
    
    this.notifySubscribers();
  }
  
  /**
   * Eject clip from a deck.
   */
  ejectClip(deckId: string): void {
    const deck = this.decks.get(deckId);
    if (!deck) return;
    
    // Stop if playing
    if (deck.isPlaying) {
      this.stopDeck(deckId);
    }
    
    this.decks.set(deckId, {
      ...deck,
      clipId: null,
      streamId: null,
      position: asTick(0),
    });
    
    this.notifySubscribers();
  }
  
  /**
   * Start deck playback.
   */
  playDeck(deckId: string): void {
    const deck = this.decks.get(deckId);
    if (!deck || !deck.clipId) return;
    
    this.decks.set(deckId, {
      ...deck,
      isPlaying: true,
    });
    
    // Start position tracking
    this.startDeckPlaybackTracking(deckId);
    
    this.notifySubscribers();
  }
  
  /**
   * Stop deck playback.
   */
  stopDeck(deckId: string): void {
    const deck = this.decks.get(deckId);
    if (!deck) return;
    
    this.stopDeckPlaybackTracking(deckId);
    
    this.decks.set(deckId, {
      ...deck,
      isPlaying: false,
    });
    
    this.notifySubscribers();
  }
  
  /**
   * Cue/pause deck.
   */
  cueDeck(deckId: string): void {
    const deck = this.decks.get(deckId);
    if (!deck) return;
    
    this.stopDeckPlaybackTracking(deckId);
    
    this.decks.set(deckId, {
      ...deck,
      isPlaying: false,
      cued: true,
    });
    
    this.notifySubscribers();
  }
  
  /**
   * Seek deck to position.
   */
  seekDeck(deckId: string, position: Tick): void {
    const deck = this.decks.get(deckId);
    if (!deck) return;
    
    this.decks.set(deckId, {
      ...deck,
      position,
    });
    
    this.notifySubscribers();
  }
  
  /**
   * Set deck tempo.
   */
  setDeckTempo(deckId: string, tempo: number): void {
    const deck = this.decks.get(deckId);
    if (!deck) return;
    
    this.decks.set(deckId, {
      ...deck,
      tempo: Math.max(60, Math.min(180, tempo)),
    });
    
    this.notifySubscribers();
  }
  
  /**
   * Set deck pitch adjustment.
   */
  setDeckPitch(deckId: string, pitch: number): void {
    const deck = this.decks.get(deckId);
    if (!deck) return;
    
    this.decks.set(deckId, {
      ...deck,
      pitch: Math.max(-1, Math.min(1, pitch)),
    });
    
    this.notifySubscribers();
  }
  
  /**
   * Set deck volume.
   */
  setDeckVolume(deckId: string, volume: number): void {
    const deck = this.decks.get(deckId);
    if (!deck) return;
    
    this.decks.set(deckId, {
      ...deck,
      volume: Math.max(0, Math.min(1, volume)),
    });
    
    // Update gain node
    const gainNodeId = `${deckId}-gain`;
    const gainNode = this.deckNodes.get(gainNodeId);
    if (gainNode) {
      this.deckNodes.set(gainNodeId, {
        ...gainNode,
        parameters: { ...gainNode.parameters, gain: volume },
      });
    }
    
    this.notifySubscribers();
  }
  
  /**
   * Enable/disable tempo sync.
   */
  setDeckSync(deckId: string, enabled: boolean): void {
    const deck = this.decks.get(deckId);
    if (!deck) return;
    
    this.decks.set(deckId, {
      ...deck,
      syncEnabled: enabled,
      tempo: enabled ? this.masterTempo : deck.tempo,
    });
    
    this.notifySubscribers();
  }
  
  // ========== MIXER OPERATIONS ==========
  
  /**
   * Set crossfader position.
   */
  setCrossfader(position: number): void {
    this.mixer = {
      ...this.mixer,
      crossfader: Math.max(-1, Math.min(1, position)),
    };
    
    // Update crossfader node
    const crossfaderNode = this.deckNodes.get('crossfader');
    if (crossfaderNode) {
      this.deckNodes.set('crossfader', {
        ...crossfaderNode,
        parameters: { ...crossfaderNode.parameters, position },
      });
    }
    
    this.notifySubscribers();
  }
  
  /**
   * Set master volume.
   */
  setMasterVolume(volume: number): void {
    this.mixer = {
      ...this.mixer,
      masterVolume: Math.max(0, Math.min(1, volume)),
    };
    
    this.notifySubscribers();
  }
  
  /**
   * Set master tempo (for sync).
   */
  setMasterTempo(tempo: number): void {
    this.masterTempo = Math.max(60, Math.min(180, tempo));
    
    // Update synced decks
    for (const [deckId, deck] of this.decks) {
      if (deck.syncEnabled) {
        this.decks.set(deckId, { ...deck, tempo: this.masterTempo });
      }
    }
    
    this.notifySubscribers();
  }
  
  // ========== EQ/FILTER OPERATIONS ==========
  
  /**
   * Set deck EQ.
   */
  setDeckEQ(deckId: string, band: 'low' | 'mid' | 'high', value: number): void {
    const eqNodeId = `${deckId}-eq`;
    const eqNode = this.deckNodes.get(eqNodeId);
    if (!eqNode) return;
    
    this.deckNodes.set(eqNodeId, {
      ...eqNode,
      parameters: {
        ...eqNode.parameters,
        [band]: Math.max(-1, Math.min(1, value)),
      },
    });
    
    this.notifySubscribers();
  }
  
  /**
   * Set deck filter.
   */
  setDeckFilter(deckId: string, frequency: number, resonance: number, type: number): void {
    const filterNodeId = `${deckId}-filter`;
    const filterNode = this.deckNodes.get(filterNodeId);
    if (!filterNode) return;
    
    this.deckNodes.set(filterNodeId, {
      ...filterNode,
      parameters: { frequency, resonance, type },
      bypassed: type === 0,
    });
    
    this.notifySubscribers();
  }
  
  // ========== STATE ==========
  
  /**
   * Get the full routing state.
   */
  getState(): DeckRoutingState {
    return {
      decks: new Map(this.decks),
      nodes: new Map(this.deckNodes),
      connections: new Map(this.deckConnections),
      mixer: { ...this.mixer },
      masterTempo: this.masterTempo,
    };
  }
  
  /**
   * Get deck state.
   */
  getDeck(deckId: string): DeckState | null {
    return this.decks.get(deckId) ?? null;
  }
  
  /**
   * Subscribe to state changes.
   */
  subscribe(callback: (state: DeckRoutingState) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
  
  // ========== INTERNAL ==========
  
  private handleTransportChange(state: TransportSnapshot): void {
    // If master transport tempo changes, update synced decks
    if (state.isPlaying) {
      // Could sync deck playback to master transport if needed
    }
  }
  
  private startDeckPlaybackTracking(deckId: string): void {
    // Stop existing tracking
    this.stopDeckPlaybackTracking(deckId);
    
    const deck = this.decks.get(deckId);
    if (!deck) return;
    
    // Update position at regular intervals
    const intervalMs = 50;
    const ticksPerMs = (deck.tempo / 60 / 1000) * 480;  // Assuming 480 PPQ
    
    const interval = setInterval(() => {
      const currentDeck = this.decks.get(deckId);
      if (!currentDeck || !currentDeck.isPlaying) {
        this.stopDeckPlaybackTracking(deckId);
        return;
      }
      
      const newPosition = asTick(
        (currentDeck.position as number) + (ticksPerMs * intervalMs * (1 + currentDeck.pitch))
      );
      
      // Handle looping (would need clip length info)
      this.decks.set(deckId, {
        ...currentDeck,
        position: newPosition,
      });
      
      this.notifySubscribers();
    }, intervalMs);
    
    this.deckPlaybackIntervals.set(deckId, interval);
  }
  
  private stopDeckPlaybackTracking(deckId: string): void {
    const interval = this.deckPlaybackIntervals.get(deckId);
    if (interval) {
      clearInterval(interval);
      this.deckPlaybackIntervals.delete(deckId);
    }
  }
  
  private notifySubscribers(): void {
    const state = this.getState();
    for (const callback of this.subscribers) {
      callback(state);
    }
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let bridgeInstance: DeckRoutingStoreBridge | null = null;

/**
 * Get or create the singleton deck routing bridge.
 */
export function getDeckRoutingBridge(config?: Partial<DeckRoutingBridgeConfig>): DeckRoutingStoreBridge {
  if (!bridgeInstance) {
    bridgeInstance = new DeckRoutingStoreBridge(config);
    bridgeInstance.initialize();
  }
  return bridgeInstance;
}

/**
 * Reset the bridge (for testing).
 */
export function resetDeckRoutingBridge(): void {
  if (bridgeInstance) {
    bridgeInstance.dispose();
    bridgeInstance = null;
  }
}
